# B8i – Tatsächliche NPC-Handelsrouten, Frachterkosten und liquide Abnehmer

**[ANALYSE/DRAFT] 31.10.2026.** `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5 / Regel 14 / Schema 8. Einzige verbindliche Planung: [ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md). **Keine neue Wirtschaftsregel, kein geändertes `index.html`.**

## Anlass / Kausalfrage

[B8h Draft #68](https://github.com/tobiasfranziskus/Check/pull/68) belegte **+22 ISK je tatsächlich vollständig abgeschlossener Material-Handelsrunde Veldra↔Cyris**, aber keine dauerhafte Abnehmerliquidität ohne zwei zusätzliche, **aus bereits vorhandener Meridian-Kasse** gedeckte Realrechnungen. Daraus ist nicht abzuleiten, dass andere gehandelte Güter und Routen dieselben Margen haben. B8i betrachtet deshalb **keine** geskriptete NPC3-Hilfslieferung, sondern die tatsächlich im **unveränderten Core autonom** zustande kommenden Geschäfte der NPC1-/NPC2-Frachter, mit den echten Corekosten und dem **wirklich vorhandenen** Käufergeld an den jeweiligen Ankunftsterminen.

## Reproduzierbarer Versuchsaufbau

Vier Original-Core-Welten für Seed **42** und **7**, je aktive historische B1-7-Befehle-Spielerkrise und passive Welt, jeweils **90 reale Spieltage**, zweimal unabhängig deterministisch ausgeführt. Unveränderten Core über SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9` fixieren, historischen Seed42-90d-Spielerhash `784047684dfe5c56` und passiven Hash `adf155a018b94094` unabhängig kontrollieren. Node-only-Observation fügt Beobachter an vier Originalkern-Operationen an, ohne selbst Verkäufe, Flugrouten, Hüllen, Angebote oder Kassen zu verändern:

1. `m_core_handel.handel`: jeden **tatsächlich ausgeführten**, bezahlten Kauf/Verkauf von NPC1/2-Frachtern mit Warenmenge, Stations-ID, Preis und Gebühren protokollieren und dem originalen Einkaufslos zuordnen; unverkaufte Ladungen bleiben offen. Kein Versuch, aus einer bloßen Routenprognose einen bereits bezahlten Abschluss abzuleiten.
2. `m_core_ankunft.reise` / `m_core_stunde.betriebskosten`: wirkliche Flug-Arbeitsminuten und stündlich fällige/**tatsächlich bezahlte** Beträge aus den Originalabrechnungen erfassen; die ganzzahligen Stundenkosten allein im Beobachter proportional auf **beladene** und **leere** Flugminuten verteilen. Beladene Kosten werden auf die tatsächlich mitgeführten ursprünglichen Waren-Einkaufslose verteilt. Kosten der *leeren* Positionierungen bleiben **als eigenständiger Flottenkostenblock** stehen; sie dürfen nicht still als profitfreier Null-Aufwand behandelt werden.
3. `m_core_ankunft.ankunft`: vor realem `entladen` vorhandene Fracht, Zielstations-Kasse, tatsächlichen Core-Preis und freien Lagerraum beobachten und **danach** die vom Original-`handel` wirklich abgesetzten Mengen zählen. Ungedeckte Ankunft nach **Käufergeld** und **Lagermangel** gesondert führen; gemischte Fälle separat ausweisen. Die Zuordnung bezieht sich auf die **Original-Ankunft**, nicht jeden später im Dock wiederholten Handelsversuch.
4. Unabhängig und **stündlich** Geld- und Warenerhaltung vollständig nachrechnen, Originallader `audit` separat prüfen, Replay-Hashes auf Gleichheit kontrollieren, Save/Load per originalem `save/load` stichprobenartig wiederholen. Alle Testausgaben als CI-Artefakte sichern.

**Grenzen der Gewinnkennzahl:** Das berechnete `netLoaded` ist der **realisierte Netto-Verkaufserlös abzüglich tatsächlichem Einkauf, Original-Handelsgebühren und dem auf genau diese transportierte Ladung entfallenden beladenen Flug**. Es ist **kein vollständiger Unternehmensgewinn**, kein Rundfahrtprofit: Leere Positionierungs-/Rückflüge, Anschaffung/Abschreibung, unverkaufte oder verlorene Fracht, Personalkosten und Risikokosten fehlen in diesem Teilindikator ausdrücklich und werden, soweit tatsächlich angefallen, separat gezeigt. Teilverkäufe oder mehrfache Ziele werden nicht als eindeutige abgeschlossene Einzelfahrt ausgegeben.

**Grenzen der Engpassdiagnose:** Käufer-Cash am Ankunftsort ist nur eine **tatsächliche Momentaufnahme**; wenn `cash / preis` zu klein ist, kann eine später eintreffende Zahlung andere Verkäufe ermöglichen. Nur `kasse < preis` bei zugleich freiem Lager und 0 Stück Verkauf ist eine eindeutige **vollständige Käufergeldblockade** an genau diesem Zeitpunkt. Andere Fälle bleiben getrennt; eine einzelne Ankunft erklärt noch keinen ganzen 365-Tage-Kollaps.

## [TEST] Vier Originalwelten, echte Belege

**[CI #41248407707](https://github.com/tobiasfranziskus/Check/actions/runs/41248407707)**: nach Korrektur einer **falschen Prüfannahme** tatsächlich erfolgreich – **1/1 Job, 67/67 Standardtests, 0 Fehler/Skips**. Vier Originalwelten mit Seed42/7 je aktiv/passiv ×90 Tage je zweimal deterministisch abgespielt: **17.280 stündliche eigenständige Geld- und Warenaudits mit paralleler Replay-Hashkontrolle**, **32 Save/Load-Roundtrips**. Die ursprünglichen aktiven Seed42- und passiven Seed42-Hashes bleiben exakt `784047684dfe5c56` und `adf155a018b94094`. Der **erste Workflow #41248288834** hatte nach vier erfolgreichen Simulationen im separaten Prüfgate eine **falsche Erwartung „ungedeckte NPC-Arbeit = 0“** – die Originalwelt enthält dagegen **tatsächlich** Unterdeckung. Dies wurde nicht durch Verändern des Originalkerns, sondern durch getrenntes Bilanzieren von Kostenforderung und tatsächlicher Zahlung korrigiert.

### Echter, autonom ausgeführter Warenhandel

| Seed / Spielweise · 90 Tage | 42 passiv | 42 aktiv | 7 passiv | 7 aktiv |
| --- | ---: | ---: | ---: | ---: |
| Beobachtete physische Waren-Strecken-Kombinationen | 281 | 209 | 287 | 210 |
| Echte NPC1/2-Einkaufsladungen | **17.876** | **872** | **17.912** | **883** |
| Vollständig verkaufte Einkaufslose | **17.597** | **845** | **17.607** | **872** |
| Tatsächliche Ankünfte mit Handelsschiff-Fracht | **25.466** | **1.310** | **25.455** | **1.416** |
| Voll entladene Ankünfte | 17.405 | 831 | 17.405 | 856 |
| Ankünfte mit restlicher Fracht, Käufercash begrenzt | 2.106 | 239 | 2.046 | 297 |
| Ankünfte mit restlicher Fracht, Lagerraum begrenzt | 5.377 | 207 | 5.397 | 217 |
| Gemischte Beschränkungen | 578 | 33 | 607 | 46 |
| Fälliger Original-Frachterbetrieb | 2.685.261 ISK | 159.587 ISK | 2.690.249 ISK | 168.836 ISK |
| Tatsächlich aus Eigentümerkassen bezahlt | 2.684.312 ISK | 147.186 ISK | 2.689.040 ISK | 157.391 ISK |
| **Nicht gedeckter, im Original nicht nachbelasteter Betrieb** | **949 ISK** | **12.401 ISK** | **1.209 ISK** | **11.445 ISK** |

Die **Strecken-Kombinationen** zählen unterschiedliche `Quellstation→Verkaufsstation / Warenart`-Paare, **nicht** unabhängige direkt rückführende Rundfahrten, und Teilverkäufe an mehrere Stationen können vorkommen. Echte Käufer- und Lagerblockaden werden nur bei **Original-Ankunft mit noch restlicher Ladung** ausgewiesen, inklusive möglicher **Teilentladung**. `cash` ist eine nachweisbar finanzielle Begrenzung des Original-`aufnehmbar` zum Ankunftszeitpunkt, `storage` eine physische Lagerbeschränkung. Die Mengen dürfen nicht direkt zu weltweiten Endverbrauchsdefiziten addiert werden; dieselbe Ladung kann später mehrfach erneut anlaufen.

### Tatsächlich vorhandene Konzernfrachter: Die Nullhandelsphase hat keine handelnden NPC-Hüllen mehr

**[NACHGEREICHTER UNABHÄNGIGER CORE-STATE-BELEG]** Der Beobachter hat zusätzlich ab dem Originalzustand `state.ships` **jeden real noch vorhandenen NPC1-/NPC2-Frachter** pro Stichtag gezählt, getrennt von Besitzerkassen, Reiseauftrag und etwaigen alten Soll-Flottenplänen. Im letzten nachweislich erfolgreichen Testlauf [CI #41248517785](https://github.com/tobiasfranziskus/Check/actions/runs/41248517785) auf dem Runner mit Flotten-Zusatzdiagnostik ergibt sich:

| Nach Originalzustand vorhandene NPC1/2-Frachter | 42 passiv | 42 aktiv | 7 passiv | 7 aktiv |
| --- | ---: | ---: | ---: | ---: |
| Tag 7 | 5 | **1** | 5 | **0** |
| Tag 14 | 5 | **0** | 5 | **0** |
| Tag 30 | 5 | **0** | 5 | **0** |
| Tag 90 | 5 | **0** | 5 | **0** |

Seed42 aktiv: Am Tag7 ist nur noch **ein** Frachter von NPC2 vorhanden, NPC1 besitzt **keinen**; am Tag14 besitzen beide **keinen**. Seed7 aktiv: Schon am Tag7 haben beide **keinen**. Zugleich sind NPC1 und NPC2 bei aktivem Seed42/7 bereits Tag7 **0 ISK**, und Original-`stats.handel` steigt danach noch kurz durch andere Akteure bis Tag14, aber ab Tag14 nie wieder. Beide passiven Welten haben im gleichen Zeitraum dauerhaft **drei NPC1- und zwei NPC2-Frachter** mit vorhandener Handelstätigkeit.

**[KORRIGIERTE ENGPASSHIERARCHIE]** Damit ist die *unmittelbare* Nullhandelsursache **fehlende echte Händlerfrachterhüllen** nicht länger nur eine Hypothese, sondern für die beiden Seeds als Originalkern-Zustand **bewiesen**. Käuferkassen und mögliche Routenprofitabilität sind zusätzliche, getrennte Herausforderungen; ein neues Beschaffungsgeld für Wareneinkäufe allein erzeugt bei null vorhandenen Frachtern **keinen** physischen Handel. Nicht gezeigt ist in dieser Probe die konkrete Todesursache jeder einzelnen Hülle, die finanzielle oder materielle Blockade des genauen Ersatzkaufs oder ob eine wirtschaftlich rentable Hülle unter unveränderten Regeln neu aufgebaut werden könnte. **Nächster Prüfschritt muss den `m_core_kampf`-/`m_core_ersatzkauf`-Pfad pro Hülle, Originalwerft-/Fonds-Cash und Ressourcenvorrat rekonstruieren.**

### Kausal einschneidend: Ab Spieltag 15 keine autonomen Frachtergeschäfte mehr

| Nach den ersten 14 Tagen: Tage 15–90 | 42 passiv | 42 aktiv | 7 passiv | 7 aktiv |
| --- | ---: | ---: | ---: | ---: |
| Neue echte NPC1-/NPC2-Einkaufsladungen | **15.067** | **0** | **15.159** | **0** |
| Echte NPC1-/NPC2-Verkaufsereignisse | **20.227** | **0** | **20.352** | **0** |
| Mit Handelsschiff-Fracht real erreichte Stationen | **21.517** | **0** | **21.505** | **0** |
| Real abgesetzte Ware aus NPC-Frachterladungen | **402.167** | **0** | **406.907** | **0** |

**Diese Nullwerte sind keine Extrapolation:** Der Analyse-Observer hat jeden einzelnen ausgeführten `handel`, `reise` und `ankunft`-Tick der Original-NPC1/2-Flotte innerhalb aller **90×24×60** Simulationsminuten instrumentiert. Im aktiven Seed42 stehen seit Ende Tag7 NPC1- und NPC2-Konten bei 0 ISK, und am Tag90 immer noch 0; bei aktivem Seed7 sind ebenfalls beide ab Tag7 bei 0. Nach Tag14 gibt es keine echten weiteren NPC-Warenkäufe oder -verkäufe. Die passive Vergleichswelt hält dagegen über alle 90 Tage einen Handel aufrecht.

Die unabhängige Originalkern-Buchung `state.stats.handel` wird im aktiven Seed42 zwischen Tag14 und 90 exakt **4.881→4.881**, bei Seed7 exakt **5.190→5.190**; das betrifft sogar den **gesamten** im Original erfassten Warenhandel aller Akteure. Alle späteren Stunden haben daher auch keine gemessene weltweite Handelsaktivität (allerdings könnten weltweite `aussenhandel`-Automatik oder NPC-Restbestände davon separat bestehen; diese Zähler sind nicht mit zivilem Handel gleichzusetzen).

**[NICHT ALS GEWINN BEWEISEN]** Die Rohgewinnsummen tatsächlich abverkaufter NPC-Lose sind bei mehreren Waren-/Stationspaaren positiv: z. B. im passiven Seed42 bei Veldra→Cyris **Material** eine Teilbilanz von **+157.898 ISK** für vollständig verkaufte Lose **nach echten Warenkäufen, Verkaufsgebühren und zugeordneten tatsächlich bezahlten beladenen Flugkosten**; im aktiven Seed42 Orion→Veldra **Eis +1.722 ISK** und Dravos→Aldera **Silizium +5.445 ISK**. Die Brutto-Losbeiträge sind **keine** endgültigen Unternehmensgewinne oder garantierten Rundfahrtmargen: Hülle, mögliche Leerpositionierung, verlorene Waren, unrealisierte Bestände, risikoabhängige Sicherung und das temporär **ungedeckte** Schiffskosten-Soll fehlen in `completedNetLoaded`. Eine zweite Kennzahl `completedNetDueLoaded` rechnet die vollständigen, auch **nicht tatsächlich bezahlten** originalen Flugkosten dagegen und liegt in den aktiven Seeds **deutlich niedriger**.

**[ECHTE FRACHTVERLUSTE / OFFENE LÖSE]** Am Spielende stehen die zuvor real gekauften aber nicht vollständig verkauften Einkaufslose teilweise auf **nicht mehr vorhandenen Schiffen**: Seed42 passiv **269**, Seed42 aktiv **27**, Seed7 passiv **295**, Seed7 aktiv **11**. Das bedeutet, dass die betreffende ursprüngliche Fracht nicht als künftiger Verkaufserlös aus einer noch vorhandenen Händlerhülle behandelt werden darf; die genaue Zerstörungsursache wird aus dieser Beobachtung allein **nicht** als Piratenverlust etikettiert. Die Risiko- und Schiffserneuerungskosten sind folglich ein zusätzliches systemisches Problem und im Beitragsüberschuss einzelner abgesetzter Lose **nicht** vollständig eingepreist.

### Warum die falsche CI-Nullannahme wichtig war

Im originalen `m_core_stunde.betriebskosten` wird bei einem Frachter die Arbeit berechnet, aber `n = min(owner.cash, kosten)` als **tatsächliche Zahlung** verwendet. Bei nicht genügend Konzerncash verschwindet die Differenz aus der Forderung; es gibt keine zusätzliche Überziehung oder offenen Schuldbestand. Ein vermeintlich „profitables“ Ergebnis aus **bezahltem Aufwand** ist deshalb rechnerisch möglich, selbst wenn das Unternehmen die eigenen **fälligen** Betriebskosten gerade nicht deckt.

B8i weist daher beide Beträge aus und bewertet den Handelsmarkt **nicht** ausschließlich an tatsächlich aus der Kasse gezahlten Zahlen.

### Vorläufiges Diagnosefazit

**[BELEGT]** Unter dem vorhandenen Marktalgorithmus erfolgen autonome NPC-Lieferungen über zahlreiche verschiedene echte Strecken mit stellenweise positiven direkten Brutto-Losbeiträgen. Dass die Welt dennoch in der Spielerkrise **ab Tag15 auf allen NPC-Frachterstrecken vollständig stillsteht**, lässt sich nicht allgemein durch überall negative Warenpreisspreads erklären. Der Nullhandel ist zugleich mit **0 ISK NPC1/2-Kassen**, erheblicher unbezahlter Arbeit, offenen Frachterverlust-Losen und stationären Käufer-/Lagerbarrieren verbunden.

**[NICHT BELEGT]** Diese erste vierfache Seedprüfung trennt **noch nicht kausal**, welche Komponenten der Nullhandelsphase hauptsächlich zugrunde liegen: zerstörte Schiffshüllen, fehlender NPC-Eigenkassenbestand für neue Waren, Käuferstationen ohne Geld, Lagergrenzen oder nicht mehr produzierte Ersatzhüllen. Auch der Gedanke selbständig pachtender Piloten behebt diese Engpässe nicht automatisch. Ein einzelner positiver Streckenbeitrag darf nicht als kapitalfinanzierbarer Markt oder Freigabe einer neuen Geldquelle umgedeutet werden.

**[NÄCHSTES GATE / OPTION]** Zuerst die tatsächlichen NPC-Hüllen und die Kostenunterdeckung am Beginn der Nullhandelsphase tagesgenau gegen die Original-`ersatzkauf`- und `fonds`-Pfade prüfen. Anschließend vorfinanzierte Nachfrage und Vollkosten auf genau einem wiederholbaren, offenen Marktweg testen – **ohne** individuelle Insolvenzrettung, Gratisfrachter oder pauschale ISK-Emission. Keine Preis-, Fonds-, Pilotengehalts-, Pacht- oder Geldmechanik in diesem Analyse-PR ändern.

## [OPTION] Folgerungen und Gates

Bei positiver tatsächlicher Zwischenstations-Marge **und** beobachteten Nullverkäufen trotz freiem Lager wäre die Abnehmerliquidität ein gesondertes Kausalhindernis, kein Beleg für zu niedrige Händler-Spreads. Bei systematisch negativem beladenen Beitrag oder hohen realen Leerflugkosten würde die bestehende Routenwahl das Kernproblem mitverursachen. Vor irgendeiner Preiskorrektur oder Geldemission müssen diese Ursachen quantifiziert und getrennt werden. **Keine** individuelle Konkursrettung, keine Spielersteuer, kein Kredit-/Pacht-/Pilotengehalt, kein neuer Geldschöpfungsmechanismus in B8i.

Weder 13 Seeds ×90 Tage noch vier 365-Tage-Spielerkrisen, konkrete unabhängige Lieferverträge, echte iPad-/NAS-Abnahme, globaler Herkunftsnachweis oder Merge/Deployment sind durch diesen kleinen Analyseversuch abgegolten.
