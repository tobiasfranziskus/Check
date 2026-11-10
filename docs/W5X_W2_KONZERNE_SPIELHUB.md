# W5x – Finanzierte W2-Konzerne und endlich nachfragender Markt

**[DRAFT/INTEGRATION · 09.11.2026]** Statische, isolierte Vorschau:
`prototypes/w5x/index.html`. Auf dem [W5w-Regel15-Hub #267](https://github.com/tobiasfranziskus/Check/pull/267) aufgesetzt, aber **in W5x läuft ausschließlich ein aktiver Regel16-Core**. `main` v0.12.5/Regel14, W5w/Regel15, die isolierten C1d-Regel3314-Welten und alle produktiven Speicherplätze bleiben unangetastet. Kein Deployment/Merge.

## Vorhandenen Core übernommen, keine Regeln neu erfunden

Die komplette **Original-W2-Daten-/Core-Sektion** aus [PR #167](https://github.com/tobiasfranziskus/Check/pull/167), festem Commit `afc3268a39beb444da232bcec24b8c6d85ffcf35`, liegt nur für die Browser-Standalone-Forschungswelt in `original-w2-core.js` vor. Die unveränderte Quellsektion ist exakt **110.280 Zeichen** lang und ihr SHA-256 lautet `28dc594b195f241dedb2593217bf7f6c40dc81c87735253e14834cc190f9875d`.

Sie enthält den **originalen W0-Auftrag/Treuhandkern, W1-Originalförderung und W2-Regel16** einschließlich tatsächlicher NPC-Minerschiffkäufe, Amortisations-, Kapital-, Lager- und Endkundennachfragegates, Krise/Stillstand und Original-Audits. Keine lokale Neuberechnung von Preisen, Miningrate, NPC-Investitionskriterium oder Emissionsregeln.

`W5xSession` ist **eine** autoritative Regel16-Welt pro Browser-Sitzung. Sie erlaubt für den Spieler nur die bereits im Core validierten Befehle `shipBuy`, `shipMine`, `shipWait`; der NPC handelt ausschließlich über die bewährte deterministische W2-Core-Stunde. Ein lesender Core-Klon erzeugt Vorschauen, ohne echten Tick/RNG/Hash, Geld, Schiffe, Save oder Eigentum anzufassen. Vor jedem Zustandswechsel und Import laufen `loadW2`, Originalgeld-/Waren-/Vertrags-/Endkundenherkunftsaudit und W1-Vollkostencheck.

## Ein UI, sichtbar echte Konzerne

Die vorhandene W5w-Sitzungs-/Hub-Oberfläche wird **wiederverwendet**:
Bergbau, HQ, Station, Flotte und 2D-Miner verwenden denselben W2-Snapshot.
Nur die optionale, ausschließlich lesende **„Konzerne & Markt“**-Seite ist neu.
Sie zeigt Original-W2-Diagnose (`pilotNpcKrisenLage`), Original-NPC-Investitionsgate
(`pilotNpcInvestition`), eigene/finanzierte/ruhende NPC-Schiffe, wirklich verfügbare
Kundenmittel, reale Lager-/Arbeits-/Käuferkapazität und Fehlbetrag zum nächsten
Erzkauf. Eine volle Konzerntresorkasse wird **nicht** mit zahlender Nachfrage
verwechselt. Die tatsächliche Kontrolle und neue Befehlserteilung bleiben im Core.

## Reale reproduzierte Original-W2-Welt, Seed 42

| Core-Tick | Wirtschaftliche Beobachtung |
| --- | --- |
| **0** | 27.000 ISK Weltgeld, 0 Mint. NPC3 besitzt einen vollständig für **600 ISK bezahlten** Miner. NPC3-Kasse **2.400 ISK**; Exportkunde **20.000 ISK**. Noch **kein** Gratis-Zweitminer. |
| **60** | Ein Original-NPC-Miner arbeitet gegen echte Treuhandmittel. Kundenkasse **19.500 ISK**. Weiterer NPC-Kauf wegen nicht amortisiertem Miner verweigert. |
| **120** | Zweiter NPC-Miner tatsächlich aus Firmenkapital bezahlt; beide gehören `npc3`, nicht dem Spieler. NPC3 **2.500 ISK**, Hüllenverkäufer **1.200 ISK** kumuliert, Exportkunde **19.000 ISK**; W2-Kern/Belege gültig. |
| **1440** | Tatsächlich **2.000 Erz** gegen die **endlichen 20.000 ISK** abgenommen. Käufer **0 ISK**. Beide NPC-Miner ruhen ohne neuen Auftrag (`absatzstopp`), obwohl NPC3 **17.800 ISK** besitzt. Ein neuer Verkauf oder Neustart ohne belegte Kundengelder ist ausgeschlossen. |

Der „NPC hat 17.800 ISK, investiert aber nicht weiter“-Fall ist **kein Fehler**, sondern ein zentraler W2-Wirtschaftstest: Ohne reale Folgekäufer wäre jede weitere Ware nur Lageraufbau oder unbezahlte Arbeit. **W2-Nachfrage ist endlich und kein dauerhafter Wirtschaftskreislauf.**

Ein eigener Spieler-Miner kann weiterhin für **600 ISK** real erworben und gegen real finanzierte Treuhand mit derselben W2-Quelle betrieben werden. Bei 13 Minuten mit NPC-Konkurrenz bleiben die bisherigen vollständigen W1-/Vollkosten-Audits erhalten; ein Stopp liefert tatsächlich 13 Erz gegen 130 ISK, ungebrauchte Mittel werden erstattet.

## Spielstandschutz, Entwicklungsdisziplin und Grenzziehung

- W5x nutzt **keine** Browser-Persistenz: Reload beginnt eine isolierte neue Welt, keinerlei produktive Slots oder `W5w`-Saves werden gelesen, geschrieben oder gelöscht. JSON-Export trägt „w5x/reg16“ im Dateinamen.
- JSON-Import nur für erfolgreich vom vollständigen Original-Core geprüfte **Regel 16 / Schema 8** inklusive Echtheit der Käufermittel. Regel14, Regel15, Rule32, Regel3314, veränderte Erzkonten, Vertragsbudgets, falsche Schiffseigentümer oder erfundene Export-ISK werden verworfen.
- Der **bestehende** Legacy-Snapshot-Adapter bekommt **nur** eine weitere reine Regel16-Projektion nach erfolgreicher Core-Validierung; keine zweite Uhr, kein weiterer Markt-/Wirtschaftskern, keine neue Simulation im 2D-Canvas.
- Keine produktive Emissionsfreigabe, kein neues Schiff-/Modulrezept, keine kostenlose Hülle, kein externer Fonds. Auf `main` ist weiterhin Regel14; C1d und W3-Fracht bleiben getrennte Forschung.
- Für folgende Stufen W3-Transport und W4-Raffinerie müssen **finanzierte neue Kunden und physische Folgeproduktion** statt einer unbefristet zahlenden Exportattrappe nachgewiesen werden.
- Echte iPad-Safari-/NAS-Abnahme steht weiterhin aus. W5x wird erst nach ausdrücklicher Produktfreigabe zu einem Integrationskandidaten; **keine Veröffentlichung oder Merges**.

## Prüfbarkeit

`tests/w5x-finanzierte-w2-konzerne.test.mjs` prüft Originalquell-SHA, bezahlt erzeugte NPC-Schiffe, Spieler/NPC-Konkurrenz, Endkundenstopp bei 0 ISK, 13 Seeds × 90 simulierte Tage mit täglichem unabhängigen Geld-/Waren-/Endkundenherkunftsaudit und Save/Load-Checkpoints, Fälschungen und View-/Hash-Isolation.
`tests/w5x-touch.py` prüft die UI auf vier Chromium-/Touchgrößen inklusive echten Zweitminers, Tick1440-Absatzkrise, eigenem 13-Minuten-Bergbau, Save-Schutz und 2D. CI: `.github/workflows/w5x-integration.yml`.
**Nur tatsächlich abgeschlossene Läufe als bestanden bezeichnen.**

**Roadmap-Basis:** Die gestapelte W5u/W5w-Forschungsbranch enthält eine historische Dokumentdatei; verbindlich ist allein [`docs/ROADMAP.md` auf aktuellem `main`](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md). Deshalb wird eine alte Roadmap in diesem Draft **nicht** als neue zentrale Planung überschrieben. Eine Integration nach `main` erfordert vorher gesonderte Konsolidierung und Zustimmung.
