// Homepage-beweging: intro, de ruggengraat die losser wordt, magnetische hoofdknop, soepel scrollen.
// GSAP raakt alleen SVG-attributen en .magnet aan; translate/clip-path komen uit CSS (zie site.css).
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('[data-hero]');
  const line = document.querySelector('[data-spine-line]');
  const bones = document.querySelector('[data-spine-bones]');

  // Stijf (hoekig) naar ontspannen (natuurlijke S). Zelfde aantal getallen, dus GSAP kan ertussen tweenen.
  const RELAXED = 'M100 20 C 78 70, 76 112, 92 162 C 110 222, 130 262, 124 330 C 118 398, 82 428, 88 488 C 92 534, 101 556, 100 580';
  const FLOW = 'M100 20 C 116 74, 120 116, 104 166 C 86 226, 70 268, 78 334 C 86 400, 120 432, 112 490 C 106 536, 99 556, 100 580';

  // Wervels: losse afgeronde blokjes langs de lijn, onderaan breder (lendenwervels), bovenaan smaller (nekwervels).
  const vGroup = document.querySelector('[data-vertebrae]');
  const COUNT = 24;
  const verts = [];
  if (vGroup && line) {
    const ns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < COUNT; i++) {
      const t = i / (COUNT - 1);
      const w = 16 + t * 16, h = 6.5 + t * 4.5;
      const r = document.createElementNS(ns, 'rect');
      r.setAttribute('width', w); r.setAttribute('height', h);
      r.setAttribute('x', -w / 2); r.setAttribute('y', -h / 2); r.setAttribute('rx', h / 2);
      vGroup.appendChild(r);
      verts.push(r);
    }
    document.querySelector('.spine').classList.add('has-vertebrae');
  }
  const placeVertebrae = (reveal = 1) => {
    const len = line.getTotalLength();
    verts.forEach((r, i) => {
      const at = (0.03 + (i / (COUNT - 1)) * 0.94) * len;
      const p = line.getPointAtLength(at);
      const q = line.getPointAtLength(Math.min(len, at + 1));
      const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI - 90;
      r.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${angle})`);
      r.style.opacity = i / COUNT < reveal ? 0.92 : 0;
    });
  };

  if (reduced || !window.gsap) {
    line?.setAttribute('d', RELAXED);
    bones?.setAttribute('d', RELAXED);
    if (verts.length) placeVertebrae();
    hero?.classList.add('is-in');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Soepel scrollen, gekoppeld aan ScrollTrigger.
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
      history.pushState(null, '', a.getAttribute('href'));
    });
  }

  requestAnimationFrame(() => hero.classList.add('is-in'));

  // Intro: lijn tekent zich stijf, dan ontspant hij en komen de wervels erbij.
  const len = line.getTotalLength();
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  const reveal = { v: 0 };
  placeVertebrae(0);
  gsap.timeline({ delay: 0.5, onUpdate: () => placeVertebrae(reveal.v) })
    .to(line, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' })
    .to(reveal, { v: 1, duration: 1.1, ease: 'power2.out' }, 0.35)
    .to([line, bones], { attr: { d: RELAXED }, duration: 1.6, ease: 'expo.out' }, '-=0.1')
    .set(line, { strokeDasharray: 'none' });

  // Bij scrollen beweegt de ruggengraat mee: van ontspannen naar een vloeiende tegenbeweging.
  gsap.fromTo([line, bones], { attr: { d: RELAXED } }, {
    attr: { d: FLOW }, ease: 'none', immediateRender: false, onUpdate: () => placeVertebrae(),
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 },
  });

  // Swash onder "vrij" tekent na de koptekst.
  const swash = document.querySelector('.swash path');
  if (swash) {
    const l = swash.getTotalLength();
    gsap.fromTo(swash, { strokeDasharray: l, strokeDashoffset: l }, { strokeDashoffset: 0, duration: 1.1, delay: 1.05, ease: 'power3.out' });
  }

  // Magnetische hoofdknop, alleen met een echte muis.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
      const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.28);
        y((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }
})();
