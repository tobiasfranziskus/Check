# B7d – Warum räumliche Preisunterschiede keinen autonomen Handel auslösen

**31.10.2026 · [ANALYSE/DRAFT] · kein neuer Wirtschaftsmechanismus.** Einzelne read-only Angebotsbewertung auf demselben Seed42-Regel14-B7b/Kontrollkern wie [B7b/B7c, Draft #60](https://github.com/tobiasfranziskus/Check/pull/60). Produktvision und Prioritäten ausschließlich in `docs/ROADMAP.md` **auf `main`**; relevanter docs-only-Konzeptentwurf in [Draft #55](https://github.com/tobiasfranziskus/Check/pull/55). Basis `main 517728a958326e86751f09cd74d0c077edad9921` v0.12.5, Regel14, Schema8.

## 1. Ausführung, Quelltreue, methodische Grenzen

**[TEST] [GitHub-CI #41195154068](https://github.com/tobiasfranziskus/Check/actions/runs/41195154068) 1/1 Job vollständig erfolgreich, 67/67 Standard-Node-Tests, 0 fehlgeschlagen.** Die bestehenden **vier** Weltläufe aus B7b (unveränderte Regel14-Kontrolle / gemeinsame Spieler-NPC-Schiffskonten jeweils 10 und 90 Spieltage, Seed42, dieselben historischen B1-Befehle; in B7b ein zusätzlicher gültiger Spieler-`shipFund`-Befehl) wurden erneut durchgeführt. **4.800 unabhängige Stunden-Geld-/Warenaudits plus Replay-Hashes**, **200 Tageshashes**, **44 Save/Load-Roundtrips** und **340 stündliche reine B7c-Diagnosebilder**. B7d ergänzt **je vier Tagesenden 10/11/12/15** in beiden 90-Tage-Regimen sowie Tag10 in beiden 10-Tage-Läufen: an jedem Snapshot **126 gerichtete Standort-/Ziel-/Waren-Paare** über 7 Stationen und 3 ausgewählte Güter (Nahrung, Medikamente, Silizium), plus 16 fest gepinnte Prüffahrten. Beobachter-Hash vor/nach allen Marktabfragen unverändert, Kontroll-Tag10-Hash `84f1a88d2701ff2a`, Kontroll-Tag90-Hash `784047684dfe5c56`, B7b-Tag90-Hash `82f11deee8c7f566` **identisch zu früheren Runs**. **Kein** `index.html`, Regel-/Schema-/Save-, Markt-, Preis- oder Geldzufluss-Update. CI-Artefakt `b7b-shared-accounts-seed42` enthält auch `b7dDiagnostics`.

**Aus dem originalen Kern gelesen:** Reiseroute/`route(...).zeit`, `verkaufbar` (Stationsreserve), `aufnehmbar` (Käuferkasse plus Ziellager-Obergrenze), `preis`, `gebuehr`, 100-Einheiten-Frachtlimit, `betriebs­kosten.frachter=250 ISK` pro Stunde, tatsächliche Schiff-/Eigentümerkassen. Für jedes potentielle Angebot:

- `Menge = min(100, effektiv verkaufbarer Ausgangsvorrat, beim Ziel finanziell + räumlich abnehmbar)`.
- `Bruttomarge nach Gebühren = Menge × (Zielpreis − Abfahrtspreis) − Kaufgebühr − Verkaufsgebühr`.
- `vorsichtig geschätzte Reisearbeit = ceil(Route in Minuten / 60) × 250 ISK`; `Kalkulationsüberschuss = Marge − Reisearbeit`.
- `vorab nötiges Fahrtgeld = Einkauf + Kaufgebühr + Reisearbeit`. Wiederholte Verlagerung vorhandener ISK, keine neue Quelle.
- Gegencheck: Steht ein **unbeladener gedockter NPC1/2-Frachter am Einkaufsort** und besitzt er zusammen mit der eigenen **freien Konzernkasse** wirklich genügend Geld? Die KI nutzt die ursprüngliche B7b-Transferfunktion; eine verfügbare fremde Station oder ein vom Spieler gehaltener Frachter gilt **nicht** als automatisch investierender NPC2-Händler.

**Grenze:** Eine **Momentaufnahme**, kein echter abgerechneter Transportvertrag. Preis/Abnahmekapazität können sich während des Fluges verändern, Ausführung kann durch Piraten, Rückwege, verzögerte Stationseinkäufe, nicht beachtete frühere Arbeit und Schiffsverluste schlechter ausfallen. Der konservativ gerundete Einzelflug bewertet **noch keinen Hin-/Rückweg und keine volle Hüllenabschreibung**. „Positiver Kandidat“ bedeutet **Möglichkeit**, nicht garantierten Eigentümergewinn. Menge beim Käufer wird bereits durch dessen momentanes Cash gedeckelt und kann nicht nachträglich fiktiv erhöht werden. Eine **neue rentable Handelsroute allein** bildet keine rationale neue Schiffsfinanzierung ohne genug Startkapital.

## 2. Ergebnisse

| Tagesende und Regime | 126 gerichtete Angebote | Menge mit realem Käufer | Nach Gebühren positiv | Nach Reisearbeit positiv | Positiv + leerer NPC-Frachter am Einkaufsort + reales Kapital |
|---|---:|---:|---:|---:|---:|
| B7b Tag 10 | 126 | 36 | 32 | **7** | **0** |
| B7b Tag 11 | 126 | 27 | 26 | **10** | **0** |
| B7b Tag 12 | 126 | 23 | 22 | **10** | **0** |
| B7b Tag 15 | 126 | 19 | 18 | **7** | **0** |
| Unveränderte Kontrolle Tag 10–15 (jeweils) | 126 | 22 | 18 | **4** | **0** |

In der Kontrolle Tag10–15 existieren nach dem vorherigen Zusammenbruch überhaupt keine NPC1/2-Frachter; die gezeigten vier profitablen Märkte sind daher **nicht** von tatsächlichen Kaufaufträgen abgedeckt. In B7b stehen Tag10 ein NPC2-Frachter in Meridian (ohne Ladung, **89 ISK Schiffskasse + 2 ISK Konzerncash**), NPC1 `sh109` in Orion (**181 + 2 ISK**), und ein weiterer NPC2-Frachter befindet sich mit Siliziumladung auf Reise. Die im selben Moment berechneten nach Reisearbeit positiven Angebote **liegen nicht am Dock der verfügbaren unbeladenen Händler**; der in Meridian wartende NPC2-Frachter kann ohnehin nicht die Mindestkosten einer Stunde Frachterarbeit (250 ISK) aufbringen. Tag11 geht auch die NPC2-Flotte verloren; Tag12–15 befindet sich nur `sh109` in Orion, ohne Fracht mit 181+2 ISK.

### Tatsächliche Kernangebote am Ende Tag 15 (B7b)

| Ware / Ursprung → Ziel | Einkauf/Stück | Verkauf/Stück | real verkäufliche Stück | nur Kauf-/Verkaufsgebühren und gerundete Reise-Arbeit abgezogen | Vorfinanzierung |
| --- | ---: | ---: | ---: | ---: | ---: |
| **Silizium Dravos → Aldera** | 17 ISK | 43 ISK | 37 | **+624 ISK** | **904 ISK** |
| **Silizium Nadir → Aldera** | 19 ISK | 43 ISK | 37 | **+547 ISK** | **981 ISK** |
| Silizium Meridian → Aldera | 31 ISK | 43 ISK | 37 | +131 ISK | 1.397 ISK |
| Nahrung Meridian → Aldera | 41 ISK | 54 ISK | 25 | **+21 ISK** | 1.275 ISK |
| Nahrung Meridian → Cyris | 41 ISK | 59 ISK | **0** | nicht möglich | Käufer hat **4 ISK** |
| Nahrung Meridian → Nadir | 41 ISK | 54 ISK | **0** | nicht möglich | Käufer hat **4 ISK** |
| Nahrung Meridian → Orion | 41 ISK | 57 ISK | **0** | nicht möglich | Käufer hat **53 ISK** |

**[BESTÄTIGT] Nachfrage- und Lokationsproblem sind getrennt:** Vor allem **Dravos/Nadir → Aldera (Silizium)** bleiben im Kollaps wirtschaftlich interessant; es fehlen **finanzierte Schiffe am Ursprung** und schließlich jegliche hinreichend kapitalisierte Händlergruppe für eine erste Anreise bzw. Marktneueintritt. **Nahrung Meridian → Aldera** ist schon *vor* Verlustrisiko/Rückfahrt mit nur **21 ISK** kalkulierter Marge wirtschaftlich kaum interessant. **Cyris/Nadir/Orion** könnten selbst bei vorhandener Fracht **keine einzige Einheit** Nahrung bezahlen; ihr nominaler hoher Bedarf ist **kein** zahlbares Marktangebot.

**[BESTÄTIGT] Preisformel erzeugt keinen garantierten Billigmarkt:** Meridian besitzt regionalen Preisfaktor **1.300** und einen lokalen Nahrungs-Zielbestand von **100**. Am Tag15 stehen **95 Nahrung** dort, also eher normaler Bestand knapp unter Ziel als ein Lager-„Massenüberschuss“. Daraus folgt **41 ISK Einkaufspreis bei einem Grundpreis von 30 ISK**: trotz vermeintlich reichlichem Restbestand kein absolut niedriger Weltmarktpreis. Der Core begrenzt Preisanpassungen auf Faktor **550–2500** und bewertet bei Kaufentscheidungen Nominalmarge nach Gebühren, **ohne volle Fahrtarbeit oder Rückfahrt/Piraten-/Ersatzkosten**; die wirklich absetzbare Stückzahl wird bei jedem Ziel zusätzlich durch `aufnehmbar` und tatsächliches Bargeld begrenzt.

**[BESTÄTIGT] Warenimport ist kein Geldrückfluss:** Die bestehende `aussenhandel(state,rules)`-Funktion verändert Meridians Güterlager in Richtung Ziel und bucht Import/Export im **Warenledger**, aber führt **keine ISK-Transaktionen** als Bezahlung echter Exportleistungen aus. Kein Geldzufluss aus diesen Mengen für stationäre Käufer oder Händler; dadurch kann frei vorhandene Ware im Außenhandel zwar physisch sichtbar sein, ohne einen zahlungsfähigen Binnenmarkt zu erzeugen. Dies ist eine vorhandene Regel, kein Beobachter-Eingriff. Solange das Konzept keine echte monetäre Gegenleistung vorsieht, wäre ein „unendlich zuverlässiger Handelsabnehmer“ eine **irreführende** Modellannahme.

## 3. Empfehlung und nächstes Gate

**[BEWERTUNG]** **Nicht** zuerst die Nahrungs-Preiskurve aggressiver machen, NPC-Frachter gratis erzeugen oder einzelnen Konkurrenten Geld schenken. Marktpreise sind ein wichtiges, aber **nicht hinreichendes** Signal. Ein sich selbst organisierender Weltraummarkt braucht mindestens **zahlungsfähige Endverbraucher, kaufbare Ware, tatsächlich verfügbares und vorfinanziertes Transportkapital sowie eine KI, die die Vollkosten der Fahrt erkennt**. B7b löst die Nichtzahlung angefallener Arbeit, **nicht** den Markteintritt nach tatsächlichen Verlusten oder den Geldrückfluss aus Endnachfrage.

**[NÄCHSTES EINZELGATE – OPTION, noch keine Produktänderung]:** Für die konkret ausgewiesene profitable **Dravos → Aldera Siliziumroute** als reine Buchungs-/Routenhypothese **realen Eintrittsbedarf** ausweisen: Schiffshülle aus vorhandener Aldera-Werft mit echter Hüllengebühr, ggf. Leerpositionierung Aldera→Dravos, 904 ISK Anfangs-/Fahrtbudget, danach nachgewiesene Kauf-/Verkaufszahlungen inklusive zeitabhängiger Preise, mit vorhandener NPC-/Spielerfinanzierung und ohne Gratis-Kredit. Separat beurteilen, ob ein wirklich marktorientierter **neuer Unternehmensteilnehmer mit echtem eigenen finanziertem Kapital** diese Gelegenheit wahrnehmen könnte oder ob es am Nachfrage-/Geldregime mangelt. **Keine** automatische Bankrottrettung bestehender Firmen, keine abstrakte Handels-Geldschöpfung, keine neuen Preise/Schiffe/Unternehmensneugründungen gleichzeitig. Bei späterer Implementierung dieselben Core-Markt-/Kontenregeln für den manuell fahrenden Spieler und den NPC. Angewandtes Experiment braucht einen isolierten Kandidaten und im Erfolgsfall das vollständige 13-Seed/90-Tage-Gate vor Produktfreigabe.

**Status:** [PR #60](https://github.com/tobiasfranziskus/Check/pull/60) bleibt offen/[DRAFT/ANALYSE]. `main`, `index.html`, Rule14/Schema8, echte Save-Migration, iPad-/NAS-Abnahme und Deployment unverändert; nichts mergen.
