import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Cosy balcony pieces. kind: 0 pallet daybed (1.10 x 0.80) with mattress, cushions and a throw
//                            1 bistro set (round folding table Ø 60 + 2 folding chairs, sage green metal)
//                            2 lantern with candle · 3 outdoor rug 1.60 x 0.90 (jute look) · 4 pouf + floor cushion
// Back / wall side at Z = -D/2.
export const params = { kind: { default: 0, min: 0, max: 4, step: 1, label: 'Type' } }
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.8, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide, ...extra }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.03) => add(p, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002)), mt, x, y, z)
  const cyl = (p, rt, rb, h, x, y, z, mt, s = 20) => add(p, new THREE.CylinderGeometry(rt, rb, h, s), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const K = Math.round(params.kind)
  if (K === 0) {
    const wood = mat('pallet', '#c9a77c', 0.85), lin = mat('linen', '#ece4d4', 0.95), terra = mat('terracotta', '#b8653f', 0.95), sage = mat('sage', '#8a9a7b', 0.95)
    const p = part('pallets', 'wood')
    for (const y of [0, 0.145]) { for (let i = 0; i < 7; i++) box(p, 1.1, 0.022, 0.1, 0, y + 0.122, -0.36 + i * 0.12, wood); for (const x of [-0.5, 0, 0.5]) box(p, 0.1, 0.1, 0.8, x, y + 0.05, 0, wood) }
    const s = part('mattress', 'fabric')
    rbox(s, 1.08, 0.12, 0.78, 0, 0.35, 0, lin, 0.04)
    for (const [x, c] of [[-0.35, terra], [0.0, sage], [0.35, lin]]) { const cu = rbox(s, 0.42, 0.4, 0.14, x, 0.6, -0.3, c, 0.06); cu.rotation.x = -0.25 }
    rbox(s, 0.5, 0.02, 0.7, 0.32, 0.42, 0.04, mat('throw', '#d8c6a2', 0.95), 0.01)
  } else if (K === 1) {
    const metal = mat('sage_metal', '#7f8f78', 0.5, 0.5), top = mat('table_top', '#6f8068', 0.45, 0.5)
    const t = part('table', 'metal')
    cyl(t, 0.3, 0.3, 0.02, 0, 0.72, 0, top, 32)
    for (const a of [0, 2.1, 4.2]) { const l = cyl(t, 0.01, 0.01, 0.74, Math.cos(a) * 0.12, 0.36, Math.sin(a) * 0.12, metal, 8); l.rotation.z = Math.cos(a) * 0.2; l.rotation.x = -Math.sin(a) * 0.2 }
    for (const s of [-1, 1]) {
      const c = part('chair' + (s > 0 ? 'R' : 'L'), 'metal')
      const z = s * 0.45
      rbox(c, 0.4, 0.02, 0.38, 0, 0.45, z, top, 0.01)
      for (let i = 0; i < 4; i++) box(c, 0.36, 0.035, 0.012, 0, 0.62 + i * 0.07, z + s * 0.2, metal)
      for (const x of [-0.18, 0.18]) for (const zz of [-0.16, 0.16]) box(c, 0.016, 0.45, 0.016, x, 0.225, z + zz, metal)
      for (const x of [-0.18, 0.18]) box(c, 0.016, 0.5, 0.016, x, 0.68, z + s * 0.2, metal)
    }
  } else if (K === 2) {
    const black = mat('metal', '#1d1d1f', 0.5, 0.6), glass = mat('glass', '#ffffff', 0.05, 0, { transparent: true, opacity: 0.25 })
    const flame = mat('candle', '#fff0cf', 0.5, 0, { emissive: new THREE.Color('#ffb04a'), emissiveIntensity: 2.5 })
    const l = part('lantern', 'metal')
    box(l, 0.2, 0.02, 0.2, 0, 0.01, 0, black); box(l, 0.2, 0.02, 0.2, 0, 0.36, 0, black)
    for (const x of [-0.095, 0.095]) for (const z of [-0.095, 0.095]) box(l, 0.012, 0.36, 0.012, x, 0.18, z, black)
    add(l, new THREE.ConeGeometry(0.13, 0.08, 4), black, 0, 0.41, 0).rotation.y = Math.PI / 4
    add(l, new THREE.TorusGeometry(0.035, 0.005, 6, 16), black, 0, 0.47, 0)
    box(l, 0.18, 0.32, 0.18, 0, 0.18, 0, glass)
    cyl(l, 0.035, 0.035, 0.1, 0, 0.07, 0, mat('wax', '#f3ead8', 0.7)); add(l, new THREE.SphereGeometry(0.012, 8, 8), flame, 0, 0.135, 0)
  } else if (K === 3) {
    const r = part('rug', 'fabric')
    rbox(r, 1.6, 0.012, 0.9, 0, 0.006, 0, mat('jute', '#c4a77a', 0.98), 0.004)
    for (let i = 0; i < 3; i++) rbox(r, 1.5 - i * 0.2, 0.013, 0.02, 0, 0.007, -0.3 + i * 0.3, mat('stripe', '#7a5a3a', 0.98), 0.004)
  } else {
    const p = part('poufs', 'fabric')
    cyl(p, 0.24, 0.24, 0.36, 0, 0.18, 0, mat('knit', '#e3d7c1', 0.98), 28)
    rbox(p, 0.55, 0.1, 0.55, 0.45, 0.05, 0.1, mat('floor_cushion', '#b8653f', 0.95), 0.04)
  }
  return g
}
