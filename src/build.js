const fs = require('fs');
const path = require('path');
const { ACTIONS, ORDER, GLYPHS, C, tile } = require('./icons');
const out = path.join(__dirname, '..', 'out', 'nl.haarie.nullcat.sdPlugin');
const svgDir = path.join(__dirname, '..', 'svgs');
fs.rmSync(path.join(__dirname, '..', 'out'), { recursive: true, force: true });
fs.rmSync(svgDir, { recursive: true, force: true });
for (const d of ['bin', 'images/actions', 'images/states', 'images/category', 'images/store']) fs.mkdirSync(path.join(out, d), { recursive: true });
fs.mkdirSync(svgDir, { recursive: true });

// nice-looking sample rig state for the static fallback images
const sample = {
  masterOp: true, loopRunning: true, estop: false, needsRehome: false, homing: false, parked: false,
  hasBelts: true, beltsSlack: false, telemetryReceiving: true, udpNewHz: 60, loopHz: 2000, maxJitterUs: 40,
  slavesFound: 4, numDrives: 4, initBusy: false,
  drives: ['Front Left', 'Front Right', 'Rear Left', 'Rear Right'].map((n) => ({ name: n, ind: { state: 'ready', text: 'ready', fault: false, cls: 's-ok' } })),
};

const actionsManifest = [];
for (const id of ORDER) {
  const a = ACTIONS[id];
  fs.writeFileSync(path.join(svgDir, `state_${id}.svg`), a.render(sample, true));
  // mono action-list icon
  const g = id.startsWith('drive') ? GLYPHS.car('#fff', a.driveIndex, '#fff')
    : { init: GLYPHS.power, run: GLYPHS.play, home: GLYPHS.home, park: GLYPHS.park, belts: GLYPHS.beltTight, telemetry: GLYPHS.signal, webui: GLYPHS.web, reset: GLYPHS.reset, stats: GLYPHS.gauge, link: (c) => GLYPHS.link(c, true), estop: (c) => GLYPHS.estop(c, false, '#fff') }[id]('#fff');
  fs.writeFileSync(path.join(svgDir, `icon_${id}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="-40 -40 80 80">${g}</svg>`);
  actionsManifest.push({
    Name: a.name,
    UUID: `nl.haarie.nullcat.${id}`,
    Icon: `images/actions/${id}`,
    Tooltip: a.tooltip,
    Controllers: a.renderEncoder ? ['Keypad', 'Encoder'] : ['Keypad'],
    ...(a.renderEncoder ? { Encoder: { layout: '$B1', Icon: `images/actions/${id}`, TriggerDescription: { Push: '', Rotate: '', Touch: '' } } } : {}),
    UserTitleEnabled: false,
    SupportedInMultiActions: !!a.post,
    States: [{ Image: `images/states/${id}`, ShowTitle: false, TitleAlignment: 'bottom' }],
  });
}

const manifest = {
  $schema: 'https://schemas.elgato.com/streamdeck/plugins/manifest.json',
  SDKVersion: 2,
  Author: 'Haarie',
  Name: 'nullCAT',
  Version: '1.1.0.0',
  UUID: 'nl.haarie.nullcat',
  Description: 'Live status tiles and control buttons for the nullCAT EtherCAT motion controller (http://nullcat.local:8080).',
  Category: 'nullCAT',
  CategoryIcon: 'images/category/nullcat',
  Icon: 'images/store/nullcat',
  CodePath: 'bin/plugin.js',
  Nodejs: { Version: '20' },
  OS: [{ Platform: 'windows', MinimumVersion: '10' }],
  Software: { MinimumVersion: '6.4' },
  Actions: actionsManifest,
};
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));

// plugin/category icons
const big = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-60 -60 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16202b"/><stop offset="1" stop-color="#0a0f14"/></linearGradient></defs><rect x="-58" y="-58" width="116" height="116" rx="24" fill="url(#g)" stroke="${C.info}" stroke-width="3" stroke-opacity=".8"/><g transform="scale(1.35)">${GLYPHS.car(C.info, 0, C.ok)}</g></svg>`;
fs.writeFileSync(path.join(svgDir, 'store.svg'), big(256));
fs.writeFileSync(path.join(svgDir, 'category.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="-40 -40 80 80">${GLYPHS.car('#fff', 0, '#fff')}</svg>`);
fs.writeFileSync(path.join(__dirname, '..', 'ids.json'), JSON.stringify({ order: ORDER, names: Object.fromEntries(ORDER.map((i) => [i, ACTIONS[i].name])) }));
console.log('ok', ORDER.length);
