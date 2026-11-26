import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
// Wall-hung Japanese toilet (shower-toilet / washlet): boxed-in concealed cistern with flush plate,
// wall-hung bowl, heated washlet seat with side control unit. Back on the wall (Z = -D/2), front +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.5, m = 0) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide }))
  const add = (p, geo, mt, x, y, z) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); p.add(m); return m }
  const rbox = (p, w, h, d, x, y, z, mt, r = 0.01) => add(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const D = 0.72, back = -D / 2
  const wall = mat('paint', '#f2f0ec', 0.9), ceramic = mat('ceramic', '#fbfbfa', 0.18), chrome = mat('metal', '#c8ccd0', 0.25, 0.95)
  const panel = mat('panel', '#e9e7e3', 0.4), dark = mat('screen', '#2b2f33', 0.3)
  // boxed-in frame (coffrage du bâti-support) with flush plate
  const box = part('frame', 'panel')
  rbox(box, 0.5, 1.12, 0.18, 0, 0.56, back + 0.09, wall, 0.004)
  rbox(box, 0.5, 0.02, 0.2, 0, 1.13, back + 0.1, ceramic, 0.004) // top shelf
  const plate = part('flush', 'metal')
  rbox(plate, 0.25, 0.165, 0.008, 0, 0.98, back + 0.184, chrome, 0.003)
  rbox(plate, 0.075, 0.12, 0.004, -0.045, 0.98, back + 0.19, mat('button', '#e3e6e9', 0.2, 0.8), 0.002)
  rbox(plate, 0.11, 0.12, 0.004, 0.05, 0.98, back + 0.19, mat('button', '#e3e6e9', 0.2, 0.8), 0.002)
  // wall-hung bowl (egg-shaped, rim at 0.40 m)
  const bowl = part('bowl', 'ceramic')
  const shape = new THREE.Shape()
  shape.moveTo(-0.18, 0); shape.lineTo(0.18, 0)
  shape.bezierCurveTo(0.2, 0.25, 0.14, 0.52, 0, 0.53)
  shape.bezierCurveTo(-0.14, 0.52, -0.2, 0.25, -0.18, 0)
  const body = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 10 })
  body.rotateX(Math.PI / 2)
  const b = add(bowl, body, ceramic, 0, 0.375, back + 0.18)
  // washlet seat: thicker seat + lid, side control unit on the right
  const seat = part('washlet', 'plastic')
  const lid = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 10 })
  lid.rotateX(Math.PI / 2)
  add(seat, lid, ceramic, 0, 0.445, back + 0.2)
  rbox(seat, 0.4, 0.085, 0.17, 0, 0.44, back + 0.27, ceramic, 0.03) // rear housing (nozzle, dryer)
  rbox(seat, 0.05, 0.05, 0.17, 0.235, 0.43, back + 0.36, panel, 0.015) // side control unit
  for (let i = 0; i < 4; i++) rbox(seat, 0.012, 0.012, 0.03, 0.262, 0.44, back + 0.31 + i * 0.035, i === 0 ? mat('accent', '#4a8fd6', 0.4) : dark, 0.004)
  // water / power connection
  const pipe = part('hose', 'metal')
  const hose = add(pipe, new THREE.CylinderGeometry(0.006, 0.006, 0.22, 10), chrome, 0.17, 0.33, back + 0.19)
  return g
}
