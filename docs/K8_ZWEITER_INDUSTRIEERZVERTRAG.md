# K8 – zweite Industrie-Erzlieferung aus vorhandenem Eigentum und Kapital

**[DRAFT/ANALYSE · 13.11.2026]** Grundlage: K7-Vertrag [#315](https://github.com/tobiasfranziskus/Check/pull/315) sowie Quell-/Produktisolierung [#322](https://github.com/tobiasfranziskus/Check/pull/322). Kein Merge nach main, keine Änderung an Produktregeln, `index.html`, `aphros-void.html`, Geldmodell B oder vorhandenen Spielständen.

## Untersuchungsziel

Ein einzelner korrekt bezahlter W1–W5-Industrieauftrag garantiert keine Nachlieferung nach Verbrauch der Hüllen. Genau deshalb untersucht `tests/k8-zweiter-industrieerz-vertrag.test.mjs` **Seed 42 und Seed 7** mit dem ursprünglichen K4/K5-Krisensave bei Tick 21612 und dem vollständig bezahlten K7-Vertrag als Start. Im ersten Schritt werden 50 Erz wirklich gefördert, die 740 ISK der Käufer genau einmal gebunden, eine Original-W3-Rundfracht ausgeführt, Material verarbeitet und ein physischer W5-Frachter gebaut und bei bezahlbarem Preis tatsächlich gekauft/überführt.

Danach testet K8 auf diesem **identischen** Stand zwei Alternativen:

1. Original-NPC-Automatik und keine zusätzliche Umplanung.
2. Ausschließlich **vorhandene** Eigentümerbefehle zum Stoppen vorhandener `npc3`-Pendler und das vorhandene Politikflag `eisfracht:false` zur eigenverantwortlichen Transportplanung.

Das Testwerkzeug sucht ausschließlich aktuell freie, vorhandene NPC-Miner und Frachter. Jeder abgelehnte Vertragsversuch wird auf vollständige Zustandsatomizität geprüft. Sobald ein zweiter Vertrag möglich ist, müssen alle ursprünglichen Eigentümer wirklich unterschreiben und die volle Käufer-/Crew-/Werft-Treuhand leisten. Dann folgt ein weiterer originaler Core-Simulationslauf; ohne physische Ware oder Käufergeld gibt es keine fingierte Buchung. Bei fehlender Finanzierung/Schiffsverfügbarkeit wird ein **negativer Nachweis** mit Blockiergrund protokolliert, nicht ein künstlich erfolgreicher Test.

### Prüfpflichten

- 33.000 ISK Weltgeld, Mint/Burn 0; unabhängiger Core-Audit; unveränderte Spielstände und Eigentumsrechte.
- Reale W3-Käuferbindung von 740 ISK **pro** Vertrag, 120 Crew- und 530 Werftreserve nur bei wirklichem Vertrag.
- Save/Load, manipulationssichere Regel200-Grenze, 30-Minuten-Hash-Replay.
- Maschinenlesbare `K8_FOLGEVERTRAG`-Zeilen pro Seed und Versuchspfad mit wirklichen Käuferkassen, Vertrags-/Lieferstatus, Gründen und Referenzhash.

**[TESTSTATUS]** Der neue K8-Lauf ist nach dem Commit separat durch GitHub Actions auszuführen. Eine bestandene Infrastruktur-CI allein ist kein Nachweis eines zweiten positiven Vertrags; das Ergebnis ergibt sich aus den protokollierten Buchungen und Lieferungen. 13 wirtschaftlich unterschiedliche K7-90-Tage-Krisen und 365-/730-Tage-Langzeitfälle bleiben eigenständige Prüfungen. Echte Safari-/NAS-Abnahme und W6-Dauerwirtschaft sind nicht erteilt.
