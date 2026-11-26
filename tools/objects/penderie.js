import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Open built-in wardrobe (penderie): side panels, hat shelf, hanging rail with a few garments. No doors. Front +Z.
export const params = {
  width: { default: 1.4, min: 0.6, max: 3, step: 0.01, unit: 'm', label: 'Largeur' },
  depth: { default: 0.6, min: 0.4, max: 0.8, step: 0.01, unit: 'm', label: 'Profondeur' },
  sideLeft: { default: 0.02, min: 0.01, max: 0.1, step: 0.005, unit: 'm', label: 'Joue gauche' },
  sideRight: { default: 0.02, min: 0.01, max: 0.1, step: 0.005, unit: 'm', label: 'Joue droite' },
  doors: { default: 2, min: 0, max: 4, step: 1, label: 'Portes coulissantes' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.8, m = 0) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = params.width, D = params.depth, H = 2.4, tL = params.sideLeft, tR = params.sideRight
  const paint = mat('paint', '#f2f0ec', 0.9), metal = mat('metal', '#c9ccd0', 0.3, 0.9)
  const body = part('body', 'panel')
  box(body, tL, H, D, -W / 2 + tL / 2, H / 2, 0, paint)
  box(body, tR, H, D, W / 2 - tR / 2, H / 2, 0, paint)
  const inner = W - tL - tR, cx = (tL - tR) / 2
  box(body, inner, 0.022, D - 0.03, cx, 1.83, -0.015, paint) // hat shelf
  const rail = part('rail', 'metal')
  const rod = add(rail, new THREE.CylinderGeometry(0.0125, 0.0125, inner, 8), metal, cx, 1.74, 0)
  rod.rotation.z = Math.PI / 2
  // garments on hangers, grouped like a lived-in wardrobe
  const clothes = part('clothes', 'fabric')
  const colors = ['#2f3b52', '#d9cfbf', '#7d8471', '#ece9e2', '#5a4a42', '#9aa7b4', '#3d3d3d', '#b9a48a']
  const n = Math.max(4, Math.floor(inner / 0.11))
  const step = inner / (n + 2)
  for (let i = 0; i < n; i++) {
    const x = cx - inner / 2 + step * (i + 1.5) + (i % 3 === 2 ? 0.02 : 0)
    const len = [0.95, 1.05, 0.7, 1.1, 0.85][i % 5]
    const c = mat('fabric' + (i % colors.length), colors[i % colors.length], 0.95)
    add(clothes, new RoundedBoxGeometry(0.05, len, 0.44, 1, 0.02), c, x, 1.70 - len / 2, 0)
    const hanger = add(clothes, new THREE.TorusGeometry(0.2, 0.006, 4, 10, Math.PI * 0.55), metal, x, 1.66, 0)
    hanger.rotation.y = Math.PI / 2; hanger.rotation.z = Math.PI * 0.225
  }
  // sliding doors on two tracks (matt white panels, thin aluminium edge profiles), top track and floor guide
  const nd = Math.round(params.doors)
  if (nd > 0) {
    const sl = part('sliding_doors', 'panel')
    const alu = mat('alu', '#c4c7ca', 0.35, 0.85), door = mat('door', '#f4f3ef', 0.6)
    box(sl, inner, 0.05, 0.075, cx, H - 0.025, D / 2 - 0.04, alu)  // top track
    box(sl, inner, 0.012, 0.075, cx, 0.006, D / 2 - 0.04, alu)     // bottom guide
    const dw = inner / nd + 0.025, dh = H - 0.065
    for (let i = 0; i < nd; i++) {
      const x = cx - inner / 2 + (inner / nd) * (i + 0.5), z = D / 2 - (i % 2 ? 0.055 : 0.025)
      box(sl, dw - 0.02, dh, 0.018, x, 0.012 + dh / 2, z, door)
      for (const s of [-1, 1]) box(sl, 0.01, dh, 0.022, x + s * (dw / 2 - 0.005), 0.012 + dh / 2, z, alu) // vertical edge profiles (grip)
    }
  }
  return g
}
