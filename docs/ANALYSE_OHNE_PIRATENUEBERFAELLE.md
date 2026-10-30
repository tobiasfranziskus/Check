# Friedensreferenz: Alle Piratenüberfälle ausschalten

**30. Oktober 2026 · [ANALYSE / DRAFT]**, vollständig separater Versuch vor B5b. Produktbasis: `main e0c27a3762d9d6e75d8bcc30ed47621eff2f152b`, `v0.12.4`, Regel 13, Spielstandschema 8. Vergleich zu [Piraten-Einstiegsanalyse #44](https://github.com/tobiasfranziskus/Check/pull/44). Die zentrale Produktreihenfolge steht ausschließlich in [ROADMAP.md](ROADMAP.md). **Kein Produktcode, kein Goldenwert, keine Spielstandmigration und keine Roadmap-Änderung in diesem PR.**

## Fragestellung

Könnte die Wirtschaft **vollständig ohne zivile Piratenüberfälle** bei bestehender Schiffs-/Werft-/Waren-/Geldordnung dauerhaft funktionieren? Die zuvor getestete Kapitalgrenze in #44 führte zu null NPC3-Überfällen, aber nicht zu einer piratenüberfallfreien Galaxis. Sie hinterließ in vier Spieler-Stressfällen viele Millionen ISK ungedeckten Betrieb und bei allen vier Fällen null Silizium und null Bauteile in Aldera. Mit diesem Versuch wird die globale Auswirkung isoliert.

## Zwei Varianten und strikte Grenze

- **`control`**: der ursprüngliche `main`-Simulationskern bleibt bytegleich.
- **`no_raids`**: ausschließlich die echte Funktion `m_core_sicherheit.ueberfall(state,rules)` erhält im **nur für den Test zusammengesetzten** Core einen sofortigen `return`, noch vor der RNG-Auswahl. Daher findet **kein einziger ziviler Piratenüberfall in irgendeinem System auf irgendeinen Eigentümer** statt. Das schließt auch den Überfall und die möglichen Kopfgelder/Fracht- und Schiffsverluste aus diesem Angriffskanal aus. Die dadurch ausfallenden RNG-Ziehungen führen zu einem anderen deterministischen Verlauf; damit werden **identische Startzustände**, nicht identische künftige Zufallssequenzen verglichen.

**Unverändert:** Patrouillen, Piratenschiffbestand und regulärer Piratenersatz, Sicherheitssysteme, Schutzgeld, Kosten, Preise, tatsächliche Handelsaufträge, Schiffbau, Förderleistung, Verkauf/Produktion, Frachtrouten, alle sonstigen Kampf- und Geldregeln. Dieser Versuch heißt deshalb präzise „**ohne Piratenüberfälle**“, nicht „ohne jede Piratenexistenz und ohne jeden möglichen Kampf“. Für einen vollständigen Piratenentfall (inkl. Patrouillen/Schutzgeld/Piratenersatz) wäre ein zweiter, klar anderer Test notwendig.

## Messplan

**Normalwirtschaft:** 13 feste Seeds × 2 Varianten × 90 Tage = **26 Simulationsläufe und 2.340 Tageshashes**. Historische Regel-12-Fixture dient weiterhin als unveränderte Kontrolle für den Regel-13-Produktkern. Stündliche unabhängige vollständige Kassen-/Geld- und Waren-/Frachterraum-Audits, zweite uninstrumentierte deterministische Ausführung, stündlicher Hashvergleich und Save/Load an Tag 3, 30, 90.

**Vier Spieler-Stressfälle:** Miner/42, Handelsflotte/42, Station/1234, Jagd/98765, aus dem tatsächlichen B1-Stand an Tag 90. Vor Migration wird jeder historische Regel-12-Start mit seinem echten Originalkern und alten B1-Hash verifiziert. Dann bestehende, verlustfreie **12→13-Migration** für **beide** Versuche. Die originalen vier validierten B1-Spielerbefehle bleiben identisch. Jeweils 2 × 275 Tage = **8 Simulationen und 2.200 Tageshashes**, unabhängige stündliche Geld-/Warenprüfungen, Save/Load und Replays. **Gesamt: 34 Läufe, 4.540 Tageshashes, 108.960 stündliche Replay-/Auditzeitpunkte** (ein Stundenschnitt pro Paar, nicht Anzahl unabhängiger Einzelkonto-Assertions).

**Messgrößen:** Mangelstunden, reales Handelsvolumen sowie käuferfinanzierte Warenkäufe und -verkäufe durch NPC3-Frachter; laufende fällige/bezahlte NPC3-Betriebskosten und Unterdeckung; überlebende originale und neu aufgebaute Frachter; Miner-/Frachterverluste aller Parteien; Systemfonds, NPC-/Stationskassen und real verfügbare Ware (insbesondere Silizium und Bauteile in Aldera); Geldschöpfung/-vernichtung. Piratenüberfall-Zielereignisse im Modus `no_raids` müssen **exakt null** sein.

**Auswertung:** `tools/piratenfrei-common.mjs`, `tools/piratenfrei-90.mjs`, `tools/piratenfrei-b1.mjs`, `tools/piratenfrei-summary.mjs`, `tools/piratenfrei-smoke.test.mjs`; Github Actions `.github/workflows/piratenfrei.yml`. Der Runner veröffentlicht Tabellen + JSON, **erst nach erfolgreich ausgeführten Jobs**.

## Verifizierte Messergebnisse vom 30.10.2026

**[AUSGEFÜHRT – CI #41119166315](https://github.com/tobiasfranziskus/Check/actions/runs/41119166315):** 19/19 Jobs erfolgreich: 13 Standardseeds × 2 Varianten × 90 Tage und vier B1-Spielerfälle × 2 Varianten × 275 Tage. **34 unabhängige Wirtschaftsläufe, 4.540 Tageshashes**, stündliche Replay-Hashes und unabhängige Geld-/Warenaudits, Save/Load und historische B1-Startidentitätsprüfung. **6/6 zusätzliche Kernprüfungen und 57/57 vorhandene Standardtests** bestanden, 0 Fehler/Skip. Die nachfolgende Änderung am Auswertungstext präzisiert nur Formulierungen zu diesem konkreten Vergleich; die Simulationslogik blieb unverändert. Sie löst eine erneute PR-CI aus, deren Status separat zu prüfen ist.

### Reguläre Wirtschaft: 13 Seeds × 90 Tage

| Kennzahl, Summe über 13 Welten, sofern nicht anders bezeichnet | Hauptspiel mit Überfällen | Weltweit ohne Überfälle |
| --- | ---: | ---: |
| Schiffsverluste | **4.622** | **0** |
| Mangelstunden | **791** | **751** |
| Handelsvorgänge | **1.242.258** | **1.216.575** |
| NPC-Frachter am Tag 90 (Summe) | **65** | **65** |
| NPC3-Kasse (Median) | 6.000 ISK | 6.000 ISK |
| Siliziumlager Aldera (Median) | 40 | 38 |
| Bauteillager Aldera (Median) | 39 | 29 |
| Durch den Core neu geschöpfte ISK | **1.553.640** | **18.720** |
| Durch den Core vernichtete ISK | **1.618.040** | **83.720** |
| Nettogeldänderung (Schöpfung minus Vernichtung) | **−64.400** | **−65.000** |

**[BESTÄTIGT]** Piratenüberfälle sind in dieser Testwelt die wesentliche Ursache der massenhaften Schiffsverluste. Ihre Abschaltung senkt Mangelstunden um **40 Stunden / 5,1 %**, während der gesamte Handel um **25.683 Vorgänge / 2,1 %** abnimmt und die Aldera-Lagerbestände nicht wachsen. Das Überfall-/Kopfgeldregime erzeugt sehr große **Brutto**-Geldschöpfung, verursacht indirekt oder gleichzeitig aber auch ähnlich hohe Brutto-Geldvernichtung. **Die bloß reduzierte Geldschöpfung beweist daher keinen entsprechend starken Netto-Liquiditätsentzug:** Die Netto-Geldänderung der 13 Welten unterscheidet sich nur um 600 ISK. Ein späteres Geldquellenkonzept braucht Herkunfts-/Senken- und **Verteilungs**audit statt nur Bruttozahlen.

### Vier kritische Spielerfortsetzungen: Tag 90 bis Tag 365

| Kennzahl (vier Fälle zusammen) | Normaler Überfallmechanismus | Weltweit ohne Überfälle |
| --- | ---: | ---: |
| Ursprüngliche real gekaufte NPC3-Frachter am Tag 365 vorhanden | **0/4** | **4/4** |
| Wareneinkäufe durch NPC3-Frachter | 100 | **27.613** |
| Warenverkäufe durch NPC3-Frachter | 106 | **27.625** |
| Neue tatsächliche NPC3-Frachterverluste im Beobachtungsfenster | 4 | **0** |
| Überfall-Zielauswahlen gegen NPC3 | 30 | **0** |
| Ungedeckte NPC3-Betriebskosten im Beobachtungsfenster | 870 ISK | **3.116.651 ISK** |
| Silizium- und Bauteilbestände in Aldera am Tag 365 | In allen vier Fällen 0/0 | **In allen vier Fällen 0/0** |

Die echten NPC3-Endkassen ohne Überfälle betragen im Minerfall **0**, Handelsflottenfall **0**, Stationsfall **0** und Jagdfall **58 ISK**. **Alle vier** Frachter überleben, aber kein untersuchter Krisenfall baut in Aldera dauerhaft Silizium oder Bauteile auf. Die Anzahl ausgeführter, *bereits bezahlter* Warenverkäufe ist hoch; der nicht gedeckte **laufende** Betrieb liegt dennoch im Millionenbereich. Dies ist keine bestehende Bankverbindlichkeit: Im aktuellen Kern werden die abgearbeiteten Stunden trotz unzureichender Kasse zurückgesetzt; die wirtschaftlich fällige, aber unbezahlte Arbeit wird **nicht** als Restschuld gespeichert.

**[BESTÄTIGT]** Eine friedliche Galaxis kann im aktuellen Core große Mengen Waren bewegen, obwohl die Betriebskosten nicht refinanziert werden. **Weniger Piratenüberfälle löst nicht den Grundfehler eines nicht finanzierbaren Dauerbetriebs** und nicht den Produktions-/Rohstoffengpass. Die Schonfrist aus #44 könnte später Spielerfrust bei teuren Frühverlusten reduzieren, aber sie ist kein Ersatz für die Trennung dauerhafter Sollrollen und vorübergehender Aufträge (B5b), real bezahlten Schiffs- und Handelszyklus sowie eine eigene Regel für die Konsequenzen unbezahlter Arbeit.

**Abnahmegrenze:** Diese Befunde gelten für 13 Normalstarts und vier konditionierte Tag-90-Spielerszenarien. Sie sind **keine** Aussage, dass jede mögliche Spielwelt ohne Überfälle scheitert. Der Test schaltet keine Patrouillen, Piratenhüllen, Ersatzinvestitionen oder Schutzgeld ab. Andere Piratenfunktionen und durch nicht verbrauchte RNG-Ziehungen verschobene Abläufe bleiben Teil des Vergleichs. Kein Merge, keine Einführung einer neuen Geld-/Schuldenregel, kein Deployment und keine iPad-/NAS-Abnahme.

## Interpretation, Qualitätsgates und Status

Der Unterschied zwischen der Kontrolle und `no_raids` misst den Einfluss des vorhandenen **Überfallmechanismus einschließlich seiner RNG-Folgewirkungen**. Eine andere Piratenquelle, insbesondere Patrouillen, wird nicht zugleich entfernt. Und wenn beide Welten bei gleichen Startdaten auseinanderlaufen, dann sind Versorgungs-/Kassenunterschiede tatsächliche Folgen der Variante, aber nicht automatisch eine isolierte Kausalzuordnung jeder Einzeltransaktion.

Erfolg wäre: deutlich weniger Ausfall **und** eine wiederholt **real bezahlte** Versorgung/Produktion/Schiffsersatzfähigkeit bis Tag 365 bei vertretbarer Kostenunterdeckung; **bloß mehr Warenverkäufe oder mehr überlebende Schiffe reichen nicht**. Auch eine vollständig korrekte Geld-/Warenerhaltung garantiert keine finanzierbaren Arbeitskosten, solange das aktuelle Produkt unbezahlte Arbeit nicht als spätere Verbindlichkeit speichert.

**Noch nicht freigegeben:** Kein `index.html`-Patch, kein Merge, kein Deployment. B5b und die getrennte Entscheidung über ungedeckte Arbeitskosten stehen weiterhin aus. **[TESTS]** Ausführungsstatus und Ergebnisse werden nach CI nachgetragen.
