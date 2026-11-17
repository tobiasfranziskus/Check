# W6/R1 – endliche Rohstofffelder, Issue #469

**[DRAFT / FORSCHUNG, 17.11.2026] Kein Merge, kein Deployment, keine Parameterfreigabe.**
Ausgangsstand: `bf8d4d27e87914abf725992e41752577dc7106cc`, per GitHub-Commitabfrage als aktueller main bestätigt. Der lokale Checkout ist identisch. Git-Fetch scheitert in dieser Umgebung an Proxy/DNS; GitHub-Connector funktioniert. Am main-Commit lieferte die auf PR-Workflows begrenzte Connector-Abfrage keine Läufe (docs-only #467); das ist keine vollständige Main-/Pages-CI-Abnahme. Keine grüne CI für diesen Commit behauptet. AGENTS.md, docs/README.md, aktuelle W6-/P3-Abschnitte von ROADMAP und PROJEKTSTATUS sowie Mining-/Save-Code gelesen. Vorheriger veröffentlichter #458-Nachweis ist historisch, kein Test dieses PRs.

## Inventur und Dateigrenzen

- `rule200-k7-industry-core.js`: Geologie bisher nur `world.fields(system,ware,miner)`. Erz/W3 hat echte Arbeits-/Kauftreuhand, Eis/W5n echte Löhne/Stationskassen. Förderung war geologisch unbegrenzt. Forschung hängt Mengenfreigabe **vor** und Entnahme **nach** die originale bezahlte Warenbuchung. Keine Änderungen an Preisen, Verträgen, Rezepten, Schiffsbau oder Kassen.
- `j2b-silizium-core.js`: 2 × 16 echte endliche Einheiten in Regel207; `minute()` bucht Lohn, Fracht, Ledger und Geologie. Forschung benutzt denselben Pfad; der bestehende Audit berücksichtigt ausschließlich bei aktivem Forschungsadapter die nachgewiesenen weiteren Generationen.
- `welt-kern.js`: ein Originaltick, gleiche Flug-/NPC-/Industrie-/Save-/Hash-Funktionen. Neuer expliziter **Node-only** Konstruktor `erstellenRohstoffForschung('A'|'B'|'C')`. Normale Regel204/207 erhält keinen Zusatz und dieselben serialisierten Bytes. R1-JSON wird im normalen Weltwrapper abgelehnt; normale Saves werden nicht automatisch R1. Vorhandene P8g-Importzustimmung bleibt zusätzlich nötig.
- Neues `rohstoff-forschung-core.cjs`: einziges Geologiebuch für Erz, Eis, Silizium; Kristall ist im Modell vorgesehen, in Regel207 fehlt aber ein finanziertes Feld-/Produktionsrecht. **Kristallförderung bleibt gesperrt.** Kein neuer Weltkern, Framework, Backend oder Browserpfad. Technischer Teilnachweis für drei Rohstoffe gemäß der ausdrücklich erlaubten Teillieferung in #469; keine Behauptung einer fertigen Vier-Waren-Integration.
- Neue Tests, CLI, eng begrenzter Node22-CI-Workflow, dieser Bericht und Ausführungsnachweise. Root, P2, P3, Karrierecontroller und Nutzer-Speicherplätze unverändert.

## Mechanismus und Nachweise

`kanon.rohstoffe` enthält eine ausdrückliche Modell-/Profilkennung. Jedes reale Feld speichert `feldId, system, ware, maxkapazitaet, foerderrate, minuten, wartezeit, restmenge, gefoerdert, generation, respawn, letzte, ereignisse`. Ein Feldslot bezeichnet den bestehenden realen Förderort; `feldId:generation` bezeichnet das einzelne Vorkommen. Bei Erschöpfung wird genau ein Ereignis mit deterministischer ID und Fälligkeit `leer + wartezeit` gebucht. Erst vor der Wirtschaftsminute der Fälligkeit entsteht dort das nächste unerschlossene Vorkommen. **Keine Wiederentdeckung durch Kartenscan/Prospektion implementiert**; dies ist eine zeitgesteuerte neue Generation am gleichen Ort. RNG bleibt unberührt, da keine Zufallswahl gebraucht wird.

Mengenfreigabe gilt für das tatsächliche Schiffssystem und den Originalförderpfad. Frachtraum, physischer Feldaufenthalt, Eigentum, Löhne und Käuferreservierung prüft weiterhin der vorhandene Core. Nach bezahlter Förderung wird dieselbe Menge geologisch abgebucht. Pro Schiff und Tick ist höchstens eine Entnahme möglich; mehrere Schiffe teilen die begrenzte Restmenge in der bestehenden sortierten Schiffreihenfolge. Respawn erzeugt ausschließlich geologischen Bestand; Geld, Cargo, Ledger und Schiffe bleiben davon unberührt. Bei Silizium spiegeln die bisherigen Feldkonten dieses eine Geologiebuch; es gibt keine zweite Förderbuchung.

Audit rekonstruiert Gesamtpotenzial aus Kapazität und Generationen, kontrolliert Ereignisanzahl/-IDs/-Reihenfolge/-Zeit, Profilkonstanten, Restmengen, letzte Minereigentümer und Übereinstimmung mit den originalen mined-Ledgern und Siliziumkonten. Zusätzlich laufen Original-Kassen-/Fracht-/Lohn-/Kauf-/Eigentumsaudits sowie der unabhängige physische Lager-/Cargo-Abgleich in `W6.pruefen`. JSON ist **nicht kryptografisch signiert**: konsistent neu erfundene komplette Historien sind damit wie bei vorhandenen Saves nicht als echte Herkunft beweisbar. Einzelmanipulationen, doppelte Events und rückdatierte Erneuerung werden abgelehnt.

## Balancing-Entscheidungsvorlage – ausschließlich unfreigegebene Varianten

Angaben pro Feld: Kapazität / maximale Menge je produktivem Schritt / Taktabstand in Minuten / Wartezeit nach Erschöpfung in Tagen. Silizium braucht zusätzlich unverändert acht bezahlte Arbeitsminuten je Einheit; der Taktabstand verlängert deren Kalenderdauer. Originalpreis 24 und Lohn 2 bleiben unverändert. Warte-/Flugminuten können zusätzlich reale Flugreserve verbrauchen; kein versprochener Stückgewinn.

| Rohstoff | A: kürzere gemeinsame Wartezeit | B: längere Wartezeit/seltenes Silizium | C: knappe Krisenvariante |
| --- | --- | --- | --- |
| Erz | 400 / 1 / 1 / 1⁄6 | 400 / 1 / 1 / 1 | 50 / 1 / 2 / 7 |
| Eis | 400 / 1 / 1 / 1⁄6 | 400 / 1 / 1 / 1 | 50 / 1 / 2 / 7 |
| Silizium, je Nadir und Dravos | 16 / 1 / 1 / 7 | 16 / 1 / 2 / 14 | 16 / 1 / 4 / 28 |
| Kristall, nur künftiges Modell, **kein aktives Feld** | 8 / 1 / 4 / 14 | 8 / 1 / 8 / 28 | 8 / 1 / 16 / 56 |

Silizium ist gegenüber Erz/Eis über kleinere Lagerstätten, längere produktive Gewinnung und seltenere neue Generationen knapp. Kristallwerte sind nur eine strukturelle Option, kein simuliertes Warenangebot. Keine neuen Erlös-/Preisvorschläge werden aktiviert. Vor Integration braucht jede konkrete Zahl eine eigene Freigabe, ebenso Kristall-Feldrechte, Arbeitsfinanzierung und tatsächliche Käufer.

## Reproduktion und Prüfgrenzen

Node **v22.23.4**, ohne npm-Abhängigkeiten:

```sh
node --test tests/*.test.mjs
node --test tests/rohstoff-forschung.test.mjs
node tools/rohstoff-forschung.cjs A
node tools/rohstoff-forschung.cjs B,C,alt
```

Die drei ursprünglichen Kernquellen wurden direkt aus `bf8d4d27` separat kompiliert und Start sowie 3.000 Minuten beider alten Regeln unabhängig gemessen. Die kleine Fixture `tests/fixtures/rohstoff-main-bf8d4d27.json` bindet deren gesamte Save-Bytes mit SHA256 sowie die Original-Core-Hashes. Der Regressionstest benötigt dadurch keine Git-Historie und läuft auch in flachen CI-Checkouts; keine bestehenden Referenzen wurden ersetzt. Bestehende feste Referenzhashes und P3-Doppelhandel werden nicht aktualisiert. Zwei unabhängige 30-Tage-R1-Replays vergleichen die gesamten Save-Bytes; außerdem wird in eine frisch erzeugte Welt importiert. Die CLI führt pro Variante alle 13 wirtschaftlich unterschiedlichen Regime 90 Tage aus, S02 zusätzlich bis 365/730, mit Audits/Save-Load spätestens alle 30 Tage. Drei echte 900-ISK-Hauskäufe sind das vorhandene Testprotokoll, **kein neuer NPC-Käufer und keine Absatzgarantie**.

Browser/Chromium/WebKit/Touchmatrix nicht ausgeführt: R1 ist bewusst **kein browser-spielbarer Modus**. Keine iPad-/NAS-Abnahme, kein HTTP-/Pages-Gate, keine Veröffentlichung. Der zusätzliche CI-Workflow führt nur Tests/Analyse aus und veröffentlicht keine Seite.

## Negativbefunde und Integration

- Vorversuch mit nur 100 Erz je Feld und 1–2 Tagen Wartezeit: konkurrierende Miner können mit Teilfracht am leeren Feld warten, bis die Flugreserve endet. S02 steht dann bei 200 Erz, 0 Eis, 0 Silizium, 0 Jägern. Später wieder vorhandene Geologie ist keine bezahlte Rettung. Abgebrochene Vorversuche sind als unvollständig gekennzeichnet, nicht als 13×90-Abnahme.
- Während der Testentwicklung wurden eine fehlende strenge Profilpflicht und ein fehlender Abgleich des letzten Minereigentümers im neuen Geologiebuch gefunden und behoben. Die fehlgeschlagenen Testlogs bleiben erhalten. Original-Regel204/207 wurde dafür nicht wirtschaftlich verändert.
- Erneuerte volle Siliziumfelder allein erzwingen weder Transportdisposition noch Absatz. Lagerziel, echte Käuferkassen, Werftfinanzierung, verschlissene Hüllen und NPC-Verhalten bleiben reale Engpässe. Eine stehengebliebene Wirtschaft gilt nicht als Auditfehler und nicht als nachhaltiger Kreislauf.
- Kein Opt-in aus einem editierbaren JSON-Flag. Kein Einbau in 204/207-Karriere-UI. R1 verwendet einen zusätzlichen strikt isolierten Forschungsumschlag innerhalb Regel207; vor produktiver Integration empfiehlt sich eine ausdrücklich beschlossene neue Regelnummer mit eigener vollständiger Ladevalidierung und Browserabnahme. Keine ungefragte Save-Migration.
- Separat zu entscheiden: Kristall-Feld/Finanzierung; tatsächliche räumliche Entdeckung statt Generation am selben Slot; finanzierter Abbruch oder Rückflug bei Erschöpfung; freizugebende Profilwerte. Vor jedem Integrations-PR unabhängige Prüfung durch ChatGPT, Alt-Save-/P3-/Browsergate und erneuter main-Abgleich. **Nicht diesen Forschungsbranch pauschal mergen.**

## Ausführungsresultate

Die folgenden Zahlen und Hashes werden aus den unveränderten CLI-Logs übernommen. Einheiten sind originale Core-Wareneinheiten; keine unbelegte Umrechnung in Tonnen.

Profil A: **13/13 Szenarien auditiert**, S02 zusätzlich 365/730; zweiter unabhängiger 730-Tage-Lauf einschließlich aller Messpunkte bitgleich. Die vier gezielten Tests sind bestanden. Rohlogs und negative Zwischenläufe: [Nachweisindex](nachweise/issue469/README.md).

| Profil A/S02 | Erz gefördert | Erz exportiert | Eis gefördert/verkauft | Silizium gefördert/verkauft | Jäger | Endhash |
| --- | --- | --- | --- | --- | --- | --- |
| Tag 90 | 2250 | 1960 | 2170/2169 | 32/32 | 4 | `432e5c5e3e7601a2` |
| Tag 365 | 2250 | 1960 | 2170/2169 | 32/32 | 4 | `3a7600b06401b49c` |
| Tag 730 | 2250 | 1960 | 2170/2169 | 32/32 | 4 | `40daa9a846e27337` |

A/S02: 4.500 ISK originale Erzarbeit + 4.340 ISK Eisarbeit + 512 ISK J2b-Siliziumarbeit (32 × 8 × 2), zusätzlich echte Flug-/Fracht-/Industriearbeit laut Rohlog und Originalaudit. 32 verkaufte Siliziumeinheiten binden/bezahlen 768 ISK aus der echten Käuferkasse. Eis-Erstverkauf 2.169 Einheiten; Erzexport 1.960 Einheiten, interner Weiterverkauf nicht nochmals als zusätzliche Förderung gezählt. Kristall bleibt 0. Weltgeld an allen Prüfpunkten 33.000 ISK, Mint/Burn 0.

Beide Siliziumfelder sind nach je 16 tatsächlich geförderten Einheiten bis Tag90 erneuert und wieder voll (je 16 Rest); es wird danach **kein** weiteres Silizium verkauft. Erz und Eis haben jeweils fünf Erneuerungen. A beseitigt damit den lokalen geologischen Endzustand, liefert aber **keinen Nachweis weitergehenden Siliziumabsatzes oder Förderung über die ursprünglichen insgesamt 32 Siliziumeinheiten hinaus**. S02 bleibt wirtschaftlich stehen; neue geologische Möglichkeiten sind keine garantierten Käufer.

**Gesamter Vergleich abgeschlossen: 52/52 Szenarioläufe auditiert** (4 × 13×90, je S02 bis 730 mit Tag365-Prüfpunkt). Alle Messpunkte 33.000 ISK, Mint/Burn 0; sämtliche Core- und unabhängigen Waren/Kassenprüfungen sowie JSON-Roundtrips bestanden.

| Profil | Regime ohne Jäger bis Tag90 | S02 Tag | Erz/Eis/Silizium gefördert | Eis/Silizium verkauft | Jäger | Hash |
| --- | --- | --- | --- | --- | --- | --- |
| alt | 9/13 | 90 | 2250/3056/32 | 3011/32 | 4 | `32a72c8050699525` |
| alt | 9/13 | 365 | 2250/3056/32 | 3011/32 | 4 | `a2a150fa878224b9` |
| alt | 9/13 | 730 | 2250/3056/32 | 3011/32 | 4 | `d50f27e2c0b8e409` |
| A | 7/13 | 90 | 2250/2170/32 | 2169/32 | 4 | `432e5c5e3e7601a2` |
| A | 7/13 | 365 | 2250/2170/32 | 2169/32 | 4 | `3a7600b06401b49c` |
| A | 7/13 | 730 | 2250/2170/32 | 2169/32 | 4 | `40daa9a846e27337` |
| B | 13/13 | 90 | 890/0/0 | 0/0 | 0 | `830619bd51ed818e` |
| B | 13/13 | 365 | 890/0/0 | 0/0 | 0 | `502cfca5195abef6` |
| B | 13/13 | 730 | 890/0/0 | 0/0 | 0 | `23050cec9ae1a33c` |
| C | 13/13 | 90 | 100/0/0 | 0/0 | 0 | `b79230bc490f8a7d` |
| C | 13/13 | 365 | 100/0/0 | 0/0 | 0 | `8405463f3d013930` |
| C | 13/13 | 730 | 100/0/0 | 0/0 | 0 | `490df18e0b94a719` |

B und C scheitern bereits vor der Siliziumindustrie; sie sind keine tragfähigen Balanceempfehlungen. A verbessert die geologische Möglichkeit, beweist aber keinen zusätzlichen Absatz gegenüber dem alten S02-Lauf. Vollständige 90-Tage-Hashes sämtlicher Regime stehen in den JSONL-Nachweisen. Kein Profil ist produktiv freigegeben.

**Abschließende Node22-Gesamtregression: 519/519 bestanden**, 0 Fehler, 0 Skips, 0 Abbrüche, Exit 0. Enthält Original-Geld-/Waren-/Eigentums-/Save-/Referenzhashprüfungen, P3-Doppelhandel, die vorhandenen 13×90-/365-/730-Regressionen und die vier neuen R1-Prüfungen. [Vollständiger Log](nachweise/issue469/node22-final.log). GitHub-CI ist davon getrennt; vor Merge unabhängig prüfen.

CI-Portabilität: Nach PR-Erstellung wurde die Git-Historienabhängigkeit des neuen Quellenvergleichs durch die unabhängig aus ursprünglichem main erzeugte SHA256-Fixture ersetzt. Dies ändert keine Simulationsquelle oder Ergebnisse. Der gezielte Endtest wurde nochmals ausgeführt; die vollständige vorherige 519/519-Regression und alle Simulationsnachweise behalten unveränderte Core-/CLI-Quellen (nur Testquelle verändert).

Unabhängige Referenzerzeugung mit vorhandener Git-Historie: `node tools/rohstoff-referenz.cjs` (liest ausschließlich die drei ursprünglichen Kernquellen und schreibt JSON auf stdout; keine automatische Fixture-Aktualisierung). Ausgabe muss der eingecheckten Fixture entsprechen.

### Ergänzung: unabhängiger Review – Verlust-/Eigentumshistorie (ChatGPT, 17.11.)

Die unabhängige Prüfung identifizierte eine echte Robustheitslücke im neuen R1-Adapter: `felder[id].letzte` war als dauerhafter Verweis auf das jeweils aktuelle `state.ships[minerId]` auditiert. Der bestehende originale Sicherheitskern kann bezahlte Bergbauschiffe anschließend rechtmäßig zerstören und aus `state.ships` entfernen. Auch spätere Eigentumswechsel dürfen eine historische Förderminute nicht nachträglich ungültig machen.

**Korrektur im Forschungsbranch:** Die `letzte`-Fördermarker bleiben bewusst **über Folgeminuten erhalten**, solange das Minerschiff existiert. Sie prüfen damit weiterhin die unveränderte Eigentümerzuordnung der nachweislich geförderten Schiffe. Der originale `m_core_sicherheit.entfernen`-Verlustpfad benachrichtigt den Adapter vor der legalen Schiffs-Löschung; nur dessen letzten Fördermarker entfernt der Adapter. Fördermengen, abgebuchte Feldreste, Ledger, Eigentum, Verluststatistik und Kauf-/Lohnbuchungen bleiben unangetastet. Ein willkürlich veränderter Live-Eigentümer muss weiterhin vom Geologie-Audit abgelehnt werden. **Ein späterer echter Schiffseigentumswechsel ist in Regel207 nicht vorhanden**; bei einer künftig eingeführten Übertragung ist eine eigenständige, belegte Eigentümerwechsel-Schnittstelle nötig.

Zwei zusätzliche gezielte Modelltests vergleichen den ungemeldeten Eingriff mit der vom Originalkern signalisierten Entfernung, bewahren die Förder-/Geldbuchung und prüfen historische bzw. gefälschte Eigentumsmarker. **Die Modellgegenprobe simuliert dabei die Auswirkung des originalen Entfernen-Schritts und beansprucht keinen vollständigen Regel207-Piratenschaden-Durchlauf.** Die bestehende Forschungsregel besitzt im S02-Modus keinen gezielt abrufbaren echten Miner-Zerstörungsbefehl. Eine vollständige Combat-/Verlustsimulation im späteren spielbaren Vier-Waren-Modell bleibt deshalb eine gesonderte Integrationsabnahme.

GitHub-CI, Szenarienmatrix und Nachweise für den neuen Head sind nach diesem Patch **erneut** unabhängig zu prüfen. Es werden keine konkreten Profilwerte freigegeben, und es erfolgt weder ein Merge noch ein Pages-Deploy.

**CI-Korrekturschleife:** Der erste ChatGPT-Korrekturcommit `1c0387fb` war **nicht bestanden**: bei 521 Tests gab es 520 Erfolge und einen Fehlschlag im bereits bestehenden Manipulationsschutztest (später Eigentümerwechsel ohne belegten Originalvorgang wurde nicht mehr erkannt). Deshalb wurden die pauschale pro-Tick-Bereinigung zurückgenommen und der originale Eigentumsbeleg beibehalten. Nur der autoritative Verlustpfad bereinigt den Marker. Die vier Szenarioprofile im ersten Korrekturlauf waren grün, **aber dies ersetzt nicht die fehlgeschlagene Gesamtregression**. Der zweite Korrekturcommit muss vollständig neu geprüft werden.
