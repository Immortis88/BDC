# Deploy BDC on the SKIT subdomains

Frontend: https://abc.skit.ac.in
Backend: https://abcapi.skit.ac.in

## Backend app

In Meridian, open Websites > Manage the backend app > App Env.
Add these variables individually, preserving any existing settings:

| Name | Value |
| --- | --- |
| NODE_ENV | production |
| CORS_ORIGIN | https://abc.skit.ac.in |
| DB_HOST | Database host provided by your hosting provider |
| DB_PORT | 3306, unless your provider specifies another port |
| DB_USER | Full cPanel database username |
| DB_PASSWORD | Database password |
| DB_NAME | Full cPanel database name |
| FINGERPRINT_KEY | Private random key; preserve the existing key if migrating registrations |
| MEDIA_ROOT | Absolute path to an existing persistent media directory on the server |

Do not set PORT: Meridian assigns it. Click Save & Restart.
The application connects to MySQL before it starts listening, so database settings must work first.

If the application path is the repository root, use:

- Build command: `npm --prefix backend ci --omit=dev`
- Startup command: `node backend/src/server.js`

If the application path is `backend`, use `npm ci --omit=dev` and `node src/server.js` instead.
Keep this configured as a server application. If Meridian requires a build output directory for this backend, check the detected app type and deployment log; this Express app has no compiled output folder.

## Frontend

The committed `frontend/.env.production` contains:

```env
VITE_API_URL=https://abcapi.skit.ac.in
```

This address is public configuration. Never put database credentials or private keys in VITE variables.
For a Git-based static frontend deployment with application path `frontend`:

- Build command: `npm ci --include=dev && npm run build`
- Output directory: `dist`

Alternatively, build locally with `npm --prefix frontend ci --include=dev` then `npm --prefix frontend run build`.
Upload the contents of `frontend/dist`, including `.htaccess`, to the document root assigned to `abc.skit.ac.in`.
The `.htaccess` rule supports page refreshes on Apache. A different static server needs its own index.html fallback.
Changing VITE_API_URL requires rebuilding the frontend.

## Database and images

- Create the database and grant its user access before starting the backend.
- `database/bdc-schema.sql` creates an empty schema; it does not transfer existing content or admin accounts.
- For an existing site, migrate a current database export, preserving its fingerprint key. The supplied `bdc-production.sql` contains CREATE DATABASE/USE statements for `bdc` and DROP TABLE statements: do not import it blindly into an existing database or a differently named cPanel database.
- Upload the contents of `backend/assets` to the persistent directory chosen for MEDIA_ROOT. Keep its `camps`, `gallery`, `sponsors`, and `teams` subdirectories. Verify these files match the database being migrated.
- Media is excluded from Git. Ensure future redeployments retain uploaded files.
- Use HTTPS on both domains.

## Verify after deployment

1. Open https://abcapi.skit.ac.in/api/health and check that it returns `ok: true`.
2. Open https://abc.skit.ac.in and verify live content and images load.
3. Open and refresh https://abc.skit.ac.in/admin/login, then sign in.
4. Check the browser Network panel: API and media requests should target abcapi.skit.ac.in.
5. Verify an authorized image upload and export. Change any default admin password before public use.

Reference: https://docs.cpanel.net/cpanel/meridian/websites/manage-a-nodejs-app/
