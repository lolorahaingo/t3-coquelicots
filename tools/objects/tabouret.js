// Height-adjustable work stool (sewing / workbench): round padded seat Ø 38, gas lift, five-star base on glides.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const seat = new THREE.MeshStandardMaterial({ color: '#2f3237', roughness: 0.8, name: 'slot_seat' })
  const metal = new THREE.MeshStandardMaterial({ color: '#9ea3a8', roughness: 0.3, metalness: 0.9, name: 'slot_metal' })
  const p = new THREE.Group(); p.name = 'part:stool'; g.add(p)
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o }
  add(new THREE.CylinderGeometry(0.19, 0.19, 0.07, 28), seat, 0, 0.53, 0)
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 14), metal, 0, 0.3, 0)
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const l = add(new THREE.BoxGeometry(0.26, 0.025, 0.035), metal, Math.cos(a) * 0.13, 0.05, Math.sin(a) * 0.13); l.rotation.y = -a; add(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10), seat, Math.cos(a) * 0.25, 0.015, Math.sin(a) * 0.25) }
  add(new THREE.TorusGeometry(0.17, 0.008, 6, 28), metal, 0, 0.25, 0).rotation.x = Math.PI / 2
  return g
}
