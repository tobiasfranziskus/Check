# Konzernzentrale · lesender Legacy-Prototyp

`index.html` direkt öffnen oder das Repository statisch ausliefern und `prototypes/legacy-corporation/` aufrufen. Kein Build, Backend, CDN oder Laufzeitpaket. Die Startwelt ist dauerhaft als **DEMO / fiktiv** gekennzeichnet. Sie ist kein Spielstand.

Einbettung: `corporation.css` und `corporation.js` laden, eine leere Wurzel mit `class="legacy-corporation"` bereitstellen:

```js
const view = LegacyCorporation.mount(root, snapshot);
view.update(nextSnapshot); // vollständiger Ersatz
view.getSelection();       // defensive Kopie {tab, shipId}
view.destroy();            // idempotent; danach kein update
```

Eine Instanz je Wurzel, vor erneuter Montage abbauen. Kein Callback, Befehlskanal, Timer oder Speicherzugriff. Aktualisierungen erhalten Bereich, gültige Schiffs-ID, Inhalts-Scrollposition und Fokus auf vorhandenen Navigations-/Schiffselementen. Entfällt die Auswahl, wird das erste Schiff gewählt, sonst `null`. Schiffsauswahl steuert ausschließlich die Detailanzeige.

## Snapshot-Vertrag

Reine JSON-Objekte, keine Accessoren, Funktionen, Zyklen, Symbole oder nicht endlichen Zahlen. Ungültige Updates werden vor dem Rendern abgelehnt. Daten werden tief kopiert. Listenzeilen benötigen jeweils eindeutige nicht leere String-IDs. `null` oder fehlende Listen/Felder heißen **Nicht verfügbar**; `[]` heißt **Keine Einträge im Snapshot**. Eine explizite `0` bleibt eine Null. Anzeigenwerte sind Strings oder endliche Zahlen, inklusive vom Adapter gelieferter Einheiten. Summen werden weder gebildet noch korrigiert.

| Pfad | Felder / Bedeutung |
| --- | --- |
| Wurzel | `demo: true` erzwingt Demo-Banner; `provenance`, `asOf` liefern Quelle und Stand |
| `company` | `id`, `name`, `availableCapital`, `capitalEvidence`, `income`, `expenses`, `period`, `coverage`, `result`, `resultScope`, `resultEvidence` |
| `ships[]` | `id`, `name`, `ownerId`, `role` (`miner`, `hauler`, `fighter`; andere separat), `location`, `activity`, `condition`, `income`, `costs`, `period`, `evidence`, `funding`, `fundingEvidence` |
| `ships[].cargo[]` | `name`, `aboard`, `available`, `unit`, `evidence`; freie Fracht niemals aus Bordmenge abgeleitet |
| `orders[]` | `id`, `name`, `shipId`, `phase` (`open`, `completed`, sonst nicht zugeordnet), `status`, `funding`, `fundingState`, `evidence` |
| `flows[]` | `id`, `name`, `from`, `to`, `amount`, `kind`, `shipId`, `at`, `evidence` |
| `production[]` | `id`, `name`, `quantity`, `unit`, `shipId`, `period`, `evidence` |
| `sales[]` | `id`, `name`, `quantity`, `unit`, `income`, `period`, `evidence` |
| `inventory[]` | `id`, `name`, `location`, `quantity`, `available`, `unit`, `evidence` |
| `transports[]` | `id`, `name`, `shipId`, `quantity`, `unit`, `route`, `status`, `income`, `costs`, `evidence` |

Der spätere autoritative Adapter liefert ausschließlich eigene/sichtberechtigte Schiffe, belegte Beträge und tatsächlich abgewickelte Leistungen. `fundingState: 'insufficient'` ist eine Core-Aussage und filtert die Unterfinanzierungsliste. Fehlendes Geld wird nicht mit einem UI-Grenzwert verglichen. `company.result` darf nur geliefert werden, wenn die Quelle die Aussage trägt; Zeitraum, Umfang und Beleg gehören dazu. Teilkosten sind ausdrücklich keine Vollkosten. Kein Unternehmensgewinn aus Kassenänderung, Lagerwert, Verkaufserlös oder geplantem Auftrag.

Vollständige Herkunft, fehlende Core-Daten und Integrationsgates: [Übernahmebericht](../../docs/LEGACY_CORPORATION_UEBERNAHME.md).

## Entwicklungstests

Node 22: `node --test tests/*.test.mjs`; für Einzeltestzählung zusätzlich `node --experimental-test-isolation=none --test tests/*.test.mjs`.

Chromium-Touch: `PLAYWRIGHT_MODULE=/pfad/zu/playwright node tests/legacy-corporation-touch.cjs`. Externes Playwright ist nur ein Entwicklungswerkzeug, keine Repository-Abhängigkeit. Optional `CHROMIUM_PATH` und `SCREENSHOT_DIR`. Der Test startet einen temporären lokalen statischen HTTP-Server und räumt ihn auf.
