// Bar counter return fixed on the low partition / duct: oak top at 1.05 m, 40 cm deep, on hidden steel brackets,
// black steel footrest, doubles as an extra worktop. Back on the wall at Z = -D/2, front +Z.
export const params = {
  width: { default: 1.43, min: 0.6, max: 3, step: 0.005, unit: 'm', label: 'Longueur' },
  depth: { default: 0.4, min: 0.25, max: 0.6, step: 0.005, unit: 'm', label: 'Profondeur' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const oak = new THREE.MeshStandardMaterial({ color: '#c59d6c', roughness: 0.5, name: 'slot_oak' })
  const steel = new THREE.MeshStandardMaterial({ color: '#202022', roughness: 0.45, metalness: 0.6, name: 'slot_metal' })
  const p = new THREE.Group(); p.name = 'part:counter'; p.userData.type = 'wood'; g.add(p)
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o }
  const W = params.width, D = params.depth
  add(new THREE.BoxGeometry(W, 0.04, D), oak, 0, 1.03, 0)
  for (const x of [-W / 2 + 0.12, W / 2 - 0.12]) { add(new THREE.BoxGeometry(0.03, 0.3, 0.03), steel, x, 0.86, -D / 2 + 0.015); const a = add(new THREE.BoxGeometry(0.02, 0.02, 0.4), steel, x, 0.88, -D / 2 + 0.16); a.rotation.x = 0.7 }
  const f = add(new THREE.CylinderGeometry(0.012, 0.012, W - 0.1, 10), steel, 0, 0.3, -D / 2 + 0.12); f.rotation.z = Math.PI / 2
  for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) add(new THREE.BoxGeometry(0.02, 0.02, 0.12), steel, x, 0.3, -D / 2 + 0.06)
  return g
}
