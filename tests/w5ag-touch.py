"""Rule195 browser integration: paid W0-W5 and ice/water/private wages in four touch sizes."""
import functools, http.server, pathlib, threading, os, json
from playwright.sync_api import sync_playwright
repo=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*_):pass
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
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Regel 195')",timeout=15000)
   page.evaluate("localStorage.setItem('w5ag-product-sentinel','keep')")
   def tap(sel):page.locator(sel).tap()
   def view(name):tap(f'[data-view="{name}"]')
   def step(n):tap(f'[data-step="{n}"]')
   def export():
    with page.expect_download() as d:tap('#export')
    return pathlib.Path(d.value.path()).read_text()
   identity=page.locator('#identity').inner_text()
   for name in ['mining','corporation','freight','refinery','shipyard','transfer','water','hq','station','fleet','ship']:
    view(name);assert page.locator('#'+name).is_visible()
    assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(w,h,name)
    assert page.locator('#identity').inner_text()==identity
   view('freight');tap('#freight-buy');tap('#buy-miner')
   view('water');tap('#ice-mine');step(50);tap('#stop-mining')
   view('freight');tap('#freight-start');step(60)
   view('refinery');tap('#refinery-start');step(20)
   view('shipyard');tap('#yard-build');step(30);tap('#yard-buy');step(10)
   view('water');tap('#ice-freight');step(60);tap('#water-start');step(20)
   saved=export();data=json.loads(saved)
   assert data['rulesVersion']==195 and data['w5ag']['paid']=={'erz':120,'eis':80}
   assert data['w5']['verkauft']==1 and data['w5n']['wasserProduziert']==10
   mid=page.locator('#identity').inner_text()
   for fake in [dict(data,rulesVersion=194),dict(data,w5ag=None)]:
    page.locator('#import').set_input_files({'name':'fake.json','mimeType':'application/json','buffer':json.dumps(fake).encode()})
    page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
    assert page.locator('#identity').inner_text()==mid
   page.locator('#import').set_input_files({'name':'real.json','mimeType':'application/json','buffer':saved.encode()})
   page.wait_for_function("document.querySelector('#message').textContent.includes('geprüft und ausgeführt')")
   assert page.locator('#identity').inner_text()==mid
   page.locator('#water-amount').fill('6');tap('#water-buy')
   page.locator('#pilot-owner').select_option('pilot_eis');page.locator('#water-amount').fill('4');tap('#water-buy')
   step(30);step(10)
   final=json.loads(export())
   assert final['owners']['pilot_erz']['cash']==36 and final['owners']['pilot_eis']['cash']==64
   assert final['w5n']['wasserVerbraucht']==10 and final['minted']==0
   assert sum(o['cash'] for o in final['owners'].values())==33000
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   assert errors==[],errors
   page.locator('#water').screenshot(path=f'/tmp/w5ag-{w}x{h}.png')
   final=export();page.wait_for_function("document.querySelector('#storage-status').textContent.includes('gesichert')")
   page.reload();page.wait_for_function("!document.body.inert && document.querySelector('#storage-status').textContent.includes('wiederhergestellt')")
   assert export()==final
   assert page.evaluate("localStorage.getItem('w5ag-product-sentinel')")=='keep'
   ctx.close();print(f'PASS W5ag {w}x{h}: W0-W5, two paid pilots, real water, protected midflight JSON',flush=True)
  browser.close()
finally:
 server.shutdown();server.server_close()
