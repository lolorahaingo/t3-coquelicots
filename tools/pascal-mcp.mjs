#!/usr/bin/env node
// pascal-mcp.mjs — call the local Pascal MCP tools from a script (one connection for the whole list)
//
//   node tools/pascal-mcp.mjs list                       list the tools
//   node tools/pascal-mcp.mjs CALLS.json                 run [{ "tool": "...", "args": {...} }, …] in order
//
// Uses `pascal mcp connect` (stdio JSON-RPC). Stops at the first tool error.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const arg = process.argv[2];
if (!arg) { console.error('usage: node tools/pascal-mcp.mjs list | CALLS.json'); process.exit(1); }
const child = spawn('pascal', ['mcp', 'connect'], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = '', id = 0; const waiting = new Map();
child.stdout.on('data', (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let m; try { m = JSON.parse(line); } catch { continue; }
    if (m.id !== undefined && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  }
});
const rpc = (method, params) => new Promise((res) => { const k = ++id; waiting.set(k, res); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: k, method, params }) + '\n'); });
const text = (r) => (r.result?.content || []).map((c) => c.text ?? JSON.stringify(c)).join('\n');

await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'coquelicots', version: '1' } });
child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

if (arg === 'list') {
  const r = await rpc('tools/list', {});
  for (const t of r.result.tools) console.log(`${t.name}: ${(t.description || '').split('\n')[0].slice(0, 160)}`);
} else if (arg === 'schema') {
  const r = await rpc('tools/list', {});
  const t = r.result.tools.find((t) => t.name === process.argv[3]);
  console.log(JSON.stringify(t, null, 1));
} else {
  const calls = JSON.parse(readFileSync(arg, 'utf8'));
  for (const c of calls) {
    const r = await rpc('tools/call', { name: c.tool, arguments: c.args || {} });
    const out = r.error ? 'ERROR ' + JSON.stringify(r.error) : text(r);
    console.log(`── ${c.tool}${r.result?.isError ? ' (ERREUR)' : ''}\n${out.slice(0, c.max || 4000)}`);
    if (r.error || r.result?.isError) { child.kill(); process.exit(2); }
  }
}
child.kill();
process.exit(0);
