# B-K11 – vom finanzierten Teilkreislauf zum tragfähigen Betrieb

**[DRAFT / ANALYSE · 02.11.2026]** [PR #137](https://github.com/tobiasfranziskus/Check/pull/137), Basis [main `b4e604d6`](https://github.com/tobiasfranziskus/Check/commit/b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c), v0.12.5 / Regel14 / Schema8. Verbindliche Planung: [ROADMAP](ROADMAP.md). Dieser unabhängige Kandidat hat main als einzigen Ausgangspunkt. Kein Merge, Deployment oder aktivierter Mechanikwechsel. Messungen: [TEST_BK11](TEST_BK11.md).

## Architektururteil und Integrationsumfang

Die Bau-/Kaufkette aus #135 ist ein gültiger **einmaliger** Nachweis unter Testbedingungen. Sie ist keine bereits integrierbare Schiffbestellfunktion. Ein sich wiederholender, Ersatz erwirtschaftender Konzernbetrieb ist damit nicht bewiesen. Mehr Startkapital oder eine korrekte Geldbilanz allein beheben negative Beiträge, unfinanzierte Nachfrage und Schiffsverluste nicht.

**B-K11-Entscheidung nach ausgeführten Langläufen:** Der Finanzierungskandidat besteht die technischen Audits, verschlechtert jedoch die passive Versorgung in allen 13 Seeds (791→6.620 Mangelstunden gesamt). Die vier aktiven Krisen haben an Tag 61–90 keinen neuen Händlerbeitrag, und kein Händlerkonto deckt eine Ersatzhülle. **Keine Produktaktivierung empfehlen.** Der unabhängige Draft bleibt als prüfbarer Baustein und negativer wirtschaftlicher Nachweis erhalten. Zunächst D1 (Abrechnungstakt/Durchsatz) klären; anschließend die D2–D7-Kette gemeinsam prüfen. Kein Komplettmerge des Analyse-Stacks.

**Jetzt abgegrenzt:** Geldreserve und Belegbuch aus #108/#109, dazu die technische Belegverdichtung aus #110 ohne dessen Fabrikmechanik, ausschließlich gekoppelt an wirkliche Frachterflüge. Bestehende Tarife, Empfängerfonds und Stundenrundung bleiben Grundlage. Ein Core-Pfad für `shipMove`, autonomen Abflug und die bisher umgangene Werft-Heimatreise; reale Stundenarbeit wird genau einmal bezahlt, nicht benötigtes Geld einmal erstattet, Verlust beendet den Vertrag nach Bezahlung geleisteter Arbeit. Keine zusätzliche Laufzeitabhängigkeit oder UI.

**Aktivierung nur durch Entwicklungstests:** explizit übergebene Regel15/Schema9; `m_data_rules.RULES`, Browser und neue normale Spielstände bleiben 14/8. Die Übernahme dieses deaktivierten Bausteins ist keine Produktaktivierung. Das neue technische Kennzeichen `finanzModell='frachterflug-v1'` unterscheidet den kleinen Kandidaten von den inkompatiblen Schema9-Experimenten im Stack; solche Experiment-Saves werden sichtbar abgewiesen. Die frei mit Textbeleg aufrufbaren generischen Auszahlungen aus #108 werden nicht im Core-Index angeboten. Ein echter kommerzieller Liefervertrag mit Frachtvergütung an einen anderen Konzern ist weiterhin offen.

Das Buch hält alle offenen und die letzten 128 abgeschlossenen Verträge; ältere Abschlüsse werden in kontrollierte Budget-/Zahlungs-/Erstattungssummen verdichtet. Das Langlaufwerkzeug führt zusätzlich ein unabhängiges Ereignisjournal. Das Summenarchiv ersetzt keine dauerhaft vollständige Einzelbeleg-Historie.

## Beweis und Hilfskonstruktion auseinanderhalten

| Bereich | Tatsächlich belegt | Grenze / erforderliche Entscheidung |
| --- | --- | --- |
| #108 Geldreserve | Atomare Umbuchung freier ISK in Escrow, Einzelzahlung und Erstattung, Save/Audit | Ein Text wie `leistung:...` beweist allein keine Leistung. Im Kandidaten deshalb keine generische Zahlungs-API. |
| #109 Flugkosten | Original-Abflug, Original-Arbeitsminuten und reale Fondsüberweisung, Verlustabrechnung | Finanzierbarkeit ist keine Rentabilität; Folgeflug wartet auf Stundenabschluss. Werft-Heimflug wurde im Stack nicht erfasst, hier nachgezogen. |
| #110 Fabrikarbeit | Stationsgeld wird am Rezeptstart gebunden und nach Fertigstellung an Haushalte gezahlt | 1 bzw. später 4 ISK/Produktionsminute sind Analyseannahmen. Kein freigegebener Lohntarif; nicht übernommen. |
| #111–#122 Konsum/Herkunft | Lokal bzw. im Transit nachgewiesene neue Nahrung und echte Haushaltszahlungen | Kein vollständiger Rohstoffkosten-/Nachfragekreislauf; importierte Altware kann kostenlos verbraucht werden. Provenienz löst keine fehlende Kaufkraft. |
| #115–#119 Routen | Kurzfristige Verbesserungen einzelner Kostenfilter; 13×14d zeigen keine zweite bezahlte Versorgungswoche | Gezielte Positionierung ist teils nur Prognose. Flüchtige Claims nicht savefest; nicht übernehmen. |
| #123–#125 Wiederholung/Blockpreis | Originale Mengenbuchungen und zwei wirkliche Lieferungen | Zweite Lieferung nur teilweise verkauft, weitere Lager-/Kapitalbindung; Blockpreisgewinn ist kein dauerhaftes Geschäftsmodell. |
| #126–#131 Gesamtkosten | Reale Arbeitszahlungen, Haushaltbestellung und chargengenaue Kosten im Original-Core | Teilweise stillgelegte Konkurrenten, entfernte Anfangslager oder rein analytische Schattenpreise. Interne Transfers bei Konsolidierung eliminieren; Anfangsbestand mit unbekannten Kosten nicht als kostenlos bewerten. |
| #132/#133 Ersatz und Werft | Reale Hüllenkäufe, dynamische Preise, Fondsstützen; trotz Silizium an Dravos/Nadir Werftstillstand | Käufergeld, Arbeitsgeld, Rohstoffe und Transport müssen am richtigen Ort zusammenkommen. Routenwahl kalkuliert Warenbudget vor Flugreserve; wiederholt abgelehnte Angebote bleiben möglich. |
| #134 Transportdienst | NPC2 reserviert 168 eigene ISK; Spielerfrachter liefert wirklich und bekommt nach Originalverkauf bezahlt | Test-Orchestrator bestätigt Leistung. 8 Silizium ergeben Bauteile und Miner, keinen Frachter. Kein spielbarer Dienstvertrag. |
| #135 Bau/Kauf/Verlust | 10 Silizium, 8 Bauteile, realer Frachterbau; NPC2 bezahlt 1.050+42=1.092 ISK | Die acht Bauteile werden ausschließlich durch einen flüchtigen Test-Closure gegen andere Verbraucher geschützt. Käuferreserve 1.600 ISK wird erstattet, danach kauft der normale Ersatzkern; kein atomarer Kauf aus Escrow. |

**#135 im Detail:** Frachterbaustart Tick20.320, Fertigstellung20.356, Kauf `sh091`20.400, Originalverlust bei Meridian20.580 nach zwei wirklichen Fahrten. Die 400 ISK Werftlohn für acht Bauteile und Frachter sind zwar jeweils wirklich bezahlt, aber nicht als gesamte Kette vorab geschützt. 8/12 Silizium mit Bindung sowie 10 ohne Bindung scheitern am Frachterabschluss; die unverdiente Käuferreserve kommt zurück, die geleistete Fracht wird nicht fiktiv zurückvergütet. Eine 168-ISK-Dienstleistung ist zudem ein Aufwand beim bestellenden NPC, kein Ertrag desselben Konzerns.

GitHub-Metadaten von #108–#135 wurden gelesen: #108–#111 offen/Draft, #112–#135 geschlossen ohne Merge; #125 ist ein Seitenzweig von #123. Die spätere Hauptkette lautet #135→#134→#133→#132→#131→#130→#129→#128→#127→#126→#124→#123→#122→#121→#120→#119→…→#108. Aus ihr werden weder komplette Testsammlungen noch Produktannahmen geerbt.

**CI-Abgrenzung:** [#135-Run41509145274](https://github.com/tobiasfranziskus/Check/actions/runs/41509145274) am geprüften Code `6daf7e03`: Workflow erfolgreich, sieben Jobs erfolgreich, Sicherheitsgeografie-Job übersprungen. 189 Node-Tests laut Bericht; historische v11–v14-/Geografiejobs testen ihre gepinnten Regelstände. Der grüne v10-Job nimmt unter Regel14 nur seinen Skip-Zweig. Das ist keine 13× 90d-Abnahme des R15-Kerns. Für den docs-only-main-Commit liefert die auf PR-Ereignisse beschränkte Commit-Run-Abfrage keinen Lauf, also keinen aktuellen grünen Nachweis.

## Kleinster gemeinsamer Zielkern nach Freigabe

Es braucht keinen zweiten Wirtschafts-Simulator. Vorhandene Commands, Warenledger, Handel, Produktion, Reise, Verlust und Save sollen eine kleine gespeicherte Auftragszustandsmaschine bedienen:

`angeboten → finanziert → beschaffung → fertigung → lieferung → abgenommen / gescheitert / verfallen`.

Ein Auftrag enthält stabile IDs für Besteller, Hersteller, Transporteur, Quell-/Zielstation, Input-/Outputmengen aus Originalrezepten, Preisobergrenzen, Fristen, gebundene ISK, physische Materialansprüche und eindeutige Core-Leistungsbelege. NPC und Spieler verwenden denselben validierten Annahmebefehl und dieselben Prüfungen; keine Berechtigung aus Anzeigenamen oder UI-Zustand.

1. **Geld und Leistung getrennt reservieren:** Käufer-/Lieferanten-Eigenkapital, Warenankauf, genehmigter Fabriklohn, Flugkosten und Gebühren müssen gemeinsam gedeckt sein. Ein positiver Moment-Spread darf keine unbezahlte Arbeit oder vorausgesetzte spätere Subvention enthalten. Lieferung und Hüllenkauf nicht doppelt vergüten. Erst validierte Originalereignisse zahlen aus; kein extern eingereichter Textbeleg.
2. **Physisches Material gegen jeden Verbraucher schützen:** `frei=physisch−fremdGebunden`, in Handel, allen konkurrierenden Rezeptlinien, Verbrauch und Neutralexport gleichermaßen. Eigener Materialverbrauch löst Anspruch und Original-Ledgerbuchung atomar aus. Noch nicht hergestellte Bauteile sind ein Fertigungsplan, kein vorhandener Bestand. Neue Inputs erst bei realer Ankunft beanspruchen. Reihenfolge, Kapazität und Verfall sind freizugebende Produktregeln.
3. **Kauf tatsächlich erfüllen:** Der finanzierte Auftrag reserviert eine reale fertige Hülle und bezahlt/aktiviert sie atomar aus Käuferescrow; keine zwischenzeitlich freie Käuferkasse wie in #135. Ein begrenztes Preisangebot kann ablaufen oder scheitern. Variable Marktpreise brauchen eine freigegebene Obergrenze, keinen garantierten 780-ISK-Kauf.
4. **Folgegeschäft vor Ersatz bewerten:** Realisierter Warenbeitrag nach Gebühren minus sämtliche Leer-/Lastflugkosten; verlorene Ladung, tatsächliche Hüllenkäufe und gebundenes Warenkapital separat. Konsolidiert sind Stationsankauf und Minererlös interne Transfers. Für bezahlte Transportdienste darf nur der Dienstleister die Vergütung als Ertrag zählen. Keine erfundene Lebensdauer oder garantierte Nachfrage.
5. **Risiko ist finanzierbar oder der Auftrag scheitert:** Route, Warteexposition, tatsächliche Eskorte, Verlusthäufigkeit und Wiederbeschaffung zusammen messen. Bei Ausfall unverbrauchtes Material und unverdiente ISK freigeben; geleistete Arbeit bleibt bezahlt, zerstörte Ware bleibt verloren. Ein Konzern darf insolvent bleiben. Markteintritt/Nachfolge benötigt eigenes reales Kapital und Schiff, keinen gezielten Rettungsauftrag.

## Vor Umsetzung freizugebende Produktentscheidungen

| Entscheidung | Konkrete Wahl / Empfehlung zur Prüfung | Bis zur Freigabe |
| --- | --- | --- |
| D1 Aktivierung und Saves | Wann Regel15/Schema9 produktiv werden darf; laufende Altflüge zu alten Konditionen beenden oder neue Kapitalprüfung? Soll der geerbte Stundenabschluss Folgeflüge bis zur Abrechnung sperren, oder braucht es eine gesondert geprüfte frühere Abrechnung? Empfehlung: sichtbare, vermögenserhaltende Übergangsregel. | Browser14/8, kein automatischer Umstieg. Kandidatenmigration erhält alte offene Arbeit und Queue, neue Flüge reservieren; der getestete Kandidat wartet auf Stundenabschluss. |
| D2 Herstellungsarbeit | Wer bezahlt wen, welcher bestätigte Lohn-/Maschinenkostentarif, wie Rohstoffarbeit abgegrenzt wird? Keine stillschweigende Wahl von 1/4/6 ISK/min. | Keine Fabriklöhne oder neuen Haushaltskonten übernommen. |
| D3 Auftragsbindung | Material-/Kapazitätspriorität, Reihenfolge bei Konkurrenz, Teil-/Mehrfachlieferung, Eigentum, Frist und Stornofolgen; Käufer- und Lieferantenkapital, Höchstpreis und Hüllenabnahme. Empfehlung: generische gespeicherte Ansprüche statt Frachter-Sonderpriorität. | Kein produktives Materialkontingent, Werftauftrag oder Diensthonorar. |
| D4 Rentable Disposition | Mindestbeitrag nach realen Hin-/Rück-/Leerflugkosten; nachgewiesener Absatz statt Prognose; Umgang mit unfinanzierbaren Top-Angeboten und Alternativen. | Keine neue Routenrangfolge, Leerflugabschaltung oder Preisformel. |
| D5 Ersatz/Risiko | Reale Hüllenrücklage, zulässiges Verlustrisiko, bezahlter Schutz/Umrouting; keine angenommene Lebensdauer als Pflichtquote. | Verlustpfad unverändert, keine Garantie/Gratisrettung. |
| D6 Käuferkapital/Endnachfrage | Wiederkehrende zahlungsfähige Abnehmer, bezahlte Importe/Altware und freigegebene Einkommen; Finanzierung vollständig mit Produktions- und Ersatzbedarf prüfen. | Keine Preis-/Lohnreform oder ISK-Emission. Modell-B-Rahmen ist keine Quellenfreigabe. |
| D7 Bestandsstützen/Nachfolge | Der vorhandene `m_core_schiffbau.zuschuss` unterstützt individuell leere Flotten. Abschaffen/ablösen nur mit geprüftem Versorgungs-/Nachfolgekonzept; auch Stationsfonds und Piratenersatz transparent abgrenzen. | Nicht ausgebaut oder produktiv abgeschaltet; gesonderter Test-Gegenlauf ohne diese Auszahlung. |
| D8 Nachweisaufbewahrung | Reichen 128 Einzelabschlüsse + Summenarchiv oder ist eine andere dauerhafte Belegtiefe nötig? | Offene Reserven vollständig, längere Einzelhistorie nur im Entwicklungsjournal. |

Keine dieser Entscheidungen wird aus einem bestandenen Test abgeleitet. Für einen späteren kleinen Auftrags-PR zuerst D2/D3 konkret freigeben und danach D4–D7 anhand gemeinsamer Langzeitmetriken entscheiden. Eine reine Preisuntergrenze oder sichere Zielwahl reicht als Entscheidungsvorlage nicht aus.

## Grenzen der Gesamtwirtschaft

main und dieser Kandidat haben weiterhin unentgeltliche Fabrikproduktion und zivilen Verbrauch, bei Kassenmangel teilweise unbezahlte Miner-/Jägerarbeit, warenbasierten Außenhandel ohne Cash und bezahlten, aber nicht materialgedeckten Piratenersatz. Bestehende Kopfgelder erzeugen `minted`, Sicherheits-/Stationskäufe können `burned` erzeugen. Der Auftrag erlaubt keine neue Emission; abweichende reale Kampfereignisse können dennoch unterschiedliche bestehende Quellen/Senken auslösen.

Der Frachterbaustein kann daher technisch abgenommen werden, ohne dass Phase B/C wirtschaftlich abgenommen ist. Ein positiver Händlerbeitrag in einer passiven Welt mit unbezahlter Herstellung/Endnachfrage wäre ausdrücklich kein Beweis eines vollständigen finanzierten Schiffbau-/Ersatzkreislaufs. Reale iPad-Safari-/Touch-/Speicher-/NAS-Abnahme und die historischen vier 275-Tage-Krisen sind zusätzliche offene Gates.
