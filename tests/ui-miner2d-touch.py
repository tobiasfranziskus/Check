"""Core-bound cockpit acceptance in Chromium touch emulation; no real iPad/NAS claim."""
import functools, http.server, pathlib, threading, os, json
from playwright.sync_api import sync_playwright
repo=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*_): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(repo)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  binary=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')
  browser=p.chromium.launch(**({'executable_path':binary} if pathlib.Path(binary).exists() else {}),args=['--no-sandbox'])
  for w,h in [(1180,820),(1024,768),(820,1180),(390,844)]:
   ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,accept_downloads=True)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5ag/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Regel 195')")
   def tap(selector): page.locator(selector).tap()
   def export():
    with page.expect_download() as d: tap('#export')
    return pathlib.Path(d.value.path()).read_text()
   def state(): return json.loads(export())
   tap('[data-view="ship"]')
   assert page.locator('#miner-erz').is_disabled()
   tap('#miner-buy');sid=page.locator('#miner-select').input_value()
   tap('#miner-erz');tap('#miner-step-10')
   data=state();assert data['ships'][sid]['ladung']['erz']==10
   assert 'Erz 10' in page.locator('#miner-cargo').inner_text()
   assert data['stats']['konto']['house']['erloes']==0
   tap('#miner-stop');ore=state();assert ore['ships'][sid]['ladung'].get('erz',0)==0
   assert ore['stats']['konto']['house']['erloes']==100
   tap('#miner-eis');tap('#miner-step-10');saved=export();mid=json.loads(saved)
   assert mid['ships'][sid]['ladung']['eis']==10
   assert page.locator('#miner-erz').is_disabled() # Core rejects mixed cargo.
   # Every alternate view and camera operation must preserve exact serialized state.
   identity=page.locator('#identity').inner_text()
   tap('#rotate');page.locator('#zoom').fill('0.5')
   for name,selector in [('hq','#ship [data-miner-view="hq"]'),('map','[data-view="map"]'),('ship','#map [data-miner-view="ship"]'),('station','#ship [data-miner-view="station"]'),('ship','[data-view="ship"]')]:
    tap(selector)
    assert page.locator('#'+name).is_visible()
    assert page.locator('#identity').inner_text()==identity
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h,name)
   assert export()==saved
   tap('#miner-step-10')
   page.locator('#import').set_input_files({'name':'miner.json','mimeType':'application/json','buffer':saved.encode()})
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 20')")
   assert export()==saved and page.locator('#miner-select').input_value()==sid
   for _ in range(4):tap('#miner-step-10')
   tap('#miner-stop');final=state()
   assert final['w5n']['eisAbgebaut']==50
   assert final['ships'][sid]['ladung']['eis']==50 # No financed buyer: no fake sale.
   assert final['w5n']['mineVerkauft']==0 and final['stats']['konto']['house']['erloes']==100
   assert sum(x['cash'] for x in final['owners'].values())==33000 and final['minted']==0
   # Multiple actual hulls: selection changes cargo display but never world state.
   tap('#miner-buy');allships=state();ids=[k for k,v in allships['ships'].items() if v['owner']=='house']
   second=next(k for k in ids if k!=sid)
   page.locator('#miner-select').select_option(second);assert 'Eis 0' in page.locator('#miner-cargo').inner_text()
   page.locator('#ship-select').select_option(sid);assert page.locator('#miner-select').input_value()==sid
   assert 'Eis 50' in page.locator('#miner-cargo').inner_text()
   for selector in ['#miner-erz','#miner-eis','#miner-stop','#miner-step-1','#miner-step-10','#miner-step-50','#miner-select']:
    box=page.locator(selector).bounding_box();assert box['height']>=48,(w,h,selector,box)
   assert errors==[],errors
   page.locator('#ship').screenshot(path=f'/tmp/ui-miner2d-{w}x{h}.png')
   ctx.close();print(f'PASS Miner2D {w}x{h}: actual ore settlement, unsold ice, shared navigation, Save/Load, selection, touch sizes',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
