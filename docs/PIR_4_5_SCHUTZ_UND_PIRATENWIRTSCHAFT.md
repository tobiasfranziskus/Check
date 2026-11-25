# PIR-4/5 – Eskorten, Sicherheitsmarkt und Piratenwirtschaft

**[KONZEPT / OPTION / keine Implementierungs- oder Balancingfreigabe] · 23.11.2026**
Basis: main `679ba6c1fdb05435164e29b2e21514ddaa676279`, Integration #596 (Commitbericht 10/10 Workflows, 598/598 Node22). PIR-1 ist ein isoliertes Szenario, nicht Bestandteil der Standardkarriere. PIR-2d/3 werden getrennt durch Codex entwickelt (#601/#603/#604; parallele #602 vor späterer Integration auf Überschneidung prüfen). Diese Spezifikation ändert keinen Code, keine Saves und keine Regeln. Freigaben der angekündigten PIR-Entwicklung sind keine Freigabe beliebiger neuer Preise, Enteignungs-/Verlustregeln oder Startbestände.

## 1. Produktziel und Priorität

Der Wirtschaftsmanager kann durch echten Flottenschutz wirtschaftliche Gefahr abwägen und später Sicherheitsdienstleistungen als Geschäft anbieten. Piraten operieren aus vorhandener Kasse, Ausrüstung und realen Informationen; Erfolg ermöglicht Reinvestition, Misserfolg Rückzug oder Insolvenz. Keine garantierte Piratenpopulation, kein versteckter Schwierigkeitsregler, kein automatischer Schutzgeldabzug. Keine Fliegerpflicht für Manager. Fremde NPC-Unternehmen haben dieselben Buchungs- und Vertragsinvarianten.

Erst physisch erreichbare PIR-2d/e- und geprüfte PIR-3-Kampfzustände, dann PIR-4a; Beute/Schäden dürfen erst nach vollständiger Verlust- und Vertragsabwicklung freigeschaltet werden. Produkterweiterung in einzeln abnehmbaren Opt-in-Profilen, nicht durch nachträgliche Aktivierung alter Standardspielstände.

## 2. Wiederverwendung und harte Altcodegrenzen

- `prototypes/welt/welt-kern.js`: K1 Flugreserve, tatsächliche Löhne/Transfers/Verschleiß, F4-Vertragsbelege, J4c-Kaufbelege, PIR-1-Identität. Derzeit ist pir001 exakt eine Szenariohülle, Pilotkonto und 240 ISK Anfangsbestand. Kein universeller Fraktions-/Piloten- oder Mehrhüllenzugang.
- `prototypes/flug2d/flug-kern.js`: Folgen, Aufschalten, Andocken, deterministischer Teilschritt. Eskorte/Verfolgung müssen denselben Körper und Takt verwenden.
- `prototypes/welt/rule200-k7-industry-core.js`: vorhandener historischer shipEscort-Befehl prüft Eigentümergleichheit, Klasse und Selbsteskorte. Historische Eskorte gilt allerdings schon am Dock als Verteidiger; escorteBewegen erzeugt Systemreise ohne neuen K1-Schutzvertrag, ueberfall nutzt Pauschalkampf und emittiert Kopfgeld, piratenErsatz erzeugt Hülle ohne Lager, schutzgeld zieht Stationsgeld ab. Nur Begriffe und geeignete Schutzprüfungen übernehmen, **keine dieser Altregeln aktivieren**. Prüfen, ob bestehende öffentliche Altbefehle im neuen Profil Zustände umgehen können.
- `prototypes/welt/j4b-jaeger-werft-core.js`: realer Jägerbau aus 8 Bauteilen + 4 Material in 32 Minuten mit vorfinanziertem Lohn und Lager-/Kaufbelegen. Eigentum, Verschleiß und Hüllenhistorie dieses Pfads erhalten; derzeitige Käufer-/System-/Pilotbeschränkungen nicht pauschal aufheben.
- `docs/VOID_ECHOES_CODEKATALOG.md`: 480-auto01-kampf.js nur Verhaltensreferenz (freigegebene Ziele, Suchradius, Rückzug); keine alte AP/S-Simulation kopieren.

## 3. PIR-4 – eigenes Schutzgeschäft, danach Auftragnehmer

### 4a Eigeneskorte (kleinstes spielbares Paket)

Ein existierender, gekaufter, nicht stillgelegter eigener Jäger schützt genau einen eigenen vorhandenen F4-Frachter im örtlichen Nadir-Anflug. Zunächst Jäger in Nadir stationiert, kein kostenloser Systemwechsel und keine behauptete Begleitung im Transit. Eine Nadir-Hülle muss wirklich angeboten und bezahlt worden sein; bei fehlendem Lager oder Geld bleibt das Angebot gesperrt. Kein Gratis-Einsteigerjäger.

Angebot auf aktuellem Weltzustand: Ziel-ID, Jäger-ID, Einsatzort, frühester Beginn, maximale bezahlte Einsatz-/Rückkehrzeit, echte verfügbare Kasse, Reserve, verbleibende Aktivminuten, vorhandene Waffen-/Schadenszustände und Original-Sperrgrund. Spieler kann mit/ohne Schutz disponieren oder warten. Kein automatisch abgezweigtes Geld, kein stillschweigender Start.

Eindeutige exklusive Zuordnung Jäger -> Ziel/Vertrag; keine Doppeleskorte oder gleichzeitige Manöver anderer Aufträge für dieselbe Hülle. Eigentümerwechsel, Stilllegung und Handübernahme sperren neue Aktionen bzw. beenden Schutz geordnet. Ziel darf nur durch gesonderten, rechtmäßigen Vertrag fremd sein (4b).

Zustandsautomat: angeboten -> beauftragt/reserviert -> bereit -> Anflug/Begleitung -> Verteidigung -> Rückkehr -> abgerechnet. Alternativen: abgelehnt, vor Start storniert, Ziel verloren, abgebrochen, gestrandet; niemals Rückkehr vortäuschen. Der Zustand aktiv geschützt ist eine abgeleitete Momentaufnahme, keine dauerhafte Garantie: tatsächlicher gleichsystemischer freier Körper, Reichweite, Ausrüstung, bezahlte Minute, Berechtigung. Verteidigung nutzt PIR-3, nicht zusätzliche Risikowürfel. Eskorte am Dock, außerhalb Reichweite oder ohne Waffen wirkt nicht. Sichere Systeme erlauben keine Piratenoffensive; defensive Regeln an PIR-3 binden.

### 4b Fremdeskorte (Sicherheitsmarkt)

Erst nach 4a und echten Auftragnehmerhüllen. Auftraggeber und Anbieter signieren das begrenzte Angebot tatsächlich; kein UI-Befehl mit behaupteter fremder Unterschrift. Vertrag enthält ID, Parteien, konkreten Jäger/Ziel, Einsatzgebiet/-fenster, Preis, Lohnbudget, Rückkehrbudget, Leistungs- und Stornokriterien. Quote ist flüchtig, Annahme revalidiert sämtliche Voraussetzungen atomar. Anbieter muss eigenen Pilot, realen Jäger und Betriebs-/Rückkehrfinanzierung nachweisen.

Buchungsvorschlag: Auftraggeber -> separate Vertrags-Treuhand, Anbieter -> sein bereits vorhandenes K1-Flugdienstrücklagekonto. Kundengeld darf nicht gleichzeitig als eigene Flugarbeitsreserve verbucht werden. Vergütung nur aus Kundentreuhand für nachgewiesene Schutzleistung, nicht pro behauptetem Abschuss. Zeitbasierte Leistung nur für authentische gedeckte, gemäß Vertrag erreichte Schutzminuten; nach Abbruch unverdiente Mittel an ursprünglichen Zahler. Anbieter trägt Pilotenlohn und eigene Reparaturkosten; Eigentum bleibt unverändert. Keine Auszahlung allein aufgrund des Überlebens des Frachters, keine Bonusmint. Storno vor Leistung erstattet den unverdienten Anteil, kein Doppelabschluss. Geordnete sichere Rückkehr muss vor Start finanzierbar sein.

### 4c Konvoi und 4d Sektorpatrouille

Konvoi erst, wenn Originaltransportkern tatsächlich mehrere zeitgleiche, getrennte Verträge und Schiffe unterstützt. Nicht durch UI eine zweite F4-Strecke behaupten. Schutzgruppe, Teilnehmerzustimmungen, erreichbare Formation und genau ein Verbrauch je Jägerminute; keine Verdoppelung der Schutzleistung oder Lohnabrechnung. Sektorpatrouille: real begrenzter Bereich, aus freiwilliger Stations-/Firmenkasse finanzierter Dienst, keine globale unverwundbar-Flagge. Beides später, kein Blocker für 4a.

## 4. Wirtschaftliche Entscheidungen und Anzeigen

Bekannte Baseline: F4 50 Eis, 250 ISK Referenz-Kaufwert, 240 ISK Frachtgebühr und 120 ISK separat gebuchter Pilotlohn je Originalrunde; nicht mit Nettogewinn verwechseln. PIR-1 K1: 40 ISK Startreserve, 1 ISK pro tatsächlicher aktiver Minute. Beispiel nur zur Orientierung: 10 bezahlte Einsatzminuten erzeugen 10 ISK Lohn, nicht 40; 30 ISK ungenutzter Reserve können nur bei unveränderter Reserve, ohne Nachschuss und gültigem Dockabschluss an Zahler zurück. Dazu realer Hüllenwertverzehr; Reparaturpreise und Sicherheitsdiensttarife noch nicht festgelegt.

Manager sieht vor Auftrag: verfügbare Kasse, gebundene Mittel, erwartete/Maximal-Ausgabe aus echter Quote getrennt vom Wertverzehr, nächstes legales Handlungsangebot. Ex post: ausgezahlter Lohn, verdiente Schutzvergütung, Rückerstattung, Reparaturkosten, tatsächliche Schäden, verlorene/gerettete Ladung und Vertragsauswirkung. Vorhandene Kasse nicht doppelt als freies Kapital anzeigen.

Risiko zunächst qualitativ aus echter Sichtung, Alter, Gebiet, räumlicher Exposition und verfügbarem Schutz; keine erfundenen Prozentwerte, kein allwissender NPC. Später erwarteter vermiedener Nettoverlust nur aus nachvollziehbaren Vergleichsläufen als bandbreitenbehaftete Schätzung, niemals garantierter Ertrag. Alternative: ohne Schutz fahren, auf realen Jäger warten, Auftrag nicht starten oder in sichere lokale Geschäfte investieren. Keine harte Pflichteskorte.

## 5. PIR-5 – geschlossener Piratenkreislauf

### 5a Existenz, Liquidität, Entscheidung

Start zunächst aus bestehendem PIR-1 Anfangsbestand (33.240 ISK einschließlich einmaliger 240 ISK Fraktionskasse, eine auditierte Hülle). Kein weiterer Gratisbestand. Jäger und Pilot getrennt. Vor jedem Einsatz Deckung des Hin-/Rückwegs und erwartete Beute-/Reparaturoption prüfen; bei fehlender Reserve, Hülle oder Ziel kein Auslaufen. Nutzen konservativ aus sichtbarer, real erreichbarer Ladung, echter Kapazität, beobachteter Käuferofferte, erwarteten Einsatzminuten/Wertverzehr sowie Verlustgefahr abschätzen. Fehlende Käuferinfo als unbekannt behandeln, nicht als Liquidität. Stable-ID-Entscheidungen, gespeicherter RNG nur wo nötig, reproduzierbare Tickordnung.

PIR-1 zahlt Pilotlohn auf ein separates Konto; damit versiegt Fraktionskasse ohne Umsatz. Pilotgeld später nur durch echte Nachfrage des Piloten nach vorhandenen Konsumgütern oder autorisierte Ausschüttungen nach Eigentumsregeln zurück in zivile Kreisläufe führen, kein zwangsweiser Rücktransfer an Fraktion. Kein garantiertes Einkommen aus Sichtung oder Schaden.

### 5b Beute, Eigentum und Vertragsstörung (Gate vor Gewinn)

Erstes Beuteereignis erst nach PIR-3b: kanonisches Schadens-/Aufgabeereignis mit eindeutiger ID, authentischen Parteien, Position und Tick/Teilschritt. Vorschlag: Übergabe einer begrenzten physischen Ladungsmenge nach nachgewiesener Aufgabe oder Bergung eines tatsächlichen Wracks, keine automatische 100%-Enteignung. Ein einziges Eigentums-/Herkunftsledger: ursprünglicher Warenbesitzer, Verwahrer, Waren-ID/Menge, ursprünglicher Vertrag, Übergabegrund, neuer Besitz/Verwahrung. Beute ist als gestohlen gekennzeichnet; keine legale Gratisware. Vor und nach Summe der physischen Mengen einschließlich Wrack/Berger/Lager/Miner. Keine Überladung: tatsächlicher Jägerfrachtraum entscheidet, andernfalls bleibt Ware beim ursprünglichen Träger bzw. physischem Wrack; ggf. später realer Bergungsfrachter.

Bei gebundenem F4-Eis: vor Übertragung feststellen, wem die Ware gemäß Originalvertrag gehört. Frachtführer ist nicht automatisch Wareneigentümer. Abwicklung vor Besitzwechsel: bereits bezahlter Lohn bleibt bezahlt, noch nicht verdiente Lohnreserve und Kauf-/Tariftreuhand nach verabschiedeter Vertragsregel an ursprüngliche Zahler, keine Liefervergütung ohne tatsächlich erbrachte Leistung, keine fingierte Lieferung, keine doppelte Rückzahlung. Teilfracht-Abnahme nur nach neuer expliziter Vertragsregel; erste Version vorzugsweise eindeutiger Abbruch statt stiller Teilzahlung. Erhaltene Fracht, Frachtverlust und rechtliche Eigentumsansprüche getrennt. Geladene Hülle nicht zerstören, solange Restfracht-/Treuhandabwicklung fehlt. Schadensbelege nicht löschen. Schaden allein ist kein Einkommen.

### 5c Schwarzmarkt und Basis

Ein echter Käufer mit Kasse, Lagerkapazität und begrenztem physischem Bedarf nimmt markierte Beute nach autorisiertem Transport/Andocken an. Angebot = reale aufnehmbare Menge und finanzierbarer Preis; ohne Käufer, Nachfrage oder Platz kein Verkauf. Zahlung Käufer -> Piratenkasse und reale Ware -> Käuferlager atomar, Herkunft bleibt auditierbar. Kein NPC, der nur zur Rettung der Piraten unendlich kauft. Preisabschlag und Hehler-Zulässigkeit erst separat als Regelparameter beschließen; zuerst nur Forschungsangebot. Nachgelagerte Verarbeitung/Verbrauch/Weiterverkauf muss aus echten bestehenden Bedarfen finanziert sein; Herkunft und mögliche legale Handelsbeschränkungen bleiben erhalten. Kein Verwandeln von abgeliefertem Eis in zusätzliches Bargeld durch Ledger-Korrektur.

Nadir-Dock bleibt vorerst expliziter, begrenzter Forschungsrückzugsort. Dauerhafte Basis separat: tatsächlicher Standort, vorhandene Station oder finanziert gebauter Außenposten, Eigentümer, Dockzugang und Lager, Produktions-/Konsumweg. Keine gratis neu erzeugte Station und kein kostenloses Dockprivileg als endgültige Spielregel. Gesetzlose Systeme erst bei echter Navigation/Autorität; Karte außerhalb aktiver Welt keine Nachfrage oder Piraten erzeugen.

### 5d Reparatur, Ersatz und Wachstum

Reparatur als realer Werkstattauftrag: bezahltes Material/Bauteile, reale Arbeitszeit, vorfinanzierte Treuhand; definierte Schadgegenrechnung, keine freie Hüllenregeneration. Verschleiß (Aktivlebensdauer) getrennt von Kampfschaden behandeln; Reparatur setzt Alter nicht ohne genehmigte Überholungsregel zurück. Beschränkte Herstellungskapazität, Konkurrenz mit ziviler Werft, keine bevorzugten Gratisangebote.

Ersatz/Expansion ausschließlich vorhandene kaufbare Hülle oder tatsächlich finanzierter Neubau aus J4b/J3/J2b/W4-Kette, mit realem Käufer-/Eigentumsrecht und Pilotkonto. Derzeit ist PIR-1 auf eine exakte Hülle beschränkt; Erweiterung braucht neue explizite Profilidentität und vollständige Herkunfts-/Mehrhüllenaudits. Kein Aufstocken auf Sollpopulation, kein automatisches Rettungskapital, keine Kopfgeldemission. Falls beide Seiten kein Kapital haben, sind keine Piraten oder Sicherheitsaufträge ein gültiges Ergebnis.

## 6. Dynamische Sicherheit, Progression

Feste Geografie (sicher/umkämpft/gesetzlos) von aktuellem, real beobachtetem Risiko trennen. Piratenaktivität und zeitgestempelte Sichtungen können zu-/abnehmen, aber eine feste Zonenregel ändert sich nicht ohne eigenes späteres Governance-Modell. Weder Piraten noch Security teleportieren; Einsatzprofil muss zum Standort passen. Mehr Handelsverkehr kann echte lukrative Ziele schaffen, echte Abwehr mindert Erfolg, Nachfrage nach Schutz kann steigen; kein automatischer Bonus. Sektorinfo zeigt Datenalter und Quelle. Kein Risikoprozentsatz ohne kalibrierte Testbasis.

PIR-6 später: Ruf aus abgeschlossenen vertragskonformen Schutzdiensten, nicht aus Farmen von Gratis-Kills. Ruf allein erzeugt kein Geld, keine Hülle und keine neue Autorität. Optionale öffentliche Sicherheitsaufträge nur bei freiwilliger, gedeckter Stations-/Fraktionskasse. Versicherung/Erpressung/Kopfgeld separat spezifizieren, nicht Bestandteil 4/5a.

## 7. Technische Abnahme und Forschungsplan

Alle neuen Felder versions-/profilgebunden, alte PRI-1- und Standard-Saves bytegleich; Aktivierung außerhalb JSON. Öffentliche Befehle im Core mit Eigentums-/Vertrags-/Geldprüfung. Transaktionen atomar: bei Ablehnung keiner der Geld-/Waren-/Schadensbelege verändert. Eindeutige IDs, stabile Reihenfolge, Quellen-/Zielkonten, keine negativen Kassen, keine gefälschte Leistung. Bilanz: Delta Weltgeld = autorisierte Emission minus Senke (hier 0); jede Warenbewegung gegen Inventar/Herkunft, jeder Hüllenkauf gegen physische Hülle und Historie. Kampf-/Vertragsereignisse pünktlich und einmalig; zwei gleiche Replays und Save/Load vor/nach jedem Übergang inklusive Teilschritt.

| Gate | Positivbelege und negative Gegenproben |
| --- | --- |
| 4a | Tatsächlich gekaufter Jäger folgt, erreicht Ziel, verteidigt, kehrt zurück; keine Schutzwirkung im Dock/Transit/außer Reichweite; fremder Jäger, Doppelbuchung, fehlende Reserve, Zielverlust, abgebrochene Ankunft, Stilllegung, Handübernahme, alter Save |
| 4b | Zwei tatsächliche Parteien signieren, Anbieter bezahlt Piloten, Kunde vergütet echte Leistung; kein Geld, fehlender Anbieter, falsche Identität, Teil-/Nullleistung, Storno, doppelter Abschluss, Mehrfachbindung, Insolvenz |
| 5a | Finanzierter Start, erschöpfte Kasse stoppt Einsätze, kein Gratisersatz, nachvollziehbare lohngebundene Aktivität |
| 5b | Reale Aufgabe/Bergung mit Fracht- und Vertragsaudit, volle/teilweise/keine Kapazität, bereits geleisteter Lohn, keine Doppelzahlung, kein erfundenes Wrack, keine Beute vor Ereignis |
| 5c | Reale Beute verkauft und physisch weiterverwendet; fehlender Käufer/Kasse/Lager, gestohlene Herkunft, keine Doppellieferung |
| 5d | Reale Reparatur und realer Ersatzkauf gegen Werftbestand; fehlendes Material/Lohn/Bestand, Käuferkonkurrenz, keine Gratishülle, korrektes Hüllenalter |

Langzeitmatrix: unverändertes Profil aus, PIR-Profil ohne Schutz, freiwillige Eigeneskorte, später bedarfsgerechter NPC-Schutz (identische Startbedingungen/Seeds und zivile Politik); zusätzlich kontrollierte Fälle ohne Absatz, mit Piratenverlust, ohne Nachschub und mit knappem Industriekapital. 13×90 und S02×365/730, dieselben Seeds, Replay je relevanter Variante. Für neue Profilstarts jeweilige explizite Anfangsbasis dokumentieren; nicht Hash-Gleichheit unterschiedlicher Regeln behaupten. Metriken: abgeschlossene/abgebrochene Frachten, physische Verluste, zivile Kassen und Lager, gebundene und ausgezahlte Mittel, tatsächliche Schutzminuten und Angriffe, Piratenbeute verkauft/gelagert, Piratenkasse/Pilotkasse, Reparatur/Ersatz, verbleibende einsatzfähige Hüllen und letzte echte Fracht. Keine Prosperität erzwingen. Vollständige Node22, Chromium/WebKit vier Touchgrößen, echte Geräte später; öffentliche Integration nach AGENTS-Gate.

## 8. Empfohlene Reihenfolge und Produktentscheidungen

4a -> 4b -> 5a -> 5b (zustands-/vertragssicherer Verlust) -> 5c -> 5d; 4c/d bei verfügbarer Routen-/Auftragskapazität, PIR-6 später. 4a kann nach PIR-3 auch parallel zu 5b-Spezifikation laufen, nicht gleichzeitig in denselben Kerncode schreiben. Für Implementierung zuerst einen echten F4-Fall, nicht sämtliche Sektoren und Märkte. Drei Freigabegruppen: (A) Auftrags-/Tarif-/Abbruchregeln der Fremdeskorte, (B) Beute-/Eigentums-/Vertragsverlust, (C) Basis-/Hehler-/Reparatur-/Ersatzregeln. Noch keine verbindlichen neuen Tarife, Reichweiten, Schadenswerte, Startkonten oder Preise. Nutzer entscheidet vor Produktaktivierung; Forschungsparameter separat nachweisen.

## 9. Koordination und zurückgestellter UX-Punkt

M4-UX #599 (Stand `ecf52491`): Root-Vereinfachung und kurzes Querformat, neues CI separat nachweisen. **Merker für die nächste UX-Integration:** ein einziges Hauptmenü (Fortsetzen / Neue Karriere / Spielstand laden / Weitere Spielmodi), direkter regulärer Start ohne zweiten Pflichtprolog; kein Überschreiben vorhandener Speicher, Forschungsprofile nur explizit, iPad quer ohne Scrollen im geschlossenen Menü. Bis Abstimmung mit PIR-Karrierecode kein paralleler Eingriff in diese Dateien. P0 #586 führt Roadmap-/Status-Konsolidierung; diesen Konzeptlink als [OPTION] aufnehmen, nicht als fertig oder beschlossen markieren. `main` enthält kein PIR-4/5-Feature, und kein neues Deployment wird ausgelöst.
