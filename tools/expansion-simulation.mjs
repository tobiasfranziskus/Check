// Vollständiger Vergleich plus Wiederholung und Wiederaufnahme nach Investition.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const current = html.slice(html.indexOf('<script>') + 8, html.indexOf('const m_data_oberflaeche'));
const baseline = current.replace('schema: 8, rulesVersion: 9', 'schema: 8, rulesVersion: 8')
  .replace('if (state.tick % (rules.economy.stunde * 24) === 0) investieren(state, rules);', '');
const previous = JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-v8.json', import.meta.url)));
function engine(source, obs) {
  if (obs) {
    source = source.replace("buche(state, schiff.owner, 'kosten', fee);", "buche(state, schiff.owner, 'kosten', fee); observe(state,schiff,ware,menge,kauf,wert,fee);");
    source = source.replace('if (state.tick % (rules.economy.stunde * 24) === 0) investieren(state, rules);', 'if (state.tick % (rules.economy.stunde * 24) === 0) observation(state, investieren(state, rules));');
  }
  return new Function('observe', 'observation', source + ';return m_core_index;')(obs?.trade, obs?.investment);
}
const results = [];
const pilotReferences = JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-v9.json', import.meta.url)));
for (const variant of (process.env.VARIANTS || 'base,pilot').split(',')) for (const entry of previous) {
  const seed = entry.seed, src = variant === 'base' ? baseline : current;
  const investments = [], checks = [], points = [];
  const account = {sales:0,units:0,revenue:0,purchases:0,fees:0,allSales:0};
  let saveRequested = false;
  let restored = null, restoreTick = null, block = null, maxBlock = 0;
  const obs = {
    trade(s,ship,ware,n,buy,value,fee) {
      if(!buy && ship.klasse==='frachter' && s.owners[ship.owner].kind==='trader')account.allSales++;
      if(ship.owner!=='npc1')return;
      account.fees+=fee;
      if(buy)account.purchases+=value;else {account.sales++;account.units+=n;account.revenue+=value;}
    },
    investment(s,res) { checks.push({tick:s.tick,...res}); if(res.ok) {investments.push({tick:s.tick,...res});saveRequested=true;} },
  };
  const c=engine(src,obs),plain=engine(src);const s=c.createState(seed);const start=performance.now();
  for(let tick=1;tick<=129600;tick++) {
    c.step(s);
    if(saveRequested){restored=plain.load(c.save(s));restoreTick=tick;saveRequested=false;}
    if(restored && tick>restoreTick)plain.step(restored);
    const ships=Object.values(s.ships).filter(x=>x.klasse==='frachter'&&s.owners[x.owner].kind==='trader');
    const blocked=ships.length>0&&ships.every(x=>x.phase==='dock'&&((x.ladung.treibstoff||0)+(s.stations[s.systems[x.system].station].lager.treibstoff||0))<1);
    if(blocked&&block===null)block=tick;
    if(!blocked&&block!==null){maxBlock=Math.max(maxBlock,tick-block);block=null;}
    if(tick%60===0){assert(c.audit(s).ok);assert(s.sollflotte.npc1.length<=4);}
    if([4320,43200,129600].includes(tick)) {
      if(restored)assert.equal(plain.hash(restored),c.hash(s),'continued save');
      const point={tick,hash:c.hash(s),audit:c.audit(s),account:{...account},cash:s.owners.npc1.cash,konto:structuredClone(s.stats.konto.npc1),abgabe:s.stats.abgabe.npc1,fleet:ships.filter(x=>x.owner==='npc1').length,soll:s.sollflotte.npc1.length,loss:s.stats.verluste.npc1||{},indienst:s.stats.indienst.npc1||{},stationCash:Object.fromEntries(Object.keys(s.stations).map(k=>[k,s.owners[k].cash])),mangel:Object.values(s.stats.mangel).reduce((a,z)=>a+Object.values(z).reduce((a,b)=>a+b,0),0)};
      if(variant==='base')assert.equal(point.hash,entry.points.find(p=>p.tick===tick).hash,'historical v8');
      if(variant==='pilot')assert.equal(point.hash,pilotReferences.find(x=>x.seed===seed).points.find(x=>x.tick===tick).hash,'pilot reference');
      points.push(structuredClone(point));
    }
  }
  if(block!==null)maxBlock=Math.max(maxBlock,129601-block);
  const repeat=plain.createState(seed);for(const p of points){while(repeat.tick<p.tick)plain.advance(repeat,Math.min(10000,p.tick-repeat.tick));assert.equal(plain.hash(repeat),p.hash,'repeat');}
  const row={variant,seed,investments,checks,points,maxBlock,ongoing:block,seconds:(performance.now()-start)/1000};results.push(row);
  console.log(JSON.stringify(row));
}
