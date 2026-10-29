// Lokale server die net als Vercel (cleanUrls) /contact uit contact.html serveert.
// Gebruik: node serve.mjs [poort]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.argv[2]) || 4321;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };

const tryFile = async (p) => { try { return (await stat(p)).isFile() ? p : null; } catch { return null; } };

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const base = join(root, path);
  const file = (await tryFile(base)) || (await tryFile(base + '.html')) || (await tryFile(join(base, 'index.html')));
  if (!file) { res.writeHead(404, { 'content-type': types['.html'] }); res.end(await readFile(join(root, '404.html')).catch(() => 'Niet gevonden')); return; }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(port, () => console.log(`http://localhost:${port}`));
