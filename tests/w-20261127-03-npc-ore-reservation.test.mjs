// W-20261127-03: original financed NPC reservation, not a second economy.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const {pruefen}=require('../tools/w6-szenarien.cjs');

function start(s02=false){
  const j=J8.erstellen();
  j.starten195(OLD.create(42,'private195').export(),true);
  assert.equal(j.ansicht().hash,'674400c1d181fcf2');
  if(s02){
    const w=j.weltReferenz(),s=j.zustandReferenz();
    w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
    w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
  }
  return j;
}
function audit(w,s){assert.deepEqual(pruefen(w,s),[]);}
function roundtrip(w,s){
  audit(w,s);
  const json=w.save(s),loaded=w.load(json);
  assert.equal(w.save(loaded),json);
  return loaded;
}
function managerOpen(json){
  const j=J8.erstellen();j.oeffnen204(json,true);assert.equal(j.exportieren(),json);return j;
}
function act(w,s,cmd){const r=w.execute(s,cmd);assert.equal(r.ok,true,cmd.type+': '+r.reason);}
function reject(w,s,cmd){
  const before=w.save(s),r=w.execute(s,cmd);assert.equal(r.ok,false,cmd.type);
  assert.equal(w.save(s),before);return r.reason;
}
function advance(j,tick){
  // Same real elapsed minutes; explicit J8 import at each action boundary.
  const w=j.weltReferenz(),s=w.load(j.exportieren());
  assert.ok(tick>=s.tick);w.advance(s,tick-s.tick);audit(w,s);
  return managerOpen(w.save(s));
}
const trace=[[300,"buy-st_nadir-frachter"],[300,"reposition-sh004"],[360,"buy-st_aldera-miner"],[360,"ice-sh005"],[480,"freight-sh004"],[720,"freight-sh004"],[840,"freight-sh004"],[1200,"freight-sh004"],[1320,"freight-sh004"],[1440,"freight-sh004"],[1740,"freight-sh004"],[1980,"freight-sh004"],[2100,"freight-sh004"],[2220,"freight-sh004"],[2340,"freight-sh004"],[4460,"freight-sh004"],[5900,"buy-st_aldera-miner"],[5960,"ice-sh011"],[7100,"freight-sh004"],[9820,"freight-sh004"],[12540,"freight-sh004"],[14000,"buy-st_aldera-miner"],[14100,"ice-sh016"],[15180,"freight-sh004"],[17820,"freight-sh004"],[20540,"freight-sh004"],[22580,"buy-st_aldera-miner"],[22640,"ice-sh022"],[23180,"freight-sh004"],[25820,"freight-sh004"],[27570,"buy-st_nadir-frachter"],[28540,"freight-sh004"],[29620,"reposition-sh026"],[32220,"buy-st_aldera-miner"],[32280,"ice-sh029"],[32450,"freight-sh026"]];

test('NPC ore: original #665 S02 career, real accepted 50 at tick32640 survives export', {timeout:20*60*1000},()=>{
  let j=start(true);
  for(const [tick,id] of trace){
    j=advance(j,tick);
    const r=j.ausfuehren(id);assert.equal(r.ok,true,tick+' '+id+': '+r.reason);
  }
  j=advance(j,32639);
  let w=j.weltReferenz(),s=j.zustandReferenz();
  assert.equal(s.w3.auftrag.schiff,'sh030');
  assert.equal(s.w3.auftrag.industrieMiner,'sh024');
  assert.equal(s.kanon.industrieErz.erstellt,32570);
  assert.equal(s.kanon.industrieErz.erzAngenommen,false);
  assert.equal(s.ships.sh024.ladung.erz,50);
  assert.equal(s.ledger.erz.exported,1959);
  const before=j.exportieren();
  j=advance(j,32640);w=j.weltReferenz();s=j.zustandReferenz();
  assert.equal(s.kanon.industrieErz.erzAngenommen,true);
  assert.equal(s.w3.auftrag.npcErzReserviert,50);
  assert.equal(s.stations.st_aldera.lager.erz,50);
  assert.equal(s.ledger.erz.exported,1959);
  assert.equal(s.ledger.erz.mined,2350);
  assert.deepEqual([s.owners.w3_kauf_treuhand.cash,s.owners.w3_arbeit_treuhand.cash,s.owners.k7_werft_treuhand.cash],[740,120,530]);
  const accepted=j.exportieren();
  const clone=managerOpen(before);
  assert.equal(advance(clone,32640).exportieren(),accepted);
  const isolated=w.load(accepted);
  reject(w,isolated,{type:'industrialOreCancel',owner:'house'});
  reject(w,isolated,{type:'industrialOreCancel',owner:'st_nadir'});
  // Old states without proof are read byte-identically, never filled or migrated.
  const legacy=w.load(accepted);delete legacy.w3.auftrag.npcErzReserviert;
  const legacyJson=w.save(legacy);assert.equal(w.save(w.load(legacyJson)),legacyJson);
  const forged=JSON.parse(accepted);forged.w3.auftrag.npcErzReserviert=49;
  assert.throws(()=>w.load(JSON.stringify(forged)));
  j=advance(j,32641);s=j.zustandReferenz();
  assert.equal(s.w3.auftrag.phase,'hin');
  assert.equal(s.ships.sh030.ladung.erz,50);
  assert.equal(s.w3.auftrag.npcErzReserviert,undefined);
  assert.equal(s.stations.st_aldera.lager.erz,0);
  j=advance(j,32761);s=j.zustandReferenz();
  const receipt=s.w5ad.freight.find(f=>f.id==='sh030'&&f.start===32641);
  assert.ok(receipt);
  assert.deepEqual([receipt.amount,receipt.end-receipt.start,receipt.fee,receipt.work],[50,120,240,120]);
  assert.equal(s.ships.sh030.owner,'transport');
  assert.ok(s.w4.abgeschlossen>0&&s.w5.fertig>0);
  j=advance(j,33060);s=j.zustandReferenz();
  const result={tick:s.tick,hash:j.ansicht().hash,receipt,
    w4:s.w4.abgeschlossen,w5:s.w5.fertig,ore:s.ledger.erz,
    offeredF4:j.angebote().find(o=>o.id==='freight-sh026')};
  assert.equal(advance(managerOpen(accepted),33060).exportieren(),j.exportieren());
  console.log('W_20261127_03_ORIGINAL_REPLAY',JSON.stringify(result));
});

function fixture(tick=50,extraMiner=false){
  // The actual J8 standard career starts with no NPC pendel and no NPC
  // freighter. This controlled contract fixture intentionally uses the
  // original Rule204 factory, as in m4-u5-house-ore-option-a-audit.test.mjs.
  const W=require('../prototypes/welt/welt-kern.js');
  const w=W.erstellenJ4c({carrierCash:2000,buyerCash:4000}),s=w.createState(42);
  assert.equal(s.kanon.pendel.sh001.ware,'erz');
  act(w,s,{type:'shipShuttleStop',owner:'npc3',schiff:'sh001'});
  const fr=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter').id;
  assert.equal(fr,'sh002');
  if(extraMiner)act(w,s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'});
  w.advance(s,tick);
  act(w,s,{type:'industrialOreOffer',owner:'st_nadir',miner:'sh001',frachter:fr});
  return {w,s,fr};
}
const sign=(w,s)=>{
  act(w,s,{type:'industrialOreAcceptMine',owner:'npc3'});
  act(w,s,{type:'industrialOreAcceptFreight',owner:'transport'});
  act(w,s,{type:'industrialOreAcceptYard',owner:'werft_extern'});
};
test('NPC ore: original role, incomplete consent, full reserve, empty cancellation and partial work',()=>{
  const {w,s}=fixture(0);
  reject(w,s,{type:'industrialOreAcceptFreight',owner:'house'});
  reject(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
  sign(w,s);
  const before=Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash]));
  act(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
  assert.equal(s.w3.auftrag.npcErzReserviert,undefined);
  assert.equal(s.kanon.industrieErz.erzAngenommen,false);
  const copy=roundtrip(w,s);
  act(w,s,{type:'industrialOreCancel',owner:'st_nadir'});
  for(const [id,cash] of Object.entries(before))assert.equal(s.owners[id].cash,cash,id);
  assert.equal(s.w3.auftrag,null);audit(w,s);
  let n=0;
  while((copy.ships.sh001.ladung.erz??0)===0&&n++<100)w.minute(copy);
  assert.ok(copy.ships.sh001.ladung.erz>0&&copy.ships.sh001.ladung.erz<50);
  assert.equal(copy.w3.auftrag.npcErzReserviert,undefined);
  reject(w,copy,{type:'industrialOreCancel',owner:'st_nadir'});
  audit(w,copy);
});
test('NPC ore: insufficient commit funding is rejected without creating a reservation',()=>{
  const {w,s}=fixture(0);sign(w,s);
  // Deliberately invalid test-only balance to exercise the original command's
  // revalidation; never import this artificial state as a real career.
  s.owners.st_aldera.cash=499;
  const before=w.canonical(s);
  const r=w.execute(s,{type:'industrialOreCommit',owner:'st_nadir'});
  assert.equal(r.ok,false);assert.equal(w.canonical(s),before);
  assert.equal(s.w3.auftrag,null);
});
test('NPC ore: standard accepted cargo and simultaneous free ore remain separate',()=>{
  const {w,s,fr}=fixture(50,true);sign(w,s);
  const house=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  act(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
  act(w,s,{type:'shipShuttle',owner:'house',schiff:house.id,ware:'erz'});
  const initial=s.ledger.erz.exported;
  let protectedAt=null;
  for(let n=0;n<200;n++){
    w.minute(s);
    if(s.w3.auftrag?.npcErzReserviert!==undefined){
      assert.equal(s.w3.auftrag.npcErzReserviert,50);
      assert.ok(s.stations.st_aldera.lager.erz>=50);
      protectedAt=s.tick;roundtrip(w,s);
    }
    if(s.w3.auftrag?.phase==='hin')assert.equal(s.ships[fr].ladung.erz,50);
  }
  assert.ok(protectedAt!==null);
  assert.ok(s.w3.abgeschlossen>=1);
  assert.ok(s.ledger.erz.exported-initial>=50,'free house ore can still be exported');
  audit(w,s);
});


// Boundary injection in a discarded controlled fixture, not a purported
// reachable manager state: replace one freshly bound W1 order by a smaller
// fully funded W1 order. Refund exactly the unused purchase and work reserves
// before further physical mining. The ordinary core must settle the partial
// order but must not certify 50 units for W3.
test('NPC ore: paid partial W1 acceptance cannot certify the full W3 quantity',()=>{
  const {w,s}=fixture(0);sign(w,s);
  act(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
  let n=0;
  while(!s.erzpilotVertraege?.sh001&&n++<100)w.minute(s);
  const v=s.erzpilotVertraege.sh001;
  assert.equal(v.menge,50);
  assert.ok((s.ships.sh001.ladung.erz??0)<25);
  const cut=25;
  s.owners[v.konto].cash-=cut*v.preis;
  s.owners.st_aldera.cash+=cut*v.preis;
  s.owners[v.arbeitsKonto].cash-=cut*v.arbeitsPreis;
  s.owners.npc3.cash+=cut*v.arbeitsPreis;
  v.menge-=cut;
  let q=roundtrip(w,s);
  const sales=q.stats.verkaeufe.sh001;
  const before=q.ledger.erz.mined;
  n=0;
  while(q.erzpilotVertraege?.sh001&&n++<160)w.minute(q);
  assert.equal(q.stats.verkaeufe.sh001,sales+1);
  assert.ok(q.ledger.erz.mined>=before);
  assert.equal(q.w3.auftrag.phase,'vorbestellt');
  assert.equal(q.kanon.industrieErz.erzAngenommen,false);
  assert.equal(q.w3.auftrag.npcErzReserviert,undefined);
  assert.equal(q.w3.geliefert,0);
  audit(w,q);
  console.log('W_20261127_03_PARTIAL_ACCEPTANCE',JSON.stringify({tick:q.tick,accepted:25,
    fullAccepted:q.kanon.industrieErz.erzAngenommen,hash:w.hash(q),scope:'isolated audited boundary fixture with reduced W1 reserve'}));
});

test('NPC ore: historical missing-charge boundary remains byte-identical on load, no phantom loading',()=>{
  const {w,s}=fixture(50);sign(w,s);
  act(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
  w.advance(s,70);
  assert.equal(s.tick,120);
  assert.equal(s.w3.auftrag.npcErzReserviert,50);
  assert.equal(s.stations.st_aldera.lager.erz,50);
  // Reconstruct the old export transaction using the pinned original
  // accounting equations, on an independent copy. This is a compatibility
  // boundary fixture, not an actual recovered user save. Historical original
  // tick120/hash61c7c97961fad4ac is preserved independently in #665 logs.
  const legacy=roundtrip(w,s),cfg=w.rules.erzpilot,amount=50,value=amount*cfg.preis;
  delete legacy.w3.auftrag.npcErzReserviert;
  legacy.stations[cfg.station].lager.erz-=amount;
  legacy.ledger.erz.exported+=amount;
  legacy.owners[cfg.exportOwner].cash-=value;
  legacy.owners[cfg.station].cash+=value;
  legacy.stats.konto[cfg.exportOwner]??={erloes:0,kosten:0};
  legacy.stats.konto[cfg.station]??={erloes:0,kosten:0};
  legacy.stats.konto[cfg.exportOwner].kosten+=value;
  legacy.stats.konto[cfg.station].erloes+=value;
  audit(w,legacy);
  const old=w.save(legacy),oldHash=w.hash(legacy),q=w.load(old);
  assert.equal(w.save(q),old);
  assert.equal(q.w3.auftrag.npcErzReserviert,undefined);
  assert.equal(q.kanon.industrieErz.erzAngenommen,true);
  w.minute(q);
  assert.equal(q.w3.auftrag.phase,'vorbestellt');
  assert.equal(q.w3.auftrag.npcErzReserviert,undefined);
  assert.equal(q.ships.sh002.ladung.erz??0,0);
  assert.equal(q.w3.geliefert,0);
  audit(w,q);
  const bad=JSON.parse(old);bad.w3.auftrag.npcErzReserviert=50;
  assert.throws(()=>w.load(JSON.stringify(bad)));
  console.log('W_20261127_03_LEGACY_BOUNDARY',JSON.stringify({hash:oldHash,
    pinnedHistoricalHash:'61c7c97961fad4ac',matchesPinned:oldHash==='61c7c97961fad4ac',
    tick:legacy.tick,ore:legacy.stations.st_aldera.lager.erz,unchanged:true,
    scope:'independent compatibility fixture; no real user save overwritten'}));
});

// Separate dynamic 60-day strategies. The exact diagnostic path above is
// pinned; these controls deliberately do not assume the post-fix stop/hash.
const Manager=require('../prototypes/spiel/p3-manager-disposition.js');
const DAY=1440,LIMIT=60*DAY;
function quote(j){
  const before=j.exportieren(),offers=j.angebote(),p=Manager.auswerten(j.weltReferenz(),j.zustandReferenz(),offers);
  assert.equal(j.exportieren(),before);return {offers,p};
}
function deny(j,id){const old=j.exportieren(),r=j.ausfuehren(id);
  assert.equal(r.ok,false);assert.equal(j.exportieren(),old);return r.reason;}
test('NPC ore: independent standard and S02 manager strategies to day60 or observed stop', {timeout:25*60*1000},()=>{
  function run(s02){
    let j=start(s02),initial=j.exportieren();
    const events=[],saves=new Map(),reports=[];
    const check=j=>{const s=j.zustandReferenz();audit(j.weltReferenz(),s);return s;};
    function checkpoint(label){
      const json=j.exportieren();saves.set(events.length,json);j=managerOpen(json);
      const s=check(j),w=j.weltReferenz(),b=w.bericht(s),p=quote(j).p;
      const row={label,tick:s.tick,hash:w.hash(s),house:s.owners.house.cash,
        trips:p.frachtAbgeschlossen,fees:p.frachtGebuehrBisher,wages:p.frachtLohnBisher,
        w3:s.w3.abgeschlossen,w4:s.w4.abgeschlossen,w5:s.w5.fertig,
        industry:s.kanon.industrieErz,active:s.w3.auftrag,worldMoney:b.weltgeld,bound:b.gebunden,
        warehouse:{aldera:s.stations.st_aldera.lager,nadir:s.stations.st_nadir.lager}};
      reports.push(JSON.parse(JSON.stringify(row)));return row;
    }
    function act(id,reason){
      const tick=j.zustandReferenz().tick,old=j.exportieren();
      const r=j.ausfuehren(id);assert.equal(r.ok,true,id+': '+r.reason);
      assert.notEqual(j.exportieren(),old);check(j);events.push({tick,id,reason});
    }
    function advance(minutes){j.weiterspielen(minutes);events.push({minutes});}
    let outcome;
    if(s02){
      for(let i=0;i<5;i++)advance(60);
      act('buy-st_nadir-frachter','real W5 hull from initial NPC production');
      const fr=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='frachter').id;
      act('reposition-'+fr,'paid original transfer');
      advance(60);
      act('buy-st_aldera-miner','one productive miner');
      const mi=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner').id;
      act('ice-'+mi,'original funded ice shuttle');
      advance(60);advance(60);
      checkpoint('first-ice-supply');
      let lastRevenue=j.zustandReferenz().stats.konto.house.erloes,
        lastIncome=j.zustandReferenz().tick,lastDecision=lastIncome,lastFreight=0,
        stopped=null,lastDay=0;
      const replacementFerries=[],blockedFerries=new Set();
      while(j.zustandReferenz().tick<LIMIT){
        const s=check(j),w=j.weltReferenz(),tick=s.tick,{offers,p}=quote(j);
        if(s.stats.konto.house.erloes>lastRevenue){lastRevenue=s.stats.konto.house.erloes;lastIncome=tick;}
        if(p.frachtAbgeschlossen>lastFreight){
          lastFreight=p.frachtAbgeschlossen;
          if(lastFreight===1)checkpoint('first-paid-house-F4');
        }
        const available=id=>offers.find(o=>o.id===id&&o.ok);
        const own=Object.values(s.ships).filter(sh=>sh.owner==='house'&&!w.stillgelegt(s,sh.id));
        const carriers=own.filter(sh=>sh.klasse==='frachter');
        const miners=own.filter(sh=>sh.klasse==='miner'&&sh.system==='aldera');
        const activeMiner=miners.some(sh=>s.kanon.pendel[sh.id]&&!s.kanon.pendel[sh.id].beenden);
        const freight=offers.find(o=>o.ok&&o.id.startsWith('freight-'));
        const capable=carriers.some(sh=>sh.system==='aldera'&&(w.restAktivminuten(s,sh.id)??Infinity)>=120);
        const buyerReady=p.eisFrei>=p.eisCharge&&p.nadirKasse>=p.nadirFrachtbedarf
          &&p.hausKasse>=p.frachtLohnbedarf;
        const sourceReady=p.eisLager>=p.eisCharge||p.alderaKasse>=p.ankaufKosten;
        let acted=false;
        // A replacement bought for a genuinely financed route is an existing
        // asset, not a fresh speculative purchase. Its paid ferry need NOT
        // coincide with 50 free ice slots in Nadir. The old audit mistakenly
        // required buyerReady/sourceReady at the ferry decision as well.
        const pending=carriers.filter(sh=>sh.system==='nadir'&&s.w5.schiffIds.includes(sh.id)
          &&!s.w5ac.completed.some(t=>t.id===sh.id));
        const pendingOffer=offers.find(o=>o.ok&&pending.some(sh=>o.id==='reposition-'+sh.id));
        for(const sh of pending){
          const o=offers.find(o=>o.id==='reposition-'+sh.id);
          if(o&&!o.ok&&!blockedFerries.has(sh.id)){
            assert.equal(deny(j,o.id),o.reason);
            blockedFerries.add(sh.id);
            console.log('M4_MANAGEMENT_60D_S02_FERRY_BLOCKED',JSON.stringify({tick,id:sh.id,reason:o.reason,
              w3:s.w3.auftrag,w5n:s.w5n.frachtauftrag,w5ac:s.w5ac.active}));
          }
        }
        if(pendingOffer&&p.hausKasse>=pendingOffer.kosten+p.frachtLohnbedarf){
          assert.deepEqual([pendingOffer.kosten,pendingOffer.minuten],[60,60]);
          const id=pendingOffer.id.slice(11),cash=s.owners.house.cash;
          act(pendingOffer.id,'deploy already purchased replacement at first observed legal paid ferry window');
          const paid=check(j);
          assert.equal(paid.owners.house.cash,cash-60);
          assert.equal(paid.w5ac.active?.id,id);
          assert.equal(paid.w5ac.active?.owner,'house');
          replacementFerries.push({id,start:tick,cost:60,buyerReady,sourceReady});
          checkpoint('replacement-ferry-paid-'+id);
          acted=true;
        }else if(freight){
          act(freight.id,'accept actually funded house F4 with available original hull');
          acted=true;
        }else if(!capable&&!p.frachtOffen&&buyerReady&&sourceReady){
          if(!carriers.some(sh=>sh.system==='nadir')&&!s.w5ac.active){
            // Only a needed replacement, not speculative purchase of all output.
            const buy=available('buy-st_aldera-frachter')||available('buy-st_nadir-frachter');
            if(buy){
              const need=(buy.kaufPlan?.kaufpreis??w.rules.economy.waren.frachter.basis)
                +(buy.id.includes('nadir')?(buy.kaufPlan?.ueberfuehrung?.kosten??60):0)
                +p.frachtLohnbedarf;
              if(p.hausKasse>=need){
                act(buy.id,'replace exhausted productive carrier only while route is financed');
                checkpoint('replacement-purchase');
                acted=true;
              }
            }
          }
        }
        if(!acted&&!activeMiner&&buyerReady&&p.eisLager<p.eisCharge&&p.alderaKasse>=p.ankaufKosten){
          const ice=offers.find(o=>o.ok&&o.id.startsWith('ice-'));
          if(ice){act(ice.id,'restart ice supply using existing hull');acted=true;}
          else if(!miners.length&&available('buy-st_aldera-miner')&&capable){
            act('buy-st_aldera-miner','replace exhausted ice miner for funded operating route');acted=true;
          }
        }
        if(!acted&&!activeMiner){
          const ore=offers.find(o=>o.ok&&o.id.startsWith('ore-'));
          if(ore&&p.erzExportKasse>=p.erzKosten){act(ore.id,'real local ore alternative when export and source are funded');acted=true;}
        }
        if(acted)lastDecision=tick;
        if(!acted&&!p.frachtOffen&&tick-Math.max(lastIncome,lastDecision)>=DAY){
          const pause=offers.find(o=>o.ok&&o.id.startsWith('stop-')
            &&!s.kanon.pendel[o.id.slice(5)]?.beenden);
          if(pause){act(pause.id,'stop unproductive duty after a day without receipts or orders');checkpoint('cost-control');}
        }
        // NPCs can resume trade independently; allow seven full days of observation
        // after last paid receipt / new order before calling this strategy stopped.
        if(!acted&&!p.frachtOffen&&!s.w5ac.active&&
          tick-Math.max(lastIncome,lastDecision)>=7*DAY&&
          !miners.some(sh=>s.kanon.pendel[sh.id]&&!s.kanon.pendel[sh.id].beenden)){
          stopped={tick,lastIncome,lastDecision,reason:'seven days without receipt or new funded productive decision, no active house freight'};
          break;
        }
        // Use normal 10-minute manager steps while awaiting a free global
        // transfer slot. Do not skip a newly purchased hull's first quote.
        const step=p.frachtOffen||acted||s.w5ac.active?60:10,remain=LIMIT-tick;
        advance(remain>=step?step:remain>=10?10:1);
        const day=Math.floor(j.zustandReferenz().tick/DAY);
        if(day>lastDay){lastDay=day;checkpoint('day-'+day);}
      }
    
      outcome=stopped??{tick:LIMIT,reason:'60 days observed'};
    }else{
      act('buy-st_aldera-miner','first productive asset');
      act('buy-st_aldera-frachter','real funded F4 carrier');
      act('ice-sh002','supply ice');
      advance(60);advance(60);
      act('freight-sh003','first paid F4');
      advance(60);advance(60);
      act('buy-st_aldera-miner','diversify with local W1 ore after first round');
      const extra=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner'&&sh.id!=='sh002');
      act('ore-'+extra.id,'original funded local ore sale');
      let lastRevenue=j.zustandReferenz().stats.konto.house.erloes,
        lastIncomeTick=j.zustandReferenz().tick,lastRestartTick=lastIncomeTick,pauseTick=null;
      while(j.zustandReferenz().tick<LIMIT){
        const s=j.zustandReferenz(),tick=s.tick,rev=s.stats.konto.house.erloes;
        if(rev>lastRevenue){lastRevenue=rev;lastIncomeTick=tick;pauseTick=null;}
        const {offers,p}=quote(j),f=offers.find(x=>x.id==='freight-sh003');
        if(!p.frachtOffen&&f?.ok){
          act(f.id,'continue legal paid ice transport');
          if(pauseTick!==null){pauseTick=null;lastRestartTick=tick;}
        }
        if(tick-Math.max(lastIncomeTick,lastRestartTick)>=DAY&&pauseTick===null&&!p.frachtOffen&&!f?.ok){
          pauseTick=tick;
          for(const o of j.angebote().filter(x=>x.ok&&x.id.startsWith('stop-')))
            if(!j.zustandReferenz().kanon.pendel[o.id.slice(5)]?.beenden)act(o.id,'pause loss-making duty');
          checkpoint('cost-control');
        }
        if(pauseTick!==null){
          const fresh=quote(j),pp=fresh.p,ore=fresh.offers.find(o=>o.ok&&o.id.startsWith('ore-')),
            ice=fresh.offers.find(o=>o.ok&&o.id.startsWith('ice-')),
            freight=fresh.offers.find(o=>o.ok&&o.id.startsWith('freight-'));
          if(ore&&pp.erzExportKasse>=pp.erzKosten){act(ore.id,'funded ore restart');pauseTick=null;lastRestartTick=tick;}
          else if(ice&&!freight&&pp.eisLager<pp.eisCharge&&pp.eisFrei>=pp.eisCharge
            &&pp.alderaKasse>=pp.ankaufKosten&&pp.nadirKasse>=pp.nadirFrachtbedarf&&pp.hausKasse>=pp.frachtLohnbedarf){
            act(ice.id,'funded ice restart');pauseTick=null;lastRestartTick=tick;
          }else if(freight){pauseTick=null;lastRestartTick=tick;}
          else if(tick-pauseTick>=2*DAY){outcome={tick,reason:'observed W1/F4 strategy stop',offers:fresh.offers};break;}
        }
        advance(60);
        if(j.zustandReferenz().tick%DAY===0)checkpoint('daily');
      }
      outcome??={tick:LIMIT,reason:'60 days observed'};
    }
    const final=checkpoint('final'),target=j.exportieren();
    assert.equal(final.tick,outcome.tick);
    assert.ok(final.trips>=1);
    assert.equal(final.fees,final.trips*240);assert.equal(final.wages,final.trips*120);
    const replay=start(s02);assert.equal(replay.exportieren(),initial);
    let q=replay;
    for(let n=0;n<events.length;n++){
      const e=events[n];
      if(e.id){assert.equal(q.zustandReferenz().tick,e.tick);assert.equal(q.ausfuehren(e.id).ok,true,e.id);}
      else q.weiterspielen(e.minutes);
      if(saves.has(n+1)){assert.equal(q.exportieren(),saves.get(n+1));q=managerOpen(q.exportieren());}
    }
    assert.equal(q.exportieren(),target);
    console.log('W_20261127_03_MANAGER',JSON.stringify({profile:s02?'S02':'standard',outcome,
      final,checkpoints:reports,actions:events.filter(e=>e.id),replay:true,
      scope:'one need-based strategy per profile, no rescue, no NPC commands, no standard pass through opt-in'}));
  }
  run(false);run(true);
});
