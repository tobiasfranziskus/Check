# Bergbauscanner · isolierte Vorschau

`index.html` direkt öffnen oder diesen Ordner mit einem beliebigen statischen
HTTP-Server ausliefern. Keine Installation, Build, CDN oder Backend erforderlich.
Der Einstieg lädt ausschließlich die ausdrücklich markierte Demonstration.

Für einen Host: `scanner.css` und `scanner.js` laden, dann:

```js
const scanner = LegacyMiningScanner.mount(root, snapshot);
scanner.update(nextSnapshot); // vollständiger Ersatz, keine Zusammenführung
scanner.destroy();           // mehrfach sicher; update danach wirkungslos
```

`root` ist ein DOM-Element. Die Instanz ergänzt darin ihren eigenen Teilbaum;
`destroy()` entfernt nur diesen. Mehrere Instanzen sind unabhängig. Eingaben
werden auf bekannte Felder projiziert, nicht mutiert und nicht als Referenzen
behalten. `update()` erhält Auswahl anhand eindeutiger ID sowie Listenfokus und
Scrollposition; bei entfernter Auswahl wird diese zurückgesetzt. Keine Timer,
Core-Befehle, Netzabfragen, Speicherzugriffe oder simulierte Weltzeit.

## Snapshot-Vertrag v1

Alle Felder optional. Fehlend/null/ungültig bedeutet **nicht bekannt**, niemals 0.
Arrays `[]` bedeuten ausdrücklich keine vorhandenen/bekannten Einträge.

```js
{
  name: 'Sektorname',
  demonstration: false, // true für sämtliche Beispielwelten zwingend
  asteroids: [{
    id: 'core-id', name: 'Asteroid',
    position: {x: 100, y: -40},
    distance: 300, distanceUnit: 'm',
    resources: [{name: 'Erz', amount: 0, unit: 't'}],
    status: 'Gemeldeter Abbaustatus',
    security: 'Gemeldete Sicherheitszone',
    hazards: ['Bereits bekannte Meldung']
  }],
  fields: [{name: 'Abbaugebiet', position: {x: 0, y: 0}, radius: 200,
    resources: [{name: 'Erz'}], security: 'Meldung', hazards: []}],
  zones: [{name: 'Sicherheitszone', position: {x: 0, y: 0}, radius: 400,
    security: 'Meldung', hazards: []}]
}
```

Positionen müssen endliche Zahlen in ±1e9 sein; alle anderen numerischen Felder
endliche, nichtnegative Zahlen. Texte werden als Text ausgegeben. Es gibt keine
Rohstoff-Whitelist, Qualitätszuordnung oder Preis-/Ertragsberechnung. Die Karte
zeigt alle Asteroiden gleich groß; die Liste/Details zeigen übergebene Rohstoffe.
Entfernungen werden ausschließlich aus `distance` angezeigt, niemals aus der Karte
berechnet. `radius` bezeichnet nur eine übergebene Kreisfläche in denselben
Koordinaten wie `position`. Keine Gebietszuteilung durch Geometrie. Fehlender
Radius: nur Mittelpunkt; fehlende Position: nur Text/Liste. Fehlende IDs erhalten
lokale Index-IDs; für stabile Auswahl über Updates muss der Host eindeutige,
stabile IDs liefern. Doppelte resultierende Asteroiden-IDs werden abgelehnt,
ein fehlgeschlagenes Update lässt die letzte gültige Ansicht erhalten.

Die Karte passt die verfügbaren Koordinaten automatisch ein, ohne Flugkamera,
Zoom/Pinch, Radarreichweite oder Scan-Aktion. Ein Tap bis 10px Bewegung wählt den
nächsten Asteroiden innerhalb 24 CSS-Pixeln aus; Gleichstand nach Snapshot-Reihenfolge.
Scrollen, Abbruch und Mehrfingerkontakt wählen nichts. Überlagerte oder
positionslose Objekte bleiben über mindestens 48px hohe Listenbuttons erreichbar.
Die Karte ersetzt keinen geographisch vermessenen Radar und keinen Core.

## Tests

Im Repository mit Node 22:

```sh
node --test tests/*.test.mjs
node --test --experimental-test-isolation=none tests/*.test.mjs
PLAYWRIGHT_MODULE=/pfad/zu/playwright node tests/browser/legacy-mining-scanner.cjs
```

Chromium-Pfad optional per `CHROMIUM_PATH`. Playwright ist ein externes
Entwicklungswerkzeug, keine Projektabhängigkeit. Der Browsertest startet selbst
einen temporären, nur auf Loopback erreichbaren statischen Server.

Herkunft, Prüfergebnisse und spätere Integrationsgates:
[Übernahmebericht](../../docs/LEGACY_MINING_SCANNER_UEBERNAHME.md).
