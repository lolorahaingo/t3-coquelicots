// Wall storage: closed low cupboards (0.85 m, oak-look doors) under open white shelves, a few books and boxes.
// Back at Z = -D/2, front +Z.
export const params = {
  width: { default: 2.2, min: 0.4, max: 3.2, step: 0.005, unit: 'm', label: 'Largeur' },
  depth: { default: 0.35, min: 0.25, max: 0.5, step: 0.005, unit: 'm', label: 'Profondeur' },
  height: { default: 2.1, min: 1.2, max: 2.4, step: 0.01, unit: 'm', label: 'Hauteur' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.6) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = params.width, D = params.depth, H = params.height, t = 0.022, low = 0.85
  const white = mat('white', '#f3f2ee', 0.55), oak = mat('oak', '#c29a6b', 0.55)
  const b = part('body', 'panel')
  const n = Math.max(1, Math.round(W / 0.8)), cw = W / n
  box(b, W, t, D, 0, t / 2, 0, white); box(b, W, t, D, 0, H - t / 2, 0, white)
  for (let i = 0; i <= n; i++) box(b, t, H, D, -W / 2 + i * cw + (i === 0 ? t / 2 : i === n ? -t / 2 : 0), H / 2, 0, white)
  box(b, W - 2 * t, t, D, 0, low, 0, white)
  for (const y of [low + (H - low) / 3, low + (2 * (H - low)) / 3]) box(b, W - 2 * t, t, D - 0.01, 0, y, -0.005, white)
  const d = part('doors', 'wood')
  for (let i = 0; i < n * 2; i++) box(d, cw / 2 - 0.006, low - 0.03, 0.018, -W / 2 + (cw / 2) * (i + 0.5), low / 2, D / 2 + 0.009, oak)
  // books and boxes on the open shelves
  const deco = part('books', 'paper')
  const cols = ['#7a2e2e', '#2f4a6b', '#d9cfb8', '#3e5a45', '#8d6e4a', '#1f1f22']
  let k = 0
  for (const y of [low + t / 2, low + (H - low) / 3 + t / 2]) {
    for (let i = 0; i < n; i++) {
      const x0 = -W / 2 + i * cw + 0.05
      for (let j = 0; j < 9; j++) { const h = 0.2 + ((k * 7) % 5) * 0.02; box(deco, 0.03, h, 0.22, x0 + j * 0.034, y + h / 2, -0.02, mat('book' + (k % 6), cols[k % 6], 0.8)); k++ }
      if (cw > 0.7) box(deco, 0.26, 0.2, 0.28, x0 + 0.48, y + 0.1, -0.01, mat('box', '#d8d2c6', 0.9))
    }
  }
  return g
}
