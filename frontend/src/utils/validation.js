/**
 * SKIT Blood Donation Campaign (BDC) — Local UI Validation Utilities
 * Relaxed client-side validation for prototype demonstration.
 */

export function isValidFullName(name) {
  if (typeof name !== 'string') return false;
  return name.trim().length >= 2;
}

export function validateAndNormalizeMobile(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.length >= 10) {
    return cleaned.startsWith('+91') ? cleaned : `+91${cleaned.slice(-10)}`;
  }
  return null;
}

export function isValidMobileNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()+]/g, '');
  return cleaned.length >= 10;
}

export function isValidCalendarDOB(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  // Basic date format check YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
}

export function isValidAadhaarFormat(val) {
  if (!val || typeof val !== 'string') return false;
  const cleaned = val.replace(/\s/g, '');
  return /^\d{12}$/.test(cleaned);
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
