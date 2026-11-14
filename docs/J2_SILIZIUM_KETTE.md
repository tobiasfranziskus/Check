# J2 – Siliziumversorgung: Kosten- und Ortsengpass

**[DRAFT / ANALYSE · 14.11.2026]** Folgeprüfung zu [Auftrag #334](https://github.com/tobiasfranziskus/Check/issues/334#issuecomment-6874470523), auf [J1 #335](https://github.com/tobiasfranziskus/Check/pull/335), Head `afabb9facba2543a594ffdb5390559956bcd9bf9`. Eigener Branch `research/j2-finanziertes-silizium-regel200`, PR-Basis `feature/j1-jaegerwirtschaft-regel200-20261114`. **Null Silizium gefördert, gekauft oder nach Nadir geliefert. J2 ist nicht implementiert und nicht bestanden.** Keine Jägerproduktion, Käufe, Kämpfe oder Kopfgelder.

## Quellen und Schutz

Geprüfter `main`: `04124f2bca27dc33b54be30c07b6a7bbb7387e81`; F7 #331 unverändert `f2951c7795c0461d1100253df3090f03e64c6430`. AGENTS, Roadmap, Projektstatus, J1-Bericht, tatsächliche Core- und Flugverträge sowie Metadaten von #173/#178/#329/#331/#332/#333/#335 gelesen. Historische W5b-Startannahmen werden nicht übernommen: ein nach Nadir umverteilter Starterminer wäre kein finanzierter Transport im heutigen Zustand.

CI bei Eingangsprüfung: auf J1-Head [K1 #43574819531](https://github.com/tobiasfranziskus/Check/actions/runs/43574819531) und [W5-RC1 #43574819553](https://github.com/tobiasfranziskus/Check/actions/runs/43574819553) erfolgreich, JS #43574819546 abgebrochen. Auf F7-Head K1 #43570823394, W5-RC1 #43570823460, F0 #43570823390 und F0-WebKit #43570823402 erfolgreich, JS #43570823385 abgebrochen. Diese Bestandsläufe sind keine J2-Siliziumabnahme.

Nur drei neue Dateien: dieser Bericht, `tools/j2-silizium-gate.mjs`, `tests/j2-silizium-kette.test.mjs`. Keine gemeinsamen Core-, Flug-, UI-, Root-, Original-W5ac-, Golden-, Save- oder Workflowänderungen. J1-Negativreferenzen bleiben erhalten. Roadmap/Projektstatus unverändert innerhalb der ausdrücklichen Dateigrenzen; dieser Bericht bezeichnet ausschließlich einen neuen Analysebefund. Kein Merge, Deployment oder produktiver Savezugriff.

## Gegenversuch 1: ein Miner ist durchaus finanzierbar

Bei Seeds42/7 startet `house` mit 3.000 ISK. Neben dem schon bezahlten NPC-Miner in Aldera liegen dort drei Minerhüllen; Nadir hat keine. Der reguläre `shipBuy` kauft für 600 ISK einen weiteren Miner in Aldera: `house` 3.000→2.400, Werft 600→1.200, Lager 3→2, `ledger.miner.consumed` 1→2. Eigentum `house`, echtes `sh...`, Standort Aldera. Weltgeld bleibt 33.000, Mint/Burn0.

Dieser gekaufte Miner scheitert atomar an den vorhandenen intersystemischen Pfaden:

- `shipMove` ist im Erzpilotprofil nicht freigeschaltet.
- `shipReposition` gilt nur für nachweislich gekaufte W5-Frachter in Nadir mit Ziel Aldera; nicht für Miner in Gegenrichtung.
- `shipGateCheck`/`shipFreightGateIce` sind Frachter-/Eisverträge, kein Minertransport.
- `shipMine silizium` scheitert bereits an der nicht registrierten Ware. Es gibt weder ausführbares Siliziumvorkommen noch Förder-/Ankaufsvertrag.

Ein bezahlter lokaler 2D-Flug ist kein Systemwechsel. Es wird deshalb kein Miner per Testcode nach Nadir versetzt. Die Originalbefehle und ihre tatsächlichen Ablehnungsgründe stehen im reproduzierbaren JSON-Bericht.

## Gegenversuch 2: Miner tatsächlich in Nadir herstellen

Der Versuch beginnt mit dem unveränderten F7-Helfer `tests/k13-f7-vorbereitung.cjs`: wirklicher K6-Stoppstand → expliziter Forschungsprofilwechsel nach K7 → 50 neue Erz gefördert und geliefert → reale W4-/W5-Fertigung. Die Produktionszahlen werden vom Helfer gegen Vorherwerte geprüft. Keine Testeinlage und keine hinzugefügte Ware. Automatik nach Lieferung ausgeschaltet.

Bei Tick21804 liegen in Nadir 40 Erz, null Material, eine neue Frachterhülle und null Miner. Werftkasse **0**, `house` **3.850**, Nadir **4.300**, Transport **6.496 ISK**. Ein Minerbau scheitert am Material; selbst nach bloßer Raffineriearbeit fehlten der Werft 530 ISK. Andere Firmenkonten sind keine eigene Arbeitskasse.

Ein echter bestehender Verkauf finanziert den Gegenversuch:

| Tatsächlicher Originalschritt | Ware und Zeit | Geldfluss |
| --- | --- | --- |
| Spieler kauft den neuen Nadir-Frachter | Frachterlager −1, eigene aktive Hülle +1 | `house` −750, Werft +750 |
| W4 raffiniert eine weitere echte Charge | 10 Erz → 5 Material, 20 Minuten | Nadir zahlt 20 Raffinerielohn |
| K2 bestellt Miner für `house` | 5 Material verbraucht, 30 Minuten | Werft zahlt 500 Material an Nadir und bindet 30 Arbeits-ISK |
| Fertigstellung | genau 1 neue Minerhülle im Nadir-Lager | 30 tatsächlich geleistete Minuten an Werftarbeiter bezahlt; Arbeitstreuhand null; Werftrest 220 |

Die K2-Aufnahme verlangt außerdem beim Besteller **600 ISK Kauf + 60 ISK Rückfracht**. Diese 660 ISK sind bei Auftragsbeginn lediglich Deckungsbedingung, noch keine vollständig reservierte Zahlung. Das Werkzeug bezeichnet den Lager-Miner daher ausdrücklich **nicht als bereits gekauften `house`-Miner**. Vorherige Produktions-/Lieferzähler sind historische echte K2-Vorgänge; nur die neue Differenz +1 ist dieser Gegenversuch.

Bei Tick21854 liegt die neue, vollständig material- und lohnfinanzierte Minerhülle tatsächlich in Nadir. Dennoch lehnt `shipBuy miner st_nadir` für **beide** erlaubten Miner-Käufer `house`/`npc3` atomar ab. K2 führt die Hülle ausschließlich als bestellte Fracht für den Nadir→Aldera-Eisrückweg; der normale Minerkauf ist auf Aldera begrenzt. Keine aktive Nadir-Miner-ID entsteht. Ein Frachterkauf beseitigt damit den Werftkapitalengpass, aber weder den lokalen Aktivierungsvertrag noch den Siliziumförderpfad.

Das ist ein begrenzter Gegenversuch mit existierenden Verträgen, **kein Beweis, dass jede künftige finanzierte Lösung unmöglich wäre**. Ein Folgeschritt muss den echten Kauf und Arbeits-/Ortsvertrag einer solchen Hülle in Nadir oder einen finanzierten Minertransport spezifizieren, einschließlich Produktions-/Eigentums-/Kassenprüfung. Dazu kommen ein endliches belegtes Siliziumfeld, physischer Anflug, vorfinanzierte Förderarbeit und Nadir-Ankauf. Historisch 8 Minuten, 16 Arbeits-ISK und 192 Kauf-ISK aus W5b sind bislang ausschließlich Referenzparameter, keine hier gebuchten Kosten.

## Reproduktion und Prüfgrenzen

Unter Node22 aus dem Repository:

```sh
node tools/j2-silizium-gate.mjs > /tmp/j2-ergebnisse.jsonl
node --test tests/j2-*.test.mjs
node --test tests/*.test.mjs
node scripts/build-w5-singlefile.mjs --check
```

Das Werkzeug liefert je Seed die tatsächlichen Kassen, physischen Hüllen/Orte/Buchwerte, Lager, Felder, Befehle, Ablehnungen und Hashes vor/nach jedem Schritt. Es rekonstruiert alle Waren aus Lagern und Schiffsfrachten unabhängig vom Coreaudit; J1 prüft zusätzlich unbekannte Waren/Bestände. Während der 50 neuen Produktionsminuten wird jede Minute geprüft: Weltgeld33.000, Mint/Burn0, Waren, Arbeitstreuhand und Originalaudit. Die Tests vergleichen einen vollständigen zweiten Originalbefehlslauf sowie Save/Load und 120 weitere Originalminuten.

Negative Tests am **bestehenden K2-Vertrag**: Werftbudget529 statt530, Besteller659 statt660, Material4 statt5, Doppelbau, unbekanntes Schiff und falscher Besitzer. Die drei veränderten Mangelzustände sind ausdrücklich ungültige, kontrollierte Negativfixtures, keine legal simulierten Kapital-/Warentransfers. Manipulierte K2-Produktion, Besteller, Arbeitstreuhand und erfundene Siliziumware einschließlich gefälschtem Ledger werden durch Original-/J1-Prüflader abgewiesen. Der J1-Prüflader bleibt ein Forschungswerkzeug, keine neue produktive Ladeabsicherung und kein kryptografischer Echtheitsnachweis.

**Nicht ausgeführt/implementiert:** Siliziumbudget191/192, Silizium-Arbeitsreserve15/16, echte Siliziumfracht, endliche Vorkommensentnahme und zugehörige Manipulationsabwehr. Diese APIs fehlen; abgewiesene unbekannte Befehle wären kein positiver Sicherheitsnachweis. Kein J2-13×90-Tage- oder 365-Tage-Lauf: kein größerer Coreeingriff und keine aktive Siliziumkette. Historische J1-Matrix bleibt Bestandsregression. Chromium/WebKit nicht erneut ausgeführt, da Browser-/Flugcode unverändert; echte iPad-Safari-/NAS-Abnahme offen.

Referenzen aus zusätzlichem direktem Originalbefehlslauf **ohne J2-Werkzeug**:

| Seed | Tick21854, fertige Lagerhülle | Nach weiteren120 Minuten |
| --- | --- | --- |
| 42 | `c5d9d3becc36c4a4` | `9800a1bdcd4a969f` |
| 7 | `d7fbd58bc707e2ae` | `1b68f9747e61ed8f` |

Tatsächlich lokal abgeschlossen: direkter Node22-Lauf der neuen Testdatei **2/2 Fälle bestanden**, 0 Fehler/Skips, 57.503 ms. Singlefile-Build **W5_SINGLEFILE_OK**, 320.217 Zeichen, 7 Styles, 15 Scripts. Git-Blobs gegen aktuellen `main`: beide Root-Dateien `76f2a07056c6cdf2783f9b7b355e74c46381639e`, Original-W5ac `cb41be776dffb440d273f9809dead22e841aa4fe` identisch. Auch die beiden gemeinsamen Forschungscores und sämtliche Bestands-/Golden-Tests unverändert zur PR-Basis. Der neue Test fixiert die unabhängig bestätigten Referenzen; kein produktiver Save wird migriert.

Der vollständige lokale Lauf `node --test tests/*.test.mjs` läuft bei diesem Dokumentationsstand noch; noch kein Gesamterfolg behauptet. Abschließendes Ergebnis und J2-PR-Head-CI werden nach Abschluss separat dokumentiert. Ein bestandener Negativtest bedeutet **keine** bestandene Siliziumversorgung.
