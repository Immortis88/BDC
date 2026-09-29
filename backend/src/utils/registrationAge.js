'use strict';
// Registration age is measured on today's date in the camp's time zone.
function latestAdultBirthDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const value = type => Number(parts.find(part => part.type === type).value);
  const year = value('year') - 18;
  const month = value('month');
  const day = Math.min(value('day'), new Date(Date.UTC(year, month, 0)).getUTCDate());
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function birthDateError(value, now = new Date()) {
  if (!value) return 'Date of birth is required.';
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'Please enter a valid date of birth.';
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || value.startsWith('0000')) {
    return 'Please enter a valid date of birth.';
  }
  return value > latestAdultBirthDate(now) ? 'You must be at least 18 years old to register.' : '';
}

module.exports = { latestAdultBirthDate, birthDateError };
