'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const path       = require('path');
const { testConnection } = require('./db');

const app  = express();
const PORT = Number(process.env.PORT) || 4000;

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin:      process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Media ─────────────────────────────────────────────────────────────
// Serves backend/assets/** (camps, teams, sponsors, gallery) as /media/**
const storage = require('./storage');
let legacyUrlMap = {};
try {
  legacyUrlMap = require('./config/legacy-url-map.json');
} catch (_) {}

app.use('/media', (req, res, next) => {
  const fullMediaUrl = `/media${req.path}`;
  if (legacyUrlMap[fullMediaUrl]) {
    return res.redirect(301, legacyUrlMap[fullMediaUrl]);
  }
  next();
});
app.use('/media', express.static(storage.MEDIA_ROOT, { maxAge: '7d', etag: true }));

// Also serve frontend assets like /assets/** for hero slides or fallback graphics
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (require('fs').existsSync(frontendDist)) {
  app.use('/assets', express.static(path.join(frontendDist, 'assets')));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/admin/gallery',  require('./routes/gallery'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/camps',         require('./routes/gallery'));
app.use('/api/camps',         require('./routes/camps'));
app.use('/api/camps',         require('./routes/team'));
app.use('/api/camps',         require('./routes/sponsors'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/cms',           require('./routes/cms'));
app.use('/api',               require('./routes/contact'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/api/public',        require('./routes/public'));

// ─── Serve built React app ───
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^\/(?!api|media).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ─── 404 catch-all ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, message: 'Not found' });
});

// ─── Error handler ───────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ ok: false, message: err.message || 'Internal server error' });
});

console.log("CWD:", process.cwd(), "| DB_HOST:", process.env.DB_HOST, "| DB_PORT:", process.env.DB_PORT);

// ─── Start ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`[server] BDC API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[startup] Failed to connect to database:', err.message);
    // Network AggregateErrors can have an empty message; retain their individual codes.
    // Log only diagnostic fields, never the connection configuration or password.
    for (const cause of [err, ...(Array.isArray(err.errors) ? err.errors : [])]) {
      console.error('[startup] Database error details:', JSON.stringify({
        name: cause.name,
        code: cause.code,
        errno: cause.errno,
        syscall: cause.syscall,
        address: cause.address,
        port: cause.port
      }));
    }
    console.error('→ Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in App Env (or backend/.env locally)');
    process.exit(1);
  }
})();
