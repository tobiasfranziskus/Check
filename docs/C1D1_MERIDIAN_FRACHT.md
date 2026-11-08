# C1d-1 – Meridian-Fracht ohne äußere Kaufpreiszahlung

**[DRAFT / FORSCHUNG · 08.11.2026]** Gestapelt auf C1c-3 / [PR #253](https://github.com/tobiasfranziskus/Check/pull/253), der ausschließlich in einem Forschungsprofil durchgängig finanzierten Produktionskette für **ein Lagermodul**. Neues Teilziel: Originalware physisch von Nadir nach Meridian liefern und den Frachter tatsächlich wieder nach Aldera zurückführen. **Keine Warenaußenabnahme und kein Minting.** Modell-C-Werte aus [#245](https://github.com/tobiasfranziskus/Check/pull/245) bleiben unverbindliche Forschungsannahmen.

## Bezahlter Waren- und Flugweg

| Vorgang | Core-Leistung / Geschäft |
| --- | --- |
| Produktionskette | 10 bezahlte Erz → 4 Material; 20 einzeln bezahlte Siliziumminuten → 2 Silizium; 4 Material + 2 Silizium → 2 Bauteile (16 bezahlte Fertigungsminuten); 2 Bauteile → 1 Lagermodul (12 bezahlte Minuten). |
| Verfügbarer Frachter | Kein kostenloses Schiff: bereits bezahlte W3-/W5n-Hülle `sh002`, Eigentümer `transport`. Falls ihre alte, bezahlte Wasserfahrt noch läuft, muss sie zurückkehren. Ein bloßer Stations-/Auftragssprung ist verboten. |
| Forschungsroute | Aldera → Nadir: 60 Minuten Positionierung; Nadir → Meridian: 60 Minuten mit wirklichem Lagermodul im Frachtraum; Meridian → Aldera: 120 Minuten bezahlter Rückflug. Die neue geographische Strecke ist **[OPTION]**, keine endgültige Kartenfestlegung. |
| Frachtvertrag | Hersteller `house` zahlt **300 ISK** vollständig in ein echtes Fracht-Treuhandkonto. Spedition `transport` bindet **240 ISK** für den eigenen Piloten, 1 ISK pro tatsächlich geleisteter Flugminute. Geld muss **vor Auftrag** auf beiden Konten verfügbar sein. |
| Eigentum und Lieferung | Lagermodul zunächst im echten Nadir-Lager, nach Positionierung an Bord, nach Flug im echten Meridian-Stationslager. Bis zu einer **späteren** Außenabnahme bleibt der Hersteller wirtschaftlicher Eigentümer, ohne Einkommen aus diesem Vorgang. |
| Rückflug | Erst nach 240 bezahlten Flugminuten erhält die Spedition ihre 300 ISK. 240 ISK Pilotenlohn wurden aus tatsächlichem Speditionskapital bezahlt. Die 60 ISK Speditionsdifferenz sind **keine Vollkostenmarge** (Verschleiß/Risiko fehlen). |
| Geld | `minted = burned = 0`, `ledger.lager.exported=0`. Keine erfundene Rechnung, keine Erlösbuchung beim Kunden, keine geheime Rettung. |

## Technische Integration in den gemeinsamen Core

- Forschungsregel **3306** mit registriertem Profil `aphros-research:C1d-1:physical-delivery-no-mint-v1`; nicht für Browser-/Main-Regel14 freigeschaltet.
- Original-Core-Kommandoprüfung lässt `shipCapitalFreight` nur bei explizitem C1d-Opt-in und anschließend vollständiger Original-C1d-Prüfung zu. Alte W3-Frachterbefehle bleiben ansonsten gesperrt.
- Der W5o-Autopilot darf nach **Fertigstellung des Forschungsvertragsprodukts** keinen zusätzlichen Eis-/Erzflug auf denselben Forschungsfrachter legen. Laufende bezahlte Fahrten werden unverändert beendet.
- Der neue Original-C1d-Core setzt `phase`, `ziel`, `ankunft`, Ladung und Lager bei echten Minutengrenzen fort. Keine zweite Node-Flugsimulation.
- Die ursprünglichen Core-Prüfungen für W3-Speditionskasse, W1-Vollkosten und Erztreuhand erkennen nur die **nachgewiesene** C1d-Frachtbuchung. Andere nicht zugehörige Treuhandkonten bleiben verboten.
- Ein Original-C1d-Audit und ein **separater** Forschungsaudit überprüfen jede Minute Geld, Waren, Fracht-, Treuhand- und Pilotenbelege; nach Rückkehr bleibt der Audit auch in weiteren Ticks gültig.
- Save/Load und Seed-Replay sind im neuen gezielten Test abgedeckt; vollständige Standardregression ist gesondert zu bewerten. Die neuen Forschungs- und Core-Änderungen dürfen **keine** Änderung älterer Profil-Hashes/Referenzläufe ohne bewusst registriertes Opt-in bewirken.

## Zwischenprüfstand

**Direkte Core-Simulation während der Implementierung** (kein abgeschlossener GitHub-Node-Test, keine Safari-Abnahme): Seed 42 mit ursprünglicher Lagermodulfertigung Tick 228; bestehende Wasserfahrt bis Tick 300 wirklich abgeschlossen; voller Frachtvertrag gestartet Tick 300; Nadir-Ladung zum 60. Flugminutentick Tick 360; reale Meridian-Einlagerung Tick 420; Speditions-/Pilotenzahlung mit Rückkehr Tick 540; weiterer deterministischer Geld-/Warenaudit bis Tick 660 ohne Ausgleichsgeld oder Wareverlust. Seed 7 und gezielte Negativtests aus `tests/c1d-1-meridian-fracht.test.mjs` benötigen **den tatsächlichen CI-Abschluss**.

Forschungsworkflow: [Gezielte CI aus #254](https://github.com/tobiasfranziskus/Check/pull/254/checks). Ganzes Repository gesondert [GitHub Actions](https://github.com/tobiasfranziskus/Check/actions). Einen Lauf mit Fehler, Zeitlimit oder Stornierung nicht als bestanden werten.

## Nächster, gesondert zu genehmigender Forschungsabschnitt

**C1d-2: einmalige externe Abnahme und begrenzte Etatrechte**. Erforderlich sind ein eindeutiger, vor Lieferung bezahlbarer bzw. gedeckter Vertrag, verifizierte Eigentumsübertragung, Ledger-Ausbuchung, globales einmaliges Exportsettlement, kein doppelter Kauf-/Lohnpfad sowie die konservative, periodengenaue Emissionskappung mit belastbarer Bruchteilsdarstellung. Da neue ISK erst nach neuer, freigegebener Regel erzeugt würden, ist dies ein **[OPTION]**-Forschungsgegenstand und darf auf `main` oder in Spielständen **nicht** aktiviert werden.

**Kein Merge, kein Deployment, keine Änderung an produktiven Saves oder GitHub Pages.**
