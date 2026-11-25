import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
// Built-in bath as drawn on the architect's plan: 1.60 x 0.70 m, rim at 0.55 m, tiled front panel, oval basin,
// drain and deck-mounted mixer (spout + two handles) + hand shower at the east end (+X). Front panel +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.4, m = 0) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const cyl = (p, rt, rb, h, x, y, z, mt, s = 20) => add(p, new THREE.CylinderGeometry(rt, rb, h, s), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const L = 1.6, Wd = 0.7, H = 0.55
  const acryl = mat('acrylic', '#fbfbfa', 0.15), tile = mat('tile', '#ecebe7', 0.5), chrome = mat('metal', '#d0d4d8', 0.2, 0.95)
  // tiled apron (tablier) and deck
  const apron = part('apron', 'tile')
  add(apron, new THREE.BoxGeometry(L, H - 0.04, Wd), tile, 0, (H - 0.04) / 2, 0)
  for (const s of [-1, 1]) for (let i = 1; i < 8; i++) add(apron, new THREE.BoxGeometry(0.003, H - 0.05, 0.002), mat('grout', '#cfcdc8', 0.8), -L / 2 + i * L / 8, (H - 0.04) / 2, s * (Wd / 2 + 0.001))
  // acrylic shell: rim slab with an oval basin carved by CSG (basin 1.42 x 0.56 at the rim, 0.42 deep), centred slightly west
  const ev = new Evaluator(); ev.useGroups = false
  const slab = new Brush(new RoundedBoxGeometry(L, 0.46, Wd, 3, 0.015), acryl); slab.position.set(0, H - 0.23, 0); slab.updateMatrixWorld()
  const cut = new Brush(new THREE.SphereGeometry(1, 48, 24), acryl); cut.scale.set(0.69, 0.42, 0.27); cut.position.set(-0.06, H + 0.005, 0); cut.updateMatrixWorld()
  const shell = ev.evaluate(slab, cut, SUBTRACTION); shell.material = acryl
  const sh = part('bath', 'acrylic'); sh.add(shell)
  // drain + overflow at the east end
  cyl(sh, 0.025, 0.025, 0.004, 0.48, H - 0.405, 0, chrome, 24)
  // deck mixer at the east end (three holes as on the plan): spout in the middle, handles either side, hand shower
  const tap = part('mixer', 'metal')
  const xd = L / 2 - 0.055
  for (const z of [-0.12, 0, 0.12]) cyl(tap, 0.022, 0.025, 0.03, xd, H + 0.015, z, chrome)
  const spout = add(tap, new THREE.TorusGeometry(0.06, 0.014, 10, 20, Math.PI), chrome, xd - 0.06, H + 0.03, 0)
  spout.rotation.y = 0
  for (const z of [-0.12, 0.12]) { const h = add(tap, new THREE.BoxGeometry(0.012, 0.012, 0.07), chrome, xd - 0.02, H + 0.045, z); h.rotation.y = Math.PI / 2 }
  cyl(tap, 0.018, 0.022, 0.16, xd, H + 0.11, -0.22, chrome) // hand shower in its holder
  return g
}
