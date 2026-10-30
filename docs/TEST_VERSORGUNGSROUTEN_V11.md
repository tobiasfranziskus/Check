# Aphros Void – Versorgungsorientierte Handelsrouten (v11)

**Stand:** 30.10.2026, [Draft-PR #27](https://github.com/tobiasfranziskus/Check/pull/27), Grundlage [Preis-/Geldkreislaufanalyse #26](https://github.com/tobiasfranziskus/Check/pull/26). **Nur Analysewerkzeuge + CI.** Die produktive `index.html`, `main`, Regeln, Preisparameter, Spielstandschema, KI und alle Mechaniken sind unverändert.

## Problem und Hypothese

In der bestehenden v11-Welt entfallen 3.981/4.204 Mangelstunden auf Nahrung. Obwohl mehr Nahrung erzeugt als verbraucht wird, reicht ihre tatsächliche Verteilung nach Aldera/Dravos nicht. Höherer Nahrungspreis (42–50 statt 30 ISK) verbessert Versorgung, verzerrt aber die Wertspanne des vorhandenen Rezeptes `2 Eis → 1 Nahrung`.

Die bestehende Funktion `m_core_entscheidung.bestesPaar` bewertet potenziell rentable Frachterangebote nach **positivem Nettogewinn pro Reisezeit**. Wir prüfen, ob dieselbe profitable Auswahl mit einem knappen, lagerbestandsabhängigen Prioritätsfaktor ausreichend Transport dorthin lenkt, wo Waren tatsächlich verbraucht werden. Keine Zwangstransporte und keine Verlustgeschäfte.

## Exakt getestete Eingriffsstelle

```js
const profit = quantity * (destinationPrice - sourcePrice) - bothTradingFees;
if (profit <= 0) continue;
const demand = destinationConfig.verbrauch[ware] || 0;
const target = destinationConfig.ziel[ware] || 0;
const deficit = Math.max(0, target - destinationInventory);
const bonus = demand > 0 && target > 0
  ? Math.floor(priorityBasis * deficit / target) : 0;
const score = profit * (1000 + bonus);
if (better(score, travelMinutes, best.score, best.travelMinutes)) selectOffer();
```

Dies ist eine **Illustration der ausgetauschten Ranking-Zeilen**, nicht weiterer Produktivcode. Bei `priorityBasis=1000` wird eine wirklich knappe Verbrauchsware maximal doppelt so hoch bewertet; bei `2000` maximal dreifach. Nahrung allein oder alle drei tatsächlich verbrauchten Waren (`nahrung`, `bauteil`, `medikamente`) werden separat getestet. Wenn die Zielstation keinen entsprechenden Verbrauch besitzt, gilt kein Bonus. Die **tatsächliche Marge wird weiterhin nach den unveränderten Preiskern-/Gebührenregeln ermittelt und muss positiv sein**. Bei Faktor 0 bleibt der bitgenaue ursprüngliche Algorithmus einschließlich Tie-Breaker erhalten.

Der Eingriff gilt ausschließlich **im Speicher des Entwicklungswerkzeugs** (`tools/supply-route-scenarios.mjs`). Keine externen Abhängigkeiten, keine neuen Waren, keine neue Geldmenge, kein neues RNG, keine Änderungen der Routenverbindungen, Handelsgebühren oder Kapazitätsgrenzen.

## Ausgeführte Verifikation

[GitHub Actions #41026155660](https://github.com/tobiasfranziskus/Check/actions/runs/41026155660), Code-Commit `d8908ff`: **45/45 Standardtests**, 13 Seeds × neun Varianten × 90 Tage = **117/117** Langläufe des **echten** v11-Core erfolgreich, stündlicher Geld-/Warenaudit und Save-/Load-Prüfung. Basis erfüllt alle fest hinterlegten v11-Hashes an Tag 3/30/90, Basismangel 4.204 und bekannte NPC-Verkaufszahlen. Unveränderte Vergleichswerte bei Nahrungspreis 42/50 wurden reproduziert. Alle übrigen aktiven v11-Wirtschaftsjobs erfolgreich; historische Sicherheitsgeografieprüfung wurde bedingt durch PR-Basis planmäßig übersprungen. Browser/iPad nicht getestet.

## 90-Tage-Ergebnisse (Summen aus 13 Seeds je Variante)

| Szenario | Gesamtmangelstunden | Nahrung | Bauteile | Medikamente | NPC1+NPC2 ungedeckte Betriebskosten (ISK) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Unverändert: Nahrung 30, reine Marge/Zeit | **4.204** | 3.981 | 204 | 19 | 23.731 |
| Nur Nahrungspreis 42 | 1.730 | 1.488 | 219 | 23 | 21.616 |
| Nur Nahrungspreis 50 | 1.120 | 826 | 240 | 54 | 16.081 |
| Nahrung 30, nur Nahrung +50 % Ranking | 1.421 | 1.173 | 229 | 19 | 18.031 |
| Nahrung 30, nur Nahrung +100 % Ranking | 781 | 501 | 248 | 32 | 21.844 |
| Nahrung 30, nur Nahrung +200 % Ranking | **465** | **82** | 321 | 62 | 22.298 |
| **Nahrung 30, alle verbrauchten Güter +100 %** | **791** | 772 | **18** | **1** | **16.090** |
| Nahrung 42, nur Nahrung +100 % Ranking | 484 | 108 | 319 | 57 | 21.432 |
| Nahrung 42, nur Nahrung +200 % Ranking | 502 | 20 | 368 | 114 | 22.584 |

**Favorit: unveränderte Nahrung 30 ISK und +100-%-Knappheitspriorität für ALLE tatsächlich verbrauchten Güter.** Gesamtmangel sinkt um **3.413/4.204 = 81,2 %**; Nahrung um 80,6 %; Mangel bei Bauteilen und Medikamenten zusammen von 223 auf 19 (−91,5 %). Alle 13 Seeds haben weniger Gesamt- und Nahrungsmangel als die jeweilige ursprüngliche Welt; Einzelwert Gesamtmangel 47–83 statt bisher 289–364 Stunden. Die starke reine Nahrungspriorisierung reduziert die Gesamtmangelstunden maximal auf 465, verschlechtert dabei allerdings den bereits vorhandenen Mangel der anderen Verbrauchsgüter von 223 auf 383. Die allgemeine Versorgungspriorisierung ist daher **ausgewogener und wirtschaftlich nachvollziehbarer**.

### Finanzielle und strukturelle Gegenprüfung

| Kennzahl (13 × 90 Tage) | Ursprungswelt | Alle Verbrauchsgüter +100 % |
| --- | ---: | ---: |
| Stationskassen am Endtag (ISK) | 304.707 | 302.449 |
| Fondskassen am Endtag (ISK) | 89.840 | 84.246 |
| Händlerkassen am Endtag (ISK) | 146.463 | 148.930 |
| NPC1 ungedeckte Kosten (ISK) | 17.187 | 10.557 |
| NPC2 ungedeckte Kosten (ISK) | 6.544 | 5.533 |
| NPC1+NPC2 Nullkassen-Stunden | 53 | 38 |
| Stationsstunden unter Mindestkasse | 6.464 | 6.245 |
| NPC-Frachter-Verkaufsevents | 298.743 | 310.058 |
| Zivile NPC-Schiffsverluste | 4.934 | 4.622 |
| Piratenschiffsverluste | 13.695 | 12.947 |
| Prämiengeld neu geschaffen (`minted`, ISK) | 1.643.400 | 1.553.640 |
| Geldvernichtung (`burned`, ISK) | 1.707.440 | 1.618.040 |

Die **Nettogeldvernichtung** bleibt praktisch gleich: Basis −64.040 ISK, Versorgungsversion −64.400 ISK (jeweils 13 Welten zusammen). Die neue Priorität schafft kein Geld und stellt kein dauerhaftes Heilmittel für jeden einzelnen Fehlbestand dar; sie belegt aber erhebliche Einsparungen bei Versorgungsengpässen und ungedeckten Kosten ohne höhere Rohstoffpreise. Die ausgewiesenen unbeglichenen Betriebskosten sind **Diagnosewerte**, die der bisherige Simulationskern nicht als Schulden weiterführt.

## Abnahmerisiken und Entscheidung

- **Ausgeführte Tests:** Determinismus, Fixreferenz, echte Waren-/Geldaudits, identische Seeds/Welt, Save-/Load je Lauf, Kosten-/Kassen-/Versorgungs- und Verlustindikatoren bestanden.
- **Noch unbewiesen:** iPad-Safari-Performance und Touchbedienung, mehr als 90 Tage, Spielstände mit beliebigem Spielerbesitz oder eigenständigem Handel, spätere Pilotengehälter, Kombination mit ungemergten anderen Feature-Branches. Eine **Produktionsintegration** würde das deterministische Zukunftsverhalten verändern; Regeln-/Versionskompatibilität muss vor einem Merge ausdrücklich geprüft werden.
- **Empfehlung:** Die +100-%-Priorisierung für alle bestehenden konsumierten Waren ist der klarste Kandidat für eine **kleine, gezielte Korrektur der Handels-KI**. Keine Änderung an Rohstoffpreisen, Produktionsrezepten, Fonds, Kapitalobergrenze, Kopfgeld oder anderen Mechaniken. Separate Prüfung und Freigabe erforderlich, bevor eine produktive `index.html` angefasst wird.

**Kein Merge nach `main`.** Die Untersuchung bleibt selbstständig prüfbar und kann ohne Auswirkungen auf gespeicherte Spiele verworfen werden.
