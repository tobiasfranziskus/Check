const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const path=require('node:path'),repo=path.resolve(process.argv[2]||process.cwd());
const J8=require(repo+'/prototypes/verbund/konzern-session.js');
const W5=require(repo+'/prototypes/w5ac/session.js');
const dir=process.env.APHROS_AUDIT_DIR||__dirname;
const out=[];
for(const name of ['tick360.json','tick600-vor-wasser.json','tick600-nach-wasser.json','tick600-nach-import.json']){
 const text=fs.readFileSync(dir+'/'+name,'utf8'),raw=JSON.parse(text),s=J8.erstellen();s.oeffnen204(text,true);
 const core=s.weltReferenz().audit(s.zustandReferenz());assert.equal(core.ok,true);
 assert.equal(Object.values(raw.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(raw.minted,0);assert.equal(raw.burned,0);
 const goods={};for(const [ware,l] of Object.entries(raw.ledger)){
  const expected=l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported;
  const held=Object.values(raw.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)+Object.values(raw.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
  assert.equal(held,expected,ware);goods[ware]={expected,held};
 }
 const contracts=raw.kanon.spielerFrachten;assert.equal(contracts.auftraege.reduce((n,x)=>n+x.fracht,0),contracts.gebuehr);
 assert.equal(contracts.auftraege.reduce((n,x)=>n+x.arbeit,0),contracts.lohn);
 for(const a of contracts.auftraege){assert.equal(raw.ships[a.schiff].owner,'house');assert.equal(a.geliefert,a.start+60);assert.equal(a.end,a.geliefert+60);assert.equal(a.menge,50);}
 assert.equal(s.exportieren(),text);
 out.push({name,sha256:crypto.createHash('sha256').update(text).digest('hex'),tick:raw.tick,hash:s.ansicht().hash,coreAudit:core,independentGoods:goods,cash:raw.owners.house.cash,pilotCash:raw.owners.pilot_house.cash,alderaCash:raw.owners.st_aldera.cash,freight:contracts,book:raw.kanon.buch,owners:raw.owners,ships:raw.ships});
}
const a=fs.readFileSync(dir+'/tick600-vor-wasser.json','utf8'),b=fs.readFileSync(dir+'/tick600-nach-wasser.json','utf8');
const x=JSON.parse(a),y=JSON.parse(b);assert.equal(y.owners.pilot_house.cash-x.owners.pilot_house.cash,-256);assert.equal(y.owners.st_aldera.cash-x.owners.st_aldera.cash,256);assert.equal(y.owners.house.cash,x.owners.house.cash);assert.equal(y.stations.st_aldera.lager.wasser-x.stations.st_aldera.lager.wasser,-16);
assert.equal(b,fs.readFileSync(dir+'/tick600-nach-import.json','utf8'));
const replay=J8.erstellen();replay.starten195(W5.create(42,'private195').export(),true);
const cmd=id=>assert.equal(replay.ausfuehren(id).ok,true,id);
cmd('buy-st_aldera-miner');cmd('buy-st_aldera-frachter');cmd('ice-sh002');
replay.weiterspielen(60);replay.weiterspielen(60);
for(let i=0;i<2;i++){cmd('freight-sh003');replay.weiterspielen(60);replay.weiterspielen(60);}
assert.equal(replay.exportieren(),fs.readFileSync(dir+'/tick360.json','utf8'));
cmd('freight-sh003');replay.weiterspielen(60);replay.weiterspielen(60);
cmd('buy-st_aldera-miner');cmd('ice-sh004');cmd('freight-sh003');replay.weiterspielen(60);replay.weiterspielen(60);
assert.equal(replay.exportieren(),a);cmd('water-pilot-house-bedarf');assert.equal(replay.exportieren(),b);
fs.writeFileSync(dir+'/unabhaengiger-audit.json',JSON.stringify({node:process.version,replayByteIdentical:true,checks:out},null,2)+'\n');
console.log(JSON.stringify({node:process.version,replayByteIdentical:true,checkpoints:out.map(x=>({name:x.name,hash:x.hash,tick:x.tick,sha256:x.sha256,cash:x.cash,pilotCash:x.pilotCash,alderaCash:x.alderaCash}))},null,2));
