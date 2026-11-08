# C1d-8 – Zweite echte Viererproduktion, noch ohne Zweitverkauf

**[DRAFT / FORSCHUNG · 08.11.2026]** Auf [C1d-7 / PR #260](https://github.com/tobiasfranziskus/Check/pull/260) gestapelt. Nur im neuen opt-in-Profil `aphros-research:C1d-8:second-real-manufacturing-v1` (**Regel 3312**). Kein Eingriff in `main`, Produkt-Saves, Pages, Roadmap oder Regel3307–3311. Keine neue ISK und keine zweite Wirtschafts-/Simulations-Engine.

## Was tatsächlich geht

Die bereits bezahlte erste Vierermodul-Lieferung wurde in C1d-5/6 zum Tick592 vollständig exportiert. C1d-7 produzierte anschließend aus neuen echten Erzlieferungen und 8 bezahlten Raffineriechargen insgesamt **32 Material**, davon **16 Material verfügbar** am Tick870, mit weiterhin **20 Erz** in Nadir.

C1d-8 erhöht **ausschließlich** im getrennten Forschungsprofil die Zahl der tatsächlich finanzierbaren Rohstoff-, Bauteil- und Lagermodulchargen von 4 auf **8 kumulierte Chargen**. Das sind keine acht kostenlosen Lagerobjekte: jedes Silizium-Los benötigt einen echten vorhandenen Miner und 20 vorfinanzierte Arbeitsminuten, jedes Bauteillos bezahlt **4 Material × 48 ISK + 2 Silizium × 24 ISK = 240 ISK** aus der Herstellerkasse plus **16 ISK Fabrikarbeit**. Die anschließende Lagermontage verbraucht genau die **2 eigenen, im Stationslager verwahrten Bauteile** aus einem neuen eindeutigen Eigentumslos plus **12 ISK vorfinanzierte Arbeit**. Keine zweite 340-ISK-Kaufrechnung für eigene Bauteile.

Nach dem Ausbau wurden **vier weitere Chargen** nacheinander abgeschlossen. Jedes der vier neuen Lose hat separate, fortlaufend nummerierte Belege `C1D5-BT-0005` bis `0008`, tatsächliche Produktionsticks, den ursprünglichen Eigentümer `house`, physischen Verwahrer `st_nadir`, genau einmalige Entnahme und zugehörige neue Montage-ID. Das war möglich **ohne** erneute Minerkäufe, Gratislöhne, Lagerlöschungen oder neue Waren.

### Beide Seeds 42 und 7, Tick 1062

| Echter kumulierter Kennwert | Wert |
|---|---:|
| W3 angelieferte Erze | 2 × 50 = **100** |
| W4 Raffineriechargen | **8** |
| W4 Material insgesamt erzeugt | **32** |
| W5b Material im Bauteilbau verbraucht | **32** |
| W5b Silizium wirklich gefördert / verbraucht | **16 / 16** |
| Bezahlte Siliziumförderarbeit | **160 ISK** |
| W5b Bauteile produziert / verarbeitet | **16 / 16** |
| Alle 8 Bauteilchargen, echter Stationsvorprodukteinkauf | **1.920 ISK** |
| W5b Fabrikarbeitslohn (Teile + Lager) | **224 ISK** |
| Lagermodule tatsächlich produziert | **8** |
| Davon bereits einmalig bezahlt exportiert | **4** |
| Davon neu in Nadir auf Lager, noch unverkauft | **4** |
| Herstellerkasse `house` | **2.152 ISK** |
| Stationskasse `st_nadir` | **1.676 ISK** |
| Frachterkasse `transport` | **1.550 ISK** |
| Endkäuferkasse `export` | **18.180 ISK** |
| Weltgeldmenge | **33.000 ISK** |
| Neu geschöpftes Geld | **0 ISK** |

Korrektur des alten Audits: Die vollständig abgeschlossene **erste** C1d-Rundfracht darf weiterhin nur die erste reale Viererlieferung bescheinigen. Nach deren Rückkehr darf das Original-C1d-Audit im neuen Profil in Nadir wieder neue, **durch das Original-W5b-Warenbuch vollständig belegte** Lagermodule erlauben. Es überprüft dazu, dass der neue Nadir-Bestand genau `ledger.lager.produced − 4` ist. Eine weitere Fracht oder Ausbuchung lässt sich damit **nicht** fingieren.

## Strikte Grenze für den nächsten Schritt

Auch wenn die Endkäuferkasse vorhandene 18.180 ISK und die Herstellerkasse 2.152 ISK besitzt, **existiert aktuell kein zweiter Kauf- und Exportauftrag**. Die Befehle `stationPrepayStorage`, `shipCapitalFreight` und `stationAcceptStorage` verweigern ein zweites Mal ausdrücklich den Zugriff; ebenso stoppen neun Produktionschargen.

Der alte unterschriebene Kaufvertrag `C1D4-0001`, das erste Frachtergeschäft und ihre vollständigen Journale bleiben einmalig. Sie dürfen nicht durch Rücksetzen von Zählern, Wiederverwendung eines bereits ausgezahlten Käuferescrows oder Umbenennen alter Eigentumsbelege für ein zweites Geschäft benutzt werden. **Für einen zweiten Transport/Verkauf ist ein neuer Vertrag mit eigener ID, erneut nachgewiesener Finanzierung, Kaufrestreserve, vollständig neu bezahlter Rundfahrt, kumulativer Warenprüfung und unabhängiger Rechnung nötig.**

## Qualität und Grenzen

- **6/6 direkte JavaScript-Core-Tests tatsächlich ausgeführt**, Seeds 42 und 7, feste Endhashes Seed 42 `d1fa12c4e881fa48`, Seed 7 `b264334fd8b6225f`, jeder Produktionsschritt plus laufend voller Audit, Save/Load, Eigentums- und Mittelmanipulationen, 9. Charge abgelehnt.
- CI-Einbindung im ursprünglichen Node22-Forschungsworkflow: `node tests/c1d-8-zweiter-modulzyklus.test.mjs`. **CI-Ergebnis erst nach realem Abschluss melden**. Frühere Forschung 3308–3311 separat auf Rückwärtsverträglichkeit prüfen. Browser-/Safari-/NAS-Abnahme weiterhin offen.
- Keine Dauerwirtschaft nachgewiesen. Ursprünglicher Endkäufer verfügt nur über endliches Startkapital, Kapitalverschleiß und echte Folge-Nachfrage sind unbewiesen. Keine Produkt-/Geldemissionsentscheidung.

**Nächster unabhängiger Forschungs-Draft [OPTION]:** C1d-8b, **zweiter eindeutig bezeichneter C1f-Käufervertrag und zweite echte C1d-Rundfracht** mit 4 neuen, bereits auf Nadir liegenden Waren; vollständige Vorfinanzierung und Rückfahrt, danach eigentumsrechtlich gesicherte Zweitabnahme aus endlichem Bestand. Erst nach zweimal echten Verkäufen eine belastbare Ertrags- und Wiederholungsbewertung beginnen.
