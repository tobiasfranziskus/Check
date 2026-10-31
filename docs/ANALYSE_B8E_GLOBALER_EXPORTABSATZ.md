# B8e – Realer Außenabsatz statt pauschaler Verbrauchsgeldschöpfung

**[ANALYSE/DRAFT] · 31.10.2026**, exakt auf `main 517728a958326e86751f09cd74d0c077edad9921` (v0.12.5 / Regel 14 / Schema 8). **Einzig verbindliche Roadmap:** [docs/ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md).

## Ausgangsbefund

[B8a #61](https://github.com/tobiasfranziskus/Check/pull/61) hat gezeigt: 20 ISK/Stunde allein für zivilen Istverbrauch erhöhen selbst in gesunder passiver Welt die Geldmenge um 43.200 ISK je90d und werden in der Spielerkrise ab Tag14 nicht mehr ausgelöst. [B8b–B8d #62–#64](https://github.com/tobiasfranziskus/Check/pull/64) haben den Spieler-Cash-Entzug, physisch verfügbare Rohstoffe, echte Käufercash-Barrieren und einen **einmalig aus echten Meridian-ISK finanzierten, aber nicht selbsttragenden** NPC3-Materialhandelszyklus nachgewiesen. Es ist weiterhin **keine** Modell-B-Emissionsregel beschlossen.

## Eng isolierte Hypothese

**Einzige getestete Modell-B-Option [ANALYSE]:** Bei einer vom unveränderten Core **tatsächlich ausgeführten** und im Original-Warenledger verbuchten **physischen Außenausfuhr** (`m_core_stunde.aussenhandel`, `d<0`) kann ein externer Käufer einen nach Warengrundwert proportionalen Exportpreis **als neue ISK an die exportierende Station** zahlen. Die Welt darf höchstens **20 ISK pro Stunde** empfangen und **2 ISK je wirklich ausgeführter Wareneinheit**; dies sind ausdrücklich **ungeprüfte Versuchswerte**, keine zu übernehmenden Produktpreise. Direkte, nicht durch physischen Export gedeckte Geldschöpfung ist untersagt.

**Globaler statt individueller Schalter:** Emission nur, wenn **die Summe aller Stationskassen weniger als ein Fünftel der ursprünglichen Weltgeldmenge** beträgt **und** der weltweit tatsächlich gedeckte zivile Stundenbedarf weniger als 50 % des Bedarfs an Nahrung/Medizin ist. Diese Aggregate sind **einheitliche Weltindikatoren**; die Regel liest keine Firma, Spieler- oder Stationsinsolvenz als Trigger. Export-Empfänger sind ausschließlich die ursprünglichen tatsächlichen Außenexportstationen – **keine bedürftigkeitsabhängig ausgewählte Station**, kein direkter Geldtransfer aus dem Spieler, kein NPC-Privatschiff.

**Wichtige Einschränkung:** Der vorhandene Original-Außenhandel erzeugt neben Warenexporten auch Original-*Importe* ohne Kassenbuchung. Der Beobachter kann die ursprüngliche Herkunft einer exportierten Wareneinheit **nicht** nachweisen, sondern nur die echten Core-Bestandsminderungen; Re-Export vorher importierter Ware und die Wahl eines tatsächlichen Herkunftsnachweises bleiben reale Exploit-Risiken. Positive CI allein berechtigt **nicht** zur Integration. Ebenso existiert noch keine Markteintritts-KI für neue Frachter oder Käufernachfrage-Garantie.

## Reproduzierbarer Vergleich

Vier Original-Seed42-**90-Tage**-Welten, jeweils mit unabhängigen deterministischen Doppel-Replays und stündlichen Geld-/Warenaudits sowie Save/Load und 67 Standardtests: historische aktive B1-`handel-flotte`-Spielerbefehle mit/ohne Exportbudget und passive Originalwelt mit/ohne Exportbudget. Die unveränderte aktive Original-90d-Endreferenz muss **`784047684dfe5c56`** bleiben. Probe mit Verbrauchsstunden, Exportmengen, echter Netto-ISK-Schöpfung, Stations-/Spielercash, Mangelstunden, Preis- und Produktionsfolge. Keine Änderung von `index.html`, Regeln, Save/Load, Goldenreferenzen, Spielermöglichkeiten oder Produktcode.

**Eine theoretische globale Bedarfsschwelle ist kein ökonomischer Heilbeweis.** Das Qualitätsgate verlangt gleichzeitig nachweislich neu auftretenden Außenabsatz, physisch erhaltene Rohstoffe, tragfähige reale Händler-/Käufer-Folgegeschäfte, keine unnötige Emission in gesunder Welt und selbständige wirtschaftliche Erholung *ohne* individuelle Konkursrettung. Die vier Simulationen sind lediglich eine erste, klar begrenzte Gegenprobe und ersetzen 13 Seeds ×90 Tage plus vier historische 365-Tage-Spielerkrisen nicht.

## [TEST] Tatsächlich ausgeführte B8e-Gegenproben

**[GitHub CI #41229663432](https://github.com/tobiasfranziskus/Check/actions/runs/41229663432)** vollständig erfolgreich (**1/1 Job**, **67/67 Standardtests**, 0 Fehler/Skips). Exakt vier Seed42-90d-Welten, Originalregel14-Quelltext SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`, jeweils doppelt unabhängig abgespielt: insgesamt **17.280 stündliche Geld-/Warenaudits und deterministische Replayhashes**, **32 Save/Load-Roundtrips**. Der aktive originale historische Endhash `784047684dfe5c56` blieb identisch; die passive Originalkontrolle `adf155a018b94094` war ebenfalls identisch mit der passiven B8e-Gegenprobe.

| 90 Tage / Seed 42 | Aktive Spielerkrise original | Aktive Spielerkrise B8e | Passive Welt original | Passive Welt B8e |
| --- | ---: | ---: | ---: | ---: |
| Tatsächliche externe Warenexporte (Einheiten) | **1.578** | **1.578** | **15.482** | **15.482** |
| Neu emittierte B8e-ISK | 0 | **578** | 0 | **0** |
| Export-Stunden mit B8e-Auszahlung | — | **63** | — | 0 |
| Ziviler Nahrungsverbrauch (Einheiten) | 2.541 | 2.552 | 36.602 | **36.602** |
| Ziviler Medizinverbrauch (Einheiten) | 644 | **644** | 12.960 | **12.960** |
| Spieler-ISK am Tag90 | 39.762 | **39.762** | 2.000 | **2.000** |
| Gesamtkassen-ISK am Tag90 | 50.000 | **50.578** | 50.000 | **50.000** |
| Weltweit kumulierte Mangellagen Nahrungs-/Medizinstunden | 24.376 | **24.371** | 56 | **56** |

**[RECHNUNGSPRÜFUNG]** In der aktiven B8e-Welt insgesamt 2.015 Stunden mit erfüllten beiden *globalen* Mangelschwellen. Davon **1.952 Stunden ohne irgendeine wirkliche externe Warenausfuhr**; daher nur 63 Auszahlungsstunden und 578 zusätzliche ISK. Der einzige reale Empfänger ist die Exportstation **Meridian** (`st_meridian: +578 ISK`), kein notleidender ausgewählter Akteur. Exporte nach Warentyp: Material 429, Erz 324, Silizium 303, Eis 219, Nahrung 140, Kristall 78, Bauteile 53, Medikamente 32 Einheiten im Original; die Exportvergütung änderte diese physischen Summen nicht. Nach Tag14 bei beiden aktiven Welten **0 Nahrung und 0 Medizin** tatsächlich konsumiert, keine Wiederaufnahme bis Tag90. Die Variante steigert den gesamten Nahrungsverbrauch gegenüber der ursprünglichen Spielerkrise um **nur 11 Einheiten**, Medizin **um null**.

**[POSITIVE TEILBEOBACHTUNG]** In einer gesund versorgten passiven Welt mit 15.482 realen Exporten sperrt die rein *aggregierte* Weltindikator-Grenze alle 2.160 Stunden: **0 unnötige Neuemission**, unveränderter Weltendhash. Das begrenzt B8as ungewollte gesunde Welt-Geldschöpfung unter den getesteten Bedingungen, ist **aber kein unabhängiger Beweis**, dass die willkürlichen Schwellen in allen Seeds oder Spielerwelten sinnvoll wären.

**[NEGATIVES PRODUKTGATE]** Die Exportleistung selbst bricht mit dem Markt ein (**1.578 statt 15.482 Einheiten**). Exportgebundene Geldschöpfung an Meridian wird nicht hinreichend zu real zahlungsunfähigen Zivilstationen und potenziellen neuen Händlern weitertransportiert. Die echte monetäre Brücke **außenwirtschaftlicher Ertrag → reale Stationskäuferkasse → vollständig bezahlter Handel → wiederholbare Produktion** ist nicht geschlossen. Daher **keine Integration** von B8e. Vor weiterer Geldversuchsreihe die Exportherkunft (ursprünglicher Außenimport / heimische Produktion / Re-Export), tatsächliche Käufererträge und Wiederanlaufoptionen auditieren; die fehlende Verknüpfung darf nicht durch eine Insolvenz-spezifische Auszahlung kaschiert werden.

**[SEPARAT OFFEN]** Es wurden **keine 13 Seeds ×90 Tage**, keine vier historischen 365d-Spielerbelastungen, keine Spielstandversion-/Migrationsänderung (nicht erforderlich für Analysedateien), keine echte iPad-Safari- oder NAS-Abnahme durchgeführt. Das Modell enthält bewusst unfreigegebene Parameter: 20 ISK/h, 2 ISK je ausgeführter Einheit, 20 % Stations-Cash-Schwelle und 50 % Weltverbrauchs-Schwelle. Die Ausfuhrmenge stammt ausschließlich aus dem bestehenden `aussenhandel`-Abgang; **eine unabhängige tatsächliche heimische Warenherkunft wird nicht nachgewiesen**. Auch wenn das Welt-Audit Erhaltung bestätigt, wäre bei automatischen Import-/Re-Export-Schleifen ein finanzieller Exploit möglich.

**Fazit:** Externe Leistungsbezahlung ist spielerisch als Modell-B-Option plausibel, aber **dieser konkrete rein exportgebundene Mechanismus heilt den nachgewiesenen Marktstillstand nicht**. Nicht freigeben. Nächster enger Schritt **B8f (Vorschlag)**: ohne neuen Produktcode die Re-Export-Herkunft, Stations-Erzeugungs-/Exportketten sowie *wirklich finanzierte* wiederkehrende Käuferverträge und offene Kaufkrafttransferpfade identifizieren; neue Geldquelle erst nach belastbarer kausaler Verbindung zu Folgeumsätzen bewerten.

**Freigabe:** Analyse/Draft, nicht integrieren oder deployen, keine iPad-/NAS-Abnahme.
