// Slim black string-light pole (Ø 25 mm, 2.20 m) clamped to the inside of the terrace railing: base on the floor,
// clamp at the top rail, hook at the top.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const black = new THREE.MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.55, metalness: 0.5, name: 'slot_metal' })
  const p = new THREE.Group(); p.name = 'part:pole'; p.userData.type = 'metal'; g.add(p)
  const add = (geo, x, y, z) => { const o = new THREE.Mesh(geo, black); o.position.set(x, y, z); p.add(o); return o }
  add(new THREE.CylinderGeometry(0.0125, 0.0125, 2.2, 10), 0, 1.1, 0)
  add(new THREE.CylinderGeometry(0.04, 0.045, 0.02, 12), 0, 0.01, 0)
  add(new THREE.BoxGeometry(0.06, 0.06, 0.06), 0, 0.97, 0.02)
  add(new THREE.TorusGeometry(0.02, 0.004, 6, 12), 0, 2.21, 0)
  return g
}
