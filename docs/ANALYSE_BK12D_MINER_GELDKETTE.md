# B-K12d – Miner werden bezahlt; die Endabnahme scheitert an räumlich gebundenem Käuferbudget

**[ANALYSE/DRAFT · 03.11.2026]** [PR #159](https://github.com/tobiasfranziskus/Check/pull/159), auf [B-K12c #158](https://github.com/tobiasfranziskus/Check/pull/158), davor #157/#156/#155. **[MAIN] `b4e604d6`, v0.12.5 / Regel14 / Schema8 unverändert.** Alle Ergebnisse aus der ausschließlich historischen **R15/Schema9-Testwelt** mit nicht freigegebenen **4 ISK pro Produktionsminute**; keine Änderungen an `index.html`, Original-Core-Fixture, Preisen, Löhnen, Fonds-/Emissionsregeln, Spielständen oder Veröffentlichung.

## Fragestellung

B-K12c hat nachgewiesen, dass die ursprünglichen 24 ISK Nadir-Produktionslohn pro Einheit in wirklichen Endverbrauch zurückfließen können. Dadurch bezahlt der Fonds nur die tatsächlichen 44 ISK Eiskosten einer Nahrungseinheit statt zuvor der gesamten FIFO-Kosten von 68 ISK. Trotzdem endet nach 38 bzw. 48 Abnahmen die Finanzierung. B-K12d fragt deshalb getrennt:

1. Haben **die wirklich liefernden Nadir-Eis-Miner** ausreichendes Geld, erzielen sie echte Verkaufserlöse und bezahlen tatsächlich alle fälligen Betriebskosten?
2. Wer bezahlt **jede Gutschrift** an den Nadir-Fonds: aktive Miner, andere NPC-Schiffe oder bloß unkontrollierte automatische Stützungen?
3. Weshalb endet die wiederholte Endabnahme, obwohl Eis, Produktionsbetrieb und Weltgeld weiterhin existieren?

Unverändert derselbe strenge Nadir-Mikroaufbau wie in B-K12c: vorhandene Anfangsbestände von Eis/Nahrung samt ursprünglichem Lager-Ledger entfernt, konkurrierende NPC-Handelsfrachter gehalten, alte individuelle Hüllenzuschüsse deaktiviert, übrige tatsächliche Core-Regeln/Schiffe aktiv. Der Test ändert **keine Preise oder Mechanik**. Quelle sind die ursprünglichen Core-Phasen `foerderung`, `betriebskosten`, `ersatzkauf`, `npcAusgaben` sowie echte Handels- und Kostenbelege. Bei allen Simulationsstunden bleiben unabhängig geprüfte Geld-/Waren-/Herkunftsaudits und bei allen Tagen Save/Load-/Hash-Gates bestehen.

## 1. [TEST] Tatsächlicher Eislieferant und seine Finanzierung

Die einzige Nadir-Eisquelle in beiden isolierten Welten ist **Miner `sh009` im Konzern `npc3`**. Er liefert tatsächlich jeweils zwei Eis pro von Nadir neu produzierter und vollständig bezahlter Nahrungseinheit. Der Originalmarktpreis bei diesen 38/48 Verkäufen beträgt **22 ISK pro Eis**; der tatsächliche Miner erhält pro Lieferung **44 ISK brutto**. Die originale Handelsgebühr beträgt **1 ISK** pro Zweierlieferung und fließt an `fonds_nadir`.

| Tatsächlich abgerechnete Größe, 7 Tage | Seed42 | Seed7 |
|---|---:|---:|
| Wirklich gelieferte Nahrungseinheiten (B-K12c) | 38 | 48 |
| Nadir-Eislieferungen des `sh009` | 38 × 2 Eis | 48 × 2 Eis |
| Miner-**Bruttoerlös** aus diesem Eis | 1.672 ISK | 2.112 ISK |
| Davon Handelsgebühren an den Fonds | 38 ISK | 48 ISK |
| `sh009`-Betriebskosten **fällig** | **440 ISK** | **490 ISK** |
| `sh009`-Betriebskosten **wirklich bezahlt** | **440 ISK** | **490 ISK** |
| **Ungedeckte `sh009`-Arbeit** | **0 ISK** | **0 ISK** |
| NPC3-Verfügungsvermögen zu Beginn | 2.000 ISK | 2.000 ISK |
| NPC3-Verfügungsvermögen an Tag7 | **5.249 ISK** | **3.411 ISK** |
| Fonds-Nadir-Cash an Tag7 | **100 ISK** | **117 ISK** |
| Nadir-Stationscash an Tag7 | **3.688 ISK** | **3.688 ISK** |
| Schiff `sh009` an Tag7 | Förderauftrag aktiv, **100 Eis an Bord** | Förderauftrag aktiv, **100 Eis an Bord** |

**Abgrenzung:** Der historische Kern kann bei allgemeiner NPC-Mittellosigkeit Betriebskosten nur teilweise bezahlen und die Arbeit dennoch entstehen lassen. **Dieser potenzielle Defekt ist im hier beobachteten Nadir-Miner aber nicht aktiv:** Seine wirklich fälligen **440/490 ISK** sind komplett bezahlt. Eine Diagnose „Minerinsolvenz“ oder „ungedeckte Minerarbeit verursacht diesen Stopp“ ist für die konkret geprüften Gegenwelten **widerlegt**.

NPC3s Endvermögen ist das **Gesamtvermögen des Eigentümers**, nicht nur Gewinn des einen Miners. Dessen vollständige originale Konto-Phasenidentität lautet:
- Seed42: **2.000 + 13.657 (gesamte Förderung) − 5.882 (alle NPC3-Betriebskosten) − 1.497 (Ersatzkäufe) − 3.029 (NPC-Ausgaben) = 5.249 ISK.**
- Seed7: **2.000 + 14.988 − 7.659 − 4.491 − 1.427 = 3.411 ISK.**

Dies sind **echte Core-Buchungen** und keine pauschale Subvention. Die Gesamt-Phasenförderung enthält natürlich auch andere NPC3-Schiffe und Waren; aus ihr darf **nicht** ein fiktiver Gewinn von `sh009` allein abgeleitet werden.

## 2. [TEST] Woher kommen die Fonds-Einnahmen?

Die zweite unabhängige Geldkette prüft jede originale Nadir-Fondsgutschrift aus Schiffsbetriebskosten gegen **einen real zahlenden Schiffseigentümer**. Sämtliche tatsächlichen Betriebszahlungen an den Fonds stammen hier von **npc3**. Andere Systeme und allgemeine NPC3-Gewinne werden nicht als Nadir-Fonds-Cash erfunden.

| Ursprünglicher Nadir-Fondszufluss | Seed42, sieben Tage | Seed7, sieben Tage |
|---|---:|---:|
| Alle tatsächlich bezahlten Nadir-Schiffskosten → Fonds | **722 ISK** | **1.169 ISK** |
| Davon eigens `sh009` bezahlt | 440 ISK | 490 ISK |
| Davon andere NPC3-Schiffskosten an Nadir-Fonds | 282 ISK | 679 ISK |
| Tatsächlich vereinnahmte Handelsgebühren (alle Schiffe) | 50 ISK | 60 ISK |
| **Gesamte echte Nadir-Fonds-Leistungseinnahmen** | **772 ISK** | **1.229 ISK** |

Diese realen Beträge sind ausschließlich Geldtransfers **aus bestehenden Eigentümerkassen**; sie erzeugen keine ISK. Sie sind außerdem keine Garantie auf neue Aufträge: Ist die Rohstofflieferung beendet und die Fracht voll, entstehen beim stillstehenden Miner auch keine neuen Förderarbeit-Betriebskosten.

## 3. [TEST] Exakte Grenztransaktion: 38 ISK pro weiterer Einheit verlassen den Käuferfonds

Nach der anfänglichen Förderphase ergibt die **echte, wiederholte Zweier-Eis-Lieferung am zweiten Tag** für Seed42 und Seed7 denselben messbaren Grenzfall:

| ISK-Fluss je bezahlter Nahrungscharge am zweiten Tag | Fonds | NPC3 / `sh009` |
|---|---:|---:|
| Geld aus reserviertem Endauftrag für den echten Rohstoffaufwand | **−44** | **+44 brutto** |
| Original-Schiffsbetriebskosten: 5 ISK aus `npc3` an Fonds | +5 | −5 |
| Original-Handelsgebühr für den Eisverkauf | +1 | −1 |
| **Netto dieser lokalen Dreierkette** | **−38 ISK** | **+38 ISK** |

Der Haushalt bezahlt daneben seine **24 ISK wirklichen Produktionslohn** wieder an die Station, und die Station bezahlt damit ihre Lohnausgaben vollständig zurück. Die obige Grenzrechnung betrifft **nur** die nachgewiesene lokale Eis-/Fonds-Seite, nicht das gesamte Wirtschaftssystem oder Schiffersatz/Risiko.

**Originale Tagesbelege zur Gegenprüfung:**
- Seed42 **Tag2:** 15 neue Eislieferungen/30 Eis, **660 ISK** wirklich an NPC3; **75 ISK** gezahlte Minerkosten und **15 ISK** Handelsgebühren gehen an Fonds. Der Fonds bezahlt gleichzeitig 15 × 44 = **660 ISK** neue Endauftragsreste. **Netto −570 ISK**, freier Fonds-Endcash Tag2 **100 ISK**.
- Seed7 **Tag2:** 24 Lieferungen/48 Eis, **1.056 ISK** an NPC3; **120 ISK** Minerkosten und **24 ISK** Gebühren kehren an Fonds zurück. Neuer Fonds-Endverbrauch **1.056 ISK**, **netto −912 ISK**, freier Fonds-Endcash Tag2 **155 ISK**. Tag3 kann noch eine Einheit abgenommen werden (Fondsauszahlung 44, Rückfluss 5+1), danach Fonds-Endcash **117 ISK**.

Ab **Tag4 bis Tag7** gibt es in diesen beobachteten Mikrowelten weder weitere echte Nadir-Eisverkäufe noch neue Nadir-Schiffsbetriebskosteneingänge. Zuletzt liegt das Eis weiterhin physisch vor, der Miner hat Geld und behält seinen Förderauftrag. Nur das frei **vorher zu sperrende Käuferbudget 128 ISK** kann mit 100/117 ISK nicht mehr reserviert werden.

**Wirtschaftlicher Kernbefund:** Die reale Arbeit und die Handelsgebühren können den Fonds zu einem Teil auffüllen, aber bei diesem Kosten-/Lohn-/Nachfrage-Design wird pro weiterem Auftrag netto **38 ISK vom Käuferfonds zum Miner-Eigentümer** verschoben. Dass NPC3 sein Gesamtvermögen behält, hilft einem einzelnen, vertraglich zahlenden Fonds nicht, sobald dessen freies Geld unter die Vorabreserve fällt. Es fehlen ein **tatsächlicher, begründeter Gegenleistungs- und Geldrückfluss** aus den übrigen NPC3-Einnahmen an den Endabnehmer, nicht Waren- oder Geldbilanzierung.

## 4. Qualität und Grenzen

- **[TEST]** [B-K12d gezielte CI](https://github.com/tobiasfranziskus/Check/actions/runs/41698366671) am ersten Analyse-Head `09e19a63`: **4/4 Tests erfolgreich**, 0 Fehler. Samen 42 und 7 je sieben Tage in der unveränderten B-K12c-Kofinanzierungswelt; alle vorbestehenden B-K12b/-c-Gegenproben erneut. Zusätzlich Nadir-Miner-ID, reale Verkaufs-/Gebührenbelege, getrennte fällige/bezahlte Betriebskosten, Fondspayer, NPC3-Phasenkassenidentität, tägliche Minervorräte und cash, volle unabhängige stündliche Waren-/Geld-/Herkunftsaudits und tägliche originale Save-/Load-/Hashes.
- **[TEST, FINAL AUSSTEHEND]** Ein nachfolgender kleiner Prüfcommit `2b7a5886` pinnt die eigentlichen Grenzbeträge `44/5/1/38`, real bezahlte Minerarbeit, Eigentümer-/Fondsendkassen und Auftragsstopp. Finale CI nach den Dokumentationsänderungen separat prüfen.
- **[ANALYSE-GRENZE]** Noch immer isolierte R15-Gegenwelten: maximal 1 Nahrungscharge je Auftrag/Stunde bei realem Nadir-Bedarf 2/h, konkurrierende NPC-Frachter gehalten, keine 13×90d-Wirtschafts-/Spielerkrisenwelten, keine geprüfte Frachtrouten-/Sicherheits-/Ersatzvollkostenintegration, kein realer iPad-/NAS-Test. Der beobachtete Mangeltickzähler 168/168 beweist keine isolierte Kaufkraftursache, solange Kapazität auf eine Einheit begrenzt ist.

## Empfehlung für den nächsten kleinen Schritt

**[OPTION] B-K12e** sollte die von B-K12d erstmals präzise belegte **38-ISK-Geldverschiebung pro erneuter Eis-/Nahrungscharge** gegen mögliche schon existierende, **tatsächlich bezahlte** Nachfrage nach NPC3-Leistungen und Gegenleistungen prüfen. Ein bloßes Transfer-Gate, eine künstliche Fondsaufstockung, eine versteckte Spieler-Spargrenze oder eine neue ISK-Emission wären **keine** belegte Ursachebehebung. **Erst danach** einen getrennt freizugebenden Vorschlag zur echten Finanzierung des Endabnehmers bzw. zu notwendigen Kosten-/Preis-/Lohnkorrekturen formulieren. Die einzige verbindliche Roadmap auf `main` bleibt maßgeblich; keine Produktfreigabe aus diesem Analyse-PR ableiten.
