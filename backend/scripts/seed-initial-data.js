'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

async function seedInitialData() {
  // ⚠️  DEMO DATA GUARD
  // This script inserts placeholder team members, sponsors, and gallery photos
  // if the database counts are zero. Run it ONLY in a clean dev/staging environment.
  // In production, pass --force-seed explicitly to acknowledge the risk.
  if (!process.argv.includes('--force-seed')) {
    console.error('[seed] ❌ Refusing to run without --force-seed flag.');
    console.error('[seed]    This script inserts demo/placeholder data that may overwrite real records.');
    console.error('[seed]    Re-run with: node scripts/seed-initial-data.js --force-seed');
    process.exit(1);
  }

  console.log('[seed] Starting initial data alignment with public website...');

  const mediaRoot = process.env.MEDIA_ROOT || path.join(__dirname, '..', 'asset', 'Image');

  // Helper to ensure directory exists
  function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Ensure asset folders
  ensureDir(path.join(mediaRoot, 'Global', 'hero'));
  ensureDir(path.join(mediaRoot, 'Global', 'site'));
  ensureDir(path.join(mediaRoot, 'BDC Camp 2026', 'team'));
  ensureDir(path.join(mediaRoot, 'BDC Camp 2026', 'gallery'));
  ensureDir(path.join(mediaRoot, 'BDC Camp 2026', 'sponsors'));
  ensureDir(path.join(mediaRoot, 'BDC Camp 2025', 'team'));
  ensureDir(path.join(mediaRoot, 'BDC Camp 2025', 'gallery'));
  ensureDir(path.join(mediaRoot, 'BDC Camp 2025', 'sponsors'));

  // 1. Get Super Admin user ID
  const [[admin]] = await pool.query("SELECT id FROM admins WHERE email = 'nss@skit.ac.in'");
  const adminId = admin ? admin.id : 1;

  // 2. Insert Camps (2026 and 2025) if not present
  const [[c2026]] = await pool.query('SELECT id FROM camps WHERE camp_year = 2026');
  let camp2026Id;
  if (!c2026) {
    const [res2026] = await pool.query(
      `INSERT INTO camps (camp_year, internal_name, public_title, description, camp_date, starts_at, ends_at, timezone_name, venue, venue_subtitle, registration_open, media_folder, storage_state, created_by, updated_by)
       VALUES (2026, 'BDC 2026', 'SKIT Blood Donation Drive 2026', '25th Silver Jubilee Annual Blood Donation Camp organized by Swami Keshvanand Institute of Technology, Jaipur.', '2026-10-15', '09:00:00', '16:00:00', 'Asia/Kolkata', 'Central Amphitheatre & Medical Block, SKIT Campus, Jaipur', 'Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017', TRUE, 'BDC Camp 2026', 'READY', ?, ?)`,
      [adminId, adminId]
    );
    camp2026Id = res2026.insertId;
    console.log('[seed] Created camp 2026, id:', camp2026Id);
  } else {
    camp2026Id = c2026.id;
  }

  const [[c2025]] = await pool.query('SELECT id FROM camps WHERE camp_year = 2025');
  let camp2025Id;
  if (!c2025) {
    const [res2025] = await pool.query(
      `INSERT INTO camps (camp_year, internal_name, public_title, description, camp_date, starts_at, ends_at, timezone_name, venue, venue_subtitle, registration_open, media_folder, storage_state, created_by, updated_by)
       VALUES (2025, 'BDC 2025', 'SKIT Blood Donation Drive 2025', '24th Annual blood donation camp at SKIT campus with SMS Hospital and Red Cross Society.', '2025-10-10', '09:00:00', '16:00:00', 'Asia/Kolkata', 'Auditorium Block, SKIT Campus, Jaipur', 'Ramnagaria, Jagatpura, Jaipur', FALSE, 'BDC Camp 2025', 'READY', ?, ?)`,
      [adminId, adminId]
    );
    camp2025Id = res2025.insertId;
    console.log('[seed] Created camp 2025, id:', camp2025Id);
  } else {
    camp2025Id = c2025.id;
  }

  // 3. Make Camp 2026 the Live Camp
  await pool.query(
    'UPDATE site_state SET live_camp_id = ?, version = version + 1, updated_by = ? WHERE id = 1',
    [camp2026Id, adminId]
  );
  console.log('[seed] Set live_camp_id to 2026');

  // 4. Registration counters
  for (const cId of [camp2026Id, camp2025Id]) {
    await pool.query(
      'INSERT IGNORE INTO registration_counters (camp_id, next_sequence) VALUES (?, 1)',
      [cId]
    );
  }

  // 5. Page visibility for camps
  for (const page of ['team', 'gallery', 'sponsors', 'registration']) {
    await pool.query(
      'INSERT IGNORE INTO camp_page_visibility (camp_id, page_key, is_visible, updated_by) VALUES (?, ?, TRUE, ?)',
      [camp2026Id, page, adminId]
    );
    await pool.query(
      'INSERT IGNORE INTO camp_page_visibility (camp_id, page_key, is_visible, updated_by) VALUES (?, ?, TRUE, ?)',
      [camp2025Id, page, adminId]
    );
  }

  // 6. Seed Team Members for Camp 2026 (matching public TeamPublicPage.jsx)
  const [[teamCount]] = await pool.query('SELECT COUNT(*) AS count FROM team_members WHERE camp_id = ?', [camp2026Id]);
  if (teamCount.count === 0) {
    const teamMembersList = [
      // Chief Coordinator
      { group: 'CHIEF_COORDINATOR', name: 'Aarav Sharma', role: 'Chief Coordinator', phone: '+91 141 350 0000', email: 'aarav.sharma@skit.ac.in', show_phone: 1, order: 1 },
      // Members
      { group: 'MEMBERS', name: 'Rohan Gupta', role: 'Member', phone: null, email: null, show_phone: 0, order: 1 },
      { group: 'MEMBERS', name: 'Priya Mehta', role: 'Member', phone: null, email: null, show_phone: 0, order: 2 },
      { group: 'MEMBERS', name: 'Karan Verma', role: 'Member', phone: null, email: null, show_phone: 0, order: 3 },
      { group: 'MEMBERS', name: 'Ananya Singh', role: 'Member', phone: null, email: null, show_phone: 0, order: 4 },
      { group: 'MEMBERS', name: 'Aditya Jain', role: 'Member', phone: null, email: null, show_phone: 0, order: 5 },
      { group: 'MEMBERS', name: 'Neha Sharma', role: 'Member', phone: null, email: null, show_phone: 0, order: 6 },
      { group: 'MEMBERS', name: 'Vikram Yadav', role: 'Member', phone: null, email: null, show_phone: 0, order: 7 },
      { group: 'MEMBERS', name: 'Sneha Agrawal', role: 'Member', phone: null, email: null, show_phone: 0, order: 8 },
      { group: 'MEMBERS', name: 'Harshit Bansal', role: 'Member', phone: null, email: null, show_phone: 0, order: 9 },
      { group: 'MEMBERS', name: 'Kritika Soni', role: 'Member', phone: null, email: null, show_phone: 0, order: 10 },
      // Student Coordinators
      { group: 'STUDENT_COORDINATORS', name: 'Aarav Sharma', role: 'Student Coordinator', phone: '+91 141 350 0000', email: null, show_phone: 1, order: 1 },
      { group: 'STUDENT_COORDINATORS', name: 'Priya Mehta', role: 'Student Coordinator', phone: '+91 141 350 0000', email: null, show_phone: 1, order: 2 },
      { group: 'STUDENT_COORDINATORS', name: 'Rohan Gupta', role: 'Student Coordinator', phone: '+91 141 350 0000', email: null, show_phone: 1, order: 3 },
      { group: 'STUDENT_COORDINATORS', name: 'Ananya Singh', role: 'Student Coordinator', phone: null, email: null, show_phone: 0, order: 4 },
      { group: 'STUDENT_COORDINATORS', name: 'Karan Verma', role: 'Student Coordinator', phone: null, email: null, show_phone: 0, order: 5 },
      // Website Team
      { group: 'WEBSITE_TEAM', name: 'Devansh Sharma', role: 'Frontend Developer', phone: null, email: null, show_phone: 0, order: 1 },
      { group: 'WEBSITE_TEAM', name: 'Isha Gupta', role: 'UI/UX Designer', phone: null, email: null, show_phone: 0, order: 2 },
      { group: 'WEBSITE_TEAM', name: 'Raghav Mehta', role: 'Backend Developer', phone: null, email: null, show_phone: 0, order: 3 },
      { group: 'WEBSITE_TEAM', name: 'Simran Soni', role: 'Content & Media', phone: null, email: null, show_phone: 0, order: 4 },
      { group: 'WEBSITE_TEAM', name: 'Nikhil Jain', role: 'Website Manager', phone: null, email: null, show_phone: 0, order: 5 }
    ];

    for (const m of teamMembersList) {
      await pool.query(
        `INSERT INTO team_members (camp_id, group_key, full_name, role_label, phone, email, show_phone_publicly, is_visible, sort_order, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?)`,
        [camp2026Id, m.group, m.name, m.role, m.phone, m.email, m.show_phone, m.order, adminId, adminId]
      );
    }
    console.log('[seed] Seeded 21 team members for camp 2026');
  }

  // 7. Seed Sponsor Sections and Sponsors for Camp 2026 (matching SupportersPage.jsx)
  const [[secCount]] = await pool.query('SELECT COUNT(*) AS count FROM sponsor_sections WHERE camp_id = ?', [camp2026Id]);
  if (secCount.count === 0) {
    const sections = [
      {
        heading: 'Title Partner',
        desc: 'Leading the way in building a healthier and stronger tomorrow.',
        order: 1,
        sponsors: [
          { name: 'HDFC Bank', url: 'https://www.hdfcbank.com', order: 1 }
        ]
      },
      {
        heading: 'Main Sponsors',
        desc: 'Key organizational contributors powering our campaign equipment and refreshments.',
        order: 2,
        sponsors: [
          { name: 'Coca-Cola', url: '', order: 1 },
          { name: 'SBI', url: '', order: 2 },
          { name: 'Tata', url: '', order: 3 },
          { name: 'Reliance Industries Limited', url: '', order: 4 }
        ]
      },
      {
        heading: 'Supporting Sponsors',
        desc: 'Community and commercial brands contributing goods and logistical supplies.',
        order: 3,
        sponsors: [
          { name: 'Amul', url: '', order: 1 },
          { name: 'Nestle', url: '', order: 2 },
          { name: 'Decathlon', url: '', order: 3 },
          { name: 'boAt', url: '', order: 4 },
          { name: 'Red Bull', url: '', order: 5 },
          { name: 'Zomato', url: '', order: 6 }
        ]
      },
      {
        heading: 'Community & Medical Partners',
        desc: 'Healthcare institutions and civic partners providing clinical expertise.',
        order: 4,
        sponsors: [
          { name: 'Indian Red Cross Society', url: '', order: 1 },
          { name: 'Fortis', url: '', order: 2 },
          { name: 'Apollo Hospitals', url: '', order: 3 },
          { name: 'Jaipur Police', url: '', order: 4 },
          { name: 'NSS', url: '', order: 5 },
          { name: 'Rotary International', url: '', order: 6 }
        ]
      }
    ];

    for (const s of sections) {
      const [secRes] = await pool.query(
        `INSERT INTO sponsor_sections (camp_id, heading, description, is_visible, sort_order, created_by, updated_by)
         VALUES (?, ?, ?, TRUE, ?, ?, ?)`,
        [camp2026Id, s.heading, s.desc, s.order, adminId, adminId]
      );
      const sectionId = secRes.insertId;

      for (const sp of s.sponsors) {
        await pool.query(
          `INSERT INTO sponsors (section_id, name, website_url, is_visible, sort_order, created_by, updated_by)
           VALUES (?, ?, ?, TRUE, ?, ?, ?)`,
          [sectionId, sp.name, sp.url || null, sp.order, adminId, adminId]
        );
      }
    }
    console.log('[seed] Seeded 4 sponsor sections and 17 sponsors for camp 2026');
  }

  // 8. Seed Gallery Photos for Camp 2026
  const [[galCount]] = await pool.query('SELECT COUNT(*) AS count FROM gallery_photos WHERE camp_id = ?', [camp2026Id]);
  if (galCount.count === 0) {
    // Insert a neutral media asset first
    const [assetRes] = await pool.query(
      `INSERT IGNORE INTO media_assets (camp_id, media_kind, relative_path, mime_type, byte_size, width_px, height_px, sha256, uploaded_by)
       VALUES (?, 'GALLERY', 'BDC Camp 2026/gallery/sample-photo.webp', 'image/webp', 10240, 800, 600, UNHEX(SHA2('sample-photo', 256)), ?)`,
      [camp2026Id, adminId]
    );
    let assetId = assetRes.insertId;
    if (!assetId) {
      const [[existingAsset]] = await pool.query("SELECT id FROM media_assets WHERE relative_path = 'BDC Camp 2026/gallery/sample-photo.webp'");
      assetId = existingAsset ? existingAsset.id : null;
    }

    if (assetId) {
      const samplePhotos = [
        { category: 'Donors', alt: 'Voluntary student donor receiving health screening', order: 1 },
        { category: 'Donors', alt: 'Blood donation in progress in air-conditioned medical ward', order: 2 },
        { category: 'Team', alt: 'Student coordinators managing reception registration desks', order: 3 },
        { category: 'Setup', alt: 'Medical beds and sterile donation equipment setup', order: 4 },
        { category: 'Awareness', alt: 'Campus blood donation awareness rally and placards', order: 5 },
        { category: 'Highlights', alt: 'Director and medical superintendents inaugurating camp', order: 6 },
        { category: 'Donors', alt: 'Certificate presentation to voluntary blood donors', order: 7 },
        { category: 'Team', alt: 'Group photograph of volunteer coordination team', order: 8 }
      ];

      for (const p of samplePhotos) {
        await pool.query(
          `INSERT INTO gallery_photos (camp_id, asset_id, category, alt_text, caption, is_visible, sort_order, created_by, updated_by)
           VALUES (?, ?, ?, ?, ?, TRUE, ?, ?, ?)`,
          [camp2026Id, assetId, p.category, p.alt, p.alt, p.order, adminId, adminId]
        );
      }
      console.log('[seed] Seeded 8 gallery photos for camp 2026');
    }
  }

  // 9. Seed Global CMS Publications & Published Revisions
  const areas = ['HOMEPAGE', 'SECTIONS', 'NOTICES', 'FAQ', 'CONTACT'];

  const { FAQ_DATA } = require('../../frontend/src/data/faqData.js');

  const cmsPayloads = {
    HOMEPAGE: {
      hero: {
        eyebrow: 'SKIT JAIPUR · BLOOD DONATION CAMPAIGN',
        headline: 'Donate blood.\nCarry hope.',
        description: 'A small act from you can give someone a second chance at life.',
        primaryCtaLabel: 'Register Now',
        secondaryCtaLabel: 'Our Journey',
        secondaryCtaUrl: '/about',
        slides: [
          {
            id: 1,
            image_url: '/assets/A01-home-hero-donor-v2.webp',
            alt: 'Student donating blood at SKIT Blood Donation Camp',
            focalPosition: 'right 20%',
            order: 1
          }
        ]
      },
      about: {
        eyebrow: 'ABOUT BDC',
        headline: 'A student initiative for a healthier tomorrow.',
        description: 'The Blood Donation Campaign (BDC) at SKIT is a student-driven initiative to create awareness about voluntary blood donation and to contribute towards a healthier, stronger community.',
        ctaLabel: 'Discover BDC',
        ctaUrl: '/about',
        imageUrl: '/assets/A01-home-hero-donor-v2.webp'
      },
      impact: {
        bloodUnits: 1200,
        donorsCount: 2500,
        campsCount: 24,
        bannerUrl: '/assets/bdc_impact_slightly_bright_webp.webp'
      },
      inspiration: {
        sectionLabel: 'Our Inspiration',
        name: 'Swami Keshvanand',
        description: 'A legacy of education, selfless service and community upliftment.',
        closingStatement: 'Values for a Better Tomorrow.',
        slogansLeft: 'Education, Service, Society, Self Reliance',
        slogansRight: 'Individual, Development, Leads To, A Stronger, Nation',
        portraitUrl: '/assets/inspiration_swamiji.png'
      },
      ctaBand: {
        eyebrow: 'BE A LIFESAVER',
        headline1: 'Your one small act.',
        headline2: 'Someone’s tomorrow.',
        buttonLabel: 'Register Now'
      }
    },

    SECTIONS: {
      sections: [
        { key: 'hero', label: 'Hero Banner', visible: true, order: 1 },
        { key: 'featured_camp', label: 'Camp Schedule & Venue Banner', visible: true, order: 2 },
        { key: 'about', label: 'About BDC Narrative', visible: true, order: 3 },
        { key: 'impact', label: 'Verified Impact Numbers', visible: true, order: 4 },
        { key: 'gallery', label: 'Photo Highlights Carousel', visible: true, order: 5 },
        { key: 'team', label: 'Chief Coordinators & Members', visible: true, order: 6 },
        { key: 'sponsors', label: 'Medical Partners & Sponsors', visible: true, order: 7 },
        { key: 'inspiration', label: 'Swami Keshvanand Tribute', visible: true, order: 8 },
        { key: 'faq', label: 'Top Questions (FAQ)', visible: true, order: 9 },
        { key: 'registration_cta', label: 'Call to Action Strip', visible: true, order: 10 }
      ]
    },

    NOTICES: {
      items: [
        {
          id: 1,
          text: 'BDC 2026 registration is now open! Join us at the Central Amphitheatre on 15 October 2026.',
          linkLabel: 'Register Now',
          linkUrl: '/register',
          visible: true,
          order: 1,
          expiresAt: null
        }
      ]
    },

    FAQ: {
      items: FAQ_DATA
    },

    CONTACT: {
      siteTitle: 'SKIT Blood Donation Campaign',
      phone: '+91 141 3500300',
      email: 'bdc@skit.ac.in',
      address: 'Swami Keshvanand Institute of Technology, Management & Gramothan (SKIT), Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017',
      mapEmbedUrl: 'https://maps.google.com/maps?q=SKIT+Jaipur&t=&z=15&ie=UTF8&iwloc=&output=embed',
      footerTagline: 'A student initiative for a healthier, stronger tomorrow.',
      socialLinks: [
        { id: 1, label: 'Facebook', url: 'https://facebook.com/skitjaipur', order: 1 },
        { id: 2, label: 'Instagram', url: 'https://instagram.com/skitjaipur', order: 2 },
        { id: 3, label: 'X (Twitter)', url: '', order: 3 },
        { id: 4, label: 'YouTube', url: 'https://youtube.com/skitjaipur', order: 4 }
      ]
    }
  };

  for (const area of areas) {
    const [[pubRow]] = await pool.query('SELECT * FROM cms_publications WHERE area = ?', [area]);
    if (!pubRow || !pubRow.published_revision_id) {
      // Create initial revision #1
      const payloadStr = JSON.stringify(cmsPayloads[area]);
      const [revRes] = await pool.query(
        `INSERT INTO cms_revisions (area, revision_number, payload, created_by, updated_by)
         VALUES (?, 1, ?, ?, ?)`,
        [area, payloadStr, adminId, adminId]
      );
      const revId = revRes.insertId;

      // Update cms_publications to publish revision 1
      await pool.query(
        `UPDATE cms_publications
         SET published_revision_id = ?, draft_revision_id = NULL, row_version = row_version + 1, published_by = ?, published_at = NOW(6)
         WHERE area = ?`,
        [revId, adminId, area]
      );
      console.log(`[seed] Seeded and published CMS revision 1 for ${area}`);
    }
  }

  // 10. Sample contact message if inbox is empty
  const [[msgCount]] = await pool.query('SELECT COUNT(*) AS count FROM contact_messages');
  if (msgCount.count === 0) {
    const crypto = require('crypto');
    const subHash = crypto.createHash('sha256').update('sample_sub_1').digest();
    const payHash = crypto.createHash('sha256').update('sample_payload_1').digest();
    await pool.query(
      `INSERT INTO contact_messages (submission_key_hash, payload_hash, full_name, email, phone, subject, message)
       VALUES (?, ?, 'Rahul Sharma', 'rahul.s@example.com', '+91 98765 11111', 'Volunteering in BDC 2026', 'Hello team, I would like to volunteer for the upcoming camp coordination team. Please let me know the procedure.')`,
      [subHash, payHash]
    );
    console.log('[seed] Seeded 1 sample contact message');
  }

  console.log('[seed] ✅ Initial data successfully aligned with public website and seeded into MySQL!');
}

seedInitialData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] Error:', err);
    process.exit(1);
  });
