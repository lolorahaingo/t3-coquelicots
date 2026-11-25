import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Lift-up and extending coffee table (table basse relevable extensible): 1.10 x 0.60 x 0.44 m as a coffee table,
// lifts to 0.76 m and opens to 1.10 x 1.20 m as a dining table for guests. Param `mode`: 0 = table basse, 1 = table à manger.
export const params = {
  mode: { default: 0, min: 0, max: 1, step: 1, label: 'Table à manger (0/1)' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.55, m = 0) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.008) => add(p, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const dining = params.mode >= 0.5
  const W = 1.1, D = 0.6, oak = mat('oak', '#c29a6b', 0.5), white = mat('lacquer', '#efece6', 0.35), steel = mat('metal', '#2a2a2c', 0.45, 0.6)
  const base = part('base', 'wood')
  rbox(base, W - 0.04, 0.3, D - 0.06, 0, 0.17, 0, white, 0.01)         // storage body
  box(base, W - 0.02, 0.02, D - 0.04, 0, 0.01, 0, steel)                // plinth
  const top = part('top', 'wood')
  if (!dining) {
    rbox(top, W, 0.04, D, 0, 0.42, 0, oak, 0.01)
    box(top, W - 0.06, 0.004, 0.004, 0, 0.441, 0.0, mat('joint', '#8a6a46', 0.6)) // split line of the folding leaf
  } else {
    // lifted on its scissor arms and unfolded: 1.10 x 1.20 at 0.76 m
    rbox(top, W, 0.04, D * 2, 0, 0.74, 0, oak, 0.01)
    for (const sx of [-1, 1]) for (const k of [-1, 1]) {
      const arm = box(top, 0.02, 0.42, 0.03, sx * (W / 2 - 0.12), 0.53, k * 0.06, steel)
      arm.rotation.x = k * 0.5
    }
  }
  return g
}
