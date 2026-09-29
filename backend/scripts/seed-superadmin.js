'use strict';
const bcrypt = require('bcrypt');

const password = 'Skit@12345';

bcrypt.hash(password, 12).then(hash => {
  console.log('\n✅ Super Admin SQL — paste this into MySQL Workbench / phpMyAdmin:\n');
  console.log(`INSERT INTO admins (full_name, email, password_hash, role, must_change_password)`);
  console.log(`VALUES (`);
  console.log(`  'Super Admin',`);
  console.log(`  'nss@skit.ac.in',`);
  console.log(`  '${hash}',`);
  console.log(`  'SUPER_ADMIN',`);
  console.log(`  FALSE`);
  console.log(`);\n`);
  console.log(`Login with:`);
  console.log(`  Email:    admin@skit.ac.in`);
  console.log(`  Password: ${password}\n`);
});
