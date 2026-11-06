import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const r={...api.W5R_RULES,w5s:{minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
  retainFleetEarnings:true,carrierWorkingCapital:true,autoOreSettlement:true,
  autoTakeover:true,autoNpcVenture:true}};
test('W5s-q: hypothetische echte W3-Vorbestellung bei physisch freiem Lager',()=>{
 const s=api.createW5RState(42,'full','npc3');
 for(let day=1;day<=150;day++){
  api.advance(s,1440,r);
  if(![102,104,105,110,115,120,125,130,135,140].includes(day))continue;
  const clone=api.loadW5R(api.save(s));
  const sh=Object.values(clone.ships).find(sh=>sh.owner==='transport'
    &&sh.klasse==='frachter'&&sh.system==='aldera'&&sh.phase==='dock'
    &&sh.auftrag==='halten'&&Object.values(sh.ladung).every(n=>!n));
  const cmd=sh?api.execute(clone,{type:'shipFreight',owner:'transport',schiff:sh.id},r):{ok:false,reason:'kein_freier_frachter'};
  const atStart={stock:clone.stations.st_nadir.lager.erz,
    merchant:clone.w5h.bestand,paid:clone.owners.st_nadir.cash,
    bills:clone.w3.auftrag};
  if(cmd.ok)api.advance(clone,600,r);
  const fin=api.w5sFinanzStatus(s,r);
  console.log('W5S_Q_MANUAL '+JSON.stringify({day,ship:sh?.id,
    ore:s.w3.abgeschlossen,ice:s.w5n.frachtAbgeschlossen,
    plan:fin.orePlan.stage,work:fin.yardPlan.stage,
    original:{nadir:s.stations.st_nadir.lager.erz,merchant:s.w5h.bestand,
      consumer:s.owners.st_nadir.cash,water:s.w5n.wasserVerbraucht},
    outcome:cmd,atStart,after:cmd.ok?{
      ore:clone.w3.abgeschlossen,nadir:clone.stations.st_nadir.lager.erz,
      merchant:clone.w5h.bestand,cash:clone.owners.st_nadir.cash,
      water:clone.w5n.wasserVerbraucht,audit:api.audit(clone).ok}:null}));
  assert.equal(api.audit(s).ok,true);
 }
});
