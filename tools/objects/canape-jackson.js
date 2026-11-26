import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Canapé-lit JACKSON (Cocktail Scandinave, Bed-express, couchage 160 x 190), folded as a sofa:
// 200 x 97 x 85 cm, fabric "Havane" (dark brown), birch feet. Track arms, two seat cushions,
// two back cushions with adjustable headrests. Back at Z = -D/2, seat facing +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.9, m = 0) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.04) => add(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002)), mt, x, y, z)
  const cyl = (p, rt, rb, h, x, y, z, mt, s = 16) => add(p, new THREE.CylinderGeometry(rt, rb, h, 10), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = 2.0, D = 0.97, H = 0.85, legH = 0.1, armW = 0.17
  const fabric = mat('fabric', '#4a3226', 0.95), fabric2 = mat('fabric_cushion', '#553a2c', 0.95), birch = mat('birch', '#d8bf98', 0.55)
  const body = part('frame', 'fabric')
  rbox(body, W, 0.26, D - 0.02, 0, legH + 0.13, 0.01, fabric, 0.03)                       // base (holds the bed mechanism)
  rbox(body, W - 2 * armW + 0.02, 0.42, 0.2, 0, 0.57, -D / 2 + 0.1, fabric, 0.04)        // backrest frame
  for (const s of [-1, 1]) rbox(body, armW, 0.52, D, s * (W / 2 - armW / 2), legH + 0.26, 0, fabric, 0.05) // track arms, 0.62 m
  const cush = part('cushions', 'fabric')
  const sw = (W - 2 * armW) / 2
  for (const s of [-1, 1]) {
    rbox(cush, sw - 0.01, 0.12, D - 0.27, s * sw / 2, 0.42, 0.12, fabric2, 0.045)          // seat cushions (seat 0.48 m)
    const back = rbox(cush, sw - 0.02, 0.34, 0.16, s * sw / 2, 0.63, -D / 2 + 0.25, fabric2, 0.06) // back cushions
    back.rotation.x = -0.1
    const head = rbox(cush, sw - 0.06, 0.1, 0.13, s * sw / 2, 0.795, -D / 2 + 0.19, fabric2, 0.04) // adjustable headrests, top 0.85
    head.rotation.x = -0.12
  }
  const feet = part('feet', 'wood')
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(feet, 0.022, 0.016, legH, sx * (W / 2 - 0.08), legH / 2, sz * (D / 2 - 0.08), birch, 16)
  return g
}
