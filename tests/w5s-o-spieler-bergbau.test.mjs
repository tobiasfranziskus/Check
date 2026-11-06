import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
 html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const r={...api.W5R_RULES,w5s:{minerIndustry:true,concurrent:true,autoIndustry:true,
 autoOre:true,autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,
 autoLeadDays:2,retainFleetEarnings:true,carrierWorkingCapital:true,
 autoOreSettlement:true,autoTakeover:true}};
test('W5s-o: Spieler kauft echten Miner, foerdert bezahltes Erz und bietet W3-Fracht',()=>{
 const s=api.createW5RState(42,'full','npc3');
 for(let d=1;d<=60;d++)api.advance(s,1440,r);
 assert.equal(api.audit(s).ok,true);
 assert.ok(s.w5s?.takeover);
 const cash=s.owners.house.cash,ore=s.w3.abgeschlossen,merchant=s.w5h.bestand;
 const buy=api.execute(s,{type:'shipBuy',owner:'house',
   station:'st_aldera',klasse:'miner'},r);
 const sh=Object.values(s.ships).filter(x=>x.owner==='house'&&x.klasse==='miner').at(-1);
 assert.equal(buy.ok,true,'echter bezahlter Spieler-Minerkauf');
 assert.ok(sh);
 const mine=api.execute(s,{type:'shipMine',owner:'house',schiff:sh.id,ware:'erz'},r);
 assert.equal(mine.ok,true,'neues Erz nur mit echter Arbeitsförderung');
 let started=false,paidAt=null,third=null,candidateErrors={};
 for(let minute=1;minute<=20*1440;minute++){
   if(!started&&s.w5h.bestand>=50 && !s.w3.auftrag){
     for(const carrier of Object.values(s.ships).filter(x=>
       x.owner==='transport'&&x.klasse==='frachter'&&x.phase==='dock')){
       const res=api.execute(s,{type:'shipFreight',owner:'transport',schiff:carrier.id},r);
       if(res.ok){started=true;break;}
       candidateErrors[res.reason]=(candidateErrors[res.reason]||0)+1;
     }
   }
   api.advance(s,1,r);
   if(s.w3.abgeschlossen>ore&&third===null)third=minute;
   if(s.w5s.takeover.dividends>0&&paidAt===null)paidAt=minute;
   if(minute%1440===0){
     const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
     assert.equal(a.ok,true,'Tag '+(60+minute/1440));
     assert.equal(f.ok,true);
     console.log('W5S_O_PLAYER '+JSON.stringify({day:60+minute/1440,
       raw:s.ledger.erz.mined,oreBefore:ore,oreTrips:s.w3.abgeschlossen,
       third,started,paidAt,merchantOre:s.w5h.bestand,
       stationOre:s.stations.st_aldera.lager.erz,
       sh:sh.ladung,shipJob:sh.auftrag,customer:s.owners.st_nadir.cash,
       investor:f.takeover,freight:f.continuity,
       playerCash:s.owners.house.cash,
       candidateErrors:Object.keys(candidateErrors).slice(0,3)}));
   }
   if(third!==null&&paidAt!==null)break;
 }
 console.log('W5S_O_PLAYER_SUMMARY '+JSON.stringify({purchase:buy,mine,
   initialCash:cash,finalCash:s.owners.house.cash,
   oreBefore:ore,oreTrips:s.w3.abgeschlossen,initialMerchant:merchant,
   merchant:s.w5h.bestand,started,third,paidAt,candidateErrors,
   investor:s.w5s.takeover.dividends}));
 assert.equal(s.minted,0);
 assert.equal(api.audit(s).ok,true);
});
