// Round LED bathroom mirror Ø 60 cm with heated anti-fog pad (AICA type, IP44, touch switch, dimmable), frameless,
// LED halo behind. Modelled from its bottom (y = 0). Back to the wall at Z = -D/2, mirror facing +Z.
export const params = {}
export const mount = 'floor'
export default function build({ THREE }) {
  const g = new THREE.Group()
  const mirror = new THREE.MeshStandardMaterial({ color: '#d9dde1', roughness: 0.03, metalness: 0.98, name: 'slot_mirror' })
  const back = new THREE.MeshStandardMaterial({ color: '#cfd2d6', roughness: 0.5, name: 'slot_back' })
  const led = new THREE.MeshStandardMaterial({ color: '#fff7ea', emissive: new THREE.Color('#fff1d6'), emissiveIntensity: 1.3, name: 'slot_led' })
  const p = new THREE.Group(); p.name = 'part:mirror'; g.add(p)
  const add = (geo, m, x, y, z, rx = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.x = rx; p.add(o); return o }
  add(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 40), back, 0, 0.3, -0.005, Math.PI / 2)
  add(new THREE.TorusGeometry(0.28, 0.008, 6, 48), led, 0, 0.3, -0.012)
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.006, 48), mirror, 0, 0.3, 0.013, Math.PI / 2)
  add(new THREE.CircleGeometry(0.012, 16), led, 0.19, 0.1, 0.017)
  return g
}
