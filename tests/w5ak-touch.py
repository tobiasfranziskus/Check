"""W5ak: two genuine payroll cycles in the existing shared hub."""
import functools, http.server, pathlib, threading, os, json
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
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/w5ag/')
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Regel 195')",timeout=15000)
   page.evaluate("localStorage.setItem('w5ag-product-sentinel','keep')")
   def tap(sel):page.locator(sel).tap()
   def view(name):tap(f'[data-view="{name}"]')
   def step(n):tap(f'[data-step="{n}"]')
   def export():
    with page.expect_download() as d:tap('#export')
    return pathlib.Path(d.value.path()).read_text()
   identity=page.locator('#identity').inner_text()
   for name in ['mining','corporation','freight','refinery','shipyard','transfer','water','hq','station','fleet','ship']:
    view(name);assert page.locator('#'+name).is_visible()
    assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(w,h,name)
    assert page.locator('#identity').inner_text()==identity
   view('freight');tap('#freight-buy');tap('#buy-miner')
   view('water');tap('#ice-mine');step(50);tap('#stop-mining')
   view('freight');tap('#freight-start');step(60)
   step(60) # Full W3 return; W5ai reference does not add a shipyard order.
   view('water');tap('#ice-freight');step(60);tap('#water-start');step(20)
   saved=export();data=json.loads(saved)
   assert data['rulesVersion']==195 and data['w5ag']['paid']=={'erz':120,'eis':80}
   assert data['w5']['verkauft']==0 and data['w5n']['wasserProduziert']==10
   mid=page.locator('#identity').inner_text()
   for fake in [dict(data,rulesVersion=194),dict(data,w5ag=None)]:
    page.locator('#import').set_input_files({'name':'fake.json','mimeType':'application/json','buffer':json.dumps(fake).encode()})
    page.wait_for_function("document.querySelector('#message').textContent.startsWith('Nicht übernommen:')")
    assert page.locator('#identity').inner_text()==mid
   page.locator('#import').set_input_files({'name':'real.json','mimeType':'application/json','buffer':saved.encode()})
   page.wait_for_function("document.querySelector('#message').textContent.includes('geprüft und ausgeführt')")
   assert page.locator('#identity').inner_text()==mid
   page.locator('#water-amount').fill('6');tap('#water-buy')
   page.locator('#pilot-owner').select_option('pilot_eis');page.locator('#water-amount').fill('4');tap('#water-buy')
   step(30);step(10)
   final=json.loads(export())
   assert final['owners']['pilot_erz']['cash']==36 and final['owners']['pilot_eis']['cash']==64
   assert final['w5n']['wasserVerbraucht']==10 and final['minted']==0
   assert sum(o['cash'] for o in final['owners'].values())==33000
   # Second water batch, then fresh cargo and explicit manual source sale.
   tap('#water-start');step(20)
   page.locator('#pilot-owner').select_option('pilot_erz');page.locator('#water-amount').fill('2');tap('#water-buy')
   page.locator('#pilot-owner').select_option('pilot_eis');page.locator('#water-amount').fill('4');tap('#water-buy')
   view('ship');tap('#miner-eis');tap('#miner-step-50');tap('#miner-stop')
   before=json.loads(export());sid=page.locator('#miner-select').input_value()
   assert before['ships'][sid]['ladung']['eis']==50
   page.locator('#miner-sell-amount').fill('51');assert page.locator('#miner-sell').is_disabled()
   assert 'Verkauf gesperrt' in page.locator('#miner-sell-quote').inner_text()
   page.locator('#miner-sell-amount').fill('50');tap('#miner-sell')
   sold=json.loads(export());assert sold['ships'][sid]['ladung'].get('eis',0)==0
   assert sold['owners']['st_aldera']['cash']==before['owners']['st_aldera']['cash']-250
   identity=page.locator('#identity').inner_text()
   for name in ['hq','map','ship','water']:
    view(name);assert page.locator('#identity').inner_text()==identity
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h,name)
   assert page.locator('#ice-sell').is_disabled()
   tap('#ice-freight');escrow=json.loads(export())
   assert escrow['owners']['w5n_fracht_kauf']['cash']==490
   assert escrow['owners']['w5n_fracht_arbeit']['cash']==120
   assert escrow['owners']['pilot_eis']['cash']==8
   midflight=export()
   step(60)
   page.locator('#import').set_input_files({'name':'second-flight.json','mimeType':'application/json','buffer':midflight.encode()})
   page.wait_for_function("document.querySelector('#identity').textContent.includes('Tick 360')")
   assert export()==midflight
   step(60);page.locator('#water-amount').fill('4');tap('#water-buy')
   tap('#water-start');step(20);page.locator('#water-amount').fill('2');tap('#water-buy')
   step(30);step(10);page.locator('#water-amount').fill('3');tap('#water-buy')
   final=json.loads(export())
   assert final['tick']==480 and final['w5n']['frachtAbgeschlossen']==2
   assert len(final['w5ag']['payments'])==360
   assert final['w5n']['wasserProduziert']==30 and final['w5n']['wasserVerbraucht']==25
   assert final['w5n']['wasserErlos']==350 and final['stations']['st_nadir']['lager']['wasser']==5
   assert final['owners']['pilot_eis']['cash']==2 and final['minted']==0
   assert sum(x['cash'] for x in final['owners'].values())==33000
   assert '240 tatsächlich bezahlte Flugminuten' in page.locator('#water-state').inner_text()
   assert 'Chargen begonnen/fertig: 3/3' in page.locator('#water-state').inner_text()
   assert '58da44b282a654a3' in page.locator('#identity').inner_text()
   ledger=json.loads(page.locator('#water-ledger').text_content());assert len(ledger['wasserkaufbelege'])==7
   for selector in ['#ice-sell','#ice-sell-amount','#water-buy']:
    assert page.locator(selector).bounding_box()['height']>=48,(w,h,selector)
   assert errors==[],errors
   page.locator('#water').screenshot(path=f'/tmp/w5ak-{w}x{h}.png')
   ctx.close();print(f'PASS W5ak {w}x{h}: second paid flight, manual sale, 360 wage minutes, 25 water, shared navigation and JSON',flush=True)
  browser.close()
finally:
 server.shutdown();server.server_close()
