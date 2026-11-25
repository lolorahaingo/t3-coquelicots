// Pure 2D helpers on the Pascal graph (plane x/z, metres). No DOM, no three.js: usable from Node too.

export const area = (poly) => {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, z1] = poly[i], [x2, z2] = poly[(i + 1) % poly.length];
    s += x1 * z2 - x2 * z1;
  }
  return s / 2;
};

export const centroid = (poly) => {
  let a = 0, cx = 0, cz = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, z1] = poly[i], [x2, z2] = poly[(i + 1) % poly.length];
    const f = x1 * z2 - x2 * z1;
    a += f; cx += (x1 + x2) * f; cz += (z1 + z2) * f;
  }
  return a ? [cx / (3 * a), cz / (3 * a)] : poly[0];
};

export const pointInPoly = ([x, z], poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};

export const distToSeg = ([px, pz], [ax, az], [bx, bz]) => {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
};

// drop consecutive collinear / duplicate points
export const simplify = (poly) => {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[(i - 1 + poly.length) % poly.length], b = poly[i], c = poly[(i + 1) % poly.length];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-6) continue;
    if (Math.abs(cross) < 1e-6) continue;
    out.push(b);
  }
  return out;
};

// half thickness of the wall lying on the edge a→b (0 if the edge is open, e.g. a separator)
function edgeHalfThickness(a, b, walls) {
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let best = null;
  for (const w of walls) {
    const d = distToSeg(mid, w.start, w.end);
    if (d < 0.03 && (!best || d < best.d)) best = { d, t: w.thickness };
  }
  return best ? best.t / 2 : 0;
}

// polygon on the wall axes → net floor polygon (each edge pushed inward by half its wall thickness)
export function insetByWalls(polygon, walls) {
  const poly = simplify(polygon);
  const ccw = area(poly) > 0 ? 1 : -1;
  const n = poly.length;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    // inward normal: for a ccw polygon (x right, z down in screen terms, but math sign is what matters) it is (-dz, dx)
    const nx = (-dz / L) * ccw, nz = (dx / L) * ccw;
    const h = edgeHalfThickness(a, b, walls);
    lines.push({ p: [a[0] + nx * h, a[1] + nz * h], d: [dx, dz] });
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const l1 = lines[(i - 1 + n) % n], l2 = lines[i];
    const det = l1.d[0] * l2.d[1] - l1.d[1] * l2.d[0];
    if (Math.abs(det) < 1e-9) { out.push(l2.p); continue; }
    const t = ((l2.p[0] - l1.p[0]) * l2.d[1] - (l2.p[1] - l1.p[1]) * l2.d[0]) / det;
    out.push([l1.p[0] + l1.d[0] * t, l1.p[1] + l1.d[1] * t]);
  }
  return out;
}

export const wallRect = (w) => {
  const [ax, az] = w.start, [bx, bz] = w.end;
  const L = Math.hypot(bx - ax, bz - az) || 1, h = w.thickness / 2;
  const nx = (-(bz - az) / L) * h, nz = ((bx - ax) / L) * h;
  return [[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]];
};

// footprint of a catalogue / custom item: asset dimensions [w, h, d] × scale, rotated around y
export function itemFootprint(it) {
  const [w, , d] = it.asset?.dimensions || [0.5, 0.5, 0.5];
  const sx = (it.scale?.[0] ?? 1) * w / 2, sz = (it.scale?.[2] ?? 1) * d / 2;
  const r = it.rotation?.[1] || 0, c = Math.cos(r), s = Math.sin(r);
  const [x, , z] = it.position;
  // three.js y-rotation: x' = x cos + z sin ; z' = -x sin + z cos
  return [[-sx, -sz], [sx, -sz], [sx, sz], [-sx, sz]].map(([u, v]) => [x + u * c + v * s, z - u * s + v * c]);
}

export const itemHeight = (it) => (it.asset?.dimensions?.[1] || 0.5) * (it.scale?.[1] ?? 1);

// read a Pascal graph into flat lists
export function readGraph(graph) {
  const N = Object.values(graph.nodes);
  const by = (t) => N.filter((v) => v.type === t);
  const walls = by('wall');
  const zones = by('zone').map((z) => {
    const net = insetByWalls(z.polygon, walls);
    return {
      id: z.id,
      name: z.name.replace(/^T3\s*·\s*/, ''),
      fullName: z.name,
      polygon: z.polygon,
      net,
      area: Math.abs(area(net)),
      color: z.color,
      outdoor: /terrasse|balcon|loggia/i.test(z.name),
    };
  });
  const items = by('item');
  const slab = by('slab')[0];
  return { nodes: graph.nodes, walls, zones, items, doors: by('door'), windows: by('window'), separators: by('separator'), slab };
}
