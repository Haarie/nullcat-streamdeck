import json, os, sys
from playwright.sync_api import sync_playwright
S=os.path.dirname(os.path.abspath(__file__))
P=f'{S}/out/nl.haarie.nullcat.sdPlugin/images'
ids=json.load(open(f'{S}/ids.json'))['order']
jobs=[]
def add(svg,dest,size):
    jobs.append((f'{S}/svgs/{svg}.svg',dest,size))
for i in ids:
    add(f'state_{i}',f'{P}/states/{i}@2x.png',144)
    add(f'state_{i}',f'{P}/states/{i}.png',72)
    add(f'icon_{i}',f'{P}/actions/{i}@2x.png',40)
    add(f'icon_{i}',f'{P}/actions/{i}.png',20)
    add(f'state_{i}',f'{S}/profile_png/{i}.png',144)
add('category',f'{P}/category/nullcat@2x.png',56); add('category',f'{P}/category/nullcat.png',28)
add('store',f'{P}/store/nullcat@2x.png',512); add('store',f'{P}/store/nullcat.png',256)
os.makedirs(f'{S}/profile_png',exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium' if os.path.isfile('/opt/pw-browsers/chromium') else None)
    pg=b.new_page(device_scale_factor=1)
    for svg,dest,size in jobs:
        s=open(svg).read()
        pg.set_viewport_size({'width':size,'height':size})
        pg.set_content(f'<html><body style="margin:0;background:transparent"><div style="width:{size}px;height:{size}px">{s.replace("<svg ",f"<svg style=\"width:{size}px;height:{size}px\" ",1)}</div></body></html>')
        pg.screenshot(path=dest,omit_background=True,clip={'x':0,'y':0,'width':size,'height':size})
    b.close()
print(len(jobs),'rendered')
