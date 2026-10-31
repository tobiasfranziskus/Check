# B6c – Finanzierbare erste und zweite Handelsfahrt (Regel 14)

**31. Oktober 2026 · [ANALYSE/DRAFT] · Versuchsplan, CI-Ergebnis ausstehend.**

## Ausgangspunkt und Ziel

Produktiv integriert ist **[MAIN] main d454d066**, Spiel **v0.12.5, Regel 14, Schema 8**. B6a [#50](https://github.com/tobiasfranziskus/Check/pull/50) zeigt in vier Langzeit-Krisen fehlenden NPC-Wiederanlauf. B6b-P1 [#51](https://github.com/tobiasfranziskus/Check/pull/51) senkt zwar rechnerisch ungedeckte Arbeit, verschlechtert aber 13 Standardwelten und schafft weiterhin keine NPC-Trader-Verkäufe im Krisenfall. **P1 ist nicht zu integrieren.**

B6c verändert **keine** Wirtschaftsregel und stellt die tatsächlichen Markt-/Geld-/Warenbedingungen an **Tag 90** (Original-B1-Krise), **91, 120, 180, 270 und 365** gegenüber. Standardvergleich mit 13 festen Seeds bis Tag 90. Ziel ist eine begründete Entscheidung darüber, ob an einem bestimmten Zeitpunkt der **Schiffskauf**, die **Transportware**, die **Stationsnachfrage**, der **Konzernkontostand** oder die **Fahrtarbeit** das erste und ein folgendes Handelsgeschäft blockieren.

## Statische Diagnose, keine simulierte Rettung

Das Analysewerkzeug `tools/analyse-b6c-finanzpfad.mjs` nutzt den **unveränderten** Produktkern und übernimmt Markt-, Reserve-, Gebühren-, Routen-, Werft-/Sollplatz-, Stationseinkaufs- und Geldfunktionen aus `m_core_index`. Es prüft für NPC1 und NPC2:

- Welche tatsächlich freien Frachter bestehen, welche Sollplätze fehlen und welche **bereits produzierte** Hülle liegt in der einzigen Werft? Der reale Werftkauf samt Gebühr, die Anfahrt zur ersten Handelsquelle und die Fahrzeitarbeit werden als echte Anfangskosten berechnet.
- Welche Waren sind **oberhalb der Produktions-/Verbrauchsreserve** verkäuflich, welche Ziele haben **realen Lagerplatz und aktuelle Stationskaufkraft**? Wie groß sind Einstand, Zielerlös, Gebühren und der **Nettowert nach vollständiger kalkulierter Fahrtarbeit**?
- Welche zusätzliche Anfangskasse wäre unter dieser isolierten Momentaufnahme erforderlich? Welche bereits vorhandene Kasse befindet sich beim Spieler, bei NPC1/2/3, den Stationen, Fonds, Piraten und der Sicherheit? Bestehende Werftzuschüsse bei leerer Flotte werden **separat** ausgewiesen, nicht als garantierte Verfügbarkeit verrechnet.
- Ist **statisch** eine zweite profitable Transportfahrt vom ersten Ankunftsort aus mit dem ersten gedachten Verkaufserlös finanzierbar? **Wichtig:** Das ist eine rechnerische Kapitaluntergrenze, **keine zweite ausgeführte Simulation**. Nachfrage, Vorräte, Preise, Gegner und Betriebskosten anderer Schiffe bewegen sich in Wirklichkeit weiter.

**Nicht erlaubt:** Freie Schiffe, neue Geldquellen, Steuer auf Spielerersparnisse, Insolvenzregeln, veränderte Piraten, neue Preise, Migration, Produktrefactoring, Änderung von Goldenhashes oder Spielständen. Keine künstliche Kassenkorrektur. Kein Merge/Deployment.

## Prüfgates

- **13 Seed-Welten × 90 Tage** mit exakt erhaltenen 791 Mangelstunden und 310.058 NPC-Trader-Verkäufen;
- **vier echte v12-B1-Spielerzustände an Tag 90**, überprüfter historischer Hash vor v14-Migration, Weiterlauf bis Tag 365 mit originalen validierten Spielerbefehlen;
- zusammen **17 Läufe, 2.270 Tageshashes und 54.480 stündliche unabhängige Geld-/Warenaudits und Replays**, Save/Load, vorhandene 67 Standard-Node-Tests und archivierte PR-/CI-Artefakte;
- bei positiven Modellangeboten gelten die gespeicherten Werte als **theoretische** Kapitaluntergrenzen, nicht als behauptete Handelsabschlüsse. Entscheidend ist, welche belegten Blocker die historisch tatsächlich ausgebliebenen Trader-Verkäufe erklären.

**CI:** noch nicht ausgeführt. Nach erfolgreichem Lauf folgt der zahlenmäßige Befund und der nächste kleinste sinnvolle Prüfauftrag. **[BESCHLOSSEN]** Die Produktziele stehen ausschließlich in [ROADMAP.md](ROADMAP.md); B6c legt keine neue Regel fest.