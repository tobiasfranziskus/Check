# Flug2D F0 – unabhängige Prüfnotiz zur Claude-Forschung

**[ANALYSE / NICHT INTEGRIERT · 10.11.2026]**

Quellbranch: `claude/inspiring-galileo-0d2mek` / `8deaab072c55308caa422a7724990ae2aa608c18` gegen den unveränderten veröffentlichten `main 7374b29e48d1279dc4c63497b2103b8ba41240b6`. Dieser separate unabhängige Review-Branch fügt **nur diese Prüfnotiz und einen CI-Workflow** zu Claudes isoliertem Prototyp hinzu. Claude hat die neue Flugkinematik in `prototypes/flug2d/` und den detaillierten Entwurf in `docs/FLUG2D_INTEGRATIONSENTWURF.md` geliefert; die beiden produktiven Einzeldateien, Regel195, NPC-Wirtschaft, Pilotenkassen und vorhandene Browser-Spielstände sind unberührt. W6a-Draft #288 und Codex-Speicher-Draft #289 sind **nicht** Teil dieses Branches.

## Begutachtete positive Eigenschaften

- Eindeutige 60 Flugteilschritte pro Original-Wirtschaftsminute; die Sandbox darf **keine zweite echte Wirtschaftsuhr** werden.
- Derselbe geprüfte Flugbefehl für Spieler und NPC; deterministische Ganzzahl-Kinematik, keine Fluggüter, kein Treibstoff, keine neue Geldschöpfung oder Fluglohnmechanik.
- Strenge Befehls- und Flugaudit-Prüfung, optionales Flugfeld mit Datenvertrag, separate Referenzhash-Kette und Save/Load mitten im Flug bzw. Andocken.
- Touch-Multifinger-Bedienung ist im Code bedacht (`pointerup` auch bei gehaltenem Joystick); iPad-/WebKit-Nachweis fehlt.

## Kritische Integrationsgates vor Regel196 und erstem W5-Frachter-/Minerbetrieb

1. **Prototyp bleibt F0.** Die Sandbox besitzt bewusst einen eigenen *reinen Flugszene-Zustand ohne Wirtschaft*. Sie ist nur ein isolierter Rechenkern zum Nachbau **innerhalb** des existierenden Originalcores – niemals dauerhaft als zweite Welt und nie mit eigenen Geld-, Lager- oder Wirtschaftsfortschritten betreiben. Auch der F0-NPC-Auftragsplaner ist aktuell ein Demonstrator.
2. **Zeit-/Leistungshaushalt:** 60 Teilschritte pro `advance(1)` sind bei 13×90 Spieltagen und einer großen NPC-Flotte viele Millionen Integratorschritte. Eine unabhängige 13×90-Benchmark-/Auditprüfung ist vor der Ortskopplung nötig. Die geplante Ausnahme von vollständiger Session-Validierung je Flugschritt darf **keinen ungeprüften Zustandsimport, Befehlsbesitzerwechsel oder manipulierten Zustand** zulassen. Regel195 muss bitgleich bleiben.
3. **Pflicht-Fly-Audit im künftigen Forschungsprofil:** Der F0-Audit akzeptiert fehlende `ship.flug`-Felder absichtlich. Für alle in Regel196 aktiven Miner/NPC müssen fehlende, fremde, negative oder manipulierte Flugfelder bei Save/Load zuverlässig abgewiesen werden. `phase:'reise'` und `flug.lage:'transit'` müssen mit echten W3-/W5-Frachtminuten übereinstimmen. Optionales Feld und gleiche Schema8-Zahl bedeuten **nicht automatisch** sichere Regel195→196-Migration.
4. **Erz-/Eis-Lieferung und Treuhand:** Ortsbedingungen dürfen weder bereits verdiente Förder-/Piloten-/Frachtlöhne zurückerstatten noch Auftraggeberbeträge zweimal buchen. Bei `shipWait` im Raum darf allenfalls **unverbrauchte** Treuhand mit exakten Eigentumsbelegen freigegeben werden; die physische Ladung bleibt Eigentum, bis am gültigen Ort gehandelt wird. Kein kostenloser Zwangskauf und keine unbezahlten Anflüge als rechtlich neue Leistung.
5. **Echtzeit und Browser-Saves:** F0 verwendet `requestAnimationFrame` nur als Darstellungs-/Schrittgeber. Beim späteren Einbau muss jeder Eingabebefehl an den Core-Flugschrittindex gebunden und Pause/Wiederanlauf deterministisch sein. Codex-Draft [#289](https://github.com/tobiasfranziskus/Check/pull/289) für Regel195-Autosaves ist unabhängig und sollte **zuerst** seine aktuell noch offene GitHub-Touch-CI beheben, bevor das Flugprofil eine neue Speicherhülle bekommt.
6. **Separate Regelentscheidung:** E1 (3 s je Spielminute), E2 (Geografie/Klassenwerte), E3 (Vertragsabbruch), E4 (Fluglohn), E5 (Frachtzeiten) und E7 (Save-Migration) bleiben [OPTION]. Die Forschung setzt weder Regel196 noch ihre ökonomischen Effekte bereits in Kraft. Die Aussage „~29 % weniger Durchsatz“ ist eine plausible **Forschungsabschätzung, kein unabhängiger 13×90-Wirtschaftsnachweis**.
7. **Gerätetest erforderlich:** Der feste F0-Referenzhash `e2674c1ef11678ba` ist auf einem echten iPad Safari in der Sandbox zu prüfen, neben Multifinger, Hoch-/Querformat, Tastatur, JSON-Dateien und NAS-HTTP(S). Chromium ist keine WebKit-Abnahme.

## Abnahme dieses Review-PRs

Workflow `.github/workflows/flug2d-f0-independent.yml` muss **tatsächlich** abschließen: eigenständiger Flugkern-Node22-Test, gesamte Node22-Regression, deterministischer Singlefile-Check und realer Chromium-Touch mit vier Ansichtsgrößen einschließlich Replay/Export/Import. Playwright wird nur im GitHub-CI-Runner installiert, **nicht im Produkt und nicht auf dem NAS**. Die bisherigen Tests/Referenzhashes bleiben vollständig erhalten.

**Teststand:** Claude berichtet lokal 217/217 Node und 4/4 Touch; die unabhängige GitHub-CI ist bei Anlage dieses Branches **noch nicht gelaufen**. Erst CI-Ergebnisse am tatsächlichen Review-Commit nachtragen. Kein Merge oder Deployment.
