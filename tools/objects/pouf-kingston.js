// Pouf "Kingston" (Bazaar Group, sold on Maisons du Monde), corduroy, brun chocolat: about 85 cm across, 50 cm high,
// soft round shape with vertical corduroy ribs.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const fab = new THREE.MeshStandardMaterial({ color: '#4a2f22', roughness: 0.97, name: 'slot_corduroy' })
  const rib = new THREE.MeshStandardMaterial({ color: '#3f281c', roughness: 0.98, name: 'slot_corduroy_rib' })
  const p = new THREE.Group(); p.name = 'part:pouf'; p.userData.type = 'fabric'; g.add(p)
  const pts = [[0.001, 0], [0.37, 0], [0.41, 0.025], [0.425, 0.08], [0.428, 0.25], [0.425, 0.42], [0.41, 0.475], [0.37, 0.5], [0.001, 0.5]].map(([r, y]) => new THREE.Vector2(r, y))
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), fab); p.add(body)
  for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; const r = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.36, 0.006), rib); r.position.set(Math.cos(a) * 0.427, 0.25, Math.sin(a) * 0.427); r.rotation.y = -a; p.add(r) }
  return g
}
