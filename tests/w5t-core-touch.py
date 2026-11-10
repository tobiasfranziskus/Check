"""Development-only Chromium touch regression for explicit read-only Core import."""
import functools, http.server, pathlib, threading
from playwright.sync_api import sync_playwright
repo=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*_): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(repo)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h in [(1180,820),(1024,768),(820,1180),(390,844)]:
   context=browser.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/legacy-hub/core-preview.html')
   assert page.locator('.hub-view').count()==0
   page.locator('#core-file').set_input_files(str(repo/'tests/fixtures/w5t/r32-seed42.json'))
   page.locator('#core-input button').tap()
   page.locator('.legacy-corporation h1').wait_for()
   assert 'transport' in page.locator('.legacy-corporation h1').inner_text()
   assert 'ISK-Kontostand' in page.locator('.legacy-corporation').inner_text()
   for view in ['corporation','station','fitting','pilot','scanner']:
    page.locator('#hub-nav [data-view="'+view+'"]').tap()
    host=page.locator('.hub-view[data-view="'+view+'"]');assert host.is_visible()
    assert page.locator('.hub-view:visible').count()==1
    if view in ['corporation','station']:
     tabs=host.locator('nav [data-tab]')
     for i in range(tabs.count()):
      tabs.nth(i).tap();assert tabs.nth(i).get_attribute('aria-pressed')=='true'
     host.locator('[data-tab="'+('fleet' if view=='corporation' else 'hangar')+'"]').first.tap()
     assert 'sh002' in host.locator('.legacy-corporation' if view=='corporation' else '.legacy-station').inner_text()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.locator('#core-owner').fill('fake');page.locator('#core-input button').tap()
   page.wait_for_function("document.getElementById('core-status').textContent.includes('Nicht geladen')")
   assert page.evaluate('coreHub.getCurrent()')=='scanner'
   page.locator('#core-owner').fill('npc3');page.locator('#core-input button').tap()
   page.wait_for_function("document.getElementById('core-status').textContent.includes('Eigentümer npc3')")
   page.locator('#hub-nav [data-view="corporation"]').tap()
   assert page.locator('.legacy-corporation h1').inner_text()=='npc3'
   assert 'sh001' in page.locator('.legacy-corporation').inner_text()
   page.set_viewport_size({'width':h,'height':w});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.evaluate('coreHub.destroy();coreHub.destroy()');assert page.locator('.hub-view').count()==0
   assert errors==[],errors
   print(f'PASS W5t {w}x{h}: import, tabs, five routes, ownership update, rejected ID, rotation, destroy',flush=True)
   context.close()
  browser.close()
finally:server.shutdown();server.server_close()
