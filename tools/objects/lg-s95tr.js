// LG S95TR 9.1.5 home-cinema set (pairs with LG OLED TVs, WOW Orchestra).
// kind 0: soundbar 1250 x 64 x 135 mm · 1: wireless subwoofer 200 x 406 x 404 mm · 2: wireless rear speaker 160 x 224 x 142 mm
// with up-firing driver, on a small wall bracket. Front +Z.
export const params = { kind: { default: 0, min: 0, max: 2, step: 1, label: 'Élément (0 barre, 1 caisson, 2 arrière)' } }
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const body = new THREE.MeshStandardMaterial({ color: '#2b2c2f', roughness: 0.55, metalness: 0.2, name: 'slot_body' })
  const grille = new THREE.MeshStandardMaterial({ color: '#3a3b3e', roughness: 0.9, name: 'slot_grille' })
  const p = new THREE.Group(); p.name = 'part:speaker'; p.userData.type = 'electronics'; g.add(p)
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o }
  const K = Math.round(params.kind)
  if (K === 0) {
    add(new THREE.BoxGeometry(1.25, 0.064, 0.135), body, 0, 0.032, 0)
    add(new THREE.BoxGeometry(1.23, 0.05, 0.004), grille, 0, 0.032, 0.0685)
    add(new THREE.BoxGeometry(1.1, 0.002, 0.1), grille, 0, 0.065, 0)
  } else if (K === 1) {
    add(new THREE.BoxGeometry(0.2, 0.406, 0.404), body, 0, 0.203, 0)
    add(new THREE.CylinderGeometry(0.085, 0.085, 0.004, 24), grille, 0.101, 0.22, 0).rotation.z = Math.PI / 2
  } else {
    add(new THREE.BoxGeometry(0.16, 0.224, 0.142), body, 0, 0.112, 0)
    add(new THREE.BoxGeometry(0.15, 0.2, 0.004), grille, 0, 0.112, 0.072)
    add(new THREE.BoxGeometry(0.12, 0.004, 0.1), grille, 0, 0.225, 0.0)
    add(new THREE.BoxGeometry(0.04, 0.06, 0.02), body, 0, 0.11, -0.08)
  }
  return g
}
