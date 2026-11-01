# B-K9d/B-K9e – Originalproduktion und 90-Tage-Pilot (getrennte Beweisstücke)

**01.11.2026 · [ANALYSE/DRAFT] [#96](https://github.com/tobiasfranziskus/Check/pull/96) → [#97](https://github.com/tobiasfranziskus/Check/pull/97). KEIN PRODUKT-MERGE.**

**[MAIN]** `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5 / Regel14 / Schema8, unverändert. Die beiden reinen Analyse-PRs basieren auf Produkt-Draft [#95](https://github.com/tobiasfranziskus/Check/pull/95) (explizit testaktiviertes Schema9/Regel15), welcher auf #94 und #93 gestapelt ist. Weder auf `main` noch im regulären Regel14-Spiel erfolgt automatische Vertragsausführung. Die angekündigten zwei Arbeitsschritte sind **getrennt** abgeschlossen; ihre Kombination in **einem** produktiven Warenursprungs-/Treuhandvertrag ist weiterhin offen.

## Schritt 1: B-K9d – nachweisbare echte Eisförderung und Nahrungsproduktion

**[TEST: CI #41338567090](https://github.com/tobiasfranziskus/Check/actions/runs/41338567090), SUCCESS, 98/98 Node-Tests, einschließlich 2 neuer B-K9d-Tests.** In zwei kontrollierten Original-Core-Zellen (Seeds 7 und 42) wurde derselbe belegte Ablauf deterministisch wiederholt:

| Vorgang | Beleg |
| --- | ---: |
| Durch existierenden NPC3-Miner im Original-`foerderung` neu erzeugtes Eis | **26 Einheiten** |
| Über **Original-`handel`** an Cyris tatsächlich verkauftes Eis | **26 Einheiten** |
| Tatsächlich über Original-`betriebskosten` gezahlte Minerarbeit | **65 ISK** |
| Wirklich aus vorhandener Fabrikkasse an Test-Arbeiterkonto gezahlter Fabriklohn | **39 ISK** |
| Tatsächliche Miner-Handelsgebühr | **24 ISK** |
| Test-Eisrechnung bei künstlich isoliertem Lager | **624 ISK** |
| Durch Original-`produktion` aus 26 Eis neu gefertigte Nahrung | **13 Einheiten** |
| NPC3-Kasse nach Einnahme und Kosten | **+535 ISK** |
| Station Cyris nach Rohstoffkauf und Fabriklohn | **−663 ISK** |
| Fonds Cyris aus Minerarbeit und Gebühr | **+89 ISK** |
| Arbeiterkonto aus Fabriklohn | **+39 ISK** |
| In dieser kontrollierten Zelle zusätzlich geschöpfte ISK | **0** |

Original-Core-Audit und unabhängige Geld-/Warenaudits, deterministische Seed-Replays, Save/Load bei Schema9/Regel15 bestanden. Bei zu niedriger Fabrikkasse wird **vor der Arbeit** kein bezahlbarer Auftrag behauptet.

**[WICHTIGE EINSCHRÄNKUNG]:** Um den Ursprung **dieser 26 Einheiten** zu beweisen, wurden die vorhandenen **80 Eis in Cyris** ausschließlich in der Testzelle als physischer Export **ohne Erlös** ausgebucht; bestehende in Arbeit befindliche Rezeptlinien wurden für diese Probe isoliert. Dies ist keine echte Marktmaßnahme, keine automatische NPC-Produktion und kein akzeptiertes Balancing. Insbesondere erhöht die starke Lagerverknappung den echten Original-Eispreis auf **24 ISK pro Stück** (624 für 26), sodass die Rechnung **nicht** als repräsentative 90-Tage-Marktpreiskalkulation verwendet werden darf. Die hier bezahlten 39 ISK laufen an ein **Testarbeiterkonto**, noch nicht an die vorhandene produktive Personal-/Lohnwirtschaft. Es handelt sich um echte, ausgeglichene Original-Core-Transaktionen mit **kontrollierter** Testumgebung, **nicht** um einen produktiv gespeicherten Miner-/Fabrik-Vertrag.

## Schritt 2: B-K9e – wirkliche Regel15-Verträge in vier vollen 90-Tage-Welten

**[TEST: CI #41338837565](https://github.com/tobiasfranziskus/Check/actions/runs/41338837565), SUCCESS.** Ein eigens ausführbarer 90-Tage-CI-Job mit **vier vollständigen Original-Core-Welten** für Seed7/aktiven Spielerminer, davon ein exakt wiederholter Vertragslauf. **8.640 stündliche Original-Core- plus unabhängige Eigentümerkassen-/Escrow-/Warenaudits**, **20 Save-/Load-Hash-Roundtrips** und ein identischer 90d-Replay-Hash `d9a2a7b74d1aeb9a` (13-Nahrung-Vertrag).

Die identische Ausgangswelt wird aus dem echten Regel14-Tag4-Zustand auf Kandidat Schema9/Regel15 migriert. Für die Pilotmöglichkeit werden *vor dem Vergleich* in allen Welten dieselben bereits existierenden NPC3-/NPC1-Schiffe künstlich am Quellort Cyris bereitgestellt und deren verbleibende Altladung korrekt ausgebucht. **Dieses identische Test-Setup ist nicht der unberührte Zustand der Autonomie-KI.** Danach verändert nur der tatsächlich startende Kundenvertrag die drei Szenarien; die gesamte übrige 90-Tage-Welt entwickelt sich eigenständig weiter.

| Ergebnis 90 Tage ab Spieltag4 | Kontrolle | 9 Nahrung | 13 Nahrung |
| --- | ---: | ---: | ---: |
| Vertragsstatus | — | **erfüllt** | **erfüllt** |
| Originalpreis am Start in Aldera | 53 ISK/Stück | 53 ISK/Stück | 53 ISK/Stück |
| Vorab gebundene Endkundenrechnung | 0 | **477 ISK** | **689 ISK** |
| Tatsächlich bezahlte Fluglohnkosten | 0 | **100 ISK** | **100 ISK** |
| Dauerhaft gebundene Hüllenersatzrücklage | 0 | **39 ISK** | **39 ISK** |
| Verbliebene NPC1-Kasse | **0 ISK** | **0 ISK** | **841 ISK** |
| NPC1/2-Frachter insgesamt | **1** | **1** | **1** |
| Spieler-Barbestand | **39.694 ISK** | **42.417 ISK** | **38.918 ISK** |
| Gesamtmangelstunden | **37.648** | **37.608** | **37.694** |
| Fonds/Vertragsbuch-/Waren-Audits | bestanden | bestanden | bestanden |

**Keine neue Geldregel und keine Gratis-ISK:** Insgesamt zeigt das bestehende `state.minted` weiterhin unterschiedliche, ereignisbedingte Kopfgelder in den auseinanderlaufenden Originalwelten. Die 39 ISK Ersatzrücklage liegen als echte gebundene Mittel im Vertrag; **Kasse + Verträge = Weltgeldbestand** gilt jederzeit. Die historischen ursprünglichen NPC-Sicherheits- und Handelsfinanzierungsprobleme bleiben unverändert.

**[NEGATIVER PRODUKTBEFUND]:** Ein sauber abgerechneter Einzelvertrag **stabilisiert die makroökonomische Versorgung nicht**; auf einem Niveau von über 37.600 kumulierten Mangelstunden sind die Unterschiede je nach Warenmenge gering und nicht durchgehend günstig. Am Endtag ist in allen drei Welten nur noch ein NPC-Händlerfrachter vorhanden. Eine signifikante, selbstfinanzierte Auftragsökonomie wurde durch diesen Pilot nicht belegt. Der Test ist **nicht** 13 Seeds ×90 Tage mit autonom disponierten und integrierten Produktionsaufträgen.

## Architektur-/Freigabestatus

- **[MAIN]** bleibt unverändert. Weder #95 noch #96 noch #97 wird gemergt.
- **[TECHNISCH NACHGEWIESEN]** Originalförderung, Originalproduktion und wirkliche Bezahlung sind als kontrolliertes, einzelnes Beweisstück machbar (#96); tatsächliche originale Fracht-/Preis-/Escrow-Verträge bleiben in echten 90-Tage-Welten auditierbar und speicherbar (#97).
- **[OFFEN]** Die 13 neu produzierten Nahrungseinheiten aus #96 werden **nicht** als genau diese zertifizierte Charge durch #95 verkauft. #95/#97 transportieren bisher **bestehenden Stationsbestand**. Die voneinander unabhängigen positiven Tests dürfen **nicht** als erfolgreich integrierter Rohstoff→Kunde-Gesamtvertrag bezeichnet werden.
- **[OPTION nächster Produkt-Draft B-K9f]** Einen einzelnen, expliziten und **gespeicherten** Produktions-Subauftrag innerhalb von `state.vertrag` nachweisen: gesonderte, vollständig vorausgezahlte Rohstoff-/Miner-/Fabrik-/Frachtbudgets, ursprünglicher Produktionsabschluss als Chargenereignis, tatsächliche physische Bindung der neu entstandenen Nahrung bis zur vertraglichen Lieferung. Danach erst die 13×90-Tage-NPC-Krisen- und Ersatz-/Sicherheitsfinanzierungsgates; keine zweite Wirtschaftsberechnung, keine pauschale Geldemission, kein Spieler-Sparlimit und keine Gratisrettung.

**CI ersetzt keine reale iPad-Safari-/NAS-Abnahme.** Produktentscheidungen und Merges benötigen ausdrückliche Nutzerfreigabe; verbindliche Roadmap ist ausschließlich `docs/ROADMAP.md` auf `main`.
