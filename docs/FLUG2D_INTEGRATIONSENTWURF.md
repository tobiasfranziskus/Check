# Flug2D · Integrationsentwurf für echte 2D-Flugsteuerung [ANALYSE]

Stand: 10.11.2026. Basis: `main` [`7374b29`](https://github.com/tobiasfranziskus/Check/commit/7374b29), Hauptversion Regel195/Schema8 (`index.html` = `aphros-void.html`). Forschungsbranch `claude/inspiring-galileo-0d2mek`. Gelesen: [ROADMAP.md](ROADMAP.md) (Vision H, Abschnitt 0 „Autoritative 2D-Flug-/Dockbefehle sind ein gesonderter späterer Core-/Spielbarkeitsauftrag“), [PROJEKTSTATUS.md](PROJEKTSTATUS.md), [AGENTS.md](../AGENTS.md), [UI_MINER2D_RULE195.md](UI_MINER2D_RULE195.md) (Liste der fehlenden Core-Voraussetzungen).

**Dies ist ein Entwurf mit kleinem Prototyp, keine Produktregel.** `index.html`, `aphros-void.html`, der Regel195-Core, Spielstände, Schema- und Regelnummern sind unverändert. Kein Merge, kein Deployment. Alle Zahlenwerte sind Forschungsparameter **[OPTION]**.

## 1. Kurzfassung

- **Ein Core, eine Uhr.** Flug wird kein zweiter Simulationskern, sondern eine Unterteilung des bestehenden Ticks: 1 Core-Tick (1 Spielminute) = 60 Flugschritte (1 Spielsekunde). Der bisherige Minuten-Tick läuft unverändert genau einmal je 60 Flugschritte.
- **Flug ist reine Ganzzahl-Kinematik** in einem optionalen Schiffsfeld `flug`. Er bewegt Position, Kurs und Geschwindigkeit, sonst nichts: kein Geld, keine Ware, kein Treibstoff, kein RNG.
- **Wirtschaft bleibt, wo sie ist.** Bestehende Befehle (`shipMine`, `shipSellIce`, Erzvertrag, `shipBuy`) bekommen nur eine zusätzliche Ortsbedingung: fördern nur im Feld, liefern/verkaufen nur angedockt. Preise, Treuhand, Löhne und Audits werden nicht dupliziert.
- **Spieler und NPC benutzen dieselben fünf Flugbefehle und denselben Integrator.** NPC-Schiffe werden von einem deterministischen Auftragsautopiloten mit genau diesen Befehlen geführt.
- **Neue Forschungsregel statt Änderung an Regel195.** Sobald Ortsbedingungen gelten, ändern sich Förderzyklen und Hashes. Das gehört in ein eigenes Profil (Vorschlag: Regel196/Schema8), nicht in die Hauptversion.
- **Prototyp liegt bei:** Flugkern, Touch-Sandbox und Tests unter `prototypes/flug2d/` und `tests/flug2d-*`; Ergebnisse in Abschnitt 11.

## 2. Ausgangslage im Code (geprüft)

Alle Zeilenangaben beziehen sich auf `prototypes/w5ac/rule191-w5-ferry-core.js`, den Core der Hauptversion.

| Befund | Stelle | Folge für den Entwurf |
| --- | --- | --- |
| 1 Tick = 1 Spielminute; `step()` führt Befehle, W3/W5n/W4/W5/Transfer, Ankunft und Förderung aus | Z. 3101 | Flug braucht feinere Zeit, darf aber keine zweite Uhr einführen |
| Schiffe kennen nur `phase: 'dock' \| 'reise'`, `system`, `ziel`, `ankunft`; keine Position | Z. 474 | `dock` heißt faktisch „im System anwesend“; Bergbau läuft in `dock` (Z. 1066) |
| Systemwechsel ist eine Zeitreise mit Minutenlohn und strengen Audits (`ankunft === start + zeit`) | W3 Z. 1928 ff., Transfer Z. 2338 ff. | Frachtverträge bleiben in der ersten Stufe unberührt |
| `shipMove` ist im Erzpilot-Profil gesperrt; Whitelist der Befehle | Z. 694–702 | Flugbefehle müssen ausdrücklich freigeschaltet werden |
| Hash = kanonisches JSON des ganzen Zustands; Zahlen müssen endlich sein | Z. 3143 | Neue Felder sind automatisch im Hash und im Spielstand |
| Lader prüft Pflichtfelder, aber **keine unbekannten Zusatzfelder** (im Test bestätigt) | Z. 3334, 3536 | Flugprofil braucht eigene Regelnummer und ein strenges Flugaudit beim Laden |
| Felder haben `system` und `ware`, aber weder Koordinaten noch Restbestand | `m_data_erzpilot` | Koordinaten kommen als Regeldaten hinzu; kein endlicher Vorrat wird erfunden |
| Sitzungshülle validiert bei jedem Befehl und jedem Zeitschritt den ganzen Zustand | `prototypes/w5ac/session.js` Z. 13, 131 | gemessen ca. 3 ms je `advance(1)` in Node; für 20 Flugschritte/s zu teuer, siehe Abschnitt 8 |
| Welt ist pausiert; Zeit läuft nur über Schrittknöpfe | `prototypes/w5w/app.js` | Flug braucht eine Echtzeitschleife in der UI-Hülle |
| Renderer `W5uGraphics.zeichnen` nimmt Objekte mit `x`, `y`, `a` | `prototypes/w5ag/miner.js` Z. 49–57 | bleibt; die heute schematischen Layoutwerte werden durch Core-Werte ersetzt |

## 3. Architektur

```
UI-Hülle (m_ui_*)                      Core (m_data_* / m_core_*)
───────────────────────────────        ─────────────────────────────────────────────
requestAnimationFrame                  m_core_step.teilschritt()      1 Flugschritt
  Wandzeit → Anzahl Flugschritte   ──►   m_core_flugplan.planen()     Auftrag → Flugbefehl (NPC + Automatik)
Steuerknüppel / Knöpfe             ──►   m_core_commands.execute()    shipSteer, shipApproach, shipFlyTo,
  validierte Befehle                                                  shipDock, shipUndock
Canvas (W5uGraphics)               ◄──   m_core_flug.schritt()        Ganzzahl-Kinematik, An-/Abdocksequenz
  liest x, y, kurs                       └─ jede 60. Ausführung: bisheriger Minuten-Tick (unverändert)
                                               m_core_foerderung / erzpilot / w5n fragen nur:
                                               m_core_flug.imFeld()? m_core_flug.angedocktAn()?
```

Neue Module, in der bestehenden Benennung:

- `m_data_flug`: Richtungstabelle, Klassenwerte (`miner`, später `frachter`, `jaeger`), Andock- und Abbauparameter, Koordinaten von Station und Feldern je System. Eingefrorene Regeldaten, nicht im Spielstand.
- `m_core_flug`: Befehlsprüfung, Integrator, Andocksequenz, Ortsabfragen `imFeld`/`angedocktAn`, `audit`.
- `m_core_flugplan`: leitet aus dem bestehenden Auftrag (`auftrag`, `ware`, Ladung, Vertrag) einen Sollort ab und ruft die idempotente Brücke `fuehreZu` auf. Kein eigener Zustand.
- `m_ui_cockpit` (heute `prototypes/w5ag/miner.js`): Knüppel, Knöpfe, Echtzeitschleife, Anzeige.

Einbettung in `m_core_step` (Skizze):

```js
function teilschritt(state, rules) {              // nur wenn rules.flug vorhanden
  m_core_flugplan.planen(state, rules);           // erzeugt nur validierte Flugbefehle
  if (m_core_flug.schritt(state, rules.flug)) minute(state, rules);   // minute() = heutiger step()-Rumpf
}
function step(state, rules) {
  if (!rules.flug) return minute(state, rules);   // Regel195 und älter: bitgleich wie bisher
  for (let i = 0; i < rules.flug.schritteJeMinute; i++) teilschritt(state, rules);
}
```

`advance(n)`, Schrittknöpfe, Tests und Werkzeuge behalten ihre Bedeutung „n Spielminuten“. Die Echtzeitschleife ruft `teilschritt` einzeln auf.

## 4. Datenvertrag

### 4.1 Spielstand

Zwei optionale Ergänzungen, beide nur im Flugprofil vorhanden:

```js
state.flug = { schritt: 0 }            // 0..59, Flugschritt innerhalb des laufenden Ticks
state.ships[id].flug = { ... }         // Flugkörper, siehe Tabelle
```

| Feld | Typ / Bereich | Bedeutung |
| --- | --- | --- |
| `x`, `y` | Ganzzahl, ±`raumRadius` | Position in Punkten (P) relativ zum Ursprung von `ship.system`; y wächst nach unten |
| `vx`, `vy` | Ganzzahl, ±`vmax` der Klasse | Geschwindigkeit in P je Flugschritt |
| `kurs` | 0..255 | Bugrichtung in 1/256-Umdrehungen; 0 = +x, 64 = +y |
| `lage` | `angedockt`, `frei`, `andocken`, `abdocken`, `transit` | Flugzustand im System |
| `anker` | Stations-ID oder `null` | gesetzt bei `angedockt`, `andocken`, `abdocken` |
| `rest` | 0..`andocken.schritte` | verbleibende Schritte der An-/Abdocksequenz |
| `modus` | `hand`, `anflug`, `halt` | wer die Sollwerte setzt |
| `sollKurs`, `sollFahrt` | 0..255, 0..100 | Steuervorgabe; Fahrt in Prozent von `vmax` |
| `ziel` | `null`, `{art:'station'\|'feld', id}`, `{art:'punkt', x, y}` | Anflugziel der Automatik |
| `andocken` | boolean | Anflug soll in die Andocksequenz übergehen |

Invarianten, die `m_core_flug.audit` beim Laden und nach jedem Minuten-Tick prüft: exakt diese Feldmenge (ein Feld `treibstoff` wird abgewiesen); alle Zahlen sichere Ganzzahlen im Bereich; `angedockt` ⇒ Position = Dockposition und Geschwindigkeit 0; Geschwindigkeit ≠ 0 nur bei `frei`; `transit` ⇔ `phase === 'reise'`; Ziel und Anker liegen im System des Schiffs.

Die bestehende `phase` bleibt unverändert und behält ihre Bedeutung (im System / auf Zeitreise). `flug.lage` ist die feinere, örtliche Ebene darunter. Schiffe ohne `flug` verhalten sich wie heute.

### 4.2 Regeldaten

```js
rules.flug = {
  schritteJeMinute: 60, richtungen: 256, einheit: 16384, raumRadius: 6400000,
  klassen: { miner: { vmax: 1920, schub: 32, bremse: 64, drehrate: 4 }, frachter: {...}, jaeger: {...} },
  andocken: { radius: 48000, tempo: 192, schritte: 40 }, abbau: { tempo: 96 },
  systeme: { aldera: { station: { id: 'st_aldera', x: 0, y: 0 },
                       felder: [{ id: 'aldera:erz', ware: 'erz', x: 960000, y: -384000, radius: 144000 }, ...] } }
}
```

Feld-IDs sind `system:ware` und passen damit eins zu eins auf `rules.world.fields`. Koordinaten sind Regeldaten: gleiche Regelversion, gleiche Geografie.

### 4.3 Versionen und Spielstandschutz

- **Schema bleibt 8.** Es kommen nur optionale Felder hinzu; alte Stände dürfen sie nicht haben.
- **Neue Regelnummer** (Vorschlag 196 als Forschungsderivat von 195), weil Ortsbedingungen die Simulation ändern. `loadErz` weist fremde Regelnummern bereits ab („kein stilles Migrieren“); Regel195-Stände bleiben unangetastet ladbar in Regel195.
- **Migration 195 → 196 ist möglich, aber nicht Teil des ersten Schritts [OPTION].** Sie wäre eindeutig: `phase: 'dock'` ohne Förderauftrag ⇒ angedockt an der Systemstation; fördernde Miner ⇒ ruhend im Feldmittelpunkt; `phase: 'reise'` ⇒ `transit`. Nur als ausdrücklicher Import mit vorherigem JSON-Export, nie still.

## 5. Flugmodell

Ein Flugschritt je Schiff in stabiler ID-Reihenfolge:

1. **Sollwerte.** Bei `modus: 'anflug'` berechnet der Anflugregler Sollkurs und Sollfahrt aus dem Ziel; bei `hand` gelten die Werte des letzten `shipSteer`.
2. **Drehen.** `kurs` nähert sich `sollKurs` um höchstens `drehrate` je Schritt auf dem kürzeren Weg.
3. **Beschleunigen und Bremsen.** Zielgeschwindigkeit = Bugrichtung × `vmax` × `sollFahrt` / 100. Die Geschwindigkeit nähert sich ihr je Schritt um höchstens `schub` (schneller werden) oder `bremse` (langsamer werden, Fahrt 0). Schub wirkt entlang des Bugs, deshalb ist Trägheit spürbar: erst drehen, dann schieben.
4. **Bewegen.** `x += vx`, `y += vy`; am Systemrand wird die Position begrenzt und die Achsgeschwindigkeit auf 0 gesetzt.
5. **Andockauslöser.** Liegt ein Andockwunsch vor und ist das Schiff in der Dockzone und langsamer als `andocken.tempo`, beginnt die feste Andocksequenz.

Fahrt 0 heißt aktives Bremsen bis zum Stillstand, ohne Drift. Das ist bewusst ein touchfreundliches Assistenzmodell statt reiner Newton-Physik; ein Driftmodus für Jäger kann später als Klasseneigenschaft folgen **[OPTION]**.

Determinismus im Detail:

- Nur `+ − ×`, ganzzahlige Division mit Abschneiden und eine exakt korrigierte Ganzzahlwurzel. **Kein `Math.sin`, `Math.cos`, `Math.atan2`** zur Laufzeit: deren letzte Stelle ist je Browser-Engine nicht garantiert gleich. Die Richtungstabelle steht als 65 Ganzzahl-Literale im Code; der Kurs zu einem Punkt wird über das größte Skalarprodukt bestimmt.
- Der Zustand enthält nie `-0`; er ist im Speicher exakt gleich seiner JSON-Fassung.
- Keine Kollisionen, kein Schaden in dieser Stufe **[OPTION]**. Schaden würde Warenbedarf erzeugen und gehört in einen eigenen Wirtschaftsauftrag.

Größenordnung mit den Forschungswerten (Miner): Station → Erzfeld 562 Flugschritte (9,4 Spielminuten), Rückflug mit Andocken 608 (10,1 Spielminuten), Abdocken 40.

## 6. Befehle

Alle Befehle laufen wie bisher über `checkShape`/`execute` mit `owner`; fremde Schiffe, falsche Lage und ungültige Werte werden ohne Nebenwirkung abgelehnt. Feldnamen folgen der bestehenden Konvention.

| Befehl | Felder | Voraussetzung | Wirkung |
| --- | --- | --- | --- |
| `shipSteer` | `schiff`, `kurs` 0..255, `fahrt` 0..100 | `lage: frei` | Handsteuerung; beendet eine laufende Automatik |
| `shipApproach` | `schiff`, `zielArt` `station`\|`feld`, `ziel` | `frei`, Ziel im selben System | Automatik fliegt hin und hält im Zielbereich an |
| `shipFlyTo` | `schiff`, `x`, `y` | `frei`, Punkt im Systemraum | Automatik fliegt zum Punkt (Antippen der Karte) |
| `shipDock` | `schiff`, `station` | `frei`, Station im selben System | Anflug mit Andockwunsch; Sequenz startet erst in der Zone bei geringer Fahrt |
| `shipUndock` | `schiff` | `angedockt` | feste Abdocksequenz, danach `frei` |

Bremsen ist `shipSteer` mit `fahrt: 0`. Die Befehle ändern ausschließlich Felder in `ship.flug`.

Bei der Integration kommen sie in `FIELDS` (Z. 533) und, nur wenn `rules.flug` gesetzt ist, in die Erzpilot-Whitelist (Z. 694). Die bestehende Prüfung „Schiff ist nicht im Dock“ (Z. 557) bleibt, weil sie die Systemebene meint.

### Andocken als Zustandsmaschine

```
angedockt ──shipUndock──► abdocken ──40 Schritte──► frei
    ▲                                                 │ shipDock (+ Zone erreicht, Fahrt ≤ tempo)
    └───────────40 Schritte──────── andocken ◄────────┘
frei ──bestehender Reisebefehl──► transit ──Ankunft (bestehend)──► frei bzw. angedockt
```

Während `andocken`/`abdocken` nimmt das Schiff keine Steuerbefehle an. Schnelles Durchfliegen der Zone dockt nicht an.

## 7. Kopplung an die bestehende Wirtschaft

Die Flugschicht stellt nur zwei Fragen bereit; die Wirtschaftslogik bleibt in ihren Modulen.

| Bestehende Stelle | Heute | Mit Flugprofil |
| --- | --- | --- |
| `m_core_foerderung.foerderung` (Z. 1066) | fördert bei `phase: dock` | zusätzlich `m_core_flug.imFeld(schiff, ware)`: im Feld und nahezu stehend; sonst in dieser Minute keine Förderung und keine Förderkosten |
| `m_core_erzpilot.abschliessen` (Z. 1699) | verkauft die Charge sofort an die Station | Lieferung und Auszahlung nur bei `angedocktAn(schiff, station)`; im Feld endet die Förderung bei erreichter Vertragsmenge und wartet auf das Andocken |
| `shipWait` / `stornieren` (Z. 811, 1725) | Teilverkauf + Rückgabe der Treuhand | angedockt wie heute; im Raum: siehe Entscheidung E3 |
| `m_core_w5n.foerdern` / `verkauf` (Z. 2644, 2650), `shipSellIce` (Z. 592) | Eis fördern und an Aldera verkaufen | fördern nur im Eisfeld; verkaufen nur angedockt an `quellStation` |
| `shipBuy` (Z. 764) | neues Schiff in `aldera`/`nadir` | zusätzlich Flugkörper „angedockt an der Kaufstation“ |
| `m_core_audit.audit` (Z. 3361) | Geld, Ware, Finanzierung | zusätzlich `flug: m_core_flug.audit(...)` |
| W3-Fracht, Überführung, Eisfracht (Frachter) | Zeitreise mit Minutenlohn | **in Stufe F1/F2 unverändert**; Frachter erhalten erst in F3 einen Flugkörper |

Garantien, die daraus folgen und getestet werden müssen: Ein Flugbefehl oder Flugschritt verändert nie `owners`, `ladung`, `lager`, `ledger`, `rng`. Geld und Ware bewegen sich ausschließlich durch die bestehenden, bereits auditierten Befehle. Es gibt keinen Treibstoff, keine Energie und keine Flugkosten; die bestehenden Minutenlöhne der Frachtverträge bleiben an ihre Verträge gebunden.

**Wirtschaftliche Auswirkung (ehrlich benannt):** Mit Ortsbedingungen dauert eine 50-Erz-Charge nicht mehr 50, sondern mit den Forschungswerten etwa 70 Minuten (Hin- und Rückflug, An- und Abdocken). Das gilt für Spieler und NPC gleich, senkt den Durchsatz um rund 29 % und verändert alle Referenzwerte. Deshalb eigene Regelnummer, eigene unabhängig geprüfte Referenzen und eigene 13×90d-Läufe; keine Übernahme von Regel195-Hashes.

## 8. Determinismus, Save/Load und Sitzungshülle

- **Gleicher Seed + gleiche Befehle an gleichen Flugschritten ⇒ gleicher Hash.** Jeder Befehl wird an den Schrittindex `tick × 60 + schritt` gebunden. Die Wandzeit bestimmt nur, wie viele Flugschritte ein Bild ausführt; Bildrate, Pausen und Stückelung ändern das Ergebnis nicht.
- **Speichern jederzeit möglich**, auch mitten im Flug oder in der Andocksequenz: der Zustand ist vollständig im kanonischen JSON. Laden prüft zusätzlich das Flugaudit.
- **Sitzungshülle** (`session.js`): Flugbefehle und Flugschritte ändern nachweislich keinen Wirtschaftswert, brauchen also nicht die volle Kopie-und-Audit-Runde je Aufruf. Vorschlag: `session.steuern(befehl)` und `session.fliegen(n)` arbeiten direkt mit dem Core und dem günstigen Flugaudit; die volle Validierung läuft wie bisher bei jedem Minuten-Tick, vor jedem Wirtschaftsbefehl und vor Export. Bei 1× sind das eine volle Validierung alle 3 Sekunden statt 20 je Sekunde.
- **Anzeige:** HQ, Karte und Tabellen werden nur am Minuten-Tick neu aufgebaut; das Cockpit liest je Bild nur die Flugkörper. Geöffnete Befehlsgruppen und Eingaben bleiben so erhalten.
- **Engine-Vergleich:** Der Referenzlauf des Prototyps liefert einen festen Kettenhash. Die Sandbox rechnet ihn im Browser nach; stimmt er auf iPad Safari, rechnen JavaScriptCore und V8 bitgleich.

## 9. Touch-Steuerung für iPad Safari

- **Linker Daumen: Steuerknüppel** (168 px, halbtransparent über dem Raum). Richtung = Sollkurs, Auslenkung = Sollfahrt in 10-%-Stufen, Totzone in der Mitte. Loslassen bremst; mit „Tempomat“ bleibt die Fahrt stehen. Es wird nur gesendet, wenn sich Kurs oder Fahrtstufe ändern.
- **Rechte Seite: Knöpfe ≥ 56 px** für Andocken/Abdocken, Bremsen, Anflug Erzfeld/Eisfeld. Antippen des Raums setzt einen Anflugpunkt. Keine Hover-Aktionen; jede Funktion ist auch als Knopf erreichbar.
- **Zwei Finger gleichzeitig:** Solange ein Finger den Knüppel hält, erzeugt der Browser für einen zweiten Finger kein `click` (in Chromium-Emulation nachgestellt). Flugknöpfe lösen deshalb bei `pointerup` aus; `click` bleibt für Tastatur, Maus und Bedienungshilfen.
- **Pointer Events** mit `setPointerCapture`; `pointercancel` (Systemgesten) zählt als Loslassen. `touch-action: none` nur auf Raum und Knüppel, damit die Seite sonst scrollbar bleibt; `touch-action: manipulation` auf Knöpfen gegen Doppeltipp-Zoom.
- **Layout:** Querformat Raum links, Bedientafel rechts; Hochformat und schmale Ansicht gestapelt. `100dvh` mit `100vh`-Fallback, Safe-Area-Abstände, `<summary>` ≥ 48 px.
- **Schleife:** `requestAnimationFrame` mit festem Zeitschritt, Nachholen gedeckelt; Hintergrund-Tab pausiert die Zeitzählung. Darstellung interpoliert zwischen zwei Flugschritten, ohne den Zustand zu berühren.
- **Tastatur** (iPad mit Tastatur, Desktop): Pfeile für Kurs und Fahrt, Leertaste bremst.
- **Zeitmaß [OPTION]:** 1× = 20 Flugschritte je Sekunde, also 1 Spielminute = 3 Sekunden; 3× für Förderphasen; die bestehenden Minutenknöpfe bleiben für die Pause.

## 10. Gemeinsame Regeln für Spieler und NPC, Wiederverwendung

**NPC.** `m_core_flugplan` bestimmt je Schiff mit Automatik einen Sollort aus dem bestehenden Auftrag: Miner mit `auftrag: 'foerdern'` und Platz/offener Vertragsmenge ⇒ Feld der `ware`; Vertragsmenge erreicht, Frachtraum voll oder Auftrag `halten` mit Ladung ⇒ Station. `fuehreZu(schiff, sollort)` erzeugt daraus nur dann einen Befehl, wenn das aktuelle Ziel abweicht: `shipUndock`, `shipApproach` oder `shipDock`, ausgeführt über dasselbe `execute` mit dem Besitzer des Schiffs. NPC haben keine Abkürzung, keine andere Physik, keine anderen Ortsbedingungen. Der Spieler kann dieselbe Automatik für eigene Schiffe einschalten; Handsteuerung übersteuert sie. Der Planer braucht keinen Zufall; falls später doch, ausschließlich den gespeicherten Core-RNG.

**Frachter und Jäger.** Der Integrator kennt keine Schiffsart, nur Klassenwerte. Frachter: träge, niedrige Drehrate. Jäger: hoher Schub, hohe Drehrate. Dazu kommen später je Klasse eigene Aufbauten, nicht eine zweite Physik:

- Frachter (F3): Sprungpunkte je System als weitere Zielart; die bestehende Zeitreise bleibt der Transit zwischen zwei Sprungpunkten. Offene Vertragsfrage siehe E5.
- Jäger (F4): Zielaufschaltung, Reichweite und Feuerbefehl auf Basis derselben Positionen; das bestehende rundenbasierte `m_core_kampf` bleibt bis dahin unverändert.

## 11. Prototyp

Zweck: die riskanten Annahmen prüfbar machen, bevor der Core angefasst wird: Ganzzahl-Determinismus, Save/Load mitten im Flug, gleiche Regeln für Spieler/NPC, Touch-Bedienbarkeit, Unabhängigkeit von der Wirtschaft.

| Datei | Inhalt |
| --- | --- |
| `prototypes/flug2d/flug-kern.js` | Kandidat für `m_data_flug` + `m_core_flug`: Daten, Befehle, Integrator, Andocksequenz, Ortsabfragen, `fuehreZu`, Audit |
| `prototypes/flug2d/referenz.js` | Sandboxwelt ohne Wirtschaft, Minutenhaken mit Auftragsersatz für einen NPC-Miner, fester Referenzlauf |
| `prototypes/flug2d/index.html`, `sandbox.js` | Touch-Sandbox: Knüppel, Knöpfe, Echtzeitschleife, Referenzlauf, Replay, JSON-Export/-Import; kein Browser-Speicher |
| `tests/flug2d-kern.test.mjs` | 11 Node-Tests, Teil von `node --test tests/*.test.mjs` |
| `tests/flug2d-touch.cjs` | Chromium-Touch in vier Größen, gesondert zu starten |

Starten: Repository statisch ausliefern und `prototypes/flug2d/index.html` öffnen. Die Sandbox lädt zusätzlich nur den unveränderten Regel195-Core, um dessen `hashString`/`canonical` wiederzuverwenden.

Was die Tests belegen:

- Richtungstabelle, Ganzzahlwurzel und Kursbestimmung sind exakt.
- Referenzlauf (3600 Flugschritte, vier Schiffe, 15 Befehle, NPC-Auftragsersatz): zweimal identisch, unabhängig von der Stückelung, Kettenhash `e2674c1ef11678ba`.
- Save/Load an sieben Stellen (frei, `andocken`, `abdocken`, angedockt) setzt bitgleich fort.
- NPC und Spieler fliegen mit derselben Befehlsfolge dieselbe Bahn.
- Schub, Höchstfahrt, Bremsweg, Stillstand ohne Drift, Anflug, Andock- und Abdocksequenz, Abbruch der Automatik durch Handsteuerung.
- Frachter und Jäger laufen durch denselben Integrator.
- Kein Treibstofffeld; 20.000 Flugschritte Dauerschub ohne Verbrauch.
- Audit weist elf Arten manipulierter Flugzustände ab.
- **Am echten Regel195-Core:** 30 Spielminuten mit Flugschritten zwischen den unveränderten Minuten-Ticks ergeben nach Entfernen der Flugfelder exakt denselben Spielstand und Hash wie der Kontrolllauf ohne Flug; Weltgeld 33.000 ISK, Mint 0.
- Hauptversion und W5ag-Hub laden keinen Flugkern.

Tatsächlich ausgeführte Läufe stehen im [Projektstatus](PROJEKTSTATUS.md). Grenzen: Die Sandbox hat keine Wirtschaft, keine Ortsbedingungen im Core, keinen Systemwechsel; ihr NPC-Fahrplan ist ein Platzhalter. Chromium-Touch ist keine iPad-Safari-Abnahme.

**Vor-Ort-Prüfung auf dem iPad (offen):** Sandbox in Safari öffnen, Hoch- und Querformat; abdocken, mit dem Knüppel fliegen, bei gehaltenem Knüppel „Anflug Erzfeld“ tippen, andocken; „Referenzlauf prüfen“ muss `e2674c1ef11678ba` zeigen; „Replay dieser Sitzung prüfen“ muss „identisch“ melden; JSON exportieren und wieder importieren.

## 12. Integrationsschritte

| Stufe | Inhalt | Nachweis vor der nächsten Stufe |
| --- | --- | --- |
| **F0 Flugkern** (dieser Branch) | Kern, Sandbox, Tests; nichts integriert | Node-Tests grün; iPad-Safari-Prüfung der Sandbox inkl. Referenzhash |
| **F1 Core-Einbau ohne Ortsbedingungen** | `m_data_flug`/`m_core_flug` in den Core, `teilschritt`, Flugbefehle, Flugaudit, eigenes Forschungsprofil; nur Miner erhalten Flugkörper | Wirtschaftszustand bis auf Regelnummer und Flugfelder bitgleich zu Regel195 über 13 Seeds × 90 Tage; Save/Load; Regel195-Stände weiter nur in Regel195 ladbar |
| **F2 Ortsbedingungen + NPC-Autopilot** | Kopplung aus Abschnitt 7, `m_core_flugplan`, Cockpit im Hub mit Knüppel und Echtzeit | neue unabhängig geprüfte Referenzen; Geld-/Waren-/Vertragsaudits; 13 wirtschaftlich verschiedene 90-Tage-Regime; Chromium-Touch; iPad Safari/NAS |
| **F3 Frachter** | Sprungpunkte, Transit, Frachter-Flugkörper | Vertragsfrage E5 entschieden; W3-/Eisfracht-Audits |
| **F4 Jäger** | Zielaufschaltung, Feuerbefehl, Kampf auf Positionen | eigener Kampf- und Wirtschaftsauftrag |
| **F5 Freigabe** | Einzeldatei-Build, optional Migration 195 → Flugprofil | ausdrückliche Nutzerfreigabe; JSON-Export vor jedem Wechsel |

F1 ist bewusst wirtschaftsneutral: Es beweist den Einbau, bevor F2 die Regeln ändert. F1 allein ist kein spielbarer Stand, weil Förderung dort noch nicht an den Ort gebunden ist.

## 13. Offene Produktentscheidungen [OPTION]

- **E1 Zeitmaß:** 60 Flugschritte je Minute und 20 Schritte je Sekunde bei 1× (1 Spielminute = 3 s). Empfehlung: so starten, auf dem iPad nach Gefühl nachstellen.
- **E2 Entfernungen und Klassenwerte:** bestimmen direkt den Förderdurchsatz (heute etwa −29 %). Empfehlung: erst Sandbox-Gefühl, dann Wirtschaftsläufe.
- **E3 Förderung im Raum stoppen (`shipWait`):** (A) Vertrag sofort auflösen, beide Treuhandkonten vollständig zurück, Ladung bleibt unverkauftes Eigentum; oder (B) Vertrag bleibt bis zum Andocken gebunden. Empfehlung A: bindet nie fremdes Käufergeld auf unbestimmte Zeit und nutzt nur vorhandene Rückgabewege.
- **E4 Flugminuten des Miners:** kostenlos wie heute oder Lohn wie bei Frachtflügen. Empfehlung: zunächst keine neue Kostenart; Entscheidung zusammen mit dem Pilotenlohn-Thema der Roadmap.
- **E5 Frachtverträge mit echtem Flug:** feste Routenzeit Dock-zu-Dock beibehalten oder nach tatsächlicher Flugzeit mit Reserve und Rückerstattung abrechnen.
- **E6 Kollisionen, Schaden, Dockplätze, endliche Felder:** vorerst keine.
- **E7 Migration bestehender Regel195-Stände** in das Flugprofil.

## 14. Risiken

- **Engine-Unterschiede:** durch Ganzzahlrechnung und Literaltabelle ausgeschlossen, aber erst mit dem Referenzhash auf echtem iPad Safari belegt.
- **Leistung auf dem iPad:** Flugschritt im Prototyp etwa 7 µs für vier Schiffe in Node; der Engpass ist die volle Sitzungsvalidierung, daher die Trennung in Abschnitt 8.
- **Wirtschaft:** Ortsbedingungen verlangsamen jede Förderkette. Die bekannte W6-Nachfrageschwäche wird dadurch nicht gelöst und kann sich verschieben.
- **Bedienung:** Gleichzeitige Finger, Systemgesten und Hochformat brauchen echte Geräteprüfung; Emulation reicht nicht.
