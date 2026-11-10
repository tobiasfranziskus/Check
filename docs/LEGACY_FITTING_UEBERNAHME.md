# Legacy-Fitting – unabhängige UI-Extraktion

Status: **DRAFT / UI-PROTOTYP**, 05.11.2026. Basis ausschließlich
`main b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, Regel 14 / Schema 8.
Branch: `codex/legacy-fitting-ui-extraktion`. Keine Produktintegration,
kein Merge, kein Deployment, keine wirtschaftliche Freigabe.

## Start und Bedienung

`prototypes/legacy-fitting/index.html` im Browser öffnen. Klassische lokale
Scripts mit `defer`, relative Pfade, keine Module-Imports, kein Build,
keine Bibliothek, kein CDN und kein Backend. Alternativ aus dem Repository
`python3 -m http.server 8000` starten und
`http://localhost:8000/prototypes/legacy-fitting/` öffnen. Python ist nur ein
optionaler Entwicklungsserver; auf dem NAS genügt statische HTTP-Auslieferung.

Ausrüstungsplatz antippen, Größe filtern, Modul antippen und Vergleich lesen.
Gesperrte Optionen sind absichtlich inspizierbar. Auswahl ist kein Einbau.
Ein Platzwechsel löscht die Modulauswahl; der Größenfilter bleibt bestehen.
Alle Größen sind standardmäßig sichtbar. S/M/L müssen im Prototyp exakt zum
Platz passen; das ist eine explizite Vorschaukonvention, keine neue W5-Regel.
MK1–MK3 sind Datenmerkmale und keine vom UI erzeugten Freischaltungen.

Vier aktive Kategorien: Laser, Bergbau, Nachbrenner, Schildverstärker.
Drei passive Kategorien: Batterie, Radar, Frachtraumerweiterung.
63 Katalogobjekte decken jede Kombination aus Kategorie, Größe und MK ab.
Ein Schildplatz ist absichtlich leer, MK2 zeigt fehlende Beispielvoraussetzungen,
MK3 zusätzlich fehlenden Beispielbestand. Jede Variante ist als Vorschauobjekt
gekennzeichnet. **Auch die Laserzahlen sind frei erfundene Fixtures**, keine
Übertragung von W5h-Schaden oder Energie. Größen verwenden bewusst dieselben
Illustrationswerte, keine versteckte Skalierung oder Balancebehauptung.

## Quellen und Übernahmegrenze

Gelesene Referenzen im unveränderten Quellrepository
[tobiasfranziskus/void-echoes, a8e2e36](https://github.com/tobiasfranziskus/void-echoes/tree/a8e2e36):

| Legacy-Datei | Wiederverwendetes Muster | Bewusst entfallen |
| --- | --- | --- |
| `src/script/380-ux07-fitting.js` | Schiffsbild, 4+3 Plätze, getrennte Auswahl, Vorher/Nachher, Differenz und Bewertungsrichtung | `SF`, Welt-/Hostkopplung, Quotes, Installieren, Kaufen, Aufrüsten, Versicherung |
| `src/script/300-ve10-05-gegenstaende.js` | Kategorie/Größe/MK, beschriftete Werte, fehlende Werte, Vergleich zum Einbau | `moduleStats`, `batteryStats`, `veCycle`, Funktionsquelltext-Parsing, Core-Monkeypatches, Rezepte und Preise |
| `src/script/290-ve08g-03-pilotansicht.js` | Trennung von Voraussetzungen, Besitz und Ausrüstung; gesperrte Karten inspizierbar | Pilotenprofile, XP-/Skillregeln, NAS-Anmeldung, bestehende Spielnavigation |
| `src/script/350-ve10-ux04-erklaerungen.js` | Erklärungen führen keine Spielaktion aus; native aufklappbare Hilfe | globales Lexikon, Tutorialzustand und Menü-Wrapper |

Die Oberfläche ist eine neue, kleine Umsetzung dieser Darstellungsmuster.
Keine ausführbare Legacy-Datei, Alt-Sprites oder Altformeln werden eingebunden.
Das Schiffsbild ist eine neue schematische SVG-Zeichnung, keine W5-Schiffsklasse.

`AGENTS.md`, `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md` und der bestehende
Touch-Testbericht wurden berücksichtigt: wirtschaftliche Gates gehen einer
produktiven Modulnutzung voraus. Historische Dokumentstände sind keine W5-Freigabe.
W5h-Branchstruktur und `prototypes/w5-welt/w5h.mjs` wurden nur lesend geprüft;
dortige Core-Lade-/Sitzungs-/Speicherwege werden nicht übernommen. W5i wird weder
importiert noch verändert. Die Extraktion hängt von keinem W5-Branch ab.
Roadmap und Projektstatus bleiben auf ausdrückliche Auftragsvorgabe unverändert;
dieser Bericht trägt den eigenständigen Draft- und Integrationsstatus.

## Schnittstelle und Datengrenze

- `model.js` / `m_ui_fitting_modell`: Datenprüfung, lokale Auswahl und reine
  Vergleichsprojektion. Keine Simulation, keine DOM-Abhängigkeit.
- `examples.js` / `m_data_fitting_beispiel`: JSON-kompatibler Beispielsnapshot.
  Fertige Werte werden tabellarisch vorgegeben. Keine Wirtschaftsberechnung.
- `view.js` / `m_ui_fitting_ansicht`: `mount(rootElement, snapshot)` erstellt eine
  neue Ansicht. `details` und `tabelle` sind separat prüfbare Darstellungsfunktionen.
- `style.css`: Touchflächen mindestens 48 CSS-Pixel, native Auswahl/Hilfe,
  Safe-Area-Padding, drei/zwei/eine Spalte je Breite, sichtbarer Tastaturfokus.

Ein Snapshot hat folgende Felder (vollständiges Beispiel in `examples.js`):

```js
{
  revision: 'snapshot-id',
  schiff: { id: 'stabile-id', name: 'Anzeigename', groesse: 'S', plaetze: [
    { id: 'platz-laser', kategorie: 'laser', groesse: 'S', modulId: 'laser-S-MK1' }
  ] },
  module: [
    { id: 'laser-S-MK1', name: 'Laser S MK1', kategorie: 'laser',
      groesse: 'S', mk: 1, vorschauobjekt: true, bestand: 1,
      fehlendeVoraussetzungen: [] }
  ],
  werte: [{ key: 'laser', label: 'Laserschaden / Zyklus', einheit: 'Punkte', besser: 1 }],
  aktuelleWerte: { laser: 12 },
  vorschauen: { 'laser-S-MK1': { laser: 12 } }
}
```

`vorschauen[id]` ist der **vollständige absolute Schiffs-Wertesnapshot nach genau
einem hypothetischen Austausch**, berechnet vom Datenlieferanten. Es ist kein
Modulbonus, den das UI addiert. Jede Vorschau muss denselben Ausgangszustand
verwenden. Im aktuellen Vertrag gibt es genau einen Platz pro Kategorie; bei
mehreren gleichartigen Plätzen muss die Vorschau später nach Platz-ID **und**
Modul-ID adressiert werden. Das benötigt eine explizite Adaptererweiterung.

Das UI berechnet ausschließlich die numerische Differenz Nachher minus Vorher
(auf sechs Dezimalstellen) und ihre Richtung (`besser: -1` für kleinere Werte).
Keine Schätzungen aus Größe, Stufe oder Namen. Fehlende, nicht numerische oder
nicht endliche Werte sind „Nicht verfügbar“, niemals still Null. Inkompatible
Kandidaten erhalten keinen Nachhervergleich; fehlende Voraussetzungen/Bestände
lassen einen klar als hypothetisch beschrifteten Vergleich zu.

`starten(snapshot)` kopiert JSON-Daten vor der Verwendung. `platzWaehlen(id)`,
`modulWaehlen(id)` und `ansicht()` betreffen nur den lokalen Präsentationszustand.
Der Eingabesnapshot bleibt unverändert, auch bei tief eingefrorenem Input.
`daten` ist die eigene Ansichtskopie, kein schreibbarer Verweis auf den Core.
Kein Fetch, keine Speicherung, keine IndexedDB, kein LocalStorage, keine
Spielbefehle oder Ereignisse mit Buchungswirkung. Text wird vor HTML-Ausgabe escaped.

## Offene Core-Integration

1. Autoritativer W5-Adapter liefert stabile IDs, Revision, bestätigte Einbauten,
   Besitz/Standort und konkrete fehlende Voraussetzungen aus demselben Snapshot.
   Die Beispiel-Texte und Beispielbestände vollständig ersetzen.
2. Fertige aktuelle und hypothetische Werte ausschließlich durch eine reine
   Core-Abfrage liefern; Energie, Schaden, Frachtraum und Skillwirkungen nicht im UI
   nachbauen. Fehlende aktive/passive Kennzahlen ausdrücklich als fehlend liefern.
3. Konkrete Größenkompatibilität, Slotmodell und produktiv freigegebene Kategorien
   fachlich entscheiden. Aktuelle 4+3-Plätze sind UI-Demonstration.
4. Snapshotwechsel müssen Auswahl/Filter bewusst erhalten oder zurücksetzen;
   diese einmalig gemountete Demo hat keinen Tick- oder Refreshadapter. Pro Root
   nur einmal mounten; erneute Einbindung benötigt einen Mount-/Unmount-Lebenszyklus.
5. Etwaige spätere Kauf-/Einbaubefehle separat beauftragen und im autoritativen
   Core erneut validieren, inklusive Revision, Eigentum, Andocken, Bestand,
   Voraussetzungen und atomarer Material-/Geldflüsse. Die vorliegende Schnittstelle
   bietet absichtlich keinen Command-Callback und keine Einbaubestätigung.
6. W5i und nachfolgende Wirtschaftsarbeiten abschließen und getrennt freigeben;
   Save-/Audit-/Regressionsgates und reale Safari-/NAS-Prüfung vor Integration.

## Tatsächlich ausgeführte Abnahme

Node.js **22.23.4**, Pflichtbefehl `node --test tests/*.test.mjs`: **9/9
Dateisuiten bestanden**, keine Fehler/Skips. Zusätzlich jede Datei direkt mit
Node ausgeführt, damit die tatsächlichen Einzeltests sichtbar sind: **76/76**,
davon **67 bestehende** und **9 neue**, 0 Fehler, 0 übersprungen.

Die neuen Tests decken alle Größenpaare, alle 63 Varianten, Auswahl/Platzwechsel,
fehlende Voraussetzungen/Bestände, unbekannte IDs, leere/unbekannte Einbauten,
fehlende Vergleichswerte, bessere/schlechtere/unveränderte Differenzen,
Escaping und unveränderten tief eingefrorenen Eingabestatus ab. Auch spätere
Änderungen des Aufrufers ändern die kopierte Ansicht nicht.

Playwright mit installiertem **Chromium**, lokaler statischer HTTP-Auslieferung,
Touch-Emulation: **1180×820, 1024×768, 820×1180, 390×844**, alle erfolgreich.
Geprüft: sieben Plätze, neun Kandidaten pro Kategorie, Größenfilter auf drei,
Touch-Auswahl, MK2-/MK3-Sperren, inkompatible Größe, Radar-Vergleich mit negativer
Differenz als Verbesserung, leerer Schildplatz, Fokus nach Neuzeichnen, native
Hilfe, mindestens 48px hohe Buttons/Select/Summary, kein horizontaler Seitenüberlauf,
keine JavaScript-Seitenfehler und unveränderter Eingabesnapshot. Screenshots in
`/tmp/legacy-fitting-<Breite>x<Höhe>.png` sind lokale Prüfarbeitsdateien, kein
Deployment oder dauerhafter Repository-Nachweis. Querformat-Screenshot visuell geprüft.

**Offen:** echte iPad-Safari-Abnahme mit physischem Touch, Hoch-/Querformat,
dynamischer Toolbar, Safe Areas, VoiceOver und gegebenenfalls Tastatur; tatsächliche
NAS-Auslieferung. Kein WebKit-Test ausgeführt. Die Chromium-Emulation ersetzt
keine Safari-Abnahme. Direktes Dateiöffnen nutzt klassische Scripts, wurde hier
wegen der Browser-Datei-Policy nicht als Browserpfad abgenommen; HTTP wurde geprüft.
Keine neuen Langzeit-Wirtschaftsläufe erforderlich oder ausgeführt, da der Core
unverändert bleibt. Regel-/Schemaänderungen gibt es nicht.
