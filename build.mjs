// Bouwt de pagina's uit src/*.html + partials/ + content/*.json naar de root, plus sitemap.xml en llms.txt.
// Gebruik: node build.mjs   (daarna committen; de root-HTML is wat live gaat)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const json = (p) => JSON.parse(read(p));
const P = json('./content/praktijk.json');
const ZONES = json('./content/zones.json');
const FAQ = json('./content/faq.json');
const REVIEWS = json('./content/reviews.json');
const logo = read('./assets/logo.svg').replace(/<!--[\s\S]*?-->\s*/, '').trim();
const partial = (name) => read(`./partials/${name}.html`);

const SCRIPTS = {
  gsap: ['/assets/js/vendor/gsap.min.js', '/assets/js/vendor/ScrollTrigger.min.js'],
  lenis: ['/assets/js/vendor/lenis.min.js'],
  home: ['/assets/js/home.js'],
  afspraak: ['/assets/js/afspraak.js'],
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#${name}"/></svg>`;

// Ontbrekende gegevens worden een zichtbare TODO, nooit een verzonnen waarde.
const todo = (label) => `<span class="todo">${label}</span>`;
const val = (v, label) => (v === null || v === undefined || v === '' ? todo(label) : esc(v));

const belHref = P.telefoon ? `tel:${P.telefoon}` : '/contact#bellen';
const belLink = (cls, label = 'Bel') =>
  `<a class="${cls}" href="${belHref}" data-track="bel_klik">${icon('phone')} ${label}</a>`;

const minuten = (m) => (m ? `${m}` : null);

const openingstijden = () => P.openingstijden?.length
  ? `<dl class="hours">${P.openingstijden.map((o) => `<div><dt>${esc(o.label)}</dt><dd>${o.open ? `${o.open}–${o.dicht}` : 'Gesloten'}</dd></div>`).join('')}</dl>`
  : `<p>${todo('openingstijden')}</p>`;

const tokens = {
  logo: () => logo,
  plaats: () => val(P.plaats, 'plaats'),
  adres: () => (P.adres ? `${esc(P.adres)}<br>${esc(P.postcode)} ${esc(P.plaats)}` : todo('adres')),
  telefoon: () => (P.telefoon ? `<a href="tel:${P.telefoon}" data-track="bel_klik">${esc(P.telefoonWeergave || P.telefoon)}</a>` : todo('telefoonnummer')),
  email: () => (P.email ? `<a href="mailto:${P.email}">${esc(P.email)}</a>` : todo('e-mailadres')),
  kvk: () => val(P.kvk, 'KvK-nummer'),
  route: () => (P.routeUrl ? `<a class="link-arrow" href="${P.routeUrl}" rel="noopener" target="_blank">Plan je route ${icon('arrow-up-right')}</a>` : todo('routelink (Google Maps)')),
  openingstijden,
  'consult-duur': () => (P.consultDuurMinuten ? `<span data-count="${P.consultDuurMinuten}">${P.consultDuurMinuten}</span>` : todo('min')),
  'vervolg-duur': () => val(minuten(P.vervolgDuurMinuten), 'min'),
  'gem-behandelingen': () => (P.gemiddeldAantalBehandelingen ? `<span data-count="${P.gemiddeldAantalBehandelingen}">${P.gemiddeldAantalBehandelingen}</span>` : todo('aantal')),
  'tarief-eerste': () => val(P.tarieven.eersteConsult, 'bedrag'),
  'tarief-vervolg': () => val(P.tarieven.vervolgconsult, 'bedrag'),
  annuleren: () => val(P.annuleren, 'annuleringsregeling'),
  aangesloten: () => (P.aangeslotenBij.length ? `<ul class="plain">${P.aangeslotenBij.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : `<p>${todo('beroepsvereniging en registraties (bijv. NRO, RBCZ)')}</p>`),
  'bel-link': (cls) => belLink(cls),
  'bel-knop': () => belLink('btn btn-quiet btn-lg', P.telefoonWeergave ? `Bel ${esc(P.telefoonWeergave)}` : 'Bel'),
  whatsapp: () => P.whatsapp || '',
  mail: () => P.email || '',
  jaar: () => String(new Date().getFullYear()),
  domein: () => P.domein,
  'partial': (name) => partial(name),

  // Klachtenwijzer op de homepage
  'zone-chips': () => ZONES.map((z, i) =>
    `<button class="zone-chip" type="button" data-zone="${z.id}" aria-pressed="${i === 3}" aria-controls="zone-panel">${esc(z.naam)}</button>`).join('\n'),
  'zone-hotspots': () => ZONES.map((z) =>
    `<button class="hotspot" type="button" tabindex="-1" aria-hidden="true" data-zone="${z.id}" style="--x:${z.x}%;--y:${z.y}%"><span>${esc(z.kort)}</span></button>`).join('\n'),
  'zone-glows': () => ZONES.map((z, i) => {
    const ell = z.glow.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>` + (z.symmetrisch ? `<ellipse cx="${200 - cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>` : '')).join('');
    return `<g class="glow${i === 3 ? ' is-active' : ''}" data-glow="${z.id}" filter="url(#lh-blur)">${ell}</g>`;
  }).join(''),
  'zone-panels': () => ZONES.map((z, i) => `
<article class="zone-card" data-zone-panel="${z.id}" ${i === 3 ? '' : 'hidden'}>
  <h3>${esc(z.naam)}</h3>
  <p class="zone-sub">Veelvoorkomende klachten</p>
  <ul class="ticks">${z.klachten.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
  <p class="zone-help">${esc(z.hulp)}</p>
  <div class="zone-actions">
    <a class="btn btn-primary" href="#afspraak" data-track="afspraak_klik" data-track-plek="klachtenwijzer">Maak een afspraak ${icon('arrow-right')}</a>
    <a class="link-arrow" href="/behandelingen#${z.id}">Meer over ${esc(z.naam.toLowerCase())}</a>
  </div>
  <p class="zone-note">Osteopathie is geen vervanging van de huisarts. Twijfel je, overleg dan eerst met je huisarts.</p>
</article>`).join('\n'),

  // Behandelingen-pagina
  'zone-menu': () => ZONES.map((z) => `<li><a href="/behandelingen#${z.id}">${esc(z.naam)}</a></li>`).join(''),
  'zone-nav': () => ZONES.map((z) => `<li><a href="#${z.id}">${esc(z.naam)}</a></li>`).join(''),
  'zone-sections': () => ZONES.map((z, i) => `
<article class="treat" id="${z.id}" data-reveal style="--i:${i % 2}">
  <div class="treat-head"><h2>${esc(z.naam)}</h2></div>
  <div class="treat-body">
    <p>${esc(z.hulp)}</p>
    <h3>Vaak gezien bij</h3>
    <ul class="ticks">${z.klachten.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
    <a class="link-arrow" href="/contact#afspraak" data-track="afspraak_klik" data-track-plek="behandelingen-${z.id}">Maak een afspraak ${icon('arrow-right')}</a>
  </div>
</article>`).join('\n'),

  faq: () => FAQ.map((f) => `
<details class="faq-item">
  <summary><span>${esc(f.v)}</span><span class="faq-icon" aria-hidden="true"></span></summary>
  <div class="faq-answer"><p>${esc(f.a)}${f.todo ? ` ${todo(f.todo)}` : ''}</p></div>
</details>`).join('\n'),

  reviews: () => {
    const list = REVIEWS.reviews.length ? REVIEWS.reviews : (REVIEWS.toonVoorbeeld ? [
      { naam: 'VOORBEELD · naam cliënt', sterren: 5, tekst: 'VOORBEELD · Hier komt de tekst van een echte review, letterlijk overgenomen met toestemming van de cliënt.', bron: 'VOORBEELD · Google', voorbeeld: true },
      { naam: 'VOORBEELD · naam cliënt', sterren: 5, tekst: 'VOORBEELD · Tweede echte review. Verwijder deze kaarten door toonVoorbeeld op false te zetten in content/reviews.json.', bron: 'VOORBEELD · Google', voorbeeld: true },
      { naam: 'VOORBEELD · naam cliënt', sterren: 5, tekst: 'VOORBEELD · Derde echte review. Kort is prima: twee of drie zinnen lezen het best.', bron: 'VOORBEELD · Google', voorbeeld: true },
    ] : []);
    if (!list.length) return '';
    const stars = (n) => `<span class="stars" role="img" aria-label="${n} van de 5 sterren">${'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/></svg>'.repeat(n)}</span>`;
    return `
<section class="section reviews" id="ervaringen" aria-labelledby="reviews-titel">
  <div class="wrap">
    <div class="section-head"><h2 id="reviews-titel" data-split>Ervaringen</h2>
      <p>Wat cliënten zeggen over hun behandeling.${list[0].voorbeeld ? ` ${todo('echte reviews aanleveren')}` : ''}</p></div>
    <div class="review-grid">
      ${list.map((r, i) => `<figure class="review${r.voorbeeld ? ' is-example' : ''}" data-reveal style="--i:${i}">
        ${stars(r.sterren)}
        <blockquote><p>${esc(r.tekst)}</p></blockquote>
        <figcaption><strong>${esc(r.naam)}</strong><span>${esc(r.bron)}</span></figcaption>
      </figure>`).join('\n      ')}
    </div>
  </div>
</section>`;
  },
};

// Gestructureerde data: alleen velden die echt bekend zijn.
const business = () => {
  const b = {
    '@context': 'https://schema.org',
    '@type': ['MedicalBusiness', 'LocalBusiness'],
    '@id': `${P.domein}/#praktijk`,
    name: P.naam,
    url: `${P.domein}/`,
    image: `${P.domein}/assets/og.png`,
    medicalSpecialty: 'Osteopathie',
    founder: { '@type': 'Person', name: P.eigenaar, jobTitle: 'Osteopaat' },
    areaServed: P.regio,
  };
  if (P.telefoon) b.telephone = P.telefoon;
  if (P.email) b.email = P.email;
  if (P.adres) b.address = { '@type': 'PostalAddress', streetAddress: P.adres, postalCode: P.postcode, addressLocality: P.plaats, addressRegion: P.regio, addressCountry: 'NL' };
  if (P.openingstijden?.length) b.openingHoursSpecification = P.openingstijden.filter((o) => o.open).map((o) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: `https://schema.org/${o.schemaDag}`, opens: o.open, closes: o.dicht }));
  return b;
};
const faqSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.v, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
const breadcrumb = (meta) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${P.domein}/` },
    { '@type': 'ListItem', position: 2, name: meta.crumb, item: P.domein + meta.path },
  ],
});
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;

const pages = [];
for (const file of readdirSync(new URL('./src/', import.meta.url)).filter((f) => f.endsWith('.html'))) {
  const src = read(`./src/${file}`);
  const metaMatch = src.match(/^<!--meta\s*([\s\S]*?)-->/);
  if (!metaMatch) throw new Error(`${file}: geen <!--meta {...} --> blok`);
  const meta = JSON.parse(metaMatch[1]);
  const body = src.slice(metaMatch[0].length).trim();

  const scripts = ['/assets/js/site.js', ...(meta.scripts || []).flatMap((k) => SCRIPTS[k])]
    .map((s) => `<script src="${s}" defer></script>`).join('\n');
  const schema = [
    ...(meta.schema || []).includes('business') ? [ld(business())] : [],
    ...(meta.schema || []).includes('faq') ? [ld(faqSchema())] : [],
    ...(meta.crumb ? [ld(breadcrumb(meta))] : []),
  ].join('\n');

  let html = [
    partial('head'),
    '<body>',
    partial('contract'),
    partial('header'),
    body,
    partial('footer'),
    '</body>\n</html>\n',
  ].join('\n');

  // Partials eerst, zodat hun tokens daarna ook worden vervangen.
  html = html.replace(/\{\{partial:([\w-]+)\}\}/g, (_, n) => partial(n));
  html = html
    .replaceAll('{{title}}', esc(meta.title))
    .replaceAll('{{description}}', esc(meta.description))
    .replaceAll('{{url}}', P.domein + meta.path)
    .replaceAll('{{robots}}', meta.noindex ? 'noindex, follow' : 'index, follow')
    .replaceAll('{{scripts}}', scripts)
    .replaceAll('{{schema}}', schema)
    .replace(/\{\{current:([^}]+)\}\}/g, (_, path) => (path === meta.path ? 'aria-current="page"' : ''))
    .replace(/\{\{([\w-]+)(?::([\w-]+))?\}\}/g, (m, name, arg) => (tokens[name] ? tokens[name](arg) : m));

  const left = html.match(/\{\{[^}]+\}\}/g);
  if (left) throw new Error(`${file}: onvervangen tokens ${left.join(', ')}`);
  writeFileSync(new URL(`./${file}`, import.meta.url), html);
  if (!meta.noindex) pages.push(meta.path);
  console.log('gebouwd:', file);
}

// sitemap.xml met schone adressen
writeFileSync(new URL('./sitemap.xml', import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.sort().map((p) => `  <url><loc>${P.domein}${p}</loc></url>`).join('\n')}
</urlset>
`);

// llms.txt: korte, feitelijke samenvatting voor AI-assistenten
const t = (v, label) => v ?? `TODO: ${label}`;
writeFileSync(new URL('./llms.txt', import.meta.url), `# ${P.naam}

> Osteopathiepraktijk van osteopaat ${P.eigenaar} in ${t(P.plaats, 'plaats')}, ${P.regio}. Onderzoek en behandeling met de handen bij klachten aan nek, schouders, rug, heup, knie en hoofd.

## Wat is osteopathie
Osteopathie is een manuele behandelvorm: de osteopaat onderzoekt en behandelt met de handen en kijkt naar het lichaam als geheel. Een eerste consult bestaat uit een intake, een onderzoek, een behandeling en advies.

## Klachtgebieden
${ZONES.map((z) => `- [${z.naam}](${P.domein}/behandelingen#${z.id}): ${z.klachten.slice(0, 3).join(', ').toLowerCase()}`).join('\n')}

## Praktische informatie
- Adres: ${P.adres ? `${P.adres}, ${P.postcode} ${P.plaats}` : 'TODO: adres'}
- Telefoon: ${t(P.telefoonWeergave || P.telefoon, 'telefoonnummer')}
- E-mail: ${t(P.email, 'e-mailadres')}
- Tarieven: ${P.domein}/tarieven
- Afspraak maken: ${P.domein}/contact#afspraak

## Pagina's
- [Home](${P.domein}/)
- [Behandelingen](${P.domein}/behandelingen)
- [Over Cyril](${P.domein}/over-cyril)
- [Tarieven en vergoeding](${P.domein}/tarieven)
- [Contact en afspraak](${P.domein}/contact)
`);
console.log('gebouwd: sitemap.xml, llms.txt');
