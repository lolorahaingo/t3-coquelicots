// Modern bar stool, seat at 0.75 m: oak seat with low curved back, black steel four-leg frame with footrest ring. Faces +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const oak = new THREE.MeshStandardMaterial({ color: '#c59d6c', roughness: 0.5, name: 'slot_oak' })
  const steel = new THREE.MeshStandardMaterial({ color: '#1f1f21', roughness: 0.45, metalness: 0.6, name: 'slot_metal' })
  const p = new THREE.Group(); p.name = 'part:stool'; g.add(p)
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o }
  add(new THREE.CylinderGeometry(0.19, 0.18, 0.04, 20), oak, 0, 0.75, 0)
  const back = add(new THREE.CylinderGeometry(0.19, 0.19, 0.12, 20, 1, true, Math.PI * 0.6, Math.PI * 0.8), oak, 0, 0.84, 0)
  for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) {
    const l = add(new THREE.CylinderGeometry(0.012, 0.012, 0.76, 8), steel, x * 0.9, 0.37, z * 0.9); l.rotation.z = x * 0.15; l.rotation.x = -z * 0.15
  }
  add(new THREE.TorusGeometry(0.16, 0.01, 6, 20), steel, 0, 0.28, 0).rotation.x = Math.PI / 2
  return g
}
