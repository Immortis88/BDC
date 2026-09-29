# Registration fixes verification

Implemented backend registration-module authorization with compatible legacy view/export grants, independent name and registration-code filtering before pagination, strict export-column validation and deduplication, and full-camp summary counts in the registration UI.

Validation: 18 API/database checks passed in a generated bdc_test_<random> database, including 30 concurrent submissions, independent camp sequences, unauthorized requests, cross-camp status updates, combined filters, full exports and CSV formula escaping. The test database is dropped in finally. Run from backend with npm run test:registrations. The configured MySQL user needs CREATE/DROP DATABASE privileges. No donor data from bdc is used.

Frontend production build passed. Browser reached the admin login page; the documented credentials were rejected, so authenticated UI verification remains pending. No passwords or accounts were changed.

Historical test audit: the replaced test script modified the first live-camp registration without preserving original outcome metadata, created sessions for existing accounts, and temporarily opened live registration. A current read-only check found an existing Verification Test Donor record (id 3, code skitbdc2026_0003). This does not establish which earlier record was overwritten or its original outcome. No reliable pre-test snapshot was available, so no existing donor record was restored or deleted.

Restart the running backend to load route changes; refresh the frontend. The current database already contains the canonical camp.registrations permission. Fresh schema now contains it as well. Legacy view/export grants remain operation-specific and do not gain outcome-update permission.
