#!/usr/bin/env node
// pascal-export.mjs — export the GLB of the local Pascal scene without anyone clicking:
// headless Chrome (throw-away profile) opens the editor, waits for the scene, clicks Settings → Export GLB.
//
//   node tools/pascal-export.mjs [OUT.glb]          default ./backups/export-<date>.glb
//   node tools/pascal-export.mjs --inspect          print the editor's buttons (debug)
//
// Needs Google Chrome and a running `pascal editor`. Node 22+ (global WebSocket).
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, readdirSync, renameSync, rmSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCENE_ID = process.env.LAURENT_SCENE_ID || '966899483715';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9300 + Math.floor(Math.random() * 500);
const inspect = process.argv.includes('--inspect');
const out = resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || join('backups', `export-${new Date().toISOString().replace(/[:.]/g, '-')}.glb`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const die = (m) => { console.error('✗ ' + m); cleanup(); process.exit(1); };

let port;
try { port = execSync('pascal status', { encoding: 'utf8' }).match(/:(\d{4,5})/)[1]; } catch { die('Pascal ne tourne pas (pascal editor --no-open)'); }
const url = `http://pascal.localhost:${port}/scene/${SCENE_ID}`;

const profile = mkdtempSync(join(tmpdir(), 'pascal-export-'));
const dl = join(profile, 'downloads'); mkdirSync(dl);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--window-size=1600,1000',
  '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
function cleanup() { try { chrome.kill(); } catch {} setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} }, 500); }

async function json(path) { for (let i = 0; i < 50; i++) { try { return await (await fetch(`http://127.0.0.1:${PORT}${path}`)).json(); } catch { await sleep(200); } } die('Chrome ne répond pas'); }
function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else listeners.forEach((f) => f(m)); };
  const ready = new Promise((r) => (ws.onopen = r));
  return { ready, on: (f) => listeners.push(f), send: (method, params = {}) => new Promise((r) => { const k = ++id; pending.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); }), close: () => ws.close() };
}

const version = await json('/json/version');
const browser = cdp(version.webSocketDebuggerUrl); await browser.ready;
await browser.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dl, eventsEnabled: true });
const pages = await json('/json/list');
const page = cdp(pages.find((p) => p.type === 'page').webSocketDebuggerUrl); await page.ready;
const evaluate = async (expr) => { const r = await page.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value; };
await page.send('Page.enable'); await page.send('Runtime.enable');
const logs = []; page.on((m) => { if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push(m.params.args.map((a) => a.value ?? a.description).join(' ')); });
await page.send('Page.navigate', { url });

// wait until the scene is drawn: a WebGL canvas exists and the page stops changing for a few seconds
const buttons = `[...document.querySelectorAll('button,[role=menuitem],[role=button],a')].map(b=>(b.innerText||b.getAttribute('aria-label')||b.title||'').trim()).filter(Boolean)`;
let stable = 0, last = '';
for (let i = 0; i < 90 && stable < 4; i++) {
  await sleep(1000);
  const s = await evaluate(`(()=>{const c=document.querySelector('canvas');return c?(c.width+'x'+c.height+'|'+document.body.innerText.length):''})()`);
  stable = s && s === last ? stable + 1 : 0; last = s;
}
if (!last) die('éditeur non chargé (pas de canvas)');
await sleep(4000); // let the walls / openings finish building
if (inspect) { console.log(JSON.stringify(await evaluate(buttons), null, 1)); console.log(logs.slice(0, 10).join('\n')); cleanup(); process.exit(0); }

// Settings → Export GLB
const clickText = (re) => evaluate(`(()=>{const re=${re};const els=[...document.querySelectorAll('button,[role=menuitem],[role=button],a,div[role=option]')];
  const el=els.find(b=>re.test((b.innerText||b.getAttribute('aria-label')||b.title||'').trim()));if(!el)return false;el.click();return (el.innerText||el.getAttribute('aria-label')||el.title).trim()})()`);
let ok = await clickText(/export\s*glb/i);
if (!ok) { const s = await clickText(/^settings$/i); if (!s) die('bouton Settings introuvable (lancer avec --inspect)'); await sleep(800); ok = await clickText(/export\s*glb/i); }
if (!ok) die('bouton Export GLB introuvable (lancer avec --inspect)');
console.log(`  clic : ${ok}`);

let file = null;
for (let i = 0; i < 120 && !file; i++) {
  await sleep(1000);
  const f = readdirSync(dl).filter((n) => !n.endsWith('.crdownload'));
  if (f.length) { const p = join(dl, f[0]); const s1 = statSync(p).size; await sleep(700); if (statSync(p).size === s1 && s1 > 0) file = p; }
}
if (!file) die('aucun fichier exporté après 2 min' + (logs.length ? '\n' + logs.slice(0, 5).join('\n') : ''));
mkdirSync(resolve(out, '..'), { recursive: true });
renameSync(file, out);
console.log(`✓ GLB exporté : ${out} (${(statSync(out).size / 1e6).toFixed(1)} Mo)`);
browser.close(); page.close(); cleanup();
setTimeout(() => process.exit(0), 600);
