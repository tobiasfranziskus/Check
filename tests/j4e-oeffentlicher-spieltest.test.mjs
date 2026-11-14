// Öffentlicher Einstieg J4e: vollständig finanzierter, statischer Original-Regel204-Stand.
// Kein synthetischer Spieler-Jäger und kein stiller Save-Import der älteren Rule195-Welt.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');

test('öffentliche Root-W0–W5 verlinkt J4e, ohne das NAS-Spiel oder die Speicherhülle zu ändern',()=>{
 const pages=read('index.html'),nas=read('aphros-void.html');
 const nav=/<nav aria-label="Spielmodi"[\s\S]*?<\/nav>\n/g;
 assert.equal([...pages.matchAll(nav)].length,1,'genau ein öffentlicher Jäger-Einstieg');
 assert.equal(pages.replace(nav,''),nas,'nur Pages-only-Navigation, NAS-Core bitgenau');
 assert.ok(pages.includes('href="prototypes/j4c/index.html"'),'Root verlinkt Jägercockpit');
 assert.match(pages,/id="storage-status"/,'alte W0–W5-Speicherhülle bleibt erhalten');
 assert.ok(fs.existsSync(path.join(root,'prototypes/j4c/index.html')));
 assert.ok(fs.existsSync(path.join(root,'prototypes/j4c/beispiel-jaeger-seed42.json')));
});

test('J4e-Beispiel ist echtes auditiertes J4b/J4c-Wirtschaftsergebnis mit 900-ISK-Kauf',()=>{
 const json=read('prototypes/j4c/beispiel-jaeger-seed42.json');
 const raw=JSON.parse(json),profile=raw.w5ad.profile;
 assert.equal(raw.rulesVersion,204);
 assert.ok(Number.isSafeInteger(profile.carrierCash));
 assert.ok(Number.isSafeInteger(profile.buyerCash));
 const welt=Welt.erstellenJ4c({carrierCash:profile.carrierCash,buyerCash:profile.buyerCash});
 const spiel=welt.load(json);
 const audit=welt.audit(spiel);
 assert.equal(audit.ok,true,JSON.stringify(audit.fehler));
 assert.equal(spiel.ships.sh023.id,'sh023');
 assert.equal(spiel.ships.sh023.owner,'house');
 assert.equal(spiel.ships.sh023.klasse,'jaeger');
 assert.equal(spiel.ships.sh023.flug.lage,'angedockt');
 assert.equal(spiel.kanon.jaeger.kaeufe[0].preis,900);
 assert.equal(spiel.ledger.jaeger.consumed,1);
 assert.equal(spiel.minted,0);
 assert.equal(spiel.burned,0);
 assert.equal(Object.values(spiel.owners).reduce((sum,owner)=>sum+owner.cash,0),33000);
 assert.equal(welt.save(spiel),json,'Spielstand ist kein modifizierter synthetischer Ersatz');
 const app=read('prototypes/j4c/app.js');
 assert.ok(app.includes("fetch('beispiel-jaeger-seed42.json'"),'öffentlicher Beispiel-Loader vorhanden');
 assert.ok(app.includes('laden(json,false)'),'Beispiel durch regulären Save-Validator geladen');
});
