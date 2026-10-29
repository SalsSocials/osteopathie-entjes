// Gedeeld op elke pagina: menu, compacte header, dataLayer-events. Geen afhankelijkheden.
(() => {
  const header = document.querySelector('[data-header]');

  // Tracking: alleen dataLayer-events klaarzetten, er wordt geen script van derden geladen.
  window.track = (event, data = {}) => { window.dataLayer.push({ event, ...data }); };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (el) window.track(el.dataset.track, { plek: el.dataset.trackPlek || null });
  });

  // Header wordt compact zodra de bovenkant van de pagina uit beeld is.
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;height:120px;width:1px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-compact', !entry.isIntersecting);
  }).observe(sentinel);

  // Dropdown: hover op desktop, knop voor toetsenbord en touch, Escape sluit.
  document.querySelectorAll('[data-sub]').forEach((item) => {
    const btn = item.querySelector('.sub-toggle');
    const set = (open) => { item.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', () => set(!item.classList.contains('is-open')));
    item.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') set(true); });
    item.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') set(false); });
    item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) set(false); });
    item.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); btn.focus(); } });
  });

  // Mobiel menu
  const toggle = document.querySelector('.menu-toggle');
  const panel = document.getElementById('mobiel-menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    header.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(panel.hidden));
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { setMenu(false); toggle.focus(); } });
})();
