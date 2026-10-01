'use strict';
const crypto = require('crypto');

// Bounded, per-process fixed windows. Configure a shared gateway limit for replicas.
function rateLimit({ max, windowMs = 15 * 60 * 1000, key, capacity = 20000, now = Date.now }) {
  const buckets = new Map();
  const salt = crypto.randomBytes(32);
  let nextCleanup = 0;
  return (req, res, next) => {
    const time = now();
    if (time >= nextCleanup) {
      for (const [id, bucket] of buckets) if (bucket.until <= time) buckets.delete(id);
      nextCleanup = time + Math.min(windowMs, 60000);
    }
    const raw = key(req);
    if (raw === null || raw === undefined) return next();
    const id = crypto.createHmac('sha256', salt).update(String(raw)).digest('hex');
    let bucket = buckets.get(id);
    if (bucket && bucket.until <= time) { buckets.delete(id); bucket = null; }
    if (!bucket && buckets.size < capacity) {
      bucket = { count: 0, until: time + windowMs };
      buckets.set(id, bucket);
    }
    if (!bucket || bucket.count >= max) {
      res.setHeader('Retry-After', Math.max(1, Math.ceil(((bucket?.until || nextCleanup) - time) / 1000)));
      return res.status(429).json({ ok: false, message: 'Too many attempts. Please wait and try again later.' });
    }
    bucket.count++;
    next();
  };
}
const ipKey = req => req.ip || req.socket?.remoteAddress || 'unknown';
const emailKey = req => typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : null;
module.exports = { rateLimit, ipKey, emailKey };
