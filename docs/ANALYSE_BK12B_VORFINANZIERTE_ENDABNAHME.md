# B-K12b – Vorab gebundener Endauftrag, aber kein dauerhaft nachgewiesenes Käuferbudget

**[ANALYSE/DRAFT · 03.11.2026]** [PR #157](https://github.com/tobiasfranziskus/Check/pull/157), auf [#156 B-K12a](https://github.com/tobiasfranziskus/Check/pull/156), davor [#155 B-K12](https://github.com/tobiasfranziskus/Check/pull/155), gestapelt. **[MAIN]** `b4e604d6`, Regel14/Schema8 unverändert. Testwelt ist die isolierte historische R15-/Schema9-Fixture mit **unbeschlossenem Lohn 4 ISK/Minute**. Kein produktiver Endabnahmekern, keine Änderung an `index.html`, Original-Fixture, Startpreisen, Fondsregeln, zusätzlichen Emissionen, Save-Regeln oder freigegebenen Produktmechaniken.

## Prüfziel und Grenze

B-K12a hat eine ex-post volle Kostendeckung für schon konsumierte Ware erreicht, aber nicht die Dauerfinanzierung des Endkäufers. B-K12b trennt erstmals testseitig:
1. **Vertrag zuerst:** Der reale lokale Systemfonds sperrt vorhandene ISK über den Original-R15-Vertragskern, bevor Rohware gekauft oder Produktion begonnen wird.
2. **Leistung und Herkunft:** Der Auftrag deckt exakt 2 frisch beim Miner tatsächlich bezahlte Einheiten Eis und höchstens 1 daraus fertiggestellte und wirklich konsumierte Nahrungseinheit; Vorprodukt, Fabriklohn und Verbrauch bleiben im echten deterministischen Core.
3. **Zahlung erst nach Erfolg:** Die Station erhält bei belegtem Endverbrauch **genau die tatsächlichen FIFO-Kosten** aus dem vorher gesperrten Core-Escrow. Der unverbrauchte Rest geht an den echten Käufer zurück. Keine Zahlung für bloßen Lagerbestand.
4. **Neues Käuferbudget:** Von echtem vorhandenen Anfangsvermögen strikt unterscheiden, was der Käufer durch Original-Handelsgebühren bzw. tatsächlich bezahlte Betriebskosten neu einnimmt. Die Kosten bereits abgeschlossener Folgeaufträge werden abgezogen, bevor weitere Mittel als gedeckt gelten.

Die Gegenwelt entfernt nur die **ursprünglichen Nadir-Bestände** an Eis und Nahrung einschließlich zugehörigem Anfangs-Warenledger, hält konkurrierende Original-NPC-Handelsfrachter an und deaktiviert nur die schon für B-K12 verwendeten individuellen Gratis-Hüllenzuschüsse. Die vorhandenen originalen übrigen Handels-/Förder-/Produktions-/Kampf-/Geldregeln laufen. Kein künstlicher Rohstoff, kein fingierter Leistungsbeleg, keine neue ISK-Ausgabe.

**Beleg Erstauftrag (beide Seeds):** Systemfonds Nadir hat anfangs **1.000 ISK**. Tick 0 werden **128 ISK** gesperrt. Erst Tick 100 erfolgt der ursprüngliche tatsächliche Kauf von **2 Eis × 22 = 44 ISK** beim Miner und der Start der sechsminütigen Nahrungslinie. Tick 106 wird das wirkliche historische Arbeitsentgelt von **24 ISK** bezahlt und die Einheit fertig. Tick 120 konsumiert der Endabnehmer reale neue Nahrung; **68 ISK** werden aus dem bestehenden Vertrag an die Station ausgezahlt, **60 ISK** an den Fonds erstattet. Einmalige Belegkennung, Zeitfolge und tatsächliche Chargenkosten werden im Test behauptet und geprüft. Die zusätzlichen 60 ISK sind ein bloßer vorübergehend gebundener Sicherheitspuffer, **keine Kosten oder staatliche Ausgabe**. Die normale Nadir-Marktpreisstatistik (in dieser kleinen Gegenwelt beim ersten Konsum 54 ISK) ist **nicht** der tatsächliche Käuferzahlungsbeleg; der Vertragsbeleg über 68 ISK ist maßgeblich.

**Nicht vorfinanziert:** Die Station kauft Rohstoffe und bezahlt ihre Lohnreserve weiterhin aus **eigenem Betriebsvermögen**. Der Endauftrag sichert den Abnahmeerlös, ersetzt aber **keine** vom Käufer vorgeschossene Rohstoff-/Lohnzahlung. Die testseitig beschränkte Mini-Beschaffung ist **keine** generelle Marktroute, vollständige Industrie-, Schiffsersatz-, Risiko- oder Frachter-Finanzierung.

## Drei Käuferbudgets im identischen Mini-Kreislauf

- **`stock` – volle vorhandene Fondskasse:** Folgeverträge dürfen aus allen wirklich frei verfügbaren ISK finanziert werden, also auch aus alten Anfangsbeständen. Das ist ein realer Zahlungsversuch, **kein** Nachweis eines dauerhaften Verdienstmodells.
- **`earned-only` – nur neu erhaltene Handelsgebühren:** Nach dem ersten Vertrag darf nur auf echt gebuchte neue Originalgebühren zurückgegriffen werden; die reservierbare Summe muss beim Vertragsschluss 128 ISK decken. Selbst die wirklichen Erststückkosten von 68 ISK übersteigen die bis dahin beobachteten **13 ISK** Gebühren. Keine erfundenen Zuflüsse.
- **`earned-all` – auch bezahlt erbrachte Betriebsleistungen:** Für Folgeverträge gelten positive echte Fondsbuchungen aus `foerderung` (Handelsgebühren) und `betriebskosten` (real gezahlte Betriebsleistung) als verfügbare Einnahmen, **abzüglich aller schon bezahlten Folgechargen**. Alle Transfer-Gegenbuchungen sind durch Original-Core-Kassen gedeckt. Ob die zahlenden Miner ihre Leistungen auf Dauer finanzieren können, ist damit noch nicht bewiesen.

**[TEST] Gezielt ausgeführt:** [B-K12b-CI #41693650546](https://github.com/tobiasfranziskus/Check/actions/runs/41693650546), Analyse-Commit `6f90605b`, **2/2 Tests erfolgreich**, null Fehler/Skip. Seeds 42 und 7 jeweils über 24 Stunden (`stock`) und 7 Tage (je drei Käuferregime), insgesamt acht kontrollierte Läufe. Je Stunde Geld-, Waren- und Nahrungsherkunftsaudit, echter Vertragsstatus und tatsächliche Endverbrauchsbelege, dazu je Tag Core-Save/Load-Hash; nur Core-originale Buchungen und Test-Escrow, keine weitere Emission. Die unten angegebenen Resultate gelten für den konkreten Analyse-Head, nicht für `main`.

| Kennzahl nach 7 Tagen | Seed 42: Bestand | Seed 42: nur Gebühren | Seed 42: alle belegten Leistungen | Seed 7: Bestand | Seed 7: nur Gebühren | Seed 7: alle belegten Leistungen |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Wirklich gelieferte/abgerechnete Nahrung | **23** | **1** | **8** | **30** | **1** | **15** |
| Tatsächlich bezahlte FIFO-Kosten (ISK) | 1.564 | 68 | 544 | 2.040 | 68 | 1.020 |
| Neue Gebührenerträge des Fonds (ISK) | 35 | 13 | 20 | 42 | 13 | 27 |
| Neue Gebühren + Original-Betriebsleistung (ISK) | **682** | 550 | **592** | **1.121** | 947 | **1.031** |
| Frei verfügbare Fonds-ISK am Ende | **118** | 1.482 | 1.048 | **81** | 1.879 | 1.011 |
| Nahrungsmangelstunden von 168 | 168 | 168 | 168 | 168 | 168 | 168 |
| Resultierender Testhash | `a1001b69ad6d11af` | `c23c0afd71039d70` | `cc0c5f7714a90433` | `4bfab4527db048c9` | `b58c1626e1a499bd` | `0d71f7793b28e591` |

Der volle Fondsarm Seed42 zeigt die unabhängige Geldidentität **1.000 Anfangs-ISK + 647 originale Betriebskosteneingänge + 35 Gebühren − 1.564 tatsächlich gezahlte Endabnahme = 118 freie ISK**. Seed7: **1.000 + 1.079 + 42 − 2.040 = 81 ISK**. Genau diese Endkassen stehen tatsächlich in den geprüften Core-Zuständen. Die Reserve ist in diesem Mikromodell nach Vertragsschluss nur gesperrt, **nicht neu geschaffen**.

**Zeitliche Herkunft ist der entscheidende negative Befund:** Bei Seed42 fallen die belegten Fonds-Einnahmen nur am **ersten** Tag an. Bei Seed7 stammen 1.079 ISK Original-Betriebskosten-/Gebühreneingänge aus Tag1 und noch 42 ISK aus Tag2; danach gibt es keine solchen neuen Netto-Einnahmen bis Tag7. Der enger finanzierte `earned-all`-Arm beweist deshalb durchaus **8 bzw. 15 erneut finanzierte Aufträge aus tatsächlich vorher empfangenen Leistungszahlungen**, aber **keinen dauerhaften, aus neuen Verkäufen reproduzierten Käuferhaushalt**. Die Transfers aus Betriebskosten können insbesondere aus früherem NPC-Vermögen bezahlt sein; sie sind nicht ohne zusätzliche Herkunftsprüfung als wiederkehrender Netto-Gewinn anzusehen.

**Wichtige Versorgungseinschränkung:** Dieser Versuch erlaubt **maximal eine neue Nahrungseinheit pro Auftrag/Stunde**, während Nadir im Original **zwei Nahrungseinheiten pro Stunde** benötigt. Daher sind selbst bei 23/30 echten Käufen in sämtlichen Armen alle 168 Stunden als teilweise mangelhaft markiert. Das belegt **keine** ausreichende Versorgungskapazität, und 168 Mangelstunden dürfen nicht allein einer Geldlücke zugerechnet werden. Zugleich belegt keine der neuen Varianten die Finanzierung von Ferntransport, Sicherheitsdiensten und Ersatzhüllen. Das bereits bekannte Preis-/Transportproblem aus #155 bleibt separat offen.

## Qualitätssicherung, Schluss und Entscheidung

- Core-Vertragskette `reservieren → bezahlen → abschliessen`: jeder Beleg hat echten Käufer, reale Mittel, beobachtete Rohstoffherkunft, originale Lohnzahlung und realen Endverbrauch. Erst danach Zahlung und Erstattung.
- Alle Ersteinheiten und deren FIFO-Kosten werden jeweils mit den echten Input- und Lohnbelegen gegengeprüft. Unbelegte Rohstoff-Vorratskäufe ohne offenen Auftrag werden im Analysefall gestoppt; andere Stationen verwenden weiterhin den normalen Haushaltsgeldtransfer.
- Stündliche unabhängige Geld-/Waren-/Herkunftsaudits, regelmäßiger Original-Core-Audit und täglicher Save/Load-Zustands-Hash; kein Regel- oder Schemazähler hochgesetzt, keine persistente Produktmigration.
- **[NEGATIV]** Der Vorab-Escrow beseitigt das Doppelausgeben des Käuferbudgets und deckt die ausgelieferte einzelne Ware, aber er erzeugt **keine neue Nachfrage**. Auch nach Einbeziehung wirklich bezahlter Betriebsleistungen wird kein wiederkehrender externer Einnahmestrom nach Tag1/2 nachgewiesen.
- **[NICHT GETESTET]** Keine volle R15-Welt mit aktiven Frachtern, kein 13×90d-Weltgate, keine alternativen Lohn-/Preis-/Emissionsregeln, keine reale iPad-/NAS-Abnahme. Die historische Fixture ist keine nach `main` zu übertragende Produktregel.

**Empfehlung [ANALYSE/OPTION]:** **Nicht** integrieren. Das nächste Teilziel ist ein zahlungsfähiger, wiederkehrend **von Dritten für eigene reale Leistungen** entlohnter Käufer (z. B. ein belegter Absatz-/Servicevertrag mit unabhängigem Auftraggeber), mit zwei und mehr ökonomisch vollständig abgeschlossenen Produktions-/Abnahmezyklen und positiver Netto-Reproduzierbarkeit von Käuferliquidität. Einnahmen dürfen nicht aus demselben Escrow, ungedeckter Arbeit, gratis Ausfallzahlung oder einer nur einmal vorhandenen Fondsreserve stammen. Ein neuer Dienstleistungsmarkt, eine Lohn-/Preisregel oder Emission wären **neue Produktentscheidungen** und sind hier nicht freigegeben.

**Integrationsgrenze:** [MAIN] bleibt bei Regel14/Schema8; [DRAFT] #155–#157 nicht mergen, keine Produkt- oder Spielstandänderung. Die technische Testmethode kann als Analysegrundlage dienen, nicht als automatisch freigegebener Mechanismus.
