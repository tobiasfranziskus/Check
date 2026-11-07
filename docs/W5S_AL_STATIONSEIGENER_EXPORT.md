# W5s-al – Option A: echter Wasserexport ausschließlich an den Stations-Wareneigentümer

**[DRAFT/ANALYSE · 07.11.2026]** [PR #240](https://github.com/tobiasfranziskus/Check/pull/240) gestapelt auf [W5s-ak #239](https://github.com/tobiasfranziskus/Check/pull/239), wiederum auf dem W5s-aj-/W5s-ai-R32-Forschungsstand. Nutzerentscheidung: **Option A als begrenzten Forschungsversuch weiterführen**, nicht als produktive Geldmodell-B-Regel freigeben. W5u #234 ist weiterhin eine getrennte Regel-14-UI-Linie. Produktiver `main` 5a56d9d7, GitHub Pages, Spielstände und `index.html` bleiben unverändert.

## 1. Kleiner ausführbarer Schritt ohne zweiten Wirtschaftskern

Die bereits vorhandene W5q-Exportfunktion im R32-Core kann wirklich auf Lager befindliches Nadir-Wasser **höchstens 10 Einheiten je Spieltag** exportieren. Sie entfernt die Ware physisch, bucht sie in `ledger.wasser.exported` und gibt den Exporterlös in genau **einem** `state.minted`-Buchungssatz aus. Im hier ausschließlich erlaubten Testmodus `w5q.mode='station'` erhält `st_nadir` als Warenbesitzerin den gesamten Erlös.

Die alternative W5q-Forschung `mode='household'` wird **nicht aktiviert**. Ihre vollständige direkte Weiterleitung wäre mangels eigenständigem Haus-/Eigentums-/Arbeitsanspruch unbegründet. Es ist ausdrücklich **kein** neuer ziviler Haushaltsauftrag erfunden. Die Originalsimulation zahlt nur bestehende, nachweisbar erarbeitete Löhne und dort bereits korrekt berechnete NPC-Gewinne (W5o, W5s). **Keine neue Codefunktion notwendig**: W5s-al erweitert ausschließlich die ausführbaren Forschungstests und dokumentiert, dass der vorhandene W5q-Pfad die freigegebene Untersuchungsfrage beantwortet.

Getestete, noch **nicht produktiv freigegebene** Parameter: 7 oder 14 ISK pro tatsächlich exportiertem Wasser, `dayCap` 70 bzw. 140 ISK, einmaliges `totalCap` 3.500 bzw. 7.000 ISK. Kein Nachfüllen nach Tag-/Gesamtablauf, keine Anpassung bei Verlust, leerer Kasse oder Spieler-Sparen. Der Deckel umfasst **nur das heutige W5q-Exportforschungsbuch**, nicht automatisch spätere Kopfgelder, Artefakte oder weitere Quellen; eine echte gesamtweltliche Emissionsgrenze bleibt gesondert zu entwerfen.

**Offene externe Marktannahme:** W5q modelliert eine abstrakte externe Gegenpartei, nicht ein spielbares, selbst finanziertes Außenhandelsunternehmen. Die Exportware wird nachweisbar aus der Welt entfernt; ob und warum ihr ein solcher externes Kaufbudget zusteht, bedarf später eines expliziten Produktkonzepts. Diese Analyse ist kein allgemeiner Beweis für endlos zahlungsfähige Exportkunden.

## 2. Tatsächlich gemessene Ergebnisse

Für den Vergleich wird in allen Spalten derselbe bereits bis Tag 155 vollständig finanzierte R32-Forschungszustand verwendet: Miner- und Frachterarbeit, legitime Erst- und Drittspeditionskäufe, Original-W5-Werftproduktion, korrekte Eigentumsübertragungen, der reparierte rechtmäßige Ersatzfrachterkauf aus 810 ISK Treuhand und die nachgewiesenen Original-Pilotenlöhne. Alle Differenzen unten sind **zusätzliche echte Leistungen nach diesem Ausgangszustand**, Stichtag **Spieltag 365**. Seeds 42 und 7 lieferten bei diesen Produktionszahlen dieselben Werte.

| Station verkauft extern Wasser zu… | Exporte real | Einmalige neue ISK | Weitere echte interne Wasserverkäufe | Neue Wasserwerkschargen | Weitere reale Eisfrachten | Käuferkasse Tag365 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 / **kein Export (OFF)** | 0 | 0 | 1.524 | 154 | 31 | 8 ISK |
| 7 ISK/Wasser, Gesamtbudget 3.500 | 500 | 3.500 | 6.436 | 695 | 139 | 7 ISK |
| 14 ISK/Wasser, Gesamtbudget 3.500 | 250 | 3.500 | 4.236 | 450 | 90 | 7 ISK |
| **7 ISK/Wasser, Gesamtbudget 7.000** | **1.000** | **7.000** | **10.072** | **1.108** | **222** | **1.262 ISK** |
| 14 ISK/Wasser, Gesamtbudget 7.000 | 500 | 7.000 | 7.066 | 758 | 152 | 3 ISK |

Der alte R32-Standard ohne Export endet mit **33.000 ISK Weltgeld**. Bei 3.500 ISK W5q-Export sind es vollständig bilanziert **36.500 ISK**, bei 7.000 ISK genau **40.000 ISK**, ohne eine weitere Geldquelle im untersuchten Szenario.

### Entscheidend: Der Exportpreis steuert auch die Häufigkeit der Gegenleistung

Bei demselben 7.000-ISK-Gesamtdeckel muss das Modell für 7 ISK pro Einheit **1.000 echte Wasser** exportieren (100 Tage mit je 10 Einheiten), für 14 ISK pro Einheit genügen **500 Wasser** (50 Tage). Der länger laufende Verkauf erzeugt andere physische Lager-/Nachfrage- und Arbeitsabläufe; deshalb ist „mehr ISK je Einheit“ **nicht automatisch** eine stabilere Wirtschaft. Der überlegene 7-ISK-Wert ist ein **beobachteter Forschungswert**, kein auf alle Systeme übertragbares optimales Tarif-Balancing.

**Bei Tag 365** besitzt Nadir in der 7-ISK/7.000-Variante noch 5.172 ISK, der Verbrauchshaushalt 1.262 ISK. Die Original-Lohn- und Gewinnauszahlungen laufen weiterhin aus **realer Arbeit und realisierten Überschüssen**. Dagegen stehen bei 14 ISK/7.000 Nadir **6.841 ISK** und den Haushalten nur **3 ISK** zur Verfügung. Der nominelle Exporterlös ist also an derselben Station angekommen, aber die Verteilung ist **nicht gleichbedeutend mit Haushaltsliquidität**.

### Lange Gegenprobe bis Tag 425: beide Varianten endlich

- **7 ISK/7.000 an Station:** bis Tag365 zusätzlich 10.072 echte Endverbrauchseinheiten, bis Tag425 insgesamt **11.389**; Haushalt **11 ISK**, Station **6.673 ISK**, keine weiteren Wasserverkäufe nach etwa Spieltag 393. 1.000 echte Exporte, 7.000 ISK ausgegeben, Weltgeld bleibt 40.000.
- **14 ISK/7.000 an Station:** bis Tag365 **7.066**, bis Tag425 unverändert **7.066**; Haushalt **3 ISK**, Station **6.841 ISK**, kein weiterer Endabsatz nach etwa Spieltag 303. 500 echte Exporte, 7.000 ISK ausgegeben, Weltgeld 40.000.

Die Haushalte dürfen arm sein, während ein anderer rechtmäßiger Eigentümer Geld behält. Das ist kein Widerspruch im Geld-/Warenaudit. **Nicht zulässig** wäre es, die private Kasse ohne belegte Gegenleistung aus Stationsüberschüssen „für die Krise“ aufzufüllen. Selbst ein wiederkehrender Welt-Export allein garantiert deshalb keine Dauerfinanzierung privater Endnachfrage.

## 3. Unabhängiger Auditor und Manipulationssperren

Neuer Node22-Test `tests/w5s-al-stationserloes-eigentum.test.mjs`, sechs Gruppen; **alle sechs gegen den tatsächlichen GitHub-Branch-Core direkt ausgeführt und bestanden**:

1. `OFF` bleibt exakt der alte W5s-ai-Zustand, Seed42/7 bis Tag365, Weltgeld und Replay-Hashes unverändert.
2. `station` 7 ISK/7.000: Seed42 und Seed7 bis Tag425, durchlaufende R32-Geldaudits, originale Warenausfuhr, Lohn-/Eigentümeraudits, Save/Load, exakt erwartete neue ISK, bestätigte Endkunden-Grenze.
3. Entsprechende, vollständige Gegenprobe `station` 14 ISK/7.000 mit kürzerer Nachfrage und unverändertem Gesamtemissionsdeckel.
4. Gleiche Startwelt mit zwei rein finanziellen, aber unterschiedlich physischen 3.500-ISK-Varianten.
5. Negative Belegfälschungen: Exportpreis/-menge, Event-Tick, `state.minted`, Stations- oder Haushaltskasse, Warenausfuhr, mögliche direkte `w5q.payout` und `stationNet` führen zu **`audit.ok=false`**. Ein ohne Manipulation gespeicherter Zustand setzt nach JSON Save/Load hashgleich fort.
6. 13 feste Seeds × 90 Tage mit aktivem, begrenztem Stationsexport, ohne unabhängigen unbelegten Haushaltstransfer.

Zusätzlich zum gemeinsamen Core-Audit überprüft ein **zweiter, nur im Test vorhandener Konten-/Warenabgleich** direkt:
- `sum(owners.cash) = 33.000 + state.minted`, `minted = w5q.minted`, `burned=0`, `w5q.stationNet=minted`, `w5q.payout=0`.
- Stationslager-Wasser = tatsächlich produziert − tatsächlich privat verbraucht − physisch exportiert.
- Exportereignisse: Echtmenge, `amount = units × rate`, pro Tag maximal 10 Wasser und 70/140 ISK, eindeutige und aufsteigende Ticks, Gesamtbetrag = `w5q.minted`.
- `w5n_kunden.cash` = **anfängliche echte Kasse + originale W5o/W5s-Löhne und -Dividenden − tatsächlich bezahlte `w5n.wasserErlos`**. Es existiert kein direkter Export-Haushaltsanteil.

**Deterministische Hashes (Seed42/Seed7):**

| Szenario | Tag365 | Tag425 |
| --- | --- | --- |
| 7 ISK / 7.000, Station | `5e33d6fe68d2328e` / `f2a82c1b45806cc0` | `6d34f54a63578807` / `ebf829230fb85fbe` |
| 14 ISK / 7.000, Station | `38e90d35d5e8bb7a` / `66499e5f09c1a469` | `aee78db10bd85f72` / `2b7ea4aca76ebe53` |

GitHub Node22-CI `.github/workflows/w5s-al-stationsexport.yml` prüft die neuen Fälle, bisherige W5s-aj/W5s-ai-Fälle und alle im Branch vorhandenen `tests/*.test.mjs`. **Erst als vollständig erfolgreich bezeichnen, wenn GitHub sie beendet hat.** Echte iPad-Safari/NAS-Abnahme ist weiter offen; reine Forschungsdaten aktivieren keinen Spieltest.

## 4. Entscheidung nach W5s-al

**[BESTÄTIGT für den isolierten Test]** Vollständig verbuchte einmalige externe Nachfrage kann eine reale Station und damit die nachfolgenden Lohn-/Produktions-/Transportketten länger finanzieren. Eigentum und geschaffene Geldmenge sind vollständig nachvollziehbar.

**[NEGATIV]** Unter realer Sparfreiheit, endlichem Exportbudget und ohne unbelegte Haushaltstransfers entsteht trotz 7.000 ISK zusätzlichem Geld **kein dauerhaft selbsttragender Konsumkreislauf**. Die Nachfrage versiegt in beiden Krisenseeds vor oder um Tag394. Der 7-ISK-Forschungswert darf deshalb nicht als fertiges Balancing oder automatische Weltrettung in `main` übernommen werden.

**[OPTION · nächster konkreter Forschungsauftrag, noch nicht beschlossen]** Zuerst trennen, welche realen vom Stationsverkauf ausgelösten Produktions-/Wartungs-/Frachtlöhne auf bestehende Arbeiter-/Haushaltskonten fließen; danach nur eine **rechtlich und ökonomisch begründete** Stations-Gewinnausschüttung an echte Stationsbeteiligte mit mindestens voll finanzierten laufenden Werks-/Ersatzbudgets erproben. Alternativ externe Haushaltsdienstleistungen als eigene spielbare Tätigkeit konzipieren. Erst anschließend über einen neuen globalen Geldmodell-B-Emissionsrahmen mit Jahres-/Gesamtdeckel und Quellen-/Senkenbilanz abstimmen. Keine individuelle Rettung, keine pauschale Haushaltszahlung, kein Spieler-Sparlimit.

**Abnahmegrenze:** [MAIN] `5a56d9d7`, Regel14/Schema8, produktive Seite, Projekt-Saves, W5u #234 unberührt. Kein Merge, kein Deployment.
