# K13 + F6 – gemeinsamer Forschungs-Spielkern

**[DRAFT / Integrationsversuch · 13.11.2026]** Basis K13 [#328](https://github.com/tobiasfranziskus/Check/pull/328), selektive Übernahme der Spielbarkeit aus F3–F6 [#318](https://github.com/tobiasfranziskus/Check/pull/318)–[#321](https://github.com/tobiasfranziskus/Check/pull/321).

## Ergebnis des ersten Entwicklungsschritts

- Ein Weltzustand: K7/Regel200 nutzt die isolierte K1-/K7-Quelle `prototypes/welt/rule200-k7-industry-core.js`; F6 ergänzt diesen getrennten Forschungskern um den selbst finanzierten Spielerfrachter, echte 2D-Steuerung im Transit und die Torfreigabe.
- Ein Tick: Nach dem ursprünglichen `kern.step` folgen F6-Spielerfracht-Lohnabrechnung und K7-Vertragsstatus. Zusätzliche Flugsteuerung erzeugt keinen zweiten wirtschaftlichen Tick.
- Das bestehende Touch-Cockpit `prototypes/welt/index.html` lädt nun ebenfalls die isolierte Regel199/200-Quelle und bleibt zunächst im standardmäßigen Regel199-Profil. K7 wird ausschließlich über `Welt.erstellenK7()` aktiviert. Die Browser-Oberfläche für die gesamte K7-Industrie und einen eigenen, eindeutig getrennten Save-Ursprung ist **noch nicht umgesetzt**.
- Vorhandene Regel195-Produktdateien (`index.html`, `aphros-void.html`) und Original-W5-Source (`prototypes/w5ac/rule191-w5-ferry-core.js`) bleiben gegenüber `main 04124f2b` unverändert. Keine Migration und kein Deployment.
- K13-Kundenvorschuss und Eigentümereinlage bleiben **[OPTION / ANALYSE]** in ihrem getrennten Forschungsadapter; keine Finanzierungsvorgabe, keine heimliche automatische Entnahme aus Privatkonten.

## Konfliktauflösung

Der F6-Forschungszweig enthielt Anpassungen in einer mit Regel195 geteilten Datei. Diese Anpassungen werden **nur in die K7-isolierte Quellkopie** übertragen. Bei gemeinsamen W3-/W4-/W5-Audits bleiben die speziellen K7-Storno-/Treuhandkorrekturen erhalten, während der tatsächlich vom Spieler bezahlte Frachterkauf aus der Speditions-Bilanz herausgerechnet wird.

## Qualitätssicherung

- Neue Node-Integration: `tests/k13-f6-gemeinsamer-spielkern.test.mjs` prüft Rule200 + F6-Funktionen, Startaudit, Weltgeld, Replay, Hash und Save/Load sowie explizite Regel199-Abgrenzung.
- Alle Original-`tests/*.test.mjs`, K7–K13-Wirtschaftstestgruppen, 15×90-, 5×365- und 2×730-Tage-Szenarien, die W5-Einzeldatei-Buildprüfung und neun F6-Browsertests sind im K1-Workflow vorgesehen.
- Bis zu einem tatsächlich abgeschlossenen Lauf **keine** dieser neuen Integrationsprüfungen als bestanden werten.
- Negative Befunde dokumentieren; keine pauschale Rettung und keine Referenzhashanpassung nur für grünes CI.

## Weiterer Integrationsschritt

Erst nach einem grünen gemeinsamen Core-Gate: eigene K7-Spieltest-Oberfläche mit vom K1-Browser isoliertem Speicher, echten autorisierten Konzern-/NPC-Verträgen, persönlich finanziertem Bergbau und Fracht bis zum Produktions-/W5-Kaufabschluss. Danach End-to-End-Geld-/Waren-/Eigentumsprüfung und Touchabnahme. Keine automatische Regel200-Produktfreigabe.

Offen: echte iPad-Safari-/NAS-Geräteabnahme, reale navigationsabhängige Nadir-Ankunft, nachhaltiges W6-Endkundengeld, Beschluss zu K13-Finanzierungsoptionen.
