# W5ai – zweiter echter Fracht- und privater Einkommenszyklus

> [DRAFT/ANALYSE · 09.11.2026] Gestapelt auf W5ah PR #279, W5ag #278; main fd3e9154 / Regel14 / Schema8 bleibt unverändert. Verbindlich ist nur main/docs/ROADMAP.md; dieses Dokument ist kein Produktbeschluss.

## Eigenständiger, vollständig finanzierter Folgeschritt

W5ah stellte zwei Wasserchargen her, kaufte 16 Wasser für 224 ISK, finanzierte aber **keinen neuen Fluglohnzyklus**. W5ai verwendet **unverändert Original-Regel195**, denselben W0–W5-Core und dieselbe manuelle Oberfläche. Neu sind die nachgewiesene zweite Eisförderung und ein zweiter originaler Eisfrachtvertrag, dessen 120 Arbeitsminuten **zusätzliche** 120 ISK auf das **eigene** Konto des Eispiloten zahlen. Neue Anfangsgelder, erfundene Aufträge, Preisänderungen, automatische Verbrauchspflichten, Mietrenten oder Haushalts-Transfers sind ausgeschlossen.

In der isolierten W5ah/W5ai-Oberfläche ist der Folgeschritt manuell möglich: Tick310 → erneut 50 Eis fördern (50 min, Miner zahlt 100 ISK) → 50 neue Eis zunächst im Miner-Frachtraum → über den vorhandenen Original-Core-Befehl `shipSellIce` **erst nach tatsächlichem Ankauf aus Alderas eigener Kasse** ins Quelllager, → neue vom **Nadir-Käufer** mit 490 ISK (250 Ware + 240 Fracht) und **Spedition** mit 120 ISK Arbeitslohn tatsächlich vorfinanzierte Eisfracht → nach 60 min realer Hinflug 50 neues Eis in Nadir, erst 60 neue ISK verdient → optionaler persönlicher Wasserkauf → neue Nadirsche 20-ISK-Wasserwerksarbeit → nach echtem Rückflug weitere 60 ISK tatsächlich ausgezahlt.

Der W5ai-UI-Readout zeigt die tatsächlich im Core enthaltenen Lohnminuten, getrennten ISK-Vermögen und Zahl der ursprünglichen Eisverträge. Er darf keine eigenen Buchungen ausführen. Der rechtlich unverbindliche Forschungs-Wasserpreis bleibt 14 ISK/Stück.

### Erwartete Messwerte (erst nach ausgeführter CI als bewiesen kennzeichnen)

Seed42, manuell fortgesetzter W5ah-Stand ab Tick310: zweite Eischarge 50; zweiter bezahlter Eisflug Tick360–480. Eispilot: kumuliert 240 ISK für zwei tatsächliche 120-Minuten-Flüge; erste W5ah-Wasserkäufe 112 ISK, weitere aus neuen Arbeitsminuten nachweislich 126 ISK, Ersparnis 2 ISK. Erzpilot verdient weiterhin 120 ISK, kauft 8 Wasser/112 ISK und spart 8 ISK. Drei bezahlte Wasserwerkschargen liefern insgesamt 30 Wasser; davon 25 physisch für 350 ISK konsumiert, 5 Wasser verbleiben. 33.000 ISK Weltgeld, 0 Minting. **Das ist noch kein unbegrenzt dauerhafter Wirtschaftskreislauf.**

### Grenzen, Krisengates und Tests

- Ohne bezahlten wirklichen Ankauf in Aldera – auch bei vorhandener Minerfracht –, volle 490 ISK Nadir-Budget bzw. 120 ISK eigene Speditionsreserve darf kein zweiter Eisflug beginnen. Auch die 50er-Eischarge muss physisch erneut vorhanden sein. Die einzelnen privaten Kunden dürfen unbeschränkt sparen; niemand ist zum Kauf verpflichtet. Nadir erhält Verkaufserlöse nur nach tatsächlichem Wasserverkauf.
- Die zweite neue Lohnrunde nutzt einen echten, freiwillig beauftragten Zusatztransport. Das ist **kein** Nachweis für exogene dauerhafte Beschäftigungs-/Endnachfrage und keine automatische Liquiditätsrückführung aus sparenden Privatkonten. Dauerwirtschaft W6, Insolvenz-Nachfolge und Wartung/Schiffbau bleiben offen.
- `tests/w5ai-zweiter-lohnzyklus.test.mjs`: neue Ware, neue 490-/120-ISK-Reservierung, zwei getrennte Vertragsbelege, minutengenaue zwei Lohnrunden, private Folgekäufe, verweigerte Unterdeckung, Sparfall, Save/Load-Fälschungsschutz und 90d-Krisen-Replay. Die vorherigen 13×90d und 365d-Forschungstests laufen unverändert mit. `tests/w5ai-touch.py`: vier Chromium-Touchgrößen; keine Behauptung einer echten Safari/NAS-Abnahme.
- Keine Änderung an `prototypes/w5ac/rule191-w5-ferry-core.js`, produktivem `index.html`, Save-Slots, W5ag-Anfangsgeld, Regelversion/Schema, Pages, neuen Regeln oder Produkt-Merge.

**Prüfstatus:** Tests erst nach tatsächlicher Ausführung als erfolgreich ausweisen.
