// Oak wall shelves on hidden brackets (lowest at y = 0, then every `gap`, `count` shelves). Back at Z = -D/2.
// Modelled from the lower shelf: place it at the wanted height.
export const params = {
  width: { default: 1.2, min: 0.3, max: 3, step: 0.005, unit: 'm', label: 'Largeur' },
  depth: { default: 0.25, min: 0.15, max: 0.35, step: 0.005, unit: 'm', label: 'Profondeur' },
  gap: { default: 0.4, min: 0.2, max: 0.6, step: 0.01, unit: 'm', label: 'Écart' },
  count: { default: 2, min: 1, max: 5, step: 1, label: 'Nombre' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const oak = new THREE.MeshStandardMaterial({ color: '#c59d6c', roughness: 0.5, name: 'slot_oak' })
  const p = new THREE.Group(); p.name = 'part:shelves'; p.userData.type = 'wood'; g.add(p)
  for (let i = 0; i < Math.round(params.count); i++) { const y = 0.015 + i * params.gap; { const m = new THREE.Mesh(new THREE.BoxGeometry(params.width, 0.03, params.depth), oak); m.position.set(0, y, 0); p.add(m) } }
  return g
}
