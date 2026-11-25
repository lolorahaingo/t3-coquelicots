// Xbox Series X lying horizontally: 301 x 151 x 151 mm matte black block, vented face with green-tinted vent, power button. Front +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.7, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, ...extra }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const L = 0.301, S = 0.151
  const black = mat('plastic', '#141516', 0.75), vent = mat('vent', '#1f3a1a', 0.6, 0, { emissive: new THREE.Color('#0f2a0a'), emissiveIntensity: 0.3 })
  const c = part('console', 'plastic')
  add(c, new THREE.BoxGeometry(L, S, S), black, 0, S / 2, 0)
  // top vent (on the side face when lying down): recessed disc with holes
  add(c, new THREE.CylinderGeometry(0.06, 0.06, 0.004, 40), vent, L / 2 + 0.0015, S / 2, 0).rotation.z = Math.PI / 2
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; for (const r of [0.025, 0.045]) add(c, new THREE.CylinderGeometry(0.003, 0.003, 0.005, 8), black, L / 2 + 0.002, S / 2 + Math.sin(a) * r, Math.cos(a) * r).rotation.z = Math.PI / 2 }
  // front: power button (white), disc slot, USB
  const white = mat('logo', '#f4f4f4', 0.3, 0, { emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.6 })
  add(c, new THREE.CylinderGeometry(0.008, 0.008, 0.003, 20), white, -L / 2 + 0.03, S - 0.03, S / 2 + 0.0015).rotation.x = Math.PI / 2
  add(c, new THREE.BoxGeometry(0.15, 0.003, 0.002), mat('slot', '#050505', 0.9), 0, S / 2 + 0.02, S / 2 + 0.001)
  add(c, new THREE.BoxGeometry(0.014, 0.006, 0.002), mat('slot', '#050505', 0.9), L / 2 - 0.03, 0.02, S / 2 + 0.001)
  return g
}
