# W5s-s – bedarfsgebundene Wasserwerkswartung ohne kostenlose Produktion

**[DRAFT / ANALYSE / OPTION · 06.11.2026]** Gestapelt auf W5s-r [#222](https://github.com/tobiasfranziskus/Check/pull/222). Produktives **main 5a56d9d7** mit GitHub-Pages-Spieltest und erhaltenem v0.12.5-Archiv bleibt unangetastet. Forschung: **Regel32/Schema8**, nur mit `rules.w5s.onDemandMaintenance=true`. Keine Freigabe einer Produktions-, Service- oder Geldregel.

## Auslöser

W5s-r hat die W4-/W5-/W5r-Lohnkonten zum real bezahlten Haushaltskreislauf geöffnet. Trotzdem zeigt der 365-Tage-Referenzlauf nur drei Erzfrachten, 6.143 bezahlte Wasser, 123 Eisfahrten und 18 voll bezahlte Wartungsblöcke à 60 ISK (1.080 ISK). Die Spedition bleibt ohne Hülle bei 120 ISK Kasse; **810 ISK** für Hülle, Überführung und gesicherte nächste Flugminute fehlen.

Das schon vorhandene `m_core_w5n.pruefenWasser` **sperrt ausdrücklich jede neue Wasserproduktion ab Fälligkeit der Wartung**. Im bisher automatischen W5r-Dienstplan wurden jedoch alle 20 Tage Wartungsleistungen eingekauft, auch wenn gerade kein weiterer Bedarf/Absatz möglich war. Das ist echte bezahlte Arbeit, aber unbewiesene betriebliche Notwendigkeit. Reines Streichen dieser Kosten ohne Werkssperre wäre kostenlose Wartung gewesen und ist ausgeschlossen.

## Implementierter Forschungs-Vertikalschnitt

Der neue **rein lesende** `m_core_index.w5sWartungStatus(state,rules)` liefert Zustand, echte ISK-Budgets, Lagerbestände und gegebenenfalls Fehlbetrag. Vor dem Kauf eines weiteren Wartungsblocks müssen *alle* Bedingungen zutreffen:

1. Wartung ist wirklich fällig; ein begonnener bezahlter Job läuft unverändert bis zur Beendigung.
2. Mindestens ein vollständiger nächster Wasserauftrag kann aus **real angeliefertem Eis (10)** und freiem Wasserlagerraum entstehen. Die bestehende W5o-Wasserzielgrenze gilt weiterhin.
3. Der vorhandene Wasserhaushalt besitzt wenigstens **14 eigene ISK für eine echte Einheit Wasser** (keine antizipierte staatliche Nachfrage). Das ist ein konservatives Nachfrage-Gate, **keine garantierte komplette Chargenabnahme**.
4. Die Nadir-Station kann **60 ISK volle Wartung plus 20 ISK volle nächste Fabrikarbeit gleichzeitig** aus eigener Kasse decken. Die 80 ISK sind nur R32-Forschungsparameter, keine produktiv festgesetzten Kosten.

Nur dann ruft der vorhandene W5r-Tick **unverändert seinen normalen 60-ISK-Treuhand- und Arbeitslohnpfad** auf. Anschließend wird W5n genau wie bisher über `stationWater`/Original-Core beauftragt, und die dafür reservierten 20 ISK werden Minute für Minute gezahlt. Ist der Service nicht finanziert oder kein Folgeabsatz da, gibt es **weder Wartungslohn noch Fabrikarbeit noch Gratis-Wasser**: die bereits vorhandene W5n-Sperre bleibt bis zum wirklich bezahlten Service bestehen.

W5s-r-Lohnjournal, W5s-q-Erzpilotenlohnbuch, W5s-o/p-Privatinvestitionen sowie Erz-/Eis-/Wasser-Warenledger werden **nicht separat nachgebaut**. Keine neuen Accounts, keine ISK-Emission, keine Hintertür für automatisches Erz-Auffüllen. Keine Versions- oder Save-Migration. Ohne Flag ist der alte W5s-r-Kern gleich.

## Prüfmatrix / offene Nachweise

Ein eigener GitHub-Node22-Workflow für `tests/w5s-s-nachfrage-wartung.test.mjs` prüft den reinen Plan (0 / 79 / 80 ISK, kein Bedarf), **13 Seeds × 90 Spieltage**, die beiden Krisenseeds **42/7 × 365 Tage**, deterministische Wiederholung, täglichen unabhängigen Core- und Waren-/Geldaudit, Save/Load samt physisch gebuchtem Eis, Wasser, Schiffen und Arbeitnehmerlöhnen. W5s-r-Flag-OFF-Referenzen: Seed42 `dcc4b22bc8a90ecc`, Seed7 `5bbc5f901749282e` nach 365 Tagen. **[TEST] [GitHub Node22 #42252697000](https://github.com/tobiasfranziskus/Check/actions/runs/42252697000): 4/4 Testgruppen bestanden, 0 Fehler und 0 Skips.** 13 Seeds ×90 Spieltage, Seed42/7 ×365 Spieltage, deterministische Replays, tägliche unabhängige originale Core-/Welt-ISK-/Waren-/Lohnaudits und Save/Load. Ohne neues Flag bleiben die W5s-r-365d-Hashes **bitidentisch** (Seed42 `dcc4b22bc8a90ecc`, Seed7 `5bbc5f901749282e`). Historische Gesamt-JavaScript-/Geografie-CI und iPad/NAS sind davon getrennt.

## Tatsächlich gemessener 365-Tage-Vergleich

| Seed42/7 R32-Stresswelt | W5s-r ohne neues Wartungsgate | W5s-s mit Wartungsgate |
|---|---:|---:|
| Aus eigenem Stationsgeld bezahlte Wartungen | 18 | **7** |
| Tatsächliche Wartungslöhne an Haushalte | 1.080 ISK | **420 ISK** |
| Bezahlte Wasserverkäufe | 6.143 | **6.068** |
| Tatsächlich bezahlte Eisfrachten | 123 | **123** |
| Tatsächlich bezahlte Erzfrachten | 3 | **3** |
| Industrie-/Wartungslöhne an Haushalte gesamt | 1.730 ISK | **1.070 ISK** |
| Freie ISK der Spedition | 120 ISK | **240 ISK** |
| Fehlendes vollständiges Flottenersatz- und Arbeitskapital | 810 ISK | **690 ISK** |
| ISK geprägt / vernichtet | 0 / 0 | **0 / 0** |

**[TEST]** W5s-s-Hashes am Tag365: Seed42 `131d982e273bcd67`, Seed7 `e05c12e808d4b859`; 13 Seeds ×90 Tage mit je 2 Erz-, 88 Eisfrachten, 4 echten Wartungen und 4.316 bezahlten Wasser. Die 660 ISK vermiedenen Wartungsausgaben verbleiben zunächst bei der rechtlich eigenständigen Nadir-Station; sie sind **nicht** frei verfügbares Speditionskapital. Weil real bezahlte Wartungsarbeit entfällt, erhalten Haushalte 660 ISK weniger Lohn; 75 weniger Wasserverkäufe sind eine reale Gegenwirkung. Die +120 ISK bei der Spedition sind separat real erwirtschaftet, keine Übertragung aus dem Stationskonto. Trotz Reduktion scheitert der Dauerersatz weiterhin.

**Grenzen:** Eine konservativ gesperrte Wartung darf auch bei zeitweise geringer Liquidität zu weniger Wasser führen. Es entsteht nicht allein dadurch ein neuer Spediteur. Ohne wirklich profitabel finanzierte Eigentümerfolge, Frachterhüllen und Werftbedarf bleibt die Wirtschaft insolvenzfähig. Eine 365-Tage-Prüfung allein ersetzt keine iPad-Safari-/NAS-Abnahme. Kein Merge/Deployment ohne Freigabe.
