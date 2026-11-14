# J4d – Kontrollbojen-Patrouille mit real bezahltem Jäger (Regel204, Forschung)

**[DRAFT · 14.11.2026]** Ausgangspunkt: [J4c #344](https://github.com/tobiasfranziskus/Check/pull/344), dessen Regel204-Wirtschaft bereits die rechtmäßig hergestellte Jägerhülle, den 900-ISK-Kauf, 40-ISK-Flugreserve, 1 ISK bezahlte Pilotenarbeit je Minute und den originalen F6-Körper verbindet. **[MAIN]** bleibt Regel195, SHA `04124f2b`, und wird nicht geändert.

## Ziel, Umfang und Bedienung

J4c konnte bereits fliegen; J4d ergänzt eine vollständige, freiwillige Pilotenspielrunde: am Nadir-Dock mit einer tatsächlich **gekauften** `house`-Jäger-ID eine Patrouille beginnen, ordnungsgemäß abdocken, **Alpha (220000, -145000)** → **Beta (-260000, 90000)** → **Gamma (70000, 230000)** mit maximal 300 Punkten pro Sekunde innerhalb jeweils 24.000 Punkten um die geometrische Boje passieren, danach mit dem originalen `shipDock` physisch in Nadir zurückkehren. Reihenfolge, Ist-Tempo, zurückgelegte Ist-Strecke und verstrichene Weltsekunden erscheinen im Touch-HUD; der Button „nächstes Ziel“ erteilt lediglich den **vorhandenen, validierten** F6-Autopilotenbefehl. Manuelle Kurs-/Schubsteuerung bleibt jederzeit möglich.

Vorzeitiges Rückdocken gilt als Abbruch, ausgelassene Weltsekunden im Trainingsbeobachter als Unterbrechung. Die Übung startet **nur am echten Dock** und auf einem aus dem J4b-Kaufjournal identifizierten eigenen Regel204-Jäger. Das Audit des originalen Wirtschaftskerns validiert den geladenen Weltzustand. Der Beobachter verändert **keine** Originalgüter, Schiffe, Produktion, Löhne, Anteile, Geldkonten, F6-Physik oder Weltticks; er erzeugt keine zweite Flugwelt.

## Wirtschaft und Schutz

Die **einzigen wirtschaftlichen Kosten** bleiben die bereits implementierten J4c-F6-Dienstminuten (1 ISK/Minute aus zuvor reserviertem Spielergeld) und der existierende physische Anlageverschleiß. Die geometrischen Bojen sind weder NPCs noch Waren. **Keine** Beute, Kopfgelder, kostenlose Munition, Kämpfe, Reparatur, Spielerfahrung oder finanzielle Auszahlung. Parameter und Übung sind **[DRAFT/OPTION]**, keine beschlossene Produktregel.

Der flüchtige, reproduzierbare Patrouillenbeobachter wird bewusst **nicht** in den Weltspielstand serialisiert. Das Regel204-JSON enthält wie zuvor ausschließlich Originalweltzustand und tatsächlich gebuchte Wirtschaft; nach Reload ist die Trainingsleistung nicht vorhanden. Das ist ausdrücklich keine persistente Mission und keine künftige Quest-Auszahlung. Keine automatische Rule203→204-Migration, keine Alt- oder Produkt-Save-Änderung. Eigenes, zuvor aus der wirklichen J4b-Wirtschaft erzeugtes Test-JSON aus dem J4c-CI-Artefakt wie bisher importieren und nach dem Flug manuell wieder exportieren.

Statischer Einstieg: `prototypes/j4c/index.html` **nur auf dem J4d-Branch**, nicht auf Pages. Keine neue Abhängigkeit, kein Backend, keine Build-Pflicht. Keine Bearbeitung der Datei `prototypes/welt/welt-kern.js`, des F6-Integrators, der Regel195-Einzeldatei oder der J4b-Rezepte durch J4d.

## Prüfvertrag

- **Node22 `tests/j4d-patrouille.test.mjs`:** negative Eigentums-/Kaufjournal-/Profil-/Dock-Gates; drei echte Positions-/Geschwindigkeitsprüfungen in Reihenfolge; vorzeitiger Dock-Abbruch; Zeitlücken; unveränderliche Erfolge.
- **End-to-End Seed42:** bestehende reale J2a/J2b/J3/J4a/J4b-Produktion, 32 finanzierte Werftminuten und 900-ISK-Kauf, explizite Quellhash-Übernahme nach Regel204; Original-F6-Abdock-/Anflug-/Dockbefehle durch alle drei Bojen; minutengenaue K1-Audits, wirklich bezahlter Pilot, Anlagenwertabgang, Weltgeld 33.000, Mint/Burn 0 und Save/Load-Hash-Replay.
- **Touch-Regression:** `tests/j4c-cockpit-browser.cjs` in Chromium und WebKit, je vier Bildschirmgrößen, prüft die zusätzliche Patrouillen-Bedienfolge aus einem tatsächlich auditierten, ursprünglich bezahlten J4c-JSON zusätzlich zu Originalflug und Export.
- **Bestand:** bisherige J4c-/K1-/Regel195-Regression und statischer Einzeldatei-Check bleiben im Workflow. Bei der komplexen J4d-Änderung wurden **keine** 13 verschiedenen langfristigen wirtschaftlichen Szenarien nachgerechnet; J4d verändert kein Wirtschaftskreislaufmodell.

**Status bei PR-Anlage:** CI-Läufe auf J4d-Head erst nach Abschluss als bestanden bezeichnen. Echte iPad-Safari- und privater NAS-Test sind weiterhin offen. Kein Merge, kein Pages-Deployment, keine Beschlussfassung über Schadens-/Kampf-/Jägerbalancing.

**Nächster, separat freizugebender Produktpfad:** F8-E-Kampftraining nur nach Prüfung seiner Schnittstellen mit genau diesem tatsächlich bezahlten Rule204-Jäger verbinden. Echte Gegner, Schäden, Waffen-/Materialkosten, einmalige Beute und finanzierte Kopfgelder benötigen getrennte signierte Wirtschafts-/Eigentumsverträge, nicht lediglich einen zusätzlichen Canvas-Effekt.
