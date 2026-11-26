// Slim wall coat rack for a narrow pier: oak board 0.26 x 0.9 m with 6 black hooks on two levels, small hat shelf on top,
// a couple of coats and a tote bag. Modelled from its bottom (y = 0). Back to the wall at Z = -D/2, front +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const oak = new THREE.MeshStandardMaterial({ color: '#c59d6c', roughness: 0.5, name: 'slot_oak' })
  const black = new THREE.MeshStandardMaterial({ color: '#1d1d1f', roughness: 0.45, metalness: 0.6, name: 'slot_metal' })
  const p = new THREE.Group(); p.name = 'part:coat_rack'; g.add(p)
  const box = (w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o }
  const W = 0.26
  box(W, 0.9, 0.02, 0, 0.45, -0.1, oak)
  box(W, 0.02, 0.2, 0, 0.91, 0.0, oak)
  for (const y of [0.55, 0.78]) for (const x of [-0.08, 0, 0.08]) { box(0.012, 0.012, 0.07, x, y, -0.055, black); box(0.012, 0.03, 0.012, x, y + 0.012, -0.022, black) }
  const coats = new THREE.Group(); coats.name = 'part:coats'; coats.userData.type = 'fabric'; g.add(coats)
  for (const [x, c, h] of [[-0.08, '#3b4a5c', 0.85], [0.06, '#8a6f52', 0.75]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.12), new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, name: 'slot_coat' + c.slice(1) })); m.position.set(x, 0.78 - h / 2 + 0.02, -0.01); coats.add(m) }
  return g
}
