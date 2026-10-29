// Bouwt de pagina's uit src/*.html + partials/ + content/praktijk.json naar de root.
// Gebruik: node build.mjs   (daarna committen; de root-HTML is wat live gaat)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const praktijk = JSON.parse(read('./content/praktijk.json'));
const logo = read('./assets/logo.svg').replace(/<!--[\s\S]*?-->\s*/, '').trim();
const partial = (name) => read(`./partials/${name}.html`);

const SCRIPTS = {
  gsap: ['/assets/js/vendor/gsap.min.js', '/assets/js/vendor/ScrollTrigger.min.js'],
  lenis: ['/assets/js/vendor/lenis.min.js'],
  home: ['/assets/js/home.js'],
};

// Ontbrekende praktijkgegevens worden een zichtbare TODO, nooit een verzonnen waarde.
const todo = (label) => `<span class="todo">${label}</span>`;
const value = (key, label) => praktijk[key] ?? todo(label);

const belLink = (cls) => praktijk.telefoon
  ? `<a class="${cls}" href="tel:${praktijk.telefoon}" data-track="bel_klik"><svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#phone"/></svg> Bel</a>`
  : `<a class="${cls}" href="/contact#bellen" data-track="bel_klik"><svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#phone"/></svg> Bel</a><!-- TODO: telefoonnummer in content/praktijk.json -->`;

for (const file of readdirSync(new URL('./src/', import.meta.url)).filter((f) => f.endsWith('.html'))) {
  const src = read(`./src/${file}`);
  const metaMatch = src.match(/^<!--meta\s*([\s\S]*?)-->/);
  if (!metaMatch) throw new Error(`${file}: geen <!--meta {...} --> blok`);
  const meta = JSON.parse(metaMatch[1]);
  const body = src.slice(metaMatch[0].length).trim();

  const scripts = ['/assets/js/site.js', ...(meta.scripts || []).flatMap((k) => SCRIPTS[k])]
    .map((s) => `<script src="${s}" defer></script>`).join('\n');

  let html = [
    partial('head'),
    '<body>',
    partial('contract'),
    partial('header'),
    body,
    partial('footer'),
    '</body>\n</html>\n',
  ].join('\n');

  html = html
    .replaceAll('{{title}}', meta.title)
    .replaceAll('{{description}}', meta.description)
    .replaceAll('{{url}}', praktijk.domein + meta.path)
    .replaceAll('{{scripts}}', scripts)
    .replaceAll('{{logo}}', logo)
    .replaceAll('{{plaats}}', value('plaats', 'plaats'))
    .replace(/\{\{bel-link:([\w-]+)\}\}/g, (_, cls) => belLink(cls))
    .replace(/\{\{current:([^}]+)\}\}/g, (_, path) => (path === meta.path ? 'aria-current="page"' : ''));

  const left = html.match(/\{\{[^}]+\}\}/g);
  if (left) throw new Error(`${file}: onvervangen tokens ${left.join(', ')}`);
  writeFileSync(new URL(`./${file}`, import.meta.url), html);
  console.log('gebouwd:', file);
}
