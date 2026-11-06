import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules={...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
  retainFleetEarnings:true,carrierWorkingCapital:true,
  autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true
}};
test('W5s-q: bestätigter dritter Auftrag, vierte Nachfrage und wirtschaftlicher Stillstand',()=>{
 for(const [seed,expectedHash]of [[42,'778b897e3213f827'],[7,'547778324a02446f']]){
  const s=api.createW5RState(seed,'full','npc3');const points={};
  for(let d=1;d<=365;d++){
    api.advance(s,1440,rules);
    assert.equal(api.audit(s).ok,true,'Seed '+seed+' day '+d);
    if([104,120,150,365].includes(d)){
      const hash=api.hash(s),f=api.w5sFinanzStatus(s,rules);
      assert.equal(f.ok,true);
      assert.equal(api.hash(s),hash,'lesender Kassen-/Nachfragebeleg');
      assert.equal(api.hash(api.loadW5R(api.save(s))),hash,'Speicherrundreise');
      points[d]={ore:s.w3.abgeschlossen,ice:s.w5n.frachtAbgeschlossen,
        water:s.w5n.wasserVerbraucht,chain:f.chain,
        company:s.owners.transport.cash,house:s.owners.w5n_kunden.cash};
    }
  }
  assert.equal(api.hash(s),expectedHash,'alter W5s-p-Zustand bitidentisch');
  assert.equal(s.w3.abgeschlossen,3,'kein vierter Auftrag ohne echte Produktionsnachfrage');
  assert.equal(s.w5n.wasserVerbraucht,5738);
  assert.equal(points[104].chain.originalW3PrepayPossible,true,
    'originales manuelles W3 wäre finanziell möglich');
  assert.equal(points[104].chain.automatedW3Approved,false,
    'keine fiktive Werftbestellung');
  assert.equal(points[104].chain.yardDemand,'kein_ersatzbedarf');
  assert.equal(points[365].chain.stationCash,0);
  assert.equal(points[365].chain.merchantOwnedOre,50);
  assert.equal(points[365].chain.npcMinerCargoOre,100);
  assert.equal(points[365].chain.carrierOwnCash,240);
  assert.equal(points[365].chain.nextCarrierShortfall,690);
  assert.equal(points[365].chain.stage,'ersatzschiff_und_weiterer_absatz_unfinanziert');
  console.log('W5S_Q_CHAIN '+JSON.stringify({seed,hash:api.hash(s),points}));
 }
});
