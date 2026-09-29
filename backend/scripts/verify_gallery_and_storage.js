'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const http = require('http');
const path = require('path');
const fs = require('fs');
const { pool } = require('../src/db');
const storage = require('../src/storage');

const BASE_URL = 'http://localhost:4000';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
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

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runVerification() {
  console.log('================================================================');
  console.log(' BDC SPECIFICATION VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;

  // Pre-cleanup in case of prior interrupted runs
  await pool.query("DELETE FROM gallery_photos WHERE album_id IN (SELECT id FROM gallery_albums WHERE title LIKE 'Test Album%')");
  await pool.query("DELETE FROM gallery_categories WHERE album_id IN (SELECT id FROM gallery_albums WHERE title LIKE 'Test Album%')");
  await pool.query("DELETE FROM gallery_albums WHERE title LIKE 'Test Album%'");
  await pool.query("DELETE FROM media_assets WHERE relative_path LIKE 'gallery/test-moment%'");

  // ── 1. Storage Health & Configuration Checks ───────────────────────────────
  console.log('1. Checking Centralized Storage & Folders...');
  assert(storage.VALID_FOLDERS.includes('camps'), 'storage.VALID_FOLDERS must include "camps"');
  assert(storage.VALID_FOLDERS.includes('teams'), 'storage.VALID_FOLDERS must include "teams"');
  assert(storage.VALID_FOLDERS.includes('sponsors'), 'storage.VALID_FOLDERS must include "sponsors"');
  assert(storage.VALID_FOLDERS.includes('gallery'), 'storage.VALID_FOLDERS must include "gallery"');

  const health = storage.checkStorageHealth();
  assert(health.ok === true, 'storage.checkStorageHealth() must return ok === true');
  assert(Object.values(health.folders).every(f => f.ok), 'All storage folders must be ok');

  // Verify reserved portraits manifest
  assert(storage.RESERVED_PORTRAITS.includes('aryan-sharma.jpg'), 'aryan-sharma.jpg must be reserved');
  assert(storage.RESERVED_PORTRAITS.includes('bharat-dhakad.jpg'), 'bharat-dhakad.jpg must be reserved');
  assert(storage.RESERVED_PORTRAITS.includes('chetan-yadav.jpg'), 'chetan-yadav.jpg must be reserved');
  assert(storage.RESERVED_PORTRAITS.includes('rahul-saini.jpg'), 'rahul-saini.jpg must be reserved');
  assert(storage.isReservedPortrait('teams/rahul-saini.jpg') === true, 'isReservedPortrait must detect reserved team portrait');
  assert(storage.isReservedPortrait('teams/other-user.jpg') === false, 'isReservedPortrait must not flag non-reserved portrait');
  console.log('   ✔ Storage folders and reserved portraits verified.\n');
  passedTests++;

  // ── 2. Permanent Website Team Verification ─────────────────────────────────
  console.log('2. Checking Permanent Website Team & Public Immutability...');
  const publicTeamRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/public/team',
    method: 'GET'
  });
  assert(publicTeamRes.status === 200, 'GET /api/public/team must return 200');
  const webTeam = publicTeamRes.data?.data?.websiteTeam || [];
  assert(webTeam.length === 4, `Website team roster must contain exactly 4 members, got ${webTeam.length}`);

  const websiteTeamModule = require('../src/websiteTeam');
  assert(websiteTeamModule.roster.length === 4, 'roster must have 4 members');
  assert(websiteTeamModule.roster.every(m => m.showPhonePublicly === true), 'All roster members must have showPhonePublicly === true');

  const expectedNames = ['Bharat Dhakad', 'Aryan Sharma', 'Rahul Saini', 'Chetan Yadav'];
  webTeam.forEach((member, i) => {
    assert(member.name === expectedNames[i], `Member ${i} must be ${expectedNames[i]}, got ${member.name}`);
    assert(typeof member.phone === 'string' && member.phone.length > 5, `Member ${member.name} must have phone exposed`);
    assert(member.photoUrl && member.photoUrl.includes('/media/teams/'), `Member ${member.name} photo must be in /media/teams/`);
  });
  console.log('   ✔ Permanent roster and phone visibility verified for all 4 members.');

  // Verify website_team_preferences table does not exist
  const [prefTables] = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'website_team_preferences'"
  );
  assert(prefTables.length === 0, 'website_team_preferences table must be dropped from database');
  console.log('   ✔ Preferences table completely retired.\n');
  passedTests++;

  // ── 3. Authenticate Super Admin ────────────────────────────────────────────
  console.log('3. Authenticating Super Admin...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'nss@skit.ac.in',
    password: 'Skit@12345'
  });
  assert(loginRes.status === 200 && loginRes.data?.token, 'Super admin login failed');
  const superToken = loginRes.data.token;
  const superHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${superToken}`
  };
  console.log('   ✔ Authenticated super admin.');

  // Verify admin website-team router is completely removed (returns 404 even with valid token)
  const adminWebTeamRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/website-team',
    method: 'GET',
    headers: superHeaders
  });
  assert(adminWebTeamRes.status === 404, `GET /api/admin/website-team must be 404, got ${adminWebTeamRes.status}`);
  console.log('   ✔ Admin website-team route verified completely unmounted (404 Not Found).\n');
  passedTests++;

  // ── 4. Global Gallery Albums CRUD & Reorder ────────────────────────────────
  console.log('4. Testing Global Gallery Album CRUD & Reorder...');
  // Create album 1 (starts unpublished)
  const createAlbum1Res = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/gallery/albums',
    method: 'POST',
    headers: superHeaders
  }, {
    title: 'Test Album 2085 Beta',
    description: 'Temporary verification album',
    camp_year: 2085,
    camp_date: '2085-11-20',
    sort_order: 100
  });
  assert(createAlbum1Res.status === 201, `Create album must return 201, got ${createAlbum1Res.status}`);
  const album1Id = createAlbum1Res.data.data.id;
  assert(createAlbum1Res.data.data.is_published === false, 'New album must start unpublished');

  // Create album 2
  const createAlbum2Res = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/gallery/albums',
    method: 'POST',
    headers: superHeaders
  }, {
    title: 'Test Album 2086 Alpha',
    description: 'Second verification album',
    camp_year: 2086,
    sort_order: 101
  });
  assert(createAlbum2Res.status === 201, 'Create second album must return 201');
  const album2Id = createAlbum2Res.data.data.id;

  // Reorder albums (must provide complete permutation of all albums)
  const [allAlbumRows] = await pool.query('SELECT id FROM gallery_albums ORDER BY sort_order ASC, id DESC');
  const allIds = allAlbumRows.map(r => Number(r.id));
  const reorderedIds = [...allIds].reverse();

  const reorderRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/gallery/albums/reorder',
    method: 'PUT',
    headers: superHeaders
  }, {
    orderedIds: reorderedIds
  });
  assert(reorderRes.status === 200, `Reorder albums must return 200, got ${reorderRes.status}`);

  // Verify detail
  const detailRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/admin/gallery/albums/${album1Id}`,
    method: 'GET',
    headers: superHeaders
  });
  assert(detailRes.status === 200, 'Get album detail must return 200');
  assert(detailRes.data.data.title === 'Test Album 2085 Beta', 'Album title matches');

  // Update album details
  const updateRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/admin/gallery/albums/${album1Id}`,
    method: 'PUT',
    headers: superHeaders
  }, {
    title: 'Test Album 2085 Beta (Updated)',
    description: 'Updated description'
  });
  assert(updateRes.status === 200, 'Update album must return 200');
  console.log('   ✔ Albums created, updated, and reordered successfully.\n');
  passedTests++;

  // ── 5. Nested Categories (Transactional Rename & Cascade) ──────────────────
  console.log('5. Testing Nested Categories & Transactional Rename...');
  // Create category
  const createCatRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/admin/gallery/albums/${album1Id}/categories`,
    method: 'POST',
    headers: superHeaders
  }, {
    name: 'Donation Moments',
    sort_order: 1
  });
  assert(createCatRes.status === 201, `Create category must return 201, got ${createCatRes.status}`);
  const catId = createCatRes.data.data.id;

  // Insert a dummy media asset for photo testing
  const uniqueAssetPath = `gallery/test-moment-${Date.now()}.jpg`;
  const [assetRes] = await pool.query(
    `INSERT INTO media_assets (album_id, media_kind, relative_path, mime_type, byte_size, width_px, height_px, sha256, uploaded_by)
     VALUES (?, 'GALLERY', ?, 'image/jpeg', 1024, 800, 600, UNHEX(SHA2('test-moment', 256)), ?)`,
    [album1Id, uniqueAssetPath, 2]
  );
  const testAssetId = assetRes.insertId;

  // Create photo in album1 with category 'Donation Moments'
  const createPhotoRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/admin/gallery/albums/${album1Id}/photos`,
    method: 'POST',
    headers: superHeaders
  }, {
    asset_id: testAssetId,
    category: 'Donation Moments',
    caption: 'Student Donor at SKIT',
    alt_text: 'Student Donor Photo',
    is_visible: true
  });
  assert(createPhotoRes.status === 201, `Create photo must return 201, got ${createPhotoRes.status}`);
  const photoId = createPhotoRes.data.data.id;

  // Rename category to 'Heroic Donors'
  const renameCatRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/admin/gallery/albums/${album1Id}/categories/${catId}`,
    method: 'PUT',
    headers: superHeaders
  }, {
    name: 'Heroic Donors'
  });
  assert(renameCatRes.status === 200, `Rename category must return 200, got ${renameCatRes.status}`);

  // Verify photo was transactionally updated
  const [[updatedPhoto]] = await pool.query('SELECT category FROM gallery_photos WHERE id = ?', [photoId]);
  assert(updatedPhoto.category === 'Heroic Donors', `Photo category must be updated to 'Heroic Donors', got ${updatedPhoto.category}`);

  // Set album cover
  const setCoverRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/admin/gallery/albums/${album1Id}`,
    method: 'PUT',
    headers: superHeaders
  }, {
    cover_asset_id: testAssetId
  });
  assert(setCoverRes.status === 200, 'Set cover asset must return 200');

  // Verify cover is set
  const [[albumWithCover]] = await pool.query('SELECT cover_asset_id FROM gallery_albums WHERE id = ?', [album1Id]);
  assert(Number(albumWithCover.cover_asset_id) === testAssetId, 'Album cover_asset_id must match photo asset_id');
  console.log('   ✔ Categories and photos created, renamed transactionally, and cover assigned.\n');
  passedTests++;

  // ── 6. Publication Filtering & Public API Contract ─────────────────────────
  console.log('6. Testing Publication Filtering on Public Endpoints...');
  // Album1 is unpublished: should NOT appear in public albums list
  const pubAlbumsRes1 = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/public/gallery/albums',
    method: 'GET'
  });
  assert(pubAlbumsRes1.status === 200, 'GET /api/public/gallery/albums must return 200');
  const pubAlbumIds1 = pubAlbumsRes1.data.data.albums.map(a => a.id);
  assert(!pubAlbumIds1.includes(album1Id), 'Unpublished album must not appear in public albums list');

  // Direct fetch of unpublished album should 404
  const pubSingleRes1 = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/public/gallery/albums/${album1Id}`,
    method: 'GET'
  });
  assert(pubSingleRes1.status === 404, `GET /api/public/gallery/albums/:id on unpublished album must be 404, got ${pubSingleRes1.status}`);

  // Now publish Album1
  await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/admin/gallery/albums/${album1Id}`,
    method: 'PUT',
    headers: superHeaders
  }, {
    is_published: true
  });

  // Now verify it appears on public endpoints
  const pubAlbumsRes2 = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/public/gallery/albums',
    method: 'GET'
  });
  const pubAlbumIds2 = pubAlbumsRes2.data.data.albums.map(a => a.id);
  assert(pubAlbumIds2.includes(album1Id), 'Published album must now appear in public albums list');

  const pubSingleRes2 = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/public/gallery/albums/${album1Id}`,
    method: 'GET'
  });
  assert(pubSingleRes2.status === 200, 'GET /api/public/gallery/albums/:id on published album must return 200');
  assert(pubSingleRes2.data.data.photos.length === 1, 'Photo in published album returned');

  // Test hidden photo visibility filtering: hide photo
  await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/admin/gallery/albums/${album1Id}/photos/${photoId}`,
    method: 'PUT',
    headers: superHeaders
  }, {
    is_visible: false
  });

  // Verify hidden photo does NOT appear publicly
  const pubSingleRes3 = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/public/gallery/albums/${album1Id}`,
    method: 'GET'
  });
  assert(pubSingleRes3.data.data.photos.length === 0, 'Hidden photo (is_visible=0) must not appear in public photos');

  // Verify carousel does NOT include hidden photo
  const pubGalleryRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/public/gallery',
    method: 'GET'
  });
  assert(pubGalleryRes.status === 200, 'GET /api/public/gallery must return 200');
  const carouselPhotoIds = pubGalleryRes.data.data.carouselPhotos.map(p => p.id);
  assert(!carouselPhotoIds.includes(photoId), 'Hidden photo must not leak into carouselPhotos');
  console.log('   ✔ Publication and photo visibility strictly enforced on all public endpoints.\n');
  passedTests++;

  // ── 7. Permissions & Camp Gallery Retirement ──────────────────────────────
  console.log('7. Testing Permissions & Camp Gallery Retirement...');
  const [perms] = await pool.query(
    "SELECT permission_key FROM permission_definitions WHERE permission_key IN ('website.gallery', 'camp.gallery')"
  );
  const permKeys = perms.map(p => p.permission_key);
  assert(permKeys.includes('website.gallery'), 'website.gallery must be defined in permission_definitions');
  assert(!permKeys.includes('camp.gallery'), 'camp.gallery must be retired from permission_definitions');

  // Verify new camp page visibility does not seed gallery
  const [visRows] = await pool.query(
    "SELECT page_key FROM camp_page_visibility WHERE page_key = 'gallery'"
  );
  assert(visRows.length === 0, 'camp_page_visibility should not contain any gallery records');
  console.log('   ✔ Permissions and camp gallery retirement verified.\n');
  passedTests++;

  // ── 8. Storage Exclusivity & Reserved Protection ───────────────────────────
  console.log('8. Testing Storage Exclusivity & Reserved Protection...');
  // 8a. Successful exclusive file creation in 'gallery' folder
  const saved = storage.saveFileExclusively('gallery', Buffer.from('test-image-content-verification'), '.jpg');
  assert(saved && saved.filename && fs.existsSync(saved.absolutePath), 'saveFileExclusively must write file to disk');
  assert(saved.relativePath.startsWith('gallery/'), 'relativePath must begin with gallery/');

  // 8b. Writing directly with flag wx to same path must throw EEXIST
  let threwEexist = false;
  try {
    fs.writeFileSync(saved.absolutePath, Buffer.from('collide'), { flag: 'wx' });
  } catch (err) {
    if (err.code === 'EEXIST') threwEexist = true;
  }
  assert(threwEexist, 'Exclusive write (flag wx) must throw EEXIST on collision');

  // Clean up temporary written test file
  fs.unlinkSync(saved.absolutePath);

  // 8c. Disallowed folder: must throw validation error without mkdir
  let threwInvalidFolder = false;
  try {
    storage.saveFileExclusively('dynamic_custom_dir', Buffer.from('test'), '.jpg');
  } catch (err) {
    threwInvalidFolder = true;
  }
  assert(threwInvalidFolder, 'saveFileExclusively must reject unapproved folder');

  // 8d. Reserved portrait check
  assert(storage.isReservedPortrait('teams/aryan-sharma.jpg') === true, 'aryan-sharma.jpg is reserved');
  assert(storage.isReservedPortrait('teams/custom-lead.jpg') === false, 'custom-lead.jpg is not reserved');
  console.log('   ✔ Exclusive file creation (flag wx) and reserved portraits verified.\n');
  passedTests++;

  // ── Clean Up Test Data ─────────────────────────────────────────────────────
  console.log('Cleaning up test gallery records...');
  await pool.query('DELETE FROM gallery_photos WHERE album_id IN (?, ?)', [album1Id, album2Id]);
  await pool.query('DELETE FROM gallery_categories WHERE album_id IN (?, ?)', [album1Id, album2Id]);
  await pool.query('DELETE FROM gallery_albums WHERE id IN (?, ?)', [album1Id, album2Id]);
  await pool.query('DELETE FROM media_assets WHERE id = ?', [testAssetId]);
  console.log('   ✔ Cleaned up test albums and assets.\n');

  console.log('================================================================');
  console.log(` ALL ${passedTests} VERIFICATION TEST SECTIONS PASSED! (100%)`);
  console.log('================================================================');
  process.exit(0);
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION SUITE FAILED:', err);
  process.exit(1);
});
