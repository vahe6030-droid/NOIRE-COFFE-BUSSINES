const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA = path.join(DATA_DIR, 'store.json');
const GALLERY = path.join(DATA_DIR, 'gallery.json');
const MENU = path.join(ROOT, 'public', 'menu.json');

let state = null;
let gallery = null;
let menu = null;
let history = null;
let auditLogs = null;
let readyPromise = null;
let localMode = false;
let storeVersion = 0;
const resourceVersions = new Map();
const localClaimLocks = new Set();
const localActiveShifts = new Set();
const localIdempotency = new Map();
const localRateBuckets = new Map();
const localReservedNumbers = new Map();

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}

function fallbackStore() {
  return {
    orders: [], reservations: [], customers: [],
    tables: [
      { id: 1, name: 'T01', seats: 2, zone: 'Window', x: 12, y: 18, status: 'available' },
      { id: 2, name: 'T02', seats: 2, zone: 'Window', x: 34, y: 18, status: 'available' },
      { id: 3, name: 'T03', seats: 4, zone: 'Main Hall', x: 56, y: 18, status: 'available' },
      { id: 4, name: 'T04', seats: 4, zone: 'Main Hall', x: 78, y: 18, status: 'available' },
      { id: 5, name: 'T05', seats: 6, zone: 'Main Hall', x: 20, y: 52, status: 'available' },
      { id: 6, name: 'T06', seats: 6, zone: 'Main Hall', x: 50, y: 52, status: 'available' },
      { id: 7, name: 'T07', seats: 8, zone: 'Lounge', x: 80, y: 52, status: 'available' },
      { id: 8, name: 'T08', seats: 2, zone: 'Lounge', x: 28, y: 82, status: 'available' },
      { id: 9, name: 'T09', seats: 4, zone: 'Lounge', x: 58, y: 82, status: 'available' }
    ],
    settings: { siteName: 'NOIRÉ COFFEE', siteSubtitle: 'COFFEE & KITCHEN' },
    employees: [],
    admin: { username: process.env.NOIRE_ADMIN_USER || '', passwordHash: '', role: 'owner', sessionVersion: 0 }
  };
}

function defaultGallery() {
  return [
    { id: 1, title: 'The Main Hall', category: 'Interior', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=88' },
    { id: 2, title: 'Evening Light', category: 'Atmosphere', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=88' },
    { id: 3, title: 'Window Seats', category: 'Seating', image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1600&q=88' },
    { id: 4, title: 'The Lounge', category: 'Interior', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=88' },
    { id: 5, title: 'Noiré Details', category: 'Details', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=88' },
    { id: 6, title: 'After Dark', category: 'Atmosphere', image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1600&q=88' }
  ];
}

async function init() {
  // DATABASE_URL is optional for local development. If Neon is not configured
  // or temporarily unavailable, use the bundled JSON files instead of making
  // every API request fail with HTTP 503.
  if (!process.env.DATABASE_URL) {
    if(process.env.NODE_ENV==='production') throw new Error('DATABASE_URL is required in production');
    localMode = true;
    state = readJson(DATA, fallbackStore());
    const fallback = fallbackStore();
    state.orders = Array.isArray(state.orders) ? state.orders : [];
    state.reservations = Array.isArray(state.reservations) ? state.reservations : [];
    state.customers = Array.isArray(state.customers) ? state.customers : [];
    state.employees = Array.isArray(state.employees) ? state.employees : [];
    state.tables = Array.isArray(state.tables) && state.tables.length ? state.tables : fallback.tables;
    state.settings = state.settings && typeof state.settings === 'object' ? state.settings : fallback.settings;
    state.admin = state.admin && typeof state.admin === 'object' ? state.admin : fallback.admin;
    gallery = readJson(GALLERY, defaultGallery());
    menu = readJson(MENU, []);
    history = []; auditLogs = [];
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS noire_data (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`ALTER TABLE noire_data ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0`;
    await sql`CREATE TABLE IF NOT EXISTS noire_order_claims (order_id TEXT PRIMARY KEY, employee_id BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS noire_active_shifts (employee_id BIGINT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS noire_reserved_numbers (kind TEXT NOT NULL, number INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (kind, number))`;
    await sql`CREATE TABLE IF NOT EXISTS noire_idempotency (scope TEXT NOT NULL, idempotency_key TEXT NOT NULL, response JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (scope, idempotency_key))`;
    await sql`CREATE TABLE IF NOT EXISTS noire_rate_limits (scope TEXT NOT NULL, client_key TEXT NOT NULL, window_started TIMESTAMPTZ NOT NULL, request_count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (scope, client_key))`;
    await sql`CREATE TABLE IF NOT EXISTS noire_audit_logs (id TEXT PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT NOW(), actor_id TEXT, actor_role TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, meta JSONB NOT NULL DEFAULT '{}'::jsonb)`;
    await sql`CREATE TABLE IF NOT EXISTS noire_orders (id BIGINT PRIMARY KEY, number INTEGER UNIQUE, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS noire_reservations (id BIGINT PRIMARY KEY, number INTEGER UNIQUE, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS noire_customers (id BIGINT PRIMARY KEY, phone TEXT, email TEXT, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS noire_employees (id BIGINT PRIMARY KEY, username TEXT UNIQUE, role TEXT, active BOOLEAN NOT NULL DEFAULT TRUE, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS noire_tables (id BIGINT PRIMARY KEY, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS noire_shifts (id BIGINT PRIMARY KEY, employee_id BIGINT, date DATE, start_time TEXT, end_time TEXT, status TEXT, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`ALTER TABLE noire_orders DROP CONSTRAINT IF EXISTS noire_orders_number_key`;
    await sql`ALTER TABLE noire_reservations DROP CONSTRAINT IF EXISTS noire_reservations_number_key`;
    await sql`ALTER TABLE noire_employees DROP CONSTRAINT IF EXISTS noire_employees_username_key`;
    await sql`CREATE INDEX IF NOT EXISTS noire_customers_phone_idx ON noire_customers(phone)`;
    await sql`CREATE INDEX IF NOT EXISTS noire_customers_email_idx ON noire_customers(email)`;
    await sql`CREATE INDEX IF NOT EXISTS noire_orders_updated_idx ON noire_orders(updated_at)`;
    await sql`CREATE INDEX IF NOT EXISTS noire_reservations_updated_idx ON noire_reservations(updated_at)`;
    await sql`CREATE INDEX IF NOT EXISTS noire_shifts_employee_date_idx ON noire_shifts(employee_id,date)`;
    await sql`CREATE INDEX IF NOT EXISTS noire_idempotency_created_idx ON noire_idempotency(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS noire_audit_at_idx ON noire_audit_logs(at)`;
  
    const rows = await sql`SELECT key, value, version FROM noire_data WHERE key IN ('store','gallery','menu','history','audit_logs')`;
    const found = Object.fromEntries(rows.map(r => [r.key, r.value]));
    for (const r of rows) resourceVersions.set(r.key, Number(r.version||0));
    const storeRow = rows.find(r => r.key === 'store');
    storeVersion = Number(storeRow?.version || 0);

    state = found.store || fallbackStore();
  // Never seed production from the mutable bundled JSON file. The bundled file is a local-development fixture only.
  if (process.env.NODE_ENV === 'production' && !found.store) state = fallbackStore();
  // Repair incomplete stores created by older builds. This is important when the
  // existing Neon row has no tables/employees/settings or contains malformed arrays.
  const fallback = fallbackStore();
  state.orders = Array.isArray(state.orders) ? state.orders : [];
  state.reservations = Array.isArray(state.reservations) ? state.reservations : [];
  state.customers = Array.isArray(state.customers) ? state.customers : [];
  state.employees = Array.isArray(state.employees) ? state.employees : [];
  state.tables = Array.isArray(state.tables) && state.tables.length ? state.tables : fallback.tables;
  state.settings = state.settings && typeof state.settings === 'object' ? state.settings : fallback.settings;
  state.admin = state.admin && typeof state.admin === 'object' ? state.admin : fallback.admin;
  gallery = Array.isArray(found.gallery) ? found.gallery : readJson(GALLERY, defaultGallery());
  menu = Array.isArray(found.menu) ? found.menu : readJson(MENU, []);
  // Seed newly added menu positions into an existing database without overwriting
  // administrator edits to products that already exist.
  const menuSeed = readJson(MENU, []);
  if (Array.isArray(menuSeed) && menuSeed.length > menu.length) {
    const existingIds = new Set(menu.map(x => Number(x.id)));
    menu = menu.concat(menuSeed.filter(x => !existingIds.has(Number(x.id))));
  }
  history = Array.isArray(found.history) ? found.history : [];
  auditLogs = Array.isArray(found.audit_logs) ? found.audit_logs : [];
  const durableAudit = await sql`SELECT id,at,actor_id,actor_role,actor,action,entity,entity_id,meta FROM noire_audit_logs ORDER BY at DESC LIMIT 5000`;
  if (durableAudit.length) auditLogs = durableAudit.reverse().map(r=>({id:r.id,at:r.at,actorId:r.actor_id,actorRole:r.actor_role,actor:r.actor,action:r.action,entity:r.entity,entityId:r.entity_id,meta:r.meta||{}}));

  // Persist repairs even when the key already existed.
  if (!found.store) { await sql`INSERT INTO noire_data (key,value,version) VALUES ('store', ${JSON.stringify(state)}::jsonb, 0) ON CONFLICT (key) DO NOTHING`; }
  else await sql`UPDATE noire_data SET value=${JSON.stringify(state)}::jsonb, updated_at=NOW(), version=version+1 WHERE key='store' AND version=${storeVersion}`;
  if (found.store) {
    const repairRows = await sql`SELECT version FROM noire_data WHERE key='store'`;
    storeVersion = Number(repairRows[0]?.version ?? storeVersion);
  }
  if (!found.gallery) await sql`INSERT INTO noire_data (key,value) VALUES ('gallery', ${JSON.stringify(gallery)}::jsonb) ON CONFLICT (key) DO NOTHING`;
  if (!found.menu) await sql`INSERT INTO noire_data (key,value) VALUES ('menu', ${JSON.stringify(menu)}::jsonb) ON CONFLICT (key) DO NOTHING`;
  else if (Array.isArray(menuSeed) && menu.length > (Array.isArray(found.menu) ? found.menu.length : 0)) await sql`UPDATE noire_data SET value=${JSON.stringify(menu)}::jsonb, updated_at=NOW() WHERE key='menu'`;
    if (!found.history) await sql`INSERT INTO noire_data (key,value) VALUES ('history', ${JSON.stringify(history)}::jsonb) ON CONFLICT (key) DO NOTHING`;
    if (!found.audit_logs) await sql`INSERT INTO noire_data (key,value) VALUES ('audit_logs', ${JSON.stringify(auditLogs)}::jsonb) ON CONFLICT (key) DO NOTHING`;
    const versionRows = await sql`SELECT key,version FROM noire_data WHERE key IN ('store','gallery','menu','history','audit_logs')`;
    for (const r of versionRows) resourceVersions.set(r.key, Number(r.version||0));
  await syncNormalizedStore(sql, state);
  } catch (err) {
    if(process.env.NODE_ENV==='production') throw err;
    console.error('NOIRÉ Neon unavailable, switching to local JSON storage:', err.message);
    localMode = true;
    state = readJson(DATA, fallbackStore());
    gallery = readJson(GALLERY, defaultGallery());
    menu = readJson(MENU, []);
    history = []; auditLogs = [];
  }
}

function ready() {
  if (!readyPromise) readyPromise = init();
  return readyPromise;
}

function getStore() { return state; }
function getGallery() { return gallery; }
function getMenu() { return menu; }
function getHistory() { return history || []; }
function getAuditLogs() { return auditLogs || []; }

async function save(key, value) {
  if (localMode || !process.env.DATABASE_URL) {
    try {
      const file = key === 'store' ? DATA : key === 'gallery' ? GALLERY : key === 'menu' ? MENU : path.join(DATA_DIR, `${key}.json`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
    } catch (err) {
      console.warn(`NOIRÉ local save skipped for ${key}:`, err.message);
    }
    return Promise.resolve();
  }
  const sql = neon(process.env.DATABASE_URL);
  const version=Number(resourceVersions.get(key)||0);
  const rows=await sql`UPDATE noire_data SET value=${JSON.stringify(value)}::jsonb, updated_at=NOW(), version=version+1 WHERE key=${key} AND version=${version} RETURNING version`;
  if(rows.length){resourceVersions.set(key,Number(rows[0].version));return;}
  const inserted=await sql`INSERT INTO noire_data (key,value,updated_at,version) VALUES (${key},${JSON.stringify(value)}::jsonb,NOW(),0) ON CONFLICT (key) DO NOTHING RETURNING version`;
  if(inserted.length){resourceVersions.set(key,0);return;}
  const err=new Error(`${key} changed concurrently; reload and retry`);err.code='STORE_CONFLICT';throw err;
}


async function claimOrderAtomic(orderId, employeeId) {
  if (localMode || !process.env.DATABASE_URL) {
    const key=String(orderId);
    if (localClaimLocks.has(key)) return { claimed: false, reason: 'busy' };
    localClaimLocks.add(key);
    return { claimed: true };
  }
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`INSERT INTO noire_order_claims (order_id, employee_id) VALUES (${String(orderId)}, ${Number(employeeId)}) ON CONFLICT (order_id) DO NOTHING RETURNING order_id`;
  return { claimed: rows.length > 0 };
}

async function releaseOrderClaim(orderId) {
  const key=String(orderId);
  if (localMode || !process.env.DATABASE_URL) { localClaimLocks.delete(key); return; }
  const sql = neon(process.env.DATABASE_URL);
  await sql`DELETE FROM noire_order_claims WHERE order_id=${String(orderId)}`;
}


async function claimActiveShift(employeeId) {
  const key=String(employeeId);
  if (localMode || !process.env.DATABASE_URL) { if(localActiveShifts.has(key)) return {claimed:false}; localActiveShifts.add(key); return {claimed:true}; }
  const sql=neon(process.env.DATABASE_URL);
  const rows=await sql`INSERT INTO noire_active_shifts (employee_id) VALUES (${Number(employeeId)}) ON CONFLICT (employee_id) DO NOTHING RETURNING employee_id`;
  return {claimed:rows.length>0};
}
async function releaseActiveShift(employeeId) {
  const key=String(employeeId);
  if (localMode || !process.env.DATABASE_URL) { localActiveShifts.delete(key); return; }
  const sql=neon(process.env.DATABASE_URL);
  await sql`DELETE FROM noire_active_shifts WHERE employee_id=${Number(employeeId)}`;
}

async function reserveNumber(kind,min=1000,max=999999){
  if(localMode || !process.env.DATABASE_URL){ const used=localReservedNumbers.get(kind)||new Set(); const store=state||{}; if(kind==='order')for(const x of store.orders||[])used.add(Number(x.number)); else for(const x of store.reservations||[])used.add(Number(x.number)); localReservedNumbers.set(kind,used); for(let i=0;i<200;i++){const n=Math.floor(min+Math.random()*(max-min+1));if(!used.has(n)){used.add(n);return n;}} throw new Error('Number pool exhausted'); }
  const sql=neon(process.env.DATABASE_URL);
  for(let i=0;i<30;i++){const n=Math.floor(min+Math.random()*(max-min+1)); const rows=await sql`INSERT INTO noire_reserved_numbers(kind,number) VALUES(${String(kind)},${n}) ON CONFLICT DO NOTHING RETURNING number`; if(rows.length)return Number(rows[0].number);}
  throw new Error('Number pool temporarily unavailable');
}

function normalizedStoreQueries(sql, value) {
  const arrays = {
    orders: Array.isArray(value.orders) ? value.orders : [], reservations: Array.isArray(value.reservations) ? value.reservations : [],
    customers: Array.isArray(value.customers) ? value.customers : [], employees: Array.isArray(value.employees) ? value.employees : [],
    tables: Array.isArray(value.tables) ? value.tables : [], shifts: Array.isArray(value.shifts) ? value.shifts : []
  };
  const queries=[sql`DELETE FROM noire_orders`,sql`DELETE FROM noire_reservations`,sql`DELETE FROM noire_customers`,sql`DELETE FROM noire_employees`,sql`DELETE FROM noire_tables`,sql`DELETE FROM noire_shifts`];
  for(const x of arrays.orders) queries.push(sql`INSERT INTO noire_orders(id,number,payload) VALUES(${Number(x.id)},${Number(x.number)||null},${JSON.stringify(x)}::jsonb) ON CONFLICT(id) DO UPDATE SET number=EXCLUDED.number,payload=EXCLUDED.payload,updated_at=NOW()`);
  for(const x of arrays.reservations) queries.push(sql`INSERT INTO noire_reservations(id,number,payload) VALUES(${Number(x.id)},${Number(x.number)||null},${JSON.stringify(x)}::jsonb) ON CONFLICT(id) DO UPDATE SET number=EXCLUDED.number,payload=EXCLUDED.payload,updated_at=NOW()`);
  for(const x of arrays.customers) queries.push(sql`INSERT INTO noire_customers(id,phone,email,payload) VALUES(${Number(x.id)},${String(x.phone||'')},${String(x.email||'')||null},${JSON.stringify(x)}::jsonb) ON CONFLICT(id) DO UPDATE SET phone=EXCLUDED.phone,email=EXCLUDED.email,payload=EXCLUDED.payload,updated_at=NOW()`);
  for(const x of arrays.employees) queries.push(sql`INSERT INTO noire_employees(id,username,role,active,payload) VALUES(${Number(x.id)},${String(x.username||'')||null},${String(x.role||'')||null},${x.active!==false},${JSON.stringify(x)}::jsonb) ON CONFLICT(id) DO UPDATE SET username=EXCLUDED.username,role=EXCLUDED.role,active=EXCLUDED.active,payload=EXCLUDED.payload,updated_at=NOW()`);
  for(const x of arrays.tables) queries.push(sql`INSERT INTO noire_tables(id,payload) VALUES(${Number(x.id)},${JSON.stringify(x)}::jsonb) ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=NOW()`);
  for(const x of arrays.shifts) queries.push(sql`INSERT INTO noire_shifts(id,employee_id,date,start_time,end_time,status,payload) VALUES(${Number(x.id)},${Number(x.employeeId)||null},${String(x.date||'')||null},${String(x.start||'')||null},${String(x.end||'')||null},${String(x.status||'')||null},${JSON.stringify(x)}::jsonb) ON CONFLICT(id) DO UPDATE SET employee_id=EXCLUDED.employee_id,date=EXCLUDED.date,start_time=EXCLUDED.start_time,end_time=EXCLUDED.end_time,status=EXCLUDED.status,payload=EXCLUDED.payload,updated_at=NOW()`);
  return queries;
}
async function syncNormalizedStore(sql, value) { const queries=normalizedStoreQueries(sql,value); if(queries.length) await sql.transaction(queries); }

async function appendAuditLog(log) {
  if (localMode || !process.env.DATABASE_URL) {
    auditLogs = auditLogs || [];
    auditLogs.push(log);
    if (auditLogs.length > 5000) auditLogs.splice(0, auditLogs.length - 5000);
    return saveAuditLogs(auditLogs);
  }
  const sql = neon(process.env.DATABASE_URL);
  await sql`INSERT INTO noire_audit_logs(id,at,actor_id,actor_role,actor,action,entity,entity_id,meta) VALUES(${String(log.id)},${String(log.at)},${log.actorId==null?null:String(log.actorId)},${String(log.actorRole||'public')},${String(log.actor||'public')},${String(log.action)},${String(log.entity)},${log.entityId==null?null:String(log.entityId)},${JSON.stringify(log.meta||{})}::jsonb) ON CONFLICT(id) DO NOTHING`;
  auditLogs = auditLogs || [];
  auditLogs.push(log);
  if (auditLogs.length > 5000) auditLogs.splice(0, auditLogs.length - 5000);
}

async function cleanupIdempotency() {
  if (localMode || !process.env.DATABASE_URL) {
    const cutoff=Date.now()-24*60*60*1000; for(const [k,v] of localIdempotency) if(v.createdAt<cutoff)localIdempotency.delete(k); return;
  }
  const sql=neon(process.env.DATABASE_URL); await sql`DELETE FROM noire_idempotency WHERE created_at < NOW() - INTERVAL '24 hours'`; await sql`DELETE FROM noire_rate_limits WHERE window_started < NOW() - INTERVAL '1 day'`;
}

async function checkRateLimit(scope, clientKey, windowMs, max) {
  const key=`${scope}:${clientKey}`; const now=Date.now();
  if(localMode || !process.env.DATABASE_URL){ let b=localRateBuckets.get(key); if(!b||b.reset<now)b={count:0,reset:now+windowMs}; b.count++; localRateBuckets.set(key,b); return {allowed:b.count<=max,count:b.count}; }
  const sql=neon(process.env.DATABASE_URL); const windowSec=Math.max(1,Math.ceil(windowMs/1000));
  const rows=await sql`INSERT INTO noire_rate_limits(scope,client_key,window_started,request_count) VALUES(${String(scope)},${String(clientKey)},NOW(),1) ON CONFLICT(scope,client_key) DO UPDATE SET window_started=CASE WHEN noire_rate_limits.window_started <= NOW() - make_interval(secs => ${windowSec}) THEN NOW() ELSE noire_rate_limits.window_started END, request_count=CASE WHEN noire_rate_limits.window_started <= NOW() - make_interval(secs => ${windowSec}) THEN 1 ELSE noire_rate_limits.request_count+1 END RETURNING request_count`;
  const count=Number(rows[0]?.request_count||0); return {allowed:count<=max,count};
}

async function saveStore(value) {
  if (localMode || !process.env.DATABASE_URL) { state = value; return save('store', value); }
  const sql = neon(process.env.DATABASE_URL);
  const queries=[sql`UPDATE noire_data SET value=${JSON.stringify(value)}::jsonb, updated_at=NOW(), version=version+1 WHERE key='store' AND version=${storeVersion} RETURNING version`,...normalizedStoreQueries(sql,value)];
  const result=await sql.transaction(queries); const rows=result[0];
  if (!rows?.length) { const err=new Error('Store changed concurrently; reload and retry'); err.code='STORE_CONFLICT'; throw err; }
  storeVersion=Number(rows[0].version); state=value;
}
function saveGallery(value) { gallery = value; return save('gallery', value); }
function saveMenu(value) { menu = value; return save('menu', value); }
function saveHistory(value) { history = value; return save('history', value); }

async function saveArchiveAndStore(nextHistory, nextStore) {
  if (localMode || !process.env.DATABASE_URL) {
    history = nextHistory;
    state = nextStore;
    await save('history', nextHistory);
    await save('store', nextStore);
    return;
  }
  const sql = neon(process.env.DATABASE_URL);
  const queries = [
    sql`UPDATE noire_data SET value=${JSON.stringify(nextStore)}::jsonb, updated_at=NOW(), version=version+1 WHERE key='store' AND version=${storeVersion} RETURNING version`,
    sql`UPDATE noire_data SET value=${JSON.stringify(nextHistory)}::jsonb, updated_at=NOW(), version=version+1 WHERE key='history' AND version=${Number(resourceVersions.get('history')||0)} RETURNING version`,
    ...normalizedStoreQueries(sql,nextStore)
  ];
  const [storeRows, historyRows] = await sql.transaction(queries);
  if (resourceVersions.has('history') && !historyRows?.length) { const err=new Error('history changed concurrently; reload and retry'); err.code='STORE_CONFLICT'; throw err; }
  if (!storeRows?.length) {
    const err = new Error('Store changed concurrently; reload and retry');
    err.code = 'STORE_CONFLICT';
    throw err;
  }
  storeVersion = Number(storeRows[0].version);
  state = nextStore;
  history = nextHistory;
  resourceVersions.set('history', Number(historyRows?.[0]?.version ?? resourceVersions.get('history') ?? 0));
}
function saveAuditLogs(value) { auditLogs = value; return save('audit_logs', value); }


async function claimIdempotent(scope, key) {
  if (!key) return {claimed:true};
  const k=`${scope}:${key}`;
  if (localMode || !process.env.DATABASE_URL) {
    const now=Date.now(), row=localIdempotency.get(k);
    if(!row || row.createdAt<now-24*60*60*1000){ localIdempotency.set(k,{response:{pending:true},createdAt:now}); return {claimed:true}; }
    if(row.response?.pending===true && row.createdAt<now-5*60*1000){ localIdempotency.set(k,{response:{pending:true},createdAt:now}); return {claimed:true}; }
    return {claimed:false,response:row.response||null};
  }
  const sql = neon(process.env.DATABASE_URL);
  const inserted = await sql`INSERT INTO noire_idempotency(scope,idempotency_key,response) VALUES(${String(scope)},${String(key)},{"pending":true}::jsonb) ON CONFLICT (scope,idempotency_key) DO NOTHING RETURNING response`;
  if (inserted.length) return {claimed:true};
  const rows = await sql`SELECT response,created_at FROM noire_idempotency WHERE scope=${String(scope)} AND idempotency_key=${String(key)}`;
  const row=rows[0];
  if(row && row.response && row.response.pending===true && new Date(row.created_at).getTime() < Date.now()-5*60*1000){ await sql`DELETE FROM noire_idempotency WHERE scope=${String(scope)} AND idempotency_key=${String(key)}`; return claimIdempotent(scope,key); }
  return {claimed:false,response:row?.response||null};
}
async function getIdempotent(scope, key) {
  if (!key) return null; const k=`${scope}:${key}`;
  if (localMode || !process.env.DATABASE_URL) { const row=localIdempotency.get(k); return row && row.createdAt>Date.now()-24*60*60*1000 ? row.response : null; }
  const sql = neon(process.env.DATABASE_URL); const rows = await sql`SELECT response FROM noire_idempotency WHERE scope=${String(scope)} AND idempotency_key=${String(key)} AND created_at > NOW() - INTERVAL '24 hours'`; return rows[0]?.response || null;
}
async function putIdempotent(scope, key, response) {
  if (!key) return; const k=`${scope}:${key}`;
  if (localMode || !process.env.DATABASE_URL) { localIdempotency.set(k,{response,createdAt:Date.now()}); return; }
  const sql = neon(process.env.DATABASE_URL); await sql`UPDATE noire_idempotency SET response=${JSON.stringify(response)}::jsonb WHERE scope=${String(scope)} AND idempotency_key=${String(key)}`;
}
module.exports = { ready, getStore, getGallery, getMenu, getHistory, getAuditLogs, saveStore, saveAuditLogs, saveGallery, saveMenu, saveHistory, saveArchiveAndStore, reserveNumber, claimOrderAtomic, releaseOrderClaim, claimActiveShift, releaseActiveShift, claimIdempotent, getIdempotent, putIdempotent, appendAuditLog, cleanupIdempotency, checkRateLimit, syncNormalizedStore };
