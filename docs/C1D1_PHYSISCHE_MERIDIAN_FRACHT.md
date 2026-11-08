# C1d-1 – erste real finanzierte physische Meridian-Lieferung

**[DRAFT / FORSCHUNG · 08.11.2026]** Folge des erfolgreich gezielt getesteten C1c-3-Bauteil- und Lagermodulbaus in [#253](https://github.com/tobiasfranziskus/Check/pull/253). Die Modell-C-Referenz [#245](https://github.com/tobiasfranziskus/Check/pull/245) bleibt **[OPTION]**. Ein extern bezahlter Kaufvertrag und die Geldemission sind **nicht implementiert**. Die `index.html` des Produktbranches `main`, GitHub Pages und Spielstände bleiben unverändert.

## Was im Forschungs-Core ausgeführt wird

Ein einzelnes, aus realen Erz-, Material-, Silizium- und Bauteilchargen gebrauchsfertig produziertes Lagermodul wird als tatsächliche Ladung im bereits vorhandenen, vorher vollständig bezahlten W3-Frachter `sh002` transportiert. Kein neues Schiff, keine kostenlose Rohware, keine Ladungserzeugung am Ziel und keine Warenübertragung ohne Ankunft.

| Phase | Physische Strecke / Ware | Bezahlt |
| --- | --- | --- |
| **Vorauszahlung** | Auftraggeber `house` hinterlegt 300 ISK Fracht; Originalspedition `transport` bindet 240 ISK tatsächlichen Arbeitslohn im eigenen Treuhandkonto | Insgesamt **540 ISK gebunden**, bestehendes Geld, kein Mint |
| **Positionierung** | Aldera → Nadir, 60 Minuten | 60 ISK im Minutentakt an belegtes Pilotenkonto |
| **Lieferung** | Nadir → Meridian, 60 Minuten, 1 reales Lagermodul als Schiffsladung; Zielware erst nach tatsächlich absolvierter Reise im Meridian-Lager | Weitere 60 ISK |
| **Rückreise** | Meridian → Aldera über die vorhandene Nadir-Verbindung, 120 Minuten; Frachter nach Rückkehr wieder frei | Weitere 120 ISK |
| **Abschluss** | Spedition erhält die hinterlegten 300 ISK erst nach vollständig finanzierter Rückfahrt; sie trägt zuvor 240 ISK Arbeit | Speditionsrechnung +60 ISK vor Reparatur-/Verschleiß-/Ausfallrisiko |

Die C1d-1-Forschungsgeografie ergänzt `nadir → meridian` um **60 angenommene Flugminuten** und ein zunächst leeres Lager. Das ist ein ausdrücklich **nicht genehmigter Forschungswert**, keine Aussage über die spätere Sieben-System-Karte. Die alte Aldera–Nadir-Verbindung bleibt unverändert. Ein bereits gestarteter Wassertransport wird nicht storniert oder verdrängt; ein Exportauftrag beginnt nur, wenn derselbe physische Frachter wieder frei im Dock liegt.

**Wichtig:** Die **300-ISK-Fracht** ist eine vorläufige positive Vertragsrechnung, nicht der endgültige Modell-C-Frachtpreis oder nachgewiesener Vollkostentarif. Das spätere Modul hat im Modell eine **vorgeschlagene Referenzbewertung von 430 ISK am Produktionsort**. Die Warenbestände in Meridian bleiben bis zum externen Kaufvertrag Eigentum des Herstellers; Lieferung/Einlagerung ist **keine externe Exportannahme**. Beide Abschnitte müssen gesondert nachgewiesen werden, bevor irgendeine neue ISK-Buchung zulässig ist.

## Technischer Beleg und Autorität

- Opt-in-Forschungsprofil `aphros-research:C1d-1:physical-delivery-no-mint-v1`, Regel **3306**; keine Freischaltung alter Profile und kein Produkt-Save-Upgrade. Regeln und das zugrunde liegende Core-HTML sind über SHA-256-Speicherhülle gebunden.
- Autoritativer Core-Auftrag `shipCapitalFreight` mit bestehender Schiffseigentümerschaft, realen bestehenden Warenbeständen, drei eigenständigen Reise- und Treuhandphasen. Der globale Core-Audit überprüft das neue C1d-Frachtbuch; W3-Kassenledger und W5b-Warenledger berücksichtigen **nur im Opt-in-Forschungsfall** die echten Vorgänge.
- Privater Auftraggeber, Spediteur, Frachtreserve und Pilotenkonto sind getrennt; alle Pilotzahlungen erfolgen für tatsächlich abgelaufene Minuten. Keine zusätzlichen ISK, keine verlorenen Waren, keine behaupteten Leistungen aus unsichtbaren Timer-Spruengen.
- Negativtests prüfen nicht vorhandene Ware, falschen Besitzer, parallele/duplizierte Aufträge, manipulierte Frachterladung, Funds, bezahlte Arbeit, Save, Export/Mint und Eigentumsbelege. Zwei Seeds (42/7), Save/Load im Zwischenflug und deterministischer Replay bis zur Rückkehr.
- Das zusätzlich bezahlte Pilotenkonto ist **nicht automatisch** dem privaten Wasserhaushalt zugeschlagen; die private Einkommensverteilung dieses Arbeitslohns bleibt ausdrücklich eine **offene Frage** für C1d-2.

## Prüfstatus und offene Gates

Neuer gezielter Test: `node tests/c1d-1-meridian-fracht.test.mjs`. GitHub Workflow [C1b-1 – exaktes isoliertes C-Wasserprofil](https://github.com/tobiasfranziskus/Check/actions/workflows/c1b-1-wasser.yml). Allgemeiner Regressionstest: `node --test tests/*.test.mjs`.

**[ANALYSE]** Der erste CI-Lauf auf `d89c00b` wies nach, dass die reguläre, finanzierte W5n-Wasserfracht den vorhandenen Frachter bei Tick 228 noch belegt; daher war ein sofortiger zweiter Vertrag ausdrücklich verboten. Die C1d-Testausführung wartet nun kontrolliert auf dessen **echte** Rückkehr. Es gibt keine Teleportation und keinen kostenlosen Abbruch.

Die GitHub-CI-Ergebnisse der anschließenden Testkorrektur müssen separat bestätigt werden. Vor Abschluss der Workflows sind **keine** C1d-1-Tests als bestanden zu bezeichnen. Auch eine grüne Node-CI beweist keine reale iPad-Safari-/NAS-Abnahme.

## Nächster echter Wirtschaftsschritt

**C1d-2:** Nach wirklicher Meridian-Ankunft eine eindeutige externe Abnahme und den globalen Etat mit integer-/bruchteilssicherer Verbuchung nach den *noch zu genehmigenden* Modell-C-Konditionen entwickeln. Keine zweite Vergütung für dasselbe Lagermodul; Vertragsetat und Exportpreis dürfen vor einer ausdrücklichen Produktentscheidung **nur** als isolierte, negativ getestete Forschungsannahmen gelten. Anschließend Lohnrückfluss ins private Verbrauchersystem und 30/90-Tage-Ketten untersuchen.

Kein Merge, kein Deployment, keine Produktregel- und Spielstandänderung.
