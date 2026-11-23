# M4-U9 – Vertragsvorsorge und geordnete Teilabwicklung [FORSCHUNG]

Basis: #578, Head `0b7b5776e0ded08e8661b30369e7ae9672443bc6`, nicht main. #577 bleibt getrennt. Keine Aktivierung, kein Merge, kein neues Saveformat. Der Originalbericht [U7/U8](M4_U7_U8_MANAGEMENT_ABNAHME.md) weist S02, Tag 30, 22 Erz im stillgelegten Miner und 1.390 ISK gebunden nach.

## U9a: ausführbare Vorsorge

`node --test tests/m4-u9-vertragsvorsorge-research.cjs` und `node tools/m4-u9-vertragsvorsorge.cjs S02 30 42`.

Der Testtreiber nutzt im vorhandenen S02-Managementlauf eine optionale Entscheidung vor der unveränderten Originalstrategie. Nur bei unbestätigten Hausangeboten: Restaktivminuten werden exakt aus Abschreibung und Aktivminuten abgeleitet; der Mindestförderaufwand enthält noch keinen Flug. Ein gültiger Save-Klon erhält die tatsächliche Hauszustimmung und maximal 240 Originalminuten. Ein vollständig verladenes Erzlos oder ein nachweislich stillgelegter, angedockter Miner mit unvollständiger Charge werden getrennt berichtet. Unklare Fälle führen nie zur Stornierung. Nur im Gegenversuch darf der simulierte echte Auftraggeber Nadir bei belegter Stilllegung das noch unbestätigte Angebot mit dem bisherigen K7-Befehl stornieren. Kein Eingriff in aktive Verträge, kein automatischer Spielerbefehl im Produkt, keine Garantie trotz erfolgreicher Probe (spätere Entscheidungen können anders verlaufen). Der Kontrolllauf muss den bisherigen Hash reproduzieren; beide Läufe müssen die originalen Audits bestehen. Eine wiederholt angebotene ungeeignete Hülle kann weiterhin blockieren. Die erste Fassung ist bewusst testseitig und keine produktive Prognosefunktion.

## U9b: bereits gebundene Teilcharge – nächster Kernauftrag

Originaler W1-Teilvertragsabschluss (`m_core_erzpilot.abschliessen`) kann vorhandene Ware ausschließlich am Dock und aus vorhandener Kaufreserve abrechnen. Der K7/W3-Storno `stornierenVorArbeit` lehnt dagegen Waren an Bord ab. Beide Pfade müssen abgestimmt werden, nicht einzeln umgangen werden.

Vorgeschlagene isolierte Vertragsregel: Nadir, Meridian und der tatsächliche Frachter-Eigentümer stimmen der Abwicklung zu; gebundene Werftmittel werden nur bei noch nicht begonnener Werftarbeit und im Einverständnis der Werft zurückgeführt. Keine Gratisstornierung geleisteter Arbeit. Für bereits geförderte Ware entweder nachweislich gedeckter Ankauf am Aldera-Dock zu Originalpreisen oder Eigentum und Ladung bleiben unverändert bis zu einer freiwilligen physischen Übernahme auf eine bezahlte Ersatzhülle. Kein Erlös für nicht geleistete Fracht; ungenutzte Reserven gehen ausschließlich an die ursprünglichen Zahler, bereits gezahlte Löhne bleiben unangetastet. Nicht genügend Käuferbudget, Erwerbskosten, Stellplatz, Vertragspartner oder unklare Provenienz sind legitime Sperren. Der Originalblocker mit 22 Erz und 1.390 ISK muss ohne künstliches Startkapital geprüft werden. Neue Abwicklungsbelege und Negativtests müssen Save/Load, Replay, Eigentum, Geld, Ware und doppelte/gefälschte Zustimmungen erfassen. Keine Migration alter Saves ohne Prüfung.

## Gate

Erst U9a-CI und U9b-Abwicklung, dann 13×90, S02×365/730 mit gleicher Kontrollstrategie/Seeds, dokumentierte Wiederaufnahme echter bezahlter Leistungen und ehrlicher Vergleich zur Standardregel. Wirtschaftliche Krisen sind zulässig. #574/#577/#578 benötigen gemeinsame Abnahme vor einer Integration. Stand bei Erstellung: U9-Code und Tests committed, lokale Ausführung durch DNS-Fehler nicht möglich; CI offen. Kein Erfolg einer Gegenprobe oder einer Vertragsrettung behauptet.


## U9a geprüfter Befund und U9b Folgeversuch – 23.11.2026

[U9a Node22-Job](https://github.com/tobiasfranziskus/Check/actions/runs/45115938820/job/137498678553) auf `a78e2363`: 2/2 Tests. Kontrollhash `478696c8bbb0c153`, 137 Eis-/3 Erzfrachten, 1.390 ISK gebunden. Ein nachgewiesen ungeeigneter Miner sh011 (31 Restaktivminuten, 50 Mindestförderminuten) führte bei Tick 17940 nach 42 Probe-Minuten zum Rückzug des unbestätigten Angebots. Gegenversuch: 334 Eis-/7 Erzfrachten, 307 ISK gebunden, Hash `68882ecfc58324a9` nach 30 Tagen. Kein Langzeitstabilitätsbeweis.

U9b auf getrenntem Folgebranch: Node-only Funktion `u9TeilabrechnungProbe` auf dem isolierten U7/U8-Profil. Sie liefert ausschließlich eine neue auditierte JSON-Kopie; der Originalzustand bleibt unverändert. Der Testtreiber muss alle fünf fiktiven Vertragsparteien (Nadir, Aldera, Meridian, tatsächlicher Carrier, Werft) für den exakten Ausgangshash ausdrücklich zustimmen lassen. Dies simuliert eine einstimmige Abwicklungsentscheidung, ist noch keine echte Spielerzustimmungs-UI und keine Signatur. Kein Browserpfad und keine automatische Ausführung.

Nur aktive, noch nicht befahrene Vorbestellung, stillgelegter Meridian-Miner physisch am Dock und freier Carrier im selben Dock. Keine bereits begonnene Werftleistung. Originale W1-Kaufreserve und Teilabrechnung werden wiederverwendet; bei fehlender W1-Reserve muss Aldera nach echter vorhandener industrieller Nachfrage, Kasse und Lager eine neue gedeckte W1-Reserve bilden können. Teilladung vollständig verkaufen oder auf der unveränderten Originalwelt ablehnen. Danach der Original-K7-Storno (Nadir 740, Carrier 120, Werft 530 ISK zurück; keine Frachtvergütung, geleistete Arbeit bleibt bezahlt). Kein Überschreiben eines Saves oder tatsächlicher NPC-Geschäftsabschluss ohne späteren Regel-/Integrationsschritt.

Test `node --test tests/m4-u9b-teilabrechnung-research.cjs`: realer S02-Tag30-Originalhash, 22 Erz, falscher Hash/fehlende/falsche Zustimmung, identische Gegenprobe, Save/Load, exakte Zahlungs- und Warenprüfung, Eigentum, 7-Tage-Replay nach erfolgreicher Abrechnung. Finanzierungsmangel ist ein explizit zulässiges Ergebnis, kein künstlicher Ankauf. Neue CI bei Erstellung noch offen. U9c bleibt finanziertes Ersatzschiff/erneute Originalaufträge mit echter Spielerentscheidung; keine Veröffentlichung.
