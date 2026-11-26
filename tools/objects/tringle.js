// Curtain rod Ø 20 mm, black steel, two wall brackets and ball finials. Modelled from its bottom (y = 0): place it at the
// rail height. Back (wall side) at Z = -D/2.
export const params = { width: { default: 1.8, min: 0.6, max: 3.5, step: 0.01, unit: 'm', label: 'Longueur' } }
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const black = new THREE.MeshStandardMaterial({ color: '#222224', roughness: 0.45, metalness: 0.6, name: 'slot_metal' })
  const p = new THREE.Group(); p.name = 'part:rod'; p.userData.type = 'metal'; g.add(p)
  const W = params.width
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, W, 10), black); rod.rotation.z = Math.PI / 2; rod.position.set(0, 0.03, 0.03); p.add(rod)
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.07), black); b.position.set(s * (W / 2 - 0.12), 0.025, 0.0); p.add(b)
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), black); f.position.set(s * (W / 2 + 0.01), 0.03, 0.03); p.add(f)
  }
  return g
}
