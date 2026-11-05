# Aphros Void – Einstieg und Entwicklungsstand

> **Nur Navigationsindex (Stand 05.11.2026), keine zweite Roadmap.** Verbindlich: [ROADMAP.md](ROADMAP.md) für Produktentscheidungen, [PROJEKTSTATUS.md](PROJEKTSTATUS.md) für technische Belege und [AGENTS.md](../AGENTS.md) für Entwicklung. Alle Angaben sind branchbezogen. Historische CI- und Simulationsergebnisse nicht als neue Produktfreigabe lesen.

## Drei Wahrheiten auseinanderhalten

| Bereich | Tatsächlicher Stand |
| --- | --- |
| **[MAIN]** | [main](https://github.com/tobiasfranziskus/Check/tree/main) bei **b4e604d6**, v0.12.5 / **Regel14 / Schema8**; W0–W5 nicht gemergt oder ausgeliefert |
| **[DRAFT] Wirtschaft** | [#200 – W5r](https://github.com/tobiasfranziskus/Check/pull/200), gestapelter Forschungsstand **Regel32 / Schema8** auf W5q; physischer Hüllenverschleiß, tatsächlich bezahlter Ersatz, Arbeitswartung, aber **fehlende fertige Frachterhüllen**, noch nicht dauerhaft wirtschaftlich stabil |
| **[TEST] W5r** | [GitHub-CI #42065843200](https://github.com/tobiasfranziskus/Check/actions/runs/42065843200) abgeschlossen: 7 Jobs erfolgreich, 1 übersprungen; W5r-PR berichtet außerdem 8/8 neue Direktprüfungen, 13 Seeds ×90 Spieltage und 365-Tage-Stressfälle. Kein iPad-/NAS-Test |
| **[DRAFT] UI** | [#186 Fitting](https://github.com/tobiasfranziskus/Check/pull/186), [#187 Station](https://github.com/tobiasfranziskus/Check/pull/187), [#189 Pilotenakte](https://github.com/tobiasfranziskus/Check/pull/189), [#195 Bergbauscanner](https://github.com/tobiasfranziskus/Check/pull/195), [#198 Konzernzentrale](https://github.com/tobiasfranziskus/Check/pull/198): eigenständige **lesende** Legacy-Prototypen; keine produktive Integration, Core-Adapter/Safari-NAS-Gate noch offen |
| **[OFFEN] Freigabe** | Hauptlink/Deployment, iPad Safari/NAS, ein gemeinsamer freigegebener Forschungs-/Produktslot, Schiff- und Ersatzteilproduktion, belastbar dauerhafte Kaufkraft/Finanzierung, Freigabe konkreter Geldmodell-B-Regeln |

**Achtung:** W5q-Exportemission ist ein isoliertes Testprofil, **standardmäßig deaktiviert und nicht freigegeben**. W5r-Verschleißintervalle/Wartungskosten sind Forschungsannahmen, nicht beschlossene Produktregeln. Spielstände der Regel14-Hauptwelt und der Forschungswelten niemals still zusammenführen oder überschreiben.

## Aktive W5-Forschungsfolge – nur bei Arbeit am jeweiligen Schritt öffnen

| Schritte | PR-Kette | Schwerpunkt |
| --- | --- | --- |
| W0–W2 | [#161](https://github.com/tobiasfranziskus/Check/pull/161) → [#164](https://github.com/tobiasfranziskus/Check/pull/164) → [#165](https://github.com/tobiasfranziskus/Check/pull/165) → [#166](https://github.com/tobiasfranziskus/Check/pull/166) → [#167](https://github.com/tobiasfranziskus/Check/pull/167) | Erzpilot, 2D-Miner, vorfinanzierter NPC, Konzernansicht, isolierter Save |
| W3–W5 | [#168](https://github.com/tobiasfranziskus/Check/pull/168) → [#169](https://github.com/tobiasfranziskus/Check/pull/169) → [#170](https://github.com/tobiasfranziskus/Check/pull/170) → [#171](https://github.com/tobiasfranziskus/Check/pull/171) | Erztransport, bezahlte Raffinerie, echte Schiffproduktion, Konzernkassen |
| W5b–W5f | [#173](https://github.com/tobiasfranziskus/Check/pull/173) → [#175](https://github.com/tobiasfranziskus/Check/pull/175) → [#176](https://github.com/tobiasfranziskus/Check/pull/176) → [#178](https://github.com/tobiasfranziskus/Check/pull/178) → [#179](https://github.com/tobiasfranziskus/Check/pull/179) → [#180](https://github.com/tobiasfranziskus/Check/pull/180) → [#181](https://github.com/tobiasfranziskus/Check/pull/181) | Jägerbau/-kampf, 2D-Frachter, gemeinsame Forschungswelt, Gehalt/Kopfgeld/MK1 |
| W5g–W5m | [#182](https://github.com/tobiasfranziskus/Check/pull/182) → [#183](https://github.com/tobiasfranziskus/Check/pull/183) → [#184](https://github.com/tobiasfranziskus/Check/pull/184) → [#185](https://github.com/tobiasfranziskus/Check/pull/185) → [#188](https://github.com/tobiasfranziskus/Check/pull/188) → [#190](https://github.com/tobiasfranziskus/Check/pull/190) → [#191](https://github.com/tobiasfranziskus/Check/pull/191) → [#192](https://github.com/tobiasfranziskus/Check/pull/192) | Nachfinanzierung, offene Miner-Angebote, Konkurrenz, MK1-Bohrkopf, Vollkosten |
| W5n–W5r | [#193](https://github.com/tobiasfranziskus/Check/pull/193) → [#194](https://github.com/tobiasfranziskus/Check/pull/194) → [#196](https://github.com/tobiasfranziskus/Check/pull/196) → [#197](https://github.com/tobiasfranziskus/Check/pull/197) → [#200](https://github.com/tobiasfranziskus/Check/pull/200) | Eis/Wasser, Haushalte, Kaufkraftanalyse, Exporthypothesen, Verschleiß und Ersatzengpass |

**Die Pfeile beschreiben die Entwicklungs-/PR-Abhängigkeit, keine Merge-Freigabe.** Vor einem Merge muss der Stack auf eine gesondert geprüfte Integrationsbasis konsolidiert werden. Keine 30 Einzel-PR-Merges blind hintereinander.

## Archiviert ohne Merge (Originalbranches und Nachweise bleiben erhalten)

- [#162](https://github.com/tobiasfranziskus/Check/pull/162): isolierte 2D-Demo in #164 weiterentwickelt; Renderer/Tests dort teilweise bewusst angepasst.
- [#163](https://github.com/tobiasfranziskus/Check/pull/163): W2-NPC-Original in #165 übernommen; NPC-Testdatei Git-blob-identisch.
- [#172](https://github.com/tobiasfranziskus/Check/pull/172): Jäger-Renderer vollständig und blob-identisch in #175 übernommen.
- [#174](https://github.com/tobiasfranziskus/Check/pull/174): abgeschlossener eigenständiger Piratenbelt-Audit, nicht produktiv übernommen.
- [#177](https://github.com/tobiasfranziskus/Check/pull/177): Frachterprototyp vollständig blob-identisch in #179 übernommen.
- [#199](https://github.com/tobiasfranziskus/Check/pull/199): alternativer W5r-Verschleiß nach bezahlten Arbeitsminuten und physischer Eis-/Lohnwartung; **nicht widerlegt**. Vergleich mit #200 vor Festlegung einer Produktregel nötig.

## Leseregel und spätere Löschkandidaten

1. Im neuen Chat zuerst **AGENTS, aktuelle main-Referenz, ROADMAP, PROJEKTSTATUS, offenen PR-Stack und CI** prüfen; dann diesen Index plus **nur den Bericht des betroffenen W5-Schritts** lesen. Alte B8-Analysen und frühere Testberichte nur bei konkreter Rückfrage öffnen. Das spart Kontext, ohne verbindliche Quellen zu ersetzen.
2. **Noch nichts aus dem aktiven W5-Stack löschen.** Sobald eine gemeinsame Integration ihre Regressionen/Save-Gates bestanden hat, prüfen, ob ältere, nicht mehr referenzierte versionsspezifische Ansichtsdateien unter prototypes/w5-welt/ und isolierte Demo-Seiten statt im Produktbranch im Git-Archiv verbleiben können. Keine Test-Fixtures, Save-Migrationen oder Referenz-Hashes ungeprüft entfernen.
3. Nur **Core-Adapter** aus den Legacy-PRs übernehmen, deren Daten nachweislich existieren. Keine alten Geld-, Markt- oder Kampfregeln und keine parallelen Kernimplementierungen importieren.
4. PRs schließen reduziert die **offene Liste**, nicht automatisch die Git-Historie oder belegten Repository-Bytes. Ein History-Rewrite für kleine Einsparungen ist wegen der gestapelten Branches derzeit unverhältnismäßig und riskant.

**Nächste fachliche Priorität:** zuerst physischen, vollständig finanzierten Frachter-/Miner-Nachbau samt Ersatzteilherkunft nachweisen, dann einen schlanken Integrationskandidaten mit 13 ×90 Tagen, Spar-/Insolvenztests, Save/Load- und Browser-Abnahme vorbereiten. Kein Merge oder Deployment ohne Freigabe.
