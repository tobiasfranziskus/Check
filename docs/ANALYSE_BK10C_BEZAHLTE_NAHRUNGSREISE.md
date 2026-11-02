# B-K10c – realer Nahrungstransport: Geldkette und Verlust der Neuware-Herkunft

**[ANALYSE/DRAFT · 02.11.2026]** [PR #120](https://github.com/tobiasfranziskus/Check/pull/120) ist auf #119 → #108 gestapelt. **[MAIN]** `b4e604d6`, Produkt v0.12.5 / Regel14 / Schema8 unverändert. Prüfmodell Regel15/Schema9 ist weder integriert noch genehmigte Spielregel.

## Problem aus B-K10b

Die beiden Wochen eines 13-Seed-Laufs zeigten: kein zusätzlicher bezahlter Neu-Nahrungsverbrauch in Tag8–14 trotz örtlicher Lager und Kaufkraft. Eine Bilanz auf Systemebene allein zeigt nicht, ob Kauf, Fracht, Herkunft und echter Endverbrauch überhaupt in *einer* realen Lieferung zusammenpassen.

## Enger, kontrollierter Prüfvertrag

Der neue [Node-Test](../tests/bk10c-nahrung-herkunft-endverbrauch.test.mjs) nutzt **unveränderte Original-Core-Befehle**:
1. **Cyris**: Den gesamten Alt-Nahrungsbestand auf **0** reduzieren und `ledger.nahrung.initial` entsprechend korrigieren. Die Original-Produktion erzeugt echte neue Nahrung aus vorhandenem Eis, mit realen **24 ISK Lohn je sechsminütiger Charge**. Erst wenn nach lokalem Verbrauch **mindestens 27 Einheiten belegte Neuware** im Lager stehen, kann davon eine Einheit über der originalen **26er Reserve** verkauft werden. Anfängliches Eis hat weiterhin keinen chargengenauen Einstandsbeleg. Der erste Versuch mit 26 Alt- und einer neuen Einheit scheiterte als Neuware-Test **zu Recht**: Bei FIFO wird zuerst die alte Ware verkauft.
2. Ein **real bereits vorhandener NPC1-Frachter** kauft genau diese Einheit über `core.submit(shipTrade)`, aus seiner vorhandenen Kasse und zum echten Marktpreis einschließlich der Gebühren. Cyris erhält den Warenpreis; der Frachter trägt die Gebühr. Die Warenherkunft ist vorher im Core als `lokalNeuNahrung` nachweisbar.
3. `core.submit(shipMove)` bindet die Original-Flugkosten vor Abflug per Vertragsreserve. Von Cyris nach **Orion** führt die Originalroute über Veldra (25+18 = **43 Spielminuten**); bei 250 ISK/Flugstunde beträgt das reguläre gebundene Fahrtbudget **180 ISK**. Später erfolgen echte Flugabrechnung und Entladung an die zahlende Zielstation.
4. Orion beginnt in dieser kontrollierten Probe mit **0 Nahrungs-Altbestand** (Ledger-Bereinigung ohne Gratisgüter) und verdient selbst Haushaltslöhne durch die originale Materiallinie. Zum auf die Ankunft folgenden stündlichen Verbrauch ist ein wirklich zahlungsfähiger Haushalt erforderlich.
5. Zwei **separate, deterministische Seeds 42/7**. Original-Core-Ablauf gegen dieselbe Welt mit einer *einzigen künstlichen Provenienz-Umbuchung nach bezahlter Entladung* – `ausgelagert -= 1` und `st_orion.lokalNeuNahrung += 1`. Diese Gegenprobe bewegt weder Geld noch Ware, **ist aber ausdrücklich kein realer Spielmechanikpfad und kein Save-sicherer Provenienztransport**.

Der Test kontrolliert Source-Preis, empfangenes Stationsgeld, Frachterkasse, Vertragsreserve und Auszahlung, Orion-Kauf, lokale Haushaltskasse, echten Verbrauch und Originalpreis. Stündlicher Geld-/Warenaudit, Herkunftsprüfung, Save/Load-Hashes einschließlich Unterwegszustand und Replay werden geprüft. Für die aktive Gegenprobe wird die Nachweisart *manuell* gesetzt; die bestehende Save/Load-Serialisierung erfasst keine Herkunftscharge auf dem Frachter.

## Schon aus dem Code belegbare Sperre

`m_core_handel.handel` entnimmt beim Kauf die neue Herkunft an der **Quellstation** und zählt sie unter `haushaltNeuLedger.ausgelagert`. Der Frachter transportiert jedoch nur `ladung.nahrung`, **ohne Provenienz/Chargen-ID**. Die normale Ankunft führt `entladen` und `handel(..., kauf=false)` aus, **ohne diesen Nachweis am Ziel wiederherzustellen**. Dort behandelt `m_core_stunde.verbrauch` nur `lokalNeuNahrung` als zahlungspflichtig; normale angelieferte Nahrung wird wie Altbestand kostenlos verbraucht. Eine synthetisch wiederhergestellte Markierung ist kein Ersatz für einen deterministischen, Save-kompatiblen Original-Core-Lifecycle.

Dies ist eine **technische Herkunfts-/Zahlungslücke im Regel15-Draft**, keine Freigabe, angelieferte Altware nachträglich beliebig als neu zu zählen. Die bisherige `haushaltNeuLedger`-Identität kann weiterhin korrekt sein, obwohl der tatsächliche geografische Weg neuer Ware für spätere Bezahlung verloren ist.

## Grenzen und nächste Entscheidung

- Das Szenario reduziert ausschließlich kontrolliert vorhandene Anfangsnahrung und stoppt konkurrierende Händler; es ist **kein Nachweis eines stabilen autonomen 13×90-Tage-Marktgleichgewichts**.
- Die Eis-Anschaffungskosten stammen hier aus unbewertetem Starteis: der **chargengenaue volle Deckungsbeitrag** ist nicht nachgewiesen, auch wenn der Produktionslohn und der reale Frachterflug vollständig bezahlt sind.
- Sicherheits-/Jägerarbeit bleibt gemäß B-K10b weiterhin teilweise ungedeckt; nicht dem einzelnen Nahrungsproduzenten doppelt in Rechnung stellen.
- Vor produktivem Schluss sind Herkunfts-Transfers zwischen Station, Schiff, Transit, Teilentladung, Zwischenlager, Verlust, Außenhandel und Konsum als **speicherbare, mengenbilanzierte Original-Core-Fakten** erforderlich. Erst dann können Haushaltszahlungen und Rückfluss über mehrere Perioden ohne manuelle Gegenprobe geprüft werden.
- Keine Preisanpassung, Lohnänderung, neue Emission, Individualrettung, Merge, Deployment oder iPad-/NAS-Abnahme.

## Ausgeführte CI und konkreter Zahlungsnachweis

**[TEST BESTANDEN]** Der endgültige B-K10c-Test-Head [`df45ea6`](https://github.com/tobiasfranziskus/Check/commit/df45ea6245391d1a7b1699e53a6ef82749630db3) hat die [vollständige GitHub-Actions-CI #41447617718](https://github.com/tobiasfranziskus/Check/actions/runs/41447617718) erfolgreich abgeschlossen: **139/139 Node.js-22-Tests**, 0 Fehler, 0 übersprungen. Die übrigen historischen Regel-/Geografie-Jobs waren erfolgreich; der vorgesehene Sicherheitsgeografie-Vergleich wurde übersprungen (nicht als bestanden gewertet).

Das Originalhandels- und Vertragsmodell enthält in **beiden Seeds 42 und 7** dieselben realen Einzelbelege:

| Beleg | Original-Core | Synthetische, explizite Herkunfts-Gegenprobe |
|---|---:|---:|
| Vorher aus eigener Kasse tatsächlich gekaufte Nahrung in Cyris | **46 ISK / Einheit** | 46 ISK |
| Station Orion bezahlt dem Händler bei Ankunft | **56 ISK / Einheit** | 56 ISK |
| Flug Cyris→Orion, echte Route | **43 Minuten** | 43 Minuten |
| Vor Start gebundenes Frachterbudget | **180 ISK** | 180 ISK |
| Bis zum beobachteten Zielkonsum tatsächlich gezahlte Flugkosten | **178 ISK** | 178 ISK |
| Orion-Haushaltsguthaben unmittelbar vor Essen | **280 ISK** | 280 ISK |
| Endverbraucherzahlung | **0 ISK** | **56 ISK** |
| Orion-Haushaltsguthaben danach | **280 ISK** | **224 ISK** |
| Als Altware kostenlos verbraucht | **1 Einheit** | 0 |
| Als Neuware bezahlt verbraucht | **0 Einheiten** | **1 Einheit** |
| Weiter nur als `haushaltNeuLedger.ausgelagert` gezählt | 1 | 0 |

Die künstliche Gegenprobe führt **keine zusätzlichen ISK** ein: Seed42 bleibt in beiden Varianten bei 840 ISK bereits im vorhandenen Kampf-/Sicherheitsmodell gemintet und 1.250 ISK verbrannt; Seed7 bei 600 / 1.250 ISK. Echte Core-Geld-/Warenaudits, unabhängige Bestandskassen plus Reserven, Herkunftsaudit, Save/Load und Replay wurden ausgeführt. Der synthetische Herkunftswechsel wurde bewusst ausschließlich *nach realem Kauf und Transport* im Testzustand vorgenommen; dies ist **keine gespeicherte Schiffsladung und kein produktionsreifer Herkunftsnachweis**.

**[NEGATIVER WIRTSCHAFTSBEFUND]** Dem realen Warenverkauf von 56 ISK stehen 46 ISK Einkauf und **bereits 178 ISK bezahlte Flugkosten** gegenüber. Allein der Händlergeldstrom ist deshalb **56 − 46 − 178 = −168 ISK vor den zusätzlich anfallenden Handelsgebühren**, Hüllen-/Kapital-/Risiko-/Verwaltungskosten. Selbst ein behobener Provenienzfehler beweist **keinen profitablen oder wiederholbaren Nahrungstransport**. Die lokalen Haushaltszahlungen beim Ziel fließen an die Zielstation und werden nicht automatisch zur Produktionsstation zurückgeführt. Die bezeugten 1.176 ISK Löhne in Cyris sind die kumulierten Zahlungen vieler echter Chargen, **nicht** der Preis einer Charge; jede sechsminütige Charge kostete 24 ISK.

**Testentwicklung transparent:** [Erste CI #41446392102](https://github.com/tobiasfranziskus/Check/actions/runs/41446392102) 137/139 grün, zwei neue Tests rot, da der Test beim Quellenlager fälschlich eine alte Einheit als neu identifizierte. [Zweite CI #41446948892](https://github.com/tobiasfranziskus/Check/actions/runs/41446948892) 137/139 grün, zwei neue Tests rot, da die Testschleife eine absolute Zeitschranke vor der tatsächlich späteren Abfahrt verwendete. Beide **Testaufbaufehler** wurden korrigiert; erst der dritte oben belegte CI-Lauf ist vollständig grün. Keine erwarteten Gold-/Referenzwerte umgeschrieben.

**[NÄCHSTES GATE / OPTION B-K10d]** Ein winziger, save-kompatibler Herkunfts-Lifecycle für eine echte Fracht-Teilmenge: Original-Core beim Einkauf, Transit, Zahlung am Ziel, Teilentladung, Verlust, Reexport, Endverbrauch und Außenhandel; eine Herkunftseinheit darf weder verschwinden noch doppelt gezählt werden. Zunächst mit Seed42/7 und unabhängigem Chargen-/ISK-Audit und tatsächlich bezahltem Einzel-Endverbrauch demonstrieren. **Getrennt** die Ursache des negativen Handels-Nettoerlöses unter aktuellen Originalpreisen, Löhnen, bestehenden Risikokosten und finanzierten Fahrten prüfen. Keine neue ISK-Quelle, Lohn-/Preisreform, individuelles Überleben, unerlaubte Spielstandmigration, Merge oder Deployment. Keine reale iPad-/NAS-Abnahme.
