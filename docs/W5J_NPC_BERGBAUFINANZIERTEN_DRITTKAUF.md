# W5j – Dritter Jäger aus tatsächlich vergütetem NPC-Erzabbau

**[DRAFT / ANALYSE] 05.11.2026 · PR #188 auf W5i #185 · Regel26/Schema8 unverändert.**

## Leitfrage und Antwort

In W5i produziert House drei Jäger tatsächlich und vollständig, doch NPC3 kann nach zwei Käufen die dritte Hülle nicht bezahlen: Es verbleiben **600 ISK** statt des originalen **900-ISK-Preises**. W5j prüft **nicht** einen künstlichen Geldzufluss, sondern ob NPC3 als bestehender Eigentümer eines bezahlten Erz-Miners die fehlende Käuferliquidität durch *eigene reale Dienstleistung* verdienen kann.

**Ja, in der konkret angegebenen Eigentümerstrategie.** Der normale Core-Befehl `shipWait` hält House zeitweise freiwillig an, und `shipMine` beauftragt NPC3 mit einem bereits bezahlten eigenen Miner. Das freie 50-Erz-Auftragsfenster bleibt durch die volle bisherige House-Warencharge bis zu einer echten W3-Lieferung gesperrt. Danach finanziert die vorhandene Aldera-Station einen realen NPC3-Erzabbau, der Core belohnt nur die gelieferte physische Ware. Der ebenfalls unveränderte `shipBuy` erwirbt erst *danach* die dritte Lagerhülle.

## Kassenbeweis (tatsächlicher Core-Versuch Seed42)

| Echtes Ereignis | NPC3-Kasse |
| --- | ---: |
| Start: ursprüngliche NPC3-Eigentümerkasse | 2.400 ISK |
| Zwei vorherige 900-ISK-Jägerkäufe | −1.800 ISK |
| Frei vor erneuter eigener Leistung | 600 ISK |
| Vorfinanzierte 50 Erz × 2 ISK Arbeit aus NPC3 | −100 ISK |
| Reale Erzabnahme der Station: 50 × 10 ISK | +500 ISK |
| Frei vor dem dritten Kauf | 1.000 ISK |
| Dritter voll bezahlter Jägerkauf | −900 ISK |
| **Rest** | **100 ISK** |

Zusätzlich gilt am finalen Kassenstand die unabhängig aus den Original-Kontostatistiken hergeleitete Identität `npc3.cash + ungenutzte_Arbeitsreserve = 2400 + npc3.Erlöse − npc3.Kosten`. Nach abgeschlossener Förderung und dem Kauf: `100 = 2.400 + 500 − 2.800`. Die 500 ISK stammen aus Alderas vorhandenen Mitteln, nicht aus dem Nichts. Die zurückliegende W3-Lieferung hat zuvor das Erz des Händlers real nach Nadir gebracht. Kein Bankkredit, Geschenk, Fondsauffüllung, ISK-Emissionsakt oder kostenloser Arbeitsauftrag.

Im Endstand des direkten Versuchs wurden **9 × 50 Erz = 450 Erz** in echten W3-Frachten nach Nadir geliefert. Drei Jäger wurden zuvor aus wirklichen Rohstoffen und Bauteilen produziert und danach für je 900 ISK wirklich verkauft; keine Scheinabschreibung im Warenledger. House verfügt nach dem dritten Verkauf über **1.764 ISK**, NPC3 über **100 ISK**, Nadir über **2.200 ISK**. Die Gesamtgeldmenge bleibt **33.000 ISK** mit `minted=burned=0`.

## Umsetzung: keine neue Regel

W5j ist bewusst **eine neue belegte Strategie- und Abnahmeübung**, keine zusätzliche Wirtschaftsregel. Die unveränderte Regel26 erstellt weiterhin all diese Transfers, Lose, Preise, Eigentumswechsel und Audits in genau einem Kern. Daher **kein** unnötiges Hochzählen auf Regel27 und keine Save-Migration.

Neu ist lediglich eine eigene statische Forschungsansicht `prototypes/w5-welt/w5j.html` mit den drei tatsächlichen Eigentümeraktionen `NPC3-Miner pausieren`, `House-Miner pausieren` und `NPC3-Miner fördern`. Der finanzielle Ausweis ist **rein lesend** und zeigt den bereits gebuchten Erlös, gebundene Arbeiterreserve, Käuferkasse, echte NPC3-Erzverkäufe und Kaufpreis. Es gibt keine Automatikkäufe und keine im Browser erfundenen Konten. Die Seite verwendet einen **eigenen CAS-geschützten** IndexedDB-Bereich `aphros-void-forschungswelt-w5j` und den Slot `regel26-npc-bergbaueinnahmen-drittjaeger-v1`; alle früheren Browser-Spielstände bleiben unangetastet. Ein explizit importierter, auditierter Regel26-Spielstand ist erlaubt, aber nicht still überschrieben.

## Negative Fälle und ökonomische Grenze

- Verweigert House freiwillig die Förderpause, entsteht **kein Anspruch** des NPCs auf seinen Bergbauauftrag, die 600-ISK-Käuferkasse wird nicht aufgefüllt und die dritte Hülle darf unverkauft bleiben. NPCs dürfen scheitern.
- Vor realer Erzabnahme reichen die 600 ISK nicht für den dritten Kauf. Ein fehlgeschlagener `shipBuy` lässt Geld, Ware und Hash unverändert.
- Jeder Erzauftrag benötigt tatsächliche Bergbauarbeit mit 100 ISK Betriebskapital und einen realen zahlungsfähigen Stationsabnehmer. Kein bezahlter Auftrag ohne vorhandene Mittel und Waren.
- Die negative **Hersteller-Differenz −1.388 ISK je Jäger** bleibt bestehen (2.288 ISK echte Herstellerzahlungen gegen 900 ISK Erlös). Die Werft wird durch Erzumsatz des Herstellers subventioniert, nicht profitabel gemacht. Auch eine endliche dritte Hülle garantiert **keine dauerhaft finanzierbare vierte**: nach dem dritten Kauf hat NPC3 nur 100 ISK, House und Nadir führen andere Mittel. Weitere Steuern, neue Preise, Geldschöpfung, Gratispiraten und künstliche Endkunden sind ausdrücklich nicht implementiert.
- Die Strategie ist kein behauptetes automatisch optimales NPC-Verhalten. Der Spieler wird weder zum Pausieren gezwungen noch vom Sparen abgehalten. Ein autonomer Firmenrat, der solche Vereinbarungen selbst bezahlt trifft, ist ein gesondertes späteres Produktziel.

## Qualität und Integrationsgrenzen

In `tests/w5j-drittjaeger-npc-erzarbeit.test.mjs` liegen eigene Testsequenz, vor/nach echter Bezahlung überprüfte atomare Kaufablehnung, Manipulation von Käuferkonten und Erlösstatistik, unabhängige physische Waren- und 33.000-ISK-Bilanz und **13 Seeds × 90 Tage** mit täglichem Core-Audit, Hash-Replay und Save/Load. `tests/w5j-ui.test.mjs` prüft reine Projektion ohne Mutationen, eigentümergebundene Befehle, getrennten CAS-Speicher und fehlende Browsergeldbuchungen. **Nur tatsächlich ausgeführte CI-Ergebnisse als bestanden melden.**

Unverändert: `index.html`, alle alten R14–26-Buchungsfunktionen, Preise, Rezepte, Kernzustand, alte Testdateien, PR #186 Legacy-Fitting und paralleler Codex-Stationsprototyp. **Keine Hauptspielfreigabe**, kein Merge, kein Deployment; echte iPad-Safari-/NAS-/WebKit-Abnahme offen.
