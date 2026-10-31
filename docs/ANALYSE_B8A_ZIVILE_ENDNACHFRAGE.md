# B8a – Tatsächlicher Endverbrauch und globale Verbrauchsvergütung (Seed 42)

**31.10.2026 · [ANALYSE/DRAFT] · [PR #61](https://github.com/tobiasfranziskus/Check/pull/61).** Dieser Versuch startet **direkt auf `main 517728a958326e86751f09cd74d0c077edad9921`**, Regel 14, Schema 8, ohne die experimentellen B7b–k-Flotten-, Pacht- und Risikoregeln. `docs/ROADMAP.md` auf `main` bleibt die **einzige** verbindliche Produktplanung. Kein produktiver Regel-/UI-/Speicherpatch.

## Fragestellung und exakt ausgeführtes Modell

Die aktuelle `m_core_stunde.verbrauch`-Routine **entfernt echte Nahrung und Medikamente aus dem Stationslager und erhöht den Warenverbrauch**, verbucht aber **keinen Verkaufserlös an die Station**. Geld für den nächsten Kauf kommt indirekt aus den bisherigen Fonds-/Schiffs-/Warenzahlungen. Der reine Verbrauch ist ein realer **Warensenkenpfad ohne direkten Geldrückfluss** – nicht automatisch ein Softwarefehler.

**[OPTION/Gegenprobe]** Der isolierte Analyse-Core verzeichnet exakt bereits vom Originalmodul verbrauchte zivile Güter und zahlt **höchstens 20 zusätzlich geprägte ISK gesamtweltweit pro Spielstunde**, **nur wenn tatsächlich Nahrung oder Medikamente verbraucht wurden**. Auszahlung proportional zu `tatsächliche Einheiten × originaler Warenbasispreis` an die versorgenden **Stationskonten**, inklusive neutraler oder besessener Stationen ohne individuelle Insolvenzanpassung. Verbleibende Rundungs-ISK deterministisch nach größten Resten und Stations-/Warennamen. **Keine Auszahlung ohne Verbrauch, keine Zahlung an private NPC-Piloten, keine Steuer auf den Spieler, keine Kredite, keine ungebuchten Fondsbuchungen.** Dies ist eine **bewusst kleine, nicht beschlossene** Variante des gesamtwirtschaftlichen Modells B; keine behauptete langfristig angemessene Emissionshöhe.

## [TEST] Tatsächlich ausgeführte Prüfungen

**[CI #41215436981](https://github.com/tobiasfranziskus/Check/actions/runs/41215436981): 1/1 Job erfolgreich, 67/67 Standardtests.** Vier echte Regel14-Welten **Seed42 × 90 Tage**: (a) **sieben unveränderte historisch validierte `handel-flotte`-Spielerbefehle ab Tick1** mit originaler Regel, (b) exakt dieselben Befehle mit 20-ISK-Verbrauchsbudget, (c) passive Welt original, (d) passive Welt mit Verbrauchsbudget. Alle vier: **2.160 stündliche unabhängige Geld-/Warenaudits und deterministische Replayhashes je Welt** (= **8.640 Stundenpunkte**), **360 Tageshashes**, **32 Save/Load-Roundtrips**. Keine synthetischen Startkonten, kein neuer NPC oder Frachter. Die **Original-90d-Referenz des aktiven Kontrollfalls `784047684dfe5c56`** wurde exakt reproduziert; passive Originalwelt Endhash `adf155a018b94094`, aktiver Kandidat `4bf0c0fe65ec0efb`, passiver Kandidat `c7de1344da4409e2`. Simulationsanfänge jeweils identisch; die produktive Original-Quelldatei per SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9` fixiert.

### Ist-Verbrauch, Liquidität und direkte Emission

| Kennzahl, Ende Tag90 | Aktive Originalwelt | Aktiver Kandidat | Passive Originalwelt | Passiver Kandidat |
| --- | ---: | ---: | ---: | ---: |
| Wirklich verbrauchte Nahrung | **2.541** | **3.436** | **36.602** | **36.541** |
| Tatsächlich verbrauchte Medikamente | **644** | **813** | **12.960** | **12.960** |
| Zivile Nahrungs-/Medizinproduktion nach Tag14 | **0 neue** | **0 neue** | **läuft weiter** | **läuft weiter** |
| Direkte Modell-B-ISK-Schöpfung | **0** | **+6.020** | **0** | **+43.200** |
| Stunden mit echter Modell-B-Zahlung | **0** | **301** | **0** | **2.160** |
| Geldvermögen des Spielers | **39.762** | **43.476** | **2.000** | **2.000** |
| Gesamtgeldmenge nach 90d | **50.000** | **56.020** | **50.000** | **93.200** |
| Nahrung/Medizin ab Tag14 | **0/0** | **0/0** | nahezu kontinuierlich | nahezu kontinuierlich |

**[NEGATIVES EINZELGATE]** Der Verbrauchszuschuss verbessert den Anfangsabsatz in der Krisenwelt (+895 Nahrung, +169 Medikamente) und führt durch weitere Wirtschaftsreaktionen auch zu **3.714 ISK mehr Spielervermögen**. Er versiegt aber, sobald die Warenbestände und Produktion ausfallen. In der passiven Welt, die Lebensmittel fast vollständig (36.602/36.720 Bedarf) und Medikamente vollständig (12.960/12.960) auch **ohne** Geldhilfe liefert, entstehen **43.200 neu geprägte ISK ohne relevanten Versorgungsgewinn**; Nahrung wird sogar um 61 Einheiten geringer konsumiert. Keine uneingeschränkte automatische Geldproduktion bei schon gesunder Versorgung freigeben.

## [ROOT CAUSE] Zu wenig Kaufkraft **und** Ware am falschen Ort

Im echten **aktiven Regel14-Kontrolllauf** beträgt der 90d-Gesamtbedarf **36.720 Nahrung /12.960 Medizin**. Die Verbraucherstationen haben für Nahrung **12.026 Stations-Waren-Stunden mit Nullbestand**, für Medikamente **12.316**. Davon war bei **6.056 Nahrung-Nullbestand-Stunden** bzw. **4.076 Medizin-Nullbestand-Stunden** das jeweilige Stationskonto **mindestens für eine Einheit zum echten stationsabhängigen Core-Preis zahlungsfähig**. Gleichzeitig liegen die gesamten **Stations-Waren-Stunden mit Kasse unter einem einzigen echten Wareneinheitspreis** bei Nahrung **6.358** und Medizin **8.532**. Beides zählt: Fehlt Ware bei kaufkräftigem Standort, hilft bloße zusätzliche Nachfrage **ohne neue Lieferung** nicht. Hat die Station kein Geld für **eine** Einheit, muss echter Geldrückfluss geprüft werden. `Kasse == 0` allein unterschätzt deshalb das Kaufkraftproblem (nur je 23 Nullkassen-Stunden).

**Ab Ende Tag14 bis einschließlich Tag90** liegen alle zivilen Konsummengen im aktiven Kontrollfall bei **null**; die Produktion von Nahrung bleibt nach kumuliert **2.374**, die von Medizin nach **472** Stück stehen. **Es gibt dennoch 91 Nahrung und 91 Medikamente als reale Waren in der `st_meridian`-Außenhandelsstation**; sie hat keine zivilen `verbrauch`-Bedarfsziele für diese Waren. In allen sechs zivilen Bedarfstationen ist der Bestand **0/0**. Die aktiven Nahrungsproduzenten `st_cyris`, `st_nadir`, `st_veldra` besitzen an Tag14 jeweils nur **1 Eis**, was für `r_nahrung` (**2 Eis→1 Nahrung**) nicht ausreicht. In Cyris für `r_medikamente` liegen noch **45 Kristall**, aber **0 Material** (Rezept braucht 1 Kristall + 2 Material). Damit ist der Fertigungsstopp anhand echter Inputlager reproduziert, nicht nur vermutet.

| Aktive Kontrollwelt, Ende Tag14 | ISK oder Bestandswert |
| --- | ---: |
| Spieler | **39.762 ISK** |
| Alle Stationskassen | **4.466 ISK** |
| Fonds zusammen | **1.300 ISK** |
| Meridian Stationskasse | **2.800 ISK** |
| Cyris / Nadir / Veldra Stationskassen | **9 / 15 / 147 ISK** |
| Alle sechs zivilen Stationen: Nahrung/Medizin | **0 / 0** |
| Meridian ohne zivile Konsumentennachfrage | **91 Nahrung / 91 Medizin** |

**[BEWERTUNG]** Wir sehen **gekoppelte** Probleme: Das im Kern hergestellte Lebensmittel existiert zum Ende fast nur noch am nicht konsumierenden Außenhandelsplatz; Produktionen stoppen wegen fehlender Eingaben; produzierende Stationen haben vielfach keine reale Kaufkraft; der aktive Spieler hat nahezu **80 %** der Gesamtgeldmenge angesammelt. Passive Welt ohne Geldzufluss bleibt sehr gut versorgt. **Keine** dieser Einzelursachen allein darf ohne weiteren Versuch zur einzigen Schadensursache erklärt werden; der Käufer-Kassen- und physische Warenflaschenhals muss je Handlung getrennt betrachtet werden. Die bisherige Verbraucherzahlung erhöht zunächst die Spieler-Konzentration indirekt mit und erzeugt keinen selbsttragenden neuen Transportmarkt.

## Nächstes enges Gate [B8b / ANALYSE, noch keine Mechanik beschlossen]

**Vor jeder anderen Geldemission** read-only die **konkreten Transfers vom NPC-/Stationssektor zum aktiven Spieler** über die ersten 14 Tage, die physisch vorhandenen Eis-/Material-Reserven und den Liefersperrpfad zu den drei Nahrungs-/Medikamentenfabriken nachvollziehen. In einem einzigen anschließenden Test die Ursache unterscheiden: *fehlende Waren an der Rohstoffquelle*, *unbezahlbarer Ankauf an der Fabrik*, *fehlender zahlungsfähiger Miner/Frachter* oder *unrentable Fahrt*. Eine kontraktbezogene reale Liquiditätsquelle oder seltene Funde dürfen später **nur gesamtwirtschaftlich und produktivitätsgebunden** erwogen werden, ohne einzelne Konkurse vor dem Scheitern zu schützen oder den Spieler zu enteignen. Kein Bündel aus Preisänderungen, Kaufkraftzuschuss, Flug-/Piraten-Reform und neuen Pilotenregeln. Erst wenn ein konkreter Wiederanlauf im aktiven Fall funktioniert, 13 Seeds ×90 Tage, alle Spielerfälle und Save-Migration/Browser-Gates erwägen.

**Stand:** PR #61 ausschließlich [ANALYSE/DRAFT]. Produkt auf `main 517728a9` unverändert, **kein Merge, keine NAS-/iPad-Veröffentlichung**.
