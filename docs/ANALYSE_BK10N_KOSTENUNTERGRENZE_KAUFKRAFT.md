# B-K10n – Bezahlte Herstellungskosten, importierte Altware und reale Haushaltskaufkraft

**[ANALYSE/DRAFT · 02.11.2026]** [PR #131](https://github.com/tobiasfranziskus/Check/pull/131), auf #130 → #129 → #128 → #127 → #126 → #124 → #123 → #108. **[MAIN] `b4e604d6`**, v0.12.5 / Regel14 / Schema8 unverändert. **R15/Schema9, 4 ISK Fabriklohn je Minute und geldgedeckter Neu-Nahrungsverbrauch sind weiterhin keine auf main integrierten Regeln.** Keine Änderungen an `index.html`, echten Preisen, Löhnen, Fonds, Emissionen, Firmen-, Save- oder UI-Regeln. Nur neue Testinstrumentierung, diese Analyse und Projektstatus.

## Ergebnis in einem Satz

**Ein kostendeckender Nahrungsendpreis allein reicht nicht:** Bei echten 72-Stunden-Löhnen und tatsächlich angebotenen Waren verliert Veldras Haushalt in 9/13 autonomen Testwelten bei einer bereits *ohne Frachter- und Schiffersatz* angesetzten Kostenuntergrenze kumulativ Kaufkraft. Die heutige tatsächliche Zahlung in einem isolierten einzelnen Stundenkauf täuscht über die spätere Kassenlücke hinweg. Ein allgemeiner Preisaufschlag ohne Vorfinanzierung und Betriebs-/Kapitalkostengate ist deshalb nicht als Lösung belegbar.

## 1. Zwei strikt getrennte Analyseschichten

### A. Echte Original-Core-Welt

13 Seeds: **1, 2, 7, 11, 13, 17, 42, 99, 1234, 2026, 65535, 98765, 314159**, je **72 Spielstunden**. Nadir, Cyris und Veldra werden **in derselben Welt** gleichzeitig gemessen. Alle ursprünglichen Vorräte, NPC-Händler, Miner, Jäger, Piraten, Haushaltszahlungen, anderen Fabriklinien, Preisformeln und Systemfonds sind aktiv und unverändert. Die Original-R15-Kandidatenspielwelt führt die tatsächlich bezahlten Eis-Einkäufe und Fabriklöhne sowie Haushaltseinnahmen und Endverbräuche aus.

Das Testjournal erfasst die im Original-Core nachweislich *wirklich bezahlten* Eis-Warenpreise, tatsächliche Fertigungslöhne sowie bezahlte importierte Alt- und Neu-Nahrung. Anfangsvorräte besitzen **unbekannte historische Einstandswerte**, keine angenommenen Nullkosten. Ein analytisches FIFO weist Original-Einkaufslosen ihre späteren Produktionen zu; eine solche gespeicherte Rohstoff-Chargen-ID ist **nicht** Teil des Produktmodells.

**Audits:** stündlicher unabhängiger ISK-/Vertragsreserve-/Warenaudit, Original-Core-Audit und getrennte Warenherkunfts-/Kosten-FIFOs, täglicher Original-Save/Load- und Hash-Test; deterministischer Seed42-24h-Replay. Kein Test-Waren-/Kasseneingriff, kein reaktives Steuern der NPC-Händler.

### B. Rein rechnerische Kostenuntergrenze und zwei Kaufkraftchecks

Für ein tatsächlich im Original-Lager zum Verbraucher verfügbares Stück:
- **Neue eigene Produktion aus nachweislich bezahltem Eis:** mindestens **max(Original-Marktpreis, tatsächlich bezahlte 2 Eiseinheiten + 24 ISK tatsächlich bezahlter Fabriklohn)**. Kein erfundener durchschnittlicher Eispreis.
- **Echt eingekaufte Import-Altware und -Neuware:** mindestens **max(Original-Marktpreis, wirklicher stationsseitiger Einkaufspreis)**. Dadurch wird die in B-K10m befundete, zuvor **bezahlte**, aber unentgeltlich konsumierte Import-Altware überhaupt erst als potentiell zahlungspflichtig behandelt.
- **Historische Startnahrung:** ausdrücklich weiterhin ohne nachträgliche Haushaltszahlung; für Produktion aus historischem Eis mit **nicht belegtem** Einstand wird der wirkliche aktuelle Marktpreis beibehalten, statt fiktive Kosten zu erfinden.
- **Nicht enthalten:** Miner-/Frachter-Schiffsersatz, Werft- und Fabrikkapital, Bergung/Pirat, zukünftige Preisreaktion, Versand/Transportkosten auf lokale Nahrung. Die hier untersuchte Untergrenze ist somit **keine volle wirtschaftliche Rentabilitätsschwelle**.

Zwei getrennte Berechnungen, ohne auch nur eine ISK-Buchung im Original-Core zu ändern:

**A. Momentaufnahme:** Direkt beim Original-Stundenkauf wird geprüft, ob die *tatsächlich vorhandene* Haushaltskasse die preislich konservativ angepassten aktuell im Lager befindlichen Nahrungseinheiten hätte bezahlen können. Diese isolierten Wallet-Prüfungen sind in den 13×72h-Welten **nicht eng**: Alle momentan angebotenen Stücke passen zu diesem Zeitpunkt in die vorhandene Kasse.

**B. Kumulierte Schattenkasse ohne Kredit:** Eine daneben nur im Test gezählte Kasse beginnt mit dem tatsächlichen anfänglichen Haushaltsguthaben und bekommt Stunde für Stunde **genau den ansonsten tatsächlich beobachteten Einkommenszufluss** (unter anderem reale Fabriklöhne aller Linien). Sie bezahlt die obige Kostenuntergrenze in Original-FIFO-Reihenfolge für das **im Original-Szenario beobachtete Warenangebot**, niemals mehr als ihr aktuelles Guthaben. Bei einer nicht finanzierbaren Einheit wird die übrige aktuelle Original-Nachfrage dieser Stunde als nicht finanziert protokolliert. In jedem Seed gilt **Schatteneinkommen = tatsächlich hypothetisch bezahlte Endverbrauchssumme + nichtnegativer Rest**; kein Kredit, keine Emission. Falls die ursprüngliche Stunde keine Ware verkaufte, wird auch dieser Ausgangsfall gesondert verbucht.

**Wichtige Einschränkung:** Diese kumulative Variante ist **keine unabhängig weitergerechnete zweite Waren-/Geld-Wirtschaft**! Sie lässt den wirklichen NPC-Fertigungs-, Fondseingang-, Lohn- und Lagerverlauf absichtlich unangetastet; in einer alternativen vollständigen Welt würden weniger Käufe Lager, Kassen und späteren Beschäftigungslohn verändern. Die hier ausgewiesenen hypothetischen Fehlmengen sind deshalb **ein begrenzter, deterministischer Frozen-Income-/Frozen-Supply-Stresstest**, keine validen Prognosen über eine produktiv eingesetzte Preisreform.

## 2. Gemessene Istwelt und Preis-Stressszenario

| Alle Angaben aggregiert über **13 getrennte** autonome Welten à 72h | Nadir | Cyris | Veldra |
|---|---:|---:|---:|
| Tatsächlich dem Originalhaushalt angebotene Nahrung | **1.872 Stk** | **2.689 Stk** | **2.784 Stk** |
| Tatsächlicher Original-Verzehr | 1.872 | 2.689 | 2.784 |
| **Wirklich an die Station für diesen Konsum gezahlt** | **46.342 ISK** | **95.807 ISK** | **85.397 ISK** |
| Konservative hypothetische Gesamtrechnung für dieselben konsumierten Lose | 65.554 ISK | 113.284 ISK | 130.521 ISK |
| **Zusätzliche hypothetische Verbraucherforderungen** | **19.212 ISK** | **17.477 ISK** | **45.124 ISK** |
| Bei isolierter Moment-Kasse nicht finanzierbare Stücke | **0** | **0** | **0** |
| **In kumulierter Schattenkasse bei fester Einkommensspur nicht finanzierbare Stücke** | **4** | **0** | **158** |
| Seeds mit mindestens einer Schatten-Nachfragelücke | **1/13** | **0/13** | **9/13** |
| Kumuliertes im echten Originalverlauf verdientes Haushaltseinkommen | 91.800 ISK | 192.704 ISK | 126.664 ISK |
| Im Schatten tatsächlich gezahlte hypothetische Mindestpreise | 65.378 ISK | 113.284 ISK | 121.021 ISK |
| Guthaben aller 13 **getrennten Schattenkassen** am Ende, summiert | 26.422 ISK | 79.420 ISK | 5.643 ISK |

**Die Beträge sind Summen aus unabhängigen Welten, nicht ein gemeinsames Konto oder ein durch Emission finanziertes Gesamtsystem.** Für die Veldra-Haushalte gehen in der kumulativen Schattenrechnung **158 von 2.784** im Original verfügbaren Stücke verloren; erste Fehlzahlungen in Seeds 1,2,11,42,99,1234,2026,98765,314159. In Seed42 beginnt der Engpass bei **Minute 2.760** (46. Spielstunde), obwohl der tatsächliche Originalhaushalt mit unverändert günstigerem Preis während derselben Zeit alle 216 verfügbaren Stücke finanziert. In Seed7 bleibt Veldra in 72h im Schatten kaufkräftig. Nadir hat nur bei Seed314159 ab Minute 3.960 einen kurzen Engpass von insgesamt vier Stücken. Bei Cyris finanziert der kumulierte, unter anderem von anderen Fabriklinien verdiente Original-Lohn alle angebotenen Stücke noch innerhalb von drei Tagen.

**Die Vorzeichen von tatsächlichen Source-Fabrikdefiziten ändern sich durch diese hypothetischen Haushaltszahlungen nicht automatisch.** Insbesondere Händler-Exportware wird im Original zur Zeit weiterhin mit dem niedrigen Marktpreis bezahlt. Eine größere lokale Haushaltszahlung **ohne** passgenauen Vorfinanzierungs- und Verteilungsvertrag finanziert nicht automatisch die verlustbringende Quellproduktion, Bergbau-/Frachtpiloten oder den Ersatz ihrer Schiffe.

## 3. Entscheidungsvorlage – Option einer einzigen konsistenten Regel, nicht implementiert

**[BESCHLOSSENE RANDGRENZEN]** Keine individuelle Insolvenzgarantie, keine grenzenlose Endkundennachfrage, keine neue ISK-Emission ohne gesonderte Freigabe, kein Vermögens-/Sparhöchstbetrag, keine Gratisware. Alles für NPC und Spieler gleich.

**[OPTION – Auftrag statt reflexhafter Preiserhöhung]** Eine einheitliche, atomar **vorfinanzierte Waren-/Leistungskette** als neues Gate zur getrennten Nutzerfreigabe:
1. **Nachfrage:** Ein Haushalt oder real zahlender Käufer darf genau die Menge bestellen, deren tatsächlicher Kaufpreis aus **vorhandenem Guthaben** reserviert werden kann. Ohne Nachfrage und Kasse keine garantierte Abnahme; eine Station kann bewusst Produktionsrisiko mit eigenem Kapital tragen, ohne Anspruch auf Subvention.
2. **Beschaffung/Fertigung:** Der Auftrag muss vor dem Start realistische, auditierbare Kosten für **wirklich zu erwerbendes Eis, echten Fabriklohn und vorgesehene Gebühren** decken bzw. aus gebundenem betrieblichem Eigenkapital finanziert werden. Keine kostenlosen Rohstoffe, keine Arbeiter ohne Geld, keine doppelt gebuchten Transfers. Für historischen Anfangsbestand historische Kosten gesondert abgrenzen, nie still fälschen.
3. **Transport:** Wirkliche Frachter-/Minerkosten, originaler stündlicher Flugvertrag, notwendige Reserve für **Schiffersatz** sowie echte Risiken müssen aus dem gleichen vorhandenen Vertragsbudget gedeckt werden. Die zusätzliche Schiffskapital-/Verlustprüfung ist **vor einer Implementierung noch offen** – der heutige Test zeigt ausdrücklich keine vollständige Profitabilität.
4. **Erfüllung/Endverbrauch:** Kaufbetrag wird nur gegen wirklich abgelieferte und einmalig konsumierte Ware abgebucht. Schon **real bezahlte importierte Nahrung** darf nicht allein durch die Klassifikation als Altware automatisch kostenlos konsumiert werden; bestehende historische Startware ist davon zu unterscheiden. Nicht gelieferte Leistungen geben bestehende Reserven nachprüfbar frei.
5. **Betriebswirtschaftliche Freiheit:** Ein Hersteller darf aus eigenen nachweislich vorhandenen Mitteln bewusst auf Lager produzieren und auch Verlust machen, ohne algorithmische Gratisrettung; andere Akteure sollen wirtschaftlich sinnvoll Lieferungen übernehmen können. **Keine Preis- und Nachfragegarantie.**

**[NICHT ENTSCHIEDEN]** Ob der Spieler Endpreise frei setzt, wie Aufträge vermittelt werden, welcher Schiffserhaltungsreservewert wirtschaftlich notwendig ist, wie alte Spielstände kostengerecht weitergeführt werden, und ob diese Kosten in existierenden Haushaltsbudgets einen funktionierenden stabilen Langzeitkreislauf bilden. Diese Fragen benötigen ein **kleines, weiteres B-K10o-Vertrags-/Kapitalgate** statt sofortiger Implementierung. Eine rein pauschale Produktionspreisuntergrenze hat aufgrund von Veldra keine Freigabeempfehlung.

## 4. Tests und Abnahme

**[TEST DIREKT BESTANDEN]** Drei neue B-K10n-Gruppen wurden aus dem aktuellen Branch-Testcode direkt gegen die Original-`index.html`-Kernfunktionen ausgeführt: (i) Seed42/7 autonom, (ii) Seed42-24h-Replay, (iii) 13 × 72h drei Hersteller plus Verbraucher-/Einkommens-Schattenkonten; stündliche Geld-/Waren-/Fabrikaudits, Save/Load/Hash, positiver Kassenbeweis und **kein Kredit** auch beim Scheitern. **GitHub-CI-Gesamterfolg wird erst nach tatsächlichem vollständigem Abschluss bezeichnet.**

Der Test ist rein entwicklungsseitig und bringt **keine Laufzeitpflicht**. Es gab keine 13 × 90d-Langzeit-/Spielerkrisen-/Schiffskapital-Tests und keine reale iPad-/NAS-Abnahme. [Ausführbarer Test](../tests/bk10n-kostenuntergrenze-haushaltskaufkraft.test.mjs).
