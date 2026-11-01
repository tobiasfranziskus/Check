# E1 – Reale, verpflichtende Eskorten bei riskanten Handelsflügen

**[ANALYSE/DRAFT, 01.11.2026] Keine produktive Regel oder Freigabe.** Getrennte Escort-Fragestellung zu [B8k #71](https://github.com/tobiasfranziskus/Check/pull/71). Basis `main 491f8e2a73ad7ae765ba15c686a25c3a55d638d9`, **v0.12.5 / Regel14 / Schema8**, originaler Core-SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`. Ausschließlich eigenständiger Node-Runner + Workflow + Dokument. **Keine Änderung an `index.html`, Preisen, Weltregeln, Saveformat, Tests, UI, golden hashes oder main.**

## Problem

[B8j #70](https://github.com/tobiasfranziskus/Check/pull/70) bewies echte Piratenverluste der ursprünglichen NPC1/2-Frachter und später fehlende finanzierbare Ersatzhüllen. Der originale Regel14-Kampf erlaubt Begleitjäger nur wenn sie dem Frachter zugeordnet, im Angriffssystem **angedockt** und vom selben Besitzer sind. Tatsächliche Eskortenbewegung folgt jedoch dem Frachter und liegt beim Überfall oft in derselben Reisephase mit **dem gleichen Endziel und Ankunftstick**, wodurch der echte Jäger nicht in den Kampf kommt.

## Saubere Vergleichsarme (nur Analyse-Core, 2 Seed-Paare)

Originalhistorische aktive Spielerbefehle Seed42/7 ab Tick1; zum Ende Tag14 ist die NPC1/2-Flotte ausgefallen. NPC3 bekommt nur analytisch **einen selbst bezahlten Frachter-Sollplatz** und mindestens **einen selbst bezahlten Jäger-Sollplatz**, beide mit `heimat=dravos, auftrag=halten`. Originaler `ersatzkauf` erwirbt sie für Frachter 750+30=**780 ISK** und Jäger 900+36=**936 ISK** pro Stück, keine Geschenkhülle. Erst wenn **alle** am selben Ort Dravos gedockt sind, folgen die original validierten `shipEscort`- und `shipHandeln`-Befehle. Späterer Hüllenersatz durch Original-`ersatzkauf` wird als neu gekauft ausgewiesen und **nicht als Überleben der ersten Hülle** missverstanden.

- **assigned**: unveränderte Original-Regel14-Kampfbedingung – Jäger markiert und real unterwegs, aber nicht als Kampfeskorte gezählt.
- **coflight1**: nur analyseweise Aufnahme tatsächlich mitreisender Jäger, **exakt gleiche Zielstation und Ankunftstick** wie der Frachter, korrekte Eigentümer/Zuordnung; ansonsten Originalkampf.
- **mandatory1**: gleiche tatsächliche Mitflug-Kampfbedingung plus analytische Abflug-Sperre für NPC3-Frachter zu *umkämpften/gesetzlosen* Zielsystemen, solange kein eigener zugeordneter, am Abflugort gedockter Jäger vorhanden ist. Fehlende Eskorte führt zu realem Warten (kein Teleport). Gegenprobe, nicht allgemeine Weltregel.
- **coflight2**: wie coflight1, aber **zwei** initial real bezahlte Jäger mit derselben eskortierten Frachterhülle.

Alle 8 Welten je 90 Tage × zwei unabhängige Replays. Geplant pro Welt 2.160 unabhängige stündliche Geld-/Warenbilanzprüfungen, deterministische Hashes und 8 Save/Load-Roundtrips. Jeweilige ursprüngliche Tag14-Kontrollhashes bleiben erhalten.

## Direkt hier ausgeführte explorative Messwerte (vor PR-CI)

| Aktiver Original-Spielerfall | Seed42 assigned | Seed42 coflight1 | Seed42 mandatory1 | Seed42 coflight2 |
|---|---:|---:|---:|---:|
| Wirkliche Jäger im ersten Kampf mit dem NPC3-Frachter | 0 | **1** | **1** | **2** |
| Erster Frachter vernichtet | ja | ja | ja | ja |
| NPC3-Endkasse | 331 | 1.448 | 1.448 | 144 |
| NPC3-Frachter am Ende | 0 | 1 (Ersatz) | 1 (Ersatz) | 1 (Ersatz) |

| Aktiver Original-Spielerfall | Seed7 assigned | Seed7 coflight1 | Seed7 mandatory1 | Seed7 coflight2 |
|---|---:|---:|---:|---:|
| Wirkliche Jäger im ersten Kampf mit dem NPC3-Frachter | 0 | **1** | **1** | **2** |
| Erster Frachter vernichtet | ja | ja | ja | ja |
| NPC3-Endkasse | 715 | 583 | 583 | 829 |
| NPC3-Frachter am Ende | 1 (Ersatz) | 1 (Ersatz) | 1 (Ersatz) | 1 (Ersatz) |

**[BEOBACHTET]** Im mandatory1-Vergleich der beiden Seeds wurde kein gefährlicher Abflug tatsächlich abgewiesen, weil der erste zugeordnete Jäger vor den betreffenden riskanten Abflügen angedockt bereitstand. Die Variante beweist daher **nicht** die Wirksamkeit der Sperre bei fehlender Eskorte. Trotz nun richtiger Kampfteilnahme zerstört die originale Kampfrechnung alle vier zunächst eingesetzten Frachter (Seed42/7 × ein oder zwei Jäger); Seed7 auch Jägerverluste. Die von späteren Ersatzschiffen erreichten Endbestände dürfen nicht als Überleben des ersten Frachters gewertet werden.

**Kosten/Ausfälle:** Ein leichter Jäger kostet im aktuellen Produktstand 936 ISK inklusive Gebühr und 50 ISK pro Arbeitsstunde, ein Frachter 780 ISK und 250 ISK pro Arbeitsstunde. In zwei betrachteten spieleraktiven Krisen kann zusätzliche Jägerinvestition die stark begrenzte Kaufkraft und NPC3-Minerfinanzierung weiter schwächen. Die rein mechanische Pflichtquote 1–2 Jäger ist deshalb wirtschaftlich und militärisch nicht belegt. Ein wirklich sinnvoller Ansatz benötigt **schutzabhängige Kosten-/Risikogates, bedarfsangepasste Stärke, gefährliche Etappen als gemeinsam geschützte Fahrt, finanziertes Warten oder sicheren Alternativweg**. Einfach `auftrag=eskorte` zu setzen reicht nicht.

## Freigabegrenzen

**[ANALYSE, nicht MAIN]** Diese ersten zwei Seeds und die lokale Mitflug-Regel beweisen nicht, dass Eskorten allgemein untauglich sind, dass 3+ Jäger helfen oder dass bessere leichte Schiffstypen/Preise nicht wirtschaftlich wären. Kein volles globales 13 Seeds ×90 Tage/365 Tage-Gate. Grundnachfrage und Markteintritt von B8k werden **nicht** gemeinsam mit der Schutzänderung reformiert. Kein Echtgeld, keine ISK-Emission, keine kostenlose Rüstung, keine Produkt- oder Save-Regeländerung. Für eine spätere eigenständige Escort-Produktlösung wären auch Spielerfälle und tatsächliche Kampf-/Beschützerticks, Flotten- und Werftnachproduktion, Kassen, Waren, Kopfgeld-Minting, Wartezeiten und reale iPad-/NAS-Abnahme nötig. **Nicht mergen**.

CI: **noch nicht bestätigt** (E1-Runner und eigener Workflow enthalten Assertions; Ergebnisse erst nach tatsächlichem GitHub-CI-Lauf als bestanden markieren).
