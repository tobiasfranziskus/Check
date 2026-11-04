# [DRAFT] W5g – reale Vollkosten und einmaliger finanzierter Ersatzjäger (Regel 24)

**Referenzen:** [Roadmap](ROADMAP.md), [Projektstatus](PROJEKTSTATUS.md), [W5f-Forschung](W5F_PILOTEN_KOPFGELD_LASER.md). Basis des neuen PRs ist der Wartungs-Draft [#182](https://github.com/tobiasfranziskus/Check/pull/182). **[MAIN]** `b4e604d6` ist weiter Regel 14/Schema 8. **[DRAFT]** isolierte Regel 24 / Schema 8; keine automatische Migration oder neue Produktfreigabe.

## Entscheidungssichere Kostenrechnung

Die Preise, Rezepte und vorhandenen Kassen bleiben exakt aus der bisherigen Forschung übernommen. Das neue **rein lesende** `pilotW5GPlan(state)` berechnet aus dem tatsächlichen Core:

| Zahlstelle und Beleg | Bestehender Wert | Interpretation |
| --- | ---: | --- |
| House: 8 Bauteile aus 16 Material + 8 Silizium | 1.792 ISK Vorproduktkauf + 64 ISK Lohn = **1.856 ISK** | Echte zahlungswirksame Hersteller-Buchungen |
| House: 1 Jäger aus 8 Bauteilen + 4 Material | 400 ISK Materialkauf + 32 ISK Lohn = **432 ISK** | Zusätzlich zahlungswirksame Hersteller-Buchungen |
| **Herstellerzahlungen insgesamt** | **2.288 ISK/Jäger** | Alle aus House verausgabten Fabrikzahlungen; noch ohne Beschaffungskapital der Vorstufen |
| Tatsächlicher Käuferpreis | **900 ISK/Jäger** | Weiterhin unveränderter Regel-14-Forschungsreferenzwert |
| **Fertigungsbezogene Marge** | **−1.388 ISK/Jäger** | Verkaufserlös minus Hersteller-Fabrikzahlungen, **keine Welt-Gewinn- oder Vollkostenbehauptung** |
| W3 Erzlieferung | 50 Erz, **740 ISK** bezahlter Frachterauftrag (500 Erz, 240 Frachtumsatz) | Separater Käufer-/Speditionskreis; **nicht noch einmal pauschal** auf die House-Marge addieren |
| W3 Fahraufwand | **120 ISK** bezahlte Arbeit je Hin-/Rückfahrt | Anteil des Speditionskreislaufs |
| W4 Raffinerie | 40 Erz → 20 Material, **80 ISK** Lohn | Tatsächlich gebuchte vorgelagerte Arbeit |
| Silizium | 8 geförderte Einheiten, **16 ISK** Bergbaulohn | Die Station zahlt außerdem 192 ISK echte Abnahme an House – bewusst als Transfer erfasst |

**Der negative Herstellerbeitrag darf nicht als komplette volkswirtschaftliche Verlustrechnung missverstanden werden.** Dieselben Materialzahlungen sind Einnahmen der Nadir-Station und dürfen nicht doppelt zu vorgelagerten Rechnungen addiert werden. Der vollständige Kontenabgleich steht im alten Core-Audit und den neuen unabhängigen Geld-/Warenprüfungen. Für eine gesamtwirtschaftlich dauerhaft tragfähige Kette fehlen vor allem wiederkehrende zahlende Abnehmer und echte Deckung der Produktionsarbeit.

## Einmaliger echter Ersatz nach Verlust

Regel 24 erweitert **nur das Forschungslimit für Silizium-, Bauteil- und Jägerchargen von zwei auf drei**. Jede der drei Chargen nutzt das unveränderte Erz-/Frachter-/Raffinerie-/Werftverfahren. Es gibt **kein zusätzliches Startererz, Silizium, keine Waren- oder ISK-Geschenke** und keine Änderung an bisherigen Marktpreisen oder Fabrikrezepten.

Der neue Befehl `shipReplaceFighter` darf **nur** für `npc3` in Nadir ausgeführt werden, wenn:
1. Der gemeinsame W5d-Kampfkern einen tatsächlich zerstörten NPC3-Jäger mit **persistierter ID** belegt.
2. Ein vollständig produzierter Jäger physisch im Nadir-Werftlager liegt.
3. Der echte `npc3`-Kontostand den unveränderten Kaufpreis **900 ISK** deckt.
4. Der Verlust bisher noch keiner Ersatzbuchung zugeordnet ist und die einmalige Forschungsfreigabe noch frei ist.

Der anschließende Kauf ruft die **vorhandene, validierte `shipBuy`-Buchungslogik** auf. Erst wenn die 900 ISK bezahlt und eine konkrete neue Schiff-ID vorhanden sind, wird der Ersatzbeleg `{verlustId,schiffId,tick,preis}` gespeichert. Ein unabhängiges `m_core_w5g.audit` vergleicht ihn mit Verlustliste, Kauf-/Werftbuch und wirklichem Eigentümer. Der normale `shipBuy` bleibt unverändert.

**Direkter deterministischer Nachweis:** Seed **98765**, echter Doppelverlust im Kampf bei Core-Tick **1260**: Konzern `sh006` und Pirat `sh005` werden zerstört. Dritte neue Rohstoff- und Industriekette; `npc3` kauft `sh007` als Ersatz für `sh006` bei Tick **1614**, tatsächlich 900 ISK vom Konzern an House. Danach **House 6.564 ISK, NPC3 8.900 ISK, Piraten 0 ISK**, `minted=0`, Geld-/Warenaudit grün, unveränderter Save/Load-Hash `7c8545331ae2f197`. Bei fehlender Lagerhülle oder fehlendem Verlust bleibt der Ersatzkauf **ohne jede Nebenbuchung** blockiert. In Seed42 entsteht eine dritte echte Lagerhülle ohne Konzernverlust; der Ersatzbefehl wird dort korrekterweise abgelehnt.

**Keine Piratenrettung:** Der erste Pirat ist aus genau 900 bestehenden ISK bezahlt. Nach dem Abschuss besitzt der Piratenkonzern 0 ISK und kann keinen weiteren Jäger kaufen. Die dritte House-/NPC-Produktion erzeugt **nicht** automatisch Nachfrage oder Geld für Piraten. Keine wiederkehrende Endnachfrage, keine generische NPC-Pilotenzuweisung nach Verlust, keine gesicherten Gewinne.

## [TEST / Wirtschaftskrise] Dritte Charge nur in 8 von 13 Welten finanzierbar

Der erste W5g-CI-Versuch #41929272435 war **rot (216/217 Node-Tests)**, weil der Langlauftest irrtümlich in allen 13 Seeds eine dritte Erzlieferung verlangte. Die wirtschaftliche Gegenprobe zeigte den **echten** Grund: In Seed7 liegt am Ende des Versuchs `export.cash=0` und `st_aldera.lager.erz=0`; der Miner erhält keine weitere bezahlte Abnahme. Das ist gerade der zu untersuchende Kaufkraftengpass, **kein Bug, der durch zusätzliche ISK oder eine gefälschte Testerwartung versteckt werden darf**.

**Unabhängig direkt ausgeführte, anschließend korrigierte 13×90-Tage-Langläufe:** Jeder Tag Geld-/Warenaudit, separater deterministischer Replay, Save-/Load-Abgleich, keine ISK-Emission. **8 Seeds** (`11, 2, 65535, 42, 98765, 99, 2024, 314159`) finanzieren tatsächlich die dritte komplette Erzlieferung, Raffinerie, Bauteile und Jägerhülle. **5 Seeds** (`7, 1, 1234, 3, 2025`) stoppen bei erschöpfter realer Exportkaufkraft, bevor dritte Erzmenge bereitsteht. Es wird in diesen fünf Welten **keine zusätzliche Hülle vorgetäuscht**. Nur Seed98765 enthält den echten Konzernverlust und einen finanzierbaren Ersatzkauf. Die neue W5g-Kostenansicht zeigt auch die tatsächliche Exportkasse und den Rohstoffengpass. **[Finale GitHub-CI #41931017679](https://github.com/tobiasfranziskus/Check/actions/runs/41931017679) ist completed/success:** Node **217/217 bestanden**, 0 Fehler, 0 Skips; alle sieben ausgeführten Workflow-Jobs grün, optionaler Vergleich planmäßig skipped. In den dokumentierten 13 Seed-Endständen sind genau 8 dritte Chargen, 5 ehrliche Kaufkraftstopps und 1 Ersatzbeleg nachgewiesen. Referenz-Hashes z. B. Seed7 `29314707328edef9`, Seed42 `09d44a5038216d4b`, Seed98765 `c27b2487450e9534` nach Tag90. Keine neuen ISK.

## Browser-Forschung und Spielstand-Schutz

Neue statische, bedienbare Forschungsoberfläche: `prototypes/w5-welt/w5g.html`. Sie kombiniert dieselben Miner-/W3-/W4-/W5b-/W5d-/W5f-Core-Befehle und zeigt die **vom Core gelesene** Marge, echte Bestände, Konten und den Ersatzstatus. Ein zusätzlicher Button startet ausschließlich den validierten Ersatzbefehl, **kein UI-eigener Geldtransfer**. Die bestehenden W5e-/W5f-Forschungswelten bleiben erhalten.

W5g persistiert nur in der eigenen Browser-Datenbank `aphros-void-forschungswelt-w5g` und dem neuen Slot `regel24-ersatz-vollkosten-v1`. Unveränderte Save-/Load-/JSON-/CAS-Schutzmechanik; `loadW5G` akzeptiert ausschließlich Regel24/Schema8 mit bestandenem Voll-Audit. Alle älteren Formate und die produktive `aphros-void`-DB bleiben unangetastet.

Die Seite ist **kein produktiver Hauptlink**. Das weiterhin verwendete `Function`-Extraktionsverfahren für Inline-Core kann unter strenger NAS-CSP blockieren. Reale iPad-Safari-, Dateidialog-, Querformat- und NAS-Abnahme sind weiterhin erforderlich. Kein Merge oder Deployment.

## Ausgeführte Tests und offene Qualitätsgates

- **Direkt ausgeführt:** `createW5GState` startet mit 33.000 ISK, 0 `minted`, sämtlichen Geld-/Warenaudits grün. Der echte Seed98765-Durchlauf bis nach dem dritten Jäger und der bezahlten Ersatzbuchung ist hash- und kontenkorrekt; Seed42 weist den Ersatz ohne Verlust korrekt ab.
- Neue unabhängige Node-Tests `tests/w5g-finanzierter-ersatz.test.mjs` und `tests/w5g-ui.test.mjs` prüfen vollständige Realproduktion, Doppelverlust und Ersatz-ID, Werft- und Geldengpässe, bilanzneutral gefälschte Transfers, transaktionale Spielstandsicherung, unbeabsichtigte UI-Mutationen sowie 13 Seeds × 90 Spieltage mit täglichem unabhängigem Geld-/Warenaudit, deterministischem Replay und Save/Load. Die Drittproduktion ist nur bei **wirklich vorhandenem** Erz und Kaufkapital ein gültiger Erfolg; bei einem belegten Finanzierungsstopp bleibt die Welt bilanziell korrekt stehen.
- **GitHub-CI-Gesamtzahl und 13×90-Tage-Ergebnis erst nach tatsächlich abgeschlossenem Workflow eintragen.** Die alte W5f-CI #41925543292 ist erfolgreich, aber ausdrücklich kein automatischer W5g-Testnachweis.

## Entscheidung / nächste ökonomische Abhängigkeit

Der reale **einmalige NPC-Ersatz** und die **dritte bezahlte Charge** sind technische Machbarkeitsnachweise. Sie **lösen die negative Fabrikmarge und fehlende Piratenkaufkraft nicht**. Vor Serienfertigung sind eine tatsächlich finanzierte wiederkehrende Nachfrage und ein belegter Wert-/Preis-/Gebührenkreislauf gesondert zu beschließen. Keine neue ISK-Emission, Gratisrettung, Rohstoffart, automatische Piratenerzeugung, Änderung des 900-ISK-Jägerpreises oder neuer Preisalgorithmus in diesem PR.
