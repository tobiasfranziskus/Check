# B-K9g – Vertragsdock und Werftrücklage (Regel15-Entwurf)

**01.11.2026 · [PRODUKT/DRAFT] [PR #99](https://github.com/tobiasfranziskus/Check/pull/99), Basis [B-K9f #98](https://github.com/tobiasfranziskus/Check/pull/98). NICHT integriert.**

**[MAIN]** `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5 / Regel14 / Schema8. Die Funktionalität ist ausschließlich im expliziten Schema9-/Regel15-Kandidaten aktiv.

## Testbefund

[CI #41343363767](https://github.com/tobiasfranziskus/Check/actions/runs/41343363767) **SUCCESS** (7 tatsächlich ausgeführte Jobs, ein Vergleich bedingt übersprungen); **107/107 Node-Tests bestanden** (104 zuvor + 3 B-K9g-Grenzprüfungen).

**[B-K9g.1 Dock]** Pro Quellstation können höchstens `1 + vorhandene Dock-Modulanzahl` Rohstoff-/Fertigungsaufträge gleichzeitig einen gebundenen Dockpuffer halten. Eine Einzelcharge enthält maximal die **originale Miner-Cargokapazität**; es gibt keine zweite kostenlose Lagerdimension ohne Limit. Beide Schranken werden **beim Abschluss und bei Save/Load** geprüft. Die vollständige Ware liegt weiterhin genau einmal in originalen Stations-/Schiffslagern oder im gebundenen Vertragskonto und durchläuft dieselben Geld-/Waren-Audits. Die schon beim Rohstoffkauf anfallende **Original-Handelsgebühr** wird weiter real bezahlt.

**[B-K9g.2 Werftkapital]** Jede tatsächlich gebildete Hüllenersatzrücklage bleibt als Original-ISK im abgeschlossenen/verlorenen Vertragsdatensatz. Ausschließlich der ursprüngliche `m_core_schiffbau.ersatzkauf` darf sie **bei einer tatsächlich verfügbaren Ersatzhülle und ausreichendem gemeinsamem Eigentümerbudget** zur Deckung eines realen Käufers auflösen. Ohne handelbare Ware, fehlenden Slot oder trotz Rücklage weiterhin zu geringem Budget erfolgt **keine Auszahlung**. Bei fehlschlagendem Originalhandel geht das abgerufene Geld **atomar in dieselben Vertragspositionen zurück**. Regel15 verwendet in diesem Kaufpfad **keinen alten pauschalen Fonds-Zuschuss für einen Konzern ohne verbleibende Hülle**; ältere Regel14-Welten bleiben unverändert.

**[POSITIVER ORIGINAL-WERFTTEST]** NPC1 erhält nach einem erfolgreich gelieferten Originalvertragsauftrag eine tatsächlich gesperrte **39-ISK-Rücklage**. Ein bestehender Sollflotten-Slot wird nach wirklicher Hüllenzerstörung leer. Ohne Originalwerftware bleiben 39 ISK gebunden. Danach stellt **nur die kontrollierte Testfixture** verkaufbares Werftlager unter Beachtung der originalen Werftreserve bereit und überträgt **bereits vorhandene** ISK so, dass genau 39 ISK zur Vollfinanzierung fehlen. Die Original-Werftverbuchung kauft dann einen Frachter zu einem **fixturebedingt dynamischen Originalpreis 1.050 ISK plus 42 ISK Gebühr**; die 39 ISK wurden **genau einmal** eingelöst, die neue Hülle wurde dem ursprünglichen Sollplatz zugeordnet. **Die Wareneinfuhr im Test ist ein Beweismittel, keine kostenlose Produktversorgung.**

## Produkt- und Kostenwarnungen

- **[OFFEN / ENTSCHEIDUNG]** Ein zeitweise belegter Dockplatz ist keine nachgewiesene kostenlose Dienstleistung. Im aktuellen Draft wird **keine neue Dockmiete** erhoben; zusätzliche Flächen-, Lagerdauer- und Kapitalkosten sind erst nach einer Ursachenanalyse zu regeln und vom Nutzer freizugeben.
- **[OFFEN]** Ein gebundener Puffer mit Original-Quellgebühr ist nicht identisch mit einer physischen normalen Stationslagerkapazität. Es muss geklärt werden, ob Dockplätze kurzfristige Produktionsdurchreichung zulassen oder ob die gewöhnliche Lagergrenze stattdessen strikt gelten soll.
- **[OFFEN]** Die Rücklage ist einzelvertraglich **pro Lieferung** angespart, nicht bereits als komplette Abschreibung des gesamten Schiffswerts bewiesen. Reparatur-, Schiffsverlust- und Ersatzkosten aller NPC-Rollen sowie die Finanzierung der Werftware benötigen weitere Langzeitprüfungen.
- **[OFFEN]** Wiederkehrende NPC-/Spieleraufträge, tatsächliche Markt-Endnachfrage, Personalhaushalte, Sicherheitsfinanzierung und aktiver Vertragsbetrieb über 13×90 Tage sind durch die G-Tests **nicht** bewiesen.

**Bewertung:** Ein begrenzter, sicher auditiert gespeicherter Dockpuffer und Originalwerft-gedecktes Ersatzkapital sind technisch möglich. Die **ökonomische Dock-Gebühr und der langfristige Ersatzrhythmus sind noch unbeschlossen**. **Keine Merge-/Deployment-/Emissionsfreigabe.** Folgeversuch [B-K9h #100](https://github.com/tobiasfranziskus/Check/pull/100): 13 echte Seed-Paare ×90d mit realen Standort-/Kassen-/Preis-Gates.
