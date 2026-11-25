// Concert grand pedal harp in the spirit of the Camac Athena (47 strings, 185 cm), black lacquer.
// Side profile in the Y/Z plane: column at the front (+Z), soundbox rising backwards (-Z) from the base to the neck,
// curved neck on top, crown on the column, 7 pedals in the base. Overall ≈ 0.48 (X) x 1.86 (Y) x 0.96 (Z).
// At rest the soundbox side (-Z) goes towards the wall: that is the side a harp tips to.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.25, m = 0.1) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const black = mat('lacquer', '#0d0d0f', 0.18, 0.15), board = mat('soundboard', '#1a1714', 0.3, 0.05), brass = mat('brass', '#b89a5a', 0.35, 0.85)
  // base with pedals
  const base = part('base', 'wood')
  add(base, new THREE.BoxGeometry(0.46, 0.13, 0.52), black, 0, 0.065, 0.02)
  for (let i = 0; i < 7; i++) { const left = i < 3, x = left ? -0.06 - i * 0.05 : 0.04 + (i - 3) * 0.05; add(base, new THREE.BoxGeometry(0.025, 0.012, 0.09), brass, x, 0.06, 0.3) }
  for (const x of [-0.17, 0.17]) add(base, new THREE.BoxGeometry(0.06, 0.03, 0.08), black, x, 0.015, -0.27) // rear feet
  // column (front), fluted with a crown
  const col = part('column', 'wood')
  add(col, new THREE.CylinderGeometry(0.038, 0.045, 1.56, 16), black, 0, 0.13 + 0.78, 0.24)
  add(col, new THREE.CylinderGeometry(0.065, 0.045, 0.08, 16), black, 0, 1.73, 0.24)
  add(col, new THREE.CylinderGeometry(0.05, 0.065, 0.1, 16), black, 0, 1.81, 0.24)
  add(col, new THREE.SphereGeometry(0.035, 12, 8), brass, 0, 1.87, 0.24)
  // soundbox: tapered box from just behind the column foot (z 0.10, y 0.13) up to the neck end (z -0.62, y 1.50)
  const sb = part('soundbox', 'wood')
  const a = new THREE.Vector3(0, 0.13, 0.1), b = new THREE.Vector3(0, 1.5, -0.62), axis = b.clone().sub(a), len = axis.length()
  const geo = new THREE.BoxGeometry(1, len, 1, 1, 16, 1)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / len + 0.5 // 0 bottom → 1 top
    pos.setX(i, pos.getX(i) * (0.42 - 0.3 * t)); pos.setZ(i, pos.getZ(i) * (0.3 - 0.2 * t))
  }
  geo.computeVertexNormals()
  const box = new THREE.Mesh(geo, black)
  box.position.copy(a.clone().add(b).multiplyScalar(0.5))
  box.rotation.x = Math.atan2(axis.z, axis.y)
  // shift the box down-back, off the string line, so its front face (the soundboard) carries the strings
  box.position.add(new THREE.Vector3(0, (axis.z / len) * 0.09, (-axis.y / len) * 0.09))
  sb.add(box)
  // neck: S-curve from the column top to the soundbox top
  const neck = part('neck', 'wood')
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.72, 0.24), new THREE.Vector3(0, 1.63, 0.06), new THREE.Vector3(0, 1.7, -0.2), new THREE.Vector3(0, 1.66, -0.45), new THREE.Vector3(0, 1.52, -0.63)])
  add(neck, new THREE.TubeGeometry(curve, 40, 0.035, 8, false), black, 0, 0, 0)
  // 47 strings, vertical, from the neck down to the soundboard centre line; C strings red, F strings dark blue
  const strings = part('strings', 'gut')
  const gut = mat('gut', '#e8dcc0', 0.5, 0), red = mat('string_c', '#b3262a', 0.5, 0), blue = mat('string_f', '#1f2f5a', 0.5, 0), wire = mat('wire', '#9a8a6a', 0.3, 0.8)
  const neckY = (z) => { let best = curve.getPoint(0), d = 1e9; for (let i = 0; i <= 80; i++) { const p = curve.getPoint(i / 80); const e = Math.abs(p.z - z); if (e < d) { d = e; best = p } } return best.y - 0.04 }
  const boardY = (z) => 0.13 + (0.1 - z) * (1.37 / 0.72) + 0.02
  for (let i = 0; i < 47; i++) {
    const z = 0.08 - (i / 46) * 0.66, y1 = boardY(z), y2 = neckY(z), h = y2 - y1
    if (h < 0.06) continue
    const note = i % 7, m = i < 12 ? wire : note === 0 ? red : note === 3 ? blue : gut
    add(strings, new THREE.CylinderGeometry(i < 12 ? 0.0018 : 0.0012, i < 12 ? 0.0018 : 0.0012, h, 4), m, 0, y1 + h / 2, z)
  }
  return g
}
