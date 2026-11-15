/* W6 [ANALYSE] – CPU-Vergleich auf echten, validierten S02-JSON-Saves.
 * Aufruf: node tools/w6-flugbatch-benchmark.cjs /tmp/s02/day180.save.json [...]
 * Keine CI-Laufzeitschwelle: Zahlen sind auf dieselbe CPU/Last begrenzte Beobachtungen.
 */
'use strict';
const fs = require('node:fs');
const W6 = require('./w6-szenarien.cjs');
const s02 = W6.SZENARIEN.find(x => x.id === 'S02');
const dateien = process.argv.slice(2);
if (!dateien.length) {
  console.error('Aufruf: node tools/w6-flugbatch-benchmark.cjs <S02-save.json> [...]');
  process.exitCode = 2;
} else {
  const {welt} = W6.start(s02.politik);
  const minuten = 180, wiederholungen = 3;
  function lauf(json, modus, minuten) {
    const s = welt.load(json); // validiert das Original-Save
    const vor = process.cpuUsage(), t = process.hrtime.bigint();
    for (let m=0; m<minuten; m++) {
      if (modus === 'minute') welt.minute(s);
      else for (let j=0; j<60; j++) welt.teilschritt(s);
    }
    const cpu = process.cpuUsage(vor);
    const millis = Number(process.hrtime.bigint()-t)/1e6;
    const fehler = W6.pruefen(welt, s);
    if (fehler.length) throw Error('Originalbuch-Audit: '+fehler.join('; '));
    return {hash:welt.hash(s), canonical:welt.canonical(s),cpuMillis:(cpu.user+cpu.system)/1000,wallMillis:millis};
  }
  const median = a => [...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
  for (const datei of dateien) {
    const json = fs.readFileSync(datei,'utf8');
    // Warm-up mit frischen Klonen, ohne Buchungsfolgen in den Messstart zu mischen.
    lauf(json,'minute',2); lauf(json,'teilschritt',2);
    const a=[], b=[];
    for (let n=0; n<wiederholungen; n++) {
      // Wechselnde Reihenfolge verringert zeitliche Last-/JIT-Verzerrung.
      const zuerst=n%2===0?'minute':'teilschritt';
      const r1=lauf(json,zuerst,minuten);
      const r2=lauf(json,zuerst==='minute'?'teilschritt':'minute',minuten);
      if (r1.hash!==r2.hash || r1.canonical!==r2.canonical)
        throw Error('Batch veraendert die kanonische Welt: '+datei);
      a.push(zuerst==='minute'?r1.cpuMillis:r2.cpuMillis);
      b.push(zuerst==='teilschritt'?r1.cpuMillis:r2.cpuMillis);
    }
    const batch=median(a), einzeln=median(b);
    console.log(JSON.stringify({datei,schiffe:Object.keys(welt.load(json).ships).length,
      minuten,wiederholungen,cpuMedianMillis:{batch,einzeln},
      faktorEinzelnZuBatch:Math.round(einzeln/batch*1000)/1000,
      exaktGleicherKanon:true}));
  }
}
