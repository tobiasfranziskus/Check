# W6/P8a – echte Siliziumversorgung sichtbar, Dravos-Kette nicht fingieren

**Stand: 15.11.2026 · [MAIN / GEPRÜFT / PAGES] – Nur neue Anzeige, kein neues Wirtschaftsrecht.** [Integrations-PR #406](https://github.com/tobiasfranziskus/Check/pull/406) ist als **`main 733f53fb075cc4903ab031c072a7157c403100e7`** integriert. [GitHub-Pages-Deploy #43750823580](https://github.com/tobiasfranziskus/Check/actions/runs/43750823580) ist `completed/success` für exakt diesen Commit. Vorversion: [`backup/main-before-p8a-supply-status-20261115`](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-p8a-supply-status-20261115).

## Ausgangslage und Quellprüfung

- Aktueller Entwicklungs-Ausgangsstand: `main 9f4648b517feb86763b7adf65d2b797d7e233a1c`, erfolgreicher Pages-Deploy #43748766584 und veröffentlichter J14-Cockpit-Reload.
- Der unabhängige [P7-Endnachweis über 730 Tage](W6_P7_SILIZIUM_LANGZEIT.md) hat für das **wirklich aktivierte** S02/P5-Profil 2 Jäger, 758 bezahlte Ersatzkäufe, 33.000 ISK Weltgeld und **alle 16 Siliziumeinheiten verbraucht** ergeben. Der Ersatz- und Wasserwirtschaftskreislauf lebt, die Jägerkette **ohne neue Quelle nicht**.
- Die allgemeine ältere `m_data_systeme.SYSTEME`-Karte in `prototypes/welt/rule200-k7-industry-core.js` enthält ein Siliziumfeld in **Dravos**, nicht in Veldra. Die Stations-Nachfrage in Veldra ist **kein** förderbarer Vorrat. Das aktivierte Regel204-Karrieresystem ist dagegen in `m_data_erzpilot` auf **Aldera und Nadir** begrenzt, einschließlich des belegten Aldera↔Nadir-Korridors (60 Minuten). Eine physische Dravos-Karte, ein Dravos-K2-Miner, eine fremde Siliziumfracht und deren kaufberechtigte Gegenkasse **fehlen im aktiven Regel204-Kern**. Die historischen Kartenfelder enthalten außerdem **keine validierten endlichen Lagerstättengrößen**, die als kostenfreie neue Startware benutzt werden dürften.
- J2b benutzt den bereits vorhandenen Core: Nadir-Feld `{system:'nadir', x:720000, y:-480000, radius:144000, vorrat:16}`, **8 Einheiten pro Auftrag**, **8 Minuten/Einheit**, **2 ISK Arbeitslohn/Minute**, **24 ISK realer Kaufpreis/Einheit**. Je vollständiger Charge müssen somit **128 ISK Arbeitsreserve** und **192 ISK Kaufreserve** tatsächlich bereitgestellt werden; vor eigenem Flug außerdem grundsätzlich die Original-K1-Flugreserve **40 ISK**. Diese drei Größen sind **kein vollständiger Geschäftsplan**: Ein rechtmäßig mit eigener Kasse finanzierter Miner, die Werft-/Materialarbeit, Lager-/Frachtraum, Verschleiß, Vertrag und echte Dockposition müssen außerdem vorhanden sein.

## Gelieferter funktionierender Teilbaustein

**`prototypes/spiel/silizium-versorgung.js`** führt **ausschließlich lesend** `welt.audit(s)` und die echten Daten aus `welt.rules`, `welt.daten`, `s.kanon`, Schiffs-/Stationsinventaren und legalen Original-Kaufjournalen zusammen. Der Bericht zeigt:

1. Verbleibende **physische** Einheiten im einzigen aktiven Nadir-Feld, bereits geförderte und abgerechnete Ware, real volle neue Chargen und gegebenenfalls den aktuell rechtswirksam gebundenen Auftrag.
2. **Getrennt** Nadir-Siliziumlager, Silizium an Bord, fertig produzierte J3-Bauteile, verkäufliche und kumuliert gebaute J4-Jäger. Nichts davon wird nochmals als frei im Boden liegender Rohstoff gezählt.
3. Real benötigte J2b-Arbeits-, Ankauf- und K1-Flugreserven mit **aktuellen tatsächlichen Firmenkassen** von `npc3` und `st_nadir`, dazu die Zahl originalrechtlich gekaufter, physisch in Nadir stationierter NPC3-Miner. **Keine bindende Kauf- oder Bergbauzusage** und keine Nachberechnung von Geld- oder Warenpreisen.
4. Die im Regel204-Kern wirklich aktiven Wirtschafts-Systeme und Siliziumfelder, ausdrücklich **null erschlossene Fremdsystem-Siliziumfelder**; Dravos wird als nicht angebunden gekennzeichnet. Keine nicht existente Transporte/Bestellungen werden als verfügbar dargestellt.
5. Nach vollständiger Erschöpfung den tatsächlichen Rohstoffengpass, ohne damit bereits vorhandene J3-Bauteile oder verkaufsfertige J4-Hüllen wegzudefinieren.

Der Bericht erscheint im **bestehenden Jägerprojekt** der regulären, von Root aus spielbaren P1-Karriere. Er benutzt ausschließlich DOM-`textContent` und `createTextNode`, keine zusätzliche Web-API, keine Frameworks, keine Hintergrunddienste, kein zweiter Tick und keine Speicherung.

## Testvertrag vor Integration

- `tests/w6-p8a-silicon-real-supply.test.mjs`: realer P5-Opt-in, aktuelles Nadir-Feld 16, Kosten 128/192/40, nicht existenter Dravos-Kauf abgelehnt und bitgleicher Originalsave, manipulierte physische Siliziumzahl abgewiesen; anschließend **ausschließlich originalfinanzierter NPC3-Abbau**, ein echter 900-ISK-Spieler-Jägerkauf, vollständige Felderschöpfung, Weltgeld 33.000 ISK, Mint/Burn 0, Geld-/Waren-/Schiffs-/Eigentums- und Save-/Load-Audits.
- `tests/w6-p8a-supply-browser.cjs`: tatsächlicher öffentlicher Root-Weg, ausdrücklich eingeschaltetes S02, Jägerprojekt-Diagnose, echte Finanzierungskennzahlen, keinerlei zusätzliche Waren/Geld durch Rendering, ein echter Original-Spieltag, Save/Load und unveränderte Daten; Chromium und WebKit mit vier Touchgrößen (`1180×820`, `1024×768`, `820×1180`, `390×844`).
- `node --test tests/*.test.mjs`, Original-K7/J3/J4-/S02-Regressionshashes, bestehende Root-/NAS-Buildprüfung. **Nur tatsächlich erfolgreich abgeschlossene CI-Schritte dürfen später als bestanden bezeichnet werden.**

## Tatsächlich ausgeführte Abnahme

- Ziel-Head der unabhängigen [P8a-CI #43750361708](https://github.com/tobiasfranziskus/Check/actions/runs/43750361708): `c7a2be7d93b024f2f2d988c9b7ea3140d2c91f2e`. **7/7 gezielte Node22-Tests, 0 Fehler/Skips**, inklusive unabhängig geprüfter physischer 16/16-Siliziumförderung, echtem `house`-900-ISK-Jägerkauf, abgelehnter Dravos-Fremdstation und gefälschtem Siliziumvorrat sowie bitgleichem Original-Save.
- Reale Produktionsprobe: Feldrest null am **Spieltag 8,5833**, originaler Zwischenhash `54f745e15ac41c83`, ein bereits fertiggestellter und real verkaufter Jäger; der zweite wird aus zuvor gefördertem Material erst später gebaut. **33.000 ISK, Mint/Burn 0**. Das ist keine künstliche Beweisführung mit eingespeister Ware.
- [Vollständiges Node22-Gate #43750361617](https://github.com/tobiasfranziskus/Check/actions/runs/43750361617): **352/352 Tests, 0 Fehler/Skips**; sämtliche bestehenden 13×90-, Jäger-/Wirtschafts-, Save-/Eigentums-/Manipulations- und originalen K7-/F4-Referenzprüfungen einschließlich `W5_SINGLEFILE_OK`.
- Chromium **4/4** und WebKit **4/4** Touchgrößen: echter Root-Einstieg, S02 bewusst aktiviert, sichtbarer P8a-Jägerstatus, unverändertes Original-Geld und Felder nach Tagesfortschritt und JSON-Reload; überall identischer 1-Tages-Hash **`b4debc4a0422b66f`**. Zusätzliche bestehende Browser-/Touch-/Wirtschafts-/NAS-Build-Gates grün. Der bedingte `sicherheitsgeografie-vergleich` war **skipped**, nicht als bestanden gezählt.
- Kein neues Original-Regel204-Feld, keine Nebenbuchung oder Datenmigration. **Echte iPad-Safari-/NAS-Geräteabnahme offen.** Live-Pages HTTP wurde nicht zusätzlich von einem realen Endgerät aus abgerufen; der erfolgreiche GitHub-Pages-Deploy und die Root-Browsertests sind getrennte Belege.

## Wirtschaftlich noch nicht freigegeben / nächster P8b-Schritt

**Keine tatsächliche externe Siliziumproduktion eingeführt.** Vor neuer produktiver Ressourcendefinition muss entschieden werden: physische Größe jeder neuen **endlichen** Dravos-Lagerstätte, auf eigener Schiffsbilanz finanzierter Minerzugang, intersystemischer legaler Original-Kerntransit, reale Piloten-/Frachtkosten und Risiko, Käuferzustimmung und verfügbares Nadir-Kapital, getrenntes Eintreffen/Besitzwechseln, die ersatz-/import-/lagerbezogenen Ledger und Manipulationsschutz für ältere Regel204/Schema8-Stände. Ein eventuell zusätzlicher Regel-/Save-Ableger darf nur per ausdrücklicher kompatibler Migration aktiv werden, nicht durch Nachträglichkeit auf alten Saves.

**Freigabegrenze:** P8a ist ein transparenter, testbarer **Spielbarkeits-/Diagnoseschritt**, **kein** gelöster Silizium-Nachschub. Bestehende 730-Tage-Kernreferenz `4cae5fa6ea9d1f41` und P6-90-Tage `686355895f27fbb8` dürfen nicht verändert werden. Keine automatisch gewährten Ressourcen, ISK, Eigentumsrechte oder Dravos-Transporte.
