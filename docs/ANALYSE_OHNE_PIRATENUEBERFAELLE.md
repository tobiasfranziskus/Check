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

## Interpretation, Qualitätsgates und Status

Der Unterschied zwischen der Kontrolle und `no_raids` misst den Einfluss des vorhandenen **Überfallmechanismus einschließlich seiner RNG-Folgewirkungen**. Eine andere Piratenquelle, insbesondere Patrouillen, wird nicht zugleich entfernt. Und wenn beide Welten bei gleichen Startdaten auseinanderlaufen, dann sind Versorgungs-/Kassenunterschiede tatsächliche Folgen der Variante, aber nicht automatisch eine isolierte Kausalzuordnung jeder Einzeltransaktion.

Erfolg wäre: deutlich weniger Ausfall **und** eine wiederholt **real bezahlte** Versorgung/Produktion/Schiffsersatzfähigkeit bis Tag 365 bei vertretbarer Kostenunterdeckung; **bloß mehr Warenverkäufe oder mehr überlebende Schiffe reichen nicht**. Auch eine vollständig korrekte Geld-/Warenerhaltung garantiert keine finanzierbaren Arbeitskosten, solange das aktuelle Produkt unbezahlte Arbeit nicht als spätere Verbindlichkeit speichert.

**Noch nicht freigegeben:** Kein `index.html`-Patch, kein Merge, kein Deployment. B5b und die getrennte Entscheidung über ungedeckte Arbeitskosten stehen weiterhin aus. **[TESTS]** Ausführungsstatus und Ergebnisse werden nach CI nachgetragen.
