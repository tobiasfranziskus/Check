# B8p – Endverbraucherzahlungen: vorhandene Fonds oder begrenzte hypothetische Emission?

**[ANALYSE/NEGATIV · 01.11.2026]** Basis `main 0d473e6`, unveränderte Original-`index.html`, Regel14/Schema8. **Ausschließlich ein isoliert instrumentierter Analyserunner, keine Produktänderung und KEINE Freigabe einer Emissionsregel.** B8n zeigte, dass ziviler Verbrauch Waren physisch verbraucht, ohne etwas zu bezahlen; fehlende Stations-ISK und gescheiterte NPC-Händler erschweren die Versorgung. B8p testet ausdrücklich, ob ein **einfacher** an nachgewiesene Abnahme geknüpfter Geldtransfer genügt.

## Analytische Gegenannahmen – nicht freigegebene Spielregeln

Alle Varianten verwenden **unverändert die sieben historischen Spielerbefehle** aus der B1-Krise und die **originalen** Rule14-Preise, Käufe, Schiffersatz, Kampf, Geldsenken, Produzenten und NPC-Entscheidungen. Ein einziger Hook wird nur in der Testauswertung nach **tatsächlich verbrauchter** Nahrung/Medizin aufgerufen; physischer Verbrauch und `ledger.consumed` sind Originalfunktionen. Die Auszahlung erhält stets die tatsächlich verbrauchende Stationskasse (kein gesonderter NPC-Rettungsempfänger).

- **`original`:** völlig unveränderter Kern, Kontrollhashes Seed42 `784047684dfe5c56` / Seed7 `84153573536268f2`.
- **`transfer`:** 5 ISK je Nahrungseinheit und 10 ISK je Medikamenteneinheit, aus **vorhandenem** Fonds des Stationssystems in die tatsächliche Stationskasse; maximal 200 ISK an einem Spieltag global. **Keine** ISK-Schöpfung.
- **`mint-6k` / `mint-12k`:** dieselbe, nur nach wirklicher Verbrauchsbuchung mögliche Zahlung **zusätzlich** an die Stationskasse, `state.minted` wird um exakt dieselbe Summe erhöht und die Weltgeldbilanz unabhängig geprüft. Global höchstens 200 ISK je Tag sowie **6.000 bzw. 12.000 ISK über die gesamte 90-Tage-Laufzeit**. Das sind ausschließlich bewusst gesetzte **hypothetische Testparameter**, keine beschlossene Geldmodell-B-Emission.

Die globalen Grenzstände `day`, `today`, `total` und Prüfdaten liegen nur in den analytischen Zustandsdaten und sind im Test-Save enthalten; kein produktives Save-/Regelmigrationsverhalten ist implementiert. **Erheblicher ökonomischer Vorbehalt:** Konsum aus anfänglichen Stationslagern wird ebenfalls honoriert, obwohl noch keine neue Lieferleistung / Warenherkunft belegt ist. Daher ist der Pilot **kein hinreichend belegtes Geldmodell B**, selbst falls die Ergebnisse positiv gewesen wären.

## Reproduzierbare Ergebnisse, zwei Krisenseeds × vier Varianten ×90 Tage

**[TEST/CI erfolgreich] [GitHub #41288140390](https://github.com/tobiasfranziskus/Check/actions/runs/41288140390):** Originalregressionen **67/67**, acht komplett gerechnete 90-Tage-Welten, **17.280 stündliche unabhängige Geld-/Warenaudits plus Doppel-Replays**, **64 Save/Load-Roundtrips**; historische Seed42/7-Endhashes reproduziert, JSON-Ergebnisartefakt erhalten.

| 90 Tage, Seed42 | original | Fonds-Transfer | Mint-6k | Mint-12k |
|---|---:|---:|---:|---:|
| Tatsächlich zusätzliche Auszahlung, ISK | 0 | **1.240** | **2.200** | **2.200** |
| Davon neue zusätzliche ISK | 0 | 0 | **2.200** | **2.200** |
| **Separat** ursprüngliche Kopfgeld-Emission, ISK | 6.360 | 6.480 | 10.920 | 10.920 |
| NPC-Händlerfrachter Tag90 | 0 | 0 | 0 | 0 |
| NPC-Händlerkasse Tag90 | 0 | 0 | 8 | 8 |
| Spieler-Endkasse, ISK | 39.762 | 41.963 | 43.481 | 43.481 |
| Stationskassen zusammen, ISK | 4.466 | 6.675 | 4.939 | 4.939 |
| Nahrung konsumiert (Einheiten) | 2.541 | 2.271 | 3.087 | 3.087 |
| Medikamente konsumiert (Einheiten) | 644 | 619 | 778 | 778 |
| Nahrungsmangel bei Verbrauchsstationen Tag90 | 6/6 | 6/6 | 6/6 | 6/6 |
| Medikamentenmangel bei Verbrauchsstationen Tag90 | 6/6 | 6/6 | 6/6 | 6/6 |

| 90 Tage, Seed7 | original | Fonds-Transfer | Mint-6k | Mint-12k |
|---|---:|---:|---:|---:|
| Tatsächlich zusätzliche Auszahlung, ISK | 0 | **1.230** | **2.350** | **2.350** |
| Davon neue zusätzliche ISK | 0 | 0 | **2.350** | **2.350** |
| **Separat** ursprüngliche Kopfgeld-Emission, ISK | 4.800 | 4.080 | 5.280 | 5.280 |
| NPC-Händlerfrachter Tag90 | 0 | 0 | 0 | 0 |
| NPC-Händlerkasse Tag90 | 0 | 0 | 0 | 0 |
| Spieler-Endkasse, ISK | 39.338 | 41.459 | 45.726 | 45.726 |
| Stationskassen zusammen, ISK | 5.172 | 4.225 | 4.245 | 4.245 |
| Nahrung konsumiert (Einheiten) | 2.599 | 2.029 | 2.630 | 2.630 |
| Medikamente konsumiert (Einheiten) | 704 | 533 | 678 | 678 |
| Nahrungsmangel bei Verbrauchsstationen Tag90 | 6/6 | 6/6 | 6/6 | 6/6 |
| Medikamentenmangel bei Verbrauchsstationen Tag90 | 6/6 | 6/6 | 6/6 | 6/6 |

**Wichtig:** Der nominelle Lebenszeit-Emissionsdeckel 6.000/12.000 ISK war in diesen **negativen** Krisenwelten nie bindend; die 200-ISK-Tagesgrenze und der tatsächlich vorhandene Konsum begrenzten die Zahlungen. Die beiden Mint-Varianten enden deshalb exakt mit demselben Hash. Die tatsächlichen `state.minted`-Werte umfassen **auch die bereits existente Kopfgeld-Emission**; nur die in der Tabelle bezeichnete zusätzlich emittierte Summe ist der neue Test-Hook. Die Weltgeldbilanz hat `initialSupply + minted − burned` geprüft; im Original-Seed42 waren 6.360 ISK Kopfgelder verbucht und 11.360 ISK vernichtet (netto −5.000 gegenüber Start). Bei Seed7 waren es 4.800/9.800 ISK, ebenfalls netto −5.000.

## Bewertung

**[NEGATIV]** Die einfache Verbrauchsvergütung führt in keinem der beiden Seed42/7-Fälle zum Wiederaufbau einer tatsächlich arbeitenden NPC-Händlerflotte, auch nicht bei hypothetisch zusätzlicher Endnachfrage. Allseits vorhandene Rohstoffe, höhere Stationszahlungsstände oder ein weiterer pauschaler Geldbetrag reichen nicht aus, wenn kein Akteur einen wirtschaftlich finanzierbaren Handelsneustart beschließt. Zusätzlich kann das durch Auszahlung entstandene Geld durch bestehende Handels- und Sparflüsse wiederum aus den Käuferkassen abfließen. Der Rückfluss an **reale Lieferanten und Transportleute** ist nicht garantiert.

**[EINSCHRÄNKUNG]** Die verglichenen 90-Tage-Krisenwelten sind starke pathologische Fälle, keine allgemeine Aussage über jede Modell-B-Ausgestaltung. Das Experiment prüft **nur Verbrauch nach Warenabzug**, **nicht** tatsächlichen Liefervertrag, Herkunft neuer Ware, ausgeschriebenen Transport oder B8o-Auftragsbudgets. Das beweist nicht, dass regelgebundene Endnachfrage generell unbrauchbar ist, sondern dass *diese simple Zahlung* die akute Flotten-/Kaufkraft-Klemme nicht repariert. Eine geschützte Preisgarantie oder künstliche Wiederbelebung einzelner Firmen wäre trotzdem nicht zulässig.

## Nächste saubere Entscheidungsgates

1. **Vor einer neuen ISK-Regel erst alle bestehenden Quellen und Senken auditieren**, vor allem Kopfgeldzahlungen in `m_core_sicherheit` (bisher ohne globales Budget), Sicherheitsdienst-Kostenbrand und Spieler-Sparflüsse.
2. **[OPTION – nur nach gesonderter Nutzerfreigabe]** Globaler, begrenzter Leistungs-/Liefervertrag, dessen Auszahlung erst gegen nachweislich neu erbrachte Lieferung oder tatsächlichen Verbrauch mit eindeutiger Warenherkunft erfolgt. Keine automatische Firmen-Rettung und keine pauschale Auszahlung für bereits vorhandene Startbestände; Preise und Gesamtbudget müssen zuerst belegt werden.
3. **[OPTION, getrennt]** Wirtschaftlich finanzierbarer Einstieg eines anderen Konzerns (B8k/B8m), mit echter transportbezogener Auftragsreservierung (B8o) und realem Käuferauftrag. Eine reine Geldemission erzeugt keine Schiffswahl.
4. Vor jedem Produktentscheid: 13×90d, 365d, Grundversorgung, Insolvenzen, Schiffsverluste, deterministische Geld-/Warenaudits, Save-/Regelmigration, reale Safari-/NAS-Abnahme.

**Kein Produktmerge, keine Emissionsregel-Freigabe.** Der Test-PR bleibt archiviert.
