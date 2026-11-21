# S1/S2 – unabhängiger Integrationsaudit, 21.11.2026

Status: **DRAFT / kein Merge, kein Deployment**. Eigenständiger [Integrations-PR #549](https://github.com/tobiasfranziskus/Check/pull/549) gegen `main 564c2815a63e1446df0ea2409b71acbd0988727b`. Die Reihenfolge im Integrationsbranch ist S1 #546 → unabhängiger Audit #547 samt Korrektur → S2 #548 samt unabhängigen Korrekturen. Keine fremden Forschungsbranches gesammelt integriert.

## Neu geprüfte Ausgangslage

- `AGENTS.md`, maßgebliche Roadmap-/Statusabschnitte, Produktcode, PR-Diffs/Basen und aktuelle CI wurden neu geprüft. UX-Analyse #545 ist eine Referenz, kein übernommener Wirtschaftsentwurf.
- Main wurde wiederholt über `git ls-remote` geprüft. [Pages #44854949550](https://github.com/tobiasfranziskus/Check/actions/runs/44854949550) ist für genau diesen Main-SHA erfolgreich. Letzter ausgeführter Main-Code-Regressionslauf [#44823761459](https://github.com/tobiasfranziskus/Check/actions/runs/44823761459) auf `b62582b` erfolgreich; der folgende Main-Commit ist Dokumentation.
- Auf den ursprünglichen Heads `a12036e` (#546) und `9a1ac57` (#548) waren je fünf Workflows erfolgreich. Das wurde nicht als eigene Integrationsabnahme gewertet.
- #547 auf `fc6aed9` hatte zwei fehlgeschlagene Workflows. Der lokale Test und die unabhängige Auswertung der JS-CI-Logs belegten dieselbe falsche Testvorbedingung.
- Die geprüften benachbarten Codex-Chats waren idle; neue PR-/Branch-Abgleiche zeigten keine gleichzeitig fortschreitende andere Änderung an den bearbeiteten Produktdateien. Bestehende Nutzerdateien und die Analysearbeiten #526–#528/#545 wurden nicht geändert.

## Nachgewiesene Fehler und Korrekturen im jeweiligen Branch

| Stufe | Unabhängiger Nachweis | Korrektur / Commit |
| --- | --- | --- |
| S1-Audit #547 | Ausgangswelt enthält einen fremden Miner, keinen fremden Frachter; Test brach vor der Eigentumsgrenze ab | Tatsächlichen Fremdminer mit Original-Eisauftrag prüfen; `5129fd3` |
| S1 #546 | Industrieanzeige leitete „In Bereitschaft“ allein aus fehlendem Auftrag ab | „Kein laufender Auftrag“ für Raffinerie/Werft; `a105c6b` |
| S1 #546 | Zwei schnelle echte Touch-Tipps auf den direkten Miner-Kauf buchten zweimal: 1.800 statt 2.400 ISK | Gemeinsamer UI-Auftragspfad unterdrückt dieselbe erfolgreiche Aktion für 350 ms; `e6c02f3` |
| S2 #548 | Zwei Touch-Tipps auf Stop starteten über den ersetzten Startknopf sofort wieder Förderung | Flüchtiger 350-ms-Gestenschutz und erneute Prüfung der aktuellen Schiffsauswahl; `292760e` |
| S2 / Original-K1 | Für 600 ISK gekaufter Miner nach 2.041 tatsächlich bezahlten Flugminuten: Bericht `stillgelegt=true`, am Dock trotzdem positive Eisofferte | Vorhandenen K1-Stilllegungsprüfer auch vor neuem `shipShuttle` anwenden; genau eine zusätzliche Core-Validierungszeile, `717ea27` |
| S2 Browserabnahme | Vorheriger Browserlauf begann Förderung/Fracht über den Handelsführer | Beide Originalaufträge jetzt direkt über eigene S2-Schiffsauswahl buchen; `2fe7537` |

Die letzte Core-Korrektur setzt die bereits vorhandene Stilllegungsregel durch. Preise, Löhne, Kapazitäten, Produktionsrezepte, Politikvorgaben, RNG, Regelnummern, Save-Schema und Referenzwerte wurden nicht geändert. Stoppen vorhandener Aufträge bleibt erlaubt. Kein UI-Code bucht selbst Geld oder Waren.

## Tatsächlich ausgeführte Prüfungen

- **Node22.23.4:** vollständiger Lauf vor dem zusätzlichen Stilllegungsbefund 565/565, 0 Fehler/Skips/Abbrüche. Abschließender vollständiger Lauf nach der Core-Korrektur: **566/566, 0 Fehler, 0 Skips, 0 Abbrüche, Exit 0** ([vollständiges TAP-Protokoll](audit/m4-integration-20261121/node22-final.tap.gz)). Enthalten sind die vorhandenen Geld-/Waren-/Eigentums-/Alt-Save-/Referenzprüfungen, 68 Sicherheitsfälle, mehrere 13×90-Matrizen und S02×365/730; keine Referenz angepasst. Die gezielte Stilllegungs-/S1-/S2-Regressionsgruppe bestand bereits 10/10.
- **Unabhängiger Original-Verschleißtest:** Originalpolitik `stilllegung=true`, bezahlter Kauf, Abdocken, 34×60 + 10 echte Weltminuten und reguläres Docken. 2.041 Lohn-ISK auf `pilot_house`, Hauskasse 359 ISK, Restbuchwert 0. Negative Quote und Ausführung ohne Save-Mutation; Save/Load; Original-Geld-/Waren-/Eigentumsaudit und 33.000 Welt-ISK, Mint/Burn 0. Vor Korrektur rot, danach grün. Kein injizierter Verschleiß oder Kassenwert.
- **Alt-Save zusätzlich:** bisherigen Original-Main-Core direkt ausgeführt und damit einen Save mit bereits eingetragenem Pendelauftrag der abgenutzten Hülle erzeugt. Neuer Loader exportiert ihn bytegleich; reguläres Stoppen möglich, Originalaudit grün. Hash des historischen Zustands `ae1b8fc4ec71b2fe`. Kein Löschen oder stilles Migrieren.
- **Chromium-Touch, echte Browserprozesse** ([Protokoll](audit/m4-integration-20261121/chromium-s2-direkt.log)): 4/4 mit 1180×820, 1024×768, 820×1180, 390×844. Root → Karriere → Miner-/Frachterkauf → S2-Eisförderung → S2-Fracht → Hin-/Rückfahrt → 240 ISK Frachtgebühr und 120 ISK getrennte Pilotenlöhne → Speichern → Reload/Fortsetzen. Zusätzlich Eigentumsauswahl, Original-Sperre während Fracht, Auswahl ohne Saveänderung, Stop/Start, Doppeltipp bei Kauf und Stop, Tastaturfokus, Orientierungswechsel und kein horizontaler Überlauf.
- **Bestehender Handelsweg separat, Chromium** ([Protokoll](audit/m4-integration-20261121/chromium-handelsweg.log)): 4/4 Größen mit zwei Rundfrachten, Wasser-/Original-Nachfinanzierung, NPC-Markt und Reinvestition erfolgreich. Lokaler Browseradapter verwendet ausschließlich das vorhandene `/usr/bin/chromium`, keine Produktabhängigkeit.
- **HTTP-Mounts:** Root `/`, GitHub-Pages-artig `/Check/` und NAS-artig `/nas/spiele/aphros/` in echten lokalen Browserläufen. Das ist keine Prüfung eines privaten NAS.
- **Referenzen:** `30a46fa2f3f3a2e3` Hinfahrt, `f64b8006ce6ce88f` Rückfahrt, `4e86f3fc27a6005a` Abschluss. Zweifacher deterministischer Originalreplay, bytegleicher Save/Load und Original-W6-Audit in den S1-/S2-Nodeprüfungen. W5ac-Test baut die Hülle durch W3→W4→W5, kauft sie regulär für 750 ISK und prüft echte bezahlte Überführung, Sperren, Doppelverweigerung und Save im Transit.
- **Statischer Bestand:** `node scripts/build-w5-singlefile.mjs --check` grün, 328.726 Zeichen, 7 Styles und 15 eingebettete Skripte; `git diff --check` grün. Root-`index.html` und NAS-`aphros-void.html` unverändert.
- **WebKit lokal:** nicht gestartet. Browserdownload scheitert mit HTTP 403; die verwaltete Umgebung erlaubt Paketmanager-Hosts, nicht die Playwright-CDN-Domains. Eigene Chromium-/WebKit-CI auf dem finalen Integrationshead ist separat unter [Checks #549](https://github.com/tobiasfranziskus/Check/pull/549/checks) zu prüfen. Wartende oder laufende Jobs gelten nicht als bestanden.
- **Öffentliche Root-HTTP-Abnahme:** Abruf hier HTTP 403. Der bestätigte bisherige Pages-Deploy ersetzt keine Interaktionsabnahme des neuen Codes.

Zusätzliche Sichtprüfung aktueller Screenshots bei 1180×820 und 390×844: Stations-/Schiffsauswahl und schematische Frachtposition lesbar, keine überdeckten Kartenelemente. Die lange Auftragsliste bleibt eine bekannte UX-Verbesserungsmöglichkeit; sie blockiert die geprüfte Bedienfolge nicht.

Ausführungsvorläufe mit den oben belegten Testfehlern wurden ausdrücklich nicht als grün gewertet. Ein npm-Vorlauf scheiterte am nicht beschreibbaren Standardcache; Installation im temporären Cache gelang. Playwright bleibt außerhalb des Repositorys. Vollständige Testzahlen sind keine Zahl unterschiedlicher Tests über wiederholte Läufe hinweg.

## Integrationsgate und Wiederherstellung

Gesicherte, neu erstellte Backup-Referenz: Tag [`backup/main-before-m4-s1-s2-20261121`](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-m4-s1-s2-20261121) → `564c2815a63e1446df0ea2409b71acbd0988727b`. Tag wurde nicht überschrieben. Für eine spätere Wiederherstellung diesen Commit auf einem separaten Wiederherstellungsbranch prüfen und über einen normalen PR integrieren; keine Rücksetzung oder Löschung von Nutzerspeichern.

**Draft belassen, bis die eigene vollständige Node22-Regression und beide Browsermatrizen samt übriger ausgelöster Integrations-CI vollständig bestanden sind.** Main/Pages unverändert. Echte iPad-Safari-/NAS-Geräteabnahme und unabhängiger 60-Minuten-Erstspiel-/M4-Nachweis bleiben offen; kein allgemeiner Dauergewinn-/W6-Nachhaltigkeitsbeweis. Geräteprüfung und öffentlicher Deploy sind eigene Nachweise.
