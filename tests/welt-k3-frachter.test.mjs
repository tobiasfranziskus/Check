import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnose, nachrechnen } from '../tools/k3-frachter-diagnose.mjs';
import { vorbereiten, SZENARIEN } from '../tools/welt-szenarien.mjs';

const S12 = SZENARIEN[11];
function ablehnen(w, s, cmd) {
  const vorher = w.canonical(s);
  assert.equal(w.execute(s, cmd).ok, false, JSON.stringify(cmd));
  assert.equal(w.canonical(s), vorher, 'Ablehnung muss atomar bleiben');
}
const bauen = { type: 'stationBuildShip', owner: 'werft_extern', station: 'st_nadir' };
for (const seed of [42, 7]) test('K3 S12 Seed ' + seed + ': reale Ersatzkette, Zwischenstände und terminaler Materialengpass', () => {
  const gates = new Set(); let folge = false, produziert = false, wasserVorher, eisVorher, geliefert = false;
  const r = diagnose(seed, 14 * 1440, (w, s) => {
    let art;
    if (s.w5.auftrag?.gearbeitet === 12) art = 'werft';
    if (s.w5ac.active?.gearbeitet === 12) art = 'transfer';
    if (s.w5n.frachtauftrag && s.w5.schiffIds.includes(s.w5n.frachtauftrag.schiff)) {
      art = 'folge'; folge = true; eisVorher ??= s.w5n.eisGeliefert;
      if (!geliefert && s.w5n.eisGeliefert > eisVorher) {
        geliefert = true; wasserVorher = s.w5n.wasserProduziert;
      }
    }
    if (folge && geliefert && s.w5n.wasserProduziert > wasserVorher) produziert = true;
    if (art && !gates.has(art)) {
      gates.add(art);
      const a = w.load(w.save(s)), b = w.load(w.save(s));
      assert.equal(w.hash(a), w.hash(s));
      for (let m = 0; m < 130; m++) {
        w.minute(a); w.minute(b); nachrechnen(w, a);
        assert.equal(w.hash(a), w.hash(b));
        assert.equal(w.audit(a).ok, true);
      }
      if (art === 'werft') {
        ablehnen(w, s, bauen);
        ablehnen(w, s, { type: 'stationBuildMiner', owner: 'werft_extern', station: 'st_nadir', besteller: 'house' });
      }
      if (art === 'transfer') {
        ablehnen(w, s, { type: 'shipReposition', owner: 'transport', schiff: s.w5ac.active.id });
        ablehnen(w, s, { type: 'shipFreightIce', owner: 'house', schiff: s.w5ac.active.id });
      }
    }
  });
  assert.deepEqual([...gates].sort(), ['folge', 'transfer', 'werft']);
  assert.equal(produziert, true, 'nach echtem Ersatztransport wieder Wasser aus geliefertem Eis');
  const unterwegs = r.ereignisse.find(e=>e.art==='stilllegung' && e.schiff==='sh014');
  assert.equal(unterwegs.tick,12885);
  assert.equal(unterwegs.frachter.find(x=>x.id==='sh014').phase,'reise');
  assert.equal(r.ersterStillstand.frachter.find(x=>x.id==='sh014').phase,'dock');
  assert.equal(r.ersterStillstand.tick, 12965);
  assert.equal(r.zuletzt.eis.tick, 12965); assert.equal(r.zuletzt.absatz.tick, 13045);
  assert.equal(r.ende.w5.fertig, 4); assert.equal(r.ende.w5.verkauft, 4);
  assert.equal(r.ende.transfer.completed.length, 4);
  assert.equal(r.ende.kassen.transport, 4000); assert.equal(r.ende.kassen.werft_extern, 530);
  assert.equal(r.ende.massen.material.vorhanden, 0);
  assert.equal(r.ende.massen.erz.vorhanden, 7);
  assert.equal(r.ende.massen.erz.consumed, 100);
  assert.equal(r.ende.massen.erz.exported, 1993);
  console.log('K3_NEGATIV ' + JSON.stringify({seed, hash:r.ende.hash, letzterAbsatz:r.zuletzt.absatz, stillstand:r.ersterStillstand.tick}));
});

test('K3: terminale Befehle lehnen ohne Teleport, Wiederbelebung oder Fremdfinanzierung ab', () => {
  const {welt:w,state:s} = vorbereiten(S12); w.advance(s, 14 * 1440);
  for (const cmd of [bauen,
    {type:'stationRefine',owner:'st_nadir',station:'st_nadir'},
    {type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'},
    {type:'shipFreightIce',owner:'transport',schiff:'sh014'},
    {type:'shipFreight',owner:'transport',schiff:'sh014'},
    {type:'shipReposition',owner:'transport',schiff:'sh014'},
  ]) ablehnen(w,s,cmd);
  const umgebucht=structuredClone(s);
  umgebucht.owners.transport.cash--; umgebucht.owners.werft_extern.cash++;
  assert.throws(()=>nachrechnen(w,umgebucht), /Kasse aus Anfang/,
    'auch geldmengenneutrale fremde Eigentümerumbuchung wird unabhängig erkannt');
  const vorher=w.hash(s); w.advance(s,1440); assert.equal(s.w5.fertig,4);
  assert.notEqual(w.hash(s),vorher); assert.equal(w.audit(s).ok,true);
  const korrupt=structuredClone(s); korrupt.owners.w5ac_transfer_reserved.cash++;
  assert.equal(w.audit(korrupt).ok,false); assert.throws(()=>w.save(korrupt));
  assert.throws(()=>w.load(JSON.stringify(korrupt)), /ungültig|fehlerhaft|Bilanz|ungedeckt/);
});

test('K3: 529 statt 530 ISK Werftdeckung wird ohne Buchung abgelehnt (isolierte Negativmutation)', () => {
  const {welt:w,state:s}=vorbereiten(S12);
  while (!s.w5.auftrag) w.minute(s);
  // Reale Vorstufe vor dem ersten Bau neu erzeugen, keine erfundenen Materialien.
  const x=vorbereiten(S12); x.welt.advance(x.state,s.tick-1);
  x.welt.politikSetzen(x.state,{automatik:false}); x.welt.minute(x.state);
  assert.equal(x.state.stations.st_nadir.lager.material,5);
  // Ausschließlich Validierungsgegenprobe, niemals als gültigen Wirtschaftslauf speichern.
  x.state.owners.werft_extern.cash=529;
  assert.match(x.welt.execute(structuredClone(x.state),bauen).reason,/finanzieren/);
  ablehnen(x.welt,x.state,bauen);
});
