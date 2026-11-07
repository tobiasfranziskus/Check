# W5u · isolierte Forschungswelt

Repository statisch per HTTP(S) ausliefern und `prototypes/w5u/index.html` öffnen.
Kein Build, npm, Backend oder CDN erforderlich. Start: Seed 42, pausiert,
Originalregeln 14 / Schema 8 der W5t-Basis. Nur explizite Minutenschritte laufen.

Konzernzentrale, Flotte, Station, Werft und 2D verwenden dieselbe Core-Sitzung.
Ein eigenes Schiff im globalen Auswahlfeld oder HQ-Flottenreiter wählen.
Kauf über Warenhandel (auch Hüllen), danach ausdrücklich aus der Bordladung in
Dienst stellen. Der Core kann jeden Befehl wegen Standort, Geld, Reserve,
Bestand oder Rolle ablehnen. Keine direkten Bau-/Modul-/Jägerbefehle angebunden.

JSON exportieren, bevor Reload oder Import den Sitzungsspeicher ersetzt.
Keine automatische Speicherung; keine produktiven Slots werden gelesen.
Nur unveränderte Regel 14 / Schema 8 mit erfolgreichem Core-Load und Audit wird
importiert. W5t-Regel-32-Referenzdateien werden abgelehnt.

Prüfen mit Node 22: `node --test tests/*.test.mjs` im Repository.
Entwicklungswerkzeuge für Browserprüfung: Python Playwright und Chromium;
`python tests/w5u-touch.py`. Kein Teil der Spiel-Laufzeit.

[Integrationsvertrag und Befunde](../../docs/W5U_INTEGRATION.md).
