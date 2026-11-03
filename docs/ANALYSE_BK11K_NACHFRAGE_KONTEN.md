# B-K11k – Kontoquelle realer Haushaltskaufkraft und NPC-Handelsgegenprobe

**[ANALYSE/DRAFT · 03.11.2026]** [PR #149](https://github.com/tobiasfranziskus/Check/pull/149), gestapelt auf #148 → #147 → #146. **[MAIN]** `b4e604d6`, Regel14/Schema8 unverändert. Ausschließlich testseitige Analyse des historisch gepinnten isolierten R15-/Schema9-Kerns. Keine Preis-/Lohn-/ISK-/Save-/Produktregeländerung, keine neue Emission, keine Retter- oder Sparregel und keine Integration.

## Testziel und Ausgangsbeleg

B-K11j hat aus demselben echten Save zunächst zwei bezahlte 24er-Nahrungsaufträge und danach eine reale dritte Teillieferung (Seed42: 14 Stück für 756 ISK; Seed7: 17 Stück für 918 ISK) abgeschlossen. Hier werden exakt deren **historisch feste Endhashes `ed0151cdaa03a8a1` und `61c198365462ede4` bei Tick 3960** mit Aldera-Käuferkassen von nur **40/38 ISK** reproduziert. 54 ISK kostet eine weitere Einheit.

Das lokale R15-Geldmodell zahlt Produktionslohn aus **Stationskasse `st_X` an `hh_st_X`** auf tatsächlichen Abschluss finanzierter Produktionsverträge; es gibt **keinen automatischen Haushalts-zu-Haushalts-Transfer zwischen Nadir und Aldera**. Bei laufendem lokalen Verbrauch zahlt jeder Haushalt aus eigener Kasse an die *eigene* Station. Das ist eine im Core geprüfte, aber **nicht produktiv integrierte** R15-Regel.

## [TEST] Kausalvergleich aus identischem Save

Für jeden Seed zwei unabhängige **48h-/2880-Minuten-Original-Core-Fortsetzungen**:

- **A: NPC-Frachter weiterhin angehalten:** Identischer bisheriger Einzelauftrag-Zustand, keine neue Spielerbestellung, alle Miner/Stationen/Verbraucher bleiben aktiv.
- **B: Freigabe bestehender NPC-Frachter:** Nur fünf zuvor im B-K11h/j-Test künstlich angehaltene NPC-Frachter bekommen testweise das bereits vorhandene Kommando `handeln`. Keine Rohstoffgeschenke, Kassenüberweisungen, Preis-/Lohnänderung oder Modifikation an Produktions-/Handelslogik. Das ist eine Gegenprobe aus künstlich **isoliertem** Save, keine vollständige unbeeinflusste Normalwelt ab Seed-Start.

Die ursprünglichen R15-/B-K11j-Saves bleiben fest gepinnt. Testinstrumentierung unterscheidet **NPC-Frachter-Käufe und -Verkäufe** von normalen NPC-Miner-Verkäufen. Das breit aktivierte Marktfenster verwendet nur aggregierte Original-Core-Geld-/Waren-/Herkunftsaudits, nicht mehr die streng auf *einen* Eis-Miner zugeschnittene historische B-K11j-FIFO-Hookprüfung; die alten Einzelauftragsproben behalten alle ihre bisherigen Hashes.

| Nach 48h, echte Kontoänderungen | Seed42 A: Frachter angehalten | Seed42 B: Frachter handeln | Seed7 A | Seed7 B |
| --- | ---: | ---: | ---: | ---: |
| Aldera Haushalt Start → Ende, ISK | 40 → 40 | **40 → 1.864** | 38 → 38 | **38 → 2.744** |
| Tatsächlich bezahlter Lohn an Aldera-Haushalt, ISK | 0 | **1.824** | 0 | **2.856** |
| Haushaltsausgaben Aldera im Zeitraum, ISK | 0 | 0 | 0 | 150 |
| Erste neue Aldera-Lohnzahlung, Tick | nie | **3.989** | nie | **3.989** |
| Erstmals 24 × 54 ISK Käuferbudget vorhanden, Tick | nie | **4.351** | nie | **4.141** |
| 24er-Haushaltsvertrag aus wirklicher Endkasse reservierbar? | **Nein** | **Ja** | **Nein** | **Ja** |
| Original-NPC-Frachterkäufe / -verkäufe | 0 / 0 | **29 / 62** | 0 / 0 | **75 / 103** |
| Original-NPC-Frachter-Flugbuchungen | 0 | **74** | 0 | **114** |

**Das zusätzliche Käufergeld ist keine Emission:** Es kommt aus in Aldera **wirklich bezahlter lokaler Produktionsarbeit**. Der Core reserviert auf einer **separaten Save-Kopie** tatsächlich 1.296 ISK aus dem Haushalt, validiert die echte Vertragsreserve und storniert die ungenutzte Reservation wieder; es wird keine Ware/Endabnahme nur zur Verbesserung des Ergebnisses vorgetäuscht. Der weiterlaufende Originalzustand bleibt dabei hashidentisch.

### Wirtschaftlicher Gegenposten – Kette noch nicht tragfähig

| Ausgezählte Endkassen und Betrieb aus der gleichen 48h-Gegenprobe B | Seed42 | Seed7 |
| --- | ---: | ---: |
| Aldera-Station, vorher → nachher | **4.137 → 2 ISK** | **3.940 → 7 ISK** |
| Aldera-Station: tatsächliche Erlösbuchungen | 4.392 ISK | 7.803 ISK |
| Aldera-Station: tatsächliche Kostenbuchungen | **8.527 ISK** | **11.736 ISK** |
| NPC1-Kasse, vorher → nachher | **3.000 → 65 ISK** | **3.000 → 66 ISK** |
| NPC2-Kasse, vorher → nachher | **3.000 → 124 ISK** | **3.000 → 65 ISK** |
| Aldera-Systemfonds, vorher → nachher | 655 → **5.764 ISK** | 1.015 → **7.044 ISK** |
| Gesamt-ISK vor/nach, inkl. Vertragsreserve und bestehenden Core-Quellen/Senken | 50.000 / 50.000 | 50.000 / 50.000 |
| Bestehende Core-Emission/Senke während 48h | 480 / 480 ISK | 240 / 240 ISK |
| Endhash Kontrolle A | `39a8ef0e72def48d` | `cc55753322483e85` |
| Endhash NPC-Handel B | `0d47d35f43f1bac6` | `e18524faeb778a7c` |

**Zentraler Schluss:** Die Kaufsperre in Aldera ist **kausal aufhebbar, ohne zusätzliche ISK**, wenn echte NPC-Warenlieferungen bezahlte lokale Produktion und damit lokale Haushaltslöhne ermöglichen. Die Stabilisierung ist **nicht** gelungen: Dieselbe Aktivierung leert nahezu die Kassen von **Aldera, NPC1 und NPC2** und verschiebt erhebliche ISK-Bestände in bestehende Systemfonds. In dieser Testwelt ist damit das Problem **kein bloßer Mangel an globaler Geldmenge**, sondern **die wirtschaftliche Finanzierung und Verteilung einzelner Leistungsketten**. Weder NPC-Handelsgewinne noch langfristige Versorgungsstabilität oder dauerhaftes Käuferbudget sind nachgewiesen.

Die Station-Erlös-/Kostenbilanz darf nicht mit der Fabrik-Chargenmarge oder Geldemission gleichgesetzt werden. Verluste, Schiffsrücklagen, tatsächliche Waren-/Transport-Deckungsbeiträge, Fondsflüsse und eventuelle neue Produktionssperren müssen weiterhin gemeinsam ausgewertet werden.

## Gates und Grenzen

**[TEST]** Gezielter [B-K11k-CI-Lauf #41662484687](https://github.com/tobiasfranziskus/Check/actions/runs/41662484687), 10/10 Node-Tests bestanden, 0 fehlgeschlagen; Seeds42/7 × 2 reale 48h-Gegenwelten; stündliche Audits, tägliche Save/Load-Prüfung, feste B-K11h/i/j/k-Referenzhashes, echte Vertragsreservierung auf Save-Kopie. **Standard-CI** wird gesondert überprüft.

**Nicht bewiesen:** Gesamtsimulation mit natürlichem NPC-Autohandel **ab Start**, langfristige 13×90d-Stabilität, Piraten-/Hüllenersatz-/Krisenresilienz, wirtschaftlich tragfähige Folgebestellungen, eine Lösung für den Systemfonds-Stau, Regel15-/Schema9-Save-Migration oder iPad-/NAS-Abnahme. Keine Produktregelentscheidung.

**Nächstes enges Gate [ANALYSE]:** Die erste Liquiditätsblockade im **reaktivierten Händlerpfad** auf echte Cargo-/Preis-/Fahrtkosten/Erträge samt Fonds-/Arbeitseinkommensverteilung zurückführen (NPC1/2 vs. Station Aldera), ohne zunächst Geldregeln zu ändern. Danach zwischen D2 (Produktionslohn/Empfänger) und D3 (marktdeckende Aufträge) entscheiden; Geldmodell B und D6 separat freigeben.
