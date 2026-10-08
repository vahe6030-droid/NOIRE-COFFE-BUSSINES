const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { AsyncLocalStorage } = require('async_hooks');
const { neon } = require('@neondatabase/serverless');
const base = require('./db');

const ctx = new AsyncLocalStorage();
const ROOT = __dirname;
const TENANT_DIR = path.join(ROOT, 'data', 'tenants');
const cache = new Map();
let schemaReady = null;

function slugify(value) {
  return String(value || '').trim().toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}
function defaultSlug() { return 'noire'; }
function current() { return ctx.getStore() || { slug: defaultSlug(), restaurantId: 1, isDefault: true }; }
function tenantFile(slug) { return path.join(TENANT_DIR, `${slug}.json`); }
function clone(v) { return JSON.parse(JSON.stringify(v)); }
function defaultTenantPayload(name='Restaurant') {
  // A newly-created tenant gets the application's structure, but NEVER NOIRÉ's
  // business content. This keeps the original restaurant intact and gives the
  // new owner a genuinely empty workspace to configure from scratch.
  const s = clone(base.getStore());
  s.orders=[];
  s.reservations=[];
  s.customers=[];
  s.tables=[];
  s.employees=[];
  s.shifts=[];
  // Tenant-specific restaurant settings must start clean. Never inherit NOIRÉ contacts/branding/integrations.
  s.settings={
    siteName:name,
    siteSubtitle:'',
    language:'ru',
    appearance:{},
    publicTexts:{ heroTitle:'', heroDescription:'' },
    contacts:{ address:'', phone:'', email:'', website:'', instagram:'', hours:'' },
  };
  s.admin={ username:'', passwordHash:'', role:'owner', sessionVersion:0, name:'Owner' };
  return { store:s, menu:[], gallery:[], history:[], auditLogs:[], versions:{store:0,menu:0,gallery:0,history:0} };
}
async function ensureSchema() {
  await base.ready();
  if (schemaReady) return schemaReady;
  schemaReady=(async()=>{
    if (!process.env.DATABASE_URL) {
      fs.mkdirSync(TENANT_DIR,{recursive:true});
      return;
    }
    const sql=neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS noire_restaurants (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      plan TEXT NOT NULL DEFAULT 'starter',
      subscription_status TEXT NOT NULL DEFAULT 'trial',
      trial_ends_at TIMESTAMPTZ
    )`;
    await sql`ALTER TABLE noire_restaurants ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter'`;
    await sql`ALTER TABLE noire_restaurants ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial'`;
    await sql`ALTER TABLE noire_restaurants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ`;
    const rows=await sql`INSERT INTO noire_restaurants(name,slug,status) VALUES('NOIRÉ','noire','active') ON CONFLICT(slug) DO UPDATE SET updated_at=NOW() RETURNING id`;
    const existing=await sql`SELECT id FROM noire_restaurants WHERE slug='noire' LIMIT 1`;
    const rid=Number(rows[0]?.id||existing[0]?.id||1);
    await sql`CREATE TABLE IF NOT EXISTS noire_tenant_data (
      restaurant_id BIGINT NOT NULL REFERENCES noire_restaurants(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value JSONB NOT NULL,
      version BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY(restaurant_id,key)
    )`;
    const seed={store:base.getStore(),menu:base.getMenu(),gallery:base.getGallery(),history:base.getHistory()};
    for(const [key,value] of Object.entries(seed)) {
      await sql`INSERT INTO noire_tenant_data(restaurant_id,key,value,version) VALUES(${rid},${key},${JSON.stringify(value)}::jsonb,0) ON CONFLICT(restaurant_id,key) DO NOTHING`;
    }
  })();
  return schemaReady;
}
async function restaurantBySlug(slug) {
  await ensureSchema(); slug=slugify(slug)||defaultSlug();
  if (!process.env.DATABASE_URL) {
    if(slug===defaultSlug()) return {id:1,name:'NOIRÉ',slug,status:'active'};
    const f=tenantFile(slug); if(!fs.existsSync(f)) return null;
    const j=JSON.parse(fs.readFileSync(f,'utf8')); return j.restaurant||null;
  }
  const sql=neon(process.env.DATABASE_URL);
  const rows=await sql`SELECT id,name,slug,status,created_at,updated_at FROM noire_restaurants WHERE slug=${slug} LIMIT 1`;
  return rows[0]||null;
}
async function loadTenant(restaurant) {
  const slug=restaurant.slug;
  if(slug===defaultSlug()) return {restaurant,store:base.getStore(),menu:base.getMenu(),gallery:base.getGallery(),history:base.getHistory(),auditLogs:base.getAuditLogs(),versions:{}};
  if (!process.env.DATABASE_URL) {
    const f=tenantFile(slug); const j=JSON.parse(fs.readFileSync(f,'utf8')); return {...j,restaurant};
  }
  const sql=neon(process.env.DATABASE_URL);
  const rows=await sql`SELECT key,value,version FROM noire_tenant_data WHERE restaurant_id=${Number(restaurant.id)}`;
  const data=Object.fromEntries(rows.map(r=>[r.key,r.value]));
  const versions=Object.fromEntries(rows.map(r=>[r.key,Number(r.version||0)]));
  return {restaurant,store:data.store||defaultTenantPayload(restaurant.name).store,menu:data.menu||[],gallery:data.gallery||[],history:data.history||[],auditLogs:data.audit_logs||[],versions};
}
async function runWithTenant(slug, fn) {
  const restaurant=await restaurantBySlug(slug);
  if(!restaurant || restaurant.status!=='active') { const e=new Error('Restaurant not found or inactive'); e.code='TENANT_NOT_FOUND'; throw e; }
  const data=await loadTenant(restaurant);
  return ctx.run({slug:restaurant.slug,restaurantId:Number(restaurant.id),isDefault:restaurant.slug===defaultSlug(),data},fn);
}
function data(){ return current().data; }
function getStore(){ return current().isDefault ? base.getStore() : (data()?.store||defaultTenantPayload(data()?.restaurant?.name||current().slug).store); }
function getMenu(){ return current().isDefault ? base.getMenu() : (data()?.menu||[]); }
function getGallery(){ return current().isDefault ? base.getGallery() : (data()?.gallery||[]); }
function getHistory(){ return current().isDefault ? base.getHistory() : (data()?.history||[]); }
function getAuditLogs(){
  if(current().isDefault) return base.getAuditLogs().filter(x=>!x?.meta?.restaurantSlug||x.meta.restaurantSlug==='noire');
  return data()?.auditLogs||[];
}
async function persistTenantKey(key,value){
  const c=current();
  if(c.isDefault) {
    if(key==='store') return base.saveStore(value);
    if(key==='menu') return base.saveMenu(value);
    if(key==='gallery') return base.saveGallery(value);
    if(key==='history') return base.saveHistory(value);
  }
  c.data[key]=value;
  if(!process.env.DATABASE_URL){
    fs.mkdirSync(TENANT_DIR,{recursive:true});
    fs.writeFileSync(tenantFile(c.slug),JSON.stringify({...c.data,restaurant:c.data.restaurant||{id:c.restaurantId,slug:c.slug,name:c.data.store?.settings?.siteName||c.slug,status:'active'}},null,2)); return;
  }
  const sql=neon(process.env.DATABASE_URL); const version=Number(c.data.versions?.[key]||0);
  const rows=await sql`UPDATE noire_tenant_data SET value=${JSON.stringify(value)}::jsonb,version=version+1,updated_at=NOW() WHERE restaurant_id=${c.restaurantId} AND key=${key} AND version=${version} RETURNING version`;
  if(rows.length){c.data.versions[key]=Number(rows[0].version);return;}
  const ins=await sql`INSERT INTO noire_tenant_data(restaurant_id,key,value,version) VALUES(${c.restaurantId},${key},${JSON.stringify(value)}::jsonb,0) ON CONFLICT(restaurant_id,key) DO NOTHING RETURNING version`;
  if(ins.length){c.data.versions[key]=0;return;}
  const e=new Error(`${key} changed concurrently; reload and retry`);e.code='STORE_CONFLICT';throw e;
}
async function saveStore(v){ return persistTenantKey('store',v); }
async function saveMenu(v){ return persistTenantKey('menu',v); }
async function saveGallery(v){ return persistTenantKey('gallery',v); }
async function saveHistory(v){ return persistTenantKey('history',v); }
async function saveArchiveAndStore(h,s){ await saveHistory(h); await saveStore(s); }
async function createRestaurant({name,slug,owner,language='ru'}){
  await ensureSchema(); name=String(name||'').trim(); slug=slugify(slug||name);
  if(name.length<2||!slug) { const e=new Error('Invalid restaurant name');e.code='VALIDATION';throw e; }
  if(await restaurantBySlug(slug)){const e=new Error('Restaurant slug already exists');e.code='DUPLICATE';throw e;}
  const payload=defaultTenantPayload(name); payload.store.settings.language=['ru','en','hy'].includes(language)?language:'ru'; payload.store.admin={...payload.store.admin,...owner,role:'owner',sessionVersion:0,active:true};
  if(!process.env.DATABASE_URL){
    const id=Date.now(); const restaurant={id,name,slug,status:'active',plan:'starter',subscription_status:'trial',trial_ends_at:new Date(Date.now()+14*86400000).toISOString(),created_at:new Date().toISOString()};
    fs.mkdirSync(TENANT_DIR,{recursive:true}); fs.writeFileSync(tenantFile(slug),JSON.stringify({...payload,restaurant},null,2)); return restaurant;
  }
  const sql=neon(process.env.DATABASE_URL);
  const rows=await sql`INSERT INTO noire_restaurants(name,slug,status,plan,subscription_status,trial_ends_at) VALUES(${name},${slug},'active','starter','trial',NOW()+INTERVAL '14 days') RETURNING id,name,slug,status,plan,subscription_status,trial_ends_at,created_at`;
  const r=rows[0];
  const qs=[]; for(const [key,value] of Object.entries({store:payload.store,menu:payload.menu,gallery:payload.gallery,history:payload.history,audit_logs:[]})) qs.push(sql`INSERT INTO noire_tenant_data(restaurant_id,key,value,version) VALUES(${Number(r.id)},${key},${JSON.stringify(value)}::jsonb,0)`);
  await sql.transaction(qs); return r;
}

async function listRestaurants(){
  await ensureSchema();
  if(!process.env.DATABASE_URL){
    const out=[{id:1,name:'NOIRÉ',slug:'noire',status:'active',plan:'legacy',subscription_status:'active',created_at:null,owner_name:'Platform',owner_email:''}];
    fs.mkdirSync(TENANT_DIR,{recursive:true});
    for(const name of fs.readdirSync(TENANT_DIR)){
      if(!name.endsWith('.json')) continue;
      try{const j=JSON.parse(fs.readFileSync(path.join(TENANT_DIR,name),'utf8'));if(j.restaurant)out.push({...j.restaurant,owner_name:j.store?.admin?.name||'',owner_email:j.store?.admin?.email||j.store?.admin?.username||''})}catch{}
    }
    return out.sort((a,b)=>String(a.slug).localeCompare(String(b.slug)));
  }
  const sql=neon(process.env.DATABASE_URL);
  return sql`SELECT r.id,r.name,r.slug,r.status,r.plan,r.subscription_status,r.trial_ends_at,r.created_at,r.updated_at, COALESCE(d.value->'admin'->>'name','') AS owner_name, COALESCE(d.value->'admin'->>'email',d.value->'admin'->>'username','') AS owner_email FROM noire_restaurants r LEFT JOIN noire_tenant_data d ON d.restaurant_id=r.id AND d.key='store' ORDER BY r.created_at ASC,r.id ASC`;
}
async function setRestaurantStatus(slug,status){
  await ensureSchema(); slug=slugify(slug); status=String(status||'');
  if(slug==='noire'){const e=new Error('Default tenant cannot be disabled');e.code='PROTECTED_TENANT';throw e;}
  if(!['active','suspended'].includes(status)){const e=new Error('Invalid status');e.code='VALIDATION';throw e;}
  if(!process.env.DATABASE_URL){
    const f=tenantFile(slug);if(!fs.existsSync(f)){const e=new Error('Restaurant not found');e.code='TENANT_NOT_FOUND';throw e;}
    const j=JSON.parse(fs.readFileSync(f,'utf8'));j.restaurant.status=status;j.restaurant.updated_at=new Date().toISOString();fs.writeFileSync(f,JSON.stringify(j,null,2));return j.restaurant;
  }
  const sql=neon(process.env.DATABASE_URL);const rows=await sql`UPDATE noire_restaurants SET status=${status},updated_at=NOW() WHERE slug=${slug} RETURNING id,name,slug,status,created_at,updated_at`;
  if(!rows.length){const e=new Error('Restaurant not found');e.code='TENANT_NOT_FOUND';throw e;}return rows[0];
}

async function setRestaurantSubscription(slug,{plan,subscriptionStatus}){
  await ensureSchema(); slug=slugify(slug);
  const plans=['starter','growth','pro','enterprise','legacy'];
  const statuses=['trial','active','past_due','cancelled'];
  if(!plans.includes(String(plan||''))||!statuses.includes(String(subscriptionStatus||''))){const e=new Error('Invalid subscription');e.code='VALIDATION';throw e;}
  if(!process.env.DATABASE_URL){
    if(slug==='noire') return {slug:'noire',plan:'legacy',subscription_status:'active'};
    const f=tenantFile(slug);if(!fs.existsSync(f)){const e=new Error('Restaurant not found');e.code='TENANT_NOT_FOUND';throw e;}
    const j=JSON.parse(fs.readFileSync(f,'utf8'));j.restaurant.plan=plan;j.restaurant.subscription_status=subscriptionStatus;j.restaurant.updated_at=new Date().toISOString();fs.writeFileSync(f,JSON.stringify(j,null,2));return j.restaurant;
  }
  const sql=neon(process.env.DATABASE_URL);const rows=await sql`UPDATE noire_restaurants SET plan=${plan},subscription_status=${subscriptionStatus},updated_at=NOW() WHERE slug=${slug} RETURNING id,name,slug,status,plan,subscription_status,trial_ends_at,created_at,updated_at`;
  if(!rows.length){const e=new Error('Restaurant not found');e.code='TENANT_NOT_FOUND';throw e;}return rows[0];
}

function scoped(v){return `${current().slug}:${v}`;}
function safeScopedNumber(id){const h=crypto.createHash('sha256').update(scoped(id)).digest();return h.readUIntBE(0,6);}
async function appendAuditLog(log){const enriched={...log,meta:{...(log.meta||{}),restaurantId:current().restaurantId,restaurantSlug:current().slug}}; if(current().isDefault)return base.appendAuditLog(enriched); const a=data().auditLogs||[];a.push(enriched);if(a.length>5000)a.splice(0,a.length-5000);data().auditLogs=a;return persistTenantKey('audit_logs',a);}
module.exports={
  ready:ensureSchema,runWithTenant,getCurrentTenant:()=>({slug:current().slug,restaurantId:current().restaurantId}),getRestaurantBySlug:restaurantBySlug,createRestaurant,listRestaurants,setRestaurantStatus,setRestaurantSubscription,
  getStore,getMenu,getGallery,getHistory,getAuditLogs,saveStore,saveMenu,saveGallery,saveHistory,saveArchiveAndStore,appendAuditLog,
  reserveNumber:(kind,...a)=>base.reserveNumber(scoped(kind),...a),
  claimOrderAtomic:(id,emp)=>base.claimOrderAtomic(scoped(id),safeScopedNumber(emp)), releaseOrderClaim:id=>base.releaseOrderClaim(scoped(id)),
  claimActiveShift:id=>base.claimActiveShift(safeScopedNumber(id)), releaseActiveShift:id=>base.releaseActiveShift(safeScopedNumber(id)),
  claimIdempotent:(scope,key)=>base.claimIdempotent(scoped(scope),key),getIdempotent:(scope,key)=>base.getIdempotent(scoped(scope),key),putIdempotent:(scope,key,r)=>base.putIdempotent(scoped(scope),key,r),
  cleanupIdempotency:base.cleanupIdempotency,clearIdempotent:(scope,key)=>base.clearIdempotent(scoped(scope),key),checkRateLimit:(scope,key,...a)=>base.checkRateLimit(scoped(scope),key,...a)
};
