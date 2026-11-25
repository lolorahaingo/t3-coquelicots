import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Haier 3D 60 Series 5 HTW5618ENPT (black), 595 x 667 x 1850 mm: fridge door on top, two pull-out freezer drawers below
// (real drawer fronts, not drawers behind a door), vertical bar handle on the fridge, top-edge grips on the drawers.
// Back at Z = -D/2, front +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.4, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, ...extra }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.01) => add(p, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = 0.595, D = 0.667, H = 1.85, doorT = 0.06, bodyD = D - doorT
  const side = mat('body', '#1d1e21', 0.5, 0.3), front = mat('front', '#111214', 0.25, 0.35), trim = mat('metal', '#8d9196', 0.3, 0.9)
  const cab = part('cabinet', 'appliance')
  rbox(cab, W, H - 0.02, bodyD, 0, 0.01 + (H - 0.02) / 2, -D / 2 + bodyD / 2, side, 0.008)
  rbox(cab, W - 0.04, 0.02, 0.03, 0, 0.01, D / 2 - 0.06, mat('grille', '#0a0a0b', 0.8), 0.003) // bottom grille
  const doors = part('doors', 'appliance')
  const zf = D / 2 - doorT / 2
  const fridgeH = 1.12, drawerH = (H - 0.03 - fridgeH - 0.006) / 2
  rbox(doors, W - 0.004, fridgeH, doorT, 0, H - fridgeH / 2 - 0.004, zf, front, 0.01)
  for (let i = 0; i < 2; i++) rbox(doors, W - 0.004, drawerH - 0.004, doorT, 0, 0.03 + drawerH * (i + 0.5), zf, front, 0.01)
  const hd = part('handles', 'metal')
  rbox(hd, 0.022, 0.6, 0.03, -W / 2 + 0.035, H - 0.45, D / 2 + 0.012, trim, 0.008)                       // fridge bar handle
  for (let i = 0; i < 2; i++) rbox(hd, W - 0.12, 0.018, 0.025, 0, 0.03 + drawerH * (i + 1) - 0.03, D / 2 + 0.008, trim, 0.006) // drawer grips
  add(hd, new THREE.PlaneGeometry(0.06, 0.012), mat('logo', '#c8ccd0', 0.4, 0.6), W / 2 - 0.07, H - 0.05, D / 2 + 0.0005) // logo
  rbox(hd, 0.05, 0.08, 0.004, W / 2 - 0.06, H - 0.25, D / 2 + 0.001, mat('display', '#1a2733', 0.2, 0.2, { emissive: new THREE.Color('#2e6fa8'), emissiveIntensity: 0.3 }), 0.004)
  return g
}
