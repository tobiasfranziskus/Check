# B-K11 – Prüfprotokoll und Wirtschaftsgrenzen

**[DRAFT / ANALYSE · 02.11.2026]** [PR #137](https://github.com/tobiasfranziskus/Check/pull/137), unabhängig auf main `b4e604d6`, Produkt weiterhin 14/8. Architektur, Hilfskonstruktionen und ausstehende Produktentscheidungen: [BK11_WIRTSCHAFTSKERN](BK11_WIRTSCHAFTSKERN.md).

## Reproduzierbare Prüfung

Node.js 22.23.4, keine neuen Abhängigkeiten:

```sh
node --test tests/*.test.mjs
node --test --experimental-test-isolation=none tests/*.test.mjs
node tools/bk11-wirtschaft.mjs --suite=standard --out=/tmp/bk11-standard-90.json
node tools/bk11-wirtschaft.mjs --suite=crises --out=/tmp/bk11-crises-90.json
```

Falls die Sandbox Kindprozesse verbietet, zuerst `git show b4e604d6:index.html > /tmp/bk11-main-index.html`, dann `--baseline=/tmp/bk11-main-index.html` übergeben. Das Werkzeug prüft den SHA-256 des vollständigen Original-HTML (`7ee2d3786dece413bcea7152b64ea7ed5218f2ec68c9001c10c0fe7f987e33f5`). `--seed=42 --days=3` ist nur ein kurzer Diagnoselauf; kein Ersatz für die Abnahme.

**Varianten:** `product` = aktueller Default14/8, stündlich bitidentisch gegen Original-main; `candidate` = expliziter Finanzierungskern15/9 ohne neue Lohn-/Konsumannahme; `candidate-no-rescue` = derselbe Kandidat, nur der bestehende individuelle NPC-Leerflottenzuschuss in einer testseitig kompilierten Kopie ausgeschaltet. Kein entsprechender Produkt-Schalter oder Regelwechsel.

**Standardwelt:** die 13 vorhandenen Seeds7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159, jeweils 90 Tage, alle drei Varianten, je ein unabhängiger Replay. Originalbestände, NPCs, Produktion, Fonds und Risiken bleiben aktiv.

**Vier aktive Strategien ab Spielstart, je 90 Tage und drei Varianten:** Miner/42 fördert mit Startminer Erz und spart; Handel-Flotte/42 zusätzlich Original-Autohandel des Spielerfrachters; Station/1234 kauft die lokale Station erst bei real gedecktem Kaufpreis; Jagd/98765 kauft/aktiviert tatsächlich bezahlte Jäger und schickt sie nach Dravos zur Originaljagd. Nur vorhandene validierte Commands, keine Bestandslöschung oder künstliche Gutschrift. Die Politik ist zwischen Varianten gleich, die tatsächlich finanzierbaren Befehlszeitpunkte können abweichen. Innerhalb jedes Replays ist die Befehlsfolge identisch und wird gespeichert. Das sind neue Startkrisen, keine Replikation historischer B1-Tag90-Snapshots.

**Unabhängige Audits:** freie Konten plus offene Reserven gegen `initialSupply+minted−burned`; jede Warenmenge gegen die sechs Original-Ledgerfelder; alle beobachteten Reservierungen/Zahlungen/Erstattungen gegen offene Verträge und Archiv. Händler-FIFO aus realen Einkaufsbuchungen gegen physische Fracht; realisierter Beitrag gegen Kassenfluss, Lagerkosten, Verlustkosten und aktivierte Assets. Core-Audit zusätzlich. Stundenweise Replay-Hashes, tägliche Save/Load-Fortsetzung beider Welten; keine neuen Frachterreisen ohne Finanzierung.

## Messdefinitionen

- **Deckungsbeitrag:** Verkaufserlös minus Verkaufsgebühr minus FIFO-Einstand verkaufter Waren (einschließlich Kaufgebühr) minus alle bezahlten Frachterflüge, einschließlich Leerflügen. Noch keine volle Konzernrendite oder bezahlte Fabrikkette. Verlorene Frachtkosten werden gesondert abgezogen.
- **Kassenfluss nach Hüllen:** tatsächlich eingegangene Warenzahlungen minus sämtliche Wareneinkäufe/Gebühren/Flüge und tatsächlich bezahlte Ersatzhüllen. Enthält Kapitalbindung; kein Periodengewinn.
- **Kapitalbindung:** unbezahlte Escrow-Reste und reale FIFO-Frachtkosten; separate Spitzen-/Stundenwerte. Keine erfundenen historischen Anfangslagerwerte.
- **Ersatzfähigkeit:** freie Konzernkasse / aktueller Hüllenkaufpreis inklusive Gebühr und tatsächlicher Werftbestand; tatsächliche Ersatzkäufe und bezahlte Preise separat. Keine garantierte Hülle, Reservepolitik oder angenommene Lebensdauer.
- **Versorgung/Gesamtwirtschaft:** wirklicher Nahrungs-/Medizinverbrauch, alle Mangelstunden, Stationskassen, Silizium/Bauteile und Hüllenproduktion, Verluste, gezielte Zuschüsse sowie bestehendes `minted`/`burned`. Bezahlte und fällige Betriebsarbeit für alle Akteure gemeinsam.

## Ausgeführter Stand

Lokale Standardprüfung am Code `cc2f7aaf`: **81/81 Einzeltests bestanden, 0 Fehler, 0 übersprungen, 0 TODO** (67 bestehende + 14 B-K11). Der vorgeschriebene Aufruf ohne `--experimental-test-isolation=none` meldet unter dieser Sandbox neun erfolgreiche Dateisuiten; der zweite Aufruf weist die Einzeltestzahl aus. Die abschließende Ladevalidierung ist darin enthalten. [Regressions-CI 41516054093](https://github.com/tobiasfranziskus/Check/actions/runs/41516054093) vollständig erfolgreich: Node 22 ebenfalls 81/81, sieben erfolgreiche Jobs, Sicherheitsgeografie bestimmungsgemäß übersprungen; v10 nur Skip-Zweig, kein v10-Langlauf. Historische Referenzjobs sind keine Kandidatenabnahme.

14 B-K11-Gruppen: Defaultabgrenzung, echte 25-Minuten-Fahrt mit 100 ISK tatsächlicher Zahlung aus 105 ISK Reserve, unveränderter Zustand bei Unterfinanzierung, geteilte Stundenrechnung 41+58=99, Halten, Originalverlust, gekaufte/angelieferte Nahrung mit zwei bezahlten Flügen, NPC-Abflug und erfolglose Angebote, beschädigte Fahrtverknüpfungen, 13 Seed-Replays, realer Werftkauf plus finanzierte Heimatreise, Migration mit laufendem Altflug/Queue, Fremdformat-/Bilanzabwehr und 140 wirkliche Flüge mit Summenarchiv. Die Umverteilung vorhandener Anfangskassen im Archiv-Belastungstest ist eine explizite Testhilfe, kein Ertragsnachweis.

## Aktive Krisen: Technik bestanden, nachhaltiger Betrieb nicht erreicht

**12 × 90 Tage plus zwölf unabhängige Replays erfolgreich:** vier Strategien × drei Varianten, **25.920 stündliche Audit-/Replaypunkte und 2.160 tägliche Save/Load-Fortsetzungen**. [B-K11-CI 41516054181](https://github.com/tobiasfranziskus/Check/actions/runs/41516054181), Job `wirtschaft (crises)` erfolgreich. Das heruntergeladene CI-Artefakt `bk11-crises-90d` ist in allen zwölf Ergebnisobjekten vollständig identisch zum lokalen Lauf, einschließlich aller Tageshashes, Beiträge und Ereignisdigests. Der lokale Lauf wurde vor der letzten Schema8-Korruptionsabwehr gestartet; die CI bestätigt den finalen Code.

| Aktive Strategie | Produkt: Frachter / Mangelstunden | Kandidat: Frachter / Mangelstunden | Kandidat: NPC1 / NPC2 freie ISK | Tatsächlicher Hüllenpreis inkl. Gebühr / Werftbestand |
| --- | ---: | ---: | ---: | ---: |
| Miner42 | 0 / 35.798 | 2 / 36.024 | 55 / 124 | 780 / 2 |
| Handel-Flotte42 | 0 / 36.393 | 3 / 37.067 | 59 / 27 | 780 / 2 |
| Station1234 | 0 / 35.834 | 2 / 35.988 | 50 / 948 | 1.404 / 0 |
| Jagd98765 | 0 / 33.699 | 4 / 31.300 | 47 / 59 | 1.404 / 0 |

Frachter/Kassen beziehen sich auf NPC1+NPC2; Mangelstunden auf die ganze Welt und alle erfassten Waren. **Keines der acht NPC-Händlerkonten deckt am Ende eine Ersatzhülle.** In Station/Jagd fehlt zusätzlich die physische Werfthülle. Silizium und Bauteile in Aldera am Endpunkt jeweils 0. Mehr erhaltene Hüllen reichen nicht: **Beide Händler haben in allen vier Kandidatenkrisen von Tag 61–90 genau 0 zusätzlichen Deckungsbeitrag.**

| Kandidat, NPC1+NPC2 zusammen | Realisierter Handelsbeitrag nach allen bezahlten Flugkosten | Davon verlorene Frachtkosten | Tatsächliche Hüllenauszahlungen | Frachterverluste / Ersatzkäufe | Maximale gesamte Flugreserve |
| --- | ---: | ---: | ---: | ---: | ---: |
| Miner42 | 145.967,41 | 93,41 | 6.240 | 11 / 8 | 1.095 |
| Handel-Flotte42 | 54.663,89 | 770,89 | 7.020 | 11 / 9 | 1.214 |
| Station1234 | 117.294,19 | 267,19 | 15.288 | 21 / 18 | 1.002 |
| Jagd98765 | 198.684,10 | 1.119,10 | 14.352 | 19 / 18 | 1.015 |

Alle Geldwerte ISK. Beiträge sind kumulierte Bruttobeiträge des Handels über 90 Tage; sie sind **keine freie Konzernkasse**, keine vollständig bezahlte industrielle Wertschöpfung und kein garantierter Rücklagenbestand. Die bestehende Überschussabgabe `npcAusgaben`, Fondsverteilung und spätere Spielerakkumulation laufen weiter. Es können hohe frühe Handelsumsätze/-beiträge und am Ende trotzdem fast leere Händlerkassen entstehen. Die Endpunkte und der Nullbeitrag der letzten 30 Tage verhindern die falsche Interpretation als dauerhafte Ersatzrendite. Fracht-Einstandswert am Endpunkt in diesen vier Händlerfällen jeweils 0; die mittlere stündliche globale Flugbindung beträgt 1,23/0,87/1,13/1,17 ISK, weil die Wirtschaft lange stillsteht.

**Alle fälligen NPC1/2-Flugkosten werden im Kandidaten tatsächlich bezahlt.** Trotzdem bleibt die Sicherheitsarbeit erheblich ungedeckt: je Welt 540.000 ISK tatsächliche tarifliche Sollkosten, bezahlt 9.680/9.680/8.600/6.200 ISK (Miner/Handel/Station/Jagd). Das ist keine neu gebuchte Schuld, sondern fehlende Bezahlung bei fortgesetzter Arbeit. Die globale Finanzierungsaufgabe ist damit offen.

**Versorgung zusammen mit Verlusten:** Im Handel-Flotte-Fall sinkt der90-Tage-Verbrauch Nahrung 2.577→1.988 und Medizin 751→570, während mehr Frachter überleben. Im Jagdfall steigt Nahrung 8.302→13.639, Medizin 994→1.266; an Tag 61–90 noch 3.600 Nahrung, aber 0 Medizin. In Miner/Handel/Station werden während dieser letzten 30 Tage weder Nahrung noch Medizin konsumiert. Kein pauschales „alles besser“ aus einzelnen Flottenzahlen.

**Fonds-Gegenprobe:** In allen vier Kandidatenfällen bleibt der individuelle Zuschuss bei 0; Ausschalten des Original-Zuschusspfads ist jeweils bis zu jedem Tageshash und allen Ergebnisdaten identisch. Im Produkt-Stationsfall werden dagegen 1.147 ISK tatsächlich aus vorhandenen Fonds an leere Flotten übertragen. Der Kandidat schafft keine neue Garantie und entfernt die Bestandsregel nicht. Eine allgemeine Unwirksamkeit oder Entbehrlichkeit der Bestandsstütze folgt aus diesen vier Fällen nicht.

## Passive Standardwelt: Versorgungsregression trotz weniger Verluste

**Lokal und CI: 39 × 90 Tage plus 39 unabhängige Replays erfolgreich:** 13 Seeds × drei Varianten, 84.240 stündliche Audit-/Replaypunkte und 7.020 Save/Load-Fortsetzungen. Alle 13 Defaults sind stündlich bitidentisch zum gepinnten main; der historische Gesamtwert 791 Mangelstunden wird unabhängig reproduziert. Auch das Standard-CI-Artefakt wurde heruntergeladen: alle 39 Ergebnisobjekte einschließlich Tageshashes, Margen und Ereignisdigests sind vollständig identisch zum lokalen Lauf.

| Summe über 13 getrennte Welten | Produkt 14/8 | Kandidat 15/9 | Gegenlauf ohne Individualstütze |
| --- | ---: | ---: | ---: |
| Mangelstunden, alle erfassten Waren | 791 | **6.620** | 6.620 |
| Wirklicher Nahrungsverbrauch | 476.215 | 466.623 | 466.623 |
| Wirklicher Medizinverbrauch | 168.693 | 168.443 | 168.443 |
| Bezahlte NPC1/2-Flugkosten, ISK | 34.860.878 | 13.956.808 | 13.956.808 |
| Frachterverluste / wirklich bezahlte Ersatzkäufe | 2.058 / 2.058 | 1.121 / 1.121 | 1.121 / 1.121 |
| Auszahlungen für diese Hüllen, ISK | 1.609.296 | 876.252 | 876.252 |
| Handelsbeitrag nach Flugkosten, ISK | 67.418.203,47 | 53.736.112,34 | 53.736.112,34 |
| Davon zusätzlicher Beitrag Tag 61–90, ISK | 22.428.402,79 | 17.923.833,92 | 17.923.833,92 |
| Ungedeckte tarifliche Arbeit aller Akteure, ISK | 5.418.050 | **6.529.720** | 6.529.720 |
| Darin ungedeckte NPC1/2-Frachterarbeit, ISK | 16.090 | **0** | 0 |
| Individuelle Fondsstütze, ISK | 0 | 0 | 0 |

**Alle 13 Kandidatenseeds haben mehr Mangelstunden als ihr Kontrollseed.** Jeweils fünf Händlerfrachter bleiben vorhanden, Ersatzkäufe entsprechen den Verlusten, und die Händler erzielen auch in den letzten 30 Tagen positive Beiträge. Das beweist wiederholten tatsächlich bezahlten Handel unter den weiterhin unentgeltlichen Fabrik-/Konsumregeln von main, keinen voll finanzierten industriellen Ersatzkreislauf. Der neue Finanzierungstakt und die gebundene Liquidität verändern Handelswege, Durchsatz und Risikobelastung. Die vererbte Sperre bis zum Stundenabschluss ist ein konkreter Kandidat für einen gesonderten Ursachenvergleich; ihre Alleinursächlichkeit für die gesamte Verschlechterung ist nicht isoliert bewiesen.

**Entscheidung: keine Produktaktivierung empfehlen.** Die technische Integrationsgrenze des deaktivierten Bausteins ist eingehalten, das Wirtschafts-/Versorgungsgate ist ausdrücklich negativ. Ein kleiner Folgeversuch darf nach D1-Freigabe mehrere gespeicherte Fahrtsegmente bis zur einmaligen Stundenabrechnung statt einer Durchsatzsperre untersuchen; Tarif, Rundung, Empfängerfonds und Restfreigabe müssen dabei explizit geprüft werden. Keine frühere Gratisabrechnung oder pauschale Preis-/Lohn-/Nachfragereform daraus ableiten.

Vorzeitige/abgebrochene Entwicklungsläufe sind keine Abnahme. Eigenes B-K11-CI lädt Ergebnis-Rohdaten als Artefakte hoch; das flüchtige Transaktionsjournal wird durch Ereignisanzahl/-digest und beobachterseitige Bilanzen belegt, nicht vollständig als Einzelbelegdatei exportiert.

## Abschluss, Provenienz und Entscheidung

**81/81 Tests und beide Workflows vollständig erfolgreich**, Codecommit [`cc2f7aaf`](https://github.com/tobiasfranziskus/Check/commit/cc2f7aaff2b69659e470515f3ee12eeaeac65a60). [B-K11-Langlauf41516054181](https://github.com/tobiasfranziskus/Check/actions/runs/41516054181): zwei erfolgreiche Jobs, kein übersprungener Job. Zusammen **51 × 90 Tage + 51 unabhängige Replays, 110.160 stündliche Audit-/Replaypunkte, 9.180 Save/Load-Fortsetzungen**, keine fehlgeschlagene oder ausgelassene Variante. Alle CI-Ergebnisobjekte stimmen vollständig mit den lokalen Ergebnissen überein. Danach nur Berichte/Status und die verdichtete Ergebnisdatei geändert; kein weiterer Produkt-/Testcode.

[Verdichtete Ergebnisse aller 51 Welten](data/bk11-90d.jsonl): erste Zeile Provenienz, danach je Welt eine Zeile mit Seed, Variante, Hash, Cash, Waren-/Flotten-/Beitrags-/Kosten-/Verlustkennzahlen und Ereignisdigest. FIFO-Bewertung anteilig aus realen Einstandszahlungen; Tabellen runden erst die Summen auf zwei Dezimalstellen. Tatsächliche ISK-Buchungen bleiben ganzzahlig. Vollständige Tageshashes und Checkpoints in den CI-Artefakten:

- `bk11-standard-90d`, ID 13177066006, ZIP-SHA256 `317de6b6fd1744495c9670b167611c2b8464ba78850b69e07b8f2228ec68293f`.
- `bk11-crises-90d`, ID 13175670993, ZIP-SHA256 `2fe59bc99777783522f8874189561c7d51e624751d03fd5f9fd04de31600d491`.
- Core-Quellen-SHA256 `44d3b1cd5f712b12497241a70016c53aacc75c64cb4b30508f5278f2c7c62490`, Beobachter-SHA256 `0fdee0b26b59cf8a287c50825bfc25a56af0aa16553efd1be6a366341d55a2b5`.

**Wirtschaftsgate negativ, keine Aktivierungsempfehlung.** Kleine, prüfbare Integration ist technisch vorbereitet, der nachhaltige finanzierte Neubau-/Folgeleistungs-/Ersatzkern bleibt durch die benannten Produktentscheidungen und die gemessene Versorgungsregression blockiert. Die acht Entscheidungen D1–D8 stehen in der [Architekturvorlage](BK11_WIRTSCHAFTSKERN.md). Der PR bleibt Draft, main bleibt 14/8. Kein Merge oder Deployment.

**Offen:** reale iPad-Safari-/Touch-/Speicher-/NAS-Abnahme, historische 275-Tage-B1-Fortsetzungen, voll bezahlte Herstellungs-/Endnachfragekette und wirtschaftlich tragfähiger Ersatz nach real finanziertem Neubau. Keine globale Wirtschaftssanierung oder Freigabe aus grünen technischen Tests ableiten.
