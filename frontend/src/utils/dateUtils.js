/**
 * SKIT Blood Donation Campaign (BDC) — Date & Time Utilities
 * Provides consistent formatting and prevents timezone shifting.
 */

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format a camp date string as "03 Oct 2026" without any timezone shift.
 * Works with YYYY-MM-DD, ISO timestamps, or null/undefined.
 */
export function formatCampDate(dateStr) {
  if (!dateStr) return '—';
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(dateStr);
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const dd = String(day).padStart(2, '0');
  const mmm = MONTH_NAMES_SHORT[month] || '';
  return `${dd} ${mmm} ${year}`;
}

/**
 * Format a time string (HH:MM:SS or HH:MM) to 12-hour AM/PM format (e.g. "9:00 AM").
 */
export function formatTime12(timeStr) {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  // Already in 12h format?
  if (/am|pm/i.test(str)) return str;

  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return str;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Format operating hours range with optional timezone suffix (e.g. "9:00 AM – 4:00 PM IST").
 */
export function formatOperatingHours(startsAt, endsAt, tz = 'IST') {
  if (!startsAt && !endsAt) return '—';
  if (!startsAt) return `${formatTime12(endsAt)}${tz ? ` ${tz}` : ''}`;
  if (!endsAt) return `${formatTime12(startsAt)}${tz ? ` ${tz}` : ''}`;
  const start = formatTime12(startsAt);
  const end = formatTime12(endsAt);
  return `${start} – ${end}${tz ? ` ${tz}` : ''}`;
}

/**
 * Extract YYYY-MM-DD string for HTML5 <input type="date">.
 */
export function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

/**
 * Extract HH:MM (24-hour) string for HTML5 <input type="time">.
 */
export function toTimeInputValue(timeStr) {
  if (!timeStr) return '';
  const str = String(timeStr).trim();

  // If 12-hour AM/PM: e.g. "9:00 AM", "4:00 PM"
  const match12 = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2] ? match12[2] : '00';
    const isPm = match12[3].toLowerCase() === 'pm';
    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // If 24-hour: e.g. "09:00:00" or "09:00"
  const match24 = str.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    return `${match24[1].padStart(2, '0')}:${match24[2]}`;
  }
  return '';
}
