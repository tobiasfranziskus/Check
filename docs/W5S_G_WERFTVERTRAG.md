# W5s-g – verbindlich vorfinanzierter Werftauftrag

**[DRAFT / FORSCHUNG, 06.11.2026]** [PR #210](https://github.com/tobiasfranziskus/Check/pull/210) gegen #209 W5s-f. Gleicher deterministischer Core, R32-Forschungsprofil, Schema 8. `main`/Produktregel 14 und Codex-UI #207 unverändert. Kein Merge, kein Deployment und keine Rückwirkung auf vorhandene Spielstände.

## Warum

W5s-e überprüfte Kaufpreis und 60-ISK-Pilotenlohn **beim Start der Werft**, das Geld wurde jedoch erst nach dem Bau bezahlt. Ein NPC hätte zwischenzeitlich seine Kaufmittel für andere Aufträge verlieren können. W5s-g bindet in `w5s.prepaidOrders` Kaufpreis **und** vollständigen Fluglohn *vor* dem ersten bezahlten W5-Werftschritt:

| Schiffsklasse | Hülle | Fluglohn | Echtes Käufer-Escrow |
| --- | ---: | ---: | ---: |
| Miner | 600 ISK | 60 ISK | **660 ISK** |
| Frachter | 750 ISK | 60 ISK | **810 ISK** |

Die Summen folgen vollständig den bestehenden Regeln `m_core_w5.plan`, `m_core_route.route` und `w5n.fliegerLohn`. W5s-g führt **keine** neuen Preise, Rohstoffrezepturen oder Treibstoffkosten ein.

## Verträge und Buchungsdisziplin

- Der echte Core-Befehl `shipOrder` nimmt genau eine Bestellung eines autorisierten NPC-Käufers an, überträgt die vollständige Kassenmittel-Summe auf `w5s_order_reserved` und legt das persistierte `state.w5s.contract` mit Klasse, tatsächlichem Eigentümer, Originalpreis, Fluglohn und Tick an. **Noch kein Kauf, kein Werfterlös, keine Pilotenauszahlung.**
- Neue Werftbefehle bleiben `stationRefine`, `stationBuildMiner`/`stationBuildShip`, `shipBuy`, `shipReposition`; ihr validierender Core wird unverändert aufgerufen. W5s-g gibt bei den tatsächlich ausgeführten, synchronen Kauf- und Flugbefehlen ausschließlich den jeweils schon gesperrten Betrag aus der Treuhand frei. Bei Core-Ablehnung erfolgt die exakt gegengleiche Rückbuchung. Der Käufer kann das Geld in der Zwischenzeit nicht erneut verwenden.
- Nach bezahltem Kauf wird die echte W5-Schiff-ID registriert und **nur 60 ISK** bleiben gesperrt; beim Flugstart wird der Überführungslohn genau einmal in die bestehende minutengenaue W5s-Transferreserve gebunden. Das Schiff erreicht Aldera weiterhin erst über den ursprünglichen Ankunftspfad. Dokumentierte `completed`-Hüllen können später nach R32-Verschleiß ohne erneute Kaufpreiszahlung als Ersatz eingesetzt werden.
- `shipCancelOrder` ist nur vor Produktionsbeginn zulässig. Der wirklich hinterlegte volle Betrag wird an **denselben** Eigentümer zurückgegeben. Hat die Werft bereits gearbeitet, bleibt der Auftrag verbindlich; keine nachträgliche Gratisentschädigung.
- Es gibt derzeit höchstens **einen aktiven** Werftkaufvertrag gleichzeitig. Abgeschlossene und wirksam stornierte Verträge werden als `orderHistory` mit realen Tick- und Schiffsbelegen aufbewahrt. Die reine Lese-/Vertragsprüfung in W5s kontrolliert auch alle archivierten Preise, Herkunfts-IDs, tatsächliche Flüge, historische Kaufpreise und eindeutige Schiffs-IDs.
- Die bereits existierende W3-Gesamtrechnung und die W1-/W2-Eigentümer-Vollkostenrechnung behandeln die noch nicht ausgegebene Buyer-Reserve als gebundenes Eigenkapital. Das echte Geld bleibt dabei jederzeit im **weltweiten ISK-Gesamtbestand**.
- Ohne `w5s.prepaidOrders` bleiben alle bisherigen automatischen W5s-e/f- und früheren R32-Forschungspfade inklusive Referenzhashes unverändert.

## Technische Testabnahme

- `tests/w5s-g-werftvertrag.test.mjs`: Seed42/7 bauen zuerst echtes, durch Haus-Miner gefördertes und bezahltes Erz an; der reguläre W3-Dispatcher liefert **50 Erz** nach Nadir. Danach erfolgen Miner- und Frachterbestellung **vor** der Werft, mit echten 660-/810-ISK-Reservierungen, W4/W5-Produktionsarbeit, Kauf, bezahlter Überführung, Save/Load mitten im Vertrag und unverändertem zweiten Durchlauf.
- Negative Prüfungen: doppelte Bestellungen, Storno vor Produktionsbeginn mit exakter Rückerstattung, Storno **nach** Baubeginn abgewiesen ohne Kassenbewegung, Manipulation der noch gebundenen ISK und Fälschung eines archivierten Vertragspreises einschließlich Save/Load-Ablehnung.
- Zusätzliche **13 feste Seeds ×90 Tage** mit täglichen unabhängigen Geld-/Warenaudits, Seeds42/7 mit 90-Tage-Doppelreplay und jeweils **365 Tage**. Testresultate gelten nur, wenn der entsprechende CI-Lauf auf dem **aktuellen Head** abgeschlossen ist.
- Gesamtes bestehendes Node22-Regressionstestpaket, v10–v14-/Geografie-Hashes und W5s-a–f-Gates ebenfalls auf dem neuen Head prüfen. GitHub-CI ersetzt keine iPad-/NAS-Abnahme.

## Grenzen

Die finanzierte Vertragsschließung erhöht **nicht automatisch** die Kaufkraft. Im bisherigen W5s-g-Vorlauf auf Seed 42/7 ist der erste Miner `sh005` und Frachter `sh006` vollständig bestellt, real gebaut, gekauft und bezahlt überführt; der Zustand besitzt keine versteckte Neuschöpfung. Die Langzeitforschung benötigt weiterhin reale Folgeabnehmer und autonome Erzaufträge, damit bei kapitalarmen NPCs ein weiterer Werftauftrag finanzierbar ist.

**Kein Produktentscheid:** 15-/30-Tage-R32-Verschleiß und zweitägiger Standard-Vorlauf sind weiterhin nicht freigegebenes Balancing. Die kontrollierte Anfangsprobe nutzt `autoLeadDays:30` und `versorgungZiel:-1`, bevor der reguläre Eisverkehr wieder einsetzt. Ein vollständig aus beliebigen Startzuständen eigenständig anlaufender W6-Kreislauf ist noch nicht bewiesen. Spieler darf sparen; Konzerne dürfen ausfallen. Keine frei erfundenen Arbeits- oder Endkundenbudgets.

Die verbindliche Planung bleibt `docs/ROADMAP.md`, der belegte Hauptstand `docs/PROJEKTSTATUS.md` (geschützt durch den separaten Docs-PR #201). Dieser Forschungsbericht ist keine zweite Roadmap.
