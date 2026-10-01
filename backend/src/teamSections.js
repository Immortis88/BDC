'use strict';

const DEFAULT_SECTIONS = [
  { key: 'CHIEF_COORDINATOR', label: 'Chief Coordinator', desc: 'Lead. Organise. Inspire. Driving the vision of BDC with dedication and compassion.' },
  { key: 'MEMBERS', label: 'Members', desc: 'The core team working behind the scenes to make every camp a success.' },
  { key: 'STUDENT_COORDINATORS', label: 'Student Coordinators', desc: 'Student leaders who help in organising, coordinating and managing the ground activities.' }
];

async function getTeamSections(pool, campId) {
  const [rows] = await pool.query('SELECT group_key, heading, description FROM team_sections WHERE camp_id = ?', [campId]);
  return DEFAULT_SECTIONS.map(section => {
    const saved = rows.find(row => row.group_key === section.key);
    return saved ? { key: section.key, label: saved.heading, desc: saved.description } : { ...section };
  });
}

function validateSection(key, body) {
  if (!DEFAULT_SECTIONS.some(section => section.key === key)) return 'Invalid team section.';
  if (typeof body.heading !== 'string' || !body.heading.trim() || body.heading.trim().length > 150) {
    return 'Section heading must contain 1–150 characters.';
  }
  if (typeof body.description !== 'string' || body.description.trim().length > 1000) {
    return 'Section description must contain at most 1000 characters.';
  }
  return null;
}

module.exports = { DEFAULT_SECTIONS, getTeamSections, validateSection };
