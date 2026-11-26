// Wall-mounted folding desk (bureau mural rabattable) for the electronics bench: oak top 1.40 x 0.60 at 0.75 m on a wall
// cleat with two folding steel brackets (equerres rabattables), shown open; folds flat (≈ 8 cm) to free the floor.
// On it: oscilloscope, soldering station, bench power supply, parts drawers, LED lamp. Back on the wall at Z = -D/2.
export const params = {
  width: { default: 1.4, min: 0.8, max: 2, step: 0.01, unit: 'm', label: 'Largeur' },
  depth: { default: 0.6, min: 0.4, max: 0.7, step: 0.01, unit: 'm', label: 'Profondeur' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.5, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide, ...extra }))
  const add = (p, geo, mt, x, y, z) => { const o = new THREE.Mesh(geo, mt); o.position.set(x, y, z); p.add(o); return o }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = params.width, D = params.depth, T = 0.75, back = -D / 2
  const oak = mat('oak', '#c59d6c', 0.5), steel = mat('metal', '#2c2d30', 0.45, 0.6), dark = mat('device', '#2a2c2f', 0.45, 0.2)
  const d = part('desk', 'wood')
  box(d, W, 0.08, 0.03, 0, T - 0.12, back + 0.015, oak)              // wall cleat
  box(d, W, 0.028, D, 0, T - 0.014, 0, oak)                          // top
  const b = part('brackets', 'metal')
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - 0.15)
    box(b, 0.03, 0.4, 0.03, x, T - 0.23, back + 0.03, steel)
    const arm = box(b, 0.03, 0.03, 0.52, x, T - 0.25, back + 0.24, steel); arm.rotation.x = -0.65
  }
  const kit = part('electronics', 'electronics')
  box(kit, 0.32, 0.16, 0.13, -W / 2 + 0.25, T + 0.08, back + 0.12, dark)  // oscilloscope
  add(kit, new THREE.PlaneGeometry(0.15, 0.1), mat('screen', '#0d2a3a', 0.2, 0, { emissive: new THREE.Color('#1c6fa0'), emissiveIntensity: 0.6 }), -W / 2 + 0.2, T + 0.09, back + 0.186)
  box(kit, 0.2, 0.1, 0.18, -W / 2 + 0.6, T + 0.05, back + 0.13, mat('psu', '#c9ccd0', 0.4, 0.4)) // bench PSU
  box(kit, 0.16, 0.08, 0.14, W / 2 - 0.45, T + 0.04, back + 0.15, mat('solder', '#b3261e', 0.5))  // soldering station
  add(kit, new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8), steel, W / 2 - 0.3, T + 0.1, back + 0.17).rotation.z = 0.5
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) box(kit, 0.06, 0.035, 0.12, W / 2 - 0.2 + (j - 1.5) * 0.065, T + 0.02 + i * 0.04, back + 0.08, mat('drawers', '#e7e2d6', 0.6))
  const lamp = part('lamp', 'metal')
  box(lamp, 0.012, 0.45, 0.012, 0.05, T + 0.22, back + 0.04, steel)
  box(lamp, 0.4, 0.015, 0.06, 0.05, T + 0.45, back + 0.18, steel)
  add(lamp, new THREE.PlaneGeometry(0.36, 0.03), mat('led', '#fffaf0', 0.4, 0, { emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1 }), 0.05, T + 0.442, back + 0.18).rotation.x = Math.PI / 2
  return g
}
