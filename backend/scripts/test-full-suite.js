"use strict";
// Creates its own empty database. Never points the tested API at the user's database.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const crypto = require('crypto');
const assert = require('node:assert/strict');
const express = require('express');

(async () => {
  const database = 'bdc_test_' + crypto.randomBytes(8).toString('hex');
  const control = await mysql.createConnection({host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306, user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true});
  let pool, server;
  let checks = 0;
  const check = (condition, message) => { assert.ok(condition, message); checks++; console.log('PASS ' + message); };
  try {
    await control.query('CREATE DATABASE `' + database + '`');
    await control.query('USE `' + database + '`');
    await control.query(fs.readFileSync(path.join(__dirname, '../../database/bdc-schema.sql'), 'utf8'));
    process.env.DB_NAME = database;
    ({pool} = require('../src/db'));
    await pool.query("INSERT INTO admins (full_name,email,password_hash,role) VALUES ('Test Super','super@example.invalid','unused','SUPER_ADMIN'),('Test Allowed','allowed@example.invalid','unused','REGULAR_ADMIN'),('Test Denied','denied@example.invalid','unused','REGULAR_ADMIN')");
    await pool.query('UPDATE admins SET must_change_password=FALSE');
    await pool.query("INSERT INTO admin_permissions (admin_id,permission_key,granted_by) VALUES (2,'camp.registrations',1)");
    for (const year of [2097,2098]) {
      await pool.query("INSERT INTO camps (camp_year,internal_name,public_title,camp_date,starts_at,ends_at,venue,registration_open,media_folder,created_by,updated_by) VALUES (?, 'Test','Test',?,'09:00','16:00','Test',1,?,1,1)",[year,year+'-01-01','Test '+year]);
    }
    await pool.query('INSERT INTO registration_counters (camp_id,next_sequence) VALUES (1,1),(2,1)');
    await pool.query('UPDATE site_state SET live_camp_id=1 WHERE id=1');
    const tokens = [];
    for (const id of [1,2,3]) {
      const raw = crypto.randomBytes(48);
      tokens.push(raw.toString('hex'));
      await pool.query('INSERT INTO admin_sessions (admin_id,token_hash,session_version,expires_at) VALUES (?,?,1,DATE_ADD(NOW(),INTERVAL 1 HOUR))',[id,crypto.createHash('sha256').update(raw).digest()]);
    }
    const app = express(); app.use(express.json()); app.use('/api/registrations',require('../src/routes/registrations'));
    app.use((err,req,res,next)=>res.status(500).json({message:err.message}));
    server = await new Promise(resolve => {const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const base = 'http://127.0.0.1:'+server.address().port+'/api/registrations';
    const request = (suffix='',token=tokens[0],method='GET',body) => fetch(base+suffix,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const register = (n,camp=1) => request('',null,'POST',{camp_id:camp,full_name:'Test Donor '+n,guardian_name:'Test Guardian',date_of_birth:'2000-01-01',blood_group:'O+',email:'donor'+n+'@example.invalid',mobile:'9876543210',role:'OUTSIDE_SKIT',consent_given:true});
    const submissions = await Promise.all(Array.from({length:30},(_,i)=>register(i)));
    check(submissions.every(r=>r.status===201),'30 concurrent registrations succeed');
    const bodies=await Promise.all(submissions.map(r=>r.json()));
    check(new Set(bodies.map(j=>j.data.registration_code)).size===30,'Concurrent codes are unique');
    check(bodies.every(j=>j.data.registration_code.startsWith('skitbdc2097_')),'First camp code prefix');
    await pool.query('UPDATE site_state SET live_camp_id=2 WHERE id=1');
    const second=await (await register(99,2)).json();
    check(second.data.registration_code==='skitbdc2098_0001','Second camp has independent sequence');
    await pool.query('UPDATE site_state SET live_camp_id=1 WHERE id=1');
    const [[row]]=await pool.query('SELECT id,registration_code FROM registrations WHERE camp_id=1 ORDER BY id LIMIT 1');
    for(const [suffix,method,body] of [['','GET'],['/export','GET'],['/'+row.id,'GET'],['/'+row.id+'/status','PATCH',{status:'DONATED'}]]) {
      check((await request(suffix,tokens[2],method,body)).status===403,'No-permission request denied: '+method+' '+suffix);
    }
    check((await request('/'+row.id+'/status',tokens[1],'PATCH',{status:'DONATED'})).status===200,'Authorized outcome update');
    const [[updated]]=await pool.query('SELECT outcome,registration_code FROM registrations WHERE id=?',[row.id]);
    check(updated.outcome==='DONATED' && updated.registration_code===row.registration_code,'Outcome persists without changing code');
    check((await request('/'+row.id+'/status',tokens[1],'PATCH',{status:'NOT_DONATED'})).status===403,'Regular admin cannot reverse Donated status');
    check((await request('/'+row.id+'/status',tokens[0],'PATCH',{status:'NOT_DONATED'})).status===200,'Super Admin can reverse Donated status');
    const [[reversed]]=await pool.query('SELECT outcome FROM registrations WHERE id=?',[row.id]);
    check(reversed.outcome==='NOT_DONATED','Reversed status persists');
    check((await request('/'+row.id+'/blood-group',tokens[1],'PATCH',{blood_group:'A+'})).status===403,'Regular admin cannot edit blood group');
    check((await request('/'+row.id+'/blood-group',tokens[0],'PATCH',{blood_group:'A+'})).status===200,'Super Admin can edit blood group');
    const [[updatedBlood]]=await pool.query('SELECT blood_group FROM registrations WHERE id=?',[row.id]);
    check(updatedBlood.blood_group==='A+','Blood group edit persists');
    check((await request('/'+row.id+'/blood-group',tokens[0],'PATCH',{blood_group:'invalid'})).status===400,'Invalid blood group edit rejected');
    const [[other]]=await pool.query('SELECT id FROM registrations WHERE camp_id=2');
    check((await request('/'+other.id+'/status',tokens[1],'PATCH',{status:'DONATED'})).status===403,'Cross-camp outcome denied');
    for(const cols of ['', 'full_name,bogus','constructor']) check((await request('/export?camp_id=1&columns='+cols)).status===400,'Invalid export columns rejected: '+cols);
    const list=await (await request('?camp_id=1&name=Test&reg_id='+row.registration_code+'&limit=1')).json();
    check(list.pagination.total===1 && list.data[0].id===row.id,'Combined filters applied before pagination');
    const ExcelJS = require('exceljs');
    const readExport = async suffix => {
      const response = await request(suffix);
      check(response.status===200 && response.headers.get('content-type').includes('spreadsheetml.sheet'),'Excel download content type');
      const book = new ExcelJS.Workbook();
      await book.xlsx.load(Buffer.from(await response.arrayBuffer()));
      return book.worksheets[0];
    };
    const filtered=await readExport('/export?camp_id=1&name=Test&reg_id='+row.registration_code+'&columns=registration_code,registration_code');
    check(filtered.rowCount===2 && filtered.columnCount===1 && filtered.getCell('A1').value==='Registration Code','Filtered export contains only header and data');
    const all=await readExport('/export?camp_id=1&columns=registration_code');
    check(all.rowCount===31,'Export includes records beyond one page without extra rows');
    await pool.query('UPDATE registrations SET full_name=? WHERE id=?',['=CMD()',row.id]);
    const safe=await readExport('/export?camp_id=1&columns=full_name');
    check(safe.getCell('A2').value==='=CMD()' && safe.getCell('A2').type===ExcelJS.ValueType.String,'Formula-like donor names remain literal text');
    check((await request('/export?camp_id=1',tokens[1])).status===403,'Regular admin with registration permission cannot export');
    await pool.query("INSERT INTO admin_permissions (admin_id,permission_key,granted_by) VALUES (2,'camp.registrations.export',1)");
    check((await request('/export?camp_id=1',tokens[1])).status===403,'Legacy export permission cannot bypass Super Admin restriction');
    const { latestAdultBirthDate } = require('../src/utils/registrationAge');
    const cutoff = latestAdultBirthDate();
    const tomorrow = new Date(cutoff + 'T00:00:00Z');
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const candidate = {camp_id:1,full_name:'Age Test',guardian_name:'Test Guardian',date_of_birth:cutoff,blood_group:'O+',email:'age@example.invalid',mobile:'9876543210',role:'OUTSIDE_SKIT',consent_given:true};
    for (const dob of [tomorrow.toISOString().slice(0,10), '2020-01-01', '2000-02-30']) {
      check((await request('',null,'POST',{...candidate,date_of_birth:dob})).status===400,'API rejects underage or invalid DOB: '+dob);
    }
    check((await request('',null,'POST',candidate)).status===201,'API accepts exact 18th birthday');
    const staff = {...candidate,full_name:'Staff Test',email:'staff@example.invalid',role:'STAFF_MEMBER',institutional_id:'EMP-TEST',branch:'Computer Science'};
    check((await request('',null,'POST',{...staff,branch:''})).status===400,'Staff branch is required');
    check((await request('',null,'POST',staff)).status===201,'Staff registration with branch succeeds');
    const [[savedStaff]]=await pool.query("SELECT branch,employee_id,college_id FROM registrations WHERE email='staff@example.invalid'");
    check(savedStaff.branch==='Computer Science' && savedStaff.employee_id==='EMP-TEST' && savedStaff.college_id===null,'Staff branch persists with employee ID');
    const staffSheet=await readExport('/export?camp_id=1&columns=branch,employee_id');
    check(staffSheet.getRow(staffSheet.rowCount).getCell(1).value==='Computer Science' && staffSheet.getRow(staffSheet.rowCount).getCell(2).value==='EMP-TEST','Export includes staff branch');
    for (const blood of [undefined, '', 'invalid']) {
      check((await request('',null,'POST',{...candidate,blood_group:blood})).status===400,'Missing or invalid blood group rejected: '+String(blood));
    }
    for (const blood of ['A+','A-','B+','B-','AB+','AB-','O+','O-','UNKNOWN']) {
      const response = await request('',null,'POST',{...candidate,email:'blood'+encodeURIComponent(blood)+'@example.invalid',blood_group:blood});
      check(response.status===201,'Blood group accepted: '+blood);
    }
    const privateDonor = { ...candidate, email: 'private@example.invalid', submission_key: crypto.randomUUID() };
    const duplicates = await Promise.all(Array.from({ length: 4 }, () => request('', null, 'POST', privateDonor)));
    check(duplicates.filter(r => r.status === 201).length === 1 && duplicates.filter(r => r.status === 200).length === 3, 'Simultaneous retries create one registration and recover the same receipt');
    const duplicateBodies = await Promise.all(duplicates.map(r => r.json()));
    check(new Set(duplicateBodies.map(r => r.data.registration_code)).size === 1, 'Concurrent retries share one registration code');
    const [[savedPrivate]] = await pool.query('SELECT COUNT(*) AS total FROM registrations WHERE email = ?', [privateDonor.email]);
    check(savedPrivate.total === 1, 'Concurrent duplicate requests persist exactly one donor');
    const deniedReceipt = await request('', null, 'POST', { ...privateDonor, submission_key: crypto.randomUUID() });
    const deniedBody = await deniedReceipt.json();
    check(deniedReceipt.status === 409 && !deniedBody.data && !deniedBody.alreadyRegistered, 'Different submission key cannot disclose receipt details');
    await pool.query('UPDATE registration_attempts SET expires_at = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE attempt_key_hash = ?', [crypto.createHash('sha256').update(privateDonor.submission_key).digest()]);
    check((await request('', null, 'POST', privateDonor)).status === 409, 'Expired submission key cannot recover receipt');
    console.log(checks+' checks passed in isolated database');
  } finally {
    if(server) { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
    if(pool) await pool.end();
    if(!/^bdc_test_[a-f0-9]{16}$/.test(database)) throw Error('Unsafe cleanup target');
    await control.query('DROP DATABASE IF EXISTS `'+database+'`');
    await control.end();
  }
})().catch(err=>{console.error(err.message);process.exitCode=1;});
