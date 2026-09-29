-- Existing staff registrations may keep a NULL branch. The API requires a
-- branch for new registrations; this change preserves historical records.
ALTER TABLE registrations
  DROP CHECK ck_registration_category_fields,
  ADD CONSTRAINT ck_registration_category_fields CHECK (
    (participant_type = 'STUDENT' AND college_id IS NOT NULL AND CHAR_LENGTH(TRIM(college_id)) > 0
      AND branch IS NOT NULL AND CHAR_LENGTH(TRIM(branch)) > 0 AND employee_id IS NULL)
    OR (participant_type = 'STAFF_MEMBER' AND employee_id IS NOT NULL AND CHAR_LENGTH(TRIM(employee_id)) > 0
      AND college_id IS NULL)
    OR (participant_type = 'OUTSIDE_SKIT' AND college_id IS NULL AND employee_id IS NULL AND branch IS NULL)
  );
