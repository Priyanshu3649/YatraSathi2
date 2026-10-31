/**
 * Non-destructive, idempotent seeder for admin panel modules.
 * Safe to run repeatedly: existing rows are left untouched.
 *
 * Usage: node src/scripts/seedAdminModules.js
 */
require('dotenv').config();

const {
  sequelizeTVL,
  ApplicationTVL,
  ModuleTVL,
  PermissionTVL,
  RolePermissionTVL,
  UserPermissionTVL,
  StationBoy,
  StationTVL,
  TrainTVL,
  CompanyTVL
} = require('../models');

const SEEDER = 'SEEDER';
const now = new Date();
const APP_ID = 'YS';

const modulesSeed = [
  { mo_moid: 'DB', mo_moshort: 'Dashboard', mo_modesc: 'Dashboard & Analytics', mo_group: 'Operations', mo_grsrl: 1, mo_mhint: '/dashboard' },
  { mo_moid: 'BK', mo_moshort: 'Bookings', mo_modesc: 'Booking Management', mo_group: 'Operations', mo_grsrl: 2, mo_mhint: '/bookings' },
  { mo_moid: 'BL', mo_moshort: 'Billing', mo_modesc: 'Billing & Invoicing', mo_group: 'Operations', mo_grsrl: 3, mo_mhint: '/billing' },
  { mo_moid: 'PY', mo_moshort: 'Payments', mo_modesc: 'Payments & Receipts', mo_group: 'Operations', mo_grsrl: 4, mo_mhint: '/payments' },
  { mo_moid: 'AC', mo_moshort: 'Accounting', mo_modesc: 'Accounting & Ledgers', mo_group: 'Operations', mo_grsrl: 5, mo_mhint: '/accounting' },
  { mo_moid: 'CU', mo_moshort: 'Customers', mo_modesc: 'Customer Management', mo_group: 'Parties', mo_grsrl: 6, mo_mhint: '/customers' },
  { mo_moid: 'RP', mo_moshort: 'Reports', mo_modesc: 'Reports & Exports', mo_group: 'Reports', mo_grsrl: 7, mo_mhint: '/reports' },
  { mo_moid: 'SC', mo_moshort: 'Security', mo_modesc: 'Users, Roles & Permissions', mo_group: 'Administration', mo_grsrl: 8, mo_mhint: '/security' },
  { mo_moid: 'MD', mo_moshort: 'Master Data', mo_modesc: 'Company, Stations & Trains', mo_group: 'Administration', mo_grsrl: 9, mo_mhint: '/master-data' }
];

const operationsSeed = [
  ['DB', 'VW', 'View Dashboard', 'View dashboard and analytics'],
  ['BK', 'VW', 'View Bookings', 'View booking records'],
  ['BK', 'CR', 'Create Booking', 'Create a new booking'],
  ['BK', 'ED', 'Edit Booking', 'Modify an existing booking'],
  ['BK', 'DL', 'Delete Booking', 'Cancel or delete a booking'],
  ['BK', 'PR', 'Print Ticket', 'Print booking ticket'],
  ['BL', 'VW', 'View Bills', 'View billing records'],
  ['BL', 'CR', 'Create Bill', 'Create a new bill'],
  ['BL', 'ED', 'Edit Bill', 'Modify an existing bill'],
  ['BL', 'DL', 'Delete Bill', 'Delete a bill'],
  ['BL', 'PR', 'Print Bill', 'Print a bill or invoice'],
  ['PY', 'VW', 'View Payments', 'View payment records'],
  ['PY', 'CR', 'Record Payment', 'Record a payment or receipt'],
  ['PY', 'ED', 'Edit Payment', 'Modify a payment'],
  ['PY', 'DL', 'Delete Payment', 'Delete a payment'],
  ['PY', 'AP', 'Approve Payment', 'Approve a payment'],
  ['AC', 'VW', 'View Accounts', 'View accounts and ledgers'],
  ['AC', 'CR', 'Create Entry', 'Create an accounting entry'],
  ['AC', 'ED', 'Edit Entry', 'Modify an accounting entry'],
  ['AC', 'DL', 'Delete Entry', 'Delete an accounting entry'],
  ['RP', 'VW', 'View Reports', 'View reports'],
  ['RP', 'PR', 'Print Reports', 'Print or export reports'],
  ['SC', 'VW', 'View Security', 'View users, roles and permissions'],
  ['SC', 'CR', 'Create Security', 'Create users, roles or permissions'],
  ['SC', 'ED', 'Edit Security', 'Modify users, roles or permissions'],
  ['SC', 'DL', 'Delete Security', 'Delete users, roles or permissions'],
  ['MD', 'VW', 'View Master Data', 'View company, stations and trains'],
  ['MD', 'CR', 'Create Master Data', 'Create master data records'],
  ['MD', 'ED', 'Edit Master Data', 'Modify master data records'],
  ['MD', 'DL', 'Delete Master Data', 'Delete master data records'],
  ['CU', 'VW', 'View Customers', 'View customer records'],
  ['CU', 'CR', 'Create Customer', 'Create a customer'],
  ['CU', 'ED', 'Edit Customer', 'Modify a customer'],
  ['CU', 'DL', 'Delete Customer', 'Delete a customer']
];

const stationsSeed = [
  ['DEOS', 'Deoria Sadar', 'Deoria', 'Uttar Pradesh'],
  ['PNBE', 'Patna Junction', 'Patna', 'Bihar'],
  ['BJU', 'Barauni Junction', 'Barauni', 'Bihar'],
  ['HWH', 'Howrah Junction', 'Kolkata', 'West Bengal'],
  ['BCT', 'Mumbai Central', 'Mumbai', 'Maharashtra'],
  ['ADI', 'Ahmedabad Junction', 'Ahmedabad', 'Gujarat'],
  ['JP', 'Jaipur Junction', 'Jaipur', 'Rajasthan'],
  ['LKO', 'Lucknow Charbagh', 'Lucknow', 'Uttar Pradesh'],
  ['CNB', 'Kanpur Central', 'Kanpur', 'Uttar Pradesh'],
  ['BPL', 'Bhopal Junction', 'Bhopal', 'Madhya Pradesh'],
  ['NGP', 'Nagpur Junction', 'Nagpur', 'Maharashtra'],
  ['SC', 'Secunderabad Junction', 'Hyderabad', 'Telangana'],
  ['BZA', 'Vijayawada Junction', 'Vijayawada', 'Andhra Pradesh'],
  ['ERS', 'Ernakulam Junction', 'Kochi', 'Kerala'],
  ['SBC', 'KSR Bengaluru City', 'Bengaluru', 'Karnataka'],
  ['BSB', 'Varanasi Junction', 'Varanasi', 'Uttar Pradesh'],
  ['DBRG', 'Dibrugarh', 'Dibrugarh', 'Assam'],
  ['SHM', 'Kolkata Shalimar', 'Kolkata', 'West Bengal']
];

const trainsSeed = [
  {
    tr_trid: 'TR001', tr_trno: '12951', tr_trname: 'Mumbai Rajdhani Express', tr_fromst: 'BCT', tr_tost: 'NDLS',
    tr_days: '1111111', tr_ac1: 24, tr_ac2: 96, tr_ac3: 156, tr_sl: 288, tr_gen: 0,
    tr_ac1fare: 8250, tr_ac2fare: 4715, tr_ac3fare: 3285, tr_slfare: 1790, tr_genfare: 0
  },
  {
    tr_trid: 'TR002', tr_trno: '12301', tr_trname: 'Howrah Rajdhani Express', tr_fromst: 'HWH', tr_tost: 'NDLS',
    tr_days: '1111111', tr_ac1: 24, tr_ac2: 96, tr_ac3: 156, tr_sl: 288, tr_gen: 0,
    tr_ac1fare: 8500, tr_ac2fare: 4850, tr_ac3fare: 3390, tr_slfare: 1840, tr_genfare: 0
  },
  {
    tr_trid: 'TR003', tr_trno: '12627', tr_trname: 'Karnataka Express', tr_fromst: 'SBC', tr_tost: 'NDLS',
    tr_days: '1111111', tr_ac1: 12, tr_ac2: 48, tr_ac3: 128, tr_sl: 384, tr_gen: 0,
    tr_ac1fare: 7950, tr_ac2fare: 4520, tr_ac3fare: 3150, tr_slfare: 1710, tr_genfare: 0
  },
  {
    tr_trid: 'TR004', tr_trno: '12295', tr_trname: 'Sanghamitra Express', tr_fromst: 'PNBE', tr_tost: 'SBC',
    tr_days: '1111111', tr_ac1: 6, tr_ac2: 24, tr_ac3: 96, tr_sl: 288, tr_gen: 0,
    tr_ac1fare: 6300, tr_ac2fare: 3650, tr_ac3fare: 2540, tr_slfare: 1380, tr_genfare: 0
  },
  {
    tr_trid: 'TR005', tr_trno: '12559', tr_trname: 'Shiv Ganga Express', tr_fromst: 'BSB', tr_tost: 'NDLS',
    tr_days: '1111111', tr_ac1: 12, tr_ac2: 48, tr_ac3: 128, tr_sl: 320, tr_gen: 0,
    tr_ac1fare: 4100, tr_ac2fare: 2450, tr_ac3fare: 1720, tr_slfare: 940, tr_genfare: 0
  },
  {
    tr_trid: 'TR006', tr_trno: '12723', tr_trname: 'Telangana Express', tr_fromst: 'SC', tr_tost: 'NDLS',
    tr_days: '1111111', tr_ac1: 12, tr_ac2: 48, tr_ac3: 128, tr_sl: 384, tr_gen: 0,
    tr_ac1fare: 7200, tr_ac2fare: 4150, tr_ac3fare: 2890, tr_slfare: 1570, tr_genfare: 0
  },
  {
    tr_trid: 'TR007', tr_trno: '12953', tr_trname: 'August Kranti Rajdhani', tr_fromst: 'BCT', tr_tost: 'NDLS',
    tr_days: '1111111', tr_ac1: 24, tr_ac2: 96, tr_ac3: 156, tr_sl: 288, tr_gen: 0,
    tr_ac1fare: 8100, tr_ac2fare: 4650, tr_ac3fare: 3240, tr_slfare: 1760, tr_genfare: 0
  },
  {
    tr_trid: 'TR008', tr_trno: '12002', tr_trname: 'Bhopal Shatabdi Express', tr_fromst: 'NDLS', tr_tost: 'BPL',
    tr_days: '1111111', tr_ac1: 0, tr_ac2: 78, tr_ac3: 0, tr_sl: 0, tr_gen: 480,
    tr_ac1fare: 0, tr_ac2fare: 2350, tr_ac3fare: 0, tr_slfare: 0, tr_genfare: 1140
  },
  {
    tr_trid: 'TR009', tr_trno: '12230', tr_trname: 'Lucknow Mail', tr_fromst: 'LKO', tr_tost: 'NDLS',
    tr_days: '1111111', tr_ac1: 6, tr_ac2: 24, tr_ac3: 96, tr_sl: 288, tr_gen: 0,
    tr_ac1fare: 4200, tr_ac2fare: 2500, tr_ac3fare: 1780, tr_slfare: 980, tr_genfare: 0
  },
  {
    tr_trid: 'TR010', tr_trno: '12309', tr_trname: 'Patna Rajdhani Express', tr_fromst: 'PNBE', tr_tost: 'NDLS',
    tr_days: '1111111', tr_ac1: 24, tr_ac2: 96, tr_ac3: 156, tr_sl: 288, tr_gen: 0,
    tr_ac1fare: 6400, tr_ac2fare: 3750, tr_ac3fare: 2620, tr_slfare: 1430, tr_genfare: 0
  },
  {
    tr_trid: 'TR011', tr_trno: '12424', tr_trname: 'Dibrugarh Rajdhani Express', tr_fromst: 'DBRG', tr_tost: 'NDLS',
    tr_days: '1111111', tr_ac1: 24, tr_ac2: 96, tr_ac3: 156, tr_sl: 288, tr_gen: 0,
    tr_ac1fare: 9200, tr_ac2fare: 5300, tr_ac3fare: 3690, tr_slfare: 2010, tr_genfare: 0
  },
  {
    tr_trid: 'TR012', tr_trno: '12626', tr_trname: 'Kerala Express', tr_fromst: 'ERS', tr_tost: 'NDLS',
    tr_days: '1111111', tr_ac1: 6, tr_ac2: 24, tr_ac3: 96, tr_sl: 320, tr_gen: 0,
    tr_ac1fare: 7800, tr_ac2fare: 4450, tr_ac3fare: 3100, tr_slfare: 1680, tr_genfare: 0
  }
];

const stationBoysSeed = [
  { name: 'Ramesh Kumar', phone: '9810012345', address: 'Platform 1, New Delhi Railway Station, New Delhi', status: 'ACTIVE' },
  { name: 'Suresh Yadav', phone: '9810012346', address: 'Gate 2, New Delhi Railway Station, New Delhi', status: 'ACTIVE' },
  { name: 'Mahesh Singh', phone: '9810012347', address: 'Mumbai Central Station, Mumbai', status: 'ACTIVE' },
  { name: 'Dinesh Patel', phone: '9810012348', address: 'Patna Junction, Patna', status: 'ACTIVE' },
  { name: 'Anil Verma', phone: '9810012349', address: 'Howrah Junction, Kolkata', status: 'INACTIVE' }
];

const rolePermissionMatrix = {
  ADM: '*',
  ACC: [
    'DBVW', 'BKVW', 'BLVW', 'BLCR', 'BLED', 'BLDL', 'BLPR',
    'PYVW', 'PYCR', 'PYED', 'PYDL', 'PYAP',
    'ACVW', 'ACCR', 'ACED', 'ACDL',
    'RPVW', 'RPPR', 'MDVW', 'CUVW'
  ],
  AGT: ['DBVW', 'BKVW', 'BKCR', 'BKED', 'BKPR', 'BLVW', 'BLCR', 'BLPR', 'PYVW', 'CUVW', 'CUCR', 'CUED'],
  EMP: ['DBVW', 'BKVW', 'BKCR', 'BLVW', 'PYVW', 'CUVW', 'CUCR', 'MDVW'],
  CUS: ['DBVW', 'BKVW', 'BLVW', 'PYVW']
};

const userPermissionMatrix = {
  ADM001: ['SCVW', 'SCCR', 'SCED', 'SCDL', 'MDVW', 'MDCR', 'MDED', 'MDDL', 'BKDL', 'BLDL', 'PYAP'],
  ACC001: ['BLVW', 'BLCR', 'PYVW', 'PYCR', 'ACVW', 'ACED', 'RPVW'],
  EMP001: ['BKVW', 'BKCR', 'BKED', 'BLVW', 'CUVW', 'CUCR']
};

function fullOpId(moid, opid) {
  return `${APP_ID}${moid}${opid}`;
}

async function seed() {
  const summary = [];
  const startedAt = Date.now();
  console.log('Starting idempotent admin panel seeding...\n');

  // 1. Application
  const [app, appCreated] = await ApplicationTVL.findOrCreate({
    where: { ap_apid: APP_ID },
    defaults: {
      ap_apshort: 'YatraSathi',
      ap_apdesc: 'YatraSathi Travel ERP',
      ap_rmrks: 'Core application for the YatraSathi admin panel',
      ap_active: 1,
      ap_eby: SEEDER,
      ap_edtm: now
    }
  });
  summary.push(['Application', appCreated ? 'created' : 'exists']);

  // 2. Modules
  let modulesCreated = 0;
  for (const m of modulesSeed) {
    const [, created] = await ModuleTVL.findOrCreate({
      where: { mo_apid: APP_ID, mo_moid: m.mo_moid },
      defaults: {
        ...m,
        mo_apid: APP_ID,
        mo_isform: 0,
        mo_ready: 1,
        mo_active: 1,
        mo_eby: SEEDER,
        mo_edtm: now
      }
    });
    if (created) modulesCreated++;
  }
  summary.push(['Modules', `${modulesCreated} created, ${modulesSeed.length - modulesCreated} existed`]);

  // 3. Operations
  let opsCreated = 0;
  for (const [moid, opid, shortName, description] of operationsSeed) {
    const [, created] = await PermissionTVL.findOrCreate({
      where: { op_apid: APP_ID, op_moid: moid, op_opid: opid },
      defaults: {
        op_apid: APP_ID,
        op_moid: moid,
        op_opid: opid,
        op_opshort: shortName,
        op_opdesc: description,
        op_appop: 1,
        op_avail: 1,
        op_ready: 1,
        op_secure: 1,
        op_active: 1,
        op_eby: SEEDER,
        op_edtm: now
      }
    });
    if (created) opsCreated++;
  }
  summary.push(['Operations', `${opsCreated} created, ${operationsSeed.length - opsCreated} existed`]);

  // 4. Role permissions
  const allOpIds = operationsSeed.map(([moid, opid]) => fullOpId(moid, opid));
  let rolePermsCreated = 0;
  let rolePermsTotal = 0;
  for (const [roleId, allowed] of Object.entries(rolePermissionMatrix)) {
    const opIds = allowed === '*' ? allOpIds : allowed.map((id) => `${APP_ID}${id}`);
    for (const opId of opIds) {
      rolePermsTotal++;
      const [, created] = await RolePermissionTVL.findOrCreate({
        where: { fp_fnid: roleId, fp_opid: opId },
        defaults: {
          fp_fnid: roleId,
          fp_opid: opId,
          fp_allow: 1,
          fp_rmrks: `Seeded permission for role ${roleId}`,
          fp_active: 1,
          fp_eby: SEEDER,
          fp_edtm: now
        }
      });
      if (created) rolePermsCreated++;
    }
  }
  summary.push(['Role Permissions', `${rolePermsCreated} created, ${rolePermsTotal - rolePermsCreated} existed`]);

  // 5. User permissions
  let userPermsCreated = 0;
  let userPermsTotal = 0;
  for (const [userId, allowed] of Object.entries(userPermissionMatrix)) {
    for (const id of allowed) {
      userPermsTotal++;
      const opId = `${APP_ID}${id}`;
      const [, created] = await UserPermissionTVL.findOrCreate({
        where: { up_usid: userId, up_opid: opId },
        defaults: {
          up_usid: userId,
          up_opid: opId,
          up_allow: 1,
          up_rmrks: `Seeded direct permission for user ${userId}`,
          up_active: 1,
          up_eby: SEEDER,
          up_edtm: now
        }
      });
      if (created) userPermsCreated++;
    }
  }
  summary.push(['User Permissions', `${userPermsCreated} created, ${userPermsTotal - userPermsCreated} existed`]);

  // 6. Stations
  let stationsCreated = 0;
  for (const [code, name, city, state] of stationsSeed) {
    const [, created] = await StationTVL.findOrCreate({
      where: { st_stid: code },
      defaults: {
        st_stid: code,
        st_stcode: code,
        st_stname: name,
        st_city: city,
        st_state: state,
        eby: SEEDER,
        edtm: now,
        mby: SEEDER,
        mdtm: now
      }
    });
    if (created) stationsCreated++;
  }
  summary.push(['Stations', `${stationsCreated} created, ${stationsSeed.length - stationsCreated} existed`]);

  // 7. Trains
  let trainsCreated = 0;
  for (const train of trainsSeed) {
    const [, created] = await TrainTVL.findOrCreate({
      where: { tr_trid: train.tr_trid },
      defaults: {
        ...train,
        tr_active: 1,
        eby: SEEDER,
        edtm: now,
        mby: SEEDER,
        mdtm: now
      }
    });
    if (created) trainsCreated++;
  }
  summary.push(['Trains', `${trainsCreated} created, ${trainsSeed.length - trainsCreated} existed`]);

  // 8. Station boys
  let boysCreated = 0;
  for (const boy of stationBoysSeed) {
    const [, created] = await StationBoy.findOrCreate({
      where: { phone: boy.phone },
      defaults: {
        ...boy,
        created_by: 1,
        created_at: now,
        updated_by: 1,
        updated_at: now
      }
    });
    if (created) boysCreated++;
  }
  summary.push(['Station Boys', `${boysCreated} created, ${stationBoysSeed.length - boysCreated} existed`]);

  // 9. Enrich company details (only fill empty columns)
  const company = await CompanyTVL.findByPk('TRV');
  if (company) {
    const updates = {};
    const details = {
      co_addr1: '12, Connaught Place',
      co_addr2: 'Near Rajiv Chowk Metro Station',
      co_city: 'New Delhi',
      co_state: 'Delhi',
      co_pin: '110001',
      co_phone: '01145678900',
      co_email: 'info@yatrasathi.com',
      co_gst: '07AABCY1234F1Z5',
      co_pan: 'AABCY1234F',
      co_rmrks: 'Head office - YatraSathi Travel Agency'
    };
    for (const [field, value] of Object.entries(details)) {
      if (!company[field]) updates[field] = value;
    }
    if (!company.eby) updates.eby = SEEDER;
    if (!company.edtm) updates.edtm = now;
    if (!company.mby) updates.mby = SEEDER;
    if (!company.mdtm) updates.mdtm = now;
    if (Object.keys(updates).length > 0) {
      await company.update(updates);
      summary.push(['Company', `${Object.keys(updates).length} fields enriched`]);
    } else {
      summary.push(['Company', 'already complete']);
    }
  } else {
    summary.push(['Company', 'TRV not found - skipped']);
  }

  // 10. Enrich user display names / titles and reactivate core roles
  const [nameResult] = await sequelizeTVL.query(
    `UPDATE usXuser
     SET us_usname = TRIM(CONCAT(COALESCE(us_fname, ''), ' ', COALESCE(us_lname, '')))
     WHERE (us_usname IS NULL OR us_usname = '')
       AND TRIM(CONCAT(COALESCE(us_fname, ''), ' ', COALESCE(us_lname, ''))) <> ''`
  );
  summary.push(['User Names', `${nameResult.affectedRows} updated`]);

  const titles = {
    ADM001: 'System Administrator',
    ACC001: 'Accounts Manager',
    EMP001: 'Senior Booking Agent',
    EMP002: 'HR Executive',
    EMP003: 'Booking Executive',
    EMP004: 'Accounts Executive',
    EMP005: 'Operations Executive',
    EMP006: 'Support Executive'
  };
  let titlesUpdated = 0;
  for (const [userId, title] of Object.entries(titles)) {
    const [result] = await sequelizeTVL.query(
      `UPDATE usXuser SET us_title = :title
       WHERE us_usid = :userId AND (us_title IS NULL OR us_title = '')`,
      { replacements: { title, userId } }
    );
    titlesUpdated += result.affectedRows;
  }
  summary.push(['User Titles', `${titlesUpdated} updated`]);

  const [roleResult] = await sequelizeTVL.query(
    `UPDATE fnXfunction SET fn_active = 1
     WHERE fn_fnid IN ('ADM', 'AGT', 'EMP') AND fn_active = 0`
  );
  summary.push(['Roles', `${roleResult.affectedRows} activated`]);

  // Report
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log('Seed summary');
  console.log('------------');
  for (const [name, result] of summary) {
    console.log(`${name.padEnd(18)} ${result}`);
  }
  console.log(`\nDone in ${elapsed}s.`);
}

seed()
  .then(async () => {
    await sequelizeTVL.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seeding failed:', error);
    try {
      await sequelizeTVL.close();
    } catch (_) {}
    process.exit(1);
  });
