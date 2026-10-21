// Shared icon + state logic for the nullCAT Stream Deck plugin.
// Used at runtime (live SVG keys) and by the build script (static PNG fallbacks).

const C = {
  off: '#6b7785',
  ok: '#22c55e',
  warn: '#f59e0b',
  busy: '#38bdf8',
  bad: '#ef4444',
  info: '#22d3ee',
  dim: '#3b4551',
  white: '#f3f6f9',
};

const GLYPHS = {
  power: (c) =>
    `<path d="M-15 -19 A24 24 0 1 0 15 -19" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
     <path d="M0 -32 V-6" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  play: (c) => `<path d="M-14 -24 L26 0 L-14 24 Z" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`,
  stop: (c) => `<rect x="-20" y="-20" width="40" height="40" rx="7" fill="${c}"/>`,
  home: (c) =>
    `<path d="M-30 2 L0 -26 L30 2" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M-21 -4 V28 H21 V-4" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M-6 28 V12 H6 V28" fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round"/>`,
  park: (c) =>
    `<circle cx="0" cy="0" r="28" fill="none" stroke="${c}" stroke-width="6"/>
     <path d="M-9 16 V-16 H4 a10 10 0 0 1 0 20 H-9" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  beltSlack: (c) =>
    `<path d="M-32 0 C-22 -22 -10 22 0 0 S22 -22 32 0" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  beltTight: (c) =>
    `<path d="M-30 0 H30" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
     <path d="M-20 -11 L-31 0 L-20 11 M20 -11 L31 0 L20 11" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  signal: (c) =>
    [10, 20, 31, 44]
      .map((h, i) => `<rect x="${-30 + i * 17}" y="${26 - h}" width="10" height="${h}" rx="3" fill="${c}"/>`)
      .join(''),
  web: (c) =>
    `<circle cx="0" cy="0" r="28" fill="none" stroke="${c}" stroke-width="5"/>
     <ellipse cx="0" cy="0" rx="12" ry="28" fill="none" stroke="${c}" stroke-width="4"/>
     <path d="M-28 0 H28 M-22 -14 H22 M-22 14 H22" fill="none" stroke="${c}" stroke-width="3.5"/>`,
  reset: (c) =>
    `<path d="M22 -16 A26 26 0 1 0 27 6" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
     <path d="M30 -30 L22 -14 L38 -12 Z" fill="${c}" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`,
  gauge: (c) =>
    `<path d="M-30 16 A30 30 0 0 1 30 16" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
     <path d="M0 16 L16 -10" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
     <circle cx="0" cy="16" r="5" fill="${c}"/>`,
  link: (c, up) =>
    `<circle cx="-24" cy="0" r="9" fill="none" stroke="${c}" stroke-width="5"/>
     <circle cx="24" cy="0" r="9" fill="none" stroke="${c}" stroke-width="5"/>
     <path d="M-15 0 H15" stroke="${c}" stroke-width="5" stroke-linecap="round" ${up ? '' : 'stroke-dasharray="3 9"'}/>`,
  estop: (c, filled, ink) => {
    const pts = Array.from({ length: 8 }, (_, i) => {
      const a = (Math.PI / 8) + (i * Math.PI) / 4;
      return `${(Math.cos(a) * 33).toFixed(1)},${(Math.sin(a) * 33).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="${filled ? c : 'none'}" stroke="${c}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M-13 -13 L13 13 M13 -13 L-13 13" stroke="${filled ? ink : c}" stroke-width="7" stroke-linecap="round"/>`;
  },
  // Top-view car, one wheel highlighted. idx: 0 FL, 1 FR, 2 RL, 3 RR
  car: (c, idx, wheelColor) => {
    const wheels = [
      [-27, -26], [19, -26], [-27, 10], [19, 10],
    ];
    const w = wheels
      .map(([x, y], i) => `<rect x="${x}" y="${y}" width="8" height="16" rx="3" fill="${i === idx ? wheelColor : C.dim}"/>`)
      .join('');
    return `<rect x="-15" y="-32" width="30" height="64" rx="11" fill="none" stroke="${c}" stroke-width="4" opacity=".75"/>
      <path d="M-9 -16 H9 M-9 14 H9" stroke="${c}" stroke-width="3" opacity=".5"/>${w}`;
  },
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// glyphSvg: markup drawn inside a -40..40 box. label: top caption. sub: state text.
function tile({ glyph, label, sub, color, border, led, bg = ['#16202b', '#0c1218'], subSize = 15, dimmed = false }) {
  const op = dimmed ? 0.55 : 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs>
  <rect x="2" y="2" width="140" height="140" rx="20" fill="url(#g)" stroke="${border || color}" stroke-opacity=".7" stroke-width="3"/>
  <g opacity="${op}">
    <g transform="translate(72 56) scale(.95)">${glyph}</g>
    <text x="72" y="112" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="21" letter-spacing="1" fill="${C.white}">${esc(label)}</text>
    <text x="72" y="133" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="600" font-size="${subSize}" letter-spacing=".5" fill="${color}">${esc(sub)}</text>
  </g>
  ${led ? `<circle cx="126" cy="18" r="6" fill="${led}"/>` : ''}
</svg>`;
}

function driveColor(ind) {
  if (!ind) return C.off;
  if (ind.fault) return C.bad;
  const s = `${ind.cls || ''} ${ind.state || ''}`.toLowerCase();
  if (/fault|err|bad|trip|alarm/.test(s)) return C.bad;
  if (/warn|slack|limit/.test(s)) return C.warn;
  if (/busy|home|homing|park|seek|init|wait/.test(s)) return C.busy;
  if (/off|idle|disabled|none/.test(s)) return C.off;
  if (/ok|run|ready|op|on|active|enabled|tension/.test(s)) return C.ok;
  return C.off;
}

function shortName(name, i) {
  const m = { 'front left': 'FL', 'front right': 'FR', 'rear left': 'RL', 'rear right': 'RR' };
  const k = String(name || '').toLowerCase().trim();
  if (m[k]) return m[k];
  const initials = k.split(/\s+/).map((w) => w[0]).join('').toUpperCase();
  return initials || `D${i + 1}`;
}

// Each action: how to render from /api/status (st, null = no link) and what to POST on press.
// phase toggles every poll tick, used for blinking.
const ACTIONS = {
  init: {
    name: 'Init / De-init',
    tooltip: 'Toggle EtherCAT initialisation (masterOp)',
    post: '/api/init-toggle',
    render(st) {
      if (!st) return tile({ glyph: GLYPHS.power(C.dim), label: 'INIT', sub: 'NO LINK', color: C.bad, dimmed: true });
      if (st.initBusy) return tile({ glyph: GLYPHS.power(C.busy), label: 'INIT', sub: 'WORKING…', color: C.busy, led: C.busy });
      if (st.masterOp) return tile({ glyph: GLYPHS.power(C.ok), label: 'INIT', sub: 'ONLINE', color: C.ok, led: C.ok });
      return tile({ glyph: GLYPHS.power(C.off), label: 'INIT', sub: 'OFFLINE', color: C.off });
    },
  },
  run: {
    name: 'Start / Stop loop',
    tooltip: 'Toggle the motion loop (needs init first)',
    post: '/api/run-toggle',
    render(st) {
      if (!st) return tile({ glyph: GLYPHS.play(C.dim), label: 'RUN', sub: 'NO LINK', color: C.bad, dimmed: true });
      if (st.loopRunning) return tile({ glyph: GLYPHS.stop(C.ok), label: 'RUN', sub: 'RUNNING', color: C.ok, led: C.ok });
      if (!st.masterOp) return tile({ glyph: GLYPHS.play(C.dim), label: 'RUN', sub: 'NEEDS INIT', color: C.off, dimmed: true });
      return tile({ glyph: GLYPHS.play(C.off), label: 'RUN', sub: 'STOPPED', color: C.off });
    },
  },
  home: {
    name: 'Home',
    tooltip: 'Home all eligible axes',
    post: '/api/home',
    render(st) {
      if (!st) return tile({ glyph: GLYPHS.home(C.dim), label: 'HOME', sub: 'NO LINK', color: C.bad, dimmed: true });
      if (st.homing) return tile({ glyph: GLYPHS.home(C.busy), label: 'HOME', sub: 'HOMING…', color: C.busy, led: C.busy });
      if (st.needsRehome) return tile({ glyph: GLYPHS.home(C.warn), label: 'HOME', sub: 'NEEDS HOME', color: C.warn, led: C.warn });
      return tile({ glyph: GLYPHS.home(C.ok), label: 'HOME', sub: 'HOMED', color: C.ok, led: C.ok });
    },
  },
  park: {
    name: 'Park / Unpark',
    tooltip: 'Toggle park (all axes)',
    post: '/api/park-toggle',
    render(st) {
      if (!st) return tile({ glyph: GLYPHS.park(C.dim), label: 'PARK', sub: 'NO LINK', color: C.bad, dimmed: true });
      if (st.parked) return tile({ glyph: GLYPHS.park(C.busy), label: 'PARK', sub: 'PARKED', color: C.busy, led: C.busy });
      if (st.loopRunning) return tile({ glyph: GLYPHS.park(C.ok), label: 'PARK', sub: 'ACTIVE', color: C.ok, led: C.ok });
      return tile({ glyph: GLYPHS.park(C.off), label: 'PARK', sub: 'UNPARKED', color: C.off });
    },
  },
  belts: {
    name: 'Belts slack / tension',
    tooltip: 'Toggle belt tension (refused under e-stop)',
    post: '/api/belts-toggle',
    render(st) {
      if (!st) return tile({ glyph: GLYPHS.beltSlack(C.dim), label: 'BELTS', sub: 'NO LINK', color: C.bad, dimmed: true });
      if (!st.hasBelts) return tile({ glyph: GLYPHS.beltSlack(C.dim), label: 'BELTS', sub: 'NONE', color: C.off, dimmed: true });
      if (st.beltsSlack) return tile({ glyph: GLYPHS.beltSlack(C.warn), label: 'BELTS', sub: 'SLACK', color: C.warn, led: C.warn });
      return tile({ glyph: GLYPHS.beltTight(C.ok), label: 'BELTS', sub: 'TENSIONED', color: C.ok, led: C.ok });
    },
  },
  telemetry: {
    name: 'Telemetry',
    tooltip: 'SimHub UDP telemetry status (display only)',
    post: null,
    render(st) {
      if (!st) return tile({ glyph: GLYPHS.signal(C.dim), label: 'SIMHUB', sub: 'NO LINK', color: C.bad, dimmed: true });
      if (st.telemetryReceiving) {
        const hz = st.udpNewHz > 0 ? ` ${Math.round(st.udpNewHz)} Hz` : '';
        return tile({ glyph: GLYPHS.signal(C.ok), label: 'SIMHUB', sub: `LIVE${hz}`, color: C.ok, led: C.ok });
      }
      if (st.loopRunning) return tile({ glyph: GLYPHS.signal(C.warn), label: 'SIMHUB', sub: 'NO DATA', color: C.warn, led: C.warn });
      return tile({ glyph: GLYPHS.signal(C.off), label: 'SIMHUB', sub: 'IDLE', color: C.off });
    },
  },
  webui: {
    name: 'Web UI',
    tooltip: 'Open the nullCAT web UI',
    post: null,
    render() {
      return tile({ glyph: GLYPHS.web(C.info), label: 'WEB UI', sub: 'OPEN', color: C.info });
    },
  },
  reset: {
    name: 'Reset fault',
    tooltip: 'Reset drive faults and clear lockout',
    post: '/api/reset-fault',
    render(st, phase) {
      if (!st) return tile({ glyph: GLYPHS.reset(C.dim), label: 'RESET', sub: 'NO LINK', color: C.bad, dimmed: true });
      const fault = (st.drives || []).some((d) => d.ind && d.ind.fault);
      if (fault) {
        const c = phase ? C.bad : '#fca5a5';
        return tile({ glyph: GLYPHS.reset(c), label: 'RESET', sub: 'FAULT!', color: C.bad, led: c, border: C.bad });
      }
      return tile({ glyph: GLYPHS.reset(C.off), label: 'RESET', sub: 'NO FAULT', color: C.off });
    },
  },
  stats: {
    name: 'Loop stats',
    tooltip: 'Loop rate and jitter (press: reset stats)',
    post: '/api/resetstats',
    render(st) {
      if (!st) return tile({ glyph: GLYPHS.gauge(C.dim), label: 'LOOP', sub: 'NO LINK', color: C.bad, dimmed: true });
      if (!st.loopRunning || !(st.loopHz > 0)) return tile({ glyph: GLYPHS.gauge(C.off), label: 'LOOP', sub: 'IDLE', color: C.off });
      const j = st.maxJitterUs || 0;
      const col = j < 200 ? C.ok : j < 500 ? C.warn : C.bad;
      return tile({
        glyph: GLYPHS.gauge(col), label: `${Math.round(st.loopHz)} Hz`, sub: `${Math.round(j)} µs jitter`, color: col, led: col, subSize: 14,
      });
    },
  },
  link: {
    name: 'Link',
    tooltip: 'Controller connection and EtherCAT slaves',
    post: null,
    render(st) {
      if (!st) return tile({ glyph: GLYPHS.link(C.bad, false), label: 'LINK', sub: 'NO LINK', color: C.bad, border: C.bad, led: C.bad });
      const n = st.slavesFound || 0;
      const total = st.numDrives || 0;
      const col = total > 0 && n >= total ? C.ok : n > 0 ? C.warn : C.off;
      return tile({ glyph: GLYPHS.link(C.ok, true), label: 'LINK', sub: `${n}/${total} DRIVES`, color: col, led: C.ok });
    },
  },
  estop: {
    name: 'E-STOP',
    tooltip: 'Software e-stop (NOT a safety device — keep the hardware e-stop)',
    post: '/api/estop',
    render(st, phase) {
      if (!st) return tile({ glyph: GLYPHS.estop(C.dim, false, '#000'), label: 'E-STOP', sub: 'NO LINK', color: C.bad, dimmed: true });
      if (st.estop) {
        return tile({
          glyph: GLYPHS.estop(C.bad, true, '#fff'), label: 'E-STOP', sub: 'ACTIVE', color: phase ? C.bad : '#fca5a5', border: C.bad,
          bg: phase ? ['#4a0f12', '#2a0709'] : ['#2a0709', '#16090a'],
        });
      }
      return tile({ glyph: GLYPHS.estop(C.bad, false, '#000'), label: 'E-STOP', sub: 'ARMED', color: C.bad, border: C.bad });
    },
  },
};

// Drive tiles 0..3
for (let i = 0; i < 4; i++) {
  ACTIONS[`drive${i}`] = {
    name: `Drive ${i + 1} status`,
    tooltip: `Drive ${i + 1} state (display only)`,
    post: null,
    driveIndex: i,
    render(st) {
      const dv = st && st.drives && st.drives[i];
      const label = shortName(dv && dv.name, i);
      if (!st) return tile({ glyph: GLYPHS.car(C.dim, i, C.dim), label, sub: 'NO LINK', color: C.bad, dimmed: true });
      if (!dv) return tile({ glyph: GLYPHS.car(C.dim, i, C.dim), label, sub: 'N/A', color: C.off, dimmed: true });
      const col = driveColor(dv.ind);
      const text = (dv.ind && (dv.ind.text || dv.ind.state) ? String(dv.ind.text || dv.ind.state) : 'offline').toUpperCase().slice(0, 11);
      return tile({ glyph: GLYPHS.car(col, i, col), label, sub: dv.ind && dv.ind.fault ? 'FAULT' : text, color: col, led: col === C.off ? null : col });
    },
  };
}

const ORDER = ['init', 'run', 'home', 'park', 'belts', 'drive0', 'drive1', 'drive2', 'drive3', 'telemetry', 'webui', 'reset', 'stats', 'link', 'estop'];

// Static preview states for the build step (used for profile PNGs).
const PREVIEW = {
  init: null, run: null, home: null, park: null, belts: null,
};

module.exports = { C, GLYPHS, ACTIONS, ORDER, tile };
