'use strict';
require('dotenv').config();
const http = require('http');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool } = require('./src/db');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function cleanIsolatedTestCamps() {
  await pool.query('DROP TRIGGER IF EXISTS trg_test_copy_rollback');
  const [camps] = await pool.query('SELECT id FROM camps WHERE camp_year >= 2080');
  const ids = camps.map(c => c.id);
  if (ids.length > 0) {
    const ph = ids.map(() => '?').join(',');
    await pool.query(`DELETE FROM sponsors WHERE section_id IN (SELECT id FROM sponsor_sections WHERE camp_id IN (${ph}))`, ids);
    await pool.query(`DELETE FROM sponsor_sections WHERE camp_id IN (${ph})`, ids);
    await pool.query(`DELETE FROM team_members WHERE camp_id IN (${ph})`, ids);
    await pool.query(`DELETE FROM gallery_photos WHERE camp_id IN (${ph})`, ids);
    await pool.query(`DELETE FROM camp_page_visibility WHERE camp_id IN (${ph})`, ids);
    await pool.query(`DELETE FROM registration_counters WHERE camp_id IN (${ph})`, ids);
    await pool.query(`DELETE FROM media_assets WHERE camp_id IN (${ph})`, ids);
    await pool.query(`DELETE FROM camps WHERE id IN (${ph})`, ids);
  }
}

async function createIsolatedSourceCamp(superAdminId) {
  const [result] = await pool.query(
    `INSERT INTO camps (camp_year, internal_name, public_title, description, camp_date, starts_at, ends_at, venue, venue_subtitle, registration_open, media_folder, storage_state, created_by, updated_by)
     VALUES (2080, 'BDC 2080 Test Source', '2080 Source Campaign', 'Isolated test source', '2080-10-15', '09:00:00', '16:00:00', 'Test Hall A', 'Campus Zone 1', FALSE, 'BDC Camp 2080', 'READY', ?, ?)`,
    [superAdminId, superAdminId]
  );
  const srcCampId = result.insertId;

  // Insert test media assets
  const [teamAssetRes] = await pool.query(
    `INSERT INTO media_assets (camp_id, media_kind, relative_path, mime_type, byte_size, width_px, height_px, sha256, uploaded_by)
     VALUES (?, 'TEAM', 'team/test_source_lead.jpg', 'image/jpeg', 1024, 100, 100, UNHEX(SHA2('test_photo_lead', 256)), ?)`,
    [srcCampId, superAdminId]
  );
  const testPhotoAssetId = teamAssetRes.insertId;

  const [sponsorAssetRes] = await pool.query(
    `INSERT INTO media_assets (camp_id, media_kind, relative_path, mime_type, byte_size, width_px, height_px, sha256, uploaded_by)
     VALUES (?, 'SPONSOR', 'sponsors/test_source_sponsor.png', 'image/png', 2048, 200, 200, UNHEX(SHA2('test_logo_partner', 256)), ?)`,
    [srcCampId, superAdminId]
  );
  const testLogoAssetId = sponsorAssetRes.insertId;

  // Insert test page visibility
  await pool.query('INSERT INTO camp_page_visibility (camp_id, page_key, is_visible, updated_by) VALUES (?, "team", 1, ?)', [srcCampId, superAdminId]);
  await pool.query('INSERT INTO camp_page_visibility (camp_id, page_key, is_visible, updated_by) VALUES (?, "sponsors", 1, ?)', [srcCampId, superAdminId]);
  await pool.query('INSERT INTO camp_page_visibility (camp_id, page_key, is_visible, updated_by) VALUES (?, "gallery", 1, ?)', [srcCampId, superAdminId]);
  await pool.query('INSERT INTO camp_page_visibility (camp_id, page_key, is_visible, updated_by) VALUES (?, "registration", 0, ?)', [srcCampId, superAdminId]);

  // Insert 3 team members with deliberate sort_order, visibility, and asset ID
  await pool.query(
    `INSERT INTO team_members (camp_id, group_key, full_name, role_label, phone, email, photo_asset_id, is_visible, sort_order, created_by, updated_by)
     VALUES (?, 'CHIEF_COORDINATOR', 'Source Chief', 'Chief Coordinator', '9876543210', 'chief@test.com', ?, 1, 1, ?, ?),
            (?, 'MEMBERS', 'Source Member 1', 'Member', '9876543211', 'm1@test.com', NULL, 1, 2, ?, ?),
            (?, 'MEMBERS', 'Source Member Hidden', 'Hidden Member', '9876543212', 'm2@test.com', NULL, 0, 3, ?, ?)`,
    [srcCampId, testPhotoAssetId, superAdminId, superAdminId, srcCampId, superAdminId, superAdminId, srcCampId, superAdminId, superAdminId]
  );

  // Insert 2 sponsor sections with deliberate sort_order and visibility
  const [sec1Res] = await pool.query(
    `INSERT INTO sponsor_sections (camp_id, heading, description, is_visible, sort_order, created_by, updated_by)
     VALUES (?, 'Title Sponsor Sec', 'Top partner', 1, 1, ?, ?)`,
    [srcCampId, superAdminId, superAdminId]
  );
  const sec1Id = sec1Res.insertId;

  const [sec2Res] = await pool.query(
    `INSERT INTO sponsor_sections (camp_id, heading, description, is_visible, sort_order, created_by, updated_by)
     VALUES (?, 'Supporting Sec Hidden', 'Hidden partner sec', 0, 2, ?, ?)`,
    [srcCampId, superAdminId, superAdminId]
  );
  const sec2Id = sec2Res.insertId;

  // Insert sponsors into sections with asset ID, visibility, sort_order
  const [spAlphaRes] = await pool.query(
    `INSERT INTO sponsors (section_id, name, logo_asset_id, website_url, is_visible, sort_order, created_by, updated_by)
     VALUES (?, 'Partner Alpha', ?, 'https://alpha.test', 1, 1, ?, ?)`,
    [sec1Id, testLogoAssetId, superAdminId, superAdminId]
  );
  const srcPartnerAlphaId = spAlphaRes.insertId;

  await pool.query(
    `INSERT INTO sponsors (section_id, name, logo_asset_id, website_url, is_visible, sort_order, created_by, updated_by)
     VALUES (?, 'Partner Beta Hidden', NULL, 'https://beta.test', 0, 2, ?, ?)`,
    [sec1Id, superAdminId, superAdminId]
  );

  await pool.query(
    `INSERT INTO sponsors (section_id, name, website_url, is_visible, sort_order, created_by, updated_by)
     VALUES (?, 'Partner Gamma', 'https://gamma.test', 1, 1, ?, ?)`,
    [sec2Id, superAdminId, superAdminId]
  );

  return { srcCampId, testPhotoAssetId, testLogoAssetId, srcPartnerAlphaId };
}

async function runTestSuite() {
  console.log('================================================================');
  console.log(' BDC COMPREHENSIVE REPRODUCIBLE VERIFICATION SUITE');
  console.log('================================================================\n');

  // 1. Authenticate as Super Admin
  const loginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'nss@skit.ac.in', password: 'Skit@12345' });

  if (loginRes.status !== 200 || !loginRes.data?.token) {
    throw new Error('Super Admin authentication failed: ' + JSON.stringify(loginRes.data));
  }
  const superToken = loginRes.data.token;
  const superAdminId = loginRes.data.user.id;
  const superHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${superToken}`
  };
  console.log(' [PASS] 1. Super Admin Authentication successful (ID:', superAdminId, ')');

  // Clean any previous test data in isolated year range (>= 2080)
  await cleanIsolatedTestCamps();

  // Create isolated source camp 2080
  const { srcCampId: sourceCampId, testPhotoAssetId, testLogoAssetId, srcPartnerAlphaId } = await createIsolatedSourceCamp(superAdminId);
  console.log(' [PASS] 2. Isolated Test Source Camp created (ID:', sourceCampId, 'Year: 2080, TeamAsset:', testPhotoAssetId, 'SponsorAsset:', testLogoAssetId, ')\n');

  // ────────────────────────────────────────────────────────────────────────────
  // TEST SECTION 1: VALIDATE COPY REQUESTS EXPLICITLY (Issue 5)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SECTION 1: Explicit Copy Request Validation ---');
  // 1a. Requesting copy without providing source camp
  const noSourceCopyRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps',
    method: 'POST',
    headers: superHeaders
  }, {
    camp_year: 2081,
    internal_name: 'BDC 2081',
    public_title: 'Test 2081',
    camp_date: '2081-10-15',
    starts_at: '09:00',
    ends_at: '16:00',
    venue: 'Test Venue',
    copyFromCampId: null,
    copyTeam: true,
    copySponsors: false
  });
  console.log(' 1a. Copy requested with null source camp:', {
    status: noSourceCopyRes.status,
    message: noSourceCopyRes.data?.message
  });
  if (noSourceCopyRes.status !== 400 || !noSourceCopyRes.data?.message?.includes('A valid source camp is required')) {
    throw new Error('FAILED: Expected 400 when copyTeam is true but source is null.');
  }

  // 1b. Requesting copy with non-existent source camp ID
  const invalidSourceCopyRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps',
    method: 'POST',
    headers: superHeaders
  }, {
    camp_year: 2081,
    internal_name: 'BDC 2081',
    public_title: 'Test 2081',
    camp_date: '2081-10-15',
    starts_at: '09:00',
    ends_at: '16:00',
    venue: 'Test Venue',
    copyFromCampId: 999999,
    copyTeam: false,
    copySponsors: true
  });
  console.log(' 1b. Copy requested with non-existent source camp ID (999999):', {
    status: invalidSourceCopyRes.status,
    message: invalidSourceCopyRes.data?.message
  });
  if (invalidSourceCopyRes.status !== 400 || !invalidSourceCopyRes.data?.message?.includes('was not found')) {
    throw new Error('FAILED: Expected 400 when source camp ID does not exist.');
  }
  console.log(' [PASS] Test Section 1 passed.\n');

  // ────────────────────────────────────────────────────────────────────────────
  // TEST SECTION 2: STRENGTHEN DATE & TIME VALIDATION (Issue 4)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SECTION 2: Calendar Date & Operating Hours Validation ---');
  const impossibleDates = ['2081-02-30', '2081-11-31', '2081-13-01', '2081-04-31', 'not-a-date'];
  for (const d of impossibleDates) {
    const invDateRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/camps',
      method: 'POST',
      headers: superHeaders
    }, {
      camp_year: 2081,
      internal_name: 'BDC 2081',
      public_title: 'Test 2081',
      camp_date: d,
      starts_at: '09:00',
      ends_at: '16:00',
      venue: 'Test Venue'
    });
    if (invDateRes.status !== 400 || !invDateRes.data?.message?.includes('Invalid calendar date')) {
      throw new Error(`FAILED: Impossible date ${d} was not rejected with 400.`);
    }
  }
  console.log(' 2a. All impossible calendar dates correctly rejected with HTTP 400.');

  // 2b. Ends_at <= Starts_at
  const invTimeRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps',
    method: 'POST',
    headers: superHeaders
  }, {
    camp_year: 2081,
    internal_name: 'BDC 2081',
    public_title: 'Test 2081',
    camp_date: '2081-10-15',
    starts_at: '16:00',
    ends_at: '09:00',
    venue: 'Test Venue'
  });
  if (invTimeRes.status !== 400 || !invTimeRes.data?.message?.includes('End time must be after start time')) {
    throw new Error('FAILED: Inverted time range was not rejected with 400.');
  }
  console.log(' 2b. Inverted operating hours correctly rejected with HTTP 400.');
  console.log(' [PASS] Test Section 2 passed.\n');

  // ────────────────────────────────────────────────────────────────────────────
  // TEST SECTION 3: ALL FOUR TEAM/SPONSOR COPY COMBINATIONS, ASSETS & ISOLATION
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SECTION 3: Four Team/Sponsor Copy Combinations & Isolation ---');

  // Combo 1: Neither team nor sponsors
  const c1Res = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps',
    method: 'POST',
    headers: superHeaders
  }, {
    camp_year: 2081,
    internal_name: 'BDC 2081 Combo 1',
    public_title: 'Combo 1 Neither',
    camp_date: '2081-10-15',
    starts_at: '09:00',
    ends_at: '16:00',
    venue: 'Test Venue 1',
    copyFromCampId: sourceCampId,
    copyTeam: false,
    copySponsors: false
  });
  const c1Id = c1Res.data?.id;
  const c1Team = await request({ hostname: 'localhost', port: 4000, path: `/api/camps/${c1Id}/team`, method: 'GET', headers: superHeaders });
  const c1Sponsors = await request({ hostname: 'localhost', port: 4000, path: `/api/camps/${c1Id}/sponsors`, method: 'GET', headers: superHeaders });
  console.log(` 3a. Combo 1 (Neither): ID=${c1Id}, Team count=${c1Team.data?.data?.length || 0} (Expected 0), Sponsor Secs=${c1Sponsors.data?.data?.length || 0} (Expected 0)`);
  if ((c1Team.data?.data?.length || 0) !== 0 || (c1Sponsors.data?.data?.length || 0) !== 0) {
    throw new Error('FAILED: Combo 1 should have 0 team members and 0 sponsor sections.');
  }

  // Combo 2: Team only
  const c2Res = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps',
    method: 'POST',
    headers: superHeaders
  }, {
    camp_year: 2082,
    internal_name: 'BDC 2082 Combo 2',
    public_title: 'Combo 2 Team Only',
    camp_date: '2082-10-15',
    starts_at: '09:00',
    ends_at: '16:00',
    venue: 'Test Venue 2',
    copyFromCampId: sourceCampId,
    copyTeam: true,
    copySponsors: false
  });
  const c2Id = c2Res.data?.id;
  const c2Team = await request({ hostname: 'localhost', port: 4000, path: `/api/camps/${c2Id}/team`, method: 'GET', headers: superHeaders });
  const c2Sponsors = await request({ hostname: 'localhost', port: 4000, path: `/api/camps/${c2Id}/sponsors`, method: 'GET', headers: superHeaders });
  console.log(` 3b. Combo 2 (Team Only): ID=${c2Id}, Team count=${c2Team.data?.data?.length || 0} (Expected 3), Sponsor Secs=${c2Sponsors.data?.data?.length || 0} (Expected 0)`);
  if ((c2Team.data?.data?.length || 0) !== 3 || (c2Sponsors.data?.data?.length || 0) !== 0) {
    throw new Error('FAILED: Combo 2 should have 3 team members and 0 sponsor sections.');
  }

  // Combo 3: Sponsors only
  const c3Res = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps',
    method: 'POST',
    headers: superHeaders
  }, {
    camp_year: 2083,
    internal_name: 'BDC 2083 Combo 3',
    public_title: 'Combo 3 Sponsors Only',
    camp_date: '2083-10-15',
    starts_at: '09:00',
    ends_at: '16:00',
    venue: 'Test Venue 3',
    copyFromCampId: sourceCampId,
    copyTeam: false,
    copySponsors: true
  });
  const c3Id = c3Res.data?.id;
  const c3Team = await request({ hostname: 'localhost', port: 4000, path: `/api/camps/${c3Id}/team`, method: 'GET', headers: superHeaders });
  const c3Sponsors = await request({ hostname: 'localhost', port: 4000, path: `/api/camps/${c3Id}/sponsors`, method: 'GET', headers: superHeaders });
  console.log(` 3c. Combo 3 (Sponsors Only): ID=${c3Id}, Team count=${c3Team.data?.data?.length || 0} (Expected 0), Sponsor Secs=${c3Sponsors.data?.data?.length || 0} (Expected 2)`);
  if ((c3Team.data?.data?.length || 0) !== 0 || (c3Sponsors.data?.data?.length || 0) !== 2) {
    throw new Error('FAILED: Combo 3 should have 0 team members and 2 sponsor sections.');
  }

  // Combo 4: Both Team and Sponsors
  const c4Res = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps',
    method: 'POST',
    headers: superHeaders
  }, {
    camp_year: 2084,
    internal_name: 'BDC 2084 Combo 4',
    public_title: 'Combo 4 Both',
    camp_date: '2084-10-15',
    starts_at: '09:00',
    ends_at: '16:00',
    venue: 'Test Venue 4',
    copyFromCampId: sourceCampId,
    copyTeam: true,
    copySponsors: true
  });
  const c4Id = c4Res.data?.id;
  const c4Team = await request({ hostname: 'localhost', port: 4000, path: `/api/camps/${c4Id}/team`, method: 'GET', headers: superHeaders });
  const c4Sponsors = await request({ hostname: 'localhost', port: 4000, path: `/api/camps/${c4Id}/sponsors`, method: 'GET', headers: superHeaders });
  console.log(` 3d. Combo 4 (Both): ID=${c4Id}, Team count=${c4Team.data?.data?.length || 0} (Expected 3), Sponsor Secs=${c4Sponsors.data?.data?.length || 0} (Expected 2)`);
  if ((c4Team.data?.data?.length || 0) !== 3 || (c4Sponsors.data?.data?.length || 0) !== 2) {
    throw new Error('FAILED: Combo 4 should have 3 team members and 2 sponsor sections.');
  }

  // 3e. Check ordering, visibility, and media asset ID preservation in Combo 4
  const c4TeamRows = c4Team.data.data;
  if (c4TeamRows[0].sort_order !== 1 || c4TeamRows[1].sort_order !== 2 || c4TeamRows[2].sort_order !== 3) {
    throw new Error('FAILED: Team sort_order was not preserved.');
  }
  if (!c4TeamRows[0].is_visible || !c4TeamRows[1].is_visible || c4TeamRows[2].is_visible !== false) {
    throw new Error('FAILED: Team is_visible flags were not preserved (third member should be hidden).');
  }
  if (c4TeamRows[0].photo_asset_id !== testPhotoAssetId) {
    throw new Error(`FAILED: Team photo_asset_id not preserved. Expected ${testPhotoAssetId}, got ${c4TeamRows[0].photo_asset_id}`);
  }

  const c4SecRows = c4Sponsors.data.data;
  if (c4SecRows[0].sort_order !== 1 || c4SecRows[1].sort_order !== 2) {
    throw new Error('FAILED: Sponsor section sort_order was not preserved.');
  }
  if (!c4SecRows[0].is_visible || c4SecRows[1].is_visible !== false) {
    throw new Error('FAILED: Sponsor section is_visible flags were not preserved.');
  }
  if (c4SecRows[0].sponsors[0].logo_asset_id !== testLogoAssetId) {
    throw new Error(`FAILED: Sponsor logo_asset_id not preserved. Expected ${testLogoAssetId}, got ${c4SecRows[0].sponsors[0].logo_asset_id}`);
  }
  console.log(' 3e. Sort order, visibility, and asset IDs accurately preserved across team and sponsors.');

  // 3f. Source-Record Isolation: Mutate/Delete copied records without affecting source
  const copiedMember = c4TeamRows[0];
  await pool.query('UPDATE team_members SET full_name = "MUTATED IN COPY", sort_order = 99 WHERE id = ?', [copiedMember.id]);
  const [sourceTeamAfter] = await pool.query('SELECT full_name, sort_order FROM team_members WHERE camp_id = ? AND sort_order = 1', [sourceCampId]);
  console.log(' 3f. Mutating copied member name -> Source member:', sourceTeamAfter[0].full_name);
  if (sourceTeamAfter[0].full_name !== 'Source Chief' || sourceTeamAfter[0].sort_order !== 1) {
    throw new Error('FAILED: Mutating copied member mutated the source camp member!');
  }

  // Mutate copied sponsor
  const copiedSponsor = c4SecRows[0].sponsors[0];
  await pool.query('UPDATE sponsors SET name = "MUTATED SPONSOR IN COPY" WHERE id = ?', [copiedSponsor.id]);
  const [[sourceSponsorAfter]] = await pool.query(
    'SELECT name FROM sponsors WHERE id = ?',
    [srcPartnerAlphaId]
  );
  console.log(' 3g. Mutating copied sponsor name -> Source sponsor:', sourceSponsorAfter?.name);
  if (sourceSponsorAfter?.name !== 'Partner Alpha') {
    throw new Error('FAILED: Mutating copied sponsor mutated the source sponsor!');
  }

  // Delete copied member
  await pool.query('DELETE FROM team_members WHERE id = ?', [copiedMember.id]);
  const [sourceTeamCount] = await pool.query('SELECT COUNT(*) AS cnt FROM team_members WHERE camp_id = ?', [sourceCampId]);
  if (sourceTeamCount[0].cnt !== 3) {
    throw new Error('FAILED: Deleting copied member affected source camp!');
  }
  console.log(' 3h. Deleting copied member -> Source camp still has', sourceTeamCount[0].cnt, 'members.');

  // Delete copied sponsor
  await pool.query('DELETE FROM sponsors WHERE id = ?', [copiedSponsor.id]);
  const [[sourceSponsorCount]] = await pool.query('SELECT COUNT(*) AS cnt FROM sponsors s JOIN sponsor_sections sec ON sec.id = s.section_id WHERE sec.camp_id = ?', [sourceCampId]);
  if (sourceSponsorCount.cnt !== 3) {
    throw new Error('FAILED: Deleting copied sponsor affected source camp!');
  }
  console.log(' 3i. Deleting copied sponsor -> Source camp still has', sourceSponsorCount.cnt, 'sponsors.');
  console.log(' [PASS] Test Section 3 passed.\n');

  // ────────────────────────────────────────────────────────────────────────────
  // TEST SECTION 4: EDIT PERSISTENCE & DIALOG REOPENING / REFRESH
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SECTION 4: Edit Persistence & Refresh Flow ---');
  const cEditRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps',
    method: 'POST',
    headers: superHeaders
  }, {
    camp_year: 2085,
    internal_name: 'BDC 2085',
    public_title: 'Original Title 2085',
    camp_date: '2085-10-15',
    starts_at: '09:00',
    ends_at: '16:00',
    venue: 'Original Hall',
    venue_subtitle: 'Original Subtitle'
  });
  const editCampId = cEditRes.data?.id;

  const updateRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/camps/${editCampId}`,
    method: 'PATCH',
    headers: superHeaders
  }, {
    public_title: 'Updated 2085 Silver Edition',
    internal_name: 'BDC 2085 Updated',
    camp_date: '2085-11-20',
    starts_at: '09:30',
    ends_at: '16:45',
    venue: 'New Main Arena',
    venue_subtitle: 'Sector 5 East Gate'
  });

  if (updateRes.status !== 200 || !updateRes.data?.success) {
    throw new Error('FAILED: Camp PATCH failed: ' + JSON.stringify(updateRes.data));
  }

  // Re-fetch individual camp (simulates dialog reopening)
  const dialogReopenRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/camps/${editCampId}`,
    method: 'GET',
    headers: superHeaders
  });
  const rCamp = dialogReopenRes.data.data;
  console.log(' 4a. Dialog Reopen fetched values:', {
    title: rCamp.public_title,
    date: rCamp.camp_date,
    starts: rCamp.starts_at,
    ends: rCamp.ends_at,
    venue: rCamp.venue,
    sub: rCamp.venue_subtitle
  });
  if (rCamp.public_title !== 'Updated 2085 Silver Edition' ||
      rCamp.camp_date !== '2085-11-20' ||
      rCamp.starts_at !== '09:30:00' ||
      rCamp.ends_at !== '16:45:00' ||
      rCamp.venue !== 'New Main Arena' ||
      rCamp.venue_subtitle !== 'Sector 5 East Gate') {
    throw new Error('FAILED: Saved values do not match in dialog reopen fetch.');
  }

  // Re-fetch all camps (simulates page refresh)
  const listRefreshRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps',
    method: 'GET',
    headers: superHeaders
  });
  const listedCamp = listRefreshRes.data.data.find(c => c.id === editCampId);
  if (!listedCamp || listedCamp.public_title !== 'Updated 2085 Silver Edition') {
    throw new Error('FAILED: Camp list does not contain updated camp after refresh.');
  }
  console.log(' 4b. Page refresh list verification confirmed.');
  console.log(' [PASS] Test Section 4 passed.\n');

  // ────────────────────────────────────────────────────────────────────────────
  // TEST SECTION 5: UNAUTHORIZED VISIBILITY UPDATES (Issue 3)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SECTION 5: Backend Permissions on Camp Visibility ---');
  // Create temporary regular admin with NO camp.overview permission
  const tempPassword = 'TestUser@123';
  const tempHash = await bcrypt.hash(tempPassword, 10);
  const [tempAdminRes] = await pool.query(
    'INSERT INTO admins (full_name, email, password_hash, role, is_enabled, must_change_password) VALUES ("Temp Tester", "temptester@skit.ac.in", ?, "REGULAR_ADMIN", 1, 0)',
    [tempHash]
  );
  const tempAdminId = tempAdminRes.insertId;

  // Log in as this unauthorized regular admin
  const regLogin = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'temptester@skit.ac.in', password: tempPassword });
  const regToken = regLogin.data?.token;
  const regHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${regToken}`
  };

  // Attempt to toggle visibility on non-live camp (editCampId) - trying to hide 'team' which starts visible (1)
  const unauthRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/camps/${editCampId}/visibility`,
    method: 'PATCH',
    headers: regHeaders
  }, { page_key: 'team', is_visible: false });

  console.log(' 5a. Unauthorized visibility toggle response status (Expected 403):', unauthRes.status);
  console.log('     Response message:', unauthRes.data?.message);
  if (unauthRes.status !== 403) {
    throw new Error('FAILED: Unauthorized regular admin was not rejected with HTTP 403.');
  }

  // Verify database record was NOT changed (team is_visible should still be 1)
  const [[visCheck]] = await pool.query('SELECT is_visible FROM camp_page_visibility WHERE camp_id = ? AND page_key = "team"', [editCampId]);
  console.log(' 5b. Database visibility unchanged check:', visCheck?.is_visible === 1 ? 'Unchanged (Passed)' : 'Changed (Failed)');
  if (visCheck?.is_visible !== 1) {
    throw new Error('FAILED: Database record was unexpectedly modified!');
  }

  // Clean up temporary admin
  await pool.query('DELETE FROM admin_sessions WHERE admin_id = ?', [tempAdminId]);
  await pool.query('DELETE FROM admins WHERE id = ?', [tempAdminId]);
  console.log(' [PASS] Test Section 5 passed.\n');

  // ────────────────────────────────────────────────────────────────────────────
  // TEST SECTION 6: PUBLIC PAGE BEHAVIOR AFTER SWITCHING & CLEARING LIVE CAMP
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SECTION 6: Public Website Behavior on Switch & Clear Live ---');
  // Record current live camp to restore at the end
  const [[curState]] = await pool.query('SELECT live_camp_id FROM site_state WHERE id = 1');
  const originalLiveCampId = curState?.live_camp_id;

  // 6a. Switch live to test camp 2085
  await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/camps/${editCampId}/set-live`,
    method: 'POST',
    headers: superHeaders
  });

  const pubCampRes = await request({ hostname: 'localhost', port: 4000, path: '/api/public/camp', method: 'GET' });
  console.log(' 6a. Public Camp Endpoint when Live=2085:', {
    name: pubCampRes.data?.data?.name,
    camp_date: pubCampRes.data?.data?.camp_date,
    camp_time: pubCampRes.data?.data?.camp_time,
    venue: pubCampRes.data?.data?.venue
  });
  if (pubCampRes.data?.data?.name !== 'Updated 2085 Silver Edition' ||
      pubCampRes.data?.data?.camp_date !== '2085-11-20' ||
      pubCampRes.data?.data?.camp_time !== '9:30 AM – 4:45 PM IST') {
    throw new Error('FAILED: Public camp endpoint did not reflect switched live camp!');
  }

  // 6b. Clear Live Camp
  await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps/clear-live',
    method: 'POST',
    headers: superHeaders
  });

  const clearedCampRes = await request({ hostname: 'localhost', port: 4000, path: '/api/public/camp', method: 'GET' });
  const clearedGalleryRes = await request({ hostname: 'localhost', port: 4000, path: '/api/public/gallery', method: 'GET' });
  const clearedTeamRes = await request({ hostname: 'localhost', port: 4000, path: '/api/public/team', method: 'GET' });
  const clearedSponsorsRes = await request({ hostname: 'localhost', port: 4000, path: '/api/public/sponsors', method: 'GET' });

  console.log(' 6b. Public Endpoints after Clear Live:');
  console.log('     /api/public/camp data:', clearedCampRes.data?.data);
  console.log('     /api/public/gallery currentCamp:', clearedGalleryRes.data?.data?.currentCamp);
  console.log('     /api/public/team members count:', clearedTeamRes.data?.data?.members?.length || 0);
  console.log('     /api/public/sponsors count:', clearedSponsorsRes.data?.data?.length || 0);

  if (clearedCampRes.data?.data !== null) {
    throw new Error('FAILED: /api/public/camp should return null when live camp is cleared.');
  }
  if (clearedGalleryRes.data?.data?.currentCamp !== null) {
    throw new Error('FAILED: /api/public/gallery currentCamp should be null when live camp is cleared.');
  }

  // 6c. Restore original live camp
  if (originalLiveCampId) {
    await request({
      hostname: 'localhost',
      port: 4000,
      path: `/api/camps/${originalLiveCampId}/set-live`,
      method: 'POST',
      headers: superHeaders
    });
    console.log(' 6c. Restored original live camp (ID:', originalLiveCampId, ')');
  }
  console.log(' [PASS] Test Section 6 passed.\n');

  // ────────────────────────────────────────────────────────────────────────────
  // TEST SECTION 7: TRANSACTION ROLLBACK ON COPY FAILURE
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SECTION 7: Transaction Rollback on Copy Failure ---');

  // Create isolated source camp 2088 with sponsor section
  const [failSrcRes] = await pool.query(
    `INSERT INTO camps (camp_year, internal_name, public_title, description, camp_date, starts_at, ends_at, venue, venue_subtitle, registration_open, media_folder, storage_state, created_by, updated_by)
     VALUES (2088, 'BDC 2088 Fail Source', 'Fail Source Camp', 'Testing rollback', '2088-10-15', '09:00:00', '16:00:00', 'Hall F', 'Zone F', FALSE, 'BDC Camp 2088', 'READY', ?, ?)`,
    [superAdminId, superAdminId]
  );
  const failSrcCampId = failSrcRes.insertId;

  await pool.query(
    `INSERT INTO sponsor_sections (camp_id, heading, description, is_visible, sort_order, created_by, updated_by)
     VALUES (?, 'FAIL_TRIGGER_HEADING', 'Trigger will fail', 1, 1, ?, ?)`,
    [failSrcCampId, superAdminId, superAdminId]
  );

  // Install temporary trigger that forces failure when copying this section
  await pool.query('DROP TRIGGER IF EXISTS trg_test_copy_rollback');
  await pool.query(`
    CREATE TRIGGER trg_test_copy_rollback BEFORE INSERT ON sponsor_sections
    FOR EACH ROW
    BEGIN
      IF NEW.heading = 'FAIL_TRIGGER_HEADING' AND NEW.camp_id <> ${failSrcCampId} THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Simulated error during sponsor copy';
      END IF;
    END
  `);

  // Attempt to create camp 2089 copying sponsors from 2088
  const rollbackApiRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/camps',
    method: 'POST',
    headers: superHeaders
  }, {
    camp_year: 2089,
    internal_name: 'BDC 2089 Rollback Target',
    public_title: 'Rollback Target',
    camp_date: '2089-10-15',
    starts_at: '09:00',
    ends_at: '16:00',
    venue: 'Hall R',
    copyFromCampId: failSrcCampId,
    copyTeam: false,
    copySponsors: true
  });

  console.log(' 7a. API Response status on simulated copy failure (Expected 500):', rollbackApiRes.status);
  console.log('     Response message/error:', rollbackApiRes.data?.message || rollbackApiRes.raw?.slice(0, 100));

  // Drop the temporary trigger immediately
  await pool.query('DROP TRIGGER IF EXISTS trg_test_copy_rollback');

  // Verify that camp 2089 was NOT created and no orphaned records exist in database
  const [[rolledCamp]] = await pool.query('SELECT id FROM camps WHERE camp_year = 2089');
  const [rolledVis] = await pool.query('SELECT * FROM camp_page_visibility WHERE camp_id NOT IN (SELECT id FROM camps)');
  const [rolledCounters] = await pool.query('SELECT * FROM registration_counters WHERE camp_id NOT IN (SELECT id FROM camps)');
  const [rolledSecs] = await pool.query('SELECT * FROM sponsor_sections WHERE camp_id NOT IN (SELECT id FROM camps)');

  console.log(' 7b. Camp 2089 exists in DB:', !!rolledCamp, '(Expected false)');
  console.log(' 7c. Orphaned visibility rows in DB:', rolledVis.length, '(Expected 0)');
  console.log(' 7d. Orphaned registration counters in DB:', rolledCounters.length, '(Expected 0)');
  console.log(' 7e. Orphaned sponsor sections in DB:', rolledSecs.length, '(Expected 0)');

  if (rolledCamp || rolledVis.length > 0 || rolledCounters.length > 0 || rolledSecs.length > 0) {
    throw new Error('FAILED: Transaction rollback failed - orphaned records detected in DB!');
  }
  console.log(' [PASS] Test Section 7 passed.\n');

  // ────────────────────────────────────────────────────────────────────────────
  // CLEANUP ISOLATED TEST DATA
  // ────────────────────────────────────────────────────────────────────────────
  await cleanIsolatedTestCamps();
  console.log(' [CLEANUP] All isolated test camps removed successfully.');

  console.log('\n================================================================');
  console.log(' REPRODUCIBLE VERIFICATION SUITE: ALL TESTS PASSED (100%)');
  console.log('================================================================');
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
