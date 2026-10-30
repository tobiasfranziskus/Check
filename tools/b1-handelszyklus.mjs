// B1: Analyse gegen unveränderten Produktionskern; keine Testregel/Finanzspritze.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const PIN='6855d76bb374dd777a1b7e30ea52c9a6eca36399';
const args=process.argv.slice(2),opt=(k,d)=>args.find(x=>x.startsWith('--'+k+'='))?.split('=').slice(1).join('=')??d;
assert(args.every(x=>/^--(starts|out|evidence)=/.test(x)));
const starts=opt('starts','/tmp/b1-start'),out=opt('out','/tmp/b1-result.json');
const evidenceDir=opt('evidence','/tmp/b1-evidence');
const readGit=p=>fs.readFileSync(path.join(evidenceDir,p),'utf8');
const observerSource=readGit('tools/longterm-v12-observer.mjs');
const {engine,coreSource,Observer,independentAudit,sum}=await import('data:text/javascript;base64,'+Buffer.from(observerSource).toString('base64'));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),src=coreSource(html),plain=engine(src),{c,r}=plain;
const sha=t=>createHash('sha256').update(t).digest('hex');
assert.equal(sha(html),'5e842417c5b05e057ad26499659089060ac96ddda913e38922886b1c54ff3653');
assert.equal(sha(observerSource),'6f5c2a2a0e16b47a63160889d425250d6c37a651673cfdd83a63824d943eaee0');
assert.equal(sha(readGit('docs/data/npc-wiederanlauf-v12.json')),'a9b958275f419e07bf67b598b4b15f005f4f19aa587edb5665f7615f8506982e');
const evidence=JSON.parse(readGit('docs/data/npc-wiederanlauf-v12.json'));
const snapshot=s=>({tick:s.tick,hash:c.hash(s),cash:Object.fromEntries(Object.entries(s.owners).map(([k,v])=>[k,v.cash])),stocks:Object.fromEntries(Object.entries(s.stations).map(([k,v])=>[k,v.lager])),ledger:s.ledger,ships:s.ships});
function offers(s){
 const a=[];
 for(const from of Object.keys(s.stations).sort())for(const to of Object.keys(s.stations).sort()){
  if(from===to)continue;
  const trip=c.route(r.world,s.stations[from].system,s.stations[to].system),approach=c.route(r.world,'aldera',s.stations[from].system);
  if(!trip||!approach)continue;
  for(const ware of Object.keys(r.economy.waren).sort()){
   const p=c.preis(s,from,ware,r),z=c.preis(s,to,ware,r);if(!p||!z)continue;
   const max=Math.min(100,c.verkaufbar(s,r,from,ware),c.aufnehmbar(s,r,to,ware));
   for(let q=1;q<=max;q++){
    const buy=q*p,fb=c.gebuehr(s,r,from,buy),sell=q*z,fsale=c.gebuehr(s,r,to,sell);
    const operating=Math.ceil(250*(approach.zeit+2*trip.zeit)/60),margin=sell-fsale-buy-fb,net=margin-operating;
    if(net>0)a.push({from,to,ware,q,buy,buyFee:fb,sell,sellFee:fsale,margin,operating,net,approach:approach.zeit,oneWay:trip.zeit,hull:c.preis(s,r.world.werft,'frachter',r)+c.gebuehr(s,r,r.world.werft,c.preis(s,r.world.werft,'frachter',r)),cashNeed:buy+fb+operating});
   }
  }
 }
 return {count:a.length,leastFunding:a.sort((x,y)=>x.cashNeed-y.cashNeed||y.net-x.net).slice(0,8),bestNet:[...a].sort((x,y)=>y.net-x.net||x.cashNeed-y.cashNeed).slice(0,8),materials:a.filter(x=>['silizium','bauteil'].includes(x.ware)&&x.to==='st_aldera').slice(0,8)};
}
class Watch extends Observer{
 constructor(s){super(s);this.s=s;this.events=[];for(const [w,l]of Object.entries(s.ledger))this.consumeRows['vor90/'+w]=l.consumed;}
 flow(kind,from,to,n){super.flow(kind,from,to,n);if(n)this.events.push({tick:this.s.tick,kind,from,to,n});}
 trade(s,ship,station,ware,n,buy,value,fee,recipient){super.trade(s,ship,station,ware,n,buy,value,fee,recipient);this.events.push({tick:s.tick,kind:'cargo',ship:ship.id,owner:ship.owner,station,ware,n,buy,value,fee,work:ship.arbeit,cash:s.owners[ship.owner].cash});}
 cost(s,ship,due,paid,system,rules){super.cost(s,ship,due,paid,system,rules);if(due)this.events.push({tick:s.tick,kind:'cost',ship:ship.id,owner:ship.owner,due,paid,system});}
 lost(ship){super.lost(ship);this.events.push({tick:this.s.tick,kind:'lost',ship:ship.id,owner:ship.owner,klasse:ship.klasse,cargo:structuredClone(ship.ladung)});}
}
function run(saved,mode){
 const s=c.load(saved),b=c.load(saved),w=new Watch(s),observed=engine(src,w).c,commands=[];
 const start=s.tick,initialCash=Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash]));let minCash={...initialCash},audits=0,hashes=[],checkpoints=[],stage=0,carrier=null,freighter=null;
 if(mode==='silizium-npc3')carrier=Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner'&&x.ladung.silizium>0).sort((a,b)=>(a.id<b.id?-1:a.id>b.id?1:0))[0]?.id;
 const command=cmd=>{const a=observed.submit(s,cmd,r),z=c.submit(b,cmd,r);assert.deepEqual(a,z);commands.push({tick:s.tick+1,cmd,result:a});return a.ok;};
 for(let t=1;t<=7*1440;t++){
  if(mode==='silizium-npc3'){
   const sh=s.ships[carrier];
   if(stage===0&&sh){command({owner:'npc3',type:'shipMove',schiff:carrier,ziel:'st_aldera'});stage=1;}
   else if(stage===1&&sh?.phase==='dock'&&sh.system==='aldera'){
    const ok=command({owner:'npc3',type:'shipTrade',schiff:carrier,ware:'frachter',menge:1,kauf:true});stage=ok?2:5;
   }else if(stage===2&&sh?.ladung.frachter){freighter='sh'+String(s.nextShip).padStart(3,'0');command({owner:'npc3',type:'shipActivate',schiff:carrier,klasse:'frachter'});stage=3;}
   else if(stage===3&&s.ships[freighter]){command({owner:'npc3',type:'shipHandeln',schiff:freighter});stage=4;}
  }
  const a=observed.step(s,r),z=c.step(b,r);assert.deepEqual(a,z);assert(a.every(x=>x.ok),'Befehlsausführung');for(const o of Object.values(s.owners))minCash[o.id]=Math.min(minCash[o.id],o.cash);
  if(s.tick%60===0){for(const state of [s,b]){assert(observed.audit(state).ok);independentAudit(state);audits++;}w.hourly(s,observed,r);assert.equal(observed.hash(s),c.hash(b));}
  if([64,119,174,180,194].includes(t))checkpoints.push({tick:s.tick,cash:s.owners.npc3.cash,ship:structuredClone(s.ships[freighter]??null),funds:Object.fromEntries(Object.values(s.owners).filter(o=>o.kind==='fund').map(o=>[o.id,o.cash]))});
  if(t%1440===0)hashes.push({day:t/1440,hash:c.hash(s)});
  if(t===1440||t===7*1440){const loaded=c.load(c.save(b));assert.equal(c.canonical(loaded),c.canonical(b));Object.assign(b,loaded);}
 }
 assert.equal(c.canonical(s),c.canonical(b));
 const flows=w.flows,delta=Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash-initialCash[id]]));
 const cargo=w.events.filter(e=>e.kind==='cargo'&&e.ship===freighter),cost=w.costs.npc3;
 return {mode,carrier,freighter,commands,initialCash,minCash,delta,hashes,checkpoints,audits,flows,costs:w.costs,production:w.production,events:w.events,freighterTrades:cargo,freighterSurvives:!!s.ships[freighter],finalFreighters:Object.fromEntries(['npc1','npc2','npc3'].map(o=>[o,Object.values(s.ships).filter(sh=>sh.owner===o&&sh.klasse==='frachter').length])),final:snapshot(s),netMinted:s.minted-c.load(saved).minted,netBurned:s.burned-c.load(saved).burned};
}
const cases=[];
for(const [scenario,seed]of [['miner',42],['handel-flotte',42],['station',1234],['jagd',98765]]){
 const input=JSON.parse(fs.readFileSync(path.join(starts,'start-'+scenario+'-'+seed+'.json'),'utf8')),s=c.load(input.save);
 assert.equal(c.hash(s),evidence.cases.find(x=>x.scenario===scenario).start.hash);independentAudit(s);assert(c.audit(s).ok);
 const sectors={};for(const o of Object.values(s.owners))sectors[o.kind]=(sectors[o.kind]||0)+o.cash;
 const controls=run(input.save,'control'),active=run(input.save,'silizium-npc3');
 cases.push({scenario,seed,start:snapshot(s),sectors,hull:input.diagnosis.totalPrice,offers:offers(s),control:controls,active});
 console.log(JSON.stringify({scenario,hash:c.hash(s),hull:input.diagnosis.totalPrice,sectors,offers:cases.at(-1).offers.leastFunding.slice(0,1),carrier:active.carrier,trades:active.freighterTrades.length,survives:active.freighterSurvives,cost:active.costs.npc3,delta:active.delta.npc3}));
}
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({basis:'ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f',evidence:PIN,codeSha256:sha(html),observerSha256:sha(observerSource),toolSha256:sha(fs.readFileSync(new URL(import.meta.url))),cases},null,2)+'\n');
console.log('B1_PASS '+out);

const compactRun=a=>({mode:a.mode,carrier:a.carrier,freighter:a.freighter,commands:a.commands,initialCash:a.initialCash,minCash:a.minCash,delta:a.delta,hashes:a.hashes,checkpoints:a.checkpoints,audits:a.audits,flows:a.flows,costs:a.costs,production:a.production,netMinted:a.netMinted,netBurned:a.netBurned,freighterSurvives:a.freighterSurvives,finalFreighters:a.finalFreighters,events:a.events.filter(e=>e.owner==='npc3'),final:{tick:a.final.tick,hash:a.final.hash,cash:a.final.cash,stocks:a.final.stocks,ledger:a.final.ledger}});
const compact={status:'ANALYSE: gemessene Daten, keine Golden-Fixture',basis:'ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f',evidence:PIN,codeSha256:sha(html),observerSha256:sha(observerSource),toolSha256:sha(fs.readFileSync(new URL(import.meta.url))),cases:cases.map(x=>({...x,control:compactRun(x.control),active:compactRun(x.active)}))};
fs.writeFileSync(out.replace(/\.json$/,'.summary.json'),JSON.stringify(compact)+'\n');
