// Raised vegetable planter on legs (bac potager surélevé), larch wood, 1.00 x 0.50 m, working height 0.80 m:
// lettuces, herbs, a tomato plant on stakes, a few strawberries. Back (facade side) at Z = -D/2.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.8) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, name: 'slot_' + n }))
  const box = (p, w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o }
  const W = 1.0, D = 0.5, H = 0.8
  const wood = mat('larch', '#b98b5e'), soil = mat('soil', '#3e2b1d', 0.95)
  const b = new THREE.Group(); b.name = 'part:planter'; b.userData.type = 'wood'; g.add(b)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(b, 0.05, H, 0.05, sx * (W / 2 - 0.025), H / 2, sz * (D / 2 - 0.025), wood)
  for (let i = 0; i < 2; i++) { const y = H - 0.08 - i * 0.12; box(b, W, 0.11, 0.02, 0, y, D / 2 - 0.01, wood); box(b, W, 0.11, 0.02, 0, y, -D / 2 + 0.01, wood); box(b, 0.02, 0.11, D, W / 2 - 0.01, y, 0, wood); box(b, 0.02, 0.11, D, -W / 2 + 0.01, y, 0, wood) }
  box(b, W - 0.04, 0.02, D - 0.04, 0, H - 0.25, 0, wood)
  box(b, W - 0.04, 0.2, D - 0.04, 0, H - 0.14, 0, soil)
  box(b, W - 0.06, 0.02, D - 0.06, 0, 0.12, 0, wood) // shelf for tools
  const v = new THREE.Group(); v.name = 'part:vegetables'; v.userData.type = 'plant'; g.add(v)
  const lettuce = mat('lettuce', '#7fae4a', 0.9), herb = mat('herbs', '#4f7a35', 0.9), tomato = mat('tomato', '#c8362d', 0.5), stake = mat('stake', '#a88a5c')
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), lettuce); s.scale.y = 0.6; s.position.set(-0.38 + i * 0.16, H - 0.02, 0.1); v.add(s) }
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), herb); s.position.set(-0.3 + i * 0.14, H + 0.02, -0.12); v.add(s) }
  box(v, 0.015, 0.75, 0.015, 0.36, H + 0.3, -0.1, stake); box(v, 0.015, 0.75, 0.015, 0.42, H + 0.3, -0.1, stake)
  const t = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), herb); t.scale.set(0.8, 1.6, 0.8); t.position.set(0.39, H + 0.28, -0.08); v.add(t)
  for (const [x, y] of [[0.33, 1.05], [0.45, 0.98], [0.4, 1.2]]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), tomato); f.position.set(x, y, -0.02); v.add(f) }
  return g
}
