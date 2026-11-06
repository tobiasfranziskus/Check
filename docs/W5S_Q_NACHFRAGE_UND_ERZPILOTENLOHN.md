# W5s-q – reale Erzpilotenlöhne, Nachfrageprovenienz und vierte Fracht

**[DRAFT/ANALYSE · 06.11.2026]** Gestapelt auf W5s-p [#219](https://github.com/tobiasfranziskus/Check/pull/219), ausschließlich opt-in im bisherigen Regel32/Schema8-Stressprofil. Der inzwischen freigegebene [MAIN] `5a56d9d7` enthält die unabhängige aktuelle Spieltestveröffentlichung mit Versionsarchiv; **keine Änderung daran, kein Merge/Deployment**. Produktregel 14 und bestehende Spielstände bleiben unverändert.

## 1. Die vierte Erzlieferung: technisch möglich ist nicht automatisch wirtschaftlich sinnvoll

Die umfassende Nachprüfung an Seed42/7 über 365 Tage zeigt trotz des vollständig finanzierten dritten 50-Erztransportes an Tag104 einen gestoppten Folgekreislauf.

| Physische/finanzielle Situation nach 365 R32-Spieltagen | Nachweis |
|---|---:|
| Erz bei der Aldera-Station | **75 Erz**, Ankaufskasse **0 ISK** |
| Bereits vom Großhändler gehörende Erz in Aldera | **50 Erz**, als Teil des Stationsbestands (nicht doppelt zählen) |
| Unverkaufte, tatsächlich abgebaute NPC-Miner-Erzladung | **100 Erz** |
| Erz im Nadir-Werftlager | **40 Erz** |
| Eigene Speditionskasse | **240 ISK** (ohne W5s-q-Lohnweitergabe), später kein Frachter |
| Vollständige Folgefinanzierung für Frachter, Überführung und nächste Lohnreserve | **930 ISK** |
| Haushaltskasse für Wasser | **5 ISK**, keine neue reale Zahlungsfähigkeit |
| Noch nie ausgeführter vierter automatischer 50er-Erztransport | **0** |

An Tag104 ist die **vierte W3-Lieferung technisch tatsächlich finanzierbar**: Es liegen 50 vom Großhändler physisch gekaufte Erz am Markt, ein bezahlter Eigentümerfrachter, 740 ISK unabhängiges Nadir-Käuferbudget und 120 ISK vorfinanzierbarer Fluglohn vor. Ein reiner, *isoliert auf Save-Kopie* ausgelöster ORIGINAL-`shipFreight`-Befehl belegt die bezahlte vierte Lieferung binnen 600 simulierten Minuten mit gültigem Geld-/Warenaudit. **Dies allein ist kein vierter Werftauftrag!** Die bestehende `w5s.erzPlan`-Automatik fordert nur Erz, wenn eine reale, tatsächlich anstehende Fertigung/Verarbeitung es begründet; in der ursprünglichen Welt besteht an Tag104 `werkPlan.stage='kein_ersatzbedarf'`.

**Entscheidung [ANALYSE]:** Keine eigennützige Spekulationsbestellung und keine Erz-Durchsatzgrenze nur für eine schöne vierte Frachtstatistik. Der neue ausschließlich lesende `w5sFinanzStatus.chain` weist getrennt tatsächliche Erz-Eigentumsmengen, Käuferkassen, Lagerorte, Haushaltsgeld, Transportersatzfehlbetrag, **ursprünglich validierte manuelle W3-Finanzierbarkeit** und den zusätzlichen Nachweis eines *echten* automatisierbaren Produktionsbedarfs aus. Keine Buchung, keine automatischen Staatsrettungen.

## 2. Pilot-Gegenprobe: wirkliche W3-Pilotenarbeit erhält Haushaltseinkommen

In der bisherigen W5o-Forschungswelt wurden W5n-Eisflugpiloten bereits aus dem Transport-Arbeitsfonds an die privaten W5n-Haushalte ausgezahlt. Die zusätzlich **real an den selben Fonds bezahlten W3-Erzflug-Minuten** blieben dagegen im Fonds, obwohl die Arbeit wirklich verrichtet und vollständig von der Spedition vorfinanziert worden war. Dadurch kann trotz Geldmenge 33.000 ISK privates Nachfragegeld erlahmen.

Mit dem ausschließlich optionalen `rules.w5s.autoOreWageHousehold=true` dürfen **höchstens die tatsächlich zuvor als `s.w3.arbeitsKosten` an `r.w3.arbeitsFonds` gezahlten ISK** ebenfalls als *erworbenes Pilotenlohneinkommen* auf das Haushaltskonto `w5n_kunden` gelangen. Die bereits früher gezahlten W5o-Frachtlöhne bleiben unangetastet. Jede Auszahlung wird exakt einmal in `s.w5s.orePilotWages` und `orePilotPays` mit dem originalen Minuten-Tick gespeichert. Negative, doppelte, vorgezogene, nicht durch W3-Arbeit gedeckte oder nicht mehr auf dem ursprünglichen Fonds vorhandene Beträge sind ausgeschlossen.

Es erfolgen unveränderte originale Kassenbuchungen auf dem Transport-Arbeitsfonds und bei den Haushalten (`m_core_handel.buche`), kein Fonds-Zuschuss, keine Geldemission, kein künstlicher Kaufauftrag und keine neue Ware. Alle Originalaudits für W3, W5c-Sicherheitsfonds, W5n, W5o, W5q und das gesamthafte W5s-Geldbuch überprüfen jetzt die Leistung und den echten Doppelkontenbeleg. Das normale Forschungsflag OFF erhält denselben Alt-Hash und die Produktwelt ist vollständig unverändert.

| Forschungsprofil mit 2-Tage-R32-Vorlauf · Seed42/7 | W5s-p bisher | W5s-q W3-Arbeitslohn |
|---|---:|---:|
| Vollständig bezahlte W3-Erzfahrten nach 365 Tagen | **3** | **3** |
| W3-Erzpiloten-Arbeitslöhne tatsächlich an Haushalte weiterbezahlt | 0 | **360 ISK** |
| Bezahlte W5n-Eisfrachten nach 365 Tagen | 116 | **118** |
| Wirklich bezahlter Wasserverbrauch nach 365 Tagen | **5.738** | **5.823** |
| Neue ISK | 0 | **0** |
| Automatisch fingierte vierte Erzbestellung | keine | **keine** |

Nach 90 Tagen gibt es mit/ohne Lohnweitergabe 88 Eisfahrten und 4.316 bezahlte Wasser, aber mit dem neuen Flag sind **240 ISK reale W3-Pilotenlöhne** vollständig an Haushalte gebucht. Nach Tag104 und dem dritten Transport werden insgesamt **360 ISK** einmalig für drei reale W3-Zweitflüge bezahlt. Das zusätzliche Haushaltseinkommen schafft +85 bezahlte Wasser über 365 Tage, **keinen** unendlichen Kreislauf.

[Geprüfter Forschungs-CI-Lauf #42237099856](https://github.com/tobiasfranziskus/Check/actions/runs/42237099856): 6 Testgruppen grün, 0 Fehlversuche; tägliche Originalwelt- und unabhängige Kassen-/Waren-Audits, 13 Seeds ×90 Tage, Seed42/7 ×365 Tage, Seed-Replay, Save/Load, manipulationssichere Lohnbuch-/Haushaltskonten, Bestandsreferenzhashes ohne Flag. Zusätzlich werden die W3-Manuell-Gegenprobe und das rein lesende Nachfrage-Protokoll separat geprüft. Die abschließende volle CI des PR-Heads bleibt separat nachzuweisen.

## 3. Grenzen, keine Produktfreigabe

**[NICHT ERREICHT]** Auch die zusätzlichen, real ausgezahlten 360 ISK schaffen keinen dauerhaft laufenden Markt und keine automatisch gerechtfertigte vierte Werftbestellung. Am Tag365 liegen weiter echtes Erz, aber keine finanzierte Anschlussproduktion und keine freie Ersatzflotte vor. Keine Auszahlungen aus rein hypothetischen Aufträgen; kein künstliches W3-Vorauslager auf Rechnung anderer Firmen.

Die R32-Lebensdauern 15/30 Tage, die 700-/930-ISK-Konzernbeteiligungen aus W5s-o/p und die neue **Haushaltszuordnung von W3-Pilotenlöhnen** sind **isolierte Forschungsannahmen**, keine vom Nutzer freigegebenen Produktregeln. Die Produktion kann nur mit einer tatsächlich finanzierten Kette aus echtem Abnehmer, Schiffbauer, Flotte, tatsächlicher Ware und Haushalts-/Industrienachfrage neu starten. Neue Optionsideen benötigen gesonderte Wirtschaftlichkeitsbelege, nicht einfach eine Finanzspritze für `transport` oder `npc3`.

**[OFFEN]** Historische gesamte JavaScript-CI auf dem endgültigen q-PR, reale iPad-Safari- und NAS-Abnahme, Nachfolgefirma mit eigenem Schiff und belastbarer zusätzlicher Endnachfrage. `main` und dort veröffentlichte GitHub Pages bleiben unangetastet.
