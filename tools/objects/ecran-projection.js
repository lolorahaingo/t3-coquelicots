// Motorised roll-down projection screen 90" 16:9 (image 1.99 x 1.12 m), white housing on the wall near the ceiling,
// shown lowered with black borders. Modelled from the bottom of the screen (y = 0): place it at its lowered height.
// Clip "open" rolls it up into the housing. Back to the wall at Z = -D/2, viewing side +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const white = new THREE.MeshStandardMaterial({ color: '#f3f3f1', roughness: 0.5, name: 'slot_housing' })
  const cloth = new THREE.MeshStandardMaterial({ color: '#fbfbfa', roughness: 0.95, name: 'slot_screen', side: THREE.DoubleSide })
  const black = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.9, name: 'slot_border', side: THREE.DoubleSide })
  const p = new THREE.Group(); p.name = 'part:housing'; g.add(p)
  const Hs = 1.26, W = 2.1, top = Hs + 0.06
  const h = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.09, 0.09), white); h.position.set(0, top + 0.045, 0); p.add(h)
  const roll = new THREE.Group(); roll.name = 'screen_roll'; roll.position.set(0, top, 0.01); g.add(roll)
  const s = new THREE.Group(); s.name = 'part:screen'; roll.add(s)
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); s.add(o); return o }
  add(new THREE.PlaneGeometry(W, Hs), black, 0, -Hs / 2, 0)
  add(new THREE.PlaneGeometry(1.99, 1.12), cloth, 0, -Hs / 2 + 0.03, 0.001)
  add(new THREE.BoxGeometry(W, 0.03, 0.02), black, 0, -Hs, 0)
  g.animations = [new THREE.AnimationClip('open', 1.5, [new THREE.VectorKeyframeTrack('screen_roll.scale', [0, 1.5], [1, 1, 1, 1, 0.02, 1])])]
  return g
}
