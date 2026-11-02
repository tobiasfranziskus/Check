
# B-K10m – Nahrungsproduktion in Cyris und Veldra: tatsächliche Rohstoff-/Lohnkosten und bezahlte Importe

**[ANALYSE/DRAFT · 02.11.2026]** [PR #130](https://github.com/tobiasfranziskus/Check/pull/130) auf #129 → #128 → #127 → #126 → #124 → #123 → #108. **[MAIN] `b4e604d6`** (v0.12.5 / Regel14 / Schema8) unverändert. Sämtliche Messungen stammen aus der **nicht integrierten R15-/Schema9-Analysewelt** mit `produktionslohnJeMinute=4`, tatsächlichen Original-Transportvertrags-/Produktionszahlungen und Haushalts-Neunahrungsmodell. Keine Änderung an Spielmechanik, `index.html`, Preisen, Löhnen, Fonds, Emissionen, Spielständen, Spieler-/NPC-Privilegien oder UI.

## Gegenprobe zu B-K10l

B-K10l belegte unter unveränderten Anfangslagern und voller NPC-Autonomie bei **Nadir** negative Rohstoff-/Lohn-Deckungsbeiträge für nachweisbar aus bezahltem Eis hergestellte Nahrung. Nun werden **Cyris und Veldra gemeinsam in denselben 13 Seed-Welten**, jeweils 72 Spielstunden, überprüft. **Keine Lagerbereinigung, keine angehaltenen NPC-Händler, keine Testgutschrift.** Originale Miner, Händler, Fighter/Piraten, andere Produktionslinien, Fonds und lokaler Haushaltsverbrauch sind aktiv.

Die Standorte unterscheiden sich systematisch: **Cyris** hat ein örtliches Eisfeld und erhält überwiegend vom NPC-Miner verkaufte Eislose, betreibt aber weitere Fabriklinien neben Nahrung. **Veldra** hat kein örtliches Eisfeld, benötigt Händlerimporte für neue Eisrohstoffe und betreibt auch eine Materiallinie. Die Ergebnisse zeigen, ob es wirtschaftlich sinnvolle alternative Nahrungslieferanten gibt, ohne dass einzelne NPCs künstlich gerettet werden.

## Buchungsmethodik und Testabdeckung

Der Test `tests/bk10m-cyris-veldra-autonommargen.test.mjs` instrumentiert ausschließlich im **Test** die bestehenden Core-Buchungsstellen:

1. Der ursprüngliche Eis- und Nahrungslagerbestand jeder Station ist als *historisch nicht bewertete Warenmenge* erfasst, **nicht** als kostenloser Einkauf.
2. **Wirkliche** Rohstofflieferungen an die Station werden mit Originalhandelspreis und tatsächlichem Geldabfluss aufgenommen, getrennt nach örtlichem Miner und Frachterhandel.
3. Beim originalen Nahrung-Produktionsstart werden genau zwei Eis-Lose der Test-FIFO entnommen. Die echte, finanzierte Arbeit kostet 6 Minuten × 4 ISK = **24 ISK je abgeschlossenem Los**. Die Test-FIFO berücksichtigt bereits laufende Fertigungen und andere parallele Produktionslinien; Nahrung wird nur nach wirklichem Abschluss eingebucht.
4. Der Original-Core verfolgt neu hergestellte und importierte Nahrung auch über Frachter. Die Testbuchung hält darum **getrennte Alt- und Neuware-FIFOs**. Bei Anlieferung wird die nach Original-Core vermerkte neue Provenienz übernommen; restliche importierte Nahrung ist Altware. Beim Handel verlässt nach den Original-Verbrauchsregeln zunächst Altware und anschließend Neuware das Lager.
5. Im Stundenverbrauch werden **Original-Altware ohne Haushaltszahlung** und **Neuware mit tatsächlich bezahlter Verbraucherrechnung** getrennt verbucht. Vollständig kostenbelegte eigene Nahrung erfordert **zwei zuvor wirklich gekaufte Eiseinheiten plus wirklich bezahlten Fertigungslohn**. Aus Ausgangs-Eis, Anfangsnahrung und anderen Stationen importierte Lebensmittel bleiben getrennt; unbekannte Istkosten werden nicht als null fingiert.
6. Die Original-Cash-Zahlungen für *importierte Altware* werden zusätzlich der tatsächlichen kostenlosen Haushaltsabgabe gegenübergestellt. Weitere Import-Neuware und eventuelle anschließende Haushaltszahlung bleiben davon unterscheidbar.
7. Alle 60 Simulationsminuten unabhängiger Geld-Audit (freie Konten + echte Vertragsreserven), Warenledger-Audit für alle Warentypen, Rohstoff-/Nahrungshistorien-Audit der beiden Stationen und Original-Core-Audit. Alle 1.440 Minuten zusätzlich Save/Load-/Hash; Seed42 zusätzlich ein exakter 24-Stunden-Replay.

**Testpopulation:** `1, 2, 7, 11, 13, 17, 42, 99, 1234, 2026, 65535, 98765, 314159`, jeweils **72 Spielstunden**. Das sind 13 **getrennte** komplette Simulationen, in deren **jeweils derselben** Welt Cyris und Veldra parallel ausgewertet wurden. Keine 26 unabhängigen Wirtschaftswelten und **keine** 13 × 90 Tage.

## Original-Core-Ergebnisse – 13 autonome 72h-Welten

| Kriterium, über 13 **getrennte** Welten aggregiert | Cyris | Veldra |
|---|---:|---:|
| Erfolgreich fertiggestellte Nahrung | 2.833 | 3.801 |
| Mit **real bezahlten** Rohstoffen hergestellte Nahrungslose | 2.334 | 3.281 |
| Insgesamt echt gekauftes Eis | 8.269 Stück | 7.311 Stück |
| Tatsächlich für sämtliches gekauftes Eis gezahlt | 103.074 ISK | 125.557 ISK |
| Davon originaler örtlicher Miner / Original-Händler | 7.849 / 420 Stück | **0 / 7.311 Stück** |
| Original importierte Nahrung aus anderen Stationen | 327 Stück | 114 Stück |
| **Vollständig rohstoff-/lohnbelegte, an Händler verkaufte eigene Nahrung** | **436 Stück** | **863 Stück** |
| **Betrieblicher Deckungsbeitrag der belegten Exportnahrung** | **−7.394 ISK** | **−21.890 ISK** |
| Seeds mit negativem belegtem Exportgesamtergebnis | **13/13** | **13/13** |
| **Vollständig rohstoff-/lohnbelegte eigene Nahrung im bezahlten lokalen Endverbrauch** | **1.828 Stück** | **2.073 Stück** |
| **Betrieblicher Deckungsbeitrag dieses lokalen Eigenverbrauchs** | **−6.792 ISK** | **−44.301 ISK** |
| Seeds mit negativem lokalem Aggregat | **12/13** | **13/13** |
| Echte Fonds→Station-Überweisungen über alle getrennten Welten | 354.269 ISK | 204.672 ISK |

Für Seed42 waren in Cyris 19 vollständig belegte Exportstücke mit **−293 ISK** und 162 lokale vollbelegte Stücke mit **−555 ISK** erfasst. In Veldra: 16 Exportstücke mit **−400 ISK**, 168 lokale Stücke mit **−3.617 ISK**. Seed7: Cyris 31 Exportstücke **−463 ISK**, 115 lokale **−42 ISK**; Veldra 81 Exportstücke **−2.153 ISK**, 165 lokale **−3.753 ISK**. **Seedabhängige Bestands-/Preisreaktionen sind ausdrücklich erhalten**; es wurde keine bestimmte Nahrungs-Frachtroute erzwungen.

**Wichtige Aussage:** An beiden Stationen, mit unterschiedlichen Rohstoffzugängen, sind die tatsächlich bei Verkauf oder lokalem Neuverbrauch erzielten Nahrungserlöse **in der überwiegenden Zahl der ausgewerteten Fälle geringer als die schon bezahlten Eis-Einkäufe und Fabriklöhne**. Weder positive Export-Deckung in einem einzigen Seed noch eine vollständig autonome profitable Ersatzversorgung ist damit belegt. Die Tabellen summieren **mehrere getrennte Weltläufe**; sie beschreiben nicht einen einzigen Nahrungsmarkt mit −30.000 ISK Verlust.

## Zusätzlicher Fehlerpfad: bezahlt importierte Alt-Nahrung ohne Erlös verbraucht

Das ursprüngliche Herkunftsmodell unterscheidet zwischen (a) Nahrung, die als **Altware** eingestuft ist und im lokalen Stundenverbrauch **ohne Haushaltszahlung** entfernt wird, und (b) nachweisbar neuer Nahrung, für deren Endverbrauch Haushalte wirklich ISK bezahlen. Das ist bei **bestehenden Startlagern** absichtlich eine beschränkte Regel15-Testlogik. B-K10m findet einen realen unerwünschten Folgefall: **Ein Händler verkauft als Altware eingestufte Nahrung an eine andere Station – die Zielstation bezahlt den Import vollständig, doch ihr Haushalt konsumiert die bereits bezahlte Ware später als Altbestand gratis.**

| Originale 13-Seed-Transaktionen, nicht erfundenes Geld | Cyris | Veldra |
|---|---:|---:|
| Importierte alte Nahrungseinheiten wirklich ohne Verbraucherzahlung konsumiert | **117** | **19** |
| Von der Zielstation **wirklich** dafür gezahlter ursprünglicher Ankaufspreis | **6.258 ISK** | **685 ISK** |
| Original-Haushaltserlös genau für diese gratis konsumierten Importe | **0 ISK** | **0 ISK** |
| Getrennt gezählte importierte Neuware mit späterer lokaler Haushaltszahlung | 126 Stück | 37 Stück |

Beispiel Seed42: Cyris bezahlte für **2** später gratis konsumierte Alt-Importstücke insgesamt **116 ISK**; Veldra für **6** Stück **216 ISK**. Seed7: Cyris **13 Stück / 653 ISK**, Veldra **6 Stück / 192 ISK**. Das sind tatsächlich an Lieferanten geflossene ISK, **keine Geldvernichtung oder neues Geld**. Sie belasten die Stationsliquidität ohne direkt zugehörige Haushalts-Einnahme. Das ist ein **separater Engpass** neben unprofitabler Herstellung. Die Testjournalisierung ermittelt den vorangegangenen Original-Ankaufspreis je importierter Einheit; Ware, die nur noch im Lager liegt oder weiterverkauft wurde, ist **nicht** in den gratis verzehrten Mengen enthalten.

**Abgrenzung:** Daraus folgt noch keine generelle sofortige Nachverrechnung historischer Startbestände; deren Herkunfts-/Kostenpflicht ist eine eigene Produktentscheidung. Ebenso wäre eine Übernahme des bisherigen unbezahlten Verbrauchs in eine kostenpflichtige Haushaltsregel ohne Prüfung der tatsächlich vorhandenen Haushaltskaufkraft wirtschaftlich riskant. **Keine Doppelbelastung** nach bezahltem Endverbrauch und keine unbegründete Einführung individueller Insolvenzrettungen.

## Qualitätsstatus, Entscheidungen und nächster Schritt

**[TEST DIREKT BESTANDEN]** Drei neue Prüfungen wurden tatsächlich direkt gegen den unveränderten Original-Core ausgeführt: Seed42/7 je 72 Stunden, Seed42 24h deterministischer Replay sowie 13 × 72 Stunden in derselben unveränderten autonomen Wirtschaft mit zwei nebeneinander laufenden Kosten-FIFOs. Stündliche unabhängige Geld-/Waren-/FIFO-/Original-Core-Audits, tägliche Save/Load-/Hashes und explizite Absicherung gegen falsch als neu klassifizierte Alt-Importe. **GitHub-CI-Gesamtlauf ist separat bis zur vollständigen Fertigmeldung zu prüfen.** Keine reale iPad-/NAS-Abnahme.

**[MAIN]** bleibt unberührt. Keine Produktregeländerung, kein Preis-/Lohn-/Fonds-/Emissionsbeschluss, kein Merge, keine stille Save-Migration.

**[OPTION: nächstes Gate B-K10n]** Eine **einheitliche für NPC und Spieler geltende** Endabnahme- und Beschaffungsregel im tatsächlichen Kostenrahmen durchrechnen. Dabei müssen die bereits tatsächlich bezahlten Eis-/Fabrik-/Frachterkosten, die unverändert finanzierten Haushalte, notwendiger Schiffs-/Fabrikersatz und die Sonderbehandlung **echter Anfangsware vs. neu bezahlter Import-Altware** explizit getrennt werden. Vor jeder Umsetzung erst den zusätzlichen Kaufkraftbedarf und mögliche neue Versorgungsblockaden testen, keine mechanische Preiserhöhung, kein allgemeiner Zuschuss, kein Sparlimit, keine individuellen Garantien und keine neuen ISK ohne gesonderte Entscheidung.
