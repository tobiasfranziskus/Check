# K7 – Industrielle Erzvorfinanzierung: nachgewiesene Kapitalkette, fehlendes Original-Vertragsrecht

**[DRAFT / ANALYSE · 12.11.2026]** [PR #314](https://github.com/tobiasfranziskus/Check/pull/314) auf K6 [#313](https://github.com/tobiasfranziskus/Check/pull/313), K5 [#309](https://github.com/tobiasfranziskus/Check/pull/309) und K4 [#308](https://github.com/tobiasfranziskus/Check/pull/308). **Keine neue Produktregel, kein Merge, kein Deployment, keine Änderung an Core, Preis, Startkapital oder Spielstand.** K1-UX-Stack #310–#312 bleibt getrennt. `main` unverändert auf Regel195/Schema8, `04124f2b`.

## Ausgangslage und Fragestellung

K6 hat für S12/Seeds42 und7 mit vier rechtmäßig auf Eis umgestellten `npc3`-Minern **967 tatsächlich geförderte und verkaufte Eis**, **18 abgeschlossene 50er-Eisfrachten**, **900 produzierte und bezahlte Wasser** nachgewiesen. Letzter aktiver Frachter `sh020` wird bei Tick23752 verschlissen; letzte Wasserverkäufe aus vorher gelieferter Ware bis Tick24505. Es fehlen **neues Erz und Material** zum Ersatz. Der Exportetat ist seit Tick3000 leer. Die Frage ist: **Wäre eine 50-Erz-Vorbestellung durch industrielle Firmen aus deren echtem Kapital grundsätzlich finanzierbar, obwohl sie mit dem jetzigen W1-Endnachfragegatter nicht ausführbar ist?**

K7 nutzt ausschließlich den von K4/K5 unabhängig geprüften **Original-S12-Save bei Tick21612**, Seed42 und7. Der **rein lesende** `finanzierungsGate` im Tool `tools/k7-industrieerz-gate.mjs` ruft vorhandene Core-Quotes für W3/W4/W5 ab, liest Eigentum/Kassen/Originalkosten und berechnet konservativ gleichzeitig benötigte Deckung **pro bestehendem Firmenkonto**. Er erzeugt **keinen** Wirtschaftsauftrag. Der zweite Nachweis fordert fünf Originalbefehle auf dem unveränderten Zustand an und verifiziert ihre **atomare Ablehnung**. Alle Resultate werden gegen `canonical` und den Originalhash geprüft.

## [TEST] Finanzen des **noch nicht abgeschlossenen** 50-Erz-Industrieauftrags

| Originaler Vorgang | Kapitalgeber / tatsächliches Konto | Bestehende ISK | Nötige ISK | Deckung |
| --- | --- | ---: | ---: | --- |
| 50 Erz tatsächlich fördern ×2 ISK Lohn | `npc3` | 1597 | **100** | ja |
| 50 Erz am Dock kaufen ×10 ISK | `st_aldera` | 1100 | **500** | ja |
| 50 Erz ×10 ISK + 120 Flugminuten ×2 ISK Tarif | `st_nadir` | 4560 | **740** | ja |
| 5 W4-Raffineriechargen ×20 Lohnminuten ×1 ISK | `st_nadir` | im vorigen Wert | **100 zusätzlich** | ja |
| 120 Minuten Frachtarbeit ×1 ISK | `transport` | 6376 | **120** | ja |
| Material für einen W5-Frachter: 5 ×100 ISK +30 Lohn | `werft_extern` | 530 | **530** | ja, exakt |
| Ein W5-Frachter 750 ISK +60 Minuten Überführung ×1 ISK | `transport` | im vorigen Wert | **810 zusätzlich** | ja |

**Gleichzeitige Deckung pro Eigentümer:** `npc3` 100/1597, `st_aldera` 500/1100, `st_nadir` **840/4560**, `transport` **930/6376**, `werft_extern` **530/530**. Die **2.900 ISK** sind konservativ berechnete, mögliche gleichzeitige Bindungen aus **vorhandenen** Konten, keine schon gezahlten Beträge und keine Geldschöpfung. Die W4-Rezeptkette liefert bei 50 wirklich angeliefertem Erz **25 Material**; ein Frachter benötigt 5. **Das ist keine Aussage, dass fünf Frachter tatsächlich gebaut/verkauft werden können.** Es wurde noch kein einziges Erz zusätzlich gefördert, verfrachtet oder zu Material verarbeitet.

### [TEST] Warum vorhandene Befehle die Lieferkette nicht starten

- `export.cash = 0`; zum aktuellen W1-Preis 10 ISK/Erz fehlt ein echter Endkundenetat von **500 ISK** für eine 50er-Erzcharge, obwohl der Industrieabnehmer Nadir 4.560 ISK besitzt.
- Der vorhandene W2-Krisenstatus lautet `absatzstopp`, `planbar=0`. Ursächlich ist die **alleinige Bindung von W1-Endnachfrage an `export`**, nicht fehlende Mineralvorkommen oder zu wenig finanzierbare Arbeit.
- `shipFreight`: kein wirklich vorhandenes 50-Erz-Quelllager. `stationRefine`: kein in Nadir geliefertes Erz. `stationBuildShip` und `stationBuildMiner`: kein real vorproduziertes W4-Material. `shipBuy`: kein fertiges Frachterschiff auf Lager. **Alle fünf** werden vom originalen Core abgelehnt; die Welt bleibt vor/nach jedem Test bytegleich.

### K7-Referenzhashes (unveränderte Originalwelt bei Tick21612)

- Seed42: `2ca9bbda195ad95e`
- Seed7: `c5f3dc1d185317ac`

Die Hashes sind **absichtlich identisch** zu K6 vor dem Eingriff: Die K7-Liquiditätsprüfung darf weder real buchen noch simulierte Waren als tatsächliche Assets behandeln. Weltgeld bleibt **33.000 ISK**, Mint/Burn **0**.

## [OPTION – NICHT FREIGEGEBEN] Minimaler echter Industrie-Erzvorauftrag

Eine zukünftige Produktentscheidung könnte genau **eine** integrierte K7-Vertragsart über den bestehenden autoritativen Weltkern zulassen; **keinen** neuen Parallelkern:

1. **Nadir als richtiger Auftraggeber** bindet bei Vertragsabschluss **740 ISK seiner eigenen freien Kasse**. Davon sind **500 ISK** für genau 50 physisch verifizierte Erz und **240 ISK** für die tatsächlich abgeschlossene Hin-/Rückfracht vorgesehen. Diese **eine** W3-Kauf-/Frachttreuhand muss beim Transport **übernommen** werden. Ein zweites Sperren derselben 500/740 ISK ist ein Fehler.
2. Aldera bindet gesondert **500 ISK eigene Dockabnahme**, `npc3` bindet **100 ISK echte Förderlöhne**, `transport` bindet **120 ISK echte Frachtlöhne**. Dies sind getrennte Rechtsverpflichtungen – **keine** zweite Industriekäuferzahlung.
3. Das neue W1-Recht müsste Industrienachfrage **ausschließlich innerhalb eines tatsächlich bestehenden, gedeckten, einmaligen Nadir-50-Erzvertrags** anerkennen und dafür das vorhandene W1-Vertragsbuch, die Feld-/Dockprüfung, Eigentümerbuchungen und Lagergrenzen weiterverwenden. Der Exportkontostand wird **nicht** verändert; keine fingierte Exportlieferung.
4. Ein entsprechender Minervertrag darf nur ein nicht stillgelegtes eigenes Schiff, echten Feldflug und die real bezahlte Arbeitsleistung beanspruchen. Erst bei physischer Dockabgabe wird das Erz **einmal** von `npc3` auf Aldera übertragen. Keine Fernförderung oder Phantomware.
5. W3 belädt ausschließlich reale 50 Erz und übernimmt die Käuferdeckung aus **derselben** Vertrags-/Treuhand-ID. Auszahlungen nur bei physischer Nadir-Ankunft (500 Ware an Aldera) bzw. bezahltem Rückflug (240 Tarif an Spedition). **W4 und W5 bleiben die vorhandenen Originalbefehle**. Die Vorbestellung darf keinen unbegrenzten Produktionsanspruch begründen.
6. **Abbruch- und Krisenfälle vor Implementierung festlegen:** Storno vor Förderung; Abbruch bei halber Erzcharge; 2. Auftrag gegen dieselbe Treuhand; Frachterverlust, fehlende Rückflugfähigkeit, Firmeninsolvenz, Lieferverzug, mangelhafte Waren-/Eigentumsrechte. Unverbrauchte **gebundene** Beträge müssen an die tatsächlichen Zahler zurückgehen; bereits bezahlte reale Arbeit wird **nicht rückgängig oder kostenlos gemacht**. Rechtmäßig erzeugte/gekaufte Ware bleibt Eigentum ihres tatsächlichen Besitzers.
7. Nur gegen ausdrückliche Freigabe das Vertragsrecht im vorhandenen W0–W5-Kern als neue **separat versionierte Forschungsregel** mit unveränderten alten Saves/Hashes testen; danach **mindestens 13 unterschiedliche 90-Tage-Wirtschaften**, Krisenseeds und relevante 365-/730-Tage-Durchläufe. Kein neues Geldmodell, keine automatische Hilfe für `house` und keine heimliche Migration.

**Offene wirtschaftliche Entscheidung:** Ist eine industrielle **bindende** Nadir-Vorbestellung für 50 Erz mit vollständiger Käufer-Kauf-/Frachttreuhand und einem bei Erfolg physisch übertragenen Eigentumsanspruch zulässig? Ohne diesen Beschluss gibt es keinen Produktweg vom rechnerisch gedeckten Angebot zur autoritativen Buchung.

## Prüfungen und Einschränkungen

- **[TEST / 12.11.2026]** Auf CI-Testcode-Head `de7b08e4ff42c17ceb27799a3c3e9054a136ecf1` lief der gezielte Job `k7-industrielles-erz-gate` in [GitHub Actions #43247132584](https://github.com/tobiasfranziskus/Check/actions/runs/43247132584) **erfolgreich, 4/4 K7-Tests** (beide Seeds, atomare Originalverbote, falsche Eigentümer und Mengen, unveränderte Hashes und Kassen, 50-Erz-Vollkostenvorschau). Das K1/K4/K5/K6- sowie Browser-/historische Gesamt-CI des Heads wird separat nach Abschluss ausgewiesen.
- **Nicht getestet oder behauptet:** K7-Bergbau-/Fracht-/Werftproduktion, Live-NPC-Disponent, 13×90-Tage-K7-Betrieb, Nachhaltigkeit, Vertragssicherung/Erstattung in einem neuen echten Save, reale iPad-Safari-/NAS-Abnahme. K7 ist absichtlich **kein** positiver Produktions- oder Dauerwirtschaftsnachweis.

**Schluss:** Die Finanzierung ist als **potentiell vollständig gedecktes Angebot** nachgewiesen, nicht als abgeschlossener Handel. Der nächste echte Entwicklungsfortschritt ist eine freigegebene **einfache, auditierbare Industrie-Vorbestellung mit genau einer Käufer-Treuhand**, nicht eine weitere künstliche Emission oder Kapitalrettung.
