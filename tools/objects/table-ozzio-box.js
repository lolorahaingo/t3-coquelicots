// Ozzio BOX transformable table (Studio Ozeta), coffee-table mode: 120 x 75 x 25 cm, white mark-less lacquered top,
// matt graphite metal box base with castors at one end. Gas lift to 84 cm and two 50 cm leaves stored inside
// (120 / 170 / 220 cm, up to 10 people). mode 1 shows it raised and fully extended (220 x 75 x 76).
export const params = { mode: { default: 0, min: 0, max: 1, step: 1, label: 'Table à manger 220 (0/1)' } }
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const top = new THREE.MeshStandardMaterial({ color: '#f1f0ec', roughness: 0.35, name: 'slot_laque' })
  const graph = new THREE.MeshStandardMaterial({ color: '#3a3b3e', roughness: 0.5, metalness: 0.6, name: 'slot_graphite' })
  const p = new THREE.Group(); p.name = 'part:table'; g.add(p)
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o }
  const dining = params.mode >= 0.5, L = dining ? 2.2 : 1.2, H = dining ? 0.76 : 0.25
  add(new THREE.BoxGeometry(L, 0.03, 0.75), top, 0, H - 0.015, 0)
  if (!dining) {
    add(new THREE.BoxGeometry(1.14, 0.2, 0.69), graph, 0, 0.115, 0)
    add(new THREE.BoxGeometry(1.16, 0.004, 0.71), graph, 0, 0.012, 0)
  } else {
    for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.06, H - 0.04, 0.6), graph, s * (L / 2 - 0.12), (H - 0.04) / 2, 0); add(new THREE.BoxGeometry(0.1, 0.02, 0.7), graph, s * (L / 2 - 0.12), 0.01, 0) }
    add(new THREE.BoxGeometry(L - 0.3, 0.06, 0.08), graph, 0, H - 0.06, 0)
  }
  for (const z of [-0.3, 0.3]) add(new THREE.CylinderGeometry(0.02, 0.02, 0.015, 10), graph, L / 2 - 0.08, 0.01, z).rotation.z = Math.PI / 2
  return g
}
