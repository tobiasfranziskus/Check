"""Development-only HTTP/Chromium tests; no runtime dependencies for the product."""
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
   context=browser.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,accept_downloads=True)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5u/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Audit OK')||document.querySelector('#identity').textContent.includes('audit OK')")
   initial=page.locator('#identity').inner_text()
   page.evaluate("localStorage.setItem('aphros-w5u-test-sentinel','preserve')")
   page.locator('#selection').select_option('sh002')
   page.locator('#hq [data-tab=fleet]').tap()
   assert page.locator('#hq [data-ship="1"]').get_attribute('aria-pressed')=='true'
   page.locator('#hq [data-ship="0"]').tap();assert page.locator('#selection').input_value()=='sh001'
   page.locator('[data-view=ship]').tap();assert 'miner' in page.locator('#ship-title').inner_text()
   page.locator('#selection').select_option('sh002')
   for route in ['fleet','station','yard','ship','hq','ship']:
    page.locator('[data-view='+route+']').tap()
    assert page.locator('#'+route).is_visible()
    assert page.locator('#selection').input_value()=='sh002'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   canvas_before=page.locator('canvas').evaluate('(c)=>c.toDataURL()')
   page.locator('#rotate').tap();assert page.locator('canvas').evaluate('(c)=>c.toDataURL()')!=canvas_before
   page.locator('#zoom').fill('0.5');page.set_viewport_size({'width':h,'height':w})
   assert page.locator('#identity').inner_text()==initial
   assert 'sh002' in page.locator('#ship-title').inner_text()
   page.locator('#rename input').fill('<img src=x onerror=x>');page.locator('#rename button').tap()
   assert page.locator('img').count()==0
   assert '<img src=x onerror=x>' in page.locator('#selection').inner_text()
   with page.expect_download() as info:page.locator('#export').tap()
   downloaded=info.value;file=downloaded.path();saved=pathlib.Path(file).read_text()
   before=page.locator('#identity').inner_text()
   for payload in [b'{',saved.replace('"rulesVersion":14','"rulesVersion":32').encode(),saved.replace('"cash":3000','"cash":3001').encode()]:
    page.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':payload})
    page.wait_for_function("document.querySelector('#status').textContent.startsWith('Nicht übernommen:')")
    assert page.locator('#identity').inner_text()==before
   page.locator('[data-step="1"]').tap();assert page.locator('#identity').inner_text()!=before
   page.locator('#import').set_input_files({'name':'good.json','mimeType':'application/json','buffer':saved.encode()})
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 0')")
   assert page.locator('#identity').inner_text()==before
   page.reload();page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 0')")
   assert page.locator('#identity').inner_text()==initial
   assert page.evaluate("localStorage.getItem('aphros-w5u-test-sentinel')")=='preserve'
   assert errors==[],errors
   page.locator('[data-view=ship]').tap();page.locator('#ship').screenshot(path=f'/tmp/w5u-{w}x{h}.png')
   print(f'PASS W5u {w}x{h}: routes, own selection, 2D rotation/zoom, unchanged tick/hash, safe text, export/import/reject, step, reload, storage')
   context.close()
  browser.close()
finally:server.shutdown();server.server_close()
