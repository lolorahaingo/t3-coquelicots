import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { readGraph, pointInPoly, distToSeg, wallRect, itemFootprint, centroid } from './geom.js';
import { buildPlanSVG, openings, alongWall, railEdges, isFloorItem, planBounds } from './plan.js';
import { unlock, lock } from './vault.js';

const FLOOR_Y = 0.05, EYE = 1.6, RADIUS = 0.22;
const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toFixed(1).replace('.', ',');
let mode = 'orbit'; // orbit | plan | walk

// ---------- data (encrypted, unlocked with the site password) ----------
$('lockBtn').addEventListener('click', lock);
const { scene: sceneJson, glb: glbBuffer } = await unlock({
  gate: $('gate'), form: $('gateForm'), input: $('gatePw'), remember: $('gateRemember'), error: $('gateErr'),
  onProgress: (p) => { $('loadtext').textContent = `Chargement de la maquette… ${Math.round(p * 100)} %`; },
});
$('lockBtn').hidden = false;
document.body.classList.remove('locked');
const G = readGraph(sceneJson.graph);
const zonesIndoor = G.zones.filter((z) => !z.outdoor);
const indoorArea = zonesIndoor.reduce((s, z) => s + z.area, 0);
const terrace = G.zones.find((z) => z.outdoor);
$('subtitle').textContent = `${fmt(indoorArea)} m² habitables${terrace ? ` · terrasse ${fmt(terrace.area)} m²` : ''} · 4ᵉ étage`;
$('totalArea').textContent = `${fmt(indoorArea)} m²`;

// ---------- 2D obstacles (walk mode) ----------
const obstacles = []; // convex polygons
for (const w of G.walls) {
  const L = Math.hypot(w.end[0] - w.start[0], w.end[1] - w.start[1]);
  const doors = openings(G, w).filter((o) => o.kind === 'door').sort((a, b) => a.a - b.a);
  let t = 0;
  for (const d of doors) { if (d.a > t + 0.01) obstacles.push(seg(w, t, d.a)); t = Math.max(t, d.b); }
  if (L > t + 0.01) obstacles.push(seg(w, t, L));
}
function seg(w, a, b) { return wallRect({ start: alongWall(w, a), end: alongWall(w, b), thickness: w.thickness }); }
const rails = railEdges(G);
for (const [a, b] of rails) obstacles.push(wallRect({ start: a, end: b, thickness: 0.06 }));
let itemObstacles = G.items.filter((it) => G.nodes[it.parentId]?.type === 'level' && isFloorItem(it)).map(itemFootprint);

const slabPoly = G.slab?.polygon;
function clearance(p, withItems = true) {
  let d = Infinity;
  const polys = withItems ? obstacles.concat(itemObstacles) : obstacles;
  for (const poly of polys) {
    if (pointInPoly(p, poly)) return 0;
    for (let i = 0; i < poly.length; i++) d = Math.min(d, distToSeg(p, poly[i], poly[(i + 1) % poly.length]));
  }
  return d;
}
// door openings: the wall thickness under a door belongs to no room (the rooms stop on the wall axis, the terrace on the
// facade's outer face), so a doorway is walkable in its own right — otherwise you stay stuck on the threshold
const doorways = G.walls.flatMap((w) => openings(G, w).filter((o) => o.kind === 'door').map((o) => wallRect({ start: alongWall(w, o.a), end: alongWall(w, o.b), thickness: w.thickness + 0.3 })));
const inDoorway = (p) => doorways.some((d) => pointInPoly(p, d));
const walkable = (p) => {
  const door = inDoorway(p);
  return (door || !slabPoly || pointInPoly(p, slabPoly)) && (door || G.zones.some((z) => pointInPoly(p, z.polygon))) && clearance(p) > RADIUS;
};

// most open spot of each room (label position + walk start point)
const spots = {};
function computeSpots() {
for (const z of G.zones) {
  const xs = z.net.map((p) => p[0]), zs = z.net.map((p) => p[1]);
  let best = null;
  for (let x = Math.min(...xs) + 0.05; x < Math.max(...xs); x += 0.1)
    for (let y = Math.min(...zs) + 0.05; y < Math.max(...zs); y += 0.1) {
      const p = [x, y];
      if (!pointInPoly(p, z.net)) continue;
      let e = Infinity;
      for (let i = 0; i < z.net.length; i++) e = Math.min(e, distToSeg(p, z.net[i], z.net[(i + 1) % z.net.length]));
      const s = Math.min(e, clearance(p));
      if (!best || s > best.s) best = { s, p };
    }
  spots[z.id] = best ? best.p : centroid(z.net);
}
}
computeSpots();
// how far one can see from p in direction ang without leaving the room
function viewRay(p, ang, poly, max = 12) {
  const dx = Math.cos(ang), dz = Math.sin(ang);
  for (let t = 0.1; t < max; t += 0.1) { const q = [p[0] + dx * t, p[1] + dz * t]; if (!pointInPoly(q, poly) || clearance(q) < 0.05) return t; }
  return max;
}

// ---------- three.js ----------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.75;
// orbit view: page colour; walk view: daylight sky behind the windows whatever the theme
const SKY = new THREE.Color('#cfe0ee');
const bgColor = () => (mode === 'walk' ? SKY : new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--stage').trim() || '#e9e4dc'));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { scene.background = bgColor(); });

const [bx, bz, bw, bh] = planBounds(G, 0);
const center = new THREE.Vector3(bx + bw / 2, FLOOR_Y, bz + bh / 2);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
sun.position.set(center.x - 7, 12, center.z + 9);
sun.target.position.copy(center);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target, new THREE.HemisphereLight(0xffffff, 0x9a8f80, 0.5));

const orbitCam = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
const homeDir = new THREE.Vector3(-0.42, 1, 0.78).normalize();
orbitCam.position.copy(center).addScaledVector(homeDir, Math.max(bw, bh) * 1.75);
const walkCam = new THREE.PerspectiveCamera(70, 1, 0.05, 100);
walkCam.rotation.order = 'YXZ';
const controls = new OrbitControls(orbitCam, canvas);
controls.target.copy(center);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 2; controls.maxDistance = 40;
controls.update();

// railings on the open edges of the terrace (not part of the Pascal export), like the building's rooftop guard:
// sage-grey powder-coated steel, dense vertical flat bars between a flat top rail and a bottom rail, 1.00 m high
const RAIL = { height: 1.0, pitch: 0.105, barW: 0.012, barD: 0.035, color: 0xa3ab9f };
const steelMat = new THREE.MeshStandardMaterial({ color: RAIL.color, roughness: 0.55, metalness: 0.45 });
const railGroup = new THREE.Group();
const barGeo = new THREE.BoxGeometry(RAIL.barW, RAIL.height - 0.1, RAIL.barD);
const dummy = new THREE.Object3D();
for (const [a, b] of rails) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const g = new THREE.Group();
  g.position.set((a[0] + b[0]) / 2, FLOOR_Y, (a[1] + b[1]) / 2); g.rotation.y = -ang;
  const top = new THREE.Mesh(new THREE.BoxGeometry(L, 0.012, 0.06), steelMat); top.position.y = RAIL.height - 0.006; g.add(top);
  const topEdge = new THREE.Mesh(new THREE.BoxGeometry(L, 0.04, 0.012), steelMat); topEdge.position.y = RAIL.height - 0.03; g.add(topEdge);
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(L, 0.04, 0.012), steelMat); bottom.position.y = 0.09; g.add(bottom);
  const n = Math.max(2, Math.round(L / RAIL.pitch));
  const bars = new THREE.InstancedMesh(barGeo, steelMat, n + 1);
  for (let i = 0; i <= n; i++) { dummy.position.set(-L / 2 + (i * L) / n, 0.07 + (RAIL.height - 0.1) / 2, 0); dummy.updateMatrix(); bars.setMatrixAt(i, dummy.matrix); }
  for (const m of [top, topEdge, bottom, bars]) { m.castShadow = true; m.receiveShadow = true; }
  g.add(bars);
  railGroup.add(g);
}
scene.add(railGroup);

// ---------- load the model ----------
const byKind = {};
const doorState = new Map(); // pascalId -> { action, t, dur, open, pos }
let mixer, model;
const gltf = await new GLTFLoader().parseAsync(glbBuffer, '');
model = gltf.scene;
model.traverse((o) => {
  const k = o.userData?.kind;
  if (k) (byKind[k] ||= []).push(o);
  if (o.isMesh) {
    o.castShadow = true; o.receiveShadow = true;
    for (const m of [].concat(o.material)) if (m.transparent && m.opacity < 0.5) o.castShadow = false;
  }
});
for (const z of byKind.zone || []) z.visible = false; // coloured zone overlays: the plan shows them instead
for (const s of byKind.site || []) for (const c of s.children) if (!c.userData?.kind) c.visible = false; // 30 m site ground plate
scene.add(model);

// walk obstacles from the real geometry: one box per part of each piece of furniture (a bed wall unit is its columns,
// its bed, its headboard… not one big box), floor-standing parts only
{
  const tmp = new THREE.Box3(), parts = [];
  model.updateMatrixWorld(true);
  for (const it of byKind.item || []) {
    const groups = new Map();
    it.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      let g = o; while (g !== it && !/^part/.test(g.name || '')) g = g.parent;
      tmp.setFromObject(o);
      if (!groups.has(g)) groups.set(g, new THREE.Box3());
      groups.get(g).union(tmp);
    });
    for (const b of groups.values()) {
      if (b.isEmpty() || b.min.y > FLOOR_Y + 0.9 || b.max.y - Math.max(b.min.y, FLOOR_Y) < 0.12) continue;
      parts.push([[b.min.x, b.min.z], [b.max.x, b.min.z], [b.max.x, b.max.z], [b.min.x, b.max.z]]);
    }
  }
  if (parts.length) { itemObstacles = parts; computeSpots(); }
}

// door / window animations: each clip "<id>: open" is driven by hand (time set every frame)
mixer = new THREE.AnimationMixer(model);
const nodePos = (n) => { const w = G.nodes[n.wallId || n.parentId]; return w?.start ? alongWall(w, n.position[0]) : null; };
for (const clip of gltf.animations) {
  const id = clip.name.split(':')[0].trim();
  const node = G.nodes[id];
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true; action.play(); action.paused = true; action.time = 0;
  doorState.set(id, { action, clip, t: 0, dur: clip.duration, open: false, pos: node ? nodePos(node) : null, isDoor: node?.type === 'door' });
}
mixer.update(0);

// two-leaf casement windows: Pascal exports them as a single 1.30 m sash with a central glazing bar.
// Split it into two half-width leaves hinged on each jamb; the second one mirrors the animated first one.
const twins = [];
for (const [id, st] of doorState) {
  const n = G.nodes[id];
  if (n?.type !== 'window' || n.windowType !== 'casement' || n.casementStyle !== 'single' || (n.columnRatios || []).length !== 2) continue;
  const hs = [...new Set(hingeObjects(st.clip))];
  if (hs.length !== 1) continue;
  const sash = hs[0];
  const grid = sash.getObjectByName('window-sash-grid'); if (grid) grid.visible = false;
  const twin = sash.clone(true);
  twin.name = sash.name + ' (2)';
  twin.position.x = -sash.position.x;
  sash.scale.x *= 0.5;
  twin.scale.x = -sash.scale.x;
  const handle = twin.getObjectByName('window-handle'); if (handle) handle.visible = false;
  sash.parent.add(twin);
  twins.push([sash, twin]);
}
const syncTwins = () => { for (const [a, b] of twins) b.quaternion.set(a.quaternion.x, -a.quaternion.y, -a.quaternion.z, a.quaternion.w); };
syncTwins();

// door swing arcs for the plan, measured on the animated model
function hingeObjects(clip) {
  return clip.tracks.map((t) => {
    const { nodeName } = THREE.PropertyBinding.parseTrackName(t.name);
    return model.getObjectByName(nodeName) || model.getObjectByProperty('uuid', nodeName);
  }).filter(Boolean);
}
const doorArcs = {};
{
  const box = new THREE.Box3(), v = new THREE.Vector3();
  const measure = (hs) => hs.map((h) => { model.updateMatrixWorld(true); const p = h.getWorldPosition(new THREE.Vector3()); box.setFromObject(h).getCenter(v); return { p: [p.x, p.z], c: [v.x, v.z] }; });
  for (const [id, s] of doorState) {
    if (!s.isDoor) continue;
    const hs = [...new Set(hingeObjects(s.clip))];
    s.action.time = 0; mixer.update(0); const closed = measure(hs);
    s.action.time = s.dur; mixer.update(0); const open = measure(hs);
    s.action.time = 0; mixer.update(0);
    doorArcs[id] = closed.map((cl, i) => {
      const far = (m) => [m.p[0] + 2 * (m.c[0] - m.p[0]), m.p[1] + 2 * (m.c[1] - m.p[1])];
      return { pivot: cl.p, closed: far(cl), open: far(open[i]) };
    });
  }
  model.updateMatrixWorld(true);
}

// ---------- UI: rooms, plan, minimap ----------
const roomList = $('rooms');
for (const z of G.zones) {
  const li = document.createElement('li');
  li.innerHTML = `<button data-zone="${z.id}"><span class="dot" style="background:${z.color}"></span><span class="name"></span><span class="m2">${fmt(z.area)} m²</span></button>`;
  li.querySelector('.name').textContent = z.name;
  roomList.append(li);
}
const planEl = $('plan');
planEl.innerHTML = buildPlanSVG(G, { doorArcs, spots });
const planSvg = planEl.querySelector('svg');
const minimap = $('minimap');
minimap.innerHTML = buildPlanSVG(G, { doorArcs, labels: false });
const miniSvg = minimap.querySelector('svg');
const me = document.createElementNS('http://www.w3.org/2000/svg', 'g');
me.innerHTML = '<path class="cone" d="M0,0 L1.6,-0.9 A1.8,1.8 0 0 1 1.6,0.9 Z"/><circle class="me" r="0.22"/>';
miniSvg.append(me);

let selected = null;
function select(zoneId) {
  selected = zoneId;
  for (const b of roomList.querySelectorAll('button')) b.classList.toggle('on', b.dataset.zone === zoneId);
  for (const p of planSvg.querySelectorAll('.room')) p.classList.toggle('on', p.dataset.zone === zoneId);
}
roomList.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-zone]'); if (!b) return;
  const z = G.zones.find((z) => z.id === b.dataset.zone);
  select(z.id);
  if (mode === 'orbit') focusRoom(z);
  else if (mode === 'walk') teleport(z);
  else zoomPlanTo(z);
  if (matchMedia('(max-width: 720px)').matches) setPanel(false);
});
planSvg.addEventListener('click', (e) => {
  const p = e.target.closest('.room'); if (!p || planMoved) return;
  select(p.dataset.zone === selected ? null : p.dataset.zone);
});

const panel = $('panel');
const setPanel = (open) => { panel.classList.toggle('closed', !open); $('panelToggle').setAttribute('aria-expanded', open); requestAnimationFrame(() => resize()); };
$('panelToggle').addEventListener('click', () => setPanel(panel.classList.contains('closed')));
if (matchMedia('(max-width: 720px)').matches) setPanel(false);

// plan pan / zoom (viewBox)
const vb0 = planBounds(G);
let vb = [...vb0], planMoved = false;
const applyVB = () => planSvg.setAttribute('viewBox', vb.map((n) => n.toFixed(3)).join(' '));
function svgPoint(cx, cy) {
  const r = planSvg.getBoundingClientRect();
  const s = Math.max(vb[2] / r.width, vb[3] / r.height);
  const ox = (r.width * s - vb[2]) / 2, oy = (r.height * s - vb[3]) / 2;
  return [vb[0] - ox + (cx - r.left) * s, vb[1] - oy + (cy - r.top) * s, s];
}
function zoomAt(cx, cy, k) {
  const [x, y] = svgPoint(cx, cy);
  const w = Math.min(vb0[2] * 2, Math.max(1.5, vb[2] * k)); k = w / vb[2];
  vb = [x - (x - vb[0]) * k, y - (y - vb[1]) * k, vb[2] * k, vb[3] * k]; applyVB();
}
planEl.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(e.deltaY * 0.0015)); }, { passive: false });
const ptrs = new Map(); let pinch = null;
planEl.addEventListener('pointerdown', (e) => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); planMoved = false; planEl.setPointerCapture(e.pointerId); planEl.classList.add('dragging'); });
planEl.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) return;
  const prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (pinch) zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, pinch / d);
    pinch = d; planMoved = true; return;
  }
  const s = svgPoint(0, 0)[2], dx = e.clientX - prev[0], dy = e.clientY - prev[1];
  if (Math.abs(dx) + Math.abs(dy) > 2) planMoved = true;
  vb[0] -= dx * s; vb[1] -= dy * s; applyVB();
});
const endPtr = (e) => { ptrs.delete(e.pointerId); pinch = null; if (!ptrs.size) planEl.classList.remove('dragging'); };
planEl.addEventListener('pointerup', endPtr); planEl.addEventListener('pointercancel', endPtr);
planEl.addEventListener('dblclick', () => { vb = [...vb0]; applyVB(); });
function zoomPlanTo(z) {
  const xs = z.polygon.map((p) => p[0]), zs = z.polygon.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const m = 1.2; vb = [x0 - m, z0 - m, x1 - x0 + 2 * m, z1 - z0 + 2 * m]; applyVB();
}

// ---------- options ----------
const opt = { doors: $('optDoors') };
function applyOptions() {
  for (const o of byKind.ceiling || []) o.visible = mode === 'walk';
  scene.background = bgColor();
  for (const s of doorState.values()) s.open = opt.doors.checked;
}
for (const i of Object.values(opt)) i.addEventListener('change', applyOptions);

// ---------- modes ----------
const HELP = {
  orbit: '<span class="desk">Glisser pour tourner · clic droit pour déplacer · molette pour zoomer · </span>cliquer une porte pour l’ouvrir',
  plan: 'Glisser pour déplacer · molette ou pincer pour zoomer · double-clic pour recadrer',
  walk: '<span class="desk">ZQSD / flèches pour marcher · glisser pour regarder · Maj pour courir · </span>les portes s’ouvrent à l’approche',
};
function setMode(m) {
  mode = m;
  document.body.classList.toggle('walk', m === 'walk');
  for (const b of document.querySelectorAll('.modes button')) b.setAttribute('aria-selected', b.dataset.mode === m);
  planEl.hidden = m !== 'plan';
  minimap.hidden = m !== 'walk';
  $('joy').hidden = !(m === 'walk' && matchMedia('(pointer: coarse)').matches);
  $('help').innerHTML = HELP[m];
  for (const l of document.querySelectorAll('.opt[data-for]')) l.hidden = !l.dataset.for.split(' ').includes(m);
  $('tip').hidden = true;
  // shareable viewpoint: #visite=x,z,cap° (e.g. #visite=-15.5,6.2,90)
  const at = (location.hash.match(/visite=(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)(?:,(-?[\d.]+))?/) || []).slice(1).map(Number);
  if (m === 'walk' && !walker.started && at.length === 4 && !Number.isNaN(at[0])) {
    Object.assign(walker, { x: at[0], z: at[1], yaw: (at[2] * Math.PI) / 180, pitch: Number.isNaN(at[3]) ? -0.05 : (at[3] * Math.PI) / 180, started: true });
  } else if (m === 'walk' && !walker.started) {
    // start in the largest room
    teleport(zonesIndoor.reduce((a, b) => (b.area > a.area ? b : a), zonesIndoor[0]));
  }
  applyOptions();
}
document.querySelector('.modes').addEventListener('click', (e) => { const b = e.target.closest('button[data-mode]'); if (b) setMode(b.dataset.mode); });

// ---------- orbit: focus a room ----------
let tween = null;
function focusRoom(z) {
  const [cx, cz] = centroid(z.net);
  const xs = z.polygon.map((p) => p[0]), zs = z.polygon.map((p) => p[1]);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
  const target = new THREE.Vector3(cx, FLOOR_Y + 0.5, cz);
  const dir = orbitCam.position.clone().sub(controls.target).normalize();
  const dist = Math.max(4, size * 1.6);
  tween = { t: 0, fromP: orbitCam.position.clone(), fromT: controls.target.clone(), toT: target, toP: target.clone().add(dir.multiplyScalar(dist)) };
}

// ---------- walk ----------
const walker = { x: 0, z: 0, yaw: 0, pitch: -0.05, started: false };
// arrive in a room like a visitor: just past the door you come from, looking into the room
function entryPoint(z) {
  const cands = [];
  for (const d of G.doors) {
    const w = G.nodes[d.wallId || d.parentId]; if (!w?.start) continue;
    const c = alongWall(w, d.position[0]);
    const L = Math.hypot(w.end[0] - w.start[0], w.end[1] - w.start[1]);
    const n = [-(w.end[1] - w.start[1]) / L, (w.end[0] - w.start[0]) / L];
    for (const sgn of [1, -1]) {
      const inside = [c[0] + n[0] * sgn * 0.75, c[1] + n[1] * sgn * 0.75], other = [c[0] - n[0] * sgn * 0.75, c[1] - n[1] * sgn * 0.75];
      if (!pointInPoly(inside, z.polygon) || !walkable(inside)) continue;
      const from = G.zones.find((o) => o !== z && pointInPoly(other, o.polygon));
      if (!from) continue; // front door of the flat
      const score = (from.outdoor ? 0 : 2) + (/entr|dgt|couloir/i.test(from.name) ? 2 : 0) + (z.outdoor ? 0 : 0);
      cands.push({ p: inside, dir: Math.atan2(n[1] * sgn, n[0] * sgn), score });
    }
  }
  cands.sort((a, b) => b.score - a.score);
  return cands[0];
}
function teleport(z) {
  const e = entryPoint(z);
  const p = e ? e.p : spots[z.id];
  walker.x = p[0]; walker.z = p[1]; walker.started = true;
  let best = 0, bestA = e ? e.dir : 0;
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    if (e && Math.cos(a - e.dir) < 0.35) continue; // stay within ±70° of "into the room"
    const d = viewRay(p, a, z.polygon); if (d > best) { best = d; bestA = a; }
  }
  walker.yaw = Math.atan2(-Math.cos(bestA), -Math.sin(bestA)); walker.pitch = -0.08;
}
const keys = new Set();
addEventListener('keydown', (e) => { if (mode === 'walk' && !e.metaKey && !e.ctrlKey) { keys.add(e.key.toLowerCase()); if (e.key.startsWith('Arrow')) e.preventDefault(); } });
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
let look = null;
canvas.addEventListener('pointerdown', (e) => { if (mode === 'walk') { look = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); } });
canvas.addEventListener('pointermove', (e) => {
  if (mode === 'walk' && look && e.pointerId === look.id) {
    walker.yaw -= (e.clientX - look.x) * 0.004; walker.pitch = Math.max(-1.2, Math.min(1.2, walker.pitch - (e.clientY - look.y) * 0.004));
    look.x = e.clientX; look.y = e.clientY;
  }
});
canvas.addEventListener('pointerup', (e) => { if (look && e.pointerId === look.id) look = null; });
// joystick (touch)
const joy = $('joy'), knob = joy.querySelector('.knob'); const stick = { x: 0, y: 0, id: null };
joy.addEventListener('pointerdown', (e) => { stick.id = e.pointerId; joy.setPointerCapture(e.pointerId); moveStick(e); });
joy.addEventListener('pointermove', (e) => { if (e.pointerId === stick.id) moveStick(e); });
const endStick = () => { stick.id = null; stick.x = stick.y = 0; knob.style.transform = ''; };
joy.addEventListener('pointerup', endStick); joy.addEventListener('pointercancel', endStick);
function moveStick(e) {
  const r = joy.getBoundingClientRect(), R = r.width / 2;
  let x = (e.clientX - r.left - R) / R, y = (e.clientY - r.top - R) / R; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  stick.x = x; stick.y = y; knob.style.transform = `translate(${x * R * 0.6}px, ${y * R * 0.6}px)`;
}
function stepWalk(dt) {
  let f = 0, s = 0, turn = 0;
  if (keys.has('z') || keys.has('w') || keys.has('arrowup')) f += 1;
  if (keys.has('s') || keys.has('arrowdown')) f -= 1;
  if (keys.has('q') || keys.has('a')) s -= 1;
  if (keys.has('d')) s += 1;
  if (keys.has('arrowleft')) turn += 1;
  if (keys.has('arrowright')) turn -= 1;
  f -= stick.y; s += stick.x;
  walker.yaw += turn * dt * 1.8;
  const speed = (keys.has('shift') ? 2.6 : 1.3) * dt;
  const l = Math.hypot(f, s); if (l > 1) { f /= l; s /= l; }
  if (l > 0.05) {
    const sy = Math.sin(walker.yaw), cy = Math.cos(walker.yaw);
    const dx = (-sy * f + cy * s) * speed, dz = (-cy * f - sy * s) * speed;
    const tryAt = (x, z) => walkable([x, z]) && ((walker.x = x), (walker.z = z), true);
    tryAt(walker.x + dx, walker.z + dz) || tryAt(walker.x + dx, walker.z) || tryAt(walker.x, walker.z + dz);
  }
  walkCam.position.set(walker.x, FLOOR_Y + EYE, walker.z);
  walkCam.rotation.set(walker.pitch, walker.yaw, 0);
  // doors open on approach
  for (const st of doorState.values()) if (st.isDoor && st.pos) st.open = opt.doors.checked || Math.hypot(st.pos[0] - walker.x, st.pos[1] - walker.z) < 1.5;
  me.setAttribute('transform', `translate(${walker.x.toFixed(2)} ${walker.z.toFixed(2)}) rotate(${(((-walker.yaw - Math.PI / 2) * 180) / Math.PI).toFixed(1)})`);
  // keep the minimap centred on the walker
  const w = 7; miniSvg.setAttribute('viewBox', `${(walker.x - w / 2).toFixed(2)} ${(walker.z - w / 2).toFixed(2)} ${w} ${w}`);
}

// ---------- picking: furniture names, click a door ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tip = $('tip');
const ancestorKind = (o) => { for (; o; o = o.parent) if (o.userData?.kind && o.userData.kind !== 'level') return o; return null; };
function pick(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, mode === 'walk' ? walkCam : orbitCam);
  const hits = ray.intersectObject(model, true).filter((h) => h.object.visible);
  return hits.length ? ancestorKind(hits[0].object) : null;
}
let lastMove = 0;
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || mode === 'plan' || e.buttons || performance.now() - lastMove < 60) return;
  lastMove = performance.now();
  const o = pick(e);
  const k = o?.userData.kind, label = k === 'item' ? o.userData.label.replace(/^T3\s*·\s*/, '') : k === 'door' ? 'Porte' : k === 'window' ? 'Fenêtre' : '';
  tip.hidden = !label; if (label) { tip.textContent = label; const r = canvas.getBoundingClientRect(); tip.style.left = e.clientX - r.left + 'px'; tip.style.top = e.clientY - r.top + 'px'; }
  canvas.style.cursor = k === 'door' || k === 'window' ? 'pointer' : '';
});
canvas.addEventListener('pointerleave', () => { tip.hidden = true; });
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('click', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const o = pick(e); const st = o && doorState.get(o.userData.pascalId);
  if (st && mode !== 'plan') { st.open = !st.open; st.manual = true; }
});

// ---------- loop ----------
function resize() {
  const { clientWidth: w, clientHeight: h } = canvas;
  renderer.setSize(w, h, false);
  for (const c of [orbitCam, walkCam]) { c.aspect = w / h; c.updateProjectionMatrix(); }
  // keep the model clear of the side panel on wide screens
  const shift = w > 720 && !panel.classList.contains('closed') ? -(panel.offsetWidth + 16) / 2 : 0;
  if (shift) orbitCam.setViewOffset(w, h, shift, 0, w, h); else orbitCam.clearViewOffset();
}
new ResizeObserver(resize).observe(canvas);
resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (mode === 'plan') return;
  if (mode === 'walk') stepWalk(dt);
  else {
    if (tween) {
      tween.t = Math.min(1, tween.t + dt * 1.6); const k = 1 - Math.pow(1 - tween.t, 3);
      orbitCam.position.lerpVectors(tween.fromP, tween.toP, k); controls.target.lerpVectors(tween.fromT, tween.toT, k);
      if (tween.t >= 1) tween = null;
    }
    controls.update();
  }
  let moved = false;
  for (const st of doorState.values()) {
    const goal = st.open ? st.dur : 0;
    if (st.t !== goal) { st.t = goal > st.t ? Math.min(goal, st.t + dt * st.dur * 1.4) : Math.max(goal, st.t - dt * st.dur * 1.4); st.action.time = st.t; moved = true; }
  }
  if (moved) { mixer.update(0); syncTwins(); }
  renderer.render(scene, mode === 'walk' ? walkCam : orbitCam);
});

setMode(/visite=/.test(location.hash) ? 'walk' : 'orbit');
$('loading').classList.add('done');