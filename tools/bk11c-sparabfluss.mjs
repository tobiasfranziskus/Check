// B-K11c [ANALYSE]: Sparabfluss-Intervention auf unverändertem main/Regel14.
// Entwicklungswerkzeug, keine Produktregel. Kein Geld wird erzeugt oder vernichtet.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {independentlyAudit} from './b5b-common.mjs';

const pinnedHtml='7ee2d3786dece413bcea7152b64ea7ed5218f2ec68c9001c10c0fe7f987e33f5';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const hash=x=>createHash('sha256').update(x).digest('hex');
assert.equal(hash(html),pinnedHtml,'nur gepinntes main b4e604d6; nicht auf Draft ausführen');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
assert(src.startsWith('const m_data_systeme =') && src.includes('const m_core_index ='));
const {core,rules}=new Function(src+'; return {core:m_core_index,rules:m_data_rules.RULES};')();
assert.equal(rules.schema,8);assert.equal(rules.rulesVersion,14);

const args=process.argv.slice(2);
assert(args.every(x=>/^--(scenario|mode|days|out)=/.test(x)));
const opt=(k,d)=>args.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const scenario=opt('scenario','miner'),mode=opt('mode','A');
const days=Number(opt('days','90')),out=opt('out','/tmp/bk11c-sparabfluss.json');
assert(['miner','handel-flotte'].includes(scenario));
assert(['A','B','C'].includes(mode));
assert(Number.isSafeInteger(days)&&days>0&&days<=90);
const seed=42;
const tickHours=rules.economy.stunde;
assert.equal(tickHours,60);
const BASE_CASH=2000;

function transferPlan(state,previousCash) {
  const available=Math.max(0,state.owners.house.cash-BASE_CASH);
  if(mode==='A') return 0;
  if(mode==='B') return available;
  // C: halber positiver Kassenzuwachs dieser Stunde, niemals Startkapital.
  const earned=Math.max(0,state.owners.house.cash-previousCash);
  return Math.min(available,Math.floor(earned/2));
}
function transfer(state,n) {
  assert(Number.isSafeInteger(n)&&n>=0);
  assert(state.owners.house.cash-n>=BASE_CASH);
  const before=state.initialSupply+state.minted-state.burned;
  state.owners.house.cash-=n;
  state.owners.fonds_aldera.cash+=n;
  assert.equal(state.initialSupply+state.minted-state.burned,before);
}
function playerCommands(s) {
  if(s.tick!==0)return [];
  const ships=Object.values(s.ships).filter(x=>x.owner==='house').sort((a,b)=>a.id.localeCompare(b.id));
  const miner=ships.find(s=>s.klasse==='miner'),freighter=ships.find(s=>s.klasse==='frachter');
  assert(miner&&freighter);
  return [
    {type:'shipMine',owner:'house',schiff:miner.id,ware:'erz'},
    ...(scenario==='handel-flotte'?[{type:'shipHandeln',owner:'house',schiff:freighter.id}]:[])
  ];
}
const sum=values=>values.reduce((n,x)=>n+x,0);
const count=x=>sum(Object.values(x||{}).map(v=>typeof v==='number'?v:count(v)));
const cashOf=(state,kind)=>sum(Object.values(state.owners).filter(o=>o.kind===kind).map(o=>o.cash));
function snapshot(s){
  const o=s.owners;
  const npcShips=Object.values(s.ships).filter(sh=>['npc1','npc2'].includes(sh.owner)&&sh.klasse==='frachter');
  return {day:s.tick/1440,hash:core.hash(s),
    playerCash:o.house.cash,playerShareOfSupply:o.house.cash/(s.initialSupply+s.minted-s.burned),
    traderCash:o.npc1.cash+o.npc2.cash,trader1Cash:o.npc1.cash,trader2Cash:o.npc2.cash,
    stationCash:cashOf(s,'station'),fundCash:cashOf(s,'fund'),alderaCash:o.st_aldera.cash,
    alderaFundCash:o.fonds_aldera.cash,securityCash:o.security.cash,npcMinerCash:o.npc3.cash,
    minted:s.minted,burned:s.burned,existingSupply:s.initialSupply+s.minted-s.burned,
    shortageHours:count(s.stats.mangel),foodConsumed:s.ledger.nahrung.consumed,
    medicineConsumed:s.ledger.medikamente.consumed,
    siliconAldera:s.stations.st_aldera.lager.silizium||0,
    partsAldera:s.stations.st_aldera.lager.bauteil||0,
    yardFreighters:s.stations[rules.world.werft].lager.frachter||0,
    traderFreighters:npcShips.length,
    traderLosses:count(s.stats.verluste.npc1)+count(s.stats.verluste.npc2),
    traderReplacements:((s.stats.indienst.npc1||{}).frachter||0)+((s.stats.indienst.npc2||{}).frachter||0),
    worldTrades:s.stats.handel,houseGrossReceipts:s.stats.konto.house.erloes,
    totalErzMined:s.ledger.erz.mined};
}
const state=core.createState(seed,rules),replay=core.createState(seed,rules);
assert.equal(core.hash(state),core.hash(replay));
assert.equal(state.owners.house.cash,BASE_CASH);
let previousCash=BASE_CASH,totalTransferred=0,transfers=0;
const cashBelege=[],daily=[],checkpoints=[],issued=[];
let hourlyAudits=0,roundtrips=0;
for(let tick=1;tick<=days*1440;tick++){
  for(const command of playerCommands(state)){
    const a=core.submit(state,command,rules),b=core.submit(replay,command,rules);
    assert(a.ok&&b.ok,JSON.stringify({command,a,b}));
    issued.push({tick:state.tick+1,command});
  }
  const a=core.step(state,rules),b=core.step(replay,rules);
  assert.deepEqual(a,b);
  assert(a.every(x=>x.ok),'Spielerbefehle gültig');
  if(state.tick%tickHours===0){
    const n=transferPlan(state,previousCash);
    if(n>0){
      const sourceBefore=state.owners.house.cash,recipientBefore=state.owners.fonds_aldera.cash;
      transfer(state,n);transfer(replay,n);
      assert.equal(sourceBefore-state.owners.house.cash,n);
      assert.equal(state.owners.fonds_aldera.cash-recipientBefore,n);
      cashBelege.push({tick:state.tick,amount:n,sourceBefore,recipientBefore});
      transfers++;totalTransferred+=n;
    }
    previousCash=state.owners.house.cash;
    assert(state.owners.house.cash>=0,'Originalspiel darf laufende Kosten bezahlen');
    independentlyAudit(state);independentlyAudit(replay);
    assert(core.audit(state).ok&&core.audit(replay).ok);
    assert.equal(core.hash(state),core.hash(replay),'stündlicher Replayhash');
    hourlyAudits++;
  }
  if(state.tick%1440===0){
    const x=snapshot(state);
    daily.push(x);if([1,7,14,30,60,90].includes(x.day))checkpoints.push(x);
    for(const s of [state,replay]){
      const before=core.hash(s);
      const copy=core.load(core.save(s),undefined,rules);
      assert.equal(core.hash(copy),before,'Save/Load bitidentisch');
      independentlyAudit(copy);roundtrips++;
    }
  }
}
assert.equal(totalTransferred,sum(cashBelege.map(x=>x.amount)));
assert.equal(transfers,cashBelege.length);
assert.equal(roundtrips,2*days);
assert.equal(hourlyAudits,24*days);
assert.equal(core.hash(state),core.hash(replay));
const final=daily.at(-1);
if(days===90 && mode==='A'){
  const expected=scenario==='miner'?'f733a993164a5e4f':'3a2df2b5d77d2e9e';
  assert.equal(final.hash,expected,'Produktreferenz aus B-K11-90d/CI #41516054181');
}
const result={base:'b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c',sourceSha256:pinnedHtml,
  seed,scenario,mode,days,transferDefinition:mode==='B'?'alles über 2000 ISK jede Stunde':
    mode==='C'?'halber positiver Netto-Spielerkassenzuwachs je Stunde ab 2000 ISK':'kein Transfer',
  totalTransferred,transfers,hourlyAudits,roundtrips,issued,final,checkpoints,daily,cashBelege};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log('BK11C_RESULT '+JSON.stringify({scenario,mode,days,totalTransferred,transfers,
  final,checkpoints:checkpoints.map(x=>({day:x.day,playerCash:x.playerCash,stationCash:x.stationCash,
    shortages:x.shortageHours,traderFreighters:x.traderFreighters,traderCash:x.traderCash,
    siliconAldera:x.siliconAldera,partsAldera:x.partsAldera}))}));
console.log('BK11C_PASS '+JSON.stringify({scenario,mode,days,hourlyAudits,roundtrips,hash:final.hash}));
