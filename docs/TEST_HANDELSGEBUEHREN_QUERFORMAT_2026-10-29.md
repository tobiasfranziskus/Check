# Handelsgebühren in der iPad-Querformat-Oberfläche

Stand: 2026-10-29  
Basis: `main/index.html` v0.11.1, Blob `307a7edfed3bff87224e008247d77aa4d279d868` (bereits mit Hotfix #7 und Querformat #8)  
Status: geprüfte UI-Änderung auf separatem Branch, **nicht in main veröffentlicht**.

## Fehler / Ursache

Die Handelskauf- und Verkaufsbuttons im Markt und in den Schiffsdetails zeigten nur den Basiswarenwert. `m_core_handel.handel()` bucht bei Käufen jedoch zusätzlich Handelsgebühren ab und beim Verkauf werden diese Gebühren vom Erlös abgezogen. Deshalb konnte ein als bezahlbar wirkender Kauf fehlschlagen beziehungsweise ein Verkauf weniger einbringen als angezeigt.

## Korrektur

Die beiden UI-Module importieren die bereits bestehende zentrale `m_core_index.gebuehr`-Funktion.

- Kaufbutton: `menge * einzelpreis + gebuehr(state, RULES, station, warenwert)` mit Kennzeichnung **inkl. Gebühr**.
- Verkaufbutton: `menge * einzelpreis - gebuehr(state, RULES, station, warenwert)` mit Kennzeichnung **netto**.
- Einzelpreise und Preisvergleiche bleiben ausdrücklich als Warenpreise ohne Gebühren bestehen.
- Die neuen Texte gelten auch innerhalb der aufklappbaren Handelsgruppe von PR #8.
- Keine Änderung an Kernlogik, Handelsbuchung, Preisformel, Speicherformat, Simulation, Versionstext oder Touch-/Querformat-Layout.

## Tatsächlich ausgeführte Tests (isoliertes JavaScript mit simuliertem DOM)

1. Kauf Jäger, Ausgangskasse 2.000 ISK: **900 ISK + 36 ISK Gebühr = 936 ISK** in Markt- und Schiffsmenü. Tatsächliche Abbuchung ebenfalls 936 ISK.
2. Verkauf des zuvor gekauften Jägers: aktueller Warenwert 1.260 ISK, Gebühr 50 ISK, **1.210 ISK netto** in beiden Menüs, tatsächliche Gutschrift 1.210 ISK.
3. Station mit Dockmodul: 900 ISK + 24 ISK Gebühr = **924 ISK** in beiden Menüs und Buchung.
4. Kauf von 10 Erz: 100 ISK Warenwert + 4 ISK Gebühr = **104 ISK** in beiden Menüs und Buchung.
5. Bei offenem `<details data-gruppe="handel">` bleibt die Gruppe nach einem echten Simulationtick und UI-Neuzeichnen geöffnet.
6. Drei Seeds (42, 1234, 98765), jeweils 4.320 Simulationsticks; Referenz `main` und Branch ergaben **identische Zustands-Hashes**, und der Geld-/Warenaudit war erfolgreich.
7. Gesamtes Inline-JavaScript syntaktisch geprüft, alter Startfehler `spielstandZeichnen()` tritt nicht erneut im Quellcode auf.

**Kein echter Safari-Browser-/iPad-End-to-End-Test ausgeführt.**

## Separater bereits bekannter Befund

Im Markt wird ein Handelsschiff nach minimaler Gesamtladung gewählt. Bei einem leeren Miner und einem Frachter mit verkaufbarer Ladung kann die Oberfläche Verkaufsbuttons der Frachterladung verschweigen. Die Auswahl wird in diesem PR bewusst **nicht** verändert, damit Gebührenkorrektur und Schiffsauswahl getrennt überprüfbar bleiben. Für den Netto-Test wurde nur im Testaufbau der leere Miner aus dem Zielsystem entfernt.

## Integration und Abnahme

Dieser Branch basiert auf dem nach PR #8 aktuellen `main` und **ersetzt den überholten Gebühren-PR #6**, der noch vor dem Querformat-Umbau erstellt wurde. Nach Freigabe als eigenen PR integrieren. Im iPad Safari in Markt und Schiffsdetails Kauf/Verkauf, lange Zahlen und Button-Umbrüche prüfen. Kein Merge ohne Nutzergenehmigung.
