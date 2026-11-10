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
    ctx=launch();page=ctx.pages[0];errors=[];console=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.type+': '+m.text))
    def ready():page.wait_for_function('!document.body.inert && !!globalThis.W5agStorage')
    def saved(revision,json=None):
     page.wait_for_function("""async expected=>{
      const d=await new Promise((res,rej)=>{const r=indexedDB.open(W5agStorage.database,1);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
      const value=await new Promise((res,rej)=>{const t=d.transaction('saves'),r=t.objectStore('saves').get('world');t.oncomplete=()=>{d.close();res(r.result)};t.onabort=()=>rej(t.error)});
      return value?.revision===expected.revision && (expected.json===null || value.slots.auto.json===expected.json);
     }""",arg={'revision':revision,'json':json})
    def action(selector):
     revision=record()['revision'];tap(selector);saved(revision+1)
    def load(selector,json):
     revision=record()['revision'];before=export()
     with page.expect_download() as d:tap(selector)
     assert pathlib.Path(d.value.path()).read_text()==before
     saved(revision+1,json);assert export()==json
    def import_json(name,json):
     revision=record()['revision'];before=export()
     with page.expect_download() as d:
      page.locator('#import').set_input_files({'name':name,'mimeType':'application/json','buffer':json.encode()})
     assert pathlib.Path(d.value.path()).read_text()==before
     saved(revision+1,json);assert export()==json
     page.wait_for_function("document.querySelector('#import').value===''")
    def tap(s):page.locator(s).tap()
    def export():
     with page.expect_download() as d:tap('#export')
     return pathlib.Path(d.value.path()).read_text()
    def record():return page.evaluate("""async()=>{const d=await new Promise((res,rej)=>{const r=indexedDB.open(W5agStorage.database,1);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return await new Promise(res=>{const t=d.transaction('saves'),r=t.objectStore('saves').get('world');t.oncomplete=()=>{d.close();res(r.result)}})}""")
    def put(data):page.evaluate("""async data=>{const d=await new Promise(res=>{const r=indexedDB.open(W5agStorage.database,1);r.onsuccess=()=>res(r.result)});await new Promise(res=>{const t=d.transaction('saves','readwrite');t.objectStore('saves').put(data,'world');t.oncomplete=()=>{d.close();res()}})}""",data)
    page.goto(url);ready();saved(1)
    # Independent legacy sentinel: product code must never open/change this database.
    page.evaluate("""async()=>{await new Promise(res=>{const r=indexedDB.open('aphros-void',1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>{const d=r.result,t=d.transaction('saves','readwrite');t.objectStore('saves').put({rulesVersion:14,data:'unchanged'},'world');t.oncomplete=()=>{d.close();res()}}})}""")
    action('#buy-miner');action('#start-mining');action('[data-step="10"]')
    manual=export();action('#save');assert record()['slots']['manual']['json']==manual
    action('[data-step="10"]');latest=export();assert latest!=manual
    ctx.close() # Full browser restart with persisted profile.
    ctx=launch();page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.type+': '+m.text));page.goto(url);ready()
    assert 'wiederhergestellt' in page.locator('#storage-status').inner_text();assert export()==latest
    page.wait_for_timeout(100);assert export()==latest # No offline tick.
    load('#load',manual)
    # Bad and foreign JSON cannot mutate memory or persistent bytes.
    for bad in [b'{',json.dumps({'schema':8,'rulesVersion':14}).encode()]:
     old=record();page.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':bad})
     page.wait_for_function("document.querySelector('#import').value==='' && document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
     assert export()==manual and record()==old
    import_json('good.json',latest)
    previous=record()['slots']['previous']['json']
    load('#load-previous',previous)
    import_json('restore.json',latest)
    # Dispatch overlapping load/import in one browser task: both must finish in order.
    downloads=[]
    listener=lambda d:downloads.append(d)
    page.on('download',listener)
    revision=record()['revision'];previous=record()['slots']['previous']['json']
    page.evaluate("""json=>{
     document.querySelector('#load-previous').click();
     const input=document.querySelector('#import'),transfer=new DataTransfer();
     transfer.items.add(new File([json],'overlap.json',{type:'application/json'}));
     input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
    }""",latest)
    saved(revision+2,latest)
    page.wait_for_function("document.querySelector('#import').value===''")
    assert len(downloads)==2
    assert [pathlib.Path(d.path()).read_text() for d in downloads]==[latest,previous]
    page.remove_listener('download',listener)
    # A real gameplay action while File.text is pending must report the conflict.
    page.evaluate("""()=>{
     const original=File.prototype.text;
     File.prototype.text=async function(){
      if(this.name==='delayed.json'){
       globalThis.readStarted=true;
       await new Promise(resolve=>globalThis.releaseRead=resolve);
      }
      return original.call(this);
     };
    }""")
    page.locator('#import').set_input_files({'name':'delayed.json','mimeType':'application/json','buffer':manual.encode()})
    page.wait_for_function('globalThis.readStarted===true')
    action('[data-step="1"]');afterConflict=record();beforeConflict=export()
    page.evaluate('globalThis.releaseRead()')
    page.wait_for_function("document.querySelector('#import').value==='' && document.querySelector('#message').textContent.includes('Konflikt:')")
    assert record()==afterConflict and export()==beforeConflict
    assert any('Konflikt:' in line for line in console)
    import_json('after-conflict.json',latest)
    # Stale writer loses CAS, even after it restored the same initial snapshot.
    other=ctx.new_page();other.goto(url);other.wait_for_function('!document.body.inert')
    action('[data-step="1"]');kept=record()
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
except Exception:
 print('STORAGE FAILURE',json.dumps({'size':[w,h],'console':console,'pageerrors':errors}),flush=True)
 try:
  print('STATE',page.evaluate("({identity:document.querySelector('#identity').textContent,message:document.querySelector('#message').textContent,storage:document.querySelector('#storage-status').textContent,input:document.querySelector('#import').value})"),flush=True)
  print('PERSISTED',record(),flush=True)
 except Exception as diagnostic: print('DIAGNOSTIC ERROR',str(diagnostic),flush=True)
 raise
finally:server.shutdown();server.server_close()
