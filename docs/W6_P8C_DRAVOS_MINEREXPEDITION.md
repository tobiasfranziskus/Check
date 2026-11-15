# W6/P8c-1 – echte Dravos-Minerexpedition mit bezahltem Rücktransport

**Stand: 15.11.2026 · [DRAFT/ANALYSE · KEINE PRODUKTFREIGABE]**

## Verhältnis zur öffentlichen Spielwelt

- **[MAIN]** `fb81a117c9bd976d396187d22b583df6b07bdd3e` · Regel204/Schema8 · P8a-Siliziumanzeige, J14-Mehrschiff-Reload. [GitHub-Pages-Deploy #43756986613](https://github.com/tobiasfranziskus/Check/actions/runs/43756986613) `completed/success`. Alle Nutzerspielstände bleiben unverändert. Kein unbemerktes Regelupdate.
- **[DRAFT/ANALYSE]** [P8b-PR #408](https://github.com/tobiasfranziskus/Check/pull/408) ist eigenständige Regel205-Zweifeld-Forschung (Nadir/Nadir), kein genehmigter Produktions-Balancewert. Historisch vollständig [13×90, S02×365](https://github.com/tobiasfranziskus/Check/actions/runs/43753837865) auditiert.
- **[DRAFT/ANALYSE]** [P8c-PR #412](https://github.com/tobiasfranziskus/Check/pull/412) liegt absichtlich **auf dem P8b-Forschungsbranch**, nicht auf `main`. Regel206 ersetzt das **zweite, nur hypothetische Nadir-Feld** durch ein **physisch in Dravos gelegenes endliches Forschungsfeld (16 Einheiten)**. Die bisherige lokale Nadir-16er-Lagerstätte bleibt erhalten. Es gibt keinen geschenkten Dravos-Miner oder -Frachter, keine Fabrik, kein neues Haushaltsgeld, keine Eröffnung einer neuen Stations-Kaufkasse.
- **Nicht freigegeben:** Dravos-Feldgröße 16, Pilotengeldsatz und Frachtrisiko sind **experimentelle Parameter**, nicht vom Nutzer beschlossene industrielle Marktbedingungen. Ein Erfolg darf weder die bestehende Regel204-Simulation ersetzen noch eine automatische Save-Konvertierung auslösen.

## Rechtmäßiger Ablauf eines Lieferzyklus

1. **K2/Eigentum:** NPC3 nutzt einen **aus realem W4-Material und bezahlter Werftarbeit** gebauten, mit realen 600 ISK gekauften lokalen Nadir-Miner. Das Original-K2-Eigentumsjournal bleibt bindend; fremde Schiffe, kostenlose Hallen und eine unterstellte Dravos-Gründung sind nicht erlaubt.
2. **Hinfahrt:** Nur am Nadir-Dock und mit freier unbeschädigter Hülle darf `shipTravelDravos` ausgeführt werden. Der **bestehende Original-W3-Routenfinder** findet **Nadir → Orion (18 Minuten) → Dravos (22 Minuten)**, 40 Wirtschaftsminuten; es gibt kein direktes Nadir–Dravos-Tor. **Vorab werden 40 vorhandene ISK** von `npc3` auf `k1_p8c_reise` gebunden. Der Original-Kern startet `shipMove`, der F6-Körper wechselt in den regelkonformen Transit; für jede echte Minute wird **1 ISK an den bereits bestehenden Privatpiloten** gebucht, die Hülle verschleißt. Der Transitverlauf ist im selben `kanon.p8c`-/K1-Geldbuch gespeichert und wird unabhängig gegen den aktuellen W3-Reisestatus auditiert.
3. **Förderauftrag:** Erst am **realen Dravos-Dock** und mit im Journal verbuchtem früherem, vollständig bezahltem Besuch kann NPC3 `siliconMineStart` am dort existierenden, endlichen J2b-Feld signieren. Wie im alten Kern werden **8 Einheiten** produziert, für **128 ISK Bergbaulohn** vorfinanziert, **192 ISK Nadir-Kaufreserve** vorab gebunden; physisch auf demselben Original-F6-Miner aus dem Feld gefördert, jede Minute und Einheit journalisiert. **Keine** kostenfreie Neubeschaffung, kein externes Mining ohne eigenes Schiff.
4. **Rückfahrt mit echter Ladung:** Der volle Dravos-Miner dockt dort wieder an und startet nur mit **tatsächlich 8 real geförderten Einheiten an Bord** den zweiten Original-W3-Transit **Dravos → Orion (22) → Nadir (18)**. Nochmals **40 vorhandene ISK** werden für 40 echte Privatpiloten-Minuten gebunden und bezahlt. Die ursprünglichen 8 Silizium bleiben die ganze Reise **im Original-Schiffsinventar** und im aktuellen J2b-Fördervertrag.
5. **Verkauf/Jägerindustrie:** `siliconSell` ist erst beim **wirklich angedockten Nadir-Käufer** erlaubt und löst gegen die ursprüngliche 192-ISK-Kauf-Treuhand den Eigentumswechsel und die physische Stationseinlagerung aus. Die vorhandenen bezahlten J3-Rezept- und J4-Werftbefehle verwenden nur dieses real gelieferte Silizium mit bestehendem Material, Lohn, Käufern und legalem 900-ISK-Spieler-Jägerkauf.

Alle diese Schritte benutzen einen gemeinsamen W0–W6-Kern, **keine zweite Simulation, keine Mint-/Burn-Ausnahmen, keinen Treibstoffzwang und kein externes Backend**.

## Bisheriger 90-Tage-Nachweis (tatsächlich geprüft)

[Test-/CI-Workflow P8c #412](https://github.com/tobiasfranziskus/Check/pull/412/checks) hat die reale Minerexpedition auf Seed42 im S02-Profil ausgeführt (Regel206, genau die experimentellen 16+16 Einheiten):
- **16/16 Dravos-Siliziumeinheiten** physisch erarbeitet, in zwei Chargen nach Nadir geliefert und rechtmäßig verkauft. Die anderen 16/16 Einheiten stammen aus dem **alten Nadir-Feld**, nicht aus freiem Wareneingang.
- **4 Original-W3-Transite** à **40 Minuten** (2 Hin-, 2 Rückfahrten), als vier unabhängige beweisbare Schiff-/Eigentumsvorgänge, **160 tatsächlich bezahlte ISK** an den bereits existierenden Privatpiloten. Die gesamte Pilotentreuhand ist am Ende leer und vollständig gegengebucht.
- Aus 32 endlichen, physisch geförderten Siliziumeinheiten **4** originalbezahlt gefertigte Jäger; **3** Original-Spieler-Käufe zu je **900 ISK**, Hausgeld **300 ISK**, bei unveränderter Weltgeldmenge **33.000 ISK**, Mint/Burn **0**, **93 rechtmäßig finanzierte Ersatzkäufe**.
- Geld-/Waren-/Eigentums-/Schiffs-/Save-Audits einschließlich **Zwischensave während einer laufenden, bezahlten 40-Minuten-Reise** und manipuliertem Fluglohn-/Feldbuch. Nach zusätzlicher Prüfung eines legitimen Unterwegszustands wird nicht eine reale Frachter-/Pilotenkasse fälschlich als „unfinanzierter Flug“ oder „unzulässiger Miner“ abgewiesen.
- **90-Tage-Kernhash: `731ea79a7ddb8761`**.
- **Gegenprüfung:** Vorhandene Regel204-P6-S02-90-Tage-Hülle bleibt bei **`686355895f27fbb8`**; die separate Forschung Regel205 bleibt bei **`c6a5b9b9b3b7579a`** für ihre 90 Tage.

**Grenze der Evidenz:** Ob der zusätzliche Dravos-Aufwand auch unter elf wirtschaftlichen Krisenregimen und über 365 Tage die ursprünglich günstige P8b-Probe erhält, ist gesondert durch `tools/w6-p8c-dravos-szenarien.cjs` und den P8c-13×90-/365-Workflow zu prüfen. **Dessen Durchführung und Ergebnis nicht ohne tatsächliches erfolgreiches CI als bestanden bezeichnen.** Der alte 730-Tage-P7-Referenzhash bezieht sich weiterhin ausdrücklich auf **Regel204 mit nur einem Nadir-Siliziumfeld**, nicht auf P8c.

## Noch fehlend / nächster produktiver Schritt

- **Kein unabhängiger Frachtervertrag.** In P8c-1 fliegt der **eigene Miner mit seiner eigenen Ladung** nach Dravos und zurück; damit existiert ein echter bezahlter transportierter Siliziumgegenstand, aber **noch keine gesondert signierte Spedition mit eigenem Frachter**, reellen Fremdfrachtlöhnen, Schiffkapazitäts-/Lagerübergabe und separat quittiertem Eigentum.
- **Kein gesetzloses Piratenrisiko** und keine kostenpflichtige Eskorten-/Schadensbewertung auf Dravos-Routen; die bislang im Atlas bezeichnete Sicherheitslage darf ohne Kampfimplementierung nicht als gelöst bezeichnet werden.
- **Noch keine freigegebene Ressourcengeologie oder Geldpolitik** für neue produktive Dravos-Felder oder andere NPC-Firmen. 16 zusätzliche Bodeneinheiten sind ein bewusst isolierter Forschungsparameter.
- **Kein öffentlicher P1-Regel206-Einstieg.** Echte iPad-Safari- und privater NAS-Gerätetest offen, unabhängig von CI-Chromium/WebKit.
- **Kein unbemerkter Altstand-Import:** Der P8b-204→205-Konverter existiert nur im Forschungsbranch und gilt NICHT automatisch für die Dravos-Geologie206. Ein gesonderter verifizierter 204→206-Migrationsvertrag mit reproduzierbarer Quest-/Fracht-Initialisierung müsste vor einer Veröffentlichung erarbeitet werden.

**Integration/Entscheidung:** P8c-1 verbleibt als **Draft-Forschungs-PR**. Vor Freigabe der gesamten Dravos-Wirtschaft sind vollständige Kosten, endliche Feldgrößen, zwischenbetriebliches Frachtrisiko und ggf. Altspielstandmigration ausdrückliche Nutzerentscheidungen. Keine Core-/Index-/NAS-/Pages-Änderung in `main`.
