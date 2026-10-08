'use strict';

function envKey(slug, suffix) {
  const p = String(slug || 'noire').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  return `PAYMENT_${p}_${suffix}`;
}
function pick(slug, suffix, fallback='') {
  const key = envKey(slug,suffix);
  // A new restaurant must explicitly opt into its OWN merchant account.
  // Falling back to NOIRÉ's global credentials could route its payments to NOIRÉ.
  if (String(slug || 'noire') !== 'noire') return process.env[key] || fallback;
  return process.env[key] || process.env[`PAYMENT_${suffix}`] || fallback;
}
function config(slug) {
  return {
    apiBase: pick(slug,'API_BASE','https://servicestest.ameriabank.am/VPOS/api/VPOS'),
    paymentPage: pick(slug,'PAGE_URL',''),
    clientId: pick(slug,'CLIENT_ID'), username: pick(slug,'USERNAME'), password: pick(slug,'PASSWORD'),
    currency: pick(slug,'CURRENCY','051'),
    enabled: pick(slug,'ENABLED','false') === 'true'
  };
}
function configured(slug) { const c=config(slug); return c.enabled && !!(c.clientId&&c.username&&c.password&&c.paymentPage); }
async function post(slug, method, body) {
  const c=config(slug);
  const r=await fetch(`${c.apiBase}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!r.ok) throw new Error(`Payment gateway HTTP ${r.status}`);
  return r.json();
}
function creds(c){return {ClientID:c.clientId,Username:c.username,Password:c.password};}
function pageUrl(template,paymentId,language='ru') {
  return String(template).replace('{paymentId}',encodeURIComponent(paymentId)).replace('{lang}',encodeURIComponent(language));
}
async function initPayment(slug,{amount,orderId,backUrl,description,cardHolderId,opaque,language}) {
  const c=config(slug); if(!configured(slug)){const e=new Error('CARD_PAYMENT_NOT_CONFIGURED');e.code='CARD_PAYMENT_NOT_CONFIGURED';throw e;}
  const d=await post(slug,'InitPayment',{...creds(c),Amount:Number(amount),OrderID:Number(orderId),BackURL:backUrl,Description:description,Currency:c.currency,CardHolderID:cardHolderId||'',Opaque:opaque||'',Timeout:1200,PaymentServiceType:1});
  const pid=d.PaymentID||d.PaymentId;
  if(!pid || !['0','00'].includes(String(d.ResponseCode ?? ''))) {const e=new Error(d.ResponseMessage||'PAYMENT_INIT_FAILED');e.code='PAYMENT_INIT_FAILED';throw e;}
  return {paymentId:String(pid),paymentUrl:pageUrl(c.paymentPage,pid,language),gateway:d};
}
async function details(slug,paymentId){const c=config(slug);return post(slug,'GetPaymentDetails',{PaymentID:String(paymentId),Username:c.username,Password:c.password});}
function approved(d, expectedAmount, expectedCurrency='051'){
  if(!d || !['0','00'].includes(String(d.ResponseCode??d.responseCode??''))) return false;
  const state=String(d.PaymentState||'').trim().toLowerCase();
  const orderStatus=String(d.OrderStatus||'').trim().toLowerCase();
  // A successful API lookup is NOT evidence that the payment was captured.
  if(!['payment_deposited','deposited','paid','payment_paid'].includes(state)) return false;
  if(orderStatus && !['2','deposited','paid','approved'].includes(orderStatus)) return false;
  if(String(d.Currency??'')!==String(expectedCurrency)) return false;
  const amount=Number(d.ApprovedAmount);
  return Number.isFinite(amount) && amount>0 && Math.abs(amount-Number(expectedAmount||0))<0.01;
}
function insufficient(d){return /(insufficient|not enough|недостат|անբավարար)/i.test(String(d.ResponseMessage||d.TrxnDescription||d.message||''));}
function expectedCurrency(slug){return config(slug).currency;}
module.exports={configured,initPayment,details,approved,insufficient,expectedCurrency};
