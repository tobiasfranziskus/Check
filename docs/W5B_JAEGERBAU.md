# [DRAFT] W5b – industrieller Jägerbau, Regel20

**Stand 04.11.2026, gestapelter [Draft-PR #173](https://github.com/tobiasfranziskus/Check/pull/173)** auf #171. `main b4e604d6`, Regel14/Schema8, bleibt unverändert. Kein Merge, kein Deployment, keine Browserfreischaltung und keine Spielstandsmigration.

## Unveränderte Referenzrezepte und offene Abhängigkeiten

- **Regel14** `r_bauteil`: 2 Material + 1 Silizium → 1 Bauteil, 8 Minuten.
- **Regel14** `r_jaeger`: 8 Bauteile + 4 Material → 1 Jäger, 32 Minuten.
- Zusammen: **20 Material aus vier echten W4-Chargen** à 10 Erz und 20 ISK Lohn; **8 Silizium** und **96 Minuten** finanzierte Bauteil-/Jägerarbeit.
- W4-Material entsteht aus **40 real in Nadir eingetroffenen Erz**, das zuvor der W3-Frachter im 50er-Auftrag tatsächlich transportiert und Käufer/Spedition bezahlt haben.
- Das W5a-Frachterrezept und sein Treuhandmodell bleiben vollständig erhalten. Die Pilotwerte der Forschungsstufe sind keine künftige Balancing- oder Preisentscheidung.

## Eng begrenzter W5b-Vertikalschnitt

Die Regel20-Welt ergänzt genau **eine Siliziumcharge von 8 Einheiten**. Ein Miner aus dem *vorhandenen* endlichen Starter-Hüllenbestand wird im Nadir-Markt bereitgestellt (eine Aldera-Hülle weniger, keine kostenlose Neuschöpfung). `house` kauft diese Hülle für **600 ISK** aus der eigenen Kasse. Für den achtminütigen Siliziumauftrag reserviert Nadir die **192 ISK Warenabnahme** in separater Treuhand; der Hersteller reserviert **16 ISK Bergbauarbeit**. Jede Minute bringt genau 1 wirklich geschürftes Silizium und bezahlt 2 ISK Arbeit. Erst nach Abschluss werden die 8 Silizium in Nadir gegen die reservierten 192 ISK abgenommen. Danach ist das begrenzte Vorkommen für diese Forschungsstufe erschöpft.

Mit dem bereits aus W3/W4 bezahlten Material lässt `house` in Nadir acht Bauteile fertigen: **16 Material + 8 Silizium**, **1.792 ISK** Kaufwert für die realen Vorprodukte und **64 ISK** für 64 tatsächlich ausgeführte Minuten Werkarbeit. Der nachgelagerte Jäger verbraucht **8 Bauteile + 4 Material** gegen **400 ISK** Materialkauf und **32 ISK** für 32 Minuten Arbeit. Sämtliche Zutaten werden physisch aus dem Lager entfernt und in den Waren-Ledgern verbraucht; Bauteile und Jäger erscheinen erst nach vollständig bezahlter Produktion.

Das fertige Schiff bleibt zunächst **ein Lager-Jäger** in Nadir. Erst `shipBuy` des existierenden Konzerns `npc3` für den **900-ISK-Regel14-Referenzpreis** bezahlt den Hersteller, reduziert das Lager und aktiviert eine eindeutige `sh…`-ID im selben gemeinsamen Core mit `owner=npc3`, `system=nadir`, `heimat=nadir`. Kassen- oder Warenmangel führt zur Ablehnung **ohne Nebenbuchung**. Die 33.000 Start-ISK bleiben unverändert, kein `minted`-Geld.

## Schnittstelle für separaten Renderer

`m_core_index.JagdSichtV1(state)` liefert eine **tief unveränderliche, ausschließlich lesende** Projektion: `version`, `tick`, `jaeger[]` mit `id`, `owner`, `klasse`, `system`, `heimat`, `phase`, `auftrag`, `name`, `hpMax` sowie `werft` mit physischem Bestand, produzierten/verkauften Jägern und explizit erfassten Verlust-IDs als künftigem Ersatzbedarf. Keine laufende Physik, keine Kämpfe, keine Piratenspawns, keine Kopfgeldemission, keine Pilotenskills, keine Frachterüberfälle und keine Renderer-Eingriffe in Corezustand. Ein tatsächliches Zerstörungsereignis und die dazugehörige Ersatzkauf-Finanzierung sind noch **nicht implementiert**.

## Qualität, Grenzen und Integration

`tests/w5b-jaegerbau.test.mjs` prüft den realen W1–W5b-Materialweg, Vorfinanzierungen, 900-ISK-Kauf, Schiffsidentität, unveränderliche Projektion, negative Gegenproben, Manipulation trotz gleichbleibender Geld-/Warensummen, Save/Load und deterministischen täglichen Audit/Replays für **13 Seeds ×90 Tage**. Die CI und ihre tatsächlich abgeschlossenen Ergebnisse sind dem PR zu entnehmen; bis zur grünen CI keine Testfreigabe behaupten. Die unveränderten Regel14-Referenzjobs laufen über den bestehenden Workflow.

**Ausdrückliche Grenzen:** Eine endliche Siliziumförderung ist **keine dauerhaft erneuerbare Rohstoffwirtschaft**. Ein einmal gebauter Jäger beweist keine dauerhafte Nachfrage oder profitablen Jägerabsatz. Der NPC `npc3` kauft gezielt ein einziges Schiff; keine KI-Investitions-, Verlust-, Jagd- oder Insolvenzregel. `JagdSichtV1` ist ausschließlich Core-API; noch kein 2D-Jäger im Browser, keine neue Speicherhülle für Regel20. Eine spätere Veröffentlichung benötigt Integrationsprüfung des Codex-Renderers, des Claude-Audits, ggf. eines eigenen geschützten Save-Slots sowie reale iPad-Safari-/NAS-Abnahme und ausdrückliche Nutzerfreigabe.
