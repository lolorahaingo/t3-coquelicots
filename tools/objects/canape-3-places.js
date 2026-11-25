import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Compact 3-seater sofa, 200 x 88 x 80 cm, slim arms, three seat and three back cushions, oak legs. Back at Z = -D/2, seat facing +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.9, m = 0) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.04) => add(p, new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002)), mt, x, y, z)
  const cyl = (p, rt, rb, h, x, y, z, mt) => add(p, new THREE.CylinderGeometry(rt, rb, h, 14), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = 2.0, D = 0.88, legH = 0.12, arm = 0.12
  const fab = mat('fabric', '#5d6b78', 0.95), cush = mat('fabric_cushion', '#667482', 0.95), oak = mat('oak', '#b48a5e', 0.55)
  const f = part('frame', 'fabric')
  rbox(f, W, 0.22, D - 0.02, 0, legH + 0.11, 0.01, fab, 0.03)
  rbox(f, W - 2 * arm + 0.02, 0.4, 0.16, 0, legH + 0.22 + 0.2, -D / 2 + 0.08, fab, 0.04)
  for (const s of [-1, 1]) rbox(f, arm, 0.46, D, s * (W / 2 - arm / 2), legH + 0.23, 0, fab, 0.05)
  const c = part('cushions', 'fabric'), sw = (W - 2 * arm) / 3
  for (let i = 0; i < 3; i++) {
    const x = -W / 2 + arm + sw * (i + 0.5)
    rbox(c, sw - 0.01, 0.13, D - 0.24, x, legH + 0.22 + 0.065, 0.1, cush, 0.045)
    const b = rbox(c, sw - 0.02, 0.4, 0.15, x, legH + 0.35 + 0.2, -D / 2 + 0.22, cush, 0.06); b.rotation.x = -0.12
  }
  const l = part('legs', 'wood')
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(l, 0.02, 0.014, legH, sx * (W / 2 - 0.07), legH / 2, sz * (D / 2 - 0.07), oak)
  return g
}
