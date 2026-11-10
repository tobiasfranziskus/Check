"""Independent real IndexedDB + touch acceptance of the shipped single HTML."""
import functools, http.server, pathlib, threading, tempfile, json, os
from playwright.sync_api import sync_playwright
repo=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*_): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(repo)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/aphros-void.html'
try:
 with sync_playwright() as p:
  for w,h in [(1180,820),(1024,768),(820,1180),(390,844)]:
   with tempfile.TemporaryDirectory() as profile:
    def launch():
     binary=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')
     return p.chromium.launch_persistent_context(profile,**({'executable_path':binary} if pathlib.Path(binary).exists() else {}),args=['--no-sandbox'],downloads_path=profile+'/downloads',viewport={'width':w,'height':h},is_mobile=True,has_touch=True,accept_downloads=True)
    ctx=launch();page=ctx.pages[0];errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    def ready():page.wait_for_function('!document.body.inert && !!globalThis.W5agStorage')
    def saved():page.wait_for_function("/gesichert/.test(document.querySelector('#storage-status').textContent)")
    def tap(s):page.locator(s).tap()
    def export():
     with page.expect_download() as d:tap('#export')
     return pathlib.Path(d.value.path()).read_text()
    def record():return page.evaluate("""async()=>{const d=await new Promise((res,rej)=>{const r=indexedDB.open(W5agStorage.database,1);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return await new Promise(res=>{const t=d.transaction('saves'),r=t.objectStore('saves').get('world');t.oncomplete=()=>{d.close();res(r.result)}})}""")
    def put(data):page.evaluate("""async data=>{const d=await new Promise(res=>{const r=indexedDB.open(W5agStorage.database,1);r.onsuccess=()=>res(r.result)});await new Promise(res=>{const t=d.transaction('saves','readwrite');t.objectStore('saves').put(data,'world');t.oncomplete=()=>{d.close();res()}})}""",data)
    page.goto(url);ready();saved()
    # Independent legacy sentinel: product code must never open/change this database.
    page.evaluate("""async()=>{await new Promise(res=>{const r=indexedDB.open('aphros-void',1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>{const d=r.result,t=d.transaction('saves','readwrite');t.objectStore('saves').put({rulesVersion:14,data:'unchanged'},'world');t.oncomplete=()=>{d.close();res()}}})}""")
    tap('#buy-miner');saved();tap('#start-mining');saved();tap('[data-step="10"]');saved()
    manual=export();tap('#save');saved();assert record()['slots']['manual']['json']==manual
    tap('[data-step="10"]');saved();latest=export();assert latest!=manual
    ctx.close() # Full browser restart with persisted profile.
    ctx=launch();page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url);ready()
    assert 'wiederhergestellt' in page.locator('#storage-status').inner_text();assert export()==latest
    page.wait_for_timeout(100);assert export()==latest # No offline tick.
    with page.expect_download() as backup:tap('#load')
    assert pathlib.Path(backup.value.path()).read_text()==latest
    saved();assert export()==manual
    # Bad and foreign JSON cannot mutate memory or persistent bytes.
    for bad in [b'{',json.dumps({'schema':8,'rulesVersion':14}).encode()]:
     old=record();page.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':bad})
     page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
     assert export()==manual and record()==old
    with page.expect_download():page.locator('#import').set_input_files({'name':'good.json','mimeType':'application/json','buffer':latest.encode()})
    page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 20')");saved();assert export()==latest
    previous=record()['slots']['previous']['json']
    with page.expect_download():tap('#load-previous')
    saved();assert export()==previous
    with page.expect_download():page.locator('#import').set_input_files({'name':'restore.json','mimeType':'application/json','buffer':latest.encode()})
    page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 20')");saved();assert export()==latest
    # Stale writer loses CAS, even after it restored the same initial snapshot.
    other=ctx.new_page();other.goto(url);other.wait_for_function('!document.body.inert')
    tap('[data-step="1"]');saved();kept=record()
    other.locator('[data-step="1"]').tap();other.wait_for_function("document.querySelector('#storage-status').textContent.includes('Anderer Tab')")
    assert record()==kept;other.close()
    # A synchronous quota failure aborts atomically and does not destroy the old slots.
    page.evaluate("()=>{IDBObjectStore.prototype.put=function(){throw new DOMException('Test quota','QuotaExceededError')}}")
    tap('[data-step="1"]');page.wait_for_function("document.querySelector('#storage-status').textContent.includes('Speicherfehler')")
    assert record()==kept
    page.reload();ready();assert export()==kept['slots']['auto']['json']
    unavailable=ctx.new_page()
    unavailable.add_init_script("Object.defineProperty(globalThis,'indexedDB',{value:{open(){throw new DOMException('Test denied','SecurityError')}}})")
    unavailable.goto(url);unavailable.wait_for_function("!document.body.inert && document.querySelector('#storage-status').textContent.includes('nicht verfügbar')")
    unavailable.locator('[data-step="1"]').tap();assert 'Tick 1' in unavailable.locator('#identity').inner_text()
    unavailable.close();assert record()==kept
    # Bad auto falls back to previous, preserving corrupt bytes and locking writes.
    corrupt=record();fallback=corrupt['slots']['previous']['json'];corrupt['slots']['auto']['json']='{broken';put(corrupt)
    page.reload();ready();assert export()==fallback;assert 'gesperrt' in page.locator('#storage-status').inner_text()
    tap('[data-step="1"]');page.wait_for_function("document.querySelector('#storage-status').textContent.includes('Speicherfehler')");assert record()==corrupt
    # Unknown container version is also never replaced.
    future=record();future['format']=99;put(future);page.reload();ready();tap('[data-step="1"]')
    page.wait_for_function("document.querySelector('#storage-status').textContent.includes('Speicherfehler')");assert record()==future
    assert page.evaluate("""async()=>await new Promise(res=>{const r=indexedDB.open('aphros-void',1);r.onsuccess=()=>{const d=r.result,t=d.transaction('saves'),q=t.objectStore('saves').get('world');t.oncomplete=()=>{d.close();res(q.result)}}})""")=={'rulesVersion':14,'data':'unchanged'}
    for selector in ['#save','#load','#load-previous','#export']:
     assert page.locator(selector).bounding_box()['height']>=48
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert errors==[],errors
    ctx.close();print(f'PASS Storage {w}x{h}: browser restart, manual, import/export, corruption, future, tabs, legacy preservation',flush=True)
finally:server.shutdown();server.server_close()
