# M-UX1 · Karrierestart bis zum ersten Förderauftrag

**[DRAFT #552](https://github.com/tobiasfranziskus/Check/pull/552) · 21.11.2026.** Basis ist der per Git bestätigte `origin/main` `ac480b4c8d5f06f52e6d1d657e0c6d7d6526fa8f` ([#549](https://github.com/tobiasfranziskus/Check/pull/549)). Der getestete Weg führt vom Root-Link „Wirtschaftsmanager“ über den Prolog in eine frische Standardkarriere.

## Befund und Umsetzung

Der vorhandene Eishandel-Leitfaden führte bereits zu den Original-J8-Aufträgen. Die zentrale Schaltfläche zeigte beim Kauf allerdings keinen Preis und derselbe Rückmeldetext „Auftrag gebucht“ galt auch beim Schiffskauf. Nach Ausverkauf des Aldera-Frachters stoppte die Empfehlung beim Frachterkauf, selbst wenn ein eigener Miner einen Förderauftrag annehmen konnte.

- Der nächste Schritt bleibt oben auf der Kommandobrücke. Kaufbuttons zeigen bei gültigem J8-Angebot den Preis aus der aktuellen Weltregel. Gesperrte Schritte zeigen den ursprünglichen J8-Grund direkt neben der Schaltfläche. Der vorhandene Nadir-Markthinweis bleibt erhalten.
- Nach erfolgreichem Kauf bestätigt die Auftragskarte Schiffstyp, Ort, tatsächliche Abbuchung und neue Konzernkasse. Der nächste Schritt und der Flottenstand werden aus der aktualisierten Welt angezeigt. Ein lokaler Speicherfehler bleibt in der Meldung sichtbar.
- Ist der Aldera-Frachter gesperrt, bietet die Karte die Eisförderung als eigene Aktion an, sofern ein vorhandenes `ice-`-Angebot für einen eigenen Aldera-Miner freigegeben ist. Beide Wege verwenden die bestehende J8-Validierung beim Tippen. Die Ein- und Auszahlungs-, Nachfrage-, Seed-RNG- und Save-Logik liegt weiterhin im bestehenden Core.

## Abgleich mit offenen Manager-PRs

[#527](https://github.com/tobiasfranziskus/Check/pull/527), [#526](https://github.com/tobiasfranziskus/Check/pull/526), [#528](https://github.com/tobiasfranziskus/Check/pull/528) und [#545](https://github.com/tobiasfranziskus/Check/pull/545) liefern Analyse, Tests oder Spezifikation. [#547](https://github.com/tobiasfranziskus/Check/pull/547) und [#548](https://github.com/tobiasfranziskus/Check/pull/548) betreffen den S1/S2-Stack. Die produktiven Überschneidungen mit #548 in Karriere-HTML, CSS und JS wurden auf dem bereits integrierten Stand von #549 bearbeitet. [#550](https://github.com/tobiasfranziskus/Check/pull/550) führt Roadmap und Projektstatus zu S1/S2 nach. M-UX1 dokumentiert den Einstieg deshalb separat. Die Produktreihenfolge der Roadmap bleibt gültig.

## Abnahme

Der Browser-Akzeptanztest ist in `tests/p3-handelsweg-browser.cjs` integriert und läuft über die Chromium-/WebKit-Matrix des P1-Workflows, auch wenn der separate S1/S2-Schritt zuvor scheitert. Zwei frische Touch-Kontexte bei **1024 × 768** prüfen den sichtbaren Kaufbutton, 600/750 ISK, Kaufbestätigung, sichtbaren Sperrgrund, den originalen Eis-Pendelauftrag sowie bytegleichen Save nach Reload und Fortsetzen. Im Ausverkaufsfall übernimmt die NPC-Spedition den verfügbaren Frachter im ersten regulären Tick. Die UI-Regression in `tests/p3-handelsweg.test.mjs` prüft den Regelpreis, die Reihenfolge und dass eine fehlende oder abgelehnte Offerte nicht zur Förderaktion wird.

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| Node 22.23.4, gezielte Regression | 10/10 Einzeltests bestanden, 0 Fehler, 0 Skips, 0 Abbrüche. Handelsweg, Manager-Disposition und unabhängiger S2-Audit. |
| Chromium 154, Touch 1024 × 768, regulärer Start | Miner und Frachter für 600 und 750 ISK gekauft, 1.650 ISK nach Kauf. Eisförderung bei Tick 0 beauftragt. Save-/Audit-Hash `e75972b4126fd7bd`. |
| Chromium 154, Touch 1024 × 768, ausverkaufter Frachter | Sperrgrund „kein Komplettschiff auf Lager“, danach rechtmäßig buchbare Eisförderung bei Tick 1. Save-/Audit-Hash `7333433214bb2d44`. |
| Chromium 154, bestehender P3-Handelsweg | Alle vier Touchgrößen bestanden: 1180 × 820, 1024 × 768, 820 × 1180 und 390 × 844. Enthält bestehende Fracht-, Reinvestitions-, Wasser- und NPC-Marktprüfungen. Erste abgerechnete F4-Rundfahrt überall Hash `4e86f3fc27a6005a`. |
| Original-Welt in beiden Browserfällen | 33.000 ISK Weltgeld, Mint/Burn 0, Originalaudit erfolgreich. Cockpit blieb geschlossen. |
| Root/NAS-Dateiprüfung | `node scripts/build-w5-singlefile.mjs --check` meldet `W5_SINGLEFILE_OK`. Browserpfad per lokalem statischen HTTP. |
| WebKit lokal | Browserlauf nicht gestartet. Der Download des Playwright-Browsers wurde mit HTTP 403 abgewiesen. Die neue Abnahme ist im PR für die vorhandene WebKit-CI vorgesehen. |
| Öffentliche Pages, echtes iPad Safari, privates NAS | Für M-UX1 nicht geprüft. |

Beim ersten neuen Chromium-Lauf musste der Test vor der Storage-Abfrage explizit auf die Ziel-URL warten. Der erste parallele S1/S2-Check deckte außerdem auf, dass die 350-ms-Sperre für denselben Auftrag bereits während der teuren Neudarstellung ablaufen konnte. Der Start der Sperrfrist liegt jetzt nach der Neudarstellung. Die neue Startabnahme mit schnellem Zweittipp und beide Startpfade waren danach erfolgreich.


Der zusätzliche S1/S2-Browserlauf scheiterte im Kandidaten bei 820 × 1180 am schnellen zweiten Tipp nach einem Förderstopp im Flottentab (`tests/p3-manager-karte-browser.cjs:152`). Mit einem statisch ausgelieferten Git-Archiv der unveränderten Basis `ac480b4` trat derselbe Stop/Start-Fehler bei 390 × 844 auf. Der Flotten-Stop liegt hinter dem M-UX1-Abnahmepunkt. Die bestehende S2-Flottenlogik wurde im Draft belassen.

Der erste vollständige Node22-Lauf im Standardsandboxprofil meldete Prozessrechtefehler (`spawnSync ... EPERM`) in fünf Testdateien. Der bereits fehlgeschlagene Lauf wurde während des Wiederholungslaufs beendet. Die Wiederholung verwendet das Ausführungsprofil mit den erforderlichen Prozessrechten.
