// GTL (gaine technique logement) as an openable cupboard, as on the plan: 0.775 wide x 0.214 deep, floor to ceiling.
// Fixed panel at the left (-X), one door hinged next to it; inside: electrical panel (tableau), internet box, DTI.
// Clip "open" swings the door 100°. Back on the wall at Z = -D/2, front +Z.
export const params = {
  width: { default: 0.775, min: 0.4, max: 1.2, step: 0.005, unit: 'm', label: 'Largeur' },
  depth: { default: 0.214, min: 0.15, max: 0.6, step: 0.005, unit: 'm', label: 'Profondeur' },
  height: { default: 2.43, min: 1.5, max: 2.5, step: 0.01, unit: 'm', label: 'Hauteur' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const M = {}
  const mat = (n, c, r = 0.6, m = 0, extra = {}) => M[n] || (M[n] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, name: 'slot_' + n, side: THREE.DoubleSide, ...extra }))
  const add = (p, geo, mt, x, y, z) => { const o = new THREE.Mesh(geo, mt); o.position.set(x, y, z); p.add(o); return o }
  const box = (p, w, h, d, x, y, z, mt) => add(p, new THREE.BoxGeometry(w, h, d), mt, x, y, z)
  const part = (id, type) => { const q = new THREE.Group(); q.name = 'part:' + id; if (type) q.userData.type = type; g.add(q); return q }
  const W = params.width, D = params.depth, H = params.height, t = 0.019, fixed = 0.16
  const paint = mat('paint', '#f2f0ec', 0.85), inside = mat('inside', '#e4e2dd', 0.8), plastic = mat('panel', '#f6f6f4', 0.4)
  const body = part('body', 'panel')
  box(body, t, H, D, -W / 2 + t / 2, H / 2, 0, paint); box(body, t, H, D, W / 2 - t / 2, H / 2, 0, paint)
  box(body, W, t, D, 0, H - t / 2, 0, paint); box(body, W, t, D, 0, t / 2, 0, paint)
  box(body, W - 2 * t, H - 2 * t, 0.01, 0, H / 2, -D / 2 + 0.005, inside)
  box(body, fixed, H, t, -W / 2 + fixed / 2, H / 2, D / 2 - t / 2, paint) // fixed front panel
  // equipment: 3-row consumer unit, internet box, DTI, ducts
  const eq = part('equipment', 'electrical')
  const cx = fixed / 2
  box(eq, 0.3, 0.55, 0.1, cx, 1.35, -D / 2 + 0.06, plastic)
  for (let r = 0; r < 3; r++) for (let k = 0; k < 13; k++) box(eq, 0.017, 0.07, 0.03, cx - 0.11 + k * 0.018, 1.17 + r * 0.17, -D / 2 + 0.12, mat(k % 6 === 0 ? 'breaker_main' : 'breaker', k % 6 === 0 ? '#3b6db5' : '#fafafa', 0.5))
  box(eq, 0.2, 0.035, 0.14, cx, 0.95, -D / 2 + 0.08, mat('box', '#2c2c2e', 0.5))
  add(eq, new THREE.CircleGeometry(0.004, 8), mat('led', '#7cff8a', 0.4, 0, { emissive: new THREE.Color('#3cff5a'), emissiveIntensity: 1 }), cx + 0.07, 0.95, -D / 2 + 0.151)
  box(eq, 0.12, 0.16, 0.05, cx - 0.06, 0.7, -D / 2 + 0.035, plastic)
  for (const x of [-0.08, 0, 0.08]) box(eq, 0.035, 0.6, 0.035, cx + x, 1.95, -D / 2 + 0.025, mat('duct', '#9a9a9a', 0.7))
  // door on a hinge pivot (named, so the clip can target it)
  const doorW = W - fixed - 0.004
  const pivot = new THREE.Group(); pivot.name = 'gtl_door_hinge'; pivot.position.set(-W / 2 + fixed, 0, D / 2); g.add(pivot)
  const dp = new THREE.Group(); dp.name = 'part:door'; dp.userData.type = 'panel'; pivot.add(dp)
  box(dp, doorW, H - 0.006, t, doorW / 2 + 0.002, H / 2, -t / 2, paint)
  box(dp, 0.012, 0.14, 0.02, doorW - 0.05, 1.05, 0.01, mat('handle', '#b9bcc0', 0.3, 0.9))
  const q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -1.75)
  g.animations = [new THREE.AnimationClip('open', 1, [new THREE.QuaternionKeyframeTrack('gtl_door_hinge.quaternion', [0, 1], [...q0.toArray(), ...q1.toArray()])])]
  return g
}
