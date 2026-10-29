// Homepage: hero-ruggengraat, klachtenwijzer, tijdlijn, koppen per woord, tellende cijfers, magnetische knop, soepel scrollen.
// GSAP raakt alleen SVG-attributen, .magnet, .tl-fill, koptekst-woorden en de zonekaart aan;
// translate/clip-path-animaties komen uit CSS (zie site.css). Nooit beide op één element.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !reduced && !!window.gsap;
  if (window.gsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Hero: ruggengraat ---------- */
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

  if (!motion) {
    line?.setAttribute('d', RELAXED);
    bones?.setAttribute('d', RELAXED);
    if (verts.length) placeVertebrae();
    hero?.classList.add('is-in');
  } else {
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
        lenis.scrollTo(target, { offset: -70 });
        history.pushState(null, '', a.getAttribute('href'));
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
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

    // Koppen verschijnen woord voor woord.
    document.querySelectorAll('h2[data-split]').forEach((h) => {
      h.setAttribute('aria-label', h.textContent.trim());
      h.innerHTML = h.textContent.trim().split(/\s+/).map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
      gsap.from(h.querySelectorAll('.w > span'), {
        yPercent: 105, duration: 1, ease: 'expo.out', stagger: 0.07,
        scrollTrigger: { trigger: h, start: 'top 88%', once: true },
      });
    });

    // Cijfers tellen op zodra ze in beeld komen (alleen als het feit is ingevuld).
    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const n = { v: 0 };
      gsap.to(n, {
        v: end, duration: 1.6, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(n.v); },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  /* ---------- Klachtenwijzer ---------- */
  const chips = [...document.querySelectorAll('.zone-chip')];
  const spots = [...document.querySelectorAll('.hotspot')];
  const panels = [...document.querySelectorAll('[data-zone-panel]')];
  const glows = [...document.querySelectorAll('[data-glow]')];
  let current = chips.find((c) => c.getAttribute('aria-pressed') === 'true')?.dataset.zone;
  spots.forEach((s) => s.classList.toggle('is-active', s.dataset.zone === current));

  const selectZone = (id, from) => {
    if (id === current) return;
    const prev = panels.find((p) => p.dataset.zonePanel === current);
    const next = panels.find((p) => p.dataset.zonePanel === id);
    current = id;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.zone === id)));
    spots.forEach((s) => s.classList.toggle('is-active', s.dataset.zone === id));
    glows.forEach((g) => g.classList.toggle('is-active', g.dataset.glow === id));
    window.track?.('klachtenwijzer_zone', { zone: id, via: from });
    if (!motion) { if (prev) prev.hidden = true; next.hidden = false; return; }
    gsap.killTweensOf(panels);
    const show = () => {
      panels.forEach((p) => { p.hidden = p !== next; });
      gsap.fromTo(next, { x: 36, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
      gsap.fromTo(next.querySelectorAll('.ticks li'), { x: 16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.05, delay: 0.08 });
    };
    if (prev && !prev.hidden) gsap.to(prev, { x: -24, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: show });
    else show();
  };
  chips.forEach((c) => c.addEventListener('click', () => selectZone(c.dataset.zone, 'knop')));
  spots.forEach((s) => s.addEventListener('click', () => selectZone(s.dataset.zone, 'lichaam')));
  // Pijltjestoetsen tussen de knoppen.
  chips.forEach((c, i) => c.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    chips[(i + step + chips.length) % chips.length].focus();
  }));

  /* ---------- Eerste bezoek: tijdlijn licht op tijdens scrollen ---------- */
  const timeline = document.querySelector('[data-timeline]');
  if (timeline) {
    const steps = [...timeline.querySelectorAll('.tl-step')];
    const fill = timeline.querySelector('[data-timeline-fill]');
    const light = (progress) => steps.forEach((s, i) => s.classList.toggle('is-lit', progress >= i / steps.length + 0.02));
    if (!motion) {
      steps.forEach((s) => s.classList.add('is-lit'));
    } else {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 861px)', () => {
        gsap.set(fill, { scaleX: 0, scaleY: 1 });
        gsap.to(fill, {
          scaleX: 1, ease: 'none',
          scrollTrigger: {
            trigger: '[data-visit]', start: 'top top', end: '+=110%', pin: true, scrub: 0.6,
            onUpdate: (st) => light(st.progress),
          },
        });
      });
      mm.add('(max-width: 860px)', () => {
        gsap.set(fill, { scaleY: 0, scaleX: 1 });
        gsap.to(fill, {
          scaleY: 1, ease: 'none',
          scrollTrigger: { trigger: timeline, start: 'top 70%', end: 'bottom 60%', scrub: 0.6, onUpdate: (st) => light(st.progress) },
        });
      });
    }
  }
})();
