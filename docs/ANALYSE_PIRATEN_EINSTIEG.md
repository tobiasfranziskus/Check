# Aphros Void – Piratenbedrohung in der wirtschaftlichen Aufbauphase

**[ANALYSE/DRAFT] 30.10.2026.** Produktbasis `main e0c27a3762d9d6e75d8bcc30ed47621eff2f152b`, `v0.12.4`, **Regel 13**, **Schema 8**. Dieser PR enthält **ausschließlich Testwerkzeuge, einen eigenen Workflow und Dokumentation**, **keine Änderung** an `index.html`, Produktregeln, Roadmap, Projektstatus, Goldenwerten, bestehenden Spielständen oder Piratenschiffen. Keine neue Geldquelle, kein Piratenspawn und keine Änderung an Trefferpunkten, Waffenschaden, Kampfformeln, Stationen oder Sicherheitszonen. Alle experimentellen Regeln sind **nur** Änderungen der Überfall-Zielauswahl auf einem jeweils separat geladenen Testkern.

## Anlass und Hypothese

Die früheren B1-Tests [#36](https://github.com/tobiasfranziskus/Check/pull/36), [#37](https://github.com/tobiasfranziskus/Check/pull/37) belegen vier real finanzierte NPC3-Frachterstarts um Tag 90, deren erste Frachter anschließend durch Piraten verloren gingen. B2–B4 zeigten: Weniger unnötige Leerfahrten, mehr Frachtumsatz oder pauschal hinzugefügte Sollplätze können die Wirtschaft trotzdem verschlechtern. **Zu prüfen** ist nun, ob Piratenangriffe in der wirtschaftlichen Aufbauphase so abgestuft werden können, dass bezahlte Handelszyklen entstehen, ohne die Piraterie dauerhaft zu deaktivieren oder den eigentlichen Liquiditäts-/Werft-/Minerersatzengpass zu verdecken.

## Vier getrennte, noch nicht beschlossene Regeln

| Modus | Versuchsregel für überfallfähige Zivilschiffe |
| --- | --- |
| `control` | Byte-identischer Produktkern: Keine zusätzliche Zielbeschränkung |
| `grace20` | Pro Schiff 20 Spieltage seit Indienststellung keine Überfall-Zielberechtigung. Anfangsflotte beginnt bei Tick 0; bei B1-Start am Tag 90 bereits vorhandene Schiffe erhalten **keine** nachträgliche Schonfrist. Neue B1-Frachter erhalten sie ab ihrer tatsächlichen `neuesSchiff`-Aktivierung. Der testweise gespeicherte `erstelltTick` wird nur im Analyse-Core gesetzt und muss Save/Load überleben. |
| `capital4000` | NPC oder Spieler ist angreifbar, wenn seine **tatsächliche aktuelle Konzernkasse** mindestens 4.000 ISK enthält. Ein Kauf kann diesen Wert sofort senken und damit Schutz wiederherstellen; diese ausdrücklich problematische Abruptheit ist Teil des Tests. Keine erfundene Reserveberechnung oder zusätzliche Währung. |
| `activity` | Ein Schiff wird angreifbar, wenn es **mindestens drei registrierte Verkäufe** abgeschlossen hat oder derzeit Fracht mit Einzelwarengesamtwert von mindestens **500 ISK** transportiert (aktueller Core-Preis des jeweiligen Systems). Die Werte stammen aus bereits vorhandenen Statistiken, Ladungen und Preisfunktionen, nicht aus einem zusätzlichen Handelssimulator. |

**Begrenzungen:** Alle Varianten erhalten die vorhandene `zivil()`-Zielart, sicheren Systeme, Stationsverteidigung, Angriffschance, Angriffs-Zufallsreihenfolge, Kampf-Engine, Eskorten, Piratenersatz, Kopfgeld, Waren- und Geldbuchung. Die Patronenlogik ist kein generelles Verbot von Patrouillenkämpfen. Die Schonfrist schützt vor Überfällen, nicht vor jedem möglichen Kampf. Das Kapitalgate kann taktisches Kontoleeren belohnen; der Aktivitätsfilter kann bestimmte leere oder erfolglose Händler unter Umständen dauerhaft schützen. Ein Schiff mit wertvoller Fracht ist bei Aktivität sofort exponiert; eine Neuanschaffung ist dort nicht automatisch geschützt. Alle drei Schwellen sind **nur Laborwerte**, kein Balancingbeschluss.

## Reproduzierbarkeit und Datenqualität

1. **Normale Standardwelt:** dieselben 13 festgelegten Seeds `7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159`. Jeweils vier Modi × 90 Tage: **52 deterministische Fortsetzungen**, **4.680 tägliche Hashes**, **112.320 stündliche Vergleichs-/Auditzeitpunkte**. Jeder Seed startet für alle Modi mit **demselben kanonischen Regel-13-Spielstand**. Die Kontrolle wird gegen unveränderte historische Version-12-Kennwerte für Mangel, Kassen und Geldschöpfung/-vernichtung geprüft. Stundenweise unabhängige Einzelkassen-/Geld- und Waren-/Laderaumaudits für beide Replays, kanonischer Stundenhash und Save/Load an Tag 3, 30 und 90.
2. **Spielerbelastung:** vier gepinnte Tag-90-B1-Fälle mit tatsächlichem, validiertem Siliziumverkauf/Frachterkauf/-aktivierung und Handelsauftrag: Miner/42, Handelsflotte/42, Station/1234, Jagd/98765. **16 × 275-Tage-Fortsetzungen** bis zum absoluten Tag 365, **4.400 tägliche Hashes**, **105.600 stündliche Replay-/Auditzeitpunkte**, 12 Save/Load-Roundtrips pro Versuch. Die historischen v12-Ausgangssaves werden **zunächst mit ihrem Original-Core und Originalhash verifiziert**, erst dann über die vorhandene **Regelmigration 12→13** geladen. Anschließend ist der Anfangshash **in allen vier Modi identisch**.
3. **Messgrößen:** reale Käufe und Verkäufe aller NPC3-Frachter, Verlustzeit des ersten finanzierten Frachters, Anzahl von Überfallzielen, NPC-Miner-/Frachterverluste, NPC3-Frachtbetriebskosten fällig/bezahlt, ungedeckter gesamter Betrieb, NPC-/Stationskassen, Mangel, Bauteile/Silizium in Aldera, alle Handelsvorgänge sowie Geldschöpfung/-vernichtung. Änderungen in wirtschaftlichen Kenngrößen sind nicht automatisch ein Erfolg; ein überlebender, aber dauerhaft leerer Frachter ist **kein** tragfähiger Wiederaufbau.
4. **Testwerkzeuge:** `tools/piraten-einstieg-common.mjs`, `tools/piraten-einstieg-90.mjs`, `tools/piraten-einstieg-b1.mjs`, `tools/piraten-einstieg-summary.mjs`, `tools/piraten-einstieg-smoke.test.mjs`. Eigener `.github/workflows/piraten-einstieg.yml` führt dazu die vorhandenen Node-22-Standardtests aus und veröffentlicht nur Prüfartefakte. Keine Laufzeitabhängigkeiten.

## Entscheidungsmaßstab

**Technische Gate:** Alle B1-Befehle gültig, alle stündlichen unabhängigen Audits, Hash-Replays, Spielstandfortsetzungen und vollständige Node-Standardtests tatsächlich erfolgreich; keine unbewiesenen „grün“-Aussagen.

**Ökonomische Gate:** Nicht bloß geringere Verluste oder höhere Netto-Kasse, sondern **wirklich bezahlte und durchgeführte Lieferungen**, fortgesetzte Rohstoff-/Werftversorgung, finanziell tragbare Betriebskosten und wiederholbarer Flottenersatz im Vergleich zum identischen Kontrollfall. Offene Kapital-/Minerrollen-/Märkte-Probleme müssen getrennt sichtbar bleiben. Eine neue Piratenregel erfordert anschließend **eigene Regelversion, Save-Schutz und echte iPad-/NAS-Abnahme**; diese Analyse vergibt keine Freigabe.

## Tatsächlich ausgeführte CI und Ergebnisse

**[CI, 30.10.2026]** [GitHub Actions #41117052272](https://github.com/tobiasfranziskus/Check/actions/runs/41117052272): **19/19 Jobs erfolgreich** (Rekonstruktion, 13 Standardseed-Jobs, vier B1-Fälle, Gesamtabnahme); **8/8 isolierte Piraten-Funktionstests**, **57/57 bestehende Standardtests**, keine Fehler/Skips. Insgesamt **68 simulierte Varianten** (52 Standardwelt-Fortsetzungen und 16 B1-Fortsetzungen), **9.080 Tageshashes** und **217.920 stündliche Vergleichs- und Auditzeitpunkte**. Identische Anfangshashes innerhalb eines Falls, unabhängige instrumentierte/uninstrumentierte deterministische Replays, unabhängige Kassen-/Geld- und Waren-/Fracht-Audits und Save/Load-Prüfungen. Die unveränderte Standardkontrolle erreicht u. a. exakt 791 historische v12/v13-Mangelstunden. Die alten B1-Saves wurden zunächst im ursprünglichen Regel-12-Core gegen ihre bekannten Start-Hashes geprüft und dann über die bestehende Migration nach Regel 13 geladen.

Die vorangegangene erste CI [#41116891824](https://github.com/tobiasfranziskus/Check/actions/runs/41116891824) scheiterte in B1-Jobs an einem **Testbeobachterfehler**: Die vor Tag 90 verbrauchten Waren mussten für die unabhängige Verbrauchsgründe-Rechnung als Eingangssaldo vorgetragen werden. Der Nachtrag wurde ausschließlich im Analysebeobachter vorgenommen, keine Produktregel oder historische Spielzustände geändert. Erst die zweite vollständig erfolgreiche CI gilt als Abnahme.

### Normale Wirtschaft – 13 Seeds × 90 Tage

| Versuchsregel | Mangelstunden gesamt | Schiffsverluste gesamt | Handelsvorgänge gesamt | NPC-Frachter am Ende (Summe) | NPC3-Kasse Median (ISK) | Silizium Aldera Median | Bauteile Aldera Median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Kontrolle | 791 | 4.622 | 1.242.258 | 65 | 6.000 | 40 | 39 |
| 20 Tage Schonfrist | **732** | **415** | 1.220.870 | 65 | 6.000 | 45 | 37 |
| Mindestkasse 4.000 ISK | 791 | 4.571 | 1.243.696 | 65 | 6.000 | 30 | 34 |
| Drei Verkäufe / 500-ISK-Frachtwert | 792 | 4.767 | 1.244.879 | 65 | 6.000 | 43 | 31 |

**[BESTÄTIGT]** Die Schonfrist senkt Schiffsverluste in den Standardfällen um etwa **91 %** und Mangelstunden um etwa **7 %**, gleichzeitig sinkt die Handelszahl um etwa 1,7 %. Die Summe lebender NPC-Frachter am Tag 90 verbessert sich damit in diesen Beispielen **nicht** (alle 65 über 13 Welten). Eine niedrige Verlustzahl allein bedeutet keine robuste Wiederaufnahme. Der aktivitätsbezogene und kapitalbezogene Filter verbessern die reguläre Versorgung mit diesen Grenzwerten nicht nachweislich.

### Krisenfälle – vier B1-Spielerfortsetzungen von Tag 90 bis Tag 365

| Versuchsregel | Erster real gekaufter Frachter am Tag 365 lebend | **Warenkäufe/-verkäufe durch** NPC3-Frachter | NPC3-Frachterverluste | NPC3-Minerverluste | Überfall-Zielauswahl NPC3 | Ungedeckter NPC3-Betrieb (ISK) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Kontrolle | 0/4 | 100 / 106 | 4 | 19 | 29 | 870 |
| **20 Tage Schonfrist** | **2/4** | 27.519 / 27.530 | 2 | 8 | 13 | **2.004.546** |
| Kapital 4.000 ISK | 4/4 | 27.613 / 27.625 | 0 | 0 | 0 | **3.109.096** |
| Handelsaktivität/Frachtwert | 0/4 | 100 / 106 | 4 | 18 | 25 | 870 |

Die Warenkäufe und -verkäufe sind **wirklich vollzogene Geschäftsereignisse der NPC3-Frachter**, *keine* Käufe neuer Schiffshüllen, keine Nettogewinne und kein Beweis nachhaltig finanzierten Handels. Der ungedeckte Betrieb ist die Differenz zwischen **fälligen** und **tatsächlich bezahlten** regulären Betriebskosten sämtlicher NPC3-Schiffe über die jeweilige Fortsetzung; er entspricht nicht negativem, erfundenem Bankguthaben und verletzt keine Geldbilanz.

**[BESTÄTIGT]** Die 20-Tage-Regel lässt zwei ursprüngliche Frachter bis Tag 365 überleben; in zwei Fällen werden sie nach ungefähr 20–22 Tagen trotzdem zerstört. Die Überlebenden können viele Geschäfte abwickeln, doch die NPC3-Kassen aller vier Schonfristfälle liegen am Tag 365 bei **0 ISK**, und der ungedeckte Betrieb beträgt zusammen über **2 Mio. ISK**. Die Kapitalvariante verhindert in diesen vier Fällen alle Überfälle auf NPC3, indem niedrige Eigentümerkassen Schutz auslösen; sie lässt alle vier Schiffe überleben, aber **über 3,1 Mio. ISK ungedeckten Betrieb** entstehen. Eine solche dynamische Immunität ist spielerisch ausnutzbar und wirtschaftlich kontraproduktiv. Die Aktivitätsvariante hält die vier ursprünglichen Frachterverluste mit ihren derzeitigen Schwellen nicht auf.

**[BESTÄTIGT] Der spätere Mangel bleibt:** Bei allen vier B1-Fällen, unabhängig von der Variante, sind am Tag 365 sowohl Silizium als auch Bauteile im Lager von **Aldera bei 0**. Die längeren Flottenleben stellen die entscheidende Rohstoff-/Werftversorgung nicht wieder her. Das bestätigt Piraten als **Verstärker**, nicht alleinige Grundursache des Zusammenbruchs. Der gesamte Geld-/Warenfluss bleibt bei allen erfolgreich ausgeführten Varianten konsistent, das Wirtschaftsmodell aber teils insolvent.

### Schlussfolgerung und freigabefähige Folgefragen

**Keine der drei getesteten Schutzvarianten wird derzeit zur Produktintegration empfohlen.** Die einfache Kapitalgrenze ist besonders ungeeignet, solange gesunkene Liquidität zum dauerhaften Angriffsverbot führt. Eine zunächst beschränkte **Schonfrist für neu gekaufte, tatsächlich finanzierte Einzelschiffe** bleibt als *spätere Option* interessant – aber nur zusammen mit korrekter Sollrolle, kostenpflichtigen Fahrten, zahlungsfähigem Handelszyklus, realem Ersatz und nachvollziehbarem Risiko nach dem Ende der Frist.

**Projektvorschlag [OPTION, keine Beschlussänderung]:** Mit B5b zuerst die dauerhafte Miner-Sollrolle von temporären Transportbefehlen trennen; danach separat den gesamten finanzierten Handels-/Rückflusszyklus unter fortbestehendem Piratenrisiko absichern. Einen weiter verfeinerten Piraten-Schwellenwert erst testen, wenn er nicht mehr einen defizitären Dauerbetrieb bloß vor Verlusten schützt. Die verbindliche Reihenfolge bleibt ausschließlich in `docs/ROADMAP.md` auf `main`; diese Analyse ändert sie nicht.

**Freigabe:** vollständig reproduzierbarer **Analysetest bestanden**, aber **keine produktive Piratenregel beschlossen**. Kein Merge, keine Regel-/Save-Migration, kein Deployment und keine reale iPad-/NAS-Abnahme.

