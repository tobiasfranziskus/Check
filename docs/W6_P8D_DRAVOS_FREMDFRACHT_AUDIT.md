# W6/P8d – Dravos–Nadir-Fremdfrachtervertrag (Regel207)

**15.11.2026 · [DRAFT / ANALYSE] · KEIN MERGE / DEPLOY**

- Basis: [P8c-PR #412](https://github.com/tobiasfranziskus/Check/pull/412), echte Dravos-Minerreise; [P8d-PR #415](https://github.com/tobiasfranziskus/Check/pull/415) ist auf P8c gestapelt, **nicht auf main**.
- Die K2-Miner, legal gekauften W3-/W5-Frachter, Privatpiloten, Erz-/Siliziumbestände und echten Käuferkassen bleiben Original. Keine neue Gratis-Hülle, kein Dravos-Käufer, keine automatische Save-Migration.

## Rechte und eine reale Transportfahrt

1. NPC3 besitzt den rechtmäßig erworbenen K2-Miner und 8 belegte Dravos-Siliziumeinheiten; J2b-Vorfinanzierung von 128 ISK Bergbaulohn und 192 ISK Nadir-Ankauf. Der Nadir–Dravos-Miner-Hinflug ist original mit 40 ISK bezahlt.
2. transport besitzt den original gekauften Frachter sh018. Er fährt leer Aldera–Dravos (20 Wirtschaftsminuten), übernimmt vom NPC3-Miner sh008 8 Einheiten und fährt beladen Dravos–Orion–Nadir (40 Minuten). Eigentum am Schiff bleibt transport; Rohstofftitel bleibt bis zum Verkauf NPC3.
3. NPC3 bindet 120 ISK Frachtentgelt und transport 60 ISK Privatpilotenlohn auf getrennten K1-Treuhandkonten. Vor automatischer Gegenzeichnung werden beide Kassen geprüft; jede reale Minute zahlt genau 1 ISK aus vorhandener Reserve.
4. Nur am gemeinsamen Dravos-Dock: Miner −8 Silizium / Frachter +8. Erst bei echter Nadir-Ankunft übernimmt der ursprüngliche J2b-Ankauf die 8 Waren und zahlt NPC3 192 ISK aus vorheriger Kaufreserve. Erst anschließend erhält transport 120 ISK Frachtentgelt.
5. Ein unterschriebener Vertrag sperrt den Frachter gegen konkurrierende Original-W3-Eis-/Erz-/Werftaufträge. W5ac akzeptiert nur eine belegt finanzierte P8d-Anschlussfahrt; sein ursprünglicher Eigentums-/Piloten-Audit bleibt wirksam.

## Ausgeführte Abnahme

[Node22-CI #43766339828](https://github.com/tobiasfranziskus/Check/actions/runs/43766339828): **Erfolg**. 3/3 neue P8d-Tests und 13/13 P8b/P8c/P5/P6-Regressionen; JS-Syntax erfolgreich. Originalbuch, Eigentümertrennung, Save/Load-Zwischenstände und manipulierte JSON-Saves wurden überprüft.

**S02 / 90 Tage:** 1 fertiger Fremdfrachtvertrag mit 8 Dravos-Siliziumeinheiten; Frachterlohn 60 ISK, Speditionsentgelt 120 ISK; 2 real bezahlte Spieler-Jägerkäufe; Endhash d111695ff9dc3a30. Weltgeld 33.000 ISK, Mint 0, Burn 0. Weitere 8 Silizium liegen noch im Dravos-Boden; kein zweiter abgeschlossener Transport belegt. Keine garantierten Käufer.

**NEGATIV zur Rentabilität:** NPC3 trägt 128 ISK Förderlohn + 40 ISK Miner-Hinreise + 120 ISK Frachtentgelt = **288 ISK Kosten** für 192 ISK Verkauf: **−96 ISK vor Verschleiß und Ersatz**. Die Spedition erhält 120 ISK und zahlt 60 ISK Pilot: **+60 ISK vor Abschreibung**. Vollständig finanziert ist nicht dasselbe wie dauerhaft profitabel.

## Nachprüfung 16.11.2026 – 13×90 und S02×365 [ANALYSE / QA]

[CI-Matrix #43768148138](https://github.com/tobiasfranziskus/Check/actions/runs/43768148138) am P8d-Head `3f771856`: **14/14 Szenariojobs und Aggregat erfolgreich**. Damit bestehen die geprüften Geld-/Waren-/Eigentums-/Frachtbeleg- und Save/Load-Invarianten; das ist **keine** Erfolgsaussage zur wirtschaftlichen Tragfähigkeit.

| Profil | Echte bezahlte Dravos-Fracht | Dravos-Silizium verkauft | Jäger gebaut | Ergebnis |
| --- | ---: | ---: | ---: | --- |
| S02, 90 Tage | 1 | 8 | 2 | Restfeld 8, NPC3 −96 ISK/Dravos-Vertrag vor Verschleiß |
| S11, 90 Tage | 1 | 8 | 2 | Restfeld 8, kein Folgeauftrag |
| S01, S03–S10, S12–S13, je 90 Tage | 0 | 0 | je nach Welt 0–1 | Kein Nachweis einer Dravos-Handelskette |
| S02, 365 Tage | 1 | 8 | 2 | Zwischen Tag 90 und 365 keine zusätzliche Förderung, Wassererlöse, Ersatzkäufe oder Frachtauslieferung |

S02: Tag 90 und Tag 365 jeweils Eis **7.038**, Wassererlöse **105.336 ISK**, Ersatzkäufe **14**, NPC3 **1.554 ISK**, Spedition **1.898 ISK**, Nadir **4.000 ISK**. Die Restmenge **8 Dravos-Silizium** ist physisch vorhanden, die letzte Minerposition liegt in Dravos, ein neuer Vertrag wurde nicht nachgewiesen. Wiederholt meldet der NPC-`K2`-Pfad fehlendes reales W4-Material. Diese Werte erlauben **noch keine eindeutige Ursachenzuweisung** zwischen Nachfragelücke, Automatik, Produktions-/Kapazitätsblockade oder fehlendem Folgeauftrag.

**Wichtige Korrektur am ursprünglichen Matrix-Runner:** Die bis dahin `last30Active` genannte Kennzahl verglich für **jeden** Lauf Tag **60 mit 90**; im 365-Tage-Lauf waren das nicht die letzten 30 Tage. Der hier zusätzlich gestapelte QA-Branch stellt das Fenster auf `days−30 … days` um und gibt Start-/Endmengen explizit aus. Die geänderte CI muss vor einer Bestanden-Aussage **neu laufen**. `peakParallelFreights` wird bisher nur alle 120 Simulationsminuten abgefragt und ist deshalb kein lückenloser Beweis für die maximale Zahl gleichzeitig laufender Kurzaufträge.

**Nächster wirtschaftlicher Entwicklungsschritt:** Vor Preiserhöhung, frischem Kapital oder neuen Ressourcen erst die zweite echte 8er-Dravos-Charge als wiederholbaren NPC3-Miner-/Frachtprozess unter bestehenden Firmensignaturen, Käufer- und Materialgrenzen prüfen. Sollte ein zweiter Auftrag trotz vorhandener 8 Einheiten und Mittel nicht zustande kommen, den ersten rechts- und finanzierungsbelegten Blocker exakt ausweisen. Eine neue Regel-/Balancefreigabe wird erst bei belegtem Bedarf eingeholt. Keine stille Migration, kein Merge der Forschungsregel207.

## Bis zur Integration offen

- Regel207 in 13×90- und langen 365-/730-Tage-Krisenwelten samt Frachtkapazität, Ersatz und Insolvenz-/Abbruchregeln unabhängig prüfen.
- Endliche Dravos-Feldgröße, Frachtpreise und Negativmarge sind Forschungsparameter. Keine stillschweigende Balancing-Freigabe oder Save-Konvertierung.
- Chromium/WebKit auf vier Touchgrößen und echte iPad-/NAS-Abnahme stehen für einen späteren öffentlichen Spielpfad aus.
- **main/Pages unverändert durch diese PR; Regel207 bleibt [DRAFT].**
