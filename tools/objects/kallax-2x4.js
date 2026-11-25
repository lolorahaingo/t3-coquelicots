// IKEA KALLAX 2 x 4 laid horizontally (147 x 39 x 77 cm), white: thick outer frame, 8 open cubes 33 x 33 x 38 cm.
// A few storage boxes in some cubes. Back at Z = -D/2, front +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.6) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = 1.47, H = 0.77, D = 0.39, o = 0.045, t = 0.02, c = 0.33
  const white = mat('white', '#f4f4f2', 0.55)
  const k = part('kallax', 'panel')
  box(k, W, o, D, 0, o / 2, 0, white); box(k, W, o, D, 0, H - o / 2, 0, white)
  box(k, o, H, D, -W / 2 + o / 2, H / 2, 0, white); box(k, o, H, D, W / 2 - o / 2, H / 2, 0, white)
  box(k, W - 2 * o, t, D, 0, o + c + t / 2, 0, white)
  for (let i = 1; i < 4; i++) box(k, t, H - 2 * o, D, -W / 2 + o + i * c + (i - 0.5) * t, H / 2, 0, white)
  // two DRÖNA-style fabric boxes for small things
  const bx = part('boxes', 'fabric')
  const cx = (i) => -W / 2 + o + c / 2 + i * (c + t)
  box(bx, 0.32, 0.32, 0.36, cx(0), o + c + t + 0.16, 0.0, mat('box_grey', '#8f8c86', 0.95))
  box(bx, 0.32, 0.32, 0.36, cx(3), o + 0.16, 0.0, mat('box_beige', '#cdbfa6', 0.95))
  return g
}
