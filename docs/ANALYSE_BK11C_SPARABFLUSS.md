# B-K11c – Diagnose des Geldabflusses beim sparenden Spieler

**[ANALYSE/DRAFT · 02.11.2026]** Unabhängig auf main b4e604d6, Regel14/Schema8. Keine Änderung an index.html, Geld-, Lohn-, Produkt-, Save- oder Referenzregeln. Der SHA-256 des gesamten Original-HTML ist im Runner gepinnt. Keine Emission und keine Integration.

## Frage und Einschränkung

Reicht die Abwanderung der NPC-Kaufkraft zum sparenden Spieler als Ursache für die aktiven Weltkrisen? Die externe Claude-Code-Analyse hat diesen Zusammenhang stark nahegelegt; die folgende Intervention prüft ihn anhand identischer echter Core-Simulationen. Eine positive Gegenprobe würde **keine** neue Produktregel, keine Spargrenze und keine konkrete Geldmodell-B-Emission rechtfertigen. Der Testtransfer an den Aldera-Fonds ist bewusst **ortsbezogen** und wirkt wie ein gezielter Liquiditätskanal; dies kann von einem allgemeinen Geldmengenmechanismus abweichen.

## A/B/C und Startbedingungen

- **Miner/42:** Spieler-Miner erhält am Spielstart genau den validierten Auftrag shipMine Erz. 
- **Handel-Flotte/42:** Derselbe Miner und zusätzlicher Spieler-Frachter mit validiertem shipHandeln.
- **A – Original:** Kein Geldtransfer. 90-Tage-Endhash muss mit den belegten Produktläufen aus B-K11 übereinstimmen: Miner f733a993164a5e4f; Handel-Flotte 3a2df2b5d77d2e9e.
- **B – volle Rückgabe:** Direkt nach jedem *vollen Original-Stundenabschluss* wird der über 2.000 ISK liegende Spieler-Kassenbestand an fonds_aldera umverteilt. Keine Gutschrift aus dem Nichts, kein neuer Währungstyp.
- **C – marginal halbe Rückgabe:** Nur 50 % des **positiven Netto-Spielerkassenzuwachses der letzten Stunde**, höchstens der verfügbare Bestand über 2.000 ISK, an fonds_aldera. Bereits vorher angesparte ISK bleiben unberührt. Diese Definition unterscheidet sich ausdrücklich von der stündlichen Halbierung des gesamten Überschusses.

B/C greifen nur in die *Testzustände*, nie in Produktcode oder User-Speicher. Jeder Transfer wird mit Tick, Betrag und Vorkassen belegt.

## Qualität und Grenzen

Sechs Welten zu je 90 Tagen, jeweils mit zweiter unabhängiger Replay-Welt. Pro Welt 2.160 stündliche Core- und unabhängige Geld-/Warenaudits, Replays mit Stundenhashes, tägliche Checkpoints und 180 Save/Load-Prüfungen beider Welten. Sechs Testläufe ergeben 12.960 Stundenaudits und 1.080 Save/Load-Prüfungen. Original-Routen, Preise, Verbraucher, Stationen, Piraten, Kosten und Ersatzkäufe bleiben aktiv.

Erfasst werden tatsächlich vorhandene ISK-Menge mit minted/burned, Spieler-, Händler-, Stations- und Fonds-Kassen, übertragenes Geld, verfügbare Silizium-/Bauteil-/Hüllenbestände, Gesamtmangelstunden, Nahrung-/Medizinverbrauch und Händlerfrachter samt Verlusten und bezahlten Ersatzaktivierungen. Die Kennzahl stats.indienst zählt aktivierte Hüllen und ersetzt **keinen vollständigen Vollkostennachweis**. Ein kumulierter Erlös ist keine freie Liquidität.

**Vorab-Gates:** B nahe der passiven Welt (Orientierung ≤1.000 Mangelstunden, fünf Händlerfrachter, Silizium in Aldera >0, bezahlbarer Ersatz) würde die gezielte Liquiditätsumverteilung als starken Faktor stützen. B weiterhin >10.000 Mangelstunden mit Werftblockade widerlegt die **Hinlänglichkeit genau dieses** Rückflusses, nicht alle denkbaren Endnachfragekanäle. C zeigt eine mögliche Dosiswirkung, ist aber kein gleich großer Geldtransfer. Auch bei positiver B-Probe: Kein Spieler-Sparlimit einführen.

## Reproduzieren

    node --test tests/*.test.mjs
    node tools/bk11c-sparabfluss.mjs --scenario=miner --mode=A --days=90 --out=/tmp/bk11c-miner-A.json
    node tools/bk11c-sparabfluss.mjs --scenario=miner --mode=B --days=90 --out=/tmp/bk11c-miner-B.json
    node tools/bk11c-sparabfluss.mjs --scenario=miner --mode=C --days=90 --out=/tmp/bk11c-miner-C.json

Die CI-Matrix ergänzt Handel-Flotte/42. **Testergebnisse erst nach tatsächlicher Ausführung dokumentieren.** Die verbindliche Produkt-Roadmap bleibt docs/ROADMAP.md auf main. Kein Merge oder Deployment.

## [TEST] Ausgeführte B-K11c-CI und Wirtschaftsbefund (02.11.2026)

[CI #41532218615](https://github.com/tobiasfranziskus/Check/actions/runs/41532218615) **erfolgreich** auf Test-Commit 4311241c: 1/1 Ein-Tages-Smoke und **sechs Original-Core-Welten ×90 Tage**, je mit unabhängigem Replay. **12.960 stündliche Core- und unabhängige Geld-/Warenaudits/Hash-Replays; 1.080 Save/Load-Prüfungen.** Die beiden A-Endhashes entsprechen exakt der gepinnten Originalreferenz. Vollständige Tages-Hashes, Konten und Transferbelege liegen in den sechs CI-Artefakten; die zusätzliche Standard-Regressions-CI ist separat zu bewerten.

| Seed42 / 90 Tage | Miner A | Miner B | Miner C | Handel A | Handel B | Handel C |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mangelstunden | 35.798 | **44** | 33.333 | 36.393 | **60** | 33.479 |
| Nahrung tatsächlich verbraucht | 3.474 | **36.648** | 6.198 | 2.577 | **36.658** | 6.120 |
| Medizin tatsächlich verbraucht | 880 | **12.972** | 1.608 | 751 | **12.960** | 1.564 |
| Spieler-Endkasse ISK | 42.795 | **2.000** | 39.865 | 42.254 | **2.000** | 40.760 |
| Stationskassen ISK | 5.238 | **25.065** | 5.778 | 4.317 | **24.942** | 3.669 |
| NPC1/2-Kassen ISK | 132 | **10.059** | 0 | 0 | **10.561** | 0 |
| NPC1/2-Frachter am Ende | 0 | **5** | 0 | 0 | **5** | 0 |
| NPC1/2-Frachterverluste | 18 | 167 | 31 | 18 | 140 | 23 |
| Aktivierte Ersatzfrachter | 13 | **167** | 26 | 13 | **140** | 18 |
| Aldera Silizium / Bauteile | 0/0 | **28/16** | 0/0 | 0/0 | **34/44** | 0/0 |
| Summe wiederholter ISK-Transfers | 0 | **503.834** | 38.140 | 0 | **521.439** | 49.726 |

**[ANALYSE – kausal starke Evidenz]:** In den zwei geprüften aktiven Produktwelten erhält der fortlaufende Rückfluss vorhandener Kaufkraft die Händlerflotten und die Versorgung mit real bezahlten Ersatzhüllen. Die nur halbierte Abgabe des marginalen Spieler-Stundenüberschusses lässt die Händler später dennoch ausfallen. Mehr Geldumlauf ermöglicht zugleich **mehr reale Flüge und Verluste**; 167 und 140 Ersatzhüllen sind kein Gratisersatz.

**Kein Emissionsbudget ableiten:** 503.834/521.439 ISK sind über 90 Tage mehrfach zirkulierte **gleiche** ISK, keine neue Geldmenge. Sie entsprechen ungefähr 5.598/5.794 ISK wiederholten Transfers pro Spieltag, nicht notwendiger Geldschöpfung. Der Versuch gibt gezielt Mittel an den Aldera-Fonds und ändert deshalb nicht nur die Geldverteilung, sondern die lokale Kaufkraft. Ein universelles Geldmodell-B-Zahlungsmodell ist damit weder berechnet noch beschlossen.

**[ENTSCHEIDUNGSGATE]:** Geldkreislauf/zahlungsfähige reale Endnachfrage vor Routenrisiko priorisieren. Als nächste getrennte Analyse den tatsächlichen neu produzierten Nahrung-/Medizinlieferungen einen vollständig belegten Auftrag, Empfänger und begrenzten Geldkanal zuordnen. Keine produktive Spargrenze, keine pauschale Rettung einzelner NPCs, keine ungenehmigte Emissionsregel. B/C bleiben ausdrücklich ausschließlich Analysevarianten. 13-Seed-/275-Tage-/iPad-/NAS-Abnahme ist nicht durchgeführt.
