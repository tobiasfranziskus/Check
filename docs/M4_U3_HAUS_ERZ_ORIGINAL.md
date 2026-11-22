# M4-U3 · Eigenes Erzgeschäft auf originaler W1-Abnahme

**[INTEGRATIONSKANDIDAT / nicht gemergt · 22.11.2026]** Quell-Draft [#567](https://github.com/tobiasfranziskus/Check/pull/567) auf `main e23bc747`; separater Integrationsbranch mit unverändertem Produktcode. Weder in `main` noch auf Pages veröffentlicht. **Keine** Behauptung eines 60-Minuten-Blindtests. Die folgenden Resultate gelten für den gleichen Quellcode auf Commit `bebb15eb0` und sind keine automatische Abnahme des späteren Merge-/Pages-SHAs.

## Produktumfang und Trennung zu W3

Der Wirtschaftsmanager kann in der **Standardkarriere Regel204** nach dem rechtmäßig bezahlten Aldera-Minerkauf entweder eine bestehende Eisförderung oder den **ursprünglichen W1-Erzauftrag mit lokalem Aldera-Ankauf** wählen. Ein freier eigener Miner muss im Aldera-Dock liegen. Eine bereits laufende Eis-/Erzförderung muss vorher über den vorhandenen Stoppbefehl beendet werden. `ore-shNNN` ist ausschließlich ein J8-Angebot für tatsächlich dem Haus gehörende Miner; eine fremde NPC-Hülle bleibt unbenutzbar.

**Nicht gelöst:** Die 50-Erz-**W3-Fracht Aldera → Nadir** aus der Untersuchung #565 bleibt im originalen System Eigentümern `transport`, `npc3`, `st_nadir` und `werft_extern` vorbehalten. Es wurden weder deren Unterschriften, das Vertragsbuch noch fremde Kassen dem Spieler übertragen. Lokaler Erzverkauf ist ein anderes reales Geschäft und darf in UI oder Status nicht als „W3 abgeschlossen“ erscheinen.

## Originalfinanzierung statt Gratisgeschäft

Das neue Startangebot setzt die aus den bisherigen Regelparametern abgeleiteten Mindestmittel voraus. Bei der ursprünglichen W1-50er-Erzcharge sind das:

| Originalkonto | Betrag / Nachweis | Neue Prüfung |
| --- | --- | --- |
| `st_aldera` als physischer Erz-Abnehmer | 50 Erz × 10 ISK = 500 ISK | Aldera-Kasse mindestens 500 ISK bei Start; Kern bindet Ankauf beim wirklichen Förderauftrag |
| `export` als endlicher Endkunde | vorhandenes Exportbudget, kein neuer Käufer | Mindestens 500 ISK; originale W1-Endnachfrage/Bestands-/Vertragsrechnung bleibt bindend |
| `house` als Minereigentümer | 50 × 2 ISK Förderlöhne = 100 ISK | plus vorhandene K1-Flugreserve aus Originalparametern; keine Löhne aus fremden Firmenkassen |
| Originalware | 50 Erz nur aus gefördertem Feld | Das bestehende `shipMine` bucht Förderung und `m_core_erzpilot` verbucht den lokalen bezahlten Ankauf |
| Welt | Seed 42, originaler Regel204-Zustand | Ursprünglicher W1/W3/W4/W5-Kern, Save-Schema 8, Seed-RNG und ursprüngliche Start-Hashes unverändert |

Die Prüfsummen sind **Vorabgrenzen**, keine erfundenen Zahlungen im UI. Der Core berechnet, reserviert und validiert den realen Vorgang. Wenn Originalvorrat, Kaufbudget oder die finale Vertragssituation sich ändern, darf eine Quote erneut scheitern, ohne Mittel zu erzeugen.

## Technische Grenzen und Regressionen

- `prototypes/welt/welt-kern.js`: Beim ausdrücklichen `shipShuttle` eines eigenen Aldera-Miners für `erz` wird die Originalfinanzierung vor dem Start geprüft. Das existierende W1-`shipMine` wird beim Dockzustand wiederverwendet. Alle unveränderten Eis-/NPC-/K7-Befehlsfolgen sollen bitgleiche Originalreferenzen behalten.
- `prototypes/verbund/konzern-session.js`: Ein neuer, nicht persistent gespeicherter J8-Offer-Name; Originaloffer/erneuter Core-Check beim Klick. Keine Spezialschiff-Übertragung, kein eigener Scheduler, kein neuer Save-Schlüssel.
- `prototypes/spiel/p3-manager-disposition.js`, `index.html`, `spiel.js`: dritte, unabhängige Manager-Entscheidung; Originalquote, tatsächlicher Sperrgrund, mindestens 48px Touchziel und weiterhin generischer Förderstopp.
- `tests/m4-u3-house-ore.test.mjs`: realer Seed42-Erzverkauf, Originalhauskasse/-eigentum, Erzlager-/Erlösbelege, unveränderte alte F4-Referenz, 33.000 ISK Weltgeld, 0 Mint/Burn, manipulationsfeste Ablehnung, JSON/Replay.
- `tests/m4-u3-ore-browser.cjs` und eigenständiger Workflow: Root-Navigation → echter Manager-Kauf → Erzangebot → Weltzeit → bezahlter Originalverkauf → Wiederaufnahme; Chromium/WebKit mit 1180×820, 1024×768, 820×1180, 390×844. Separate Workflow-Datei vermeidet die Kollision mit Forschungs-PR #565 am P1-Workflow.
- Wirtschaftliche Langzeitstabilität und W3-Frachterberechtigung **nicht** aus einem bezahlten lokalen Erzauftrag ableiten; 13×90/365-/730-Prüfungen bei tatsächlicher wirtschaftlicher Ausweitung separat auswerten.

## Durch GitHub Actions tatsächlich nachgewiesen

- [M4-U3-Original-Workflow #45004203241](https://github.com/tobiasfranziskus/Check/actions/runs/45004203241): **3/3 Jobs erfolgreich**, der gezielte Node22-Test **2/2**, Chromium und WebKit je vier Touchgrößen. In beiden Browsern ist ein wirklich bezahlter Erzverkauf nach 120 Weltminuten sichtbar: 500 ISK Haus-Bruttoerlös, Hash `2109e1dda33e33a7`. Weltgeld 33.000 ISK, kein Mint/Burn. Global gefördertes Erz im Protokoll: 100, darin auch die unabhängige NPC-Förderung; die Haus-Abnahme ist 50 Erz.
- [W5-RC1 #45004203158](https://github.com/tobiasfranziskus/Check/actions/runs/45004203158): volle Node22-Regression **583/583 bestanden, 0 Fehler und 0 Skips** laut tatsächlichem Job-Log `main-safe-and-all-node22`, iPad-Touch-Preflight erfolgreich. Andere Job-/Workflow-Ergebnisse, einschließlich NAS-Paket-Check, sind separat zu prüfen.
- P1-Chromium/WebKit-Gesamtmatrix und übrige CI dürfen erst als vollständig bestanden dokumentiert werden, wenn ihre Jobs tatsächlich beendet sind. Echtes iPad Safari, privates NAS und der 60-Minuten-Erstspieler-Blindtest bleiben **OFFEN**. 13×90 und 365/730 Tage werden nicht aus einem kurzen Erstverkauf abgeleitet.

## Rückfall / Integration

Branch ungemergt lassen, wenn ein Test- oder Audit-Gate scheitert. Der bestehende Stamm und die Save-Slots bleiben unverändert. Nach vollständigem Node22-, Browser-, Negativ-, Geld-/Waren-/Eigentums- und Referenzhash-Audit einen separaten Integrations-PR gegen den dann aktuellen `main` mit Vorversion-Backup erstellen. Pages-Deploy und echten iPad-Safari-/NAS-Test getrennt nachweisen. Die dokumentarische Statusnachführung #566 und der Blocker #565 bleiben eigenständige Nachweise.
