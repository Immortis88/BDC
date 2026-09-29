-- BDC independent rebuild: fresh schema, not an old-project migration.
-- Target: MySQL 8.0.16+ (CHECK constraints enforced), InnoDB, utf8mb4.
-- Import into an EMPTY database selected in cPanel/phpMyAdmin or your client.
-- No CREATE DATABASE, USE, DROP, DEFINER, credentials, real donors or sample camps.
-- No archive/completed lifecycle, Aadhaar, roll number, registration deletion,
-- donor directory, certificate, import batch, outbound-message or media-library UI.
-- Database structure alone does not implement API permissions or folder creation.
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE admins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN','REGULAR_ADMIN') NOT NULL DEFAULT 'REGULAR_ADMIN',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  session_version INT UNSIGNED NOT NULL DEFAULT 1,
  last_login_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_admin_email (email),
  CONSTRAINT ck_admin_enabled CHECK (is_enabled IN (0,1)),
  CONSTRAINT ck_admin_password_change CHECK (must_change_password IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permission_definitions (
  permission_key VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  scope ENUM('GLOBAL','LIVE_CAMP') NOT NULL,
  description VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_permissions (
  admin_id BIGINT UNSIGNED NOT NULL,
  permission_key VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  granted_by BIGINT UNSIGNED NOT NULL,
  granted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (admin_id, permission_key),
  CONSTRAINT fk_grant_admin FOREIGN KEY (admin_id) REFERENCES admins(id),
  CONSTRAINT fk_grant_permission FOREIGN KEY (permission_key) REFERENCES permission_definitions(permission_key),
  CONSTRAINT fk_grant_actor FOREIGN KEY (granted_by) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT UNSIGNED NOT NULL,
  token_hash BINARY(32) NOT NULL,
  session_version INT UNSIGNED NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  revoked_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_session_token (token_hash),
  KEY ix_session_expiry (expires_at),
  CONSTRAINT fk_session_admin FOREIGN KEY (admin_id) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE camps (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  camp_year SMALLINT UNSIGNED NOT NULL,
  internal_name VARCHAR(120) NOT NULL,
  public_title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  camp_date DATE NOT NULL,
  starts_at TIME NOT NULL,
  ends_at TIME NOT NULL,
  timezone_name VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  venue VARCHAR(500) NOT NULL,
  venue_subtitle VARCHAR(200) NULL,
  registration_open BOOLEAN NOT NULL DEFAULT FALSE,
  media_folder VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  storage_state ENUM('PENDING','READY','ERROR') NOT NULL DEFAULT 'PENDING',
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at DATETIME(6) NULL DEFAULT NULL,
  UNIQUE KEY uq_camp_folder (media_folder),
  CONSTRAINT fk_camp_creator FOREIGN KEY (created_by) REFERENCES admins(id),
  CONSTRAINT fk_camp_editor FOREIGN KEY (updated_by) REFERENCES admins(id),
  CONSTRAINT ck_camp_year CHECK (camp_year BETWEEN 1990 AND 2199),
  CONSTRAINT ck_camp_registration CHECK (registration_open IN (0,1)),
  CONSTRAINT ck_camp_time CHECK (ends_at > starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exactly one possible live reference. NULL means no camp is live.
-- Live/not-live is derived from this pointer, never another per-camp boolean.
CREATE TABLE site_state (
  id TINYINT UNSIGNED PRIMARY KEY,
  live_camp_id BIGINT UNSIGNED NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT ck_site_singleton CHECK (id = 1),
  CONSTRAINT fk_site_live FOREIGN KEY (live_camp_id) REFERENCES camps(id),
  CONSTRAINT fk_site_editor FOREIGN KEY (updated_by) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE camp_page_visibility (
  camp_id BIGINT UNSIGNED NOT NULL,
  page_key ENUM('team','gallery','sponsors','registration') NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (camp_id, page_key),
  CONSTRAINT fk_visibility_camp FOREIGN KEY (camp_id) REFERENCES camps(id),
  CONSTRAINT fk_visibility_actor FOREIGN KEY (updated_by) REFERENCES admins(id),
  CONSTRAINT ck_page_visible CHECK (is_visible IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A technical file-reference table, not a global Media Library feature.
-- relative_path is relative to backend/asset/Image, e.g.
-- BDC Camp 2026/team/<server-generated-uuid>.webp
CREATE TABLE media_assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  camp_id BIGINT UNSIGNED NULL,
  media_kind ENUM('TEAM','GALLERY','SPONSOR','HERO','SITE') NOT NULL,
  relative_path VARCHAR(500) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  mime_type VARCHAR(80) NOT NULL,
  byte_size BIGINT UNSIGNED NOT NULL,
  width_px INT UNSIGNED NOT NULL,
  height_px INT UNSIGNED NOT NULL,
  sha256 BINARY(32) NOT NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_asset_path (relative_path),
  KEY ix_asset_camp (camp_id, media_kind),
  CONSTRAINT fk_asset_camp FOREIGN KEY (camp_id) REFERENCES camps(id),
  CONSTRAINT fk_asset_actor FOREIGN KEY (uploaded_by) REFERENCES admins(id),
  CONSTRAINT ck_asset_dimensions CHECK (width_px > 0 AND height_px > 0 AND byte_size > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE team_members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  camp_id BIGINT UNSIGNED NOT NULL,
  group_key ENUM('CHIEF_COORDINATOR','MEMBERS','STUDENT_COORDINATORS','WEBSITE_TEAM') NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  role_label VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(254) NULL,
  photo_asset_id BIGINT UNSIGNED NULL,
  photo_alt VARCHAR(255) NULL,
  show_phone_publicly BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_team_public (camp_id, is_visible, group_key, sort_order, id),
  CONSTRAINT fk_team_camp FOREIGN KEY (camp_id) REFERENCES camps(id),
  CONSTRAINT fk_team_asset FOREIGN KEY (photo_asset_id) REFERENCES media_assets(id),
  CONSTRAINT fk_team_creator FOREIGN KEY (created_by) REFERENCES admins(id),
  CONSTRAINT fk_team_editor FOREIGN KEY (updated_by) REFERENCES admins(id),
  CONSTRAINT ck_team_visibility CHECK (is_visible IN (0,1) AND show_phone_publicly IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sponsor_sections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  camp_id BIGINT UNSIGNED NOT NULL,
  heading VARCHAR(200) NOT NULL,
  description TEXT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_sponsor_section (camp_id, is_visible, sort_order, id),
  CONSTRAINT fk_section_camp FOREIGN KEY (camp_id) REFERENCES camps(id),
  CONSTRAINT fk_section_creator FOREIGN KEY (created_by) REFERENCES admins(id),
  CONSTRAINT fk_section_editor FOREIGN KEY (updated_by) REFERENCES admins(id),
  CONSTRAINT ck_sponsor_section_visible CHECK (is_visible IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sponsors (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  logo_asset_id BIGINT UNSIGNED NULL,
  logo_alt VARCHAR(255) NULL,
  website_url VARCHAR(1000) NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_sponsor_order (section_id, is_visible, sort_order, id),
  CONSTRAINT fk_sponsor_section FOREIGN KEY (section_id) REFERENCES sponsor_sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_sponsor_logo FOREIGN KEY (logo_asset_id) REFERENCES media_assets(id),
  CONSTRAINT fk_sponsor_creator FOREIGN KEY (created_by) REFERENCES admins(id),
  CONSTRAINT fk_sponsor_editor FOREIGN KEY (updated_by) REFERENCES admins(id),
  CONSTRAINT ck_sponsor_visible CHECK (is_visible IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gallery_photos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  camp_id BIGINT UNSIGNED NOT NULL,
  asset_id BIGINT UNSIGNED NOT NULL,
  category ENUM('Donors','Team','Setup','Awareness','Highlights') NOT NULL,
  alt_text VARCHAR(255) NOT NULL,
  caption VARCHAR(500) NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_gallery_public (camp_id, is_visible, sort_order, id),
  KEY ix_gallery_category (camp_id, category, is_visible),
  CONSTRAINT fk_gallery_camp FOREIGN KEY (camp_id) REFERENCES camps(id),
  CONSTRAINT fk_gallery_asset FOREIGN KEY (asset_id) REFERENCES media_assets(id),
  CONSTRAINT fk_gallery_creator FOREIGN KEY (created_by) REFERENCES admins(id),
  CONSTRAINT fk_gallery_editor FOREIGN KEY (updated_by) REFERENCES admins(id),
  CONSTRAINT ck_gallery_visible CHECK (is_visible IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lock this row in the same transaction as duplicate check + allocation + insert.
CREATE TABLE registration_counters (
  camp_id BIGINT UNSIGNED PRIMARY KEY,
  next_sequence BIGINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_counter_camp FOREIGN KEY (camp_id) REFERENCES camps(id),
  CONSTRAINT ck_counter_positive CHECK (next_sequence > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE registrations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  camp_id BIGINT UNSIGNED NOT NULL,
  sequence_number BIGINT UNSIGNED NOT NULL,
  registration_code VARCHAR(48) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  guardian_name VARCHAR(160) NOT NULL,
  date_of_birth DATE NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-','UNKNOWN') NOT NULL,
  email VARCHAR(254) NOT NULL,
  participant_type ENUM('STUDENT','STAFF_MEMBER','OUTSIDE_SKIT') NOT NULL,
  branch VARCHAR(100) NULL,
  college_id VARCHAR(80) NULL,
  employee_id VARCHAR(80) NULL,
  mobile VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  address TEXT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_version VARCHAR(40) NOT NULL,
  consented_at DATETIME(6) NOT NULL,
  duplicate_fingerprint BINARY(32) NOT NULL,
  outcome ENUM('DONATED','NOT_DONATED') NOT NULL DEFAULT 'NOT_DONATED',
  not_donated_reason VARCHAR(500) NULL,
  outcome_updated_by BIGINT UNSIGNED NULL,
  outcome_updated_at DATETIME(6) NULL,
  donated_at DATETIME(6) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_registration_code (registration_code),
  UNIQUE KEY uq_registration_sequence (camp_id, sequence_number),
  UNIQUE KEY uq_registration_camp_id (camp_id, id),
  KEY ix_registration_duplicate (camp_id, duplicate_fingerprint),
  KEY ix_registration_mobile (camp_id, mobile),
  KEY ix_registration_college (camp_id, college_id),
  KEY ix_registration_list (camp_id, outcome, created_at, id),
  CONSTRAINT fk_registration_camp FOREIGN KEY (camp_id) REFERENCES camps(id) ON DELETE RESTRICT,
  CONSTRAINT fk_registration_actor FOREIGN KEY (outcome_updated_by) REFERENCES admins(id),
  CONSTRAINT ck_registration_consent CHECK (consent_given = 1),
  CONSTRAINT ck_registration_category_fields CHECK (
    (participant_type = 'STUDENT' AND college_id IS NOT NULL AND CHAR_LENGTH(TRIM(college_id)) > 0
      AND branch IS NOT NULL AND CHAR_LENGTH(TRIM(branch)) > 0 AND employee_id IS NULL)
    OR (participant_type = 'STAFF_MEMBER' AND employee_id IS NOT NULL AND CHAR_LENGTH(TRIM(employee_id)) > 0
      AND college_id IS NULL)
    OR (participant_type = 'OUTSIDE_SKIT' AND college_id IS NULL AND employee_id IS NULL AND branch IS NULL)
  ),
  CONSTRAINT ck_registration_sequence CHECK (sequence_number > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE registration_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  camp_id BIGINT UNSIGNED NOT NULL,
  attempt_key_hash BINARY(32) NOT NULL,
  payload_hash BINARY(32) NOT NULL,
  state ENUM('PROCESSING','SUCCEEDED','ASSISTANCE_REQUIRED','FAILED') NOT NULL,
  registration_id BIGINT UNSIGNED NULL,
  expires_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_attempt_key (attempt_key_hash),
  KEY ix_attempt_expiry (expires_at),
  CONSTRAINT fk_attempt_camp FOREIGN KEY (camp_id) REFERENCES camps(id),
  CONSTRAINT fk_attempt_registration FOREIGN KEY (camp_id, registration_id) REFERENCES registrations(camp_id, id),
  CONSTRAINT ck_attempt_result CHECK (
    (state = 'SUCCEEDED' AND registration_id IS NOT NULL)
    OR (state <> 'SUCCEEDED' AND registration_id IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE registration_match_flags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  camp_id BIGINT UNSIGNED NOT NULL,
  registration_id BIGINT UNSIGNED NOT NULL,
  candidate_id BIGINT UNSIGNED NOT NULL,
  match_kind ENUM('SHARED_PHONE','SHARED_EMAIL','PARTIAL_COMPOSITE') NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_match_flag (registration_id, candidate_id, match_kind),
  CONSTRAINT fk_flag_camp FOREIGN KEY (camp_id) REFERENCES camps(id),
  CONSTRAINT fk_flag_registration FOREIGN KEY (camp_id, registration_id) REFERENCES registrations(camp_id, id),
  CONSTRAINT fk_flag_candidate FOREIGN KEY (camp_id, candidate_id) REFERENCES registrations(camp_id, id),
  CONSTRAINT ck_flag_distinct CHECK (registration_id <> candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Independent revision sets prevent one Website permission publishing another
-- module's unfinished draft. Public endpoints join cms_publications only.
CREATE TABLE cms_revisions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  area ENUM('HOMEPAGE','SECTIONS','NOTICES','FAQ','CONTACT') NOT NULL,
  revision_number BIGINT UNSIGNED NOT NULL,
  payload JSON NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_cms_area_version (area, revision_number),
  UNIQUE KEY uq_cms_area_id (area, id),
  CONSTRAINT fk_cms_creator FOREIGN KEY (created_by) REFERENCES admins(id),
  CONSTRAINT fk_cms_editor FOREIGN KEY (updated_by) REFERENCES admins(id),
  CONSTRAINT ck_cms_revision CHECK (revision_number > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cms_publications (
  area ENUM('HOMEPAGE','SECTIONS','NOTICES','FAQ','CONTACT') PRIMARY KEY,
  published_revision_id BIGINT UNSIGNED NULL,
  draft_revision_id BIGINT UNSIGNED NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  published_by BIGINT UNSIGNED NULL,
  published_at DATETIME(6) NULL,
  CONSTRAINT fk_publication_revision FOREIGN KEY (area, published_revision_id) REFERENCES cms_revisions(area, id),
  CONSTRAINT fk_publication_draft FOREIGN KEY (area, draft_revision_id) REFERENCES cms_revisions(area, id),
  CONSTRAINT fk_publication_actor FOREIGN KEY (published_by) REFERENCES admins(id),
  CONSTRAINT ck_cms_separate_versions CHECK (
    published_revision_id IS NULL OR draft_revision_id IS NULL OR published_revision_id <> draft_revision_id
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cms_revision_assets (
  revision_id BIGINT UNSIGNED NOT NULL,
  asset_id BIGINT UNSIGNED NOT NULL,
  slot_key VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (revision_id, slot_key),
  CONSTRAINT fk_revision_asset_revision FOREIGN KEY (revision_id) REFERENCES cms_revisions(id),
  CONSTRAINT fk_revision_asset_file FOREIGN KEY (asset_id) REFERENCES media_assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_key_hash BINARY(32) NOT NULL,
  payload_hash BINARY(32) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(30) NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_contact_attempt (submission_key_hash),
  KEY ix_contact_date (created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional read indication only; no reply, assignment or resolution workflow.
CREATE TABLE contact_message_reads (
  message_id BIGINT UNSIGNED NOT NULL,
  admin_id BIGINT UNSIGNED NOT NULL,
  first_read_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (message_id, admin_id),
  CONSTRAINT fk_read_message FOREIGN KEY (message_id) REFERENCES contact_messages(id),
  CONSTRAINT fk_read_admin FOREIGN KEY (admin_id) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_admin_id BIGINT UNSIGNED NULL,
  camp_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  entity_type VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  entity_id VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL,
  request_id VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL,
  details JSON NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY ix_audit_camp_time (camp_id, created_at, id),
  KEY ix_audit_actor_time (actor_admin_id, created_at, id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_admin_id) REFERENCES admins(id),
  CONSTRAINT fk_audit_camp FOREIGN KEY (camp_id) REFERENCES camps(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_state (id) VALUES (1);
INSERT INTO cms_publications (area) VALUES ('HOMEPAGE'),('SECTIONS'),('NOTICES'),('FAQ'),('CONTACT');
INSERT INTO permission_definitions (permission_key, scope, description) VALUES
('camp.overview', 'LIVE_CAMP', 'View and manage the current live camp overview; cannot switch live camp'),
('camp.team', 'LIVE_CAMP', 'Manage current live camp team and its page visibility'),
('camp.gallery', 'LIVE_CAMP', 'Manage current live camp gallery and its page visibility'),
('camp.sponsors', 'LIVE_CAMP', 'Manage current live camp sponsor sections and page visibility'),
('camp.registrations', 'LIVE_CAMP', 'View, export and update current live camp registrations'),
('camp.registrations.view', 'LIVE_CAMP', 'View/search current live camp registrations'),
('camp.registrations.export', 'LIVE_CAMP', 'Export current live camp registrations'),
('site.switch_live_camp', 'GLOBAL', 'Select or clear the live camp when expressly granted by Super Admin'),
('website.homepage', 'GLOBAL', 'Edit/preview/publish global hero, impact and Inspiration content'),
('website.sections', 'GLOBAL', 'Edit/preview/publish global homepage order and visibility'),
('website.notices', 'GLOBAL', 'Edit/preview/publish global notices'),
('website.faq', 'GLOBAL', 'Edit/preview/publish shared FAQ content'),
('website.contact', 'GLOBAL', 'Edit/preview/publish global institutional/footer settings'),
('inbox.read', 'GLOBAL', 'Read incoming contact messages');
-- No grants or admin accounts are seeded. Bootstrap Super Admin separately.
-- No registration update/delete grant: clarify outcome handling before adding it.

-- Global preferences deliberately have no camp foreign key.
CREATE TABLE IF NOT EXISTS website_team_preferences (member_key VARCHAR(64) PRIMARY KEY, show_phone_publicly BOOLEAN NOT NULL DEFAULT FALSE) ENGINE=InnoDB;
