#!/usr/bin/env node
// patch-online.mjs — change items of the online model directly (scene graph + GLB together), without the editor
//
//   node tools/patch-online.mjs OPS.json [--dry-run | --local]
//   (--dry-run: print the changes · --local: write the patched copy to private/ for a preview, send nothing)
//
// OPS.json: [{ "id": "<item id>" | "name": "<exact item name>", "position": [x, y, z], "rotationY": <radians>, "scale": [sx, sy, sz] }, …]
// (every field but id/name is optional; world metres, same frame as Pascal)
//
// Always works on Fabien's latest version: the online status is read first, both files are downloaded,
// patched, checked, and sent only if nothing changed online in the meantime. Copies go to backups/.
// Then private/ is refreshed and the site data re-encrypted (commit + push the site afterwards).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptSite } from './encrypt.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const API = (process.env.PLAN_API || 'https://plan.hellofabien.fr/api/laurent').replace(/\/$/, '');
const BOX = { x0: -24, x1: -6.2, z0: -6, z1: 14 };
const FLOOR_Y = 0.05;
const die = (m) => { console.error('✗ ' + m); process.exit(1); };
const token = (process.env.LAURENT_TOKEN || (() => { try { return readFileSync(join(homedir(), '.config/coquelicots/laurent.token'), 'utf8'); } catch { return ''; } })()).trim();
if (!token) die('jeton introuvable (~/.config/coquelicots/laurent.token)');
const headers = { Authorization: `Bearer ${token}`, 'User-Agent': 'coquelicots-sync/1.0' };
async function api(path, opts = {}) {
  const r = await fetch(`${API}/${path}`, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
  if (!r.ok) die(`${opts.method || 'GET'} ${path} → HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r;
}
const stamp = async () => { const s = await (await api('status')).json(); return `${s.bundle?.modified}|${s.model?.modified}`; };
const backup = (name, data) => { const d = join(ROOT, 'backups'); mkdirSync(d, { recursive: true }); const f = join(d, new Date().toISOString().replace(/[:.]/g, '-') + '__' + name); writeFileSync(f, data); return f; };

// ---- GLB read / write (JSON chunk only is changed, BIN chunk kept byte for byte)
function readGlb(buf) {
  if (buf.toString('latin1', 0, 4) !== 'glTF') die('model.glb invalide');
  const jsonLen = buf.readUInt32LE(12);
  return { json: JSON.parse(buf.toString('utf8', 20, 20 + jsonLen)), rest: buf.subarray(20 + jsonLen) };
}
function writeGlb({ json, rest }) {
  let s = Buffer.from(JSON.stringify(json), 'utf8');
  const pad = (4 - (s.length % 4)) % 4; s = Buffer.concat([s, Buffer.alloc(pad, 0x20)]);
  const head = Buffer.alloc(20);
  head.write('glTF', 0, 'latin1'); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + s.length + rest.length, 8);
  head.writeUInt32LE(s.length, 12); head.write('JSON', 16, 'latin1');
  return Buffer.concat([head, s, rest]);
}

// ---- main
const [opsFile, ...flags] = process.argv.slice(2);
if (!opsFile) die('usage : node tools/patch-online.mjs OPS.json [--dry-run]');
const ops = JSON.parse(readFileSync(opsFile, 'utf8'));
const dry = flags.includes('--dry-run');

const before = await stamp();
const bundleRaw = Buffer.from(await (await api('bundle.json')).arrayBuffer());
const glbRaw = Buffer.from(await (await api('model.glb')).arrayBuffer());
if ((await stamp()) !== before) die('la maquette en ligne a changé pendant le téléchargement, relancer');
backup('bundle-online.json', bundleRaw); backup('model-online.glb', glbRaw);
const bundle = JSON.parse(bundleRaw.toString('utf8'));
const graph = bundle.scene.graph;
const glb = readGlb(glbRaw);

for (const op of ops) {
  const node = op.id ? graph.nodes[op.id] : Object.values(graph.nodes).find((v) => v.name === op.name);
  if (!node || node.type !== 'item') die(`élément introuvable : ${op.id || op.name}`);
  const gn = glb.json.nodes.find((n) => n.extras?.pascalId === node.id);
  if (!gn) die(`élément ${node.name} absent du GLB`);
  const was = { position: [...node.position], rotation: [...(node.rotation || [0, 0, 0])], scale: [...(node.scale || [1, 1, 1])] };
  if (op.position) {
    const d = op.position.map((v, k) => v - node.position[k]);
    node.position = op.position;
    const t = gn.translation || [0, 0, 0];
    gn.translation = t.map((v, k) => +(v + d[k]).toFixed(6));
  }
  if (op.rotationY !== undefined) {
    node.rotation = [0, op.rotationY, 0];
    gn.rotation = [0, Math.sin(op.rotationY / 2), 0, Math.cos(op.rotationY / 2)];
  }
  if (op.scale) {
    // Pascal keeps the item scale on a child of the GLB item node: compose the ratio on the item node
    const ratio = op.scale.map((v, k) => v / (was.scale[k] || 1));
    const s = gn.scale || [1, 1, 1];
    gn.scale = s.map((v, k) => +(v * ratio[k]).toFixed(6));
    if (gn.scale.every((v) => Math.abs(v - 1) < 1e-9)) delete gn.scale;
    node.scale = op.scale;
  }
  console.log(`• ${node.name}\n    position ${was.position.map((v) => v.toFixed(3))} → ${node.position.map((v) => v.toFixed(3))}` +
    `\n    rotation y ${was.rotation[1].toFixed(3)} → ${node.rotation[1].toFixed(3)} · échelle ${was.scale} → ${node.scale}`);
  const [x, , z] = node.position;
  if (x < BOX.x0 || x > BOX.x1 || z < BOX.z0 || z > BOX.z1) die(`${node.name} sortirait de l'emprise du T3`);
  if (/[<>]/.test(node.name || '')) die('caractères < > interdits dans les noms');
}

if (dry) { console.log('(essai : rien envoyé)'); process.exit(0); }
const newBundle = JSON.stringify(bundle);
const newGlb = writeGlb(glb);
readGlb(newGlb); // sanity
if (flags.includes('--local')) {
  // preview only: patched copy in private/ (not encrypted, nothing sent)
  mkdirSync(join(ROOT, 'private'), { recursive: true });
  writeFileSync(join(ROOT, 'private', 'model.glb'), newGlb);
  writeFileSync(join(ROOT, 'private', 'scene.json'), JSON.stringify({ graph }));
  console.log('✓ aperçu local écrit dans private/ (rien envoyé ; chiffrer avec un mot de passe de test pour le voir)');
  process.exit(0);
}
if ((await stamp()) !== before) die('Fabien a modifié la maquette entre-temps : rien envoyé, relancer pour repartir de sa version');
backup('bundle-pushed.json', newBundle); backup('model-pushed.glb', newGlb);
console.log('✓ scène envoyée :', JSON.stringify(await (await api('bundle.json', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: newBundle })).json()));
console.log('✓ modèle 3D envoyé :', JSON.stringify(await (await api('model.glb', { method: 'PUT', headers: { 'Content-Type': 'model/gltf-binary' }, body: newGlb })).json()));
mkdirSync(join(ROOT, 'backups'), { recursive: true });
writeFileSync(join(ROOT, 'backups', 'last-pull.json'), JSON.stringify((await (await api('status')).json()), null, 2));

// site copy
mkdirSync(join(ROOT, 'private'), { recursive: true });
writeFileSync(join(ROOT, 'private', 'model.glb'), newGlb);
writeFileSync(join(ROOT, 'private', 'scene.json'), JSON.stringify({ graph }));
console.log('✓ site chiffré : ' + encryptSite().join(', '));
console.log('  → git add data && git commit -m "…" && git push');
