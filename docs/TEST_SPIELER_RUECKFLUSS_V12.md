# Aphros Void v12 – experimenteller Spieler-Überschussrückfluss

**30. Oktober 2026 · [ANALYSE/DRAFT] · keine Produktimplementierung, kein Merge oder Deployment.**

**Urteil:** Der vorhandene Überschussrückfluss mit zusätzlich erfasstem Owner-Typ `player` verhindert den beobachteten Kollaps in den vier geprüften aktiven Anfangsfällen tatsächlich: bezahlter NPC-Ersatz, Produktion und Handel laufen weiter. Die Verbesserung entsteht durch reale ISK-Transfers. Sie ist **keine geeignete pauschale Produktlösung**: Der einzelne Start-Miner erreicht keine 8.000 ISK, das festgelegte Stationskaufkommando scheitert, und die Rückflussregel allein repariert eine bereits kollabierte Welt nicht dauerhaft. Ein positiver Versorgungswert genügt deshalb nicht als Fortschritts-/Investitionsfreigabe.

## 1. Basis und exakt isolierter Eingriff

Verbindliche Planung: [ROADMAP.md](ROADMAP.md), unverändert. `AGENTS.md`, Roadmap, Projektstatus, [Langzeitbericht aus PR #32](TEST_WIRTSCHAFT_LANGZEIT_V12.md) und produktive Flüsse wurden vorab gelesen. Auf GitHub verifiziert: `main` weiterhin [`ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f`](https://github.com/tobiasfranziskus/Check/commit/ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f), Diagnose-/Werkzeugstand [Draft-PR #32](https://github.com/tobiasfranziskus/Check/pull/32), Commit [`8cd87134c3c5869319455b3670e92f3e42133027`](https://github.com/tobiasfranziskus/Check/commit/8cd87134c3c5869319455b3670e92f3e42133027). v0.12.3, Regelversion 12 und Schema 8 unverändert.

`index.html` blieb bytegleich: SHA-256 `5e842417c5b05e057ad26499659089060ac96ddda913e38922886b1c54ff3653`. Die produktiven Regeln bleiben eingefroren. Nur eine **im Testprozess erzeugte Kopie** erhält:

```js
experimentRules.world.npcAusgabenArten = ['trader', 'miner', 'player'];
```

Ein vollständiger Vergleich nach Entfernen des zusätzlichen Listeneintrags muss die Originalregeln exakt ergeben. **Keine** andere Zahl, Formel, AI, Rezeptur, Produktionsdatei, Abgabenlogik, Preisregel, Kasse oder Startflotte wird verändert. Der vorhandene Freibetrag `npcObergrenze = 6000`, Zahlungsweg, Reihenfolge, Fonds und Kosten bleiben gleich. Die Regelversion wird nicht erhöht: das ist ein gekennzeichneter Laborversuch, kein produktives Save-Format. Zum Wiederholen eines Experiment-Saves müssen dieselben Testregeln explizit an den Core übergeben werden; ein normaler Produkt-Load würde wieder produktive Zukunftsregeln verwenden.

[Versuchswerkzeug](../tools/player-reflux-v12.mjs), [Postmortem](../tools/player-reflux-v12-postmortem.mjs), [Verdichtung](../tools/player-reflux-v12-summary.mjs), [Messdaten](data/spieler-rueckfluss-v12.json). Die Werkzeuge aus PR #32 und die Goldenwerte wurden nicht verändert. Kombinierter SHA-256 von Versuchswerkzeug und PR32-Beobachter: `5c1ebd2b724c44cee8281cd5deac962f128a007a0f5531251284c881ade6f9ca`.

## 2. Testmethode und Vergleichbarkeit

Zunächst Seed 42 mit **ausschließlich** `shipMine(sh001, erz)` über 365 Tage. Anschließend die drei Jahres-Spielerfälle aus PR #32 und alle 13 inaktiven Referenz-Seeds über 365 Tage: **7, 11, 1, 2, 65535, 42, 1234, 98765, 3, 99, 2024, 2025, 314159**. Zusätzlich zwei getrennte Wiederanlaufpaare mit Aktivierung des Filters erst **nach Tag 90**: Miner/42 und Stationsfall/1234. Zusammen **19 gepaarte Jahresversuche**.

Jedes Paar enthält vier vollständige Trajektorien: produktive Kontrolle mit Beobachtern und uninstrumentiertem Replay sowie Gegenversuch mit Beobachtern und uninstrumentiertem Replay. Alle verwenden den aus der unveränderten Produktionsdatei extrahierten Core. An Tag 30/90/180/365: vollständige kanonische Gleichheit innerhalb des jeweiligen Replays, Save/Load beider Zustände; der Replay wird ab dem geladenen Zustand weitergeführt, der Messlauf bleibt durchgehend. An Tag 365 erfolgt ein Roundtrip ohne weitere Simulation über das Jahresende hinaus.

Jede Stunde: Core-Audit und unabhängig gezählte ISK/Waren in allen vier Trajektorien. Im Messlauf zusätzlich Einzelkassenfluss und vollständige Verbrauchsgründe nach PR32-Methode. Täglich Replayhash; bei inaktiven Baselines außerdem kanonische Identität von Kontrolle und Gegenversuch an jedem Tagesende. Vor der verzögerten Aktivierung müssen beide Varianten ebenfalls täglich kanonisch identisch sein.

**Identische Befehlsbänder:** Die drei Spielerfälle verwenden unverändert `commands` aus den gespeicherten PR32-Messdaten, einschließlich Schiff-IDs, Kauf-/Aktivierungs-/Jagd-/Stationsbefehlen und wartender Save/Load-Umbenennungen. Nach Ablehnung wird kein billigerer Ersatzkauf eingeschoben und der Kaufzeitpunkt nicht angepasst. Submission und Ausführung werden separat protokolliert. Die Kontrolle muss sämtliche ursprünglichen Befehle erfolgreich ausführen; im Gegenversuch ist ein reproduzierbar abgelehnter Kauf ein **gemessener Fortschrittsverlust**, kein Grund, die Prüferwartung oder Referenz zu ändern. Jeder Replay muss denselben Befehlsausgang reproduzieren.

**Investitionsfähigkeit:** Liquidität wird nach **jedem Minuten-Tick** erfasst, also in tatsächlichen Befehlsfenstern vor dem nächsten Tick. Zusätzlich werden Geldspitzen innerhalb des Core und vor dem stündlichen Abzug getrennt erfasst. Für die erste bezahlbare Station und das erste Kauf-Fenster mit mindestens 8.000 ISK wird ein echter `stationBuy` auf einer verworfenen Save/Load-Kopie ausgeführt und auditiert. Diese Probe benutzt den **uninstrumentierten Core**, damit sie keine Zahlungsflüsse des Messlaufs verfälscht. Der Hauptverlauf kauft nur, wenn das feste Befehlsband es vorsieht.

Vermögen wird getrennt ausgewiesen: Spielerkasse, vorhandene Hüllen zum Basiswert, Fracht zum lokalen Preis und Kassen eigener Stationen. Die Summe ist ein **diagnostischer Vermögensindikator**, kein garantierter Verkaufserlös; Stationseigentum hat zusätzlich einen nicht bewerteten Titel. Ein Vermögensindikator oberhalb 8.000 ersetzt keine 8.000 liquiden ISK für einen Kauf.

## 3. Wirkung ab Spielbeginn

Mangelstunden sind wie in PR #32 kumulierte Stations-/Warenstunden, keine Personen- oder reinen Zeitstunden.

| Fall / Seed | Kontrolle 90/180/365 | Gegenversuch 90/180/365 | NPC1/NPC2 an Tag 365 (K→G) | Spielerkasse 365 (K→G) |
| --- | --- | --- | --- | --- |
| miner / 42 | 35.798 / 74.678 / 154.598 | 59 / 107 / 207 | 0/0 → 3/2 | 42.795 → 6.000 |
| handel-flotte / 42 | 36.659 / 75.539 / 155.459 | 46 / 96 / 204 | 0/0 → 3/2 | 39.762 → 6.000 |
| station / 1234 | 36.503 / 75.383 / 155.303 | 59 / 96 / 210 | 0/0 → 3/2 | 30.505 → 6.000 |
| jagd / 98765 | 36.525 / 75.405 / 155.325 | 63 / 109 / 234 | 0/0 → 3/2 | 40.455 → 6.000 |

**Der Kollaps wird in diesen vier Startfällen real verhindert:** beide NPC-Handelsflotten haben im Gegenversuch keine Stunde vollständigen Flottenausfall, alle Jahresend-Flotten sind bei 3/2 Frachtern. Die folgende Tabelle zeigt tatsächliche Leistungen und zivile Kostenlücken, jeweils Kontrolle → Gegenversuch. Die hohen Verlust-/Ersatzanzahlen im lebenden Gegenversuch bedeuten anhaltenden Betrieb; die niedrigen Kontrollverluste entstehen durch frühzeitiges Flottensterben.

| Fall | Handelsoperationen | Produzierte Einheiten | Geförderte Einheiten | Zivile Kostenlücke ISK | Zivile Verluste / Ersatz (G) |
| --- | --- | --- | --- | --- | --- |
| miner | 7.248 → 385.800 | 11.869 → 655.894 | 28.603 → 1.413.986 | 37.804 → 3.485 | 1.443 / 1.443 |
| handel-flotte | 4.881 → 388.180 | 8.039 → 656.667 | 19.562 → 1.413.639 | 12.401 → 1.202 | 1.444 / 1.444 |
| station | 5.361 → 386.667 | 8.632 → 658.295 | 21.133 → 1.417.977 | 55.500 → 2.466 | 1.429 / 1.429 |
| jagd | 5.024 → 387.401 | 8.815 → 656.230 | 21.247 → 1.409.869 | 13.953 → 1.495 | 1.447 / 1.447 |

Die Produktionstotale summiert heterogene Wareneinheiten; sie ist keine ISK-Wertschöpfung. Handelsoperationen verwenden den vorhandenen Core-Zähler und enthalten reguläre Kauf-/Verkaufsaktionen, keine neue Umsatzdefinition. Stations-/Warenmangel, Kassen aller Owner, Flottenlücken und Kosten stehen je Messpunkt vollständig in den Messdaten.

### Geldverteilung und Spielererlöse

| Fall / Variante | Spieler | Stationen | Fonds | Händler | Miner | Spieler-Überschuss seit Start |
| --- | --- | --- | --- | --- | --- | --- |
| miner / control | 42.795 | 5.238 | 1.258 | 132 | 481 | 0 |
| miner / player | 6.000 | 21.080 | 4.997 | 10.983 | 6.000 | 2.068.986 |
| handel-flotte / control | 39.762 | 4.466 | 1.300 | 0 | 4.395 | 0 |
| handel-flotte / player | 6.000 | 19.347 | 6.550 | 12.000 | 6.000 | 2.102.178 |
| station / control | 30.505 | 6.151 | 720 | 0 | 4.357 | 0 |
| station / player | 6.000 | 18.310 | 7.445 | 12.000 | 6.000 | 2.021.185 |
| jagd / control | 40.455 | 7.337 | 57 | 165 | 1.828 | 0 |
| jagd / player | 6.000 | 21.418 | 5.612 | 10.863 | 6.000 | 2.082.432 |

Der Spieler führt im einzelnen Miner-Gegenversuch **2.068.986 ISK** über das Jahr zurück, obwohl die Endkasse nur um 4.000 gegenüber dem Start wächst. Die großen Flusssummen sind wiederholte Umläufe vorhandener ISK, keine heimliche Geldschöpfung. `npcAusgaben()` senkt die Spielerkasse auf 6.000 und erhöht die reale Empfänger-Fondskasse um exakt denselben Betrag; `minted` und `burned` ändern sich durch diesen Transfer nicht.

Der bestehende `stats.konto`-Kosten-/Ertragszähler allein reicht für diesen Vergleich nicht: `npcAusgaben()` verbucht den Überschuss unter `stats.abgabe`, nicht über `buche(..., 'kosten', ...)`. Deshalb werden tatsächliche Cash-Transfers und `playerSurplus` mit ausgewiesen, statt nominale Spielererlöse als verbleibenden Gewinn zu behandeln. Gebühren, Betrieb, Einkäufe und Überschüsse sind in den `houseFlows` getrennt erfasst.

## 4. Sparen und Stationskäufe: die entscheidende Einschränkung

| Fall (Gegenversuch) | Max. liquide ISK im Befehlsfenster | Minutenfenster ≥8.000 | Erstes Fenster ≥8.000 (Tick) | Vermögensindikator 365 ISK |
| --- | --- | --- | --- | --- |
| miner | 7.056 | 0 | nie | 8.086 |
| handel-flotte | 10.183 | 340 | 1480 | 7.368 |
| station | 8.338 | 43 | 765 | 7.360 |
| jagd | 9.242 | 267 | 659 | 8.300 |

- **Nur Start-Miner:** In 525.600 Tick-Fenstern nie 8.000 liquide ISK, Maximum 7.056; Endkasse 6.000. Der Vermögensindikator 8.086 besteht aus 6.000 Cash, 1.350 Hüllenbasiswert und 736 Frachtquote. Diese Sachwerte sind keine liquide Kaufreserve. Eine Strategie „ruhig 8.000 ansparen und dann kaufen“ funktioniert hier nicht.
- **Günstigere Stationen bleiben möglich:** In beiden Miner-Varianten bei Tick 776: 5.919 ISK Kasse, tatsächlicher Aldera-Preis **3.112 ISK**, erfolgreicher Kauf auf Wegwerfkopie. Der reale Preis ist `2 × Stationskasse + 3000`; 8.000 ist der Preis bei 2.500 Stationskasse, **kein allgemeiner Festpreis**. Aus dem fehlenden 8.000-Sparziel folgt daher kein mathematisches Totalverbot jedes Stationskaufs. Ein tatsächlich vorgezogener günstiger Kauf würde den Befehlsverlauf ändern und wurde nicht als wirtschaftliche Reparatur getestet.
- **Mehrere aktive Schiffe:** Größere Verkäufe erzeugen kurzzeitig 8.000–10.183 liquide ISK. Das sind zeitlich enge Kaufchancen, keine frei anwachsende Sparreserve. Im Flottenfall gilt ≥8.000 nur für 340 von 525.600 Minutenfenstern, im Stationsfall für 43, im Jagdfall für 267. Ein dauerhaft hohes Sparziel ist daraus nicht abgeleitet.
- **Exakt gleicher Stationsbefehl scheitert:** Seed 1234 kauft in der Kontrolle bei Tick **781** Aldera für **8.000 ISK**. Derselbe gültig geformte Befehl wird im Gegenversuch bei Submission wegen zu geringer Spielerkasse abgelehnt; am Ende keine eigene Station. Schon Tick 765 hätte dort eine Kaufprobe funktioniert: 8.261 ISK Kasse, Preis 6.848. Das feste Band wird bewusst nicht vorgezogen, um den Fortschrittsverlust nicht wegzutesten.
- **Keine absolute Wallet-Grenze nach jeder Funktion:** Der Abzug erfolgt nur stündlich, und `dividende()` läuft **nach** `npcAusgaben()`. Zwischen Stunden sowie nach Dividenden können Beträge über 6.000 bestehen. Eine Auswertung nur nach Stunden oder nur mit dem Parameterwert würde Investitionsfähigkeit falsch darstellen.

Somit ist die pauschale Aufnahme von `player` in den vorhandenen 6.000-ISK-Filter als endgültige Lösung abzulehnen: Sie verbessert die Versorgung, beschneidet aber den gezielten Vermögensaufbau und macht Investitionen von unterstündlichen Chancen abhängig. Die konstante Spielerzahl in den 13 inaktiven Baselines ist kein Gegenbeweis; dort gibt es keinen Spielererlös.

## 5. Aktivierung erst nach dem Kollaps an Tag 90

Bis einschließlich Tag 90 laufen Kontroll- und Eingriffsvariante exakt unter produktiven Regeln und sind täglich kanonisch identisch. Ab Tick 129.601 gelten in der Eingriffsvariante die Testregeln; der erste mögliche automatische Abzug erfolgt stündlich. Weder Spielergeld noch Fonds werden manuell umgebucht. Danach laufen dieselben Befehle bis Tag 365 weiter.

| Fall | Mangel 365 Kontrolle → Eingriff | NPC1/NPC2 am Ende | Erster Handel/Produktion/Förderung nach Wechsel (Stundenraster) | Spieler-Rückfluss ISK |
| --- | --- | --- | --- | --- |
| miner / 42 | 154.598 → 141.400 | 0 / 0 | 129720 / 129720 / 129720 | 36.795 |
| station / 1234 | 155.303 → 148.704 | 0 / 0 | 129720 / 129720 / 129720 | 24.505 |

Der erste Wiederanstieg von Handel, Produktion und Förderung wird jeweils bei Tick **129.720** festgestellt, also im Stundenraster zwei Stunden nach dem Messpunkt. Das ist **Teilaktivität**, kein wiederhergestelltes Transportnetz. Miner/42: NPC2 erscheint bei Tick 155.280 kurz wieder und fällt bei 160.080 erneut aus; NPC1 kehrt nie zurück. Stationsfall/1234: beide Handelsflotten kehren bis zum Jahresende nicht zurück. Auch am Jahresende bestehen 141.400 bzw. 148.704 kumulierte Mangelstunden.

Zur Ursachenprüfung wurde der Endzustand jedes Eingriffs zusätzlich mit einem uninstrumentierten Einzellauf rekonstruiert und gegen dessen gemessenen Endhash geprüft. Echte `zuschuss()`-/`ersatzkauf()`-Aufrufe auf Wegwerfkopien bestätigen:

| Fall | Werft-Frachterbestand | Preis + Gebühr ISK | Aldera-Fonds ISK | Fehlbetrag pro leerem Händler ISK | Alle Fonds ISK |
| --- | --- | --- | --- | --- | --- |
| miner | 1 | 1050 + 42 | 354 | 738 | 9.354 |
| station | 1 | 1050 + 42 | 720 | 372 | 720 |

Beide Händler haben null Cash. Die Werft besitzt zwar eine Frachterhülle, aber der einzige zulässige Zuschussfonds `fonds_aldera` deckt die benötigten **1.092 ISK** nicht vollständig. `zuschuss()` zahlt dann **gar nichts**, `ersatzkauf()` kauft nichts; die Kopien bleiben bei 0/0 Händlerschiffen. In beiden Fällen hat die Frachterlinie außerdem 0 Bauteile statt benötigter 8 und keinen laufenden Auftrag: auch der Materialnachschub für weitere Hüllen ist unterbrochen.

`npcAusgaben()` schickt Geld zum Fonds der aktuell ärmsten Station, **nicht automatisch zum Werftfonds**. `fonds()` füllt Stationskassen bzw. verteilt Fondsüberschüsse an Stationen; es gleicht nicht bedarfsgerecht den für Ersatz entscheidenden Fonds aus. Im Miner-Fall liegen 9.354 ISK in allen Fonds, aber nur 354 in Aldera. Im Stationsfall sind insgesamt 720 Fonds-ISK vorhanden; zugleich hält Nadir **20.510 ISK** Stationscash. Das ist eine weitere räumliche Kapitalbindung. Die bloße Freigabe zuvor beim Spieler gebundener ISK ist deshalb kein hinreichender Wiederanlaufnachweis.

Die normale `fonds()`-Auffüllung überspringt Stationen mit Eigentümer, die globale Überschussverteilung an die ärmste Station dagegen hat keinen entsprechenden Eigentümerfilter. Dividenden folgen zuletzt. Diese bestehenden Reihenfolgen wurden nicht korrigiert oder umgangen und sind bei jedem späteren Rückflussdesign mitzuprüfen.

## 6. Alle 13 inaktiven Baselines und unveränderte Referenzen

In allen 13 Baselines bleibt der inaktive Spieler bei 2.000 ISK. Der zusätzliche Filter greift nie. Kontrolle und Gegenversuch sind an sämtlichen 365 Tagesenden kanonisch identisch. Alle festen 90-Tage-v12-Profile werden für **beide** Varianten gegen die unveränderte Fixture geprüft; die historischen PR32-Hashes an Tag 90/180/365 bleiben identisch.

| Seed | Mangel 90/180/365 – beide Varianten | Jahreshash – beide Varianten |
| --- | --- | --- |
| 7 | 57 / 119 / 238 | `1f827f7dafed1f05` |
| 11 | 48 / 102 / 215 | `b763f6035bba0d55` |
| 1 | 58 / 121 / 249 | `d8ebac130d06b8d1` |
| 2 | 54 / 109 / 222 | `b9f0796ed241b3e3` |
| 65535 | 59 / 125 / 254 | `5dc4f43eaecd2966` |
| 42 | 58 / 113 / 227 | `f7139a715303a31b` |
| 1234 | 83 / 142 / 282 | `1718eedb607c9bd9` |
| 98765 | 60 / 122 / 229 | `6101e32550e5c970` |
| 3 | 55 / 115 / 257 | `3eb174996afbf532` |
| 99 | 73 / 146 / 259 | `db3989145a1dfed5` |
| 2024 | 75 / 121 / 234 | `79b3bc742e81ffe2` |
| 2025 | 64 / 136 / 245 | `cfd3ef1fd72d2ffd` |
| 314159 | 47 / 111 / 231 | `b27299302f9243ec` |

Summen unverändert **791 / 1.582 / 3.142** Mangelstunden; Mediane **58 / 121 / 238**. Tagesgleichheit der Zustände umfasst auch Kassen, RNG, Produktion, Handel, Flotten, Verluste und Stats. Kein Goldenwert wurde ersetzt. In den aktiven Fällen weichen die Eingriffshashes erwartungsgemäß ab; ihr eigener Replay stimmt täglich überein. Die Kontrollhashes und Mangelwerte aus PR #32 stimmen weiterhin; die erwartete Regelwirkung wird nicht als Fehler des produktiven Kerns interpretiert.

## 7. Alternativen – ausschließlich Untersuchungsoptionen

| Option | Vorteil | Nachteil / notwendiger Nachweis |
| --- | --- | --- |
| `player` unverändert in den 6.000-ISK-Filter aufnehmen | Kleinster Eingriff, verhindert den Kollaps in vier Startfällen mit realem Geldrückfluss | Blockiert 8.000-Sparen des einzelnen Miners, Kaufband scheitert, kein dauerhafter Wiederanlauf; **als pauschale Lösung nicht empfohlen** |
| Höheren Spieler-Freibetrag innerhalb des vorhandenen Rückflussprinzips untersuchen | Kann planbare Anschaffungen statt Sekunden-/Minutenfenster ermöglichen | Zusätzliche Produktentscheidung über Spielergrenze; mehr gebundene ISK können erneut die Umlaufmittel entziehen; noch nicht simuliert |
| Nur die gemeinsame vorhandene `npcObergrenze` erhöhen | Ein einzelner bestehender Parameter, keine neue Kostenart | Erhöht zugleich NPC-Kapitalbindung; kein Beweis, dass ein erster Stationskauf und spätere größere Investitionen tragfähig werden; historische Liquiditätsanalyse warnt vor unbedachten Grenzänderungen |
| Bestehende freiwillige Schiff-/Stationskäufe als tatsächlichen Rückfluss nutzen | Spieler erhält vorhandene Sachwerte, kein ersatzloser Verlust oberhalb einer Grenze | Selbst gewählte Kaufzeitpunkte ändern das Band; Spieler muss auch sparen oder aussetzen dürfen; die gemessenen Kaufchancen beweisen noch keine robuste Gesamtwirtschaft |
| Vorhandene Fonds-/Zuschusswege und Materialblockaden beim Wiederanlauf gezielt prüfen | Adressiert die belegte Aldera-Fonds-/Werftblockade ohne Minting oder neuen Ersatzmechanismus | Global verteiltes Geld und Material sind trotzdem endlich; Wiederanlauf allein behebt anhaltende Spielerakkumulation nicht |

Keine dieser Alternativen wurde zusätzlich gebalanced oder als Lösung umgesetzt. Neue Gehälter, künstliche Betriebskosten, Investitions-Schattenkonten, neue Geldquellen oder neue Wirtschaftssysteme sind nicht Teil dieses Auftrags. Sicherheitsunterdeckung und offener Meridian-Warenausgleich aus PR #32 bleiben bestehen.

**Erforderliche Produktentscheidung vor Implementierung:** Soll ein Spieler größere liquide Investitionsreserven dauerhaft aufbauen dürfen, welche planbaren Anschaffungen müssen erreichbar sein, und darf ein automatischer Rückfluss diese Reserve überhaupt begrenzen? Bis diese Entscheidung getroffen und eine passende Alternative mit denselben Fällen geprüft ist, **keine Spielerabgabe in `index.html` integrieren**. Empfehlung: den unveränderten pauschalen Filterversuch als Ursachenbeleg bewahren, Fortschrittsziel und Wiederanlauf getrennt lösen lassen; keine Produktfreigabe aus den verbesserten Mangelwerten ableiten.

## 8. Reproduktion, tatsächlich bestandene Prüfungen und Grenzen

```sh
# Node.js 22, keine Pakete installieren
export LONGTERM_SOURCE_COMMIT="$(git rev-parse HEAD)"
node tools/player-reflux-v12.mjs --case=miner
node tools/player-reflux-v12.mjs --case=players
node tools/player-reflux-v12.mjs --case=baseline
node tools/player-reflux-v12.mjs --case=recovery
node tools/player-reflux-v12-postmortem.mjs
node tools/player-reflux-v12-summary.mjs work/rueckfluss work/rueckfluss-summary.json
node --test tests/*.test.mjs
```

- **19/19** gepaarte Jahresversuche technisch bestanden: **665.760** stündliche Prüfzeitpunkte über vier Trajektorien, **13.870** tägliche Replayhash-Vergleiche, 152 gepaarte Varianten-Messpunkte mit **304 Save/Load-Roundtrips**; Fortsetzung nach Tag 30/90/180. Hinzu kommen zwei hashidentische, stündlich auditierte Postmortem-Jahresrekonstruktionen.
- **92** Messpunkt-Referenzvergleiche gegen unveränderte PR32-Zustände einschließlich Miner-Kontrolle sowie **26** vollständige 90-Tage-v12-Profilvergleiche (13 Seeds × zwei Varianten). Keine Fixtures geändert.
- **48/48 bestehende Standardtests** unter Node.js 22.23.4 bestanden, 0 fehlgeschlagen, 0 übersprungen (lokal zusätzlich Modus ohne Prozessisolation für einzeln sichtbare Testzahlen; normaler Pflichtbefehl ebenfalls ausgeführt). Wirtschaftlich erfolgreiche Startvermeidung und wirtschaftlich unzureichende Wiederanläufe bleiben getrennte Befunde.
- Neue CI führt den Miner zuerst aus, danach vier Seed-Gruppen, Spieler- und Wiederanlaufgruppe; eine abschließende Vollständigkeitsprüfung verlangt exakt alle 19 Fälle und beide Postmortems. Vollständige Rohartefakte enthalten tägliche Hashes/Verläufe, Befehlsausgänge, Kassen, Flotten, Kosten, Flüsse und Sparfenster; die verlinkte JSON ist eine Verdichtung, keine neue Referenz-Fixture. Aktuellen CI-Status im zugehörigen Draft prüfen.
- Aufwand je vierfach simuliertem Paar: Wandzeit 86.13–245.88 s, CPU 58.81–104.91 s. Prozess-RSS-Höchststand 85.2–130.1 MiB, innerhalb von Prozessgruppen kumulativ. Lokale Parallelprozesse beeinflussen die Wandzeit; kein iPad-Benchmark oder Speicherlecknachweis.
- Feste Auswahl, keine statistische Aussage über alle Spielstrategien oder Seeds. Kein an Kauf-Fenster angepasster Spieler, keine getestete andere Grenze, kein Produktbalancing, keine Safari-/NAS-Abnahme, kein Merge oder Deployment. Roadmap und Produktionsdatei unverändert.
