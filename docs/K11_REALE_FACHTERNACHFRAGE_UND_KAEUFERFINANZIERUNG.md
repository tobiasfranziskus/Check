# K11 – Echter Frachterbedarf, fehlendes Käuferbudget und unverkaufter Bestand

**[DRAFT / ANALYSE · 13.11.2026]** [PR #326](https://github.com/tobiasfranziskus/Check/pull/326), gestapelt auf K10 [#325](https://github.com/tobiasfranziskus/Check/pull/325). Isolierte Forschungsregel200, **keine** Änderungen am Kern, an produktivem Rule195, Dateien `index.html`/`aphros-void.html`, Preisen, Eigentumsrechten, Konten, W0–W6-Roadmap oder Nutzerspeicherständen.

## Prüfziel und echte Ausgangswelt

K10 hatte bis zu acht real finanzierte W1→W3→W4→W5-Industrieaufträge gezeigt, aber am Ende **zwei physisch vorhandene, unverkaufte W5-Frachter** hinterlassen. Die K11-Frage ist deshalb ausdrücklich **nicht** „Kann man noch mehr Schiffe bauen?“, sondern „Gibt es im bestehenden Markt eine reale, bezahlbare Leistung und einen benötigten, berechtigten Käufer für diese Schiffe?“.

`tools/k11-k10-endstand.mjs` rekonstruiert aus ursprünglichen Krisenseeds **42 und 7** die komplette K7/K8/K9/K10-Kette bis zur echten achten W3-Fracht, bezahlten 7. Lagerabnahme, 60 Arbeitsminuten Nadir→Aldera und zusätzlich gebauter achter Werfthülle. Kein Save wird künstlich verändert, keine gratis Startschiffe, kein direkter Buchungszugriff. Save/Load, Weltgeld, Produkt-/Eigentumsledger und Core-Audits werden auf diesem Endzustand verifiziert. Etwaige gleichnamige alte Frachter werden durch das vorhandene, fungible W5-Lagerbuch gezählt, nicht individuellen Fertigungschargen zugeordnet.

K11 schaltet anschließend für **720 Spielminuten je Seed und Politik** die vorhandene Originalautomatik ein: (A) neue Stilllegung aus, Ersatzkäufe und Eisfracht eingeschaltet, (B) echte Stilllegung ein, Ersatzkäufe und Eisfracht eingeschaltet. Es wird **kein** neues Angebot, Warenkauf, Firmenkapital oder künstlicher Frachterverlust erzeugt. Jeder Tick prüft die getrennten W3-/Eis-Frachtbücher auf Doppelbelegung, regelmäßig den unabhängigen Gesamtaudit. Manipulationsversuche mit ungedeckten/unberechtigten Käufen müssen atomar abgewiesen werden.

## [TEST] Wirklich ausgeführte K11-Läufe

[Erster K11-Job, K1-Workflow #43398418683](https://github.com/tobiasfranziskus/Check/actions/runs/43398418683) auf Codehead `aad819a0`: **2/2 Seedtests bestanden**, die vier Politikläufe wurden tatsächlich ausgeführt. [K11-Ergänzungsprüfung #43398667338](https://github.com/tobiasfranziskus/Check/actions/runs/43398667338), Codehead `3438f897`: **2/2 Seeds, vier Varianten erfolgreich**, unabhängig berechnete volle W5n-Käufer-/Frachtkosten aus den Originalregeln. Zu diesem Bericht wurde auf einem folgenden Codehead der explizite Vergleich der Käufer-/Crewdefizite als Regressionstest ergänzt; **der aktuelle Head ist erst nach eigener erfolgreicher CI abgenommen**.

| K11-Gegenversuch | Seed 42 | Seed 7 |
| --- | ---: | ---: |
| Zeitpunkt nach K10-Achterzyklus | Tick 24446 | Tick 24446 |
| Frachter im Speditionseigentum | 18 | 18 |
| Davon nach Original-Verschleißbuchwert einsatzfähig | 10 | 10 |
| Davon frei und einsatzbereit in Aldera | 10 | 10 |
| Physischer W5-Lagerbestand, unverkauft | 2 | 2 |
| Speditionskasse | **46 ISK** | **46 ISK** |
| Für Eisflugcrew erforderliche echte Vorfinanzierung | **120 ISK** | **120 ISK** |
| Fehlende Fluglohnreserve | **74 ISK** | **74 ISK** |
| Originaler Eis-/Frachtkäufer `fonds_transport` | **0 ISK** | **0 ISK** |
| Käuferbudget für 50 Eis und zwei Flüge | **490 ISK** | **490 ISK** |
| Fehlende Käuferdeckung | **490 ISK** | **490 ISK** |
| Weltgeld / Mint / Burn | 33.000 / 0 / 0 ISK | 33.000 / 0 / 0 ISK |

**Betriebsvariante A – ohne Stilllegung:** In Aldera entstehen aus realer Förderarbeit innerhalb 720 Minuten **52 Eis** (Anfang: 2). Die Original-`pilotIceFreightQuote` lehnt die nun mengenmäßig mögliche 50er-Fracht ab: **„Spedition kann Flugarbeit nicht vorfinanzieren“**; unabhängig ist das eigentliche Käuferkonto **mit 0 von 490 ISK völlig leer**. Ergebnis in Seed42 und Seed7: **0 W3-Aufträge, 0 Eisfrachten, 0 neue W5-Käufe**, zwei unverkaufte Hüllen bleiben.

**Betriebsvariante B – Original-Stilllegung aktiviert:** Die bestehenden Miner-/Transportbedingungen lassen in dieser Beobachtungszeit nur **2 Eis** in Aldera stehen. Damit ist zusätzlich schon die erforderliche 50er-Warencharge nicht vorhanden. In Seeds42/7 ebenfalls **0 echte Frachtaufträge, 0 Frachterkäufe, 2 unverkaufte Hüllen**, bei weiterhin 10 nicht vollständig verschlissenen Speditionsfrachtern. Die legitime Ersatzautomatik löst **keine** zusätzliche Bestellung aus. In allen vier Teilversuchen (zwei Seeds × zwei Betriebsvarianten) laufen 720 Minuten und 45-Minuten-Hashreplays mit 33.000 ISK, Mint/Burn0 und korrektem Waren-, Eigentums- und Treuhandaudit.

Die beobachtete Lohn-/Geldknappheit ergibt sich nicht aus der Zahl verfügbarer Frachter. Die 490 ISK Kauf-/Transportetat müssen vom **richtigen ursprünglichen Käufer** stammen und die 120 ISK Crewtreuhand vom **richtigen Speditionseigentümer**. Eine freie Weltgeldsumme von 33.000 ISK oder 18 Flottenhüllen ist **keine Finanzierungserlaubnis**. Freiwillige Eigentümerdividenden sind bisher nur Auszahlung an den Eigentümer; im gegebenen K1-Kern existiert kein freigegebener Befehl für eine umgekehrte Kapitalisierung oder einen erfundenen Warenabsatz.

## Bedeutung für die Roadmap und Optionen

**[ANALYSE / NEGATIVNACHWEIS]** Der aktuelle Forschungsstand leidet hier **nicht an fehlenden Frachterhüllen**, sondern zugleich an **fehlender echter Nachfrage-/Abnehmerfinanzierung (490 ISK)** und **fehlender Crewliquidität der Spedition (74 ISK)**. Eine weitere automatische W5-Produktion oder künstlicher Kauf erzeugt zusätzliche Lagerware ohne rechtmäßigen Absatz. Auch bloß zusätzliche 74 ISK Speditionsmittel würden **den leeren Käuferetat nicht heilen**.

**[BESCHLOSSEN / UNVERÄNDERT]** Unbegrenzte Spieler-Sparfreiheit, Insolvenzen, keine Gratisware, kein freies Minting, nur finanzierte reale Dienstleistungen, Original-W0–W6-Reihenfolge.

**[OPTION / FOLGENDE FORSCHUNG]** Zuerst die echten Geldströme des bisherigen Eis-/Wasser-Endmarktes auf Rückfinanzierung des vorhandenen Käufers prüfen: Wie kann ein bereits vorhandener solventer Auftraggeber durch Warenverkäufe, reale Verträge oder rechtmäßig finanzierte Eigentümerentscheidungen zusätzliche Transporte nachfragen? Ohne produktive Entscheidung **keine** Treuhandzulassung ohne Deckung, keine Reserveausweitung, keine kostenlose Nachfrage. Bei positivem, belegtem Mechanismus auf derselben Krise ein gezieltes Gegenbeispiel mit mindestens einer tatsächlich gekauften 50er-Eisfracht, Warenlieferung und vollständigen Löhnen prüfen – anschließend 13×90, 365/730 und reale Browser-/iPad-/NAS-Abnahme.

Die K11-Forschung ist **keine** automatische W6-Nachhaltigkeitsfreigabe; die zwei Seeddurchläufe über je 720 Minuten sind kein statistischer 90-Tage-Produktionsnachweis. **Kein Merge und kein Deployment.**
