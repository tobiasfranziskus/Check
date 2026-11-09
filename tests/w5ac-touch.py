"""W5ac Rule191: actual paid original W5 hull, 60 compensated reposition minutes, productive W3 trip and protected saves."""
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
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5ac/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Regel 191') && document.querySelector('#identity').textContent.includes('Original-Audit OK')")
   identity=page.locator('#identity').inner_text()
   assert 'Tick 0' in identity
   page.evaluate("localStorage.setItem('w5ac-product-safe-sentinel','keep-forever')")
   for name in ['mining','corporation','freight','refinery','shipyard','transfer','hq','station','fleet','ship']:
    page.locator(f'[data-view="{name}"]').tap()
    assert page.locator('#'+name).is_visible()
    assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(w,h,name,'viewport overflow')
    assert page.locator('#identity').inner_text()==identity,'navigation must not tick or alter state'
   page.locator('[data-view="transfer"]').tap()
   assert page.locator('#transfer-start').is_disabled(),'no free starting W5 ship'
   assert page.locator('#transfer-freight-start').is_disabled()
   page.locator('[data-view="freight"]').tap()
   page.locator('#freight-buy').tap()
   page.locator('[data-step="50"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 50')")
   page.locator('#freight-start').tap()
   page.locator('[data-step="60"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 110')")
   page.locator('[data-view="refinery"]').tap()
   page.locator('#refinery-start').tap()
   page.locator('[data-step="20"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 130')")
   page.locator('[data-view="shipyard"]').tap()
   page.locator('#yard-build').tap()
   page.locator('[data-step="30"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 160')")
   page.locator('#yard-buy').tap()
   assert 'sh004 / transport / nadir / dock' in page.locator('#yard-demand').inner_text()
   page.locator('[data-view="transfer"]').tap()
   assert page.locator('#transfer-select').input_value()=='sh004'
   assert page.locator('#transfer-start').is_disabled(),'ongoing W3 return blocks transfer'
   assert 'Noch aktive W3-Fracht' in page.locator('#transfer-quote').inner_text()
   assert page.locator('#transfer-freight-start').is_disabled()
   page.locator('[data-step="10"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 170')")
   assert page.locator('#transfer-start').is_enabled(),'full 60 ISK financed after W3 first return'
   assert '60 ISK' in page.locator('#transfer-quote').inner_text()
   page.locator('#transfer-start').tap()
   assert page.locator('#transfer-start').is_disabled(),'ship cannot depart twice'
   assert '60 ISK' in page.locator('#transfer-stats').inner_text()
   assert '560 ISK' in page.locator('#transfer-stats').inner_text()
   assert 'nadir' in page.locator('#transfer-status').inner_text()
   page.locator('[data-step="30"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 200')")
   assert '30 ISK' in page.locator('#transfer-stats').inner_text(),'30 ISK actually paid to pilot mid-flight'
   assert '30' in page.locator('#transfer-status').inner_text()
   mid=page.locator('#identity').inner_text()
   with page.expect_download() as d:page.locator('#export').tap()
   saved=pathlib.Path(d.value.path()).read_text()
   assert '"rulesVersion":191' in saved and '"allocated":60' in saved and '"paid":30' in saved
   page.locator('#import').set_input_files({'name':'old19.json','mimeType':'application/json',
     'buffer':saved.replace('"rulesVersion":191','"rulesVersion":19').encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert page.locator('#identity').inner_text()==mid
   page.locator('#import').set_input_files({'name':'forged-pilot.json','mimeType':'application/json',
     'buffer':saved.replace('"paid":30','"paid":60').encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert page.locator('#identity').inner_text()==mid
   page.locator('#import').set_input_files({'name':'real-rule191.json','mimeType':'application/json','buffer':saved.encode()})
   page.wait_for_function("document.querySelector('#message').textContent.includes('geprüft und ausgeführt')")
   assert page.locator('#identity').inner_text()==mid
   page.locator('[data-step="30"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 230')")
   assert 'sh004 · Eigentümer transport · Ort aldera · Phase dock' in page.locator('#transfer-status').inner_text()
   assert '60 ISK' in page.locator('#transfer-stats').inner_text(),'full paid 60 ISK pilot labor'
   assert '560 ISK' in page.locator('#transfer-stats').inner_text(),'carrier paid 60 preflight, no additional mint'
   assert page.locator('#transfer-start').is_disabled(),'already completed ferry cannot repeat'
   assert page.locator('#transfer-freight-start').is_enabled(),'arrived new built hull is operable for real W3 work'
   page.locator('#transfer-freight-start').tap()
   page.locator('[data-view="freight"]').tap()
   assert 'Hinflug' in page.locator('#freight-status').inner_text()
   page.locator('[data-step="60"]').tap()
   page.locator('[data-step="60"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 350')")
   page.locator('[data-view="transfer"]').tap()
   assert '680 ISK' in page.locator('#transfer-stats').inner_text(),'real W3 fee income after extra 120 pilot labor'
   assert '2' in page.locator('#freight-ledger').inner_text() or '100' in page.locator('#freight-ledger').inner_text()
   assert 'Angekommen / noch aktiv' in page.locator('#transfer-ledger').inner_text()
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   assert errors==[],errors
   page.locator('#transfer').screenshot(path=f'/tmp/w5ac-{w}x{h}.png')
   page.reload()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 0')")
   assert page.evaluate("localStorage.getItem('w5ac-product-safe-sentinel')")=='keep-forever'
   ctx.close()
   print(f'PASS W5ac {w}x{h}: financed W5 hull, 60-minute paid route, midflight Rule191 saves and real second W3 cargo')
  browser.close()
finally:
 server.shutdown();server.server_close()
