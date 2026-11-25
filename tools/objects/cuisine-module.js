import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
// Kitchen base unit, handleless matt white fronts (gola recess), oak worktop 30 mm, plinth 100 mm, worktop at 0.90 m.
// type: 0 doors · 1 drawers · 2 integrated dishwasher · 3 single-bowl stainless sink set in the worktop (real cut-out and bowl)
//       4 Bosch PIE611BB5E induction hob (4 zones, 592 x 522 mm) over a built-in oven · 5 shallow run (mixed fronts)
// Back at Z = -D/2, front +Z.
export const params = {
  width: { default: 0.6, min: 0.3, max: 3, step: 0.005, unit: 'm', label: 'Largeur' },
  depth: { default: 0.56, min: 0.15, max: 0.7, step: 0.005, unit: 'm', label: 'Profondeur' },
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
  const csg = (geoA, posA, geoB, posB, mt) => {
    const a = new Brush(geoA, mt); a.position.set(...posA); a.updateMatrixWorld()
    const b = new Brush(geoB, mt); b.position.set(...posB); b.updateMatrixWorld()
    const ev = new Evaluator(); ev.useGroups = false
    const r = ev.evaluate(a, b, SUBTRACTION); r.material = mt; return r
  }
  const W = params.width, D = params.depth, T = Math.round(params.type)
  const H = 0.9, plinth = 0.1, top = 0.03, bodyH = H - top - plinth, fz = D / 2 - 0.01
  const white = mat('front', '#f3f2ee', 0.55), carcass = mat('carcass', '#e9e7e2', 0.7), oak = mat('worktop', '#c59d6c', 0.5)
  const dark = mat('plinth', '#3a3a3c', 0.6), steel = mat('metal', '#c3c6c9', 0.3, 0.9), inox = mat('inox', '#aeb3b8', 0.28, 0.9)
  const glass = mat('vitroceramique', '#0b0c0e', 0.12, 0.3)
  const body = part('body', 'panel')
  box(body, W - 0.002, bodyH, D - 0.04, 0, plinth + bodyH / 2, -0.02, carcass)
  box(body, W - 0.002, plinth, 0.02, 0, plinth / 2, fz - 0.06, dark)
  const fronts = part('fronts', 'panel')
  const front = (x, w, y0, h) => rbox(fronts, w - 0.003, h - 0.003, 0.019, x, y0 + h / 2, fz, white, 0.002)
  const y0 = plinth, usable = bodyH - 0.035
  const doors = (x, w) => { const n = w > 0.65 ? 2 : 1; for (let i = 0; i < n; i++) front(x - w / 2 + (w / n) * (i + 0.5), w / n, y0, usable) }
  const drawers = (x, w) => { let y = y0; for (const h of [0.4, 0.25, 0.135]) { front(x, w, y, h * usable / 0.785); y += h * usable / 0.785 } }
  if (T === 0 || T === 3) doors(0, W)
  if (T === 1) drawers(0, W)
  if (T === 2) front(0, W, y0, usable)
  if (T === 5) { const n = Math.max(1, Math.round(W / 0.6)), w = W / n; for (let i = 0; i < n; i++) { const x = -W / 2 + w * (i + 0.5); if (i % 2 === 0) drawers(x, w); else doors(x, w) } }
  if (T === 4) {
    const ov = part('oven', 'appliance')
    rbox(ov, W - 0.01, 0.595, 0.022, 0, y0 + 0.12 + 0.3, fz + 0.002, glass, 0.003)
    box(ov, W - 0.06, 0.06, 0.004, 0, y0 + 0.12 + 0.56, fz + 0.014, mat('panel', '#1c1d20', 0.4, 0.3))
    cyl(ov, 0.008, 0.008, W - 0.12, 0, y0 + 0.12 + 0.5, fz + 0.045, steel).rotation.z = Math.PI / 2
    front(0, W, y0, 0.12)
  }
  box(fronts, W, 0.025, 0.03, 0, H - top - 0.02, fz - 0.02, dark) // gola rail
  // worktop
  const wt = part('worktop', 'wood')
  const bx = 0, bz = 0.015, bw = Math.min(0.46, W - 0.14), bd = Math.min(0.4, D - 0.14) // sink cut-out
  if (T === 3) {
    wt.add(csg(new RoundedBoxGeometry(W, top, D, 2, 0.003), [0, H - top / 2, 0], new THREE.BoxGeometry(bw, top * 3, bd), [bx, H - top / 2, bz], oak))
    const sink = part('sink', 'metal')
    // stainless bowl (open top) hanging under the worktop, 180 mm deep, with a thin rim on the worktop
    sink.add(csg(new THREE.BoxGeometry(bw + 0.004, 0.19, bd + 0.004), [bx, H - 0.095, bz], new THREE.BoxGeometry(bw - 0.012, 0.2, bd - 0.012), [bx, H - 0.095 + 0.006, bz], inox))
    sink.add(csg(new THREE.BoxGeometry(bw + 0.04, 0.004, bd + 0.04), [bx, H + 0.002, bz], new THREE.BoxGeometry(bw - 0.006, 0.02, bd - 0.006), [bx, H + 0.002, bz], inox))
    cyl(sink, 0.035, 0.035, 0.003, bx + bw / 4, H - 0.182, bz, mat('drain', '#6b7076', 0.4, 0.8), 24)
    cyl(sink, 0.012, 0.012, 0.004, bx + bw / 4, H - 0.18, bz, dark, 12)
    const tap = part('tap', 'metal')
    cyl(tap, 0.022, 0.024, 0.04, 0, H + 0.02, -D / 2 + 0.06, steel)
    cyl(tap, 0.016, 0.016, 0.3, 0, H + 0.17, -D / 2 + 0.06, steel)
    const arc = add(tap, new THREE.TorusGeometry(0.09, 0.012, 10, 28, Math.PI), steel, 0, H + 0.32, -D / 2 + 0.15)
    arc.rotation.y = Math.PI / 2
    cyl(tap, 0.014, 0.012, 0.07, 0, H + 0.285, -D / 2 + 0.24, steel)
    const lever = box(tap, 0.012, 0.012, 0.09, 0.03, H + 0.25, -D / 2 + 0.06, steel); lever.rotation.y = 0.6
  } else rbox(wt, W, top, D, 0, H - top / 2, 0, oak, 0.003)
  if (T === 4) {
    // Bosch PIE611BB5E: frameless black glass 592 x 522 mm, front bevel, 4 zones (Ø 21, 18, 14.5, 14.5 cm), TouchSelect in front
    const hob = part('hob', 'appliance')
    const hw = Math.min(0.592, W - 0.008), hd = Math.min(0.522, D - 0.02), hz = 0.0
    rbox(hob, hw, 0.006, hd, 0, H + 0.003, hz, glass, 0.0025)
    const ring = mat('hob_marking', '#8a8f96', 0.5)
    const zones = [[-0.15, -0.1, 0.105], [-0.15, 0.115, 0.0725], [0.15, -0.1, 0.0725], [0.15, 0.115, 0.09]]
    for (const [x, z, r] of zones) {
      for (const rr of [r, r * 0.55]) { const t = add(hob, new THREE.TorusGeometry(rr, 0.0015, 4, 48), ring, x, H + 0.0062, hz + z); t.rotation.x = Math.PI / 2 }
    }
    const ctl = mat('hob_controls', '#dfe3e8', 0.4, 0, { emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.15 })
    for (let i = 0; i < 9; i++) add(hob, new THREE.CircleGeometry(0.006, 12), ctl, -0.08 + i * 0.02, H + 0.0062, hz + hd / 2 - 0.035).rotation.x = -Math.PI / 2
    add(hob, new THREE.PlaneGeometry(0.15, 0.004), ctl, 0, H + 0.0062, hz + hd / 2 - 0.055).rotation.x = -Math.PI / 2
    add(hob, new THREE.PlaneGeometry(0.05, 0.01), mat('logo', '#c9ced4', 0.4), -hw / 2 + 0.06, H + 0.0062, hz + hd / 2 - 0.03).rotation.x = -Math.PI / 2
  }
  return g
}
