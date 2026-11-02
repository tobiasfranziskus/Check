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

## Direkte Testausführung; vollständige PR-CI separat kontrollieren

Die direkte Ausführung des Testfiles gegen den GitHub-Test-Core ist ohne Abweichung beendet. Die neue CI auf dem zuletzt gepushten Code-Commit wird gesondert als vollständig erfolgreich oder fehlgeschlagen gekennzeichnet; bis dahin nur **[ANALYSE – direkt ausgeführter Test]**. Stundensummen sind **wiederholte Umläufe vorhandener ISK**, nicht neue Geldschöpfung.

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

## Bedeutung, Einschränkungen und nächstes Gate

1. Die **bloße Umleitung vorhandener Kosten an den Fonds** erzeugt **keinen direkten Haushaltslohn**. Selbst das bestehende tatsächliche Fabrikentgelt genügt nicht für überall bezahlte Endnachfrage.
2. In der R15-Welt nach 72h liegt in Seed42 **59,2 %** des gesamten noch vorhandenen Geldes bei Haushalten (29.578/50.000); bei Seed7 **60,0 %** (29.976/50.000). Das ist **kein allgemeiner Sparlimiteffekt**; es kann **lokale Warenknappheit** ebenso wie Ausgabemöglichkeiten betreffen. Spieler-/NPC-Vermögen nicht als Rettung abschöpfen.
3. **Begrenzung:** Zwei 72h-Welten und ein 24h-Replay, **keine 13 Seeds ×90 Tage**, keine vollständige Eis-/Fabrik-/Hüllen-Volleinstandsbilanz, keine vollständige Jäger-/Piraten-/NPC-Konkurswiederbesetzung. Die anfänglichen Waren sind in diesem Test **original vorhanden**: erst neu produzierte und herkunftsgesicherte Nahrung wird gegen Haushalts-ISK gekauft; verbleibende Altbestände können im Kandidaten noch unbezahlt verbraucht werden. Statistiken sind für die *R15-Analysewelt*, nicht für integriertes Regel14-main.
4. **[OPTION / nächster sinnvoller Test]** **Keine** Emission oder einheitliche Lohnerhöhung einführen. Zuerst in realen Seeds den Waren-/Kaufkraft-Mismatch Aldera vs. Orion sowie die lokale Fabrik-Lohnreserve je Station mit echten bezahlten Lieferungen verbinden. Die produktive Entscheidung kann später eine einzelne allgemeine Finanzierung-/Preis-/Nachfrageregel sein, nur nach unabhängiger Gesamtrechnung und ausdrücklicher Freigabe.

**Keine** Merges, Releases oder produktive Änderungen.
