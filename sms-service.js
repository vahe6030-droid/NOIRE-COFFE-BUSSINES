'use strict';
function envKey(slug,suffix){return `SMS_${String(slug||'noire').toUpperCase().replace(/[^A-Z0-9]+/g,'_')}_${suffix}`}
function get(slug,suffix){
 const local=process.env[envKey(slug,suffix)];
 // A tenant may NOT silently use the NOIRÉ account, caller ID or destination.
 return String(slug||'noire')==='noire' ? (local||process.env[`SMS_${suffix}`]||'') : (local||'');
}
function langText(lang,key,v={}){
 const m={
  newOrder:{ru:`${v.restaurant||'Ресторан'}: новый заказ #${v.number} на ${v.total} AMD.`,en:`${v.restaurant||'Restaurant'}: new order #${v.number} for ${v.total} AMD.`,hy:`${v.restaurant||'Ռեստորան'}․ նոր պատվեր #${v.number}՝ ${v.total} AMD։`},
  newReservation:{ru:`${v.restaurant||'Ресторан'}: новая бронь #${v.number}: ${v.date} ${v.time}, гостей: ${v.guests}.`,en:`${v.restaurant||'Restaurant'}: new reservation #${v.number}: ${v.date} ${v.time}, guests: ${v.guests}.`,hy:`${v.restaurant||'Ռեստորան'}․ նոր ամրագրում #${v.number}՝ ${v.date} ${v.time}, հյուրեր՝ ${v.guests}։`},
  orderReady:{ru:`${v.restaurant||'Ресторан'}: ваш заказ #${v.number} готов.`,en:`${v.restaurant||'Restaurant'}: your order #${v.number} is ready.`,hy:`${v.restaurant||'Ռեստորան'}․ ձեր #${v.number} պատվերը պատրաստ է։`},
  orderCancelled:{ru:`${v.restaurant||'Ресторан'}: ваш заказ #${v.number} отменён.`,en:`${v.restaurant||'Restaurant'}: your order #${v.number} was cancelled.`,hy:`${v.restaurant||'Ռեստորան'}․ ձեր #${v.number} պատվերը չեղարկվել է։`},
  reservationConfirmed:{ru:`${v.restaurant||'Ресторан'}: ваше бронирование #${v.number} подтверждено.`,en:`${v.restaurant||'Restaurant'}: your reservation #${v.number} is confirmed.`,hy:`${v.restaurant||'Ռեստորան'}․ ձեր #${v.number} ամրագրումը հաստատվել է։`},
  reservationCancelled:{ru:`${v.restaurant||'Ресторан'}: ваше бронирование #${v.number} отклонено/отменено.`,en:`${v.restaurant||'Restaurant'}: your reservation #${v.number} was declined/cancelled.`,hy:`${v.restaurant||'Ռեստորան'}․ ձեր #${v.number} ամրագրումը մերժվել/չեղարկվել է։`}
 }; return (m[key]&&m[key][['ru','en','hy'].includes(lang)?lang:'ru'])||'';
}
async function send(slug,to,body){
 const sid=get(slug,'TWILIO_ACCOUNT_SID'), token=get(slug,'TWILIO_AUTH_TOKEN'), from=get(slug,'FROM');
 if(!sid||!token||!from||!to||!body) return {skipped:true};
 const form=new URLSearchParams({To:String(to),From:String(from),Body:String(body)});
 const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,{method:'POST',headers:{authorization:`Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,'content-type':'application/x-www-form-urlencoded'},body:form,signal:AbortSignal.timeout(12000)});
 const d=await r.json().catch(()=>({})); if(!r.ok){const e=new Error(d.message||`SMS HTTP ${r.status}`);e.code='SMS_SEND_FAILED';throw e;} return d;
}
async function restaurant(slug,body){return send(slug,get(slug,'RESTAURANT_PHONE'),body)}
module.exports={send,restaurant,langText};
