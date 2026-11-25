import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Kitchen base unit, handleless matt white fronts (gola recess), oak worktop 30 mm, plinth 100 mm, worktop at 0.90 m.
// type: 0 doors · 1 drawers · 2 integrated dishwasher · 3 double-bowl sink · 4 induction hob + oven · 5 shallow run (mixed fronts)
// Back at Z = -D/2, front +Z.
export const params = {
  width: { default: 0.6, min: 0.3, max: 3, step: 0.005, unit: 'm', label: 'Largeur' },
  depth: { default: 0.56, min: 0.25, max: 0.7, step: 0.005, unit: 'm', label: 'Profondeur' },
  type: { default: 0, min: 0, max: 5, step: 1, label: 'Type (0 portes,1 tiroirs,2 LV,3 évier,4 cuisson,5 linéaire)' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.6, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide, ...extra }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.004) => add(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005)), mt, x, y, z)
  const cyl = (p, rt, rb, h, x, y, z, mt, s = 20) => add(p, new THREE.CylinderGeometry(rt, rb, h, s), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = params.width, D = params.depth, T = Math.round(params.type)
  const H = 0.9, plinth = 0.1, top = 0.03, bodyH = H - top - plinth, fz = D / 2 - 0.01
  const white = mat('front', '#f3f2ee', 0.55), carcass = mat('carcass', '#e9e7e2', 0.7), oak = mat('worktop', '#c59d6c', 0.5)
  const dark = mat('plinth', '#3a3a3c', 0.6), steel = mat('metal', '#c3c6c9', 0.3, 0.9), glass = mat('glass_black', '#0c0d0f', 0.08, 0.2)
  const body = part('body', 'panel')
  box(body, W - 0.002, bodyH, D - 0.04, 0, plinth + bodyH / 2, -0.02, carcass)
  box(body, W - 0.002, plinth, 0.02, 0, plinth / 2, fz - 0.06, dark) // recessed plinth
  const wt = part('worktop', 'wood')
  const fronts = part('fronts', 'panel')
  // fronts with a gola (handleless) recess under the worktop
  const front = (x, w, y0, h) => rbox(fronts, w - 0.003, h - 0.003, 0.019, x, y0 + h / 2, fz, white, 0.002)
  const gola = (x, w, y) => box(fronts, w, 0.025, 0.03, x, y, fz - 0.02, dark)
  const y0 = plinth, usable = bodyH - 0.035
  const doors = (x, w) => { const n = w > 0.65 ? 2 : 1; for (let i = 0; i < n; i++) front(x - w / 2 + (w / n) * (i + 0.5), w / n, y0, usable) }
  const drawers = (x, w) => { const hs = [0.4, 0.25, 0.135]; let y = y0; for (const h of hs) { front(x, w, y, h * usable / 0.785); y += h * usable / 0.785 } }
  if (T === 0) doors(0, W)
  if (T === 1) drawers(0, W)
  if (T === 2) { front(0, W, y0, usable); box(fronts, W - 0.04, 0.004, 0.005, 0, y0 + usable - 0.03, fz + 0.01, mat('led', '#3a6df0', 0.4, 0, { emissive: new THREE.Color('#2d5bff'), emissiveIntensity: 0.2 })) }
  if (T === 3) doors(0, W)
  if (T === 4) {
    // built-in oven (black glass, steel handle) over a small drawer
    const ov = part('oven', 'appliance')
    rbox(ov, W - 0.01, 0.595, 0.022, 0, y0 + 0.12 + 0.3, fz + 0.002, glass, 0.003)
    box(ov, W - 0.06, 0.06, 0.004, 0, y0 + 0.12 + 0.56, fz + 0.014, mat('panel', '#1c1d20', 0.4, 0.3))
    cyl(ov, 0.008, 0.008, W - 0.12, 0, y0 + 0.12 + 0.5, fz + 0.045, steel).rotation.z = Math.PI / 2
    front(0, W, y0, 0.12)
  }
  if (T === 5) {
    const n = Math.max(1, Math.round(W / 0.6)), w = W / n
    for (let i = 0; i < n; i++) { const x = -W / 2 + w * (i + 0.5); if (i % 2 === 0) drawers(x, w); else doors(x, w) }
  }
  gola(0, W, H - top - 0.02)
  // worktop (with cut-outs drawn as inserts)
  rbox(wt, W, top, D, 0, H - top / 2, 0, oak, 0.003)
  if (T === 3) {
    const sink = part('sink', 'metal')
    for (const s of [-1, 1]) {
      box(sink, W * 0.4, 0.004, D * 0.62, s * W * 0.22, H + 0.001, 0.02, mat('sink', '#9ea3a8', 0.35, 0.85))
      box(sink, W * 0.36, 0.002, D * 0.56, s * W * 0.22, H + 0.003, 0.02, mat('sink_inner', '#6f747a', 0.4, 0.8))
      cyl(sink, 0.02, 0.02, 0.002, s * W * 0.22, H + 0.0045, 0.02, dark)
    }
    const tap = part('tap', 'metal')
    cyl(tap, 0.02, 0.022, 0.3, 0, H + 0.15, -D / 2 + 0.07, steel)
    const arc = add(tap, new THREE.TorusGeometry(0.1, 0.011, 10, 24, Math.PI), steel, 0, H + 0.3, -D / 2 + 0.17)
    arc.rotation.y = Math.PI / 2
    cyl(tap, 0.013, 0.011, 0.06, 0, H + 0.27, -D / 2 + 0.27, steel)
  }
  if (T === 4) {
    const hob = part('hob', 'appliance')
    rbox(hob, Math.min(0.59, W - 0.02), 0.006, Math.min(0.52, D - 0.03), 0, H + 0.003, 0, glass, 0.002)
    const ring = mat('hob_ring', '#3b3f45', 0.5)
    for (const [x, z, r] of [[-0.14, -0.11, 0.09], [0.14, -0.11, 0.075], [-0.14, 0.12, 0.075], [0.14, 0.12, 0.09]]) {
      const t = add(hob, new THREE.TorusGeometry(r, 0.002, 4, 40), ring, x, H + 0.0065, z); t.rotation.x = Math.PI / 2
    }
  }
  return g
}
