# J4a – Finanzierter zusätzlicher Erztransport für acht Jägerbauteile

**[DRAFT / ANALYSE · 14.11.2026]** Auf J3 #341 gestapelt, ausschliesslich unabhängige Forschung. Keine Produktfreigabe, kein Merge, kein Deployment.

Der vollständige abgeschlossene J3-K1-CI-Lauf [#43582914660](https://github.com/tobiasfranziskus/Check/actions/runs/43582914660) ist erfolgreich (auch Chromium, WebKit, W5-RC1 und separater JS-Workflow auf demselben Head erfolgreich). Im ausgeführten J3-Endlichkeitstest ist das tatsächliche Nadir-Lager auf Seed42: **7 Bauteile, 1 Material, 1 Silizium, 0 Erz**; Originalrefinery verbraucht 10 Erz für 5 Material. Für J4 braucht es daher **mindestens 10 zusätzliches echt geliefertes Erz**, eine originale W4-Charge liefert dann Material für das achte Bauteil (2 Material) und vier weitere Material für die spätere Jägerhülle. Das ist noch keine Jägerproduktion.

Der neue J4a-Test `tests/j4a-erzbeschaffung-probe.test.mjs` reproduziert die komplette echte K6→K7→J2a-Minerproduktion→J2b-8er-Silizium→J3-7er-Bauteilkette. Er untersucht die reale Verfügbarkeit der vorhandenen NPC-Miner und Transportfrachter, die noch vorhandenen Eigentümerkassen, Lagerkapazitäten, W3-Aufträge und unterzeichnete K7-Industrieverträge. Nur mit allen Originalverträgen (Käufer, Miner, Frachter, Werft) wird die originale 50-Erz-Fracht gestartet. Kein Abkürzungsbefehl, keine künstliche Warencharge, keine kostenlose Hülle und keine Geldemission. Ist der Vertrag nicht finanzierbar, wird der unveränderte Ablehnungszustand dokumentiert, statt ein erfundenes positives Ergebnis auszugeben. Erst ein durchgelaufener Vertrag darf als zusätzliche Erzlieferung gelten.

**Beim Anlegen dieses Dokuments:** Die tatsächliche J4a-CI und der gezielte neue Test sind noch offen. Nach der Diagnose werden nur bei erreichbarer, tatsächlich finanziert durchlaufener Lieferung die weiteren W4-/J3-Produktionsschritte ergänzt. Echte iPad-Safari-/NAS-Abnahme ebenfalls offen. Keinerlei F8-Spielcode, produktive Saves, Rule195-Hauptversion oder Rule200-Freigabe betroffen.


## Geprüfter positiver J4a-Nachweis – Seeds 42 und 7

Die gezielte GitHub-CI [Actions #43586909226](https://github.com/tobiasfranziskus/Check/actions/runs/43586909226) hat den **fokussierten J4a-Node22-Job abgeschlossen: 1 Test bestanden, 0 Fehler**. Beide Seeds lieferten reproduzierbar:

- **50 echtes Erz** von Aldera nach Nadir, mit vier originalen K7-Vertragsunterschriften und Original-W3-Fracht. Der erste, korrekt abgelehnte Auftrag hatte versehentlich Miner sh001 (Buchwert 0) gewählt. Die geprüfte zweite Auswahl nutzt den vorhandenen, bezahlten NPC-Miner sh008 (Buchwert 507) und Speditionsfrachter sh020 (Buchwert 588). Beide gehörten schon rechtmäßig ihren Firmen. Keine neuen Schiffe gekauft, geschenkt oder repariert.
- Nach der Erzlieferung wurde der **voll bezahlte W3-Rückflug** abgewartet; anschließend zwei Original-W4-Raffineriechargen aus 20 Erz hergestellt: **10 zusätzliches Material**. Das echte J3-Rezept produzierte mit 2 Material und 1 noch vorhandenen, bereits bezahlten Silizium das **achte Bauteil**.
- Der bereits signierte K7-Werftvertrag wurde ordnungsgemäß beendet: Die **530 ISK real gebundene Werfttreuhand** finanzierte aus 5 Material und 30 originalen bezahlten Werftminuten eine weitere echte Frachterhülle in Nadir. Die Werftreserve endet bei 0 ISK; kein Vertragsrest verwaist.
- **Endinventar Nadir:** 30 Erz, **8 Bauteile, 4 Material**, 0 Silizium und +1 tatsächlich produzierte Frachter-Lagerhülle. **Weltgeld 33.000 ISK, Mint/Burn0**, durchgehend gültige unabhängige Wirtschaft-/Flug-/Waren- und Eigentumsaudits sowie Save/Load-Hash.
- **Deterministische Referenzen bei Tick 22323:** Seed42 Hash **5e577b0646349321**, Seed7 Hash **ed74de34a052cf0e**.

### Prüfgrenzen

Dies ist der **Materialbereitstellungsnachweis**, ausdrücklich **noch keine tatsächlich gebaute oder gekaufte Jägerhülle**. Pilot und Kopfgeld gehören zum nachfolgenden, gesondert zu prüfenden Jägerbau-/Kampfgate. Die eigenständige Langzeitnachhaltigkeit des neuen J3/J4a-Materialbedarfs und echte iPad-Safari-/NAS-Abnahme bleiben offen. Die grosse CI wird separat ausgewertet; fokussierte Node-Tests ersetzen sie nicht.
