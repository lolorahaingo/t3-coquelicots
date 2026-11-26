// Curtain panel drawn open (stacked at the side of a window): pinch-pleated folds, from the rail height down to 1 cm above
// the floor. tone 0: natural linen (living room, bedroom 2) · 1: blackout dark blue-grey (bedroom 1, projection).
// Back (wall side) at Z = -D/2. One panel per item, so the window opening stays free to walk through.
export const params = {
  height: { default: 2.35, min: 1.5, max: 2.43, step: 0.01, unit: 'm', label: 'Hauteur' },
  width: { default: 0.26, min: 0.15, max: 0.6, step: 0.01, unit: 'm', label: 'Largeur repliée' },
  tone: { default: 0, min: 0, max: 1, step: 1, label: 'Tissu (0 lin, 1 occultant)' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const fab = new THREE.MeshStandardMaterial({ color: params.tone >= 0.5 ? '#46505c' : '#e3dccf', roughness: 0.95, side: THREE.DoubleSide, name: 'slot_fabric' })
  const p = new THREE.Group(); p.name = 'part:curtain'; p.userData.type = 'fabric'; g.add(p)
  const H = params.height - 0.01, W = params.width, n = Math.max(3, Math.round(W / 0.045)), r = W / n / 2
  for (let i = 0; i < n; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.25, H, 6, 1, true, 0, Math.PI), fab)
    c.position.set(-W / 2 + r + i * 2 * r, 0.01 + H / 2, 0)
    c.rotation.y = i % 2 ? Math.PI : 0
    p.add(c)
  }
  return g
}
