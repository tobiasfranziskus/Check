"""W5y: actual original Rule17 freight payments, 2x60 paid flying minutes and touch UI."""
import functools, http.server, pathlib, threading, os
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
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5y/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Regel 17') && document.querySelector('#identity').textContent.includes('Original-Audit OK')")
   identity=page.locator('#identity').inner_text()
   assert 'Tick 0' in identity and 'Regel 17' in identity
   page.evaluate("localStorage.setItem('w5y-protected-sentinel','do-not-touch')")
   for name in ['mining','corporation','freight','hq','station','fleet','ship']:
    page.locator(f'[data-view="{name}"]').tap()
    assert page.locator('#'+name).is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert page.locator('#identity').inner_text()==identity
   page.locator('[data-view="freight"]').tap()
   assert page.locator('#freight-start').is_disabled()
   page.locator('#freight-buy').tap()
   page.wait_for_function("document.querySelector('#freight-status').textContent.includes('Frachter')")
   assert page.locator('#freight-buy').is_disabled()
   assert page.locator('#freight-start').is_disabled()
   page.locator('[data-step="50"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 50')")
   assert page.locator('#freight-start').is_enabled()
   assert '740 ISK' in page.locator('#freight-quote').inner_text()
   assert '120 ISK' in page.locator('#freight-quote').inner_text()
   page.locator('#freight-start').tap()
   assert page.locator('#freight-start').is_disabled()
   assert '740 ISK' in page.locator('#freight-stats').inner_text()
   assert '120 ISK' in page.locator('#freight-stats').inner_text()
   page.locator('[data-step="60"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 110')")
   assert 'Rückflug' in page.locator('#freight-status').inner_text()
   assert '240 ISK' in page.locator('#freight-stats').inner_text()
   page.locator('[data-step="60"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 170')")
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   assert '1.370 ISK' in page.locator('#freight-stats').inner_text()
   assert '240 ISK' in page.locator('#freight-ledger').inner_text()
   assert '120 ISK' in page.locator('#freight-ledger').inner_text()
   before=page.locator('#identity').inner_text()
   with page.expect_download() as download:page.locator('#export').tap()
   save=pathlib.Path(download.value.path()).read_text()
   assert '"rulesVersion":17' in save
   page.locator('#import').set_input_files({'name':'invalid-w2.json','mimeType':'application/json',
      'buffer':save.replace('"rulesVersion":17','"rulesVersion":16').encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert page.locator('#identity').inner_text()==before
   page.locator('#import').set_input_files({'name':'valid-w3.json','mimeType':'application/json','buffer':save.encode()})
   page.wait_for_function("document.querySelector('#message').textContent.includes('geprüft und ausgeführt')")
   assert page.locator('#identity').inner_text()==before
   # The same paid ship completes four more original 60+60 minute round trips.
   for voyage in range(2,6):
    assert page.locator('#freight-start').is_enabled(),f'voyage {voyage} must be genuinely funded'
    page.locator('#freight-start').tap()
    assert page.locator('#freight-start').is_disabled()
    page.locator('[data-step="60"]').tap()
    page.locator('[data-step="60"]').tap()
    page.wait_for_function(f"document.querySelector('#identity').textContent.includes('Tick {50+120*voyage}')")
    assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   assert page.locator('#freight-start').is_disabled(),'sixth shipment must be blocked by Nadir buyer funds'
   assert '300 ISK' in page.locator('#freight-demand-gate').inner_text()
   assert '250 Erz' in page.locator('#freight-demand-gate').inner_text()
   assert 'Kaeufer kann Ware und beide Fluege nicht bezahlen' in page.locator('#freight-demand-gate').inner_text()
   assert '5' in page.locator('#freight-stats').inner_text()
   assert '1.850 ISK' in page.locator('#freight-stats').inner_text()
   assert page.locator('#freight-buy').is_disabled(),'do not duplicate the paid ship'
   assert errors==[],errors
   page.locator('#freight').screenshot(path=f'/tmp/w5y-{w}x{h}.png')
   page.reload()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 0')")
   assert page.evaluate("localStorage.getItem('w5y-protected-sentinel')")=='do-not-touch'
   ctx.close()
   print(f'PASS W5z {w}x{h}: five real W3 voyages, finite 4k Nadir budget, genuine sixth stop, import isolation')
  browser.close()
finally:
 server.shutdown();server.server_close()
