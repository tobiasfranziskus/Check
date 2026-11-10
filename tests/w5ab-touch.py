"""W5ab: original Rule19 genuine material purchase, paid ship construction and separate carrier hull sale, four touch viewports."""
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
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5ab/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Regel 19') && document.querySelector('#identity').textContent.includes('Original-Audit OK')")
   identity=page.locator('#identity').inner_text()
   assert 'Tick 0' in identity and 'Regel 19' in identity
   page.evaluate("localStorage.setItem('w5ab-protected-sentinel','do-not-touch')")
   for name in ['mining','corporation','freight','refinery','shipyard','hq','station','fleet','ship']:
    page.locator(f'[data-view="{name}"]').tap()
    assert page.locator('#'+name).is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h,name)
    assert page.locator('#identity').inner_text()==identity,'navigation must not tick'
   page.locator('[data-view="shipyard"]').tap()
   assert page.locator('#yard-build').is_disabled(),'no initial free W4 material'
   assert page.locator('#yard-buy').is_disabled(),'no initial free W5 hull'
   assert '0' in page.locator('#yard-stats').inner_text()
   page.locator('[data-view="freight"]').tap()
   page.locator('#freight-buy').tap()
   page.locator('[data-step="50"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 50')")
   assert page.locator('#freight-start').is_enabled()
   page.locator('#freight-start').tap()
   page.locator('[data-step="60"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 110')")
   page.locator('[data-view="refinery"]').tap()
   assert page.locator('#refinery-start').is_enabled()
   page.locator('#refinery-start').tap()
   assert '20 ISK' in page.locator('#refinery-stats').inner_text()
   page.locator('[data-step="20"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 130')")
   assert '5 Material' in page.locator('#refinery-ledger').inner_text()
   page.locator('[data-view="shipyard"]').tap()
   assert page.locator('#yard-build').is_enabled()
   assert '500 ISK' in page.locator('#yard-build-quote').inner_text()
   assert '30 ISK' in page.locator('#yard-build-quote').inner_text()
   assert page.locator('#yard-buy').is_disabled(),'buyer cannot purchase a not-yet-built ship'
   page.locator('#yard-build').tap()
   assert page.locator('#yard-build').is_disabled(),'no double construction order'
   assert '30 ISK' in page.locator('#yard-stats').inner_text(),'30 ISK genuinely in shipyard wage escrow'
   assert '3.740 ISK' in page.locator('#yard-stats').inner_text(),'Nadir received real material sales payment'
   page.locator('[data-step="30"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 160')")
   assert page.locator('#yard-buy').is_enabled(),'original finished physical hull sale quote'
   assert '750 ISK' in page.locator('#yard-sale-quote').inner_text()
   assert '30 ISK' in page.locator('#yard-stats').inner_text(),'30 shipyard wages paid'
   page.locator('#yard-buy').tap()
   assert page.locator('#yard-buy').is_disabled(),'physical hull can only be sold once'
   assert 'sh004 / transport / nadir / dock' in page.locator('#yard-demand').inner_text(),'no free delivery from Nadir to Aldera'
   assert '500 ISK' in page.locator('#yard-demand').inner_text(),'real W5 material receipt'
   page.locator('[data-view="refinery"]').tap()
   assert '500 ISK' in page.locator('#refinery-demand').inner_text()
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   before=page.locator('#identity').inner_text()
   with page.expect_download() as d:page.locator('#export').tap()
   data=pathlib.Path(d.value.path()).read_text()
   assert '"rulesVersion":19' in data and '"materialUmsatz":500' in data and '"schiffIds":["sh004"]' in data
   page.locator('#import').set_input_files({'name':'invalid-w4.json','mimeType':'application/json',
    'buffer':data.replace('"rulesVersion":19','"rulesVersion":18').encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert page.locator('#identity').inner_text()==before
   page.locator('#import').set_input_files({'name':'forged-material-payment.json','mimeType':'application/json',
    'buffer':data.replace('"materialUmsatz":500','"materialUmsatz":1000').encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert page.locator('#identity').inner_text()==before
   page.locator('#import').set_input_files({'name':'real-w5.json','mimeType':'application/json','buffer':data.encode()})
   page.wait_for_function("document.querySelector('#message').textContent.includes('geprüft und ausgeführt')")
   assert page.locator('#identity').inner_text()==before
   # Real second order: one physical new hull is built, but 740 own ISK cannot buy it for 750.
   page.locator('[data-step="10"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 170')")
   page.locator('[data-view="freight"]').tap()
   assert page.locator('#freight-start').is_enabled()
   page.locator('#freight-start').tap()
   page.locator('[data-step="60"]').tap()
   page.locator('[data-step="60"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 290')")
   page.locator('[data-view="refinery"]').tap()
   assert page.locator('#refinery-start').is_enabled()
   page.locator('#refinery-start').tap()
   page.locator('[data-step="20"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 310')")
   page.locator('[data-view="shipyard"]').tap()
   assert page.locator('#yard-build').is_enabled()
   page.locator('#yard-build').tap()
   page.locator('[data-step="30"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 340')")
   assert page.locator('#yard-buy').is_disabled(),'second real hull not sold without full 750 ISK'
   assert '740 ISK' in page.locator('#yard-stats').inner_text(),'carrier truly has 740 ISK'
   assert 'nicht bezahlen' in page.locator('#yard-sale-quote').inner_text()
   assert 'noch unverkauft: 1' in page.locator('#yard-demand').inner_text()
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   assert errors==[],errors
   page.locator('#shipyard').screenshot(path=f'/tmp/w5ab-{w}x{h}.png')
   page.reload()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 0')")
   assert page.evaluate("localStorage.getItem('w5ab-protected-sentinel')")=='do-not-touch'
   ctx.close()
   print(f'PASS W5ab {w}x{h}: paid W0-W5 hull, 500 materials, 30 wages, 750 sale, blocked second 740 buyer, safe Rule19 saves')
  browser.close()
finally:
 server.shutdown();server.server_close()
