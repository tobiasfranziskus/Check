# W6/P4 – finanziertes NPC-Silizium als Vorstufe der autonomen Jägerwirtschaft

**[ANALYSE / NICHT MAIN] · 15.11.2026.** Forschungsbasis: [#393](https://github.com/tobiasfranziskus/Check/pull/393), die Flugoptimierung auf dem vollständig geprüften S02-Referenzpfad [#389](https://github.com/tobiasfranziskus/Check/pull/389). Kein freigegebener W6-Produktcode.

## Tatsächliche vorhandene Rechte

Das bestehende Regel204-/Schema8-System erlaubt:
1. `werft_extern` bestellt/finanziert einen wirklichen K2-Miner (`stationBuildMiner`) für den eingetragenen Eigentümer `npc3`; Material, Arbeitszeit und Geld werden im Original-Core vorfinanziert.
2. Nur der eingetragene Eigentümer `npc3` darf diese fertige Hülle mit `stationClaimMinerLocal` in Nadir **für 600 ISK** beanspruchen. Die Original-K2-Quittung `lokaleKaeufe` und das Klassenlager belegen den Kauf.
3. Nur derselbe Besitzer darf `siliconMineStart`, `shipUndock`, `shipFlyTo`, `shipDock` und `siliconSell` signieren; Raffinerie und Siliziumkäufer bleiben die originalen Nadir-Konten. Die Original-Kasse bindet **vor dem Abbau** die Arbeits- und Siliziumankaufsreserve. Pilotenflug und Förderung sind real abzurechnen.
4. Die existierende NPC-Industrie kann aus erst danach im Nadir-Lager verkauftem Silizium bezahlte Bauteile und Jäger bauen.

Die Tests benutzen absichtlich nicht den Spieler als Käufer. Die Werk- und Eigentümerentscheide werden **einzeln durch die tatsächlich berechtigten Firmen** signiert. Es wird keine fremde Unterschrift, Ware, Hülle, neues Feld, Geldmenge, neues Rezept oder Geldquelle erzeugt.

## Neuer reproduzierbarer Nachweis

- `tests/w6-p4-npc-silizium.test.mjs`: Erzeugt die frische echte Regel195→204-Karriere und aktiviert die **bestehende** isolierte S02-NPC-Forschungsoption. Wartet auf einen wirklich freien K2-Werftslot mit Material/Erz; baut einen Miner auf Rechnung der echten Werft und mit dem echten NPC3-Kaufpreis, führt einen physikalischen Nadir-Siliziumflug und den finanzierten Originalverkauf aus. Prüft Eigentümer, Hüllenjournal, Abzug beim Käufer, ursprüngliches `house`-Guthaben, unverändertes Weltgeld 33.000 ISK, Mint/Burn 0, Warenledger, Quittung, Hash und Save/Load.
- Unrechtmäßige `siliconMineStart`-Befehle gegen das ursprüngliche Aldera-Schiff scheitern atomar.
- `tests/w6-p4-cpu-probe.test.mjs`: Generiert einen echten S02-Tag-30-Save und vergleicht bei 3×360 Minuten `minute()` gegen 60 einzelne `teilschritt()` pro Minute einschließlich vollständiger kanonischer Gleichheit und CPU-Median. **Dies misst nicht isoliert den Vorher/Nachher-Effekt von #393:** der bisherige `minute()`-Pfad besitzt zusätzlich eine Idle-Abkürzung. Ergebnisse erst nach tatsächlich erfolgreichem CI berichten.

## Wirtschaftliche Grenzen

- **Keine autonome NPC-Silizium-Disposition in diesem Schritt:** Der bisherige `m_core_firmenpolitik` disponiert nur Aldera-Eis/Erz und Nadir-Industrie. Ein gesonderter neuer, ausdrücklich opt-in Forschungsdisponent kann den hier bewiesenen legalen Auftragsweg später in die NPC-Strategie aufnehmen; seine Betriebsstrategie und Interessenkonflikte mit der wichtigen Miner-Ersatzwerft müssen gesondert geprüft werden.
- Das Nadir-Siliziumfeld hat nur **16 Einheiten**. Aus ihm können unter dem bestehenden Rezept maximal zwei Jäger entstehen, unabhängig von Kassen und CPU. Keine unendliche Jägerwirtschaft behaupten.
- Im bestehenden K2-Vergabesystem können nur `house` und `npc3` lokale Miner erhalten. `st_nadir` hat kein Förderrecht. Kein eigenmächtiger Eigentumswechsel oder automatischer Firmenkauf.
- Bei fehlendem Baukapital, Werftkapazität, Rohstoff, 600 ISK Kaufpreis, Silizium-Arbeitslohn oder Käuferbudget ist der rechtmäßige Auftragsweg **blockiert**. Keine Rettungszahlung.
- `main`, die publizierte J13a-Karriere, Save-Schema, Preise, automatische NPC-Politik und die Original-Referenzhashes bleiben unberührt. Keine Veröffentlichung, kein NAS-Update, keine echte iPad-Abnahme.

## Prüfbefehl

```sh
node --test tests/w6-p4-npc-silizium.test.mjs tests/w6-p4-cpu-probe.test.mjs
node --test tests/*.test.mjs
node scripts/build-w5-singlefile.mjs --check
```

**Prüfstatus bei PR-Erstellung: noch nicht durchgeführt; Ergebnisse von CI und unabhängigem Testlauf nachtragen.**
