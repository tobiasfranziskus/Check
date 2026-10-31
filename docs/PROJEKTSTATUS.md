# Aphros Void – Projektstatus

## [ANALYSE/DRAFT] H1-C3 Zehn-Tage-Geldfluss NPC1/2 vollständig reconciled · 31.10.2026

**[PR #58](https://github.com/tobiasfranziskus/Check/pull/58) · [CI #41190568798](https://github.com/tobiasfranziskus/Check/actions/runs/41190568798) · [Detailbericht](ANALYSE_H1_C3_ZAHLUNGSFLUSS_10T.md) · [TEST] erfolgreich:** bestehender Regel-14-H1-C2-365-Tage-Vergleich unverändert reproduziert, zusätzlich **genau zwei** gepinnte **10-Tage-Ereignistraces** Seed42/Spielerfall `handel-flotte` ab Tick1 unter Regel14. Beide Tag-10-Hashes (`84f1a88d2701ff2a` Kontrolle, `7f1795b5bde050ba` H1) **identisch** zum älteren H1-C2-CI-Artefakt. Neue 480 Stunden-Geld-/Warenaudits/Replays, 20 Tageshashes, 16 Save/Load-Roundtrips; die vollständigen erneuten 365-Tage-C2-Läufe ebenfalls erfolgreich. **1/1 CI-Job und 67/67 Node-Standardtests** grün. Original-CI-Artefakt `h1-c2-budget480-seed42` ID **`13038980092`** mit unveränderten Gesamtverläufen und zwei neuen Cash-Trace-JSONs. **Kein Produktcode, kein Regel-, Schema-, Geld- oder Save-Wechsel.**

**Exakte NPC1/2-Geldkonten** von jeweils 3.000 ISK Anfangskasse auf jeweils 0: Warenmarge nach Gebühren **221.058 ISK Kontrolle / 245.554 ISK H1**; bezahlte NPC1/2-Arbeit **147.186 / 160.106 ISK**, echte Hüllen **8.580 / 8.580 ISK**, Überschussabführung an mehrere Fonds **71.292 / 82.868 ISK**; **0** zusätzliche Fonds-/Werftvorschüsse an diese beiden Eigentümer, **0** NPC1/2-Kopfgelder. Für wirklich **fällige** Arbeit verbleiben **12.401 / 49.413 ISK unbezahlt**; bereits Tick **60** fünf NPC1/2-Frachter zusammen **1.106 ISK** fällig, nur **269 ISK** bezahlt. Kombiniert **16 reale Frachterverluste** in beiden Varianten, 11 neu bezahlte Hüllen je Variante; **196/197** konkrete Teilverkäufe mit Restladung und zu kleiner Stationskasse für eine weitere Einheit. **[ANALYSE]** Der aktuelle 6.000-ISK-Abführungspfad ist nicht an bevorstehende Arbeit/Ersatzkapital gekoppelt; die zeitliche Cash-Deckung ist aber schon **vor** späteren Abführungen unzureichend. Das beweist **nicht**, dass eine ersatzlose Abschaffung des NPC-Cashdeckels hilft (historisch #23 negativ). **[OPTION]** Nächstes streng getrenntes Gate: eine aus real erwirtschaftetem Cash vor der Abschöpfung gedeckte Betriebs-/Hüllenreserve als einzelner Kandidat, bei unveränderter Fondsversorgung und echter fälliger Arbeit prüfen; keine Insolvenzrettung oder neue Emission. Bis dahin **keine Umsetzung**. `main 517728a9` unverändert, iPad-/NAS-Abnahme/Deployment nicht ausgeführt.

## [ANALYSE/DRAFT] H1-C2 mit 480 ISK/Tag im kausalen Seed-42-Einzeltest wirtschaftlich abgelehnt · 31.10.2026

**[PR #58](https://github.com/tobiasfranziskus/Check/pull/58) · [CI #41189930640](https://github.com/tobiasfranziskus/Check/actions/runs/41189930640) · [Vollbefund](ANALYSE_H1_C2_BUDGET480.md)**: 1/1 GitHub-Job, **67/67 Node-Standardtests** grün. Zwei **365-Tage**-Läufe mit Seed 42 und denselben **neun alten B1-Spielerbefehlen ab Tick 1**, beide unter **Regel 14 ab Spielstart** (nicht derselbe Regel-12-Tag-90-Altstart). Kontrolle Original-Core vs. exakt eine **analyseisolierte** H1-Endkunden-Zahlung von max. **20 ISK/Stunde / 480 ISK/Tag global**, nur bei realem Nahrung-/Medikamentenverbrauch. Insgesamt 17.520 stündliche Geld-/Warenaudits und Hash-/Replay-Vergleiche, 730 Tageshashes, 36 Save/Load-Roundtrips. Reales neues H1-`minted`: **4.700 ISK**, ausschließlich Tage 1–10; **ab Tag 11 keinerlei ziviler Verbrauch**. Warenverkäufe NPC1/2 **1.225→1.546**, Mangelstunden **155.459→155.145** (−314; ca. −0,2 %), **ungedeckte NPC1/2-Frachter- und NPC3-Minerarbeit aber 12.401→49.413 ISK**, Endtag beide NPC1/2 ohne Frachter, Aldera 0 Silizium/0 Bauteile. Spielerkasse **39.762→46.157 ISK**; Cash-Summe Welt **50.000→54.700 ISK** korrekt bilanziert. **[NEGATIV]** H1 mit diesem Budget ist **keine ökonomisch tragfähige Produktregel**. Kein Nachschießen, Individualretten, Budgethochdrehen oder zweite Variante. **[OPTION als nächster Schritt]** engster read-only Cash-/Vollkosten-/Abschöpfungstrace für die ersten zehn Tage aus vorhandener CI-Evidenz, ehe Routen-/Tarifmechaniken oder externer Geldabsatz festgelegt werden. `index.html`, `main 517728a9`, Regel, Schema, Goldenwerte und Spielstand unverändert. Kein Merge, keine echte Safari-/NAS-Abnahme oder Deployment.

## [ARCHIV/ANALYSE] Wirtschaftsdiagnose und GitHub-Bereinigung · 31.10.2026

**Produktive Basis vor Dokumentations-Merge:** `main d454d0661dee48a7bfdb843d05096982d799e51f`, **v0.12.5 / Regel 14 / Schema 8**. Alle bisherigen Wirtschafts- und Eskortenanalysen enthalten **keine** neue produktive Preis-, Routen-, Piraten-, Jäger-, Geld-, Kredit-, Werft- oder Spielstandsregel. **B5a #42 und B5b #46 sind integriert**; die nachfolgenden B6-Tests wurden nur auf isolierten Analysebranches durchgeführt. Echte iPad-/NAS-Abnahme steht aus.

**[TATSÄCHLICH AUSGEFÜHRTE BEREINIGUNG]** Am 31.10.2026 wurden die **17** bislang offenen Forschungs-PRs **#32–#34, #36–#41, #44–#45, #48 und #50–#54** nach nachvollziehbarer Archivierung als `[ARCHIV/ANALYSE]` geschlossen, **kein Merge**. Der Dokumentations-PR #49 führt die verbindliche [Roadmap](ROADMAP.md), dieses Statusdokument und das neue [Handelszyklus-Evidenzarchiv](ANALYSEARCHIV_HANDELSZYKLUS_2026-10-31.md) zusammen. Hauptbelege sind die verifizierten GitHub-CI-Runs #41178667836 (B6c), #41179275120 (B6d) und **#41180157480 (B6e; letzter Head)** mit jeweils **19/19 erfolgreichen Jobs**, **67/67 Standardtests**; Wirtschaftsläufe/Hashes jeweils im Archiv und zugehörigen PR.

**[WIRTSCHAFTLICH NICHT FREIGEGEBEN]** Die aus Meridian bezahlten 1.380 ISK aus B6e ermöglichten **49 echte NPC-Trader-Warenverkäufe**, aber **0 ISK Tilgung**, am Endtag **0 Händlerfrachter**, Aldera weiterhin **0 Silizium/0 Bauteile** und die vier Krisen **4.450→8.903 ISK** ungedeckte Arbeit. Einzelkredit, nachträgliches Frachthonorar, pauschaler Piratenschutz, R3-Lagerdeckel und Cashblockade P1 **nicht integrieren**. Die Endverbrauchernachfrage und langfristige NPC-Kaufkraft bei Spieler-Sparfreiheit sind eine **offene System-/Geldregimeentscheidung**, keine beschlossene Emissionsregel. Als nächste **[OPTION]** B6f ausschließlich den realen 49-Lieferungen-Zahlungspfad auditieren; keine neue Mechanik vor Ursachenklärung. Die **[BESCHLOSSENEN]** Ziele günstigerer leichter Jäger, verlässlicher risikogerechter Eskorten und langfristig global mehr Jäger als Frachter bleiben nachgeordnet und noch nicht implementiert.

**[BRANCHBEREINIGUNG OFFEN]** PR-Schließung hat Git-Branches **nicht** entfernt. Die eingesetzte GitHub-Verbindung bietet keine Löschung von Branch-Refs; insbesondere historischen B1-Start `6855d76` und Testcode `cec7f93` für weitere Reproduktionen nicht ohne Ersatz vernichten. Eventuelle physische Löschung der verbleibenden Analyse-/Feature-Branches gesondert verifizieren; nicht als erledigt deklarieren. Kein Deployment.

## [ANALYSE/DRAFT] B6c/B6d und Jägereskorte-Konzept – 31.10.2026

**[MAIN] weiter v0.12.5, Regel 14, Schema 8, Commit `d454d0661dee48a7bfdb843d05096982d799e51f`.** Keine Änderung am Produkt durch die folgenden Tests oder die Designentscheidung; der technische Status-Block unten bleibt historisch überprüfbar. Die einzige verbindliche Produktpriorität steht in [ROADMAP.md](ROADMAP.md).

- **[TEST] B6c [#52](https://github.com/tobiasfranziskus/Check/pull/52)** auf abschließendem HEAD `eb6c9e3`, [CI #41178667836](https://github.com/tobiasfranziskus/Check/actions/runs/41178667836): 19/19 Jobs und 67/67 Node-Tests erfolgreich; 17 Läufe, 2.270 Tageshashes, 54.480 unabhängige Stunden-Audits/Replays, 220 Save/Load-Roundtrips. In allen vier echten B1-Spielerkrisen bereits an Tag 90 und weiterhin an Tag 365 **null NPC1/2-Frachter**. Trotz 1–2 bereits produzierter Hüllen an der Werft reichen die separaten NPC-Kassen für eine erste vollständig bezahlte profitable Handelsfahrt nicht. Die statischen Kapitaluntergrenzen sind keine ausgeführten Lieferungen.
- **[TEST] B6d-C0 [#53](https://github.com/tobiasfranziskus/Check/pull/53)** auf abschließendem HEAD `d40001f`, [CI #41179275120](https://github.com/tobiasfranziskus/Check/actions/runs/41179275120): 19/19 Jobs, 67/67 Standardtests, 34 gepaarte Simulationen, 4.540 Tageshashes, 108.960 Stunden-Audits/Replays, 440 Save/Load-Roundtrips erfolgreich. Isoliertes Stationshonorar **erst nach echtem NPC-Frachterverkauf**: Standardwelt Mangelstunden 791→733, Frachterverkäufe 310.058→307.856, Aldera-Bauteil-Endsumme 505→399, zusätzlich 24.893.684 ISK über den Lauf transferiert (keine Geldschöpfung). **Vier Krisen unverändert: null NPC1/2-Warenverkäufe und null Frachter**, daher kein Wiederanlauf. C0 **nicht integrieren**.
- **[TEST] B6e-P0 [#54](https://github.com/tobiasfranziskus/Check/pull/54)**, [CI #41179991691](https://github.com/tobiasfranziskus/Check/actions/runs/41179991691): 19/19 Jobs, 67/67 Node-Tests; 34 gepaarte Läufe, 4.540 Tageshashes, 108.960 stündliche unabhängige Geld-/Warenaudits/Replays, 440 Save/Load-Roundtrips. Ein realer Einmalkredit von `st_meridian` an NPC1 über **1.380 ISK** im Fall `handel-flotte` finanzierte **49 tatsächliche Handelsfrachter-Warenverkäufe**. Dennoch **keine Tilgung**, 1.380 ISK Forderung offen; Krisen-Unterdeckung **4.450→8.903 ISK** und am Tag 365 weiterhin **null NPC1/2-Frachter und null Aldera-Silizium/Bauteile**. In drei anderen Krisen scheiterte Kreditwürdigkeit einer einzelnen neutralen Stationskasse; alle Standardseed-Kontrollen unverändert. **Nicht integrieren**; ein tatsächlich beobachteter Ersttransport beweist noch keinen finanzierbaren weiteren Zyklus. `b6eContracts` nur Analyse-/Save-Feld, **keine Produktmigration**.
- **[MAIN-Code geprüft / Designbeschluss offen für Integration]** Leichter Jäger momentan 900 ISK Basispreis / 8 Bauteile + 4 Material (32 Min), Frachter 750 ISK / 8 Bauteile (36 Min), Stundenarbeit Jäger 50 ISK, Frachter 250 ISK. Spieler kann Jäger auf eigene Schiffe eskortieren lassen; die automatische NPC-Handelsflotten-Eskorte und zuverlässig synchronisierte Begleitung fehlen. Gegenversuch [#45](https://github.com/tobiasfranziskus/Check/pull/45) ohne Piratenüberfälle verhindert zwar Verluste, aber **nicht** den Versorgungskollaps. **[BESCHLOSSEN]** Ziel: günstiger produzierbare **leichte** Jäger, risikogerechte NPC-Eskorten und langfristig global mehr Jäger als Frachter **ohne feste Konzernquote**. **[OPTION]** konkrete Preise, Rezepte, Eskortenalgorithmen und Zeitpunkt erst wirtschaftlich testen und getrennt freigeben.
- **[NÄCHSTE ANALYSE] B6f:** die 49 tatsächlichen Warenlieferungen aus B6e einschließlich Kosten-, Geld-, Bestands-, Waren- und Hüllenverlustverlauf gezielt nachvollziehen. Keine automatische Krediterneuerung oder Jägerpreis-/Escortenänderung als Ersatz für die wirtschaftliche Ursache.

**Freigabestatus:** #49 enthält Dokumentationspflege zu bereits durchgeführten Analysen und das beschlossene Eskortenziel. #50–#54 bleiben ungemergte Analysen. Weder neue Rezeptwerte, Escort-AI, B6e-Regeln noch Echtgeld-/iPad-/NAS-Tests sind auf `main` freigegeben oder ausgeführt.

## [MAIN] Integrierte Version

**Stand 30. Oktober 2026 · GitHub `main`: v0.12.5, Squash-Merge [`24337dcd4d5d9f00d0ac004afba6f4119a5b83ac`](https://github.com/tobiasfranziskus/Check/commit/24337dcd4d5d9f00d0ac004afba6f4119a5b83ac) ([PR #46](https://github.com/tobiasfranziskus/Check/pull/46)).** Integriert sind u. a. #17–#22, #30 (bedarfsorientierte NPC-Handelsrouten), #35 (Wirtschaftsarchitektur), **#42 (B5a)** und **#46 (B5b)**. Die verbindliche Produktpriorität liegt weiterhin ausschließlich in [ROADMAP.md](ROADMAP.md).

**Produkttechnik:** statische `index.html`, HTML/CSS/Vanilla JS, kein Backend/Build. **Spielstandschema 8, Regelversion 14**; Migrationen **11→12→13→14**, **12→13→14** und **13→14** erhalten Kassen, Waren, Flüge, offene Arbeitsminuten und bisherige Aufträge; B5b rekonstruiert dauerhafte Sollplatz-Zuordnungen, unauflösbare Altfälle werden ausdrücklich abgelehnt. Die ausdrücklich als inkompatibel genehmigten Regelstände 8–10 bleiben klar abgewiesen, zukünftige Regeln ebenfalls. Kein stilles Überschreiben oder Löschen von Browser-Spielständen.

**[MAIN] B5a – gehaltene Reisen werden real bezahlt:** `m_core_stunde.betriebskosten` berücksichtigt tatsächlich angefallene Arbeitsminuten auch bei Auftrag `halten`; untätiges Warten bleibt kostenlos. Normaler Flug kostet keinen Treibstoff. Der gezielt validierte identische Zweietappen-Test bestätigt **0 ISK unter Regel 12 → 241 ISK unter Regel 13**, mit realer Zahlung an den bestehenden Fonds statt Geldschöpfung. Produktionskern wurde außer Kostenprüfung, Regelversions-/Migrationsmarkierung und Versionsanzeige nicht verändert.

**[TEST]** [Abschließende PR-CI #41113681392](https://github.com/tobiasfranziskus/Check/actions/runs/41113681392) auf dem tatsächlich gemergten PR-Head: **57/57 Standardtests**, 13 Seeds × 90 Tage unter Regel 13, **1.170 Tageshashes**, stündliche unabhängige Geld-/Warenaudits, deterministische Replays und Save/Load an Tag 3/30/90, alle 13 Wirtschaftskennzahlen je Seed gegenüber unveränderter v12-Fixture identisch (darunter **791 Mangelstunden insgesamt**, 310.058 Frachterverkäufe). Historische v12-13×90-Goldenprüfung am festgehaltenen ursprünglichen Commit `906b797`, v11-Referenz und Geografie-Dreiervergleich bestanden. Der historische v10-Job unter Regel 13 führte nur seine dokumentierte Überspringen-Verzweigung aus; der gestapelte Sicherheitsgeografie-Job wurde bedingt übersprungen. **Weder echte iPad-Safari-Abnahme noch NAS-Deployment** ist durch diese Prüfungen belegt.

**[ANALYSE/DRAFT] B1–B4 bleiben ungemergt:** [#36](https://github.com/tobiasfranziskus/Check/pull/36)–[#41](https://github.com/tobiasfranziskus/Check/pull/41) und [#32](https://github.com/tobiasfranziskus/Check/pull/32)–[#34](https://github.com/tobiasfranziskus/Check/pull/34) liefern reproduzierte wirtschaftliche Gegenbeispiele, aber keine freigegebenen Produktmechaniken. [B3 #40](https://github.com/tobiasfranziskus/Check/pull/40) belegte tatsächlich bezahlte, aber verlorene Ersatzfrachter samt verdrängtem Minerersatz und ungedecktem Betrieb; [B4 #41](https://github.com/tobiasfranziskus/Check/pull/41) belegte die vermischte Verwendung von `ware` als momentaner Auftrag und Sollrollenidentität. **B5b [MAIN]** hat diese Identitäten durch die stabile Sollplatzbindung in PR #46 getrennt; die B4-Befunde bleiben historische Diagnose. Über Kapitalgeber, Emissionsregel, Insolvenz, pauschale Spielerabgaben oder kostenlosen Wiederaufbau wurde keine neue Produktregel freigegeben.

## [MAIN] B5b – Eindeutige Sollplatzbindung (30.10.2026)

**[MAIN] B5b wurde mit ausdrücklicher Freigabe über [PR #46](https://github.com/tobiasfranziskus/Check/pull/46) als Squash-Commit [`24337dc`](https://github.com/tobiasfranziskus/Check/commit/24337dcd4d5d9f00d0ac004afba6f4119a5b83ac) integriert** (`v0.12.5`, Regel 14, Schema 8). Die Sollplatz-ID eines Schiffes bleibt auch bei vorübergehenden Transport-, Warte- oder Förderaufträgen erhalten; ein tatsächlich zerstörtes Schiff lässt genau diesen Platz frei, dessen Ersatz weiterhin real bezahlt werden muss. Alt-Spielstände erhalten eine deterministische Rekonstruktion bei eindeutigen Identitäten, eine sichtbare Ablehnung bei Mehrdeutigkeit. Weder Rückflug, neue NPC-Geldquelle noch Piraten-Schonfrist werden implementiert. **Prüfbericht:** [TEST_B5B_SOLLFLOTTENZUORDNUNG.md](TEST_B5B_SOLLFLOTTENZUORDNUNG.md).

**[TEST/CI]** Auf dem freigegebenen PR-Head: [Regressions-CI #41123471215](https://github.com/tobiasfranziskus/Check/actions/runs/41123471215) **7/7 ausführbare Jobs erfolgreich** (ein historischer Stack-Job bedingt übersprungen), 67/67 Node-Tests; [B5b-Langzeit-CI #41123471285](https://github.com/tobiasfranziskus/Check/actions/runs/41123471285) **6/6 Jobs erfolgreich**. Zehn neue Kernfälle plus **57 bestehende Tests** bestanden. Historische v11-/v12-/v13-Referenzen, Geld-/Warenaudits, 13 Seeds × 90 Tage für Regel 14 (**1.170 Tageshashes**, Replays, Save/Load, unverändert **791 Mangelstunden** und **310.058 NPC-Frachter-Warenverkäufe**) im [Regressionslauf #41122913434](https://github.com/tobiasfranziskus/Check/actions/runs/41122913434) ausgeführt; der vollständige freigegebene CI-Lauf ist abgeschlossen und erfolgreich. **[CI #41122913386 – 6/6 Jobs erfolgreich](https://github.com/tobiasfranziskus/Check/actions/runs/41122913386):** Vier echte B1-Spielerfälle × Regel 13/14 × 275 Tage; 2.200 Tageshashes, vollständige Audits/Replays und 96 Save/Load-Roundtrips. Regel 14 verhindert in allen vier Fällen die Phantom-Sollrolle; real bezahlte NPC3-Minerersatzkäufe **93→87**, ungedeckte Betriebskosten **870→433 ISK**, NPC3-Frachter-Warenverkäufe jedoch **106→80**; die ursprünglich gekauften Frachter überleben weiter **0/4**. Kein iPad-/NAS-Deployment oder reale Safari-Abnahme. B5b ist gemergt; Kostenunterdeckung, Versorgungsengpass und Handels-Wiederanlauf bleiben offen.

## [ANALYSE/DRAFT] Langzeitdiagnose und Architekturprüfung (30.10.2026)

**Historische Prüfbasis der folgenden #32–#34-Auswertung (nicht aktueller main-Stand):**

GitHub `main` bei dieser Prüfung: [`ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f`](https://github.com/tobiasfranziskus/Check/commit/ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f), Produkt weiterhin v0.12.3. Zum damaligen Analysezeitpunkt offen, **inzwischen geschlossen und nicht gemergt**: [#32](https://github.com/tobiasfranziskus/Check/pull/32) (`8cd8713`, Basis `main`), [#33](https://github.com/tobiasfranziskus/Check/pull/33) (`4c55d4b`, Basis #32), [#34](https://github.com/tobiasfranziskus/Check/pull/34) (`6855d76`, Basis #33).

- **Übernommene bestehende Befunde:** #32 reproduziert aktive Spieler-Kollapsfälle trotz korrekter Geld-/Warenbilanz; #33 verhindert vier Startkollapse mit Spieler-Rückfluss, begrenzt dabei Sparen/Investition und heilt spätes Wiederanlaufen nicht dauerhaft. #34 erreicht in 16 Eingriffsfortsetzungen keinen Wiederanlauf beider Handelsflotten: zwei einzelne bezahlte Ersatzfrachter haben danach null Handelskapital, keinen Warenhandel und gehen erneut verloren. Aldera fehlen Bauteile/Silizium trotz vorhandener entfernter Bestände. Diese Langzeitversuche wurden im Architekturauftrag **nicht neu ausgeführt**.
- **Jetzt geprüfte CI-Metadaten:** Regression und jeweilige Analyse erfolgreich an allen drei genannten Heads. Analyse-Läufe: [#32](https://github.com/tobiasfranziskus/Check/actions/runs/41067401643), [#33](https://github.com/tobiasfranziskus/Check/actions/runs/41076425687), [#34](https://github.com/tobiasfranziskus/Check/actions/runs/41083152586). Technischer Erfolg ist keine wirtschaftliche Freigabe.
- **[ANALYSE/OPTION]** Der [Architekturbericht](ARCHITEKTUR_WIRTSCHAFT_V12.md) dokumentiert Ursachen, vorhandene Geld-/Warenpfade, drei Ansätze, mögliche Insolvenz-/Wiederaufbauabläufe und offene Entscheidungen. Die Empfehlung ist unimplementiert. Beschlossene Produktziele stehen ausschließlich in der [Roadmap](ROADMAP.md).
- **Neu lokal geprüft im docs-only-Auftrag:** Node.js 22.23.4, Pflichtbefehl erfolgreich (sechs Dateisuiten); zusätzlich einzeln sichtbare **48/48 bestehende Tests**, 0 Fehler/Skip/Abbrüche. Keine neue Jahres-/Wiederanlaufsimulation oder Safari-/NAS-Abnahme. Produktdatei, Regeln 12, Schema 8, Tests, Goldenwerte und Workflow unverändert. Wegen des Markdown-Pfadfilters ist kein neuer CI-Lauf zu erwarten; kein Merge/Deployment.

## [ANALYSE/DRAFT] Piratenrisiko und Lagerziel R3 – abgeschlossene Messungen, offene PRs (30.10.2026)

**Keiner der drei Analyse-PRs [#44](https://github.com/tobiasfranziskus/Check/pull/44), [#45](https://github.com/tobiasfranziskus/Check/pull/45) und [#48](https://github.com/tobiasfranziskus/Check/pull/48) ist in `main` integriert; `index.html` bleibt v0.12.5/Regel 14.** Sie testen voneinander getrennte Hypothesen, nicht ein kombiniertes neues Balancing.

- **Piraten-Einstieg #44:** 13 Seeds × 90 Tage und vier B1-Spielerfälle mit Kontrolle, Schonfrist, Kapital- und Aktivitätsschwelle. 20-Tage-Schonfrist: Schiffsverluste **4.622→415**, aber Endbestand NPC-Frachter unverändert 65; im Spieler-Stressfall **2/4** neue Frachter am Leben, ungedeckte Arbeit **870→2.004.546 ISK**. Kapitalregel lässt **4/4** leben, aber ungedeckte Arbeit **3.109.096 ISK**; Aldera-Rohstofflücke bleibt. Keine Variante freigegeben. [CI #41117052272](https://github.com/tobiasfranziskus/Check/actions/runs/41117052272): **19/19 Jobs**, 9.080 Tageshashes.
- **Welt ohne Überfälle #45:** 13 Seeds × 90 Tage plus vier B1-Fälle bis Tag 365; Überfälle vollständig deaktiviert, sonst identischer Core. **0/4→4/4** ursprüngliche neue NPC3-Frachter überleben, mehr Handel, aber ungedeckte Arbeit **870→3.116.651 ISK**, Aldera-Silizium/Bauteile in allen vier Fällen weiter 0. Standard-Mangelstunden **791→751**. Kein Freigabebeleg für eine friedliche Produktwelt. [CI #41119638781](https://github.com/tobiasfranziskus/Check/actions/runs/41119638781): **19/19 Jobs**, 34 Läufe/4.540 Tageshashes.
- **R3-Lagerziel #48 (Regel-14-Analyse):** Kontrolle gegen reine Miner-Abgabebegrenzung, 25 Paare/50 Läufe, **5.980 Tageshashes**, **143.520 stündliche Replay-/Auditzeitpunkte**, **616 Save/Load-Roundtrips**. Bei aktiven Spielern sinken Rezeptmengen nach 60 Tagen (nur Miner **121,596→91,667**, Miner+Auto-Frachter **88,333→75,279** je Welt/Tag); Mangel steigt und keiner der vier historischen B1-Krisenfälle wird wieder versorgt. **R3 ausdrücklich nicht integrieren.** [Wirtschafts-CI #41128487876](https://github.com/tobiasfranziskus/Check/actions/runs/41128487876) **28/28 Jobs**, [Regressions-CI #41128487970](https://github.com/tobiasfranziskus/Check/actions/runs/41128487970) **7/7 ausführbare Jobs**, **72/72 Node-Tests**.

**Entscheidungsgrenze:** Eine leere Kasse kann weiter angefallene Arbeit nur teilweise zahlen; der Core führt die nicht gedeckte Restarbeit derzeit nicht als Schuld weiter. Das ist ein belegter Modellmangel, aber eine konkrete Insolvenz-/Schulden-/Pausenregel wurde **nicht** beschlossen. Die nächste Phase-B/C-Entscheidung muss reale Handelszyklusfinanzierung, Geldquellen/Senken, offene Betriebskosten, zahlungsfähige Käufer, Ersatz und Spieler-Sparfreiheit gemeinsam berücksichtigen. Analysen sind keine Safari-/NAS-Abnahme.

## [ANALYSE] Geschlossene Forschungs-/Alt-PRs

Historischer Audit **#1**, nicht ausreichend finanzierte NPC1-Expansion **#16**, Liquiditäts-/Preis-/Routenanalysen **#23, #26, #27**, Pilotengehalt **#24**, Modulbau-Prototyp **#25** sowie der von #30 abgelöste gestapelte Entwurf **#28** sind **geschlossen und nicht nach `main` gemergt**. Ergebnisse sind in [ANALYSEARCHIV_WIRTSCHAFT_V11.md](ANALYSEARCHIV_WIRTSCHAFT_V11.md) zusammengefasst. Die alten PR- und Git-Branches bleiben als reproduzierbarer Nachweis erhalten. **Keine** Pilotengehalts-, Modul- oder pauschale Preisänderung ist dadurch produktiv geworden.

## Offene Qualitäts-/Produktgates

- Reale iPad Safari Touch-/Querformat-/Hochformat- und NAS-Datei-/Persistenzabnahme; kein Rollout behaupten.
- Die in #32–#34 belegten Langzeit-/Spielerkollapse und Wiederanlaufgrenzen lösen: vollständige Zyklusfinanzierung, reale Nachschubpfade und freizugebendes Geldregime gemeinsam beurteilen; Diagnose ist noch keine Produktkorrektur.
- Erst nach Ursachenprüfung neue Geld-/Waren-Ausgaben, Piratenwirtschaft, Reparaturen, Module und NPC-Personal einführen. Phasen und Abhängigkeiten ausschließlich nach der [ROADMAP.md](ROADMAP.md).

## Archivierter Statusauszug vom 29. Oktober 2026

**Der folgende Bericht ist historisch und darf nicht als aktueller `main`- oder Roadmap-Stand interpretiert werden.** Er wird zur Rückverfolgbarkeit aufbewahrt.

Stand: 29. Oktober 2026. v0.11.2 auf `feat/v0.11.2-wirtschaft`, Basis main `d53bf14`. Noch nicht gemergt, veröffentlicht oder auf NAS/iPad abgenommen.

Schutzgeld ist 0; automatische NPC-Frachter verwenden zwei regulär bezahlte Reserveeinheiten. Schema 8 bleibt erhalten, Regelmigration 7→8 ändert nur die Regelnummer. [Aktueller Testbericht und Risiken](TEST_WIRTSCHAFT_V0_11_2.md): 40 Node-22-Tests sowie 13 wiederholte 90-Tage-Simulationen, alle Audits und Referenzvergleiche korrekt.

## Version und Architektur

| Bestandteil | Aktueller Stand |
| --- | --- |
| Anwendung | Aphros Void, HTML-Metatag `aphros-version`: `v0.11.2` |
| Spielstandschema | 8 |
| Regelversion | 8 |
| Laufzeit | HTML, CSS, Vanilla JavaScript in einer `index.html` |
| Auslieferung | Statische Datei; für iPad Safari und NAS-Webserver vorgesehen |
| Entwicklung | Node.js 22, integrierter Test-Runner; keine npm-Abhängigkeiten, kein Build-Schritt |

Die Versionsangabe im Metatag ist maßgeblich für diesen Bericht. Eine separate Korrektur sichtbarer Versionsanzeigen wurde als PR #5 geschlossen; daraus folgt kein neuer Release-Stand.

- `m_data_*`: Systeme, Wirtschaft, Kampf- und Weltparameter; `m_data_rules` bündelt Regeln, Schema und Regelversion.
- `m_core_*`: gespeicherter Seed/RNG, Zustand, validierte Befehle, Handel, Reisen, Produktion und Kampf. `m_core_step` verarbeitet die Queue und die Simulationsphasen in fester Reihenfolge. Kanonische Serialisierung, Zustands-Hash und Geld-/Warenaudit sichern Nachvollziehbarkeit.
- `m_ui_*`: Ansichten, Marktangebote, Schiffsnamen, Touch-Bedienung, Zeitsteuerung, Neuzeichnen und Browserpersistenz. Markt und Schiffsdetails verwenden gemeinsame Angebotsberechnungen auf Basis bestehender Core-Funktionen.
- Speicherung: IndexedDB-Datenbank `aphros-void`, Store `saves`, ergänzt durch JSON-Import/Export und eine Speicherhülle. Schema- und Regelmigrationen liegen im Core. Spielstände liegen im Browser, nicht automatisch auf dem NAS.
- Schiffskauf: Schiffsware wird zunächst als Fracht gekauft und anschließend per bestehendem `shipActivate` in Dienst gestellt. Bei laufender Simulation sind dies getrennte Befehle/Ticks.
- Schiffsnamen: Standardnamen nach Klasse und aktueller ID-Reihenfolge; optionaler gespeicherter `rufname` über validierten `shipRename`-Befehl. Umbenennen/Zurücksetzen löst Speichern aus. Interne IDs bleiben unverändert.

## Abgeschlossene Pull Requests

Quelle: GitHub-Liste der [geschlossenen Pull Requests](https://github.com/tobiasfranziskus/Check/pulls?q=is%3Apr+is%3Aclosed), am 29. Oktober 2026 geprüft, abgeglichen mit der Git-Historie von `main`. „Geschlossen“ bedeutet nicht automatisch „gemergt“.

| PR | Ergebnis | Inhalt |
| --- | --- | --- |
| [#4](https://github.com/tobiasfranziskus/Check/pull/4) | Gemergt | v0.11.1: Jagdprämie Faktor 3 und Warenbilanz bei Verlust beladener Schiffe |
| [#7](https://github.com/tobiasfranziskus/Check/pull/7) | Gemergt | Startfehler, Pause und Flottenbedienung repariert |
| [#8](https://github.com/tobiasfranziskus/Check/pull/8) | Gemergt | iPad-Querformat mit zwei Spalten und kompakten Schiffsmenüs |
| [#9](https://github.com/tobiasfranziskus/Check/pull/9) | Gemergt | Handelsbeträge inklusive Gebühren bzw. Nettoerlös |
| [#10](https://github.com/tobiasfranziskus/Check/pull/10) | Gemergt | Passendes Trägerschiff je Kauf/Verkauf und Ware |
| [#11](https://github.com/tobiasfranziskus/Check/pull/11) | Gemergt | Handelsmengen nach Kasse, Reserve, Bestand und Frachtraum |
| [#12](https://github.com/tobiasfranziskus/Check/pull/12) | Gemergt | Gemeinsame Handelsangebote in Markt/Flotte und automatisierte Regressionstests |
| [#13](https://github.com/tobiasfranziskus/Check/pull/13) | Gemergt | Direkte Inbetriebnahme gekaufter Schiffsware, lesbare Standardnamen, Umbenennen und sofortiges Speichern |
| [#2](https://github.com/tobiasfranziskus/Check/pull/2) | Ohne Merge geschlossen | Frühere komplexe Spielstandmigration/Ladevalidierung |
| [#3](https://github.com/tobiasfranziskus/Check/pull/3) | Ohne Merge geschlossen | Einzelne Frachtverlustkorrektur; in #4 enthalten |
| [#5](https://github.com/tobiasfranziskus/Check/pull/5) | Ohne Merge geschlossen | Separate Korrektur sichtbarer Versionsanzeigen |
| [#6](https://github.com/tobiasfranziskus/Check/pull/6) | Ohne Merge geschlossen | Früher Gebühren-UI-Ansatz; durch #9 ersetzt |

Historische Dokumente nennen diese Arbeiten teilweise noch „PR-Branch“ oder „nicht veröffentlicht“. Für die Integration gilt die obige Zuordnung; ein Merge allein bestätigt keinen laufenden Deployment-Stand.

## Qualitätssicherung

Verbindlicher Aufruf im Repository-Verzeichnis mit Node.js 22:

```sh
node --test tests/*.test.mjs
```

- `tests/handel-ui.test.mjs`: Handelsmengen und Gebühren, Schiffswahl, Inbetriebnahme, Namen, Escaping, Queue und deterministische Drei-Tages-Simulationen mit festen Referenz-Hashes für Seeds 42, 1234 und 98765.
- `tests/spielstand.test.mjs`: Save/Load-Roundtrip, Schema 7→8, Regelversion 6→7 sowie Ablehnung beschädigter/zukünftiger Formate.
- `tests/start-smoke.test.mjs`: gesamter Spielstart, Pause, Flotte, Schiffsauswahl, Zeitschritt und Umbenennen einschließlich IndexedDB-Speicherung mit simulierten Browser-Schnittstellen.
- `.github/workflows/ui-regression.yml`: Node.js 22 auf PRs und `main`, mit Pfadfilter für `index.html`, `tests/**` und die Workflow-Datei. Reine Markdown-PRs lösen diesen Job nicht aus.

Aktueller Lauf am 29. Oktober 2026 mit Node.js v22.23.4: **40 bestanden, 0 fehlgeschlagen, 0 übersprungen**. Wirtschaftsregeln, Versionsangabe und Tests wurden wie im aktuellen Testbericht beschrieben geändert; der Workflow bleibt unverändert. Die Tests enthalten keine echte iPad-Safari- oder NAS-End-to-End-Prüfung.

## Offene Probleme und Grenzen

1. **Safari-Abnahme der jüngsten Änderungen ausstehend:** Lange Markt-/Aktivierungstexte, Umbenennungsdialog, Bildschirmtastatur, Hoch-/Querformat, schmale Ansichten und laufende Tick-Neuzeichnung real prüfen. Laut Nutzerabnahme im Schiffskauf-Bericht funktionierten zuvor Markt/Flotte, Mengenbegrenzung, Pause/Zeitschritte, Handel und Speichern. Das ist keine Abnahme des neuen Namensdialogs.
2. **Persistenzrisiko:** Browserdaten sind originabhängig und können löschbar sein. Vor NAS-/Hostwechsel und Import einen Export sichern. Bestehende Spielstände müssen erhalten bleiben; die historische Testdaten-Ausnahme aus dem Releasebericht ist keine aktuelle Freigabe zum Verwerfen.
3. **Automatische Standardnamen können wechseln:** Nach Verlust eines früheren Schiffs wird anhand des aktuellen Bestands neu nummeriert. Eigene Rufnamen bleiben stabil; doppelte Rufnamen sind erlaubt. Stabile Seriennummern wären eine gesonderte Produkt-/Schemaentscheidung.
4. **Angebote können veralten:** Zwischen Anzeige und Queue-Ausführung können Kassen, Preise, Ladung oder Standort wechseln. Eine Ablehnung durch den Core ist erwartete Validierung, kein bestätigter neuer Defekt.
5. **Deployment nicht geprüft:** Der tatsächliche NAS-/Pages-Stand und Performance bei größeren Flotten sind hier nicht verifiziert. Aus fehlenden Browsertests folgt kein bestätigter Produktfehler.

Die GitHub-API war bei dieser Prüfung durch den Netzwerkproxy gesperrt. Die PR-Zuordnung oben basiert auf der erreichbaren GitHub-Webliste und Git. Eine vollständige aktuelle Issue-Inventur wurde nicht verifiziert; diese Liste erhebt daher keinen Anspruch auf Vollständigkeit aller GitHub-Issues.

## Nächste Entwicklungsschritte

1. iPad-Safari-Abnahme von #13 durchführen: Schiff kaufen → als Fracht sehen → in Dienst stellen → Flotteneintrag prüfen; Umbenennen und Zurücksetzen bei Pause sowie laufender Simulation, anschließend Neuladen/Save/Load prüfen.
2. Auf dem tatsächlichen NAS die statische Auslieferung und denselben Export-/Importpfad prüfen; vor Originwechsel einen existierenden Spielstand exportieren. Keine Spielstände für die Prüfung löschen.
3. Nur reproduzierte Befunde als gezielte UI-/Speicheraufträge bearbeiten. Dabei Regressionstests, deterministische Hashes und Audits erhalten; keine beiläufigen Balancingänderungen.
4. Offene GitHub-Issues nach verfügbarem API-Zugang abgleichen. Bedarf an stabilen Standard-Seriennummern oder vereinheitlichter Versionsanzeige gesondert klären, bevor Code oder Schema geändert werden.

Entwicklungsregeln stehen in [AGENTS.md](../AGENTS.md). Dieser Dokumentationsauftrag verändert weder `index.html` noch Spielmechaniken, Speicherformat oder Tests und umfasst keinen Merge oder Deployment.
