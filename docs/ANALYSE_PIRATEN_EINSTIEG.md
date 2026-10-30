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

## Auswertung

**Noch keine Resultate behauptet.** Die nach vollständiger CI erzeugten Tabellen und JSON-Belege liegen im CI-Artefakt `piraten-auswertung-gesamt`. Solange Vergleichsjobs fehlen, bleiben Maßnahmen **[OPTION]** und der PR **[DRAFT]**, ohne Merge und Deployment.
