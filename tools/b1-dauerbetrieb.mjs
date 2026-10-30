// Ausschließlich Analyse: eine Entscheidungsfunktion im Testprozess, kein Produktpatch.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const arg=process.argv.slice(2),opt=(k,d)=>arg.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
assert(arg.every(x=>/^--(case|evidence|b1|starts|out)=/.test(x)));
const scenario=opt('case','miner'),seed={miner:42,'handel-flotte':42,station:1234,jagd:98765}[scenario];assert(seed);
const dir=opt('evidence','/tmp/b1-evidence'),b1dir=opt('b1','/tmp/follow-b1'),starts=opt('starts','/tmp/follow-start'),out=opt('out','/tmp/b1-dauer');
const sha=x=>createHash('sha256').update(x).digest('hex');
const observerText=fs.readFileSync(path.join(dir,'tools/longterm-v12-observer.mjs'),'utf8');
assert.equal(sha(observerText),'6f5c2a2a0e16b47a63160889d425250d6c37a651673cfdd83a63824d943eaee0');
const {engine,coreSource,Observer,independentAudit,sum}=await import('data:text/javascript;base64,'+Buffer.from(observerText).toString('base64'));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.equal(sha(html),'5e842417c5b05e057ad26499659089060ac96ddda913e38922886b1c54ff3653');
const src=coreSource(html),base=engine(src),r=base.r,c=base.c;
const b1=JSON.parse(fs.readFileSync(path.join(b1dir,'docs/data/b1-handelszyklus-v12.json'),'utf8')).cases.find(x=>x.scenario===scenario);
const input=JSON.parse(fs.readFileSync(path.join(starts,'start-'+scenario+'-'+seed+'.json'),'utf8'));
assert.equal(c.hash(c.load(input.save)),b1.start.hash);
const begin=src.indexOf('function bestesPaar('),end=src.indexOf('function besterAbsatz(',begin),original=src.slice(begin,end);
const modes=['control','operating','replacement'];
function variant(mode){
 if(mode==='control')return src;
 let fn=original.replace('let best = null;',`const pending = Object.values(state.ships).filter(x => x.owner === s.owner && x.auftrag !== 'halten').reduce((n,x) => n + Math.ceil((w.betriebskosten[x.klasse] || 0) * x.arbeit / rules.economy.stunde),0);
  const hullPrice = preis(state, w.werft, 'frachter', rules);
  const replacement = hullPrice + gebuehr(state, rules, w.werft, hullPrice);
  let best = null;`);
 fn=fn.replace('const pDort = preis(state, ziel, ware, rules);',`const pDort = preis(state, ziel, ware, rules);
      const cost = s.owner === 'npc3' ? Math.ceil(w.betriebskosten.frachter * (r.zeit + 1) / rules.economy.stunde) : 0;`);
 if(mode==='replacement')fn=fn.replace('bezahlbar(rules, station, kasse, pHier)',"bezahlbar(rules, station, s.owner === 'npc3' ? Math.max(0,kasse-pending-replacement-cost) : kasse, pHier)");
 fn=fn.replace('- gebuehr(state, rules, ziel, menge * pDort);','- gebuehr(state, rules, ziel, menge * pDort) - cost;');
 assert.notEqual(fn,original);const result=src.slice(0,begin)+fn+src.slice(end);assert.equal(result.replace(fn,original),src,'Nur bestesPaar darf abweichen');return result;
}
function instrument(text){
 const hook=(anchor,extra)=>{assert.equal(text.split(anchor).length,2,anchor);text=text.replace(anchor,anchor+'\n'+extra);};
 hook("s.phase = 'reise'; s.ziel = ziel; s.ankunft = state.tick + r.zeit; s.warten = 0;",'watch.depart(state,s,station,ziel,r,ware,menge);');
 hook("const e = kampf(state, seite(rules, verteidiger, 'schwach', 0), seite(rules, piraten, 'erste', 0), rules);",'watch.combat(state,ziel,piraten,e);');
 return text;
}
class Watch extends Observer{
 constructor(s){super(s);this.s=s;this.events=[];this.life=[];this.id=null;this.paid=0;this.due=0;this.lostCost=0;this.birth=null;this.death=null;this.totals={buy:0,buyFees:0,sell:0,sellFees:0,buys:0,sales:0,unitsBuy:0,unitsSell:0};for(const [w,l]of Object.entries(s.ledger))this.consumeRows['vor90/'+w]=l.consumed;}
 flow(kind,from,to,n){super.flow(kind,from,to,n);if(n&&[from,to].includes('npc3'))this.events.push({tick:this.s.tick,kind,from,to,n});}
 trade(s,ship,station,ware,n,buy,value,fee,recipient){
  super.trade(s,ship,station,ware,n,buy,value,fee,recipient);
  if(ship.owner==='npc3')this.events.push({tick:s.tick,kind:'trade',ship:ship.id,klasse:ship.klasse,station,ware,n,buy,value,fee,cash:s.owners.npc3.cash});
  if(ship.id===this.id){this.totals[buy?'buy':'sell']+=value;this.totals[buy?'buyFees':'sellFees']+=fee;this.totals[buy?'buys':'sales']++;this.totals[buy?'unitsBuy':'unitsSell']+=n;this.life.push({tick:s.tick,kind:'trade',station,ware,n,buy,value,fee,work:ship.arbeit,cash:s.owners.npc3.cash});}
 }
 cost(s,ship,due,paid,system,rules){super.cost(s,ship,due,paid,system,rules);if(ship.id===this.id&&due){this.due+=due;this.paid+=paid;this.life.push({tick:s.tick,kind:'cost',due,paid,system,cashBefore:s.owners.npc3.cash});}}
 depart(s,ship,station,ziel,route,ware,n){if(ship.id===this.id)this.life.push({tick:s.tick,kind:'departure',station,ziel,route:structuredClone(route),ware,n,cargo:structuredClone(ship.ladung),cash:s.owners.npc3.cash});}
 combat(s,ship,pirates,result){if(ship.id===this.id)this.life.push({tick:s.tick,kind:'combat',phase:ship.phase,originSystem:ship.system,target:ship.ziel,pirates:pirates.map(p=>({id:p.id,klasse:p.klasse})),cargo:structuredClone(ship.ladung),result:structuredClone(result),budget:budget(s,this.id)});}
 lost(ship){if(ship.id===this.id){this.death=this.s.tick;this.lostCost=sum([...this.inventory.entries()].filter(([k])=>k.startsWith(ship.id+'/')).flatMap(([,lots])=>lots.map(l=>l.n*l.unitCost)));this.life.push({tick:this.s.tick,kind:'loss',lostInventoryCost:this.lostCost,budget:budget(this.s,this.id)});}super.lost(ship);}
}
function budget(s,id){
 const price=cl=>c.preis(s,r.world.werft,cl,r),allIn=cl=>price(cl)+c.gebuehr(s,r,r.world.werft,price(cl));
 const ships=Object.values(s.ships).filter(sh=>sh.owner==='npc3');
 const counts={};for(const sh of ships){const k=[sh.klasse,sh.heimat,sh.ware].join('/');counts[k]=(counts[k]||0)+1;}
 let missing=0;for(const x of s.sollflotte.npc3){const k=[x.klasse,x.heimat,x.ware].join('/');if(counts[k]>0)counts[k]--;else missing++;}
 const pending=sum(ships.filter(sh=>sh.auftrag!=='halten').map(sh=>Math.floor((r.world.betriebskosten[sh.klasse]||0)*sh.arbeit/r.economy.stunde)));
 const minerReplacement=missing*allIn('miner'),reserve=r.world.ersatzRuecklage,hull=allIn('frachter');
 return {cash:s.owners.npc3.cash,miners:ships.filter(sh=>sh.klasse==='miner').length,missingMiners:missing,minerReplacement,pending,existingReserve:reserve,hull,hullStock:s.stations[r.world.werft].lager.frachter||0,freeAfterCommitments:s.owners.npc3.cash-pending-minerReplacement-reserve,extraHullGap:Math.max(0,hull+pending+minerReplacement+reserve-s.owners.npc3.cash),registeredFreighters:s.sollflotte.npc3.filter(x=>x.klasse==='frachter').length};
}
function run(mode){
 const source=variant(mode),plain=engine(source).c,s=c.load(input.save),w=new Watch(s),observed=engine(instrument(source),w).c;let replay=c.load(input.save);assert.deepEqual(engine(source).r,r);
 const start=s.tick,carrier=Object.values(s.ships).filter(sh=>sh.owner==='npc3'&&sh.ladung.silizium>0).sort((a,b)=>a.id<b.id?-1:1)[0].id;
 const commands=b1.active.commands.map(x=>({tick:x.tick,cmd:x.cmd}));let cmdIndex=0,audits=0,roundtrips=0,minCash=s.owners.npc3.cash,aliveHours=0,deficitHours=0,unfundedHullHours=0;const hashes=[],points=[],balances=[];
 const initialCash=s.owners.npc3.cash;
 for(let t=1;t<=275*1440;t++){
  while(commands[cmdIndex]?.tick===s.tick+1){const {cmd}=commands[cmdIndex++];assert(observed.submit(s,cmd,r).ok);assert(plain.submit(replay,cmd,r).ok);if(cmd.type==='shipActivate'){w.id='sh'+String(s.nextShip).padStart(3,'0');} }
  const aa=observed.step(s,r),bb=plain.step(replay,r);assert.deepEqual(aa,bb);assert(aa.every(x=>x.ok));
  if(w.id&&w.birth===null&&s.ships[w.id]){w.birth=s.tick;w.life.push({tick:s.tick,kind:'birth',ship:structuredClone(s.ships[w.id]),budget:budget(s,w.id)});}
  minCash=Math.min(minCash,s.owners.npc3.cash);
  if(s.tick%60===0){for(const state of [s,replay]){assert(observed.audit(state).ok);independentAudit(state);audits++;}w.hourly(s,observed,r);assert.equal(observed.hash(s),plain.hash(replay));const b=budget(s,w.id);if(s.ships[w.id])aliveHours++;if(b.freeAfterCommitments<0)deficitHours++;if(b.extraHullGap>0)unfundedHullHours++;balances.push({tick:s.tick,...b});}
  if(t%1440===0)hashes.push({day:t/1440,hash:observed.hash(s)});
  if(mode==='control'&&t===7*1440)assert.equal(observed.hash(s),b1.active.final.hash,'B1-Tag97 vollständig reproduziert');
  if([1,7,30,90,180,275].includes(t/1440)){
   assert.equal(observed.canonical(s),plain.canonical(replay));for(const st of [s,replay])assert.equal(plain.canonical(plain.load(plain.save(st))),plain.canonical(st));replay=plain.load(plain.save(replay));roundtrips+=2;
   const realizedMargin=sum(Object.entries(w.trades).filter(([k])=>k.startsWith('npc3/frachter/')).map(([,v])=>v.realizedMargin));
   points.push({day:t/1440,hash:observed.hash(s),alive:!!s.ships[w.id],budget:budget(s,w.id),minCash,totals:structuredClone(w.totals),paid:w.paid,due:w.due,realizedMargin,lostInventoryCost:w.lostCost,netOperating:realizedMargin-w.due-w.lostCost,companyDelta:s.owners.npc3.cash-initialCash,companyCosts:structuredClone(w.costs.npc3),flows:structuredClone(w.flows),sollflotte:structuredClone(s.sollflotte.npc3),finalCargo:s.ships[w.id]?.ladung??null});
  }
 }
 assert.equal(cmdIndex,commands.length);assert.equal(observed.canonical(s),plain.canonical(replay));
 return {mode,sourceSha256:sha(source),initialHash:c.hash(c.load(input.save)),birth:w.birth,death:w.death,id:w.id,carrier,commands,audits,roundtrips,aliveHours,deficitHours,unfundedHullHours,minCash,hashes,points,life:w.life,events:w.events,balances,finalCash:Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),netMinted:s.minted-c.load(input.save).minted,netBurned:s.burned-c.load(input.save).burned};
}
fs.mkdirSync(out,{recursive:true});const results=[];
for(const mode of modes){const x=run(mode);results.push(x);console.log('DURATION_CASE '+JSON.stringify({scenario,seed,mode,birth:x.birth,death:x.death,points:x.points.map(p=>({day:p.day,hash:p.hash,alive:p.alive,netOperating:p.netOperating,cash:p.budget.cash,unpaid:p.companyCosts.unpaid}))}));}
const result={basis:'ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f',b1:'cec7f93758e4a499c238738ff50adac4416080d4',evidence:'6855d76bb374dd777a1b7e30ea52c9a6eca36399',scenario,seed,toolSha256:sha(fs.readFileSync(new URL(import.meta.url))),codeSha256:sha(html),results};
fs.writeFileSync(path.join(out,scenario+'.json'),JSON.stringify(result)+'\n');console.log('DURATION_PASS '+scenario);
