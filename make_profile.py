#!/usr/bin/env python3
"""Generate a 'nullCAT' profile folder for Stream Deck 6.5+/7 (ProfilesV3).

Layouts:
  mk2   Stream Deck MK.2 / classic, 15 keys (5x3)          model 20GAA9901
  plus  Stream Deck +, 8 keys (4x2) + 4 dials (drive states)  model 20GBD9901
  xl    Stream Deck XL, 32 keys (8x4)                      model 20GAT9901

Usage:
  python3 make_profile.py --layout plus --device-uuid "@(1)[4057/132/XXXXXXXX]"

The device UUID is in any existing profile for that device (ProfilesV3/*.sdProfile/manifest.json -> Device.UUID).
Writes ./profile/<UUID>.sdProfile; copy it into %APPDATA%\\Elgato\\StreamDeck\\ProfilesV3 while Stream Deck is closed.
Run `npm run build` first (it writes ids.json). Needs plugin 1.1.0.0+ for the dials.
"""
import argparse, json, os, uuid

LAYOUTS = {
    'mk2': {
        'model': '20GAA9901',
        'keys': {'init': (0, 0), 'run': (1, 0), 'home': (2, 0), 'park': (3, 0), 'belts': (4, 0),
                 'drive0': (0, 1), 'drive1': (1, 1), 'drive2': (2, 1), 'drive3': (3, 1), 'telemetry': (4, 1),
                 'webui': (0, 2), 'reset': (1, 2), 'stats': (2, 2), 'link': (3, 2), 'estop': (4, 2)},
        'dials': {},
    },
    'plus': {
        'model': '20GBD9901',
        'keys': {'init': (0, 0), 'run': (1, 0), 'home': (2, 0), 'park': (3, 0),
                 'telemetry': (0, 1), 'link': (1, 1), 'reset': (2, 1), 'estop': (3, 1)},
        'dials': {'drive0': 0, 'drive1': 1, 'drive2': 2, 'drive3': 3},
    },
    'xl': {
        'model': '20GAT9901',
        'keys': {'init': (0, 0), 'run': (1, 0), 'home': (2, 0), 'park': (3, 0), 'belts': (4, 0),
                 'drive0': (0, 1), 'drive1': (1, 1), 'drive2': (2, 1), 'drive3': (3, 1),
                 'telemetry': (5, 1), 'stats': (6, 1), 'link': (7, 1),
                 'webui': (0, 3), 'reset': (1, 3), 'estop': (7, 3)},
        'dials': {},
    },
}

ap = argparse.ArgumentParser()
ap.add_argument('--layout', choices=LAYOUTS, default='mk2')
ap.add_argument('--device-uuid', required=True)
ap.add_argument('--model', help='override the device model code')
a = ap.parse_args()
L = LAYOUTS[a.layout]

S = os.path.dirname(os.path.abspath(__file__))
names = json.load(open(f'{S}/ids.json'))['names']
PROF, CUR, DEF = (str(uuid.uuid4()).upper() for _ in range(3))
root = f'{S}/profile/{PROF}.sdProfile'
os.makedirs(f'{root}/Profiles/{CUR}/Images')
os.makedirs(f'{root}/Profiles/{DEF}/Images')


def action(i):
    # No 'Image' on purpose: a custom image would override the live icons the plugin draws.
    return {
        'ActionID': str(uuid.uuid4()), 'LinkedTitle': True, 'Name': names[i],
        'Plugin': {'Name': 'nullCAT', 'UUID': 'nl.haarie.nullcat', 'Version': '1.1.0.0'},
        'Resources': None, 'Settings': {}, 'State': 0,
        'States': [{'ShowTitle': False, 'TitleAlignment': 'bottom'}],
        'UUID': f'nl.haarie.nullcat.{i}'}


keys = {f'{c},{r}': action(i) for i, (c, r) in L['keys'].items()}
controllers = [{'Actions': keys, 'Type': 'Keypad'}]
if L['dials']:
    controllers.append({'Actions': {f'{d},0': action(i) for i, d in L['dials'].items()}, 'Type': 'Encoder'})

dump = lambda o, p: json.dump(o, open(p, 'w'), separators=(',', ':'))
dump({'Controllers': controllers, 'Icon': '', 'Name': ''}, f'{root}/Profiles/{CUR}/manifest.json')
empty = [{'Actions': None, 'Type': 'Keypad'}] + ([{'Actions': None, 'Type': 'Encoder'}] if L['dials'] else [])
dump({'Controllers': empty, 'Icon': '', 'Name': ''}, f'{root}/Profiles/{DEF}/manifest.json')
dump({'Device': {'Model': a.model or L['model'], 'UUID': a.device_uuid}, 'Name': 'nullCAT',
      'Pages': {'Current': CUR.lower(), 'Default': DEF.lower(), 'Pages': [CUR.lower()]}, 'Version': '3.0'}, f'{root}/manifest.json')
print(root)
