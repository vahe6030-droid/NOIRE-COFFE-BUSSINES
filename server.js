const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { put: blobPut, del: blobDel } = require('@vercel/blob');

// Lightweight .env loader: keeps API keys server-side without adding another dependency.
(function loadLocalEnv(){
  const envFile=path.join(__dirname,'.env');
  try{
    if(!fs.existsSync(envFile)) return;
    for(const raw of fs.readFileSync(envFile,'utf8').split(/\r?\n/)){
      const line=raw.trim();
      if(!line || line.startsWith('#')) continue;
      const eq=line.indexOf('=');
      if(eq<1) continue;
      const key=line.slice(0,eq).trim();
      const value=line.slice(eq+1).trim().replace(/^['"]|['"]$/g,'');
      if(key && process.env[key]===undefined) process.env[key]=value;
    }
  }catch(err){ console.warn('NOIRÉ .env load skipped:',err.message); }
})();

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const VIEWS = path.join(ROOT, 'views');
const DATA_DIR = path.join(ROOT, 'data');
const DATA = path.join(DATA_DIR, 'store.json');
const MENU = path.join(ROOT, 'public', 'menu.json');
const GALLERY = path.join(DATA_DIR, 'gallery.json');

app.disable('x-powered-by');
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com; connect-src 'self' https:; frame-src https://translate.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"); next();});
function rateLimit(key, windowMs=15*60*1000, max=100){return async (req,res,next)=>{try{await db.ready();const client=String(req.ip||req.headers['x-forwarded-for']||req.headers['x-real-ip']||'unknown').split(',')[0].trim().slice(0,120);const r=await db.checkRateLimit(key,client,windowMs,max);if(!r.allowed)return res.status(429).json({success:false,message:'Слишком много запросов. Повторите позже.'});if(Math.random()<0.01)await db.cleanupIdempotency();next();}catch(err){console.error('NOIRE rate limit error:',err.message);if(process.env.NODE_ENV==='production')return res.status(503).json({success:false,message:'Сервис временно недоступен'});next();}};}
app.use(express.json({ limit: '8mb' }));
app.use((req,res,next)=>{if(['POST','PUT','PATCH','DELETE'].includes(req.method)&&req.path.startsWith('/api/')&&req.headers.cookie){const origin=req.headers.origin||'';const hostHeader=req.headers['x-forwarded-host']||req.get('host');const proto=req.headers['x-forwarded-proto']||req.protocol;const host=`${proto}://${hostHeader}`;if(origin&&origin!==host)return res.status(403).json({success:false,message:'Некорректный источник запроса'});}next();});
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(ROOT, 'public')));

// Vercel serverless instances load persistent state from Postgres before any API route runs.
app.use(async (req, res, next) => {
  try { await db.ready(); next(); }
  catch (err) { console.error('NOIRÉ database error:', err); res.status(503).json({ success:false, message:'База данных не настроена или временно недоступна' }); }
});

const fallbackStore = () => ({
  orders: [], reservations: [], customers: [],
  tables: defaultTables(),
  settings: { siteName: 'NOIRÉ COFFEE', siteSubtitle: 'COFFEE & KITCHEN', language: 'ru' },
  employees: [],
  shifts: [],
  admin: { username: process.env.NOIRE_ADMIN_USER || '', passwordHash: '', role: 'owner', sessionVersion: 0 }
});

function defaultTables() {
  return [
    { id: 1, name: 'T01', seats: 2, zone: 'Window', x: 12, y: 18, status: 'available' },
    { id: 2, name: 'T02', seats: 2, zone: 'Window', x: 34, y: 18, status: 'available' },
    { id: 3, name: 'T03', seats: 4, zone: 'Main Hall', x: 56, y: 18, status: 'available' },
    { id: 4, name: 'T04', seats: 4, zone: 'Main Hall', x: 78, y: 18, status: 'available' },
    { id: 5, name: 'T05', seats: 6, zone: 'Main Hall', x: 20, y: 52, status: 'available' },
    { id: 6, name: 'T06', seats: 6, zone: 'Main Hall', x: 50, y: 52, status: 'available' },
    { id: 7, name: 'T07', seats: 8, zone: 'Lounge', x: 80, y: 52, status: 'available' },
    { id: 8, name: 'T08', seats: 2, zone: 'Lounge', x: 28, y: 82, status: 'available' },
    { id: 9, name: 'T09', seats: 4, zone: 'Lounge', x: 58, y: 82, status: 'available' }
  ];
}

function readStore() {
  const store=db.getStore();
  if(store && !store.__statusesNormalized){
    for(const o of store.orders||[]) o.status=normalizeStoredStatus(o.status,'order');
    for(const r of store.reservations||[]) r.status=normalizeStoredStatus(r.status,'booking');
    Object.defineProperty(store,'__statusesNormalized',{value:true,enumerable:false,writable:true});
  }
  return store;
}
function saveStore(store) { return db.saveStore(store); }
function readMenu() { return db.getMenu(); }
function saveMenu(menu) { return db.saveMenu(menu); }
function readGallery() { return db.getGallery(); }
function saveGallery(gallery) { return db.saveGallery(gallery); }
async function audit(req,action,entity,entityId,meta={}){const log={id:`${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,at:new Date().toISOString(),actorId:req?.staff?.id||null,actorRole:req?.staff?.role||'public',actor:req?.staff?.username||'public',action,entity,entityId:entityId??null,meta}; try{await db.appendAuditLog(log);}catch(err){console.error('NOIRE audit log failed:',err.message);if(process.env.NODE_ENV==='production'){const e=new Error('Audit log persistence failed');e.code='AUDIT_FAILURE';throw e;}}}

function page(name) { return path.join(VIEWS, name); }

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

// Stateless signed sessions. Vercel may execute each request on a different instance,
// so an in-memory Map cannot be used for authentication. The browser only stores the
// signed token; the role is accepted only after its HMAC signature is verified.
const SESSION_TTL = 1000 * 60 * 60 * 24 * 2;
function sessionSecret() {
  const value=String(process.env.NOIRE_SESSION_SECRET || process.env.SESSION_SECRET || '');
  if(process.env.NODE_ENV==='production' && value.length<32) throw new Error('NOIRE_SESSION_SECRET must be at least 32 characters in production');
  return value || 'noire-dev-session-secret-change-me';
}
function b64url(value) { return Buffer.from(value).toString('base64url'); }
function issueSession(_unused, user) {
  const payload = { ...user, tokenVersion: Number(user.tokenVersion||0), jti: crypto.randomBytes(16).toString('hex'), iat: Date.now(), exp: Date.now() + SESSION_TTL };
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function getSession(token) {
  try {
    const [body, sig] = String(token || '').split('.');
    if (!body || !sig) return null;
    const expected = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url');
    const a = Buffer.from(sig); const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}
function getSessionCookie(req){const cookies={};String(req.headers.cookie||'').split(';').forEach(x=>{const i=x.indexOf('=');if(i>0)cookies[x.slice(0,i).trim()]=decodeURIComponent(x.slice(i+1).trim())});return cookies.noire_session||'';}
function setSessionCookie(res,token){const secure=process.env.NODE_ENV==='production'?'; Secure':'';res.setHeader('Set-Cookie',`noire_session=${encodeURIComponent(token)}; Path=/; Max-Age=${Math.floor(SESSION_TTL/1000)}; HttpOnly; SameSite=Strict${secure}`);}
function clearSessionCookie(res){const secure=process.env.NODE_ENV==='production'?'; Secure':'';res.setHeader('Set-Cookie',`noire_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure}`);}
function adminAuth(req, res, next) {
  const session = getSession(getSessionCookie(req));
  if (!session || !session.role || !session.username) return res.status(401).json({ success: false, message: 'Нет доступа' });
  const store=readStore();
  const account = (store.employees||[]).find(e=>Number(e.id)===Number(session.id)) || (store.admin && (String(session.id)==='owner' || String(store.admin.username).toLowerCase()===String(session.username).toLowerCase()) ? store.admin : null);
  if(!account || account.active===false) return res.status(401).json({success:false,message:'Сессия завершена'});
  const role=account===store.admin?'owner':canonicalRole(account.role);
  if (Number(session.tokenVersion||0) !== Number(account.sessionVersion||0)) return res.status(401).json({success:false,message:'Сессия завершена'});
  if(!rolePermissions[role]) return res.status(403).json({success:false,message:'Роль не поддерживается'});
  req.staff={...session,id:account.id||'owner',username:account.username,role,name:account.name||session.name||'Owner'}; next();
}
const rolePermissions = {
  owner: ['all'], director: ['all'], administrator: ['dashboard','orders','bookings','menu','analytics','customers','settings','employees','schedule','ai','history'],
  manager: ['dashboard','orders','bookings','menu','schedule','ai'], waiter: ['dashboard','orders','bookings'], cook: ['dashboard','orders'], delivery: ['dashboard','orders']
};
const roleRank={owner:100,director:90,administrator:80,manager:60,waiter:40,cook:40,delivery:40};
function canonicalRole(role){return String(role||'').toLowerCase()==='kitchen'?'cook':String(role||'').toLowerCase();}
function can(role, permission) { const p=rolePermissions[canonicalRole(role)]||[]; return p.includes('all') || p.includes(permission); }
function canManageRole(actor,target){const a=canonicalRole(actor),t=canonicalRole(target);if(!rolePermissions[t]||t==='owner')return false;return (roleRank[a]||0)>(roleRank[t]||0) || a==='owner';}
function requirePermission(permission) { return (req,res,next)=>can(req.staff.role,permission)?next():res.status(403).json({success:false,message:'Недостаточно прав'}); }
function hashPassword(password, salt=crypto.randomBytes(16).toString('hex')) { return `${salt}:${crypto.pbkdf2Sync(String(password),salt,120000,64,'sha512').toString('hex')}`; }
function verifyPassword(password, stored) {
  if (!stored || !String(stored).includes(':')) return String(password) === String(stored);
  const [salt, hash] = String(stored).split(':');
  const actual=crypto.pbkdf2Sync(String(password),salt,120000,64,'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(hash,'hex'));
}
function publicCustomer(c){ const {passwordHash,password,resetCode,resetCodeHash,resetCodeExpires,resetAttempts,...safe}=c; return {...safe, firstName:safe.firstName||String(safe.name||'').trim().split(/\s+/)[0]||'', lastName:safe.lastName||'', middleName:safe.middleName||''}; }

app.get('/', (_, res) => res.sendFile(page('index.html')));
// Dedicated admin panel URL.
app.get('/admin', (_, res) => res.sendFile(page('admin.html')));
app.get('/admin.html', (_, res) => res.redirect('/admin'));
for (const name of ['menu','reservation','checkout','about','contacts','gallery','login','register','account']) {
  app.get(`/${name}.html`, (_, res) => res.sendFile(page(`${name}.html`)));
}

app.get('/api/menu', (_, res) => res.json(readMenu()));
app.get('/api/gallery', (_, res) => res.json(readGallery()));
app.get('/api/tables', (_, res) => res.json(readStore().tables));
const RESERVATION_DURATION_MINUTES = Math.max(15, Math.min(240, Number(process.env.NOIRE_RESERVATION_DURATION_MINUTES || 90)));
function timeToMinutes(t){const m=String(t||'').match(/^(\d{2}):(\d{2})$/);if(!m)return null;const h=Number(m[1]),mi=Number(m[2]);return h<=23&&mi<=59&&mi%15===0?h*60+mi:null;}
function reservationOverlaps(startA,startB){const a=timeToMinutes(startA),b=timeToMinutes(startB);if(a===null||b===null)return false;return a < b + RESERVATION_DURATION_MINUTES && b < a + RESERVATION_DURATION_MINUTES;}
function restaurantNow(){const tz=process.env.NOIRE_TIMEZONE||'Asia/Yerevan';const parts=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const out={};for(const p of parts)if(p.type!=='literal')out[p.type]=p.value;return out;}
function isValidDateTime(date,time){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||timeToMinutes(time)===null)return false;const now=restaurantNow();const today=`${now.year}-${now.month}-${now.day}`;if(date<today)return false;if(date>today)return true;return timeToMinutes(time)>=(Number(now.hour)*60+Number(now.minute)+1);}
function isTableAvailable(store,tableId,date,time,excludeId=null){if(!tableId)return true;if(timeToMinutes(time)===null)return false;return !store.reservations.some(r=>Number(r.tableId)===Number(tableId)&&String(r.id)!==String(excludeId||'')&&r.date===date&&!['cancelled','completed'].includes(normalizeStatus(r.status))&&reservationOverlaps(r.time,time));}
app.get('/api/tables/availability', (req,res)=>{ const s=readStore(); const date=String(req.query.date||''); const time=String(req.query.time||''); const blocked=(s.tables||[]).map(t=>Number(t.id)).filter(id=>!isTableAvailable(s,id,date,time)); res.json({success:true,blocked}); });

function normalizeItems(items) {
  const menu = readMenu();
  const map = new Map(menu.map(item => [Number(item.id), item]));
  if (!Array.isArray(items)) return [];
  return items.map(i => {
    const product = map.get(Number(i.id));
    if (!product) return null;
    const quantity = Math.max(1, Math.min(50, Number(i.quantity) || 1));
    return { ...product, quantity };
  }).filter(Boolean);
}
function calcTotal(items) { return items.reduce((s, i) => s + Number(i.price) * i.quantity, 0); }

function businessParts(value=new Date()) {
  const tz=process.env.NOIRE_TIMEZONE||'Asia/Yerevan';
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime())) return {};
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',weekday:'short',hourCycle:'h23'}).formatToParts(date);
  const out={}; for(const p of parts) if(p.type!=='literal') out[p.type]=p.value; return out;
}
function dateKeyLocal(value=new Date()) { const p=businessParts(value); return p.year?`${p.year}-${p.month}-${p.day}`:''; }
function periodStartDateKey(period, now=new Date()) {
  const p=businessParts(now); const d=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)));
  if(period==='week'){ const wd=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()-(wd-1)); }
  else if(period==='month') d.setUTCDate(1);
  else if(period==='year'){ d.setUTCMonth(0,1); }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}
function orderBelongsToPeriod(order, period, now=new Date()) {
  const createdKey=dateKeyLocal(new Date(order.createdAt||0)); if(!createdKey)return false;
  const today=dateKeyLocal(now), start=periodStartDateKey(period,now);
  if(period==='day') return createdKey===today;
  return createdKey>=start && createdKey<=today;
}
function orderStats(orders, period) {
  const filtered=orders.filter(o=>orderBelongsToPeriod(o,period));
  const billable=new Set(['completed','delivered']);
  const revenue=filtered.filter(o=>billable.has(normalizeStatus(o.status))).reduce((sum,o)=>sum+Number(o.total||0),0);
  return { revenue, orders: filtered.length, avgCheck: filtered.length ? Math.round(revenue/filtered.length) : 0 };
}
function employeeStats(store, employeeId) {
  const e=(store.employees||[]).find(x=>Number(x.id)===Number(employeeId)); const role=canonicalRole(e?.role); const field=role==='waiter'?'waiterId':role==='delivery'?'deliveryId':role==='cook'?'kitchenId':null; const orders = field ? store.orders.filter(o=>Number(o[field])===Number(employeeId)) : store.orders.filter(o=>[o.employeeId,o.staffId].some(id=>Number(id)===Number(employeeId)));
  const completed = orders.filter(o => ['completed','delivered','доставлен','завершен','завершён'].includes(normalizeStatus(o.status)));
  const statsFor=period=>{const now=new Date();const filtered=completed.filter(o=>orderBelongsToPeriod({...o,createdAt:o.completedAt||o.createdAt},period));const revenue=filtered.reduce((a,o)=>a+Number(o.total||0),0);return {revenue,orders:filtered.length,avgCheck:filtered.length?Math.round(revenue/filtered.length):0};};
  const allRevenue=completed.reduce((a,o)=>a+Number(o.total||0),0);
  return { day:statsFor('day'), week:statsFor('week'), month:statsFor('month'), year:statsFor('year'), all:{revenue:allRevenue,orders:completed.length,avgCheck:completed.length?Math.round(allRevenue/completed.length):0}, assigned: orders.length, completed: completed.length };
}
function employeePublic(e, store) {
  const stats = employeeStats(store, e.id);
  const shiftStart=e.shiftStartedAt?Date.parse(e.shiftStartedAt):NaN; const shiftEnd=e.shiftActive?Date.now():(e.shiftEndedAt?Date.parse(e.shiftEndedAt):NaN);
  const erole=canonicalRole(e.role), assignedField=erole==='waiter'?'waiterId':erole==='delivery'?'deliveryId':erole==='cook'?'kitchenId':null; const shiftOrders=store.orders.filter(o=>Number(assignedField?o[assignedField]:(o.employeeId||o.staffId))===Number(e.id)&&['completed','delivered','доставлен','завершен','завершён'].includes(normalizeStatus(o.status))&&Number.isFinite(shiftStart)&&new Date(o.completedAt||o.createdAt).getTime()>=shiftStart&&(!Number.isFinite(shiftEnd)||new Date(o.completedAt||o.createdAt).getTime()<=shiftEnd));
  return { id:e.id, name:e.name, firstName:e.firstName||'', lastName:e.lastName||'', middleName:e.middleName||'', username:e.username, role:canonicalRole(e.role), email:e.email||'', phone:e.phone||'', photo:e.photo||'', active:e.active!==false, shiftActive:!!e.shiftActive, shiftStartedAt:e.shiftStartedAt||null, shiftEndedAt:e.shiftEndedAt||null, lastShiftMinutes:Number(e.lastShiftMinutes||0), shiftHistory:Array.isArray(e.shiftHistory)?e.shiftHistory.slice(-50).reverse():[], stats, shiftStats:{orders:shiftOrders.length,revenue:shiftOrders.reduce((a,o)=>a+Number(o.total||0),0)} };
}
function roleLabel(role) { return ({owner:'Owner',director:'Director',administrator:'Administrator',manager:'Manager',waiter:'Waiter',cook:'Cook',delivery:'Courier'})[canonicalRole(role)] || role; }
function normalizeStatus(value) { return String(value||'').trim().toLowerCase(); }
function assignedEmployeeId(order, role) { if(role==='waiter') return order.waiterId ?? (order.employeeRole==='waiter'?order.employeeId:null); if(role==='delivery') return order.deliveryId ?? (order.employeeRole==='delivery'?order.employeeId:null); if(role==='cook') return order.kitchenId ?? (['kitchen','cook'].includes(canonicalRole(order.employeeRole))?order.employeeId:null); return order.employeeId ?? null; }
function validateOrderStatusTransition(actorRole,currentValue,nextValue){
  const actor=canonicalRole(actorRole), current=normalizeStatus(currentValue), next=normalizeStatus(nextValue);
  if(['completed','cancelled'].includes(current) && next!==current) return 'Завершённый или отменённый заказ нельзя вернуть в работу';
  const allowed=actor==='waiter'?['confirmed','completed','cancelled']:actor==='delivery'?['confirmed','preparing','ready','in_transit','completed','cancelled']:actor==='cook'?['preparing','ready','completed','cancelled']:['new','confirmed','preparing','ready','in_transit','arrived','completed','cancelled'];
  if(!allowed.includes(next)) return 'Недопустимый статус для этой роли';
  if(actor==='cook' && next==='ready' && !['preparing','ready'].includes(current)) return 'Повар должен сначала перевести заказ в «Готовится»';
  if(actor==='cook' && next==='completed' && !['ready','completed'].includes(current)) return 'Повар может завершить только готовый заказ';
  if(actor==='waiter' && next==='completed' && !['confirmed','arrived','completed'].includes(current)) return 'Официант может завершить только подтверждённый заказ';
  return null;
}
function normalizeStoredStatus(value, kind='order') { const v=normalizeStatus(value); const map=kind==='booking'?{ 'новая':'new','новый':'new','подтверждена':'confirmed','подтверждено':'confirmed','пришел':'arrived','пришла':'arrived','завершена':'completed','отменена':'cancelled'}:{'принят':'confirmed','новый':'new','новая':'new','готовится':'preparing','готов':'ready','в пути':'in_transit','доставлен':'completed','завершен':'completed','завершён':'completed','отменен':'cancelled','отменён':'cancelled'}; return map[v]||v; }
function tableSnapshot(store, dateKey=dateKeyLocal(new Date()), time='') {
  const now=restaurantNow();
  const target = time || `${now.hour}:${String(Math.floor(Number(now.minute)/15)*15).padStart(2,'0')}`;
  return store.tables.map(t => {
    const manual = ['occupied','service'].includes(normalizeStatus(t.status)) ? normalizeStatus(t.status) : null;
    const reservations = store.reservations.filter(r => r.date === dateKey && Number(r.tableId) === Number(t.id) && !['cancelled','completed'].includes(normalizeStatus(r.status)));
    const exact = reservations.find(r => r.time === target);
    const near = reservations.find(r => r.time && reservationOverlaps(r.time,target));
    const activeOrder = store.orders.find(o => Number(o.tableId) === Number(t.id) && !['completed','cancelled'].includes(normalizeStatus(o.status)) && dateKeyLocal(new Date(o.createdAt||0))===dateKey && (()=>{const p=businessParts(new Date(o.createdAt||0)); const om=Number(p.hour)*60+Number(p.minute); const tm=timeToMinutes(target); return tm===null || om<=tm;})());
    const status = manual === 'service' ? 'service' : manual === 'occupied' ? 'occupied' : (activeOrder ? 'occupied' : (exact || near ? 'reserved' : 'available'));
    return { ...t, computedStatus: status, reservation: exact || near || null, activeOrder: activeOrder || null };
  });
}
function analyticsSnapshot(store, menu) {
  const periods = { day:orderStats(store.orders,'day'), week:orderStats(store.orders,'week'), month:orderStats(store.orders,'month'), year:orderStats(store.orders,'year') };
  const byItem={}; const byCategory={};
  const billable=new Set(['completed','delivered']);
  store.orders.filter(o=>billable.has(normalizeStatus(o.status))).forEach(o => (o.items||[]).forEach(i => { const q=Number(i.quantity||1); byItem[i.name]=(byItem[i.name]||0)+q; byCategory[i.category||'other']=(byCategory[i.category||'other']||0)+q; }));
  const topItems=Object.entries(byItem).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name,quantity])=>({name,quantity}));
  const topCategories=Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([category,quantity])=>({category,quantity}));
  const days=[]; const now=new Date();
  for(let i=13;i>=0;i--){ const d=new Date(now); d.setDate(d.getDate()-i); const key=dateKeyLocal(d); const os=store.orders.filter(o=>dateKeyLocal(o.completedAt||o.createdAt)===key && ['completed','delivered'].includes(normalizeStatus(o.status))); const revenue=os.reduce((a,o)=>a+Number(o.total||0),0); days.push({date:key,label:`${String(Number(key.slice(8,10))).padStart(2,'0')}.${key.slice(5,7)}`,orders:os.length,revenue}); }
  return {periods,topItems,topCategories,days};
}
function upsertCustomer(store, customer) {
  if (!customer?.phone) return;
  const found = store.customers.find(c => c.phone === customer.phone);
  if (found) { found.name = customer.name || found.name; if(customer.email) found.email=String(customer.email).trim(); for(const k of ['address','entrance','floor']) if(customer[k]!==undefined) found[k]=String(customer[k]||'').trim(); if(customer.firstName!==undefined) found.firstName=String(customer.firstName||'').trim(); if(customer.lastName!==undefined) found.lastName=String(customer.lastName||'').trim(); if(customer.middleName!==undefined) found.middleName=String(customer.middleName||'').trim(); found.lastSeenAt = new Date().toISOString(); return; }
  // Keep guest contacts useful for the admin CRM, but mark them as unregistered.
  // A later registration with the same phone/email can safely upgrade this record.
  store.customers.push({ id: Date.now(), name: customer.name || '', firstName: customer.firstName || '', lastName: customer.lastName || '', middleName: customer.middleName || '', email: customer.email || '', phone: customer.phone, address: customer.address || '', entrance: customer.entrance || '', floor: customer.floor || '', registered: false, createdAt: new Date().toISOString() });
}

function optionalCustomer(req) {
  const session = getSession(getSessionCookie(req));
  if (!session || session.role !== 'customer') return null;
  const store = readStore();
  return store.customers.find(c => Number(c.id) === Number(session.id)) || null;
}

app.post('/api/orders', rateLimit('public-orders',15*60*1000,30), async (req, res) => {
  const store = readStore();
  const customer = req.body.customer || {};
  const items = normalizeItems(req.body.items);
  const idemKey=String(req.headers['idempotency-key']||'').trim();
  if(idemKey.length>128) return res.status(400).json({success:false,message:'Некорректный Idempotency-Key'});
  if (!customer.name || !customer.phone || !String(customer.address||'').trim()) return res.status(400).json({ success:false, message:'Для доставки укажите имя, телефон и адрес' });
  if(String(customer.name).trim().length<2 || String(customer.name).trim().length>120) return res.status(400).json({success:false,message:'Некорректное имя'});
  if(!validPhone(customer.phone)) return res.status(400).json({success:false,message:'Некорректный номер телефона'});
  if(String(customer.address||'').trim().length>300 || String(customer.comment||'').trim().length>1000 || String(customer.entrance||'').trim().length>30 || String(customer.floor||'').trim().length>20) return res.status(400).json({success:false,message:'Слишком длинный адрес или комментарий'}); if(customer.email && !validEmail(customer.email)) return res.status(400).json({success:false,message:'Некорректный email'}); if(customer.payment && !['card','cash'].includes(String(customer.payment).toLowerCase())) return res.status(400).json({success:false,message:'Недопустимый способ оплаты'});
  if (!items.length) return res.status(400).json({ success:false, message:'Корзина пуста или содержит недоступные позиции' });
  const total = calcTotal(items);
  const signedCustomer = optionalCustomer(req);
  if(signedCustomer && customer.phone && String(customer.phone).replace(/\s+/g,'') !== String(signedCustomer.phone||'').replace(/\s+/g,'')) return res.status(403).json({success:false,message:'Телефон заказа не совпадает с аккаунтом'});
  const idem=await db.claimIdempotent('public-order',idemKey); if(!idem.claimed){ if(idem.response?.pending)return res.status(409).json({success:false,message:'Заказ с этим запросом уже оформляется'}); return res.json(idem.response); }
  const order = {
    id: Date.now()+Math.floor(Math.random()*1000), number: await db.reserveNumber('order'), customer: {name:String(customer.name||'').trim(),phone:String(customer.phone||'').replace(/\s+/g,''),email:String(customer.email||'').trim(),comment:String(customer.comment||'').trim(),address:String(customer.address||'').trim(),entrance:String(customer.entrance||'').trim(),floor:String(customer.floor||'').trim(),deliveryTime:String(customer.deliveryTime||'').trim(),payment:String(customer.payment||'').toLowerCase()},
    items, total, budget: Math.max(0,Number(req.body.budget)||0), tableId: null,
    orderType: 'delivery', status: 'new', employeeId:null, waiterId:null, deliveryId:null, kitchenId:null, customerId: signedCustomer ? Number(signedCustomer.id) : null, createdAt: new Date().toISOString()
  };
  store.orders.push(order); upsertCustomer(store, customer); await saveStore(store);
  const safeOrder = signedCustomer ? order : { id: order.id, number: order.number, status: order.status, createdAt: order.createdAt };
  const response={ success:true, order:safeOrder }; await db.putIdempotent('public-order',idemKey,response); res.json(response);
});

app.post('/api/reservations', rateLimit('public-reservations',15*60*1000,20), async (req, res) => {
  const store = readStore();
  const { name, phone, date, time, guests, occasion, comment, budget } = req.body;
  const tableId = Number(req.body.tableId) || null;
  if (!name || !phone || !date || !time || !guests) return res.status(400).json({ success:false, message:'Заполните имя, телефон, дату, время и количество гостей' });
  if(String(name).trim().length<2 || String(name).trim().length>120 || !validPhone(phone)) return res.status(400).json({success:false,message:'Проверьте имя и номер телефона'});
  const g = Number(guests);
  if (g < 1 || g > 30) return res.status(400).json({ success:false, message:'Количество гостей должно быть от 1 до 30' });
  if(String(comment||'').length>1000 || String(occasion||'').length>100 || (budget!==undefined && (!Number.isFinite(Number(budget)) || Number(budget)<0 || Number(budget)>100000000))) return res.status(400).json({success:false,message:'Некорректные данные бронирования'});
  if(!isValidDateTime(String(date),String(time))) return res.status(400).json({success:false,message:'Дата и время бронирования должны быть в будущем'});
  const table = tableId ? store.tables.find(t => t.id === tableId) : null;
  if (tableId && (!table || table.seats < g)) return res.status(400).json({ success:false, message:'Выбранный стол не подходит по вместимости' });
  const conflict = tableId ? !isTableAvailable(store,tableId,String(date),String(time)) : false;
  if (tableId && conflict) return res.status(409).json({ success:false, message:'Этот стол уже занят на выбранное время' });
  const idemKey=String(req.headers['idempotency-key']||'').trim(); if(idemKey.length>128)return res.status(400).json({success:false,message:'Некорректный Idempotency-Key'}); const idem=await db.claimIdempotent('public-reservation',idemKey); if(!idem.claimed){if(idem.response?.pending)return res.status(409).json({success:false,message:'Бронирование с этим запросом уже оформляется'});return res.json(idem.response);}
  const signedCustomer = optionalCustomer(req);
  if(signedCustomer && String(phone).replace(/\s+/g,'') !== String(signedCustomer.phone||'').replace(/\s+/g,'')) return res.status(403).json({success:false,message:'Телефон брони не совпадает с аккаунтом'});
  const reservation = {
    id: Date.now(), number: await db.reserveNumber('reservation'), name, phone, date, time, guests:g,
    occasion: occasion || '', comment: comment || '', budget: Number(budget)||0, tableId, orderId: req.body.orderId ? Number(req.body.orderId) : null,
    customerId: signedCustomer ? Number(signedCustomer.id) : null, status:'new', createdAt:new Date().toISOString()
  };
  store.reservations.push(reservation); upsertCustomer(store, { name, phone }); await saveStore(store); await audit(req,'create','reservation',reservation.id);
  const safeReservation = signedCustomer ? reservation : { id: reservation.id, number: reservation.number, status: reservation.status, createdAt: reservation.createdAt };
  const response={success:true,reservation:safeReservation}; await db.putIdempotent('public-reservation',idemKey,response); res.json(response);
});


function monthKeyFromDate(value) { const p=businessParts(value instanceof Date?value:new Date(value)); return p.year?`${p.year}-${p.month}`:''; }
function previousMonthKey(now=new Date()) { const p=businessParts(now); const d=new Date(Date.UTC(Number(p.year),Number(p.month)-2,1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`; }
function monthLabel(key) {
  const [y,m] = String(key||'').split('-').map(Number);
  if (!y || !m) return key;
  return new Date(y,m-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
}
function archiveStats(orders, reservations) {
  const billable=new Set(['completed','delivered']);
  const revenue=orders.filter(o=>billable.has(normalizeStatus(o.status))).reduce((sum,o)=>sum+Number(o.total||0),0);
  const completed=orders.filter(o=>billable.has(normalizeStatus(o.status))).length;
  return {orders:orders.length,reservations:reservations.length,revenue,completedOrders:completed,avgCheck:completed?Math.round(revenue/completed):0};
}
function orderMonth(order) { return monthKeyFromDate(order.createdAt); }
function reservationMonth(reservation) {
  if (reservation.date && /^\d{4}-\d{2}-\d{2}$/.test(String(reservation.date))) return String(reservation.date).slice(0,7);
  return monthKeyFromDate(reservation.createdAt);
}
function archivePublic(record) {
  return {
    id:record.id, month:record.month, label:record.label, archivedAt:record.archivedAt,
    stats:record.stats, orders:record.orders||[], reservations:record.reservations||[], customers:record.customers||[]
  };
}

app.post('/api/admin/login', rateLimit('admin-login',15*60*1000,20), async (req,res) => {
  if(process.env.NODE_ENV==='production' && (!process.env.DATABASE_URL || !process.env.NOIRE_SESSION_SECRET || !process.env.NOIRE_ADMIN_USER || !process.env.NOIRE_ADMIN_PASSWORD)) return res.status(503).json({success:false,message:'Админ-панель не настроена для production: проверьте DATABASE_URL, NOIRE_SESSION_SECRET, NOIRE_ADMIN_USER и NOIRE_ADMIN_PASSWORD'});
  const store=readStore(); const usernameInput=String(req.body.username||'').trim(); const passwordInput=String(req.body.password||'');
  const accounts=[store.admin,...store.employees].filter(Boolean);
  let account=accounts.find(a=>String(a.username||'').trim().toLowerCase()===usernameInput.toLowerCase());
  const envUser=String(process.env.NOIRE_ADMIN_USER||'').trim(); const envPass=String(process.env.NOIRE_ADMIN_PASSWORD||'');
  if(!account && envUser && envPass && usernameInput.toLowerCase()===envUser.toLowerCase()) account=store.admin;
  let valid=!!account && account.active !== false && verifyPassword(passwordInput, account.passwordHash || account.password);
  // If deployment credentials are explicitly configured, accept them for the owner account
  // and migrate the stored credential to a hash. This fixes stale bundled admin credentials
  // without replacing the existing authentication system.
  if(account===store.admin && envUser && envPass && usernameInput.toLowerCase()===envUser.toLowerCase() && passwordInput===envPass) valid=true;
  if (!valid) return res.status(401).json({success:false,message:'Неверный логин или пароль'});
  // Migrate the original demo/plaintext password to a real password hash after successful login.
  if (account===store.admin && envUser && envPass && usernameInput.toLowerCase()===envUser.toLowerCase() && passwordInput===envPass) { account.username=envUser; account.passwordHash=hashPassword(envPass); delete account.password; await saveStore(store); }
  else if (!account.passwordHash) { account.passwordHash=hashPassword(passwordInput); delete account.password; await saveStore(store); }
  const token=issueSession(null,{id:account.id||'owner',username:account.username,role:(account === store.admin ? 'owner' : (account.role||'owner')),name:account.name||'Owner',tokenVersion:Number(account.sessionVersion||0)});
  setSessionCookie(res,token); res.json({success:true,user:{username:account.username,role:(account === store.admin ? 'owner' : (account.role||'owner')),name:account.name||'Owner'}});
});
app.post('/api/admin/logout', adminAuth, async (req,res) => { const s=readStore(); const a=(s.employees||[]).find(e=>Number(e.id)===Number(req.staff.id)) || (s.admin&&String(req.staff.id)==='owner'?s.admin:null); if(!a)return res.status(401).json({success:false,message:'Сессия завершена'}); a.sessionVersion=Number(a.sessionVersion||0)+1; await saveStore(s); clearSessionCookie(res); res.json({success:true}); });

app.get('/api/admin', adminAuth, (req, res) => {
  const store=readStore(), menu=readMenu(), gallery=readGallery(), history=db.getHistory();
  const billableOrders=store.orders.filter(o=>['completed','delivered'].includes(normalizeStatus(o.status)));
  const revenue=billableOrders.reduce((sum,o)=>sum+Number(o.total||0),0);
  const todayKey=dateKeyLocal(new Date());
  const todayOrders=store.orders.filter(o=>dateKeyLocal(o.createdAt)===todayKey).length;
  const todayBookings=store.reservations.filter(r=>r.date===todayKey && !['cancelled','completed'].includes(normalizeStatus(r.status))).length;
  const analytics=analyticsSnapshot(store,menu);
  const popularItems=analytics.topItems.slice(0,8);
  const avg=billableOrders.length?Math.round(revenue/billableOrders.length):0;
  const tableDate=String(req.query.tableDate||todayKey); const nowParts=restaurantNow(); const defaultTableTime=`${nowParts.hour}:${String(Math.floor(Number(nowParts.minute)/15)*15).padStart(2,'0')}`; const tableTime=String(req.query.tableTime||defaultTableTime);
  const role=req.staff.role;
  const canOrders=can(role,'orders'), canBookings=can(role,'bookings'), canMenu=can(role,'menu'), canAnalytics=can(role,'analytics'), canEmployees=can(role,'employees');
  let visibleOrders=store.orders.slice().reverse();
  if(role==='delivery') visibleOrders=visibleOrders.filter(o=>String(o.orderType||'delivery').toLowerCase()==='delivery' && (!o.deliveryId || Number(o.deliveryId)===Number(req.staff.id) || (!o.deliveryId && !o.employeeId)));
  else if(role==='waiter') visibleOrders=visibleOrders.filter(o=>String(o.orderType||'delivery').toLowerCase()==='waiter' && (!o.waiterId || Number(o.waiterId)===Number(req.staff.id) || (!o.waiterId && !o.employeeId)));
  else if(role==='cook') visibleOrders=visibleOrders.filter(o=>['delivery','waiter'].includes(String(o.orderType||'delivery').toLowerCase()));
  const personal=employeeStats(store,req.staff.id);
  const publicStats=['waiter','cook','delivery'].includes(role)?{orders:personal.assigned,reservations:0,customers:0,revenue:personal.month.revenue,todayOrders:personal.day.orders,todayBookings:0,avgCheck:personal.month.avgCheck,menuCount:0,galleryCount:0,periods:{day:personal.day,week:personal.week,month:personal.month,year:personal.year}}:role==='manager'?{orders:store.orders.length,reservations:store.reservations.length,customers:0,revenue:0,todayOrders,todayBookings,avgCheck:0,menuCount:menu.length,galleryCount:gallery.length,periods:{day:{orders:todayOrders,revenue:0,avgCheck:0},week:{orders:0,revenue:0,avgCheck:0},month:{orders:0,revenue:0,avgCheck:0},year:{orders:0,revenue:0,avgCheck:0}}}:{orders:store.orders.length,reservations:store.reservations.length,customers:store.customers.length,revenue,todayOrders,todayBookings,avgCheck:avg,menuCount:menu.length,galleryCount:gallery.length,periods:analytics.periods};
  const safeAnalytics=canAnalytics?analytics:{periods:publicStats.periods,topItems:[],topCategories:[],days:[]};
  res.json({success:true,staff:req.staff,permissions:rolePermissions[role]||[],settings:store.settings,timezone:process.env.NOIRE_TIMEZONE||'Asia/Yerevan',
    stats:publicStats,
    analytics:safeAnalytics,
    orders: canOrders ? visibleOrders.map(o=>{ if(req.staff.role==='cook'){ const c=o.customer||{}; return {...o,customer:{name:c.name||'Гость',comment:c.comment||''}}; } return o; }) : [],
    reservations:canBookings?store.reservations.slice().reverse().map(r=>({ ...r, relatedOrders:store.orders.filter(o=>o.customer?.phone===r.phone).slice().reverse().slice(0,8) })):[],
    customers:can(role,'customers')?store.customers.slice().reverse().map(publicCustomer):[],
    employees:canEmployees?store.employees.map(e=>employeePublic(e,store)):store.employees.filter(e=>Number(e.id)===Number(req.staff.id)).map(e=>employeePublic(e,store)),
    menu:canMenu?menu:[],gallery:canMenu?gallery:[],tables:canOrders?tableSnapshot(store,tableDate,tableTime):[],tableView:{date:tableDate,time:tableTime},popularItems:canAnalytics?popularItems:[],
    history:can(role,'history')?history.slice().reverse().map(archivePublic):[], auditLogs:['owner','director','administrator'].includes(role)?db.getAuditLogs().slice(-500).reverse():[]
  });
});


app.post('/api/admin/history/archive-month', adminAuth, requirePermission('history'), async (req,res)=>{
  const store=readStore();
  const requested=String(req.body.month||previousMonthKey());
  if (!/^\d{4}-\d{2}$/.test(requested)) return res.status(400).json({success:false,message:'Неверный месяц'});
  const current=monthKeyFromDate(new Date());
  if (requested>=current) return res.status(400).json({success:false,message:'Можно архивировать только завершённый месяц'});
  const history=db.getHistory();
  if (history.some(h=>h.month===requested)) return res.status(409).json({success:false,message:'Этот месяц уже находится в архиве'});
  const orders=store.orders.filter(o=>orderMonth(o)===requested);
  const reservations=store.reservations.filter(r=>reservationMonth(r)===requested);
  if (!orders.length && !reservations.length) return res.status(404).json({success:false,message:'За этот месяц нет данных для архивации'});
  const phoneSet=new Set();
  orders.forEach(o=>{if(o.customer?.phone)phoneSet.add(String(o.customer.phone));});
  reservations.forEach(r=>{if(r.phone)phoneSet.add(String(r.phone));});
  const customers=store.customers.filter(c=>phoneSet.has(String(c.phone||''))).map(c=>({...c}));
  const record={id:requested,month:requested,label:monthLabel(requested),archivedAt:new Date().toISOString(),stats:archiveStats(orders,reservations),orders:orders.map(o=>({...o})),reservations:reservations.map(r=>({...r})),customers};
  history.push(record);
  // Remove archived records from the live store only after the archive payload is built.
  // The archive remains the durable source for closed periods.
  store.orders = store.orders.filter(o=>orderMonth(o)!==requested);
  store.reservations = store.reservations.filter(r=>reservationMonth(r)!==requested);
  await db.saveArchiveAndStore(history,store);
  res.json({success:true,archive:archivePublic(record),history:history.slice().reverse().map(archivePublic)});
});
app.delete('/api/admin/history/:id', adminAuth, requirePermission('history'), async (req,res)=>{
  const id=String(req.params.id||'');
  const history=db.getHistory();
  const next=history.filter(h=>String(h.id)!==id);
  if(next.length===history.length)return res.status(404).json({success:false,message:'Архив не найден'});
  await db.saveHistory(next);
  await audit(req,'delete','history',id);
  res.json({success:true,history:next.slice().reverse().map(archivePublic)});
});
app.delete('/api/admin/history', adminAuth, requirePermission('history'), async (req,res)=>{
  const history=db.getHistory();
  if(!history.length)return res.json({success:true,history:[]});
  await db.saveHistory([]);
  await audit(req,'delete','history',null,{count:history.length});
  res.json({success:true,history:[]});
});

function safeImageSource(value){
  const v=String(value||'').trim();
  if(!v)return '';
  if(/^data:image\/(jpeg|jpg|png|webp|gif|avif);base64,[A-Za-z0-9+/=\s]+$/i.test(v)){
    const comma=v.indexOf(',');
    const raw=v.slice(comma+1).replace(/\s/g,'');
    if(raw.length>Math.ceil(2.5*1024*1024*4/3)) return '';
    try{ if(Buffer.from(raw,'base64').length>2.5*1024*1024)return ''; }catch{return '';}
    return v;
  }
  try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)?v:'';}catch{return '';}
}
function safeHttpUrl(value){return safeImageSource(value);}
function isBlobUrl(value){try{return new URL(String(value)).hostname.endsWith('.public.blob.vercel-storage.com')}catch{return false;}}
async function persistImageSource(value,folder='images'){
  const safe=safeImageSource(value); if(!safe)return '';
  if(!safe.startsWith('data:image/')) return safe;
  if(process.env.NODE_ENV==='production' && !process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL) throw new Error('Загрузка фото в production требует Vercel Blob или BLOB_READ_WRITE_TOKEN');
  const m=safe.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif|avif));base64,(.*)$/i); if(!m) return '';
  const buffer=Buffer.from(m[2].replace(/\s/g,''),'base64'); const ext=(m[1].split('/')[1]||'jpeg').replace('jpg','jpeg');
  const key=`noire/${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const result=await blobPut(key,buffer,{access:'public',contentType:m[1],addRandomSuffix:false,...(process.env.BLOB_READ_WRITE_TOKEN?{token:process.env.BLOB_READ_WRITE_TOKEN}: {})});
  return result.url;
}
async function deleteStoredImage(value){if(isBlobUrl(value)){try{await blobDel(value,process.env.BLOB_READ_WRITE_TOKEN?{token:process.env.BLOB_READ_WRITE_TOKEN}:{});}catch(err){console.warn('NOIRE blob delete skipped:',err.message);}}}
function safeText(value,max=500){return String(value??'').trim().slice(0,max);}
function validPhone(value){return /^[+()\d][+()\d\s-]{5,24}$/.test(String(value||'').trim());}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());}
const BOOKING_STATUSES=new Set(['new','confirmed','arrived','completed','cancelled']);
const ORDER_STATUSES=new Set(['new','confirmed','preparing','ready','in_transit','arrived','completed','cancelled']);
function requireFiniteNumber(value,min,max){const n=Number(value);return Number.isFinite(n)&&n>=min&&n<=max?n:null;}

function validUsername(value){return /^[A-Za-z0-9_.-]{3,40}$/.test(String(value||'').trim());}
app.post('/api/admin/menu', adminAuth, requirePermission('menu'), async (req,res)=>{
  const menu=readMenu(), b=req.body;
  if(!b.name || !Number.isFinite(Number(b.price)) || Number(b.price)<0 || Number(b.price)>100000000) return res.status(400).json({success:false,message:'Название и корректная цена обязательны'});
  const allowedCategories=['coffee','tea','breakfast','snacks','food','desserts','drinks','beer','sauces']; if(!allowedCategories.includes(String(b.category||'coffee'))) return res.status(400).json({success:false,message:'Недопустимая категория меню'});
  const item={id:menu.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1,name:String(b.name).trim(),category:b.category||'coffee',description:b.description||'',price:Number(b.price),image:await persistImageSource(b.image,'menu'),popular:!!b.popular};
  menu.push(item); await saveMenu(menu); await audit(req,'create','menu',item.id,{name:item.name}); res.json({success:true,item,menu});
});
app.put('/api/admin/menu/:id', adminAuth, requirePermission('menu'), async (req,res)=>{
  const menu=readMenu(), item=menu.find(x=>Number(x.id)===Number(req.params.id));
  if(!item) return res.status(404).json({success:false,message:'Позиция не найдена'});
  const b=req.body;
  if(!b.name || !Number.isFinite(Number(b.price)) || Number(b.price)<0 || Number(b.price)>100000000) return res.status(400).json({success:false,message:'Название и корректная цена обязательны'});
  const allowedCategories=['coffee','tea','breakfast','snacks','food','desserts','drinks','beer','sauces']; if(b.category!==undefined && !allowedCategories.includes(String(b.category))) return res.status(400).json({success:false,message:'Недопустимая категория меню'});
  const oldImage=item.image; Object.assign(item,{name:String(b.name).trim(),category:b.category||item.category,description:b.description??item.description,price:Number(b.price),image:b.image!==undefined?await persistImageSource(b.image,'menu'):item.image,popular:!!b.popular});
  await saveMenu(menu); if(b.image!==undefined && item.image!==oldImage) await deleteStoredImage(oldImage); await audit(req,'update','menu',item.id); res.json({success:true,item,menu});
});
app.delete('/api/admin/menu/:id', adminAuth, requirePermission('menu'), async (req,res)=>{
  const menu=readMenu(); const next=menu.filter(x=>Number(x.id)!==Number(req.params.id));
  if(next.length===menu.length)return res.status(404).json({success:false,message:'Позиция не найдена'});
  await saveMenu(next); await deleteStoredImage(menu.find(x=>Number(x.id)===Number(req.params.id))?.image); await audit(req,'delete','menu',req.params.id); res.json({success:true,menu:next});
});

app.post('/api/admin/gallery', adminAuth, requirePermission('menu'), async (req,res)=>{ const g=readGallery(); const image=await persistImageSource(req.body.image,'gallery'); const item={id:Date.now(),title:safeText(req.body.title||'NOIRÉ Space',120),category:safeText(req.body.category||'Interior',80),image}; if(!item.image)return res.status(400).json({success:false,message:'Выберите фото с устройства или укажите корректную ссылку'}); g.push(item); await saveGallery(g); await audit(req,'create','gallery',item.id); res.json({success:true,item,gallery:g}); });
app.delete('/api/admin/gallery/:id', adminAuth, requirePermission('menu'), async (req,res)=>{ const g=readGallery(); const next=g.filter(x=>Number(x.id)!==Number(req.params.id)); if(next.length===g.length)return res.status(404).json({success:false,message:'Фото не найдено'}); await saveGallery(next); await deleteStoredImage(g.find(x=>Number(x.id)===Number(req.params.id))?.image); await audit(req,'delete','gallery',req.params.id); res.json({success:true,gallery:next}); });
app.put('/api/admin/gallery/:id', adminAuth, requirePermission('menu'), async (req,res)=>{ const g=readGallery(); const item=g.find(x=>Number(x.id)===Number(req.params.id)); if(!item)return res.status(404).json({success:false,message:'Фото не найдено'}); const title=safeText(req.body.title??item.title,120); const category=safeText(req.body.category??item.category,80); if(!title)return res.status(400).json({success:false,message:'Название обязательно'}); const oldImage=item.image; const image=req.body.image!==undefined?await persistImageSource(req.body.image,'gallery'):oldImage; if(!image)return res.status(400).json({success:false,message:'Выберите фото или укажите URL'}); item.title=title; item.category=category||item.category; item.image=image; await saveGallery(g); if(image!==oldImage)await deleteStoredImage(oldImage); await audit(req,'update','gallery',item.id); res.json({success:true,item,gallery:g}); });


app.post('/api/admin/orders', adminAuth, requirePermission('orders'), async (req,res)=>{
  const s=readStore();
  if(!['owner','director','administrator','manager','waiter'].includes(req.staff.role)) return res.status(403).json({success:false,message:'Недостаточно прав'});
  const orderType=String(req.body.orderType||'waiter').toLowerCase();
  if(req.staff.role==='waiter' && orderType!=='waiter') return res.status(403).json({success:false,message:'Официант может создавать только заказы в зале'});
  if(!['delivery','waiter'].includes(orderType)) return res.status(400).json({success:false,message:'Недопустимый тип заказа'});
  const items=normalizeItems(req.body.items); if(!items.length)return res.status(400).json({success:false,message:'Добавьте хотя бы одну позицию'});
  const customer=req.body.customer||{}; if(orderType==='delivery' && (!validPhone(customer.phone)||!String(customer.address||'').trim()))return res.status(400).json({success:false,message:'Для доставки укажите корректный телефон и адрес'}); if(customer.email&&!validEmail(customer.email))return res.status(400).json({success:false,message:'Некорректный email'}); const total=calcTotal(items);
  const order={id:Date.now()+Math.floor(Math.random()*1000),number:await db.reserveNumber('order'),customer:{name:String(customer.name||'Гость').trim(),phone:String(customer.phone||'').replace(/\s+/g,''),email:String(customer.email||'').trim(),address:String(customer.address||'').trim(),entrance:String(customer.entrance||'').trim(),floor:String(customer.floor||'').trim(),deliveryTime:String(customer.deliveryTime||'').trim(),payment:['card','cash'].includes(String(customer.payment||'').toLowerCase())?String(customer.payment).toLowerCase():'',comment:String(customer.comment||'').trim()},items,total,orderType,status:'new',employeeId:null,waiterId:null,deliveryId:null,kitchenId:null,customerId:null,createdAt:new Date().toISOString()};
  if(orderType==='waiter' && req.staff.role==='waiter') order.createdBy=req.staff.id;
  s.orders.push(order); await saveStore(s); await audit(req,'create','order',order.id,{orderType}); res.json({success:true,order});
});

app.post('/api/admin/orders/:id/claim', adminAuth, requirePermission('orders'), async (req,res)=>{
  const s=readStore(); const o=s.orders.find(x=>Number(x.id)===Number(req.params.id));
  if(!o)return res.status(404).json({success:false,message:'Заказ не найден'});
  const role=req.staff.role; const type=String(o.orderType||'delivery').toLowerCase();
  if(role==='delivery' && type!=='delivery') return res.status(403).json({success:false,message:'Курьер может принимать только Delivery-заказы'});
  if(role==='waiter' && type!=='waiter') return res.status(403).json({success:false,message:'Официант может принимать только заказы в зале'});
  if(!['waiter','delivery','cook'].includes(role)) return res.status(403).json({success:false,message:'Роль не использует личное принятие заказов'});
  if(['completed','cancelled'].includes(normalizeStatus(o.status))) return res.status(409).json({success:false,message:'Заказ уже завершён или отменён'});
  const field=role==='waiter'?'waiterId':role==='delivery'?'deliveryId':'kitchenId'; const current=o[field] ?? ((role==='waiter'||role==='delivery'||role==='cook') && o.employeeRole===role ? o.employeeId : null);
  if(current && Number(current)!==Number(req.staff.id)) return res.status(409).json({success:false,message:'Заказ уже принят другим сотрудником'});
  if(current && Number(current)===Number(req.staff.id)) return res.json({success:true,order:o,alreadyMine:true});
  const claim=await db.claimOrderAtomic(`${o.id}:${role}`,req.staff.id);
  if(!claim.claimed) return res.status(409).json({success:false,message:'Заказ уже принят другим сотрудником этой роли'});
  o[field]=Number(req.staff.id); o.acceptedAt=o.acceptedAt||new Date().toISOString(); o.updatedAt=o.acceptedAt;
  try { await saveStore(s); } catch(err) { try{await db.releaseOrderClaim(`${o.id}:${role}`)}catch{}; throw err; }
  res.json({success:true,order:o});
});

app.patch('/api/admin/orders/:id', adminAuth, requirePermission('orders'), async (req,res)=>{
  const s=readStore(), o=s.orders.find(x=>Number(x.id)===Number(req.params.id));
  if(!o)return res.status(404).json({success:false,message:'Заказ не найден'});
  if(['delivery','waiter','cook'].includes(req.staff.role) && Number(assignedEmployeeId(o,req.staff.role))!==Number(req.staff.id)) return res.status(403).json({success:false,message:'Сотрудник может изменять только принятые им заказы'});
  if(req.staff.role==='delivery' && String(o.orderType||'delivery').toLowerCase()!=='delivery') return res.status(403).json({success:false,message:'Курьеру недоступен этот тип заказа'});
  if(req.staff.role==='waiter' && String(o.orderType||'delivery').toLowerCase()!=='waiter') return res.status(403).json({success:false,message:'Официанту недоступен этот тип заказа'});
  if(req.body.status) {
    const next=normalizeStatus(req.body.status); if(!ORDER_STATUSES.has(next)) return res.status(400).json({success:false,message:'Недопустимый статус заказа'});
    const statusError=validateOrderStatusTransition(req.staff.role,o.status,next);
    if(statusError) return res.status(400).json({success:false,message:statusError});
    o.status=next;
    if(next==='completed') o.completedAt=new Date().toISOString();
  }
  if(req.body.orderType!==undefined){const ot=String(req.body.orderType).toLowerCase();if(!['delivery','waiter'].includes(ot))return res.status(400).json({success:false,message:'Недопустимый тип заказа'});o.orderType=ot;if(ot==='delivery')o.waiterId=null;if(ot==='waiter')o.deliveryId=null;}
  if(req.body.employeeId!==undefined && !['delivery','waiter','cook'].includes(req.staff.role)) {
    const assignedId=req.body.employeeId?Number(req.body.employeeId):null;
    o.employeeId=null; o.waiterId=null; o.deliveryId=null; o.kitchenId=null;
    if(assignedId){const ae=s.employees.find(e=>Number(e.id)===assignedId && e.active!==false); if(!ae)return res.status(400).json({success:false,message:'Активный сотрудник не найден'}); const ar=canonicalRole(ae.role); const ot=String(o.orderType||'delivery'); if(ot==='delivery' && !['delivery','cook'].includes(ar))return res.status(400).json({success:false,message:'Для доставки нужен курьер или повар'}); if(ot==='waiter' && !['waiter','cook'].includes(ar))return res.status(400).json({success:false,message:'Для заказа в зале нужен официант или повар'}); if(ar==='waiter')o.waiterId=assignedId; else if(ar==='delivery')o.deliveryId=assignedId; else if(ar==='cook')o.kitchenId=assignedId; else return res.status(400).json({success:false,message:'Недопустимая роль сотрудника'});}
  }
  if(req.body.waiterId!==undefined && !['waiter','delivery','cook'].includes(req.staff.role)) o.waiterId=req.body.waiterId?Number(req.body.waiterId):null;
  if(req.body.deliveryId!==undefined && !['waiter','delivery','cook'].includes(req.staff.role)) o.deliveryId=req.body.deliveryId?Number(req.body.deliveryId):null;
  if(req.body.kitchenId!==undefined && !['waiter','delivery','cook'].includes(req.staff.role)) o.kitchenId=req.body.kitchenId?Number(req.body.kitchenId):null;
  if(req.body.tableId!==undefined) o.tableId=req.body.tableId ? Number(req.body.tableId) : null;
  o.updatedAt=new Date().toISOString(); if(normalizeStatus(o.status)==='completed'&&!o.completedAt)o.completedAt=o.updatedAt; await saveStore(s); if(['completed','cancelled'].includes(normalizeStatus(o.status))) { try{await db.releaseOrderClaim(`${o.id}:${canonicalRole(req.staff.role)}`)}catch{} } res.json({success:true,order:o});
});
app.post('/api/admin/reservations', adminAuth, requirePermission('bookings'), async (req,res)=>{
  const s=readStore(); const b=req.body||{}; const name=String(b.name||'').trim(), phone=String(b.phone||'').trim(), date=String(b.date||''), time=String(b.time||''); const guests=Number(b.guests||0), tableId=Number(b.tableId)||null;
  if(!name||!validPhone(phone)||!date||!time||guests<1||guests>30)return res.status(400).json({success:false,message:'Укажите имя, телефон, дату, время и количество гостей'});
  if(!isValidDateTime(date,time))return res.status(400).json({success:false,message:'Дата и время должны быть корректными и не в прошлом'});
  const table=tableId?s.tables.find(t=>Number(t.id)===tableId):null; if(tableId&&(!table||Number(table.seats)<guests))return res.status(400).json({success:false,message:'Выбранный стол не подходит по вместимости'});
  if(tableId&&!isTableAvailable(s,tableId,date,time))return res.status(409).json({success:false,code:'TABLE_UNAVAILABLE',message:`Этот стол уже занят на выбранное время. Длительность брони — ${RESERVATION_DURATION_MINUTES} мин.`});
  const reservation={id:Date.now()+Math.floor(Math.random()*1000),number:await db.reserveNumber('reservation'),name,phone,date,time,guests,occasion:String(b.occasion||''),comment:String(b.comment||''),budget:Math.max(0,Number(b.budget)||0),tableId,orderId:b.orderId?Number(b.orderId):null,customerId:b.customerId?Number(b.customerId):null,status:'new',createdAt:new Date().toISOString(),createdBy:req.staff.id};
  s.reservations.push(reservation); upsertCustomer(s,{name,phone,email:String(b.email||'').trim()}); await saveStore(s); await audit(req,'create','reservation',reservation.id,{phone,date,time,tableId}); res.json({success:true,reservation});
});

app.patch('/api/admin/reservations/:id', adminAuth, requirePermission('bookings'), async (req,res)=>{
  const s=readStore(), r=s.reservations.find(x=>Number(x.id)===Number(req.params.id));
  if(!r)return res.status(404).json({success:false,message:'Бронирование не найдено'});
  if(req.body.status){ const ns=normalizeStatus(req.body.status); if(!BOOKING_STATUSES.has(ns)) return res.status(400).json({success:false,message:'Недопустимый статус бронирования'}); r.status=ns; }
  const nextDate=req.body.date!==undefined?String(req.body.date):r.date, nextTime=req.body.time!==undefined?String(req.body.time):r.time, nextTable=req.body.tableId!==undefined?(req.body.tableId?Number(req.body.tableId):null):r.tableId;
  if(!isValidDateTime(nextDate,nextTime) && !['cancelled','completed'].includes(normalizeStatus(req.body.status||r.status))) return res.status(400).json({success:false,message:'Дата и время должны быть корректными и не в прошлом'});
  if(nextTable && !s.tables.some(t=>Number(t.id)===Number(nextTable)))return res.status(400).json({success:false,message:'Стол не найден'});
  if(nextTable && !isTableAvailable(s,nextTable,nextDate,nextTime,r.id)) return res.status(409).json({success:false,code:'TABLE_UNAVAILABLE',message:`Этот стол уже занят на выбранное время. Длительность брони — ${RESERVATION_DURATION_MINUTES} мин.`});
  r.tableId=nextTable; r.date=nextDate; r.time=nextTime;
  if(req.body.orderId!==undefined) r.orderId=req.body.orderId ? Number(req.body.orderId) : null;
  if(req.body.name!==undefined) r.name=String(req.body.name).trim();
  if(req.body.phone!==undefined){if(!validPhone(req.body.phone))return res.status(400).json({success:false,message:'Некорректный телефон'});r.phone=String(req.body.phone).replace(/\s+/g,'');}
  if(req.body.guests!==undefined){const g=requireFiniteNumber(req.body.guests,1,30);if(g===null)return res.status(400).json({success:false,message:'Некорректное количество гостей'});if(nextTable){const tt=s.tables.find(t=>Number(t.id)===Number(nextTable));if(tt&&tt.seats<g)return res.status(400).json({success:false,message:'Стол не подходит по вместимости'});}r.guests=Math.round(g);}
  if(req.body.occasion!==undefined)r.occasion=String(req.body.occasion).trim();
  if(req.body.comment!==undefined)r.comment=String(req.body.comment).trim();
  if(req.body.budget!==undefined)r.budget=Number(req.body.budget)||0;
  if(req.body.status){ const ns=normalizeStatus(req.body.status); if(!BOOKING_STATUSES.has(ns)) return res.status(400).json({success:false,message:'Недопустимый статус бронирования'}); r.status=ns; }
  r.updatedAt=new Date().toISOString(); await saveStore(s); await audit(req,'update','reservation',r.id,{status:r.status}); res.json({success:true,reservation:r});
});
app.patch('/api/admin/tables/:id', adminAuth, (req,res,next)=>can(req.staff.role,'menu')||['owner','director','administrator','manager'].includes(req.staff.role)?next():res.status(403).json({success:false,message:'Недостаточно прав'}), async (req,res)=>{
  const s=readStore(), t=s.tables.find(x=>Number(x.id)===Number(req.params.id));
  if(!t)return res.status(404).json({success:false,message:'Стол не найден'});
  if(req.body.status && ['available','occupied','service'].includes(normalizeStatus(req.body.status)))t.status=normalizeStatus(req.body.status)==='available' ? null : normalizeStatus(req.body.status);
  if(req.body.seats!==undefined){const seats=requireFiniteNumber(req.body.seats,1,30);if(seats===null)return res.status(400).json({success:false,message:'Некорректное количество мест'});t.seats=Math.round(seats);}
  await saveStore(s); res.json({success:true,table:t});
});
app.get('/api/admin/tables', adminAuth, requirePermission('orders'), (req,res)=>{
  const s=readStore(); const date=String(req.query.date||dateKeyLocal(new Date())); const nowParts=restaurantNow(); const defaultTime=`${nowParts.hour}:${String(Math.floor(Number(nowParts.minute)/15)*15).padStart(2,'0')}`; const time=String(req.query.time||defaultTime);
  res.json({success:true,date,time,reservationDurationMinutes:RESERVATION_DURATION_MINUTES,tables:tableSnapshot(s,date,time)});
});

app.get('/api/site-settings',(req,res)=>{ const s=readStore(); const settings=s.settings||{}; res.json({success:true,siteName:settings.siteName||'NOIRÉ COFFEE',siteSubtitle:settings.siteSubtitle||'COFFEE & KITCHEN',language:settings.language||'ru',timezone:process.env.NOIRE_TIMEZONE||'Asia/Yerevan'}); });

app.post('/api/auth/register',rateLimit('register',15*60*1000,20),async (req,res)=>{
  const store=readStore(); const {name,email,phone,password,firstName,lastName,middleName}=req.body;
  const fn=String(firstName||'').trim(); const ln=String(lastName||'').trim(); const mn=String(middleName||'').trim();
  const displayName=[fn,mn,ln].filter(Boolean).join(' ').trim() || String(name||'').trim();
  if(!displayName || !password || (!email && !phone)) return res.status(400).json({success:false,message:'Укажите имя, пароль и email или телефон'});
  if(String(password).length<6) return res.status(400).json({success:false,message:'Пароль должен содержать минимум 6 символов'});
  const normalizedEmail=String(email||'').trim().toLowerCase(); const normalizedPhone=String(phone||'').replace(/\s+/g,'').trim();
  if(normalizedEmail && !validEmail(normalizedEmail)) return res.status(400).json({success:false,message:'Некорректный email'});
  if(normalizedPhone && !validPhone(normalizedPhone)) return res.status(400).json({success:false,message:'Некорректный телефон'});
  if((normalizedEmail && [store.admin,...store.employees].some(x=>String(x.email||'').trim().toLowerCase()===normalizedEmail)) || (normalizedPhone && [store.admin,...store.employees].some(x=>String(x.phone||'').replace(/\s+/g,'')===normalizedPhone))) return res.status(409).json({success:false,message:'Email или телефон уже используется сотрудником'});
  let customer=store.customers.find(c=>(normalizedEmail&&String(c.email||'').trim().toLowerCase()===normalizedEmail)||(normalizedPhone&&String(c.phone||'').replace(/\s+/g,'')===normalizedPhone));
  if(customer && customer.passwordHash) return res.status(409).json({success:false,message:'Пользователь с такими данными уже зарегистрирован'});
  if(customer){
    customer.firstName=fn || customer.firstName || displayName.split(/\s+/)[0] || ''; customer.lastName=ln || customer.lastName || ''; customer.middleName=mn || customer.middleName || '';
    customer.name=displayName; customer.email=normalizedEmail; customer.phone=normalizedPhone; customer.passwordHash=hashPassword(password); customer.registered=true; customer.updatedAt=new Date().toISOString();
  } else {
    customer={id:Date.now(),sessionVersion:0,firstName:fn || displayName.split(/\s+/)[0] || '',lastName:ln,middleName:mn,name:displayName,email:normalizedEmail,phone:normalizedPhone,passwordHash:hashPassword(password),registered:true,createdAt:new Date().toISOString()};
    store.customers.push(customer);
  }
  await saveStore(store);
  const token=issueSession(null,{id:customer.id,role:'customer',tokenVersion:Number(customer.sessionVersion||0)}); setSessionCookie(res,token); res.json({success:true,user:publicCustomer(customer)});
});
app.post('/api/auth/login',rateLimit('customer-login',15*60*1000,30),(req,res)=>{
  const store=readStore(); const rawLogin=String(req.body.login||'').trim(); const emailLogin=rawLogin.toLowerCase(); const phoneLogin=rawLogin.replace(/\s+/g,'');
  const c=store.customers.find(x=>String(x.email||'').trim().toLowerCase()===emailLogin || String(x.phone||'').replace(/\s+/g,'')===phoneLogin);
  if(!c || !verifyPassword(req.body.password,c.passwordHash || c.password)) return res.status(401).json({success:false,message:'Неверные данные для входа'});
  const token=issueSession(null,{id:c.id,role:'customer',tokenVersion:Number(c.sessionVersion||0)}); setSessionCookie(res,token); res.json({success:true,user:publicCustomer(c)});
});
function customerAuth(req,res,next){ const session=getSession(getSessionCookie(req)); if(!session || session.role!=='customer')return res.status(401).json({success:false,message:'Сессия завершена'}); const c=readStore().customers.find(x=>Number(x.id)===Number(session.id)); if(!c)return res.status(401).json({success:false,message:'Клиент не найден'}); if(Number(session.tokenVersion||0)!==Number(c.sessionVersion||0))return res.status(401).json({success:false,message:'Сессия завершена'}); req.customer=c; req.customerSession=session; next(); }
app.get('/api/auth/me',customerAuth,(req,res)=>res.json({success:true,user:publicCustomer(req.customer)}));
app.post('/api/auth/logout',customerAuth,async(req,res)=>{const s=readStore();const c=s.customers.find(x=>Number(x.id)===Number(req.customer.id));c.sessionVersion=Number(c.sessionVersion||0)+1;await saveStore(s);clearSessionCookie(res);res.json({success:true});});
app.get('/api/auth/orders',customerAuth,(req,res)=>{ const s=readStore(); res.json({success:true,orders:s.orders.filter(o=>Number(o.customerId)===Number(req.customer.id) || (!o.customerId && o.customer?.phone===req.customer.phone)).reverse()}); });
app.get('/api/auth/reservations',customerAuth,(req,res)=>{ const s=readStore(); res.json({success:true,reservations:s.reservations.filter(r=>Number(r.customerId)===Number(req.customer.id) || (!r.customerId && r.phone===req.customer.phone)).reverse()}); });
app.post('/api/auth/request-reset',rateLimit('reset-request',15*60*1000,5),async(req,res)=>{ const s=readStore(); const target=String(req.body.login||'').trim(); const low=target.toLowerCase(); const c=s.customers.find(x=>(x.email&&String(x.email).toLowerCase()===low)||(x.phone&&String(x.phone).replace(/\s+/g,'')===target.replace(/\s+/g,''))); if(!c)return res.json({success:true,message:'Если аккаунт существует, код восстановления отправлен.'}); if(process.env.NODE_ENV==='production' && (!process.env.RESEND_API_KEY || !process.env.NOIRE_EMAIL_FROM || !c.email)) return res.status(503).json({success:false,message:'Восстановление по email не настроено для production'}); const code=String(crypto.randomInt(100000,1000000)); c.resetCodeHash=crypto.createHash('sha256').update(code).digest('hex'); c.resetCodeExpires=Date.now()+10*60*1000; c.resetAttempts=0; await saveStore(s); if(process.env.NODE_ENV==='production'){ const rr=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.NOIRE_EMAIL_FROM,to:[c.email],subject:'NOIRÉ — код восстановления',html:`<p>Ваш код восстановления: <strong>${code}</strong></p><p>Код действует 10 минут.</p>`})}); if(!rr.ok){delete c.resetCodeHash;delete c.resetCodeExpires;delete c.resetAttempts;await saveStore(s);return res.status(502).json({success:false,message:'Не удалось отправить код восстановления'});} return res.json({success:true,message:'Если аккаунт существует, код восстановления отправлен.'}); } res.json({success:true,message:'Код восстановления подготовлен.',devCode:code,userId:c.id}); });
app.post('/api/auth/reset',rateLimit('reset',15*60*1000,10),async (req,res)=>{ const s=readStore(); const c=s.customers.find(x=>String(x.id)===String(req.body.userId)); const password=String(req.body.password||''); if(!c||!c.resetCodeHash||!c.resetCodeExpires||c.resetCodeExpires<Date.now())return res.status(400).json({success:false,message:'Неверный или просроченный код'}); if(password.length<6)return res.status(400).json({success:false,message:'Пароль должен содержать минимум 6 символов'}); c.resetAttempts=Number(c.resetAttempts||0)+1; const hash=crypto.createHash('sha256').update(String(req.body.code||'')).digest('hex'); if(c.resetAttempts>5||hash!==c.resetCodeHash){await saveStore(s);return res.status(400).json({success:false,message:'Неверный или просроченный код'});} c.passwordHash=hashPassword(password); c.sessionVersion=Number(c.sessionVersion||0)+1; delete c.resetCodeHash; delete c.resetCodeExpires; delete c.resetAttempts; await saveStore(s); res.json({success:true}); });

app.delete('/api/admin/customers/:id', adminAuth, requirePermission('customers'), async (req,res)=>{
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({success:false,message:'Некорректный ID клиента'});

    const s = readStore();
    const customer = s.customers.find(c => Number(c.id) === id);
    if (!customer) return res.status(404).json({success:false,message:'Клиент не найден'});

    const phone = String(customer.phone || '').replace(/\s+/g,'');
    const beforeOrders = s.orders.length;
    const beforeReservations = s.reservations.length;

    s.customers = s.customers.filter(c => Number(c.id) !== id);
    s.orders = s.orders.filter(o =>
      Number(o.customerId) !== id &&
      !(Number(o.customerId) === 0 && phone && String(o.customer?.phone || '').replace(/\s+/g,'') === phone)
    );
    s.reservations = s.reservations.filter(r =>
      Number(r.customerId) !== id &&
      !(Number(r.customerId) === 0 && phone && String(r.phone || '').replace(/\s+/g,'') === phone)
    );

    await saveStore(s); await audit(req,'delete','customer',id,{deletedOrders:beforeOrders-s.orders.length,deletedReservations:beforeReservations-s.reservations.length});
    res.json({
      success:true,
      deletedCustomerId:id,
      deletedOrders:beforeOrders - s.orders.length,
      deletedReservations:beforeReservations - s.reservations.length
    });
  } catch (err) {
    console.error('NOIRE delete customer:', err);
    res.status(500).json({success:false,message:'Не удалось удалить клиента'});
  }
});

app.delete('/api/admin/customers', adminAuth, requirePermission('customers'), async (req,res)=>{
  try {
    const s = readStore();
    const deleted = {
      customers:s.customers.length,
      orders:s.orders.length,
      reservations:s.reservations.length
    };

    s.customers = [];
    s.orders = [];
    s.reservations = [];

    await saveStore(s); await audit(req,'delete_all','customers',null,deleted);
    res.json({success:true,deleted});
  } catch (err) {
    console.error('NOIRE delete all customers:', err);
    res.status(500).json({success:false,message:'Не удалось удалить клиентов'});
  }
});

app.post('/api/admin/employees',adminAuth,requirePermission('employees'),async (req,res)=>{
  const s=readStore();
  if(!['owner','director','administrator'].includes(req.staff.role))return res.status(403).json({success:false,message:'Недостаточно прав для управления сотрудниками'});
  const {name,username,password,role,email,phone,firstName,lastName,middleName,photo}=req.body;
  if(!name||!username||!password||!role)return res.status(400).json({success:false,message:'Имя, логин, пароль и роль обязательны'});
  if(String(name).trim().length<2||String(name).trim().length>120||!validUsername(username)||String(password).length<8||!validEmail(email)||!validPhone(phone))return res.status(400).json({success:false,message:'Проверьте имя, логин, пароль, email и телефон'});
  if(!rolePermissions[canonicalRole(role)] || canonicalRole(role)==='owner' || !canManageRole(req.staff.role,canonicalRole(role)))return res.status(400).json({success:false,message:'Недопустимая роль для текущего уровня доступа'});
  const normEmail=String(email||'').trim().toLowerCase(), normPhone=String(phone||'').replace(/\s+/g,'');
  if([s.admin,...s.employees].some(e=>String(e.username||'').trim().toLowerCase()===String(username).trim().toLowerCase()))return res.status(409).json({success:false,message:'Такой логин уже существует'});
  if(normEmail && ([s.admin,...s.employees,...s.customers]).some(e=>String(e.email||'').trim().toLowerCase()===normEmail))return res.status(409).json({success:false,message:'Такой email уже существует'});
  if(normPhone && ([s.admin,...s.employees,...s.customers]).some(e=>String(e.phone||'').replace(/\s+/g,'')===normPhone))return res.status(409).json({success:false,message:'Такой телефон уже существует'});
  const employee={id:Date.now(),sessionVersion:0,name:String(name).trim(),firstName:String(firstName||'').trim(),lastName:String(lastName||'').trim(),middleName:String(middleName||'').trim(),username:String(username).trim(),passwordHash:hashPassword(password),role:canonicalRole(role),email:normEmail,phone:normPhone,photo:await persistImageSource(photo,'employees'),active:true,shiftActive:false,shiftStartedAt:null,shiftEndedAt:null,lastShiftMinutes:0,shiftHistory:[],createdAt:new Date().toISOString()};
  s.employees.push(employee); await saveStore(s); await audit(req,'create','employee',employee.id,{role:employee.role}); res.json({success:true,employee:employeePublic(employee,s)});
});
app.patch('/api/admin/employees/:id',adminAuth,requirePermission('employees'),async (req,res)=>{
  const s=readStore(); if(!['owner','director','administrator'].includes(req.staff.role))return res.status(403).json({success:false,message:'Недостаточно прав для управления сотрудниками'});
  const e=s.employees.find(x=>Number(x.id)===Number(req.params.id)); if(!e)return res.status(404).json({success:false,message:'Сотрудник не найден'});
  if(req.body.username!==undefined && !validUsername(req.body.username))return res.status(400).json({success:false,message:'Некорректный логин'});
  if(req.body.password!==undefined && req.body.password && String(req.body.password).length<8)return res.status(400).json({success:false,message:'Пароль минимум 8 символов'});
  if(req.body.email!==undefined && !validEmail(req.body.email))return res.status(400).json({success:false,message:'Некорректный email'});
  if(req.body.phone!==undefined && req.body.phone && !validPhone(req.body.phone))return res.status(400).json({success:false,message:'Некорректный телефон'});
  if(req.body.username && [s.admin,...s.employees].some(x=>Number(x.id)!==Number(e.id)&&String(x.username||'').trim().toLowerCase()===String(req.body.username).trim().toLowerCase()))return res.status(409).json({success:false,message:'Такой логин уже существует'});
  if(req.body.email && [s.admin,...s.employees,...s.customers].some(x=>Number(x.id)!==Number(e.id)&&String(x.email||'').trim().toLowerCase()===String(req.body.email).trim().toLowerCase()))return res.status(409).json({success:false,message:'Такой email уже существует'});
  if(req.body.phone && [s.admin,...s.employees,...s.customers].some(x=>Number(x.id)!==Number(e.id)&&String(x.phone||'').replace(/\s+/g,'')===String(req.body.phone).replace(/\s+/g,'')))return res.status(409).json({success:false,message:'Такой телефон уже существует'});
  const oldPhoto=e.photo; if(req.body.name!==undefined)e.name=String(req.body.name).trim(); if(req.body.firstName!==undefined)e.firstName=String(req.body.firstName).trim(); if(req.body.lastName!==undefined)e.lastName=String(req.body.lastName).trim(); if(req.body.middleName!==undefined)e.middleName=String(req.body.middleName).trim(); if(req.body.username!==undefined)e.username=String(req.body.username).trim(); if(req.body.email!==undefined)e.email=String(req.body.email).trim().toLowerCase(); if(req.body.phone!==undefined)e.phone=String(req.body.phone).replace(/\s+/g,''); if(req.body.photo!==undefined)e.photo=await persistImageSource(req.body.photo,'employees');
  let invalidateSessions=false;
  if(req.body.role!==undefined){ const targetRole=canonicalRole(req.body.role); if(!canManageRole(req.staff.role,targetRole))return res.status(403).json({success:false,message:'Нельзя назначить этот уровень роли'}); if(canonicalRole(e.role)==='director' && req.staff.role!=='owner')return res.status(403).json({success:false,message:'Недостаточно прав для изменения Director'}); e.role=targetRole; invalidateSessions=true; }
  if(req.body.active!==undefined){ if(req.body.active===false && canonicalRole(e.role)==='administrator' && e.active!==false && s.employees.filter(x=>canonicalRole(x.role)==='administrator'&&x.active!==false).length<=1)return res.status(403).json({success:false,message:'Нельзя отключить последнего администратора'}); e.active=!!req.body.active; invalidateSessions=true; }
  if(req.body.password){ if(String(req.body.password).length<8)return res.status(400).json({success:false,message:'Пароль минимум 8 символов'}); e.passwordHash=hashPassword(req.body.password); invalidateSessions=true; }
  if(invalidateSessions)e.sessionVersion=Number(e.sessionVersion||0)+1;
  await saveStore(s); if(req.body.photo!==undefined && e.photo!==oldPhoto) await deleteStoredImage(oldPhoto); await audit(req,'update','employee',e.id,{role:e.role,active:e.active}); res.json({success:true,employee:employeePublic(e,s)});
});
app.delete('/api/admin/employees/:id',adminAuth,requirePermission('employees'),async (req,res)=>{
  const s=readStore(); if(!['owner','director','administrator'].includes(req.staff.role))return res.status(403).json({success:false,message:'Недостаточно прав для управления сотрудниками'});
  const e=s.employees.find(x=>Number(x.id)===Number(req.params.id)); if(!e)return res.status(404).json({success:false,message:'Сотрудник не найден'});
  if(Number(e.id)===Number(req.staff.id))return res.status(403).json({success:false,message:'Нельзя удалить самого себя'}); if(!canManageRole(req.staff.role,e.role))return res.status(403).json({success:false,message:'Нельзя удалить сотрудника равного или более высокого уровня'});
  if(canonicalRole(e.role)==='administrator' && s.employees.filter(x=>canonicalRole(x.role)==='administrator'&&x.active!==false).length<=1)return res.status(403).json({success:false,message:'Нельзя удалить последнего администратора'});
  if(req.body.active===false && canonicalRole(e.role)==='administrator' && e.active!==false && s.employees.filter(x=>canonicalRole(x.role)==='administrator'&&x.active!==false).length<=1)return res.status(403).json({success:false,message:'Нельзя отключить последнего администратора'});
  s.employees=s.employees.filter(x=>Number(x.id)!==Number(req.params.id)); await saveStore(s); await deleteStoredImage(e.photo); await audit(req,'delete','employee',e.id,{role:e.role});
  res.json({success:true});
});
app.post('/api/admin/employees/:id/shift/start',adminAuth,async (req,res)=>{
  const s=readStore(); const e=s.employees.find(x=>Number(x.id)===Number(req.params.id)); if(!e)return res.status(404).json({success:false,message:'Сотрудник не найден'}); if(Number(req.staff.id)!==Number(e.id) && !['owner','director'].includes(req.staff.role))return res.status(403).json({success:false,message:'Можно управлять только своей сменой'});
  if(e.shiftActive)return res.json({success:true,employee:employeePublic(e,s),message:'Смена уже открыта'});
  const shiftClaim=await db.claimActiveShift(e.id); if(!shiftClaim.claimed)return res.status(409).json({success:false,message:'У сотрудника уже есть активная смена'});
  e.shiftActive=true;e.shiftStartedAt=new Date().toISOString();e.shiftEndedAt=null;
  const today=dateKeyLocal(new Date()); const planned=(s.shifts||[]).find(x=>Number(x.employeeId)===Number(e.id)&&x.date===today&&x.status==='planned'); if(planned){planned.status='active';planned.startedAt=e.shiftStartedAt;}
  try{await saveStore(s);}catch(err){try{await db.releaseActiveShift(e.id)}catch{};throw err;}res.json({success:true,employee:employeePublic(e,s)});
});
app.post('/api/admin/employees/:id/shift/stop',adminAuth,async (req,res)=>{
  const s=readStore(); const e=s.employees.find(x=>Number(x.id)===Number(req.params.id)); if(!e)return res.status(404).json({success:false,message:'Сотрудник не найден'}); if(Number(req.staff.id)!==Number(e.id) && !['owner','director'].includes(req.staff.role))return res.status(403).json({success:false,message:'Можно управлять только своей сменой'});
  if(e.shiftActive&&e.shiftStartedAt){const endedAt=new Date().toISOString(); e.lastShiftMinutes=Math.max(0,Math.round((Date.now()-Date.parse(e.shiftStartedAt))/60000)); e.shiftHistory=Array.isArray(e.shiftHistory)?e.shiftHistory:[]; e.shiftHistory.push({id:Date.now(),start:e.shiftStartedAt,end:endedAt,minutes:e.lastShiftMinutes});}
  e.shiftActive=false;e.shiftEndedAt=new Date().toISOString(); const activePlanned=(s.shifts||[]).find(x=>Number(x.employeeId)===Number(e.id)&&x.status==='active'); if(activePlanned){activePlanned.status='completed';activePlanned.completedAt=e.shiftEndedAt;} await saveStore(s);await db.releaseActiveShift(e.id);res.json({success:true,employee:employeePublic(e,s)});
});

app.get('/api/admin/shifts',adminAuth,requirePermission('schedule'),(req,res)=>{const s=readStore();const shifts=Array.isArray(s.shifts)?s.shifts:[];const role=req.staff.role;const visible=['owner','director','administrator','manager'].includes(role)?shifts:shifts.filter(x=>Number(x.employeeId)===Number(req.staff.id));const employees=(s.employees||[]).map(e=>({id:e.id,name:e.name,role:canonicalRole(e.role)}));res.json({success:true,shifts:visible,employees});});
app.post('/api/admin/shifts',adminAuth,requirePermission('schedule'),async(req,res)=>{const s=readStore();if(!['owner','director','administrator','manager'].includes(req.staff.role))return res.status(403).json({success:false,message:'Недостаточно прав'});const employeeId=Number(req.body.employeeId),date=String(req.body.date||''),start=String(req.body.start||''),end=String(req.body.end||'');const e=s.employees.find(x=>Number(x.id)===employeeId);if(!e||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)||timeToMinutes(start)===null||timeToMinutes(end)===null)return res.status(400).json({success:false,message:'Укажите сотрудника, дату и корректное время'});if(start>=end)return res.status(400).json({success:false,message:'Время окончания должно быть позже начала'});s.shifts=Array.isArray(s.shifts)?s.shifts:[];const toMin=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));if(s.shifts.some(x=>Number(x.employeeId)===employeeId&&x.date===date&&x.status!=='cancelled'&&toMin(start)<toMin(x.end)&&toMin(end)>toMin(x.start)))return res.status(409).json({success:false,message:'У сотрудника уже есть пересекающаяся смена на эту дату'});const item={id:Date.now(),employeeId,date,start,end,status:'planned',createdAt:new Date().toISOString(),createdBy:req.staff.id};s.shifts.push(item);await saveStore(s);await audit(req,'create','shift',item.id,{employeeId});res.json({success:true,shift:item});});
app.patch('/api/admin/shifts/:id',adminAuth,requirePermission('schedule'),async(req,res)=>{const s=readStore();if(!['owner','director','administrator','manager'].includes(req.staff.role))return res.status(403).json({success:false,message:'Недостаточно прав'});const sh=(s.shifts||[]).find(x=>Number(x.id)===Number(req.params.id));if(!sh)return res.status(404).json({success:false,message:'Смена не найдена'});for(const k of ['date','start','end'])if(req.body[k]!==undefined)sh[k]=String(req.body[k]);if(req.body.employeeId!==undefined){const newEmployeeId=Number(req.body.employeeId);if(!s.employees.some(e=>Number(e.id)===newEmployeeId))return res.status(400).json({success:false,message:'Сотрудник не найден'});sh.employeeId=newEmployeeId;} if(req.body.status!==undefined){const st=String(req.body.status);if(!['planned','cancelled','active','completed'].includes(st))return res.status(400).json({success:false,message:'Недопустимый статус смены'});if(st==='active'&&sh.status!=='active')sh.startedAt=sh.startedAt||new Date().toISOString();if(st==='completed')sh.completedAt=sh.completedAt||new Date().toISOString();sh.status=st;}if(!/^\d{4}-\d{2}-\d{2}$/.test(sh.date)||timeToMinutes(sh.start)===null||timeToMinutes(sh.end)===null)return res.status(400).json({success:false,message:'Некорректная дата или время'});if(sh.start>=sh.end)return res.status(400).json({success:false,message:'Время окончания должно быть позже начала'});const toMin=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));if((s.shifts||[]).some(x=>Number(x.id)!==Number(sh.id)&&Number(x.employeeId)===Number(sh.employeeId)&&x.date===sh.date&&x.status!=='cancelled'&&toMin(sh.start)<toMin(x.end)&&toMin(sh.end)>toMin(x.start)))return res.status(409).json({success:false,message:'У сотрудника уже есть пересекающаяся смена на эту дату'});sh.updatedAt=new Date().toISOString();await saveStore(s);await audit(req,'update','shift',sh.id);res.json({success:true,shift:sh});});
app.delete('/api/admin/shifts/:id',adminAuth,requirePermission('schedule'),async(req,res)=>{const s=readStore();if(!['owner','director','administrator','manager'].includes(req.staff.role))return res.status(403).json({success:false,message:'Недостаточно прав'});const before=(s.shifts||[]).length;s.shifts=(s.shifts||[]).filter(x=>Number(x.id)!==Number(req.params.id));if(s.shifts.length===before)return res.status(404).json({success:false,message:'Смена не найдена'});await saveStore(s);await audit(req,'delete','shift',req.params.id);res.json({success:true});});

app.patch('/api/admin/settings',adminAuth,requirePermission('settings'),async (req,res)=>{ const s=readStore(); s.settings=s.settings||{}; s.settings.siteName=String(req.body.siteName||s.settings.siteName||'NOIRÉ COFFEE').trim(); s.settings.siteSubtitle=String(req.body.siteSubtitle||s.settings.siteSubtitle||'COFFEE & KITCHEN').trim(); const supported=['ru','en','hy','fr','de','es','it','pt','tr','ar','fa','he','zh-CN','zh-TW','ja','ko','hi','bn','ur','id','ms','th','vi','nl','pl','uk','cs','sk','ro','hu','el','bg','sr','hr','sl','sv','da','no','fi','et','lv','lt','is','ga','cy','mt','sq','mk','bs','ca','eu','gl','af','sw','am','az','be','ka','kk','ky','lo','mn','my','ne','ps','pa','ta','te','mr','gu','kn','ml','si','km','ceb','tl','jv','su','zu','xh','yo','ig','ha']; const lang=String(req.body.language||s.settings.language||'ru'); if(!supported.includes(lang)) return res.status(400).json({success:false,message:'Неподдерживаемый язык'}); s.settings.language=lang; await saveStore(s); await audit(req,'update','settings',null,{language:lang}); res.json({success:true,settings:s.settings}); });
app.get('/api/admin/employee-stats',adminAuth,(req,res)=>{ const s=readStore(); const requested=req.query.employeeId?Number(req.query.employeeId):Number(req.staff.id); if(requested!==Number(req.staff.id) && !can(req.staff.role,'employees'))return res.status(403).json({success:false,message:'Можно смотреть только свои показатели'}); const e=s.employees.find(x=>Number(x.id)===requested); if(!e)return res.status(404).json({success:false,message:'Сотрудник не найден'}); res.json({success:true,employee:employeePublic(e,s),stats:employeeStats(s,e.id)}); });


function findMenuItemByText(menu, text) {
  const q=String(text||'').toLowerCase().replace(/ё/g,'е').trim();
  if(!q) return null;
  return [...menu].sort((a,b)=>String(b.name).length-String(a.name).length).find(item=>{
    const name=String(item.name||'').toLowerCase().replace(/ё/g,'е');
    const words=name.split(/[^a-zа-я0-9]+/i).filter(Boolean);
    return q.includes(name) || words.filter(w=>w.length>3).some(w=>q.includes(w));
  }) || null;
}

function localClientAI(message) {
  const menu=readMenu();
  const q=String(message||'').trim();
  const low=q.toLowerCase().replace(/ё/g,'е');
  const item=findMenuItemByText(menu,q);
  const actionMatch=/(добав|полож|закаж).*(корзин|мне|нам)|добавь|add to cart/.test(low);
  if(actionMatch && item){
    const qtyMatch=low.match(/(?:x|×|\b)(\d+)\s*(?:шт|раз|x)?/i);
    const quantity=Math.max(1,Math.min(10,Number(qtyMatch?.[1]||1)));
    return {answer:`Добавляю ${item.name}${quantity>1?` ×${quantity}`:''} в корзину.`,action:{type:'add_to_cart',item:{...item,quantity}}};
  }
  if(/открой.*(меню|кофе|чай|завтрак|закуск|десерт|напит|пив|соус)|покажи.*(кофе|чай|завтрак|закуск|десерт|напит|пив|соус)/.test(low)){
    const pairs=[['кофе','coffee'],['чай','tea'],['завтрак','breakfast'],['закуск','snacks'],['десерт','desserts'],['напит','drinks'],['пив','beer'],['соус','sauces']];
    const found=pairs.find(([needle])=>low.includes(needle));
    return {answer:`Открываю ${found?categoryName(found[1]):'меню'}.`,action:{type:'open_menu',category:found?.[1]||'all'}};
  }
  if(/брон|заброниру|столик/.test(low)) return {answer:'Конечно. Открываю форму бронирования — там можно выбрать дату, время и столик.',action:{type:'open_reservation'}};
  if(/корзин|оформить заказ|оплат/.test(low)) return {answer:'Открываю корзину и оформление заказа.',action:{type:'open_checkout'}};
  if(/меню|что есть|что у вас|блюд/.test(low)){
    const popular=menu.filter(x=>x.popular).slice(0,5).map(x=>x.name).join(', ');
    return {answer:`В NOIRÉ есть кофе, чай, завтраки, закуски, основные блюда, десерты, напитки, пиво и соусы. Из популярных сейчас: ${popular}.`};
  }
  if(/привет|здравств|добрый|доброе/.test(low)) return {answer:'Привет! 👋 Я AI-помощник NOIRÉ. Могу просто поговорить с тобой, ответить на вопросы, помочь с меню, заказом и бронированием.'};
  return {answer:'Я могу помочь с меню, заказом, бронированием и атмосферой NOIRÉ. А если подключён AI-движок, могу поддержать и обычный свободный разговор на любые темы.'};
}

function categoryName(category){return ({coffee:'кофе',tea:'чай',breakfast:'завтраки',snacks:'закуски',food:'основные блюда',desserts:'десерты',drinks:'напитки',beer:'пиво',sauces:'соусы',all:'меню'})[category]||'меню'}

async function openAIClientChat(message, history, language='ru') {
  const key=process.env.OPENAI_API_KEY;
  if(!key) return null;
  const model=process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  // The API key must stay server-side in .env. Never expose it to browser JavaScript.
  const menu=readMenu();
  const compactMenu=menu.map(x=>`${x.id}|${x.name}|${x.category}|${x.price}|${x.description}`).join('\n');
  const system=`Ты — NOIRÉ AI, вежливый и естественный помощник кофейни NOIRÉ COFFEE. Отвечай на языке интерфейса (${String(language||'ru')}). Ты можешь свободно разговаривать на русском и других языках, отвечать на общие вопросы, поддерживать обычный разговор и одновременно помогать с сайтом и рестораном. Не начинай разговор с вопроса о бюджете. Если пользователь хочет действие на сайте, сначала помоги и верни короткий ответ. Никогда не утверждай, что ты человек. Для вопросов о меню используй только позиции из актуального списка ниже. Цены указаны в AMD. Если пользователь просит добавить блюдо в корзину, в конце ответа добавь ровно одну строку ACTION_JSON с JSON вида {"type":"add_to_cart","itemId":ID,"quantity":N}. Для открытия меню: {"type":"open_menu","category":"coffee|tea|breakfast|snacks|food|desserts|drinks|beer|sauces|all"}. Для бронирования: {"type":"open_reservation"}. Для оформления заказа: {"type":"open_checkout"}. Если действие не нужно — ACTION_JSON не добавляй.\n\nАКТУАЛЬНОЕ МЕНЮ:\n${compactMenu}`;
  const messages=[
    {role:'system',content:[{type:'input_text',text:system}]},
    ...(Array.isArray(history)?history.slice(-10).map(x=>({role:x.role==='assistant'?'assistant':'user',content:[{type:'input_text',text:String(x.content||'') }]})):[]),
    {role:'user',content:[{type:'input_text',text:String(message||'')}]}
  ];
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model,input:messages,max_output_tokens:700})});
  if(!response.ok) throw new Error(`AI provider ${response.status}`);
  const data=await response.json();
  let text=String(data.output_text||'');
  if(!text && Array.isArray(data.output)){
    text=data.output.flatMap(o=>Array.isArray(o.content)?o.content.map(c=>c.text||''):[]).filter(Boolean).join('\n');
  }
  return text.trim()||null;
}

function parseClientAIAction(text, menu){
  const match=String(text||'').match(/ACTION_JSON\s*[:=]?\s*```?json?\s*(\{[\s\S]*?\})\s*```?/i);
  if(!match) return {text:String(text||'').trim(),action:null};
  let action=null;
  try{action=JSON.parse(match[1]);}catch{action=null;}
  let clean=String(text).replace(match[0],'').trim();
  if(action?.type==='add_to_cart'){
    const item=menu.find(x=>Number(x.id)===Number(action.itemId));
    if(!item) return {text:clean,action:null};
    action={type:'add_to_cart',item:{...item,quantity:Math.max(1,Math.min(10,Number(action.quantity||1)))}};
  }
  return {text:clean,action};
}

app.post('/api/ai/chat', rateLimit('public-ai',15*60*1000,40), async (req,res)=>{
  const message=String(req.body.message||'').trim();
  const history=Array.isArray(req.body.history)?req.body.history:[];
  if(!message) return res.status(400).json({success:false,message:'Введите сообщение'});
  const menu=readMenu();
  try{
    const generated=await openAIClientChat(message,history,req.body.language||'ru');
    if(generated){
      const parsed=parseClientAIAction(generated,menu);
      return res.json({success:true,answer:parsed.text||'Готово.',action:parsed.action,mode:'ai'});
    }
  }catch(err){
    console.error('NOIRÉ AI provider error:',err.message);
  }
  const fallback=localClientAI(message);
  res.json({success:true,...fallback,mode:'local'});
});

function aiCustomer(message) {
  const menu=readMenu(); const text=String(message||'').toLowerCase();
  const numMatch=text.match(/(\d+)\s*(человек|гостей|персон|people|persons)?/i); const guests=Math.max(1,Number(numMatch?.[1]||2));
  const budgetMatch=text.match(/(?:до|бюджет|budget|under)\s*(\d[\d\s]*)/i); const budget=budgetMatch?Number(budgetMatch[1].replace(/\s/g,'')):0;
  const wantsDessert=/десерт|сладк|торт|тирамис|dessert/.test(text);
  const wantsCoffee=/кофе|капуч|эспресс|латте|coffee/.test(text);
  const wantsFood=/обед|ужин|еда|сыт|lunch|dinner|food/.test(text);
  const selectedCategories=[];
  if(wantsCoffee) selectedCategories.push('coffee','tea');
  if(wantsFood) selectedCategories.push('breakfast','snacks','food');
  if(wantsDessert) selectedCategories.push('desserts');
  let candidates=menu.filter(x=>x.category!=='sauces');
  if(selectedCategories.length) candidates=candidates.filter(x=>selectedCategories.includes(x.category));
  candidates.sort((a,b)=>(Number(b.popular)-Number(a.popular))||a.price-b.price);
  const picks=[]; let total=0; const chosen=new Set();
  const addCategory=(cats,limit)=>{for(const item of candidates){if(limit<=0)break;if(chosen.has(item.id)||!cats.includes(item.category))continue;const qty=(guests>3&&['coffee','tea','drinks'].includes(item.category))?Math.ceil(guests/2):1;if(budget&&total+item.price*qty>budget)continue;picks.push({...item,quantity:qty});chosen.add(item.id);total+=item.price*qty;limit--}};
  if(wantsCoffee) addCategory(['coffee','tea'],2);
  if(wantsFood) addCategory(['breakfast','snacks','food'],Math.max(1,guests>=4?2:1));
  if(wantsDessert) addCategory(['desserts'],Math.max(1,guests>=4?2:1));
  if(!picks.length) addCategory(['coffee','food','desserts','drinks','tea'],guests<=2?2:4);
  return {guests,budget,perPerson:budget?budget/guests:0,items:picks,total:calcTotal(picks),message: budget ? `Для ${guests} гостей я собрал вариант примерно на ${calcTotal(picks).toLocaleString('ru-RU')} ֏.` : `Для ${guests} гостей я бы начал с этого набора.`};
}
app.post('/api/ai/recommend', rateLimit('public-ai-recommend',15*60*1000,40), (req,res)=>res.json({success:true,...aiCustomer(req.body.message)}));
app.post('/api/admin/ai', adminAuth, requirePermission('ai'), async (req,res)=>{
  const s=readStore(), menu=readMenu();
  const raw=String(req.body.message||'').trim(); const q=raw.toLowerCase();
  if(req.staff.role==='manager' && /выруч|оборот|доход|продаж|средн.*чек|аналитик|финанс/.test(q)) return res.status(403).json({success:false,message:'Полная финансовая аналитика доступна только руководящим ролям'});
  const analytics=analyticsSnapshot(s,menu);
  const canSeeAnalytics=can(req.staff.role,'analytics');
  const period=/год|year/.test(q)?'year':/месяц|month/.test(q)?'month':/недел|week/.test(q)?'week':'day';
  const ps=analytics.periods[period];
  let answer='Я на связи. Скажи, что именно нужно узнать или изменить в NOIRÉ.'; let action=null;
  const num=q.match(/#?(\d{3,})/); const order=num?s.orders.find(o=>String(o.number)===num[1]||String(o.id)===num[1]):null;
  const emp=s.employees.find(e=>q.includes(String(e.name||'').toLowerCase())||q.includes(String(e.username||'').toLowerCase()));
  if(/выруч|оборот|доход|продаж/.test(q)) answer=`За ${period==='day'?'сегодня':period==='week'?'эту неделю':period==='month'?'этот месяц':'этот год'}: выручка ${ps.revenue.toLocaleString('ru-RU')} ֏, ${ps.orders} заказов, средний чек ${ps.avgCheck.toLocaleString('ru-RU')} ֏.`;
  else if(/средн.*чек/.test(q)) answer=`Средний чек за ${period}: ${ps.avgCheck.toLocaleString('ru-RU')} ֏.`;
  else if(/сколько.*заказ|заказ.*сколько/.test(q)) answer=`За ${period}: ${ps.orders} заказов.`;
  else if(/лучше|популяр|чаще|топ|прода[её]т/.test(q)) answer=`Чаще всего заказывают: ${analytics.topItems.slice(0,5).map((x,i)=>`${i+1}) ${x.name} — ${x.quantity} шт.`).join('; ') || 'данных пока мало'}.`;
  else if(/брон|резерв|стол.*брон/.test(q)) { const active=s.reservations.filter(r=>!['cancelled','completed'].includes(normalizeStatus(r.status))); const today=active.filter(r=>r.date===dateKeyLocal(new Date())); answer=`Активных бронирований ${active.length}. На сегодня — ${today.length}. ${today.slice(0,5).map(r=>`#${r.number} ${r.time}, ${r.name}, стол ${r.tableId?`T${String(r.tableId).padStart(2,'0')}`:'не выбран'}`).join('; ')}`; }
  else if(/свобод.*стол|занят.*стол|стол.*свобод|стол.*занят/.test(q)) { const snap=tableSnapshot(s); const free=snap.filter(t=>t.computedStatus==='available').length; const busy=snap.filter(t=>t.computedStatus!=='available').length; answer=`Сейчас свободно ${free} столов, занято/зарезервировано ${busy}. Свободные: ${snap.filter(t=>t.computedStatus==='available').map(t=>t.name).join(', ')||'нет'}.`; }
  else if(/сотруд|работа|смен/.test(q) || emp) { if(req.staff.role==='manager' && (!emp || Number(emp.id)!==Number(req.staff.id))) return res.status(403).json({success:false,message:'Менеджеру доступны только собственные показатели сотрудников'}); const list=emp?[emp]:[s.employees.find(e=>Number(e.id)===Number(req.staff.id))].filter(Boolean); answer=list.map(e=>{const st=employeeStats(s,e.id).month;return `${e.name}: ${e.shiftActive?'сейчас на смене':'не на смене'}, за месяц ${st.revenue.toLocaleString('ru-RU')} ֏ и ${st.orders} заказов.`}).join(' ' ) || 'Сотрудников пока нет.'; }
  else if(/статус.*заказ|заказ.*статус/.test(q) && order) answer=`Заказ #${order.number}: ${statusLabelForAI(order.status)}, ${Number(order.total||0).toLocaleString('ru-RU')} ֏, ${order.customer?.name||'гость'}.`;
  else if(/постав|измени|поменяй|сделай.*статус/.test(q) && order) {
    if(req.staff.role==='manager') return res.status(403).json({success:false,message:'Менеджер не может менять статусы заказов через AI'});
    if(!can(req.staff.role,'orders')) return res.status(403).json({success:false,message:'Недостаточно прав'});
    const status=/готов|ready/.test(q)?'ready':/готовит|кухн|prepar/.test(q)?'preparing':/подтверд|confirm/.test(q)?'confirmed':/отмен|cancel/.test(q)?'cancelled':/заверш|complete/.test(q)?'completed':'confirmed';
    const statusError=validateOrderStatusTransition(req.staff.role,order.status,status); if(statusError)return res.status(400).json({success:false,message:statusError}); order.status=status; order.updatedAt=new Date().toISOString(); if(status==='completed')order.completedAt=order.updatedAt; await saveStore(s); await audit(req,'ai_update','order',order.id,{status}); action={type:'order_status',orderNumber:order.number,status}; answer=`Готово. Заказ #${order.number} переведён в статус «${statusLabelForAI(status)}».`;
  }
  else if(/добав.*меню|создай.*пози|нов.*пози/.test(q)) answer='Я могу подготовить позицию, но для безопасного добавления нужны название, цена и категория. Например: «добавь в меню раф фисташка, 2500, coffee».';
  res.json({success:true,answer,action,period,analytics:canSeeAnalytics?{period:ps,topItems:analytics.topItems.slice(0,8)}:{period:null,topItems:[]}});
});
function statusLabelForAI(s){return ({new:'Новый',confirmed:'Подтверждён',preparing:'Готовится',ready:'Готов',arrived:'Гость пришёл',completed:'Завершён',cancelled:'Отменён'})[normalizeStatus(s)]||s;}


app.use((err,req,res,next)=>{console.error('NOIRE request error:',err);if(res.headersSent)return next(err);if(err?.code==='STORE_CONFLICT')return res.status(409).json({success:false,message:'Данные были изменены другим запросом. Обновите страницу и повторите действие.'});res.status(500).json({success:false,message:'Внутренняя ошибка сервера'});});

if (require.main === module) {
  app.listen(PORT,()=>console.log(`NOIRÉ running: http://localhost:${PORT}`));
}

module.exports = app;
