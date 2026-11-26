// Ceiling-mounted 4K home-cinema projector, short zoom (throw ratio ≈ 1.13, e.g. BenQ W2700 class: 380 x 127 x 263 mm,
// fills a 90" screen from ≈ 2.25 m), white body, lens towards +Z, on a short ceiling mount. Modelled from its bottom (y = 0).
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const white = new THREE.MeshStandardMaterial({ color: '#f1f1ef', roughness: 0.45, name: 'slot_body' })
  const dark = new THREE.MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.4, metalness: 0.4, name: 'slot_metal' })
  const glass = new THREE.MeshStandardMaterial({ color: '#2a3442', roughness: 0.1, metalness: 0.3, name: 'slot_lens' })
  const p = new THREE.Group(); p.name = 'part:projector'; p.userData.type = 'electronics'; g.add(p)
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o }
  add(new THREE.BoxGeometry(0.38, 0.127, 0.263), white, 0, 0.0635, 0)
  add(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 20), dark, -0.08, 0.065, 0.15).rotation.x = Math.PI / 2
  add(new THREE.CircleGeometry(0.038, 20), glass, -0.08, 0.065, 0.176)
  add(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 10), dark, 0, 0.187, 0)
  add(new THREE.BoxGeometry(0.16, 0.01, 0.16), dark, 0, 0.245, 0)
  return g
}
