# W6/P7 – echte 180-/365-/730-Tage-Probe mit aktiviertem NPC-Silizium

**15. November 2026 · [ANALYSE / DRAFT – keinerlei Wirtschaftsregeländerung]**

## Warum dieser Nachweis nötig ist

[MAIN] `253750490339cc813880f596a30aab9aa886a26f` enthält die reale, beim Karrierestart bewusst wählbare W6-S02-Firmenautomatik und den rechtmäßig finanzierten NPC3→J2b→J3→J4-Jäger. Der bestehende [P6-Nachweis](W6_P6_AUTONOME_JAEGERLIEFERKETTE.md) endet am **90. Spieltag** mit zwei gekauften/gebauten (einer davon vom Spieler gekauften) Jägerhüllen, allen 16 Siliziumeinheiten verbraucht, 93 bezahlten Ersatzkäufen und 33.000 ISK unveränderter Weltgeldmenge.

Der ältere [S02-730-Tage-Forschungsnachweis](https://github.com/tobiasfranziskus/Check/pull/389) verwendete **nicht** die P5-Siliziumautomatik. Dessen Langzeitwerte können daher nicht als W6/P5-Endergebnis angeführt werden.

## P7-Prüfvertrag

`tools/w6-p7-silizium-langzeit.cjs` benutzt **ausschließlich den gegenwärtigen produktiven Regel204-Kern** und `W6.start(S02.politik)`; danach ist der einzige neue Befehl `welt.npcSiliziumSetzen(state,true)`. Das ist genau das in der öffentlichen Karriere angebotene S02-Verhaltensprofil. Vor 90 Tagen ist die **120-Minuten-Reihenfolge des integrierten P6-Tests** einschließlich des echten `house`-Kaufs zu 900 ISK absichtlich identisch. Der Hash am Tag90 muss **`686355895f27fbb8`** bleiben. Ein neues Ergebnis darf diese Referenz nicht stillschweigend ändern.

Fortsetzung am selben Originalzustand bis **180 / 365 / 730 Spieltage** mit:
- tatsächlich unabhängiger Geld-, Waren-, Eigentümer-, Schiffs- und Lohnprüfung gegen originale Ledger samt `welt.audit`; Weltgeld exakt 33.000 ISK, Mint/Burn 0, alle Kassen nichtnegativ;
- originalen Fighter-Eigentumsjournalen, 900-ISK-Kaufbeleg, einem vom Spieler bezahlten Jäger und vollständig erhaltenem Spielerrestgeld **2.100 ISK** (Spieler spart unbegrenzt);
- endlichem 16er-Siliziumfeld, physischer Lagerentnahme, getrenntem J3-Bauteil- und J4-Jägerfortschritt, nachvollziehbaren Engpassgründen;
- Tag90/180/365/730 als unabhängigen Checkpoints, tatsächlichen JSON-Exports und kanonischen Save/Load-Hashes; zusätzliche 180-/365-Tage-Dateifortsetzung mit identischen Original-Ticks;
- Eisförderung, Wasserabsatz, real bezahlten Löhnen und Ersatzkäufen als **getrennte wirtschaftliche Indikatoren**. Negative Werte oder Stillstand werden **nicht künstlich repariert** und sind kein automatischer Testfehler, solange Geld-/Waren-/Eigentumsregeln stimmen;
- CPU/Wandzeit, Speicher, Anzahl historischer Schiffe, Save-Größe und Top-Engpässen, um die Skalierung mit der Historie beurteilen zu können.

Vollständig gespeicherte QA-Snapshots bleiben **CI-Artefakte**, nicht Produkt-Saves und nicht Bestandteil von GitHub Pages oder NAS. Keine stillen Importe ins Spiel, keine neuen Rohstofffelder oder Geldtransfers, keine Balance-/Preis-/Rezeptänderung.

## Ausführung

```sh
node --test tests/w6-p7-langzeit-contract.test.mjs
node tools/w6-p7-silizium-langzeit.cjs 180 /tmp/w6-p7
node tools/w6-p7-silizium-langzeit.cjs 365 /tmp/w6-p7
node tools/w6-p7-silizium-langzeit.cjs 730 /tmp/w6-p7
```

Der gezielte [GitHub-Actions-Langlauf](../.github/workflows/w6-p7-silizium-langzeit.yml) startet bei Änderungen dieses Prüfwerkzeugs automatisch einen **einzelnen vollständigen 730-Tage-Originalpfad**, der sämtliche Meilensteine mitprüft und Artefakte 7 Tage behält. Der 730er-Lauf kann wegen der historischen Schiffsanzahl länger dauern; der Workflow hat eine feste 120-Minuten-Grenze. **Ein Timeout ist ein nicht erbrachter Nachweis**, kein Erfolg. Die bereits bestehende Gesamtsuite läuft parallel als unabhängige Regression.

**Status bei Erstellung:** Noch **keine** tatsächlichen 180-/365-/730-Ergebnisse auf P7 geprüft. Nur grüne ausgeführte CI- oder lokale Läufe dürfen als bestanden dokumentiert werden. Neuer QA-PR ist **kein** Antrag auf Merge nach main oder Änderung der öffentlichen Version.

## Fachliche Grenze

Selbst wenn Eis/Wasser/Ersatz am Tag730 weiterlaufen, bleibt das Siliziumfeld nach höchstens zwei Jägern leer. Dauerhafte Jägernachversorgung erfordert **neue, endliche, real erschlossene physische Siliziumlagerstätten sowie bezahlte Förderung, Transport und Käuferkapital**. Vor einer neuen produktiven Regel sind vorhandene Rohstoffbestände, Käuferbudgets und Lager-/Schiffskapazität zu prüfen; kein Refill, garantierter Abnehmer, künstliche ISK-Emission oder Gratisbergung.
