'use strict';
const crypto = require('crypto');

function passwordError(value) {
  if (typeof value !== 'string' || value.length < 12 || Buffer.byteLength(value, 'utf8') > 72) {
    return 'Password must contain at least 12 characters and at most 72 UTF-8 bytes.';
  }
  return null;
}

function generatePassword() {
  return crypto.randomBytes(24).toString('base64url');
}

function textError(body, fields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'A JSON object is required.';
  for (const [field, min, max] of fields) {
    const value = body[field];
    if (min === 0 && (value === undefined || value === null)) continue;
    if (typeof value !== 'string' || value.trim().length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
      return `${field} must be text between ${min} and ${max} characters.`;
    }
  }
  return null;
}

function registrationError(body) {
  const error = textError(body, [
    ['full_name', 2, 160], ['guardian_name', 2, 160], ['email', 3, 254],
    ['mobile', 10, 20], ['date_of_birth', 10, 10], ['blood_group', 1, 7],
    ['branch', 0, 100], ['institutional_id', 0, 80], ['college_id', 0, 80],
    ['employee_id', 0, 80], ['address', 0, 2000], ['submission_key', 0, 128]
  ]);
  if (error) return error;
  if (body.consent_given !== true) return 'Voluntary consent must be given to register.';
  if (body.submission_key !== undefined && body.submission_key !== null && !/^[A-Za-z0-9_-]{32,128}$/.test(body.submission_key)) return 'Invalid submission key. Please refresh the registration page.';
  if (body.camp_id !== undefined && body.camp_id !== null && typeof body.camp_id !== 'string' && typeof body.camp_id !== 'number') return 'Invalid camp ID.';
  if (!/^\d{10}$/.test(body.mobile.replace(/[\s()-]/g, ''))) return 'Please enter a valid 10-digit mobile number.';
  if (body.role !== undefined && !['STUDENT', 'STAFF', 'STAFF_MEMBER', 'OUTSIDE_SKIT'].includes(body.role)) return 'Invalid participant role.';
  if (body.participant_type !== undefined && !['STUDENT', 'STAFF_MEMBER', 'OUTSIDE_SKIT'].includes(body.participant_type)) return 'Invalid participant type.';
  if (!body.role && !body.participant_type) return 'Participant type is required.';
  return null;
}

// Unexpected failures never expose SQL, paths, or submitted personal information.
function errorHandler(err, _req, res, _next) {
  let status = 500;
  let message = 'Unable to complete the request. Please try again later.';
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON request.'; }
  else if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') { status = 413; message = 'The submitted data is too large.'; }
  else if (err.code === 'ER_DUP_ENTRY') { status = 409; message = 'Unable to complete this request. Please check your details or contact the coordinator.'; }
  else if (err.name === 'MulterError') { status = 400; message = 'Invalid file upload.'; }
  // Do not log err.message or the full error: database errors may include donor data.
  console.error('[request error]', JSON.stringify({ code: err.code, type: err.type, name: err.name }));
  return res.status(status).json({ ok: false, message });
}

module.exports = { passwordError, generatePassword, textError, registrationError, errorHandler };
