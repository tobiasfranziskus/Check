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

## Physischer Anflug im Forschungsentwurf

J8 startet den Anflugversuch ausdrücklich über `startenPiraten(true, true)`. Der normale Startdialog bietet weiterhin den bisherigen PIR-1-Stand an. Der laufende Hausauftrag muss eine erworbene Hülle, die echte Eischarge, einen offenen Spielerfrachtbeleg und die beiden vollständigen Restreserven vorweisen. Bei vier Restminuten setzt der Weltkern den Körper einmal am Nadir-Tor ein. Der bestehende Andockbefehl gibt den Kurs an den gemeinsamen Flugkern. Auch eine frühe Andockung löst die Originalbuchung erst am vertraglichen Termin aus. Der Rückweg verwendet das bestehende W5n-Transitmodell.

Verfehlt der Frachter das Dock, wird der letzte Teilschritt zurückgenommen. Der Forschungsstand bleibt an der Grenze vor der Ankunftsminute stehen. Beide Treuhandkonten, die Eischarge und der Vertragsstatus bleiben dabei gebunden. Diese Unterbrechung dient der technischen Abnahme. Eine spielbare Wiederaufnahme oder Auflösung eines gescheiterten Vertrags benötigt eine eigene bilanzierte Regel.

Der Ladepfad prüft exakte, zuvor auditierte Ausgaben des laufenden Prozesses. Pro Lauf stehen bis zu 64 solche Exporte zur Verfügung. Der Forschungsimport verlangt die ausdrückliche Profilwahl außerhalb der Datei. Neustart und frei bearbeitbare externe Forschungs-JSONs sind mit dieser Implementierung nicht als Wiederaufnahme vorgesehen. Standard- und PIR-1-Speicherpfade verwenden weiterhin ihre eigenen Prüfungen.

Die lokale Prüfung unter Node 22 reproduziert das Nadir-Dock nach Schritt 135, den vertraglichen Übergang nach Schritt 240 sowie beide Treuhandbewegungen. Geprüft sind Teilschritt-Exporte, ein identischer Replay-Hash über die volle Frachtfahrt, verworfene Dockfälschung und ein absichtlich verfehltes Dock. Die unabhängige Abnahme umfasst zusätzlich die vollständige Regressions-, Wirtschafts- und Browsermatrix. PIR-2e und PIR-3 bleiben bis zu deren Ergebnis offen.

## Unabhängige Integration

Die [Baseline #603](https://github.com/tobiasfranziskus/Check/pull/603) ist ein Testfix auf #601. Der [Anflug #604](https://github.com/tobiasfranziskus/Check/pull/604) enthält Flug-, Vertrags-, Audit- und Kartenänderungen. Das ursprüngliche `main` für diesen Stapel ist `53c1dfc2` aus M4-U10. Der Probeabgleich mit #599 lässt sich ohne Konflikt zusammenführen. Der Abgleich mit P0 #586 meldet bereits auf #601 einen Roadmap-Konflikt. Bei der späteren Integration die P0-Konsolidierung und die beiden PIR-Forschungshinweise übernehmen.

Für PIR-4 nach nachgewiesenem Kampf zuerst einen freiwillig abgeschlossenen Eskortvertrag mit vorfinanzierter Hin-, Einsatz- und Rückkehrzeit erproben. Eine Eskorte muss ein vorhandenes Schiff mit gültigem Eigentum, Ausstattung und Einsatzreserve sein. Schutz und automatische Verteidigung sollen aus seiner realen Position, Zielerfassung und Handlungsfähigkeit folgen. Die Abnahme sollte belegten Schutzgewinn für einen echten Konvoi, vollständige Lohnabrechnung und einen definierten Einsatzabbruch bei leerer Reserve verlangen.

## PIR-2e · Abfangforschung

J8 wählt die getrennte Stufe mit `startenPiraten(true, 'abfangen')`. Nur frei fliegende, geladene Frachter im selben System kommen in die Auswahl. Der Originalwert der Ladung und die stabile ID entscheiden die Reihenfolge. Eine Abschätzung mit dem Geschwindigkeitsvorteil, der verbleibenden Zeit, dem Verschleiß und der Flugreserve prüft die Erreichbarkeit vor dem validierten Folgen- und Aufschaltbefehl. Der Einsatz endet bei verlorenem Ziel, abgelaufener Patrouille, verbrauchter Hülle oder Unterschreiten der Rückkehrreserve. Der Node-22-Anflugtest belegt Aufschaltung des realen F4-Frachters, Rückzug und identische Fortsetzung aus gespeicherten Abfang- und Rückkehrzuständen.

## PIR-3 · Erster Angriff im gemeinsamen Weltzustand

Im Wirtschaftsmanager unter `prototypes/spiel/index.html?pir-forschung=kampf` die angebotene Kampfforschung ausdrücklich wählen. J8 verwendet `startenPiraten(true, 'kampf')`. Die Forschungsstände sind während der geöffneten Seite fortsetzbar. Ein Neustart des Browsers beendet diesen flüchtigen Speicherpfad. Die übrigen Karriere-Speicherstellen sind geschützt.

Das Forschungswaffenprofil der vorhandenen Piratenhülle verwendet Reichweite 260.000 P, 36 Flugschritte zwischen Schüssen, nominelle 96 Hüllenpunkte und 24 Schaden aus F8-E. Feuer setzt Fortschritt im gemeinsamen Flugtakt, Aufschaltung, einen frei fliegenden Kontakt, Rückkehrreserve und gültige Nadir-Einsatzlage voraus. Der Trefferwinkel von 24 Kursstufen und 16.000 P Schutzradius um die Station sind neue Forschungsparameter. Das Waffenprofil modelliert keine physische Munition. Für den realen F4-Frachter ist keine Schildausrüstung belegt. Das Journal speichert jeden Schuss samt Distanzquadrat, Zielwinkel, Wirkung und resultierender Hülle.

Bei höchstens 24 Hüllenpunkten endet die Verfolgung. Ein so beschädigter Hausfrachter kann einen gebundenen F4-Vertrag noch abwickeln und erhält keine Freigabe für einen neuen F4-Auftrag. Ladung und Eigentum bleiben am realen Schiff. Reparatur, Totalverlust, Restwert, Ladungsbergung und Verrechnung mit einem bestehenden Treuhandvertrag sind Gegenstand von PIR-3b.

Im Originalablauf schießt `pir001` in Weltsekunde 10561 auf den realen Frachter `sh002` und verfehlt ihn. Die Treffer bei 10597 und 10633 senken seine Hülle auf 72 und 48. Der Kampf-Replay endet nach der vollständigen Frachtfahrt mit Hash `aa301a2025e848cb`. Die vorhandene Karte zeigt echten Ort, Abfangen, Aufschaltung, Angriff, Rückkehr und aufklappbare Hüllen- und Schussbelege. Ein gesetzloses System ist in dieser Regel204-Forschungswelt kein operativer Einsatzort.

### Nachweise

- Der PIR-2d-Stand bestand 606/606 Node-22-Tests, 13×90 Wirtschaftsszenarien sowie S02×365 und ×730 mit deaktiviertem Anflugprofil. Der zivile S02-730-Kontrollhash lautet `cabda24fb8cf9622`. Die separate [Touchmatrix](https://github.com/tobiasfranziskus/Check/actions/runs/45263557545) zeigt auf diesem Stand Chromium und WebKit je vier Größen.
- Aktive Kampfforschung über 90 und 365 Tage hält Weltgeld 33.240 ISK, Mint/Burn 0, die 50er-Eischarge, die F4-Gesamtvergütung und 48 Hüllenpunkte. Tag 90 ergibt `f87030f008bf4121`, Tag 365 `5dfe31404263cfd0`. Der Piratenpilot erhält insgesamt 203 ISK aus der vorhandenen Reserve.
