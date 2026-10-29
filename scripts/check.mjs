// Controle van alle pagina's in headless Chrome (via CDP, geen extra pakketten):
// - volledige screenshots op 1440 en 390 px (met reduced motion, zodat alle inhoud zichtbaar is)
// - horizontale overloop, console-fouten, interne links (HTTP-status en ankers)
// Gebruik: node serve.mjs & node scripts/check.mjs [basis-url]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://localhost:4321';
const PAGES = ['/', '/behandelingen', '/over-cyril', '/tarieven', '/contact', '/privacy', '/bestaat-niet'];
const WIDTHS = [[1440, 900, false], [390, 844, true]];
const OUT = fileURLToPath(new URL('../.impeccable/review/pages/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(`${m.params.entry.text} ${m.params.entry.url || ''}`);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

const links = new Set();
const report = [];
for (const [w, h, mobile] of WIDTHS) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  for (const path of PAGES) {
    errors.length = 0;
    await send('Page.navigate', { url: BASE + path });
    await sleep(1800);
    const info = await evaluate(`(async () => {
      await document.fonts.ready;
      const over = [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 5).map((el) => el.tagName.toLowerCase() + '.' + [...el.classList].join('.'));
      return { height: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth > innerWidth, over,
        h1: document.querySelectorAll('h1').length, links: [...document.querySelectorAll('a[href]')].map((a) => a.href) };
    })()`);
    info.links.forEach((l) => links.add(l));
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: Math.min(info.height, 16000), deviceScaleFactor: 1, mobile });
    await sleep(400);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    const name = `${(path.slice(1) || 'home').replace(/\//g, '-')}-${w}.png`;
    writeFileSync(OUT + name, Buffer.from(shot.result.data, 'base64'));
    report.push({ page: path, width: w, h1: info.h1, overflowX: info.overflowX, over: info.over, errors: [...errors] });
  }
}

// Interne links: status en ankers
const broken = [];
for (const href of links) {
  if (!href.startsWith(BASE)) continue;
  const [url, hash] = href.split('#');
  const res = await fetch(url);
  if (!res.ok) { broken.push(`${href} → ${res.status}`); continue; }
  if (hash && !(await res.text()).includes(`id="${hash}"`)) broken.push(`${href} → anker ontbreekt`);
}

ws.close(); chrome.kill();
console.log(JSON.stringify({ report: report.filter((r) => r.overflowX || r.errors.length || r.h1 !== 1), checkedLinks: links.size, broken }, null, 2));
console.log('screenshots in', OUT);
