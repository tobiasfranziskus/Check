import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const base=api.W5R_RULES;
const finance={...base,w5s:{minerIndustry:true,concurrent:true,
  autoIndustry:true,autoOre:true,autoLeadDays:30,prepaidOrders:true},
  w5o:{...base.w5o,versorgungZiel:-1}};
const ordinary={...finance,w5s:{...finance.w5s,prepaidOrders:false}};
const natural={...finance,w5o:base.w5o,w5s:{...finance.w5s,autoLeadDays:2}};
function audit(s,context){
  const a=api.audit(s);
  assert.equal(a.ok,true,context+' '+JSON.stringify(Object.fromEntries(
    Object.entries(a).filter(([,x])=>x?.ok===false))));
  assert.equal(s.minted,0,'kein neues ISK');
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000,
    context+' Geldmenge');
  for(const [ware,l]of Object.entries(s.ledger)){
    const goods=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
    assert.equal(goods,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      context+' Bestand '+ware);
  }
}
function cmd(s,r,type,owner,x={}){
  const v=api.execute(s,{type,owner,...x},r);
  assert.equal(v.ok,true,type+' '+v.reason+' tick '+s.tick);
  audit(s,type);
}
function prepare(seed){
  const s=api.createW5RState(seed,'full','npc3');
  cmd(s,finance,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
  const miner=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner'
    &&sh.system==='aldera');
  cmd(s,finance,'shipMine','house',{schiff:miner.id,ware:'erz'});
  // Endlichen Werftplatz als ECHTEN Kauf freimachen, nicht löschen.
  cmd(s,finance,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
  return s;
}
function stageUntil(s,stage,limit=35){
  for(let t=0;t<limit&&!((s.w5s?.contract?.stage)===stage);t++){
    api.advance(s,60,finance);
    audit(s,'stündlicher Vertrag '+t);
  }
  assert.equal(s.w5s?.contract?.stage,stage,'erwartete Vertragsphase '+stage);
}
function built(seed){
  const s=prepare(seed);
  let sawReserved=false,sawBought=false,sawInflight=false,hadTwo=false;
  let rejectedLateCancel=false;
  let reservedProof=null,first=null;
  for(let hour=0;hour<48;hour++){
    api.advance(s,60,finance);
    audit(s,'W5s-g automatische Stunde '+hour);
    const c=s.w5s?.contract;
    if(c?.stage==='reserved'&&!sawReserved){
      sawReserved=true;first=c.type;reservedProof={...c};
      assert.equal(s.owners.w5s_order_reserved.cash,c.total);
      assert.equal(c.total,c.type==='miner'?660:810);
      assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
        'Bestellung save/load stabil');
      const before=api.hash(s);
      assert.equal(api.execute(s,{type:'shipOrder',owner:c.owner,klasse:c.type},finance).ok,false);
      assert.equal(api.hash(s),before,'Doppel-Bestellung ohne Folgen');
      s.owners.w5s_order_reserved.cash+=1;
      assert.equal(api.audit(s).ok,false,'gefälschter Treuhandbetrag erkannt');
      assert.throws(()=>api.loadW5R(api.save(s)),/bilanz|inkompatibel/i);
      s.owners.w5s_order_reserved.cash-=1;
      assert.equal(api.hash(s),before);
    }
    if(c?.stage==='reserved'&&c.buildStarted&&!rejectedLateCancel){
      const hash=api.hash(s);
      assert.equal(api.execute(s,{type:'shipCancelOrder',owner:c.owner},finance).ok,false,
        'nach Werftbeginn ist die Vorbestellung verbindlich');
      assert.equal(api.hash(s),hash,'spätes Storno ohne Kassenbewegung');
      rejectedLateCancel=true;
    }
    if(c?.stage==='bought'){sawBought=true;assert.equal(s.owners.w5s_order_reserved.cash,c.wage)}
    if(c?.stage==='inflight')sawInflight=true;
    if((s.w5s?.completed||[]).length===2){hadTwo=true;break;}
  }
  assert.ok(sawReserved&&sawBought&&sawInflight&&hadTwo,
    'vollständige Vertragsphasen real gesehen');
  assert.equal(s.owners.w5s_order_reserved.cash,0);
  assert.equal(s.w5.fertig,2,'beide Schiffsklassen echt hergestellt');
  assert.equal(s.w5.minerFertig,1);
  assert.equal(s.w5.minerVerkauft,1);
  assert.equal(s.w5.verkauft,1);
  assert.equal(s.w5s.paid,120);
  assert.equal(s.w5s.contract.stage,'completed');
  assert.equal(s.w5s.orderHistory.length,1,'abgeschlossene Verträge archiviert');
  assert.equal(s.w5s.orderHistory[0].stage,'completed');
  assert.equal(rejectedLateCancel,true,'Storno nach tatsächlichem Werftstart geprüft');
  const prior=api.hash(s);
  s.w5s.orderHistory[0].price++;
  assert.equal(api.audit(s).ok,false,'historischer Kaufbeleg wird unabhängig geprüft');
  assert.throws(()=>api.loadW5R(api.save(s)),/bilanz|inkompatibel/i);
  s.w5s.orderHistory[0].price--;
  assert.equal(api.hash(s),prior);
  assert.equal(s.w3.geliefert,50,'W3 liefert echtes Erz ohne manuellen Frachtauftrag');
  audit(s,'zwei vollständig bezahlte Verträge');
  return s;
}
function longer(seed,days){
  const s=built(seed);
  while(s.tick<days*1440){
    api.advance(s,Math.min(1440-s.tick%1440,days*1440-s.tick),natural);
    audit(s,'Langzeit Tag '+Math.floor(s.tick/1440));
    if([15,30,60,90,365].includes(s.tick/1440))
      assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
  }
  return {seed,days,hash:api.hash(s),minted:s.minted,
    contract:s.w5s.contract?.stage,contracts:s.w5s.orderHistory?.length,
    made:s.w5.fertig,sold:s.w5.verkauft+s.w5.minerVerkauft,
    miner:s.w5r.miner.lost,freighter:s.w5r.frachter.lost,
    water:s.w5n.wasserVerbraucht,npc3:s.owners.npc3.cash,
    transport:s.owners.transport.cash,escrow:s.owners.w5s_order_reserved.cash};
}
test('W5s-g: reservierte Bestellungen vor Bau in Seed42/7, echter Kauf und Flug ohne Doppelbuchung',()=>{
  for(const seed of [42,7]){
    const a=built(seed),b=built(seed);
    assert.equal(api.hash(a),api.hash(b),'zwei identische R32-Replays');
    console.log('W5S_G_CONTRACT '+JSON.stringify({seed,hash:api.hash(a),
      ownerCash:a.owners.npc3.cash,
      supplier:a.owners.werft_extern.cash,history:a.w5s.orderHistory,
      last:a.w5s.contract,shipCount:a.w5.fertig,ore:a.w3.geliefert}));
  }
});
test('W5s-g: Storno vor Produktionsstart erstattet exakt die echte Reserve',()=>{
  const s=api.createW5RState(42,'full','npc3');
  const owner='npc3',before=s.owners[owner].cash;
  assert.equal(api.execute(s,{type:'shipOrder',owner,klasse:'miner'},ordinary).ok,false,
    'Bestellung ohne Forschungsprofil gesperrt');
  cmd(s,finance,'shipOrder',owner,{klasse:'miner'});
  assert.equal(s.owners[owner].cash,before-660);
  assert.equal(s.owners.w5s_order_reserved.cash,660);
  assert.equal(api.execute(s,{type:'shipOrder',owner:'transport',klasse:'frachter'},finance).ok,false);
  cmd(s,finance,'shipCancelOrder',owner);
  assert.equal(s.owners[owner].cash,before,'volle 660 ISK zurückerstattet');
  assert.equal(s.owners.w5s_order_reserved.cash,0);
  const hash=api.hash(s);
  assert.equal(api.execute(s,{type:'shipCancelOrder',owner},finance).ok,false);
  assert.equal(api.hash(s),hash);
  assert.equal(api.hash(api.loadW5R(api.save(s))),hash);
});
test('W5s-g: 13 feste Seeds ×90 Tage mit unabhängigen Geld-/Waren-Audits, Save/Load',()=>{
  for(const seed of [42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159]){
    const a=longer(seed,90);
    if(seed===42||seed===7)assert.deepEqual(longer(seed,90),a,'90d Replay');
    console.log('W5S_G_90D '+JSON.stringify(a));
  }
});
test('W5s-g: 2 ×365 Tage, Insolvenz/Fehlkapital ohne Gratisrettung',()=>{
  for(const seed of [42,7]){
    const a=longer(seed,365);
    assert.equal(a.minted,0);
    console.log('W5S_G_365D '+JSON.stringify(a));
  }
});
