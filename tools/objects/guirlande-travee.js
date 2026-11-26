// Guinguette string-light run along local X: hooked at `spans`+1 points (heights hookL → hookR), warm bulbs every ~30 cm
// on a sagging black cable. A high object only (nothing on the floor): use it along a facade (festoon) or as one span to a pole.
export const params = {
  length: { default: 4, min: 0.5, max: 12, step: 0.01, unit: 'm', label: 'Longueur' },
  spans: { default: 3, min: 1, max: 12, step: 1, label: 'Travées' },
  hookL: { default: 2.3, min: 1.6, max: 2.45, step: 0.01, unit: 'm', label: 'Hauteur gauche' },
  hookR: { default: 2.3, min: 1.6, max: 2.45, step: 0.01, unit: 'm', label: 'Hauteur droite' },
  hooks: { default: 1, min: 0, max: 1, step: 1, label: 'Crochets (0/1)' },
}
export const mount = 'floor'
export default function build({ params, THREE }) {
  const g = new THREE.Group()
  const L = params.length, n = Math.round(params.spans)
  const black = new THREE.MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.6, metalness: 0.4, name: 'slot_metal' })
  const bulb = new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: new THREE.Color('#ffb85c'), emissiveIntensity: 2.2, roughness: 0.3, name: 'slot_bulb' })
  const p = new THREE.Group(); p.name = 'part:lights'; p.userData.type = 'light'; g.add(p)
  const pts = []
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector3(-L / 2 + L * t, params.hookL + (params.hookR - params.hookL) * t, 0)) }
  if (params.hooks >= 0.5) for (const q of pts) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.04), black); h.position.set(q.x, q.y + 0.01, -0.02); p.add(h) }
  const bulbGeo = new THREE.SphereGeometry(0.03, 8, 6), capGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8)
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1], len = a.distanceTo(b), sag = 0.12 + len * 0.06
    const curve = new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2 - 2 * sag, 0), b)
    p.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.004, 4, false), black))
    const k = Math.max(2, Math.round(len / 0.3))
    for (let j = 1; j < k; j++) {
      const q = curve.getPoint(j / k)
      const c = new THREE.Mesh(capGeo, black); c.position.set(q.x, q.y - 0.02, 0); p.add(c)
      const s = new THREE.Mesh(bulbGeo, bulb); s.position.set(q.x, q.y - 0.055, 0); p.add(s)
    }
  }
  return g
}
