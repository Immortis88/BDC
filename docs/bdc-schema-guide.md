# BDC MySQL schema and backend implementation contract

Prepared 25 September 2026. Companion: `bdc-schema.sql` and the updated `review-revised.md`. This is a fresh database design based on the new public frontend and the latest decisions. It does not copy the old MongoDB schema. It does not implement a running backend or provision a database.

## Current decisions and source evidence

Inspected `C:\Users\bhara\Downloads\BDC\src\pages\RegisterPage.jsx`, `ContactPage.jsx`, `TeamPublicPage.jsx`, `SupportersPage.jsx`, `GalleryPage.jsx`, `HomePage.jsx`, `src/constants/index.js`, `src/mock/mockData.js`, and `src/data/faqData.js`.

The new frontend currently uses local mock/static data. Its Register form still contains the now-excluded Aadhaar field, required Address and combined Student Roll/College ID label; its Staff branch behavior also predates the accepted student-only rule. Those observations are not requirements to preserve. The approved changes must override them during implementation.

Remaining form fields are preserved: full name, guardian name, date of birth, blood group (including UNKNOWN), email, participant category, mobile and consent. Email is required in the inspected current form. Student College ID is required; Staff Employee ID remains required because the user said other fields stay the same. Branch is only required for students. Outside SKIT has neither institutional ID nor branch. Address may be null/blank. No Aadhaar or separate roll-number column exists.

User decisions in the latest message:

- Regular admin camp permissions apply only to whichever camp is live/featured at request time, not all camps or a permanently assigned camp.
- Team/Gallery/Sponsor publishing behavior delegated to the assistant: Save updates live eligible content; use explicit page/entry visibility. Global Website content retains separate draft/preview/publish per module.
- Camp lifecycle is Live / Not live only. No archive, completed state or lifecycle publish workflow. Registration Open / Closed remains a separate manual switch.
- Admin setup accepted in principle; use the already accepted temporary-password onboarding, forced first-login change, login rate limiting and last-Super-Admin protection. Exact runtime/session/recovery details are not approved merely by the user's 'yes'.
- No registration deletion. Export is included. The user's question about details/outcome means whether to allow corrections and continue status controls needs clarification; SQL supports the three already agreed outcomes without seeding update permissions.
- Homepage Team displays Chief Coordinators and Members only. Sponsor strip displays eligible logos from all sponsor sections, in section then sponsor order.
- Inbox reads messages only; no reply, assignment, resolved workflow or message deletion controls.
- MySQL locally, export/import into cPanel MySQL later. Images are backend files under `asset/Image`, with automatically created year/camp folders such as `BDC Camp 2026`.

## Import and compatibility

Use MySQL 8.0.16 or newer. Tables use InnoDB, utf8mb4 and utf8mb4_unicode_ci; no server-specific database name, CREATE USER/GRANT, DEFINER, stored routines, triggers, real people or dummy credentials are included. Import into an empty database selected in your SQL client/phpMyAdmin. Do not rerun a partially failed import blindly; DDL is not an all-or-nothing migration. This file deliberately does not DROP existing tables or hide incompatible existing tables with IF NOT EXISTS.

Check the actual local and cPanel database versions before implementation/deployment. A cPanel installation may provide a different engine/version; availability has not been verified. Do not remove constraint enforcement to make an older server appear compatible. MySQL before 8.0.16 did not enforce these CHECK rules. See [MySQL CHECK constraints](https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html) and [foreign keys](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html).

The SQL has been structurally checked, but has not been imported into a live MySQL server in this task; no MySQL executable was found in PATH. A real empty-database import and constraint tests are required before calling it production-ready.

## Tables and relationships

| Tables | Purpose / relationship |
|---|---|
| admins | Super Admin and regular admin accounts; hashed passwords, disable state, first-login change and session revocation version |
| permission_definitions, admin_permissions | Individual global and live-camp grants; no grantable Admins & Roles permission |
| admin_sessions | Hashed expiring session tokens; no raw session secrets in SQL |
| camps | One record per year, Overview fields, manual registration flag and file-provisioning state |
| site_state | One singleton row; nullable live_camp_id selects the only live camp |
| camp_page_visibility | Each camp's Team/Gallery/Sponsors/Registration visibility settings |
| media_assets | Technical references to image files on the backend; not a shared content-directory UI |
| team_members | Camp-owned grouped roster with ordering, portrait and explicit public-phone flag |
| sponsor_sections → sponsors | Camp-owned arbitrary sections and ordered sponsors; section deletion cascades only its sponsors |
| gallery_photos | Camp-owned ordered photos with categories, caption/alt and visibility |
| registration_counters | Per-camp sequence allocation and registration concurrency lock |
| registrations | Current approved form fields and the three outcome values; no deletion field or cascade from camps |
| registration_attempts | Retry identity and result reference, scoped to the same camp as its registration |
| registration_match_flags | Private possible-match pairs within the same camp; no public lookup |
| cms_revisions → cms_publications | Global per-area draft and published snapshots; separate areas protect granular Website permissions |
| cms_revision_assets | Concrete foreign-key references for images used by snapshots, preventing orphan cleanup from deleting referenced images |
| contact_messages → contact_message_reads | Incoming immutable message content and optional per-admin first-read indication |
| audit_events | Permission, live-camp switch and approved operational events; no raw form bodies or credentials |

Relationships use numeric IDs and foreign keys. JSON is restricted to structured global CMS snapshots and audit metadata; camp operational entities remain relational. The small FAQ/notice datasets are versioned inside their own CMS snapshots rather than duplicated between Home and their full-page representations. There is deliberately no separate per-camp homepage, global donor, Donation, import or certificate table.

## Global CMS payload contract

The backend must validate the JSON shape, lengths and URLs for each area; MySQL JSON alone only validates JSON syntax. Reject fields from another area. A revision's area is immutable. Published revisions are immutable; edit by creating a new draft, never overwriting the current published row. Lock the area's cms_publications row when allocating revision numbers or publishing; compare row_version to reject stale edits. Publishing one area cannot publish another area's draft.

| Area | Required payload shape |
|---|---|
| HOMEPAGE | `hero: {eyebrow, headline, description, primaryCtaLabel, secondaryCtaLabel, secondaryCtaUrl, slides:[{id,assetId,alt,focalPosition,order}]}`; `impact:{bloodUnits,donorsCount,campsCount}` nonnegative manual totals; `inspiration:{heading,narrative}`. Static About/artwork remains frontend-owned initially. |
| SECTIONS | `sections:[{key,order,visible}]`, allowed keys: hero, featured_camp, about, impact, gallery, team, sponsors, inspiration, faq, registration_cta. No arbitrary page-builder markup. Preserve shared Navbar/Footer outside this reorder list. |
| NOTICES | `items:[{id,text,linkLabel,linkUrl,visible,order,expiresAt}]`. Expiry nullable; enforce at public read time, independent of cron. No start scheduling/pinning added. |
| FAQ | `items:[{id,question,answerTemplate,category,order,isActive,showOnHome}]`; category general/donation; allow only explicitly supported tokens for live-camp date/time/venue and global contact details. No raw executable templates/HTML. |
| CONTACT | `siteTitle,phone,email,address,mapEmbedUrl,footerTagline,socialLinks:[{id,label,url,order}]`. Map is a validated URL, not arbitrary iframe HTML. |

A draft save also updates cms_revision_assets in the same transaction. Every managed assetId embedded in a payload must have its slot reference recorded. Do not allow a private global asset to be exposed merely by guessing a storage path. Never seed fabricated camp dates, staff identities, historical totals or unverified FAQ answers as production truth. Seed the existing UI content deliberately after review.

FAQ Home source: published FAQ snapshot → active eligible General questions in order → first five. Full FAQ uses that same snapshot, grouped by category. Camp-dependent tokens read current site_state; use a plain no-live-camp fallback rather than stale dates. FAQ global visibility does not depend on camp Gallery/Team visibility.

## Live camp and permissions

For every camp API request, including reads/exports, check session validity, account enabled state, permission, and that requested camp_id equals the current site_state.live_camp_id for regular admins. Super Admin can manage historical/preparation camps. No cached JWT camp ID or old browser workspace selection can override the current pointer.

For mutations, lock/read site_state in the transaction before checking camp scope, and keep consistent lock order. A request authorized against an old live pointer must not commit silently after a conflicting switch. Reject and refresh when the live-camp/version has changed. When there is no live camp, regular camp grants allow no camp access. Global grants still work.

Live switching is a separate global grant; a delegated switcher can see the minimal camp list necessary to choose a camp, not all older donor records. Switching to a camp locks site_state, checks the special permission and storage readiness, closes registration on the previous live camp, changes the pointer, and records the audit event atomically. Switching away never deletes data. A newly selected camp stays registration-closed until deliberately opened. Clearing the pointer makes every camp Not live and closes the outgoing camp's registration.

The public homepage displays only the live camp's team/gallery/sponsors. For a linked homepage section, the global section flag AND the selected camp page flag must both permit it. A global OFF hides only the preview, not the full page. A camp page OFF hides that page's content and preview. Keep image/empty fallbacks.

Preserve the separately confirmed Past Galleries feature: Not live means not featured; it is not an archive/delete state. Past photos may appear only when that camp's Gallery visibility and each image visibility are ON. A newly created camp should start Gallery visibility OFF so preparation images do not unintentionally appear as a past gallery. Explicitly enabling it is the publication action for this module. This interpretation retains the user's earlier past-gallery decision; no separate camp is_published state is introduced.

Homepage Team query: live camp + page visible + entry visible + group in CHIEF_COORDINATOR/MEMBERS, in group order then sort_order/id. Do not hardcode only the first four Members if additional members exist; preserve the current centered responsive layout. Sponsor strip: live camp + Sponsors page visible + each section visible + sponsor visible, all sections ordered then all logos within each section. Broken logos use text fallback; empty sections disappear. No extra show-on-home toggle is needed for these selections.

## Registration and no-deletion enforcement

No registration DELETE route, button, soft-delete field, purge task or cascade exists. The application's SQL account should not have DELETE on registrations. Foreign-key RESTRICT prevents parent deletion from erasing donor records; it does not itself prevent an administrator with database-owner privileges from deleting a child. Avoid using the database-owner account as the app runtime account. Privileges must be set for the actual deployment account, not hardcoded in this portable DDL.

Normal export includes allowed registration fields, optional Address and student College ID/staff Employee ID; no Aadhaar or Student Roll No. Build export selection on the same permission-filtered query as the list; do not accept arbitrary SQL or client-authorized camp IDs. Exact CSV/XLSX formatting remains an implementation detail; escape formula-like values in spreadsheet exports.

The previously agreed outcome schema remains PENDING/DONATED/NOT_DONATED with a reason for NOT_DONATED. The latest phrase 'only export' may mean no other row actions. Consequently no outcome-update permission is seeded and no correction workflow is authorized merely because columns exist. Clarify this before wiring status controls. Submitted personal details are read-only until explicitly approved otherwise.

Registration creation transaction: validate form and minimum age, recheck live/open/page visibility → lock site_state then camp registration_counters → resolve attempt key and payload hash → compare the normalized three-field fingerprint in that camp → either return generic assistance, or allocate sequence/create record/record attempt → commit. Required email is confirmed from the current form. Fingerprint is a server-keyed HMAC of the defined normalized name/mobile/email tuple; personal values and raw payloads must not enter logs. The key is configured on the server and backed up securely; it is not a new donor identity field.

A phone or email alone never has a UNIQUE constraint. College ID is not silently made a dedup key: the prior matching rule stays unchanged. On a strong match no existing details or receipt are revealed; no public Yes/No override. Partial matches may be recorded privately. Attempt-key possession grants only the immediate limited submission context, not lookup using someone else's personal details. Old sessionStorage receipt auto-restore must not expose the previous donor on shared devices.

## Backend image folders and automatic creation

```text
backend/
  asset/
    Image/
      Global/
        hero/
        site/
      BDC Camp 2026/
        team/
        gallery/
        sponsors/
      BDC Camp 2027/
        team/
        gallery/
        sponsors/
```

Use exactly `asset/Image` (singular asset, capital I) so Linux deployment does not break casing. Folder names derive only from the validated unique numeric year: `BDC Camp ${year}`. Do not derive paths from free-form camp titles or uploaded filenames. Generate opaque filenames, validate/decode JPG/PNG/WebP, check content type/size/pixels, and prevent executable content from being served or run. Static source SVG artwork is distinct from unrestricted admin SVG uploads.

Creating a camp is a coordinated backend workflow, not something CREATE TABLE performs:

1. Validate year/title/date/time/venue and permissions. Insert a nonlive camp with storage_state PENDING; create its sequence row and page-visibility rows. Use conservative initial visibility (gallery OFF; registration closed).
2. Ensure `asset/Image/BDC Camp YYYY/{team,gallery,sponsors}` exists using idempotent mkdir. Resolve absolute paths and verify containment in the configured media root; never join untrusted path components.
3. Optional copy-from: create fresh camp-owned team/sponsor/gallery records and physically copy their files into the new camp's folders with fresh filenames and media_assets records. Update references. Never copy registrations, and do not copy global Website content. Run copy operations idempotently so retrying a failed creation cannot double the roster.
4. Mark storage READY only after folder/copy work succeeds. On failure mark ERROR, retain a retry path and keep the camp nonlive; do not report full success or remove another camp's files. Live switching requires READY.

Store only relative image paths in SQL, such as `BDC Camp 2026/gallery/uuid.webp`. Construct public URLs using configured backend media base URL with each path segment encoded; never save `C:\Users\...` or localhost URLs. Keep application config, backups, uploaded temporary files and credentials outside public media paths. Preserve DB/file consistency: a successful physical upload followed by a failed DB write must be cleaned up; delete a file only when no team/gallery/sponsor/CMS reference uses it. A referenced file must remain readable through existing published content.

## cPanel deployment handoff

Create the database and database user through the hosting account, import the application SQL/data, and update environment connection values. Export the actual database from local development, rather than using the empty schema as a substitute for content. The database name may gain a hosting prefix; this schema intentionally contains no USE statement. Do not export/import MySQL system databases or local user grants.

Upload the backend application and the entire `asset/Image` folder tree separately. A SQL dump contains file paths/metadata, not the image files. Keep the relative paths unchanged. Set the production media URL and MySQL credentials through server configuration. Back up/restore the database and image directory together at a coordinated point so records do not refer to missing files. See [mysqldump documentation](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html).

MySQL hosting does not establish which backend runtime the account supports. Node/Express versus PHP and the cPanel runtime/setup are still to be selected/verified; no cloud image service is required by this storage design.

## Validation required by the implementing agent

- Import into an empty MySQL 8.0.16+ database; verify CHECK and foreign-key rejection cases, required student/staff fields, missing consent and invalid outcome reasons.
- Create multiple camps, switch live/clear live, and attempt old-camp reads/exports/writes with regular-admin grants; verify only the current camp is available. Test a switch concurrent with an update.
- Exercise separate Website grants/drafts/publications so FAQ access cannot publish contact/homepage content, and published pages never read draft revisions.
- Submit simultaneous duplicate attempts, retries, same-phone different people and wrong-camp attempts; verify no disclosure or double allocation.
- Confirm no registration deletion endpoint/control, no Aadhaar field and no Student Roll No field.
- Verify homepage groups/logo selection, per-camp/global visibility, past-gallery behavior and read-only Inbox.
- Fail folder creation or copy midway; retry safely; move SQL plus image tree to a second environment and verify paths.

The retained historical UI specification is still useful for appearance. Old lifecycle, MongoDB, imported Aadhaar, completed-camp reminders and registration-deletion ideas are superseded by this contract.
