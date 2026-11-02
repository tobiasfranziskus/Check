# B-K10a – Konkurrenzprognosen und echte Absatzflugkosten getrennt prüfen

**[ANALYSE/DRAFT, 02.11.2026]** Aufeinander aufbauender [Draft-PR #118](https://github.com/tobiasfranziskus/Check/pull/118) nach #117 → #116 → #115 → #114 → #113 → #112 → #111 → #110 → #109 → #108. **[MAIN]** unverändert `b4e604d6` (v0.12.5, Regel14/Schema8). Dieses Paket verändert ausschließlich ein neues Testskript und einen Bericht, **nicht** `index.html`, Spielregeln, Save/Load, Preis-/Lohn-/Rezeptmodelle oder Emissionen.

## Ausgangsbefund und zwei überprüfte Ursachen

B-K9z dokumentiert 26 tatsächlich bezahlte Zielpositionierungen in zwei aktiven Sechs-Tage-Welten: 8 erreichen keinen nachfolgenden Warenkauf, 17 eingekaufte Einheiten in Seed42 sind zunächst noch nicht verkauft. Der nach **originalen Flug-Vertragsnummern** konsolidierte Zahlungsstrom der mit Neuplatzierung erschlossenen Losketten beträgt **−728/−723 ISK** (Seed42/7), selbst nach weiteren Warenverkäufen. In der ursprünglich verwendeten `bestesPaar`-Vorhersage wird nur ein zukünftiger Preis-Spread mit Handelsgebühren und kalkulierten Flugkosten bewertet; die **spätere reale** Verkäuferwahl `besterAbsatz` favorisiert den Warenverkaufserlös je Reisezeit und zieht reale Flugkosten bisher nicht explizit von der Bewertung ab. Darüber hinaus können andere Frachter derselben NPC-Handelsflotten dieselbe nicht exklusiv verfügbare Quelle ansteuern.

### Testanordnung (kein Produktbeschluss)

Alle Welten nutzen Original-Core-Regel15-/Schema9-Kandidaten mit 4 ISK/min rein **analytisch** gewähltem Fabriklohn und bestehender Draft-Variante eines bezahlten neuen Haushaltskonsums. Autohandel, übrige Schiffe, Sicherheit, Piraten, echte Werftfonds-Zuschüsse, Originalpreise und ursprüngliche Geldquellen/Senken bleiben aktiv. Die automatische allgemeine Stationsfonds-Mindestauffüllung bleibt wie in B-K9u–z **kontrolliert deaktiviert**. Ein vorhandener individueller Zuschusspfad wird weder neu erschaffen noch herausoperiert.

Sechs Varianten je Seed42 und Seed7 über jeweils **sechs Spieltage**:

1. Original-Routenwahl einschließlich zufälliger Leerpositionierungen.
2. B-K9x mit Hin-/Rückflug-Kalkulation **ohne** Leerpositionierung.
3. B-K9y kosten- und liquiditätsgeprüfte **gezielte** Leerpositionierung, aber noch ohne die folgenden zwei zusätzlichen Änderungen.
4. **Konkurrenzprüfung isoliert:** Vor gezielter leerer Anfahrt eine aktuell laufende Reise zu derselben Quellstation und prognostizierten Ware erkennen und diese Kandidatur ausschließen. Der Test merkt sich nur flüchtige Anfahrtsclaims, keine für Save/Load geeignete Produktreservierung; er **reserviert weder Waren noch den zukünftigen Absatzmarkt**.
5. **Absatzflug-Kostenprüfung isoliert:** Nach realem Warenkauf im originalen `besterAbsatz` für NPC1/NPC2 den Nettoverkaufserlös **nach Original-Flugstundenkosten** bewerten, keine Fahrt mit nicht positivem Ziel-Nettoerlös wählen. Der Warenkaufpreis ist jetzt bereits bezahlt und deshalb für diese *nachgelagerte Entscheidung* ein sunk cost; daraus folgt ausdrücklich **kein** vollständiger Handelsgewinn.
6. **Beides zusammen:** Konkurrenz-Voraussicht plus Absatzflug-Kostenprüfung, um Wechselwirkungen und mögliche Versorgungsverluste sichtbar zu machen.

Jede bezahlte Leerfahrt benutzt weiterhin die originale atomare Vertragsreserve; spätere Warenverfügbarkeit, Warenkauf, Verkaufsfinanzierung und Rückfahrt werden vor der Leerpositionierung nur vorausberechnet und nicht still reserviert. Die `marktKonflikte`- und `absatzNichtDeckend`-Zähler zählen **Kandidaten-/Bewertungsereignisse**, nicht einzigartige Frachter oder abgeschlossene Transaktionen.

## Ergebnisse – nach sechs Tagen, tatsächlich bezahlte Wirtschaftsbewegungen

| Seed42 | Original | Ohne Leer | B-K9y gezielt | Konfliktprüfung | Absatzprüfung | Beides |
|---|---:|---:|---:|---:|---:|---:|
| Bezahlter neuer Nahrungsverbrauch (Einheiten) | 185 | 214 | 234 | 234 | **236** | **236** |
| Kumuliert fehlende Nahrung (Einheiten) | 2.061 | 2.008 | 2.013 | 2.013 | **2.011** | **2.011** |
| Freie NPC1+NPC2-Kasse (ISK) | 528 | 7.726 | 5.732 | 6.832 | 6.247 | **7.073** |
| Wirklich bezahlte NPC-Frachterflugstunden (ISK) | 10.154 | 3.075 | 5.003 | 4.414 | 4.580 | **4.102** |
| Waren-Zahlungsstrom nach Gebühren und Flug (ISK) | −5.202 | +2.075 | +164 | +1.256 | +658 | **+1.397** |
| Gezielte Leerstarts | — | 0 | 14 | 10 | 13 | 10 |

| Seed7 | Original | Ohne Leer | B-K9y gezielt | Konfliktprüfung | Absatzprüfung | Beides |
|---|---:|---:|---:|---:|---:|---:|
| Bezahlter neuer Nahrungsverbrauch | 134 | 202 | 234 | **207** | **239** | **207** |
| Kumuliert fehlende Nahrung | 2.115 | 2.020 | 2.013 | 2.040 | **2.008** | 2.040 |
| Freie NPC1+NPC2-Kasse (ISK) | 35 | 8.604 | 7.052 | 7.288 | **7.920** | 7.495 |
| Wirklich bezahlte NPC-Frachterflugstunden (ISK) | 12.204 | 3.322 | 4.888 | 4.915 | **4.099** | 4.583 |
| Waren-Zahlungsstrom nach Gebühren und Flug (ISK) | −6.558 | +2.866 | +1.384 | +1.691 | **+2.252** | +1.898 |
| Gezielte Leerstarts | — | 0 | 12 | 13 | 10 | 13 |

**Grundsätzlich:** Diese Händlerzahlungsströme enthalten erhaltene Waren, noch nicht abgeschlossene Verkäufe und ggf. Hüllenkäufe. Sie sind **keine** voll bewerteten Händlergewinne, erst recht kein globaler Wirtschaftsüberschuss. NPC-Händlerkassen sind ebenfalls keine Weltwohlstandsgröße; Geld kann in Stationskassen, Fonds und Haushaltskonten verbleiben. `minted/burned` können zwischen Varianten durch vorhandene Sicherheits- und Senkenereignisse differieren, ohne dass hier eine neue Geldregel eingeführt wurde.

### Interpretation und Ursachenbewertung

- **[ANALYSE NEGATIV] Konkurrenz-Vermeidungsregel als pauschales Gate:** In Seed42 bleiben Nahrungsverbrauch und kumulierter Mangel gegenüber B-K9y identisch, bei höherer Liquidität; in Seed7 **fällt** bezahlte Nahrung um 27 Einheiten (234 → 207), und der Mangel steigt um 27 (2.013 → 2.040). Die beiden Varianten mit Konkurrenzsperre erzeugen in Seed7 trotz mehr frei verfügbarem Geld **weniger** Versorgung. Ein Produkt-Merge dieser Sperre wäre nicht gerechtfertigt.
- **[ANALYSE POSITIV ALS KANDIDAT, KEINE PRODUKTREGEL] Tatsächliche Flugkosten am Absatz:** In **beiden** Seeds werden real bezahlte Flugstunden reduziert und freie Händler-ISK erhalten; dennoch steigt tatsächlich bezahlter neuer Nahrungsverbrauch von 234 auf **236/239** und sinkt die kumulierte Unterdeckung geringfügig. Dies ist der bisher sauberste **kleine kausale Dispositionsansatz** ohne zusätzliche ISK, aber nur über zwei Seed-Welten und sechs Tage.
- **[ANALYSE NEGATIV] Addition beider Mechaniken ist keine allgemeine Verbesserung:** Die Kombination bewahrt Seed42-Versorgung, reproduziert aber in Seed7 den 27-Stück-Versorgungsrückgang der Konkurrenzsperre. Teiloptimierungen sind nicht additiv; keine „beide zusammen“-Freigabe.
- **[OFFEN]** In **allen** 12 aktiven Simulationswelten haben zum Ende sechs von sechs Verbrauchsstationen weiterhin Nahrungsmangel. Auch in der besten getesteten Variante gibt es **keine** tragfähige Gesamtwirtschaft.

Die Zahl der im Code gezählten abgewiesenen Absatzkandidaten (z. B. 2.010/904 in Seed42/7 in der Einzel-Absatz-Variante) sind **wiederholte Bewertungen**, keine eigenständigen verlorenen Handelsfahrten oder 2.010/904 gezahlten ISK.

## Nachweismethode, Kompatibilität und Grenzen

- Neues Testfile: `tests/bk10a-konkurrenz-absatzdeckung.test.mjs`; alle Modifikationen ausschließlich via `new Function` auf isolierte Textkopien des Original-Cores. Die Originalvariante wird für 120 Ticks mit dem nicht instrumentierten Core auf identische Hashes geprüft.
- Je aktivem Simulationslauf stündlich freie Eigentümerkassen **plus vertragliche Reserven** gegen `initialSupply + minted − burned`; zusätzlich Original-Core-Waren- und Herkunftsaudit, täglich Save/Load-Hash, Wiederholungsreplay Seed7 × zwei Tage. Keine neue Abhängigkeit oder Runtime-Datei.
- [Erster Code-Head `46a7a7c` CI #41441138988](https://github.com/tobiasfranziskus/Check/actions/runs/41441138988): Node.js 22 **132/132 Tests bestanden**, 0 fehlgeschlagen. Ein Folge-Testcommit ergänzt ausdrückliche Assertions, die die positive Einzel-Absatz-Kausalprobe und den negativen Seed7-Konkurrenzbefund absichern; dessen eigenen Workflow **separat prüfen**.
- **Nicht durchgeführt:** iPad-/NAS-Realtest, 13×90d-/365d-Regel15-Stresstest, Langzeit-Kaufkraft-Audit und ganzheitlich chargengenaue Produktions-/Händler-/Schiffs-Konsolidierung. Historische v10–v14-Referenzjobs sind dafür kein Ersatz.
- **Save-Risiko:** Das Konkurrenz-Experiment verwendet ein flüchtiges `__claims`-Array außerhalb des Spielstandes. Es ist **nicht** zwischen Save/Load fortsetzbar und darf ausdrücklich **nicht** in Produktcode übernommen werden. Die reine Absatzprüfung benutzt keinen solchen Claim-Speicher und ändert keine bestehenden Datentypen.

## Empfehlung und nächstes Gate

**B-K10b [ANALYSE/OPTION]:** **Ausschließlich** den isolierten, ohne flüchtige Claims lauffähigen `besterAbsatz`-Kostenvergleich über weitere Seeds und längere zusammenhängende R15-Szenarien prüfen. Neben bezahltem Endverbrauch auch Kassen, erneute Einkäufe, unerledigte Fracht, Schiffsersatz, echte Flug-/Produktionskosten, Geldsenken und fehlende Nahrung **zusammen** messen. Kein automatischer Vermerk „stabil“, solange alle sechs Stationen Mangel haben. Erst bei belastbarem Nettoerfolg eine minimale produktive Dispositionsregel **zur ausdrücklichen Freigabe** vorlegen. **Keine** Lohn-/Preis-/Emissionsreform, keine Individualrettung, kein Merge.
