import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Wall-hung single washbasin unit (60 cm): oak drawer cabinet, white top, ceramic vessel basin, brushed tap. Front +Z, back on the wall.
// Modelled from the cabinet bottom (y = 0): place it 0.40 m above the floor so the top sits at 0.85 m.
export const params = {
  width: { default: 0.6, min: 0.4, max: 1.0, step: 0.01, unit: 'm', label: 'Largeur' },
  depth: { default: 0.48, min: 0.35, max: 0.6, step: 0.01, unit: 'm', label: 'Profondeur' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.8, m = 0) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.01) => add(p, new RoundedBoxGeometry(w, h, d, 2, r), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = params.width, D = params.depth
  const oak = mat('oak', '#b48a5e', 0.6), white = mat('ceramic', '#f7f7f5', 0.25), steel = mat('metal', '#bfc3c7', 0.3, 0.9)
  const cab = part('cabinet', 'panel')
  rbox(cab, W, 0.42, D - 0.02, 0, 0.21, -0.01, oak, 0.008)
  rbox(cab, W - 0.01, 0.004, 0.005, 0, 0.21, D / 2 - 0.018, mat('joint', '#6d5236', 0.7), 0.001) // drawer split
  rbox(cab, 0.22, 0.012, 0.012, 0, 0.36, D / 2 - 0.01, steel, 0.004) // handle
  const top = part('top', 'stone')
  rbox(top, W, 0.03, D, 0, 0.435, 0, white, 0.006)
  const bowl = part('basin', 'ceramic')
  const pts = []
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(0.06 + 0.13 * Math.sin(t * Math.PI / 2), t * 0.13)) }
  pts.push(new THREE.Vector2(0.185, 0.13), new THREE.Vector2(0.17, 0.125))
  for (let i = 12; i >= 0; i--) { const t = i / 12; pts.push(new THREE.Vector2(Math.max(0.001, 0.05 + 0.12 * Math.sin(t * Math.PI / 2)), 0.012 + t * 0.113)) }
  add(bowl, new THREE.LatheGeometry(pts, 24), white, 0, 0.45, 0.02)
  const tap = part('tap', 'metal')
  add(tap, new THREE.CylinderGeometry(0.018, 0.02, 0.26, 20), steel, 0, 0.58, -D / 2 + 0.06)
  const spout = add(tap, new THREE.CylinderGeometry(0.01, 0.01, 0.14, 16), steel, 0, 0.70, -D / 2 + 0.12)
  spout.rotation.x = Math.PI / 2
  add(tap, new THREE.BoxGeometry(0.012, 0.012, 0.07), steel, 0, 0.725, -D / 2 + 0.03)
  return g
}
