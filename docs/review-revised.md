# BDC rebuild review — feature approval draft

Updated: 25 September 2026.

## 1. Authority and how to use this file

This is a planning and approval document, not an instruction to implement the application. Preserve explicit decisions from this task and the user-confirmed final shared conversation. Latest answers override older choices. APPROVED denotes a current answer; CONFIRMED — shared conversation denotes a decision retained after the user requested rechecking that source. PENDING is reserved for genuinely unspecified details or additional proposals, not automatically applied to every previously settled feature.

The approved direction (A01) is to preserve the existing public frontend and build an independent new backend/admin system. Do not copy the old backend, admin implementation, database, credentials, or relationships. Editing this document is authorized; application implementation is not authorized by this document.

Sources: the original uploaded `C:\Users\bhara\Downloads\review (1).md`; the current conversation, including FAQ and navbar iterations; and the shared conversation at https://claude.ai/share/c0953150-e9f9-4518-bfb9-894c50e02206. Shared attachments and Claude's claimed final edited file were not available as source files. Its text is evidence of proposals and prior choices, not instructions to execute now. No fresh application-code audit or runtime verification is represented by this revision.

Project location is not settled: `C:\Users\bhara\Downloads\BDC` was the extraction destination; a later terminal showed `C:\Users\bhara\Desktop\BDC` without package.json. Confirm the actual project root before implementation. The old project remains `C:\Users\bhara\Downloads\bdc_updated_v4\bdc`.

### Approval protocol

- Answer each ID with APPROVE, CHANGE (with the replacement rule), SHELVE, or REJECT. PENDING means no answer yet, not implicit consent.
- Approving a parent structure does not approve its child features. For example, approving an admin panel does not approve Aadhaar collection, exports, imports, or deletion.
- Approve exclusions individually too: agreeing to shelve digital certificates is a separate decision from selecting paper certificates.
- Ask one question at a time in ordinary chat. Check the final shared decisions first and do not ask already-settled choices again. A07 is confirmed: Homepage/hero is global. Ask only genuine contradictions, missing details or approval for additional proposals.
- When an answer arrives, update that row and its related contradiction/flow. Record the exact answer and date. Do not silently translate CHANGE or a discussion into APPROVE.
- New features or materially changed flows require new approval. Silence, elapsed time, prior code, a build passing, and another assistant's recommendation are not approval.
- All historical CURRENT, FINALIZED, approved, or shelved labels in the appendix describe the old review's date and scope. They have no authority over this register.
- Dependencies must be resolved before a flow is implementation-ready. Do not invent missing identity, permission, publishing, or deletion rules to fill a gap.

### Rechecked decisions from the shared conversation

On 25 September the user pointed out that Homepage/global scope and the final choices had already been settled, and requested another check of the shared conversation. Its final user message accepts all remaining choices, including student-only branch. Therefore those identified choices are retained as **CONFIRMED — shared conversation**, not reset to unanswered questions. This source confirmation is a product-specification decision, not an instruction to execute code or grant real accounts permissions now. Latest answers in this task supersede the older choices wherever they differ.

| Public content | Owner / source |
|---|---|
| Hero headline, description, images and buttons | Global Website → Homepage Content; editable globally, does not switch when the featured camp changes |
| About content and Inspiration | Global Homepage Content; About story/photos and Inspiration artwork remain static in the initial editor scope |
| Hero donor count and Impact band | One global set of manually maintained all-time totals |
| Notices | Global Website → Notices, with optional expiry |
| FAQ section and full FAQ page | One global Website → FAQs source; first five General/home-eligible questions on Home; date/venue answers reference featured-camp fields |
| Section order and homepage section switches | Global Website → Sections, subject to the latest A06 dependency rule |
| Footer and institutional Contact details | Global Website → Site Settings / contact settings |
| Current-camp card | Featured camp → Overview: title, date, start/end time and venue |
| Gallery, Team and Partners/Sponsors | Featured camp workspace; published past galleries may additionally appear on the full Gallery page |
| Registrations | Selected eligible camp; not global donor profiles |

The hero is global and editable, not permanently fixed. Switching camps changes the camp-derived blocks, not the global hero. A07 is already settled; do not ask whether the hero should become camp-owned again.

Final shared decisions retained: independent camp records; optional copy of Team, Sponsors and Gallery at creation, never Registrations; one camp/year; manual registration opening/closing and closing on completion; Pending/Donated/Not donated with a reason; age 18+; student-only branch and no staff department; outcome/time/verifier/reason on Registration without a separate Donation collection; minimal audit writes now and audit viewer later; Excel export now and import later; paper certificates without digital generation or collection tracking; published past galleries; custom sponsor sections instead of fixed tiers; fixed team groups with drag between/within groups; global institutional contact and Inbox; no public developer signup; one real image-validation pipeline without the tiny-buffer bypass.

**Latest registration-field decision supersedes all previous Aadhaar decisions:** remove Aadhaar entirely from the new project specification, including public/admin fields, request/response schemas, validation, database fields, fixtures, logs, receipts, exports, permissions and special retention rules. Address is optional. Keep College ID as the sole student institutional identifier; remove the separate Student Roll No field and any roll-number-versus-college-ID selector. College ID is required for students, as explicitly confirmed by the user. Do not infer an ID-card upload from a College ID text field. Earlier Aadhaar decisions in the approval history and appendix are superseded history only; no application code or real records were modified by this document update.

Latest overrides from this task: (1) Super Admin chooses access to individual Website parts per admin; do not enforce the earlier all-or-nothing Website grant. (2) Featured-camp switching is separately delegable by Super Admin; it is not permanently nondelegable. (3) Keep camp page visibility and global homepage switches: a hidden camp page hides its homepage preview; independent FAQ remains global only. Admins & Roles remains nondelegable as previously settled.

### Shared UI and shelved scope recovered during the recheck

Admin UI direction is white cards, crimson actions and navy sidebar. The selected build-now list includes one header/camp switcher, unclipped labels, connection status shown only on failure, consistent row-action menus, drag handles and keyboard alternatives, a role dropdown, protection against demoting/disabling the last Super Admin, login rate limiting, temporary passwords with forced change on first login, and updatedBy/updatedAt. Gallery includes multi-upload, alt/caption and bulk visibility/removal. These were omitted or under-specified in the first approval draft; retain them as shared scope without inventing technical limits or recovery semantics.

Reordering should leave Edit/Delete usable, persist the new order, and restore the prior order with an error if saving fails. Delete-with-Undo was in the selected cleanup list; sponsor-section deletion separately requires confirmation. Exact recovery duration and camp deletion/archive behavior remain to be specified. Approval of a UI pattern is not permission to perform real deletions now.

Shelved in the selected list: global People/Organizations and donor-history directories; shared Media Library; extra role types and full per-action RBAC (subject to the newly approved Website subpermissions); 2FA/session-management screen; email invitation/reset delivery; QR/SMS/email confirmations; full Desk Mode; time slots/capacity/waitlist; homepage version-history/rollback; overview charts/publish-readiness gate; automatic impact aggregation; notice start scheduling/pinning; albums, photo cropping, configurable team groups and command palette. Later final decisions supersede this earlier shelved list where explicit: copy-from is now included, minimal audit recording is included, optional notice expiry is included, and custom sponsor sections are included instead of fixed tiers. General page-builder, multilingual and realtime collaboration ideas are not initial scope.

### Duplicate disclosure issue — corrected

The shared Yes/No duplicate flow is superseded by the user-authorized correction on 25 September. Never reveal an existing registration from matching submitted fields. Strong three-field matches receive a generic assistance message and staff resolution; partial/shared-contact matches can proceed with a private review flag. Same-operation retries create no duplicate. See Section 4.5 for the exact corrected flow. This is a documentation correction, not a claim that application code has been fixed.

Remaining PENDING rows mix additional assistant suggestions and genuinely unspecified details. They must not be described collectively as decisions the user forgot to approve. Review their provenance before asking; repeated details already resolved by the shared source should be marked confirmed, not re-presented as choices.

### Latest backend decisions — supersedes conflicting earlier wording

The user answered the remaining backend questions and requested a MySQL table structure based on the current website. These decisions override historical references and earlier checklist wording wherever they differ:

1. Regular admins' camp-module access follows the currently live/featured camp at request time. It is not an all-camp grant. Super Admin retains access to preparation/older camps; global permissions remain separate.
2. Publishing behavior delegated to the assistant: Team/Gallery/Sponsors use Save plus their explicit visibility switches, without an extra Publish button. Global Website areas retain isolated draft/preview/publish.
3. Camps have only Live / Not live. No archive, completed or published lifecycle. One nullable singleton live-camp pointer is the only source of truth. Manual Registration Open / Closed is separate; switching away closes registration on the outgoing camp. Newly selected camp registration opens only by explicit action. Completion-based reminders are removed.
4. Admin setup is accepted in principle. Existing temporary-password/forced-change rules remain; the user's 'yes' did not specify every recovery/session implementation detail.
5. No registration deletion (including soft deletion) and export is included. Submitted details are read-only pending explicit edit authorization. The three previously accepted outcome values remain in the schema, but the user asked what outcomes mean; whether status-setting/correction controls remain is an outstanding question, not silently approved by the schema.
6. Homepage Team includes Chief Coordinators and Members only. Homepage sponsor strip includes eligible logos from all sponsor sections, in section/sponsor order, respecting global/page/entry visibility.
7. Inbox is read-only message viewing, with an optional read indication; no replies, assignments, resolution workflow or delete controls.
8. MySQL locally and cPanel MySQL at deployment. Backend image root is exactly `asset/Image`; create `BDC Camp YYYY/team`, `gallery` and `sponsors` automatically when a camp is created. Global hero/site images live under `asset/Image/Global`. Store portable relative paths; transfer the actual image tree alongside the SQL dump. Database/storage choice is resolved; backend language/runtime hosting compatibility still needs selection/verification.

The actual new frontend was inspected again. Its current form requires full name, guardian name, DOB, email, mobile, consent and a blood-group selection (UNKNOWN allowed). Staff Employee ID remains required under 'all other same'; Student College ID is required; branch is student-only. Address is optional and Aadhaar/Student Roll No are excluded by the latest instructions. Current code still contains stale excluded fields; this task updates the specification/schema, not the frontend implementation.

The SQL is a fresh schema, not an import of old code/data. It includes no real donor data, admin credentials or seeded permissions for outcome updates/deletion. It is intended for MySQL 8.0.16+ and must be tested against the actual local/cPanel version. A full design/import/storage guide and the SQL are embedded below so this review remains self-contained.

## 2. Individual feature approval register

Rows track decisions and proposals. APPROVED = current-task decision; CONFIRMED — shared conversation = retained final source decision; PENDING = unspecified detail or extra proposal. A question mark in a confirmed row is legacy checklist wording, not a request for repeat approval. Consult the source-reconciliation section before asking any remaining question.

### A. Scope and architecture

| ID | Approval question / proposal | Status |
|---|---|---|
| A01 | Preserve the existing public UI and build a fresh independent admin/backend without using the old project's backend/admin implementation or connections. | APPROVED |
| A02 | One global Website area for homepage content, FAQs, notices, section controls and contact/footer settings; Super Admin has access by default and can grant this module to regular admins. | APPROVED |
| A03 | Each camp owns its registrations, team, gallery and sponsor content. | APPROVED |
| A04 | Exactly one camp per calendar year. | APPROVED |
| A05 | Featured-camp switching belongs to Super Admin by default; Super Admin can grant this capability to other admins through a separate permission. | APPROVED — revised by user |
| A06 | Keep global homepage-section controls and camp workspace page/content controls separate. A homepage preview connected to a camp page, such as Gallery, cannot appear when that page is hidden, even when its global homepage section is enabled. Independent global sections such as FAQ have no camp-level visibility dependency. | APPROVED — clarified by user |
| A07 | Keep hero branding/content generic while the current-camp card uses the featured camp's metadata? | CONFIRMED — shared conversation |
| A08 | Avoid global People and Organizations directories; keep independent camp-owned entries? | CONFIRMED — shared conversation |
| A09 | Permit optional copying of team entries from a previous camp when creating a camp? | CONFIRMED — shared conversation |
| A10 | Permit optional copying of sponsor sections and sponsor entries from a previous camp? | CONFIRMED — shared conversation |
| A11 | Offer optional copying of Gallery content during camp creation. Explicitly chosen content becomes independently owned by the new camp; asset isolation must be respected. | CONFIRMED — shared conversation |
| A12 | Always start a new camp with zero registrations; never copy registrations? | CONFIRMED — shared conversation |
| A13 | Exclude automatic migration of old project data and credentials? | PENDING |
| A14 | Shelve per-camp homepage templates and template migration in favor of global website content? | CONFIRMED — shared conversation |

### B. Public pages, layout and interactions

| ID | Approval question / proposal | Status |
|---|---|---|
| B01 | Retain Home, About, Register, Gallery, Team, Sponsors, FAQ, Contact and a public 404 screen? | PENDING |
| B02 | Retain the current ivory/crimson/navy design, logos and serif-heading treatment rather than applying the unverified ui.md redesign wholesale? | PENDING |
| B03 | Align public text/grid containers consistently with navbar branding while allowing artwork/backgrounds to span the viewport? | PENDING |
| B04 | At page top show the original navbar; after a small scroll change it to a floating rounded pill; restore it on returning to top? | PENDING |
| B05 | Use 92% opaque ivory background for the scrolled pill, with fully opaque text/logos and a subtle crimson shadow? | PENDING |
| B06 | Use an initial pill target of 90% width, max 1600px, 14px desktop top offset, mobile 12px side/8px top offsets, then validate visually? | PENDING |
| B07 | Trigger pill styling above 8px scroll, animate around 200ms without layout jump, and respect reduced motion? | PENDING |
| B08 | Keep mobile menu opening, Escape dismissal, closing on navigation and accessible focus behavior? | PENDING |
| B09 | Keep active-route styling and branding linking to Home? | PENDING |
| B10 | Keep old public camp URLs redirecting to Home instead of adding public camp-detail/schedule pages? | PENDING |
| B11 | Keep the 404 outside the shared navbar/footer, as previously inspected, or CHANGE to include the shared shell? | PENDING |
| B12 | Keep registration CTAs consistent across navbar, hero, camp card, About and closing CTA? | PENDING |
| B13 | Keep original public visual interactions, image fallbacks, mobile layouts, keyboard use and reduced-motion behavior? | PENDING |
| B14 | Use verified final names, photographs, sponsors, totals and contact details before launch; keep unverified fixtures visibly nonproduction? | PENDING |
| B15 | Allow external fonts and a Google Maps embed, despite independence from the old backend? | PENDING |
| B16 | Keep the public navbar/footer free of admin/login shortcuts, with admin reached through its own URL? | PENDING |

### C. Homepage and FAQ

| ID | Approval question / proposal | Status |
|---|---|---|
| C01 | Default homepage order: Hero/current camp → About → Impact → Gallery → Team → Partners → Inspiration → FAQ → final registration CTA → footer? | CONFIRMED — shared conversation |
| C02 | Retain hero manual previous/next controls for multiple images, hide them for one image, and disable autoplay? | PENDING |
| C03 | Retain hero image-failure handling: discard failed slides, keep index valid, and show cream fallback if none remain? | PENDING |
| C04 | Give the current-camp card separate loading, error/retry, no-camp, open and closed states? | PENDING |
| C05 | Keep About preview and its Discover BDC link to the full About page? | PENDING |
| C06 | Keep Impact count-up animation with immediate final values under reduced motion? | PENDING |
| C07 | Keep homepage Gallery carousel autoplay, drag/swipe, keyboard steps, pause/play and focus/hover pause? | PENDING |
| C08 | Keep homepage Team preview and link it to the featured camp's managed roster instead of separate static people? | CONFIRMED — shared conversation |
| C09 | Keep the partner marquee moving only when there are more than three logos, with static wrapping otherwise? | PENDING |
| C10 | Derive homepage partners from featured-camp sponsors, with the exact selection rule still to be approved under X08? | PENDING |
| C11 | Preserve Inspiration artwork, responsive composition and separate decorative bottom wave? | CONFIRMED — shared conversation |
| C12 | Keep the compact crimson final CTA and shared footer? | PENDING |
| C13 | Place homepage FAQ between Inspiration and the final CTA? | CONFIRMED — shared conversation |
| C14 | Home shows the first five General questions eligible for Home from the shared ordered FAQ source, with a link to the full FAQ page. A home-selection flag and ordering determine eligibility. | CONFIRMED — shared conversation |
| C15 | Use one shared ordered FAQ data source for both locations? | CONFIRMED — shared conversation |
| C16 | Provide accessible FAQ accordion controls with clear expanded state and keyboard operation? | CONFIRMED — shared conversation |
| C17 | Populate camp date/location FAQ answers from featured-camp metadata, with a no-camp fallback? | CONFIRMED — shared conversation |
| C18 | Keep the FAQ hero's building/droplet/wave artwork; align text with navbar branding and leave a small clear gap above the wave? | PENDING |
| C19 | Finalize FAQ hero spacing through a visual preview at agreed desktop/mobile widths before accepting it; do not treat prior failed offsets as approved measurements? | PENDING |
| C20 | Preserve full intended FAQ artwork proportions and avoid bottom clipping, overlapping heading lines or text touching the decorative wave? | PENDING |
| C21 | Retain public About story, mission/vision/values and three-photo layout as static content initially? | CONFIRMED — shared conversation |
| C22 | Preserve full public Team grouped portraits and centered incomplete rows? | CONFIRMED — shared conversation |
| C23 | Keep responsive Sponsor layouts while rendering arbitrary managed sections rather than fixed tiers? | CONFIRMED — shared conversation |

### D. Admin access and permissions

| ID | Approval question / proposal | Status |
|---|---|---|
| D01 | Fresh admin sign-in/session/logout and initial account setup accepted in principle; temporary-password onboarding with forced first-login change retained. Exact recovery/session settings remain X01. | APPROVED — core access flow |
| D02 | Use Camps, Website, Inbox and Super-Admin-only Admins & Roles as the global navigation? | CONFIRMED — shared conversation |
| D03 | Use Overview, Registrations, Team, Gallery and Partners & Sponsors inside a camp workspace? | CONFIRMED — shared conversation |
| D04 | Website access defaults to Super Admin. Super Admin chooses which individual Website parts each regular admin can access: homepage content, notices, FAQs, section controls and contact settings. Access is not automatically all-or-nothing. Exact action-level permissions remain X02. | APPROVED — user clarification |
| D05 | Make Inbox access Super Admin by default and separately grantable to regular admins? | CONFIRMED — shared conversation |
| D06 | Never allow delegation of Admins & Roles access to regular admins? | CONFIRMED — shared conversation |
| D07 | Enforce all permissions on the server as well as hiding unauthorized controls in the UI? | CONFIRMED — shared conversation |
| D08 | Regular camp-module grants apply only to the camp live/featured at request time. Recheck session, grant and live pointer on every read/write/export; reject stale workspaces after switching. Global grants remain independent. | APPROVED — latest user answer |
| D09 | Use white admin cards, crimson actions and a navy sidebar? | CONFIRMED — shared conversation |
| D10 | Do not implement a public developer-signup/account-creation endpoint? | CONFIRMED — shared conversation |
| D11 | Create the initial Super Admin through a controlled setup process; approve its exact mechanism under X01? | PENDING |
| D12 | Allow Super Admin to create, disable and change regular-admin access, with session revocation behavior specified before implementation? | PENDING |
| D13 | Do not automatically convert an old homepage permission into broader global Website access? | PENDING |

### E. Camp lifecycle and registration availability

| ID | Approval question / proposal | Status |
|---|---|---|
| E01 | Camp Overview edits title, year, date, time and venue? | CONFIRMED — shared conversation |
| E02 | Camps have only Live / Not live, derived from one nullable site live-camp pointer. Registration Open / Closed stays a separate manual flag. No archive/completed/published lifecycle. | APPROVED — replaces old lifecycle |
| E03 | Open and close registration manually instead of scheduling automatic windows? | CONFIRMED — shared conversation |
| E04 | Remove completed-camp transition. On live-camp switch/off, close the outgoing camp registration; explicitly open the newly selected camp when intended. | SUPERSEDED — live/not-live contract |
| E05 | Use registration IDs shaped like skitbdc<year>_<sequence>, generated uniquely by the server? | CONFIRMED — shared conversation |
| E06 | Preserve previous camps and their records when the featured camp changes? | CONFIRMED — shared conversation |
| E07 | Remove completion-triggered Impact reminder because there is no Completed state. Global all-time totals remain manually editable. | SUPERSEDED — no Completed state |
| E08 | Handle no featured camp gracefully on Home, Register, FAQs and Contact instead of assuming a camp always exists? | PENDING |
| E09 | Block registration on the server when the target camp is closed or otherwise ineligible, even if an old form is still open? | PENDING |
| E10 | No archive or camp-deletion feature in current scope: use Live / Not live and preserve records. Registration deletion is expressly prohibited. | RESOLVED — lifecycle simplified |

### F. Registration, identity and receipts

| ID | Approval question / proposal | Status |
|---|---|---|
| F01 | Permit multiple different people to register from the same device/browser? | CONFIRMED — shared conversation |
| F02 | Same-camp, conservative composite matching on full name, mobile and email; strong matches stop automatic creation for staff resolution, partial/shared-contact matches may proceed with private review flags. No identity verification is claimed. | APPROVED — user-authorized correction |
| F03 | Never return another registration ID, name, masked contact, status or receipt based on matching submitted identity/contact fields. | APPROVED — user-authorized correction |
| F04 | Remove public Is-this-you and No-continue bypasses. Strong matches receive a generic assistance message; authorized staff resolves the case privately. | APPROVED — user-authorized correction |
| F05 | Use unpredictable attempt keys and concurrency-safe server processing so identical retries/double-clicks create at most one registration; changed payloads cannot reuse an attempt key. | APPROVED — user-authorized correction |
| F06 | Allow shared family/friend phone numbers without automatically treating distinct people as duplicates? | CONFIRMED — shared conversation |
| F07 | Limit online registration to age 18+, with exact age-date validation to be approved; leave donation eligibility assessment to the camp's medical team? | CONFIRMED — shared conversation |
| F08 | Show/require branch only for student registrations; staff and outside visitors do not need branch? | CONFIRMED — shared conversation |
| F09 | Preserve student/staff/outside participant categories, subject to approving the full field list under X05? | PENDING |
| F10 | Display a receipt only after successful server registration, and provide a print/download option? | PENDING |
| F11 | Exclude donor accounts from this version? | PENDING |
| F12 | Exclude SMS/email/QR registration gates from this version? Recovery implications must be resolved in X04. | PENDING |
| F13 | Exclude emergency donor-request or blood-demand queues? | PENDING |
| F14 | Show server validation errors without claiming success, and preserve safe form entries for correction? | PENDING |
| F15 | Define receipt recovery and storage so it does not expose previous donors on a shared device? Exact rule is X06. | PENDING |
| F16 | Remove Aadhaar completely: no collection, storage, validation, display, logs, receipt/export columns or Aadhaar-based matching. | APPROVED — supersedes earlier inclusion |
| F17 | Remove Aadhaar-specific encryption/masking implementation requirements because the field is excluded. General protection of other personal data remains. | SUPERSEDED — Aadhaar removed |
| F18 | Remove full-Aadhaar export and its special access controls from scope. | SUPERSEDED — Aadhaar removed |
| F19 | Remove Aadhaar-export-specific reauthentication, reason, decryption-key and audit-event requirements. Do not remove unrelated authentication or audit controls. | SUPERSEDED — Aadhaar removed |
| F20 | Remove the indefinite-Aadhaar-retention decision. Consent and retention for the remaining registration fields are still to be specified separately. | PENDING — non-Aadhaar data only |

| ID | Additional confirmed field rules | Status |
|---|---|---|
| F21 | Address is optional. Blank/omitted address must be accepted by frontend/server and remain blank in storage/exports; no invented placeholder address. | APPROVED — user instruction |
| F22 | College ID is required for students and is the sole student institutional identifier. Enforce requiredness in frontend and server validation. Remove Student Roll No and the identifier-choice selector from forms, schemas, fixtures, receipts and exports. Do not impose this student requirement on Staff/Outside participants. No ID-card upload is implied. | APPROVED — user: required for students |

### G. Registration management, outcomes, exports and audit

| ID | Approval question / proposal | Status |
|---|---|---|
| G01 | Give authorized staff a camp-scoped registration list with search and status filters? | CONFIRMED — shared conversation |
| G02 | Use exactly Pending, Donated and Not donated outcomes? | CONFIRMED — shared conversation |
| G03 | Require a reason when setting Not donated? | CONFIRMED — shared conversation |
| G04 | Store the outcome, time, acting administrator and applicable reason on the registration rather than a separate Donation collection? | CONFIRMED — shared conversation |
| G05 | Explain outcome as Pending/Donated/Not donated. Whether outcome setting/corrections remain alongside export requires the user answer; do not enable editing submitted personal details meanwhile. | PENDING — clarify only-export wording |
| G06 | Handle concurrent/repeated outcome updates consistently without duplicate counts or lost changes? | PENDING |
| G07 | Provide authorized registration export, scoped to the current live camp for regular admins and available to Super Admin for historical records. No Aadhaar/Student Roll No; optional Address and required student College ID. | APPROVED — export included |
| G08 | Shelve Excel import, historical import, import reconciliation and import reversal for this release? | CONFIRMED — shared conversation |
| G09 | Record audit events for outcome changes, permission changes and featured-camp switches. Aadhaar-export events are removed with the feature. | CONFIRMED — amended by latest exclusion |
| G10 | Shelve the audit-log viewer while retaining approved server-side audit recording? | CONFIRMED — shared conversation |
| G11 | Use paper certificates operationally? | CONFIRMED — shared conversation |
| G12 | Exclude digital certificate generation? | CONFIRMED — shared conversation |
| G13 | Exclude certificate-collection tracking from the application? | CONFIRMED — shared conversation |
| G14 | Keep donor, donation and blood-unit meanings distinct, even if separate Donation storage is not used? | PENDING |

### H. Website editing and publication

| ID | Approval question / proposal | Status |
|---|---|---|
| H01 | Edit/reorder hero images globally? | CONFIRMED — shared conversation |
| H02 | Edit global all-time Impact totals manually? | CONFIRMED — shared conversation |
| H03 | Use those same totals on Home, About and the hero statistic; no automatic addition of old baselines? | CONFIRMED — shared conversation |
| H04 | Edit Inspiration heading/narrative text globally? Exact editable fields are X10. | CONFIRMED — shared conversation |
| H05 | Keep Inspiration artwork static for this version? | CONFIRMED — shared conversation |
| H06 | Keep About story/photos and mission/vision/values outside the initial CMS? | CONFIRMED — shared conversation |
| H07 | Create/edit/reorder/enable/disable FAQs globally? | CONFIRMED — shared conversation |
| H08 | Create/edit/publish notices with optional expiry dates? | CONFIRMED — shared conversation |
| H09 | Give website content, section controls and notices a draft/preview/publish flow that isolates drafts from public visitors? | CONFIRMED — shared conversation |
| H10 | Save operational changes such as registration outcomes immediately, without a website Publish step? | CONFIRMED — shared conversation |
| H11 | Provide section ordering and show/hide controls with keyboard alternatives to dragging? Which sections are locked is X11. | CONFIRMED — shared conversation |
| H12 | Apply text limits and natural wrapping rather than shrinking long text until it becomes unreadable? | PENDING |
| H13 | Shelve a general visual page builder, click-anywhere replacement and rich-text editing unless separately approved? | PENDING |
| H14 | Shelve browser-side image conversion and advanced crop/zoom tools for the initial release? | CONFIRMED — shared conversation |
| H15 | Keep published content available when an admin has an unfinished draft? | CONFIRMED — shared conversation |

### I. Team, gallery and sponsors

| ID | Approval question / proposal | Status |
|---|---|---|
| I01 | Use Chief Coordinators, Members, Student Coordinators and Website Team as the initial fixed team groups? | CONFIRMED — shared conversation |
| I02 | Allow authorized admins to add/edit/remove camp team entries and upload portraits? | CONFIRMED — shared conversation |
| I03 | Allow reordering within groups and moving people between groups, with keyboard alternatives? | CONFIRMED — shared conversation |
| I04 | Shelve a separate Volunteers group? | CONFIRMED — shared conversation |
| I05 | Shelve persistent admin controls for preferred team column counts; keep responsive defaults? | PENDING |
| I06 | Allow per-person explicit public-contact visibility so only selected team phone numbers appear publicly? | CONFIRMED — shared conversation |
| I07 | Allow camp-scoped gallery uploads, ordering, publication/visibility and removal? | CONFIRMED — shared conversation |
| I08 | Show published gallery content from previous camps as well as the featured camp? | CONFIRMED — shared conversation |
| I09 | Public Gallery reads visible photos from camps with Gallery visibility ON; nonlive camps may appear in Past Galleries. There is no camp draft/published lifecycle. Initialize new-camp Gallery OFF; enabling it publishes its eligible photos. | RESOLVED — live/not-live plus content visibility |
| I10 | Make gallery category filters actually filter the images, rather than only styling a selected pill? | PENDING |
| I11 | Add a gallery image lightbox? This was previously claimed but not implemented; approval must be explicit. | PENDING |
| I12 | Retain expandable past-camp gallery groups? | CONFIRMED — shared conversation |
| I13 | Allow admins to create arbitrary sponsor sections with heading and description instead of fixed tiers? | CONFIRMED — shared conversation |
| I14 | Allow adding/editing/removing sponsors inside a camp section? | CONFIRMED — shared conversation |
| I15 | Allow ordering sponsor sections and sponsors within each section, with keyboard alternatives? | CONFIRMED — shared conversation |
| I16 | Hide empty or disabled sponsor sections publicly, including their empty spacing, while retaining them in admin? | CONFIRMED — shared conversation |
| I17 | Deleting a sponsor section removes its sponsors after a destructive-action confirmation. Displaying the affected count is a recommended UI detail, not a separate already-approved requirement. Asset references in other camps must remain intact. | CONFIRMED — shared conversation |
| I18 | Keep copied team/sponsor entries independently editable so changing one camp never changes another? | CONFIRMED — shared conversation |
| I19 | Preserve logo aspect ratios and use a text fallback for failed images? | PENDING |
| I20 | Shelve individual sponsor-logo size controls? | PENDING |

### J. Contact and Inbox

| ID | Approval question / proposal | Status |
|---|---|---|
| J01 | Manage institutional phone, email, address and map location globally and share them between Contact and footer? | CONFIRMED — shared conversation |
| J02 | Contact settings are separately grantable by Super Admin. Access to another Website part does not automatically grant contact-setting access. | APPROVED through D04 |
| J03 | Derive visible coordinator contacts from the featured camp's explicitly public team entries? | CONFIRMED — shared conversation |
| J04 | Submit the contact form to a server-backed Inbox rather than only opening a mail application? | CONFIRMED — shared conversation |
| J05 | Show 'received' only after the message is actually stored successfully; preserve errors/retry behavior? | PENDING |
| J06 | Add contact-form server validation and abuse/rate controls? | PENDING |
| J07 | Inbox supports reading incoming messages only; optional first-read indication. No replies, assignments, resolved state or deletion controls. | APPROVED — read-only Inbox |
| J08 | Shelve automatic email/SMS notifications and outbound replies until their delivery workflow is separately approved? | PENDING |

### K. Media, reliability and implementation acceptance

| ID | Approval question / proposal | Status |
|---|---|---|
| K01 | Use a shared upload validation pipeline that decodes real images and rejects invalid content, without the old tiny-buffer bypass? | CONFIRMED — shared conversation |
| K02 | Set upload type/size/pixel limits consistently and document each slot's dimensions/focal behavior? Exact limits are X13. | PENDING |
| K03 | Keep assets referenced by another camp or published revision when removing an entry; delete a file only after checking references? | PENDING |
| K04 | Clean up newly uploaded orphan assets after a failed save without deleting previously referenced files? | PENDING |
| K05 | Keep required source/public assets; treat dist as generated build output, not a second editable source tree? | PENDING |
| K06 | Require desktop/mobile visual verification of navbar, FAQ hero and existing public pages before accepting UI changes? | PENDING |
| K07 | Verify permissions, closed registration, duplicate/retry handling, publication isolation and exports through meaningful end-to-end checks? | PENDING |
| K08 | MySQL database, later exported/imported into cPanel MySQL. Images remain backend files under asset/Image. Backend language/runtime is still to be selected for the hosting account. | APPROVED — database/storage; runtime pending |
| K09 | Define production backups and restoration checks before launch; keep a separate backup console shelved unless requested? | PENDING |
| K10 | Create a recoverable version-control checkpoint before implementation and review changes in stages? | PENDING |

## 3. Contradictions and missing decisions — user answers required

Questions remain PENDING unless explicitly marked resolved. Some overlap with feature approvals; one explicit answer can update the referenced feature and contradiction together, but not unrelated features.

| ID | Conflict or gap | Exact question to resolve |
|---|---|---|
| Q01 | Old review permits UI extraction only; shared conversation proposes fresh backend/admin. | RESOLVED by A01: plan a fresh backend/admin while preserving public UI and excluding old backend/admin source. |
| Q02 | Historical per-camp homepage templates versus global Website. | RESOLVED: the final user choice makes Homepage/hero global and editable, with featured-camp blocks loaded separately. |
| Q03 | Old global People/Organizations versus independent camp entries. | RESOLVED: no global directories; optional creation-time copies get independent records. |
| Q04 | Old review leaves event frequency open; shared conversation locks one/year. | One/year APPROVED under A04. Cancelled-event replacement behavior remains X03; do not infer it. |
| Q05 | Old live-camp-only gallery versus past galleries. | RESOLVED: include published past galleries; draft/unpublished camps are excluded. Archive/cancel edge cases remain X03. |
| Q06 | Formerly shelved editing features now included. | RESOLVED in final shared decisions: Inspiration heading/narrative, FAQ management, custom sponsor sections, global contact settings and Inbox are included. |
| Q07 | Manual totals versus old automatic aggregation. | RESOLVED: manual all-time totals shared by hero/Home/About, with completion reminder. Verified values/definitions remain X14. |
| Q08 | Student branch versus staff department. | RESOLVED: branch is student-only; drop the staff department field, explicitly accepted in the final shared answer. |
| Q09 | Earlier required/permanent Aadhaar versus latest exclusion. | RESOLVED: latest user instruction removes Aadhaar entirely, including exports and retention requirements. Earlier approvals are superseded. |
| Q10 | Duplicate Yes/No flow revealed existing records and allowed bypass. | RESOLVED: replace with the corrected Section 4.5 flow under the user instruction CORRECT THAT THEN. No existing-record disclosure or public override. |
| Q11 | No donor accounts/verification gates versus receipt recovery. | RESOLVED for this version: immediate submission receipt; subsequent recovery through authorized staff, not personal-field lookup. Exact receipt/attempt lifetime settings remain X06. |
| Q12 | Global Website grant versus contact-setting restrictions. | RESOLVED: Super Admin chooses access per Website part and per admin; contact settings are separately grantable, not automatically included in every Website grant. |
| Q13 | Global homepage visibility could expose a preview of a hidden camp page. | RESOLVED by A06: hiding a camp page hides its connected homepage preview. Global enabling cannot override this. Independent sections such as FAQ are controlled globally only. Registration availability remains a separate question E03. |
| Q14 | Shared conversation distinguishes publishing content from instant operational changes but does not fully specify camp media/team/sponsors. | Under X15, do team/gallery/sponsor changes require Publish, or take effect on Save with explicit visibility? |
| Q15 | Earlier FAQ spacing instructions repeatedly failed. | Confirm C18–C20 and X16: approve a current visual reference before choosing final dimensions; do not restore any failed fixed offsets by default. |
| Q16 | ui.md contains broad redesign ideas; later user asks to preserve and selectively refine current UI. | Confirm B02: preserve current design and approve future visual changes separately? |
| Q17 | Prior gallery filter/lightbox claims exceed observed behavior. | Answer I10/I11 independently: implement real filtering; add lightbox or leave it out? |
| Q18 | Original eight-page inventory omits new FAQ. | Confirm B01/C13–C20: FAQ is a full public page and a homepage section in the proposed scope? |
| Q19 | Downloads project destination versus Desktop terminal location. | Which folder actually contains the new app's package.json and should receive future work? |
| Q20 | No separate Donation collection was described as eliminating transaction needs. | Confirm G04 only as a storage choice; approve consistency requirements G06/K07 separately. Architecture must still handle multi-write failures and concurrency. |
| Q21 | Earlier proposal made featured-camp switching permanently Super-Admin-only. | RESOLVED by latest A05 answer: Super Admin has it by default and may delegate it; it is not automatically granted with Website access. |

### Additional precise choices before implementation

| ID | Required user decision | Status |
|---|---|---|
| X01 | Temporary-password onboarding with forced first-login change is in shared build-now scope; email invites/reset delivery and 2FA/session-list UI are shelved. Specify bootstrap, non-email recovery, session lifetime and revocation behavior. | PENDING — details only |
| X02 | Camp module permissions follow the live camp only for regular admins. Super Admin chooses grants; Website submodules and Inbox remain separate global permissions. Registration outcome editing is the remaining action-level question. | RESOLVED — scope; outcome actions pending |
| X03 | Live / Not live only; one nullable pointer; no archive/completed/published lifecycle. Retain one camp per year and all older data. Registration opening remains separate/manual. | RESOLVED |
| X04 | Corrected matching: all three nonempty full-name/mobile/email fields matching the same camp record triggers generic staff assistance; partial matches do not establish identity and may proceed with staff review flags. No public bypass/disclosure. | RESOLVED — Section 4.5 |
| X05 | Existing form inspected: full name, guardian, DOB, blood group (UNKNOWN allowed), email, category, mobile and consent required; Staff Employee ID preserved. Student College ID required, branch student-only; Address optional; no Aadhaar/Student Roll No. | RESOLVED — source checked |
| X06 | Recovery is staff-assisted after losing the immediate submission context. Specify receipt contents/download format and precise attempt expiry/storage/clearing settings; do not introduce public lookup or shared-device receipt restoration. | PENDING — remaining details only |
| X07 | Define consent and retention/deletion handling for remaining registration data. Aadhaar-specific purpose, retention, export and sharing questions are cancelled because Aadhaar is excluded. | PENDING — remaining data only |
| X08 | Homepage Team: Chief Coordinators and Members only. Sponsor strip: eligible logos from all sections, ordered by section then sponsor, respecting visibility. | RESOLVED |
| X09 | Specify ordinary export format/columns, filters and roles. Exclude Aadhaar and Student Roll No; use College ID as the sole student identifier and allow blank optional Address. | PENDING — export details only |
| X10 | Exact editable hero/Inspiration fields and limits; are slogans editable or only heading/narrative? | PENDING |
| X11 | Which homepage sections may be hidden/reordered, and may registration, branding or footer ever be hidden? | PENDING |
| X12 | Read-only Inbox: view messages, optional read indication; no reply/assignment/resolution/deletion feature. | RESOLVED |
| X13 | Local backend images under asset/Image, automatic BDC Camp YYYY/team, gallery, sponsors folders; global images in Global/hero and Global/site. Portable paths and safe upload/copy/cleanup contract are in the SQL guide. Technical size limits are implementation details. | RESOLVED — storage design |
| X14 | Verified Impact numbers and definitions: donors unique over what period, actual blood units, number of completed camps, and who may edit them? | PENDING |
| X15 | Assistant-selected at user request: Team/Gallery/Sponsors save directly with visibility controls; no extra Publish. Global Website snapshots use per-area draft/preview/publish. | RESOLVED — delegated decision |
| X16 | Which screenshot/live render is the approved current public UI reference, and what desktop/mobile viewport sizes should be used for visual acceptance? | PENDING |
| X17 | MySQL locally → export/import to cPanel MySQL; image tree transferred separately under backend asset/Image. SQL targets MySQL 8.0.16+. Verify hosting version/runtime and choose backend language; backup schedule remains operational configuration. | PARTIALLY RESOLVED — runtime/version verification remains |
| X18 | FAQ answers, institutional details, roster, sponsor permissions, photographs and placeholders to replace before launch? | PENDING |
| X19 | Audit retention, allowed audit readers and whether deletion/export events beyond the proposed minimum must be recorded? | PENDING |
| X20 | Display timezone and date/time input rules; use Asia/Kolkata for camp dates and notice expiry, or another explicit rule? | PENDING |
| X21 | FAQ General/Donation grouping and one-open accordion are in the shared design. Is additional full-page text search wanted, or should it remain outside initial scope? | PENDING — search addition only |
| X22 | No registration deletion or walk-in/bulk-edit extras inferred. Export included. Submitted details read-only until authorized. Clarify whether Pending/Donated/Not donated controls remain; schema alone does not approve them. | PARTIALLY RESOLVED — outcome question only |

## 4. Proposed end-to-end flows — not approved yet

These flows explain how approved features would connect. Every flow remains conditional on its referenced approvals and unresolved choices.

### 4.1 Visitor navigation and featured content

Approved visibility rule (A06): for a homepage preview linked to a camp page, its global homepage toggle AND that camp page's visibility must allow display. Gallery is the explicit example: global Gallery ON + camp Gallery OFF → homepage Gallery OFF; global Gallery OFF + camp Gallery ON → homepage Gallery OFF while the page's own visibility stays ON; both ON → homepage preview may appear subject to eligible published content. These are separate saved settings; changing one must not overwrite the other. Independent sections such as FAQ use global Website controls only. Hiding Gallery must not hide FAQ or change admin access. Whether and how to expose historical galleries, navigation links or direct URLs remains subject to their own pending approvals; this decision does not settle those separate features.

Visitor opens a public page → shared public configuration and featured-camp metadata load → show distinct loading/error/empty states → render only public eligible content. Home's camp card reads the featured camp; global hero branding stays generic. Team and sponsors use featured-camp records; Gallery may additionally include earlier published camps if I08 is approved. No featured camp → show deliberate empty/fallback states, with registration unavailable and FAQ date/location answers not inventing an event. Dependencies: A02/A03/A07, B01, C04/C08/C10/C17, E08, I08/I09, X03/X08.

### 4.2 Navbar and FAQ presentation

At page top → original navbar. Scroll passes the approved threshold → reserved header space prevents a jump → navbar transitions to pill geometry, ivory translucent background and crimson shadow. Return to top → original styling. Mobile menu stays operable in both states. FAQ copy aligns to the same content edge as branding; heading lines do not overlap; paragraph clears the decorative wave. Verify against an approved image/viewport rather than guessing fixed bottom percentages. Dependencies: B03–B08, C18–C20, K06, X16.

### 4.3 New camp and optional copy

Authorized admin creates camp → validate year/date and approved lifecycle rules → save camp → if requested, choose which prior-camp content to copy → copy only selected team/sponsors/gallery into independently editable camp entries → preserve shared image references safely → zero registrations in new camp. Featured-camp selection is a separate action allowed to Super Admin or an admin explicitly granted that permission (A05). Editing or deleting the new entries must not change the source camp. Dependencies: A03/A04/A08–A12, E01/E02/E06, I18, K03, X02/X03/X15.

### 4.4 Live camp and registration opening

Authorized admin views the permitted live camp Overview → toggles Registration Open/Closed → server rechecks live pointer/permission → public form availability updates. Live switching/off closes the outgoing registration and preserves all data. There is no Completed/Archived transition or completion reminder. Refer to the embedded SQL guide for transaction order and stale-workspace checks.

### 4.5 Registration submission and duplicate handling

Visitor opens Register → load the eligible camp → validate applicable fields → submit with a fresh, unpredictable submission-attempt key → server rechecks availability and validates fields → run same-camp matching below → either create exactly one registration, or show the generic staff-assistance response. Device/browser identity is never a donor identity. No personal-field match may return an existing registration or receipt.

Registration fields: Aadhaar is excluded; Address is optional; use College ID only instead of Student Roll No/College ID alternatives. Optional address must not be used to block a submission or as duplicate identity evidence. College ID is required for students. Whether it participates in duplicate matching is a separate decision; do not silently replace the existing matching rule. The existing corrected name/mobile/email policy remains in effect.

1. **Normalize conservatively.** Trim/collapse name whitespace and compare case-insensitively; normalize phone format; trim email and normalize its domain. Do not use fuzzy names, remove email dots/plus-tags, or treat blank/missing fields as matching identity evidence. These checks indicate possible duplication, not verified identity.
2. **Strong composite match.** For the initial rule, all three nonempty fields—full name, normalized mobile and email—must match the same registration in the same camp. Stop automatic creation and show only: “We could not complete this registration automatically. Please contact the BDC registration team for assistance.” Do not expose whether a specific person exists, their name, masked phone, ID, status, or receipt. Do not provide a public Yes/No override. Keep this rule in one server-side policy; do not silently change which fields participate when the final form-field list is settled.
3. **Partial match/shared contact.** Phone alone, email alone, or fewer than all three matching fields is insufficient to reject a different person. Allow the new registration after ordinary validation, while flagging a potential duplicate for authorized staff where relevant. Missing optional email is not grounds to block a person or force collection solely for deduplication. No prior record is displayed to the submitter. This intentionally permits some duplicates for staff review rather than treating shared contact details as proof of identity.
4. **Same-attempt retry.** Double-click/network retry with the same unpredictable attempt key and identical payload resolves to the same operation, never a second registration. A changed payload under that key is rejected. The server generates the registration ID and enforces concurrency-safe creation, including competing strong matches. The attempt key is not derived from name/phone/email. Its purpose is retry handling, not a general lookup by identity fields.
5. **Staff resolution.** An authorized registration admin privately compares possible matches and verifies the case with the person. If it is the same registration, help them retrieve their receipt through staff; if it is a distinct person or a mistaken entry, the admin may resolve the match and authorize creation/correction with a reason and audit entry. Repeated requests to resolve the same case must not create repeated records. Do not add a public bypass or permit receipt recovery by guessing personal fields.
6. **Receipt access.** The immediate successful submission can show its own receipt. After leaving/resetting the form or losing that submission context, recovery is staff-assisted for this version; do not auto-display the last donor's receipt on a shared device. Receipt contents/format and precise attempt-expiry/storage settings remain X06 implementation details. These must be settled without introducing public record lookup.
7. **Abuse and verification.** Apply submission rate limits that tolerate legitimate shared devices/networks. Test same-device distinct people, same-phone different people, three-field matches, blank email, case/spacing normalization, double-click/retry, concurrent submissions and direct API calls. Do not describe this as identity verification or perfect duplicate prevention; changed details and partial matches still require staff review.

Correction scope authorized by the user's “CORRECT THAT THEN”: remove disclosure and public bypass; use staff-assisted strong-match handling and safe retries. No OTP service, donor account, new mandatory identity field, or migration is introduced. Dependencies still include the final field list, registration-admin permissions and receipt-lifetime settings.

### 4.6 Outcome and correction

Authorized camp staff searches registration → inspects permitted fields → chooses Donated or Not donated → Not donated requires approved reason → server validates transition and concurrency → persist outcome/time/actor and audit record according to approved design → refresh list. Correction → explicit correction reason → retain prior/new outcomes in history. Repeated clicks must not create inconsistent outcomes. Pending remains a distinct state, not an automatic Not donated. Dependencies: G01–G06/G09, X02/X19/X22.

### 4.7 Registration exports

Authorized admin selects approved camp/filter scope → export only approved registration columns. Aadhaar and Student Roll No do not exist in the export. College ID is the sole student institutional identifier; optional Address can be blank. There is no special full-Aadhaar export/decryption action. Export format and ordinary export permissions remain X09. Dependencies: F16, F21/F22, G07/G09, X09.

### 4.8 Global website draft and publication

Authorized Website editor opens global content → edits approved fields/order/visibility → saves draft → public site keeps last published revision → previews desktop/mobile → publishes → public content updates together according to the final publishing design. Notice expiry respects approved timezone and affects public visibility; draft changes cannot leak before publication. Institutional contact settings use the separate permission choice J02. Dependencies: A02/A06, H01–H15, J02, X10/X11/X20.

### 4.9 Team and coordinator contacts

Authorized camp editor adds/edits/reorders visible entries → Save applies the change. Homepage includes Chief Coordinators and Members only; full Team includes all four agreed groups. Contact displays explicitly public phone entries. Regular admins can act only on the currently live camp; every server request rechecks this.

### 4.10 Gallery and historical visibility

Authorized editor selects camp → uploads validated photos → categorizes/orders if approved → saves/publishes under X15 → public Gallery includes only eligible published content. Category selection actually filters records if I10 is approved. Past camp expansion loads only that camp's eligible photos. Removing one reference never deletes a file still used elsewhere. Lightbox is separate I11 approval. Dependencies: I07–I12, K01–K04, X03/X13/X15.

### 4.11 Sponsor sections

Authorized camp editor creates section with heading/description → adds sponsors → orders sections and entries → saves/publishes under X15 → public Sponsors displays enabled nonempty sections. Last eligible sponsor removed/hidden → hide section and spacing publicly, retain its admin representation. Delete section → show contained-entry count → confirm → remove that camp's entries while retaining externally referenced assets. Homepage selection follows X08. Dependencies: I13–I20, C10, K03, X08/X15.

### 4.12 Contact submission and Inbox

Visitor submits Contact form → server validates and stores message → acknowledge actual success. Authorized Inbox user reads the message; optional read tracking only. No reply, assignment, resolution or deletion workflow is included.

### 4.13 Permissions and account changes

Controlled setup creates initial Super Admin → Super Admin creates regular accounts and explicitly grants camp/module access → login establishes session → every server operation checks identity, current grant and target camp → access changes create audit events → disabled/revoked users lose access according to X01. Website and Inbox are separate grants; Admins & Roles is never delegated under D06. Dependencies: D01–D13, G09, X01/X02/X19.

## 5. Approval record and implementation readiness

| Date | IDs | User answer | Effect |
|---|---|---|---|
| 25 September 2026 | All | User requested individual approval of every feature and questions for contradictions. | Start PENDING and update only on explicit answers. Document revision only is authorized. |
| 25 September 2026 | A01, A03, A04 | 'Approve' for each. | Independent rebuild, camp-owned data and one camp/year APPROVED. |
| 25 September 2026 | A02 | 'approve ... website ... homepage notice section contact faq ... for super admin and he can give access of this module to regular' | Global Website APPROVED; grantable to regular admins. D04 clarifies grant granularity. |
| 25 September 2026 | A05 | 'only super admin have this can give others access to this' | APPROVED with delegation: Super Admin default, separately grantable featured-camp switching. |
| 25 September 2026 | A06 | 'keep the workspace modules visibality inside them and the website section visibality outside global ... workspace ... inside all camp' | Retain both scopes; ask how their visibility gates combine and distinguish public content from admin navigation. |
| 25 September 2026 | A06, D04, A07–A10 | Follow-up batch asked. | Await answers; no implied approval. |
| 25 September 2026 | A06 | User clarified: if the connected Gallery page is off, its homepage section is off even when globally enabled; standalone FAQ is global only. | APPROVED; Q13 resolved. D04 and A07–A10 remain unanswered. |

| 25 September 2026 | D04, J02 | User: it is up to Super Admin how much access each person receives. | APPROVED: independently grantable Website parts per admin; supersedes any single whole-module grant interpretation. Ask future questions one by one. |

| 25 September 2026 | Shared-conversation reconciliation | User requested rechecking the already settled global Homepage and final decisions. | Restored identified final source decisions as CONFIRMED; retained newer Website subpermissions, delegable featured switching and linked visibility. The earlier claim of 157 genuinely unanswered feature decisions is withdrawn. |

| 25 September 2026 | F02–F05, Q10, Q11, X04 | User: CORRECT THAT THEN, referring to the duplicate disclosure/bypass issue. | Corrected specification: no record disclosure; generic strong-match response; staff-assisted resolution; shared contacts supported; safe retries. Application code was not modified. |

| 25 September 2026 | F16, Q09, X05, X07 | User answered required when asked whether Aadhaar is required or optional. | Aadhaar required across participant categories; existing protection rules retained. Purpose and retention remain unresolved. |

| 25 September 2026 | F16, Q09, X07 | User explained the number is collected for possible hospital donor-data needs; visiting hospitals inspect Aadhaar for DOB. | Purpose recorded; no automatic website DOB verification, document upload or hospital transmission inferred. Retention remains unresolved. |

| 25 September 2026 | F16, F20, Q09, X07 | User requested retention forever and rejected deleting full Aadhaar after hospital reporting. | Indefinite full-number retention recorded as the user product requirement; no automatic purge. Existing protection rules remain. This is not a compliance finding. |

| 25 September 2026 | F16–F22, G09, Q09, X05/X07/X09 | User: remove Aadhaar fully, make Address optional, keep College ID only instead of Student Roll No and College ID options. | Supersedes all earlier Aadhaar collection/encryption/export/retention decisions. Registration specification updated; no real application/database deletion performed. |

| 25 September 2026 | F22, X05 | User answered required when asked whether College ID is required or optional for students. | College ID required for students in frontend and server validation; no Student Roll No alternative. |

| 25 September 2026 | X05 | User: all other same, in response to the email required/optional question. | Keep all other existing registration fields and field rules unchanged; no separate email change. Only the expressly requested Aadhaar/Address/College ID changes apply, alongside previously confirmed rules. |

| 25 September 2026 | D08, E02/E04/E07/E10, G05/G07, J07, K08, X02/X03/X05/X08/X12/X13/X15/X17/X22 | User supplied eight decisions and requested MySQL table structure. | Applied live-only regular access, live/not-live camps, Save-based camp content, no registration deletion, read-only Inbox, preview selections, MySQL/cPanel and camp-named local image folders. SQL/guide generated; outcome-action clarification remains. |

No feature is implementation-ready merely because its description is detailed. Before implementing a feature, confirm its status, resolve its X/Q dependencies, record the final flow, and obtain the user's instruction to implement the approved scope. A documentation request alone is not that instruction.

Register completeness: the checklist covers the feature families found in the supplied review and available conversation. The historical appendix includes detailed visual measurements, source findings and old bugs; those are not independently approved new features. If an implementation agent discovers a behavior not represented here, add its own approval item before including it. Do not claim to have recovered deleted conversations or hidden shared attachments.


## 5A. Current MySQL design and backend contract

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

### Complete fresh-database SQL

```sql
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
  UNIQUE KEY uq_camp_year (camp_year),
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
  outcome ENUM('PENDING','DONATED','NOT_DONATED') NOT NULL DEFAULT 'PENDING',
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
      AND college_id IS NULL AND branch IS NULL)
    OR (participant_type = 'OUTSIDE_SKIT' AND college_id IS NULL AND employee_id IS NULL AND branch IS NULL)
  ),
  CONSTRAINT ck_registration_reason CHECK (
    (outcome = 'NOT_DONATED' AND not_donated_reason IS NOT NULL AND CHAR_LENGTH(TRIM(not_donated_reason)) > 0)
    OR (outcome <> 'NOT_DONATED' AND not_donated_reason IS NULL)
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

```

## 6. Historical review — reference only

The original uploaded review is preserved below without editing its historical text. Its dates, labels, paths, instructions and 'current' scope describe the original review. It is subordinate to Sections 1–5 above and must not be used as an implementation checklist. This preservation retains detailed flows, shelved ideas, contradictions, visual measurements and asset inventories without silently discarding project history.

<details>
<summary>Open the original 24 September review and its archived specifications</summary>

# BDC project review and rebuild reference

Prepared: 24 September 2026. Source: `C:\Users\bhara\Downloads\bdc_updated_v4\bdc`, plus its parent `DESIGN_DECISIONS.md` and the decisions in this task. New project: `C:\Users\bhara\Downloads\BDC`.

Reading guide: Sections 1–3 establish scope and design; 4–6 explain public interactions; 7–8 preserve old relationships and operational flows; 9 lists shelved designs; 10 resolves contradictions; 11–13 collect lessons, assets, and future decisions; 14 identifies evidence. Appendix A retains exact visual specifications and their history; Appendix B inventories public assets. Read the reconciled sections first, then use the archival appendix for measurements.

## 1. Read this first: what this document authorizes

This is a knowledge handoff, not an instruction to rebuild the old application. The latest user decision is to preserve **only the public website UI** in the independent new project. All backend relations, business rules, authentication, permissions, and operational workflows will be designed again later. Admin and login UI, initially included in the extraction prompt, are now explicitly excluded. A separate agent is updating that project; this review does not modify its files.

Keep the public Home, About, Register, Team, Gallery, Supporters, Contact, and public 404 screens, with their navigation, footer, assets, visual interactions, and responsive layouts. Use local synthetic data and clearly identified demonstration submissions. Do not connect to the old backend, storage, database, source directory, or credentials.

Old product exclusions worth remembering: no donor accounts, no SMS/email/QR registration gates, no emergency donor-request queue, and no digital certificate generation; certificates were intended to remain paper-based. These exclusions describe the prior product scope and do not pre-decide future requirements. None of those features belongs in the current UI-only extraction.

The user explicitly requested this separate `review.md`; the old PLAN prohibition on additional Markdown files does not apply to this requested deliverable. Similarly, the old instruction to retain Express/Mongoose is a constraint for maintenance of the OLD application, not a constraint on the new independent project.

### Status vocabulary and authority

| Status | Meaning |
|---|---|
| CURRENT | Explicitly requested in this conversation; controls the new project's scope. |
| FINALIZED-OLD | Recorded as approved in source documentation; historical requirement, not automatic authorization to implement backend behavior now. |
| IMPLEMENTED | Present in inspected source code; not a claim of runtime correctness or user approval. |
| AWAITING REVIEW | Implemented but source specification explicitly says user review is pending. |
| SHELVED | Documented future work; do not implement until requested. |
| UNRESOLVED | Conflicting or missing evidence; do not invent an answer. |
| RECOMMENDATION | A lesson or suggested future design, not a decision already approved by the user. |

Precedence: latest explicit user instruction > recorded approval > implemented code as evidence of present behavior > old plans/comments. Code establishes what happens, not what the user approved. When these disagree, retain both the observed behavior and the historical intention; do not silently treat a bug as a requirement.

### Evidence limits

This review uses the files available now and this task's conversation. It cannot recover deleted documents, missing screenshots, or unprovided earlier conversations. Approval claims outside this task are attributed to the source specification. No database records, secrets, or private donor data were read. No application tests, browser audit, build, or live backend verification were performed for this documentation task. Historical test results are reproduced only as historical claims.

Both copies of `DESIGN_DECISIONS.md` had identical SHA-256 hashes when checked. The new destination was only inspected for its top-level files; its in-progress agent work has not been audited or certified here.

## 2. Project map and what each part was for

| Old area | Purpose | Treatment in the new UI project |
|---|---|---|
| `frontend/src/pages` | Public visitor screens and registration interface | Preserve appearance; replace operational logic. |
| `frontend/src/components/layout` | Public navbar/footer plus admin layouts | Keep only public components. |
| `frontend/src/components/home` | Gallery carousel and partner marquee | Keep visual behavior and local assets. |
| `frontend/src/components/common` | Waves, placeholders, loaders, boundaries, health indicator | Keep public visual dependencies; remove backend health coupling. |
| `frontend/src/admin` | Global administration and camp workspaces | Exclude entirely. |
| `frontend/src/context` | Authentication session and selected admin camp | Exclude; rebuild any public UI state independently. |
| `frontend/src/services` | API client, impact loading, hero configuration | Do not copy API connectivity; retain/recreate purely visual configuration. |
| `frontend/src/hooks` | Camp fetches, impact data, counters, health | Preserve animation logic only; replace data fetching with local fixtures. |
| `frontend/public` | Logos, photos, inspiration artwork | Copy public assets actually used; no source-folder links. |
| `backend` | Express routes, MongoDB models, services, uploads, admin scripts | Historical reference only. |
| `shared` | Enums, validation, availability rules, old CMS defaults | Do not import the old package. Recreate UI options locally as needed. |

Old stack: React 18, Vite 6, Tailwind 3, React Router, TanStack Query, Lucide, Radix, SweetAlert2, and other installed visual/form libraries; Express 4/Mongoose 8, MongoDB, JWT/bcrypt, Multer/Sharp, ImageKit, and SheetJS on the server. The package manifest lists React Router 7, whereas the README says Router 6. A dependency being installed does not prove every screen uses it: the inspected registration form uses local React state rather than React Hook Form/Zod.

Old request flow: browser page -> frontend API helper -> `/api` -> Express router -> authentication/permissions where required -> controller -> domain service/model -> MongoDB or media storage -> response -> local state/query cache -> UI. In the new project this ends at local fixture/state instead of the API.

## 3. Finalized public visual system

The source specification records the entire homepage as approved. Preserve its appearance during extraction. Full About/Contact redesigns, shared hero waves, and larger centered full-team layouts are recorded as implemented awaiting review; copying their current appearance does not retrospectively approve them.

### Colors, typography, alignment, and behavior

| Element | Recorded/current visual direction |
|---|---|
| Homepage ivory | `#FAF4EB` |
| Main homepage crimson | `#B30E1F`; hover `#990A18` |
| Public hero/CTA crimson | `#981B24` |
| Main homepage heading navy | `#031B44` |
| Other page heading navy | `#102B46` |
| Body copy | `#4A5568`; muted `#68717D` / `#5A626E` |
| Content background | `#FFFDF9`; some shell/form surfaces `#FFF9F2` |
| Blush panels | `#FDF3EF`; borders `#F3DEDA` / `#EAD7CF` |
| Camp card | `#FAF4EC` |
| Inspiration background | `#F8E9DA` |
| Footer | `#0B233D`, logo backing `#D9DEDC` |
| Impact fallback | `#5A040B` plus photo and 20% black overlay |
| Fonts | Lora serif headings; Inter configured sans, with system fallbacks. Global body CSS also specifies a system font stack; preserve actual applied styles rather than assuming all text is Inter. |

Shared container: `w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]`. Backgrounds, photographic bands, waves, and moving strips extend full width; text and ordinary grids use the content container. Older per-section measurements in the archived specification sometimes predate this alignment change. For visual extraction the current component classes are the concrete reference, not a reason to normalize different approved sections.

Preserve rounded cards, restrained shadows, visible keyboard focus, image aspect ratios, natural mobile stacking, and readable text without clipping. Do not introduce automatic shrinking of long copy or fabricated images. Google Fonts and the Google Maps embed are external resources even when the application has no backend; independent does not automatically mean fully offline.

### Shared hero wave

Used by About, Gallery, Team, Supporters, and Contact; excluded from homepage, registration, and admin screens. Fill matches next section (`#FFFDF9` by default). Decorative, noninteractive, hidden from accessibility tree. Heights: `h-8 sm:h-11 md:h-14 lg:h-16 xl:h-20`; hero reserves `pt-16 pb-24 lg:pb-28`; `translate-y-[1px]` prevents seams.

Exact geometry: `viewBox="0 0 1440 80"`; path `M0 42 C135 30 255 22 385 24 C535 26 620 43 750 51 C875 59 1000 60 1115 50 C1240 39 1340 20 1440 4 L1440 80 L0 80 Z`.

## 4. Visitor navigation and shared shell: step by step

1. Open a public route -> public layout supplies sticky navbar -> route content appears in the growing main area -> shared footer follows.
2. Click SKIT/BDC branding -> Home.
3. Desktop links -> Home `/`, About `/about`, Gallery `/gallery`, Team `/team`, Sponsors `/supporters`, Contact `/contact`; active route gets crimson emphasis/underline.
4. On mobile -> hamburger opens menu -> choose a destination; Escape closes it; widening viewport to desktop closes it. Keep accessible menu state and keyboard behavior.
5. Registration actions -> `/register`, sometimes with the old `camp_id` query parameter. The old navbar uses the label `Register`, while other CTAs say `Register Now`.
6. Old loading/error camp states disable navbar registration; available camp enables it; unavailable camp says Registration Closed. New UI should demonstrate these states locally without importing old eligibility enforcement.
7. Footer -> public quick links, institution identity, address/email, optional verified telephone and social destinations, current-year copyright. No admin/login shortcut belongs in the new public-only scope.
8. Old `/camps` and `/camps/:campId` redirect to Home; they are not working public schedule/detail pages. Any copied “View Camps Schedule” link must not be described as a separate implemented schedule feature.
9. Unknown route -> public 404/recovery. Original router places the 404 outside PublicLayout, so verify the intended visible shell before assuming it inherits navbar/footer.

Header dimensions: 68px then 72px; SKIT logo 44/48px high, BDC logo 40/44px. Desktop nav text 14–15px. Footer: four responsive columns, logo backing with 10–12px padding and 8px radius. Verified social URLs are still awaited; the source only renders supplied links.

## 5. Homepage: complete section and interaction flow

Locked sequence, with hero and current-camp card counted together: Navbar -> Hero/current camp -> About BDC -> Our Impact -> Gallery -> Our Team -> Our Partners -> Our Inspiration -> registration CTA -> Footer.

### 5.1 Hero and current-camp card

- Read eyebrow “SKIT JAIPUR · BLOOD DONATION CAMPAIGN” -> headline “Donate blood. Carry hope.” -> two-line description -> Register Now or Our Journey. Our Journey goes to About.
- Serif headline scales from 36px through 48/56/62/66px. Left copy stays readable over cream; photo subject remains on the right.
- One approved slide exists: `A01-home-hero-donor-v2.webp`, focal position `right 20%`. With one valid image, navigation is hidden. With two or more, show manual previous/next and `1 / N`; wrap first/last; no hero autoplay.
- Image failure -> remove that slide from valid list -> clamp current index -> hide controls if only one survives -> solid cream if none survive.
- Horizontal gradient is solid cream through 42%, fades through 44–53%, transparent at 54%. Mobile uses a vertical cream fade.
- Image ends behind the upper portion of the current-camp card; card lower portion sits over solid cream. Preserve this clipping/layer relationship and circular 44px controls.
- Camp request pending -> loading treatment; failed -> error/retry treatment; absent -> no-camp treatment; available -> camp title, date/time, venue, registration state and CTA. Do not show “no camp” before a pending request has resolved.
- Camp CTA -> same registration destination as hero; old code uses server `is_registration_available` to decide eligibility.
- Hero donor statistic -> same data source/value as the Donors metric below. Never use “lives impacted” interchangeably with donors.

### 5.2 About preview

Two-column desktop composition, text wider (`1.15fr / 0.85fr`), stacked on mobile -> small About BDC label -> centered two-line serif headline -> short paragraph -> Discover BDC -> `/about`. Photo frame is 5:3 with rounded corners; original approved photo remains awaited. Preserve the placeholder instead of inventing a replacement.

### 5.3 Impact

Full-width photographic band -> Our Impact label -> Blood Units Collected, Donors, Camps Organised. Shared visual baselines are `1,200+`, `2,500+`, `24+`; these are design/demo baselines, not newly verified historical statistics.

Scroll into view -> once-per-mount IntersectionObserver trigger -> 1.8s quartic ease-out count-up -> exact formatted target. Reduced motion -> target immediately. Screen reader receives final label/value, not every animation frame. Tabular numerals prevent jitter. Genuine zero displays `0`, not `0+`. Home/About/hero share values. In old service, network failure returns baseline values; unavailable values are not universally shown as dashes despite parts of the specification saying so.

### 5.4 Gallery preview carousel

Six local photos -> continuous horizontal loop around 45px/s -> duplicate track for seamless movement -> hover or focus pauses -> leave resumes unless explicitly paused. Pointer drag/touch swipe moves track; vertical scrolling remains possible (`touch-action: pan-y`). Arrow keys step the focused track. Explicit pause persists until Play. Reduced motion disables automatic movement.

Card ratio 16:10; widths 260/320/360/380px by breakpoint; rounded-2xl, subtle shadow, approximately 4px hover lift and 1.02 image scale. Cards have ONE visual layer; stacked decorative photo layers were removed. Missing photo -> same-sized placeholder, no layout shift. Duplicate content is hidden from screen readers. Pause/play: centered 44px control, visible on touch, hidden during ordinary desktop mouse viewing, revealed on keyboard focus. “View full gallery” -> `/gallery`.

### 5.5 Team preview

Chief alone centered on first row -> four members in equal desktop columns -> two-column member grid on mobile. Chief portraits 96/112px; member portraits 80/96px. Names share a baseline; no staggered layout. Placeholder portraits stay until approved photos exist. “Meet the full team” -> `/team`. Source homepage people are static, not fetched from the TeamMember service.

### 5.6 Partner marquee

Standalone proportionate logos on blush, not equal-width boxed cards. Six configured marks: SMS Hospital Jaipur, Indian Red Cross Society, NIMS Jaipur, HDFC Bank, Coca-Cola, SBI. This records source content, not independent verification of current sponsorship.

More than three logos -> measured moving track, three repeated sets, approximately 35px/s -> matching trailing padding and internal gaps prevent loop jump -> ResizeObserver and image load recompute width. Three or fewer -> centered wrapping static row. Hover/focus/drag/pause/reduced-motion behavior parallels gallery. Broken image -> text name. Height 40/48/56/64px; max widths 170/210/260px; gaps 64/80/112/128px. No side fades. “View all partners” -> `/supporters`.

### 5.7 Inspiration

Left values: Education, Service, Society, Self Reliance -> central ornamental arch and Swami Keshvanand portrait -> crimson divider with dot -> description “A legacy of education, selfless service and community upliftment.” -> “Values for a Better Tomorrow.” -> right slogan “Individual Development Leads to a Stronger Nation” and pale tree.

Keep portrait about 82% of arch interior height, base aligned, undistorted. Preserve muted beige-gold arch, pale botanicals, independent decorative layers, compact peach-cream background. Mobile reflows slogans horizontally/below copy; tree stays outside text. Bottom stroke wave is separate from HeroWave: `viewBox="0 0 1440 60"`, crimson 2px non-scaling stroke, no fill; exact path is retained in the appendix.

### 5.8 Final CTA and footer

Compact crimson band -> BE A LIFESAVER -> two-line headline -> white registration button -> registration screen. Desktop text/button vertically centered; mobile naturally stacks. Footer follows in deeper navy.

## 6. Other public pages: every existing flow and boundary

### 6.1 About — AWAITING REVIEW

Hero with crimson background and optional photo overlay -> shared wave -> three-photo row -> Our Story -> Mission/Vision/Values -> shared impact band -> registration CTA -> footer.

- Optional hero photograph absent -> solid crimson; no invented stock photograph.
- Three intro photos: left donor/medical care, center volunteer desk, right volunteer support. Center frame is taller, vertically centered; desktop three columns, mobile one column. Flanks heights 220/260/250/300/330px across specified breakpoints; center 250/300/300/360/400px.
- Story: centered heading “Built by students, for the community.” then two text columns -> one on mobile. Founding/affiliation claims, especially faculty/NSS guidance, are not independently verified.
- Mission/Vision/Values: one blush panel, three open columns with Target/Eye/Heart icons; no nested white cards; dividers disappear when stacked.
- Impact reuses Home values and motion, with metric icons; do not introduce separate totals.
- Closing “Join us at the next camp.” -> `/register`.

### 6.2 Full team — AWAITING REVIEW

Hero/wave -> Chief Coordinator group -> Members -> Student Coordinators -> Website Team -> remaining page content/footer. Static people arrays currently supply the page; names are demo/reference content, not an authenticated roster.

Each person -> circular portrait -> name -> crimson role; broken/missing portrait -> neutral SVG. No boxed profile cards. Chief 144/160/164px; others 112/128/138px. Text max-width 200px with wrapping. Group empty -> group grid returns no people. Flex wrapping centers every row, including incomplete final rows. Preferred desktop column range 1–6; defaults chief 3, other groups 5; responsive step-down protects readability. Seven people at five columns -> five centered then two centered. Local layout configuration exists; admin control for it is SHELVED.

### 6.3 Full gallery — IMPLEMENTED STATIC MOCK, WITH HISTORICAL POLICY CONFLICT

Hero/wave -> current-camp heading, date/time/venue -> category pills All/Donors/Team/Setup/Awareness/Highlights -> eight square placeholder photos -> Past Galleries accordion -> footer.

Click category -> selected pill styling changes. The current code does NOT filter the photo array. Click previous camp View Photos -> expand up to twelve placeholder tiles; opening another closes the previous one; click again hides. Current camp metadata says 12 photos while eight placeholders render. Dates/edition labels are mock values, not live camp data. No Radix lightbox exists in this current file despite the old PLAN claiming one was implemented.

Resolution for current extraction: preserve the visible public design as requested; classify historical cards/categories as local demonstration UI. Resolution for future real data: decide explicitly whether to retain historical public galleries or restore the old live-only policy before adding data access. Copying a mock archive is not permission to expose real historical records.

### 6.4 Supporters / Sponsors — IMPLEMENTED STATIC MOCK

Hero/wave -> title partner -> main sponsors -> supporting sponsors -> community partners -> Become a Sponsor CTA -> Contact. The static title partner is HDFC Bank; other names include Coca-Cola, SBI, Tata, Reliance, Amul, Nestle, Decathlon, boAt, Red Bull, Zomato, Red Cross, Fortis, Apollo, Jaipur Police, NSS, Rotary. Treat these as unverified sample content unless separately confirmed.

Title partner combines logo, divider, tagline; main sponsor panel is blush; other grids use white logo cards. Broken logos fall back to an inline LOGO placeholder. This differs intentionally from the homepage's unboxed moving logos. New configurable sections, empty-section auto-hiding and centered arbitrary row sizes are deferred concepts, not current behavior.

### 6.5 Contact — AWAITING REVIEW

Hero/wave -> single blush panel containing phone/email/address row -> message form -> compact coordinator contacts -> campus map -> footer. No FAQ, and no emergency blood-request queue or emergency-service claims.

Form fields: full name, email, optional phone, subject, message. Blur marks field touched -> validation becomes visible; editing touched/previously submitted field refreshes that field's feedback. Submit -> validate all -> show inline errors or an honest unavailable-delivery notice. Current source requires name at least 2 characters, subject at least 3, message at least 10; email format; optional phone 7–15 digits after permitted punctuation cleanup. Labels and `aria-*` associations support accessibility.

Old valid-submit action does not send a message: it reveals a prefilled `mailto:` link containing entered details. User clicks link -> mail application opens -> user must send there. New UI scope calls for local demonstrations, so no automated submission should be inferred. Old introductory “our team will get in touch” language overpromises delivery relative to the implementation.

Email shown: `bdc@skit.ac.in`; address: SKIT, Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017. These are source values, not newly externally verified. All three example coordinator phones and the main phone repeat `+91 141 350 0000`; the footer specification calls that number unverified. Do NOT promote it to a verified official contact. Preserve the layout while clearly treating sample contact data as sample; confirm real values before public launch.

Map iframe heights 320/400/450px; Open in Maps opens Google Maps in a new tab. This embed requires internet and is independent of the old backend.

### 6.6 Registration UI and receipt — historical real flow, new demo only

Entry via Register CTA -> optional `camp_id` query -> if absent, resolve featured camp -> load public camp detail -> loading -> unavailable/error or camp -> saved receipt if present -> otherwise closed state or editable form. Old receipt is checked after camp-load errors but before registration-closed state.

Fields: full name, guardian name, date of birth, blood group, email, role, institutional ID, branch/department, mobile, Aadhaar, address, explicit consent. Default role Student; blood group UNKNOWN; first branch selected. Roles: Student, Staff Member, Outside SKIT. Blood groups: A+/A-/B+/B-/AB+/AB-/O+/O-/UNKNOWN. Branch choices: Artificial Intelligence, Civil, Computer Science, Data Science, Electronics and Communication, Electrical, Information Technology, Internet of Things, Mechanical, MBA, Pharmacy.

Old input behavior: Aadhaar strips nondigits and displays groups of four up to twelve; mobile strips nondigits up to ten; changing Outside SKIT clears institutional ID and branch. Frontend currently also requires a department for staff, contradicting the backend's student-only branch rule. This is a mismatch, not a rule to inherit.

Submit -> local validation -> verify camp exists -> disable submitting action -> normalize payload -> post -> error notice or receipt. Error leaves inputs for retry. Old validation checks adult DOB, name, email, role fields, Indian mobile, Aadhaar format, address, consent; these are historical application rules, not new backend requirements or a complete medical eligibility assessment.

Success -> retain minimal receipt in same-tab sessionStorage -> scroll to top -> show registration ID, donor name, camp/venue/date/time details, screenshot instruction, copy and print options, home/register-another actions. Copy -> clipboard -> temporary checkmark. Print -> browser print presentation. Register Another -> clear receipt -> new submission key -> reset form/errors. A receipt is not a donor account, digital certificate, or proof that a donation occurred.

For the new project: preserve the form and receipt appearance using synthetic values and explicit demo wording; do not submit or permanently store identity data. Retaining visual role-dependent fields is UI behavior, while accepting/rejecting donor eligibility is a future product decision. Do not demand real Aadhaar for a UI demonstration.

## 7. Historical backend domain map — reference, not a new schema

| Entity | What it represented and related to |
|---|---|
| SiteSettings | Singleton `GLOBAL_SETTINGS`; selected live camp; institution settings; impact baselines. |
| Camp | Event year/name/location/dates/timezone; publication/archive/completion/deletion flags; registration switch; per-module visibility; summary totals. Old schema uniquely indexes year, effectively one camp record per year. |
| Registration | Belongs to camp; donor details; consent; submission key; human registration ID; outcome; certificate collection metadata. |
| Donation | Linked to registration, with units/date/verifier and revocation metadata; reused instead of duplicate records when reinstating donation. |
| Counter | Per-year atomic registration sequence. |
| TeamMember | Camp-scoped person/category/order/image/role/phone. Legacy coordinator arrays also remain in Camp. |
| Media / GalleryAlbum | Media and older album-capable structures; approved operational direction was simple camp photos, not album management UI. |
| Organization | Shared sponsor/partner with per-camp associations, visibility, order; global name/logo changes may affect every associated camp. |
| Content | Section key plus nullable camp ID; draft and published payloads. Null camp means global fallback. |
| Announcement | Camp notice with title/message, active flag, priority, dates, order. |
| Admin | Active account, password hash, role, module permissions, token version. |
| ActivityLog | Audit data structure; presence does not establish that all mutation paths write logs. |
| ImportBatch / ImportRow | Upload metadata, matching/validation/staging, confirmations and row records; some broader workflows remain incomplete. |
| HistoricalRecord | Older data structure, separate from tracked registrations; historical management UI is a placeholder. |

Useful conceptual separations for future design: event vs its published website; draft vs public content; registration vs verified donation; donation vs certificate collection; organization identity vs its association with an event; asset file vs a page's asset reference; present live selection vs historical retention. These are recommendations to consider, not a mandate to reuse the models.

## 8. Historical operational flows

All flows in this section are excluded from the new UI project. They are retained because the user requested the complete knowledge transfer.

### 8.1 Administrator entry and permissions

Provision account through administrative process -> login email/password -> normalize email -> verify active account and bcrypt password -> issue one-hour HS256 JWT -> browser stores token -> `/auth/me` resolves account -> show authorized modules. Reload -> verify stored session; 401 clears token/cache; network error retains token but does not grant unverified access. Logout clears browser token/state/cache, not a server-side session. Password reset increments token version so old tokens fail.

Super Admin bypasses module permission checks and manages admin accounts. Regular Admin permissions include `camp_management`, `registration`, `team`, `gallery`, `partners`, `home_page`. Enter selected camp -> workspace modules -> switch camp returns to camp list. Last active Super Admin must not be removed/demoted/deactivated. The old in-memory mutex only serializes one server process; it is not proof of multi-instance safety.

The `/admin/dev` screen redirects to login, but the public `/api/auth/developer-signup` endpoint still exists and creates inactive accounts. Old “developer signup removed” claims must not be inherited as fact.

### 8.2 Camp lifecycle

Create camp -> draft/unpublished, not archived, registration closed -> fill camp information -> publish -> optionally choose as live -> independently open registration if eligible. Creating camp does NOT clone homepage template content in the current code.

Choose live camp -> replace `SiteSettings.featured_camp_ref` -> public live APIs resolve that camp -> prior selection remains stored and can be selected again. “Previous Year Camps” describes the admin list grouping; it is not equivalent to setting `is_archived` or deleting the previous camp. A prior camp's own registration switch need not be reset merely by switching selection; only active-camp enforcement prevents submissions to it.

Unpublish -> publication false -> registration closed -> clear featured pointer if it pointed here. Archive -> archive flag true and registration closed; do not infer that every public read excludes archived camps, since the shared live resolver checks publication/deletion but not archive/completion. Complete (tracked years) -> completed flag/time/actor -> registration closed -> count as completed for old impact calculation. Undo completion -> clear completion metadata -> registration remains closed until explicitly reopened. Super Admin delete -> soft-delete metadata -> close registration -> clear selected live pointer -> preserve historical records rather than cascade deletion.

### 8.3 Registration availability

Historical submission gate: active selected camp must exist and not be deleted; it must be published, not archived, not completed, year at least 2026, registration switch ON, and registration visibility not explicitly disabled. Dates/window fields exist but the shared availability predicate does not use time-based opening/closing. Therefore do not infer an automatic schedule gate from those fields.

Open switch does not make a camp live. Published does not mean live. Completed is not deleted. Hidden registration is separate from hidden team/gallery. Closing registration does not erase receipts/registrations. Future implementation must choose these semantics explicitly again.

### 8.4 Public registration persistence and retries

Resolve active camp -> reject foreign requested camp -> eligibility check -> validate/normalize donor -> encrypt Aadhaar with AES-256-GCM -> check bounded scalar submission key -> if same key and matching name/mobile/email, return saved minimal receipt -> if reused with different payload, conflict -> otherwise check existing same-camp mobile -> return existing receipt with alreadyRegistered flag -> allocate sequential ID -> save PENDING registration and consent -> return receipt.

ID format: `skitbdc<year>_<sequence>`, zero-padded to four digits until 9999, then expands naturally. Counter initializes above existing numeric suffixes, then atomic increment reserves next value. Sequence uniqueness is useful; gapless numbering is not guaranteed by a separate counter/save flow.

Submission-key compound index gives database protection for same-key retries. Same-mobile deduplication is a separate lookup without a unique camp/mobile index, so different-key concurrent requests can race. Returning an existing receipt based solely on submitted mobile also needs a fresh privacy/recovery decision. The old one-key receipt sessionStorage value is not namespaced per camp and may become stale when moving between camps.

### 8.5 Registration management

Select camp -> load paginated registrations and counts -> filter name, exact registration ID, outcome and other supported fields -> changing filters resets page -> cancel/ignore stale requests -> select donor -> drawer/details -> confirm donated, record not donated, or correct outcome -> refresh table/counts. Mask Aadhaar in administrative responses; never expose encrypted envelope or plaintext Aadhaar in public receipt.

### 8.6 Donation outcomes and correction

Initial outcome PENDING -> authorized confirmation -> transaction updates Registration to DONATED and creates/reinstates linked Donation -> repeat confirmed operation returns alreadyConfirmed. NOT_DONATED requires reason -> update Registration -> revoke any active Donation, do not delete it. Correction requires allowed new outcome and nonempty correction reason -> compare previous outcome for concurrent changes -> update -> revoke or reinstate Donation as needed -> commit; concurrent conflict requires retry. Same-value correction is rejected.

Allowed tracked outcomes: PENDING, DONATED, NOT_DONATED. Old placeholder DEFERRED/DID_NOT_DONATE wording is not the active tracked enum. Reconciliation does not establish certificate collection automatically; certificate state is conceptually separate. These operations require MongoDB transactions/replica set; a standalone local database is not sufficient for the full workflow.

The service comments mention ActivityLog entries but inspected donation service/controller contain no corresponding ActivityLog write. A future audit trail must be deliberately designed; do not claim current outcome changes are fully audited.

### 8.7 Excel export

Select camp and columns -> server selects camp registrations -> allowed columns -> masked Aadhaar -> escape strings beginning with formula-control characters -> construct workbook -> download. Existing export options include legacy gender/year-of-study columns not populated by the current registration form; do not infer new required fields from export options alone.

### 8.8 Excel import and reconciliation

Select camp -> upload workbook -> first sheet parsed -> validate IDs/names/statuses/camp membership -> preview matches, duplicates, wrong-camp/unknown IDs and errors -> save staged batch with file hash -> return batch token -> explicit confirmation -> apply matched transitions via donation service -> report updated/already-confirmed/errors.

Core FINALIZED-OLD rule: partial updates only. Omitted registrations retain their EXACT existing status, which may be PENDING, DONATED, or NOT_DONATED. Missing from sheet never means NOT_DONATED. Upload alone is not donation confirmation. Repeated confirmation must not inflate totals.

Actual limits: controller checks 10MB and 5,000 rows, while shared constant says 10,000. Parser accepts several aliases; blank outcome defaults to DONATED for certificate-list semantics, whereas unknown nonblank values return invalid. Confirmation processes DONATED and NOT_DONATED; it does not implement an explicit PENDING transition branch.

Important implementation gaps: confirmation can process caller-supplied `valid_matches` without a valid token; advertised token expiration is not implemented in the inspected batch schema/controller; `PROCESSING` is written but absent from the declared batch-status enum; some failures can leave processing state; the final batch can be CONFIRMED even with per-row errors. This is not a guaranteed all-or-nothing batch transaction. Preserve the intended preview/confirm flow, not these flaws.

### 8.9 Homepage drafts, publication, and notices

Old content editor -> choose global or camp endpoint -> read draft if present, else published, else defaults -> save draft without changing published payload -> preview under authentication -> publish supplied payload or current draft -> set published payload and flag -> clear draft.

Public content endpoint -> live-camp published record -> otherwise global published record -> otherwise shared constants. However current visual HomePage does not read this endpoint; it renders local layout/content plus camp and impact hooks. Successful CMS publishing is therefore not proof the current homepage visually changes.

Notice editor -> create/edit/order/activate camp notice -> public notice endpoint resolves selected camp -> requires active flag and start date reached -> requires no expiry or unexpired end date -> sort priority descending/order ascending/creation descending. Current HomePage has no corresponding notice-fetch/render integration. Public notices need their own live-camp visibility validation if rebuilt.

### 8.10 Team and coordinator management

Select camp -> select category -> create/edit person -> optional photo upload -> ordered list -> move up/down -> public live-team endpoint returns scoped data subject to visibility. Categories include Chief Coordinator, Members, Student Coordinators, Website Team, Volunteers. Old Camp coordinator arrays coexist with TeamMember; current public pages are static, so “single authoritative team everywhere” is not achieved end-to-end.

### 8.11 Gallery media management

Select camp -> upload photo -> validate and store -> persist camp media record -> show ordered thumbnails -> replace updates selected photo -> reorder -> delete removes relevant record/asset according to handler. Public live gallery checks camp/visibility, but current public GalleryPage does not consume it. Captions/alt metadata may remain in storage even though simple-photo management was preferred over album/title/caption controls.

### 8.12 Partners and sponsors

Global organization record -> associate with camp -> per-camp visibility/order -> public endpoint selects published, eligible organizations for active camp. Camp workspace removal -> unlink camp association, preserving global organization and other associations. Global deletion is a different operation with broader effect. Editing shared logo/name can affect multiple camps; future independent content design must settle this rather than silently duplicating or migrating records.

### 8.13 Media storage

Upload -> bounded multipart handling -> image signature/decoding checks depending on handler -> ImageKit when configured or local fallback -> write DB reference -> cleanup orphaned newly uploaded asset on persistence failure where implemented. Camp folders use `/BDC/BDC_Camp_<year>/` with gallery/partner/team subfolders.

Image service supports JPEG/PNG/WebP, max dimension 4096 and pixel bound `16 * 1024 * 1024`; logo trim/processing exists. Some handlers still contain separate signature validation, and the common service explicitly bypasses full decode for tiny test-like buffers. Do not copy this bypass or assume every upload uses one consistent hardened pipeline. Public SVG logo assets do not mean uploaded SVG is accepted.

### 8.14 Impact calculation

Old backend baseline: 1,000 blood units and 23 camps through 2025; tracking begins 2026. Endpoint adds count of tracked DONATED registrations to units, and count of tracked completed camps to camps. It does not return aggregated donors. It counts registrations rather than summing Donation.units, and queries do not fully apply soft-deleted-camp exclusions. Frontend demo fallback instead uses 1,200 / 2,500 / 24.

Therefore the two baseline sets serve different roles and must not be added together. Future product needs explicit definitions for unique donors vs registrations vs donations vs units, completed camp count, historical coverage, and deleted/archived records. Shared display consistency is approved; the actual verified totals remain a data decision.

### 8.15 Placeholder-only admin areas

Historical import, Activity/Audit UI, Settings, and standalone Reconciliation pages currently render PlaceholderCard planned-feature descriptions. Their existence is not proof of working consoles. Historical plans include 16-column template, preview, duplicate detection, explicit exclusion, reversal, multi-year filtering/export, and prevention of summary/detail double-counting. Reconciliation plans include name cross-checks and independent certificate collection. Settings text still refers to two designated coordinators, predating broader admin management. All are excluded now; preserve only their ideas for later evaluation.

## 9. Shelved feature register and intended future flows

Nothing in this section is authorized for implementation by this review.

| Feature | Preserved intended flow and boundaries |
|---|---|
| Independent camp homepage templates | Edit master -> create camp -> copy master into camp-owned records -> edit/publish camp independently -> select live camp -> show its published content. Later master edits affect future camps only. |
| Template migration | Inventory global/camp content -> explicit mapping/migration -> preserve historical edits -> no silent overwrite. This was for evolving old data, not authorization to import it into the new project. |
| Image reference isolation | Share default asset files -> replacing image changes selected camp's reference only -> never delete shared fallback while still referenced elsewhere. |
| Target-slot uploads | Choose Hero/About/Inspiration/etc. slot -> display required ratio/dimensions -> select asset -> apply only to chosen destination. No current complete slot editor. |
| Crop/zoom preview | Select photo -> crop/zoom to slot guidance -> preview -> confirm -> upload; not implemented. |
| Browser WebP conversion | Select source image -> compress/convert locally -> preview/upload; not implemented. |
| Visual page image replacement | Click editable target slot -> choose replacement -> preview -> save/publish; shelved. |
| Inspiration editing | Edit section label/name/description/closing/slogans -> field limits -> preview -> publish. Natural text growth, plain text by default, no overlap or illegible shrinking. |
| Site-wide dynamic copy rules | Validate empty/long/unbroken text and mobile wrap; keep decorations independent; restricted rich text only if approved. |
| Team row controls | Per-section preferred desktop count 1–6 -> bounded validation -> responsive overrides -> centered incomplete rows. Local visual config exists; persistent admin controls do not. |
| Sponsor section management | Create/reorder section with eyebrow/title/description/ordered sponsors/visibility -> associate with camp -> publish eligible entries -> display only enabled nonempty sections. |
| Empty sponsor sections | Remove/unpublish last eligible sponsor -> hide entire public section including spacing/background -> keep admin empty badge; first published entry restores enabled section. Image failure alone must not hide valid content. |
| Sponsor size controls | Preserve aspect ratios and documented bounds; per-logo admin sizing remains deferred. |
| Contact backend | Validate server-side -> spam/rate protections -> store and/or dispatch notification -> honest delivery result; no current POST contact pipeline or inbox. |
| Phone/contact management | Configure verified institutional/coordinator phones per camp -> normalize/validate -> update public links. |
| About CMS | Edit hero/optional photo/overlay, three-photo row/alt/order, story/affiliations, Mission/Vision/Values -> preview -> publish. Exact upload ratios need reconciliation with rendered geometry. |
| Historical import/reversal | Template upload -> preview -> resolve/exclude invalid rows -> confirm batch -> maintain reversible provenance -> aggregate without double counting. Current admin page is placeholder. |
| Audit/settings/backup consoles | Operational history/search, account/system settings, backup visibility/recovery documentation were discussed; do not mark these complete from placeholder screens. |

## 10. Contradiction register and explicit resolutions

“Resolution” here means how to interpret the handoff. It does not mean source code was fixed or a new business rule approved.

| Conflict | Resolution for this handoff |
|---|---|
| Initial extraction included admin; latest user says public only | Latest decision wins. Remove admin/login in destination; historical admin flows stay in this document only. |
| Old PLAN says keep backend architecture; user wants independent UI | Old maintenance constraint does not apply to new project. No old backend dependency. |
| Old PLAN prohibits new Markdown; user requests review.md | Explicit request authorizes this document. |
| Two design-spec files | Identical at review time; one archived copy is enough. Future divergence must be resolved explicitly. |
| Spec history says homepage awaiting review; current status says approved | Current status matrix says whole homepage approved; older changelog rows are historical. |
| Full pages assumed approved because homepage approved | About/Contact/wave/full-team changes retain their recorded awaiting-review status. |
| Live-camp-only rule vs public Past Galleries | Current past gallery is mock visual content. Future historical data exposure remains unresolved; no implicit authorization. |
| Plan says Gallery Radix lightbox implemented | Current GalleryPage is placeholder grid/accordion without lightbox. Plan claim is stale. |
| Category filters look functional | Current category state only changes pill styling; no filtering. |
| “Verified/working” contact phones vs footer's unverified warning | Phone is unverified sample. Actionable tel link is not verification. |
| Contact intro promises response vs no delivery | Only mailto composition exists. New demo must not claim sent/received. |
| Live team/coordinators everywhere vs local arrays | Backend team service exists; public homepage/team/contact remain static. |
| CMS publishing vs fixed HomePage | Content endpoints do not automatically drive current public HomePage. New CMS needs explicit binding later. |
| Template-on-create described as confirmed | Confirmed future design, explicitly shelved; code creates camp only. |
| Partner logos described as boxed text in image table | Current approved homepage uses unboxed real logo assets/text error fallback; Supporters retains card placeholders. |
| Gallery image table mentions stacked photos | Current approved carousel uses single-layer cards; stacked layers are historical. |
| Section-specific old margins vs shared container | Preserve current source layout; shared alignment is later guidance. Do not blindly apply stale per-section wrapper values. |
| About image ratio recommendations differ | Rendered frame geometry is current visual reference. Future upload constraints remain to be selected, not inferred. |
| 1,200/2,500/24 vs 1,000/23 baselines | Frontend design fallback vs backend historical coverage. Neither is newly verified; never combine blindly. |
| “Blood units” vs count of DONATED registrations | Implementation assumes one count per registration, not summed Donation.units. Future metric definition must be explicit. |
| Null/loading dash rule vs baseline fallback | Low-level formatter supports dash; old service falls back to fixed baseline on unavailable/error. Preserve demo values honestly. |
| Previous year camp vs archived | Non-live grouping differs from irreversible archive flag. Switching live pointer does not archive/delete prior camp. |
| Registration window fields vs manual availability | Inspected predicate uses flags/year/manual switch, not opening/closing timestamps. |
| Staff department required in frontend vs student-only backend | Historical mismatch; do not transplant into new domain rules. |
| Donation API helpers vs server routes | Helpers use POST; server requires PATCH. NOT_DONATED URL also differs. Correction helper sends `reason`; controller expects `correction_reason`. Confirmed static integration mismatch, not runtime-tested here. |
| “Partial imports leave all omitted PENDING” wording | Preserve omitted records' actual status; never reset an already resolved outcome. |
| Mandatory expiring import token claims | Inspected confirmation permits tokenless matches and no actual expiry is evidenced. Treat as unresolved implementation defect. |
| Import PROCESSING state vs schema | Controller writes a status missing from enum; lifecycle contract is inconsistent. |
| Import recognized PENDING vs confirmation logic | Parser accepts PENDING; confirmation has no PENDING processing branch. Do not call it implemented correction. |
| Invalid outcomes rejected vs blank default | Unknown nonblank rejected; blank becomes DONATED for certificate-list intent. A future generic import needs explicit default semantics. |
| Import 10,000 shared rows vs controller 5,000 | Current handler enforces 5,000. Decide one consistent limit if rebuilt. |
| Fully audited donation service comments | No ActivityLog write in inspected service/controller. Audit capability is incomplete at that path. |
| Developer signup “disabled” | UI redirects; public inactive-account creation endpoint remains. |
| Legacy admin routes “retired” | Old router still mounts global pages beside camp workspaces. Exclude both from new UI. |
| React Hook Form/Zod modernization “complete” | Packages installed, but RegisterPage uses local state/custom validation. |
| All image uploads restricted to gallery | Hero/team/coordinator/organization upload endpoints exist. Slot-based editor is what remains shelved; old `/api/gallery/upload` wording is stale, upload route is POST `/api/gallery`. |
| Full Sharp protection everywhere | Separate validation handlers and tiny-buffer decode bypass exist. Reassess if rebuilding uploads. |
| Mongo standalone permitted vs transaction operations | Basic reads may work; donation transaction workflow requires replica set/compatible deployment. |
| All tests passed means source is correct now | PLAN records old results; does not validate current UI/API integration or destination project. |
| One camp per year vs flexible future event planning | Old Camp.year is unique; do not silently impose that limit on the new schema. |
| Shared models mean data should migrate | User explicitly wants independent new relations. No data migration is currently authorized. |

## 11. Useful lessons to retain without importing old code

- Keep one source for repeated public values: camp metadata, donor totals, contact information, and shared person identities. UI mocks may use local fixtures; real sources are a later decision.
- Separate visible design from factual truth. Placeholder dates, people, logos, totals, and telephone numbers are not production verification.
- Distinguish loading, empty, hidden, error, closed, and unavailable states; collapsing them causes misleading messages and disabled actions.
- Draft editing should not affect public content until explicit publication. Selected event must scope every relevant request and cache key if a backend is later built.
- Switching active event should not destroy old records or shared assets. Linking/unlinking is different from deleting a shared object.
- For transactional workflows, test frontend method/path/body contracts as well as isolated backend handlers; the donation mismatch is a concrete example.
- For imports, preview must be authoritative and confirmation must consume a bounded server-side batch, not arbitrary client assertions. Define expiry, ownership, retry, partial failure, and recovery.
- Define metric units and unique-person counting before implementing aggregates. A registration, donor, donation, blood unit, and certificate are different things.
- Keep image dimensions and focal position with their intended slot. Missing image must not collapse layout or create recursive error fallback.
- Treat form errors, keyboard operation, touch scrolling, reduced motion, focus visibility, and duplicate carousel accessibility as UI requirements, not later polish.
- Do not treat a package installation, placeholder page, comment, checked checkbox, or successful build as proof an end-to-end feature works.
- Old sensitive-data requirements are not a reason to collect the same information again. Decide future minimum data needs independently.

## 12. Public assets and replacement guidance

| Slot | Current asset / fallback | Guidance |
|---|---|---|
| Institutional branding | `assets/Skit_logo.png`, `assets/bdc_nav_logo.svg` | Preserve proportions and navbar/footer backing treatments. |
| Hero | `assets/A01-home-hero-donor-v2.webp` | Right-side subject; target 1920×820, minimum 1600×700; per-slide focal point; only one approved slide. |
| Home About | ImagePlaceholder | 5:3; target 1200×720, minimum 800×480. |
| About hero | Solid crimson | Optional approved photo, target 1920×820; controlled overlay. |
| About intro | Three placeholders | Preserve taller center and actual frame heights; final photography and upload aspect guidance unresolved. |
| Impact | `assets/bdc_impact_slightly_bright_webp.webp` | 2171×724, approximately 3:1; 20% dark overlay, no double-heavy tint. |
| Gallery carousel | Six files in `assets/gallery` | 16:10 target 800×500, minimum 640×400; actual names preserved in appendix. |
| Team | Neutral circle/SVG placeholders | Square portraits, target 500×500, minimum 300×300; no faces extracted or invented. |
| Partners | Six files in `assets/partners` | Contain, natural ratio, transparent whitespace trimmed, bounded size. |
| Inspiration arch | `assets/inspiration_arch.png` | 627×593 source; muted treatment; avoid restoring removed stray pixels. |
| Inspiration portrait | `assets/inspiration_swamiji.png` | Existing 85×138 image; preserve face, alpha, and base alignment. |
| Inspiration decorations | `inspiration_botanical_left.png`, `inspiration_botanical_right.png`, `inspiration_tree.png` | Pale, noninteractive, independent from text. |
| Hero wave reference | `assets/bdc_team_wave_reference_v2.svg` / HeroWave | Preserve exact approved path. |

Missing approvals/assets: homepage About photo; three About intro photos; optional About hero; more approved hero slides; original team portraits; official social destinations; confirmed phones/coordinator identities; historical affiliations; final production status of hero image; future static-vs-managed inspiration/partner content.

## 13. New-project verification and later decision list

Current UI-only acceptance:

1. All eight public destinations render and links recover from direct refresh; no admin/login entry points remain.
2. Source project and backend can be absent/stopped; destination has no cross-directory imports, symlinks, credentials, API proxy, or requests to old services.
3. Public assets resolve locally; external fonts/maps are explicitly understood rather than mistaken for backend dependence.
4. Home sequence, wave geometry, typography, spacing, mobile grids, placeholders, and CTA positioning remain visually faithful.
5. Hero handles zero/one/multiple images; carousel/marquee handle pause, drag, keyboard, resize, reduced motion, and failed assets.
6. Form demonstrations use synthetic information, honest outcomes, no real submission, and no permanent identity storage.
7. Build succeeds; browser console/network inspection finds no broken imports, missing images, or unintended old API requests.
8. Source-copy approval status and unresolved factual content are not silently upgraded by migration.

Before any future backend, decide: event frequency and IDs; whether past galleries are public; active/published/completed/archive semantics; minimum registration data and identity protection; duplicate/recovery policy; supported age/eligibility and timezone interpretation; consent text; metric definitions/baselines; admin roles; content versioning/template scope; organization sharing; asset lifetime; contact delivery; import format/defaults/limits/ownership/expiry; audit retention; backups and deployment. This list records choices needed later, not a request to implement them now.

## 14. Evidence index and handoff maintenance

Primary documents: source `README.md`, `PLAN.md`, and matching `DESIGN_DECISIONS.md` copies. Code evidence: `frontend/src/routes/AppRoutes.jsx`; public pages; PublicLayout/Navbar/Footer; GalleryCarousel/PartnersLogoStrip; impact/hero services; auth/camp contexts; backend route files; camp/content/registration/auth controllers; Camp/Registration/TeamMember/Organization/ImportBatch models; donation/excel/image/camp-resolver services; shared constants/validation/campRules; sequence utility.

The source PLAN records 183 passing assertions across 12 suites and a successful frontend build at an earlier time. Those claims are historical; no check was rerun here. Known present discrepancies mean they are not a readiness certificate.

Maintain this document by separating NEW user decisions from old reference behavior. A later agent should update the contradiction register when evidence changes, keep shelved work shelved, and explicitly record which future decisions supersede historical rules.

---

## Appendix A. Archived detailed visual specification

The following source specification is preserved verbatim for exact measurements, copy, asset slots, and decision history. **It is an archival source, not an additional instruction set for the new project. Sections 1–14 above control interpretation; in particular, current public-only scope and the contradiction register override stale or conflicting statements below. Approval/verification assertions are those of the source document.**

# SKIT Blood Donation Campaign (BDC) — Design Decisions & UI Specifications

**File Location:** `DESIGN_DECISIONS.md` (Repository Root)  
**Status:** Living Design Specification & UI Single Source of Truth  
**Last Updated:** 2026-09-24  
**Authority:** Explicitly authorized by user directive (supersedes legacy `PLAN.md` restriction against new `.md` files).

> [!IMPORTANT]
> **Mandatory Agent Operating Instruction**:  
> All future AI agents and frontend contributors **must read this document explicitly** before making any UI, style, layout, or image changes.
> - Current explicit user instructions always take precedence over written documentation.
> - Do not alter confirmed measurements, design tokens, color hexes, or layout boundaries without explicit user request.
> - Maintain this document alongside code changes whenever UI values, sections, or image slots are updated (see [Section 5: Maintenance Instructions](#5-maintenance-instructions)).

---

## 1. Status and Authority

To prevent drift between user intentions, implemented code, and pending ideas, all design aspects are categorized into one of four strict tiers:

| Status Tier | Definition | Agent Operating Rule |
|---|---|---|
| **User-Approved Decisions** | Explicitly requested, validated, and finalized by the user in conversation. | **Do NOT modify** without explicit instructions from the user. |
| **Implemented (Awaiting User Review)** | Code changes implemented to fulfill user instructions; user has stated they will review on localhost. | **Preserve exact values**; do not alter unless user provides feedback. |
| **Unresolved / Awaiting Confirmation** | Open questions where requirements are partially specified or pending future production assets. | **Flag explicitly**; do not guess or fabricate arbitrary defaults. |
| **Deferred (Not Authorized)** | Conceptual ideas, optimizations, or architectural proposals discussed but not approved. | **Strictly prohibited from implementation** until user authorizes in writing. |

### Current Status Matrix

- **User-Approved Decisions**:
  - Entire Homepage Design & All 10 Sections: The homepage is complete and approved in full by the user (Navbar, Hero + Current Camp Card, About BDC, Our Impact, Gallery Carousel, Our Team, Our Partners Marquee, Our Inspiration, Registration CTA, and Global Footer).
  - Warm Ivory & Deep Crimson brand identity palette (`#FAF4EB`, `#B30E1F`, `#031B44`, `#4A5568`, `#EAD7CF`, `#FAF4EC`, `#0B233D`, `#981B24`, `#D9DEDC`).
  - Homepage section order: 10-section sequence strictly locked (Navbar $\rightarrow$ Hero + Current Camp card $\rightarrow$ About BDC $\rightarrow$ Our Impact $\rightarrow$ Gallery $\rightarrow$ Team $\rightarrow$ Partners $\rightarrow$ Inspiration $\rightarrow$ Final CTA $\rightarrow$ Footer).
  - Navbar branding & typography: SKIT logo (`h-11 sm:h-12`), BDC logo (`h-10 sm:h-11`), compact header height (`h-[68px] sm:h-[72px]`), desktop navigation links (`text-sm md:text-[14px] lg:text-[15px]`), and right-aligned "Register Now" button.
  - Hero layout composition: Left margin at ~10% (`lg:px-[10%]`), supporting description strictly constrained to 2 lines, compact vertical spacing, responsive headline (`text-4xl sm:text-5xl md:text-[56px] lg:text-[62px] xl:text-[66px]`).
  - Hero image architecture & controls: Clipped image layer ending behind Current Camp card, 42%–54% horizontal cream gradient, circular white navigation buttons (`w-11 h-11`), readable slide counter (`1 / N`), auto-hidden when $< 2$ images.
  - Shared impact statistic: Consolidated with Section 4 ("Our Impact") via `impactService.js` and `useImpactData()` (`2,500+ Donors across our camps`).
  - Current Camp card: Desktop outer margins `lg:px-[8%]`, inner padding `lg:pl-[2.2%]`, background `#FAF4EC`, border `#EAD7CF`, date/venue metadata row with vertical divider, and bottom-aligned "Register Now" button (`lg:self-end` with `lg:items-end`).
  - About BDC section: Compact two-column layout (`lg:grid-cols-[1.15fr_0.85fr]`), centered text column with small crimson uppercase label, 2-line Lora serif headline (`#031B44`), 3-line constrained paragraph, "Discover BDC" outline button, and 5:3 landscape image slot (`aspect-[5/3] rounded-2xl`).
  - Our Impact section: Full-width photographic background (`/assets/bdc_impact_slightly_bright_webp.webp`, 2171×724px) with subtle 20% black contrast overlay, centered uppercase `OUR IMPACT`, 3 animated stat counters via `useCountUp.js` (1.8s `easeOutQuart`, tabular-nums, reduced motion support), and desktop vertical dividers.
  - Gallery carousel: Continuously moving horizontal photo card strip (`aspect-[16/10] rounded-2xl`, subtle shadow, 3–4px hover lift) with 6 authentic BDC photos, drag/swipe, arrow keys, and centered 44×44px pause/play button (visible on touch/mobile, hidden on desktop with mouse, auto-pause on hover/focus, revealed on keyboard focus).
  - Our Team section: Corrected row alignment with Chief Coordinator alone in row 1 centered beneath heading; all 4 members in row 2 with equal spacing (`lg:grid-cols-4`), aligned portrait horizontal line and name baseline; circular portrait hierarchy (`w-24 sm:w-28` vs `w-20 sm:w-24`); responsive mobile 2-column grid.
  - Our Partners logo marquee: Standalone logos on `#FDF3EF` blush container with natural aspect ratio widths, bounded heights (`h-10 sm:h-12 md:h-14 lg:h-16`) and max width (`max-w-[170px] sm:max-w-[210px] lg:max-w-[260px]`), generous explicit gap (`gap-16 sm:gap-20 lg:gap-28 xl:gap-32`), matching trailing loop padding, dynamic track calculation, and no side fades/boxes/shadows.
  - Our Inspiration section: Warm peach-cream background (`#F8E9DA`), muted beige-gold arch (`inspiration_arch.png`, 187 stray pixels cleaned), Swami Keshvanand portrait at ~82% interior height with base on arch base, pale botanicals, thin crimson vertical divider with top dot, 2-line description, right slogan, isolated tree halved to ~130–155px, and full-width bottom inline SVG crimson wave (`#B30E1F`).
  - Registration CTA: Compact crimson banner (`bg-[#981B24]`, `py-6 sm:py-7 lg:py-8`), "BE A LIFESAVER" label, 2-line bold serif headline, white "Register Now" action button, vertically centered (`sm:items-center`), natural mobile stacking without clipping.
  - Global Footer: Deeper navy `#0B233D`, 4 responsive columns, branding lockup on `#D9DEDC` backing card with 10–12px padding and 8px corner radius (`rounded-[8px]`), verified email/address, conditional social links, and current year copyright.
  - Consistent Public-Site Margins: Shared content container (`w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]`) aligning flush with navbar content boundaries (SKIT logo on left, Register button on right) across all public pages, with full-width backgrounds, waves, and moving strips.
  - Creation and maintenance of `DESIGN_DECISIONS.md` as the authoritative UI single source of truth.

- **Implemented (Awaiting User Review)**:
  - Shared Hero Bottom Wave Divider (Public Pages): Reusable hero wave divider component (`HeroWave.jsx` in `frontend/src/components/common/HeroWave.jsx`) applied consistently to all 5 public pages with hero banners (`AboutPage.jsx`, `GalleryPage.jsx`, `TeamPublicPage.jsx`, `SupportersPage.jsx`, `ContactPage.jsx`).
    - Uses exact approved reference curve from `/assets/bdc_team_wave_reference_v2.svg` (`viewBox="0 0 1440 80"`).
    - Preserves exact curve path (`M0 42 C135 30 255 22 385 24 C535 26 620 43 750 51 C875 59 1000 60 1115 50 C1240 39 1340 20 1440 4 L1440 80 L0 80 Z`) with filled area below curve (`L1440 80 L0 80 Z`).
    - Fill color matching: Dynamically matched to each following section's background (`fill="#FFFDF9"` default across public pages).
    - Responsive bounded height: `h-8 sm:h-11 md:h-14 lg:h-16 xl:h-20` (~32–44px mobile, ~56–80px desktop), perfectly conforming to 28–48px mobile and 48–80px desktop specification.
    - Full-width anchoring: `absolute bottom-0 left-0 right-0 w-full z-10` with `translate-y-[1px]` subpixel seam protection.
    - Reserved headroom: Hero banners use `pt-16 pb-24 lg:pb-28` to ensure headings and descriptions are never covered.
    - Accessibility & pointer events: Fully decorative with `aria-hidden="true"`, `role="presentation"`, and `pointer-events-none select-none`.
    - Clean replacement: Replaced temporary curved decoration (`rounded-t-[50%]`) on all 5 pages without stacking multiple dividers. Strictly excluded from homepage (approved and locked), registration forms, admin screens, and non-hero pages. Awaiting user review.
  - Full Team Page Person Layouts & Always-Centered Grid (`TeamPublicPage.jsx`): Refined person layouts for Chief Coordinator, Members, Student Coordinators, and Website Team:
    - Circular Portraits: Scaled up by ~20–25% from original 112px size. Members, Student Coordinators, and Website Team portraits sized to `w-28 h-28 sm:w-32 sm:h-32 lg:w-[138px] lg:h-[138px]` (138px on desktop, +23.2% increase); Chief Coordinator portrait slightly larger at `w-36 h-36 sm:w-40 sm:h-40 lg:w-[164px] lg:h-[164px]` (164px on desktop, ~19% larger than members). Circular cropping, aspect ratio, and neutral SVG fallback avatars preserved.
    - Profile Typography & Balancing: Simple portrait-and-text profiles with no boxed card backgrounds or borders; top-aligned portraits (`items-start` on row container, `shrink-0 mb-3 sm:mb-3.5`); balanced typography with member names at `text-sm sm:text-base font-bold text-[#102B46]`, roles at `text-xs sm:text-[13px] font-semibold text-[#981B24]`; Chief Coordinator name at `text-base sm:text-lg lg:text-xl font-bold`, role at `text-xs sm:text-sm font-semibold`. Profile text constrained to `max-w-[200px] break-words` preventing text overlap with neighboring cards.
    - Always-Centered Wrapping Grid: Reusable `TeamGroupGrid` and `PersonProfile` components rendering from data arrays. Every row is centered within its section (`justify-center`), including incomplete final rows (e.g. 7 members = 5 on row 1, 2 centered on row 2). Single person sits centered in the middle; 2 or more form a centered group with consistent horizontal (`gap-x-6 sm:gap-x-8 xl:gap-x-10`) and vertical (`gap-y-10 sm:gap-y-12`) gaps. No empty reserved slots and no stretching incomplete rows across the full width. Sections grow naturally with their content without fixed heights or horizontal scrolling.
    - Configurable Columns (`preferredColumns`): Added local `SECTION_LAYOUT_CONFIG` per-section setting ready for future admin wiring (Members: 5, Student Coordinators: 5, Website Team: 5, Chief Coordinator: 3). Bounded to 1–6 preferred desktop columns with safe fallback validation (`getSafeColumns`). Responsive step-downs automatically reduce columns on tablets (~3–4 cols) and mobile (2 cols, falling back to 1 on very narrow screens < 320px) so portraits and text never shrink below readable minimums. Awaiting user review.
  - Public Contact Page Redesign (`ContactPage.jsx`): Redesigned per structural reference Image 1 and BDC design system:
    - Crimson hero (`bg-[#981B24]`) with `HeroWave` bottom divider (`fill="#FFFDF9"`), "Get in Touch" bold serif heading, and concise supporting copy focused on camp inquiries, volunteering, and partnerships (no emergency blood-request claims).
    - Unified pale blush/cream container (`#FDF3EF` border `#F3DEDA` rounded-3xl) housing a compact 3-column contact details row above the form (phone, email, campus address with consistent icons and actionable `tel:`/`mailto:` links).
    - Contact Form: Full Name, Email Address, optional Phone Number, Subject, Message arranged in 2 columns on desktop and 1 on mobile; visible labels, required indicators, accessible error validation (`aria-invalid`, `aria-describedby`, `aria-required`), and crimson "Send Message" button.
    - Submission Status: Verified no backend message delivery endpoint exists. Implemented full client-side validation, transparent upfront notice marking direct submission as in development, and honest notification on valid submit providing a 1-click prefilled `mailto:` client link with entered subject and body. Zero fake success messages or unapproved third-party service calls.
    - Compact Coordinator Contacts: Preserved working coordinator records (`Aarav Sharma — Chief Coordinator`, `Priya Mehta — Student Coordinator`, `Rohan Gupta — Student Coordinator`) with working actionable `tel:` links in a compact block within the contact container, eliminating repetition and removing the previous separate oversized panel.
    - Campus Map: Responsive Google Maps embed (`h-[320px] sm:h-[400px] lg:h-[450px]`) for the verified SKIT Jaipur campus location (`Swami Keshvanand Institute of Technology, Management & Gramothan, Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017`) with location header and external "Open in Maps ↗" link. Excluded FAQ section completely per user directive. Awaiting user review.
  - Public About BDC Page Redesign (`AboutPage.jsx`): Redesigned per visual reference mockup and BDC design system:
    - Hero: Crimson background `#981B24`, `HeroWave` bottom divider (`fill="#FFFDF9"`), "A student initiative for a healthier tomorrow." bold serif heading, concise readable copy. Hero photo overlay supported when approved asset is provided; solid crimson displayed in interim.
    - Three-photo introduction: Replaced previous oversized single placeholder with 3 moderately rounded frames with taller center image (`h-[250px] to h-[400px]` center vs `h-[220px] to h-[330px]` flanking), vertically balanced row (`items-center`), aligned to shared navbar container, clean placeholders awaiting approved photography.
    - Our Story: Centered header with crimson `OUR STORY` label and navy serif heading `Built by students, for the community.`; 2 balanced text columns on desktop, 1 on mobile; controlled line lengths and compact spacing. Mentions of faculty advisors and NSS SKIT Jaipur guidance flagged for confirmation.
    - Mission, Vision & Values: Pale blush panel (`bg-[#FDF3EF] border-[#F3DEDA] rounded-3xl`) with 3 open columns (nested white cards removed), crimson circular icon badges (`Target`, `Eye`, `Heart`), navy serif subheadings, restrained vertical dividers on desktop (`md:divide-x md:divide-[#EAD7CF]`), natural section growth.
    - Our Impact: Replaced "Milestones So Far". Reused shared homepage data pipeline (`useImpactData()`, `useCountUp()`, `CONSOLIDATED_IMPACT_BASELINE` in `impactService.js`), displaying Blood Units Collected (`1,200+`), Donors (`2,500+`), and Camps Organised (`24+`) with circular icon badges (`Droplet`, `Users`, `Calendar`), photographic dark-red background `/assets/bdc_impact_slightly_bright_webp.webp` on `#5A040B` with `bg-black/20` contrast overlay, screen reader access, and reduced motion compliance. No independent totals or "[verified total]" placeholder text.
    - Closing CTA: Compact crimson banner (`bg-[#981B24]`), white serif heading `Join us at the next camp.`, "BE A LIFESAVER" label, white "Register Now" button linking to `/register`, subtle top divider boundary.
    - Shared Footer: Existing approved footer unchanged. Awaiting user review.

- **Unresolved / Awaiting Confirmation**:
  - Three About intro photos: 3 approved high-resolution photos for the About page introduction row (photo 1: donor & medical care; photo 2: center taller volunteer registration desk; photo 3: volunteer support). Correctly sized placeholders rendered in interim.
  - About hero background photo: Optional approved high-resolution hero photo for About page hero overlay. Solid crimson rendered in interim.
  - Our Story affiliations & founding claims: Mentions of faculty advisors and NSS SKIT Jaipur guidance in Our Story body text flagged for user confirmation.
  - Verified social profile URLs: Official URLs for Instagram, Facebook, YouTube, and LinkedIn handles to populate the Follow Us column.
  - Team portrait photographs: Original high-resolution circular portrait photographs for Aarav Sharma (Chief Coordinator), Priya Mehta, Rohan Gupta, Ananya Singh, and Karan Verma are awaited from the user. Clean circular placeholders are preserved in the interim.
  - Additional hero photos: Additional approved high-resolution hero photographs for carousel slides 2 and 3. Currently, only 1 approved photo (`A01-home-hero-donor-v2.webp`) is supplied; carousel controls remain hidden by design until additional photos are provided.
  - Backend donor count aggregation: Backend endpoint `/api/content/impact` calculates only `blood_units` and `camps_organised`. Dynamic total donor count is consolidated in frontend baseline service (`impactService.js`) pending future backend endpoint extension.
  - Production hero asset: Whether `A01-home-hero-donor-v2.webp` is adopted as the final permanent asset or will be replaced by another high-resolution photograph.
  - Content pipeline: Whether Swami Keshvanand portrait and partner logos will be static assets or integrated with the camp-scoped content API.

- **Deferred (Not Authorized)**:
  - Deferred — Homepage template copied at camp creation: Confirmed future architectural design decision where creating a new camp copies a master homepage template into the camp's own independent homepage records. Template edits affect future camps only; public homepage reads the active live camp's published content; image replacement updates only the active camp's references without deleting shared fallbacks; existing global-vs-camp split to be resolved via explicit migration. Documented only; implementation strictly deferred until authorized.
  - Deferred — About BDC content and photo management: Future admin integration should allow configuring About hero photo, 3 intro photos, story text, and mission/vision/values statements. Documented only; implementation strictly deferred until authorized.
  - Deferred — Contact form backend message delivery pipeline: Automated message intake endpoint (`POST /api/contact`), database models, notification email services (e.g. Nodemailer/SendGrid), and admin message inbox management are strictly shelved until authorized.
  - Deferred — Admin phone number and coordinator contact management: Official verified phone number lines and admin UI to configure coordinator contact details shelved for future implementation per user direction.
  - Deferred — Admin-managed sponsor sections: Future admin integration should allow administrators to create, edit, and reorder camp-scoped sponsor sections with configurable headers, ordered sponsors, automatic public visibility for empty sections, always-centered logo rows, and display-size limits. Documented only; implementation strictly deferred until explicitly authorized.
  - Deferred — Team layout controls: Future admin integration should allow a preferred desktop people-per-row setting for each team section, with validated limits and responsive overrides. Editors should understand that smaller screens may display fewer columns. Admin control, API, and database changes explicitly deferred until authorized.
  - Admin workspace target-slot-based upload routing.
  - Pre-upload client-side crop/zoom modal.
  - Client-side WebP compression pipeline.
  - Non-gallery image replacement UI in the admin panel.
  - Admin upload and per-logo custom sizing adjustment features (deferred per explicit user directive).

---

## 2. Current Design Specifications

All values recorded below are extracted directly from the verified source code in `frontend/src/components/layout/Navbar.jsx` and `frontend/src/pages/HomePage.jsx`.

### Navbar (`frontend/src/components/layout/Navbar.jsx`)

- **Component Placement & Behavior**:
  - Sticky header: `sticky top-0 z-40 transition-colors`.
  - Height: `h-[68px] sm:h-[72px]` (compact vertical footprint).
  - Background color: `#FAF4EB` (warm ivory/cream).
  - Bottom border: `border-b border-[#EAD7CF]`.
  - Shadow: `shadow-[0_1px_3px_rgba(0,0,0,0.02)]`.
  - Container sizing: `w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]`.

- **Branding Elements (Left)**:
  - Link wrapper: `flex items-center gap-3 sm:gap-4 shrink-0`.
  - SKIT Institutional Logo: `/assets/Skit_logo.png`, `h-11 sm:h-12 w-auto object-contain shrink-0` (44px mobile, 48px desktop).
  - Vertical Divider: `w-[1px] h-8 sm:h-9 bg-[#E2E8F0] shrink-0`.
  - BDC Campaign Logo: `/assets/bdc_nav_logo.svg`, `h-10 sm:h-11 w-auto object-contain shrink-0` (40px mobile, 44px desktop).

- **Navigation Links (Center)**:
  - Container: `hidden md:flex flex-1 items-center justify-center gap-4 lg:gap-6 xl:gap-8 px-4 lg:px-6`.
  - Links (6 items): Home (`/`), About (`/about`), Gallery (`/gallery`), Team (`/team`), Sponsors (`/supporters`), Contact (`/contact`).
  - Font styling: `text-sm md:text-[14px] lg:text-[15px] tracking-normal transition-colors duration-150 whitespace-nowrap`.
  - Inactive state: `text-[#374151] hover:text-[#B30E1F] font-medium`.
  - Active state: `text-[#B30E1F] font-semibold`.
  - Active indicator: `absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#B30E1F] rounded-full`.

- **Action / Register Button (Right)**:
  - Container: `hidden md:flex items-center shrink-0`.
  - Styling: `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#B30E1F] hover:bg-[#990A18] active:scale-[0.99] shadow-xs hover:shadow-sm transition-all duration-150 group`.
  - Icon: `ArrowRight` (`w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5`).
  - Target URL: `/register?camp_id=${featuredCamp._id}` (falls back cleanly to `/register` when no live camp).

- **Mobile & Responsive Behavior**:
  - Breakpoint: `< md` (under 768px viewport width).
  - Hamburger toggle: `flex md:hidden items-center shrink-0`, button `p-2 rounded-lg text-[#031B44] hover:bg-[#EAD7CF]/40 cursor-pointer`.
  - Mobile dropdown: `md:hidden border-t border-[#EAD7CF] bg-[#FAF4EB] px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200`.
  - Mobile link rows: `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-colors`. Inactive: `text-[#374151] hover:text-[#B30E1F] hover:bg-[#EAD7CF]/20 font-medium`. Active: `text-[#B30E1F] bg-[#EAD7CF]/40 font-semibold` with active dot `w-1.5 h-1.5 rounded-full bg-[#B30E1F]`.
  - Mobile Register button: Full-width button `flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#B30E1F] hover:bg-[#990A18] shadow-xs`.
  - Accessibility: `Escape` key closes menu; viewport resize to $\ge 768\text{px}$ auto-closes menu; proper ARIA tags (`aria-expanded`, `aria-controls`, `role="dialog"`).

---

### Shared Outer Alignment & Container Standards (Public Website)

To ensure consistent visual margin alignment across the entire public website, all public pages and sections conform to the shared content container established by the institutional Navbar:

- **Shared Container Definition**:
  - Container class: `w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]`.
  - Left desktop alignment (`lg:pl-[8%]`): Aligns flush with the SKIT institutional crest in the Navbar.
  - Right desktop alignment (`lg:pr-[6%]`): Aligns flush with the "Register Now" action button in the Navbar.
  - Responsive behavior: Mobile (`px-4`), Tablet (`sm:px-6 md:px-8`), Desktop (`lg:pl-[8%] lg:pr-[6%]`, `max-w-[1600px]`).

- **Section Application Rules**:
  - **Full-Width Bleed**: Section backgrounds (`bg-[#FAF4EB]`, `bg-[#FDF3EF]`, `bg-[#0B233D]`, `bg-[#981B24]`), hero photographs, photographic impact banners, inline SVG waves, and moving marquee strips run edge-to-edge to the viewport.
  - **Content Container**: Section headings, intro copy, grids, cards, CTA columns, footer columns, and copyright dividers are strictly wrapped within the shared container token.
  - **Overlapping Elements**: The Hero Current Camp Card wrapper uses the shared container, and the Hero Carousel arrow control aligns its right edge with `lg:right-[6%]`.
  - **Inner Card Spacing**: Replaced fragile negative margin hacks (`-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8`) with clean internal card padding (`px-6 sm:px-8 lg:px-10 rounded-3xl`) within the shared container.
  - **Scope Boundary**: Applied across all public pages (`HomePage.jsx`, `AboutPage.jsx`, `GalleryPage.jsx`, `TeamPublicPage.jsx`, `SupportersPage.jsx`, `ContactPage.jsx`). Admin layouts (`AdminLayout.jsx`, `WorkspaceLayout.jsx`, etc.) remain completely untouched.

---

### Hero (`frontend/src/pages/HomePage.jsx`)

- **Layout, Background & Sizing**:
  - Section wrapper: `relative bg-[#FAF4EB] pb-6 sm:pb-8 lg:pb-8`.
  - Outer content container: `relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[10%] pt-7 sm:pt-9 lg:pt-11 pb-8 sm:pb-10 lg:pb-10`.
  - Text block container: `max-w-md lg:max-w-[480px] xl:max-w-[520px] animate-fade-in-up`.

- **Typography & Content**:
  - Eyebrow / Category: `text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2 sm:mb-2.5`. Text: `SKIT JAIPUR · BLOOD DONATION CAMPAIGN`.
  - Headline: `font-serif text-4xl sm:text-5xl md:text-[56px] lg:text-[62px] xl:text-[66px] font-bold tracking-tight text-[#031B44] leading-[1.08] mb-3`. Lora serif font.
    - Line 1: `Donate blood.` (`#031B44`)
    - Line 2: `Carry hope.` (`#B30E1F`)
  - Supporting description: `text-[#4A5568] text-base sm:text-[17px] lg:text-[18px] leading-relaxed mb-5 max-w-[340px] sm:max-w-[400px]`.
    - Constrained strictly to 2 lines via `<br className="hidden sm:inline" />`:  
      `A small act from you can give`  
      `someone a second chance at life.`

- **Action Buttons**:
  - Button row: `flex flex-wrap items-center gap-3 sm:gap-3.5 mb-5`.
  - Primary CTA ("Register Now"): `inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg text-sm sm:text-[15px] font-semibold bg-[#B30E1F] text-white hover:bg-[#990A18] shadow-sm hover:shadow transition-all group`, with `ArrowRight` icon (`w-4 h-4 group-hover:translate-x-0.5`).
  - Secondary CTA ("Our Journey"): `inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg text-sm sm:text-[15px] font-semibold bg-[#FAF4EB] text-[#031B44] border-2 border-[#D2BCB0] hover:border-[#B30E1F] hover:bg-[#F3E5D8] shadow-2xs transition-colors`, linking to `/about`.

- **Shared Impact Statistic (Hero Impact Row)**:
  - Layout: Left-side row preserving single icon, prominent number, and single supporting label.
  - Data module: Synchronized with Section 4 ("Our Impact") via `frontend/src/services/impactService.js` and `frontend/src/hooks/useImpactData.js`.
  - Number display: `2,500+` (bound to `heroStat.value`). Matches the Our Impact section's donor count, scope, and formatting.
  - Label: `Donors across our camps` (bound to `heroStat.label`). Replaces the discontinued "Lives impacted through our camps" wording.
  - Hardcoded "500+": Removed; both Hero and Impact section share the same authoritative data source.
  - Zero & unavailable handling: Genuine numeric 0 is formatted as `'0'` (valid data); loading or null data falls back to `'—'` without fabricating values.
  - Cache & refresh synchronization: Invoking `refreshImpactData()` updates both the Hero counter and Section 4 simultaneously.

- **Hero Image Carousel & Layer Structure**:
  - Slide Configuration: `DEFAULT_HERO_SLIDES` in `frontend/src/services/heroSlides.js`.
  - Approved photos: Currently contains 1 approved photo (`/assets/A01-home-hero-donor-v2.webp`, `focalPosition: 'right 20%'`).
  - Per-image focal positioning: Each slide configures `focalPosition` applied directly to `style.objectPosition` on the `<img>` tag, enabling customized framing per subject.
  - Layer bounds & clipping: `absolute top-0 left-0 right-0 bottom-[120px] sm:bottom-[125px] lg:bottom-[130px] overflow-hidden pointer-events-none select-none z-0`.
  - Inner scale container: `relative w-full h-[calc(100%+120px)] sm:h-[calc(100%+125px)] lg:h-[calc(100%+130px)]` to preserve 100% canvas scaling and focal alignment without distorting to the shorter clipped height.
  - Bottom boundary: Ends ~1/3 down behind the Current Camp card, with solid cream behind the lower 2/3 of the card and beneath it.
  - Carousel Controls:
    - Positioning: Placed at the lower right of the photograph directly above the Current Camp card (`absolute right-4 sm:right-6 md:right-8 lg:right-[8%] bottom-full mb-3 sm:mb-3.5 z-30`).
    - Flow impact: Positioned via `absolute` with zero document flow height, guaranteeing that Current Camp card margins and vertical spacing remain completely unchanged.
    - Buttons: Circular white buttons (`w-11 h-11`, $\ge 44\times 44\text{px}$ tap targets, `rounded-full bg-white text-[#031B44] shadow-md hover:bg-white/95 active:scale-95`).
    - Icons: `ArrowLeft` and `ArrowRight` (`w-5 h-5 text-[#031B44]`, strokeWidth 2.2).
    - Slide counter: Bold white text `text-white text-sm sm:text-base font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] px-1 tabular-nums`, formatted as `${activeIndex + 1} / ${validSlides.length}`.
    - Navigation: Manual navigation only, wrapping between first and last slides. No autoplay.
    - Auto-hide: Controls are strictly hidden when fewer than 2 images are available (`validSlides.length < 2`).
  - Fallback resilience: Slide URLs filtered for errors via `failedImageUrls`. If an image fails to load, `handleImageError` excludes it. If all fail, the layer cleanly displays solid cream `#FAF4EB` without visual errors.

- **Horizontal Cream-to-Photo Gradient**:
  - Desktop: Single smooth multi-stop linear gradient on `hidden md:block absolute inset-0 pointer-events-none z-10`:
    ```css
    background: linear-gradient(
      90deg,
      #FAF4EB 0%,
      #FAF4EB 42%,
      rgba(250, 244, 235, 0.88) 44%,
      rgba(250, 244, 235, 0.60) 46.5%,
      rgba(250, 244, 235, 0.30) 49%,
      rgba(250, 244, 235, 0.10) 51.5%,
      rgba(250, 244, 235, 0.03) 53%,
      rgba(250, 244, 235, 0) 54%
    );
    ```
  - Horizontal Alignment: Solid cream extends to 42% (beneath the midpoint of navbar "Home"), fades through 44%–53%, and reaches 100% transparency at 54% (beneath the right edge of navbar "About").
  - Mobile / Tablet: `md:hidden absolute inset-0 bg-gradient-to-b from-[#FAF4EB] via-[#FAF4EB]/85 to-transparent pointer-events-none z-10`.

---

### Current Camp Card (`frontend/src/pages/HomePage.jsx`)

- **Container, Margins & Alignment**:
  - Outer wrapper: `w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[8%] relative z-20 mt-2 sm:mt-3 lg:mt-4 animate-fade-in-up`.
  - Inner card alignment: `p-5 sm:p-6 lg:pl-[2.2%]`.
  - Alignment rationale: Combining `lg:px-[8%]` outer margin with `lg:pl-[2.2%]` inner padding perfectly aligns the card's text and icon column with the `lg:px-[10%]` hero text above.
  - Visual overlap: Sits directly over the hero image's bottom boundary, with the top ~1/3 backed by the clipped image and the lower ~2/3 backed by solid section cream.

- **Card Styling**:
  - Background: `bg-[#FAF4EC]` (warm ivory/cream).
  - Border: `border border-[#EAD7CF]`.
  - Corners: `rounded-2xl`.
  - Shadow: `shadow-md`.
  - Layout: `flex flex-col lg:flex-row lg:items-center justify-between gap-5`.

- **Title & Status Badge**:
  - Section label: `text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-1.5` ("Current Camp").
  - Title: `font-serif text-2xl sm:text-[26px] lg:text-[28px] font-bold text-[#031B44] tracking-tight leading-tight` (e.g. `24th Blood Donation Camp`).
  - Status badge: `inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-[#D1ECD2] text-[#166534] border border-[#BBE3BD]` ("Registration Open").

- **Metadata Presentation (Date, Time, Venue)**:
  - Row container: `flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-0.5`.
  - Icon containers: `w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-[#F5ECE3] flex items-center justify-center shrink-0`.
  - Icons: `Calendar` and `MapPin` (`w-4 h-4 text-[#B30E1F]`).
  - Text typography:
    - Primary value: `text-xs sm:text-sm font-bold text-[#031B44] leading-tight` (Date / Venue name).
    - Secondary subtext: `text-[11px] sm:text-xs text-[#5A626E] leading-tight mt-0.5` (Hours / Venue address).
  - Desktop vertical divider: `hidden sm:block w-[1px] h-8 bg-[#E2D5CB] shrink-0` positioned between date/time and venue blocks.

- **Action Button**:
  - Button: `inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-[#B30E1F] text-white hover:bg-[#990A18] transition shadow-xs shrink-0 self-start lg:self-end`.
  - Desktop alignment: Aligned to the bottom right (`lg:self-end` inside `lg:items-end` card wrapper), directly matching the vertical row of the date/time and venue metadata rather than centering against the full card height.
  - Mobile alignment: Naturally stacked (`self-start`) below the date/time and venue row.
  - Icon: `ArrowRight` (`w-4 h-4`).
  - Target: `/register`.

---

### About BDC (`frontend/src/pages/HomePage.jsx` Section 3)

- **Layout & Sizing**:
  - Container: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`.
  - Grid: `grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center` (text column slightly wider than landscape image).
  - Vertical padding: `py-10 sm:py-12 lg:py-14` (compact, no fixed height).
  - Vertical alignment: Centered vertically against the image (`items-center`).

- **Typography & Content**:
  - Category label: `ABOUT BDC`, `text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2 sm:mb-2.5 text-center`.
  - Headline: `font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-[#031B44] leading-[1.15] tracking-tight mb-4 text-center`. Lora bold serif. Target lines:
    - Line 1: `A student initiative`
    - Line 2: `for a healthier tomorrow.`
    - Mobile wrapping: `<br className="hidden sm:inline" />` prevents forced break on mobile, allowing natural wrapping without overflow.
  - Paragraph: `text-sm sm:text-[15px] text-[#4A5568] leading-relaxed mb-6 max-w-[490px] mx-auto text-center`, forming ~3 balanced lines:
    `The <strong className="font-semibold text-[#1F2937]">Blood Donation Campaign (BDC) at SKIT</strong> is a student-driven initiative to create awareness about voluntary blood donation and to contribute towards a healthier, stronger community.`
  - Action button: `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#FAF4EB] text-[#031B44] border-2 border-[#D2BCB0] hover:border-[#B30E1F] hover:bg-[#F3E5D8] shadow-2xs transition-colors`. Uses the same outline treatment as "Our Journey", with compact padding. Label: "Discover BDC", links to `/about`.

- **Image Area**:
  - Aspect ratio: `aspect-[5/3]` landscape with modest rounded corners (`rounded-2xl`).
  - Object fit: `object-cover` without stretching.
  - Asset status: Currently renders `ImagePlaceholder` (`label="About photo (5:3 landscape)"`, `iconClassName="w-10 h-10"`) awaiting original high-resolution photograph asset from user.

---

### Our Impact Section (`frontend/src/pages/HomePage.jsx` Section 4)

- **Photographic Background Asset & Treatment**:
  - Asset path: `/assets/bdc_impact_slightly_bright_webp.webp` (copied directly from source `C:\Users\bhara\Downloads\bdc_impact_slightly_bright_webp.webp`, WebP format, 2171×724px, ~3:1 ratio).
  - Background styling: Full-width container with `object-cover object-center` within an isolated `absolute inset-0 z-0 overflow-hidden` wrapper.
  - Base tone & contrast overlay: Base container colored `#5A040B` (matching the photograph's deepest red tone) for seamless fallback. A subtle `bg-black/20` overlay is applied over the image to ensure high text contrast (WCAG AAA) across all display resolutions without doubling the baked-in dark-red tint or making the composition muddy.
  - Image isolation: The photograph and overlay reside in an isolated background layer (`z-0`), guaranteeing that foreground typography (`z-10`) remains 100% crisp and unblurred.

- **Typography & Layout**:
  - Section padding: `py-16 sm:py-20 lg:py-24` (generous vertical spacing allowing the banner photography to breathe).
  - Eyebrow header: Centered, small uppercase label `OUR IMPACT` (`text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-white/90 text-center mb-10 sm:mb-12 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`).
  - Statistics grid: Three evenly spaced columns (`grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x sm:divide-white/20 max-w-5xl mx-auto text-center items-center`).
  - Desktop vertical dividers: Thin white dividers (`sm:divide-x sm:divide-white/20`) separate the three metric columns on tablet/desktop, naturally stacking without borders on mobile.
  - Metric numerals: Large bold white numbers (`text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-none mb-2 sm:mb-3 tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`).
  - Metric labels: Smaller uppercase white labels (`text-xs sm:text-sm font-semibold tracking-wider uppercase text-white/90 leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]`).

- **Data Sources & Metric Baseline**:
  - Single source of truth: All metrics are sourced through `useImpactData()` and `impactService.js`.
  - Column 1: `1,200+` with label `Blood Units Collected` (`raw: 1200`).
  - Column 2: `2,500+` with label `Donors` (`raw: 2500`). Synchronized with Hero statistic (`2,500+ Donors across our camps`).
  - Column 3: `24+` with label `Camps Organised` (`raw: 24`).
  - Strict anti-fabrication: Never uses BloodConnect's reference numbers (`500+`, `400+`, `23`, `150+ Volunteers`).

- **Animation & Accessibility (`useCountUp.js`)**:
  - Easing & physics: Quartic ease-out `easeOutQuart(t) = 1 - (1 - t)^4`, delivering quick acceleration at the start and an ultra-smooth, gentle deceleration toward the target.
  - Duration: 1800ms (1.8s, within 1.5–2s requirement), terminating *exactly* on the formatted target.
  - Trigger: `IntersectionObserver` observing `<section ref={impactSectionRef}>` with a 15% threshold and `-40px` bottom margin. Disconnects immediately upon first intersection, running strictly once per page mount and never re-triggering on scroll back.
  - Tabular numerals: `tabular-nums` applied to prevent any layout shifting or jitter during count-up.
  - Number formatting: Comma separators and suffix `+` preserved only where warranted by data. Genuine zero formats as `"0"` without suffix.
  - Screen reader accessibility: Accessible `<span className="sr-only">{stat.value} {stat.label}</span>` immediately announces the final total and label without flooding screen readers with 60fps ticking frames; visual animated numerals carry `aria-hidden="true"`.
  - Reduced-motion support: Automatically detects `prefers-reduced-motion: reduce` and renders final target values immediately without animation.
  - Dynamic update handling: Displays fallback `"—"` for unavailable or null data without fabricating numbers, and updates cleanly if live data resolves after mount.

---

### Gallery: Moments That Matter (`frontend/src/pages/HomePage.jsx` Section 5 & `frontend/src/components/home/GalleryCarousel.jsx`)

- **Typography & Header Styling**:
  - Category label: Small crimson uppercase label `GALLERY` (`text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2 sm:mb-2.5 text-center`).
  - Section heading: Bold navy serif `Moments That Matter` (`font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-[#031B44] leading-[1.15] tracking-tight text-center`). Matches the About section headline font, weight, color, and responsive sizing.
  - Section background: Cream background `#FAF4EB` preserved.
  - Action link: Preserved `View full gallery` link with `ArrowRight` icon (`inline-flex items-center gap-1.5 text-sm font-semibold text-[#B30E1F] hover:text-[#990A18] transition`) targeting `/gallery`.

- **Card Dimensions, Proportions & Clean Photo Card Styling**:
  - Image ratio: Landscape `aspect-[16/10]` with modest rounded corners (`rounded-2xl`).
  - Responsive card widths:
    - Mobile (`< sm`): `w-[260px]` (showing one main card and ~95px of the next card to invite browsing).
    - Tablet (`sm` to `md`): `w-[320px]`.
    - Desktop (`lg`): `w-[360px]`.
    - XL Desktop (`xl`): `w-[380px]` (showing several full cards with partial cards at viewport edges).
  - Comfortable gap: `gap-6 sm:gap-8 lg:gap-9`.
  - Clean single-layer card structure: Decorative stacked layers removed per user instruction. Single-layer white photo card:
    - Card container: `relative w-[260px] sm:w-[320px] lg:w-[360px] xl:w-[380px] aspect-[16/10] rounded-2xl overflow-hidden bg-white shadow-sm border border-[#EAD7CF]/70 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-md`.
    - Gentle 3–4px hover lift: `group-hover:-translate-y-1` applied directly to the card inside the track with a smooth `transition-all duration-300 ease-out`, completely isolated from horizontal track translation.
    - Subtle shadow transition: `shadow-sm` at rest transitioning smoothly to `group-hover:shadow-md`.
    - Subtle image scaling: `group-hover:scale-[1.02]` with smooth `transition-transform duration-500 ease-out`.
    - No continuous floating, bouncing, or rotation: Stationary at rest; lifts only on pointer hover.
    - Unclipped headroom: Draggable viewport wrapper has `py-4 sm:py-5` and card item wrapper has `py-2`, guaranteeing shadows and 3–4px upward hover translation are never clipped by `overflow-hidden`.

- **Movement & Animation Architecture (`GalleryCarousel.jsx`)**:
  - Animation technique: Smooth, continuous 60fps horizontal loop via `requestAnimationFrame` updating `translate3d(-${offset}px, 0, 0)` on the track element.
  - Speed: Slow and gentle at ~45px per second (`0.045 px/ms`), capped against frame drops during tab switches.
  - Seamless modulo wrap: The track renders Set 1 and Set 2 (duplicate of Set 1). `offset` loops seamlessly at `track.scrollWidth / 2` with 0-pixel visible jumps.
  - Pointer dragging & touch swiping: Full mouse drag and touch swipe support via unified Pointer Events (`onPointerDown`, `onPointerMove`, `onPointerUp`) with `setPointerCapture`.
  - Vertical scroll safety: `touch-action: pan-y` on container allows standard vertical page scrolling on touch devices without fighting horizontal movement.
  - Ergonomics: `cursor-grab active:cursor-grabbing` on desktop.

- **Accessibility & Controls**:
  - Centered control placement: Centered horizontally below the image row and above "View full gallery" with balanced spacing (`mt-3 sm:mt-4` on button wrapper, `mt-4 sm:mt-5` on link container).
  - Device adaptability & visibility:
    - Mobile & touch devices (including tablets): Control is visibly displayed at all times (`display: flex`). Tapping pause keeps playback paused indefinitely across touch events until user taps play.
    - Desktop with mouse (`@media (min-width: 1024px) and (hover: hover) and (pointer: fine)`): Hidden visually during normal viewing (`opacity: 0`, `max-height: 0`, `pointer-events: none`). Automatic scrolling pauses when pointer hovers over the image row, and resumes when pointer leaves unless explicitly paused.
    - Keyboard navigation & focus reveal: When keyboard focus enters the carousel (via Tab to viewport or button), automatic scrolling pauses and the pause/play control is smoothly revealed (`opacity: 1`, `pointer-events: auto`, `max-height: 60px`) via CSS `:has(:focus-visible)`, `:focus-within`, and `.is-keyboard-revealed`.
  - Circular compact button specifications:
    - Sizing: `w-11 h-11` ($\ge 44\times 44\text{px}$ tap target complying with WCAG 2.5.5).
    - Styling: `rounded-full bg-white/95 hover:bg-white text-[#031B44] border border-[#EAD7CF] shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer`.
    - Focus styling: `focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B30E1F] focus-visible:ring-offset-2`.
    - Dynamic icons: Compact Lucide `Pause` or `Play` icon (`w-4 h-4 text-[#031B44]`).
    - Accurate accessible labeling: `aria-label={isExplicitlyPaused ? 'Play gallery carousel' : 'Pause gallery carousel'}` with matching `title` tooltip.
  - Keyboard track navigation: When focused on carousel, `ArrowRight` and `ArrowLeft` keys shift the track by card step increments (~340px).
  - Reduced-motion compliance: Detects `prefers-reduced-motion: reduce` on mount and dynamic change; disables automatic scrolling by default.
  - Screen reader integrity: Set 1 carries semantic accessible roles and descriptive `alt` texts. Duplicate Set 2 carries `aria-hidden="true"` and non-focusable tags to eliminate repetitive or broken screen-reader focus rings.

- **Asset Sources & Error Handling**:
  - 6 authentic BDC gallery photos stored in `/assets/gallery/`:
    1. `/assets/gallery/gallery_camp_donor_smile.webp` (Donor smiling on donation chair).
    2. `/assets/gallery/gallery_skit_banner_team.png` (Student volunteers holding official BDC banner).
    3. `/assets/gallery/gallery_stress_ball.png` (Hand squeezing heart-shaped stress ball).
    4. `/assets/gallery/gallery_female_donor.png` (Student donor smiling happily during donation).
    5. `/assets/gallery/gallery_donor_chair.png` (Donor resting comfortably in camp facility).
    6. `/assets/gallery/gallery_hero_donor.webp` (Young volunteer donating with campaign team).
  - Object fit: `object-cover` without stretching.
  - Fallback: On error, gracefully displays `ImagePlaceholder` in the identical `aspect-[16/10]` card with zero layout shift.

---

### Our Team Section (`frontend/src/pages/HomePage.jsx` Section 6)

- **Section Overview, Layout & Sizing**:
  - Section wrapper: `py-12 sm:py-14 lg:py-16` within the standard content container (`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`).
  - Background: Cream background `#FAF4EB` preserved.
  - Spacing rhythm: Balanced, compact layout without excessive empty space.

- **Typography & Heading Tokens**:
  - Eyebrow label: Small crimson uppercase label `OUR TEAM` (`text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2 sm:mb-2.5 text-center`).
  - Section heading: Bold navy serif `The People Behind the Campaign` (`font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-[#031B44] leading-[1.15] tracking-tight text-center mb-8 sm:mb-10 lg:mb-12`). Matches About and Gallery headings.
  - Member name typography: Bold navy sans-serif (`font-sans font-bold text-[#031B44] text-base sm:text-lg` for Chief Coordinator, `text-sm sm:text-base` for members, `leading-snug`).
  - Role typography: Chief Coordinator role in smaller muted text (`text-xs sm:text-sm font-medium text-[#68717D] mt-0.5`). Members do not display role labels on homepage preview.

- **Two-Row Arrangement & Alignment Architecture**:
  - Row 1 (Chief Coordinator):
    - Positioned alone in the first row, centered horizontally directly beneath the section heading (`flex flex-col items-center text-center mb-8 sm:mb-10 lg:mb-12`).
    - Portrait sizing: `w-24 h-24 sm:w-28 sm:h-28` rounded circular portrait (slightly larger than member portraits), `overflow-hidden bg-[#F3DEDA] border-2 border-white shadow-xs`.
    - Clear vertical gap to member row: `mb-8 sm:mb-10 lg:mb-12` separates the role label from the member row, eliminating the reference's staggered/offset arrangement.
  - Row 2 (Four Members):
    - Container: `max-w-xs sm:max-w-sm lg:max-w-4xl mx-auto`.
    - Desktop grid (`lg:grid-cols-4`): Four equal-width columns with generous spacing (`gap-6 sm:gap-8 lg:gap-12 items-start`).
    - Horizontal portrait alignment: All four portraits are identical `w-20 h-20 sm:w-24 sm:h-24` circular elements, guaranteeing exact horizontal alignment across the row.
    - Baseline name alignment: Identical `mb-3` portrait bottom margin and single-line names (`leading-snug`) align text on the exact same baseline.
    - Mobile 2-column layout: Below `lg`, members format into a balanced 2-column grid (`grid-cols-2 max-w-xs sm:max-w-sm mx-auto`), keeping the Chief Coordinator centered alone above.

- **Portraits & Placeholder Specifications**:
  - Sizing hierarchy: Chief Coordinator `w-24 h-24 sm:w-28 sm:h-28` (112px desktop); Members `w-20 h-20 sm:w-24 sm:h-24` (96px desktop).
  - Circular placeholders: `rounded-full overflow-hidden bg-[#F3DEDA] border-2 border-white shadow-xs flex items-center justify-center shrink-0` with Lucide `User` icon (`text-[#C9A8A0]`, stroke width 1.5).
  - Production image handling: Prepared with `<img src={...} alt={...} className="w-full h-full object-cover" />`. High-resolution original portrait assets awaited from user without extracting faces from screenshots or inventing portraits.

- **Action Link ("Meet the full team →")**:
  - Container: `mt-8 sm:mt-10 flex justify-center lg:justify-end`.
  - Alignment: On desktop, aligns with the lower-right boundary of the member grid (`max-w-4xl lg:justify-end`); centered below the grid on mobile (`justify-center`).
  - Styling: `inline-flex items-center gap-1.5 text-sm font-semibold text-[#B30E1F] hover:text-[#990A18] transition-colors group` with `ArrowRight` icon (`transition-transform duration-150 group-hover:translate-x-0.5`).
  - Destination: Preserved `/team` route.

---

### Our Partners Section (`frontend/src/pages/HomePage.jsx` Section 7 & `frontend/src/components/home/PartnersLogoStrip.jsx`)

- **Full-Width Section & Outer Viewport Margins**:
  - Standalone Section Container: Full-width band with pale blush/cream background (`w-full bg-[#FDF3EF] py-12 sm:py-14 lg:py-16 overflow-hidden`).
  - Separation from `max-w-6xl`: Closed the narrow `max-w-6xl` wrapper after Section 6 (Our Team), freeing the marquee strip from the 1152px container restriction.
  - Outer Marquee Margins: Spans nearly the full page width with responsive margins (`w-full px-4 sm:px-6 lg:px-[3.5%] overflow-hidden`), leaving ~3.5% margins on desktop viewports.
  - Centered Headers & Action: Heading is wrapped in standard centered reading container (`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8 sm:mb-10`). Action link "View all partners →" remains strictly centered below (`text-center mt-4 sm:mt-5`).
  - Overflow Prevention: Triple `overflow-hidden` guards on section, marquee wrapper, and inner viewport prevent any page-wide horizontal scrollbars.

- **Logo Arrangement & Natural Aspect-Ratio Sizing**:
  - One Horizontal Row: Vertically centered logos in a single non-wrapping flex row (`flex items-center will-change-transform w-max py-2 sm:py-3`).
  - Natural Width per Aspect Ratio: Each logo has natural width determined by its aspect ratio, with bounded responsive height and maximum width (`h-10 sm:h-12 md:h-14 lg:h-16 max-w-[170px] sm:max-w-[210px] lg:max-w-[260px] w-auto object-contain pointer-events-none select-none`).
  - No Card Wrappers: No equal-width cards, boxes, borders, shadows, or `space-between` distribution.
  - Internal Asset Whitespace Trimmed: Trimmed leftover background card margins on asset bounds (`partner_nims.png` trimmed to 107×63px, `partner_sbi.png` trimmed to 96×66px) so visible spacing between marks feels perfectly uniform.
  - Artwork Preservation: All artwork fully visible within each item using `object-fit: contain` without stretching or excessive enlargement.
  - Asset Fallback: On load error, cleanly renders the partner's text name (`text-xs sm:text-sm font-bold text-[#031B44] text-center px-3 py-1`).
  - Static Row Guard: If $\le 3$ logos are configured, renders a balanced centered static flex row (`w-full flex items-center justify-center flex-wrap gap-8 sm:gap-12 py-4`).

- **Generous Spacing & Seamless Loop Boundary Gap**:
  - Consistent Explicit Gaps: Items separated by generous responsive gap tokens matching the ~115px DevTools reference: `gap-16 sm:gap-20 lg:gap-28 xl:gap-32` (64px mobile, 80px sm, 112px lg, 128px xl).
  - Loop Boundary Gap Matching: Each multi-item set includes identical trailing padding (`pr-16 sm:pr-20 lg:pr-28 xl:pr-32`), guaranteeing the distance between the last logo of Set 1 and the first logo of Set 2 is mathematically identical to intra-set gaps.
  - Multi-Set Track: Renders 3 identical sets in one track, guaranteeing ultra-wide viewports (>2560px) never experience blank gaps.
  - Dynamic Track Measurement: Uses `ResizeObserver` on Set 1 and `onLoad` on each `<img>` to dynamically calculate the track set width from actual logos and gaps (no hardcoded 3400px width).
  - No Side Fades: Side fade gradient overlays removed entirely. Marquee clips cleanly only at the outer marquee viewport (`overflow-hidden`); logos entering or leaving have natural partial visibility without individual item clipping.

- **Interaction, Drag/Swipe & Hover Behavior**:
  - Continuous RAF Loop: Smooth right-to-left 60fps continuous animation (~35px/s).
  - Pointer Drag & Touch Swipe: Container supports pointer dragging with `touch-action: pan-y`. Manual dragging updates track offset without jumping.
  - Hover Pause: Mouse hover pauses movement automatically on desktop; mouse leave resumes movement unless explicitly paused.
  - Keyboard Focus Pause: Focusing into the strip pauses automatic scrolling, reveals the pause button on desktop, and enables ArrowLeft / ArrowRight navigation.
  - Reduced Motion: Respects `prefers-reduced-motion: reduce` by disabling automatic scrolling.

- **Pause/Play Control & Placement**:
  - Centered Placement: Horizontally centered between the logo strip and the "View all partners" link (`mt-3 sm:mt-4` on button wrapper, `mt-4 sm:mt-5` on link).
  - Button Styling: Compact circular button (`w-11 h-11`, $\ge 44\times 44\text{px}$ tap target) with `bg-white/95 hover:bg-white text-[#031B44] border border-[#EAD7CF] shadow-xs`.
  - Device-Adaptive Visibility: Visibly displayed at all times on mobile/touch; hidden on desktop during normal viewing, revealed on keyboard focus (`:focus-within`, `:has(:focus-visible)`, `.is-keyboard-revealed`).

- **Typography & Action Link**:
  - Eyebrow: `OUR PARTNERS` (`text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2 sm:mb-2.5 text-center`).
  - Section Heading: Bold navy serif `Our Valued Partners` (`font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-[#031B44] leading-[1.15] tracking-tight text-center mb-8 sm:mb-10`). Matches About, Gallery, and Team headings.
  - Action Link: Centered `View all partners →` linking to `/supporters` (`inline-flex items-center gap-1.5 text-sm font-semibold text-[#B30E1F] hover:text-[#990A18] transition-colors group` with `ArrowRight`).

---

### Our Inspiration Section (`frontend/src/pages/HomePage.jsx` Section 8)

- **Section Overview & Palette**:
  - Background: Subtle warm peach-cream `#F8E9DA`.
  - Palette: Navy `#031B44` for primary name heading and closing statement; crimson `#B30E1F` for section eyebrow, divider lines, top dot on vertical divider, and wave stroke; slate `#4A5568` for main narrative body text; charcoal `#5A626E` for foundational slogans.
  - Section layout: Compact, content-driven responsive section (`relative z-10 w-full overflow-hidden bg-[#F8E9DA] pt-6 sm:pt-8 lg:pt-10 pb-10 sm:pb-12 lg:pb-14`), eliminating excessive top gap while reserving clearance for bottom wave.

- **Desktop 4-Column Explicit Layout Areas**:
  1. **Left Slogan Area**:
     - Desktop: Dedicated left vertical column (`hidden lg:flex flex-col items-start shrink-0 select-none`).
     - Words: `Education`, `Service`, `Society`, `Self Reliance` (`text-[11px] xl:text-xs font-bold tracking-[0.22em] uppercase text-[#5A626E] leading-snug`).
     - Accent: Short horizontal crimson underline (`w-6 h-[2px] bg-[#B30E1F] mt-3`).
     - Mobile: Centered dot-separated horizontal row (`·`) with small crimson underline.
  2. **Portrait and Arch Area**:
     - Ornamental Arch: `/assets/inspiration_arch.png` (627×593px, PNG alpha). Cleaned to remove 187 stray border pixels; softened to muted beige-gold (`saturate: 0.55, brightness: 1.05`). Sizing: `w-[210px] sm:w-[240px] lg:w-[260px] xl:w-[280px]`, `aspect-[627/593]`, `drop-shadow-xs`.
     - Flanking Botanicals: `/assets/inspiration_botanical_left.png` and `inspiration_botanical_right.png`. Rendered pale and low-contrast (`opacity-30 z-0 h-[75%]`) behind arch pillars.
     - Swami Keshvanand Portrait: `/assets/inspiration_swamiji.png` (85×138px, PNG alpha). Figure scaled to occupy ~82% of arch interior height with base resting on arch base (`absolute bottom-[1.5%] left-1/2 -translate-x-1/2 h-[82%] w-auto object-contain z-20 drop-shadow-sm opacity-100`). Uncompressed, zero facial distortion or redrawing.
  3. **Main Text Area with Thin Crimson Vertical Divider**:
     - Vertical Divider: Between arch and copy (`hidden lg:flex flex-col items-center shrink-0 self-stretch py-1.5`). Features a small crimson top dot (`w-1.5 h-1.5 rounded-full bg-[#B30E1F]`) and thin vertical line (`w-[1.5px] flex-1 bg-[#B30E1F]/80 my-1 min-h-[115px]`).
     - Main Copy Container: Constrained width (`max-w-[430px] xl:max-w-[460px]`, text `max-w-[340px] sm:max-w-[370px]`) ensuring description wraps across two balanced lines:
       `A legacy of education, selfless service`  
       `and community upliftment.`
     - Eyebrow: `OUR INSPIRATION` (`text-xs sm:text-[13px] font-bold tracking-[0.2em] uppercase text-[#B30E1F] mb-1.5 sm:mb-2`).
     - Heading: `Swami Keshvanand` (`font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-[#031B44] leading-[1.12] tracking-tight mb-2.5 sm:mb-3`).
     - Accent Divider: `w-8 h-[2px] bg-[#B30E1F] rounded-full mb-3 sm:mb-3.5`.
     - Closing Statement: `Values for a Better Tomorrow.` (`text-sm sm:text-base font-semibold text-[#031B44] tracking-tight`).
  4. **Right Slogan and Tree Area**:
     - Positioned completely outside the main text area (`hidden lg:flex items-center gap-5 xl:gap-7 shrink-0`).
     - Restored Right Slogan: `Individual`, `Development`, `Leads To`, `A Stronger`, `Nation` (`text-[11px] xl:text-xs font-bold tracking-[0.22em] uppercase text-[#5A626E] leading-snug`) with crimson dash (`w-6 h-[2px] bg-[#B30E1F] mt-3`).
     - Mobile Right Slogan: Rendered below main text (`Individual Development Leads to a Stronger Nation`).
     - Background Tree: `/assets/inspiration_tree.png` (610×511px). Scaled down to approximately half visible width (`w-[130px] xl:w-[155px] h-[160px] xl:h-[190px]`), pale and low-contrast (`opacity-25 xl:opacity-30`), strictly contained within its own column area with zero text overlap.

- **Bottom Crimson Wave (Inline SVG)**:
  - Rendering: Simple inline `<svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">`.
  - Path: Single smooth cubic Bézier curve (`d="M 0,30 C 140,44 260,46 380,32 C 500,18 620,18 760,34 C 900,50 1020,48 1160,30 C 1260,18 1360,20 1440,32"`).
  - Styling: `fill="none"`, `stroke="#B30E1F"`, `strokeWidth="2"`, `strokeLinecap="round"`, `vector-effect="non-scaling-stroke"`.
  - Clearance: ViewBox extends from y=0 to y=60; path stays within y=18 to y=49, providing abundant top and bottom clearance so peaks and troughs never clip.
  - Position: Spans full width at `absolute bottom-0 left-0 right-0 z-10 leading-none block h-6 sm:h-8 lg:h-9` without covering or being covered by following section.

- **Content Architecture**:
  - Encapsulated in local static constant `INSPIRATION_CONTENT` in `frontend/src/pages/HomePage.jsx`:
    ```javascript
    const INSPIRATION_CONTENT = {
      sectionLabel: 'Our Inspiration',
      name: 'Swami Keshvanand',
      description: 'A legacy of education, selfless service and community upliftment.',
      closingStatement: 'Values for a Better Tomorrow.',
      slogansLeft: ['Education', 'Service', 'Society', 'Self Reliance'],
      slogansRight: ['Individual', 'Development', 'Leads To', 'A Stronger', 'Nation'],
      portraitAlt: 'Swami Keshvanand'
    };
    ```
  - Anti-fabrication compliance: Real HTML text; approved wording; no unverified historical statements.

---

---

### Registration CTA: Be a Lifesaver (`frontend/src/pages/HomePage.jsx` Section 9)

- **Palette & Container**:
  - Background: Brand deep crimson `#981B24` (preserved from Image 1).
  - Container sizing: `w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-6 sm:py-7 lg:py-8`. Reduced top and bottom padding by ~25% from previous values (`py-8 sm:py-9 lg:py-10`), creating a compact banner matching reference proportions. Outer content edges align flush with the Navbar.
  - Flex layout: `flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8`. Left-aligned copy balanced with right-aligned action button, vertically centered (`sm:items-center`). Natural mobile stacking without forced heights or clipping.

- **Typography & Headline**:
  - Eyebrow label: Small uppercase label `BE A LIFESAVER` (`text-xs font-bold tracking-widest uppercase text-[#F3DEDA] mb-2 sm:mb-2.5`).
  - Section Headline: Bold serif heading font (`font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-white tracking-tight leading-[1.15]`), arranged across two desktop lines:
    - Line 1: `Your one small act.`
    - Line 2: `Someone’s tomorrow.`
  - Responsive stacking: Natural wrapping on mobile without overflow or clipping (`block` spans on each phrase).

- **Action Button**:
  - Button styling: White pill button with crimson text and arrow (`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-[#981B24] hover:bg-[#FFF9F2] transition shrink-0 self-start sm:self-auto shadow-xs`).
  - Focus accessibility: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#981B24]`.
  - Icon: `ArrowRight` (`w-4 h-4`).
  - Target destination: `/register` (preserved).

- **Boundary Separation**:
  - Inspiration wave clearance: Renders immediately beneath Section 8's full-width bottom inline SVG crimson wave (`#B30E1F`) without collision or gap clipping.

---

### Global Footer (`frontend/src/components/layout/Footer.jsx` Section 10)

- **Palette & Layout Architecture**:
  - Background: Deeper navy `#0B233D` (measured directly from reference Image 2).
  - Top border: `border-t border-[#061525]`.
  - Container padding: `w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-10 sm:py-12`. Aligns footer columns and copyright row flush with navbar content boundaries.
  - Grid: Responsive 4-column layout (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.3fr_1fr] gap-8 lg:gap-10 mb-8 sm:mb-10`). 4 columns on desktop, 2 columns on tablet (`sm:grid-cols-2`), single-column stack on mobile (`grid-cols-1`).

- **Column Specifications**:
  1. **Branding Column & Logo Contrast Backing**:
     - Contrast Solution: The dark parts of the combined branding (e.g. navy letter "B" in `bdc_nav_logo.svg`) disappear against the `#0B233D` navy footer background. To resolve this without altering official vector artwork, the entire branding lockup is placed on one compact backing card with `#D9DEDC` background, 10–12px padding, and an 8px corner radius:
       `<div className="inline-flex items-center gap-2.5 sm:gap-3 bg-[#D9DEDC] p-2.5 sm:p-3 rounded-[8px] shadow-xs shrink-0">`
     - Logos: SKIT institutional crest (`/assets/Skit_logo.png`, `h-8 sm:h-9 w-auto object-contain shrink-0`) + thin vertical divider (`w-[1px] h-6 sm:h-7 bg-[#B8BEBC] shrink-0`) + BDC campaign logo (`/assets/bdc_nav_logo.svg`, `h-7 sm:h-8 w-auto object-contain shrink-0`).
     - Preservation: Original logo colors and proportions preserved 100%. No inverting, recoloring, or stretching.
     - Description: `"A student initiative for a healthier, stronger tomorrow."` (`text-xs text-slate-300 leading-relaxed mt-3 max-w-[280px]`).
     - Desktop divider: Subtle vertical right border on desktop (`lg:border-r lg:border-slate-700/60 lg:pr-8`) matching Image 2 reference; hidden on tablet/mobile.
     - Single social presence: Accidental duplicate social icon row from reference screenshot removed per explicit user instruction.
  2. **Quick Links Column**:
     - Heading: `Quick Links` (`text-white text-sm font-semibold mb-3 sm:mb-4 tracking-wide`).
     - Navigation items: Home (`/`), About (`/about`), Gallery (`/gallery`), Team (`/team`), Sponsors (`/supporters`), Contact (`/contact`).
     - Styling: `space-y-2 text-xs sm:text-[13px] text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded inline-block`.
  3. **Contact Us Column**:
     - Heading: `Contact Us` (`text-white text-sm font-semibold mb-3 sm:mb-4 tracking-wide`).
     - Verified Email: `Mail` icon + `bdc@skit.ac.in` link.
     - Verified Campus Address: `MapPin` icon + `SKIT Jaipur Campus, Ramnagaria, Jaipur`.
     - Phone: Unverified placeholder `+91 141 350 0000` omitted per strict anti-fabrication directive; real phone number awaited from user.
  4. **Follow Us Column**:
     - Heading: `Follow Us` (`text-white text-sm font-semibold mb-3 sm:mb-4 tracking-wide`).
     - Social icons: Configured for Instagram, Facebook, YouTube, LinkedIn with Lucide icons (`w-4 h-4`) and visible focus styling. Rendered strictly when verified URLs are supplied (no dead links). Clean campus outreach message displayed while awaiting handles.

- **Bottom Bar**:
  - Divider: Thin horizontal rule `border-t border-slate-700/60 pt-6`.
  - Flex container: `flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400`. Aligned to outer container padding edges.
  - Left copyright: Dynamic current year copyright (`© {new Date().getFullYear()} BDC, SKIT Jaipur. All rights reserved.`).
  - Right attribution: `Designed by BDC, SKIT Jaipur`.

---

### Shared Hero Bottom Wave Divider (Public Pages)

Applied to all non-homepage public pages that feature a top hero banner (`AboutPage.jsx`, `GalleryPage.jsx`, `TeamPublicPage.jsx`, `SupportersPage.jsx`, `ContactPage.jsx`):

- **Shared Component & Asset**:
  - Component: `HeroWave.jsx` (`frontend/src/components/common/HeroWave.jsx`).
  - Source SVG Asset: `public/assets/bdc_team_wave_reference_v2.svg` copied directly from user-provided reference.
  - ViewBox: `0 0 1440 80` (`preserveAspectRatio="none"`).
  - Exact Curve Path: `d="M0 42 C135 30 255 22 385 24 C535 26 620 43 750 51 C875 59 1000 60 1115 50 C1240 39 1340 20 1440 4 L1440 80 L0 80 Z"`.
  - Filled Area: Lower region bounded by curve and bottom corners (`L1440 80 L0 80 Z`), perfectly blending into the following section.
  - Immutable Asset: Curve path is the chosen permanent asset; not regenerated or reshaped.

- **Dynamic Fill Color & Background Matching**:
  - Configurable `fill` prop with default `#FFFDF9`.
  - Matched exactly to each page's body background (`#FFFDF9`) across About, Gallery, Team, Sponsors, and Contact.

- **Responsive Bounded Sizing**:
  - Mobile (`< sm`): `h-8 sm:h-11` (~32–44px, strictly within 28–48px range).
  - Desktop & Tablet (`>= md`): `md:h-14 lg:h-16 xl:h-20` (~56–80px, strictly within 48–80px range).

- **Positioning & Seam Protection**:
  - Full-width bottom anchoring: `absolute bottom-0 left-0 right-0 w-full z-10`.
  - Subpixel seam protection: `translate-y-[1px] block` eliminates any 0.5px subpixel rendering gap between hero banner and following section.
  - Section wrapper: `relative overflow-hidden` prevents any horizontal or vertical scrollbar overflow.

- **Reserved Headroom**:
  - Hero content container uses `pt-16 pb-24 lg:pb-28`, maintaining $\ge 16–32\text{px}$ clearance between text descriptions and the highest crest of the wave. Headings and descriptions are never covered or crowded.

- **Accessibility & Decorative Semantics**:
  - Purely decorative: Marked with `aria-hidden="true"` and `role="presentation"`.
  - Non-interactive: `pointer-events-none select-none` prevents blocking pointer or touch interactions.

- **Scope Boundary**:
  - Replaced temporary curved decoration (`rounded-t-[50%] scale-x-125`).
  - Strictly excluded from homepage (approved and locked), registration forms, admin screens, or pages without a hero banner.

---

### Public Team Page Person Layouts & Responsive Grid Standard (`frontend/src/pages/TeamPublicPage.jsx`)

Refined person profiles and responsive always-centered grid layout across all 4 team sections (Chief Coordinator, Members, Student Coordinators, and Website Team):

- **Portrait Sizing & Proportions**:
  - Regular Members, Student Coordinators, Website Team: Scaled up ~20–25% from original 112px size to `w-28 h-28 sm:w-32 sm:h-32 lg:w-[138px] lg:h-[138px]` (138×138px on desktop, +23.2% increase; 128px tablet, 112px mobile).
  - Chief Coordinator: Scaled to `w-36 h-36 sm:w-40 sm:h-40 lg:w-[164px] lg:h-[164px]` (164×164px on desktop, ~19% larger than members).
  - Visual treatment: Circular cropping (`rounded-full`), object-cover, border-2 (`border-[#981B24]/30`), subtle drop shadow (`shadow-sm`), with neutral inline SVG avatar fallback (`FALLBACK_AVATAR`). Proportions preserved without distortion.

- **Typography & Card Balancing**:
  - Simple portrait-and-text profiles with no boxed card backgrounds, borders, or shadows.
  - Member name: `text-sm sm:text-base font-bold text-[#102B46] tracking-tight leading-snug px-1 max-w-[200px] break-words mb-1`.
  - Member role: `text-xs sm:text-[13px] font-semibold text-[#981B24] tracking-normal px-1 max-w-[200px] break-words`.
  - Chief Coordinator name: `text-base sm:text-lg lg:text-xl font-bold text-[#102B46] tracking-tight leading-snug px-1 max-w-[200px] break-words mb-1`.
  - Chief Coordinator role: `text-xs sm:text-sm font-semibold text-[#981B24] tracking-normal px-1 max-w-[200px] break-words`.
  - Top alignment: Portrait container uses `shrink-0 mb-3 sm:mb-3.5` with container `items-start`, ensuring portraits align at the top of each row regardless of name line count.

- **Always-Centered Responsive Grid Architecture (`TeamGroupGrid`)**:
  - Full data-driven rendering: Each group renders from its array using reusable `TeamGroupGrid` and `PersonProfile`.
  - Centering behavior: `flex flex-wrap justify-center items-start` ensures every row is centered within its section container.
  - Incomplete row handling: Incomplete final rows are centered automatically in the middle of the container with consistent gaps (e.g. 7 members = 5 on row 1, 2 centered on row 2). Never left-stranded or stretched across full width.
  - Single person handling: A single coordinator sits directly in the center; 2 or more form a centered group with identical gaps.
  - Gaps: Horizontal `gap-x-6 sm:gap-x-8 xl:gap-x-10` and vertical `gap-y-10 sm:gap-y-12`.
  - Dynamic content growth: Adding or removing people automatically refits rows without fixed heights or horizontal scroll.

- **Configurable Desktop Columns (`preferredColumns`)**:
  - Local configuration: `SECTION_LAYOUT_CONFIG` per-section setting ready for future admin wiring:
    - `chiefCoordinator`: `preferredColumns: 3` (1 sits centered; 2–3 form a centered row; wraps if >3)
    - `members`: `preferredColumns: 5`
    - `studentCoordinators`: `preferredColumns: 5`
    - `websiteTeam`: `preferredColumns: 5`
  - Sanitization: `getSafeColumns(cols, fallback)` bounds values to 1–6 with safe fallback.
  - Responsive column overrides:
    - Mobile (`< sm`): 2 columns (`w-[calc(50%-12px)] min-w-[130px] max-w-[180px]`), falling back to 1 on screens < 320px (`min-w-[130px]`).
    - Tablet (`sm` / `md`): 3 columns (`sm:w-[calc(33.333%-22px)]`) or 4 columns (`md:w-[calc(25%-24px)]`).
    - Desktop (`lg` / `xl`): Bounded by `preferredColumns` (e.g. 5 columns `lg:w-[calc(20%-26px)] xl:w-[calc(20%-32px)]`).

---

### Public Contact Page Specifications (`frontend/src/pages/ContactPage.jsx`)

Redesigned public Contact page combining structural reference Image 1 with the established BDC design system:

- **Hero Banner**:
  - Background: Crimson `#981B24` with text in white and `#F3DEDA`.
  - Divider: `HeroWave.jsx` anchored to bottom (`fill="#FFFDF9"`, `translate-y-[1px]` subpixel seam protection, `pointer-events-none select-none`, `aria-hidden="true"`).
  - Eyebrow: `CONTACT US` (`text-xs font-bold tracking-widest uppercase text-[#F3DEDA] mb-3`).
  - Heading: `Get in Touch` (`font-serif text-4xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-[1.12] mb-4`).
  - Supporting copy: Focused on camp inquiries, volunteering, and partnerships (`Have questions about upcoming blood donation camps, interested in volunteering, or exploring partnership opportunities? Reach out to our campaign team.`). Emergency blood-request copy intentionally omitted per explicit instruction.
  - Headroom: Container uses `pt-16 pb-24 lg:pb-28` to maintain adequate clearance above the wave crests.

- **Main Content Container**:
  - Shared public site container (`w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-12 sm:py-16`) aligning flush with navbar content boundaries.

- **Cohesive Contact Panel (`#FDF3EF`)**:
  - Unified background: Pale blush/cream `#FDF3EF` with border `#F3DEDA`, corner radius `rounded-3xl`, and padding `p-6 sm:p-8 md:p-10 lg:p-12 shadow-xs`.
  
  - **Compact Contact-Details Row (Above the Form)**:
    - 3 responsive columns (`grid grid-cols-1 md:grid-cols-3 gap-6`), separated from the form by `border-b border-[#EAD7CF] pb-8 sm:pb-10`.
    - Phone Support: `Phone` icon in `#981B24/10` rounded badge, label `Give Us a Call`, actionable link `<a href="tel:+911413500000">+91 141 350 0000</a>`.
    - Email Inquiries: `Mail` icon in `#981B24/10` rounded badge, label `Send an Email`, actionable link `<a href="mailto:bdc@skit.ac.in">bdc@skit.ac.in</a>`.
    - Campus Location: `MapPin` icon in `#981B24/10` rounded badge, label `SKIT Jaipur Campus`, address `Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017`.

  - **Contact Form Section**:
    - Eyebrow: `DIRECT INQUIRY` (`text-xs font-bold tracking-widest uppercase text-[#981B24] mb-1`).
    - Section Heading: `Leave Us a Message` (`font-serif text-2xl sm:text-3xl font-bold text-[#102B46] mb-8`).
    - Field Architecture:
      - Row 1 (desktop 2-col, mobile 1-col): Full Name (`fullName`, required, min 2 chars) and Email Address (`email`, required, RFC 5322 regex).
      - Row 2 (desktop 2-col, mobile 1-col): Phone Number (`phone`, optional, 7–15 digits if provided) and Subject (`subject`, required, min 3 chars).
      - Row 3: Message (`message`, required, min 10 chars, `rows={5}`, `resize-y`).
    - Accessible Validation:
      - Visible error states with `AlertCircle` icon, `role="alert"`, `aria-invalid`, `aria-describedby`, and `aria-required`.
      - Real-time cleanup upon valid re-typing; on-blur and on-submit triggers.
    - Submission Status & Delivery Transparency:
      - Backend endpoint non-existent; zero fake success messages.
      - Upfront notice banner: Informs users that automated online form submission is currently in development and offline.
      - Upon valid submit: Displays transparent status banner with 1-click `mailto:` action prefilled with user's name, email, phone, subject, and message (`mailto:bdc@skit.ac.in?subject=...&body=...`).
    - Submit Button: Crimson `Send Message` button (`bg-[#981B24] hover:bg-[#7E141C] text-white px-8 py-3.5 rounded-xl font-semibold shadow-xs focus-visible:ring-[#981B24]`).

  - **Compact Coordinator Contacts Block**:
    - Located within the contact panel below the form (`border-t border-[#EAD7CF] pt-8 sm:pt-10 mt-10 sm:mt-12`).
    - Preserves existing working coordinators: Aarav Sharma (Chief Coordinator), Priya Mehta (Student Coordinator), Rohan Gupta (Student Coordinator).
    - Compact 3-card grid (`grid grid-cols-1 sm:grid-cols-3 gap-4`) with direct actionable phone buttons (`tel:+911413500000`).
    - Replaces previous separate oversized section, avoiding repetition and consolidating direct assistance.

- **Campus Map Section**:
  - Positioned beneath the contact panel and above the global footer (`pb-16 sm:pb-20`).
  - Header: `SKIT Jaipur Campus` (font-serif bold heading) + verified campus address (`Swami Keshvanand Institute of Technology, Management & Gramothan, Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017`) + external `Open in Maps ↗` link opening Google Maps search in a new tab with `target="_blank" rel="noopener noreferrer"`.
  - Map Embed: Responsive iframe container (`h-[320px] sm:h-[400px] lg:h-[450px]`, `rounded-2xl border border-[#EAD7CF] shadow-xs`).
  - Target URL: `https://maps.google.com/maps?q=Swami+Keshvanand+Institute+of+Technology,+Ramnagaria,+Jagatpura,+Jaipur,+Rajasthan+302017&t=&z=16&ie=UTF8&iwloc=&output=embed`.
  - FAQ section: Excluded completely per explicit user directive.

---

### Public About BDC Page Specifications (`frontend/src/pages/AboutPage.jsx`)

Redesigned public About BDC page adapting the visual reference mockup to the established BDC design system:

- **1. Hero Banner**:
  - Background: Crimson `#981B24` with text in white and `#F3DEDA`.
  - Hero Photo Overlay: Configurable prop `heroPhotoUrl` with dark crimson multiply overlay (`bg-[#981B24]/85 mix-blend-multiply`); renders solid crimson `#981B24` when asset is unassigned.
  - Divider: `HeroWave.jsx` anchored to bottom (`fill="#FFFDF9"`, `translate-y-[1px]` subpixel seam protection, `pointer-events-none select-none`, `aria-hidden="true"`).
  - Eyebrow: `ABOUT BDC` (`text-xs font-bold tracking-widest uppercase text-[#F3DEDA] mb-3`).
  - Heading: `A student initiative for a healthier tomorrow.` (`font-serif text-4xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-[1.12] mb-4 max-w-3xl`).
  - Supporting Copy: Concise description (`The Blood Donation Campaign at SKIT is a student-led initiative dedicated to spreading awareness and contributing towards a healthier, stronger community through voluntary blood donation.`).
  - Headroom: Container uses `pt-16 pb-24 lg:pb-28` to maintain comfortable clearance above the wave crests.

- **2. Three-Photo Introduction Row**:
  - Position: Renders beneath the hero wave in shared content container (`pt-10 sm:pt-14 lg:pt-16 pb-6 sm:pb-8`).
  - Layout & Vertical Balance: 3-column responsive grid on desktop (`grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-center`), stacking naturally on mobile (`grid-cols-1`) without horizontal overflow.
  - Geometry & Sizing: Straight, moderately rounded frames (`rounded-2xl lg:rounded-3xl border border-[#EAD7CF] shadow-xs`) without rotation or carousel movement:
    - Photo 1 (Left): Flanking frame (`h-[220px] sm:h-[260px] md:h-[250px] lg:h-[300px] xl:h-[330px]`).
    - Photo 2 (Center, Taller): Elevated center frame (`h-[250px] sm:h-[300px] md:h-[300px] lg:h-[360px] xl:h-[400px]`), ~50–60px taller than flanking frames. Centered vertically (`items-center`) to create symmetric top and bottom extension.
    - Photo 3 (Right): Flanking frame (`h-[220px] sm:h-[260px] md:h-[250px] lg:h-[300px] xl:h-[330px]`).
  - Image Rendering: `object-fit: cover` with focal positioning.
  - Placeholder Fallback: Built with `ImagePlaceholder` (`bg-[#FDF3EF] border-[#EAD7D0]`) with descriptive labels (*"Camp Donor & Medical Care"*, *"Student Volunteer Coordination"*, *"BDC Volunteer Initiative"*), awaiting approved production photography.

- **3. Our Story**:
  - Section Header: Centered layout with crimson eyebrow `OUR STORY` (`text-xs font-bold tracking-widest uppercase text-[#981B24] mb-2 sm:mb-2.5`) and prominent navy serif headline `Built by students, for the community.` (`font-serif text-3xl sm:text-[34px] lg:text-[40px] font-bold text-[#102B46] tracking-tight leading-[1.15]`).
  - Two-Column Balanced Copy: Desktop 2-column layout (`grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-5xl mx-auto`), stacking to 1 column on mobile. Controlled line lengths, compact paragraph spacing, and readable body text (`text-sm sm:text-base text-[#4A5568] leading-relaxed`).
  - Confirmed Content: Reuses confirmed BDC historical copy. Mentions of faculty advisors and NSS SKIT Jaipur guidance are flagged for explicit confirmation.

- **4. Mission, Vision & Values**:
  - Cohesive Container: Pale blush panel (`bg-[#FDF3EF] border border-[#F3DEDA] rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-xs`) that grows naturally with content. Nested white cards completely removed.
  - Header: Centered crimson label `WHAT DRIVES US` and navy serif heading `Mission, Vision & Values`.
  - 3 Open Columns: 3 open columns with restrained desktop vertical dividers (`md:divide-x md:divide-[#EAD7CF]`), removed cleanly when stacked on mobile:
    - Our Mission: `Target` icon in crimson circular badge (`w-12 h-12 rounded-full bg-[#981B24]/10 text-[#981B24]`), bold navy serif subheading, and approved mission copy.
    - Our Vision: `Eye` icon in crimson circular badge, bold navy serif subheading, and approved vision copy.
    - Our Values: `Heart` icon in crimson circular badge, bold navy serif subheading, and approved values copy inspired by Swami Keshvanand.

- **5. Our Impact**:
  - Replacement: Directly replaces legacy static "Milestones So Far" section.
  - Shared Data Pipeline: Reuses the existing homepage data pipeline (`useImpactData()`, `useCountUp()`, and `CONSOLIDATED_IMPACT_BASELINE` in `impactService.js`):
    - Blood Units Collected: `1,200+` (raw: 1200) with `Droplet` icon in circular white/10 badge.
    - Donors: `2,500+` (raw: 2500) with `Users` icon in circular white/10 badge.
    - Camps Organised: `24+` (raw: 24) with `Calendar` icon in circular white/10 badge.
  - No Fabrication: Strictly avoids creating independent About totals or rendering temporary mockup strings like `[verified total]` in the final UI.
  - Animation & Accessibility: Once-per-mount `IntersectionObserver`, 1.8s `easeOutQuart` counter animation, `tabular-nums` layout shift protection, screen reader accessible final values (`sr-only`), and reduced-motion support.
  - Photographic Dark Crimson Background: Full-width photographic layer (`/assets/bdc_impact_slightly_bright_webp.webp` on `#5A040B` dark-red background with `bg-black/20` contrast overlay), visually differentiating it from the closing CTA banner.

- **6. Closing Registration CTA**:
  - Layout: Compact deep crimson banner (`bg-[#981B24]`, `py-6 sm:py-7 lg:py-8`) with top divider boundary (`border-t border-[#7E141C]/80`).
  - Typography: Small uppercase label `BE A LIFESAVER` above bold serif headline `Join us at the next camp.`.
  - Action Button: White pill button with crimson text/arrow (`bg-white text-[#981B24] hover:bg-[#FFF9F2]`) linking to `/register`.

- **7. Shared Footer**:
  - Unchanged: Inherits the existing approved global Footer (`Footer.jsx`) with `#0B233D` deeper navy background, single social presence, and verified links.

---

### Approved Homepage Section Sequence

The homepage sequence is strictly locked as follows:

1. **Navbar** (`frontend/src/components/layout/Navbar.jsx`) — Sticky institutional navigation, logos, links, Register button.
2. **Hero + Current Camp Card** (`frontend/src/pages/HomePage.jsx`) — Hero headline, dual CTA buttons, impact stat, clipped donor image, and overlapping current camp card.
3. **About BDC** (`frontend/src/pages/HomePage.jsx` Section 3) — Student initiative introduction with "Discover BDC" outline button linking to `/about` and 5:3 landscape image slot.
4. **Our Impact** (`frontend/src/pages/HomePage.jsx` Section 4) — Full-width photographic dark-red banner (`/assets/bdc_impact_slightly_bright_webp.webp`) with centered "OUR IMPACT", 3 animated stat counters, and desktop vertical dividers.
5. **Gallery: Moments That Matter** (`frontend/src/pages/HomePage.jsx` Section 5 & `frontend/src/components/home/GalleryCarousel.jsx`) — Continuous horizontally moving carousel of stacked-photo landscape cards with pale cream/blush offset layers, drag/swipe and keyboard support, accessible pause/play toggle, and 'View full gallery' link.
6. **Our Team: The People Behind the Campaign** (`frontend/src/pages/HomePage.jsx` Section 6) — Circular avatar preview grid featuring Chief Coordinator and team members with "Meet the full team" link to `/team`.
7. **Our Partners: Our Valued Partners** (`frontend/src/pages/HomePage.jsx` Section 7 & `frontend/src/components/home/PartnersLogoStrip.jsx`) — Continuously scrolling standalone logo strip on `#FDF3EF` blush container with edge gradient fades, RAF loop (~35px/s), touch drag/swipe, hover/focus pause, accessible pause/play toggle, and 'View all partners' link to `/supporters`.
8. **Our Inspiration: Swami Keshvanand** (`frontend/src/pages/HomePage.jsx` Section 8) — Ornamental arch and portrait of Swami Keshvanand with botanical decorations, foundational slogans, and bottom crimson wave celebrating his legacy of selfless service and education.
9. **Final CTA: Be a Lifesaver** (`frontend/src/pages/HomePage.jsx` Section 9) — Compact deep crimson banner (`bg-[#981B24]`) with 2-line bold serif headline, "BE A LIFESAVER" eyebrow, and white "Register Now" action button.
10. **Footer** (`frontend/src/components/layout/Footer.jsx`) — Deep navy footer (`bg-[#0B233D]`) with SKIT + BDC branding, desktop vertical divider, quick links, verified contact details, conditional social icons, and copyright bottom bar.

---

## 3. Image Replacement Reference

Quick-reference specifications for all public-facing image slots across the application:

| Slot Name | Target File / Component | Recommended Aspect Ratio | Target Resolution | Recommended Composition & Guidelines | Current Asset Path / Fallback |
|---|---|---|---|---|---|
| **Hero Banner (Carousel)** | `HomePage.jsx`<br>`heroSlides.js` | `16:9` to `21:9` (approx. `2.35:1`) | Min: `1600×700px`<br>Target: `1920×820px`<br>Retina: `2400×1025px` | Subject/donor positioned on the right 50%–55%. Left 45%–50% must be clean/neutral negative space to blend with `#FAF4EB` cream gradient. Ensure donor's head, face, bandaged arm, torso, and chair are visible above card. Multi-slide carousel with per-slide `focalPosition`. | `/assets/A01-home-hero-donor-v2.webp`<br>*(Slide 1 configured; additional approved slides awaited; fallback: solid cream `#FAF4EB`)* |
| **About BDC Photo (Homepage)** | `HomePage.jsx` Section 3 | `5:3` landscape (`aspect-[5/3]`) | Min: `800×480px`<br>Target: `1200×720px` | Active campaign photography: students at registration desk, doctor/donor interaction, or camp hall. Centered subject with warm, natural lighting. Clean uncropped original required. | `ImagePlaceholder` (`label="About photo (5:3 landscape)"`, `bg-[#FDF3EF] border-[#EAD7D0]`, `aspect-[5/3] rounded-2xl`) |
| **About Hero Photo (Optional)** | `AboutPage.jsx` Hero | `16:9` or `21:9` wide landscape | Min: `1600×700px`<br>Target: `1920×820px` | Camp atmosphere photograph with red-shirted volunteers or donors; rendered with dark crimson multiply overlay (`bg-[#981B24]/85`). | Solid crimson background (`#981B24`); photo awaited from user |
| **About Intro Photos (Row of 3)** | `AboutPage.jsx` Intro Row | Flanking: `4:3` (`~300px` height)<br>Center: `4:5` (`~360px` height) | Flanking: `800×600px`<br>Center: `800×1000px` | 3 straight, moderately rounded frames with taller center image. Left: donor and medical doctor; Center: student volunteers at desk; Right: student volunteer supporting initiative. Vertically centered row. | `ImagePlaceholder` frames (`bg-[#FDF3EF] border-[#EAD7D0]`); approved production photos awaited from user |
| **Our Impact Banner** | `HomePage.jsx`<br>`AboutPage.jsx` | `3:1` horizontal banner | Min: `1800×600px`<br>Target: `2171×724px` | Deep dark-red photographic banner with donor arm on left, soft blurred camp room in center, subtle ribbon curves and crosses on right. Slightly brighter grading with dark red treatment baked in; subtle 20% black overlay. | `/assets/bdc_impact_slightly_bright_webp.webp`<br>*(Fallback: solid deep crimson `#5A040B`)* |
| **Gallery Carousel Cards** | `HomePage.jsx` Section 5<br>`GalleryCarousel.jsx` | `16:10` landscape (`aspect-[16/10]`) | Min: `640×400px`<br>Target: `800×500px` | Authentic camp moments (donors smiling, team with banner, heart stress ball squeeze, medical staff interaction). Centered subjects with natural lighting. Stacked-photo look with pale cream/blush offset layers. | 6 BDC photos in `/assets/gallery/` (`gallery_camp_donor_smile.webp`, `gallery_skit_banner_team.png`, `gallery_stress_ball.png`, `gallery_female_donor.png`, `gallery_donor_chair.png`, `gallery_hero_donor.webp`) |
| **Team Member Avatars** | `HomePage.jsx`<br>`TeamPublicPage.jsx` | `1:1` circular (`rounded-full`) | Min: `300×300px`<br>Target: `500×500px` | Head-and-shoulders portrait; face centered at eye level; uncluttered background; professional/friendly tone. | Neutral inline SVG silhouette (`#F3DEDA` circle with `#EAD7D0` bust) |
| **Our Inspiration (Arch & Portrait)** | `HomePage.jsx` Section 8 | Arch ~1:1 (`627×593px`), Portrait ~1:1.6 (`85×138px`) | Arch: `627×593px`<br>Portrait: `85×138px` | Layered assembly: uncompressed portrait of Swami Keshvanand centered inside the ornamental arch cutout (`z-20` within `z-10` arch), scaled to ~82% interior height with base on arch base. Arch softened to muted beige-gold, 187 stray border pixels cleaned. Pale flanking botanicals (`opacity-30`, `z-0`). | `/assets/inspiration_arch.png`<br>`/assets/inspiration_swamiji.png`<br>`/assets/inspiration_botanical_left.png`<br>`/assets/inspiration_botanical_right.png` |
| **Our Inspiration (Background Accents & Wave)** | `HomePage.jsx` Section 8 | Tree ~1.2:1 (`610×511px`), Wave inline SVG (`viewBox="0 0 1440 60"`) | Tree: `610×511px`<br>Wave: Vector | Botanical tree scaled to half visible width (`w-[130px] xl:w-[155px]`, `opacity-25` to `opacity-30`), strictly contained outside text area. Bottom wave rendered via simple inline SVG with smooth cubic Bézier path (`fill="none"`, `stroke="#B30E1F"`, `strokeWidth="2"`, unclipped). | `/assets/inspiration_tree.png`<br>Inline SVG wave |
| **Partner Logos** | `HomePage.jsx`<br>`SupportersPage.jsx` | `3:1` horizontal rectangle (approx. `120×40`) | Min: `300×100px`<br>Target: `600×200px`<br>*(SVG preferred)* | Corporate/hospital logos with transparent backgrounds (`.svg` or `.png`). Symmetrical horizontal lockups with clear surrounding padding. | Text labels in white cards on homepage; inline SVG placeholder (`#F3DEDA` with red "LOGO") on Supporters page |

---

## 4. Deferred: Admin Image Upload Enhancements

> [!WARNING]
> **Deferred; not approved for implementation. Explicit user authorization required before development.**

The following capabilities were discussed during architectural review as potential future enhancements to the content management system. They are explicitly shelved:

1. **Target-Slot-Based Upload Routing**:
   - Proposed configuring explicit destination slots in the admin panel (e.g., "Hero Banner", "About Photo", "Inspiration Portrait") with preset aspect ratio constraints.
   - *Status*: **Deferred**. Current admin image uploads remain strictly scoped to camp gallery photos via `/api/gallery/upload` and `GalleryAdminPage.jsx`.

2. **Pre-Upload Interactive Canvas Crop & Zoom Modal**:
   - Proposed adding a client-side crop preview modal (e.g. `react-easy-crop` or HTML5 canvas) in the admin interface to allow administrators to crop images to required aspect ratios before dispatch.
   - *Status*: **Deferred**. All image dimensions are currently bounded on the server by Sharp (`backend/src/services/imageService.js`, bounding to 4096px and 16MP).

3. **Client-Side Automated WebP Conversion**:
   - Proposed transcoding user-uploaded JPEG/PNG files to WebP in the browser before upload to conserve client bandwidth.
   - *Status*: **Deferred**. Sharp server-side handling and ImageKit transformations already handle storage delivery.

4. **Slot-Based Dynamic Image Replacement UI**:
   - Proposed building an interactive visual slot replacer on the homepage where administrators can click any placeholder to upload a new asset directly.
   - *Status*: **Deferred**. No slot-based CMS UI is to be built without explicit user authorization.

### Deferred — Inspiration content editing and site-wide dynamic-text layout

> [!WARNING]
> **Not authorized for implementation. Revisit when the user approves admin integration.**

- Future editable fields: section label, person’s name, main description, closing statement, and left/right slogans.
- Future text handling: natural section growth, responsive wrapping, no overlap or clipping, and no unreadable automatic font shrinking.
- Field-specific limits and helpful admin validation, with matching backend enforcement.
- Plain text by default; restricted rich text only if approved.
- A proposed rendered-section preview before publishing.
- Testing of empty values, long content, unbroken strings, and mobile widths.
- Decorative layers remaining independent of text height.

### Deferred — Team layout controls

> [!WARNING]
> **Not authorized for implementation. Revisit when the user approves admin integration.**

- Future admin integration should allow a preferred desktop people-per-row setting for each team section (Chief Coordinator, Members, Student Coordinators, Website Team).
- Controls should feature validated limits (bounded between 1 and 6 preferred columns) and sensible responsive overrides.
- Editors should understand that smaller screens (tablets and mobile) may automatically display fewer columns to ensure portraits and typography maintain their sensible minimums without awkward shrinking or horizontal scrolling.
- Database schema changes, backend endpoints, and admin management UI remain strictly shelved until authorized.

### Deferred — Admin-managed sponsor sections

> [!WARNING]
> **Deferred — implement only when admin integration is explicitly authorized.**  
> Document only. Do not implement admin controls, backend changes, or public-page behavior yet. Leave the current website unchanged.

- **Section management**:
  - During future admin integration, allow administrators to create, edit, and reorder sponsor sections.
  - Each section contains:
    - Small heading/eyebrow, such as “SUPPORTING SPONSORS”.
    - Main title, such as “Our Supporting Partners”.
    - Optional descriptive line.
    - An ordered collection of sponsor entries with names and logos.
    - Section display order and visibility setting.
  - Existing predefined sections and newly created sections must use the same configurable structure.

- **Automatic public visibility**:
  - Display a section only when it is enabled and contains at least one sponsor eligible for public display.
  - Hide the entire empty section, including headings, description, background, padding, and dividers.
  - Keep empty sections accessible in admin with an “Empty — hidden on website” status.
  - Adding the first published sponsor makes an enabled section appear; removing or unpublishing its last sponsor hides it.
  - Do not count draft sponsors or decorative placeholders as public entries.
  - A temporary image-loading failure must not erase an otherwise valid sponsor section; use the approved fallback behavior.

- **Layout and data**:
  - Center logo rows, including incomplete final rows, and wrap responsively as sponsors are added.
  - Preserve logo proportions and apply the documented display-size limits.
  - Keep headings and descriptions within their section using the deferred dynamic-text rules.
  - Associate section configuration with the relevant camp, while preserving the existing sponsor records and organization associations.
  - Do not silently migrate or replace the unresolved shared-roster architecture.
  - Changing one camp’s sections must not change another camp’s sections.

### Deferred — Contact form backend message delivery pipeline

> [!WARNING]
> **Not authorized for implementation. Revisit when the user approves backend message delivery.**

- Future implementation should create an automated backend message delivery route (e.g. `POST /api/contact`) to receive contact form submissions securely.
- Enforce server-side schema validation matching frontend rules (name, valid email, optional phone, subject, message).
- Implement rate limiting, spam protection (e.g. honeypot/CAPTCHA), and sanitization.
- Support automated notification dispatch to official camp email accounts and/or admin inbox storage without relying on client-side mailto fallbacks.
- Database models, email dispatch services, and admin messaging interfaces remain strictly shelved until authorized.

### Deferred — Admin phone number and coordinator contact management

> [!WARNING]
> **Not authorized for implementation. Revisit when the user approves admin phone number integration.**

- Future admin integration should allow configuring official campus contact phone numbers and managing coordinator mobile/office phone numbers per camp.
- Provide input validation and phone formatting rules (E.164 / Indian telephone standards).
- Ensure public-facing phone links update dynamically while preserving the current working numbers in the interim.
- Database schema changes, backend settings endpoints, and admin management UI remain strictly shelved until authorized.

### Deferred — About BDC content and photo management

> [!WARNING]
> **Not authorized for implementation. Revisit when the user authorizes admin management for About page content and photo assets.**

- Future admin integration should allow administrators to edit public About page content, including:
  - Hero introduction text and toggle/upload for the hero background photograph with configurable crimson overlay darkness.
  - Three-photo introductory showcase images with upload, cropping guidance, custom alt text, and display order. Maintain strict aspect ratio constraints (~3:4 or 4:5 portrait for left/right flanking images, and ~4:5 or 1:1 for center image) to preserve symmetric top/bottom elevation geometry.
  - "Our Story" narrative body paragraphs, founding history statements, and institutional affiliations (e.g. faculty advisory team, NSS SKIT Jaipur).
  - Mission, Vision, and Values titles, descriptions, and icon selection.
- Any backend database schema modifications, media upload endpoints, and administrative management interfaces remain strictly shelved until authorized.

### Deferred — Homepage template copied at camp creation

> [!WARNING]
> **Confirmed Design Decision — Shelved until backend/admin integration is authorized.**  
> *Do not implement now. Documented strictly as an architectural specification for future authorized work. No code, schema, API, or admin UI changes are permitted in the interim.*

#### Core Architectural Requirements

- **Master Homepage Template Maintenance**:
  - Maintain a default homepage template defining initial content, typography, structural sections, and default image references.
- **Template Copying on Camp Creation**:
  - When an administrator creates a new camp record, copy that master template directly into the camp’s own independent homepage records.
- **Independent Content Lifecycle**:
  - After creation, each camp manages its homepage content independently.
  - Editing or updating one camp’s content must not affect another camp or the master template.
- **Future-Only Template Propagation**:
  - Updating the master homepage template affects future camps only.
  - Modifying the template must never overwrite or alter existing camps.
- **Live Camp Display Binding & Seamless Switching**:
  - The public homepage reads and renders the published content of the currently selected live camp (referenced via `SiteSettings.featured_camp_ref`).
  - Switching the live camp immediately displays that newly selected camp’s published homepage.
  - Previous and inactive camps retain all of their content, assets, and settings for later editing, review, or reactivation.
- **Asset Reference Isolation & Shared Fallbacks**:
  - Default image files may be shared across camps as baseline fallbacks.
  - Replacing or uploading an image updates only the selected camp’s reference pointer.
  - Shared fallback image assets must never be deleted or modified globally when a specific camp updates its artwork.
- **Resolution of Global-vs-Camp Split & Explicit Migration**:
  - Resolve the existing global-versus-camp homepage management split during future implementation.
  - Preserve all existing content through an explicit migration plan and script; do not silently overwrite or drop existing records.

#### Architectural Comparison: Current Code vs. Confirmed Future Architecture

| Dimension | Current Code Implementation | Confirmed Future Architecture (Deferred) |
|---|---|---|
| **Camp Creation (`campController.js`)** | Creates a `Camp` document only (`Camp.create(...)`). No homepage content record or template is initialized, cloned, or linked upon camp creation. | Automatically clones the master default homepage template into a newly initialized, camp-scoped homepage content record (`camp_id: newCamp._id`). |
| **Admin Homepage Editing (`AdminContentPage.jsx`)** | Loads and saves against the global content document (`camp_id: null`) via `api.content.getHomepagePreview()`. Does not offer camp-scoped switching for homepage content in the primary admin editor. | Admin selects the target camp (or the master template) to edit. Each camp maintains its own isolated draft and publish lifecycle. |
| **Public Homepage Delivery (`getPublicHomepage`)** | Two-tier fallback: queries `camp_id: featured_camp_ref` with `is_published: true`. If absent, falls back to global content (`camp_id: null`), and finally static code constants (`DEFAULT_HOMEPAGE_CONTENT`). | Deterministically resolves the currently active live camp's published homepage content record; falls back to the camp's initialized template state without reliance on an ambiguous global document. |
| **Template Updates** | Modifying `DEFAULT_HOMEPAGE_CONTENT` in `shared/constants.js` or editing global content changes the fallback for any camp lacking explicit content. | Updating the master default template is an explicit admin action that applies solely to newly created camps going forward, leaving all existing camp records untouched. |
| **Image Asset Replacement** | Global asset paths or single-slot replacements risk impacting all views reading shared fallbacks. | Replaces only the asset pointer/URI in the camp's own content payload. Master fallback asset files remain untouched and intact in storage. |
| **Content Unification / Migration** | Split exists between global content and camp-scoped content records in MongoDB. | Formal migration script transitions existing global content into the default template and maps active content to the live camp, preserving all historical edits without silent overwrites. |

---

## 5. Maintenance Instructions

All future AI agents and contributors must strictly adhere to the following maintenance protocol:

### When to Update This File

This document must be updated whenever:
1. **A new section is created or significantly refactored** (e.g. implementing the full About page, Contact page, or Admin views).
2. **Design tokens or styles change** (e.g. modifying colors, font sizes, margins, padding, border radii, or gradients).
3. **An image slot is updated or a new asset is assigned** (e.g. swapping the temporary hero preview for a permanent production image, or binding real partner logos).
4. **The user approves, rejects, or defers any design proposal**.

### Agent Update Protocol

1. **Verify Against Code**: Always inspect the rendered component or CSS before updating values here. Record exact Tailwind classes, hex codes, and pixel measurements.
2. **Maintain Status Categorization**: Ensure any newly discussed features are placed in the correct status tier (User-Approved, Implemented Awaiting Review, Unresolved, or Deferred).
3. **Keep `PLAN.md` Synchronized**: Maintain the pointer in `PLAN.md` to ensure subsequent agents discover this reference.
4. **Record Every Change**: Append a row to the Changelog below detailing the date, section modified, and nature of the change.

---

## Changelog

| Date | Section Modified | Description of Change | Author / Agent |
|---|---|---|---|
| 2026-09-24 | Initial Creation | Created `DESIGN_DECISIONS.md` documenting verified Navbar, Hero, and Current Camp Card specifications, 10-section homepage sequence, image replacement matrix, and deferred admin upload ideas per explicit user instruction. | Antigravity AI |
| 2026-09-24 | Hero Carousel & Shared Impact | Implemented manual hero image carousel with circular white controls (`w-11 h-11`), readable slide counter, per-image focal configuration, and auto-hide when <2 slides. Consolidated Hero impact statistic with Our Impact section (`2,500+` labelled "Donors across our camps") via `impactService.js` and `useImpactData()`. Removed hardcoded "500+" and retired "Lives impacted" label. | Antigravity AI |
| 2026-09-24 | Current Camp Card Button | Adjusted desktop button alignment from card-centered (`lg:self-center`) to row-aligned (`lg:self-end` with `lg:items-end`), vertically aligning with the date/time and venue row. Preserved natural mobile stacked layout. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | About BDC Section | Refined homepage About BDC section with centered text column, 2-line Lora serif headline, 3-line constrained paragraph, "Discover BDC" outline button, 5:3 landscape image slot (aspect-[5/3] rounded-2xl), and compact vertical padding (py-10 to py-14). Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Our Impact Section | Updated Our Impact section with full-width photographic background (`/assets/bdc_impact_slightly_bright_webp.webp`, 2171×724px), subtle 20% black overlay for contrast, centered "OUR IMPACT", 3 evenly spaced statistics with desktop vertical dividers, and smooth 1.8s count-up animation via `useCountUp.js` (`easeOutQuart`, `tabular-nums`, once-per-mount `IntersectionObserver`, reduced-motion support, screen reader accessibility). Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Our Impact Asset | Swapped photographic background asset to slightly brighter grading (`/assets/bdc_impact_slightly_bright_webp.webp`, 2171×724px) from Downloads per user instruction. Preserved all layout, typography, dividers, data sources, and count-up animation settings. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Our Inspiration Section | Completed Section 8 with warm cream background (`#FAF4EB`), navy serif heading (`#031B44`), crimson accents (`#B30E1F`), ornamental arch (`inspiration_arch.png`), Swami Keshvanand portrait (`inspiration_swamiji.png`, uncompressed), subtle botanical decorations (left/right branches, background tree), and bottom crimson wave (`inspiration_crimson_wave.png`). Real HTML text, SKIT foundational slogans, structured `INSPIRATION_CONTENT` data model. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Our Inspiration Refinement (Pass 2) | Refined Section 8 to match reference layout: scaled seated portrait figure to ~82% of arch interior height with base on arch base (`bottom-[1.5%] h-[82%]`); softened arch to muted beige-gold and cleaned 187 stray border pixels; switched to subtle warm peach-cream background (`#F8E9DA`); reduced top gap with compact section padding (`pt-6 to pt-10`, `pb-10 to pb-14`); established explicit 4-column desktop layout (Left slogan \| Arch & portrait \| Main text with thin crimson divider & top dot \| Right slogan & isolated tree halved to ~130–155px); restored right slogan ("INDIVIDUAL DEVELOPMENT LEADS TO A STRONGER NATION"); replaced broken wave with smooth unclipped inline SVG Bézier curve (`stroke="#B30E1F"`, `vector-effect="non-scaling-stroke"`). Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Gallery Carousel Implementation | Replaced 4 static square tiles in Section 5 with a horizontally moving image carousel inspired by Reference Image 2: bold navy serif heading matching About section, crimson uppercase label, landscape photo cards (`aspect-[16/10]`) with subtle offset stacked-card layers in pale cream (`#FAF4EC`) and blush (`#FDF3EF`), continuous smooth 60fps loop via RAF (~45px/s), drag/swipe support via pointer events with `touch-action: pan-y`, pause on hover and keyboard focus, arrow key navigation, accessible pause/play toggle control, duplicate items hidden with `aria-hidden="true"`, reduced-motion compliance, and 6 authentic BDC gallery photos with `object-fit: cover`. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Gallery Carousel Refinement | Refined Section 5 Gallery carousel: removed decorative stacked layers behind photo cards; implemented clean rounded photo cards (`aspect-[16/10]`, `rounded-2xl`, `border-[#EAD7CF]/70`) with subtle shadow (`shadow-sm`); added gentle 3–4px hover lift (`group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300 ease-out`) applied inside track without interfering with movement; added `py-4 sm:py-5` headroom preventing shadow/lift clipping; replaced text pill with discreet circular pause/play icon button (`w-11 h-11`, $\ge 44\times 44\text{px}$ tap target, `focus-visible:ring-[#B30E1F]`) beside carousel. Preserved fonts, headings, cream background, drag/swipe, auto-loop, keyboard navigation, and reduced-motion support. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Gallery Pause Control & Placement | Refined Section 5 Gallery carousel controls and pause behavior: centered pause/play button between image row and "View full gallery" with balanced spacing (`mt-3 sm:mt-4` on button, `mt-4 sm:mt-5` on link); visibly shown on mobile and touch devices (including tablets); on desktop with mouse, hidden during normal viewing and automatically pauses while pointer is over image row, resuming on mouse leave unless explicitly paused; pauses when keyboard focus enters and reveals the control with visible focus ring; on mobile/touch, tapping pause keeps playback paused until user taps play; compact 44×44px button with accurate dynamic label and focus styling; preserved reduced motion, cards, shadows, hover lift, typography, and gallery link. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Our Team Section Refinement | Refined Section 6 Our Team on homepage per Image 2 reference with corrected row alignment: Chief Coordinator alone in row 1 centered beneath heading; 4 members in row 2 with equal spacing (`lg:grid-cols-4`), aligned portrait horizontal line, and aligned name baseline; clear vertical gap between Chief Coordinator role and member row; circular portrait hierarchy (`w-24 h-24 sm:w-28 sm:h-28` for Chief Coordinator vs `w-20 h-20 sm:w-24 sm:h-24` for members) with clean circular placeholders; bold navy serif heading matching About and Gallery, crimson uppercase label, bold navy sans-serif names, and muted role; responsive mobile layout with centered Chief Coordinator above 2-column member grid (`grid-cols-2 max-w-xs sm:max-w-sm`); "Meet the full team →" at lower-right on desktop (`lg:justify-end`) and centered on mobile; preserved cream background and established margins. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Our Partners Logo Strip | Refined Section 7 into a continuous horizontally scrolling logo strip inspired by reference Image 2: replaced bordered white cards with standalone transparent PNG logos (SMS, Red Cross, NIMS, HDFC, Coca-Cola, SBI) on pale blush (`#FDF3EF`); smooth continuous RAF loop (~35px/s); left and right edge gradient fades; touch drag/swipe support; pause on hover and keyboard focus; device-adaptive centered pause/play button (visible on mobile, hidden on desktop with mouse, revealed on keyboard focus); explicit pause persistence; duplicate items hidden with `aria-hidden="true"`; fallback to text name on load error; bold navy serif heading matching About, Gallery, and Team; preserved "View all partners" link to `/supporters`. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Our Partners Logo Strip Refinement | Refined Section 7 strip per user feedback: widened moving strip to nearly full page width with ~3.5% desktop side margins (`px-[3.5%]`); closed `max-w-6xl` after Section 6 so strip is unconstrained while keeping heading and "View all partners" centered; increased visible logo sizes by ~25–35% with individual optical weight classes (SMS shield 82px, Red Cross 70px, NIMS 74px, HDFC 210x70px, Coca-Cola 225x68px, SBI 205x68px); removed internal padding shrinking logo boxes; preserved proportions with `object-fit: contain`; narrowed edge gradient fades to `w-5 to w-14` (`from-[#FDF3EF] to-transparent`) so fully visible logos stay clear; reduced gaps between logos to `gap-6 to gap-12` (24px to 48px); compact track padding `py-2 sm:py-2.5`. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Our Partners Logo Marquee (DevTools Reference) | Refined Section 7 logo marquee using browser DevTools spacing references: one horizontal, non-wrapping row of vertically centered logos with natural widths based on aspect ratios (`w-auto object-contain`, no fixed cards or `space-between`); bounded responsive height (`h-10 sm:h-12 md:h-14 lg:h-16`) and bounded max width (`max-w-[170px] sm:max-w-[210px] lg:max-w-[260px]`); trimmed leftover whitespace on asset bounds; generous explicit separation matching the ~115px reference (`gap-16 sm:gap-20 lg:gap-28 xl:gap-32`); seamless loop boundary gap matching via identical trailing padding (`pr-16 sm:pr-20 lg:pr-28 xl:pr-32`); dynamic track calculation via ResizeObserver and image onLoad events (calculates track from actual logos and gaps, avoiding hardcoded widths); removed all side fade gradients, visible boxes, borders, and shadows; clips only at outer marquee viewport with natural partial entrance/exit visibility; preserved responsive desktop margins (`px-[3.5%]`), centered header and `/supporters` link, continuous RAF looping (~35px/s), touch drag, hover/focus pause, and centered pause/play toggle. Deferred admin upload and per-logo custom sizing features. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Registration CTA & Footer Refinement | Refined Section 9 Registration CTA and global Footer per Image 2 specifications: CTA updated with compact padding (`py-8 sm:py-9 lg:py-10`), `BE A LIFESAVER` uppercase label, 2-line bold serif headline ("Your one small act." / "Someone’s tomorrow."), white "Register Now" action button with crimson text/arrow, vertically balanced layout, and mobile responsive stack. Footer completely redesigned with `#0B233D` deep navy background, 4-column responsive grid (Branding with SKIT + BDC logos and vertical desktop divider \| Quick Links \| Contact Us with verified email/address \| Follow Us with conditional verified social links), thin divider, and current year copyright + "Designed by BDC, SKIT Jaipur". Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | CTA Height, Footer Logo Contrast & Public Margins | Standardized public site margins to shared outer container matching navbar (`w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]`) across HomePage, AboutPage, GalleryPage, TeamPublicPage, SupportersPage, and ContactPage while preserving full-width backgrounds, waves, and moving strips; cleaned negative margin hacks; reduced CTA vertical padding by ~25% to `py-6 sm:py-7 lg:py-8` with vertically centered alignment; resolved footer logo contrast on navy (`#0B233D`) background by enclosing branding lockup in compact cream backing card (`bg-[#FAF4EB] rounded-xl`) preserving original colors and proportions. Admin layouts completely untouched. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Footer Logo Backing Specification | Updated footer logo backing card to background `#D9DEDC`, with 10–12px padding (`p-2.5 sm:p-3`), 8px corner radius (`rounded-[8px]`), and muted divider (`#B8BEBC`). Preserved original logo colors and navy `#0B233D` footer background. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Team Page Person Layouts & Always-Centered Grid | Refined person profiles across all 4 team sections (Chief Coordinator, Members, Student Coordinators, Website Team) on public Team page: increased circular portrait sizes by ~20–25% (members 138px desktop, chief 164px desktop); clean portrait-and-text styling without boxed card backgrounds; top-aligned portraits with wrapping text; built reusable always-centered grid component (TeamGroupGrid) using flexbox that centers incomplete final rows and single coordinators; added local per-section preferredColumns config (1–6, fallback 5) ready for future admin wiring with responsive mobile/tablet overrides; documented deferred admin layout controls; preserved all names, roles, and sections. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Deferred Sponsor Sections Specification | Documented requirements for "Deferred — Admin-managed sponsor sections" in DESIGN_DECISIONS.md: section management schema (eyebrow, title, description, ordered entries, display order, visibility), automatic public visibility rules (auto-hide empty sections, admin empty badge, published vs draft/placeholder filter, image error fallback preservation), camp-scoped association without silent migration of shared-roster architecture, always-centered responsive logo wrapping, and display-size limits. Strictly documented only without code changes. | Antigravity AI |
| 2026-09-24 | Public Contact Page Redesign | Redesigned public Contact page combining structural reference Image 1 with BDC design system: crimson hero with "Get in Touch" bold serif heading, HeroWave divider, and concise supporting copy (camp inquiries, volunteering, partnerships without emergency blood claims); cohesive pale blush/cream (#FDF3EF) panel with compact 3-column contact details row above the form (phone, email, campus address with consistent icons and actionable tel/mailto links); contact form with Full Name, Email, optional Phone, Subject, Message in 2 columns on desktop and 1 on mobile, visible labels, accessible validation, crimson "Send Message" button; upfront development notice and transparent mailto fallback notice marking direct submission as unavailable without fake success messages; compact camp coordinator direct assistance block with actionable phone links; responsive SKIT Jaipur campus Google Maps embed (h-[320px] to h-[450px]) with "Open in Maps" external link; completely excluded FAQ section per explicit directive; documented deferred backend message delivery and admin phone management. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Public About BDC Page Redesign | Redesigned public About BDC page (`AboutPage.jsx`) per visual mockup and BDC design system: crimson hero with approved HeroWave, bold serif headline ("A student initiative for a healthier tomorrow."), and optional hero photo overlay; 3-photo introduction row beneath hero with taller center frame (~360px center vs ~300px flanking on desktop), items-center vertical balance, and graceful placeholders awaiting assets; "Our Story" section with balanced 2-column layout on desktop; Mission, Vision & Values in open 3-column pale blush panel (`#FDF3EF`) with circular crimson icon badges and vertical desktop dividers, removing nested white cards; Our Impact photographic dark-red banner (`/assets/bdc_impact_slightly_bright_webp.webp` on `#5A040B` with `bg-black/20`) using shared `useImpactData()` and `useCountUp()` animation (1,200+ Blood Units, 2,500+ Donors, 24+ Camps); compact crimson closing CTA ("Join us at the next camp.") linking to `/register`; preserved approved shared footer and navbar-aligned margins. Documented deferred About content/photo management and flagged unconfirmed historical claims. Marked awaiting user review. | Antigravity AI |
| 2026-09-24 | Deferred — Homepage Template per Camp | Documented confirmed future design decision for homepage template copying upon camp creation: master template cloning, isolated camp content management, future-only template propagation, live camp selection binding, asset reference isolation without deleting shared fallbacks, explicit migration to resolve current global-vs-camp split, and comparative breakdown of current code vs confirmed architecture. Documented only; no code, schema, API, or admin UI changes implemented. | Antigravity AI |












---

## Appendix B. Public asset inventory at review time

These are source asset filenames, not instructions to copy every file. Retain only the files needed by the extracted public UI. Filenames alone do not establish factual approval.

- assets/A01-home-hero-donor-v2.webp (154988 bytes)
- assets/bdc_combined_logo.svg (3208 bytes)
- assets/bdc_impact_dark_red_banner.webp (52206 bytes)
- assets/bdc_impact_slightly_bright_webp.webp (89382 bytes)
- assets/bdc_nav_logo.svg (2674 bytes)
- assets/bdc_team_wave_reference_v2.svg (332 bytes)
- assets/gallery/gallery_camp_donor_smile.webp (16394 bytes)
- assets/gallery/gallery_donor_chair.png (36801 bytes)
- assets/gallery/gallery_female_donor.png (36907 bytes)
- assets/gallery/gallery_hero_donor.webp (154988 bytes)
- assets/gallery/gallery_skit_banner_team.png (37540 bytes)
- assets/gallery/gallery_stress_ball.png (30054 bytes)
- assets/hero-temp-preview.webp (9874 bytes)
- assets/inspiration_arch.png (440330 bytes)
- assets/inspiration_botanical_left.png (209856 bytes)
- assets/inspiration_botanical_right.png (205744 bytes)
- assets/inspiration_crimson_wave.png (63335 bytes)
- assets/inspiration_swamiji.png (24806 bytes)
- assets/inspiration_tree.png (506791 bytes)
- assets/partners/partner_1.png (11302 bytes)
- assets/partners/partner_2.png (9792 bytes)
- assets/partners/partner_3.png (10837 bytes)
- assets/partners/partner_4.png (10810 bytes)
- assets/partners/partner_5.png (9494 bytes)
- assets/partners/partner_6.png (10775 bytes)
- assets/partners/partner_coca_cola.png (9494 bytes)
- assets/partners/partner_hdfc.png (1474012 bytes)
- assets/partners/partner_nims.png (10340 bytes)
- assets/partners/partner_red_cross.png (9792 bytes)
- assets/partners/partner_sbi.png (8969 bytes)
- assets/partners/partner_sms.png (3196184 bytes)
- assets/reference/about_photo.png (96515 bytes)
- assets/reference/about.png (221268 bytes)
- assets/reference/final_cta.png (71932 bytes)
- assets/reference/footer.png (141067 bytes)
- assets/reference/gallery_1.png (36801 bytes)
- assets/reference/gallery_2.png (37540 bytes)
- assets/reference/gallery_3.png (30054 bytes)
- assets/reference/gallery_4.png (36907 bytes)
- assets/reference/gallery.png (210061 bytes)
- assets/reference/header.png (55846 bytes)
- assets/reference/hero_photo.png (222081 bytes)
- assets/reference/hero.png (442435 bytes)
- assets/reference/impact.png (146555 bytes)
- assets/reference/inspiration.png (188754 bytes)
- assets/reference/partner_1.png (9861 bytes)
- assets/reference/partner_2.png (7950 bytes)
- assets/reference/partner_3.png (9547 bytes)
- assets/reference/partner_4.png (8126 bytes)
- assets/reference/partner_5.png (10222 bytes)
- assets/reference/partner_6.png (8549 bytes)
- assets/reference/partners_row.png (57008 bytes)
- assets/reference/partners.png (121703 bytes)
- assets/reference/team.png (190750 bytes)
- assets/Skit_logo.png (2396545 bytes)
- assets/skit-logo.png (19107 bytes)
- assets/swamiji-portrait.png (24806 bytes)

</details>
