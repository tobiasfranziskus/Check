# Aphros Void – Dokumentation und Entwicklungszweige

> **Navigationsindex, keine zweite Roadmap.** Produktprioritäten und Freigaben stehen ausschließlich in [ROADMAP.md](ROADMAP.md), technische Nachweise in [PROJEKTSTATUS.md](PROJEKTSTATUS.md), Entwicklungsregeln in [AGENTS.md](../AGENTS.md). Maßgeblich ist immer der jeweilige Git-Branch. Stand: **04.11.2026**.

## Verbindlicher Stand

| Achse | Stand und Quelle |
| --- | --- |
| **[MAIN] Produkt** | [`main`](https://github.com/tobiasfranziskus/Check/tree/main), Commit `b4e604d6`, v0.12.5 / Regel 14 / Schema 8. Die folgenden Drafts sind **nicht** auf `main` veröffentlicht. |
| **[DRAFT] Forschung** | [PR #181](https://github.com/tobiasfranziskus/Check/pull/181), Code-Head `a0b4a29`, dokumentierter Head `423f18d`, **Regel 23 / Schema 8**, eigene Forschungswelt und getrennte Browser-Spielstände. |
| **[DRAFT] Aktuelle Forschung** | [PR #183](https://github.com/tobiasfranziskus/Check/pull/183), **Regel24 / Schema8**: reale dritte Industriecharge, bezahlter NPC-Ersatz nach Verlust und nachgewiesene Fabrikmarge −1.388 ISK; 8/13 finanzierbar, 5/13 bei Exportkaufkraft blockiert, 0 neue ISK. |
| **[TEST] W5g-CI** | [Workflow #41931017679](https://github.com/tobiasfranziskus/Check/actions/runs/41931017679), Code-Head `572553b`, **217/217 Node-Tests**, alle sieben ausgeführten Jobs grün, ein Skip. |
| **[TEST] Code-CI** | [Workflow #41925076369](https://github.com/tobiasfranziskus/Check/actions/runs/41925076369) komplett grün, **207/207 Node-Tests**, darunter 13 Seeds × 90 Tage mit Audit, Replay und Save/Load. [Dokumentations-Head #41925543292](https://github.com/tobiasfranziskus/Check/actions/runs/41925543292) ebenfalls vollständig grün. |
| **[OFFEN] Praxis** | iPad-Safari, NAS/CSP/MIME, öffentlicher Hauptlink, echte langfristig finanzierte Endnachfrage. Keine Produktfreigabe, kein Merge/Deployment. |

## Aktiver, gestapelter Forschungsweg

Diese PRs bleiben geöffnet, weil spätere Stände auf ihren Branches aufbauen. Eine PR enthält **nicht** automatisch die Freigabe ihrer Vorgänger.

| Abschnitt | Aktive PRs | Inhalt |
| --- | --- | --- |
| **W0–W1 / 2D** | [#161](https://github.com/tobiasfranziskus/Check/pull/161), [#162](https://github.com/tobiasfranziskus/Check/pull/162), [#164](https://github.com/tobiasfranziskus/Check/pull/164) | Erzpilot, 2D-Übernahme, Miner-Integration |
| **W2 / Unternehmen** | [#163](https://github.com/tobiasfranziskus/Check/pull/163), [#165](https://github.com/tobiasfranziskus/Check/pull/165), [#166](https://github.com/tobiasfranziskus/Check/pull/166), [#167](https://github.com/tobiasfranziskus/Check/pull/167) | Kapital, Nachfragegates, gemeinsame Oberfläche und Save |
| **W3–W5 / Produktion** | [#168](https://github.com/tobiasfranziskus/Check/pull/168), [#169](https://github.com/tobiasfranziskus/Check/pull/169), [#170](https://github.com/tobiasfranziskus/Check/pull/170), [#171](https://github.com/tobiasfranziskus/Check/pull/171) | Vorfinanzierter Frachter, Raffinerie, Schiffbau und Konzernkonten |
| **W5b–W5d / Jäger** | [#173](https://github.com/tobiasfranziskus/Check/pull/173), [#175](https://github.com/tobiasfranziskus/Check/pull/175), [#176](https://github.com/tobiasfranziskus/Check/pull/176), [#178](https://github.com/tobiasfranziskus/Check/pull/178) | Bauteile/Jäger, Renderer, bezahlte Piratenhülle, Kampf und Verluste |
| **Integration** | [#179](https://github.com/tobiasfranziskus/Check/pull/179), [#180](https://github.com/tobiasfranziskus/Check/pull/180), [#181](https://github.com/tobiasfranziskus/Check/pull/181) | 2D-Frachter übernommen; gemeinsame W5e-Welt; W5f-Pilotengehalt, Kopfgeld und MK1-Laser |
| **W5g-Finanzierungsprüfung** | [#182](https://github.com/tobiasfranziskus/Check/pull/182) (Dokumentationspflege), [#183](https://github.com/tobiasfranziskus/Check/pull/183) (Forschung) | Tatsächliche Ersatzbuchung, 8/13 Drittchargen, 5/13 Kaufkraftstopps |

**Direkte Arbeitsbasis für weitere W5g-Forschung:** der geprüfte, noch nicht gemergte Code-Head von **#183**, nicht `main`. Branch-/Regelwechsel niemals durch Ersetzen vorhandener JSON-Saves vortäuschen. `main` und die Forschungswelten verwenden eigene, bewusst getrennte Spielstände.

## Archivierte, nicht gemergte Einzel-PRs

| PR | Warum archiviert / Nachweis |
| --- | --- |
| [#172 – isolierter Jäger-Renderer](https://github.com/tobiasfranziskus/Check/pull/172) | **Alle 10 Dateien** (einschließlich Browser-/Node-Tests und Dokumentation) per identischem Git-Blob in **#175** übernommen. |
| [#177 – Codex-2D-Frachter](https://github.com/tobiasfranziskus/Check/pull/177) | **Alle 8 Dateien** (einschließlich Browser-/Node-Tests) per identischem Git-Blob in **#179** übernommen. |
| [#174 – Piratenbelt-Ökonomieaudit](https://github.com/tobiasfranziskus/Check/pull/174) | Unabhängige, abgeschlossene **[ANALYSE]**; bewusst nicht in Produktcode integriert. Audit, Kommentare und CI-Belege bleiben im geschlossenen PR zugänglich. |

**Bereinigung am 04.11.2026:** damals 21 → **18 offene PRs**; anschließend kamen die neuen Drafts **#182/#183** hinzu (20 offene PRs zum Zeitpunkt der W5g-Prüfung). Keine produktiven Dateien oder Spielstände gelöscht, keine PR gemergt. Originalbranches und Commits bleiben als historische Quellen erhalten. Weitere ältere Forschungsbranches wurden **nicht blind gelöscht**; der Branch-Bestand ist ausdrücklich noch nicht physisch reduziert.

## Dokumente schnell finden

- [W5G_VOLLKOSTEN_UND_ERSATZ.md](W5G_VOLLKOSTEN_UND_ERSATZ.md): aktuelle Finanzierungsprüfung mit echten Drittchargen und Exportkaufkraftstopps.
- [W5F_PILOTEN_KOPFGELD_LASER.md](W5F_PILOTEN_KOPFGELD_LASER.md): aktuelle endliche Forschungskette, negative Finanzierungsprüfungen und Grenzen.
- [W5E_FORSCHUNGSWELT.md](W5E_FORSCHUNGSWELT.md): getrennte IndexedDB, Import/Audit, gemeinsame Core-Sitzung.
- [W5D_ZWEI_JAEGER_KAMPF.md](W5D_ZWEI_JAEGER_KAMPF.md) und [W5D_FRACHTER_INTEGRATION.md](W5D_FRACHTER_INTEGRATION.md): reale Jägerverluste und Frachterübernahme.
- [W5B_JAEGERBAU.md](W5B_JAEGERBAU.md): erste echte Bau-/Kaufkette, negative Marge und begrenzte Nachfrage.
- [ANALYSEARCHIV_HANDELSZYKLUS_2026-10-31.md](ANALYSEARCHIV_HANDELSZYKLUS_2026-10-31.md) und [ARCHITEKTUR_WIRTSCHAFT_V12.md](ARCHITEKTUR_WIRTSCHAFT_V12.md): historische Wirtschaftsforschung, **kein aktiver Produktplan**.
- `tests/`: unveränderte Golden-Referenzen, Core-/Save-/Bilanz-/Langzeittests; `tests/browser/`: gesonderte Browser-Smokes, kein Nachweis einer realen iPad-/NAS-Abnahme.
- `prototypes/w5-welt/welt.html` (Regel22) und `prototypes/w5-welt/w5f.html` (Regel23): **Forschungsseiten**, nicht Produkt-Hauptlink.

## Pflegegrundsatz

Archiviere nur eindeutig abgegrenzte Arbeiten und dokumentiere die Nachfolge. Schließe keine PR, deren Branch für aktive gestapelte PRs benötigt wird. Keine pauschalen Löschaktionen an Spielständen, Test-Fixtures, Referenzdaten, Archivberichten oder historischen Branches. Für die nächste Entwicklung erst den jüngsten PR-Head und seine CI prüfen, dann gezielte Änderungen mit eigenen Audits vornehmen. **Eine bestandene begrenzte 90-Tage-Welt beweist noch keine dauerhaft selbsttragende Wirtschaft.**
