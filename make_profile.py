#!/usr/bin/env python3
"""Generate a 15-key (Stream Deck MK.2) 'nullCAT' profile folder for Stream Deck 6.5+/7 (ProfilesV3).

Usage: python3 make_profile.py --device-uuid "@(1)[4057/96/XXXXXXXX]" [--model 20GAA9901]
Find your device UUID in any existing MK.2 profile's manifest.json (ProfilesV3/*.sdProfile/manifest.json).
Writes ./profile/<UUID>.sdProfile; copy it into %APPDATA%\\Elgato\\StreamDeck\\ProfilesV3 while Stream Deck is closed.
Run `npm run build` first (it writes ids.json).
"""
import argparse, json, os, random, shutil, string, uuid

ap = argparse.ArgumentParser()
ap.add_argument('--device-uuid', required=True)
ap.add_argument('--model', default='20GAA9901')
a = ap.parse_args()

S = os.path.dirname(os.path.abspath(__file__))
ids = json.load(open(f'{S}/ids.json'))
order, names = ids['order'], ids['names']
POS = {'init': (0, 0), 'run': (1, 0), 'home': (2, 0), 'park': (3, 0), 'belts': (4, 0),
       'drive0': (0, 1), 'drive1': (1, 1), 'drive2': (2, 1), 'drive3': (3, 1), 'telemetry': (4, 1),
       'webui': (0, 2), 'reset': (1, 2), 'stats': (2, 2), 'link': (3, 2), 'estop': (4, 2)}
PROF, CUR, DEF = (str(uuid.uuid4()).upper() for _ in range(3))
root = f'{S}/profile/{PROF}.sdProfile'
os.makedirs(f'{root}/Profiles/{CUR}/Images')
os.makedirs(f'{root}/Profiles/{DEF}/Images')
actions = {}
for i in order:
    c, r = POS[i]
    actions[f'{c},{r}'] = {
        'ActionID': str(uuid.uuid4()), 'LinkedTitle': True, 'Name': names[i],
        'Plugin': {'Name': 'nullCAT', 'UUID': 'nl.haarie.nullcat', 'Version': '1.0.0.0'},
        'Resources': None, 'Settings': {}, 'State': 0,
        # No 'Image' here on purpose: a custom image in the profile would override the live icons the plugin draws.
        'States': [{'ShowTitle': False, 'TitleAlignment': 'bottom'}],
        'UUID': f'nl.haarie.nullcat.{i}'}
dump = lambda o, p: json.dump(o, open(p, 'w'), separators=(',', ':'))
dump({'Controllers': [{'Actions': actions, 'Type': 'Keypad'}], 'Icon': '', 'Name': ''}, f'{root}/Profiles/{CUR}/manifest.json')
dump({'Controllers': [{'Actions': None, 'Type': 'Keypad'}], 'Icon': '', 'Name': ''}, f'{root}/Profiles/{DEF}/manifest.json')
dump({'Device': {'Model': a.model, 'UUID': a.device_uuid}, 'Name': 'nullCAT',
      'Pages': {'Current': CUR.lower(), 'Default': DEF.lower(), 'Pages': [CUR.lower()]}, 'Version': '3.0'}, f'{root}/manifest.json')
print(root)
