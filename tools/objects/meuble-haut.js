import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Kitchen wall cabinet, matt white handleless doors (push-to-open), optional integrated extractor hood underneath.
// Modelled from its bottom (y = 0): place it at the wanted height. Back at Z = -D/2, front +Z.
export const params = {
  width: { default: 0.6, min: 0.3, max: 2.4, step: 0.005, unit: 'm', label: 'Largeur' },
  depth: { default: 0.33, min: 0.25, max: 0.4, step: 0.005, unit: 'm', label: 'Profondeur' },
  height: { default: 0.7, min: 0.3, max: 1.0, step: 0.01, unit: 'm', label: 'Hauteur' },
  hood: { default: 0, min: 0, max: 1, step: 1, label: 'Hotte intégrée (0/1)' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.55, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide, ...extra }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.003) => add(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005)), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = params.width, D = params.depth, H = params.height, hood = params.hood >= 0.5
  const white = mat('front', '#f3f2ee', 0.55), carcass = mat('carcass', '#e9e7e2', 0.7)
  const body = part('body', 'panel')
  const yb = hood ? 0.06 : 0
  box(body, W - 0.002, H - yb, D - 0.02, 0, yb + (H - yb) / 2, -0.01, carcass)
  const n = Math.max(1, Math.round(W / 0.5))
  for (let i = 0; i < n; i++) rbox(body, W / n - 0.003, H - yb - 0.003, 0.019, -W / 2 + (W / n) * (i + 0.5), yb + (H - yb) / 2, D / 2 - 0.0095, white)
  if (hood) {
    const h = part('hood', 'appliance')
    box(h, W - 0.004, yb, D - 0.03, 0, yb / 2, 0, mat('metal', '#b9bdc1', 0.35, 0.85))
    box(h, W - 0.08, 0.004, D - 0.12, 0, 0.0, 0.0, mat('filter', '#5e6266', 0.5, 0.6))
    for (const x of [-W / 4, W / 4]) add(h, new THREE.CircleGeometry(0.02, 16), mat('led', '#fff6e0', 0.3, 0, { emissive: new THREE.Color('#fff3d6'), emissiveIntensity: 1.0 }), x, -0.001, D / 2 - 0.06).rotation.x = Math.PI / 2
  }
  return g
}
