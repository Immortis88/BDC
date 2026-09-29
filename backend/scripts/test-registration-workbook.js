'use strict';
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const { createRegistrationWorkbook } = require('../src/utils/registrationWorkbook');

(async () => {
  const definitions = Object.fromEntries(['full_name', 'mobile', 'date_of_birth', 'address', 'outcome'].map(key => [key, { header: key }]));
  const rows = [
    { full_name: '=SUM(1,2)', mobile: '0012345678', date_of_birth: '2000-02-29', address: 'A long address with several lines of text. '.repeat(7), outcome: 'DONATED' },
    { full_name: 'Second donor', outcome: 'NOT_DONATED' }
  ];
  const buffer = await createRegistrationWorkbook(rows, Object.keys(definitions), definitions, { public_title: 'Test Camp', camp_year: 2026 }, { outcome: 'DONATED' });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  assert.equal(sheet.getCell('A2').type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell('B2').value, '0012345678');
  assert.equal(sheet.getCell('C2').numFmt, 'dd mmm yyyy');
  assert.equal(sheet.getCell('C2').value.toISOString().slice(0, 10), '2000-02-29');
  assert.equal(sheet.views[0].ySplit, 1);
  assert.equal(sheet.autoFilter, undefined);
  assert.equal(sheet.getCell('A1').fill.fgColor.argb, 'FF981B24');
  assert.equal(sheet.getCell('E2').fill.fgColor.argb, 'FFDCFCE7');
  assert.equal(sheet.getCell('E3').fill.fgColor.argb, 'FFFEF3C7');
  assert.ok(sheet.getRow(2).height > 28);
  assert.equal(sheet.getCell('A3').value, 'Second donor');
  assert.equal(sheet.pageSetup.orientation, 'landscape');
  const empty = new ExcelJS.Workbook();
  await empty.xlsx.load(await createRegistrationWorkbook([], ['full_name'], definitions, { public_title: 'Empty Camp' }));
  assert.equal(empty.worksheets[0].rowCount, 1);
  console.log('Workbook checks passed: formatting, filters, date cells, long text, leading zeroes, literal text, status colors, and empty exports.');
})().catch(error => { console.error(error); process.exitCode = 1; });
