'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../src/db');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Remove obsolete website.sections
    await conn.query("DELETE FROM admin_permissions WHERE permission_key = 'website.sections'");
    await conn.query("DELETE FROM permission_definitions WHERE permission_key = 'website.sections'");

    // 2. Define standard catalogue
    const catalogue = [
      { key: 'camp.overview', scope: 'LIVE_CAMP', desc: 'View and manage live camp overview and configuration' },
      { key: 'camp.registrations', scope: 'LIVE_CAMP', desc: 'View, search, and export live camp donor registrations' },
      { key: 'camp.team', scope: 'LIVE_CAMP', desc: 'Manage current live camp team roster and visibility' },
      { key: 'camp.gallery', scope: 'LIVE_CAMP', desc: 'Manage current live camp gallery photos and visibility' },
      { key: 'camp.sponsors', scope: 'LIVE_CAMP', desc: 'Manage current live camp sponsors, partners, and visibility' },
      { key: 'website.homepage', scope: 'GLOBAL', desc: 'Edit and publish homepage hero, about, impact, and inspiration' },
      { key: 'website.about', scope: 'GLOBAL', desc: 'Edit and publish dedicated About page content and photos' },
      { key: 'website.notices', scope: 'GLOBAL', desc: 'Manage notices, ticker announcements, and alert banners' },
      { key: 'website.faq', scope: 'GLOBAL', desc: 'Manage shared FAQ questions, categories, and homepage display' },
      { key: 'website.contact', scope: 'GLOBAL', desc: 'Manage institutional contact info, social channels, and footer tagline' },
      { key: 'website.pages', scope: 'GLOBAL', desc: 'Edit headings, intros, and hero copy for Team, Gallery, and Supporters pages' },
      { key: 'website.registration_text', scope: 'GLOBAL', desc: 'Edit donor registration guidance, help copy, and instructions' },
      { key: 'inbox.read', scope: 'GLOBAL', desc: 'Inspect and mark contact inquiries as read' }
    ];

    for (const item of catalogue) {
      await conn.query(
        'INSERT INTO permission_definitions (permission_key, scope, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE scope = VALUES(scope), description = VALUES(description)',
        [item.key, item.scope, item.desc]
      );
    }

    // 3. Ensure cms_publications has rows for all areas
    const areas = [
      {
        area: 'ABOUT',
        payload: {
          hero: {
            eyebrow: 'About BDC',
            headline: 'A student initiative for a healthier tomorrow.',
            description: 'The Blood Donation Campaign at SKIT is a student-led initiative dedicated to spreading awareness and contributing towards a healthier, stronger community through voluntary blood donation.',
            heroPhotoUrl: ''
          },
          photos: [
            { id: 'about-photo-1', url: '', alt: 'Doctor and donor during blood donation', label: 'Camp Donor & Medical Care' },
            { id: 'about-photo-2', url: '', alt: 'Student volunteers managing registrations', label: 'Student Volunteer Coordination' },
            { id: 'about-photo-3', url: '', alt: 'BDC volunteer supporting donor initiative', label: 'BDC Volunteer Initiative' }
          ],
          story: {
            eyebrow: 'OUR STORY',
            headline: 'Built by students, for the community.',
            paragraph1: 'The Blood Donation Campaign (BDC) at SKIT is a student-driven initiative to create awareness about voluntary blood donation and to contribute towards a healthier, stronger community. What started as a single campus drive has grown into a recurring program, bringing together student coordinators, volunteers, and donors from across the institute.',
            paragraph2: 'Every camp is organised entirely by students — from outreach and registration to on-ground logistics and partner coordination — under the guidance of faculty advisors and NSS SKIT Jaipur. Through collective effort and compassion, BDC continues to inspire more people to donate blood and make a difference in the lives of those in need.'
          },
          values: {
            mission: { title: 'Our Mission', description: 'To create sustained awareness about voluntary blood donation and ensure a reliable, safe blood supply for the community around SKIT.' },
            vision: { title: 'Our Vision', description: 'A culture where regular voluntary blood donation is second nature to every eligible citizen, ensuring no life is lost due to blood shortage.' },
            values: { title: 'Our Values', description: 'Compassion, transparency, student leadership, and an unwavering commitment to safe, ethical, and voluntary donor care.' }
          },
          cta: {
            headline: 'Ready to make a difference?',
            description: 'Join hundreds of donors and volunteers in saving lives at the next BDC camp.',
            buttonLabel: 'Register to Donate',
            buttonUrl: '/register'
          }
        }
      },
      {
        area: 'PAGES',
        payload: {
          team: {
            eyebrow: 'ORGANIZING TEAM',
            title: 'The People Behind the Movement',
            description: 'Meet the faculty coordinators, student leads, and dedicated volunteers making this blood donation camp possible.',
            emptyMessage: 'Team roster for this camp is being finalized. Please check back shortly.'
          },
          gallery: {
            eyebrow: 'CAMP MEMORIES',
            title: 'Moments of Compassion & Service',
            description: 'A visual journey through past and present blood donation camps organized at SKIT Jaipur.',
            emptyMessage: 'Gallery photos will be published once camp activities commence.'
          },
          supporters: {
            eyebrow: 'PARTNERS & SPONSORS',
            title: 'Our Supporting Organizations',
            description: 'We are profoundly grateful to the healthcare institutions, blood banks, and community partners supporting BDC.',
            emptyMessage: 'Partner and supporter details will be announced soon.'
          }
        }
      },
      {
        area: 'REGISTRATION_TEXT',
        payload: {
          title: 'Voluntary Blood Donor Registration',
          description: 'Register in advance to reserve your preferred donation slot and expedite your on-campus verification.',
          eligibilityNotice: 'Donors must be between 18-65 years old, weigh at least 45 kg, and be in good general health.',
          helpText: 'Having trouble registering? Reach out to the student coordinators or visit the helpdesk at Central Amphitheatre on camp day.'
        }
      }
    ];

    for (const item of areas) {
      const [[existing]] = await conn.query('SELECT * FROM cms_publications WHERE area = ?', [item.area]);
      if (!existing) {
        const [revRes] = await conn.query(
          'INSERT INTO cms_revisions (area, revision_number, payload, created_by, updated_by) VALUES (?, 1, ?, 2, 2)',
          [item.area, JSON.stringify(item.payload)]
        );
        await conn.query(
          'INSERT INTO cms_publications (area, published_revision_id, draft_revision_id, row_version, published_by, published_at) VALUES (?, ?, NULL, 1, 2, NOW(6))',
          [item.area, revRes.insertId]
        );
        console.log('Created cms_publication for', item.area);
      }
    }

    await conn.commit();
    console.log('SUCCESS: Permission catalogue and CMS publications updated.');
    conn.release();
    process.exit(0);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Migration failed with error:', err);
    process.exit(1);
  }
}

migrate();
