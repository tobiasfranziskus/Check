// Read-only Ursachenprüfung der am Tag 90 aktivierten Gegenversuche.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {coreSource,engine,independentAudit} from './longterm-v12-observer.mjs';
const dir=process.argv[2]||'work/rueckfluss';
const {c,r}=engine(coreSource(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8')));
const exp=structuredClone(r);exp.world.npcAusgabenArten.push('player');
for(const filename of ['miner-42-ab90.json','station-1234-ab90.json']){
 const row=JSON.parse(fs.readFileSync(path.join(dir,filename),'utf8')),variant=row.variants[1],state=c.createState(row.seed),byTick=new Map();
 for(const cmd of row.tape){if(!byTick.has(cmd.tick))byTick.set(cmd.tick,[]);byTick.get(cmd.tick).push(cmd);}
 for(let tick=1;tick<=row.days*1440;tick++){
  const rules=tick<=row.switchDay*1440?r:exp;
  for(const {tick:_,...cmd} of byTick.get(tick)||[])c.submit(state,cmd,rules);
  c.step(state,rules);
  if(tick%60===0){assert(c.audit(state).ok);independentAudit(state);}
 }
 assert.equal(c.hash(state),variant.points.at(-1).hash,'Postmortem muss gemessenen Endzustand exakt reproduzieren');
 const shipClass='frachter',werft=exp.world.werft,fund=exp.world.systems[state.stations[werft].system].fonds,
  price=c.preis(state,werft,shipClass,exp),fee=c.gebuehr(state,exp,werft,price),need=price+fee;
 const before=c.hash(state),copy=c.load(c.save(state),undefined,exp);
 const subsidies=Object.fromEntries(['npc1','npc2'].map(owner=>{
  const test=c.load(c.save(state),undefined,exp),received=c.zuschuss(test,exp,owner,need);
  independentAudit(test);assert(c.audit(test).ok);return [owner,{cash:state.owners[owner].cash,received,shortfall:Math.max(0,need-state.owners[owner].cash-state.owners[fund].cash)}];
 }));
 c.ersatzkauf(copy,exp);independentAudit(copy);assert(c.audit(copy).ok);assert.equal(c.hash(state),before);
 const result={sourceCommit:row.sourceCommit,codeSha256:row.codeSha256,seed:row.seed,scenario:row.scenario,hash:c.hash(state),
  werft,fund,fundCash:state.owners[fund].cash,funds:Object.fromEntries(Object.values(state.owners).filter(o=>o.kind==='fund').map(o=>[o.id,o.cash])),
  shipClass,stock:state.stations[werft].lager[shipClass]||0,price,fee,need,subsidies,
  traderFleetsBefore:Object.fromEntries(['npc1','npc2'].map(id=>[id,Object.values(state.ships).filter(sh=>sh.owner===id).length])),
  traderFleetsAfterClonePurchase:Object.fromEntries(['npc1','npc2'].map(id=>[id,Object.values(copy.ships).filter(sh=>sh.owner===id).length])),
  hullProductionInputs:state.stations[werft].linien.filter(l=>l.rezept==='r_frachter').map(l=>({rest:l.rest,inputs:Object.fromEntries(Object.entries(exp.economy.rezepte[l.rezept].ein).map(([w,required])=>[w,{required,stock:state.stations[werft].lager[w]||0}]))}))};
 fs.writeFileSync(path.join(dir,'postmortem-'+row.scenario+'.json'),JSON.stringify(result)+'\n');console.log('REFLUX_POSTMORTEM '+JSON.stringify(result));
}
