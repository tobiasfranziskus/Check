"""W5x: W2 Rule16 original company investment/solvency and finite demand in a static Chromium touch hub."""
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
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5x/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Original-Audit OK')")
   identity=page.locator('#identity').inner_text()
   assert 'Regel 16' in identity and 'Tick 0' in identity
   assert 'arbeitsbereit' in page.locator('#w2-demand').inner_text()
   assert 'Bestehender Miner noch nicht amortisiert' in page.locator('#w2-investment').inner_text()
   page.evaluate("localStorage.setItem('w5x-safe-slot','preserve')")
   for name in ['mining','corporation','hq','station','fleet','ship']:
    page.locator('[data-view='+name+']').tap()
    assert page.locator('#'+name).is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert page.locator('#identity').inner_text()==identity
   page.locator('[data-view=corporation]').tap()
   for _ in range(2):page.locator('[data-step="60"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 120')")
   assert page.locator('#w2-fleet tbody tr').count() == 2 or page.locator('#w2-fleet tr').count()==3
   assert '19.000 ISK' in page.locator('#w2-company-stats').inner_text()
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   for _ in range(22):page.locator('[data-step="60"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 1440')")
   assert 'absatzstopp' in page.locator('#w2-demand').inner_text()
   assert 'Absatzstopp' in page.locator('#w2-warning').inner_text()
   assert '0 ISK' in page.locator('#w2-company-stats').inner_text()
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   before=page.locator('#identity').inner_text()
   page.locator('[data-view=ship]').tap()
   assert page.locator('#identity').inner_text()==before
   page.reload();page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 0')")
   assert page.locator('#ship-select option').count()==0
   page.locator('#buy-miner').tap()
   page.wait_for_function("document.querySelector('#ship-select').value==='sh002'")
   page.locator('#start-mining').tap()
   for step in [10,1,1,1]:page.locator(f'[data-step="{step}"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 13')")
   assert '74 ISK' in page.locator('#finance').inner_text()
   page.locator('[data-view=ship]').tap()
   assert '13' in page.locator('#ship-data').inner_text()
   page.locator('#rotate').tap();page.locator('#zoom').fill('0.5')
   page.locator('[data-view=corporation]').tap()
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   with page.expect_download() as download:page.locator('#export').tap()
   save=pathlib.Path(download.value.path()).read_text()
   assert '"rulesVersion":16' in save
   before_stop=page.locator('#identity').inner_text()
   page.locator('#stop-mining').tap()
   assert '2.504 ISK' in page.locator('#headline-stats').inner_text()
   after_stop=page.locator('#identity').inner_text()
   assert after_stop!=before_stop
   page.locator('#import').set_input_files({'name':'w1-invalid.json','mimeType':'application/json','buffer':save.replace('"rulesVersion":16','"rulesVersion":15').encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert page.locator('#identity').inner_text()==after_stop
   page.locator('#import').set_input_files({'name':'w2-valid.json','mimeType':'application/json','buffer':save.encode()})
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 13')")
   assert page.locator('#identity').inner_text()==before_stop
   page.reload();page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 0')")
   assert page.evaluate("localStorage.getItem('w5x-safe-slot')")=='preserve'
   assert errors==[],errors
   page.locator('[data-view=corporation]').tap()
   page.locator('#corporation').screenshot(path=f'/tmp/w5x-{w}x{h}.png')
   print(f'PASS W5x {w}x{h}: two paid NPC miners, 20k financed finite consumer, shutdown without restart, W1-compatible UI, 13-tick player ore, JSON isolated')
   ctx.close()
  browser.close()
finally:
 server.shutdown();server.server_close()
