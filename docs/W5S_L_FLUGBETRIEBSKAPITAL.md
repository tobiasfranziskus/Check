# W5s-l – Betriebskapital für Folgeflüge vor NPC-Hüllenkäufen

**[DRAFT/ANALYSE · 06.11.2026]** Gestapelte Forschungsfortsetzung von W5s-k (#214), ohne Änderung an `main`, Save-Schema/Regel32, Preisen, Gesamtgeld oder alter UI-Integration.

## Hypothese und kleinster Testeingriff

W5s-k belegt: Spedition mit zwar +2.640 ISK operativer Frachtmarge, aber nach 2.250 ISK gekauften Hüllen, 120 ISK Überführung und 2.270 ISK Ausschüttungen ohne Betriebskapital. Die folgende 50er-W3-Fracht verlangt **120 ISK eigenen reservierbaren Fluglohn** zusätzlich zu 740 ISK Nadir-Käuferetat.

Das neue, ausschließlich im expliziten R32-Profil wirksame `rules.w5s.carrierWorkingCapital` fordert beim **automatischen NPC-Frachterkauf/-bestellen** neben **750 ISK Hülle und 60 ISK Überführung** weitere **120 ISK aus derselben realen Speditionskasse**, also **930 ISK freien Kassenbestand**. Die 120 ISK bleiben Eigentum der Spedition und werden **nicht** an einen anderen Akteur übertragen, nicht verdoppelt, nicht gemintet und nicht fälschlich als zusätzliche Weltwährung gezählt. Der W3-/W5n-Kern bindet diesen Betrag erst bei tatsächlich validiertem `shipFreight` oder `shipFreightIce` und bezahlt anschließend jede echte Flugminute.

W5o-Ausschüttungen berücksichtigen diese Betriebsmittel im bestehenden `investitionsReserve`-Gate, soweit `retainFleetEarnings` bereits aktiv ist. W5s-e und W5s-g verwenden dieselbe Reserve bei freiem Kauf, Überführung und verbindlicher Vorbestellung. Bereits bezahlte Werftverträge bleiben unangetastet. Manuelle Spielerkommandos, Investitionen anderer Gesellschaften und bereits gespeicherte Spielwelten ohne das ausdrückliche Flag behalten die alten Regeln.

Eine zusätzliche **rein lesende** W5s-k-Finanzprojektion zeigt die Kosten getrennt: 810 ISK Hülle + Überführung, 120 ISK Betriebsreserve und 930 ISK Gesamtbedarf. Kein zweiter Kern, keine neue Kontenart.

## Gate und Testmatrix

Die Forschungs-CI prüft 13 Seeds ×90 Tage und Seed42/7 ×365 Tage, unabhängiges tägliches Geld-/Warenaudit, Save/Load und Seed42/7-Doppelreplays. Die AUS-Variante muss identische W5s-k-Hashes behalten. Vorlauf 2/7/30 Tage wird bei AUS/EIN mit denselben endlichen Start-ISK verglichen. **W5s-l gilt nur dann als positiver autonomer Wiederanlauf, wenn mindestens zwei wirkliche 50-Erz-Transporte von je 740 ISK realem Käuferetat und 120 ISK vorfinanzierter Flug-Arbeit beendet sind und ein Ersatz durch echte Werftware bezahlt wird.** Fehlende Folgeaufträge sind ein ehrlicher Negativbefund, keine Rechtfertigung für Gratiserkäufe oder willkürliche Frachtaufträge.

## Nachweis aus tatsächlich ausgeführter Node22-CI

**[TEST] [Gezielter GitHub-Lauf #42203972058](https://github.com/tobiasfranziskus/Check/actions/runs/42203972058) auf Head `7ef5d3b6`: 5/5 Testgruppen erfolgreich, 0 Fehler/Skips.** Am geprüften Code wurden 13 feste Seeds ×90 Spieltage ausgeführt, Seed42/7 doppelt deterministisch gespielt, Seed42/7 ×365 Tage geprüft und zusätzlich 6 Vergleichsprofile je Seed (jeweils 2/7/30 Tage Vorlauf, Kapitalpuffer AUS/EIN). Die Checks verifizieren täglich die originale vollständige Core-Bilanz, unabhängig alle ISK-Konten und alle physisch existierenden Waren, außerdem Save/Load und die Treuhand-Summen. Der AUS-Pfad bleibt **bitidentisch** zu den W5s-k-90-Tage-Hashes Seed42 `12b217b14222d390`, Seed7 `83f8bc2dc6293710`.

### Nachweisbar zweiter bezahlter 50-Erz-Transport (Vorlauf 30 Tage)

**[POSITIV, eingeschränkt]** Mit Puffer und Gewinnrücklage führt das autonome NPC-Netz in *allen 13 Seedwelten* **zwei vollständig abgeschlossene W3-Transporte zu je 50 Erz** aus. Der zweite wird bis **Tag31** fertig. Dabei sind sowohl echte Warenkaufreserve 740 ISK je W3-Auftrag als auch eigener Speditionslohn 120 ISK vor Abfahrt vollständig durch den vorhandenen Core gebunden. **100 Erz** erreichen Nadir, fünf neue W5-Hüllen werden gebaut und verkauft, sechs echte R32-Ersatzzuordnungen folgen. Tag90: 25 abgeschlossene Eisfahrten, **1.250** real bezahltes Wasser, Spedition **720 ISK** frei, NPC-Bergbauer **360 ISK**. Vergleich ohne Puffer: 1 Erzfahrt / 50 Erz, 21 Eisfahrten / 1.050 Wasser, vier Werfthüllen, Spedition 0 ISK. Seed42/7 mit Puffer nach 365 Tagen **weiter nur zwei Erztransporte und 1.250 Wasser**, Spedition 720 ISK. **Keine** dauerhafte Selbsttragung behaupten.

| 90d-Szenario, Seeds 42/7 | W3-Erzfahrten | Eisfahrten | Wasser real bezahlt | W5-Neuhüllen | Speditionskasse |
|---|---:|---:|---:|---:|---:|
| Vorlauf 30 Tage, Puffer AUS | 1 | 21 | 1.050 | 4 | 0 ISK |
| Vorlauf 30 Tage, Puffer EIN | **2** | 25 | **1.250** | **5** | **720 ISK** |
| Vorlauf 7 Tage, Puffer AUS | 1 | 53 | 2.650 | 5 | 0 ISK |
| Vorlauf 7 Tage, Puffer EIN | 1 | **88** | **4.316** | 5 | **930 ISK** |
| Vorlauf 2 Tage, Puffer AUS | 1 | 57 | 2.850 | 5 | 0 ISK |
| Vorlauf 2 Tage, Puffer EIN | 1 | **88** | **4.316** | 5 | **930 ISK** |

Das 2-/7-Tage-Profil versorgt in diesen 90 Tagen deutlich besser und bewahrt Kapital, **liefert aber nur 50 Erz nach Nadir**. Sein nachvollziehbarer Blocker im W5s-Erzplan ist `gekauftes_erz_fehlt`: Der bestehende Erzgroßhändler stellt keine weitere physisch angekaufte volle 50er-Charge bereit. Der W5s-g/W3-Core darf ohne echte Verkäufe nicht „vorsorglich“ 50 Erz erzeugen. Der Fabrikplan zeigt `erz_fehlt`. **W5s-m** sollte deshalb den echten nachfrage- und finanzierungsgebundenen W2-Erzkauf bei laufender 2-/7-Tage-Versorgung prüfen, nicht neue Lagerware oder Hüllen schenken.

Der Forschungs-Vorlauf von 15/30 Tagen Schiffslebensdauer (R32) ist hypothetisch. Die 13 Seeds unterscheiden deterministische Hashes, aber nicht die Menge der vereinfachten Kernwirtschaft; deshalb nicht als 13 unabhängige konjunkturelle Szenarien oder freigegebenes Produktbalancing ausgeben.

**[CI/TEST]** Die nach dem ersten Lauf ergänzten harten Positiv-Assertions für **mindestens zwei tatsächlich abgeschlossene 50-Erz-Transporte bis Tag31** und mindestens fünf neue Werfthüllen in allen 13 Seedwelten sind ebenfalls bestanden: [Node22-W5s-l-CI #42204317471](https://github.com/tobiasfranziskus/Check/actions/runs/42204317471), **5/5 Tests grün, 0 Fehler, 0 übersprungen** auf dem nachfolgenden Assertion-/Dokumentationsstand. Die komplette historische Node-/Geografie-Regressions-CI #42204316987 wird getrennt bewertet; fehlende iPad-/NAS-Abnahme bleibt offen.

**[OFFEN]** Für 90- oder 365-Tage-Wiederanlauf über diesen zweiten Transport hinaus fehlt ein autonom vollständig finanzierter Erznachkauf/Neuverwendung und langfristig Liquidität in mehreren Firmen. Neue Endkunden, Preis-/Geldmodell-B-Emissionen, Unternehmensgarantien oder Spieler-Sparbeschränkungen sind nicht beschlossen. Echte iPad-Safari-/NAS-Abnahme, globale W6-Stabilität, NPC-Insolvenz-/Neueintrittsmodell bleiben aus. Kein Merge/Deployment.
