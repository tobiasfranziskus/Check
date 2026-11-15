// J10b: Original-funded test fixture. No grant, free ship, test-only engine rule,
// unsigned NPC action or canned state. Each company acts through its own Core owner.
'use strict';
const W=require('../prototypes/welt/welt-kern.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
function erzeugen(besteller='house'){
 if(!['house','npc3'].includes(besteller))throw Error('Invalid K2 buyer');
 const original=OLD.create(42,'private195').export();
 const session=J8.erstellen();session.starten195(original,true);
 const welt=session.weltReferenz(),s=welt.load(session.exportieren());
 const execute=cmd=>{
  const result=welt.execute(s,cmd);
  if(!result.ok)throw Error('Core rejected '+JSON.stringify({cmd,result}));
  const audit=welt.audit(s);
  if(!audit.ok)throw Error('Audit after '+cmd.type+' '+audit.fehler.join('; '));
 };
 const advanceUntil=(predicate,max=800)=>{
  for(let n=0;n<max;n++){
   if(predicate())return;
   welt.minute(s);
   const audit=welt.audit(s);
   if(!audit.ok)throw Error('Minute '+s.tick+': '+audit.fehler.join('; '));
  }
  throw Error('Original economic duration exceeded '+max+' minutes');
 };
 execute({type:'shipBuy',owner:'transport',station:'st_aldera',klasse:'frachter'});
 const miner=Object.values(s.ships).find(sh=>sh.owner==='npc3'&&sh.klasse==='miner');
 const frachter=Object.values(s.ships).find(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
 if(!miner||!frachter)throw Error('Missing physical original K7 assets');
 execute({type:'industrialOreOffer',owner:'st_nadir',miner:miner.id,frachter:frachter.id});
 for(const [owner,type] of [['npc3','industrialOreAcceptMine'],
  ['transport','industrialOreAcceptFreight'],['werft_extern','industrialOreAcceptYard'],
  ['st_nadir','industrialOreCommit']])execute({type,owner});
 advanceUntil(()=>s.w3.auftrag?.phase==='rueck');
 execute({type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 advanceUntil(()=>!s.w4.auftrag,100);
 execute({type:'industrialOreBuildShip',owner:'werft_extern'});
 advanceUntil(()=>!s.w5.auftrag&&!s.w3.auftrag,300);
 execute({type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 advanceUntil(()=>!s.w4.auftrag,100);
 // The old K2 rule disallows local build while the old sellable Aldera
 // miner inventory remains. Sell it via *real owner-paid purchases* first.
 const ald=s.stations.st_aldera.lager.miner||0;
 for(let i=0;i<ald;i++)execute({type:'shipBuy',owner:i===0?'house':'npc3',
   station:'st_aldera',klasse:'miner'});
 execute({type:'stationBuildMiner',owner:'werft_extern',
  station:'st_nadir',besteller});
 advanceUntil(()=>!s.kanon.minerWerft.auftrag,100);
 if(s.kanon.minerWerft.wartetAuf!==besteller
   ||s.stations.st_nadir.lager.miner!==1
   ||s.kanon.jaeger.fertig!==0)
  throw Error('No physically paid, registered K2 hull');
 const money=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
 if(money!==33000||s.minted!==0||s.burned!==0)throw Error('Money audit');
 if(OLD.create(42,'private195').export()!==original)throw Error('Source mutated');
 return Object.freeze({original,save:welt.save(s),
  hash:welt.hash(s),tick:s.tick,besteller,houseCash:s.owners.house.cash,
  purchasePrice:welt.rules.economy.waren.miner.basis});
}
module.exports={erzeugen};
