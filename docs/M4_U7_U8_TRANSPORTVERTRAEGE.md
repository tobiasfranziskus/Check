# M4-U7/U8 – gemeinsamer Transportauftrag [FORSCHUNG / DRAFT]

Basis main d824040e, M4-U5 veröffentlicht; #573 (Förderpause) bleibt getrennt. Baut auf dem negativen Original-Audit #565 und M4_U5_WIRTSCHAFTSENGPASS.md auf. Kein neuer Wirtschaftskern, kein aktiviertes Angebot, keine Regel-/Save-/RNG-Migration. Der neue Test berechnet Gegenentwürfe aus der nachgestellten, unveränderten 48-Fahrten-Originalwelt. CI muss die Zahlen bestätigen.

## Gemeinsamer Entwurf

| Posten | Erz nach Nadir (U7) | Wasser nach Aldera (U8) |
| --- | --- | --- |
| Menge | 50 Erz | 12 Wasser im Prüfstand |
| Warenwert | 500 ISK | 168 ISK |
| Eigenständige Rundfahrt | 240 ISK Tarif, 120 ISK Lohn | Vorschlag: gleicher 240-ISK-Tarif, 120 ISK Lohn (Freigabe erforderlich) |
| Käuferreserve | Nadir 740 ISK | Aldera 408 ISK |
| Alternative gemeinsame Route | Erz hin | Wasser als freiwillige Rückladung: 12 ISK zusätzlicher Frachttarif nach Original-K1-Einheitensatz |

Der bisherige Wasser-Rücktarif (1 ISK je Einheit) deckt allein keine eigenständige Rundfahrt; bei 12 Wasser fehlen 108 ISK allein für die Fluglöhne. Die 240-ISK-Rundtarif-Option ist eine neue Vertragsregel, kein vorhandenes Wasserangebot. Die Alternative nutzt einen bereits bezahlten Erz-Rückflug: zusätzliche 180 ISK für Wasser und Rückladung. Aldera hat im Prüfstand 513 ISK. 500 ISK Erzankauf plus 180 ISK Wasser sind **nicht gleichzeitig vorfinanzierbar**. Daher keine Doppelzusage; Wasservertrag erst bei Nadir-Ankunft nach tatsächlich gebuchter Erzabnahme und frischer Prüfung des Aldera-Budgets, Nadir-Bestands, Transportkapazität und Ziel-Lagerplatz. Wasser kann ausbleiben, ohne die bereits bezahlte Erz-Rückfahrt zu gefährden. Alternativ getrennte Fahrt, wenn echter Käufer die 408 ISK freiwillig bindet. Ein kombinierter Transport ist keine garantierte Dauerlösung: die 12 Wasser reichen laut U5 nicht aus, um wieder 50 Eisplätze freizumachen.

## Autoritative Integrationsgrenzen

- W3 heute hart auf `rules.w3.spedition` gebunden: prüfen, starten, vorbestellen, Storno, Tick, Lohn, Auszahlung, Nutzungsbeleg und Audit. K7-Angebot, Signaturen und Commit verlangen npc3-Miner und transport-Frachter. Nicht lediglich die Owner-Prüfung entfernen. Vertrag muss Eigentümer zum Zeitpunkt der Annahme eindeutig festhalten, Firmenrechte prüfen und den tatsächlichen Carrier in sämtlichen Geld-/Waren-/Replay-Belegen führen. Kein globales Umschreiben des NPC-Eigentümers. Original-NPC-Verträge und historische Hashes bleiben gültig.
- Vorbestellung benötigt realen W1-Quellankauf und Bergbaubudget, tatsächlich reservierte Nadir-Kasse und Arbeitslohn. Im Prüfstand 0 Quellerz und 0 Exportbudget. Der neue Industriebedarf, nicht der alte Exportkunde, muss den W1-Vertrag tragen. Bereits laufende Förderverträge und U6 beachten. Signaturen kommen vom jeweiligen Rechtsträger, nicht vom Spieler stellvertretend. Kauf und Storno atomar, kein Phantom-Erz.
- K1-Wasserrückladung ist derzeit ausschließlich an W5n-Eisauftrag gebunden. Für W3-Rückladung dieselben Bestands-/Zahlungs-/Ankunftsregeln wiederverwenden; für eigenständige Wasserfahrt eigener vorfinanzierter Auftrag mit leerem Hinflug, physischer Abholung, bezahlten Flugminuten und dokumentiertem Rückflug. Keine Verladung ohne Bestand, kein Wasserverkauf aus der Ferne.
- Gemeinsame autoritative Streckensperre für W3, Eis, Wasser, W5ac und bestehende Reservierungen; physisches Dock, reale Ladung, Stilllegung und Eigentum prüfen. Neue Aufträge dürfen keine bestehenden Rechte umgehen. Keine zweite Simulationsuhr, UI-Buchung oder zusätzliche Wirtschaftswelt.
- Produktionsauftrag und Fortschritt nur nach tatsächlichem Erz-/Material-/Werftnachweis. Keine automatisch erzeugten Schiffe oder Rettungskäufe.

## Abnahme nach Regelentscheidung

1. Explizites neues Forschungsprofil bzw. kompatibler Opt-in, niemals bestehende Regel204/207-Saves umdeuten. Vorhandene Original-Signaturen, Tarif-/Pilotenzahlungs- und Audit-Funktionen wiederverwenden. Konkretes Save-/Replay-Schema und Migration separat prüfen.
2. Ein wirklich finanzierter 50er-Erztransport mit Hausfrachter aus dem 48-Fahrten-Stand, unveränderte Fremdeigentümer, Nadir-Ankunft plus abgewickelte Rückfahrt. Erster Wasser-Kombinationsauftrag nur nach neuem Käufercheck. Separater Wasserauftrag als Alternative, nicht parallel auf belegter Strecke.
3. Negativfälle: fehlende Signatur/Geld/Ware/Platz, falscher Eigentümer, doppelte Reservierung, Stilllegung, Routenüberschneidung, Storno nach Arbeitsbeginn, manipuliertes Save, Reload mitten in jeder Phase. Keine Mutation bei Ablehnung.
4. Gesamtsuite Node22, 13×90 und 365/730-Tage-Szenarien mit Geld-/Waren-/Eigentumsaudit, ursprüngliche Hashes, Chromium/WebKit mit vier Touchgrößen, Root und Save/Load. Langzeit-Engpässe als Ergebnis zulassen.

**Empfehlung:** U7 mit U8-Rückladung gemeinsam spezifizieren und testen; eigenständiger Wasserauftrag als zweiter Tarifpfad im selben Paket. Kein autonomes Produktionsfeature ohne Regel-/Vertragsfreigabe und vollständige Integration. M4-U4 bleibt offen.


## U8-Nachweisstand (22.11.2026)

- Kalkulationshead 4084bad3: 2/2 Workflows, 587/587 Node22; die Budgets sind bestätigt, keine ausgeführten neuen Aufträge.
- Kernhead 798f2b2e: explizites Rule204-Forschungsprofil mit originalbezahltem W3-Rückflug, neuer Aldera-Wasserbestellung und K1-Rückfrachtbuch. 588/589 Node22; Test erreicht keinen passenden Ankunftszustand. Originale 13×90- und S02×365/730-Referenzläufe erfolgreich, keine U8-Langzeitabnahme.
- Folgehead 15b71499: [CI-Log](https://github.com/tobiasfranziskus/Check/actions/runs/45059634961/job/137322442015), 588/589 Node22. Tatsächliche Eisfahrt und Wasserproduktion (10 Einheiten) gelungen; bei Tick 451 Aldera-Kasse 0, zwei NPC-Miner im freien Förderflug. U8-Bestellung noch nicht erreicht. Die stündliche W2-Krisensteuerung in rule200-k7-industry-core.js läuft auch bei deaktivierter äußerer K1-Automatik.
- 857fbbc4: Testtreiber benutzt nur reguläre NPC-Eigentümerbefehle zum Stoppen leerer, vertragsfreier Miner; bereits finanzierter Bergbau und laufender Industrievertrag bleiben unberührt. Auswahl erst bei realen Dock-/Budgetbedingungen aller Beteiligten. Keine Änderung der W2-Produktregeln.
- feff75de / 8350e451: U8-Audit bindet auch ungetaggte Wasser-Rückfracht an echten F4-Auftrag; Tests für doppelt manipulierten Beleg und exakt einmalige Zahlung an realen Carrier. CI für neue Änderungen noch nicht nachgewiesen. Keine produktive Aktivierung.

Vor U7-Erweiterung muss der echte NPC-Rückflug einschließlich Wasserzahlung und Reload erfolgreich sein. Anschließend separate freiwillige Carrier-Zustimmung zur Zusatzladung und Eigentümerbuchungen für den Hausfrachter; keine bloße Umgehung der bestehenden Speditionsrechte. Regel204-Standardspiel bleibt unverändert.
