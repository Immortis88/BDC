# Local security fixes

Branch: `security-review`.

## Behavior changes

- Sponsor section headings are rendered as text or escaped before entering popup HTML.
- New/reset administrator passwords require at least 12 characters and at most 72 UTF-8 bytes (bcrypt's limit). Generated passwords use 24 cryptographically random bytes. Existing passwords are not rewritten.
- Every newly created/reset account must change its temporary password. The API restricts flagged sessions to password setup and account inspection; logout remains available. Regular administrators can complete mandatory setup. Existing accounts already flagged for a change will now have that requirement enforced by the API.
- Registration requires literal boolean consent, a 10-digit mobile number, supported participant types, and bounded text fields. Contact submissions also validate text types and lengths.
- Receipt recovery requires the original submission key and an unexpired attempt (24 hours). A fresh form or another browser cannot retrieve a previous receipt by supplying personal details. The existing saved receipt view remains available on the original browser. Simultaneous submissions are checked inside the sequence transaction to avoid duplicate records.
- Unexpected errors return generic messages. Server error logging excludes SQL statements, raw messages and request bodies.

## Request limits

Each window lasts 15 minutes. A blocked request receives HTTP 429 and `Retry-After`; existing frontend error messages display the retry guidance.

| Endpoint | Shared IP limit | Identity limit |
| --- | --- | --- |
| Login | 200 | 15 per normalized email |
| Registration | 600 | 8 per normalized email |
| Contact | 100 | 5 per normalized email |
| Password change | — | 10 per authenticated administrator |

These limits count attempts, including successful and invalid submissions. Registration uses a generous IP ceiling so a campus network can share an address. Identity buckets hold keyed hashes, not plaintext email addresses. Each limiter has bounded memory and expires idle buckets.

When deploying behind a proxy, set `TRUSTED_PROXY_CIDRS` to the actual proxy addresses/CIDRs supplied by the host (comma-separated). Never trust all forwarded addresses. Without this setting, requests behind a proxy share its IP bucket; verify forwarding before opening registration.

The limit store is local to one server process and resets on restart. Multiple processes/replicas need a shared limiter at the gateway or a shared store. These controls reduce abuse; they do not prevent distributed spam or replace hosting DDoS protection.

## Remaining limits

- Receipt data is protected, but immediate registration success versus a duplicate refusal can still reveal whether a supplied identity was already used. Full participation privacy requires a verified email/phone flow with indistinguishable public responses; no outbound verification service has been added.
- Browser storage still holds administrator bearer tokens. Moving to HttpOnly cookies requires a separate session/CORS/CSRF change across both domains.
- Use HTTPS, rotate any deployed default administrator passwords, preserve the production fingerprint key, and configure persistent storage and hosting security separately. No production credentials, database records, or hosting settings were changed by this work.

## Verification

- `npm --prefix backend run test:security`: local HTTP regression tests with a database double, including invalid consent, input types, receipt access, password setup, login, throttling, upload rejection and generic errors.
- `npm --prefix backend run test:registrations`: creates and removes an isolated test database; covers registration concurrency, receipt retries/expiry, permissions, donation outcomes and Excel exports.
- `npm --prefix frontend run build`: production frontend build.

No schema migration or additional dependency is required.
