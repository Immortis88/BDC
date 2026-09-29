'use strict';
const ExcelJS = require('exceljs');

async function createRegistrationWorkbook(rows, keys, definitions, _camp, _filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SKIT Blood Donation Campaign';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Registrations', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  const widths = { full_name: 28, guardian_name: 28, email: 38, address: 48, branch: 30, not_donated_reason: 38, created_at: 25, donated_at: 25 };
  sheet.columns = keys.map(key => ({ key, width: widths[key] || 23 }));
  const last = keys.length;
  const header = sheet.getRow(1);
  header.values = keys.map(key => definitions[key].header);
  header.height = 30;
  header.eachCell(cell => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF981B24' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
  });
  rows.forEach((record, index) => {
    const row = sheet.addRow(keys.map(key => {
      const value = record[key];
      if (value === null || value === undefined) return '';
      if (key === 'outcome') return value === 'DONATED' ? 'Donated' : 'Not Donated';
      if (key === 'participant_type') return { STUDENT: 'Student', STAFF_MEMBER: 'Staff Member', OUTSIDE_SKIT: 'Outside SKIT' }[value] || String(value);
      if (key === 'date_of_birth') {
        const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
        if (Number.isFinite(date.getTime())) return date;
      }
      // All other values remain literal text, preserving IDs, phone numbers,
      // leading zeroes, and strings beginning with spreadsheet formula symbols.
      return String(value);
    }));
    let lines = 1;
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      const key = keys[column - 1];
      cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 ? 'FFF1F5F9' : 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: ['blood_group', 'outcome', 'date_of_birth'].includes(key) ? 'center' : 'left', wrapText: true, indent: 1 };
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };
      cell.numFmt = key === 'date_of_birth' && cell.value instanceof Date ? 'dd mmm yyyy' : '@';
      const text = String(cell.value ?? '');
      lines = Math.max(lines, text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / ((widths[key] || 23) - 3))), 0));
      if (key === 'outcome') {
        const donated = record.outcome === 'DONATED';
        cell.font = { ...cell.font, bold: true, color: { argb: donated ? 'FF166534' : 'FF92400E' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: donated ? 'FFDCFCE7' : 'FFFEF3C7' } };
      }
    });
    row.height = Math.min(409, Math.max(28, lines * 16 + 10));
  });
  sheet.pageSetup.printArea = `A1:${sheet.getColumn(last).letter}${Math.max(1, sheet.rowCount)}`;
  sheet.headerFooter.oddFooter = '&LSKIT Blood Donation Campaign&RPage &P of &N';
  return workbook.xlsx.writeBuffer();
}

module.exports = { createRegistrationWorkbook };
