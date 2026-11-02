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
