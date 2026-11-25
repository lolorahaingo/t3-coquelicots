#!/usr/bin/env node
// encrypt.mjs — encrypt the plain model (private/, never committed) into data/*.enc for the public site
//
//   node tools/encrypt.mjs                 private/model.glb + private/scene.json → data/model.glb.enc + data/scene.json.enc
//   node tools/encrypt.mjs --new-password  generate a new random site password first (stored in ~/.config/coquelicots/site.password)
//
// Password: env SITE_PASSWORD, or the file ~/.config/coquelicots/site.password (chmod 600). Never committed.
// Format of a .enc file: "T3E1" + 12-byte IV + AES-256-GCM ciphertext (16-byte tag at the end, as WebCrypto expects).
// Key: PBKDF2-SHA256(password, salt, iterations) — salt and iterations are public, in data/meta.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PW_FILE = join(homedir(), '.config/coquelicots/site.password');
const ITERATIONS = 600000;
const FILES = ['scene.json', 'model.glb'];

function newPassword() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const groups = [0, 1, 2].map(() => [...randomBytes(4)].map((b) => abc[b % abc.length]).join(''));
  const pw = groups.join('-');
  mkdirSync(join(homedir(), '.config/coquelicots'), { recursive: true, mode: 0o700 });
  writeFileSync(PW_FILE, pw, { mode: 0o600 }); chmodSync(PW_FILE, 0o600);
  return pw;
}

export function sitePassword() {
  const pw = (process.env.SITE_PASSWORD || (existsSync(PW_FILE) ? readFileSync(PW_FILE, 'utf8') : '')).trim();
  if (!pw) throw new Error(`mot de passe du site introuvable : créer ${PW_FILE} (chmod 600) ou lancer avec --new-password`);
  return pw;
}

export function encryptSite(password = sitePassword()) {
  const metaPath = join(ROOT, 'data/meta.json');
  // keep the salt across updates so "remember me" keeps working while the password does not change
  let meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : null;
  if (!meta || meta.iterations !== ITERATIONS) meta = { v: 1, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: randomBytes(16).toString('base64') };
  const key = pbkdf2Sync(password, Buffer.from(meta.salt, 'base64'), meta.iterations, 32, 'sha256');
  mkdirSync(join(ROOT, 'data'), { recursive: true });
  for (const f of FILES) {
    const plain = readFileSync(join(ROOT, 'private', f));
    const iv = randomBytes(12);
    const c = createCipheriv('aes-256-gcm', key, iv);
    const body = Buffer.concat([Buffer.from('T3E1'), iv, c.update(plain), c.final(), c.getAuthTag()]);
    writeFileSync(join(ROOT, 'data', f + '.enc'), body);
  }
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  return FILES.map((f) => 'data/' + f + '.enc');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    if (process.argv.includes('--new-password')) { newPassword(); console.log(`✓ nouveau mot de passe enregistré dans ${PW_FILE} (afficher : cat ${PW_FILE})`); }
    console.log('✓ chiffré : ' + encryptSite().join(', '));
  } catch (e) { console.error('✗ ' + e.message); process.exit(1); }
}
