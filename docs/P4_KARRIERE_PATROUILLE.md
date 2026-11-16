# P4 – Jägerpatrouille in der P1-Karriere [MAIN / PAGES]

**[MAIN]** Nachfolger des inkompatiblen Draft #431: [PR #433](https://github.com/tobiasfranziskus/Check/pull/433) gemergt als `edb69cd4a6d77b5deaaa5f245b7fd0b2c24a414c`, Vorversion [`backup/main-before-p4-jaegerpatrouille-20261116`](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-p4-jaegerpatrouille-20261116) erhalten. **[PAGES]** [Deploy #43886927310](https://github.com/tobiasfranziskus/Check/actions/runs/43886927310) completed/success für genau dieses `main`. W6-Regel207 bleibt separat und wurde nicht verändert.

## Neuer Spielerpfad

1. Normale öffentliche Karriere `prototypes/spiel/index.html` beginnen oder legalen Regel204-Karrierestand fortsetzen.
2. Den Jäger ausschließlich über die vorhandene Nadir-Werft mit 900 echten ISK kaufen; ohne fertige und finanzierte Hülle bleibt der Kauf gesperrt. Keine Testschiffe im Produkt erzeugen.
3. Unter „Meine Flotte“ den eigenen Jäger am **Nadir-Dock** übernehmen. Im originalen RAUM-Cockpit „Patrouille beginnen“ wählen.
4. Original finanziertes Abdocken, **drei reale F6-Flugpositionen** mit maximal 300 P/s durchfliegen (Alpha, Beta, Gamma), anschließend am Originaldock Nadir andocken. Bestehende Zielkarte, Joystick, Handübernahme und 1×/10×/60×/300× bleiben benutzbar.
5. Im HUD erscheint der Patrouillenfortschritt. Kein Trainingsertrag, keine zusätzliche ISK-Emission, Waren-, Schadens-, Waffen- oder Missionsregel.

## Technischer Zuschnitt

- Verwendet unverändert den schon existierenden `J4dPatrouille`-Beobachter (separates J4c-Training); die Karriere öffnet **keinen zweiten Regelkern**.
- Die bisherige `J8KonzernSitzung.flugSchritte` liefert optional pro Originalsekunde einen tief eingefrorenen Minimalbeleg mit Zeit, Originalschiffkörper und nachgewiesenen Kaufeinträgen. Kein öffentlich mutierbarer Weltzustand als Callback-Argument; ohne Beobachter ist der ursprüngliche Kernpfad identisch.
- Das Patrouillenjournal existiert **nur in der laufenden Browser-Sitzung**. Reload/JSON-Import setzt es absichtlich zurück; bestehende Schemas, Saves, Kassen, Regeln und Referenzhashes bleiben unverändert.
- Bei ungültigem Ziel, falschem Eigentum, nicht finanzierter Jägerhülle, falschem Dock, Zeitlücke oder unerlaubter Geschwindigkeitsüberschreitung keine Missionsfreigabe.
- Die inzwischen veröffentlichte W6-Regel207-Forschung (PR #430) bleibt unverändert; die Patrouille gilt ausschließlich für legal gekaufte Jäger der regulären Regel204-Karriere.

## Abnahmekriterien

- Node22 vollständig: `node --test tests/*.test.mjs`, dazu `tests/p4-karriere-patrouille.test.mjs`. Original-Karriere mit und ohne Flugbeobachter muss **bytegleichen JSON-Save/Hash** und **Mint/Burn 0** ergeben; Manipulation der Beobachterprobe muss abgewiesen werden.
- P1-CI mit Chromium/WebKit je vier Touchgrößen, echter Miner-/Fracht- und Save/Import/Export-Regression; Browserpfad mit gekauftem Jäger/Patrouille als **zusätzlicher positiver End-to-End-Nachweis erforderlich**, bevor Produktintegration freigegeben wird.
- Root-/NAS-Einzeldatei-Buildcheck, Wirtschaftsaudits und Alt-Spielstände beibehalten. Echte iPad-Safari- und private NAS-Tests weiterhin offen.

**[GEPRÜFT / PR-HEAD `eb71814a`]** Sieben GitHub-PR-CI-Workflows completed/success: [P1 Node22 und Chromium/WebKit mit je vier Touchgrößen](https://github.com/tobiasfranziskus/Check/actions/runs/43886165863), [vollständige JS-Wirtschaftsregression](https://github.com/tobiasfranziskus/Check/actions/runs/43886165868) einschließlich realem 900-ISK-Jäger, allen drei physischen Kontrollpunkten, Originaldock, Audit und Save, [J4e Spieltest](https://github.com/tobiasfranziskus/Check/actions/runs/43886165791), W5-RC1, J14, W6/P8a und W6/P8g. Bedingt übersprungene Tests bleiben ausdrücklich nicht als bestanden gezählt. **[PAGES]** GitHub Pages für exakt `main edb69cd4` erfolgreich. Kein echter iPad-/NAS-Test.