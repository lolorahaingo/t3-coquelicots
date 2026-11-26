// Bean bag ("pouf poire") in chocolate-brown corduroy, Bazaar Group (Maisons du Monde ref. M25136275):
// ≈ 0.78 m across, slumped to ≈ 0.58 m high with a soft dent where you sit, fine vertical corduroy ribs.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const fab = new THREE.MeshStandardMaterial({ color: '#4a3024', roughness: 0.97, name: 'slot_corduroy' })
  const p = new THREE.Group(); p.name = 'part:beanbag'; p.userData.type = 'fabric'; g.add(p)
  // slumped pear profile: wide soft base, rounded shoulders, low top
  const prof = [[0.001, 0], [0.33, 0.0], [0.385, 0.04], [0.395, 0.12], [0.37, 0.25], [0.31, 0.38], [0.22, 0.48], [0.11, 0.56], [0.001, 0.58]]
  const geo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40, 0, Math.PI * 2)
  // corduroy ribs + a sitting dent + a slight lean, done on the vertices
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z)
    const rib = 1 + 0.012 * Math.cos(a * 40)
    const dent = y > 0.3 ? Math.exp(-((x - 0.05) ** 2 + (z - 0.08) ** 2) / 0.03) * 0.12 * ((y - 0.3) / 0.28) : 0
    pos.setXYZ(i, x * rib * 1.04, y - dent, z * rib + (y / 0.58) * -0.04)
  }
  geo.computeVertexNormals()
  p.add(new THREE.Mesh(geo, fab))
  return g
}
