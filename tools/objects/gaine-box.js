// Technical duct boxed in plasterboard (gaine technique), with its 7 cm partition, floor to ceiling. Plain painted box.
export const params = {
  width: { default: 0.4, min: 0.1, max: 2, step: 0.005, unit: 'm', label: 'Largeur' },
  depth: { default: 0.7, min: 0.1, max: 2, step: 0.005, unit: 'm', label: 'Profondeur' },
  height: { default: 2.43, min: 0.5, max: 2.5, step: 0.01, unit: 'm', label: 'Hauteur' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const p = new THREE.Group(); p.name = 'part:box'; p.userData.type = 'panel'; g.add(p)
  const m = new THREE.Mesh(new THREE.BoxGeometry(params.width, params.height, params.depth), new THREE.MeshStandardMaterial({ color: '#f2f0ec', roughness: 0.9, name: 'slot_paint' }))
  m.position.y = params.height / 2; p.add(m)
  return g
}
