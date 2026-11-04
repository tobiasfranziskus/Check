import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule,sitzung} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';
import {frachterSicht} from '../prototypes/w5-frachter/m_ui_frachter_sicht.mjs';
import {w5bJagdSichtAusCore} from '../prototypes/w5-jagd/m_ui_w5b_bridge.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api,grafik}=vorhandeneModule(html);
test('W5d x Codex: beide Oberflaechen benutzen den einen Core ohne zweite Weltuhr',()=>{
  assert.equal(api.W3_RULES.rulesVersion,17);
  assert.equal(api.W5D_RULES.rulesVersion,22);
  assert.equal(typeof grafik.grafik,'function');
  for(const seed of [7,42]){
    const fracht=sitzung(api,api.createW3State(seed));
    const jagd=api.createW5DState(seed);
    const frachtHash=api.hash(fracht.lesen()),jagdHash=api.hash(jagd);
    const f=frachterSicht(api,fracht.lesen());
    const j=w5bJagdSichtAusCore(api.JagdSichtV1(jagd));
    assert.equal(f.schiff,null);
    assert.equal(j.schiffe.length,0,'noch kein gekauftes Kampfschiff');
    assert.equal(api.hash(fracht.lesen()),frachtHash,'Frachter lesen veraendert keine Welt');
    assert.equal(api.hash(jagd),jagdHash,'Jaeger lesen veraendert keine Welt');
    assert.equal(fracht.lesen().rulesVersion,17);
    assert.equal(jagd.rulesVersion,22);
    assert.equal(api.audit(fracht.lesen()).ok,true);
    assert.equal(api.audit(jagd).ok,true);
    fracht.schritt(50);
    const kauf=fracht.befehl({type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'});
    assert.equal(kauf.ok,true,kauf.reason);
    const sh=Object.values(fracht.lesen().ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
    assert.ok(sh,'echte Frachter-ID');
    assert.equal(fracht.befehl({type:'shipFreight',owner:'transport',schiff:sh.id}).ok,true);
    const before=api.hash(fracht.lesen());
    for(let n=0;n<100;n++) {
      const v=frachterSicht(api,fracht.lesen(),sh.id);
      assert.equal(v.richtung,'Aldera → Nadir');
      assert.equal(v.schiff.id,sh.id);
      assert.equal(v.schiff.ladung.erz,50);
      assert.equal(api.hash(fracht.lesen()),before,'100 Frames ohne Core-Änderung');
    }
    assert.equal(api.hash(jagd),jagdHash,'W3-Auftrag berührt Regel22 nicht');
    api.advance(jagd,65,api.W5D_RULES);
    assert.equal(api.hash(fracht.lesen()),before,'W5d-Ticks verändern W3-Sitzung nicht');
    assert.equal(jagd.minted,0);
    assert.equal(api.audit(jagd).ok,true);
    assert.equal(api.audit(fracht.lesen()).ok,true);
  }
});
test('W5d x Codex: Save-Slots strikt inkompatibel, keine Ueberschreibung',()=>{
  const fracht=sitzung(api);
  const jagd=api.createW5DState(42);
  const fs=fracht.export(),js=api.save(jagd);
  assert.throws(()=>fracht.import(js),/inkompatibel/);
  assert.equal(fracht.export(),fs);
  assert.throws(()=>api.loadW5D(fs),/inkompatibel/);
  assert.equal(api.hash(api.loadW5D(js)),api.hash(jagd));
  assert.equal(api.hash(api.loadW3(fs)),api.hash(fracht.lesen()));
  assert.equal(api.hash(api.loadW5B(api.save(api.createW5BState(42)))),
    api.hash(api.createW5BState(42)));
  assert.equal(api.hash(api.loadW5C(api.save(api.createW5CState(42)))),
    api.hash(api.createW5CState(42)));
});
