# B8n – Wo die Nachfrage- und Kaufkraftkette abbricht

**[ANALYSE/DRAFT · 01.11.2026]** Untersuchung auf dem originalen unveränderten Simulationskern von `main 0d473e6ac85242e1ebb9c52ce1fa59c4ca30139a` (v0.12.5, Regel14, Schema8), Original-Core-SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`. Alle Änderungen im Branch betreffen nur ausführbaren Node-Analyserunner, separaten Workflow und dieses Dokument; **keine produktive Preis-, Verbraucher-, Konto-, ISK-Emission-, Piraten-, Save- oder Transportmechanik**.

## Untersuchungsaufbau

Die originalen, aus B1/B8k bekannten **sieben historischen Spielerbefehle** werden mit der unveränderten Welt Seed42 und Seed7 über 90 Spieltage ausgeführt (`active-hoarding`). Unabhängig wird für jeden Seed dieselbe Welt **ohne Spielerbefehle** über 90 Tage gerechnet (`passive`): Der Spieler hat unverändert 2.000 ISK; die NPCs handeln und fördern weiter. Kein neues NPC3-Handelsschiff und keine Eingriffe. Das isoliert die wirtschaftlichen Ergebnisse der zwei bekannten B1-Spielerkrisen, nicht allgemeines Sparverhalten aller denkbaren Spieler.

Jeder Lauf erfasst nach 0/1/7/14/15/16/20/30/60/90 Tagen die Geldbestände nach **Spieler, NPC-Händler, NPC-Miner, Stationen, Fonds, Piraten und Sicherheitsdienst**, verifizierte Warenverbräuche, Händlerhüllen, Stationseinkauf/-verkauf, Lagerdefizite, stationäre Kaufkapazitäten aus *wirklich vorhandenen* ISK und Versorgungsausfälle. Durch echte Core-Funktionen `preis`, `aufnehmbar`, `verkaufbar`, `handel`, `betriebskosten` werden keine UI-/Analyse-Ersatzpreise erfunden.

## Tatsächlich ausgeführte Prüfungen

**[TEST/CI] [#41286070611](https://github.com/tobiasfranziskus/Check/actions/runs/41286070611) erfolgreich:** **67/67 bestehende Node-Regressionen**; vier Original-Core-Welten ×90 Tage; **8.640 stündliche unabhängige Geld-/Warenaudits**, gepaarte deterministische Replays, **32 Save/Load-Roundtrips**; historische aktiven Seed42-Hash `784047684dfe5c56`, passiven Seed42-Hash `adf155a018b94094`, aktiven Seed7-Hash `84153573536268f2` erhalten. Durch die bestehenden 90-Tage-Originalfixtures sind dies *keine* neuen Produktregeln.

### Geld und Handel nach 90 Tagen

| Kontentyp, ISK | Seed42 aktiv | Seed42 passiv | Seed7 aktiv | Seed7 passiv |
|---|---:|---:|---:|---:|
| Spieler | **39.762** | 2.000 | **39.338** | 2.000 |
| NPC-Händler (npc1+npc2) | **0** | 12.000 | **0** | 10.755 |
| NPC3-Minerkonzern | 4.395 | 6.000 | 4.242 | 6.000 |
| Handelsstationen zusammen | **4.466** | 22.451 | **5.172** | 22.629 |
| Systemfonds zusammen | 1.300 | 7.546 | 1.006 | 8.600 |
| Piraten | 77 | 3 | 242 | 16 |
| NPC-Händlerfrachter vorhanden | **0** | 5 | **0** | 5 |

**Bilanz:** Die ersten 55.000 ISK der Welt sind keine Garantie für Umlaufliquidität. Nach tatsächlicher gebuchter Senke des Sicherheitsdiensts verbleiben in der Seed42-Spielerkrise ca. 50.000 ISK verteilt; davon liegen **39.762 ISK beim Spieler**. Der Spieler darf sie unbegrenzt behalten. NPC1/NPC2 können weder neue Fracht kaufen noch bezahlten Werftersatz stemmen. Obwohl NPC3 Kapital und Miner besitzt, gibt es ohne zusätzliche Entscheidung keinen NPC3-Händler. Bei Seed7 zeigt sich dieselbe Struktur.

**Wichtige Zeitinformation:** Schon **an Tag 14** haben beide aktiven Seeds den oben ausgewiesenen Endstand der Konten und **0** NPC-Händlerfrachter; derselbe Zustand gilt bis Tag90. Es findet im Original-B1-Krisenszenario danach kein finanzieller Wiederanlauf statt. In den passiven Welten handeln die NPC-Konzerne weiter, ohne zusätzliche Anfangskapitalgeschenke oder Geldzufluss.

### Warenbedarf nach 90 Tagen

| Versorgung / Nachfrage | Seed42 aktiv | Seed42 passiv | Seed7 aktiv | Seed7 passiv |
|---|---:|---:|---:|---:|
| Tatsächlich verbrauchte Nahrungseinheiten | **2.541** | 36.612 | **2.599** | 36.605 |
| Tatsächlich verbrauchte Medikamenteneinheiten | **644** | 12.960 | **704** | 12.986 |
| Verbrauchsstationen mit **Nahrungsmangel** an Tag90 | **6/6** | 0/6 | **6/6** | 0/6 |
| Verbrauchsstationen mit **Medikamentenmangel** an Tag90 | **6/6** | 0/6 | **6/6** | 0/6 |
| Bedarfsslots mit Nahrungskaufpreis über Stationskasse | 3 (von 7 relevanten Slots) | 0 | 2 (von 7) | 0 |
| Bedarfsslots mit Medikamentenkaufpreis über Stationskasse | 4 (von 7) | 0 | 4 (von 7) | 0 |
| Summe stationsseitiger Nahrungs-Zielbestandsdefizite | 235 | 28 | 235 | 24 |
| Summe stationsseitiger Medikamenten-Zielbestandsdefizite | 142 | 29 | 142 | 32 |

Die letzten Bedarfsslots zählen **auch Stationen ohne zivilen Endverbrauch**, sofern sie Ware als Zielbestand führen; die `6/6`-Versorgungsquote dagegen ausschließlich tatsächlich verbrauchende Stationen. Die Kaufkraftmängel und physische Verfügbarkeit sind **gleichzeitig** zu prüfen: Bei Endstand 90 Tagen fehlen fertige Waren und die Käufer können vielfach nicht einmal **eine** Einheit bezahlen. Der Ausfall aller NPC-Händlerfrachter zerstört zudem Transportzugang zu noch finanzierbaren Käufern.

## Konkret belegte Engpassmechanik

1. **`m_core_stunde.verbrauch`:** `nahrung` und `medikamente` werden bei zivilem Bedarf stündlich physisch aus dem Stationslager gelöscht und als `ledger.consumed` gebucht, **ohne eine zugehörige Geldzahlung** an Station oder Produzenten. Die verzehrten Güter erzeugen also keinen eigenen neuen Endkundenumsatz.
2. **`m_core_handel.aufnehmbar` und `handel`:** Stationen bezahlen Waren ausschließlich aus ihrer realen Kasse. Hohe lokale Lagerdefizite sind **keine zahlungsfähige Nachfrage**, wenn Bargeld fehlt. Nachfrage-Preissignale allein lösen keine Käufe aus.
3. **`m_core_stunde.fonds`:** Umverteilung aus bestehenden Systemfonds zu neutralen Stationen ist begrenzt; sie erschafft keine neue Gesamt-Kaufkraft und repariert nicht automatisch einen kapitalarmen NPC-Händler. `npcAusgaben` verschiebt lediglich überzählige NPC-Kassenbestände in Fonds.
4. **`m_core_stunde.aussenhandel`:** Der neutrale Außenhandelsanschluss verändert Warenlager und `ledger.imported/exported`, **nicht** ISK-Konten. Er stellt deshalb keinen nachhaltigen Käufer-/Stationsumsatz als Endnachfrage bereit.
5. **`m_core_schiffbau.ersatzkauf`:** Reale Hüllen brauchen reale Finanzierung. Sind beide NPC-Händler mittellos und ihre Frachter zerstört, sind Preise, verfügbare Rohstoffe und passender Warenbedarf allein kein ausreichender Markteintrittsmechanismus. NPC3s neu geplanter eigener Frachter aus B8k/B8m belegt einen **zeitlich begrenzten bezahlten** Wiedereinstieg, keine nachhaltige Gesamtstabilität.

**Kausalitätsgrenze:** Die aktiven Spielerkommandos verändern über viele Handels-, Preis-, Piraten- und Firmenreaktionen die Welt. Der aktive/passive Unterschied beweist **nicht**, dass die *einzige Ursache* der gesamte Spieler-Sparbetrag ist. Er belegt eine gemeinsame Käuferliquiditäts-, Handelsflotten- und Endverbrauchs-Rückflussklemme in zwei festen Krisenszenarien. Der Spieler darf auch künftig unbegrenzt sparen, und Einzelkonkurse sind erwünscht; Ziel ist regelgebundener Markteintritt und gesamtwirtschaftlicher Wiederanlauf, **keine individuelle Insolvenzrettung**.

## Folgeschritt / Entscheidungsgates, keine Implementierungsfreigabe

- **[OPTION, gesonderte Freigabe nötig] Geldmodell B:** Ein potenzieller, *global identischer*, begrenzter und auditierter Endnachfrage-/Leistungszahler könnte nur nach nachweislich gelieferter, neu produzierter oder tatsächlich verbrauchter Ware bezahlen. Geldquelle, empfangendes Konto, Berechtigung, Leistungsnachweis, Budget und Vermeidung des Auszahlens von bisherigem bloßem Lagerabbau sind **noch unbeschlossen**. Kein automatisches Geld für insolvente Firmen und keine Rückforderung von Spielersparnissen.
- **[ANALYSE-GATE]** Vor jedem neuen Geldmodell die tatsächlichen 14-Tage-Transfers in Spielerkasse, Stationen und Händler nach Kategorien und Warenherkunft dokumentieren und prüfen, ob der Haushalt/Stationsbedarf ohne und mit allgemeinen Leistungszahlungen real beliefert werden kann.
- **[PRODUKT-GATE]** B8m-Fahrtfinanzierung und B8n-Endnachfrage unabhängig bewerten und danach über das richtige Zusammenspiel entscheiden, nicht eine riskante Escortquote oder neue Handelsroute als verdecktes Geldmodell.
- **Noch offen:** 13 Seeds ×90 Tage und 365-Tage-Krisen, Spieler kann unbegrenzt ansparen, Geld-/Warenaudits und deterministische Hashes mit später genehmigter Regelversion, Save-Migrationen, iPad Safari/NAS. **Keine Änderung/Integration des Testskripts in den Spielkern.**
