# B-K3 – Produktkorrektur gegen NPC-Nullkassen-Leerflüge

**01.11.2026 · [PRODUKT/DRAFT] PR #87**, basiert direkt auf [MAIN] `b4e604d`
(v0.12.5, Regel 14, Schema 8). Kandidat **v0.12.6, Regel 15, Schema 8**.
Kein Merge und keine Veröffentlichung ohne Freigabe.

## 1. Konkreter behobener Defekt

Im Kern `m_core_entscheidung.entscheidung` konnte ein automatisch handelnder
Frachter nach zwei erfolglosen Suchläufen eine **zufällige Leerpositionierung**
beginnen, obwohl die **eigene Konzernkasse 0 ISK** betrug. Dieselben
arbeitsbedingten Fahrtkosten werden über `m_core_stunde.betriebskosten`
dennoch fällig; bei fehlender Kasse bucht der Core nur die bezahlbare
Teilsumme und speichert die ungedeckte Arbeit nicht als Forderung.

**Kleiner produktiver Regel-15-Fix:** Ausschließlich für den
automatischen Zufalls-Leerflug gilt `owner.cash > 0`. Sonst bleibt
das Schiff im Dock, wartet wie bisher `world.warteLeer` Minuten und
versucht danach erneut einen Auftrag. Die vorhandenen Entscheidungen
für echte Kauf-/Verkaufsfahrten, bereits beladene Frachter und
ausdrückliche Spieler-Reisebefehle bleiben unverändert. Die Regel gilt
identisch für sämtliche automatisch disponierten Eigentümer.

**Bewusste Beschränkung:** Bei 1–249 ISK darf ein Frachter wie bisher
leer abfliegen, auch wenn die Fahrt 250 ISK Betriebskosten je voller
Arbeitsstunde erfordern könnte. **Es existiert noch keine atomare
Mittelbindung; diese Version behauptet keine Vollkostendeckung.**
Andere Schiffskosten und reale Marktkrisen bleiben offen.

Die Regeländerung trägt ausdrücklich eine neue `rulesVersion:15`,
plus reine **14→15-Statusmigration**, ohne neue Spielstandfelder;
`schema:8` unverändert. `v0.12.6` wird im Produkt angezeigt.
Die historische v14-Wirtschaftsprüfung wird über den festgehaltenen
`main b4e604d` ausgeführt, statt deren Hashes an v15 anzupassen.
Auch die historischen B5b-Spielerkrisen werden aus demselben originalen
Regel-14-Code geprüft. Die zukünftige v15-Rechnung besitzt ein eigenes
reales 13×90d-A/B-Jobprotokoll.

## 2. Warum die zuerst erwogene strenge Kassenregel verworfen wurde

**[ANALYSE/VERWORFEN]** Ein erster realer Entwurf sperrte Leerpositionierungen
bereits dann, wenn die Kasse die geschätzte volle Fahrstundenleistung
nicht deckte (samt tickweiser Mehrfachschiffsreserve). In [CI
#41323160939](https://github.com/tobiasfranziskus/Check/actions/runs/41323160939)
war das **buchhalterisch konsistent**, aber **wirtschaftlich nicht besser**:

- 13 passive 90-Tage-Saaten waren vollständig identisch:
  **791 Mangelstunden, 16 automatische Leerfahrten, 4.622 zivile
  Schiffverluste** im Summenvergleich.
- Aktiver Spielerminer Seed 42: Leerfahrt **1→0**,
  Mangelstunden **35.798→35.762** und Gesamtverkaufsereignisse
  **3.525→3.545**, aber **ungedeckte NPC1-Arbeit 31.695→37.020 ISK**
  (+5.325 ISK). Dies ist ein **Blocker** gegen die strengere Variante.
- Aktiver Spielerminer Seed 7: keine betrachtete Leerfahrt und keine
  abweichende Versorgungsleistung.

Es wurden **keine neuen ISK** in beiden Vergleichen ausgegeben.
Die strenge Vorab-Kostenprognose ist gerade **kein Ersatz für**
reale atomare Arbeits- und Betriebskapitalreservierungen. Deswegen
wurde sie in diesem PR **zurückgenommen**; die endgültige kleine
Produktkorrektur betrifft nur nachweislich zahlungsunfähige
Nullkassen-Leerfahrten. Historische CI/Commits im PR belegen
beide Alternativen.

## 3. Testnachweis – bis zur finalen CI-Abnahme

Die neue Testdatei `tests/bk3-leerfahrt-kassenpruefung.test.mjs`
prüft 0 ISK, die Regel-14-Gegenprobe, noch positive 249/500 ISK,
zwei Frachter mit gemeinsamer positiver bzw. Nullkasse,
60 Minuten Original-Core ohne ungedeckte Leerfahrtsarbeit,
Seeds mit Hash-Replay und 14→15-Load/Save sowie Zukunftsregel-Abweisung.

**Separater neuer Job:** `tools/bk3-wirtschaft-v15.mjs`
vergleicht 13 × 90 Tage passiv und 2 × 90 Tage mit aktiv
förderndem Spieler **direkt** gegen die alte Original-Regel 14.
Geprüft werden Geld-/Warenbilanz, Save/Load, Mangel,
Nahrung, NPC-Frachter-Lieferungen, gesamte Verkaufsereignisse,
Leerfahrten, ungedeckte NPC-Arbeit und Schiffsverluste zusammen.
Die alte Regel-14-Welt wird durch den exakt versionierten
Quelltextzweig reproduziert; v15 verwendet denselben Kern.

**[CI #41323602339](https://github.com/tobiasfranziskus/Check/actions/runs/41323602339)**
auf Code-Commit `6457f303` vollständig erfolgreich: **76/76
Node-Tests**, 13 passive ×90 Tage **und** zwei Spieler-Miner-
Krisen ×90 Tage auf identischem Original-Core, mit
stündlichem Core-Audit, unabhängigem täglichem Geld-/Warenaudit
und Save-/Load-Kontrollen. Historische Regel-14-Belege sind
zusätzlich separat aus ursprünglichem Main reproduziert
([B5b CI #41323602438](https://github.com/tobiasfranziskus/Check/actions/runs/41323602438)).

**[ERGEBNIS: TECHNISCH POSITIV, WIRTSCHAFTLICH GEMISCHT]**

| 90-Tage-Vergleich | Regel 14 | Regel 15 | Wirkung |
| --- | ---: | ---: | --- |
| 13 passive Welten: sämtliche Mangelstunden | 791 | 791 | unverändert |
| 13 passive Welten: NPC1/2-Frachterverkäufe | 310.058 | 310.058 | unverändert |
| 13 passive Welten: zivile Schiffsverluste | 4.622 | 4.622 | unverändert |
| Spielerminer Seed7: sämtliche Mangelstunden | 35.993 | 35.993 | unverändert |
| Spielerminer Seed42: sämtliche Mangelstunden | 35.798 | 35.818 | **20 mehr** |
| Spielerminer Seed42: Nahrungsmangel | 11.735 | 11.740 | **5 mehr** |
| Spielerminer Seed42: NPC1/2-Frachterverkäufe | 1.919 | 1.890 | **29 weniger** |
| Spielerminer Seed42: ungedeckte NPC1-Arbeit | 31.695 ISK | 27.901 ISK | **3.794 ISK weniger** |
| Spielerminer Seed42: zivile Schiffsverluste | 45 | 43 | **2 weniger** |

Der Zähler für automatisch gestartete Leerflüge
beträgt im Seed42-Krisenlauf **1→2**, obwohl ein Nullkassenstart
explizit verboten ist. Das ist kein Widerspruch: der erste
gesperrte Start ändert die folgende Weltentwicklung; nach
späteren Mittelzuflüssen können andere Leerflüge stattfinden.
Deshalb darf man **nicht** eine reine Zahl der Leerflüge als
Erfolg behaupten. Die passiven Welten sind in sämtlichen
genannten Wirtschaftskennzahlen unverändert; das beweist
nicht zwingend vollständige Zustands-Hashidentität, da die
Regelversion 14→15 im Speicherzustand selbst abweicht.

**[PROJEKTLEITUNGSENTSCHEIDUNGSEMPFEHLUNG]**
Trotz sauberem Defektfix den PR **vorerst Draft / nicht mergen**
lassen. Der Nutzen bezüglich Nichtzahlung und weniger Verlusten
ist real, doch die geringere Warenversorgung und weniger
Händlerverkäufe widersprechen einer uneingeschränkt positiven
Wirtschaftsbewertung. Eine breitere Fahrtkostenregel benötigt
zuerst **echte atomare Vorfinanzierung**; eine tragfähige
Gesamtwirtschaft zusätzlich zahlungsfähige Endnachfrage.
Kein künstliches Nachbalancieren von Referenzwerten.
Reale iPad-Safari-/NAS-Abnahme ist weiterhin nicht erfolgt.

## 4. Folgeschritt innerhalb der verbindlichen Phase B

Nach freigegebenem, regressionsgeprüftem **kleinen Defektfix**
bleibt die **strukturelle** Wirtschaftssanierung offen:
ein echter zahlender Endverbraucher mit nachweisbarer Mittelherkunft
sowie vor Arbeitsbeginn wirklich gebundenem Schiffsbetriebskapital.
Zusätzliche Geldmodell-B-Emissionen benötigen eine eigene ausdrückliche
Freigabe. B-K1/B-K2-Testzellen bleiben Forschung und werden nicht
in den Produktcode mitintegriert.

**Keine Spieler-Sparbegrenzung, keine Gratisrettung, keine neuen
Waren, keine zusätzlichen Laufzeitabhängigkeiten, kein Merge.**
