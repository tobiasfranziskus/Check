'use strict';
// Use the same management commands in both arms. Only the opt-in arm can
// receive and sign the house offer. Economic policy and starting assets match.
const assert=require('node:assert/strict');
const {SZENARIEN,start,pruefen}=require('../tools/w6-szenarien.cjs');
const J8=require('../prototypes/verbund/konzern-session.js');

function lauf(szenario,tage,hausErz) {
 const quelle=start(szenario.politik);
 const json=quelle.welt.save(quelle.s);
 const sitzung=J8.erstellen();
 if(hausErz)sitzung.oeffnenHausErz(json,true,'kopie');
 else sitzung.oeffnen204(json,true);
 const w=sitzung.weltReferenz(),s=sitzung.zustandReferenz();
 const befehl=(type,args)=>w.execute(s,{type,owner:'house',...args});
 assert.ok(befehl('shipBuy',{station:'st_aldera',klasse:'frachter'}).ok);
 assert.ok(befehl('shipBuy',{station:'st_aldera',klasse:'miner'}).ok);
 const verlauf=[],grenzen=new Set([7,30,90,365,tage].filter(t=>t<=tage).map(t=>t*1440));
 let signiert=0,verworfen=0,bezahlt=0;
 while(s.tick<tage*1440){
  const i=s.kanon.industrieErz;
  if(hausErz&&i.phase==='angebot'&&i.carrier==='house'&&!i.signFracht){
   if(befehl('industrialOreAcceptFreight',{kennung:i.kennung}).ok)signiert++;
   else verworfen++;
  }else if(s.tick%60===0){
   const eigene=Object.values(s.ships).filter(sh=>sh.owner==='house'&&!w.stillgelegt(s,sh.id));
   const frachter=eigene.filter(sh=>sh.klasse==='frachter');
   const nadir=frachter.find(sh=>sh.system==='nadir'&&s.w5.schiffIds.includes(sh.id));
   if(nadir)befehl('shipReposition',{schiff:nadir.id});
   if(frachter.length<2&&s.stations.st_nadir.lager.frachter>0)
     befehl('shipBuy',{station:'st_nadir',klasse:'frachter'});
   if(frachter.length===0&&s.stations.st_aldera.lager.frachter>0)
     befehl('shipBuy',{station:'st_aldera',klasse:'frachter'});
   const miner=eigene.find(sh=>sh.klasse==='miner');
   if(!miner&&s.stations.st_aldera.lager.miner>0)befehl('shipBuy',{station:'st_aldera',klasse:'miner'});
   if(miner&&!s.kanon.pendel[miner.id]&&miner.flug.lage==='angedockt')
     befehl('shipShuttle',{schiff:miner.id,ware:'eis'});
   if(!s.w3.auftrag||s.w3.auftrag.carrier==='house'){
     const frei=frachter.find(sh=>sh.system==='aldera'&&sh.flug.lage==='angedockt'
       &&sh.id!==s.w3.auftrag?.schiff);
     if(frei)befehl('shipFreightIce',{schiff:frei.id});
   }
  }
  w.minute(s);
  const a=s.w3.auftrag,v=s.kanon.industrieErz;
  if(a?.carrier==='house'){
   bezahlt++;
   assert.ok(s.tick-v.erstellt<=360,
     'Haus-W3 länger als Vorschau '+JSON.stringify({tick:s.tick,phase:a.phase,
       id:v.kennung,ladung:s.ships[a.industrieMiner].ladung,
       rest:w.restAktivminuten(s,a.industrieMiner),geld:w.bericht(s).gebunden}));
  }
  if(grenzen.has(s.tick)){
   assert.deepEqual(pruefen(w,s),[]);
   const save=w.save(s);
   assert.equal(w.save(w.load(save)),save);
   verlauf.push({tag:s.tick/1440,hash:w.hash(s),weltgeld:w.bericht(s).weltgeld,
     gebunden:w.bericht(s).gebunden,hausFrachten:s.w5ad.freight.filter(x=>x.owner==='house').length,
     frachter:s.w5.fertig,k7Phase:v.phase,aktiverVertrag:a?{
       carrier:a.carrier??'transport',phase:a.phase,miner:a.industrieMiner,
       erz:s.ships[a.industrieMiner]?.ladung.erz??0
     }:null});
  }
 }
 assert.equal(quelle.welt.save(quelle.s),json);
 return {szenario:szenario.id,profil:hausErz?'haus':'kontrolle',signiert,verworfen,bezahlteMinuten:bezahlt,verlauf};
}
if(require.main===module){
 const [auswahl='alle',dauer='90']=process.argv.slice(2);
 const sz=SZENARIEN.filter(x=>auswahl==='alle'||auswahl===x.id);
 const tage=Number(dauer);
 assert.ok(sz.length&&Number.isSafeInteger(tage)&&tage>0);
 for(const s of sz)for(const hausErz of [false,true])
   console.log(JSON.stringify(lauf(s,tage,hausErz)));
}
