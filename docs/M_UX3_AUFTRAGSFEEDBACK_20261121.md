# M-UX3 – Auftragsfeedback [DRAFT]

[Draft-PR #554](https://github.com/tobiasfranziskus/Check/pull/554), Branch `codex/m-ux3-order-feedback`.

Basis: frisch abgerufenes `main ac480b4c8d5f06f52e6d1d657e0c6d7d6526fa8f` vom 21.11.2026. AGENTS, Roadmap, Projektstatus und offene PRs geprüft. #549 ist integriert, obwohl die lokale Dokumentation noch DRAFT nennt; #550 behandelt diesen Abgleich. #552 verändert den Karriereeinstieg, #553 die Karten-/Flottenauswahl. M-UX3 übernimmt keinen dieser Drafts. Gemeinsame Integrationspunkte sind `spiel.js`, `index.html` und die zentralen Statusdokumente; beim späteren Zusammenführen separat prüfen. #545 liefert den UX-Audit-Kontext, #528 die Rechte-/Belegabgrenzung.

## Verhalten und Datenherkunft

Die Auftragsansicht zeigt die letzte angeklickte Aktion als flüchtige Start-/Ablehnungs-/Beendenmeldung. Sie ist kein zusätzlicher Buchungsbeleg und wird nicht gespeichert. Nach Laden wird der tatsächliche Verlauf ausschließlich aus dem Core rekonstruiert. Für F4 stammen Start, Lieferzeit, Abschluss, Schiff und Menge aus `kanon.spielerFrachten.auftraege`. Lieferung ist noch kein abgeschlossener Rundflug; Frachtgebühren werden erst als tatsächlich gebuchte Gesamtsumme gezeigt. Förderung zeigt vorhandene Pendelbindung, Schiffsphase und reale Ladung, keine geschätzte Fertigstellung.

Getrennt erscheinen Warenbewegung, kumulative F4-Gebühren, kumulative F4-Pilotenlöhne, freie Hauskasse und aktuelle Original-Schiffsbuchwerte. Frachtlöhne gehören zum separaten Pilotenlohnkonto; sie sind keine vollständige Lohnsumme aller Tätigkeiten. Keine Gewinnbehauptung, keine Ersatzbewertung fehlender Belege. Historische Förderabschlüsse werden mangels eigener vollständiger Auftragsbelege nicht erfunden. Stop benutzt den bestehenden Originalbefehl; bezahlte Arbeit wird nicht rückgängig gemacht. Nicht abbrechbare Fracht bleibt durch den Core gesperrt.

Die kontextbezogene Taste ist bei eigenem Pendel oder offener eigener F4-Fracht aktiv. Ein Klick ruft `weiter(1)` auf: dieselbe geprüfte Weltminute und bestehende Speicherung. Alle Unternehmen laufen dabei regulär mit. Kein Timer, kein Überspringen zum vermeintlichen Erfolg, keine neue Nachfrage- oder Kaufautomatik. Core, Regeln, RNG, Saveformat und gespeicherte Spielerbestände bleiben unverändert.

## Abnahme

Neuer Original-Core-Test: Start, wiederholter Auftrag, Förderabbruch und Neustart, atomare Ablehnung doppelter/nicht abbrechbarer Fracht, Hinflug/Lieferung/Rückflug/Abschluss, Save/Load und doppeltes deterministisches Replay. Originalhash `4e86f3fc27a6005a`; 240 ISK Frachtgebühren, 120 ISK Pilotenlohn, Weltgeld 33.000, Mint/Burn 0. Anzeigeprojektion verändert den Save nicht.

Browser-UX: bestehender realer S1/S2-Touchpfad erweitert. Reguläre Käufe, Förderstart, doppelte Frachtgeste, sichtbare Meldung und Liefer-/Abschlussbelege, getrennte Gebühren/Löhne, Reload, Förderstopp und deaktivierte Zeittaste, erneuter Förderstart und genau ein Tick per kontextbezogener Taste. Tastaturfokus, Orientierungswechsel und horizontaler Überlauf werden im selben Lauf geprüft. Statische lokale HTTP-Auslieferung einschließlich Unterpfad `/nas/spiele/aphros/`; das ist kein privater NAS-Livetest.

WebKit konnte lokal nicht starten: Browserbinary fehlt; Installation in beschreibbares `/tmp` scheitert am Download (HTTP 403 „Domain forbidden“). Nicht bestanden und nicht als Safari-Nachweis gewertet. Physisches iPad Safari, privates NAS, öffentliche Pages und eine 60-Minuten-Erstspielerabnahme bleiben offen. Kein Merge oder Deploy.

Chromium-Touchsimulation auf dem Implementierungsstand: **4/4 bestanden**, 1180×820, 1024×768, 820×1180 und 390×844; jeweils einschließlich Ein-Minuten-Taste und Original-Referenzhash vor dem zusätzlichen Zeitschritt. Der bestehende P1-Workflow ruft den erweiterten Browsertest bereits in seiner Chromium-/WebKit-Matrix auf. CI-Ergebnisse sind separat abzuwarten.

Die erste vollständige Regression wurde vor dem Tracking des neuen JS-Moduls gestartet: fünf P0-Inventarprüfungen fanden deshalb einen nicht versionierten Skriptpfad. Nach Commit besteht die gezielte Wiederholung aller acht P0-Tests (0 Fehler/Skips/Abbrüche), ohne Code- oder Referenzkorrektur.

Finale lokale Node22-Zählung: vollständiger Lauf **567 Tests, 562 bestanden, 5 frühe Inventarfehler, 0 Skips/Abbrüche**, Dauer 642,7 Sekunden. Die fünf Fehler betreffen ausschließlich den oben beschriebenen noch nicht getrackten Skriptpfad. Gezielte Wiederholung `node --test tests/p0-*.test.mjs` nach Commit: **8/8 bestanden**. Somit sind alle 567 Testfälle im Gesamtlauf beziehungsweise der gezielten Wiederholung erfolgreich ausgeführt; kein durchgehend grüner einzelner Gesamtlauf behauptet. Zusätzlich neuer M-UX3-Test separat 1/1 bestanden. `git diff --check` und JavaScript-Syntaxprüfung bestanden.
