#!/usr/bin/env python3
"""Zip out/nl.haarie.nullcat.sdPlugin into nullCAT.streamDeckPlugin (double-click to install)."""
import os, zipfile
S = os.path.dirname(os.path.abspath(__file__))
os.chdir(f'{S}/out')
with zipfile.ZipFile(f'{S}/nullCAT.streamDeckPlugin', 'w', zipfile.ZIP_DEFLATED) as z:
    for dp, _, fs in os.walk('nl.haarie.nullcat.sdPlugin'):
        for f in fs:
            z.write(os.path.join(dp, f))
print('nullCAT.streamDeckPlugin')
