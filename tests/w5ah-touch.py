"""Chromium touch smoke only; NOT iPad Safari/NAS proof."""
import functools, http.server, pathlib, threading
from playwright.sync_api import sync_playwright
repo=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*_): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(repo)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--no-sandbox'])
  for w,h in [(1180,820),(1024,768),(820,1180),(390,844)]:
   context=browser.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,accept_downloads=True)
   page=context.new_page()
   errors=[]
   page.on('pageerror',lambda e: errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5ah/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Regel 195')")
   page.evaluate("localStorage.setItem('product-save-sentinel','untouched')")
   assert 'Tick 0' in page.locator('#identity').inner_text()
   def tap(selector): page.locator(selector).tap()
   tap('[data-action=buy-freighter]');tap('[data-action=buy-miner]');tap('[data-action=mine-ice]')
   tap('[data-step="50"]');tap('[data-action=stop-miner]')
   tap('[data-action=ore-freight]');tap('[data-step="120"]')
   tap('[data-action=ice-freight]');tap('[data-step="60"]')
   tap('[data-action=produce-water]');tap('[data-step="20"]')
   assert 'Tick 250' in page.locator('#identity').inner_text()
   tap('[data-action=ore-water]');tap('[data-action=ice-water]');tap('[data-step="40"]')
   assert '36 ISK' in page.locator('#cash-pilot_erz').inner_text()
   assert '64 ISK' in page.locator('#cash-pilot_eis').inner_text()
   tap('[data-action=produce-water]');tap('[data-step="20"]')
   page.locator('#ore-amount').fill('2')
   tap('[data-action=ore-water]');tap('[data-action=ice-water]')
   assert 'Tick 310' in page.locator('#identity').inner_text()
   assert '8 ISK' in page.locator('#cash-pilot_erz').inner_text()
   assert '8 ISK' in page.locator('#cash-pilot_eis').inner_text()
   assert '16 Wasser verbraucht' in page.locator('#production').inner_text()
   assert 'Original-Core-Befehl erfolgreich' in page.locator('#message').inner_text()
   before=page.locator('#identity').inner_text()
   with page.expect_download() as dl:tap('#export')
   snapshot=pathlib.Path(dl.value.path()).read_text()
   assert '"rulesVersion":195' in snapshot
   page.locator('#import').set_input_files({'name':'foreign.json','mimeType':'application/json',
     'buffer':snapshot.replace('"rulesVersion":195','"rulesVersion":194').encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert before==page.locator('#identity').inner_text()
   page.locator('#import').set_input_files({'name':'saved.json','mimeType':'application/json','buffer':snapshot.encode()})
   page.wait_for_function("document.querySelector('#message').textContent.includes('erfolgreich')")
   assert before==page.locator('#identity').inner_text()
   assert page.evaluate("localStorage.getItem('product-save-sentinel')")=='untouched'
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h,'overflow')
   assert not errors,errors
   context.close()
  browser.close()
finally:
 server.shutdown()
