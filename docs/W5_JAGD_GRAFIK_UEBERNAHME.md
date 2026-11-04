# [DRAFT] W5 – isolierte Jäger-/Piratenansicht

Stand: 04.11.2026. Auftrag B, Branch `feature/w5-jagd-ui-extraktion`.
Basis ist der geprüfte W5-Head von [#171](https://github.com/tobiasfranziskus/Check/pull/171),
`3d1d3ca74ad5399971ff4a86ac4b38089b6b5c8b`. `main` wurde über Git und GitHub
auf `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c` geprüft. #171 und die Grafik-Drafts
[#162](https://github.com/tobiasfranziskus/Check/pull/162)/[#164](https://github.com/tobiasfranziskus/Check/pull/164)
sind nicht in main integriert. Ein abweichender Basis-Commit oder endgültiger
Feldvertrag von Auftrag A wurde diesem Auftrag nicht mitgeliefert; der gemeinsame
Integrationsstand ist deshalb explizit dieser #171-Commit, kein behaupteter A-Abgleich.

AGENTS.md, Roadmap, Projektstatus, vorhandene Herkunftsdokumentation, Grafikcode
und W5-/Miner-Tests wurden geprüft. Die ausdrücklich vorgegebene Dateigrenze hat
Vorrang vor allgemeiner Dokumentationspflege: Roadmap/Projektstatus, index.html,
Core und vorhandene Tests bleiben unverändert. Kein Merge, Deployment oder neuer
Produktstatus; ausschließlich Vorschau und anschließbarer Darstellungsvertrag.

## Start und Bedienung

Das Repository mit einem beliebigen statischen HTTP(S)-Server ausliefern und
`prototypes/w5-jagd/jagd-vorschau.html` öffnen. Zum lokalen Entwickeln beispielsweise
`python3 -m http.server 8765`; dies ist kein Laufzeitdienst der Anwendung. Kein Build,
Framework, npm-Paket oder CDN erforderlich. ES-Module benötigen statische HTTP(S)-
Auslieferung; Doppelklick über file:// ist kein zugesicherter Startweg.

Die drei explizit als **MOCKDATEN** markierten Snapshots zeigen Gebiet, belegten
Schuss und belegten Abschuss. Die Buttons wählen feste Fixtures, sie führen keinen
Tick aus. Jede Mock-ID und jeder Mock-Beleg beginnt mit `mock:`. Keine Fixture
behauptet echte Core-Schiffe oder echte Zahlungen. Auswahl per Canvas-Tap oder
nativer, tastaturbedienbarer Schiffliste. Pinch und +/− ändern ausschließlich den
Kamerazoom (.03–.5); Zentrieren stellt den an die Breite angepassten Startzoom wieder
her. Alle Buttons und das Select sind mindestens 48 CSS-Pixel hoch. Seite außerhalb
des Canvas scrollbar, Canvas mit eigener Touchfläche, Safe-Area-Abstände und
Layout für Querformat, Hochformat und schmale Ansichten. Kein Hover-Zwang.

Spieler/NPC/Piraten unterscheiden sich durch Farbe, Quadrat/Kreis/Raute und
Besitzertext. IDs bestimmen Auswahl, niemals Anzeigenamen. Das Jagdgebiet ist eine
schematische Ellipse ohne Kollisions-, Reichweiten- oder Gefahrenregeln. Anzeigeplätze
sind ID-sortiert; ohne externe Positionen bedeuten sie keine physische Flugbahn.

## Herkunft und bewusste Anpassungen

Primärquelle ist die **bereits vorhandene Übernahme** `m_ui_miner2d` aus #162
(`35688082332f686f88dc317c1ae1200edf8e60d3`), über #164
(`6b3884f505099815546940f42c5473ba77be289c`) im W5-Basisstand enthalten.
Die dokumentierte ursprüngliche Void-Echoes-Quelle ist
[`a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f`](https://github.com/tobiasfranziskus/void-echoes/tree/a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f).
Siehe [2D_UEBERNAHME.md](2D_UEBERNAHME.md) und das unveränderte Herkunftsmanifest
`tests/fixtures/miner2d-herkunft.json`. Void Echoes ist dort als UNLICENSED dokumentiert;
die beauftragte Übernahme innerhalb der beiden Nutzer-Repositories vergibt keine neue Lizenz.

| Bestand | Verwendung / Änderung |
| --- | --- |
| `390-ux08-vektorgrafik.js`, effektive GX_MODELS, gxModel/gxParts/gxCanvas | Wörtliche Extraktion der vorhandenen elf Modelle, Metallgradienten und Teile; Jäger nutzt hunter, Pirat pirate, unbekannte Hülle rookie. Keine Klassenwerte aus der Grafik ableiten. |
| `080-ve08g-02-sprites.js`, sgPolygon | Bestehende Polygonroutine unverändert. Spritecache, Winkelinterpolation und alte Hüllengeometrie nicht erneut kopiert; kleiner GX-Teilecache bleibt rendererunabhängig und dekorativ. |
| `370-ux06-auswahl.js` / `580-ux01-erweiterung.js` | Bereits adaptierte treffer/eingabe aus #162 wörtlich übernommen: CSS-Pixel, mindestens 44px Trefferbereich, 10px/600ms Tap, Pinch, Capture-/Kontextabbruch. Neuer Renderer zeichnet nach Pinch neu; kein Drag-Flug oder Doppeltippbefehl. |
| `075-kern-simulation.js`, nur dokumentierte cam/sc-Formel | Mittelpunkt + (Position − Kamera) × Zoom. Keine Simulation, Extrapolation oder Bewegungswerte. |
| `085-kern-zeichnen-hud.js`, Auswahl-/HUD-Konzept | Neue Besitzerrahmen, weißer Auswahlrahmen, Ereignistext und Abschlussmarker. Keine Schild-/Energie-/HP-Bögen ohne Daten. Pilotenstatus als unbekannt vorbereitet. |
| Sternhimmel | Neuer kleiner statischer Punkthintergrund; keine erneute Kopie der umfangreichen Stern-/Spritecaches. Kein RNG, Renderloop oder animierter Timer. |

Die portierbare Datei `m_ui_jagd_vektoren.mjs` enthält ausschließlich benötigte
Grafik-/Eingabeprimitive. SHA256:
`e171ce893773bb5d90721518eff452ae3c9ab82c1c3e522a5afd34fd7a5ae2df`.
Der eigene Herkunftstest prüft jede übernommene Codezeile gegen die bestehende
Inline-Übernahme. Die Extraktion ist erforderlich, weil die bisherige Grafik keine
separat importierbare Datei hat: index.html einzubetten würde den Spielstart/Core
laden. Es entsteht kein zweiter Grafikentwurf. Bei späterer Integration sollen Miner
und Jäger ein gemeinsames extrahiertes Grafikmodul importieren; diese Umstellung
liegt wegen der Dateigrenze ausdrücklich außerhalb dieses Drafts.

## JagdSichtV1 – Integrationspunkt zu Auftrag A

`m_ui_jagdsicht.mjs` stellt `jagdSichtV1(input)` bereit. Der Aufrufer liefert einen
JSON-Datensnapshot; der Adapter erstellt eine abgetrennte, rekursiv eingefrorene Kopie.
Kein Import eines Core-Moduls, kein Kommando-/Save-/Uhrzugriff.

| Feld | Vertrag |
| --- | --- |
| `version` | exakt `JagdSichtV1` |
| `tick` | nichtnegative sichere Ganzzahl des autoritativen Snapshots |
| `systemId`, `anomalieId` | nichtleere echte IDs im späteren Produktadapter |
| `schiffe[]` | `id` (eindeutig), `besitzer: {id, art}`, `klasse`, `status`; art = spieler/npc/pirat. Besitzer-ID bleibt die reale Identität, art nur Darstellungskategorie. |
| `schiffe[].position` | optional `{x,y}` mit endlichen Koordinaten; sonst schematische ID-sortierte Anzeigeplätze. Keine Zeitinterpolation. |
| `schiffe[].pilotId`, `xp`, `rang` | optional; fehlen/null = unbekannt. XP 0 bleibt 0. Kein Pilot wird aus Schiff/Besitzer abgeleitet. |
| `ereignisse[]` | `id`, `belegId`, `tick`, `art: schuss/abschuss`, `quelleId`, `zielId`. IDs referenzieren Schiffe desselben Snapshots; keine Zukunftsticks, Selbstziele oder doppelten Ereignisse. |
| Abschuss | Ziel im Snapshot mit `status: zerstoert`; höchstens ein Abschuss je Ziel. Zerstörte Kontakte als historische Einträge für die Ereignisreferenzen mitliefern. |

Die Ereignisliste ist das vom Aufrufer bestimmte Belegfenster. Linien/Marker zeigen
**alle gelieferten Ereignisse statisch**, ohne selbst Lebensdauer, Treffer, Schaden
oder Kampfausgang zu berechnen. Die Abschusszahl zählt nur diese Belege, keinen
kumulativen Lebenszeitwert. Der Validator prüft Struktur und Referenzen; die Echtheit
eines `belegId` oder einer Schiffs-ID muss der autoritative Produzent garantieren.
Eine beliebige Zeichenkette ist kein unabhängiger Beweis einer Core-Buchung.

```js
import {jagdRenderer} from './prototypes/w5-jagd/m_ui_jagd_renderer.mjs';
const renderer = jagdRenderer(canvas, schiff => {
  // Auswahl-HUD; niemals ein automatischer Kampfbefehl.
});
renderer.setSnapshot(projektionAusDemAutoritativenKern);
// Bei neuem Kern-Snapshot erneut setSnapshot; bei Abbau:
renderer.dispose();
```

`setSnapshot` validiert vor dem Austausch; Auswahl über echte ID bleibt erhalten,
sofern noch vorhanden. `auswaehlen(id)`, `zoom(faktor)`, `zentrieren()` und `zeichnen()`
ändern nur lokalen UI-Zustand. `dispose()` entfernt Handler. Der Renderer liest nur
die abgetrennte Projektion; er bewegt keine Schiffe, ruft keinen Core-Tick auf,
bestimmt keine Kämpfe und vergibt weder ISK noch XP. Spätere Spielerbefehle brauchen
einen **separaten**, validierten Core-Befehlsadapter außerhalb dieses Renderers.
Kein produktiver W5-Jagdadapter wird vorgetäuscht: W5 belegt derzeit Material/
Frachterbau und Konzernstatus, noch keine neue Jäger-/Pilotenökonomie.

## Tatsächliche Validierung und Grenzen

Node.js **22.23.4**:

- `node --test tests/*.test.mjs`: **22/22 Dateisubtests**, keine Fehler/Skips.
- `node --test --experimental-test-isolation=none tests/*.test.mjs`:
  **170/170 Einzeltests**, keine Fehler/Skips (165 Bestand + 5 neu).
- Eigene Tests: rekursive Unveränderlichkeit/Abtrennung, stabile IDs/Anzeigeplätze,
  optionale unbekannte Pilotendaten, ungültige Kampfbelege, 100 Renderframes samt
  Zoom/Auswahl/Snapshotwechsel ohne W5-Save-/Hashänderung, wörtliche Herkunft,
  Touch-/Pinch-/Cancel-/Kontextabbruch und Handlerabbau.

Chromium mit Playwright (vorhandenes Entwicklungswerkzeug, keine neue Abhängigkeit):
`PLAYWRIGHT_MODULE=/pfad/zu/playwright node tests/browser/w5-jagd.cjs`, statischer
Testserver unter `http://127.0.0.1:8765` bzw. `TEST_URL`.

- Touch-Emulation **1194×834**, **834×1194**, **375×812**, Drehung, Canvas-Tap,
  Schiffliste, Zoombuttons, echte Chromium-Multitouch-Dispatches für Pinch;
  Canvasbild ändert sich beim Pinch, Tick und Auswahl bleiben erhalten.
- Snapshotwechsel Gebiet/Schuss/Abschuss, Status/Belegliste, unbekannte Pilotenwerte,
  mindestens 48px Controls, kein horizontaler Überlauf, keine JS-Fehler.
- Reduced-Motion-Einstellung geprüft; Darstellung ist grundsätzlich ohne Animation.
  Querformat-/Mobil-Screenshots visuell geprüft; schmale Startansicht korrigiert.

**Keine echte iPad-Safari- oder NAS-Abnahme**, keine Aussage zu Safari-Gesten,
physischem Apple-Pencil-/Touch-Verhalten oder NAS-MIME-Konfiguration. Vor Integration
auf echten Geräten statische .mjs-Auslieferung, Touch/Pinch/Cancel, Quer-/Hochformat,
Safe Areas, Tastatur und größere Kontaktlisten prüfen. Keine Speicherwege betroffen.
Lokale Testläufe sind keine Behauptung über CI oder Veröffentlichung. Der übliche
Workflow hat Pfadfilter; neue Tests liegen deshalb zusätzlich unter `tests/`.
