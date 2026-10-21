// nullCAT Stream Deck plugin: live status tiles + command buttons for the nullCAT web API.
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { ACTIONS } = require('./icons');

const BASE = (process.env.NULLCAT_URL || 'http://nullcat.local:8080').replace(/\/+$/, '');
const POLL_MS = 1000;
const PREFIX = 'nl.haarie.nullcat.';

// ---- parse launch args ----
const args = process.argv.slice(2);
const arg = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const port = arg('-port');
const pluginUUID = arg('-pluginUUID');
const registerEvent = arg('-registerEvent');

if (!port || !pluginUUID || !registerEvent) {
  console.error('Not launched by Stream Deck');
  process.exit(1);
}

// Small rolling log next to the plugin (helps debugging; Stream Deck doesn't capture plugin output).
const LOG = path.join(__dirname, '..', 'nullcat.log');
function log(...a) {
  try {
    if (fs.existsSync(LOG) && fs.statSync(LOG).size > 100000) fs.writeFileSync(LOG, '');
    fs.appendFileSync(LOG, `${new Date().toISOString()} ${a.join(' ')}\n`);
  } catch { /* ignore */ }
}
process.on('uncaughtException', (e) => log('uncaughtException', e && e.stack));
process.on('unhandledRejection', (e) => log('unhandledRejection', e && e.stack));
log('start', BASE, 'node', process.version);

const ws = new WebSocket(`ws://127.0.0.1:${port}`);
const send = (o) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(o));

// context -> action id
const contexts = new Map();
let status = null;
let phase = false;
let lastImages = new Map();
let polling = false;
let lastOk = null;

function svgUri(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
}

function paint(context, id, force) {
  const a = ACTIONS[id];
  if (!a) return;
  const svg = a.render(status, phase);
  if (!force && lastImages.get(context) === svg) return;
  lastImages.set(context, svg);
  send({ event: 'setImage', context, payload: { image: svgUri(svg), target: 0 } });
  log('setImage', id);
}

function paintAll(force) {
  for (const [context, id] of contexts) paint(context, id, force);
}

async function poll() {
  if (polling) return;
  polling = true;
  try {
    const r = await fetch(`${BASE}/api/status`, { signal: AbortSignal.timeout(1500) });
    status = r.ok ? await r.json() : null;
  } catch {
    status = null;
  }
  polling = false;
  const ok = !!status;
  if (ok !== lastOk) { log('poll', ok ? 'ok' : 'FAILED (cannot reach ' + BASE + ')'); lastOk = ok; }
  phase = !phase;
  paintAll(false);
}

async function press(context, id) {
  const a = ACTIONS[id];
  if (!a) return;
  if (id === 'webui') {
    send({ event: 'openUrl', payload: { url: BASE + '/' } });
    return;
  }
  if (id === 'link') {
    await poll();
    send({ event: status ? 'showOk' : 'showAlert', context });
    return;
  }
  if (!a.post) return;
  try {
    const r = await fetch(BASE + a.post, { method: 'POST', signal: AbortSignal.timeout(3000) });
    let body = null;
    try { body = await r.json(); } catch { /* not JSON */ }
    const ok = r.ok && !(body && body.ok === false);
    send({ event: ok ? 'showOk' : 'showAlert', context });
  } catch {
    send({ event: 'showAlert', context });
  }
  setTimeout(poll, 250);
  setTimeout(poll, 1200);
}

ws.on('open', () => {
  send({ event: registerEvent, uuid: pluginUUID });
  poll();
  setInterval(poll, POLL_MS);
});

ws.on('message', (raw) => {
  let m;
  try { m = JSON.parse(raw.toString()); } catch { return; }
  const id = m.action && m.action.startsWith(PREFIX) ? m.action.slice(PREFIX.length) : null;
  switch (m.event) {
    case 'willAppear':
      log('willAppear', m.action);
      if (id && ACTIONS[id]) {
        contexts.set(m.context, id);
        paint(m.context, id, true);
      }
      break;
    case 'willDisappear':
      contexts.delete(m.context);
      lastImages.delete(m.context);
      break;
    case 'keyDown':
      if (id) press(m.context, id);
      break;
    case 'deviceDidConnect':
    case 'systemDidWakeUp':
      paintAll(true);
      poll();
      break;
    default:
  }
});

ws.on('close', () => { log('ws closed'); process.exit(0); });
ws.on('error', (e) => log('ws error', e.message));
