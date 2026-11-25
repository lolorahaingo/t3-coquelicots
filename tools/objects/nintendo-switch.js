import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Nintendo Switch in its dock: black dock 173 x 104 x 54 mm, console (239 x 102 x 14 mm with Joy-Con) standing in it,
// neon red / neon blue Joy-Con on each side. Front +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.5, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, ...extra }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.004) => add(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005)), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const black = mat('plastic', '#1b1b1d', 0.6), screen = mat('screen', '#0b0d10', 0.1, 0.2)
  const dock = part('dock', 'plastic')
  rbox(dock, 0.173, 0.104, 0.054, 0, 0.052, 0, black, 0.006)
  add(dock, new THREE.BoxGeometry(0.06, 0.006, 0.001), mat('logo', '#b8001f', 0.5), 0.0, 0.08, 0.0275) // red logo strip
  const sw = part('console', 'electronics')
  rbox(sw, 0.173, 0.102, 0.014, 0, 0.12, 0.004, black, 0.004)   // tablet sits in the dock, top sticks out
  add(sw, new THREE.PlaneGeometry(0.155, 0.088), screen, 0, 0.12, 0.0112)
  rbox(sw, 0.035, 0.102, 0.028, -0.104, 0.12, 0.006, mat('joycon_l', '#00b8e6', 0.45), 0.01) // neon blue (left)
  rbox(sw, 0.035, 0.102, 0.028, 0.104, 0.12, 0.006, mat('joycon_r', '#ff4554', 0.45), 0.01)  // neon red (right)
  for (const [x, y] of [[-0.104, 0.15], [0.104, 0.1]]) add(sw, new THREE.CylinderGeometry(0.008, 0.009, 0.008, 16), black, x, y, 0.024).rotation.x = Math.PI / 2 // sticks
  return g
}
