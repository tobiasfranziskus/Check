// Standardkarriere, Seed 42. Erzeugt einen separaten Spielstand ausschließlich über Spielerbefehle.
'use strict';
const assert=require('node:assert/strict');
const J8=require('../prototypes/verbund/konzern-session.js');
const W5=require('../prototypes/w5ac/session.js');

function engpassNach48(){
 const j=J8.erstellen();
 j.starten195(W5.create(42,'private195').export(),true);
 const buchen=id=>{
  const ergebnis=j.ausfuehren(id);
  assert.equal(ergebnis.ok,true,id+': '+ergebnis.reason);
 };
 for(const id of ['buy-st_aldera-miner','buy-st_aldera-frachter','ice-sh002',
  'buy-st_aldera-miner','buy-st_aldera-miner','ore-sh004','ore-sh005'])buchen(id);
 let runden=0;
 while(runden<48&&j.zustandReferenz().tick<6300){
  const angebote=j.angebote();
  if(angebote.find(a=>a.id==='freight-sh003')?.ok){
   for(let i=0;i<(runden<41?10:3);i++){
    if(!j.ausfuehren('water-pilot-house-1').ok)break;
   }
   buchen('freight-sh003');
   j.weiterspielen(60);
   j.weiterspielen(60);
   runden++;
  }else{
   const wasser=angebote.find(a=>a.id==='water-pilot-house-bedarf');
   const fracht=angebote.find(a=>a.id==='freight-sh003');
   if(wasser?.ok&&fracht.reason.includes('Quelllager'))buchen(wasser.id);
   else j.weiterspielen(60);
  }
 }
 assert.equal(runden,48);
 assert.equal(j.ansicht().hash,'c036d8311aac8ba7');
 for(let i=0;i<6;i++)buchen('water-pilot-house-1');
 return j;
}

module.exports={engpassNach48};
