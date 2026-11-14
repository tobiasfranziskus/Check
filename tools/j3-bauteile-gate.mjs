// J3: Replay aus dem tatsaechlich bezahlten J2a-Minerbau, J2b-Silizium
// und unveraenderten W4-Waren. Keine manuell hineingeschriebenen Testwaren.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {versuch} from './j2-silizium-gate.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const gut=(w,s,m)=>assert.equal(w.audit(s).ok,true,m+': '+JSON.stringify(w.audit(s).fehler));
export async function j3Quelle(seed){
  const {w:alt,s:altS,report}=await versuch(seed);
  assert.equal(report.final.hash,seed===42?'c5d9d3becc36c4a4':'d7fbd58bc707e2ae');
  const bought=alt.execute(altS,{type:'stationClaimMinerLocal',owner:'house',station:'st_nadir'});
  assert.equal(bought.ok,true,JSON.stringify(bought));
  gut(alt,altS,'realer Kauf des K2-Miners');
  const oldHash=alt.hash(altS);
  const {welt:w,zustand:s}=Welt.ausRegel200J2b(alt.save(altS));
  assert.equal(alt.hash(altS),oldHash);
  const id=altS.kanon.minerWerft.lokaleKaeufe[0].id,C=w.rules.j2b;
  assert.equal(w.execute(s,{type:'siliconMineStart',owner:'house',schiff:id}).ok,true);
  assert.equal(w.execute(s,{type:'shipUndock',owner:'house',schiff:id}).ok,true);
  w.minute(s);
  assert.equal(w.execute(s,{type:'shipFlyTo',owner:'house',schiff:id,x:C.feld.x,y:C.feld.y}).ok,true);
  for(let n=0;n<500&&s.kanon.silizium.gefoerdert<8;n++)w.minute(s);
  assert.equal(s.kanon.silizium.gefoerdert,8,'8 reale Einheiten statt Startware');
  assert.equal(s.kanon.silizium.arbeitsMinuten,64);
  assert.equal(w.execute(s,{type:'shipDock',owner:'house',schiff:id,station:'st_nadir'}).ok,true);
  for(let n=0;n<500&&s.ships[id].flug.lage!=='angedockt';n++)w.minute(s);
  assert.equal(s.ships[id].flug.lage,'angedockt');
  assert.equal(w.execute(s,{type:'siliconSell',owner:'house',schiff:id}).ok,true);
  assert.equal(s.stations.st_nadir.lager.silizium,8);
  gut(w,s,'J2b volles Silizium gekauft');
  const siliconHash=w.hash(s);
  const oreBefore=s.stations.st_nadir.lager.erz;
  const materialBefore=s.stations.st_nadir.lager.material;
  // Nur das tatsaechlich bezahlte restliche W3-Erz koennte weiteres Material werden.
  // Wir versuchen genau eine bestehende W4-Charge, ohne Bestandsumgehung.
  const refine=w.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
  if(refine.ok)for(let n=0;n<w.rules.w4.dauer;n++)w.minute(s);
  gut(w,s,'Original-W4-Material nach realer Refinanzierung');
  const nachweis={oreBefore,materialBefore,refine:refine.ok,
    refineReason:refine.ok?null:refine.reason,oreAfter:s.stations.st_nadir.lager.erz,
    materialAfter:s.stations.st_nadir.lager.material,
    si:s.stations.st_nadir.lager.silizium,sourceHash:siliconHash};
  // J3 darf auch die negativen Daten 0/1 Material vollstaendig erhalten.
  const finalHash=w.hash(s),converted=Welt.ausRegel201J3(w.save(s));
  assert.equal(w.hash(s),finalHash,'Regel201-Quelle muss byteidentisch bleiben');
  assert.equal(converted.quellHash,finalHash);
  gut(converted.welt,converted.zustand,'202 nach ausdruecklicher Uebernahme');
  return {...converted,nachweis,miner:id,altQuelleHash:oldHash};
}
