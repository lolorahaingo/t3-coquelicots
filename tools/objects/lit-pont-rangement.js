// Wall-to-wall bed storage unit ("lit pont"): two wardrobe columns, a bridge cabinet over the bed, an integrated
// upholstered headboard with a lit niche shelf and reading lamps, and a raised storage bed (lit coffre) 180 x 200,
// sleeping height ≈ 0.60 m. Back on the wall at Z = 0, bed towards +Z. Columns: left (-X) and right (+X) widths.
export const params = {
  width: { default: 3.45, min: 2.4, max: 4.5, step: 0.005, unit: 'm', label: 'Largeur du mur' },
  leftCol: { default: 0.85, min: 0.3, max: 1.2, step: 0.005, unit: 'm', label: 'Colonne gauche' },
  rightCol: { default: 0.6, min: 0.3, max: 1.2, step: 0.005, unit: 'm', label: 'Colonne droite' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.6, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide, ...extra }))
  const add = (p, geo, mt, x, y, z) => { const o = new THREE.Mesh(geo, mt); o.position.set(x, y, z); p.add(o); return o }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = params.width, L = params.leftCol, R = params.rightCol, H = 2.4, CD = 0.5, HB = 0.22
  const white = mat('front', '#f3f2ee', 0.55), oak = mat('oak', '#c29a6b', 0.55), fabric = mat('headboard', '#b7aa98', 0.95)
  const bedFab = mat('bed_fabric', '#8f8577', 0.95), linen = mat('linen', '#ece8e0', 0.95), duvet = mat('duvet', '#d9d3c7', 0.95)
  const x0 = -W / 2, bx0 = x0 + L, bx1 = W / 2 - R, bw = bx1 - bx0, bc = (bx0 + bx1) / 2
  // wardrobe columns with doors and oak edge pulls
  const cols = part('wardrobes', 'panel')
  for (const [cx, cw] of [[x0 + L / 2, L], [W / 2 - R / 2, R]]) {
    box(cols, cw, H, CD - 0.02, cx, H / 2, (CD - 0.02) / 2, mat('carcass', '#e9e7e2', 0.7))
    const n = cw > 0.7 ? 2 : 1
    for (let i = 0; i < n; i++) {
      const dx = cx - cw / 2 + (cw / n) * (i + 0.5)
      box(cols, cw / n - 0.004, H - 0.006, 0.019, dx, H / 2, CD - 0.0095, white)
      box(cols, 0.02, 0.5, 0.025, dx + (i === 0 && n === 2 ? 1 : -1) * (cw / n / 2 - 0.03) * (n === 2 ? 1 : -1), 1.1, CD + 0.012, oak)
    }
  }
  // bridge cabinet over the bed (doors) + headboard wall with niche
  const br = part('bridge', 'panel')
  box(br, bw, 0.62, 0.35, bc, H - 0.31, 0.175, mat('carcass', '#e9e7e2', 0.7))
  for (let i = 0; i < 3; i++) box(br, bw / 3 - 0.004, 0.616, 0.019, bx0 + (bw / 3) * (i + 0.5), H - 0.31, 0.35 + 0.0095, white)
  const hb = part('headboard', 'fabric')
  box(hb, bw, 1.15, HB, bc, 0.575, HB / 2, oak)                                   // oak frame
  for (let i = 0; i < 4; i++) box(hb, bw / 4 - 0.02, 0.5, 0.06, bx0 + (bw / 4) * (i + 0.5), 0.82, HB + 0.03, fabric) // padded panels
  box(hb, bw - 0.04, 0.02, 0.12, bc, 1.16, HB - 0.06, oak)                        // niche shelf
  add(hb, new THREE.PlaneGeometry(bw - 0.1, 0.012), mat('led', '#fff3d8', 0.4, 0, { emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 1.2 }), bc, 1.68, 0.34).rotation.x = Math.PI / 2
  for (const s of [-1, 1]) {
    const lx = bc + s * (bw / 2 - 0.18)
    box(hb, 0.02, 0.02, 0.18, lx, 1.4, HB + 0.09, mat('lamp', '#2b2b2d', 0.4, 0.6))
    add(hb, new THREE.CylinderGeometry(0.03, 0.04, 0.06, 12), mat('lamp', '#2b2b2d', 0.4, 0.6), lx, 1.37, HB + 0.18)
    box(hb, 0.4, 0.02, HB + 0.05, bc + s * (bw / 2 - 0.2), 0.62, (HB + 0.05) / 2, oak) // integrated bedside shelves
  }
  // raised storage bed (lit coffre) 1.86 x 2.06, mattress 180 x 200 on top at 0.60
  const bed = part('bed', 'fabric'), bz = HB + 1.03
  box(bed, 1.86, 0.38, 2.06, bc, 0.19, bz, bedFab)
  box(bed, 1.84, 0.004, 0.004, bc, 0.3, bz + 1.031, mat('seam', '#6c6457', 0.9))
  box(bed, 1.8, 0.22, 2.0, bc, 0.49, bz, linen)
  box(bed, 1.82, 0.05, 1.45, bc, 0.62, bz + 0.3, duvet)
  for (const s of [-1, 1]) box(bed, 0.7, 0.12, 0.42, bc + s * 0.45, 0.66, HB + 0.3, mat('pillow', '#f4f2ee', 0.95))
  box(bed, 1.86, 0.03, 0.5, bc, 0.655, bz + 0.78, mat('throw', '#6f7d68', 0.95))
  return g
}
