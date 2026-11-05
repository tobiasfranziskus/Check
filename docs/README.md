# Aphros Void – Entwicklungsindex (05.11.2026)

> **Navigation, keine zweite Roadmap.** Verbindlich bleiben [ROADMAP.md](ROADMAP.md) (Produkt), [PROJEKTSTATUS.md](PROJEKTSTATUS.md) (Technik), [AGENTS.md](../AGENTS.md) (Regeln) und der tatsächliche Git-Stand. Vorhaben/Tests in Drafts sind keine Produktfreigabe.

## Aktueller Stand

| Status | Befund |
| --- | --- |
| **[MAIN]** | [main](https://github.com/tobiasfranziskus/Check/tree/main) **b4e604d6**: v0.12.5, **Regel14/Schema8**. Der W0–W5-Neuaufbau ist **nicht** integriert oder veröffentlicht. |
| **[DRAFT]** | [#200 – W5r](https://github.com/tobiasfranziskus/Check/pull/200): letzter gestapelter Forschungsstand, **Regel32/Schema8**. Echte Verschleiß-/Wartungsbuchungen; **kein fertiger Ersatzfrachter** im Lager trotz vorhandener ISK. Forschungsannahmen, keine freigegebenen Produktregeln. |
| **[TEST]** | [CI #42065843200](https://github.com/tobiasfranziskus/Check/actions/runs/42065843200) für #200s geprüften **Code-Head**: 7 Jobs erfolgreich, 1 Skip. Der PR berichtet 8/8 gezielte Direktprüfungen, 13×90d und 365d-Krisen. Eine spätere reine README-Änderung ist damit nicht erneut getestet. |
| **[OFFEN]** | iPad Safari/NAS, Hauptlink, Freigabe/Migration des Stacks, echte langfristige Ersatzschiffproduktion, stabile Kaufkraft und verbindliche Geldmodell-B-Regeln. Forschungs-Saves strikt vom Regel14-Slot trennen. |

W5q-Exportemission ist **standardmäßig AUS** und nur hypothetisch; Verschleißdauer, Wartungslohn und Ausschüttungsquoten sind **nicht beschlossen**. Keine Spieler-Spargrenze, Gratisrettung oder stille Save-Überschreibung.

## Welche Entwicklungszweige gehören zusammen?

Alle genannten PRs sind hier zu finden: https://github.com/tobiasfranziskus/Check/pulls . Die folgende Reihenfolge ist eine **Abhängigkeitsfolge**, keine Merge-Reihenfolge oder Freigabe.

| Bereich | Noch aktive PRs | Kerninhalt |
| --- | --- | --- |
| W0–W2 | **#161, #164–#167** | Erzpilot, 2D-Miner, finanzierte NPCs, Konzernansicht, Forschungs-Saves |
| W3–W5 | **#168–#171** | Vorfinanzierter Frachter, Raffinerie, Werft und Konzernkonten |
| W5b–W5f | **#173, #175, #176, #178–#181** | Jäger, Piraten, Kampf, 2D-Frachter, gemeinsame Welt, Pilotengeld und MK1 |
| W5g–W5m | **#182–#185, #188, #190–#192** | Vorherige Dokumentationspflege, bezahlter Jägerersatz, Markt, freier Eigenabbau und MK1-Bergbaurendite |
| W5n–W5r | **#193, #194, #196, #197, #200** | Eis/Wasser, Haushalte, Kaufkraftanalyse, Exportversuch und reale Verschleiß-/Ersatzgrenze |

**Einzelne Legacy-UI-Drafts gegen main:** [#186 Fitting](https://github.com/tobiasfranziskus/Check/pull/186), [#187 Station](https://github.com/tobiasfranziskus/Check/pull/187), [#189 Pilotenakte](https://github.com/tobiasfranziskus/Check/pull/189), [#195 Bergbauscanner](https://github.com/tobiasfranziskus/Check/pull/195), [#198 Konzernzentrale](https://github.com/tobiasfranziskus/Check/pull/198). Lesende, startbare Prototypen; keine produktiven Core-Adapter/Save-Verbindungen. Nur die Darstellungsmuster übernehmen, **keine alten Wirtschaftsregeln**.

## Geschlossene, nicht gemergte Ursprünge und Alternativen

| PR | Grund; Belege und Branch-Historie bleiben |
| --- | --- |
| [#162](https://github.com/tobiasfranziskus/Check/pull/162) | Isolierte 2D-Übernahme in **#164** angepasst und weitergeführt |
| [#163](https://github.com/tobiasfranziskus/Check/pull/163) | W2-Investitions-Core in **#165** übernommen, identische NPC-Testdatei |
| [#172](https://github.com/tobiasfranziskus/Check/pull/172), [#177](https://github.com/tobiasfranziskus/Check/pull/177) | Renderer bzw. 2D-Frachter blob-identisch in **#175** bzw. **#179** übernommen |
| [#174](https://github.com/tobiasfranziskus/Check/pull/174) | Nichtproduktiver Piratenbelt-Audit abgeschlossen |
| [#199](https://github.com/tobiasfranziskus/Check/pull/199) | **Alternative W5r-Forschung**, nicht widerlegt: Verschleiß nach bezahlten Minuten statt Tagen; Wartung mit echtem Eis + Lohn statt reinem Service. Vor Produktentscheidung mit #200 vergleichen |

## Gezieltes weiteres Aufräumen – nicht blind löschen

- **Kontext:** Immer ROADMAP/PROJEKTSTATUS/AGENTS und den neuesten PR/CI prüfen, dann nur das **betroffene** W5-Prüfdokument lesen; ältere B8-/V11-Berichte und archivierte Analysen bei Bedarf. Keine Chronik komplett in neue Chats kopieren.
- **Nach Integration:** Alte, nicht mehr genutzte gestaffelte Demo-Ansichten unter prototypes/w5-welt/ und Mock-Oberflächen auf konkrete Tests/Imports prüfen und erst dann aus dem Produktbranch entfernen. Save-Logik, Ledger-Tests, Golden-Hashes und Beweis-Fixtures bewahren.
- **PRs:** Alte Ursprungs-PRs schließen, wenn nachweislich im Nachfolger enthalten. Den aktiven Stack nicht ohne geprüftes Integrationskonzept schließen. Ein späterer **konsolidierter Integrations-PR** ist sinnvoller als blindes Mergen jeder Forschungsstufe.
- **Speicher:** Schließen von PRs oder Löschen aus dem aktuellen Baum verkleinert Git-Historie nicht. History-Rewrite bei den vielen voneinander abhängigen Branches vermeiden.

**Nächstes Wirtschafts-Gate:** Material-, Produktions- und Finanzierungsweg für tatsächlich verfügbare **Ersatzhüllen** (sowie Wartungsmaterial) beweisen; anschließend gemeinsame Forschungswelt/Legacy-Adapter integrieren und 13×90d, Spar- und Insolvenzfälle, Save/Load sowie iPad/NAS abnehmen. Kein Merge oder Deployment ohne Freigabe.
