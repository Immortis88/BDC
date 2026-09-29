'use strict';

const roster = require('./config/website-team.json');

/**
 * Builds the permanent Website Team public DTO purely from the source configuration roster.
 * Entirely code-controlled; no SQL queries or database preferences are read or written.
 *
 * If showPhonePublicly is true and the phone number is non-empty, phone is included.
 * Otherwise, the phone field is omitted entirely from the response.
 *
 * @returns {Array<{ key: string, name: string, role: string, photoUrl: string, phone?: string }>}
 */
function getWebsiteTeam() {
  return roster.map(person => ({
    key: person.key,
    name: person.name,
    role: person.role || '',
    photoUrl: `/media/${person.photoPath}`,
    ...(person.showPhonePublicly && person.phone ? { phone: person.phone } : {})
  }));
}

module.exports = {
  getWebsiteTeam,
  roster
};
