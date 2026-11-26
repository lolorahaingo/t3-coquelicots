#!/usr/bin/env node
// coquelicots-sync.mjs — sync Laurent's T3 between his local Pascal editor and plan.hellofabien.fr
//
//   node coquelicots-sync.mjs status                 what is online (sizes, dates, history)
//   node coquelicots-sync.mjs pull                   download the online scene and open it in local Pascal (creates or updates it)
//   node coquelicots-sync.mjs push [--glb FILE]      upload the local Pascal scene (+ the GLB exported from the editor);
//                                                    refused if the online scene changed since the last pull (Fabien's edits)
//   node coquelicots-sync.mjs pull-model [FILE]      download the online GLB (default ./laurent-online.glb)
//   node coquelicots-sync.mjs check                  check the local scene stays inside the T3 area (what the server enforces)
//
// Secret: env LAURENT_TOKEN, or the file ~/.config/coquelicots/laurent.token (chmod 600). Never print it, never commit it.
// Local Pascal: env PASCAL_URL (e.g. http://127.0.0.1:57384), else detected from `pascal status`.
// Node 22+ (built-in fetch). No dependencies.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const API = (process.env.PLAN_API || 'https://plan.hellofabien.fr/api/laurent').replace(/\/$/, '');
const SCENE_ID = process.env.LAURENT_SCENE_ID || '966899483715';
const BOX = { x0: -24, x1: -6.2, z0: -6, z1: 14 };   // same bounds as the server (world metres)
// the server refuses scripted clients without a browser-like identity only on the website, not on the API;
// a plain, honest user agent is enough here
const UA = 'coquelicots-sync/1.0';

function token() {
  const t = (process.env.LAURENT_TOKEN || (() => { try { return readFileSync(join(homedir(), '.config/coquelicots/laurent.token'), 'utf8'); } catch { return ''; } })()).trim();
  if (!t) die('Secret introuvable : définir LAURENT_TOKEN ou créer ~/.config/coquelicots/laurent.token (chmod 600).');
  return t;
}
function die(m) { console.error('✗ ' + m); process.exit(1); }
async function api(path, opts = {}) {
  const r = await fetch(API + '/' + path, { ...opts, headers: { 'Authorization': 'Bearer ' + token(), 'User-Agent': UA, ...(opts.headers || {}) } });
  if (!r.ok) { let b = ''; try { b = await r.text(); } catch {} die(`${opts.method || 'GET'} ${path} → HTTP ${r.status} ${b.trim().slice(0, 300)}`); }
  return r;
}
function pascalURL() {
  if (process.env.PASCAL_URL) return process.env.PASCAL_URL.replace(/\/$/, '');
  try {
    const out = execSync('pascal status', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const m = out.match(/:(\d{4,5})/); if (m) return 'http://127.0.0.1:' + m[1];
  } catch {}
  die('Pascal ne tourne pas : lancer `pascal editor` (ou définir PASCAL_URL=http://127.0.0.1:<port>).');
}
async function pascal(path, opts = {}) {
  const r = await fetch(pascalURL() + path, opts);
  return r;
}
function checkGraph(g) {
  const bad = [];
  for (const [id, v] of Object.entries(g.nodes || {})) {
    if (typeof v.name === 'string' && /[<>]/.test(v.name)) { bad.push(`${v.type} ${id} : nom « ${v.name} » (les caractères < et > sont interdits)`); continue; }
    const pts = [];
    if (v.type === 'wall' || v.type === 'separator') pts.push(v.start, v.end);
    else if (['zone', 'slab', 'ceiling'].includes(v.type)) (v.polygon || []).forEach(p => pts.push(p));
    else if (v.type === 'item' && g.nodes[v.parentId]?.type === 'level') pts.push([v.position[0], v.position[2]]);
    for (const p of pts) if (!p || p[0] < BOX.x0 || p[0] > BOX.x1 || p[1] < BOX.z0 || p[1] > BOX.z1) { bad.push(`${v.type} ${id} « ${v.name || ''} » en (${p && p.map(n => n.toFixed(2)).join(', ')})`); break; }
  }
  return bad;
}
function backup(name, data) {
  const dir = join(process.cwd(), 'backups'); mkdirSync(dir, { recursive: true });
  const f = join(dir, new Date().toISOString().replace(/[:.]/g, '-') + '__' + name); writeFileSync(f, data); return f;
}

// Fabien may change the model online too: a push is only allowed if the online scene is still the one we pulled
const LAST_PULL = join(process.cwd(), 'backups', 'last-pull.json');
async function onlineStamp() { const s = await (await api('status')).json(); return { bundle: s.bundle?.modified || null, model: s.model?.modified || null }; }
function recordPull(stamp) { mkdirSync(join(process.cwd(), 'backups'), { recursive: true }); writeFileSync(LAST_PULL, JSON.stringify(stamp, null, 2)); }

const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'status') {
  console.log(JSON.stringify(await (await api('status')).json(), null, 2));

} else if (cmd === 'pull') {
  const stamp = await onlineStamp(); // taken before the download: a change in between makes the next push refuse (safe side)
  const raw = Buffer.from(await (await api('bundle.json')).arrayBuffer());
  const f = backup('bundle-online.json', raw);
  const b = JSON.parse(raw.toString('utf8')), sc = b.scene;
  let n = 0;
  for (const [sha, b64] of Object.entries(b.artifacts || {})) {
    // skip what Pascal already has; back off when it rate-limits (HTTP 429)
    const head = await pascal('/api/artifacts/' + sha);
    if (head.ok) { await head.arrayBuffer(); n++; continue; }
    let r;
    for (let k = 0; k < 20; k++) {
      r = await pascal('/api/artifacts/' + sha, { method: 'PUT', body: Buffer.from(b64, 'base64') });
      if (r.status !== 429) break;
      await new Promise((res) => setTimeout(res, 1000 * (+r.headers.get('retry-after') || 1.5)));
    }
    if (!r.ok) die(`artefact ${sha.slice(0, 12)} refusé par Pascal (HTTP ${r.status})`); n++;
  }
  const cur = await pascal('/api/scenes/' + sc.id);
  let r;
  if (cur.status === 404) r = await pascal('/api/scenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sc.id, name: sc.name, projectId: null, graph: sc.graph }) });
  else {
    const c = await cur.json();
    backup('scene-local-before-pull.json', JSON.stringify({ id: c.id, name: c.name, graph: c.graph }));
    r = await pascal('/api/scenes/' + sc.id, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'If-Match': `"${c.version}"` }, body: JSON.stringify({ name: sc.name, graph: sc.graph }) });
  }
  if (!r.ok) die(`Pascal a refusé la scène (HTTP ${r.status}) ${(await r.text()).slice(0, 300)}`);
  recordPull(stamp);
  console.log(`✓ scène « ${sc.name} » (${Object.keys(sc.graph.nodes).length} nœuds, ${n} artefacts) importée dans Pascal : ${pascalURL().replace('127.0.0.1', 'pascal.localhost')}/scene/${sc.id}`);
  console.log(`  copie du paquet en ligne : ${f}`);

} else if (cmd === 'check' || cmd === 'push') {
  const r = await pascal('/api/scenes/' + SCENE_ID);
  if (!r.ok) die(`scène ${SCENE_ID} absente de Pascal local (HTTP ${r.status}) — faire d'abord « pull »`);
  const sc = await r.json();
  const bad = checkGraph(sc.graph);
  if (bad.length) die('éléments hors du T3 (le serveur refuserait) :\n  ' + bad.slice(0, 20).join('\n  '));
  if (cmd === 'check') { console.log(`✓ ${Object.keys(sc.graph.nodes).length} nœuds, tout est dans l'emprise du T3`); process.exit(0); }
  // never overwrite Fabien's changes: the online scene must be exactly the one we last pulled
  let last = null; try { last = JSON.parse(readFileSync(LAST_PULL, 'utf8')); } catch {}
  const now = await onlineStamp();
  if (!last || last.bundle !== now.bundle)
    die(`la maquette en ligne a changé depuis le dernier « pull » (${last ? last.bundle : 'aucun pull'} → ${now.bundle}). Faire « pull », refaire les modifications sur cette version, puis « push ». Rien n'a été envoyé.`);
  const json = JSON.stringify(sc.graph);
  const shas = [...new Set(json.match(/[0-9a-f]{64}/g) || [])];
  const artifacts = {};
  for (const s of shas) {
    const a = await pascal('/api/artifacts/' + s);
    if (a.ok) { const buf = Buffer.from(await a.arrayBuffer()); if (createHash('sha256').update(buf).digest('hex') === s) artifacts[s] = buf.toString('base64'); }
  }
  const bundle = JSON.stringify({ scene: { id: sc.id, name: sc.name, graph: sc.graph }, artifacts });
  // validate the GLB before sending anything, so scene and model never end up out of step
  const i = args.indexOf('--glb');
  let glb = null;
  if (i >= 0) {
    const file = args[i + 1]; if (!file || !existsSync(file)) die('fichier GLB introuvable : ' + file);
    glb = readFileSync(file);
    if (glb.toString('latin1', 0, 4) !== 'glTF') die(file + " n'est pas un GLB");
    // an export made with the editor tab hidden has no doors / windows / door animations: refuse it
    const js = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
    const kinds = {}; for (const n of js.nodes || []) { const k = n.extras && n.extras.kind; if (k) kinds[k] = (kinds[k] || 0) + 1; }
    const nodes = Object.values(sc.graph.nodes);
    const want = { wall: nodes.filter(v => v.type === 'wall').length, door: nodes.filter(v => v.type === 'door').length, window: nodes.filter(v => v.type === 'window').length };
    const anims = (js.animations || []).length;
    console.log(`  GLB : ${kinds.wall || 0}/${want.wall} murs, ${kinds.door || 0}/${want.door} portes, ${kinds.window || 0}/${want.window} fenêtres, ${anims} animations`);
    if (!kinds.wall || (kinds.door || 0) < want.door || (kinds.window || 0) < want.window || anims < want.door)
      die("GLB incomplet (export fait avec l'éditeur caché ou pas fini de charger ?) : ré-exporter avec l'onglet de l'éditeur au premier plan et la fenêtre visible, après chargement complet. Rien n'a été envoyé.");
  }
  backup('bundle-pushed.json', bundle);
  const res = await (await api('bundle.json', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: bundle })).json();
  console.log('✓ scène envoyée :', JSON.stringify(res));
  if (glb) {
    const res2 = await (await api('model.glb', { method: 'PUT', headers: { 'Content-Type': 'model/gltf-binary' }, body: glb })).json();
    console.log('✓ modèle 3D envoyé :', JSON.stringify(res2));
    console.log('  → visible sur https://plan.hellofabien.fr (choisir « Laurent » dans le menu), après rechargement de la page');
  } else console.log('  (aucun GLB envoyé : la visite affichera l’ancien modèle 3D — relancer avec --glb <fichier exporté>)');
  recordPull(await onlineStamp()); // what is online is now our own version

} else if (cmd === 'pull-model') {
  const out = args[0] || 'laurent-online.glb';
  writeFileSync(out, Buffer.from(await (await api('model.glb')).arrayBuffer()));
  console.log('✓ ' + out);

} else {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 12).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
}
