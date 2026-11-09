# W5z – fünf wirklich bezahlte W3-Rundfrachten und ein ehrlicher Käuferstopp

**[DRAFT / TEST / INTEGRATION · 09.11.2026]** Nur Ergänzung auf [W5y #269](https://github.com/tobiasfranziskus/Check/pull/269): eine bestehende Original-Regel17/Schema8-Welt und dieselbe Frachtkonsole `prototypes/w5y/index.html`. **Kein neuer Simulationskern, keine Regeländerung, keine neuen ISK, keine künstlichen Kundeneinnahmen, keine Produkt-Saves, kein Merge/Deployment.**

## Reale mehrfache Waren- und Geldbewegung

Der bereits für **750 ISK tatsächlich gekaufte** Frachter `sh002` gehört unverändert der Spedition `transport`. Der Original-W3-Core führt bei tatsächlich gefördertem Erz, vorhandener Lagerkapazität sowie einem vollständig gedeckten Käufer- und Arbeitsauftrag **fünf** aufeinanderfolgende Frachten aus. Eine neue Bestellung wird nach jeder Rückfahrt ausdrücklich neu durch `pilotW3Kalkulation` geprüft.

| Core-Tick nach echter Rückfahrt | Bezahlte Lieferungen | Physische Erzmenge Nadir | Kumulierte Nadir-Ausgaben | Nadir-Kasse | Speditionskasse | Transportlöhne gesamt |
|---:|---:|---:|---:|---:|---:|---:|
| 170 | 1 | 50 | 740 ISK | 3.260 ISK | 1.370 ISK | 120 ISK |
| 290 | 2 | 100 | 1.480 ISK | 2.520 ISK | 1.490 ISK | 240 ISK |
| 410 | 3 | 150 | 2.220 ISK | 1.780 ISK | 1.610 ISK | 360 ISK |
| 530 | 4 | 200 | 2.960 ISK | 1.040 ISK | 1.730 ISK | 480 ISK |
| 650 | 5 | 250 | 3.700 ISK | 300 ISK | 1.850 ISK | 600 ISK |

Eine Fracht bindet bereits vor Abfahrt wirklich **500 ISK Warenwert + 240 ISK Entgelt aus Nadirs Konto** und **120 ISK Arbeit aus Speditionsgeld**. Erst die physische Ankunft überträgt 50 Erz an Nadir und 500 ISK an Aldera; nur der vollständig bezahlte Rückflug zahlt das Frachterentgelt an die Spedition. Die **600 ISK Löhne** landen beim Arbeitsfonds, nicht kostenlos beim Frachter. Nach fünf Frachten sind **1.200 ISK Frachterentgelt** ausgezahlt; die Spedition erwirtschaftet brutto 600 ISK nach direkten Fahrtlöhnen, vor weiteren noch nicht modellierten Langzeit-/Ersatzkosten. Nach ursprünglichem Hüllenkauf bleiben 1.850 ISK.

## Käuferetats sind keine kollektive Betriebskasse

Bei Tick 650 verfügt Nadir über **300 ISK**, statt **740 ISK** für die nächste vollständige Finanzierung. Die Originalfunktion `pilotW3Kalkulation` verweigert den sechsten Auftrag. Obwohl **100 wirklich vorhandene Erz** im Quelllager Aldera, ein freier bezahlter Frachter und die genügende Speditionskasse vorliegen, findet **kein** sechster Verkauf statt.

Der ursprüngliche W2-`export`-Eigentümer hat noch **15.500 ISK**. Diese gehören **nicht** Nadir, sind keine offene Kreditlinie und dürfen nicht als Gratis-Nachfrage umgebucht werden. Ein entsprechender gefälschter JSON-Import (`+440 ISK` bei Nadir, `−440 ISK` beim anderen Eigentümer, Weltgeld unverändert) wird durch die Original-Audits verweigert. Ein erfolgloser `freightStart` verändert weder Weltzustand noch Hash.

**Weltgeldsumme = 33.000 ISK, geschöpft = 0.** Tatsächliche Warenherkunft aus dem Original-NPC-Bergbau; keine ausgedachten Startsätze.

## Test und Bedienung

- `tests/w5z-finanzierte-folgefrachten.test.mjs`: 13 RNG-Seeds × fünf echte W3-Aufträge = **65 vollständig bezahlte Rundfrachten** bei jeweils separater Seed-Welt, Original-Cores, Geld-/Waren-/Eigentümer-/Vollkostenaudits und **unabhängig nachgezählten Eigentümerkassen**. Die Testbedingungen haben bis auf den Seed denselben Finanzierungs- und Nachfragerahmen; **das sind nicht 13 ökonomisch verschiedene Krisenregime**. Seed42/7 einschließlich separater Save/Load-/Replay-Nachweise im laufenden Auftrag.
- `tests/w5y-touch.py` testet nun in den bereits etablierten **vier Chromium-Touchgrößen** den echten fünfmaligen Frachtablauf und die sichtbare Verweigerung der sechsten Fahrt. Kein neuer Bedienmodus; jeder Auftrag bleibt eine explizite, erneut geprüfte Core-Aktion.
- `prototypes/w5y/index.html`/`extension.js`: Im Frachtfenster wird der tatsächliche bezahlte Verlauf sowie die **Core-Begründung** der nächsten Finanzierungsprüfung lesend angezeigt. Aus echten historischen Belegen abgeleiteter Durchschnitt ist lediglich Vergangenheitsdiagnose, **kein neu berechneter Zukunftspreis**. Die Anforderung wird im Core immer neu validiert. Keine Gelder werden durch den View übertragen.
- Die eigene [W5y-GitHub-CI](https://github.com/tobiasfranziskus/Check/actions/workflows/w5y-integration.yml) wurde um diesen Regressionstest ergänzt; vor einem abgeschlossenen Lauf keine neuen grünen Ergebnisse behaupten.
- W5u, W5w, W5x und W5y bleiben jeweils separate Regel- und Browserprofile. Original-W3-Kern, Save-Schema 8 und Produkt-Hauptdatei `index.html` **unverändert**.

## Einordnung und Anschluss W4

**[TEST]** Der komplette W3-Hin-/Rück- und Folgefahrtweg ist von Ware/Finanzierung bis zur Zahlung wiederholbar, aber sein **wirtschaftlicher Absatz ist endlich**. Schon ohne neue Mechanik werden Käufer und Spediteur getrennt geprüft. **Keine** Aussage, die 13 Seeds belegten 90 Tage wirtschaftliche Selbsttragfähigkeit.

**[NÄCHSTER SCHRITT / OPTION]** Die 250 Erz in Nadir sind zunächst nur physisches Lager, **kein automatisch gewinnbringender Konsum**. W4 sollte daher als nächste kleinste Spielstufe die vorhandene originale Raffinerie aus #169 einsetzen: wirkliche Erzübernahme gegen belegte Zahlung, bezahlte Arbeit, Materialgut und einen konkreten Folgekäufer mit eigenem Etat. Keine erfundene Endnachfrage und keine neue Emissionsregel. W4-Kapital-/Warenkosten vor jeder Umsetzung separat prüfen.

**[FREIGABE]** Die verbindliche Produkt-Roadmap liegt ausschließlich auf aktuellem `main/docs/ROADMAP.md`. iPad Safari, NAS, produktive Save-Migration, wirtschaftliche W4-Folgeabnahme bleiben offen. Dieses Dokument ist **DRAFT**, kein Release.
