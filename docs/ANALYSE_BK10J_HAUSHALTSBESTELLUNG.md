# B-K10j – Haushalt bestellt vor, statt die Station auf Kredit kaufen zu lassen

**[ANALYSE/DRAFT · 02.11.2026]** [Draft #127](https://github.com/tobiasfranziskus/Check/pull/127), auf #126 → #124 → #123 → #108 gestapelt. **[MAIN]** `b4e604d6` (v0.12.5 / Regel14 / Schema8) unverändert. In der produktiven Datei `index.html` **keine Änderung**. R15/Schema9 bleibt ein **nicht integrierter Kandidat**. Die direkt zum Verbraucher abgerechnete Bestellung ist **ausschließlich eine explizite Test-Gegenhypothese**, weder ein bereits vorhandener Produktmechanismus noch eine genehmigte Produktregel. Kein zusätzlicher Geldzufluss, keine kostenlosen Waren, kein neuer Preis, kein automatischer Spieler-/NPC-Bailout.

## Warum dieser Versuch

[B-K10i #126](https://github.com/tobiasfranziskus/Check/pull/126) hat in original aktiven Seed42-/7-Testwelten belegt, dass nach 72 Spielstunden Alderas **Haushalte 17.325/16.522 ISK** besitzen, aber Alderas Station nur **203/716 ISK**. Zum damaligen Nahrungsmarktpreis könnten Verbraucher rechnerisch viele Einheiten bezahlen, während die Original-Core-Funktion `aufnehmbar` den **Stationsankauf auf 3/13 Stück** begrenzt. Umgekehrt hat Orion nach Seed42 13 Neu-Nahrungseinheiten im Lager, aber der Haushalt mit 44 ISK bei 46 ISK Preis nicht genug Kaufkraft. Mehr Angebot hilft Orion nicht automatisch.

B-K10j fragt: Können **vorhandene, vorab wirklich gesperrte Verbraucher-ISK** den Zwischenhandelsengpass bei einer **physisch echten** Nahrungsfahrt überbrücken? Außerdem: Decken die echten Erlöse auch **Flug- und Handelskosten**, und wird Nahrung wirklich verbraucht, statt nur dem Stationslager hinzugefügt?

## Vergleichsmethodik

1. **Originalwelt bis Tag3:** Seed42 und Seed7 laufen jeweils 4.320 originale Ticks mit allen autonomen NPC-Händlern, Minern, Jägern, Piraten, tatsächlicher Produktion, Fonds-Mindestauffüllung und **unveränderten Startlagern**. Geld-, Waren-, Vertrags- und Herkunftsaudits. Der Weltstand wird tatsächlich mit Core-`save`/`load` samt Hashgleichheit gesichert.
2. **Identischer Stichtag in beiden Armen:** Aus exakt diesem gespeicherten Spielstand werden zwei getrennte Vergleichsvarianten abgeleitet. **Erst nach Tag3** halten testweise in beiden Armen die autonomen NPC-Händler neue Aufträge an, damit sie nicht zwischen Bestellung und Ankunft den Nadir-Vorrat wegkaufen. Alle übrigen ursprünglichen Produktions-, Haushalts-, Markt-, Sicherheits- und Geldregeln laufen weiter. Dieses methodische Halten darf **nicht** als autonome langfristige Wirtschaft gewertet werden.
3. **Echte physische Fahrt:** Ein **existierender Spielerfrachter** (nicht neu erzeugt und kein Gratisersatz) fliegt über den Original-Core `shipMove` tatsächlich **60 Minuten Aldera→Nadir**, kauft `24/22` **wirklich neue** und vorhandene Nahrungseinheiten über den ursprünglichen `shipTrade`, und fliegt **60 Minuten Nadir→Aldera**. Beiden Varianten werden dieselben Anfangswaren, denselben Originalpreis, Original-Kaufgebühr, Originalreisevertrag und **499 ISK wirklich ausbezahlte Flugkosten** in Rechnung gestellt.
4. **A – Original-Stationsankauf:** Der Original-Core entlädt bei Ankunft nach `aufnehmbar` nur so viel Nahrung, wie die **Stationskasse** und Lagerkapazität tatsächlich erlauben. Haushalte kaufen danach im bestehenden Stundenverbrauch echte Nahrung aus dem Stationslager.
5. **B – hypothetische direkte Haushaltsbestellung:** Vor Warenkauf wird `menge × Aldera-Angebotspreis` von der **vorhandenen** Haushaltskasse über den bereits bestehenden echten `m_core_vertrag.reservieren` in einen gespeicherten, geldbilanzierten Vertrag gebunden. Bei physischer Ankunft bleibt **nur im Test** die passende Fracht auf dem Schiff. Im ursprünglichen Stundenverbrauch wird je Stunde **höchstens der wirkliche Bedarf von 3 Einheiten** aus genau dieser nachgewiesenen Neuware entnommen und gegen `m_core_vertrag.bezahlen` an den Schiffseigentümer aus dem Reservegeld gezahlt. Die wirklich konsumierten Einheiten werden gleichzeitig aus Schiffs- und Neuherkunftstransit entfernt, bei `ledger.nahrung.consumed`, bezahltem Neuverbrauch und Haushaltskosten genau **einmal** erfasst. Die Original-Stundenroutine bekommt entsprechend um genau die bereits direkt konsumierten Einheiten reduzierten verbleibenden Bedarf. Auch die Zielmarktgebühr wird **aus echten Händler-ISK** an den vorhandenen Systemfonds gezahlt. Nicht erfülltes Restbudget wird über Original-`abschliessen` erstattet; kein stilles Geld oder Vorratsgeschenk.
6. Der Vergleich läuft anschließend noch **zehn Spielstunden** je Arm. Unabhängiger Geld-/Warenaudit, Original-Core-Audit, Neu-Nahrungshistorien- und Save/Load-/Hash-Prüfung, jeweils die tatsächlichen Original-Kauf-, Zielverkaufs-, Gebühren- und Flugbelege sowie der tatsächliche Händlercash. Zusätzlich Seed42-Determinismus-Replay.

**Test-only Grenzen:** Diese B-Variante schreibt zur direkten Endabnahme die Waren- und Herkunfts- und Haushaltbuchungen **bewusst außerhalb einer schon existierenden Produkttransaktion**, weil es **keinen produktiven Direktkauf-Befehl** gibt. Das ist die **Hypothese**, deren Bilanzwirksamkeit geprüft wird – nicht die Behauptung, dass das Originalspiel den Vorgang bereits so beherrscht. Die Lieferung wird nicht vorschnell auf einmal konsumiert, sondern höchstens in stündlichen Bedarfsportionen. Das Versuchsmodell braucht später gesonderte Spezifikation von Vertragslebenszyklus, Ausfall-/Piratenverlust, Preisbindung und Spielersymmetrie.

## Direkt ausgeführter Testbefund (GitHub-CI gesondert zu bestätigen)

| Core-Tatsachenzahlung und Warenfluss | Seed42 Station A | Seed42 Bestellung B | Seed7 Station A | Seed7 Bestellung B |
|---|---:|---:|---:|---:|
| Reale Quellmenge Nadir | 24 | 24 | 22 | 22 |
| Tatsächlicher Warenkauf | 600 ISK | 600 ISK | 704 ISK | 704 ISK |
| Tatsächliche Quellgebühr | 24 ISK | 24 ISK | 28 ISK | 28 ISK |
| Bezahlte Fahrten in beiden Richtungen | 499 ISK | 499 ISK | 499 ISK | 499 ISK |
| **Tatsächlicher Stationsverkauf** | **8 Stk/432 ISK** | 0 | **11 Stk/594 ISK** | 0 |
| **Test-only direkte Haushaltsabnahme** | 0 | **24 Stk/1.272 ISK** | 0 | **22 Stk/1.188 ISK** |
| Tatsächlich gezahlte Ziel-/Direktgebühr | 17 ISK | 48 ISK | 23 ISK | 44 ISK |
| **Händler-Liquiditätssaldo der Fahrt und Folgezeit** | **−708 ISK** | **+101 ISK** | **−660 ISK** | **−87 ISK** |
| Nach 10h bezahlte, unverkaufte Frachterladung | **16 Stück** | **0** | **11 Stück** | **0** |

**Kontrollrechnungen:** Seed42 Bestellung `1.272−600−24−499−48 = +101 ISK`; Seed7 Bestellung `1.188−704−28−499−44 = −87 ISK`. Originalstation Seed42 `432−600−24−499−17=−708 ISK`; Seed7 `594−704−28−499−23=−660 ISK`. **Negative Händler-Cashflows bei Restfracht sind nicht dasselbe wie endgültiger Vermögensverlust:** Restwaren behalten potenziellen, aber unsicheren Wiederverkaufswert. Die Seed42-Bestellrendite ist vor Eisförderung, Produktion, Schiffskapital, Hüllenverschleiß und Piratenrisiko berechnet und **kein wirtschaftlicher Dauererfolg**.

Im Vergleich werden Original-Stationsankäufe und Haushaltsendverbrauch unterschieden. Die Station konnte in Seed42 nur **8** Einheiten kaufen und in den nachfolgenden zehn Stunden **5** neue Nahrungs-Einheiten konsumieren (Vorher-/Nachher-Statistik wird durch den Ankunfts-Stundentick um **weitere Buchungen** beeinflusst). Die direkte Bestellung leitet dagegen nachweisbar **24** Einheiten aus der tatsächlichen Schiffs-Neuherkunft in **einmalig bezahlten Endverbrauch**. Bei Seed7 verkauft die Station **11**, während im folgenden Zehn-Stunden-Fenster **8** originale Neu-Einheiten verbraucht werden; der bestellte Auftrag liefert und verbraucht **22** tatsächlich neue Einheiten. Zahlen der Stundenfenster sind kumulierte Original-Verbrauchsstatistik; nicht jede Original-Haushaltskonsum-Einheit kann ohne weitere Chargenmarkierung einer genau bestimmten importierten Lieferung zugeordnet werden.

## Entscheidung und offene Prüfungen

**[ANALYSE POSITIV FÜR A-KAUFKRAFT-GATE]** In den beiden Sonderwelten kann **bereits existierende Verbraucher-Kaufkraft** eine echte Nahrungszustellung auslösen, auch wenn der Marktzwischenhändler nur 8/11 Einheiten vorfinanzieren würde. Die direkte Bestellung verhindert so **16/11** Einheiten zunächst unverkaufter Import-Fracht; sie macht den Frachter **nicht** immer profitabel. Eine allgemeine Nachfrage-, Lohn-, Emissions- oder Preisreform ist hieraus **nicht beschlossen**.

**[NÄCHSTES GATE]** Die Option ist nur dann entscheidungsreif, wenn auch Preissignal, teilweiser Bedarf/Überschuss, Verlust vor Ankunft, Rückzahlung noch nicht konsumierter Reserven, mehrfache oder konkurrierende Kaufaufträge, Schiffseigentümer-/NPC-/Spieler-Parität sowie dauerhaftes Kapital und reale Produktions-/Hüllenkosten unabhängig getestet wurden. Ein Produktentscheid zu dieser gesamten Mechanik wäre ein **gesonderter Freigabeschritt**; kleine Simulationen ersetzen weder 13 Seeds ×90 Tage noch echte iPad-/NAS-Abnahme. [Testfile](../tests/bk10j-vorfinanzierte-haushaltsbestellung.test.mjs).

**Kein Merge, keine Produktregeländerung, keine neue ISK-Emission.**
