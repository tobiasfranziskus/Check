# B-K10c – realer Nahrungstransport: Geldkette und Verlust der Neuware-Herkunft

**[ANALYSE/DRAFT · 02.11.2026]** [PR #120](https://github.com/tobiasfranziskus/Check/pull/120) ist auf #119 → #108 gestapelt. **[MAIN]** `b4e604d6`, Produkt v0.12.5 / Regel14 / Schema8 unverändert. Prüfmodell Regel15/Schema9 ist weder integriert noch genehmigte Spielregel.

## Problem aus B-K10b

Die beiden Wochen eines 13-Seed-Laufs zeigten: kein zusätzlicher bezahlter Neu-Nahrungsverbrauch in Tag8–14 trotz örtlicher Lager und Kaufkraft. Eine Bilanz auf Systemebene allein zeigt nicht, ob Kauf, Fracht, Herkunft und echter Endverbrauch überhaupt in *einer* realen Lieferung zusammenpassen.

## Enger, kontrollierter Prüfvertrag

Der neue [Node-Test](../tests/bk10c-nahrung-herkunft-endverbrauch.test.mjs) nutzt **unveränderte Original-Core-Befehle**:
1. **Cyris**: Bestehenden Alt-Nahrungsbestand auf die echte Mindestreserve von 26 begrenzen, ohne Waren zu erzeugen (gleiche Verringerung von `ledger.nahrung.initial`). Bereits vorhandenes Eis ermöglicht eine echte sechsminütige Rezeptleistung für 24 ISK aus Stationsgeld, gebucht an den lokalen Haushalt. Nach der ersten Fertigstellung steht genau **eine echte neue Nahrungseinheit oberhalb der Reserve** zur Verfügung. Die Herkunft des eingesetzten Starteis ist nicht chargengenau bewertet.
2. Ein **real bereits vorhandener NPC1-Frachter** kauft genau diese Einheit über `core.submit(shipTrade)`, aus seiner vorhandenen Kasse und zum echten Marktpreis einschließlich der Gebühren. Cyris erhält den Warenpreis; der Frachter trägt die Gebühr. Die Warenherkunft ist vorher im Core als `lokalNeuNahrung` nachweisbar.
3. `core.submit(shipMove)` bindet die Original-Flugkosten vor Abflug per Vertragsreserve. Von Cyris nach **Orion** führt die Originalroute über Veldra (25+18 = **43 Spielminuten**); bei 250 ISK/Flugstunde beträgt das reguläre gebundene Fahrtbudget **180 ISK**. Später erfolgen echte Flugabrechnung und Entladung an die zahlende Zielstation.
4. Orion beginnt in dieser kontrollierten Probe mit **0 Nahrungs-Altbestand** (Ledger-Bereinigung ohne Gratisgüter) und verdient selbst Haushaltslöhne durch die originale Materiallinie. Zum nächsten stündlichen Verbrauch ist ein wirklich zahlungsfähiger Haushalt erforderlich.
5. Zwei **separate, deterministische Seeds 42/7**. Original-Core-Ablauf gegen dieselbe Welt mit einer *einzigen künstlichen Provenienz-Umbuchung nach bezahlter Entladung* – `ausgelagert -= 1` und `st_orion.lokalNeuNahrung += 1`. Diese Gegenprobe bewegt weder Geld noch Ware, **ist aber ausdrücklich kein realer Spielmechanikpfad und kein Save-sicherer Provenienztransport**.

Der Test kontrolliert Source-Preis, empfangenes Stationsgeld, Frachterkasse, Vertragsreserve und Auszahlung, Orion-Kauf, lokale Haushaltskasse, echten Verbrauch und Originalpreis. Stündlicher Geld-/Warenaudit, Herkunftsprüfung, Save/Load-Hashes einschließlich Unterwegszustand und Replay werden geprüft. Für die aktive Gegenprobe wird die Nachweisart *manuell* gesetzt; die bestehende Save/Load-Serialisierung erfasst keine Herkunftscharge auf dem Frachter.

## Schon aus dem Code belegbare Sperre

`m_core_handel.handel` entnimmt beim Kauf die neue Herkunft an der **Quellstation** und zählt sie unter `haushaltNeuLedger.ausgelagert`. Der Frachter transportiert jedoch nur `ladung.nahrung`, **ohne Provenienz/Chargen-ID**. Die normale Ankunft führt `entladen` und `handel(..., kauf=false)` aus, **ohne diesen Nachweis am Ziel wiederherzustellen**. Dort behandelt `m_core_stunde.verbrauch` nur `lokalNeuNahrung` als zahlungspflichtig; normale angelieferte Nahrung wird wie Altbestand kostenlos verbraucht. Eine synthetisch wiederhergestellte Markierung ist kein Ersatz für einen deterministischen, Save-kompatiblen Original-Core-Lifecycle.

Dies ist eine **technische Herkunfts-/Zahlungslücke im Regel15-Draft**, keine Freigabe, angelieferte Altware nachträglich beliebig als neu zu zählen. Die bisherige `hausha(u)ltNeuLedger`-Identität kann weiterhin korrekt sein, obwohl der tatsächliche geografische Weg neuer Ware für spätere Bezahlung verloren ist.

## Grenzen und nächste Entscheidung

- Das Szenario reduziert ausschließlich kontrolliert vorhandene Anfangsnahrung und stoppt konkurrierende Händler; es ist **kein Nachweis eines stabilen autonomen 13×90-Tage-Marktgleichgewichts**.
- Die Eis-Anschaffungskosten stammen hier aus unbewertetem Starteis: der **chargengenaue volle Deckungsbeitrag** ist nicht nachgewiesen, auch wenn der Produktionslohn und der reale Frachterflug vollständig bezahlt sind.
- Sicherheits-/Jägerarbeit bleibt gemäß B-K10b weiterhin teilweise ungedeckt; nicht dem einzelnen Nahrungsproduzenten doppelt in Rechnung stellen.
- Vor produktivem Schluss sind Herkunfts-Transfers zwischen Station, Schiff, Transit, Teilentladung, Zwischenlager, Verlust, Außenhandel und Konsum als **speicherbare, mengenbilanzierte Original-Core-Fakten** erforderlich. Erst dann können Haushaltszahlungen und Rückfluss über mehrere Perioden ohne manuelle Gegenprobe geprüft werden.
- Keine Preisanpassung, Lohnänderung, neue Emission, Individualrettung, Merge, Deployment oder iPad-/NAS-Abnahme.

**CI-Nachweis:** Für den neuen Test-Head [GitHub Actions #41446392102](https://github.com/tobiasfranziskus/Check/actions/runs/41446392102); das tatsächlich abgeschlossene Ergebnis ist vor einer Freigabe separat zu prüfen. Nicht als bestanden werten, solange der Lauf nicht erfolgreich abgeschlossen ist.
