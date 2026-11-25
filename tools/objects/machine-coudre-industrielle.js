import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Industrial lockstitch sewing machine on its table (Juki DDL-8700 type): 1.20 x 0.60 table at 0.76 m on a grey steel
// frame, machine head set in the top (arm ~48 cm, handwheel on the right), servo motor under the table, knee lifter,
// treadle, thread stand with cones, LED lamp, drawer. The sewer sits on the +Z side.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.5, m = 0) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.01) => add(p, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), mt, x, y, z)
  const cyl = (p, rt, rb, h, x, y, z, mt, s = 20) => add(p, new THREE.CylinderGeometry(rt, rb, h, s), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const top = mat('table_top', '#e8e4da', 0.6), edge = mat('edge', '#8a8478', 0.6), frame = mat('frame', '#7b7f84', 0.45, 0.6)
  const head = mat('machine', '#eeeeea', 0.35, 0.1), headDark = mat('machine_dark', '#2c2e31', 0.4, 0.3), chrome = mat('metal', '#c9cdd1', 0.25, 0.9)
  const T = 0.76
  const t = part('table', 'wood')
  box(t, 1.2, 0.035, 0.6, 0, T - 0.0175, 0, top)
  box(t, 1.2, 0.035, 0.004, 0, T - 0.0175, 0.302, edge)
  box(t, 0.4, 0.1, 0.45, -0.35, T - 0.085, 0.0, mat('drawer', '#d9d4c8', 0.6)) // drawer under the left side
  const f = part('frame', 'metal')
  for (const x of [-0.55, 0.55]) { box(f, 0.035, T - 0.05, 0.035, x, (T - 0.05) / 2, -0.24, frame); box(f, 0.035, T - 0.05, 0.035, x, (T - 0.05) / 2, 0.24, frame); box(f, 0.04, 0.035, 0.6, x, 0.02, 0, frame) }
  box(f, 1.1, 0.03, 0.03, 0, 0.25, -0.24, frame)
  box(f, 0.32, 0.02, 0.2, 0.05, 0.08, 0.08, mat('treadle', '#3a3c3f', 0.6, 0.4)).rotation.x = 0.18 // treadle
  rbox(f, 0.22, 0.14, 0.16, 0.2, T - 0.13, -0.05, headDark, 0.02) // servo motor
  box(f, 0.02, 0.18, 0.02, 0.05, T - 0.13, 0.25, chrome) // knee lifter
  // machine head (sewer at +Z, needle on the left, handwheel on the right)
  const m = part('head', 'metal')
  rbox(m, 0.48, 0.05, 0.18, 0.02, T + 0.025, -0.05, head, 0.01)            // bed
  rbox(m, 0.11, 0.27, 0.15, 0.19, T + 0.05 + 0.135, -0.05, head, 0.025)     // pillar
  rbox(m, 0.44, 0.1, 0.12, 0.0, T + 0.27, -0.05, head, 0.035)                // arm
  rbox(m, 0.08, 0.16, 0.1, -0.2, T + 0.21, -0.05, head, 0.02)                // head end
  cyl(m, 0.006, 0.006, 0.12, -0.21, T + 0.1, -0.03, chrome, 8)                // needle bar
  box(m, 0.03, 0.008, 0.04, -0.21, T + 0.055, -0.03, chrome)                  // presser foot
  const wheel = cyl(m, 0.06, 0.06, 0.03, 0.265, T + 0.2, -0.05, headDark, 28); wheel.rotation.z = Math.PI / 2
  box(m, 0.06, 0.012, 0.02, 0.1, T + 0.322, -0.05, mat('label', '#1d6fb8', 0.5))  // brand stripe
  // thread stand with two cones + LED lamp
  const st = part('thread_stand', 'metal')
  cyl(st, 0.006, 0.006, 0.9, 0.5, T + 0.45, -0.22, chrome, 8)
  box(st, 0.2, 0.006, 0.02, 0.5, T + 0.9, -0.22, chrome)
  for (const [x, c] of [[0.45, '#a33b3b'], [0.55, '#2d3f6b']]) { cyl(st, 0.035, 0.03, 0.14, x, T + 0.08, -0.22, mat('cone' + c, c, 0.8), 16); box(st, 0.012, 0.012, 0.012, x, T + 0.9, -0.22, chrome) }
  const lamp = part('lamp', 'metal')
  const arm = cyl(lamp, 0.005, 0.005, 0.3, -0.12, T + 0.42, -0.1, headDark, 8); arm.rotation.z = 0.6
  rbox(lamp, 0.1, 0.02, 0.03, -0.24, T + 0.5, -0.06, headDark, 0.008)
  return g
}
