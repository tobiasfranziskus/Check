# B-K10i – Arbeitsgelder, Fonds und lokale Kaufkraft in aktiven Welten

**[ANALYSE/DRAFT · 02.11.2026]** [PR #126](https://github.com/tobiasfranziskus/Check/pull/126) auf #124 → #123 → #108. **[MAIN]** `b4e604d6`, v0.12.5/Regel14/Schema8 **unverändert**. Die R15/Schema9-Testoptionen für bereits entworfene Verträge, bezahlte Fabrikproduktion und neuen, geldgedeckten Nahrungskonsum sind **nicht auf main integriert**. Ausschließlich ein neuer test-only Zahlungsjournal-Hook und diese Dokumentation; keine produktiven Regeln, Preise, Löhne, Förderungen, Emissionen, Spielstände, UI oder Laufzeiten geändert.

## Fragestellung und beobachtete Original-Codepfade

**Wofür wird Arbeit bezahlt, und wer erhält die ISK tatsächlich?** Nicht jede bezahlte Betriebsleistung ist Einkommen von Haushalten:

| Tatsächlicher Core-Pfad | Wer zahlt? | Wohin geht die Zahlung? | Direkt für Haushalt-Nahrung verfügbar? |
|---|---|---|---|
| Fabrikproduktion (R15/Schema9) | lokale Stationskasse, vorab reserviert | `hh_st_...`, Haushalt am selben Standort | **Ja**, nur falls dort fertige Arbeit bezahlt wurde |
| Frachterfahrt (R15/Schema9) | Schiffseigentümer, aus vorab reserviertem Fahrvertrag | `fonds_...` des **Zielsystems** | **Nein**, nur gegebenenfalls indirekt über anschließende Fonds-Stations-Transfers und erneute lokale Produktion |
| Nicht vertraglich reservierte Miner-/Frachter-Betriebskosten | Schiffseigentümer | Systemfonds | **Nein**, dieselbe indirekte Einschränkung |
| Sicherheitsjäger-Betriebskosten | Sicherheitsbehörde | `state.burned` / ISK-Senke | **Nein**; diese ISK verlassen sogar die Geldmenge |
| Fonds-Mindeststand / Fondsüberschüsse | vorhandener Systemfonds | unbesitzte Station / ärmste Station | **Nicht direkt**, sondern erst durch tatsächlich finanzierte Produktionsarbeit der Station |
| Bezahlter Nahrungskonsum neuer Ware | lokaler Haushalt | lokale Station | Das Geld kehrt an Station zurück; nur ein bezahlter Kauf erzeugt diesen Rückfluss |

**Wichtig:** `fonds → station` ist eine **Umbuchung vorhandener ISK**, keine neue Emission. Ebenso ist `station → Haushalt → Station` nur bei tatsächlich verrichteter Produktion und tatsächlich gekaufter Nahrung ein Wirtschaftskreislauf. Das Einkommen bleibt lokal gebunden; der Core überweist nicht automatisch Haushaltsvermögen zwischen Stationen.

## Prüfmethodik

Der Test instrumentiert ausschließlich seine **eigene JavaScript-Testkopie** an fünf eindeutig geprüften Original-Core-Buchungsstellen: `m_core_vertrag.bezahlen`, `m_core_stunde.betriebskosten`, Fonds-Stations-Mindeststand, Fondsüberschuss und NPC-Abgabe. Echte Kontozugänge und abgeflossene ISK werden **unmittelbar bei Original-Core-Buchung** journalisiert, keine nachträglich geschätzten Pseudolöhne.

Die beiden Welten **Seed42 und Seed7 laufen 72 reale Simulationsstunden (je 4.320 Ticks)** mit **allen automatischen NPC-Händlern, Minern, Piraten, Sicherheitsjägern und den originalen Fondsauffüllungen**; Startlager bleiben **unverändert**. Nur bereits vorhandene, explizite R15-Versuchsschalter sind aktiv (`produktionslohnJeMinute:4`, `haushaltskaufNeu:true`, `herkunftTransportNeu:true`). Das ist eine **Preis-/Lohnregel des Testkandidaten**, keine auf main geltende Produktregel; kein Fonds-Mindeststand geändert. **Stündlich** unabhängige Geld- und Warenaudits, **täglich** Save/Load/Hash, zusätzlich deterministischer 24h-Seed42-Replay. Jede lokale Haushaltskasse wird gegen kumulierten realen Lohn minus kumulierten bezahlten Neu-Nahrungskonsum geprüft.

## [TEST BESTANDEN] Vollständiger GitHub-CI-Nachweis

Die **vollständige [CI #41464083347](https://github.com/tobiasfranziskus/Check/actions/runs/41464083347)** auf geprüftem Test-Code-Commit [`4224443`](https://github.com/tobiasfranziskus/Check/commit/42244437541bf2605de65fa93f144e38b9272fc2) ist **erfolgreich abgeschlossen: 157/157 Node-Tests, 0 Fehler**. Sämtliche ausgeführten historischen v10–v14-/Geografie-Referenzjobs sind erfolgreich; ein eigenständiger Sicherheitsgeografievergleich war **planmäßig übersprungen**, nicht als bestandener Test gewertet. Die Tests umfassen unabhängige Geld-, Waren- und Neu-Nahrungshistorienbilanzen, das Original-Core-Audit, Vertragsreserven, tägliche Save/Load-/Hashprüfungen und einen deterministischen Seed42-Replay. **Keine reale iPad-/NAS-Abnahme.** Nach diesem Code-Commit erfolgten nur Bericht-/Projektstatusänderungen im Draft. Stundensummen sind **wiederholte Umläufe vorhandener ISK**, nicht neue Geldschöpfung.

| Tatsächlicher Zahlungsstrom in 72h | Seed42 | Seed7 |
|---|---:|---:|
| Fabriklöhne an lokale Haushalte | 52.924 ISK | 51.872 ISK |
| Bezahlte Vertrags-Frachterflüge → Systemfonds | 35.097 ISK | 39.634 ISK |
| Unreservierte Miner-Betriebskosten → Fonds | 19.356 ISK | 20.277 ISK |
| Unreservierte Frachter-Betriebskosten → Fonds | 628 ISK | 424 ISK |
| Jäger-Betriebskosten → ISK-Senke | 7.520 ISK | 7.040 ISK |
| **Summe bezahlte Leistungskosten (kein neuer ISK-Bestand!)** | **115.525 ISK** | **119.247 ISK** |
| Fonds → Stationen (mehrfacher Umlauf) | 133.685 ISK | 133.959 ISK |
| NPC-Abgaben → Fonds (Umbuchung) | 62.952 ISK | 62.007 ISK |
| Tatsächlich bezahlter Neu-Nahrungskonsum | 23.346 ISK / 599 Stk | 21.896 ISK / 575 Stk |
| **Kumulierte, wegen Geld und/oder Waren fehlende Nahrungseinheiten** | **298** | **300** |

| Geldverteilung nach 72h | Seed42 | Seed7 |
|---|---:|---:|
| Haushaltskassen | **29.578 ISK** | **29.976 ISK** |
| Stationskassen gesamt | 6.937 ISK | 6.113 ISK |
| Fonds gesamt | 1.500 ISK | 1.500 ISK |
| Spieler + NPC1/NPC2/NPC3 | 11.821 ISK | 12.223 ISK |
| Sonstige Eigentümer, u.a. Sicherheitsbehörde/Piraten | 164 ISK | 188 ISK |
| Reservierte, noch nicht gezahlte ISK am Endzeitpunkt | 0 ISK | 0 ISK |
| Bruttoemission / Senken in 72h | 2.520 / 7.520 ISK | 2.040 / 7.040 ISK |
| **Verbleibender auditierter ISK-Gesamtbestand** | **50.000 ISK** | **50.000 ISK** |

**Der zentrale Befund ist räumlich ungleiche Kaufkraft, nicht nur ein Mangel an Einkommen.** Zum letzten Messzeitpunkt:

| Seed42, Station | Haushalts-ISK | Neue Nahrung im Stationslager | Kumulierte Mangel-Einheiten | Nahrungspreis |
|---|---:|---:|---:|---:|
| Aldera | **17.325** | **1** | 73 | 53 ISK |
| Cyris | 5.700 | 12 | 0 | 53 ISK |
| Dravos | 1.298 | 0 | 110 | 49 ISK |
| Nadir | 3.874 | 60 | 0 | 26 ISK |
| Orion | **44** | **13** | 115 | **46 ISK** |
| Veldra | 1.337 | 11 | 0 | 46 ISK |

Meridian besitzt im bestehenden Datensatz **keinen lokalen Verbrauch** und **keine Produktionslinie**: Sein Haushalt beginnt daher bei 0 ISK, ist aber keine zu versorgende Nachfrage in dieser Tabelle. Orion zeigt **Warenbestand ohne kaufkräftigen Haushalt**; Aldera dagegen **reiche Haushalte ohne hinreichende lokale Warenversorgung**. In Seed7 sind Aldera 16.522 Haushalts-ISK/0 Neu-Nahrung/70 Mangel und Orion 41 ISK/8 Neu-Nahrung/85 Mangel bei Preis 50 ISK. **Dieser Unterschied ist trotz realer Fonds-Stations-Rückflüsse vorhanden.**

## B-K10i Ankaufgeld-Gate: Station als Zwischenfinanzierer

Der Core stellt in `m_core_handel.aufnehmbar` auf die **freie Stationskasse** und die Lagerkapazität ab; Geld auf dem `hh_st_...`-Haushaltskonto ist **kein** automatisches Kaufbudget der Station. Eine Station darf bei einem Schiffseingang also nur Ware kaufen, die **sie selbst** bei aktuellem Stationspreis bezahlen kann. Die lokale Endkundennachfrage darf nicht mit der Stations-Zwischenhandelsliquidität gleichgesetzt werden.

Der im selben Test vollständig original berechnete, unabhängige Gegencheck protokolliert je Standort sowohl `aufnehmbar(state,rules,station,'nahrung')` als auch `Math.floor(haushaltISK/preis)` zum gleichen Endzeitpunkt. Die Haushaltszahl ist nur **rechnerisch finanzierbare Stückzahl zum konstanten aktuellen Stückpreis**, nicht die tatsächlich benötigte oder verkaufbare Menge.

| Seed42 nach 72h | Haushalt cash | theoretisch zahlbar (aktuellem Preis) | Stationscash | wirkliche Core-Ankaufmenge | Nahrung im Stationslager |
|---|---:|---:|---:|---:|---:|
| Aldera | 17.325 ISK | 326 Stück | **203 ISK** | **3 Stück** | 1 |
| Cyris | 5.700 ISK | 107 Stück | 610 ISK | 11 Stück | 12 |
| Nadir | 3.874 ISK | 149 Stück | 433 ISK | 5 Stück | 60 |
| Orion | **44 ISK** | **0 Stück** | 151 ISK | 3 Stück | **13** |

In Seed7: Aldera **16.522 Haushalts-ISK / 305 rechnerisch zahlbare Stück**, aber nur **716 Stations-ISK / 13 Stück tatsächliche Ankaufkapazität**, Anfangsbestand in der letzten Stunde **0**. Orion **41 Haushalts-ISK / 0 kaufbare Stück**, aber **862 Stations-ISK / 17 Stück Core-Ankaufkapazität**, obwohl **8** Neu-Nahrungseinheiten vorhanden sind.

**Die Gegensätze sind fundamental:** In Aldera fehlen **frei verfügbare Zwischenhandels-ISK**, obwohl Endkunden kaufkräftig sind; in Orion fehlt **Endkundenkaufkraft**, obwohl der Zwischenhändler weitere Ware ankaufen könnte. Eine Preis- oder Lohnerhöhung allein löst diese verschiedenen Verteilungen nicht, eine vom Standort unabhängige Geldobergrenze wäre kontraproduktiv.

**[OPTION / Gegenprobe, nicht produktiv]** Bei gleicher echter Ware und gleichem vorhandenen ISK-Bestand kann eine aus Haushaltbudgets tatsächlich **vorfinanzierte Bestellung** statt ungesichertem Stations-Vorratsankauf als kontrastierender Testfall geprüft werden. Haushaltszahlung und Eigentumsübertragung müssen im selben Core stattfinden; keine unsichtbare Vorschuss- oder Kredit-ISK, keine doppelte Erfassung von Stationsumsatz, keine automatische Nachfrage über tatsächlichen Bedarf. Vor jeder Produktentscheidung mit Spieler-NPC-Parität, Waren- und Geldbilanz, realen Kosten und langfristiger Versorgung auditieren.

## Zusätzlich im unveränderten Händlercode sichtbar: kalkulatorische Scheinmarge

In `m_core_entscheidung.bestesPaar` berechnet die autonome Route

```js
gewinn = menge * (pDort - pHier) - gebuehrQuelle - gebuehrZiel;
```

Die bezahlte Frachterfahrt ist in dieser **Gewinnschätzung nicht als Kostenposition enthalten**. Die Bewertung teilt die daraus abgeleitete Wertung anschließend zwar durch die Reisezeit, rechnet aber nicht den tatsächlichen Aufwand `ceil(route.zeit * betriebskosten.frachter / stunde)` als Fahrtkosten ab. `abflug` verlangt für die Fahrt im R15-Kandidaten nur **echte Mittelbindung und Deckung**, nicht einen positiven **Nettoertrag nach Flugkosten**. Eine voll finanzierte, tatsächlich durchgeführte Reise kann daher weiterhin betriebswirtschaftlich negativ sein.

**[CODE-ANALYSE / noch kein eigenständiger Wirtschaftsgate-Test]** Dies ist unabhängig vom Blockpreiseffekt B-K10h: Schon ohne Preisreaktion in der Laufzeit kann die bestehende Disposition einen positiven `gewinn` vor Flügen sehen, obwohl Handelsmarge abzüglich real bezahlter Reisekosten negativ wäre. Ob und wie stark das den Gesamtzyklus beeinflusst, sollte **separat anhand wirklich autonom ausgeführter Schiffsfahrten** getestet werden. Keine automatische Dispositions-/Lohn-/Preisregeländerung aus diesem Befund.

## Bedeutung, Einschränkungen und nächstes Gate

1. Die **bloße Umleitung vorhandener Kosten an den Fonds** erzeugt **keinen direkten Haushaltslohn**. Selbst das bestehende tatsächliche Fabrikentgelt genügt nicht für überall bezahlte Endnachfrage.
2. In der R15-Welt nach 72h liegt in Seed42 **59,2 %** des gesamten noch vorhandenen Geldes bei Haushalten (29.578/50.000); bei Seed7 **60,0 %** (29.976/50.000). Das ist **kein allgemeiner Sparlimiteffekt**; es kann **lokale Warenknappheit** ebenso wie Ausgabemöglichkeiten betreffen. Spieler-/NPC-Vermögen nicht als Rettung abschöpfen.
3. **Begrenzung:** Zwei 72h-Welten und ein 24h-Replay, **keine 13 Seeds ×90 Tage**, keine vollständige Eis-/Fabrik-/Hüllen-Volleinstandsbilanz, keine vollständige Jäger-/Piraten-/NPC-Konkurswiederbesetzung. Die anfänglichen Waren sind in diesem Test **original vorhanden**: erst neu produzierte und herkunftsgesicherte Nahrung wird gegen Haushalts-ISK gekauft; verbleibende Altbestände können im Kandidaten noch unbezahlt verbraucht werden. Statistiken sind für die *R15-Analysewelt*, nicht für integriertes Regel14-main.
4. **[OPTION / nächster sinnvoller Test]** **Keine** Emission oder einheitliche Lohnerhöhung einführen. Zuerst in realen Seeds den Waren-/Kaufkraft-Mismatch Aldera vs. Orion sowie die lokale Fabrik-Lohnreserve je Station mit echten bezahlten Lieferungen verbinden. Die produktive Entscheidung kann später eine einzelne allgemeine Finanzierung-/Preis-/Nachfrageregel sein, nur nach unabhängiger Gesamtrechnung und ausdrücklicher Freigabe.

**Keine** Merges, Releases oder produktive Änderungen.
