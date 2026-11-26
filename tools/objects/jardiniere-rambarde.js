// Railing planter (jardinière de balcon) hooked on the inside of the top rail: 0.80 x 0.20 x 0.18 m anthracite box,
// planted to screen the view a little: ornamental grasses, lavender and trailing ivy. Modelled from the planter bottom
// (y = 0): place it ≈ 0.80 m above the terrace. Back (railing side) at Z = -D/2.
export const params = { mix: { default: 0, min: 0, max: 2, step: 1, label: 'Plantation (0 graminées, 1 lavande, 2 mixte)' } }
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.8) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, name: 'slot_' + n, side: THREE.DoubleSide }))
  const box = (p, w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o }
  const pl = new THREE.Group(); pl.name = 'part:planter'; g.add(pl)
  const W = 0.8, D = 0.2, H = 0.18
  box(pl, W, H, D, 0, H / 2, 0, mat('planter', '#3b3d40', 0.6))
  box(pl, W - 0.03, 0.01, D - 0.03, 0, H - 0.01, 0, mat('soil', '#4a3424', 0.95))
  for (const x of [-0.28, 0.28]) { box(pl, 0.03, 0.04, 0.24, x, H + 0.02, -0.02, mat('hook', '#2a2b2d', 0.5)); box(pl, 0.03, 0.12, 0.012, x, H - 0.04, -D / 2 - 0.006, mat('hook', '#2a2b2d', 0.5)) }
  const plants = new THREE.Group(); plants.name = 'part:plants'; plants.userData.type = 'plant'; g.add(plants)
  const grass = mat('grass', '#8a9a5b', 0.9), grass2 = mat('grass_tip', '#c9b77c', 0.9), lav = mat('lavender', '#8e7cc3', 0.8), leaf = mat('leaf', '#4f6b3a', 0.85), ivy = mat('ivy', '#3e5a2e', 0.85)
  const mix = Math.round(params.mix)
  for (let i = 0; i < 7; i++) {
    const x = -W / 2 + 0.08 + i * ((W - 0.16) / 6), kind = mix === 2 ? i % 3 : mix
    if (kind === 0) for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.45 + (k % 3) * 0.08, 4), k % 2 ? grass : grass2); c.position.set(x + (k - 2.5) * 0.015, H + 0.24, (k % 2 ? 0.02 : -0.02)); c.rotation.z = (k - 2.5) * 0.12; plants.add(c) }
    else if (kind === 1) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), leaf); b.position.set(x, H + 0.06, 0); b.scale.y = 0.7; plants.add(b); for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.12, 5), lav); s.position.set(x + (k - 2) * 0.02, H + 0.17, (k % 2 ? 0.015 : -0.015)); plants.add(s) } }
    else { const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.02), ivy); v.position.set(x, H - 0.05, D / 2 + 0.01); plants.add(v); const t = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), ivy); t.position.set(x, H + 0.04, 0.02); plants.add(t) }
  }
  return g
}
