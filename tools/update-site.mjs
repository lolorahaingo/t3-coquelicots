#!/usr/bin/env node
// update-site.mjs — copy the online model (plan.hellofabien.fr) into the GitHub Pages site, encrypted
//
//   node tools/update-site.mjs        private/model.glb + private/scene.json (plain, git-ignored) → data/*.enc
//
// Secrets (never written to the repository):
//   API token     env LAURENT_TOKEN, or ~/.config/coquelicots/laurent.token  (only sent in the Authorization header)
//   site password env SITE_PASSWORD, or ~/.config/coquelicots/site.password  (encryption key of the public files)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptSite } from './encrypt.mjs';

const API = (process.env.PLAN_API || 'https://plan.hellofabien.fr/api/laurent').replace(/\/$/, '');
const out = fileURLToPath(new URL('../private/', import.meta.url));
const die = (m) => { console.error('✗ ' + m); process.exit(1); };
const token = (process.env.LAURENT_TOKEN || (() => { try { return readFileSync(join(homedir(), '.config/coquelicots/laurent.token'), 'utf8'); } catch { return ''; } })()).trim();
if (!token) die('Secret introuvable : définir LAURENT_TOKEN ou créer ~/.config/coquelicots/laurent.token (chmod 600).');

async function get(path) {
  const r = await fetch(`${API}/${path}`, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'coquelicots-sync/1.0' } });
  if (!r.ok) die(`GET ${path} → HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

mkdirSync(out, { recursive: true });
const glb = await get('model.glb');
if (glb.toString('latin1', 0, 4) !== 'glTF') die("model.glb n'est pas un GLB");
const bundle = JSON.parse((await get('bundle.json')).toString('utf8'));
// only the graph is published: no scene name (it carries the lot number), no custom furniture source code
writeFileSync(join(out, 'model.glb'), glb);
writeFileSync(join(out, 'scene.json'), JSON.stringify({ graph: bundle.scene.graph }));
console.log(`✓ maquette en ligne récupérée (${(glb.length / 1e6).toFixed(1)} Mo, ${Object.keys(bundle.scene.graph.nodes).length} nœuds)`);
try { console.log('✓ chiffré : ' + encryptSite().join(', ')); } catch (e) { die(e.message); }
console.log('  → git add data && git commit -m "Maquette à jour" && git push');
