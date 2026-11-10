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

## W5v – originale Finanzierungs- und Kaufvorschau (eigener Draft)

Unter **Handeln** und **In Dienst stellen** prüft die Oberfläche jetzt die
geplante Aktion vollständig auf einem **separat validierten Original-Core-Zustand**.
Sie zeigt, ob der Befehl jetzt zulässig wäre, das genaue Sofort-Cash-Delta
einschließlich vom Core berechneter Gebühren, betroffene Warenbestände oder
den echten Ablehnungsgrund. Die Ansicht verändert weder Spielzeit, Seed/RNG,
Geld, Waren noch produktive Save-Slots; eine erfolgreiche Vorschau **reserviert
nichts**. Beim eigentlichen Klick prüft der Original-Core alles erneut.

Beispiel: Ein Miner-Kauf zeigt die vollständige sofortige Konto- und
Ladungsänderung; nach tatsächlichem Kauf lässt sich die Hülle nochmals separat
als eigene Schiffsinbetriebnahme mit Vorschau prüfen. Es handelt sich weiter
ausschließlich um **Regel 14 / Schema 8** und eine **isolierte Forschungswelt**.
Die C1d-11-Investitionsquote und Regeln 3313/3314 sind hier **nicht integriert**.
Zukünftige Löhne, Dividenden, langfristige Gewinne und W5-Werftaufträge
können deshalb nicht vorab berechnet werden. Tests:
`node --test tests/w5v-finance-preview.test.mjs` plus reguläre W5u-Tests
und Touch-/Save-Prüfungen. Echte Safari-/NAS-Abnahme offen.
