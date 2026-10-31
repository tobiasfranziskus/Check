# B8g – Zwei leistungsgebundene Welt-Beschaffungsaufträge mit echter Core-Abnahme

**[ANALYSE/DRAFT] · 31.10.2026.** Originalbasis ausschließlich `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5/Regel14/Schema8. Einzige verbindliche Roadmap: [docs/ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md). **Dies ist kein neues Produktfeature.**

## Problem und überprüfbare Hypothese

B8d [#64](https://github.com/tobiasfranziskus/Check/pull/64) führte einen originalen realen NPC3-Frachter mit 7 Material nach Cyris: ohne Käuferfinanzierung **0/7 Verkauf**, nach einmaliger 403-ISK-Umbuchung aus neutraler Meridian-Kasse echter **7/7** Verkauf, drei weitere Medikamente; **zweiter 7er-Transport 0/7**. B8e [#65](https://github.com/tobiasfranziskus/Check/pull/65) zeigte die unzureichende physische Außenexportmenge; B8f [#66](https://github.com/tobiasfranziskus/Check/pull/66) belegte Ursprungsrisiken ursprünglich kostenlos importierter Waren sowie große historische *Brutto*-Geldtransfers ohne selbsttragenden Folgehandel.

**B8g isoliert die Wiederholbarkeit eines gedeckelten Welt-Beschaffungsbudgets für *physisch ausgeführte* Transporte**, nicht die Einführung einer beschlossenen Geldquelle. Es wird **kein Geld gemintet**: der neue einmalig begrenzte Analyseauftrag darf zusammen höchstens **900 ISK aus der bereits vorhandenen neutralen Meridian-Stationskasse** übertragen und **höchstens zwei echte Materiallieferungen à 7 Einheiten** finanzieren. Der Bedarf wird **vorab am Tag14 aus allen stationären Medikamenten-Rezepten mit fehlendem Material ermittelt, nicht nach Besitzer-, Insolvenz- oder Stations-Kassenstand**; der Reproduktionsfall ergibt `st_cyris`. Eine echte autonome NPC-Vergabe ist damit **nicht belegt**: es wird nur ein einzelnes, im Versuch freiwillig teilnehmendes NPC3-Schiff geskriptet.

## Konkreter Nachweis und Ausführungsgrenzen

Der Originalkern erwirbt für NPC3 eine tatsächliche Frachterhülle über `ersatzkauf` aus eigenem Konzernkapital, keine Gratisfrachter oder ungesicherten Pilotenbudgets. Das gleiche Schiff kauft durch **validierten `shipTrade`** echtes Material aus **Veldra** (kein Außenimport-System) und reist via **validierten `shipMove`** nach Cyris. Ein ausschließlich im Analyse-Runtime-Code eingeschobener Beobachter bescheinigt im echten Original-`ankunft`-Tick den im Kern bereits abgeschlossenen Flug sowie den zugehörigen realen, bezahlten Materialkauf und vorhandene Fracht. Erst **nach Ankunft, vor Ausführung von `entladen`** überträgt die Analyse einmalig den genau noch fehlenden Rechnungsteil **aus vorhandenem Meridian-Cash** an die ausgewählte echte Bedarfskäuferstation, nur solange die globale Ausgabenobergrenze eingehalten wird. Anschließend muss `entladen` denselben realen Original-`handel` durchführen; sonst schlägt die Analyse **fehl**. Nur dann ist der Leistungsnachweis abgeschlossen, nicht nach bloßer Absicht, Rechnung oder Papierangebot. Jede Quittung ist mit Schiff, Kauf, Quelle, Menge, Preis, Ziel, Ankunft, überwiesenem ISK und real verkauftem Gut exakt bilanziert. Maximal zwei Quittungen, kein dritter Auftrag.

**Es wird damit nicht bewiesen, dass die importierte Veldra-Ware geologisch/lagerhistorisch ausschließlich neu produziert wurde.** Das Quelllager besitzt keine Herkunftsetiketten für Anfangsbestand oder zuvor eingekaufte Waren. Die Prüfung belegt einen *bezahlten Originalwarenkauf mit nachfolgender physischer Originalfahrt*, keine nicht wiederholbare selbstständige Produktion, keine externe Wertschöpfungs-Gutschrift und keine Betrugsfreiheit für ein späteres reales Vertragssystem.

Vier 90d Original-Spielerfälle mit denselben sieben historischen B1-Befehlen, alle jeweils doppelt mit unverändertem deterministischem Kern durchgerechnet:

- **Kontrolle:** unverändert; Original-Hash exakt `784047684dfe5c56`.
- **Nur bezahlte Hülle:** NPC3 investiert selber, Käuferfinanzierung unverändert.
- **Ein Weltauftrag:** ein echtes Materiallot bekommt bedingt auf vollständige Ankunft und Originallieferung die fehlende Stationskaufkraft (B8d-Nachstellung).
- **Zwei Weltaufträge:** zweites echtes Lot wird bei Ankunft nochmals aus derselben globalen 900-ISK-Obergrenze bezahlt. Ein drittes echtes Lot wird **ohne neue Finanzierung** als harte Gegenprobe versucht, statt nach dem ersten Erfolg voreilig „Markt repariert“ zu sagen.

Die unabhängig gemessenen Betriebskosten von **genau diesem Frachter**, real gezahlte Gebühren, Geld-/Warenaudits, Spieler-Sparfreiheit, unverändertes Mint/Burn und Save/Load-Roundtrips sind Pflicht. Ein erfolgreicher Rechendurchlauf beweist weder profitable Eigentümerrendite, direkte Spielbarkeit auf iPad Safari noch einen automatischen NPC-Vertragsmarkt.

## [TEST] Tatsächliche vier Seed42-Versuchswelten nach 90 Tagen

**[CI #41244603280](https://github.com/tobiasfranziskus/Check/actions/runs/41244603280)** vollständig erfolgreich auf Code-/Workflow-Head `97b85b6b9b0e1414c52a737fe059f9f2634d3451`: **1/1 CI-Job, 67/67 Node-Standardtests, 0 Fehler, 0 Skips**. Vier 90d-Welten, jeweils doppelt deterministisch abgespielt: **17.280 Stunden-Geld-/Warenaudits mit unabhängigen Replay-Hashes**, **40 Save/Load-Roundtrips**. Historischer aktiver Kontrollendhash `784047684dfe5c56` exakt beibehalten. Der erste CI-Versuch [#41244538969](https://github.com/tobiasfranziskus/Check/actions/runs/41244538969) fiel allein wegen eines Analyse-Observer-Scopingfehlers (Kernfunktion `m_core_handel` war nicht von außen sichtbar) vor dem Auszahlungsszenario aus; im erfolgreichen Folgejob wurden Preis und Kapazitätsberechnung ausdrücklich als **Originalkernfunktionen** dem Beobachter übergeben. Keine Produktquelltextänderung.

| Seed42/90 Tage | Kontrolle | Selbstgekaufter Frachter | 1 gedeckter Auftrag | 2 gedeckte Aufträge |
| --- | ---: | ---: | ---: | ---: |
| Echte NPC3-Frachter | 0 | 1 | 1 | **1** |
| Erste Lieferung Veldra→Cyris verkauft | – | **0/7** | **7/7** | **7/7** |
| Zweite Lieferung verkauft | – | – | **0/7** | **7/7** |
| Dritte Lieferung verkauft | – | – | – | **0/7** |
| Echtes Rechnungs-Ereignis | 0 | 0 | 1 | **2** |
| Meridian→Cyris aus tatsächlich vorhandenem Cash | 0 | 0 | 403 ISK | **816 ISK** |
| Medikamente hergestellt | 472 | 472 | 475 | **479** |
| Medikamente verbraucht | 644 | 644 | 647 | **651** |
| NPC3-Cash am Tag90 | 4.395 | 3.556 | 3.885 | **4.235** |
| Spieler-Cash am Tag90 | 39.762 | 39.762 | 39.762 | **39.762** |
| Zusätzliche B8g-Emission/-Vernichtung | 0 | 0 | 0 | **0** |

**[ECHTE QUITTUNGEN]** Der Originalkern kaufte für NPC3 **genau eine Frachterhülle `sh106` für 780 ISK**. Für jede der ersten zwei erfolgreichen Reisen bezahlte NPC3 per originalem `shipTrade` bei Veldra **7 Material, Kauf einschließlich Handelsgebühr je 167 ISK** und absolvierte echten `shipMove` bis zum Original-Ankunftstick. Runde 1: Kauf Tick 20.261, Ankunft Tick **20.287**, Käuferstations-Guthaben 10 ISK, Originalwarenwert **7×59=413 ISK**: genau **403 ISK** aus existierender Meridian-Kasse decken die fehlende Rechnung, **7/7 echter Verkauf**. Runde 2: Kauf Tick **20.314**, Ankunft Tick **20.340**, Käufercash 0 ISK: genau **413 ISK** aus existierender Meridian-Kasse, wieder **7/7 Originalverkauf**. **816 ISK** reale Gesamtausgabe bleibt unter dem Versuchslimit von **900 ISK**. Die zwei Quittungen sind an originale Käufe, konkrete Fracht, den exakten echten Ankunftstick und nachgewiesene tatsächliche Verkäuferlöse gebunden, nicht an Kassenstand oder Insolvenz als Auswahltrigger.

**[DRITTER HARTER GEGENBEWEIS]** Dasselbe Schiff kehrte zurück und kaufte **zum dritten Mal 7 Material für 167 ISK**, Ankunft in Cyris diesmal **ohne** neue Weltfinanzierung. Der echte Original-`entladen`-Versuch setzte **0/7** ab. Hier wurde die Finanzierung bewusst auf zwei Lieferungen beendet; eine selbsttragende Kassenauffüllung zum dritten Vollverkauf wurde nicht nachgewiesen. Die zusätzlich **7 produzierten und konsumierten Medikamente** über den ganzen 90d-Fall (`472→479` bzw. `644→651`) ändern die Grundversorgung nicht ausreichend: Ab Ende Tag14 gibt es im historischen Test keine kontinuierliche globale Zivilversorgung. Die vorhandenen Markt-/Stationsfonds wurden vom Originalkern weiter normal verarbeitet; z. B. steht Meridian am Tag90 wieder bei 2.500 ISK. **Das ist kein Beweis, dass das in die zwei Rechnungen geflossene Geld dauerhaft aus Exportgewinnen refinanziert wurde.**

**[ECHTE KOSTEN und NEGATIVE EINZELHANDELSRENDITE]** Im Zwei-Aufträge-Versuch weist der ursprüngliche Betriebsabrechnungsweg für genau `sh106` **682 ISK fällige und 682 ISK tatsächlich gezahlte Frachterbetriebskosten**, **0 ungedeckte Frachterarbeit** aus. Drei reale Einkäufe zu je **167 ISK inklusive Kaufgebühr** (=501 ISK), zwei echte Verkäufe zu je **413 ISK** (=826 ISK), insgesamt **50 ISK Handelsgebühren** bei Kauf/Verkauf (darin 18 ISK Kaufgebühren, die in den 3×167 bereits enthalten sind). Ein sauberer, *nicht doppelt gezählter* Betriebserfolg des Schiffs über die drei konkret geprüften Fahrten ohne Hülle und ohne Zeitwert der am Ende nicht verkauften Fracht lautet:

`826 ISK Verkaufsumsatz − 501 ISK Einkaufszahlungen − (50−18)=32 ISK Verkaufsgebühren − 682 ISK Schiffsbetrieb = **−389 ISK realisierter Geldsaldo**.`

Zusätzlich ist **780 ISK** reales Eigentümerkapital in den Frachterkauf geflossen; die Hülle bleibt an Tag90 jedoch vorhanden (nicht pauschal als vollständig verlorene Abschreibung behandeln). Die 7 nicht verkauften Materialeinheiten sind noch reale Handelsware mit einem später möglicherweise erzielbaren Wert. Die **NPC3-Gesamtkasse 4.395→4.235 ISK** ist **kein Schiffsrenditeausweis**: NPC3 betreibt zusätzlich viele Miner und erhält andere Originalkern-Zahlungen; daher die für `sh106` eigens beobachteten Vollkosten separat bewerten. B8d hatte diese allein dem spezifischen Schiff zuzuordnenden Kosten noch nicht in der ausgegebenen Bilanz getrennt.

**[SCHLUSSFOLGERUNG]** B8g schließt die *technische* Nachweislücke „ein original bezahlter Transport kann ein zweites Mal mit einem **neuen, echten Geldtransfer** verkaufen und Medizin herstellen“. Es schließt **nicht** die *ökonomische* Lücke „dieser Frachter verdient auf beiden Fahrten nach Vollkosten tatsächlich Geld“, **nicht** den selbstrefinanzierten dritten Verkauf und **nicht** den global stabilen Versorgungszyklus. Die Bedarfswahl ist zwar aus physischem Rezeptdefizit abgeleitet, aber nur für einen einzigen Stationstyp im Seed42 nachgewiesen; der einmalige Nutzer/Marktteilnehmer wurde **analyseseitig geskriptet** und nicht vom Spiel autonom ausgewählt. Keine Produktimplementierung freigeben.


## Bewertung / Freigabeschranken

**[NICHT FREIGEGEBEN]** Der Versuch ist *weder* eine endgültige globale Modell-B-Geldquelle *noch* eine genehmigte fortlaufende Weltauftrags-, Fonds- oder stationsbezogene Förderregel. Die Zahlung erfolgt aus vorhandenem neutrale-Stations-Cash und finanziert nur belegten Warenkauf bei Ankunft; trotzdem ist das temporäre Überweisen an eine einzelne ausgewählte Zielstation **kein generelles Produktdesign**. Falls ein zweiter Verkauf gelingt, bleibt insbesondere offen, wie das Budget nachhaltig refinanziert wird, woher die realen Nachfragerträge stammen, wie beliebige NPCs und Spieler bei transparentem Zugriff fair konkurrieren und wie echte Provenienz-IDs ausgestaltet werden. Im Produkt weiterhin **keine** Änderungen an `index.html`, Preise/Kosten, Schema, Regeln, Golden, Save, UI oder Spielerrechten. Kein Merge/Deployment ohne Freigabe.
