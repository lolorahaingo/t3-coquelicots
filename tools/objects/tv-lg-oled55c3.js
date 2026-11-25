import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// LG OLED evo C3 55" (2023, OLED55C3): 1222 x 703 x 45.1 mm without stand, on a slim flat wall mount.
// Thin upper panel, deeper electronics bulge at the bottom back, narrow dark-silver bezel.
// Back on the wall at Z = -0.0761 (mount 30 mm + 45.1 mm), screen facing +Z. Origin = bottom-centre of the TV.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.5, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide, ...extra }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.004) => add(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005)), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = 1.222, H = 0.703, front = 0.0
  const bezel = mat('frame', '#3a3d42', 0.35, 0.7), back = mat('back', '#2a2c30', 0.6, 0.2), mountM = mat('metal', '#1d1e20', 0.5, 0.6)
  const screen = mat('screen', '#05070a', 0.08, 0.3, { emissive: new THREE.Color('#0a0f18'), emissiveIntensity: 0.4 })
  const tv = part('tv', 'electronics')
  rbox(tv, W, H, 0.012, 0, H / 2, front - 0.006, bezel, 0.003) // ultra-thin panel
  add(tv, new THREE.PlaneGeometry(W - 0.012, H - 0.03), screen, 0, H / 2 + 0.006, front + 0.0005) // picture area (thin bottom bar)
  rbox(tv, 0.9, 0.33, 0.034, 0, 0.19, front - 0.012 - 0.017, back, 0.01) // electronics bulge (45.1 mm total)
  rbox(tv, W - 0.02, 0.012, 0.03, 0, 0.006, front - 0.02, bezel, 0.002) // bottom speaker bar
  add(tv, new THREE.CircleGeometry(0.004, 12), mat('led', '#c0392b', 0.4, 0, { emissive: new THREE.Color('#ff3b30'), emissiveIntensity: 0.8 }), 0.3, 0.005, front + 0.001)
  const wm = part('mount', 'metal')
  rbox(wm, 0.4, 0.3, 0.03, 0, 0.38, front - 0.0451 - 0.015, mountM, 0.003)
  return g
}
