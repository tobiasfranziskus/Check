# P4 – Jägerpatrouille in der P1-Karriere [DRAFT]

**Basis:** main `feda85dc4a7ccb3544756c63b5dfc3235cf6df0f` (16.11.2026). Kein Merge/Deploy bis zum unabhängigen Integrationsgate. Maßgeblich bleiben `docs/ROADMAP.md`, `AGENTS.md` und die Originalwirtschaft Regel204.

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
- W6-P8g-Branches #425/#428/#429 und deren noch ausstehende Sicherheitsabnahme sind ausdrücklich **nicht** Teil dieser Gameplay-PR.

## Abnahmekriterien

- Node22 vollständig: `node --test tests/*.test.mjs`, dazu `tests/p4-karriere-patrouille.test.mjs`. Original-Karriere mit und ohne Flugbeobachter muss **bytegleichen JSON-Save/Hash** und **Mint/Burn 0** ergeben; Manipulation der Beobachterprobe muss abgewiesen werden.
- P1-CI mit Chromium/WebKit je vier Touchgrößen, echter Miner-/Fracht- und Save/Import/Export-Regression; Browserpfad mit gekauftem Jäger/Patrouille als **zusätzlicher positiver End-to-End-Nachweis erforderlich**, bevor Produktintegration freigegeben wird.
- Root-/NAS-Einzeldatei-Buildcheck, Wirtschaftsaudits und Alt-Spielstände beibehalten. Echte iPad-Safari- und private NAS-Tests weiterhin offen.

**Status bei Erstellung:** Code und Tests im Branch vorhanden; alle neu eingeführten Prüfungen und vollständige Abnahme gelten bis zu ihren tatsächlichen CI-Ergebnissen als **offen**, nicht als bestanden.