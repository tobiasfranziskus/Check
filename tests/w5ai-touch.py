"""W5ai on actual static browser: four Chromium Touch sizes, independent personal wage cycle.
Does not claim Safari/WebKit/NAS acceptance."""
import functools, http.server, pathlib, threading
from playwright.sync_api import sync_playwright
repo=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*_):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(repo)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--no-sandbox'])
  for w,h in [(1180,820),(1024,768),(820,1180),(390,844)]:
   c=browser.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,accept_downloads=True)
   page=c.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5ah/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Regel 195')")
   page.evaluate("localStorage.setItem('product-sentinel-w5ai','keep')")
   tap=lambda name:page.locator(name).tap()
   tap('[data-action=buy-freighter]');tap('[data-action=buy-miner]')
   tap('[data-action=mine-ice]');tap('[data-step="50"]');tap('[data-action=stop-miner]')
   tap('[data-action=ore-freight]');tap('[data-step="120"]')
   tap('[data-action=ice-freight]');tap('[data-step="60"]')
   tap('[data-action=produce-water]');tap('[data-step="20"]')
   tap('[data-action=ore-water]');tap('[data-action=ice-water]');tap('[data-step="40"]')
   tap('[data-action=produce-water]');tap('[data-step="20"]')
   page.locator('#ore-amount').fill('2')
   tap('[data-action=ore-water]');tap('[data-action=ice-water]')
   assert 'Tick 310' in page.locator('#identity').inner_text()
   assert '8 ISK' in page.locator('#cash-pilot_eis').inner_text()
   tap('[data-action=mine-ice]');tap('[data-step="50"]');tap('[data-action=stop-miner]')
   tap('[data-action=sell-ice]')
   assert 'Original-Core-Befehl erfolgreich' in page.locator('#message').inner_text()
   tap('[data-action=ice-freight]');tap('[data-step="60"]')
   assert 'Tick 420' in page.locator('#identity').inner_text()
   assert '68 ISK' in page.locator('#cash-pilot_eis').inner_text()
   tap('[data-action=ice-water]')
   tap('[data-action=produce-water]');tap('[data-step="20"]')
   page.locator('#ice-amount').fill('2');tap('[data-action=ice-water]')
   tap('[data-step="40"]')
   page.locator('#ice-amount').fill('3');tap('[data-action=ice-water]')
   assert 'Tick 480' in page.locator('#identity').inner_text()
   assert '2 ISK' in page.locator('#cash-pilot_eis').inner_text()
   assert '360 wirkliche private Lohnminuten' in page.locator('#paid-minutes').inner_text()
   assert '2 einzelne Eis-Arbeitsverträge' in page.locator('#ice-contracts').inner_text()
   assert '25 Wasser verbraucht' in page.locator('#production').inner_text()
   with page.expect_download() as down:tap('#export')
   saved=pathlib.Path(down.value.path()).read_text()
   prev=page.locator('#identity').inner_text()
   page.locator('#import').set_input_files({'name':'forged.json','mimeType':'application/json',
      'buffer':saved.replace('"rulesVersion":195','"rulesVersion":194').encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert page.locator('#identity').inner_text()==prev
   assert page.evaluate("localStorage.getItem('product-sentinel-w5ai')")=='keep'
   assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(w,h)
   assert not errors,errors
   c.close()
  browser.close()
finally:
 server.shutdown()
