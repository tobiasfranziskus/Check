"""W5w isolated Rule-15 W1 economy hub, static HTTP + Chromium touch checks."""
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
  for width,height in [(1180,820),(1024,768),(820,1180),(390,844)]:
   context=browser.new_context(viewport={'width':width,'height':height},has_touch=True,is_mobile=True,accept_downloads=True)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5w/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Original-Audit OK')")
   before=page.locator('#identity').inner_text()
   assert 'Regel 15' in before and 'Tick 0' in before
   page.evaluate("localStorage.setItem('w5w-sentinel','preserve')")
   assert page.locator('#ship-select option').count()==0
   assert '600 ISK' in page.locator('#buy-preview').inner_text()
   assert '3.000 ISK' in page.locator('#buy-preview').inner_text()
   assert page.locator('#identity').inner_text()==before
   for view in ['hq','station','fleet','ship','mining']:
    page.locator('[data-view='+view+']').tap()
    assert page.locator('#'+view).is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert page.locator('#identity').inner_text()==before
   page.locator('#buy-miner').tap()
   page.wait_for_function("document.querySelector('#ship-select').value==='sh002'")
   assert 'Audit OK' in page.locator('#identity').inner_text()
   assert '2.400 ISK' in page.locator('#headline-stats').inner_text()
   page.locator('#start-mining').tap()
   for n in [10,1,1,1]:page.locator(f'[data-step="{n}"]').tap()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 13')")
   assert '13' in page.locator('#goods').inner_text()
   assert '1.000 ISK' in page.locator('#contracts').inner_text()
   assert '74 ISK' in page.locator('#finance').inner_text()
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   page.locator('[data-view=ship]').tap()
   assert '13' in page.locator('#ship-data').inner_text()
   canvas_before=page.locator('canvas').evaluate('(c)=>c.toDataURL()')
   page.locator('#rotate').tap()
   assert page.locator('canvas').evaluate('(c)=>c.toDataURL()')!=canvas_before
   page.locator('#zoom').fill('0.5')
   page.locator('[data-view=mining]').tap()
   before_stop=page.locator('#identity').inner_text()
   with page.expect_download() as inf:page.locator('#export').tap()
   saved=pathlib.Path(inf.value.path()).read_text()
   assert '"rulesVersion":15' in saved
   page.locator('#stop-mining').tap()
   assert '2.504 ISK' in page.locator('#headline-stats').inner_text()
   assert '370 ISK' in page.locator('#headline-stats').inner_text()
   assert '130 ISK' in page.locator('#finance').inner_text()
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   after_stop=page.locator('#identity').inner_text()
   assert before_stop!=after_stop
   page.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':saved.replace('"rulesVersion":15','"rulesVersion":14').encode()})
   page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
   assert page.locator('#identity').inner_text()==after_stop
   page.locator('#import').set_input_files({'name':'good.json','mimeType':'application/json','buffer':saved.encode()})
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 13')")
   assert page.locator('#identity').inner_text()==before_stop
   assert 'Original-Audit OK' in page.locator('#identity').inner_text()
   page.reload()
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 0')")
   assert page.locator('#ship-select option').count()==0
   assert page.evaluate("localStorage.getItem('w5w-sentinel')")=='preserve'
   assert errors==[],errors
   page.locator('[data-view=ship]').tap()
   page.locator('#ship').screenshot(path=f'/tmp/w5w-{width}x{height}.png')
   print(f'PASS W5w {width}x{height}: funded miner, W0 reservation, 13-tick settlement, 2D, same HQ/station, JSON isolation, reload')
   context.close()
  browser.close()
finally:
 server.shutdown();server.server_close()
