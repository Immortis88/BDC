'use strict';
const assert = require('node:assert/strict');
const backend = require('../src/utils/registrationAge');

(async () => {
  const frontend = await import('../../frontend/src/utils/registrationAge.js');
  for (const api of [backend, frontend]) {
    const now = new Date('2026-09-28T06:00:00Z');
    assert.equal(api.latestAdultBirthDate(now), '2008-09-28');
    assert.equal(api.birthDateError('2008-09-28', now), '');
    assert.equal(api.birthDateError('2008-09-27', now), '');
    for (const dob of ['2008-09-29', '2020-01-01', '2027-01-01', '2008-02-30', '2007-02-29', '0000-01-01', 'invalid', '', null]) {
      assert.ok(api.birthDateError(dob, now), `Reject ${dob}`);
    }
    assert.equal(api.latestAdultBirthDate(new Date('2024-02-29T06:00:00Z')), '2006-02-28');
    assert.ok(api.birthDateError('2008-02-29', new Date('2026-02-28T06:00:00Z')));
    assert.equal(api.birthDateError('2008-02-29', new Date('2026-03-01T06:00:00Z')), '');
    assert.equal(api.latestAdultBirthDate(new Date('2026-09-27T18:29:59Z')), '2008-09-27');
    assert.equal(api.latestAdultBirthDate(new Date('2026-09-27T18:30:00Z')), '2008-09-28');
  }
  console.log('Age checks passed for frontend and backend: 18th birthday, minors, invalid dates, leap years, and India midnight.');
})().catch(error => { console.error(error); process.exitCode = 1; });
