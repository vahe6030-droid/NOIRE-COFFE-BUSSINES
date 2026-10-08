(() => {
  const PUBLIC_PAGES = new Set(['menu','reservation','checkout','about','contacts','gallery','login','register','account']);
  async function init(){
    try{
      const r=await fetch('/api/site-settings',{cache:'no-store'}); if(!r.ok)return;
      const s=await r.json(); if(!s.success)return;
      const slug=String(s.restaurantSlug||'noire');
      const brand=String(s.siteName||'Restaurant').trim()||'Restaurant';
      const subtitle=String(s.siteSubtitle||'').trim();
      document.documentElement.dataset.restaurantBrand=brand;
      const contacts=s.contacts||{};
      document.querySelectorAll('[data-contact]').forEach(el=>{ const k=el.dataset.contact; el.textContent=String(contacts[k]||'—'); });
      document.documentElement.dataset.restaurantSlug=slug;
      if(slug==='noire') return; // Preserve the original NOIRÉ presentation byte-for-byte at runtime.

      // Replace legacy template branding only for non-default tenants.
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(n=>{ if(n.parentElement?.closest('script,style,code,pre'))return; if(/NOIRÉ|NOIRE/.test(n.nodeValue||'')) n.nodeValue=n.nodeValue.replace(/NOIRÉ|NOIRE/g,brand); });
      document.querySelectorAll('[aria-label],[title],[alt]').forEach(el=>{
        for(const a of ['aria-label','title','alt']){const v=el.getAttribute(a);if(v&&/NOIRÉ|NOIRE/.test(v))el.setAttribute(a,v.replace(/NOIRÉ|NOIRE/g,brand));}
      });
      document.title=document.title.replace(/NOIRÉ|NOIRE/g,brand);
      // The original animated intro spells NOIRÉ letter-by-letter; never show it on another tenant.
      document.querySelectorAll('.noire-intro').forEach(el=>el.remove());
      document.querySelectorAll('.logo-main,.auth-brand b').forEach(el=>{el.textContent=brand;el.setAttribute('data-noire-no-translate','true');});
      // An empty subtitle is intentional for a newly created restaurant.
      document.querySelectorAll('.logo-sub,.auth-brand span').forEach(el=>{el.textContent=subtitle;el.setAttribute('data-noire-no-translate','true');});

      // A tenant has a stable public namespace. Internal public navigation stays inside it.
      document.querySelectorAll('a[href]').forEach(a=>{
        const raw=a.getAttribute('href')||''; if(!raw.startsWith('/')||raw.startsWith('//'))return;
        if(raw==='/' ){a.setAttribute('href',`/r/${encodeURIComponent(slug)}`);return;}
        const m=raw.match(/^\/(menu|reservation|checkout|about|contacts|gallery|login|register|account)\.html(?:([?#].*)?)$/);
        if(m&&PUBLIC_PAGES.has(m[1])) a.setAttribute('href',`/r/${encodeURIComponent(slug)}/${m[1]}${m[2]||''}`);
      });

      // New tenants must not display NOIRÉ's static home-gallery placeholders.
      try{
        const gr=await fetch('/api/gallery',{cache:'no-store'}); const gj=await gr.json();
        const items=Array.isArray(gj)?gj:(gj.gallery||gj.items||[]);
        if(!items.length) document.querySelectorAll('.hero-gallery').forEach(el=>el.hidden=true);
      }catch{}
    }catch{}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
