# B-K6 – vorfinanzierter Cyris-Endauftrag mit echter Original-Core-Arbeit

**01.11.2026 · [ANALYSE/DRAFT] PR #90 · kein Merge · keine Produktregel**

- **[MAIN]** Basis-Commit: `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5, Regel14, Schema8.
- In `index.html` ist **nichts geändert**. Keine neue Emission, kein Treibstoff, keine neue Spielstandmigration.
- **Test:** `tests/bk6-prepaid-cyris.test.mjs` (Original-Core-Funktionen, analytischer Auftragsrahmen).
- **Prüfung:** [CI #41330812351](https://github.com/tobiasfranziskus/Check/actions/runs/41330812351), Node-Testjob **73/73 erfolgreich** (6 neue B-K6-Tests). Historische Langzeitjobs des Gesamtworkflows gesondert beurteilen.
- Der Original-Core ist weiterhin nicht automatisch an Nachfrageverträge gebunden. **Nur der Test** erzwingt diese Reihenfolge.

## 1. Das kleine, vollständig vorfinanzierte Auftragsmodell

Der Test legt ein Haushaltskonto mit **900 echten ISK aus dem vorhandenen Cyris-Fonds** und ein anfangs leeres Test-Treuhandkonto an. Dies ist ein hypothetischer ziviler Endkunde, **keine neue globale Leistungsvergütung oder Produkt-Einkommensregel**. Kein Konto darf überziehen. Jede vollständige Bestellung wird **vor** Rohstoffkauf und Minenarbeit mit **120 ISK festem Höchstpreis** aus dem Haushaltskonto reserviert.

Eine ausgeführte, unabhängige Stunde:

| Vorgang | Menge/Zahlung | Herkunft und Buchung |
| --- | ---: | --- |
| Haushalt zahlt in Treuhand | **120 ISK** | bestehende Haushaltskasse, keine Emission |
| Treuhand finanziert Rohstoffvorschuss | **78 ISK** | Station erhält zweckgebundenes Geld |
| Original-Miner fördert Eis | **6 Eis** | 6 echte Original-`foerderung`-Ticks |
| Original-`handel` kauft Eis | **78 ISK** | Station → NPC3; **Stations-Grundkasse unverändert** |
| Original-Minerbetriebskosten | **15 ISK** | NPC3 → Fonds, in `betriebskosten` tatsächlich bezahlt |
| Original-Handelsgebühr | **3 ISK** | NPC3 → Fonds |
| Original-`produktion` | **3 Nahrung** | 6 Eis verbraucht, 18 Rezept-Ticks |
| Belegte Lieferung/Bar-Abrechnung | **95 ISK Endpreis** | 78 ISK Vorschuss werden **angerechnet**, nur **17 ISK** Rest an Station |
| Rückerstattung | **25 ISK** | nicht verwendetes Treuhandbudget zurück an Haushalt |
| Analytische Einkommen (kein Produkt) | **54 + 14 + 15 = 83 ISK** | NPC3-/Stationsertrag und bereits gezahlte Fonds-Arbeit → Haushalt |
| Rücklagen/Fonds-Netto | **6 + 3 + 3 = 12 ISK** | NPC3-/Stationstest-Rücklagen und tatsächlich vereinnahmte Gebühr |

**Wesentlich:** Der Haushalt verliert effektiv **95 ISK** für die Nahrung und erhält aus *bereits vorhandenen* Zahlungspfaden hypothetisch **83 ISK** als Einkommen zurück. Er verliert **12 ISK pro Stunde**. Die Betriebsrücklagen 6/3 ISK sind gewählte Analyseannahmen und **keine** nachgewiesene Abschreibung für Flotte, Industrieanlagen oder Werft. Der heutige Core zahlt keine solchen Haushaltslöhne automatisch.

Gedeckte **Auftragsablehnung** ist ebenfalls ausgeführt: bei 119 ISK, fehlender Minerarbeitsfähigkeit oder bereits zu geringem Auftragspuffer findet vor neuem Mining keine Bestellung, keine Ware und keine ungeprüfte Ausgabe statt. Das Treuhandkonto steht nach abgeschlossener Bestellung immer auf **0 ISK**; Vorschuss und Restrechnung werden nicht doppelt gezahlt. Nach Bestellung, Arbeit, Lieferung und Rückzahlung erfolgen jedes Mal Original-Core-Audit und unabhängige Konten-/Warenprüfungen.

**Originalitätsgrenze:** Eisabbau, Eis-Handel, Arbeit, Rezeptproduktion und aktuelle Core-Spotpreise laufen unverändert. Die zusätzliche Vorbestellung, Treuhand, Haushaltszahlung und Warenübergabe sind **testseitig modelliert** und werden nicht über `m_core_step.step`, den noch unbezahlten `m_core_stunde.verbrauch` oder echte autonomen NPC-Aufträge ausgelöst. Dies ist eine kontrollierte Wirtschaftszelle, keine vollständige Simulationsstunde mit Piraten, Handel und Schiffsersatz.

## 2. Ausgeführte Gegenproben und echte Cashflows

| Szenario | Bezahlt produziert/geliefert | Haushaltskasse danach | Andere Konten |
| --- | ---: | ---: | --- |
| 20h, testseitige Arbeits-/Gewinnausschüttung, 6/3 ISK Rücklagen | **60 Nahrung / 120 Eis** | **900 → 660** | NPC3 **+120**, Station **+60**, Fonds **+60 ISK** |
| 20h geplant, **ohne** Haushaltseinkommen | **27 Nahrung / 54 Eis** in **9 Aufträgen** | **900 → 45** | 10. Auftrag ohne Mine/Bezahlung verweigert |
| 90h geplant, mit Einkommen/Rücklagen | **198 Nahrung / 396 Eis** in **66 Aufträgen** | **900 → 108** | NPC3 **+396**, Station **+198**, Fonds **+198 ISK** |
| Nur 119 ISK Haushaltscash | **0** | unverändert | identischer Core-Hash |
| Miner auf `halten` gesetzt | **0** | unverändert | identischer Core-Hash |

Zwei Seeds (**7/42**) ergeben für die 20h-Rechnung identische Rechnungsprotokolle, jeweils reproduzierbare Core-Hashes und vollständige unabhängige Geld-/Warenaudits. Die 66h-Grenze wurde in der längeren, kontrollierten 90h-Gegenprobe ausgeführt. **Nicht** in einer vollständigen 90-Tage-Wirtschaftswelt.

## 3. Wirtschaftliche Aussage und Konsequenz

**[POSITIVER TECHNISCHER BEFUND]** Ein einzelner Endabnehmer kann eine Produktionskette aus bereits vorhandenen ISK **vorfinanzieren**: Rohstoffe werden erst nach Vertrag gekauft, die Arbeit bezahlt, die Waren tatsächlich produziert, die Rechnung einmal beglichen und der Rest zurückgegeben. Das reduziert das Problem unbegründeter Lagerziel-Rohstoffkäufe *im isolierten Auftragsmodell*. Es beweist noch keine Flottenprofitabilität oder selbststeuernde Gesamtwirtschaft.

**[NEGATIVER MAKRO-BEFUND]** Die funktionierende Einzelabrechnung ersetzt keinen wiederkehrenden Nettoeinkommens- oder Nachfragepfad. Selbst unter relativ günstiger testseitiger Umverteilung und vollständig bezahlter Arbeit brechen die Aufträge nach **66 Stunden** ab. Bei einem festen Geldbestand und dauerhaftem Netto-Sparen von Unternehmen/Spieler kann die Haushaltskasse nicht ohne Rückfluss oder neue begrenzte, real begründete Geldquelle unverändert bleiben. Die 66 Stunden sind **kein universelles Balancing-Limit**, sondern das Resultat dieses kontrollierten Haushalts, des Preises und der Test-Rücklagen.

**[NICHT FREIGEBEN]** Eine reine Pflicht-Vorauszahlung ohne zusätzliche Nachfragefinanzierung als Phase-B-Lösung. Das würde nachweislich nur früher die Produktion stoppen. Keine pauschale ISK-Emission, gratis Haushaltsrettung, willkürlicher Spieler-Sparabzug, versteckte Stationssubvention oder automatische Produktionscode-Migration.

**[NÄCHSTE KLEINE HYPOTHESE / OPTION B-K7]** Zunächst einen *konkreten* regelgebundenen, zeitlich und mengenmäßig begrenzten externen Leistungsauftrag (z. B. tatsächlich neu produzierte, physisch gelieferte Nahrung) **nur analytisch** gegen den B-K6-Auftragskreislauf testen: externe Zahlung **erst bei belegter Warenherkunft und endgültiger Ausbuchung**, globale Geldquelle/Senke und Budget getrennt auditieren, keinen Startlager-Verbrauch prämieren und keine Einzelkonzerne retten. Dann prüfen, wie viel regulärer Haushaltslohn, reales Betriebskapital und notwendiger Schiffersatz tatsächlich finanzierbar werden. **Konkrete Geldmodell-B-Emission braucht vor Produktimplementierung gesonderte Nutzerfreigabe.**

**Offen:** 13×90-Tage-Welten, Spielerkrisen, dynamische Preise/Nachfrage, Stations-/NPC-Liquidität, reale Transportkosten und Ersatz, Save/Load einer künftigen Produktregel, iPad-Safari/NAS. Der positive Test ist **kein wirtschaftlicher Produkt-Patch**.
