# B-K10p – Silizium- und Werftstillstand: vorhandene Ware, unfinanzierbare Frachteraufträge

**[ANALYSE/DRAFT · 02.11.2026]** [PR #133](https://github.com/tobiasfranziskus/Check/pull/133), gestapelt auf #132 → #131 → #130 → #129 → #128 → #127 → #126 → #124 → #123 → #108. **[MAIN] b4e604d6 / v0.12.5 / Regel14 / Schema8** unverändert. Es geht ausschließlich um den **nicht integrierten R15-/Schema9-Wirtschaftskandidaten**. Nur neue Testdatei, Bericht und Projektstatus, keine Änderung an index.html, Markt-, Lohn-, Produktions-, Routen-, Geld-, Fonds-, Schiffs-, Emissions-, UI- oder Save-Regeln. Kein Merge.

## 1. Ausgangspunkt und Kausalhypothese

B-K10o [PR #132](https://github.com/tobiasfranziskus/Check/pull/132) belegte für Seed42 nach 14 Tagen einen **komplett schiffslosen NPC2 mit 2.792 ISK eigener Kasse**, aber **0 fertige Frachter bei der Werft Aldera**. Der vorhandene individuelle NPC-Ersatzfonds wurde in 13×72h-Normalwelten und zwei natürlichen 14-Tage-Krisen nicht genutzt; das Abschalten änderte dort keine einzige Buchung. Ein Schiffsrückkauf scheitert dann nicht primär am freien Geld, sondern an seiner materiellen Bereitstellung.

B-K10p verfolgt deshalb die **originale, autonome Werftlieferkette**: gefördertes Silizium → tatsächlich bezahlte NPC-Fracht → Stationsbauteile → fertiger Frachter/Miner → realer Schiffskauf und gegebenenfalls Übernahme des ausgefallenen Transportbedarfs durch einen anderen NPC. Zusätzlich wird die bestehende R15-Entscheidungsprüfung für Frachterrouten direkt mit den anschließenden **realen** Flugvertragsreservierungen verglichen.

## 2. Methode – Buchungsinstrumentierung ohne Produktänderung

[Ausführbare B-K10p-Prüfung](../tests/bk10p-silizium-werft-nachfolge.test.mjs): Der Original-R15-Simulationskern wird lediglich im **Test** an folgenden bereits vorhandenen Buchungen begleitet:

1. **Tatsächlich erfolgreiche Original-NPC-Handelstransaktionen:** Schiffseigentümer, Station, Ware, Menge, Original-ISK-Kauf-/Verkaufsbetrag und Zeit. Ursprüngliche Waren-/Geldkonten werden nicht verändert.
2. **Tatsächliche Aldera-Fertigungsstarts und -abschlüsse:** Original-Linien r_material, r_bauteil, r_frachter, r_miner; die in R15 bezahlte Arbeit mit bestehenden Rezepten (Bauteil braucht 2 Material + 1 Silizium; Frachter braucht 8 Bauteile, Miner 6 Bauteile + 1 Material). Die benötigten Ressourcen und der tatsächliche fertige Werftbestand werden täglich verglichen.
3. **Original-Routenangebot versus Original-Flugreservierung:** Die R15-Entscheidung benutzt zunächst bezahlbar(rules,station,**gesamte Eigentümerkasse**,Warenpreis). Der spätere Abflug verlangt zuerst eine reale Reserve für zeitabhängige Frachterarbeit und anschließend eine wirklich aus Rest-ISK bezahlbare Wareneinheit. Nur Testmessung: jedes vom Originalplaner vorgeschlagene Paar, für das Eigentümerkasse minus echte Flugreserve nicht einmal eine einzige zum Originalpreis/Originalgebühr bezahlbare Einheit erlaubt.
4. **Täglicher eigenständiger Geld-Audit** inklusive offener realer Vertragsreserven, unabhängiger Warenledger-Audit für alle Güter, Original-Core-Audit sowie echte Save/Load-/Hash-Gegenprobe. Historische Startware, andere NPCs, Käufer, lokale Haushalte, Preise, Piratenrisiken, Produktions- und Handelsaufträge laufen unverändert.
5. **Einziger isolierter Counterfactual:** Die auf sonst **identischer Original-R15-Kernkopie** ausgeführte Waren-Routenbewertung zieht vor dem bezahlbar-Check den tatsächlich für das jeweilige Ziel nötigen Flugreservebetrag ab. Es wird **keine** Kasse oder Ware im Test geschaffen, und der produktive Quellcode bleibt unverändert. Paare Seeds42/7 × 7 Tage (vier vollständige unabhängige Welten); *alle* alternative Märkte werden vollständig neu deterministisch fortgeschrieben und separat auditiert. Abweichende Original-Piraten-/Kopfgeldereignisse dürfen abweichende globale ISK-Mengen auslösen; **gleiche Endgeldmenge ist zwischen verschieden laufenden Welten nicht zu fordern**.

## 3. Ursachengate in den vollautonomen 14-Tage-Normalwelten

| [R15 ANALYSE] Originalwelt nach 14 Spieltagen | Seed42 | Seed7 |
|---|---:|---:|
| Werft Aldera – echtes verfügbares Silizium | **0** | **0** |
| Werft Aldera – tatsächlich vorhandene Bauteile | **0** | **0** |
| Fertige Frachter / Miner in Aldera | **0 / 0** | **1 / 0** |
| Aldera kann mit **vorhandenem** Stationsgeld und wirklichem Lagerplatz noch Silizium aufnehmen | **31** | **65** |
| Aldera-Kasse | 1.374 ISK | 3.702 ISK |
| An Dravos und Nadir real zum Verkauf stehendes Silizium | **je 65** | **je 65** |
| Zusätzlich auf mindestens einem existierenden NPC-Silizium-Miner beladene Menge | **100** | **100** |
| Erfolgreich fertiggestellte Bauteile im ganzen Lauf | **480** | **347** |
| Fertige neue Frachter im ganzen Lauf | **8** | **5** |
| Fertige neue Miner im ganzen Lauf | **13** | **6** |
| **Zusätzliche Bauteil- oder Schiffbauabschlüsse Tag 9–14** | **0** | **0** |
| NPC1-/NPC2-Frachter lebend | **1 / 0** | **2 / 2** |
| NPC1-/NPC2-Kasse | 90 / 2.792 ISK | 63 / 67 ISK |

Bei Seed42 fallen die Werft-Rohstoffe von Silizium 5 / Bauteile 23 / Frachter 2 am Tag3 auf **je 0** am Tag9. Bei Seed7 wurde Silizium früher knapp. Obwohl Dravos und Nadir reale verkaufbare Siliconbestände und Aldera einen real zahlungsfähigen Ankauf für **31 bzw. 65 Einheiten** haben, werden die entsprechenden Aufträge nicht mehr finanziert transportiert. Die Nadir-/Dravos-Siliziummärkte sind lokal an der Lagerobergrenze 65; andere Miner halten 100 wirklich geförderte Einheiten fest, während die Werft leer ist. Das ist **kein globaler Mangel am Rohstoff**, sondern eine unvollständige Zahlungs-/Transport-/Produktionskette.

Echte, originale Silizium-Lieferungen an Aldera sind zuvor nachgewiesen (Seed42 **428** Stück, Seed7 **324** Stück über 14 Tage). Die Werft hat früh mehrere hundert echte bezahlte Produktionszyklen, kann aber ab Tag9 wegen fehlendem Silizium **kein neues Bauteil** und anschließend kein Schiff mehr bauen. Zusätzliche Geldüberweisungen ausschließlich an den schiffslosen NPC2 beheben den Rohstoff-Nachschub nicht.

## 4. Handelsentscheidung: nachweislich unfinanzierbare Angebotsauswahl

| Originaler autonomer Planer über 14 Tage | NPC1 Seed42 | NPC2 Seed42 | NPC1 Seed7 | NPC2 Seed7 |
|---|---:|---:|---:|---:|
| Vorschläge, bei denen selbst eine Ware + **echte** Flugreserve nicht finanzierbar ist | **14.896** | 0 | **29.720** | **31.108** |
| Am Tag14 verbliebene NPC-Frachter | 1 | 0 | 2 | 2 |

Ein konkreter tatsächlicher Seed42-Endfall: NPC1-Frachter sh058 liegt mit **90 ISK** leer in Veldra. Der Planer wählt wiederholt einen vermeintlich profitablen **Erztransport Veldra→Meridian**; bereits dessen Original-Flugreserve beträgt **125 ISK**, also mehr als die gesamten 90 ISK, und zusätzlich wäre die Ware zu bezahlen. Die Antriebsfreiheit ohne Treibstoff ändert **nichts** an der real benötigten Frachterarbeit. Ohne erfolgreiches Abflugbudget verharrt der Frachter am Dock, trotzdem wird dieselbe unfinanzierbare Auswahl erneut angeboten. **Nach Tag4 liefert der verbliebene NPC1 in Seed42 kein einziges neues Verkaufsgut**; NPC2 hat nach Tag9 keine Schiffe.

Seed7: Vier NPC-Frachter existieren am Tag14 noch (zwei pro Händler), aber die Eigentümerkassen betragen nur **63 bzw. 67 ISK**. Selbst der kürzeste verfügbare **Leerflug** kostet von ihren Stationen **75 ISK**, in Cyris mindestens 105 ISK. **Alle vier** sind schon für eine neue Leerfahrt nicht kreditfrei. Der Originalplaner versucht trotzdem wiederholt unfinanzierbare Warenrouten. Nach Tag6 gibt es dort keine neue erfolgreiche Händlerlieferung von NPC1 oder NPC2.

**Nachfolgebefund:** Vor der Krise haben **beide** Händler tatsächlich Silizium nach Aldera verkauft (Seed42 NPC1 **159**, NPC2 **269**; Seed7 NPC1 **149**, NPC2 **175** Einheiten). NPC1 übernimmt nach NPC2s Ausfall in Seed42 **keine** weiteren Lieferungen, obwohl sein letzter Frachter nicht zerstört ist. Es gibt im überprüften Zeitraum keine wirtschaftlich wirksame Alternativversorgung der Aldera-Werft. Eine neue NPC-Firma oder automatische Neubildung eines unabhängigen Händlerkontos ist durch die bisherige Testwelt nicht nachgewiesen.

## 5. Eine einzelne Test-Routenverbesserung reicht nicht

In einer zweiten, rein analytischen **Core-Kopie** wird nur die Vorauswahl von Angeboten so berechnet, dass *vor* einer Wareneinkaufsofferte die originale Flugreserve von der wirklich vorhandenen Händlerkasse abgezogen wird. Das ist ein berechenbarer, **nicht implementierter Produktvorschlag**, keine Testgutschrift. Gegenprobe bei ansonsten gleichen Starts über Seeds42/7 je sieben Tage:

| Original R15 / einziges Test-Gate | Seed42 alt | Seed42 Filter | Seed7 alt | Seed7 Filter |
|---|---:|---:|---:|---:|
| Vorher nicht voll finanzierbare ausgewählte Angebote | 4.816 | **0** | 20.508 | **0** |
| Aldera-Silizium Tag7 | 0 | 0 | 0 | 0 |
| Aldera-Bauteile Tag7 | 0 | 0 | 0 | 0 |
| Fertige Aldera-Frachter Tag7 | 1 | 0 | 1 | 2 |
| Erfolgreiche NPC1-Handelsverkäufe (Gesamtzählung) | 299 | **6** | 286 | 265 |
| Erfolgreiche NPC2-Handelsverkäufe (Gesamtzählung) | 370 | 280 | 167 | 203 |

**Interpretation:** Die bestehende Fehlentscheidung lässt sich ohne neue ISK im isolierten Gegenlauf eindeutig verhindern. **Eine bloße zusätzliche Budgetbedingung ist aber keine Wirtschaftssanierung**: Bei Seed42 wirkt der Filter auf NPC1-Absatz und Werftbestand sogar negativ; Seed7 verändert sich anders. Es fehlt weiterhin ein *nachfrageseitig finanzierter, praktisch ausführbarer Liefervertrag*, der echte Rohstoffbeschaffung und den nötigen Flug verbindlich verbindet. Ohne Käuferkasse, an beiden Standorten verfügbare Ware, finanzierte Fracht und Nachfolgekapital kann ein korrekt abgelehnter Auftrag nur weiteres Nichtstun sein.

## 6. QA und nächstes kleines entscheidbares Gate

**[TEST DIREKT BESTANDEN]** Vier neue B-K10p-Gruppen: je 14 Tage real autonom Seed42/7, Original-Replay Seed42 3 Tage samt unabhängigem Hash/Save, sowie paarweise 7-Tage-Routenbudget-Gegenproben Seed42/7 mit eindeutig belegter Nullzahl ungedeckter Routenauswahlen; alle gegen die jeweilige Original-Core-Kopie ausgeführt. **Gesamte GitHub-CI nach tatsächlichem Abschluss gesondert belegen.** Keine 13×90d-Gesamtwirtschaft oder reale iPad-/NAS-Abnahme.

**[OPTION B-K10q, ausdrücklich NICHT IMPLEMENTIERT]** Ein einziger vollständig finanzierter Bedarf der **bestehenden** Aldera-Werft: aus ihren tatsächlichen Mitteln eine kleine reale Siliziumcharge bei Dravos oder Nadir **vorfinanzieren**, einen existierenden Frachter **für die reale Positionierungs- und Frachtarbeit** beauftragen, Silizium einmalig gegen Lieferung physisch nach Aldera transferieren, acht Bauteile/den echten Frachter einschließlich Werft-Lohn auf Original-Rezepten herstellen und **nur gegen wirklich zahlungsfähigen NPC-Käufer** ausliefern. Für jede Zwischenbuchung müssen echtes Verkäufer-/Käuferkonto, vorhandene Waren, tatsächliche Kosten, Vertragsreserve und Rückerstattung bei Ausfall nachweisbar sein. Keine Gratisflüge, keine fremdfinanzierte NPC-Insolvenzgarantie, keine neue ISK-Emission, keine pauschalen Preis- oder Lohnreformen und kein Umbau der Produktspielmechanik ohne gesonderte Freigabe. Dieser **eine** geschlossen finanzierte Auftragsversuch wäre ein erreichbares, unabhängig auditiertes nächstes Teilziel; seine Langzeittragfähigkeit ist damit noch nicht bewiesen.
