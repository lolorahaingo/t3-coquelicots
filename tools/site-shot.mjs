#!/usr/bin/env node
// site-shot.mjs — screenshots of the (locally served) site with headless Chrome, for checks without a visible browser.
//   node tools/site-shot.mjs BASE_URL PASSWORD OUT_DIR "name=#visite=x,z,yaw,pitch" ...
// The password is typed into the gate of the local site (use a test password on a local build, never the real one online).
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [base, password, outDir, ...views] = process.argv.slice(2);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9800 + Math.floor(Math.random() * 150);
const profile = mkdtempSync(join(tmpdir(), 'site-shot-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--window-size=1280,800', '--no-first-run', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const done = (code = 0) => { try { chrome.kill(); } catch {} setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(code); }, 400); };
async function json(p) { for (let i = 0; i < 50; i++) { try { return await (await fetch(`http://127.0.0.1:${PORT}${p}`)).json(); } catch { await sleep(200); } } throw new Error('chrome'); }
const pages = await json('/json/list');
const ws = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}) => new Promise((r) => { const k = ++id; pend.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable');
mkdirSync(outDir, { recursive: true });
// unlock once (remember the key in localStorage)
await send('Page.navigate', { url: base });
for (let i = 0; i < 40; i++) { await sleep(500); if (await ev(`!!document.getElementById('gatePw') && !document.getElementById('gate').hidden`)) break; }
await ev(`(()=>{const i=document.getElementById('gatePw');i.value=${JSON.stringify(password)};document.getElementById('gateRemember').checked=true;document.getElementById('gateForm').requestSubmit();})()`);
for (let i = 0; i < 60; i++) { await sleep(500); if (await ev(`document.getElementById('loading').classList.contains('done')`)) break; }
for (const v of views) {
  const [name, hash] = v.split('=', 2).length === 2 ? [v.slice(0, v.indexOf('=')), v.slice(v.indexOf('=') + 1)] : [v, ''];
  await send('Page.navigate', { url: base.replace(/#.*$/, '') + '?shot=' + Date.now() + hash });
  for (let i = 0; i < 60; i++) { await sleep(500); if (await ev(`document.getElementById('loading').classList.contains('done')`)) break; }
  await sleep(2500);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync(join(outDir, name + '.jpg'), Buffer.from(shot.result.data, 'base64'));
  console.log('✓', name);
}
done();
