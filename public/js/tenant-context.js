(() => {
  'use strict';
  const pages = new Set(['menu','reservation','checkout','about','contacts','gallery','login','register','account']);
  const match = location.pathname.match(/^\/r\/([a-z0-9-]{1,64})(?:\/|$)/);
  const admin = /^\/admin(?:\.html)?\/?$/.test(location.pathname);
  let adminSlug = 'noire';
  if (admin) {
    try {
      const cookie = document.cookie.match(/(?:^|;\s*)noire_restaurant=([^;]+)/);
      const selected = cookie ? decodeURIComponent(cookie[1]) : 'noire';
      if (/^[a-z0-9-]{1,64}$/.test(selected)) adminSlug = selected;
    } catch {}
  }
  let slug = match ? match[1] : admin ? adminSlug : 'noire';
  function publicUrl(value = '/') {
    const url = new URL(value, location.origin);
    if (url.origin !== location.origin || slug === 'noire') return value;
    if (url.pathname === '/' || url.pathname === '/index.html')
      return `/r/${slug}${url.search}${url.hash}`;
    const name = url.pathname.match(/^\/([a-z-]+)(?:\.html)?$/)?.[1];
    return pages.has(name) ? `/r/${slug}/${name}${url.search}${url.hash}` : value;
  }
  function rewriteLinks(root = document) {
    const links = root.matches?.('a[href]') ? [root] : [];
    root.querySelectorAll?.('a[href]').forEach(a => links.push(a));
    links.forEach(a => {
      const raw = a.getAttribute('href');
      if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return;
      const next = publicUrl(raw);
      if (next !== raw) a.setAttribute('href', next);
    });
  }
  window.NoireTenant = Object.freeze({
    get slug() { return slug; },
    publicUrl,
    setAdminTenant(value) {
      if (!admin || !/^[a-z0-9-]{1,64}$/.test(value)) return;
      slug = value;
      document.documentElement.dataset.restaurantSlug = slug;
      // Also update links previously pointing at a different signed-in restaurant.
      document.querySelectorAll('.admin-brand,.admin-ghost[href]').forEach(a => {
        if (a.tagName === 'A' && a.getAttribute('href') !== '/restaurant-register')
          a.setAttribute('href', slug === 'noire' ? '/' : `/r/${slug}`);
      });
      rewriteLinks();
    }
  });
  document.documentElement.dataset.restaurantSlug = slug;
  // Public API context belongs to this page, never to the last opened browser tab.
  // The server continues to take protected admin context from its signed session.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function(input, options = {}) {
    const url = new URL(input instanceof Request ? input.url : input, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/'))
      return nativeFetch(input, options);
    const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('X-Noire-Restaurant', slug);
    if (admin) headers.set('X-Noire-Admin-Context', '1');
    return nativeFetch(input, {...options, headers});
  };
  document.addEventListener('click', event => {
    const a = event.target.closest?.('a[href]');
    if (a) rewriteLinks(a);
  }, true);
  function init() {
    rewriteLinks();
    new MutationObserver(mutations => {
      mutations.forEach(m => {
        if (m.type === 'attributes') rewriteLinks(m.target);
        else m.addedNodes.forEach(n => { if (n.nodeType === Node.ELEMENT_NODE) rewriteLinks(n); });
      });
    }).observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['href']});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
