// Password gate: the published files are AES-256-GCM encrypted (see tools/encrypt.mjs).
// Nothing readable is served without the password; the derived key can be remembered on this device.
const STORE = 't3-coquelicots-key';
const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64e = (u) => btoa(String.fromCharCode(...new Uint8Array(u)));
const store = {
  get: () => { try { return localStorage.getItem(STORE) || sessionStorage.getItem(STORE); } catch { return null; } },
  set: (v, persist) => { try { (persist ? localStorage : sessionStorage).setItem(STORE, v); } catch {} },
  clear: () => { try { localStorage.removeItem(STORE); sessionStorage.removeItem(STORE); } catch {} },
};

async function derive(password, meta) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64d(meta.salt), iterations: meta.iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
}
async function decrypt(key, buf) {
  const u = new Uint8Array(buf);
  if (String.fromCharCode(...u.subarray(0, 4)) !== 'T3E1') throw new Error('format');
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.subarray(4, 16) }, key, u.subarray(16));
}
async function fetchBuf(url, onProgress) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const total = +r.headers.get('content-length');
  if (!r.body || !total || !onProgress) return r.arrayBuffer();
  const reader = r.body.getReader(), out = new Uint8Array(total); let n = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; out.set(value, n); n += value.length; onProgress(n / total); }
  return out.buffer.slice(0, n);
}

export function lock() { store.clear(); location.reload(); }

// resolves with { scene (parsed JSON), glb (ArrayBuffer) } once the right password is given
export async function unlock({ gate, form, input, remember, error, onProgress }) {
  if (!globalThis.crypto?.subtle) { error.textContent = 'Ce navigateur ne permet pas de déchiffrer la maquette (connexion HTTPS requise).'; gate.hidden = false; await new Promise(() => {}); }
  const [meta, sceneEnc] = await Promise.all([fetch('data/meta.json', { cache: 'no-cache' }).then((r) => r.json()), fetchBuf('data/scene.json.enc')]);
  const glbP = fetchBuf('data/model.glb.enc', onProgress); // download while the visitor types
  glbP.catch(() => {});

  const tryKey = async (key) => { try { return JSON.parse(new TextDecoder().decode(await decrypt(key, sceneEnc))); } catch { return null; } };
  let key = null, scene = null;
  const saved = store.get();
  if (saved) {
    try { key = await crypto.subtle.importKey('raw', b64d(saved), 'AES-GCM', false, ['decrypt']); scene = await tryKey(key); } catch {}
    if (!scene) store.clear();
  }
  if (!scene) {
    gate.hidden = false; input.focus();
    scene = await new Promise((resolve) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button'); btn.disabled = true; error.textContent = '';
        const k = await derive(input.value, meta), s = await tryKey(k);
        btn.disabled = false;
        if (!s) { error.textContent = 'Mot de passe incorrect.'; input.select(); return; }
        store.set(b64e(await crypto.subtle.exportKey('raw', k)), remember.checked);
        key = k; resolve(s);
      });
    });
    gate.hidden = true;
  }
  const glb = await decrypt(key, await glbP);
  return { scene, glb };
}
