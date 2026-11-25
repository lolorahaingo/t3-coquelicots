// 2D plan (SVG) built from the Pascal graph. Coordinates: SVG x = world x, SVG y = world z (south is down).
import { wallRect, itemFootprint, itemHeight, distToSeg } from './geom.js';

const NS = 'http://www.w3.org/2000/svg';
const f = (n) => +n.toFixed(3);
const pts = (poly) => poly.map(([x, z]) => `${f(x)},${f(z)}`).join(' ');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// openings (doors + windows) of a wall, as intervals along the wall measured from its start
export function openings(G, wall) {
  const L = Math.hypot(wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]);
  return [...G.doors, ...G.windows]
    .filter((o) => (o.wallId || o.parentId) === wall.id)
    .map((o) => ({ node: o, kind: o.type, a: Math.max(0, o.position[0] - o.width / 2), b: Math.min(L, o.position[0] + o.width / 2) }));
}

export const alongWall = (wall, t) => {
  const [ax, az] = wall.start, [bx, bz] = wall.end, L = Math.hypot(bx - ax, bz - az) || 1;
  return [ax + ((bx - ax) * t) / L, az + ((bz - az) * t) / L];
};

const subRect = (wall, a, b, extra = 0) => {
  const p = alongWall(wall, a), q = alongWall(wall, b);
  return wallRect({ start: p, end: q, thickness: wall.thickness + extra });
};

// separator edges that do not lie on a wall face → open edges of the terrace (railings)
export function railEdges(G) {
  return G.separators
    .map((s) => [s.start, s.end])
    .filter(([a, b]) => {
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      return !G.walls.some((w) => distToSeg(mid, w.start, w.end) <= w.thickness / 2 + 0.06);
    });
}

export const isFloorItem = (it) => {
  const y = it.position[1] || 0, h = itemHeight(it);
  return y < 0.9 && h > 0.12;
};

export function planBounds(G, margin = 0.8) {
  const P = G.slab ? G.slab.polygon : G.walls.flatMap((w) => [w.start, w.end]);
  const xs = P.map((p) => p[0]), zs = P.map((p) => p[1]);
  const x0 = Math.min(...xs) - margin, z0 = Math.min(...zs) - margin;
  return [x0, z0, Math.max(...xs) + margin - x0, Math.max(...zs) + margin - z0];
}

// doorArcs: { [doorId]: [{ pivot, closed, open }] } computed from the GLB animations (optional)
export function buildPlanSVG(G, { doorArcs = {}, labels = true, spots = {} } = {}) {
  const vb = planBounds(G);
  const out = [];
  out.push(`<svg xmlns="${NS}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet">`);

  out.push('<g class="zones">');
  for (const z of G.zones) {
    out.push(`<polygon class="room" data-zone="${z.id}" points="${pts(z.polygon)}" fill="${z.color}" fill-opacity="${z.outdoor ? 0.12 : 0.2}"><title>${esc(z.name)} · ${z.area.toFixed(1).replace('.', ',')} m²</title></polygon>`);
  }
  out.push('</g>');

  out.push('<g class="items">');
  for (const it of G.items) {
    if (it.parentId && G.nodes[it.parentId]?.type !== 'level') continue;
    const isRug = itemHeight(it) < 0.1;
    out.push(`<polygon class="item${isRug ? ' rug' : ''}" points="${pts(itemFootprint(it))}"${isRug ? ' fill-opacity="0.4"' : ''}><title>${esc(it.name.replace(/^T3\s*·\s*/, ''))}</title></polygon>`);
  }
  out.push('</g>');

  out.push('<g class="walls">');
  for (const w of G.walls) out.push(`<polygon class="wall" points="${pts(wallRect(w))}"/>`);
  out.push('</g>');

  out.push('<g class="openings">');
  for (const w of G.walls) {
    for (const o of openings(G, w)) {
      out.push(`<polygon class="gap" points="${pts(subRect(w, o.a, o.b, 0.02))}"/>`);
      if (o.kind === 'window') {
        const t = w.thickness / 2;
        for (const off of [-0.25, 0, 0.25]) {
          const p = alongWall(w, o.a), q = alongWall(w, o.b);
          const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
          const nx = (-(q[1] - p[1]) / L) * t * off * 2, nz = ((q[0] - p[0]) / L) * t * off * 2;
          out.push(`<line class="win" x1="${f(p[0] + nx)}" y1="${f(p[1] + nz)}" x2="${f(q[0] + nx)}" y2="${f(q[1] + nz)}"/>`);
        }
        const r = subRect(w, o.a, o.b);
        out.push(`<polygon class="win" points="${pts(r)}"/>`);
      } else {
        for (const arc of doorArcs[o.node.id] || []) {
          const { pivot: c, closed: a, open: b } = arc;
          const r = Math.hypot(a[0] - c[0], a[1] - c[1]);
          const cross = (a[0] - c[0]) * (b[1] - c[1]) - (a[1] - c[1]) * (b[0] - c[0]);
          out.push(`<line class="leaf" x1="${f(c[0])}" y1="${f(c[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`);
          out.push(`<path class="arc" d="M${f(a[0])},${f(a[1])} A${f(r)},${f(r)} 0 0 ${cross > 0 ? 1 : 0} ${f(b[0])},${f(b[1])}"/>`);
        }
      }
    }
  }
  out.push('</g>');

  out.push('<g class="rails">');
  for (const [a, b] of railEdges(G)) out.push(`<line class="rail" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`);
  out.push('</g>');

  if (labels) {
    out.push('<g class="labels">');
    for (const z of G.zones) {
      const [x, y] = spots[z.id] || z.net[0];
      const small = z.area < 2;
      out.push(`<text class="label" x="${f(x)}" y="${f(y)}"${small ? ' style="font-size:.2px"' : ''}>${esc(z.name)}<tspan class="sub" x="${f(x)}" dy="1.15em">${z.area.toFixed(1).replace('.', ',')} m²</tspan></text>`);
    }
    // scale bar: 1 m
    const sx = vb[0] + 0.4, sy = vb[1] + vb[3] - 0.35;
    out.push(`<line class="scale" x1="${f(sx)}" y1="${f(sy)}" x2="${f(sx + 1)}" y2="${f(sy)}"/><line class="scale" x1="${f(sx)}" y1="${f(sy - 0.08)}" x2="${f(sx)}" y2="${f(sy + 0.08)}"/><line class="scale" x1="${f(sx + 1)}" y1="${f(sy - 0.08)}" x2="${f(sx + 1)}" y2="${f(sy + 0.08)}"/><text class="scale-t" x="${f(sx + 1.12)}" y="${f(sy + 0.08)}">1 m</text>`);
    out.push('</g>');
  }
  out.push('</svg>');
  return out.join('');
}
