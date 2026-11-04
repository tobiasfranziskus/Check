# [DRAFT] Integrationsabgleich W5b-Core #173 ↔ Codex-Renderer #172

Stand: 04.11.2026. **Unveränderte Quell-Drafts:** [#172](https://github.com/tobiasfranziskus/Check/pull/172) Renderer auf #171, [#173](https://github.com/tobiasfranziskus/Check/pull/173) bezahlter Jägerbau auf #171. Dieser Integrations-Draft setzt **auf #173 auf** und übernimmt die zehn neuen Dateien aus #172 inhaltlich unverändert. `main b4e604d6` bleibt unberührt. Kein Merge/Deployment.

## Schnittstellen-Delta

| Core-Auftrag A | Renderer-Auftrag B | Adapter |
| --- | --- | --- |
| `version: JagdSichtV1`, `tick` | identisch | Werte unverändert |
| `jaeger[]` | `schiffe[]` | Nur wirklich vorhandene Jäger aus dem gewünschten System |
| `owner` | `besitzer:{id,art}` | `house=spieler`, `npc3=npc`, sonst NPC (außer `pirates`) |
| `system` je Schiff | ein `systemId` | echte Systemfilterung, keine Verschiebung |
| kein Anomaliebeleg | `anomalieId` erforderlich | `werft-kontakte-ohne-anomalie` (klar gekennzeichnete schematische Ansicht) |
| keine Kampfereignisse | `ereignisse[]` | strikt **leeres Array**, keine erfundenen Piraten, Schüsse, Abschüsse oder Kopfgelder |
| `hpMax` | noch keine HP-Anzeige | kein Kampf-/Schadensmodell ergänzt |
| keine Pilotendaten | `pilotId/xp/rang` optional | bewusst **nicht** gesetzt |
| `werft` | Jägerkontakte | Lagerware erscheint **nicht** als aktives Schiff |

## Umsetzung

`prototypes/w5-jagd/m_ui_w5b_bridge.mjs` exportiert `w5bJagdSichtAusCore(coreSicht, systemId?)`. Eingangsdatum kommt **ausschließlich** aus `m_core_index.JagdSichtV1(state)`. Es gibt keinen direkten Import des Produkt-Cores, kein neues Save, keine zusätzliche Uhr und keine Bildschirm-Physik. Die Brücke validiert und friert den vollständigen B-Snapshot erneut ein. Codex-Renderer und Mock-Referenzvorschau bleiben unverändert, sodass alte #172-Tests reproduzierbar sind.

`tests/w5b-jagd-integration.test.mjs` erzeugt in echter Regel20-Welt einen real bezahlten Jäger, prüft das Vorher-Lager (0 aktive Jäger), danach tatsächliche `sh…`-ID und NPC-Besitz, liest denselben echten Core-Zustand 100 Renderer-Zeichnungen lang, prüft unveränderten Hash/Save/Waren-/ISK-Audit und den leeren Belegstrom. **[TEST ERFOLGREICH]** [CI #41860016834](https://github.com/tobiasfranziskus/Check/actions/runs/41860016834) auf Code-Head `ffe80b7`: **177/177 Node-Tests grün**, 0 Fehler/Skips, inklusive des neuen echten W5b-Renderer-Kettentests und der bestehenden W5b-13×90-Tage-Suite. Alle sieben ausgeführten CI-Jobs erfolgreich; ein optionaler Vergleich planmäßig übersprungen. Echte iPad-/NAS-Abnahme bleibt ausstehend.

## Grenzen

**Nicht in den Browser-Hauptlink integriert:** Es existiert noch kein Regel20-Browser-Modus und kein geschützter Regel20-Save-Slot. Die Codex-Vorschau bleibt ausdrücklich Mock; die Brücke ist bereits an reale Core-Daten getestet, aber ein produktiver UI-Anschluss benötigt einen getrennten Auftrag einschließlich Save-Abnahme. Keine Piratensysteme, keine Schadens-/Abschussereignisse, keine Pilotenskills oder Jagd-KI. Das ist die technisch kleine, kontrollierbare Integration, keine Veröffentlichung. Echte iPad-Safari-/NAS-Abnahme ausstehend.
