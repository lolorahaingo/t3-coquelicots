// Voron 2.4 (250 mm build volume), the open-source CoreXY printer you source and build yourself (Klipper firmware,
// any 1.75 mm filament): black 2020 aluminium frame ≈ 0.43 x 0.43 x 0.58 m, tinted side panels, open front door,
// gantry with the toolhead, spool on a side holder. Front +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.5, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, ...extra }))
  const p = new THREE.Group(); p.name = 'part:printer'; p.userData.type = 'electronics'; g.add(p)
  const box = (w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o }
  const W = 0.43, D = 0.43, H = 0.58, e = 0.02
  const alu = mat('frame', '#1b1b1d', 0.45, 0.6), panel = mat('panel', '#3a3d42', 0.2, 0, { transparent: true, opacity: 0.35 }), red = mat('accent', '#d12c2c', 0.5)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(e, H, e, sx * (W / 2 - e / 2), H / 2, sz * (D / 2 - e / 2), alu)
  for (const y of [0.09, H - e / 2]) { for (const sz of [-1, 1]) box(W, e, e, 0, y, sz * (D / 2 - e / 2), alu); for (const sx of [-1, 1]) box(e, e, D, sx * (W / 2 - e / 2), y, 0, alu) }
  box(W - 0.01, 0.08, D - 0.01, 0, 0.04, 0, mat('base', '#252629', 0.6))             // electronics bay
  for (const sx of [-1, 1]) box(0.004, H - 0.12, D - 0.04, sx * (W / 2 - 0.002), H / 2 + 0.03, 0, panel)
  box(W - 0.04, H - 0.12, 0.004, 0, H / 2 + 0.03, -D / 2 + 0.002, panel)
  box(0.3, 0.008, 0.3, 0, 0.16, 0, mat('bed', '#a6a8ab', 0.3, 0.7))                 // heated bed
  box(W - 0.05, 0.03, 0.03, 0, 0.42, 0.02, alu)                                        // gantry
  box(0.06, 0.08, 0.06, 0.05, 0.4, 0.06, red)                                          // Stealthburner-style toolhead
  box(0.1, 0.06, 0.02, 0.12, 0.08, D / 2 + 0.01, mat('screen', '#0c2030', 0.2, 0, { emissive: new THREE.Color('#1d5f8f'), emissiveIntensity: 0.5 }))
  const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.065, 20), mat('filament', '#e48a2a', 0.6)); spool.rotation.z = Math.PI / 2; spool.position.set(W / 2 + 0.045, 0.32, 0); p.add(spool); box(0.04, 0.02, 0.02, W / 2 + 0.01, 0.32, 0, alu) // side spool holder
  return g
}
