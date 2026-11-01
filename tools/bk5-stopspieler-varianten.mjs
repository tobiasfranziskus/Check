// BK5 Gegenfaktische Spielerkrise: Spieler stoppt das aktive Mining
// nach 0/1/3/5/7 Tagen. Keine produktiven Verhaltensregeln!
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {c,r}=new Function(src+';return {c:m_core_index,r:m_data_rules.RULES};')();
assert.equal(r.rulesVersion,14);
const seeds=[7,42],stops=[0,1,3,5,7,90];
const sum=a=>a.reduce((n,x)=>n+x,0);
function snap(s,day,stopAt){
 const tradeHull=Object.values(s.ships).filter(sh=>(sh.owner==='npc1'||sh.owner==='npc2')&&sh.klasse==='frachter').length;
 const traders=s.owners.npc1.cash+s.owners.npc2.cash;
 const stationCash=sum(Object.values(s.owners).filter(o=>o.kind==='station').map(x=>x.cash));
 const fondsCash=sum(Object.values(s.owners).filter(o=>o.kind==='fund').map(x=>x.cash));
 const missing=sum(Object.values(s.stats.mangel).flatMap(x=>Object.values(x)));
 const food=sum(Object.values(s.stats.mangel).map(x=>x.nahrung||0));
 const med=sum(Object.values(s.stats.mangel).map(x=>x.medikamente||0));
 const totalCash=sum(Object.values(s.owners).map(x=>x.cash));
 return {day,stopAt,player:s.owners.house.cash,playerShare:Number((100*s.owners.house.cash/totalCash).toFixed(2)),
  traders,tradeHull,stationCash,fondsCash,missing,food,med,
  tradeEvents:s.stats.handel, minted:s.minted,burned:s.burned};
}
for(const seed of seeds){
 for(const stopAt of stops){
  const s=c.createState(seed,r);
  const sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert(sh);
  if(stopAt>0){
   const q=c.execute(s,{type:'shipMine',owner:'house',schiff:sh.id,ware:'erz'},r);
   assert(q.ok,q.reason);
  }
  for(let day=1;day<=90;day++){
   if(day===stopAt+1&&stopAt>0&&stopAt<90){
    const cmd=c.execute(s,{type:'shipWait',owner:'house',schiff:sh.id},r);
    assert(cmd.ok,cmd.reason);
   }
   c.advance(s,1440,r);
   if([1,3,5,7,14,30,90].includes(day)){
    assert(c.audit(s).ok);
    if([7,14,90].includes(day)){
     const snapPoint=snap(s,day,stopAt);
     console.log('BK5_STOP_MINING '+JSON.stringify({seed,...snapPoint}));
    }
   }
  }
  assert.equal(c.hash(c.load(c.save(s),undefined,r)),c.hash(s),'Save/Load '+seed+'/'+stopAt);
  const cash=sum(Object.values(s.owners).map(x=>x.cash));
  assert.equal(cash,s.initialSupply+s.minted-s.burned);
 }
}
console.log('BK5_STOP_MINING_DONE '+JSON.stringify({seeds,stops,days:90,
 comparison:'freiwilliges Aufhoeren als ANLAYSE, keine Spieler-Spargrenze, keine Produktmechanik'}));
