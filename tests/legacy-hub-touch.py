"""Dev-only: installed Python Playwright + Chromium; no runtime dependency.
Run: python3 tests/legacy-hub-touch.py. Serves repository on loopback only.
"""
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
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/legacy-hub/')
   page.locator('.legacy-corporation h1').wait_for()
   page.evaluate('window.before=JSON.stringify(LegacyHub.snapshots)')
   assert page.evaluate('Object.isFrozen(LegacyHub.snapshots.fitting.module[0])')
   for view in ['corporation','station','fitting','pilot','scanner']:
    button=page.locator('#hub-nav [data-view="'+view+'"]');button.tap()
    assert button.get_attribute('aria-current')=='page'
    box=button.bounding_box();assert box['height']>=48
    host=page.locator('.hub-view[data-view="'+view+'"]');assert host.is_visible()
    assert page.locator('.hub-view:visible').count()==1
    assert host.locator('h1,h2').count()>0
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    # Exercise every internal route and selection, with touch and focus preservation.
    if view in ['corporation','station']:
     tabs=host.locator('nav [data-tab]')
     for i in range(tabs.count()):
      tab=tabs.nth(i);tab.tap();assert tab.get_attribute('aria-pressed')=='true'
      assert tab.evaluate('(b)=>b.getRootNode().activeElement===b')
     host.locator('[data-tab="'+('fleet' if view=='corporation' else 'hangar')+'"]').first.tap()
     host.locator('[data-ship="1"]').tap()
    elif view=='fitting':
     host.locator('[data-platz="platz-radar"]').tap();host.locator('[data-modul="radar-S-MK2"]').tap()
     assert 'hypothetisch' in host.locator('#vergleich').inner_text().lower()
    elif view=='pilot':
     host.locator('select').select_option('3');host.locator('[data-skill]').last.tap()
    else:
     host.locator('button[data-id]').first.tap()
    # Scroll the actual overflow container and revisit without remounting.
    scroll=host.locator('.content').first if view in ['corporation','station'] else host
    scroll.evaluate('(e)=>e.scrollTop=e.scrollHeight');old=scroll.evaluate('(e)=>e.scrollTop')
    page.locator('#hub-nav [data-view="'+('fitting' if view=='corporation' else 'corporation')+'"]').tap()
    button.tap();assert scroll.evaluate('(e)=>e.scrollTop')==old
    page.set_viewport_size({'width':h,'height':w});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.set_viewport_size({'width':w,'height':h})
   # Station connections must use the host route and put keyboard focus there.
   page.locator('#hub-nav [data-view="station"]').tap()
   page.locator('.legacy-station [data-tab="connections"]').first.tap()
   page.locator('[data-hub="fitting"]').tap()
   assert page.evaluate('legacyHub.getCurrent()')=='fitting'
   assert page.locator('#hub-nav [data-view="fitting"]').evaluate('(b)=>document.activeElement===b')
   page.keyboard.press('Tab');assert page.evaluate('document.activeElement!==document.body')
   assert page.evaluate('JSON.stringify(LegacyHub.snapshots)===before')
   # Fitting adapter: hostile text, frozen input, update and idempotent disposal.
   page.evaluate('''() => {
    const host=document.createElement('div');document.body.append(host);
    const s=JSON.parse(JSON.stringify(LegacyHub.snapshots.fitting));s.schiff.name='<img src=x onerror=alert(1)>';
    const api=LegacyHub.fittingMount(host,s);api.update(s);
    if(host.querySelector('img')||!host.textContent.includes('<img'))throw Error('unsafe output');
    api.destroy();api.destroy();api.update(s);if(host.childNodes.length)throw Error('destroy');host.remove();
   }''')
   page.screenshot(path=f'/tmp/legacy-hub-{w}x{h}.png')
   page.evaluate('legacyHub.destroy();legacyHub.destroy()');assert page.locator('.hub-view').count()==0
   assert errors==[],errors
   print(f'PASS hub touch {w}x{h}: navigation, tabs, focus, scroll, rotation, frozen snapshots, safe text, lifecycle',flush=True)
   context.close()
  browser.close()
finally: server.shutdown();server.server_close()
