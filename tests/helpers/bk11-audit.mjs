import assert from 'node:assert/strict';
export const SEEDS = [7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const sum = a => a.reduce((s,n) => s+n,0);
// Keine Core-Auditfunktion oder vorberechnete Erfolgsmeldung verwenden.
export function independentAudit(s) {
  const entries = Object.values(s.vertraege?.eintraege || {});
  const archive = s.vertraege?.archiv || {anzahl:0,budget:0,gezahlt:0,erstattet:0};
  for (const o of Object.values(s.owners)) assert(Number.isSafeInteger(o.cash) && o.cash >= 0);
  for (const e of entries) {
    for (const k of ['budget','rest','gezahlt','erstattet']) assert(Number.isSafeInteger(e[k]) && e[k]>=0);
    assert.equal(e.budget,e.rest+e.gezahlt+e.erstattet);
    assert.equal(sum(Object.values(e.belege)),e.gezahlt);
    if(e.status==='geschlossen') assert.equal(e.rest,0);
  }
  assert.equal(archive.budget,archive.gezahlt+archive.erstattet);
  if(s.vertraege) assert.equal(archive.anzahl+entries.length,s.vertraege.naechster-1);
  const escrow = sum(entries.map(e=>e.rest));
  const money = sum(Object.values(s.owners).map(o=>o.cash));
  assert.equal(money+escrow,s.initialSupply+s.minted-s.burned,'freie + gebundene ISK');
  const goods={};
  for(const stock of [...Object.values(s.stations).map(st=>st.lager),...Object.values(s.ships).map(sh=>sh.ladung)]) {
    for(const [w,n] of Object.entries(stock)) {
      assert(Number.isSafeInteger(n) && n>=0,w);
      goods[w]=(goods[w]||0)+n;
    }
  }
  for(const [w,l] of Object.entries(s.ledger))
    assert.equal(goods[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,'Warenbilanz '+w);
  return {money,escrow,paid:archive.gezahlt+sum(entries.map(e=>e.gezahlt)),
    reserved:archive.budget+sum(entries.map(e=>e.budget)),
    refunded:archive.erstattet+sum(entries.map(e=>e.erstattet))};
}
