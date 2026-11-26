// Dyson V8 cordless vacuum hanging on its wall dock (charging), nickel / purple: dock at ~1.0 m, motor + clear bin,
// purple wand, floor head just above the floor (total ≈ 1.24 m). Back to the wall at Z = -D/2, front +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.4, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, ...extra }))
  const p = new THREE.Group(); p.name = 'part:vacuum'; p.userData.type = 'appliance'; g.add(p)
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o }
  const nickel = mat('nickel', '#a7a9ad', 0.35, 0.8), purple = mat('purple', '#6b3fa0', 0.4, 0.2), grey = mat('grey', '#5b5d61', 0.5), clear = mat('bin', '#d9dde2', 0.1, 0, { transparent: true, opacity: 0.55 })
  add(new THREE.BoxGeometry(0.1, 0.16, 0.03), grey, 0, 1.0, -0.12)                        // wall dock
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 18), clear, 0, 1.05, -0.03)             // clear bin
  add(new THREE.CylinderGeometry(0.055, 0.055, 0.11, 18), nickel, 0, 1.19, -0.03)        // cyclones
  add(new THREE.BoxGeometry(0.06, 0.16, 0.1), purple, 0, 1.12, 0.05)                      // motor / handle
  add(new THREE.BoxGeometry(0.05, 0.03, 0.12), grey, 0, 1.22, 0.07)
  add(new THREE.CylinderGeometry(0.018, 0.018, 0.75, 12), purple, 0, 0.56, -0.03)          // wand
  add(new THREE.BoxGeometry(0.25, 0.06, 0.1), grey, 0, 0.13, 0.0)                         // floor head
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 12), purple, 0, 0.13, 0.05).rotation.z = Math.PI / 2
  return g
}
