/**
 * YatraSathi Smart Auto-Seeder
 * Discovers actual DB schema at runtime and seeds 100+ rows per table
 * Respects FK constraints, unique indexes, ENUMs, NOT NULL, and auto-increment
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'Pri@2005',
  database: process.env.DB_NAME_TVL || 'TVL_001', waitForConnections: true, connectionLimit: 5
});

const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[R(0, a.length - 1)];
const pad = (n, w = 3) => String(n).padStart(w, '0');
const pastD = (d = 365) => new Date(Date.now() - R(1, d) * 864e5);
const futD = (d = 60) => new Date(Date.now() + R(1, d) * 864e5);
const fDT = d => d.toISOString().slice(0, 19).replace('T', ' ');
const fD = d => d.toISOString().slice(0, 10);
const uid = () => R(100000, 999999).toString();

const FN = ['Raj','Amit','Priya','Sneha','Vikram','Anita','Suresh','Kavita','Rahul','Neha','Arun','Deepa','Mohan','Lata','Kiran','Pooja','Sanjay','Meera','Alok','Rekha'];
const LN = ['Sharma','Patel','Kumar','Gupta','Singh','Verma','Joshi','Mishra','Yadav','Reddy'];
const CITIES = ['Mumbai','Delhi','Chennai','Kolkata','Bangalore','Hyderabad','Pune','Jaipur','Lucknow','Patna'];
const STATES = ['Maharashtra','Delhi','Tamil Nadu','Karnataka','Rajasthan','Gujarat','UP','MP','Kerala','Punjab'];
const STNS = [{c:'NDLS',n:'New Delhi'},{c:'CSMT',n:'Mumbai CST'},{c:'MAS',n:'Chennai Central'},{c:'HWH',n:'Howrah'},{c:'SBC',n:'Bengaluru'},{c:'SC',n:'Secunderabad'},{c:'PUNE',n:'Pune'},{c:'ADI',n:'Ahmedabad'},{c:'JP',n:'Jaipur'},{c:'LKO',n:'Lucknow'},{c:'PNBE',n:'Patna'},{c:'BPL',n:'Bhopal'},{c:'NGP',n:'Nagpur'},{c:'BBS',n:'Bhubaneswar'},{c:'CBE',n:'Coimbatore'},{c:'ERS',n:'Kochi'},{c:'VSKP',n:'Vizag'},{c:'CDG',n:'Chandigarh'},{c:'DDN',n:'Dehradun'},{c:'INDB',n:'Indore'}];

const phone = () => `${pick(['98','97','96','95','94','93','91','90'])}${R(10000000,99999999)}`;
const email = (n) => `${(n||pick(FN)).toLowerCase().replace(/\s/g,'.')}${R(1,999)}@${pick(['gmail.com','yahoo.com','company.in'])}`;
const gstN = () => `29AABCU${R(1000,9999)}${pick('ABCDE')}1Z${R(1,5)}`;
const panN = () => `A${pick(['A','B','C','P','T'])}${pick(['A','B','C','P','T'])}${R(1000,9999)}${pick('ABCDE')}`;

// Discover schema for a table
async function getSchema(conn, table) {
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='TVL_001' AND TABLE_NAME=? ORDER BY ORDINAL_POSITION`, [table]);
  const [fks] = await conn.query(
    `SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
     FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='TVL_001' AND TABLE_NAME=? AND REFERENCED_TABLE_NAME IS NOT NULL`, [table]);
  const [idxs] = await conn.query(
    `SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='TVL_001' AND TABLE_NAME=? ORDER BY INDEX_NAME, SEQ_IN_INDEX`, [table]);
  const fkMap = {};
  fks.forEach(f => { fkMap[f.COLUMN_NAME] = { table: f.REFERENCED_TABLE_NAME, col: f.REFERENCED_COLUMN_NAME }; });
  const uniqueCols = new Set();
  idxs.filter(i => i.NON_UNIQUE === 0).forEach(i => uniqueCols.add(i.COLUMN_NAME));
  return { cols, fkMap, uniqueCols };
}

// Get existing PK values for FK lookups
async function getPKValues(conn, table, col) {
  const [rows] = await conn.query(`SELECT \`${col}\` as val FROM \`${table}\` LIMIT 500`);
  return rows.map(r => r.val).filter(v => v != null);
}

// Generate a value for a column based on its type and context
function genValue(col, schema, rowIdx, fkCache) {
  const { COLUMN_NAME: name, COLUMN_TYPE: ctype, DATA_TYPE: dtype, IS_NULLABLE: nullable, COLUMN_KEY: key, EXTRA: extra } = col;
  
  // Skip auto-increment
  if (extra === 'auto_increment') return undefined;
  
  // FK: use cached reference values
  if (schema.fkMap[name]) {
    const fk = schema.fkMap[name];
    const vals = fkCache[`${fk.table}.${fk.col}`];
    if (vals && vals.length > 0) return pick(vals);
    if (nullable === 'YES') return null;
    return vals ? vals[0] : null;
  }

  // Parse enum values
  let enumVals = null;
  if (ctype.startsWith('enum(')) {
    enumVals = ctype.match(/'([^']+)'/g).map(v => v.replace(/'/g, ''));
  }

  // Generate based on column name patterns + type
  const nl = name.toLowerCase();
  
  // Smart name-based generators
  if (nl.includes('email') && dtype === 'varchar') return email();
  if (nl.includes('phone') && dtype === 'varchar') return phone();
  if (nl.includes('gst') && dtype === 'varchar') return gstN();
  if ((nl.includes('pan') || nl === 'cu_panno') && dtype === 'varchar') return panN();
  if (nl.includes('aadhaar') && dtype === 'varchar') return `${R(1000,9999)} ${R(1000,9999)} ${R(1000,9999)}`;
  if ((nl.includes('fname') || nl.includes('firstname')) && dtype === 'varchar') return pick(FN);
  if ((nl.includes('lname') || nl.includes('lastname')) && dtype === 'varchar') return pick(LN);
  if ((nl.includes('name') || nl.includes('desc')) && dtype === 'varchar' && !nl.includes('ledger') && !nl.includes('account') && !nl.includes('station') && !nl.includes('train')) return `${pick(FN)} ${pick(LN)}`;
  if (nl.includes('city') && dtype === 'varchar') return pick(CITIES);
  if (nl.includes('state') && dtype === 'varchar') return pick(STATES);
  if ((nl.includes('addr') || nl.includes('address')) && dtype === 'varchar') return `${R(1,999)} ${pick(['MG Road','Station Rd','Park St','Link Rd'])}`;
  if (nl.includes('pin') && dtype === 'varchar') return `${R(100000,999999)}`;
  if (nl.includes('ipaddr') && dtype === 'varchar') return `192.168.${R(1,254)}.${R(1,254)}`;
  if (nl.includes('token') && dtype === 'varchar') return null;
  if (nl.includes('narration') || nl.includes('remarks') || nl.includes('rmrks') || nl.includes('description') || nl.includes('hint') || nl.includes('mhint')) {
    if (nullable === 'YES') return R(0,1) ? `Entry ${rowIdx}` : null;
    return `Entry ${rowIdx}`;
  }
  if (nl.includes('photo') && dtype === 'varchar') return null;
  if ((nl.includes('ref') || nl.includes('pnr')) && dtype === 'varchar' && !nl.includes('reference_type')) return R(0,1) ? `REF${R(100000,999999)}` : null;

  // Station/train code FKs
  if ((nl === 'st_stcode' || nl === 'tr_fromst' || nl === 'tr_tost') && dtype === 'varchar') return pick(STNS).c;
  if (nl.includes('stname') || nl.includes('station') && dtype === 'varchar') return pick(STNS).n;

  // Type-based generators
  if (enumVals) return pick(enumVals);
  
  if (dtype === 'tinyint' && ctype === 'tinyint(1)') return R(0, 1);
  if (dtype === 'tinyint') return R(0, 3);
  if (dtype === 'int' || dtype === 'bigint') {
    if (key === 'PRI') return undefined; // handled separately
    if (nl.includes('amount') || nl.includes('fare') || nl.includes('amt') || nl.includes('balance') || nl.includes('salary') || nl.includes('budget') || nl.includes('credit') || nl.includes('debit') || nl.includes('advance') || nl.includes('opening') || nl.includes('closing')) return R(500, 50000);
    if (nl.includes('age')) return R(5, 75);
    if (nl.includes('count') || nl.includes('total') || nl.includes('passengers') || nl.includes('pax') || nl.includes('seats') || nl.includes('usage')) return R(1, 50);
    if (nl.includes('failcount')) return R(0, 3);
    if (nl.includes('limit') || nl.includes('grsrl')) return R(1, 100);
    return R(1, 200);
  }
  if (dtype === 'decimal' || dtype === 'float' || dtype === 'double') {
    if (nl.includes('amount') || nl.includes('fare') || nl.includes('amt') || nl.includes('balance') || nl.includes('charge') || nl.includes('credit') || nl.includes('debit') || nl.includes('advance') || nl.includes('salary') || nl.includes('budget')) return R(200, 50000);
    if (nl.includes('discount') || nl.includes('incentive') || nl.includes('fee') || nl.includes('surcharge')) return R(0, 500);
    if (nl.includes('opening') || nl.includes('closing')) return R(0, 100000);
    return R(10, 10000);
  }
  if (dtype === 'date') {
    if (nl.includes('exp') || nl.includes('future') || nl.includes('journey') || nl.includes('travel') || nl.includes('startdate') && !nl.includes('last')) return fD(futD());
    if (nl.includes('end') || nl.includes('close') || nl.includes('enddate')) return fD(futD(R(30, 120)));
    return fD(pastD());
  }
  if (dtype === 'datetime' || dtype === 'timestamp') {
    if (nl.includes('exp') || nl.includes('future')) return fDT(futD());
    if (nl.includes('created') || nl.includes('edtm') || nl.includes('enter') || nl.includes('change') || nl.includes('last')) return fDT(pastD());
    if (nl.includes('modif') || nl.includes('mdtm') || nl.includes('updated')) return fDT(pastD(R(1, 60)));
    if (nl.includes('start') || nl.includes('session')) return fDT(pastD(R(1, 60)));
    return fDT(pastD());
  }
  if (dtype === 'varchar' || dtype === 'char') {
    const maxLen = parseInt(col.CHARACTER_MAXIMUM_LENGTH) || 50;
    if (nl.includes('code') || nl.includes('short')) return `C${rowIdx}`.substring(0, Math.min(maxLen, 15));
    if (nl.includes('no') || nl.includes('number') || nl.includes('num')) return `${R(10000, 99999)}`;
    if (nl.includes('class') || nl.includes('type') || nl.includes('category')) return pick(['A', 'B', 'C', 'SL', '3A', '2A']);
    if (nl.includes('status') || nl.includes('active')) return 'ACTIVE';
    if (nl.includes('mode') || nl.includes('method')) return pick(['Cash', 'Bank', 'Online']);
    if (nl.includes('gender')) return pick(['M', 'F']);
    if (nl.includes('berth')) return pick(['LB', 'UB', 'MB', 'SL']);
    if (nl.includes('quota')) return pick(['GN', 'TQ', 'LD']);
    if (nl.includes('priority')) return pick(['Normal', 'High', 'Low']);
    if (nl.includes('department') || nl.includes('dept')) return pick(['Sales', 'Ops', 'Finance', 'HR', 'IT']);
    if (nl.includes('designation') || nl.includes('title')) return pick(['Manager', 'Agent', 'Executive']);
    if (nl.includes('payment') && nl.includes('terms')) return pick(['IMMEDIATE', 'NET15', 'NET30']);
    if (nl.includes('days') || nl.includes('week')) return pick(['1234567', '135', '246']);
    if (nl.includes('seat') || nl.includes('coach') || nl.includes('alloc')) return `${R(1, 72)}`;
    if (nl.includes('idtype')) return pick(['AADHAAR', 'PAN', 'PASSPORT']);
    if (nl.includes('voucher') || nl.includes('entry_no')) return `V${pad(rowIdx, 5)}`;
    if (nl.includes('bill') && nl.includes('no')) return `BILL${pad(rowIdx, 5)}`;
    if (nl.includes('useragent')) return 'Mozilla/5.0';
    if (nl.includes('machine')) return `DESKTOP-${uid().slice(0,7)}`;
    if (nl.includes('fyear') || nl.includes('financial')) { const y = R(2022, 2026); return `${y}-${String(y+1).slice(-2)}`; }
    if (nl.includes('config') || nl.includes('json')) return JSON.stringify({ key: `val_${rowIdx}` });
    if (maxLen <= 3) return `X${pad(rowIdx % 100, 2)}`.substring(0, maxLen);
    if (maxLen <= 6) return `ID${pad(rowIdx, 4)}`.substring(0, maxLen);
    if (maxLen <= 10) return `V${rowIdx}`.substring(0, maxLen);
    if (maxLen <= 15) return `USR${pad(rowIdx, 4)}`.substring(0, maxLen);
    return `${pick(FN)} ${pick(LN)} ${rowIdx}`.substring(0, Math.min(maxLen, 60));
  }
  if (dtype === 'text' || dtype === 'longtext' || dtype === 'mediumtext') {
    if (nl.includes('json') || nl.includes('config')) return JSON.stringify({ key: `val_${rowIdx}` });
    if (nl.includes('old') || nl.includes('new')) return `data_${rowIdx}`;
    return nullable === 'YES' ? null : `Text entry ${rowIdx}`;
  }
  
  // Fallback
  if (nullable === 'YES') return null;
  return `V${rowIdx}`;
}

async function seedTable(conn, tableName, targetCount = 110) {
  const schema = await getSchema(conn, tableName);
  const { cols, fkMap, uniqueCols } = schema;
  
  // Build FK cache
  const fkCache = {};
  for (const [col, fk] of Object.entries(fkMap)) {
    const key = `${fk.table}.${fk.col}`;
    if (!fkCache[key]) {
      fkCache[key] = await getPKValues(conn, fk.table, fk.col);
    }
  }
  
  // Check existing count
  const [existing] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
  const existingCount = existing[0].cnt;
  if (existingCount >= targetCount) {
    console.log(`  ⏭️  ${tableName}: already has ${existingCount} rows (target: ${targetCount})`);
    return existingCount;
  }
  
  const needed = targetCount - existingCount;
  const startIdx = existingCount + 1;
  
  // Get PK column info
  const pkCol = cols.find(c => c.COLUMN_KEY === 'PRI' && c.EXTRA === 'auto_increment');
  const pkCols = cols.filter(c => c.COLUMN_KEY === 'PRI');
  const isCompositePK = pkCols.length > 1 && !pkCol;
  
  // Get unique columns for uniqueness tracking
  const uniqueSets = {};
  if (uniqueCols.size > 0) {
    for (const uc of uniqueCols) {
      const [uv] = await conn.query(`SELECT \`${uc}\` as val FROM \`${tableName}\` WHERE \`${uc}\` IS NOT NULL`);
      uniqueSets[uc] = new Set(uv.map(r => r.val));
    }
  }
  
  // Build rows
  const nonAutoCols = cols.filter(c => c.EXTRA !== 'auto_increment');
  const rows = [];
  let attempts = 0;
  const maxAttempts = needed * 3;
  
  while (rows.length < needed && attempts < maxAttempts) {
    attempts++;
    const idx = startIdx + rows.length;
    const row = {};
    let valid = true;
    
    for (const col of nonAutoCols) {
      let val = genValue(col, schema, idx, fkCache);
      if (val === undefined) continue; // skip auto-increment
      
      // Ensure uniqueness
      if (uniqueCols.has(col.COLUMN_NAME) && uniqueSets[col.COLUMN_NAME]) {
        let retry = 0;
        while (uniqueSets[col.COLUMN_NAME].has(val) && retry < 20) {
          val = genValue(col, schema, idx + retry + 1000, fkCache);
          retry++;
        }
        if (uniqueSets[col.COLUMN_NAME].has(val)) { valid = false; break; }
        uniqueSets[col.COLUMN_NAME].add(val);
      }
      
      if (val !== undefined) row[col.COLUMN_NAME] = val;
    }
    
    // Handle composite PKs
    if (isCompositePK) {
      const pkParts = pkCols.map((c, i) => {
        const v = row[c.COLUMN_NAME] || genValue(c, schema, idx * (i + 1), fkCache);
        row[c.COLUMN_NAME] = v;
        return v;
      });
      const pkKey = pkParts.join('|');
      // Check composite uniqueness (simplified)
    }
    
    if (valid && Object.keys(row).length > 0) rows.push(row);
  }
  
  if (rows.length === 0) return existingCount;
  
  // Batch insert
  const inserted = await bulkInsert(conn, tableName, rows);
  const finalCount = existingCount + inserted;
  console.log(`  ✅ ${tableName}: ${existingCount} → ${finalCount} rows (+${inserted} inserted, ${rows.length - inserted} skipped by IGNORE)`);
  return finalCount;
}

async function bulkInsert(conn, table, rows) {
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  if (cols.length === 0) return 0;
  const placeholders = cols.map(() => '?').join(',');
  const sql = `INSERT IGNORE INTO \`${table}\` (\`${cols.join('`,`')}\`) VALUES ${rows.map(() => `(${placeholders})`).join(',')}`;
  const vals = rows.flatMap(r => cols.map(c => r[c] !== undefined ? r[c] : null));
  try {
    const [res] = await conn.query(sql, vals);
    return res.affectedRows || 0;
  } catch (err) {
    // Fallback: insert one by one
    let count = 0;
    for (const row of rows) {
      try {
        const rcols = Object.keys(row);
        const rsql = `INSERT IGNORE INTO \`${table}\` (\`${rcols.join('`,`')}\`) VALUES (${rcols.map(() => '?').join(',')})`;
        const [r] = await conn.query(rsql, rcols.map(c => row[c]));
        count += r.affectedRows || 0;
      } catch (e2) {
        // Skip problematic rows
      }
    }
    return count;
  }
}

// ═══ MAIN ═══
async function main() {
  const conn = await pool.getConnection();
  console.log('🔌 Connected. Discovering schema...\n');
  
  // Get all tables
  const [tableRows] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='TVL_001' ORDER BY TABLE_NAME`);
  const allTables = tableRows.map(r => r.TABLE_NAME);
  console.log(`📊 Found ${allTables.length} tables\n`);
  
  // Build dependency order based on FK
  const deps = {};
  for (const t of allTables) {
    const [fks] = await conn.query(
      `SELECT REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA='TVL_001' AND TABLE_NAME=? AND REFERENCED_TABLE_NAME IS NOT NULL AND REFERENCED_TABLE_NAME != ?`, [t, t]);
    deps[t] = [...new Set(fks.map(f => f.REFERENCED_TABLE_NAME))];
  }
  
  // Topological sort
  const ordered = [];
  const visited = new Set();
  const visiting = new Set();
  
  function visit(t) {
    if (visited.has(t)) return;
    if (visiting.has(t)) return; // circular
    visiting.add(t);
    for (const d of (deps[t] || [])) {
      if (allTables.includes(d)) visit(d);
    }
    visiting.delete(t);
    visited.add(t);
    ordered.push(t);
  }
  
  allTables.forEach(t => visit(t));
  
  console.log('📋 Seeding order (dependency-resolved):');
  console.log(`   ${ordered.join(' → ')}\n`);
  
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  
  const results = {};
  const TARGET = 110;
  
  console.log('═'.repeat(60));
  console.log('  SEEDING ALL TABLES (target: ' + TARGET + ' rows each)');
  console.log('═'.repeat(60) + '\n');
  
  for (const table of ordered) {
    try {
      results[table] = await seedTable(conn, table, TARGET);
    } catch (err) {
      console.error(`  ❌ ${table}: ${err.message}`);
      results[table] = 0;
    }
  }
  
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  
  // ═══ VALIDATION ═══
  console.log('\n' + '═'.repeat(60));
  console.log('  POST-SEEDING VALIDATION');
  console.log('═'.repeat(60) + '\n');
  
  let pass = 0, fail = 0, totalRows = 0;
  for (const table of ordered) {
    const [cnt] = await conn.query(`SELECT COUNT(*) as c FROM \`${table}\``);
    const count = cnt[0].c;
    totalRows += count;
    const status = count >= 100 ? '✅' : '⚠️';
    if (count >= 100) pass++; else fail++;
    console.log(`  ${status} ${table}: ${count} rows ${count < 100 ? '(BELOW TARGET)' : ''}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`  Tables: ${pass} PASS / ${fail} BELOW TARGET / ${ordered.length} total`);
  console.log(`  Total rows across all tables: ${totalRows.toLocaleString()}`);
  console.log('═'.repeat(60));
  
  conn.release();
  await pool.end();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  pool.end();
  process.exit(1);
});
