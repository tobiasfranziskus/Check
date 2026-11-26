import assert from 'node:assert/strict';
import test from 'node:test';
import Welt from '../prototypes/welt/welt-kern.js';
import {lauf, start} from '../tools/m4-management-szenarien.cjs';
import {SZENARIEN, pruefen} from '../tools/w6-szenarien.cjs';
import {freiwilligeJaegerKaufprobe} from '../tools/w6-gesamtpaket.cjs';

const s02 = SZENARIEN.find(s => s.id === 'S02');
const s02Vorlauf = {...s02, politik:{...s02.politik, ersatzVorlaufProzent:60}};

test('W6: isolierte Profilidentität, Originalzustand und Save/Load-Replay', () => {
  const original = start(s02Vorlauf,42,true,'konzerne');
  const {welt, s} = start(s02Vorlauf,42,'gesamt','konzerne');
  const {carrierCash,buyerCash} = s.w5ad.profile;
  const normal = Welt.erstellenJ4c({carrierCash,buyerCash});
  const save = welt.save(s);
  assert.throws(() => normal.load(save), /Forschungsprofil/);
  assert.throws(() => original.welt.load(save), /abweichendes Wirtschaftsprofil/);
  assert.throws(() => welt.load(original.welt.save(original.s)), /abweichendes Wirtschaftsprofil/);
  const copy = welt.load(save);
  welt.advance(s,720);
  welt.advance(copy,720);
  assert.equal(welt.save(s),welt.save(copy));
  assert.deepEqual(pruefen(welt,s),[]);
  const before = welt.save(s);
  assert.equal(welt.u9TeilabrechnungProbe(s,null).ok,false);
  assert.equal(welt.u9VollabnahmeProbe(s,null).ok,false);
  assert.equal(freiwilligeJaegerKaufprobe(welt,s).ok,false);
  assert.equal(welt.save(s),before);
});

test('W6: echter W3-Abschluss mit Löhnen, Eigentum, Folgeproduktion und Replay', () => {
  const run = () => lauf(s02Vorlauf,7,42,'gesamt');
  const first = run();
  assert.deepEqual(run(),first);
  const last = first.verlauf.at(-1);
  assert.ok(last.auftraege.erzfrachten > 0);
  assert.ok(last.produktion.frachterGebaut > 0);
  for (const receipt of last.fracht.erz) {
    assert.deepEqual([receipt.amount,receipt.work,receipt.fee,receipt.end-receipt.start],[50,120,240,120]);
    assert.equal(last.huellen.find(s=>s.id===receipt.id).owner,receipt.owner ?? 'transport');
  }
  assert.equal(last.produktion.jaegerGebaut,0);
  assert.equal(last.produktion.jaegerVerkauft,0);
});
