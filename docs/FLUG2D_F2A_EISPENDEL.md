# Flug2D F2a – realer, finanzierter Eis-Pendelauftrag [DRAFT/ANALYSE]

**Stand:** 10.11.2026 · Quelle [I0 #294](https://github.com/tobiasfranziskus/Check/pull/294), [F1-I0 #296](https://github.com/tobiasfranziskus/Check/pull/296). Dies ist ein **kleiner, separater, überprüfbarer F2-Forschungsschritt**, kein Produkt-Merge und keine allgemeine Ortsbindung für alle Waren.

## Was jetzt wirklich funktioniert

Eine bestehende, real finanzierte Minerhülle des NPC oder ein **normal über `shipBuy` für 600 ISK gekauftes Spieler-Minersschiff** beginnt in Aldera am Dock. Der F0-Autopilot steuert zur tatsächlichen Eisfeldposition, bremst in die Förderreichweite (`FlugKern.imFeld`), und **nur dort** wird über den **unveränderten Original-Rule195-Buchungskern** die Eisförderung angestoßen. Nach einer realen Teilcharge kommt die Fracht im Schiffsraum zur Station zurück. Der Originalbefehl `shipSellIce` ist durch den F2a-Adapter **erst im angedockten Zustand** zugelassen.

**Bewusster 48er-Schritt:** Der ursprüngliche `W5n.foerdern`-Code verkauft eine komplette 50er-Eischarge bereits **im selben Wirtschaftstick** automatisch. Dies wäre bei einem entfernten Feld ein falscher Fernverkauf. F2a stoppt deswegen kontrolliert nach **48 Einheiten**. Die zwei ausstehenden Einheiten werden **weder geschenkt noch als gefördert ausgegeben**. Eine spätere separate F2b-Änderung am ursprünglichen Core benötigt eine saubere Aufteilung von Förderung, Ladung und Stationsverkauf, um echte 50er-Chargen ohne diesen Forschungsstopp zu ermöglichen.

## Nachweis der Wirtschaftskette (V8-Forschungsberechnung)

| Größe | NPC-Miner (vorhanden) | Spieler-Miner (neu gekauft) |
| --- | ---: | ---: |
| System | Aldera | Aldera |
| Warenmenge | 48 Eis | 48 Eis |
| Miningrate | 1 Eis/Min. | 1 Eis/Min. |
| Arbeit | **48 Minuten × 2 ISK = 96 ISK** | **96 ISK** |
| Stationskauf | **48 Eis × 5 ISK = 240 ISK** | **240 ISK** |
| Bezahlter Hüllenkauf | bereits real bezahlt | **600 ISK** |
| Rückkehr + Abnahme | Spielminute 68, Flugteilschritt 26 | ebenso |
| Physikalische Schritte | 4.106 | 4.106 |
| Kasse Eigentümer nach Abnahme | 2.544 ISK | 2.544 ISK |
| Finale Warenlage | +48 Eis im Stationslager, 0 im Miner | ebenso |
| Weltgeld nach Abnahme | **33.000 ISK**, kein Mint | **33.000 ISK**, kein Mint |
| Forschungs-Referenzhash Seed 3301 | `1f478521b3490907` | `dc89d39b6558f503` |

Der Eigentümer erhält **240 ISK Verkaufserlös**, hat zuvor **96 ISK bezahlte Bergbauarbeit** getragen. Dieser Deckungsbeitrag von 144 ISK vor Schiffserwerb, Verschleiß, Transportarbeit und anderen Kosten ist **kein Nettogewinn nach Vollkosten** und keine wirtschaftliche Dauerbetriebsfreigabe.

**13 tatsächlich durchgerechnete feste Seeds** `42,7,3301,1,2,3,5,11,19,101,202,777,123456` erledigten jeweils den 4.106-Schritte-Rundlauf ohne Rechnungsfehler, mit positivem Original-Waren-/Geld-/Treuhand-Audit. Dies sind 13 **kurze 68-Minuten-Fälle**, nicht 13 × 90 Tage.

## Ein einziger Original-Core, keine heimlichen Transfers

- Neue additive Forschungsdatei `prototypes/flug2d/f2a-eis-pendel.js`; die eine Originalwirtschaft stammt weiterhin **ausschließlich** aus `prototypes/w5ac/rule191-w5-ferry-core.js`, deren Blob **unverändert** bleibt.
- `prototypes/flug2d/f1-kopplung.js` erhält nur eine strikte, optionale Forschungskennung **Rule197/Schema8**. Der unveränderte F1-Einstieg bleibt bei Rule196; alte F1- oder Produkt-Spielstände werden nicht migriert. Kein doppelter Wirtschaftstakt.
- `state.ships[id].phase='flug'` ist in diesem Forschungsprofil der **nicht am Dock verfügbare** Produktionszustand. Nur bei physisch gültigem `imFeld` darf derselbe Original-Core unter seiner bestehenden `phase='dock'`-Arbeitsbedingung eine real bezahlte Miningminute ausführen; die Simulations- und Exportregeln bleiben original.
- Während des Rückflugs wird `shipWait` über den Original-Core gesetzt und `phase='flug'` bis zum tatsächlichen Andocken beibehalten. Damit gibt es weder unterwegs Gratisproduktion noch einen NPC-Hintergrund-Neustart mit der falschen Ware. Nach der Lieferung wird ein etwaiger ungeprüfter NPC-Dockauftrag ebenfalls vor dem nächsten Fördertick gestoppt.
- `shipMine`, `shipSellIce`, `shipWait` sowie Flug-Hijacking einer laufenden Mission sind öffentlich abgewiesen. F2a allein führt sie zu den örtlich erlaubten Zeitpunkten über die originalen Befehlsprüfungen aus. Es ist **keine Rückrechnung/Umbuchung** von bereits erfolgten Verkäufen nötig.
- Start prüft mindestens die vorhandenen **96 ISK Eigentümer-Arbeitskapital** und **240 ISK kaufbereiten Stationsetat**. Die realen Löhne werden weiter je Original-Core-Minute bezahlt; der Stationskauf erst bei Ankunft. Wenn inzwischen das Käuferbudget fehlt, bleibt die Ware im Schiff – kein Kredit/Mint/Rettung.
- Pro Forschungswelt nur **ein aktiver** Pendelauftrag; vollständig ausgelieferte Aufträge werden nicht unbemerkt wieder gestartet. Parallelwirtschaft, Wiederholaufträge und echte 50er-Kontrakte benötigen separate F2-Stufen.

## Tests und Grenzen

`node --test tests/flug2d-f2a-eis.test.mjs` überprüft die echte Feldbedingung **pro produktiver Eisminute**, den Null-Fernverkauf vor Andocken, bezahltes Original-`shipSellIce`, 600-ISK-Spielerkauf, Forschungs-Hash/Save-Replay, fremde IDs, manipulierte Missionen und 13 feste Seeds. Vor erfolgreichen GitHub-CI-Läufen nicht als Node22-bestanden bezeichnen.

**Offen vor F2-Freigabe:** echte vollständige **50er-Erz-/Eisauftragsabrechnung ohne Fernverkauf**, alle Miner und echte wiederholte NPC-Verträge, Transport-/Flugarbeitskosten und Käufernachfrage, 13×90-Tage-Wirtschaftskrisen, UI/Touch-/JavaScriptCore-Referenzabnahme der **F2a-Forschung**, echte iPad-/NAS-Geräteabnahme und Produkt-/Save-Migration. Die bestehenden F0/F1-Demos und die Main-Singlefile-Ausgabe bleiben unverändert.

**Kein Merge nach main, keine GitHub-Pages-/NAS-Auslieferung, kein Zugriff auf produktive Save-Slots.**
