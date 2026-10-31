# H1-C2 – 480 ISK/Tag für realen Zivilverbrauch: kausaler Einzeltest

**31.10.2026 · [ANALYSE/DRAFT] · H1-Wirtschaftshypothese im Einzeltest verworfen, keine Produktfreigabe.** Bezug: [einzige Roadmap auf main](ROADMAP.md), [H1-Konzeptions-Draft #55](https://github.com/tobiasfranziskus/Check/pull/55), [reiner Verbrauchs-Referenzaudit #57](https://github.com/tobiasfranziskus/Check/pull/57) und [B6f-Vollkostenprüfung #56](https://github.com/tobiasfranziskus/Check/pull/56). Produkt `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5 / Regeln 14 / Schema 8 unverändert.

## 1. Tatsächlich ausgeführte Prüfung

- **[TEST] [GitHub Actions #41189930640](https://github.com/tobiasfranziskus/Check/actions/runs/41189930640), 1/1 Job grün, 67/67 Node-Standardtests bestanden, 0 Fehler/Skips.** Je **365 Tage** gepaarte Kontrolle und exakt **eine** H1-Variante; Seed **42**, **neun ursprüngliche B1-Spielerbefehle** `handel-flotte` (u. a. Anfangshandel, Schiffaktivierung/-aufträge, Umbenennungen bei Tag 90/180), gleiche Reihenfolge, gleicher Anfangshash `ebadcfa7b3bb857c`. Beide Welten **beginnen unter Regel 14 bei Tick 0**. Das ist **nicht** der historische Regel-12-Tag-90-Start des B6e-Kreditfalls; dessen abweichende Ausgangslage und die H1-C1-Messung der 275 späteren Tage dürfen **nicht** ohne Kennzeichnung verglichen werden.
- Pro Lauf **8.760** stündliche Hash-/Geld-/Waren-Audits/Replays, **365** tägliche Zustands-Hashes und **18** Save/Load-Roundtrips; zusammen **17.520 Stundenprüfungen, 730 Tageshashes, 36 Roundtrips**. Original-Core-SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`, unveränderte Kontrolle; isolierte H1-Quellvariante SHA256 `56e7bb978887ffbabfbf903ce425712d5bdd1671df493bb713214b07ea9ed550`. H1-Variante verändert ausschließlich den simulierten Stunden-Tick **nach** `verbrauch` und **vor** `betriebskosten`, nicht `index.html`.
- H1-Regel **nur im Analysezweig**: `B_tag=480 ISK` global/Tag, hier exakt **20 ISK/Stunde**. Auszahlung nur bei im selben Tick physisch konsumierter Nahrung/Medikamenten, proportional zu festen Basiswerten **30/105 ISK**, ganzzahlig und Restbeträge nach absteigenden Resten/stabiler Stations-ID; Barzahlung an jeweiliges existierendes Stationskonto mit gleichzeitiger **einmaliger `minted`-Buchung**. Kein Geld für `bauteil`, Bedarf ohne Ware, Stillstand, Außenhandel, einzelne Insolvenzen oder eine noch nicht bezahlte Schiffsleistung. Unbenutzte Stundenbudgets verfallen, keine Vorschüsse/Nachzahlungen, kein weiteres Geldmodell.
- Archivierte CI-Artefakte `h1-c2-budget480-seed42` (ID **`13037604048`**), zwei Original-JSON (`h1-c2-handel-flotte-42-control.json`, `...-h1.json`); nur dort stehen volle Tagesreihen, Empfänger und NPC-Saldo-Details.

## 2. Messwerte; volle Arbeit fällig vs. bezahlt

| Kennzahl | Unveränderte Kontrolle | Eine H1-Variante |
| --- | ---: | ---: |
| **H1 zivile Neuemission** | 0 | **4.700 ISK** |
| Tatsächliche NPC1/2-Warenverkaufstransaktionen | 1.225 | 1.546 |
| Kumulierte Mangelstunden Tag 365 | 155.459 | 155.145 |
| Konsumierte Nahrung | 2.541 | 2.678 |
| Konsumierte Medikamente | 644 | 769 |
| Letzter Spieltag mit realem zivilen Verbrauch | 9 | **10** |
| Spieltage **ohne** zivilen Verbrauch | 356 | **355** |
| **Alle** NPC-Betriebskosten voll fällig (NPC1/2/3) | 197.965 ISK | 250.562 ISK |
| Tatsächlich bezahlte NPC-Betriebskosten | 185.564 ISK | 201.149 ISK |
| **Ungedeckte NPC-Betriebskosten** | **12.401 ISK** | **49.413 ISK** |
| NPC1 ungedeckt | 8.852 ISK | **34.985 ISK** |
| NPC2 ungedeckt | 3.549 ISK | **14.428 ISK** |
| NPC1/2-Frachter zum Endtag | 0/0 | 0/0 |
| Aldera-Silizium / -Bauteile zum Endtag | 0 / 0 | 0 / 0 |
| Kasse Spieler `house` am Ende | 39.762 ISK | **46.157 ISK** |
| Bestehende `minted` inkl. H1 am Endtag | 6.360 ISK | 11.900 ISK |
| Kumulative `burned` am Endtag | 11.360 ISK | 12.200 ISK |
| Gesamte Cash-Summe am Endtag | 50.000 ISK | **54.700 ISK** |

**Zeitlicher Stopp:** H1 zahlt an den Spieltagen 1–9 jeweils **480 ISK**, an Tag 10 nur **380 ISK**; **ab Tag 11 0 ISK**. Insgesamt **4.700 ISK**, davon Aldera **816**, Cyris **1.034**, Dravos **384**, Nadir **1.512**, Orion **378** und Veldra **576 ISK**. Alle Beträge stammen aus tatsächlich konsumierten Waren; kein negativer Stationscash und keine stillen Restbudgets. **Mehr H1-Einnahme wird nicht bei Ausfall einzelner Marktteilnehmer ausgelöst.**

**Geldfluss-Audit:** In der Kontrolle `55.000 + 6.360 − 11.360 = 50.000 ISK`. Mit H1 `55.000 + 11.900 − 12.200 = 54.700 ISK`. Der Anstieg der Gesamtmenge um **4.700 ISK** entspricht genau den realen zivilen Zahlungen. Der Unterschied bei kumulativem Gesamt-`minted` (+5.540 ISK) enthält **zusätzlich 840 ISK veränderte bestehende Geldquellen** infolge abweichenden Weltverlaufs; gleichzeitig 840 ISK höhere `burned`-Beträge. Diese 840 ISK **nicht** als H1-Emissionsbudget zählen. Die gestiegene Spieler-Kasse ist ein **endogener Transaktions- und Verteilungseffekt**, kein direkter H1-Zuschuss.

**Kosteninterpretation:** Die zusätzlichen **321** NPC1/2-Warenverkäufe kosten die Welt **52.597 ISK zusätzlich fällige NPC-Arbeit**, davon nur **15.585 ISK zusätzlich bezahlt**, sodass die ungedeckte Arbeit **+37.012 ISK** wächst. Das ist eine Gesamtbilanz über NPC1/2/3, kein marginaler Einzeltransportpreis; für NPC1 allein steigen nicht bezahlte Beträge **8.852→34.985**, für NPC2 **3.549→14.428 ISK**. Die positiven aggregierten Warenmargen beider Händler bedeuten **nicht**, dass alle einzelnen Fahrten, Spätphasen oder erneuten Hüllenkäufe vollständig finanziert wurden. Bei der ersten Stunde mit fehlendem Cash werden fällige Arbeitsminuten im vorhandenen Core weiterhin ohne Schuldvortrag gelöscht; dieser Buchungsfehler/Regelunterschied wird hier nicht repariert.

**Versorgungsinterpretation:** Der H1-Versuch reduziert die kumulierten Mangelstunden um **314** (155.459→155.145), d. h. rund **0,20 %**, führt jedoch weder dauerhaften Zivilverbrauch noch Händlerbestand oder Aldera-Vorprodukte zurück. Im Kontrolllauf sind ab **Tag 8**, im H1-Lauf ab **Tag 9** bereits **keine NPC1/2-Frachter** mehr vorhanden; beide Welten verlieren damit binnen weniger Spieltage ihren professionellen Transportsektor. Spieler-Cash steigt im H1-Lauf auf **46.157 ISK**, also **84,4 %** der verbliebenen **54.700 ISK**; in der Kontrolle **39.762/50.000 = 79,5 %**. Die sechs Verbraucherstationen haben am Ende nur **1.666 ISK** in der Kontrolle und **652 ISK** in H1 zusammen, trotz der früheren Zuschüsse. Reine Weltgeldzufuhr behebt die räumlichen Ausgaben-/Zahlzeitprobleme nicht.

## 3. Freigabeentscheidung und nächstes unabhängiges Gate

**[NEGATIV NACHGEWIESEN]** H1 **mit genau 480 ISK/Tag und exakt diesem v14-Spielerfall** ist **kein** nachhaltiger Wirtschaftsreformkandidat. Es steigert reale frühe Warenumsätze leicht, verschärft zugleich die ungedeckte Frachterarbeit und endet nahezu ebenso schnell im Versorgungskollaps. **Nicht integrieren, nicht „bis es grün ist“ nur das Budget erhöhen**, kein kostenloser Schiffersatz, keine rückwirkende Emission bei Nullverbrauch, keine Pauschalrettung eines Konzerns. Die **allgemeine Möglichkeit eines bezahlten Grundverbrauchs** bleibt ein Gestaltungskandidat, aber deren ausreichende Gestaltung und Kombination mit anderen Quellen ist **nicht** bewiesen; die H1-Quelle ist in dieser Krise selbstendend.

**[ANALYSE/OPTION] Nächste kleinste Ursachenfrage statt Regelstapel:** Warum ermöglichen positive aggregierte Handelsmargen trotzdem weder bezahlte Arbeitsstunden noch bezahlbaren Schiffersatz? In *genau den vorhandenen H1-C2-Artefakten* zuerst Ein-/Auszahlungszeitpunkt pro NPC, Preis-/Routenwahl, Stationskaufkraft, Fahrzeit, NPC-Cash-Abschöpfung über 6.000 ISK, Hüllenverlust und bereits ungedeckte Arbeit **für die ersten zehn Tage** zusammenführen. Aus den vorhandenen Owner-Summen allein ist keine Kausalursache für die fällige zusätzliche Arbeit bewiesen. Ein gezielter **read-only** Ereignis-/Routen-Cash-Audit ohne neue Produktregel ist der passende nächste Schritt; erst anschließend ggf. **eine** kostengeprüfte Routen-/Tarifhypothese oder ein physisch gedeckter regulärer Export/Markteintritt separat formulieren. Eine automatische zusätzliche Export-Geldmaschine wäre jetzt eine unbewiesene Komplexitätserhöhung.

**Status:** `index.html`, `main`, Regel-/Save-Version, Produkttests/Goldenwerte, H1-C1- und B6f-Drafts unverändert; nur Analyse-Runner, eigene CI und Dokumentation in [Draft #58](https://github.com/tobiasfranziskus/Check/pull/58). Kein iPad-/NAS-Deployment oder -Abnahmetest. Kein Merge ohne ausdrückliche Freigabe.
