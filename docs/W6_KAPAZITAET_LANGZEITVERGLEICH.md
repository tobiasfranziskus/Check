# W6 – Abnahme des Kapazitätsfilters [DRAFT]

25.11.2026. Basis #638 (77b05bfbb4558ec2b4715d515310b4d6cda172f5), Kontrolle #625 (bf11fcbc3e19e0d1220cecc8e721035c43f43537). Ausschließlich Node-Forschung; kein weiterer Spielcode.

## Bestätigte Diagnose

[#637](https://github.com/tobiasfranziskus/Check/pull/637), Head 9241d0b7, [W5-RC1 CI](https://github.com/tobiasfranziskus/Check/actions/runs/45709109725/job/139538618141): Node22 614/614, null Fehler/Skips. Der deterministische S02-Diagnosetest meldet:

| Miner | Tick vor Bindung | Restaktivminuten | Verbrauch bis Erzannahme/Stilllegung |
|---|---:|---:|---:|
| sh009 | 6660 | 1929 | 71 (Erz angenommen) |
| sh009 | 12540 | 1799 | 71 (Erz angenommen) |
| sh011 | 17940 | 31 | 31 (22 Erz an Bord, stillgelegt) |

Bei Stilllegung Tick 17972, Hash 1f82d6696514b1bc, 33.000 Welt-ISK, Mint/Burn 0, 740+120+530 ISK in Treuhand, Storno abgelehnt. Die Messung bestätigt die notwendige Untergrenze aus #638, nicht eine allgemeingültige Flugzeit von 71 Minuten. Keine neue pauschale Sicherheitskonstante.

## Vergleich

Separate Checkouts derselben Management-Szenariologik. Drei unabhängige Matrixjobs Standard, K7 und S02, Seed 42, Tag 7/30/90. Je Job:
- unveränderte U7/U8-Basis gegen drei historische Hashes prüfen;
- U7/U8 mit Kapazitätsfilter vollständig wiederholen und Berichte vergleichen;
- Standardprofil auf beiden Checkouts bitgleich vergleichen;
- existierende Geld-, Waren-, Save/Load- und Replay-Audits; vollständige Berichte als Artefakte.

`node candidate/tools/w6-kapazitaet-vergleich.cjs baseline candidate S02 w6-S02.json`

Bewertung: tatsächlich abgeschlossene Erz-/Wasserlieferungen, Industrieproduktion, Haushaltsversorgung, Ersatzkäufe, Stilllegungen, gebundene Mittel und neuer Engpass. Keine erzwungene Erfolgsbehauptung: ein negatives Resultat bleibt ein Befund. Ein grüner Job allein ist kein Stabilitätsnachweis. Erst nach Ergebnissen gezielt Flugbedarf/Ersatzversorgung weiterentwickeln; 365/730-Tage-Läufe und Produktintegration offen.

Stand bei Anlage: Diagnose bestanden, Vergleich implementiert, neue Matrix noch nicht ausgeführt. Keine Änderung an Main, Pages, Saveformat, Nachfrage oder Preisen.
