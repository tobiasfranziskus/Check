# P3 – F4-Zweitfrachter nach Sicherheitskorrektur #509 (Forschung)

**[DRAFT / FORSCHUNG · 19.11.2026]** Sicherheits- und F4-Forschungsstränge **nicht** in `main` integriert. Dieser neue Forschungsbranch beginnt genau bei [#509](https://github.com/tobiasfranziskus/Check/pull/509) (`6316e5ab0a8ba02ddf8f452d1d18f0e09fcc66a3`) und überträgt ausschließlich den F4-Folgeschritt aus [#507](https://github.com/tobiasfranziskus/Check/pull/507) auf diesen bereits korrigierten Code. Die historischen Audit- und Forschungsbranches bleiben unberührt.

## Ziel und Code-Wiederverwendung

- Der zweite **wirklich gekaufte** Nadir-Frachter `sh010` muss nach real finanzierter W5ac-Überführung einen Original-F4-Vertrag beginnen und abschließen können – ohne neue Ware, Käufer, Geldquelle, Preisformel oder gefälschte Lieferung.
- Die **bestehenden** `kern.pilotIceFreightQuote` und `execute({type:'shipFreightIce',owner:'house',schiff})` bleiben die einzigen F4-Gates. Bei Zuschlag bindet ausschließlich der Originalkern die Käufer- und Arbeits-Treuhand. Der Forschungsantrag selbst verändert die JSON-Welt nicht.
- `p3ForschungsFrachtAnmeldung` existiert nur bei explizitem Node22-Opt-in `APHROS_P3_FAIR_FERRY_RESEARCH=1` und originaler Regel204. Die Forschungsqueue erteilt keine Browser- oder Save-Rechte.
- `#509`-Guards für gleichzeitig laufende W5ac, geladenen Spielzustand, J8-Weltklon, Verschleiß und endlich begrenzten Vorrang bleiben erhalten.
- Ergänzte Negativgrenze: Die eigene, bereits gestartete F4-Hausfracht **zählt nicht selbst als tatsächlicher NPC-Wiederanlauf**. Nur echte andere Transportaufträge oder ein auslaufendes Forschungsfenster heben den Vorrang auf. Weder Hausfracht noch Warteanmeldung darf die NPC-Priorität eigenmächtig quittieren.
- Die neue F4-Zulassung prüft `m_core_anlage.stillgelegt` bereits bei Anmeldung und erneut vor Start.

## Prüfplan und Evidenz

Die aus #507 übernommenen `tests/p3-second-w5-f4-research.cjs` und `.test.mjs` prüfen genau die übernommene F4-Funktion: bezahlte 60-ISK-Überführung, NPC-Wiederanlauf, legalen 50-Eis-F4-Vertrag, 490-ISK-Käufer- und 120-ISK-Arbeitstreuhand, 240-ISK-Spielerfrachtgebühr, 120-ISK-Pilotenlohn, 36-ISK-Frachterwertverzehr, originalsignierte 9→10-F4-Abschlüsse sowie bitgleichen kompletten Doppelreplay. Zusätzliche Assertion: eigene F4 darf nicht den Forschungs-NPC-Vorrang fälschlich freigeben.

Die unabhängigen positiven #509-Gate-Tests `tests/p3-audit-guard-fixes.test.mjs` laufen unverändert weiter. Zu prüfen sind insbesondere der 60-Minuten-Save/Load-Replay, kein Strecken-Doppelauftrag, der ausdrückliche J8-Fail-Closed-Abbruch, der Endlichkeitsguard und die Stilllegungsgrenze.

**QA-Status vor CI:** Quellcode übertragen und Testdateien hinzugefügt; Ausführung, wirtschaftliche Endergebnisse und gesamte CI **noch nicht bestätigt**. Für CI auf genau diesem PR-Head sind `node --test tests/*.test.mjs`, W5-/W6-/Jäger-Regression sowie getrennte Browser-Gates zu prüfen. Ein roter oder abgebrochener Job ist nicht bestanden.

## Grenzen / Integrationssperre

Die Warteschlange bleibt außerhalb des autoritativen Save-Zustands, ohne treuhänderisch gedeckte und rechtswirksam widerrufbare Plätze. Bei J8-Klon verfallen Anmeldungen weiterhin absichtlich. Die provisorische 120-Minuten-NPC-Frist ist keine beschlossene Wirtschaftsregel. Es fehlen Mehr-Eigentümer-Fairness, belastbare 13×90- und 365/730-Tage-Vergleiche **mit aktivierten neuen Guards**, Persistenz-/Import-Manipulationsschutz, echte iPad-Safari- und NAS-Geräteabnahme. Daher **nur Forschungs-Draft**, kein Merge, Pages-Deploy oder Änderung produktiver Regel-/Save-Version.
