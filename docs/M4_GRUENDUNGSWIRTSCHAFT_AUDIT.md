# M4 / W6 – Gründungswirtschaft im aktuellen main [AUDIT]
Basis 85a94f9eacf0d965cf45ca47862d4959e9ad81a6. Kein PIR-Stack, keine Produktänderung. AGENTS, Roadmap, Projektstatus und startNeu geprüft. M4-U4 Blindtestversion bleibt unverändert.

## Forschungsbefund
[#617](https://github.com/tobiasfranziskus/Check/pull/617), Head 1b2cef7c, [CI 45458746645](https://github.com/tobiasfranziskus/Check/actions/runs/45458746645): 8/8 gezielte Tests. NPC-first ermöglicht im PIR-Profil erste echte Nadir-Hülle Minute300, Hauskauf 750, Überführung 60, Miner und echte F4. Tag7 Haus 5307, 150 Erz, 70 Material, 4 W5-Hüllen; Kontrollwelt NPC-first ohne Spieler 100/50/3. Weltgeld 33240, Mint/Burn0. Kein Kampfschaden in diesem Folgeversuch, keine Reparatur belegt. Allgemeine CI bei Auswertung offen. Der vorherige Audit af31abf4 hat alle drei Workflows bestanden.

## Neue direkte Prüfung
Produktstandard startet per J8.starten195(OLD.create(42,'private195').export(),true). S02 ist getrenntes ausdrücklich aktiviertes Profil; keine PIR-Konten. Vier Kombinationen: Standard/S02 jeweils Haus-first bzw NPC-first. Identischer Seed, keine neue Ware, kein neuer Preis. NPC-first wartet höchstens einen Spieltag auf echte Nadir-Hülle, dann vorhandene Kauf-/Überführungs-/Miner-/Eis-/F4-Befehle. Beide Profile auf Tag7, alle Schritte wiederholt, strenge Geld-/Save-/Auditprüfung. Negative Befunde ausdrücklich erlaubt; CI offen. Keine UI-Browserabnahme oder 60-Minuten-Echtzeit behauptet.

## Entscheidungsgate
Erst nach den Ergebnissen entscheiden, ob Startberatung, explizite Industrieaktivierung, autorisierte Gründungsflotte oder andere Lösung notwendig ist. Ein S02-Erfolg autorisiert keine automatische Umstellung alter Standard-Saves. W3-Hausrechte und Reparaturmaterialtransport sind getrennte offene Schritte. Zentrale Dokumente bleiben wegen paralleler P0-Arbeit unverändert.

## Ausgeführte Hauptbranch-Prüfung
Head d98afd6fae97aa1d28e4917fd1d8290138190562: [Audit 45459639072](https://github.com/tobiasfranziskus/Check/actions/runs/45459639072), JS 45459639008 und W5 45459638943 success. Standard Haus-first: 50 Eis, kein W3/W4/W5, Haus 2028. Standard NPC-first: keine neue Hülle, keine Industrie, Haus 3000 ohne eigene Aktionen. S02 Haus-first: ebenfalls keine Industrie, Haus 2028. S02 NPC-first: erste Haus-Hülle Minute253, Überführung ab313 bis373, Miner/Eis ab373; eigener F4-Versuch493 mangels 50er-Eischarge abgelehnt. Tag7 100 Erz, 10 Material, 1 W5-Hülle, 400 Eis insgesamt, Haus2751, Spedition1610. Keine eigene bezahlte F4 in diesem Lauf belegt. #617 inzwischen ebenfalls 3/3 Workflows erfolgreich. PIR- und Standardprofile nicht verwechseln.
## Aktiver Miner-first-Versuch
Statt passivem Warten: sofort realen Miner kaufen und Eis fördern, Gründungshülle dem NPC-Markt überlassen, erste tatsächlich produzierte Hülle kaufen, echte Überführung und wiederholt eigene F4 nach tatsächlicher Verfügbarkeit versuchen. Standard, isolierter bestehender K7-Automatikschalter allein, und explizites S02 jeweils 7 Tage in 10-Minuten-Intervallen und exaktem Replay. K7-only ist Forschungsgegenprobe, kein aktueller Standard-UI-Modus. Tagesweise echte abgeschlossene Haus-F4, Tarif, Lohn, Kassen, Material, Werft und Eigentum protokollieren. Keine zusätzliche Ware, Finanzierung, Produktregel oder Änderung von Tutorial/Spielstand. Negative Befunde zulässig. CI offen. Ziel: aktiven Einstieg statt Zwangswarten und kleinstmögliche vorhandene Politikoption prüfen. Keine Aussage über Echtzeitspielspaß oder Langzeitstabilität.

## Abschluss des Haushaltsaudits · 25.11.2026

Auf dem geprüften Head [`5dd997a7`](https://github.com/tobiasfranziskus/Check/pull/618/commits/5dd997a72da7b517ed718ac4670d1f4cc30e2f10) meldet GitHub vier abgeschlossene erfolgreiche Workflows. Der regionale Haushaltsaudit lief zusammen mit JavaScript-Regression, W5-RC1 und Prototypinventur. Die Testdatei wurde für die W6-Forschung übernommen. Sie prüft Standard, K7-only und S02 an Tag 7, 30 und 90 mit Haushaltskassen, Wasserkäufen und Replay pro Profil. [Audit](https://github.com/tobiasfranziskus/Check/actions/runs/45546061265) · [JavaScript](https://github.com/tobiasfranziskus/Check/actions/runs/45546061209) · [W5-RC1](https://github.com/tobiasfranziskus/Check/actions/runs/45546061231) · [Inventur](https://github.com/tobiasfranziskus/Check/actions/runs/45546061313)

Auf der W6-Basis lokal wiederholt, 3/3 Tests erfolgreich. Gekauftes Haushaltswasser Aldera/Nadir an Tag 7, 30 und 90:

| Profil | Tag 7 | Tag 30 | Tag 90 | W3-Erz / Material / gebaute W5-Hüllen an Tag 90 |
| --- | ---: | ---: | ---: | ---: |
| Standard | 2.714 / 1.193 | 4.250 / 1.868 | 4.250 / 1.868 | 0 / 0 / 0 |
| K7-only | 0 / 213 | 0 / 213 | 0 / 213 | 100 / 10 / 2 |
| S02 | 0 / 174 | 0 / 174 | 0 / 174 | 100 / 10 / 1 |

Die K7-only- und S02-Miner-first-Läufe erwerben ihre erste echte Nadir-Hülle in Minute 230. Die gewählte Aktionsfolge erreicht in keinem der drei Miner-first-Profile eine bezahlte Haus-F4. Der Befund betrifft diese Entscheidungskette. Die separate U7/U8-Matrix verwendet einen aktiven Speditions- und Ersatzplan.
