import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const r={...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
  retainFleetEarnings:true,carrierWorkingCapital:true,
  autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true
}};
test('W5s-q: W3 bezahlt vierte Lieferung manuell; kein solcher Automatikauftrag ohne Werftbedarf',()=>{
 for(const seed of [42,7]){
  const s=api.createW5RState(seed,'full','npc3');
  for(let d=1;d<=125;d++){
    api.advance(s,1440,r);
    if(![104,125].includes(d))continue;
    const f=api.w5sFinanzStatus(s,r);
    assert.equal(f.chain.originalW3PrepayPossible,true);
    assert.equal(f.chain.automatedW3Approved,false,
      'ein bezahlbarer Kauf ist nicht automatisch ein produktiver Bedarf');
    const beforeHash=api.hash(s),beforeTrips=s.w3.abgeschlossen,
      beforeConsumer=s.owners.st_nadir.cash;
    const alt=api.loadW5R(api.save(s));
    const sh=Object.values(alt.ships).find(x=>x.owner==='transport'
      &&x.klasse==='frachter'&&x.system==='aldera'&&x.phase==='dock'
      &&x.auftrag==='halten'&&Object.values(x.ladung).every(v=>!v));
    assert.ok(sh,'real gekaufte freie Hülle');
    const cmd=api.execute(alt,{type:'shipFreight',owner:'transport',schiff:sh.id},r);
    assert.equal(cmd.ok,true,'originaler, überprüfter W3-Vertrag');
    assert.ok(alt.owners.st_nadir.cash<=beforeConsumer-740,
      'echter vollständig reservierter Käuferetat');
    api.advance(alt,600,r);
    assert.equal(alt.w3.abgeschlossen,beforeTrips+1,
      'nur nach echter bezahlter Lieferung und Rückflug');
    assert.equal(api.audit(alt).ok,true,'unabhängige Gesamtbilanz');
    assert.equal(alt.minted,0);
    assert.equal(api.hash(s),beforeHash,'manuelle Nachfrage niemals in Originalwelt einschmuggeln');
    console.log('W5S_Q_MANUAL '+JSON.stringify({seed,day:d,base:beforeTrips,
      manual:alt.w3.abgeschlossen,postWater:alt.w5n.wasserVerbraucht}));
  }
 }
});
