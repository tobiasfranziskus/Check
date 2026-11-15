# W6 – opt-in in der öffentlichen Spielkarriere (J13b)

**Stand 15.11.2026 · [INTEGRATION IN PRÜFUNG]**. Basis: gefilterte [Core-Integration #398](https://github.com/tobiasfranziskus/Check/pull/398) plus die auf denselben Stand übernommenen J13b-Produktdateien aus [Codex #395](https://github.com/tobiasfranziskus/Check/pull/395), welche separat nach [Integrations-PR #399](https://github.com/tobiasfranziskus/Check/pull/399) gehören. Das ist keine zweite Simulation, kein Offline-Server, keine ungeschützte Save-Migration.

## Spielerweg

Vom öffentlichen Root „Neue Karriere“ → Prolog. Dort gibt es **vor dem eigentlichen Spielstart** eine standardmäßig **nicht** markierte, touch-bedienbare Wahl **„W6: Autonome NPC-Wirtschaft im Testprofil S02 starten“**.

- **Nicht gewählt:** exakt der bisherige Seed42-Regel195→204-Originalstart, unveränderte Originalhashes, bisheriges Verhalten und alte Karrieren.
- **Gewählt:** die originale Regel195-Quelle konvertiert zur selben Regel204-Welt; danach auf dem originalen Zustand die bereits genehmigten, von Core-Audits geschützten API-Aufrufe `politikSetzen({stilllegung:true,betriebsreserve:{werft_extern:1060}})`, `npcAutoSetzen(true)` und `npcSiliziumSetzen(true)`. Der Starter prüft Geld-/Waren-/Eigentum-/Verträge durch `welt.audit` **vor** der ersten lokalen Speicherung. Keine neue Ware oder Geldmenge.
- Der Status „W6 · NPC-Wirtschaft aktiv“ wird ausschließlich aus dem validierten gespeicherten Core-Feld `kanon.npcAuto` und `kanon.npcSilizium.aktiv` angezeigt. Neu laden/Importieren stellt den Wert aus dem autoritativen Save wieder her. Keine versteckte Änderung bestehender Spielstände oder deren Speicher-Slots.

Die früheren P1-Käufe, Frachtersteuerung, F4-Eisfracht, Jägerprojekt und der echte 900-ISK-`house`-Kauf bleiben autorisierte Originalbefehle. NPC-Firmen unterschreiben nur ihre **eigenen** finanzierten Aufträge. `house` erhält keine K7-/Werft-Fremdrechte.

## Betriebs- und Wirtschaftsgrenzen

**Dies ist ein bewusstes S02-Testprofil, kein nachgewiesenes endgültiges W6-Balancing.** Forschungsnachweis P6: nach 8,5 Tagen ein produzierter, rechtmäßig gekaufter Jäger; bis Tag90 zwei Jäger, 93 bezahlte Ersatzkäufe, reale Eis-/Wasserkäufe und 33.000 ISK ohne Mint/Burn. Das 16-Einheiten-Siliziumvorkommen ist danach ausgeschöpft. Acht andere wirtschaftliche 90-Tage-Regime zeigen echte Krisen bzw. Stillstände. Kein heimlicher Abnehmer, Refill, Exportgeld oder Rettungs-ISK. Ein Spieler darf weiterhin unbegrenzt sparen.

## Neue Prüfpflichten für UI-Integration

- `tests/w6-p1-optin-karriere.test.mjs`: authentischer Regel195→204-Neustart mit und ohne W6, Originalhash, Geld- und Waren-Audit, getrennte Pilot-Eigentümer, Tag1-Replay, JSON-Save/Load, manipulierte W6-Option wird abgewiesen.
- `tests/p1-spielstart-browser.cjs`: regulärer sichtbarer Startknopf, Touch-Checkbox (mindestens 72px), tatsächlicher neuer S02-Start, Original-Core-Audit und tatsächlicher Weltzeitfortschritt, Reload ohne Veränderung des gespeicherten Zustands; Chromium und WebKit je vier Touchgrößen.
- Gesamte Node22-Vollsuite einschließlich 13×90, P6/90, Manipulationsfälle und Original-Referenzhashes; Root-/NAS-Singlefile-Prüfung, separat abschließender Integrations-CI-Lauf.
- Echtes iPad Safari und privater NAS weiterhin **nicht** im CI verifizierbar. Vor jeder `main`-Integration ist der vorherige Stand auf `backup/main-before-j13b-and-w6-20261115` gesichert. `main` und Pages-Deploy sind gesonderte Nachweise.

**Prüfstatus bei Erstellung: noch offen, keine Erfolgsmeldung vor konkretem CI-Nachweis.**
