import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Low TV unit, solid oak look: two fluted (cannelé) doors either side of an open console niche, slim black steel legs.
// Back on the wall at Z = -D/2, front +Z.
export const params = {
  width: { default: 1.55, min: 1.0, max: 2.4, step: 0.01, unit: 'm', label: 'Largeur' },
  depth: { default: 0.4, min: 0.3, max: 0.5, step: 0.01, unit: 'm', label: 'Profondeur' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.6, m = 0) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.006) => add(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), mt, x, y, z)
  const cyl = (p, rt, rb, h, x, y, z, mt, s = 12) => add(p, new THREE.CylinderGeometry(rt, rb, h, s), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = params.width, D = params.depth, legH = 0.12, H = 0.33, t = 0.02
  const oak = mat('oak', '#b98b5d', 0.55), oakDark = mat('oak_inner', '#9c7148', 0.6), steel = mat('metal', '#1f1f21', 0.45, 0.6)
  const body = part('body', 'wood')
  const y0 = legH
  box(body, W, t, D, 0, y0 + t / 2, 0, oak)               // bottom
  rbox(body, W + 0.01, 0.025, D + 0.01, 0, y0 + H - 0.0125, 0, oak, 0.004) // top
  box(body, t, H, D, -W / 2 + t / 2, y0 + H / 2, 0, oak)   // sides
  box(body, t, H, D, W / 2 - t / 2, y0 + H / 2, 0, oak)
  box(body, W - 2 * t, H - 0.04, 0.01, 0, y0 + H / 2, -D / 2 + 0.005, oakDark) // back
  const niche = 0.46
  box(body, t, H - 0.03, D - 0.01, -niche / 2 - t / 2, y0 + H / 2 - 0.005, 0, oak) // niche partitions
  box(body, t, H - 0.03, D - 0.01, niche / 2 + t / 2, y0 + H / 2 - 0.005, 0, oak)
  // fluted doors
  const doors = part('doors', 'wood')
  const dw = (W - niche - 4 * t) / 2
  for (const s of [-1, 1]) {
    const cx = s * (niche / 2 + t + dw / 2)
    box(doors, dw - 0.004, H - 0.03, 0.018, cx, y0 + H / 2 - 0.004, D / 2 - 0.009, oak)
    const n = Math.floor(dw / 0.022)
    for (let i = 0; i < n; i++) cyl(doors, 0.008, 0.008, H - 0.05, cx - dw / 2 + 0.011 + i * (dw - 0.022) / (n - 1), y0 + H / 2 - 0.004, D / 2 + 0.002, oak, 8)
  }
  // legs
  const legs = part('legs', 'metal')
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(legs, 0.025, legH, 0.025, sx * (W / 2 - 0.06), legH / 2, sz * (D / 2 - 0.05), steel)
  return g
}
