"""W5aa: actual original Rule18 ore->material W4 production, W3 delivery, touch and isolated saves."""
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
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5aa/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Regel 18') && document.querySelector('#identity').textContent.includes('Original-Audit OK')")
   identity=page.locator('#identity').inner_text()
   assert 'Tick 0' in identity and 'Regel 18' in identity
   page.evaluate("localStorage.setItem('w5aa-protected-sentinel','do-not-touch')")
   for name in ['mining','corporation','freight','refinery','hq','station','fleet','ship']:
    page.locator(f'[data-view="{name}"]').tap()
    assert page.locator('#'+name).is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h,name)
    assert page.locator('#identity').inner_text()==identity
   page.locator('[data-view="refinery"]').tap()
   assert page.locator('#refinery-start').is_disabled()
   assert '0' in page.locator('#refinery-stats').inner_text()
   assert 'noch NICHT finanziert' in page.locator('#refinery-demand').inner_text()
   page.locator('[data-view="freight"]').tap()
   assert page.locator('#freight-buy').is_enabled()
   page.locator('#freight-buy').tap()
   assert page.locator('#freight-buy').is_disabled()
   page.locator('[data-step="50"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 50')")
   assert page.locator('#freight-start').is_enabled()
   page.locator('#freight-start').tap()
   page.locator('[data-step="60"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 110')")
   assert 'Rückflug' in page.locator('#freight-status').inner_text()
   page.locator('[data-view="refinery"]').tap()
   assert '50' in page.locator('#refinery-stats').inner_text()
   assert page.locator('#refinery-start').is_enabled()
   assert '20 ISK' in page.locator('#refinery-quote').inner_text()
   before=page.locator('#identity').inner_text()
   page.locator('#refinery-start').tap()
   assert page.locator('#refinery-start').is_disabled()
   assert '20 ISK' in page.locator('#refinery-stats').inner_text(),'actual W4 wage escrow'
   assert '0' in page.locator('#refinery-ledger').inner_text()
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   page.locator('[data-step="20"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 130')")
   assert page.locator('#refinery-start').is_enabled()
   stats=page.locator('#refinery-stats').inner_text()
   assert '5' in stats and '40' in stats
   assert '3.240 ISK' in stats,'20 paid real wages from Nadir'
   assert '20 ISK' in stats,'20 ISK at original labor owner'
   assert '5 Material' in page.locator('#refinery-ledger').inner_text()
   assert 'keinen bezahlten Materialverkauf' in page.locator('#refinery-demand').inner_text()
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   page.locator('[data-step="60"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 190')")
   page.locator('[data-view="freight"]').tap()
   assert '1.370 ISK' in page.locator('#freight-stats').inner_text()
   page.locator('[data-view="refinery"]').tap()
   previous=page.locator('#identity').inner_text()
   with page.expect_download() as download:page.locator('#export').tap()
   save=pathlib.Path(download.value.path()).read_text()
   assert '"rulesVersion":18' in save
   assert '"materialErzeugt":5' in save
   page.locator('#import').set_input_files({'name':'invalid-rule17.json','mimeType':'application/json',
      'buffer':save.replace('"rulesVersion":18','"rulesVersion":17').encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert page.locator('#identity').inner_text()==previous
   fake=save.replace('"materialErzeugt":5','"materialErzeugt":10')
   page.locator('#import').set_input_files({'name':'invalid-material.json','mimeType':'application/json','buffer':fake.encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert page.locator('#identity').inner_text()==previous
   page.locator('#import').set_input_files({'name':'valid-rule18.json','mimeType':'application/json','buffer':save.encode()})
   page.wait_for_function("document.querySelector('#message').textContent.includes('geprüft und ausgeführt')")
   assert page.locator('#identity').inner_text()==previous
   assert errors==[],errors
   page.locator('#refinery').screenshot(path=f'/tmp/w5aa-{w}x{h}.png')
   page.reload()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 0')")
   assert page.evaluate("localStorage.getItem('w5aa-protected-sentinel')")=='do-not-touch'
   ctx.close()
   print(f'PASS W5aa {w}x{h}: actual paid W3 freight, W4 material and 20 ISK wages, no customer, safe import')
  browser.close()
finally:
 server.shutdown();server.server_close()
