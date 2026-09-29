'use strict';
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function id(value, label = 'ID') {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) fail(`Invalid ${label}.`);
  return n;
}
function text(value, label, max, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string') fail(`${label} must be text.`);
  const s = value.trim();
  if ((required && !s) || s.length > max) fail(`${label} must contain ${required ? '1' : '0'}–${max} characters.`);
  return s || null;
}
function boolean(value, label) { if (typeof value !== 'boolean') fail(`${label} must be true or false.`); return value ? 1 : 0; }
function order(value) { const n = Number(value); if (!Number.isSafeInteger(n) || n < 0 || n > 2147483647) fail('Invalid sort order.'); return n; }
function pagination(query, max = 100) {
  const page = query.page == null ? 1 : id(query.page, 'page');
  const limit = query.limit == null ? Math.min(50, max) : Math.min(max, id(query.limit, 'limit'));
  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) fail('Page is too large.');
  return { page, limit, offset };
}
function ids(values) {
  if (!Array.isArray(values)) fail('An ordered ID array is required.');
  const result = values.map(v => id(v));
  if (new Set(result).size !== result.length) fail('Duplicate IDs are not allowed.');
  return result;
}
module.exports = { fail, id, text, boolean, order, pagination, ids };
