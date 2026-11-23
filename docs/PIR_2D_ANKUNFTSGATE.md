# PIR-2d – Vertragsankunft: Integrations-Gate und Codex-Auftrag [DRAFT / FORSCHUNG]

Basis #600 `d6f741086545e0f37506cc85bfef05f7189d24ad`, drei erfolgreiche Workflows. [Originalmatrix](https://github.com/tobiasfranziskus/Check/actions/runs/45260398733/job/137993295385): bei Tor x=96000, y=0, Kurs 0 oder 128 erreicht der Frachter das Dock nach 185 bzw. 135 von 240 Schritten, unabhängig von der Folgeprobe. 55 Schritte Mindestreserve **nur in den getesteten zwei Startkursen**. 144000: 218/168; 192000 und größer nicht in allen Paaren erfolgreich. Start mit 96000/Kurs128 als isolierter Forschungsparameter, keine Balancingfreigabe. Keine erfundenen Positionen im Transit.

## Konkreter Integrationsblocker

- `prototypes/welt/rule200-k7-industry-core.js`, W5n tick (3127 ff.): Lohn und Ankunft auf Zeitstempel, dann 50 Eis, Kaufbetrag, Phase rueck und Systemwechsel. Keine lokale Dockvorbedingung.
- `prototypes/welt/welt-kern.js`, K1 koerperSync (234 ff.), Spielerfracht audit (1044 ff.), wirtschaftsMinute (2366 ff.): Reise erzwingt Transit; die Vertragszeit bleibt fest. Rückfracht und K2-Minertransport reagieren ebenfalls auf den originalen Ankunftstick.
- `prototypes/flug2d/flug-kern.js` audit (332 ff.): Reise genau dann Transit; frei/angedockt im unveränderten Reisevertrag werden abgewiesen.
- Neue Negativ- und Originalabrechnungstests dokumentieren diese heutige Grenze. **Sie implementieren nicht die neue Ankunftsregel** und sind keine Abnahme eines PIR-2d-Spielpfads. Node22-CI ist initial offen.

## Nächster zusammenhängender Codex-Implementierungsauftrag

Auf diesem Branch ein **explizit isoliertes, nicht öffentlich aktiviertes PIR-Ankunftsprofil** hinzufügen. Bestehendes PIR-1 und Standardkarriere bytegleich erhalten. Kein paralleler Weltzustand, kein zusätzlicher Tick, keine zusätzliche Rechnung.

1. Nur authentischen aktiven, ausfinanzierten F4-Hausauftrag in Richtung Nadir mit vier Restminuten in die lokale Phase überführen. Eindeutigen abgeleiteten Tor-/Zeit-/Vertragsnachweis, gültigen Ort und Originalkörper etablieren. FLUG-Schritte ausschließlich im bestehenden 60er-Takt; keine frei setzbaren Teleportbefehle, keine fremde Steuerung. Kurs128/96000 als Start; keine globale Änderung anderer Routen.
2. Bestehende W5n-Transaktion vor ihrer ersten Mutation durch tatsächliche Dockbedingung schützen; Ankunft erst am Originaltermin mit Original-Integratordock, keine zusätzliche Gebühr/Arbeit. Definition einer atomaren fehlgeschlagenen Minute bzw. modellierten und finanzierten Unterbrechung: **keine** F4-Frachtabgabe, Zahlung, Rückfracht, freie Arbeit, kaputter speicherbarer Zwischenstand oder unkontrollierter Spielabsturz bei fehlendem Dock. Ist ein gültiger Unterbrechungsweg in diesem Profil nicht belegbar, das neue Profil deaktiviert lassen und Blocker dokumentieren, nicht die Prüfbedingungen lockern. Rückweg zunächst original.
3. FLUG-, K1-F4- und Originalwirtschaftsaudits nur für den authentischen lokalen Vertrag und dessen gültige Zustandsübergänge erweitern. Negativfälle: ungültige Phase, gefälschter Körper/Position/Andockung/Vertrags-ID, nicht vorfinanzierter Lohn, frühe Ankunft, verspätete Ankunft, fremde Befehle, doppelte Auszahlung, Replay nach Speichern in jeder lokalen Minute, Teilschritt-Export/Import. Keine aus JSON aktivierbare Profilfreigabe. Alle anderen Transitregeln unverändert.
4. Original F4-Nadir-Andockung an Minutengrenze belegen: 50 Eis, 250 ISK Kaufwert, 120 ISK Lohn, 240 ISK Tarif; Eigentum, beide Treuhandkonten und Original-Rückfracht/K2-Verladung erhalten. Standard F4 Referenz `e4514490aedc13bd` erhalten; PIR-1 Referenzen und bestehende Matrix erhalten. Zwei echte Replays, Gesamt-Node22, WebKit/Chromium und 13x90 plus S02-365/730 (Profil aus); zusätzliche PIR-Profilläufe. Erst nach diesen Gates separate echte Verfolgungsentscheidung und PIR-3-Kampf/Schäden. Keine neue Geldemission, Verluste oder Beute in diesem Paket.

#599 Startbildschirm und P0 #586 bleiben unabhängig. Roadmap-/Projektstatus-Konsolidierung mit P0 koordinieren. Kein Merge/Deploy.
