# C1b-2 – bezahlte Industrievorstufe, Export noch offen

**DRAFT / FORSCHUNG, 08.11.2026.** Bewusst begrenzter Zwischennachweis gemäß Abbruchklausel des Auftrags. **Kein vollständiger Industrieexport und kein positiver Nachweis des zweiten Einkommenskanals.** Direkt auf [#247 / 83538e9](https://github.com/tobiasfranziskus/Check/pull/247), darunter #246/#243. Konzept und sämtliche C-Werte bleiben unbeschlossene Annahmen aus [#245 / 008728e](https://github.com/tobiasfranziskus/Check/blob/008728e1f011540842eb090144fa40b284833788/docs/GESAMTWIRTSCHAFT_REFERENZMODELL.md). Geprüfter main: fd3e915. Keine Änderung an index.html, Produktregeln, Spielständen, Pages, Roadmap oder bestehenden Messdateien.

## Ausgeführter kleiner Nachweis

Ein einziges C-Materiallos im bestehenden Minuten-Core, keine neuen Produktions-, Zahlungs- oder Transportfunktionen. Das Profil `aphros-research:C1b-2:material-precursor-v1` / Forschungsregel3302 wird durch denselben Node-Registrierungsweg wie C1b-1 aufgebaut. Nur das W4-Rezept wird auf **10 Erz → 4 Material, 10 Minuten, 1 ISK/Minute** gesetzt; Materialpreis48 ist ein Regelparameter, kein im Versuch erzielter Verkauf. W2/W3/W4 bleiben die ausführenden Originalfunktionen.

| Zeitpunkt | Tatsächlicher Vorgang / Herkunft und Eigentum |
| --- | --- |
| Tick0 | House kauft sh003 für600 aus eigener Kasse von `werft_extern`. Kein Gratisminer. Der bestehende NPC-Eisminer erhält zunächst einen Haltebefehl; die vorhandene Wasserautomatik darf danach regulär weiterarbeiten. |
| Tick1–60 | House fördert60 Erz, zahlt120 ISK aus vorab gesperrter Arbeitstreuhand. Original-R32: 1 Erz/Minute für2 ISK, **nicht** C-Erzförderung mit4 Minuten. House verkauft alle60 für600 aus realer Aldera-Kasse. Kein Anfangserz. |
| Tick60 | Großhändler `export` hat50 Erz für500 vorhandene ISK gekauft und als eigenen Bestand im Aldera-Lager verbucht. Der Kontoname bedeutet **keine** externe Emission. Später kauft er weitere10 für100. |
| Tick60 | Nadir sperrt740 ISK (500 Erz +240 Rundfracht); Spedition sperrt zusätzlich120 ISK Pilotenlohn. 50 Erz werden physisch auf sh002 geladen, Großhändler bleibt bis zum Kauf bei Ankunft wirtschaftlicher Eigentümer; Spedition ist Frachtführer. |
| Tick61–120 | 60 bezahlte Hinflugminuten; vor Tick120 kein Erz in Nadir. |
| Tick120 | 50 Erz physisch in Nadir;500 Kaufgeld gehen an den Großhändler. **Dieselben** ISK, kein zweites Minting beim Wiederverkauf. Nadir besitzt das Erz. Weitere10 Erz bleiben beim Händler und erklären dessen Endkasse19900. |
| Tick120 | Nadir sperrt10 zusätzliche ISK Raffinerielohn. Das Erz bleibt bis Fertigstellung im Lager und für das offene Los reserviert. |
| Tick121–130 | Zehn tatsächlich bezahlte W4-Minuten. Erst Tick130: zehn Erz verbraucht, vier neue Material im Nadir-Lager, Eigentümer Nadir. Anfangsmaterial0. |
| Tick121–180 | 60 weitere bezahlte Rückflugminuten. Vor der letzten Minute bleibt1 ISK reserviert. Erst nach vollständigem Rückweg gehen240 Frachtumsatz an die Spedition. Danach darf die bestehende Automatik dasselbe Schiff erneut einsetzen. |

Keine zusätzliche Waren-/Geldwelt im Adapter. Alle Treuhandkassen sind echte, genau einmal zur Weltgeldsumme gezählte Owner-Konten. Die Tests rekonstruieren minutenweise Warenledger, sechs relevante Kassen unabhängig vom Core-Audit, Arbeitsreserven, Schiffsidentitäten, Eigentümer, Route, Ladung und Ankunft. Save/Load während Hinflug, teilfertiger Produktion und Rückflug; zwei Seeds (42/7) mit identischem Doppel-Replay des Vorgangs. Die dreitägige Seed42-Folge erhält tägliche Save/Load-/Replay-Hashprüfungen. Fehlerproben: fehlendes Erz, fremder Auftraggeber, fehlendes Produktionskapital, Doppelauftrag und manipulierte Arbeits-/Herkunfts-/Kassen-/Eigentums-/Mintbelege.

## Einkommen und Wasserkäufe

| Seed42, Tag3 | unverändertes C1b-1 | mit geplantem Vorstufenauftrag |
| --- | ---: | ---: |
| an Wasserhaushalte ausgezahlte Löhne | 1140 | 1140 |
| bezahlte Wasserkäufe | 29 | 28 |
| Haushaltskasse | 2018 | 2036 |
| neue Raffinerielöhne im separaten Arbeiterkonto | 0 | 10 |
| Exportauszahlung / Mint | 0 / 0 | 0 / 0 |
| Hash | d1c83aa0e4c78284 | ae2c1c7db6b90e0b |

Die zehn zusätzlichen privaten Raffinerie-ISK sind real verdient, bleiben aber bei `arbeitskraefte_nadir`. Kein Transfer aus dieser Quelle an `w5n_kunden`, folglich **kein nachgewiesener weiterer Wasserkauf aus Exportarbeit**. Auch die120 W3-Piloten-ISK bleiben im Transportarbeitsfonds. Die unveränderte C1b-1-Identität verbietet `w5s`; dessen optionale Industrie-/Erzpilotenlohnverteilung ist damit nicht aktiv. Sie ist ein vorhandener Integrationsansatz, kein Anlass, einen zweiten Lohnverteiler in Node zu schreiben.

Der Vergleich ist eine kurze Referenz neben einem anderen Ablauf mit zusätzlichem Minerkauf, Erzfahrt, Raffinerie und konkurrierender Frachternutzung. **Kein isolierter kausaler Export-Effekt**; ein Wasserkauf weniger ist kein Emissionsbefund. Keine neuen365-/730-Tage-Läufe. Die historischen C1b-1-Ergebnisse werden nicht überschrieben: Alle vier vollständigen30-/90-Tage-Messdatensätze wurden erneut ausgeführt und sind mit `C1B1_MESSWERTE.json` identisch.

## Exakt belegte Integrationslücke

Alle folgenden Codeverweise beziehen sich auf den unveränderten `index.html` der PR-Basis; die Test-Capability-Probe prüft die entscheidenden fehlenden Regeln tatsächlich.

| Notwendige Stufe für ein Lagermodul | Vorhandener Core / konkrete Grenze |
| --- | --- |
| C-Rohstoffe | Erz im Versuch bezahlt, aber R32-Produktivität/Kosten; C-Silizium benötigt10 Minuten/Einheit. Der vorhandene W5b-Pfad nutzt dagegen `silikonLohn:2` und eine8er-Charge (Regeln um Zeile941). Keine Behauptung vollständiger C-Vorkosten. |
| C-Material | W4 um Zeile3012 hat Finanzierung, zehnminütiges Rezeptlos ist ausschließlich per Regeln ausführbar; hier positiv nachgewiesen. |
| Zwei Bauteile | Hauptrezept `r_bauteil` um Zeile752 ist mengen-/zeitmäßig passend. Der bezahlte W5b-Plan um Zeile3357 multipliziert es jedoch mit der Siliziumcharge8 und bindet Hersteller/Handel an Sonderkonten/Preise. Kein generischer Einzel-Los-Vertrag mit gemeinsamer Herkunftsfolge. |
| Lagermodul | Hauptrezept `r_lager` um Zeile755:2 Bauteile→1 Lager/12 Minuten. Im registrierten R32-Profil fehlt es. Einfaches Einschalten des allgemeinen `m_core_produktion` (um Zeile1996) würde Material verarbeiten, aber **keine gesonderte Arbeit vorfinanzieren oder entlohnen**. Dieser Pfad wird daher nicht als bezahlter Bau ausgegeben. |
| Meridian | Im registrierten `world.systems` und `world.stations` nicht vorhanden; W3 um Zeile875 enthält allein Aldera–Nadir/60. Das allgemeine Sieben-Systeme-Modell kennt Meridian, aber W3-Ticks um Zeile2900 schreiben Quelle/Ziel und Systeme fest. Hinzufügen eines Namens wäre keine auditierte Route. |
| Eindeutige Abnahme | Kein validierter Lagermodul-Exportbefehl, kein Abnahmebeleg an Meridian, keine reservierten Warenlos-IDs. Die Befehlsprobe weist `export`, `acceptExport`, `stationBuildStorage` ohne Zustandsänderung zurück. |
| Gemeinsamer Etat | W5q ist Wasserentnahme mit endlichem Sonderetat, kein Modell-C-Vertrags-/Vortrags-/Fensterbuch. C1b-1 und die Vorstufe sperren ihn explizit auf off/0. |
| Lohnrückfluss | Vorhandene W5s-Industrie-/Erzpilotenlohnfunktionen sind mit W5s-Identität/Audits gekoppelt; unter diesem Profil nicht aktiviert. Ein universeller Einzelposting-Hook fehlt weiterhin. |

Ein positiver Endnachweis müsste mindestens drei zusammenhängende Core-Vertragsarten erweitern (bezahlte Rezeptlose, Routenfracht, Abnahme/Etat) und deren kontenspezifische W3/W4/W5b/W5n/W5o/W5q-Audits gemeinsam ändern. Dies überschreitet die hier begrenzte Regelregistrierung. Deshalb endet dieser PR an physisch vorhandenem, bezahltem Material; er enthält **keinen realen Exportvertrag**, keine Scheinlieferung und keine gratis bereitgestellten Vorprodukte. Der verlangte Endexport bleibt offen.

## Exportgrenzen und exakte Beträge: noch keine positive Abnahme

Für eine spätere Integration gelten ausschließlich als Forschungsannahme:400 neue Rechte/Tag,12000/30 Tage,146000/365 Tage, Vortrag höchstens30 Tage, offene Reservierungen mitgezählt, keine Zahlung ohne Leistung. Hier werden **keine Rechte erzeugt, reserviert oder ausgezahlt**. Null Mint erfüllt alle Obergrenzen lediglich trivial; dies ist **kein** Test der gleitenden Grenzen, des Verfalls, konkurrierender Verträge oder einmaliger positiver Vergütung.

Auch Bruchteilsbuchungen sind noch offen: Der bestehende Core und Loader verlangen ganzzahlige ISK. C1b-1 verwendet2,25 nur als Satz für eine ganzzahlige270-ISK-Rundrechnung. Die kleineren C-Rechnungsposten (z.B.0,600) lassen sich nicht durch unveränderte Ganzzahlkonten auszahlen. Vor positivem Export sind eine gemeinsame exakte Geldrepräsentation mit definierter Einheit und Safe-Integer-Grenzen bzw. rationale Beträge, Preis-/Buchungs-/Savevalidierung und unabhängige Audits nötig. Kein `Math.round`, kein Aufrunden pro Teilleistung, keine Konvertierung bestehender Produkt-Saves in diesem PR.

Fehlende Lieferung kann hier nicht auszahlen, weil **überhaupt kein Auszahlungspfad freigegeben ist**. Doppelte positive Exportauszahlung und einmaliger positiver Export sind folglich nicht getestet. Wiederverkauf des Erzloses erzeugt nachweislich kein Geld. Keine Aussagen über nachhaltige Exportfinanzierung, Vollkostenmargen oder Gesamtwirtschaftsstabilität.

## Eignung der Node-Registrierung

Als begrenztes Forschungsgerüst geeignet: frische private Core-Instanz, SHA-geprüfte Basis, eingefrorene Regeln, Profil-/Regel-Fingerprint, getrennte Saveidentität, Original-Minuten-Tick und Gesamt-Audit. Die Erweiterung nimmt nur einen fest benannten Profilselektor an; keine beliebigen Regelcallbacks. C1b-1 bleibt Standard und behält seine Messwerte/Hashes.

**Keine dauerhafte Integrationsarchitektur:** Der `Function`-Loader extrahiert HTML anhand von Modulgrenzen; die Audit-Auswahl erfordert vier private Legacy-Regelaliase. Bereits #247 kopiert `wasserAudit`, weil dessen Arbeitsprädikat fest verdrahtet war. Diese Kopie bleibt eine dokumentierte Altlast; hier kommt **keine weitere** hinzu. Kein neuer Regelkern, Exportautomat oder zweiter Industrie-/Lohnaudit.

Nächster Core-Schritt: eine explizite Regel-/Modulregistrierung, gemeinsamer parametrisierter Arbeitsnachweis in W5n statt kopiertem Audit, ursprüngliche Auditfunktionen mit tatsächlich registrierten Regeln sowie ein gemeinsamer validierter Vertrags-/Abnahmebeleg. Erst dann die kleinste vollständige Kette Erz/Silizium→Material→zwei Bauteile→ein Lager und die reale Meridian-Rundfahrt implementieren. Diese Änderungen gehören in den deterministischen Core, nicht in weitere dauerhaft parallele Node-Wirtschaftsfunktionen. Produktionsintegration bleibt gesondert freizugeben.

## Ausführung und Prüfergebnisse

Node v22.23.4, ohne neue Abhängigkeiten:

```sh
C1B2_REPORT=/tmp/c1b2-results.json node tests/c1b-2-industrie-vorstufe.test.mjs
C1B1_REPORT=/tmp/c1b1-recheck.json node tests/c1b-1-exaktes-c-wasser.test.mjs
node --test tests/*.test.mjs
```

Gezielt C1b-2:6/6 Einzeltests,0 Fehler/Skips/Abbrüche. C1b-1:8/8 Einzeltests,0 Fehler/Skips/Abbrüche, alle vier Messdatensätze vollständig gleich. [Neue Messdaten](data/C1B2_MESSWERTE.json) sind Ausgaben, keine zur Simulation gelesenen Vorgaben. Der vorhandene C1b-1-CI-Workflow führt beide Dateien direkt aus und lädt beide Berichte hoch; kein zusätzlicher dauerhafter Forschungsworkflow.

Vollständige Regression: Ergebnis wird nach Abschluss ergänzt. Die unveränderten historischen Langzeit-Regressionen sind keine neuen C-Langzeitexperimente. Keine Safari-/NAS-Abnahme (keine Produkt-/UI-Änderung); keine Merge-/Deploy-/Roadmapänderung.
