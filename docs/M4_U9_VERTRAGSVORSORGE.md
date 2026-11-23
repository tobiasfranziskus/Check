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
