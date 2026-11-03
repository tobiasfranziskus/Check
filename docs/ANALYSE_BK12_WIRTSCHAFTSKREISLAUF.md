# B-K12 – Finanzierbarkeit des gesamten Wirtschaftskreislaufs

**[ANALYSE/DRAFT], 03.11.2026. Keine Integrationsfreigabe.**

Ergebnis: **Keiner der drei kleinen Ansätze schließt den Kreislauf.** Mehr bezahlter Absatz, volle Händlerkassen oder vorhandene Geldmenge sind jeweils allein kein Erfolg. Neu belegt ist ein realer Verlust bereits bei lokal produzierter, tatsächlich bezahlter Nahrung, ohne Fernfracht oder Schiffverlust. Vor einer Integration muss die Kostendeckung der gesamten Leistungskette geklärt werden; weitere pauschale Geldverteilung ersetzt diese Entscheidung nicht.

## 1. Verbindliche Basis und Beweisgrenzen

- **[MAIN]** GitHub und lokaler Fetch: `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5, Regel14/Schema8. `AGENTS.md`, `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md` gelesen. Nur die Roadmap auf main ist verbindlich. Ältere Commitangaben innerhalb dieser Dokumente sind historische Momentaufnahmen.
- **[DRAFT]** #146 → #147 → #148 → #149 → #150 → #151 → #152 → #153 → #154 sind offen, ungemergt und gestapelt. #146 basiert auf main; jeder weitere PR auf seinem Vorgänger. B-K12 basiert auf #154 (`124d3b098377db74bda5181f794f1e43fefa171b`), um die bereits vorhandene historische Core-Fixture nicht erneut zu kopieren. **Keinen dieser Stacks nach main mergen.**
- **[ANALYSE]** Die Fixture stammt aus #128, SHA256 `e5e2c5092fda778b38064dcda2692004889635639ff56dc5c0c61b2377dd7680`. Ihr Default bleibt R14/Schema8; R15/Schema9 wird nur in Tests aktiviert. Die hier verwendeten **4 ISK je Produktionsminute sind ein historischer Testparameter, kein beschlossener Lohn**. Die Ergebnisse bezahlter Fabrikarbeit sind deshalb keine bereits produktive R14-Eigenschaft.
- **[MAIN]** `index.html` unverändert. **[DRAFT]** Auch Fixture und B-K11h–p-Tests unverändert. Neue Varianten entstehen ausschließlich als getrennt instanziierte Testkerne im Analysebranch; keine Produktdatei wird umgeschrieben. Keine Preis-, Lohnsatz-, Gebühren-, Risiko-, Ressourcen- oder zusätzliche Emissionsregel geändert. Keine Laufzeitabhängigkeit, kein Merge/Release/Deployment.
- **[ANALYSE]** Neue Gesamtwelten beginnen mit den normalen Startbeständen und allen vorhandenen NPC-Händlern, **nicht** mit dem absichtlich isolierten B-K11j-Drittlieferungs-Save. Die alten Tests reproduzieren weiterhin deren eigene Befunde. Zahlen beider Startbedingungen dürfen nicht unmittelbar als A/B-Vergleich vermischt werden.

Kontrollen:

| Kontrolle | Regeln und Zweck | Seed42 / Seed7 nach 7d: Nahrung-/Medikamenten-Mangelstunden |
|---|---|---|
| **[MAIN] R14 unverändert** | Produktcode, vollständige bisherige Fondsregeln | 0/0 bzw. 2/0 |
| **[ANALYSE] Fixture im Default R14** | Unabhängiger Abgleich gegen echten main | Identische kompletten Hashes `c58bbe3979b7dc8b` / `0e4952a9cafd2019` |
| **[DRAFT] R15 unverändert** | Historische R15-Opt-ins, ursprüngliche Fondsregeln einschließlich ursprünglicher Hüllenzuschussfunktion | 374/564 bzw. 468/664; tatsächlich 0 Hüllenzuschuss |
| **[ANALYSE] Strenges R15-Referenzmodell** | Gleicher R15-Core; gemeinsam für alle strengen Arme: Stationsminimum 0, Fondsobergrenze 1 Mrd., alte individuelle Hüllenzuschüsse aus | 888/840 bzw. 893/837 |

Die strenge Referenz ist innerhalb dieses kontrollierten Versuchs unverändert, **aber nicht unveränderter main**. Abschalten der Fondsauffüllung verschlechtert die Versorgung erheblich; dessen Effekt wird nicht dem Kandidaten zugerechnet. Um diesen Störfaktor zu prüfen, wird der Haushaltsansatz zusätzlich gegen R15 mit seinen ursprünglichen Fondsregeln getestet. Eine passive 7d-R14-Welt beweist außerdem keine Langzeitstabilität unter sparendem Spieler.

## 2. Drei wichtigste belegte Ursachen

### Ursache 1: Stationsumsatz und bezahlter Endverbrauch decken nicht automatisch die realen Waren- und Produktionskosten

**[ANALYSE] Neuer lokaler Einzelbeleg, in Seed42 und Seed7 identisch:** Nadir beginnt wie die frühere isolierte Quellenprobe ohne anfängliches Eis und Nahrung; nur diese zwei Anfangsmengen werden aus Lager **und initialem Warenledger entfernt**, keine Ware hinzugefügt. Konkurrierende Frachter halten; Miner, Produktion, Haushalte und Kampf bleiben original aktiv. Keine Fondsauffüllung oder individuelle Hüllenrettung.

| Tick | Tatsächliche Buchung / physischer Vorgang |
|---|---|
| 100 | Miner `sh009` verkauft 100 frisch gefördertes Eis: **Station Nadir −2.200 ISK, NPC3 +2.200 ISK**. NPC3 bezahlt zusätzlich 88 ISK Marktgebühr an `fonds_nadir`. Stations-Einkaufskosten: 22 ISK/Eis; die Händlergebühr wird nicht doppelt der Station zugeschlagen. |
| 100 | Originalrezept bindet 2 dieser Eis-Einheiten und **24 ISK** aus Stationscash im Produktionsvertrag. Bindung ist noch keine Lohnzahlung. |
| 106 | Original-Core stellt eine Nahrung fertig und zahlt **24 ISK aus dem Vertrag an `hh_st_nadir`**. |
| 120 | Haushalt kauft und konsumiert tatsächlich eine neue Nahrung für **53 ISK an Nadir**. |
| Ergebnis dieser Einheit | **44 ISK tatsächlich bezahltes Eis + 24 ISK tatsächlich bezahlter Fabriklohn = 68 ISK; Enderlös 53 ISK; −15 ISK realisierter Stationsverlust.** Keine Fernfracht, keine nur geschätzten Betriebskosten oder Risikoabschreibung. |

Vor dieser ersten Einheit existiert kein anderer Eis-Einkauf oder anderes Nahrungslos in Nadir. Deren Kosten sind deshalb eindeutig, auch ohne FIFO-Annahme. Der Haushalt kauft nicht aus neu geschöpftem Geld; sein Einkommen stammt aus der Stationskasse.

**[ANALYSE] Tatsächliche Nadir-Kassenidentität an Tag1, bis Tag7 unverändert:**

`4.000 Anfang + 1.031 Endkäufe − 3.657 Eisankauf − 312 Siliziumankauf − 1.056 ausgezahlte Fabriklöhne = 6 ISK`.

Gleichzeitig bestehen **125 Eis, 21 fertige Nahrung und 13 zusätzlich angekaufte Siliziumeinheiten**. Keine offene Nadir-Vertragsreserve am Tag1-Ende. Haushaltskonto: `1.056 Lohn − 1.031 Käufe = 25 ISK`. Es wurden 44 Nahrung hergestellt und 23 bezahlt verbraucht; danach scheitert weitere Produktion trotz Rohstofflager an der Lohnreserve. **Liquiditätsmangel und realer Verlust existieren gleichzeitig.**

Bei konsistenter **testseitiger FIFO-Kostenrechnung**: verkaufte 23 Nahrung kosten 1.564 ISK, bezahlt wurden 1.031 ISK (−533); verbleibendes neu bezahltes Lagervermögen: 1.721 Eis + 1.428 Nahrung + 312 Silizium = 3.461 ISK. `6 Cash + 3.461 neu bezahlte Lagerkosten − 4.000 Anfangscash = −533`. Diese Lagerwerte sind historische Anschaffungskosten, **kein zugesicherter Verkaufserlös**. Nach späteren gemischten Einkäufen ordnet der Original-Core keine eindeutigen Rohstoff-Lot-IDs zu; FIFO ist dann eine offengelegte Bewertungskonvention, keine zusätzliche Core-Buchung.

**[DRAFT] Erneut bestätigter B-K11p-Gegenfall:** Dravos bezahlt 441 ISK für 9 neue Nahrung; tatsächliche Haushaltszahlungen bringen 381 ISK zurück: −60 vor sonstigen Leistungen. Bei 25 Alt-Nahrung: −1.225 Stationsankauf, +300 Rückverkauf von 12, 13 kostenlos verbraucht: −925. Die separaten 160 ISK Produktionslöhne sind kein zu diesen Waren fingierter Umsatz.

**Code:** [MAIN Preisbildung](../index.html#L963), [MAIN Handel zum Preis vor Bestandsänderung](../index.html#L1021); [DRAFT Produktion](../tests/fixtures/bk11h-r15-core-snapshot.txt#L1051), [DRAFT Verbrauchspreis nach Einlagerung](../tests/fixtures/bk11h-r15-core-snapshot.txt#L1115). Der knappheitsabhängige Preis sinkt bei großer Einlagerung. Der Händler kann die vorherige Knappheit vergütet bekommen, während die Station später zu niedrigeren Kursen verkauft. Produktions- und Beschaffungsentscheidungen prüfen Material/Platz/Cash, nicht realisierte Stückkostendeckung.

### Ursache 2: Vorfinanzierter Flug ist keine profitable vollständige Händlerleistung; Risiko, Ersatz und Sicherheitsarbeit bleiben reale Grenzen

**[ANALYSE] Neue strenge Referenz, Seed42, sieben Tage, alle NPC-Händler aktiv:**

| Reale Posten | NPC1 | NPC2 |
|---|---:|---:|
| Warenverkäufe | +22.433 | +14.331 |
| Wareneinkauf | −17.262 | −10.491 |
| Sämtliche Marktgebühren inkl. Ersatzkauf | −961 | −786 |
| Tatsächlich bezahlte Flugarbeit | −5.659 | −5.556 |
| Tatsächlich bezahlte Hüllen ohne deren oben erfasste Gebühren | −1.500 | 0 |
| Fondsabgabe | 0 | 0 |
| **Cash + offene Vertragsreserve: Änderung** | **−2.949** | **−2.502** |
| **Endcash / Endreserve** | **51 / 0** | **498 / 0** |

Die Identitäten werden für beide Händler in allen 16 strengen Gesamtwelten durch Einzelbelege geprüft. Das ist **Kassenrechnung**, kein behaupteter vollständiger Gewinn: nicht verkaufte Ladung wird separat in Mengen ausgewiesen, Hüllen sind Assets, Verlust und Neubeschaffung werden getrennt erfasst. NPC2 hat in diesem Lauf noch 1 Silizium an Bord. Die leeren Kassen können hier nicht mit einer großen offenen Flugreserve erklärt werden.

In der Referenz Seed42 gehen **3 Händlerfrachter** verloren, **2 Ersatzfrachter** werden wirklich gekauft. Die konservative Routenvariante reduziert Flugaufwand und erhält mehr Geld, hat jedoch **7 Verluste, 4 Ersatzkäufe und nur 2 Frachter am Ende**. Ein anderer Weg verändert auch RNG/Kampfbegegnungen; daraus wird keine isolierte Risikowirksamkeit abgeleitet. Die 48h-positive `sh015`-Kette bleibt nur ein zeitlich begrenzter Einzelgeschäftsbeleg; B-K11o/p werden unverändert mitgeprüft.

**Zusätzliche Finanzierungsgrenze:** Der ursprüngliche Ersatzkauf setzt neue Hüllen bereits auf Heimreise, ohne den gewöhnlichen R15-Flugvertrag zu starten. Die Tests weisen solche Abflüge ausdrücklich aus (Referenz Seed42: 2). Tatsächlich später bezahlte Kosten werden dennoch vollständig gezählt. Das ist keine neue Reserve-Implementierung und keine Behauptung, der ganze historische R15-Core sei bereits konsequent vorfinanziert.

Sicherheit Seed42 in derselben Referenz: **42.000 ISK angefallene Jägerkosten, nur 6.440 tatsächlich bezahlt und verbrannt**. 35.560 ISK fehlen; der Core führt diesen Rest nicht als Schuld fort und stoppt NPC-Sicherheit nicht entsprechend. Gezählt als Leistungskosten-Unterdeckung, **nicht** als bezahlte ISK oder Geldsenke. Piratenersatz bezahlt Geld an Meridian, entnimmt aber keine reguläre physische Schiffsware; die vollständige Piraten-/Werftressourcenkette ist somit ebenfalls noch kein geschlossenes Produktmodell.

**Code:** [MAIN Routenwahl](../index.html#L1171) bewertet Spanne/Gebühren und Reisezeit, keine Betriebskosten; [DRAFT Flugreserve](../tests/fixtures/bk11h-r15-core-snapshot.txt#L1713), [MAIN Ersatz und alte Individualstütze](../index.html#L1640), [MAIN teilweise bezahlte Kosten](../index.html#L1311), [MAIN Piratenersatz](../index.html#L1586). Behauptete Frachterkosten sind durch Originalzahlungen belegt, Rückfahrt-/Risikobudgets nur als Testannahme gekennzeichnet.

### Ursache 3: Der zahlende Endabnehmer und die Rückführung vorhandenen Geldes sind unvollständig und örtlich falsch gekoppelt

**[MAIN]** `verbrauch` entfernt Nahrung, Medikamente und zivile Bauteile ohne Cashzahlung. Fabriken zahlen keine Löhne. **[DRAFT] R15** bezahlt Arbeit, lässt aber nur **neue Nahrung** aus dem örtlichen Haushalt bezahlen; Altware, Medikamente und Bauteile bleiben kostenlos. Dravos/Orion verfügen über andere Produktions-/Einkommensquellen als Nahrungsproduzenten; lokales Einkommen ist nicht automatisch am nächsten Bedarf verfügbar.

**[ANALYSE] Tatsächlich gemessene Geldverteilung, Seed42 nach 7d:**

| Kontengruppe | Strenge R15-Referenz | R15 mit originalen Fondsregeln |
|---|---:|---:|
| Stationen | 215 | 5.688 |
| Haushalte | 6.175 | 30.620 |
| Systemfonds | 36.566 | 1.500 |
| NPC1 / NPC2 | 51 / 498 | 90 / 4.102 |
| NPC3 | 4.482 | 6.000 |

Die ursprünglichen Fondsregeln helfen tatsächlich. Die strenge Welt leidet unter Geldbindung in Fonds, die ursprüngliche R15-Welt zusätzlich unter dem zu schmalen Ausgabenweg der Haushalte. **Beides ist weder Geldvernichtung noch ein Nachweis notwendiger neuer ISK.**

Strenge Referenz: `50.000 Anfang + 1.440 bestehende Kopfgelder − 6.440 tatsächlich bezahlte Sicherheitssenke = 45.000 ISK`. Gebühren, Miner-/Frachterarbeit, Fabriklöhne, NPC-Abgaben und Fondsüberweisungen sind Transfers. Neutraler Außenhandel verschiebt nur Waren; er ist keine echte externe Cash-Nachfrage. In C können dieselben ISK wiederholt ausgegeben werden: 71.748 ISK öffentliche Käufe sind **kein** Minting von 71.748 ISK.

Die freie NPC3-Kasse führt nicht von selbst zur Aufgabenübernahme. `sollflotte`/`ersatzkauf` ersetzen bestehende Rollen; ein Miner-Konzern eröffnet nicht automatisch einen finanzierten neuen Händlerbetrieb oder eine neue Firma. **[BESCHLOSSEN]** Konkurs darf eintreten, Sparen bleibt unbeschränkt. **[OPTION]** Marktübernahme braucht ein rentables Angebot, einen wirklichen Kapitalgeber und bezahlte Assets; diese Regeln sind nicht implementiert. Ohne tragfähigen Auftrag würde eine neue Firma denselben Verlust übernehmen.

**Code:** [MAIN Verbrauch](../index.html#L1300), [MAIN Fonds](../index.html#L1361), [MAIN Außenhandel ohne Zahlung](../index.html#L1334), [DRAFT Haushalte](../tests/fixtures/bk11h-r15-core-snapshot.txt#L337), [DRAFT Haushaltzahlung](../tests/fixtures/bk11h-r15-core-snapshot.txt#L1115), [MAIN Sollflottenersatz](../index.html#L1627).

## 3. Genau drei Lösungsansätze und ihre kontrollierten Varianten

| Ansatz | Tatsächlich getestete Änderung | Ergebnis / Grenze |
|---|---|---|
| **A [ANALYSE] Vollständiger bezahlter Haushaltsverbrauch** | Sämtliche vorhandenen Güter des bisherigen `verbrauch` aus tatsächlicher örtlicher Haushaltskasse zum bestehenden Preis bezahlen; bei fehlendem Cash kein Gratisverbrauch. Auch Alt-Nahrung und Medikamente. Vorhandene alphabetische Warenreihenfolge bleibt: Bauteile können vor Nahrung Kaufkraft binden. | Händler werden mit originalen Fondsregeln teils solvent, Versorgung verschlechtert sich gegenüber deren Kontrolle. Keine allgemeine Nachfragefinanzierung. Zuordnung ziviler Bauteile zum Haushalt ist nur eine Testannahme, keine Produktentscheidung. |
| **B [ANALYSE] Konservative Hin-/Rückfahrtkalkulation** | Von nomineller Spanne zweimal originale einfache Fahrtkosten abziehen, ausreichendes Cash für Ware/Fees/beide Fahrten verlangen; keine zufällige Leerpositionierung. Preise/Löhne und Original-Flugabrechnung bleiben gleich. | Weniger Kosten, mehr Händlerkapital; Nahrung/Medikamente bleiben mangelhaft. Keine optimierte Mengenwahl, keine Nachfragereserve, keine Risikoquote. **Der kalkulierte Rückflug wird nicht zusätzlich in einem Vertrag gebunden.** |
| **C [ANALYSE] Öffentliche Endabnahme aus Bestandsfonds** | Originale Haushaltskäufe neuer Nahrung erhalten; restlichen realen Endverbrauch zum unveränderten Preis aus lokalem Fonds bezahlen, nur soweit dessen freier Cash reicht. Keine Aufstockung oder Zahlung bei Nullbestand, keine Individualrettung. | Mehr Produktion und wirkliche Lieferungen, trotzdem Händlerkassen fast leer. Fondszahlung zum Preis nach Einlagerung beseitigt die Stationskostenlücke nicht. |

Zusätzlich **A+B** und **C+B** als Wechselwirkungsproben. Das sind Kombinationen derselben drei Ansätze. Kein vierter Mechanismus, keine Vergütungs-/Preis-/Lohnreform oder neue Emission. In C zählt das historische Feld `haushaltskauf.menge` technisch sämtliche bezahlte Neu-Nahrung; das Journal trennt **Haushalt** und **Fonds** als tatsächliche Zahler. Es wird nicht als ausschließlich aus Löhnen bezahlter Haushaltskauf ausgegeben.

## 4. Experimentvergleich

Alle Angaben beziehen sich auf jeweils **sieben Tage / 10.080 Ticks**, sechs Verbraucherstationen, maximal **1.008 Station-Mangelstunden je Gut**. Ein Mangelstundenzähler ist keine fehlende Warenmenge. Bei A/C wird fehlende Kaufkraft konsequent als fehlende Versorgung gezählt, nicht durch kostenlosen Konsum kaschiert.

**[ANALYSE] Strenge Welt, passiver Spieler; gemeinsame Referenzbedingungen aus Abschnitt 1:**

| Seed | Variante | Verkäufe NPC-Frachter | Nahrung geliefert | Medikamente geliefert | Nahrungsmangel | Medikamentenmangel | NPC1 / NPC2 Endcash |
|---|---|---:|---:|---:|---:|---:|---:|
| 42 | Referenz | 69 | 40 | 58 | 888 | 840 | 51 / 498 |
| 42 | B | 38 | 45 | 50 | 856 | 851 | 2.260 / 4.338 |
| 42 | C | 309 | 476 | 117 | 600 | 812 | 9 / 60 |
| 42 | C+B | 106 | 149 | 203 | 768 | 875 | 5.186 / 3.578 |
| 7 | Referenz | 58 | 39 | 47 | 893 | 837 | 87 / 1.476 |
| 7 | B | 40 | 45 | 111 | 860 | 835 | 2.636 / 5.332 |
| 7 | C | 339 | 437 | 229 | 568 | 765 | 65 / 10 |
| 7 | C+B | 108 | 184 | 245 | 640 | 865 | 2.706 / 4.830 |

**[ANALYSE] Unbegrenzt sparender aktiver Spieler:** Über Originalbefehle bestehender Miner auf Erzförderung, bestehender Frachter auf Autohandel. Keine Station gekauft, keine neue Spielerflotte geschenkt, keine Ausschüttung oder Spargrenze. **Kein identischer Replay des älteren B1-90d-Szenarios**, sondern ein deklarierter neuer Krisenstart aus normaler Welt.

| Seed | Variante | Verkäufe NPC-Frachter | Nahrungsmangel | Medikamentenmangel | NPC1 / NPC2 Endcash | Spieler-Endcash |
|---|---|---:|---:|---:|---:|---:|
| 42 | Referenz | 94 | 855 | 862 | 49 / 74 | 3.241 |
| 42 | B | 51 | 878 | 860 | 3.957 / 1.541 | 2.561 |
| 42 | C | 274 | 603 | 837 | 54 / 82 | 7.893 |
| 42 | C+B | 82 | 760 | 906 | 4.874 / 1.991 | 7.658 |
| 7 | Referenz | 81 | 858 | 859 | 60 / 199 | 1.275 |
| 7 | B | 40 | 875 | 854 | 3.611 / 4.862 | 2.110 |
| 7 | C | 316 | 585 | 816 | 28 / 26 | 9.586 |
| 7 | C+B | 127 | 666 | 878 | 4.881 / 2.403 | 7.650 |

**[ANALYSE] A wegen des im Original-R15 beobachteten Haushaltsgelds gesondert geprüft:**

| Fondsrahmen | Seed | Referenz Nahrung/Medizin | A Nahrung/Medizin | A+B Nahrung/Medizin | A NPC1/NPC2 |
|---|---|---:|---:|---:|---:|
| Streng | 42 | 888/840 | 968/979 | 933/982 | 0/75 |
| Streng | 7 | 893/837 | 964/978 | 939/980 | 6/45 |
| Original R15 | 42 | 374/564 | 585/720 | 635/782 | 3.983/6.000 |
| Original R15 | 7 | 468/664 | 537/681 | 592/723 | 6.000/6.000 |

A ist schon ohne Spielerkrise negativ; deshalb keine weiteren A-Krisen-/90d-Läufe. Sämtliche berichteten R15-Gesamtwelten haben **0 tatsächliche individuelle Hüllenzuschüsse**; in der strengen Familie sind sie auch ausdrücklich gesperrt.

**Widerlegt bzw. begrenzt:**

- „Es fehlt nur ein zahlender Endabnehmer“: A/C bezahlen tatsächlichen Verbrauch; weder ausreichende Versorgung noch Gesamtfinanzierung folgen automatisch.
- „Vorhandenes Geld muss nur an Stationen zurück“: C bewegt bestehendes Geld und erzeugt mehr echte Lieferungen; Händler gehen trotzdem fast pleite. Ursprüngliche Fondsregeln bleiben eine wichtige Kontrollgröße.
- „Fracht-Vollkosten in die Route reichen“: B bewahrt Geld, schafft keine verlässlich finanzierte Versorgung. Der konkrete Versuch ist konservativ und nicht der Beweis, dass jede bessere Disposition unmöglich wäre.
- „Alle Stationseinbrüche sind nur Investitionen/Lager“: Im Mikrofall bestehen erhebliche Assets **und** eine negative reale erste Stückmarge; die gesamte Kassenabnahme wird nicht als Verlust ausgegeben.
- „Das liegt allein am sparenden Spieler“: Auch passive R15-Welten scheitern. Unbeschränktes Spielersparen bleibt geschützt.
- „Daraus folgt zusätzliche ISK-Emission“: nicht belegt. Vorhandene 45.000 ISK und fehlerhafte Kostendeckung/Kontenzuordnung erklären bereits wesentliche Blockaden. Alle Varianten benutzen unveränderte vorhandene Kopfgeldquellen und wirkliche Senken.

## 5. Kleinste begründete Empfehlung und notwendige Entscheidung

**[OPTION] Keine getestete Variante integrieren.** Eine einzelne neue Transferregel wäre keine ehrliche Lösung. Der kleinste vertretbare nächste Kandidat wäre ein **vorfinanzierter Endabnahmeauftrag mit einem einzigen, über Produktion, Transport, Gebühren und Ersatzrisiko nachvollziehbaren Kosten-/Erlösbudget**. Stationen sollten keine ungedeckte, spekulative Zwischenabnahme mit anschließend sicher negativer Wiederverkaufsmarge übernehmen. Ein solcher Auftrag darf unrentable Leistungen ablehnen; allein dadurch ist Grundversorgung noch nicht bewiesen.

**Die zu ändernde Grundannahme:** Physisch mögliche Produktion, positive Händlerspanne und formal bezahlter Verbrauch dürfen nicht länger als hinreichender Kreislauf gelten. Für den konkret belegten 68→53-Fall muss entweder der vom Endkunden tatsächlich finanzierte Erlös die volle Leistung decken, oder ein ausdrücklich beauftragter, real budgetierter zusätzlicher Gegenwert die Differenz tragen. **Eine andere Kontoverteilung allein beseitigt diese Stückkostenlücke nicht.** Auch eine vorher reservierte Zahlung von 53 macht 68 Aufwand nicht profitabel.

Das ist **keine Aussage, alle Nahrungslose seien unter allen Beständen verlustbringend**, und kein mathematischer Unmöglichkeitsbeweis für jede künftige Disposition. Es ist ein entscheidungsrelevantes Gegenbeispiel gegen die allgemeine Tragfähigkeitsannahme des aktuellen R15-Kandidaten. Preis-/Lohnparameter oder verhandelte kostendeckende Abnahmepreise benötigen den gesonderten Produktentscheid. Sie wurden hier **nicht** verändert. Ein aus Bestandsfonds bezahlter echter Versorgungsauftrag darf nicht als unbeschränkte Übernahme von Konzernverlusten gestaltet werden. Neue ISK sind durch diese Untersuchung weder erforderlich bewiesen noch freigegeben.

## 6. Kleine, unabhängig überprüfbare Integrationsschritte – nur nach Produktentscheid

| Schritt | Akzeptanzkriterien | Save-/Produktrisiko |
|---|---|---|
| **[DRAFT/ANALYSE] Dieses Evidenzpaket** | Quellen-/Senken-/Reserveidentitäten, echte Einzelbelege, gleiche Hashes ohne Beobachter, negative Gegenproben reviewen. Keine Produktintegration erforderlich. | Kein Produkt-/Save-Diff. Nicht den historischen Stack mitmergen. |
| **[OPTION] Ein gemeinsamer finanzierter Einzelauftrag auf sauberem main-Branch** | Aus bestehendem Cash bindend finanzieren; reale Ware und Arbeit nachweisen; bei Verlust nur unverdienten Rest zurück; kein Doppelverbrauch, keine doppelte Zahlung. Spieler darf absichtlich verlustbringend, aber gedeckt handeln; NPC lehnt negativen Auftrag ab. Die 68/53-Lücke vorher explizit entscheiden. | R14 hat keine gespeicherten Vertrags-/Haushaltsfelder. Eigenständiger Schema-/Regelentwurf; fehlende Alt-Felder deterministisch migrieren, korrupte/zukünftige Saves ablehnen. Keinen R15-Snapshot in Produkt kopieren. |
| **[OPTION] Vollständige Fortsetzung einschließlich Hülle und Folgefahrt** | Rohstoffe, Produktion, Zwischenlager, Endabnahme, nächste Fahrt und Ersatz in derselben Rechnung; Ersatzheimfahrt ebenfalls finanziert; tatsächliche Mengen-/Cash-Audits; keine Individualgarantie. | Offene Verpflichtungen bei Halten, Verkauf, Konkurs und Schiffsverlust erhalten; Schema-/Regelwechsel und Ladepfade prüfen. Kein pauschales NPC-Sicherheitsarbeiten bei 0 Cash als bezahlte Leistung werten. |
| **[OPTION] Allgemeine Aufgabenübernahme und Weltgate** | Ein anderer real kapitalisierter Akteur übernimmt ein tatsächlich tragfähiges Angebot nach Konkurs. Dann 13 übliche Seeds ×90d inklusive ursprünglicher B1-Spielerkrisen, anschließend problematische Langzeitfortsetzungen; Versorgung, Solvenz, Geld-/Warenaudits, tägliche Hashes/Save-Load gemeinsam bestehen. | Keine erzwungene Spielerentsparung; keine still geschaffenen Assets/Firmenmittel. Vor Produktfreigabe unterstützte Altsaves und reale iPad-Safari-/NAS-Wege prüfen. |

**[BESCHLOSSEN]** Endgültige Produktentscheidung und jede Integration bleiben beim Produktverantwortlichen. Roadmap-Phasen und Priorität B bleiben erhalten. **Nicht ausgeführt:** neue 13×90d-/365d-Kandidatenprüfung, reale Safari-/NAS-Abnahme, Release oder Deployment. Die Kandidaten scheitern vorher am Mehrtagegate; historische R14-90d-CI ist kein R15-Erfolgsbeleg.

## 7. Reproduktion und GitHub-Nachweise

Quellen: [Testfälle](../tests/bk12-kreislauf.test.mjs), [isolierter Testkern und Buchungsbeobachter](../tests/lib/bk12-analyse.mjs), [kompakte Messwerte aller Konten, Reserven, Lager, Verlust-/Ersatzbelege, Tageshashes und Phasen](analysen/BK12_MESSWERTE.json). `net` enthält **gemessene Nettoänderungen pro Core-Phase**, keine daraus geschätzten Einzeltransfers. Journale stehen zusätzlich als CI-Artefakt zur Verfügung; echte Handels-/Gebühren-/Endkauf-/Beutebuchungen enthalten ihre tatsächlichen Parteien. Die unabhängigen Geld- und Warenprüfungen berechnen die Bestände selbst; Core-Audit und Herkunftsaudit kommen zusätzlich hinzu.

Node.js **22.23.4**, keine Installation neuer Abhängigkeiten:

```sh
node --test tests/*.test.mjs
BK12_OUTPUT_DIRECTORY=/tmp/bk12-output node --test --experimental-test-isolation=none tests/bk12-kreislauf.test.mjs
```

Lokal: Pflichtbefehl **10/10 Dateisuiten bestanden**, 0 Fehler/Skip/TODO. Zusätzlich detaillierte B-K12-Läufe: zunächst **6/6 benannte Tests**, danach **3/3** (Beobachterprüfung erneut + zwei ergänzte Fälle), jeweils 0 Fehler/Skip/TODO; damit alle **8 unterschiedlichen neuen Testfälle** ausgeführt. Der finale gezielte CI-Lauf prüft sie gemeinsam. Der Node-22-Standardreport zählt hier Dateisuiten; diese Zahl wird nicht als Anzahl aller inneren Assertions ausgegeben.

Jede Gesamtwelt wird stündlich unabhängig auf Geld einschließlich offener Reserven, Waren und Nahrungsherrkunft geprüft; alle Varianten haben tägliche Save/Load-Checks und byte-identische uninstrumentierte Fortsetzungen über eine echte Tag1-Savegrenze. Mikrofall: Originalvergleich stündlich, Save/Load bei 2h/24h/7d. MAIN: finaler Roundtrip und Default-Fixture-Gegenhash. Hashes werden nicht zur Herstellung grüner Tests im Produkt ersetzt. Neue Referenzhashes sind in Tests und Messwerten gepinnt, zusätzlich gegen vollständige zustandsneutrale Replays geprüft.

Bereits zu Auftragsbeginn für die **aktuellen** neun Analyse-Heads überprüfte erfolgreiche gezielte CI:

| PR | Head | gezielter Lauf | Standardlauf |
|---|---|---|---|
| #146 | `921f03c` | [41633904205](https://github.com/tobiasfranziskus/Check/actions/runs/41633904205) | [41633904063](https://github.com/tobiasfranziskus/Check/actions/runs/41633904063) |
| #147 | `3b95fc9` | [41636211565](https://github.com/tobiasfranziskus/Check/actions/runs/41636211565) | [41636211455](https://github.com/tobiasfranziskus/Check/actions/runs/41636211455) |
| #148 | `a79a6fd` | [41659430340](https://github.com/tobiasfranziskus/Check/actions/runs/41659430340) | [41659430575](https://github.com/tobiasfranziskus/Check/actions/runs/41659430575) |
| #149 | `589ec40` | [41662857658](https://github.com/tobiasfranziskus/Check/actions/runs/41662857658) | [41662857603](https://github.com/tobiasfranziskus/Check/actions/runs/41662857603) |
| #150 | `573063a` | [41665808826](https://github.com/tobiasfranziskus/Check/actions/runs/41665808826) | [41665809291](https://github.com/tobiasfranziskus/Check/actions/runs/41665809291) |
| #151 | `a6a9dd9` | [41667039444](https://github.com/tobiasfranziskus/Check/actions/runs/41667039444) | [41667039484](https://github.com/tobiasfranziskus/Check/actions/runs/41667039484) |
| #152 | `ed19093` | [41667747697](https://github.com/tobiasfranziskus/Check/actions/runs/41667747697) | [41667747690](https://github.com/tobiasfranziskus/Check/actions/runs/41667747690) |
| #153 | `0afa764` | [41671352843](https://github.com/tobiasfranziskus/Check/actions/runs/41671352843) | [41671352758](https://github.com/tobiasfranziskus/Check/actions/runs/41671352758) |
| #154 | `124d3b0` | [41674781237](https://github.com/tobiasfranziskus/Check/actions/runs/41674781237) | [41674781545](https://github.com/tobiasfranziskus/Check/actions/runs/41674781545) |

**[DRAFT] B-K12-Branch:** `analyse/bk12-kreislauf-pruefung`. Kleine Code-Commits: [`544c3b2`](https://github.com/tobiasfranziskus/Check/commit/544c3b2) (Beobachtung/Varianten), [`aa5154c`](https://github.com/tobiasfranziskus/Check/commit/aa5154c) (Gegenproben/CI). Draft-PR und endgültige CI-Läufe werden im GitHub-PR nach ihrer tatsächlichen Ausführung verlinkt. Ein grüner technischer Test bestätigt hier ausdrücklich ein negatives wirtschaftliches Ergebnis.
