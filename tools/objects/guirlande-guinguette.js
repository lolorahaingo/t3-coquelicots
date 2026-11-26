// Guinguette string lights zig-zagging across a balcony strip: hooks on the facade side (local -Z, at 2.30 m),
// slim black poles clamped to the railing on the other side (+Z, lights at 2.10 m), warm bulbs every ~30 cm on a sagging cable.
// The strip runs along local X (length) with the given width (Z).
export const params = {
  length: { default: 8, min: 1, max: 12, step: 0.05, unit: 'm', label: 'Longueur' },
  width: { default: 1.0, min: 0.5, max: 2, step: 0.05, unit: 'm', label: 'Largeur' },
  spans: { default: 6, min: 1, max: 16, step: 1, label: 'Traversées' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const L = params.length, Wd = params.width, n = Math.round(params.spans)
  const black = new THREE.MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.6, metalness: 0.4, name: 'slot_metal' })
  const cable = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.8, name: 'slot_cable' })
  const bulb = new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: new THREE.Color('#ffb85c'), emissiveIntensity: 2.2, roughness: 0.3, name: 'slot_bulb' })
  const cablePart = new THREE.Group(); cablePart.name = 'part:cable'; g.add(cablePart)
  const bulbs = new THREE.Group(); bulbs.name = 'part:bulbs'; bulbs.userData.type = 'light'; g.add(bulbs)
  const poles = new THREE.Group(); poles.name = 'part:poles'; poles.userData.type = 'metal'; g.add(poles)
  const pts = []
  for (let i = 0; i <= n; i++) {
    const x = -L / 2 + (L * i) / n, facade = i % 2 === 0
    pts.push(new THREE.Vector3(x, facade ? 2.3 : 2.1, facade ? -Wd / 2 : Wd / 2))
    if (!facade) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.25, 10), black); p.position.set(x, 0.95 + 0.625, Wd / 2); poles.add(p)
    } else {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.04), black); h.position.set(x, 2.31, -Wd / 2 + 0.02); poles.add(h)
    }
  }
  const bulbGeo = new THREE.SphereGeometry(0.03, 8, 6), capGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8)
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1], len = a.distanceTo(b), sag = 0.12 + len * 0.06
    const curve = new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2 - 2 * sag, (a.z + b.z) / 2), b)
    cablePart.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.004, 4, false), cable))
    const k = Math.max(2, Math.round(len / 0.3))
    for (let j = 1; j < k; j++) {
      const p = curve.getPoint(j / k)
      const c = new THREE.Mesh(capGeo, black); c.position.set(p.x, p.y - 0.02, p.z); bulbs.add(c)
      const s = new THREE.Mesh(bulbGeo, bulb); s.position.set(p.x, p.y - 0.055, p.z); bulbs.add(s)
    }
  }
  return g
}
