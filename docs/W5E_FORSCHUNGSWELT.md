# [DRAFT] W5e – gemeinsame spielbare Regel22-Forschungswelt mit getrenntem Save

**Basis:** Integrations-Draft [#179](https://github.com/tobiasfranziskus/Check/pull/179), Head `801766427ca0a036a32195430e67d2502fc5e963`, auf dem Jäger-/Kampf-Stack. **[MAIN]** `b4e604d6` bleibt Regel14/Schema8. Keine Änderung an alten Regel14-/17-/20-/21-Daten, kein Merge/Deployment.

## Zweck und Grenzen

`prototypes/w5-welt/welt.html` startet **eine einzige** echte `createW5DState(42)`-Sitzung im vorhandenen Core. Schiffskauf, Förderung in Aldera/Nadir, vorfinanzierte 50-Erz-Frachterfahrt und Rückfahrt, Raffinerie, Bauteile, Jägerbau, Piratenkauf, Jagd und echte Core-Kampfverluste teilen **denselben** Zustand, Tick, Hash, Warenbestand und Audit. Kein alternativer Kern und keine UI-eigene Buchungs- oder Preisformel. Das 2D-Canvas projiziert nur vorhandene Schiffe/Orte; Positionen sind schematisch. Schiffe bleiben bei ihrem tatsächlichen Eigentümer.

**Spielfolge:** Zwei bezahlte Miner kaufen und Erz/Silizium abbauen → nach 50 Minuten bezahlten Frachter in Aldera kaufen und voll vorfinanziert nach Nadir fahren lassen → vier echte Raffineriechargen → Bauteile → Jägerbau → NPC-Kauf. Für Kampf: realen ersten NPC-Jäger nach Piratenkauf aus deren endlicher Kasse in Piratenbesitz überführen, eine weitere physische Jägercharge finanzieren, einen zweiten NPC-Jäger kaufen und dessen Jagdbereitschaft bezahlen. Nur der Core kann Buchungen, Käufe und Ausfälle bestätigen. Neue ISK/Kopfgeld/XP gibt es in Regel22 **nicht**.

## Speicher- und Integritätsschutz

- **Eigene IndexedDB-Datenbank:** `aphros-void-forschungswelt-w5d`, Store `saves`, Slot `regel22-gemeinsame-welt-v1`. Die Hauptspiel-DB `aphros-void` wird nie geöffnet. Auch ältere Forschungs-Slots bleiben unverändert.
- Nach validierten Befehlen und Zeitschritten automatisches Speichern des autoritativen `api.save(state)`. Schreiben nur, wenn der gespeicherte Rohstand exakt dem zuletzt gelesenen entspricht (transaktionales Compare-and-swap); bei paralleler Tab-Änderung kein Überschreiben.
- Beim Öffnen nur `loadW5D` mit unveränderter Regel22-/Schema8-Prüfung und vollständigem Core-Audit. Fehlerhafte/fremde Stände sperren den Modus; Rohdaten können vor einem **explizit bestätigten** Neustart/Import als Datei gesichert werden.
- Bei Neustart/Import altes JSON vor der ersetzenden Speicherung zum Download anbieten. Ein abgewiesener Import verändert den laufenden Core nicht. Bei fehlendem IndexedDB wird ein **deutlich gekennzeichneter flüchtiger Modus** mit JSON-Export angeboten.
- Speicherort ist der lokale Browser/Origin, kein NAS-Backup. Vor dem späteren Deployment und einem Originwechsel JSON exportieren.

## Nicht Teil dieses PRs

Keine neuen Rohstoffe, keine neuen Produktionsrezepte/Preisregeln, kein `minted`, keine Piloten-ISK, keine Kopfgeldfreigabe, kein MK1-Laser und keine Änderungen an `index.html` oder Hauptspiel-UI. Der vorhandene Frachter-Originalprototyp aus #177 bleibt separat bestehen; das ist **kein** zweiter Simulationskern innerhalb der W5e-Sitzung. Kein automatischer Piraten-Respawn oder Gratisersatz. Der Nutzerkonzepttext `Aphros_Void_Produktionskette_Piloten_Module_Schiffbau.md` ist weiterhin **[OPTION]**, nicht verbindliche Regel.

**Technische Grenze:** `vorhandeneModule()` übernimmt den unveränderten Inline-Core weiterhin mit `Function()`; eine strikte NAS-CSP kann diesen Forschungsprototyp blockieren. Keine CSP-Lockerung im PR. Echte iPad-Safari-, Dateidialog- und NAS-Abnahme sowie ein Einstieg über den produktiven Hauptlink stehen aus.

## Qualitätsgate

`tests/w5e-gemeinsame-welt.test.mjs` prüft denselben Core und Tick für Miner/Frachter/Industrie/Jäger, unveränderte 100 Darstellungsprojektionen, reale W3-/W5b- und Piratenbuchungen, nichtmutierende Ablehnungen, Hash-/Save-Roundtrip und eine simulierte IndexedDB-Transaktion mit Schutz vor veraltetem Tab-Stand. Bestehende W5d-Tests prüfen 13 Seeds × 90 Tage mit Tagesaudits und Replay. Die tatsächliche neue CI-/Node-Testzahl ist erst nach der Ausführung einzutragen. Reale iPad-/NAS-Abnahme bleibt offen.

**Nächste getrennte wirtschaftliche Gates [OPTION]:** Erst Pilotenkonten und aus vorhandenem, reserviertem Konzern-/Auftragsbudget bezahlte Vergütung mit deterministischen Transferbelegen und unabhängigem Geld-Audit planen. Für ein echtes Kopfgeld ist vor jeder Einführung **der Finanzierer** (bestehende ISK-Quelle oder gesondert freizugebende Geldmodell-B-Emission), Betrag und globale Grenze erforderlich. Danach ein **nur aus Erz** herstellbarer MK1-Laser mit bezahlter Vorproduktion, Pilotenkauf, Eigentum/Einbau und messbarer Kampfwirkung. Produkt-/Rezept-, Preis- und Emissionsentscheidungen benötigen gesonderte Freigabe. Kein Silizium/MK2-Ausbau in diesem Auftrag.
