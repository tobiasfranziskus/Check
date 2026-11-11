# K1 – Wirtschaft: Vergleich mit dem Referenzmodell, Vertikalschnitt, Tests und offene Entscheidungen

**[DRAFT / ANALYSE · 11.11.2026]** Gehört zu [KANONISCHE_WELT_K1.md](KANONISCHE_WELT_K1.md). Kein Merge, keine Produktregel, **kein Anspruch auf bestandene W6-Dauerwirtschaft**. Alle Simulationszahlen stammen aus tatsächlich ausgeführten Läufen (`node --test tests/welt-wirtschaft.test.mjs`, Rohdaten in [K1_SZENARIO_ERGEBNISSE.jsonl](K1_SZENARIO_ERGEBNISSE.jsonl)). Modellzahlen stammen aus [GESAMTWIRTSCHAFT_REFERENZMODELL.md (#245)](https://github.com/tobiasfranziskus/Check/pull/245) und sind mit `node tools/referenzmodell-c.mjs` unabhängig nachgerechnet.

## 1. Ergebnis in fünf Sätzen

1. In K1 läuft **ein vollständig bezahlter Kreislauf** aus Förderung im Feld, Dockverkauf, Fracht, Wasserwerk, Löhnen, freiwilligem Endabsatz und Folgeproduktion – 730 Spieltage lang mit konstant 33.000 ISK, ohne Emission und ohne Rettung.
2. Er läuft **nur, solange niemand netto spart**. Jede dauerhafte Hortung – durch den Spieler, die Firmen, die Eigentümer oder die Haushalte – beendet ihn nach 3 bis 15 Tagen. Das ist kein Fehler der Umsetzung, sondern folgt aus endlichem Geld ohne Zufluss.
3. **Hüllenersatz** ist für Frachter real nachgewiesen (Erz → Material → Werfthülle → Kauf → bezahlte Überführung). Für Miner gibt es in Regel195 kein Rezept; mit Stilllegung endet die Förderung, sobald das Gründungslager leer ist.
4. Das Referenzmodell C ist nachgerechnet und stimmt. Die ausgeführte Welt weicht in Geldmenge, Geografie, Warenzahl, Preisen, Rezepten und Außenabnahme davon ab; K1 übernimmt bewusst nur Lohn je Flugminute und Wertverzehr je aktiver Minute.
5. Für eine endgültige W6-Integration fehlen neun Produktentscheidungen (Abschnitt 7), an erster Stelle die Emissions- bzw. Außenabnahmeregel und die Eigentums- und Ausschüttungsregel.

## 2. Referenzmodell C: nachgerechnet

`tools/referenzmodell-c.mjs` baut Kostentabelle und Input-Output-Matrix aus den Rezepten neu auf und löst `(I−A)x = f`. Alle veröffentlichten Werte werden reproduziert (`tests/referenzmodell-c.test.mjs`):

| Größe je Tag | #245 | nachgerechnet |
| --- | ---: | ---: |
| Privater Endverbrauch | 286,40 | 286,400000 |
| Außenabnahme = Emission | 240,00 | 240,000000 |
| Löhne | 299,029311 | 299,029311 |
| Buchgewinn | 227,370689 | 227,370689 |
| Ersatz | 91,603008 | 91,603008 |
| Kalkulatorischer Kapitalanspruch | 15,898573 | 15,898573 |
| Umsatz über alle Stufen | 1.872,741846 | 1.872,741846 |
| Ausführungscash | 1.553,768149 | 1.553,768149 |
| Residuum der Mengenlösung | – | 8,9 × 10⁻¹⁶ |

Alle 22 Mengenzeilen (Erz 11,748067 bis Fracht 0,771426) und die Spargrenzen (8 % → 24,90; 30 % → 122,74; 60 % → 429,60; 90 % → 2.577,60 ISK/Tag; Grenze 58,2751 % bei 400 ISK/Tag) stimmen überein. Zusätzlich geprüft: ohne Außenabnahme und ohne Sparen schließt der Binnenkreis monetär exakt, der Ersatz muss trotzdem physisch produziert werden.

Das Modell ist eine statische Rechnung. Es sagt nichts darüber, ob die ausgeführte Welt diesen Zustand erreicht.

## 3. Modell und ausgeführte Welt im Vergleich

Links das Referenzmodell, in der Mitte Regel195 auf `main`, rechts K1. „Wie 195“ heißt: unverändert derselbe Kern.

| Nr. | Thema | Referenzmodell C | Regel195 (`main`) | K1 (dieser Draft) |
| --- | --- | --- | --- | --- |
| 1 | Geldmenge | 55.000 ISK, davon 22.280 für Gründungsanlagen, 6.000 Haushalte | 33.000 ISK; davon **20.000 beim Erz-Exportkäufer**, 13.000 bei Firmen, 0 bei Haushalten | wie 195 |
| 2 | Rezepte, Preise, Zeiten | Eis 5 (2 Min.), Erz 10 (4 Min.), Material 48 (10 Erz → 4), Wasser 16/18, Frachter 1.690 aus 8 Bauteilen, Miner 1.340 | Eis 5 (**1 Min.**, 2 ISK Lohn), Erz 10 (1 Min., 2 ISK), Material 100 (10 Erz → **5**), Wasser 14, Frachter 750 aus **5 Material**, Miner 600 ohne Rezept | wie 195; Wasser in Aldera 16 |
| 3 | Waren | 19 Grundwaren + 2 MK1 | **6**: Erz, Eis, Material, Wasser, Miner, Frachter | wie 195 |
| 4 | Industriekette | Förderung, Raffinerie, Bauteile, 6 Module, 4 Hüllen | Erz- und Eisförderung, Raffinerie, Wasserwerk, Frachterbau | wie 195, vom Disponenten wiederholt genutzt |
| 5 | Transport einschließlich Rückweg | 270 je Rundlos mit Schutz; jede Inputeinheit trägt 5,40 Fracht | 240 je Rundfahrt, 120 ISK Pilotenlohn; Rückweg bezahlt, aber leer | Rückweg trägt Wasser gegen 1 ISK je Einheit; **Flugminuten des Miners bezahlt** |
| 6 | Löhne, Haushalte, Konsum | Haushalte mit eigenem Geld kaufen Wasser, Nahrung, Medizin | zwei Privatpiloten dürfen ortslos Wasser kaufen; übrige Lohnkonten sammeln nur | **alle** Lohnkonten sind Haushalte, kaufen freiwillig und nur am Wohnort |
| 7 | Gewinne, Eigentum, Sparen | Anteilsregister, Dividende aus realisiertem Gewinn, Sparfreiheit | Gewinne bleiben in den Firmen | ein eingetragener Eigentümerhaushalt je Firma; Ausschüttung nur aus freiem Überschuss; Spieler spart standardmäßig |
| 8 | Wartung, Abschreibung, Ersatz | W 0,50 / D 0,30 / K 0,05 je aktiver Minute; Wartung verbraucht Material | kein Verschleiß; erklärter Forschungsverlust mit 930-ISK-Ersatz (#275) | **D 0,30 je aktiver Minute** als nicht ausschüttbare Rücklage; Stilllegung und Ersatzkauf schaltbar. Keine Wartung, kein K |
| 9 | Endnachfrage | Wasser, Nahrung, Medizin, Industriegüter | Wasser (zwei Käufer) | Wasser (15 Haushalte, zwei Orte); Industriegüter nur als Ersatzhüllen |
| 10 | Außenexport | erneuerbare, gedeckelte Abnahme von Hüllen und Modulen in Meridian gegen Emission | endlicher Erz-Etat 20.000 ISK in Aldera, keine Emission, kein Meridian | wie 195; **nach rund zwei Spieltagen aufgebraucht** |
| 11 | Insolvenz, Nachfolge, Konkurrenz | Verwaltung, Verwertung, freier Eintritt | Firmen können stillstehen; keine Nachfolge | wie 195; Stillstand wird gemessen und benannt |
| 12 | Kosten von Spielerschiff und NPC | identisch | identisch (Förderlohn, Frachtlohn) | identisch, zusätzlich Fluglohn und Wertverzehr |

Die Abweichungen der Spalte Regel195 sind als Test festgeschrieben (`tests/referenzmodell-c.test.mjs`, dritter Test).

### 3.1 Bewusst nicht übernommene Modellannahmen

- **Außenabnahme mit Emission.** Geldmodell B verlangt eine gesonderte Freigabe konkreter Emissionsregeln. K1 emittiert nichts; das Audit lehnt jeden Zustand mit `minted ≠ 0` ab.
- **Wartung als Dienst** mit Materialverbrauch (0,50 je Minute) und **kalkulatorischer Kapitalanspruch** (0,05).
- **Schutz und Eskorte**, Risikoaufschläge, Kampfverluste.
- **19 Waren und sieben Systeme.** Regel195 kennt weder Silizium noch Bauteile; die Modellrezepte für Hüllen sind damit nicht baubar.
- **Preise des Modells.** K1 behält die Regel195-Preise, damit Regel195-Stände ohne Umdeutung übernommen werden können.
- **Milli-ISK**, Anteilsregister mit mehreren Eignern, Insolvenzordnung, Gründungslager-Kauf.

### 3.2 Maßstab

K1 ist kein verkleinertes Referenzmodell. Bei voller Auslastung setzt die K1-Welt **9.240 ISK Endverbrauch je Tag** um (600 Wasser), das Modell 286,40 ISK. Der Grund ist die Regel195-Produktivität: 1 Eis je Minute und Frachten ohne Wartezeit. Die Etatzahlen des Modells (240 bzw. 400 ISK je Tag) lassen sich deshalb nicht auf K1 übertragen: 400 ISK je Tag trügen in K1 nur eine Sparquote von 400 / (400 + 9.240) = **4,15 %**.

## 4. Der Vertikalschnitt

### 4.1 Zahlungskette eines Kreislaufs

Eingeschwungener Zustand, gemessen als Differenz Tag 90 → Tag 365 des Szenarios S01, geteilt durch 3.300 Kreisläufe (12 je Tag). Ein Kreislauf sind 50 Eis und 50 Wasser.

| Nr. | Leistung | Zahler → Empfänger | ISK |
| --- | --- | --- | ---: |
| 1 | 50 Förderminuten im Eisfeld | Spielerfirma → Bergleute Aldera | 100 |
| 2 | 21 Flugminuten Dock ↔ Feld | Spielerfirma → eigener Pilot | 21 |
| 3 | 50 Eis am Dock übergeben | Station Aldera → Spielerfirma | 250 |
| 4 | 50 Eis in Nadir geliefert | Station Nadir → Station Aldera (aus Treuhand) | 250 |
| 5 | Hin- und Rückflug, 120 Minuten | Spedition → Frachtpilot (aus Treuhand) | 120 |
| 6 | Rundfracht abgeschlossen | Station Nadir → Spedition (aus Treuhand) | 240 |
| 7 | 5 Wasserchargen, 100 Arbeitsminuten | Station Nadir → Wasserwerker | 100 |
| 8 | 35 Wasser als Rückfracht gekauft | Station Aldera → Station Nadir | 490 |
| 9 | Rückfracht entladen | Station Aldera → Spedition (aus Reserve) | 35 |
| 10 | 15 Wasser in Nadir verbraucht | Haushalte Nadir → Station Nadir | 210 |
| 11 | 35 Wasser in Aldera verbraucht | Haushalte Aldera → Station Aldera | 560 |
| 12 | Ausschüttung des freien Überschusses | vier Firmen → ihre Eigentümer | 429 |

**Kontrolle je Kreislauf:** Endverbrauch 210 + 560 = **770**. Einkommen der Haushalte: Löhne 100 + 21 + 120 + 100 = 341, Ausschüttungen 129 (Spielerfirma) + 155 (Spedition) + 110 (Nadir) + 35 (Aldera) = 429, zusammen **770**. Nadir: +490 +210 −490 −100 = +110. Aldera: +250 +560 −250 −490 −35 = +35. Kein Konto wächst oder schrumpft im Mittel; die Firmenkassen stehen nach 90, 365 und 730 Tagen auf denselben Werten (3.000 / 2.778 / 2.000 / 1.100 / 4.000 / 530).

**Folgefinanzierung:** Am gemessenen Tag 10 nimmt Nadir 8.400 ISK aus tatsächlichen Wasserverkäufen ein und gibt 7.080 ISK für zwölf Eisfrachten und 60 Chargen aus. Die nächste Fracht ist aus Erlösen bezahlt, nicht aus Anfangskapital.

**Herkunft jeder Ware:** Eis nur aus Förderminuten im Feld; Wasser nur aus in Nadir geliefertem Eis; verkauftes Wasser + Lager + Ladung an Bord = produziertes Wasser. Diese Gleichungen prüft jeder Szenariolauf.

### 4.2 Ersatzbedarf in der Kapitalrechnung

| | Miner | Frachter |
| --- | ---: | ---: |
| Kaufpreis | 600 | 750 |
| Aktive Minuten je Kreislauf | 71 (50 Förderung + 21 Flug) | 120 |
| Wertverzehr je Kreislauf (0,30 je Minute) | 21,3 | 36 |
| Lebensdauer | 2.000 aktive Minuten ≈ 28 Kreisläufe ≈ 2,3 Tage | 2.500 Minuten ≈ 21 Kreisläufe ≈ 1,7 Tage |
| Gewinn je Kreislauf vor / nach Wertverzehr | 129 / 107,7 | 155 / 119 |
| Ersatzkosten je Hülle | 600 (nur Gründungslager) | 750 + 60 Überführung |

Die Rücklage bleibt in der Firmenkasse und ist von der Ausschüttung ausgenommen: ausschüttbar ist höchstens `Kasse − Betriebsreserve − Rücklage` und höchstens `Kasse + Buchwert − Anfangskapital`. Im eingeschwungenen Zustand hält die Spielerfirma 3.000 ISK bei 600 ISK Rücklage, die Spedition 2.000 ISK bei 750 ISK.

**Realer Ersatz eines Frachters** (Szenario S13, Verlust an Tag 20): eine Erzfracht (Nadir zahlt 740 ISK für 50 Erz und Fracht, 120 ISK Pilotenlohn), zwei Raffineriechargen (je 20 ISK Lohn, 10 Erz → 5 Material), Werftbau (Werft zahlt 500 ISK für 5 Material und 30 ISK Lohn), Kauf durch die Spedition für 750 ISK, Überführung für 60 ISK. Danach läuft der Kreislauf weiter.

**Nicht geschlossen:** Für Miner existiert kein Rezept. Die Lebensdauern sind Folge des gewählten Satzes von 0,30 ISK und der niedrigen Regel195-Hüllenpreise; sie sind eine Forschungsannahme.

## 5. Szenarien

Alle Szenarien nutzen den Startwert 42 und unterscheiden sich in den **wirtschaftlichen Eingangsbedingungen**. Ein Test stellt sicher, dass alle 15 Eingaben, Geldflüsse und Hashes verschieden sind und dass ein anderer Startwert bei gleichen Bedingungen dieselben Kassen ergibt.

„Läuft“ heißt: in den letzten sieben Tagen wurde gefördert, geliefert, produziert, bezahlt und verbraucht. „Bindender Engpass“ ist die häufigste Ablehnung nach dem letzten Wasserverkauf, bei laufenden Szenarien die der letzten sieben Tage.

**90 Tage** (Startwert 42, tatsächlich ausgeführt)

| Nr. | Szenario | Zustand am Ende | Käuferliquidität Nadir / Aldera / Haushalte | Eis gefördert / Wasser produziert | Wasser tatsächlich verkauft | Eisfrachten / Wasserchargen | Löhne gesamt | Kassen house / npc3 / transport / st_aldera / st_nadir / werft_extern | Lager Eis / Wasser | Ersatzkäufe / gebaute Frachter | Handlungsunfähig | Emission | Bindender Engpass |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | Basis: alle Einkommen werden freiwillig ausgegeben, Spielerfirma schüttet aus | läuft | 4.000 / 1.100 / 19.299 | 53.850 / 53.770 | 53.707 (827.048 ISK) | 1.075 / 5.377 | 373.100 | 3.000 / 2.778 / 2.000 / 1.100 / 4.000 / 530 | 80 / 20 | 0 / 0 | – | 0 | Kein Wasser am Wohnort st_aldera |
| S02 | Spieler spart unbegrenzt: Spielerfirma thesauriert alle Gewinne | steht seit Tag 16 | 3.588 / 1.100 / 1.512 | 7.400 / 7.230 | 7.107 (109.444 ISK) | 147 / 723 | 56.121 | 21.492 / 2.778 / 2.000 / 1.100 / 3.588 / 530 | 170 / 123 | 0 / 0 | – | 0 | Eislager Nadir voll |
| S03 | Kapitalhortung: alle Firmen thesaurieren, Haushalte haben nur Löhne | steht seit Tag 4 | 3.118 / 1.352 / 1.102 | 1.000 / 840 | 722 (11.312 ISK) | 19 / 84 | 12.414 | 4.980 / 15.766 / 4.132 / 1.352 / 3.118 / 2.550 | 160 / 118 | 0 / 0 | – | 0 | Eislager Nadir voll |
| S04 | Haushalte sparen 30 % jedes Einkommens dauerhaft | steht seit Tag 9 | 3.846 / 1.100 / 19.833 | 3.100 / 2.920 | 2.799 (43.638 ISK) | 61 / 292 | 26.824 | 3.000 / 2.691 / 2.000 / 1.100 / 3.846 / 530 | 180 / 121 | 0 / 0 | – | 0 | Eislager Nadir voll |
| S05 | Haushalte sparen 60 % jedes Einkommens dauerhaft | steht seit Tag 6 | 3.146 / 1.100 / 20.464 | 1.000 / 840 | 724 (11.408 ISK) | 19 / 84 | 13.791 | 2.826 / 3.000 / 1.934 / 1.100 / 3.146 / 530 | 160 / 116 | 0 / 0 | – | 0 | Eislager Nadir voll |
| S06 | Eigentümer horten alle Ausschüttungen, Arbeiter konsumieren | steht seit Tag 4 | 3.068 / 1.100 / 21.016 | 1.000 / 840 | 722 (11.312 ISK) | 19 / 84 | 12.414 | 2.826 / 2.526 / 1.934 / 1.100 / 3.068 / 530 | 160 / 118 | 0 / 0 | – | 0 | Eislager Nadir voll |
| S07 | Knappe Käuferliquidität: Nadir startet mit 600 ISK | läuft | 600 / 1.100 / 19.300 | 53.050 / 52.970 | 52.907 (814.726 ISK) | 1.059 / 5.297 | 367.559 | 6.400 / 2.763 / 2.000 / 1.100 / 600 / 530 | 80 / 20 | 0 / 0 | – | 0 | Kein Wasser am Wohnort st_aldera |
| S08 | Unterkapitalisierte Spedition: 760 ISK reichen nur für die Hülle | steht seit Tag 1 | 4.000 / 750 / 21.049 | 50 / 0 | 0 (0 ISK) | 0 / 0 | 5.372 | 3.661 / 3.000 / 10 / 750 / 4.000 / 530 | 50 / 0 | 0 / 0 | transport: 10 ISK < 120 ISK Flugarbeit | 0 | Spedition kann Flugarbeit nicht vorfinanzieren |
| S09 | Begrenzte Nachfrage: Sättigung bei 20 Wasser je Haushalt und Tag | läuft | 4.000 / 1.100 / 19.370 | 12.750 / 12.590 | 12.453 (192.162 ISK) | 254 / 1.259 | 93.626 | 3.000 / 3.000 / 2.000 / 1.100 / 4.000 / 530 | 160 / 137 | 0 / 0 | – | 0 | Eislager Nadir voll |
| S10 | Rohstoffausfall: Eisförderung ruht von Tag 30 bis 45 | läuft | 4.000 / 1.100 / 19.000 | 44.888 / 44.800 | 44.722 (688.736 ISK) | 896 / 4.480 | 311.904 | 3.000 / 2.778 / 2.000 / 1.100 / 4.000 / 530 | 0 / 78 | 0 / 0 | – | 0 | Kein Wasser am Wohnort st_aldera |
| S11 | Transportunterbrechung: keine Eisfracht von Tag 30 bis 45 | läuft | 4.000 / 1.100 / 19.307 | 44.850 / 44.770 | 44.710 (688.482 ISK) | 895 / 4.477 | 311.728 | 3.000 / 2.778 / 2.000 / 1.100 / 4.000 / 530 | 80 / 17 | 0 / 0 | – | 0 | Kein Wasser am Wohnort st_aldera |
| S12 | Verschleiß mit Stilllegung und real finanziertem Ersatz | steht seit Tag 5 | 4.000 / 1.100 / 12.288 | 1.450 / 1.450 | 1.450 (22.160 ISK) | 29 / 145 | 13.228 | 3.000 / 1.800 / 1.592 / 1.100 / 4.000 / 530 | 0 / 0 | 3 / 2 | house: kein einsatzfähiger Miner | 0 | K1: Hülle ist verbraucht und stillgelegt; Ersatz kaufen |
| S13 | Schiffverlust an Tag 20 und Ersatz aus eigener Kasse | läuft | 4.000 / 1.100 / 19.309 | 53.944 / 53.850 | 53.773 (828.120 ISK) | 1.077 / 5.385 | 373.202 | 3.000 / 2.475 / 2.000 / 1.100 / 4.000 / 530 | 0 / 77 | 1 / 2 | – | 0 | Kein Wasser am Wohnort st_aldera |
| S14 | Ungleiches Anfangskapital: Spieler 7.000, Spedition 1.000, Nadir 1.000 ISK | läuft | 1.000 / 1.100 / 19.336 | 53.150 / 53.070 | 53.007 (816.268 ISK) | 1.061 / 5.307 | 368.001 | 7.000 / 2.727 / 1.000 / 1.100 / 1.000 / 530 | 80 / 20 | 0 / 0 | – | 0 | Kein Wasser am Wohnort st_aldera |
| S15 | Käuferkonkurrenz um knappes Wasser: Aldera erhält keine Rückfracht | steht seit Tag 3 | 1.492 / 750 / 23.099 | 450 / 260 | 138 (1.932 ISK) | 8 / 26 | 7.820 | 2.591 / 3.000 / 1.538 / 750 / 1.492 / 530 | 190 / 122 | 0 / 0 | – | 0 | Eislager Nadir voll |

**365 Tage** (Startwert 42, tatsächlich ausgeführt)

| Nr. | Szenario | Zustand am Ende | Käuferliquidität Nadir / Aldera / Haushalte | Eis gefördert / Wasser produziert | Wasser tatsächlich verkauft | Eisfrachten / Wasserchargen | Löhne gesamt | Kassen house / npc3 / transport / st_aldera / st_nadir / werft_extern | Lager Eis / Wasser | Ersatzkäufe / gebaute Frachter | Handlungsunfähig | Emission | Bindender Engpass |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | Basis: alle Einkommen werden freiwillig ausgegeben, Spielerfirma schüttet aus | läuft | 4.000 / 1.100 / 19.299 | 218.850 / 218.770 | 218.707 (3.368.046 ISK) | 4.375 / 21.877 | 1.498.400 | 3.000 / 2.778 / 2.000 / 1.100 / 4.000 / 530 | 80 / 20 | 0 / 0 | – | 0 | Kein Wasser am Wohnort st_aldera |
| S02 | Spieler spart unbegrenzt: Spielerfirma thesauriert alle Gewinne | steht seit Tag 16 | 3.588 / 1.100 / 1.512 | 7.400 / 7.230 | 7.107 (109.444 ISK) | 147 / 723 | 56.121 | 21.492 / 2.778 / 2.000 / 1.100 / 3.588 / 530 | 170 / 123 | 0 / 0 | – | 0 | Eislager Nadir voll |
| S05 | Haushalte sparen 60 % jedes Einkommens dauerhaft | steht seit Tag 6 | 3.146 / 1.100 / 20.464 | 1.000 / 840 | 724 (11.408 ISK) | 19 / 84 | 13.791 | 2.826 / 3.000 / 1.934 / 1.100 / 3.146 / 530 | 160 / 116 | 0 / 0 | – | 0 | Eislager Nadir voll |
| S09 | Begrenzte Nachfrage: Sättigung bei 20 Wasser je Haushalt und Tag | steht seit Tag 320 | 3.894 / 1.100 / 19.476 | 38.600 / 38.430 | 38.315 (590.164 ISK) | 771 / 3.843 | 269.903 | 3.000 / 3.000 / 2.000 / 1.100 / 3.894 / 530 | 170 / 115 | 0 / 0 | – | 0 | Eislager Nadir voll |
| S12 | Verschleiß mit Stilllegung und real finanziertem Ersatz | steht seit Tag 5 | 4.000 / 1.100 / 12.288 | 1.450 / 1.450 | 1.450 (22.160 ISK) | 29 / 145 | 13.228 | 3.000 / 1.800 / 1.592 / 1.100 / 4.000 / 530 | 0 / 0 | 3 / 2 | house: kein einsatzfähiger Miner | 0 | K1: Hülle ist verbraucht und stillgelegt; Ersatz kaufen |

**730 Tage** (Startwert 42, tatsächlich ausgeführt)

| Nr. | Szenario | Zustand am Ende | Käuferliquidität Nadir / Aldera / Haushalte | Eis gefördert / Wasser produziert | Wasser tatsächlich verkauft | Eisfrachten / Wasserchargen | Löhne gesamt | Kassen house / npc3 / transport / st_aldera / st_nadir / werft_extern | Lager Eis / Wasser | Ersatzkäufe / gebaute Frachter | Handlungsunfähig | Emission | Bindender Engpass |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | Basis: alle Einkommen werden freiwillig ausgegeben, Spielerfirma schüttet aus | läuft | 4.000 / 1.100 / 19.300 | 437.850 / 437.770 | 437.708 (6.740.662 ISK) | 8.755 / 43.777 | 2.991.980 | 3.000 / 2.778 / 2.000 / 1.100 / 4.000 / 530 | 80 / 20 | 0 / 0 | – | 0 | Kein Wasser am Wohnort st_aldera |
| S04 | Haushalte sparen 30 % jedes Einkommens dauerhaft | steht seit Tag 9 | 3.846 / 1.100 / 19.833 | 3.100 / 2.920 | 2.799 (43.638 ISK) | 61 / 292 | 26.824 | 3.000 / 2.691 / 2.000 / 1.100 / 3.846 / 530 | 180 / 121 | 0 / 0 | – | 0 | Eislager Nadir voll |

### 5.1 Was die Läufe zeigen

**Läuft (7 von 15 nach 90 Tagen):** S01 Basis, S07 knappe Käuferliquidität, S09 Sättigung, S10 Rohstoffausfall, S11 Transportunterbrechung, S13 Schiffverlust mit Ersatz, S14 ungleiches Kapital. S10 und S11 holen nach 15 Tagen Ausfall wieder auf volle Leistung auf; S07 und S14 arbeiten mit 600 bzw. 1.000 ISK Käuferkasse dauerhaft, weil die Kasse sich in jedem Kreislauf aus Wasserverkäufen füllt.

**Steht (8 von 15):**

| Szenario | Stillstand ab | Wohin das Geld floss | Ursache |
| --- | --- | --- | --- |
| S02 Spieler spart | Tag 16 | Spielerfirma hält 21.492 ISK, Haushalte 1.512 | 129 ISK Gewinn je Kreislauf verlassen den Umlauf |
| S03 alle Firmen thesaurieren | Tag 4 | Firmen | 429 ISK je Kreislauf fehlen den Haushalten |
| S04 Haushalte sparen 30 % | Tag 9 | Haushalte halten 19.833 ISK ungenutzt | Sparziel bindet das Einkommen |
| S05 Haushalte sparen 60 % | Tag 6 | Haushalte 20.464 ISK | wie S04 |
| S06 Eigentümer horten | Tag 4 | Eigentümerhaushalte | Ausschüttungen kehren nicht zurück |
| S08 Spedition unterkapitalisiert | Tag 1 | – | 10 ISK nach Hüllenkauf, 120 ISK Flugarbeit nötig; keine andere Firma kann die Rolle übernehmen |
| S12 Verschleiß mit Stilllegung | Tag 5 | – | Frachter real ersetzt; Miner-Gründungslager leer, kein Rezept |
| S15 keine Rückfracht | Tag 3 | Haushalte Aldera halten Geld ohne Ware | Wasser erreicht den Ort der Kaufkraft nicht |

In allen acht Fällen bleiben 33.000 ISK erhalten, Emission und Senke sind null, und unverkauftes Wasser liegt im Lager. Die 365-Tage-Läufe von S02, S05 und S12 enden mit **exakt** denselben Verkäufen und Kassen wie nach 90 Tagen: ein Stillstand heilt sich nicht.

**Erst im Langlauf sichtbar – S09:** Bei gesättigter Nachfrage (20 Wasser je Haushalt und Tag) läuft die Welt 90 Tage mit 120 bis 140 Wasser je Tag und **verklemmt an Tag 320**. Keine Firma ist zahlungsunfähig, die Haushalte halten 19.476 ISK, in Nadir liegt Wasser. Aber Wasser gelangt nur als Rückfracht einer Eisfahrt nach Aldera, und Nadirs Eislager ist voll. Eine reine Wasserfahrt wäre bei den festen Preisen ein Verlust: 100 Einheiten × 2 ISK Handelsspanne = 200 ISK gegen 240 ISK Fracht. Der Disponent nimmt als NPC kein Verlustgeschäft an.

### 5.2 Warum Sparen den Kreislauf beendet

Es gilt die Gleichung des Referenzmodells: `ΔA = E − B − S + R` (Umlaufgeld ändert sich um Emission minus Senke minus Stilllegung plus Rückkehr). In K1 sind `E = B = 0`. Bei dauerhaftem `S > 0` und `R = 0` sinkt das Umlaufgeld um `S` je Tag, bis ein Käufer seine nächste Losgröße nicht mehr bezahlen kann.

Für denselben Endverbrauch von 9.240 ISK je Tag wäre nach `E = s·C/(1−s)` nötig:

| Sparquote der Einkommen | Erforderlicher Zufluss je Tag in K1 | Gemessener Stillstand ohne Zufluss |
| ---: | ---: | --- |
| 0 % | 0 | läuft 730 Tage (S01) |
| 8 % | 803 ISK | – |
| 30 % | 3.960 ISK | Tag 9 (S04) |
| 60 % | 13.860 ISK | Tag 6 (S05) |

Das ist kein Argument für Zwangskonsum. Der Spieler darf unbegrenzt sparen; die Welt darf dann schrumpfen oder stillstehen. Eine Regel, die dauerhaften Betrieb **trotz** Sparens verspricht, braucht einen Zufluss – und der ist eine Produktentscheidung.

### 5.3 Wo das Anfangsgeld landet

Der Erz-Exportkäufer gibt seine 20.000 ISK in den ersten zwei Spieltagen aus. Sie fließen über die Erzverträge an den NPC-Bergbau (20.000 ISK Erlös für 2.000 Erz, davon 4.000 ISK Bergbaulohn) und von dort als Lohn und Ausschüttung an die Haushalte. Dort liegen im eingeschwungenen Zustand rund 19.300 ISK Kaufkraft bei Haushalten, die mehr Wasser kaufen wollen, als produziert wird. Der bindende Engpass der laufenden Szenarien ist deshalb „Kein Wasser am Wohnort“: die Welt ist **angebotsbegrenzt**, die Preise sind fest. Was mit überschüssiger Kaufkraft geschehen soll – Preise, weitere Güter, mehr Kapazität –, ist offen.

### 5.4 Grenzen der Aussage

- **Feste Preise.** Es gibt keine Preisreaktion auf Knappheit oder Überhang.
- **Ein Lieferant je Rolle.** Keine Konkurrenz zwischen Anbietern; „Käuferkonkurrenz“ ist Konkurrenz der Haushalte um knappes Wasser.
- **Verhalten ist gesetzt.** Spar- und Ausschüttungsquoten sind Szenarioparameter, keine Entscheidungen der Akteure.
- **Ein Konsumgut.** Haushalte können nur Wasser kaufen.
- **Kein Kampf, kein Risiko.**
- **S01 ist ein Grenzfall.** Der Dauerlauf setzt null Nettosparen voraus, auch beim Spieler.

## 6. Verbindliche Prüfpunkte

| Anforderung | Stand |
| --- | --- |
| Feste Seeds, identische Replay-Hashes | erfüllt: Replay, Teilschritt-Gleichheit, Wiederholung S07 |
| Unabhängiges Geld-, Waren-, Eigentums-, Schiffs- und Reservierungsaudit | erfüllt: Kern-Audits + K1-Audit nach jedem Szenariotag |
| Keine negativen Kassen, Doppelbuchungen, kostenlosen Leistungen | erfüllt für alle modellierten Leistungen; Frachter-An-/Abflug im System ist nicht modelliert |
| Save/Load während Produktion, Förderung, Flug, Abrechnung, offener Treuhand | erfüllt: elf Lagen einschließlich Teilschritt |
| Ungültige Befehle ohne Nebenwirkung | erfüllt: 18 Ablehnungen mit Zustandsvergleich |
| Begrenzte Nachfrage, fehlende Käuferliquidität | S07, S09, S14 |
| Freiwillige Sparpolitik, Kapitalhortung | S02–S06 |
| Fehlschlag einzelner Konzerne und finanzierte Nachfolge | Fehlschlag: S08. **Nachfolge nicht möglich** – offen |
| Rohstoffausfall, Transportunterbrechung, Schiffverlust, Ersatz | S10, S11, S12, S13 |
| Käuferkonkurrenz, ungleiches Anfangskapital | S15, S14 |
| 13 wirtschaftlich unterschiedliche Szenarien × 90 Tage | 15 ausgeführt |
| 365-Tage-Krisenläufe | 5 ausgeführt (S01, S02, S05, S09, S12) |
| 730-Tage-Grenzfälle | 2 ausgeführt (S01, S04) |

**Urteil:** Das System produziert und bezahlt unter dokumentierten Voraussetzungen wiederholbar reale Leistungen, hält seine Stillstände ohne verdeckte Stabilisierung aus und benennt ihre Ursache. Es erfüllt **nicht** den W6-Anspruch: Miner sind nicht ersetzbar, Nachfolge ist nicht möglich, und der Dauerbetrieb hängt an Verhaltensannahmen, die keine beschlossenen Produktregeln sind.

## 7. Entscheidungsübersicht für den Nutzer

Jede Zeile nennt, was K1 als Forschungsannahme gesetzt hat, die berechneten Alternativen und was ohne Entscheidung offen bleibt. Nichts davon ist freigegeben.

| Nr. | Entscheidung | K1-Annahme | Berechnete Alternativen | Ohne Entscheidung |
| --- | --- | --- | --- | --- |
| E1 | **Geldzufluss / Außenabnahme** (Geldmodell B) | keiner; endlicher Erz-Etat 20.000 ISK | (a) kein Zufluss: Dauerbetrieb nur bei null Nettosparen. (b) erneuerbarer Etat gegen gelieferte Güter: je Tag `s·C/(1−s)` – in K1 803 / 3.960 / 13.860 ISK bei 8 / 30 / 60 %. (c) Etat des Modells (240–400 ISK/Tag) nur zusammen mit dem Modellmaßstab; in K1 trägt er 4,15 % | Sparen des Spielers beendet die Wirtschaft (S02: Tag 16) |
| E2 | **Maßstab der Welt** | Regel195-Produktivität: 600 Wasser je Tag | (a) so lassen. (b) Modellzeiten und Modellmengen: das Referenzmodell rechnet mit 286,40 statt 9.240 ISK Endverbrauch je Tag; Durchsatz und Etatbedarf wären entsprechend kleiner | E1 lässt sich nicht beziffern |
| E3 | **Eigentum und Ausschüttung** | ein Eigentümerhaushalt je Firma; täglich der freie Überschuss über Anfangskapital, Betriebsreserve und Rücklage | (a) so. (b) Anteilsregister mit mehreren Eignern. (c) keine Ausschüttung: Stillstand an Tag 4 (S03) | Firmengewinne haben keinen Rückweg |
| E4 | **Bezahlte Flugarbeit des Miners** (E4 des Flugentwurfs) | 1 ISK je Minute außerhalb des Docks, 40 ISK Reserve | (a) so: 21 ISK je Kreislauf, der Minergewinn sinkt von 150 auf 129 ISK. (b) kostenlos wie Regel195: Flug wäre unbezahlte Arbeit | Fluglohn bleibt Forschungsannahme |
| E5 | **Haushalte und Konsum** | jedes Lohnkonto ist ein Haushalt; Kauf nur am Wohnort; einziges Gut Wasser | (a) so. (b) weitere Güter (Nahrung, Medizin) nach Modell. (c) Sättigung: läuft 90 Tage, verklemmt an Tag 320 (S09) | 19.300 ISK Kaufkraft finden kein Angebot |
| E6 | **Verschleiß und Ersatz** | 0,30 ISK je aktiver Minute; Stilllegung aus | (a) nur Rücklage (Standard). (b) Stilllegung an: braucht ein Miner-Rezept, sonst Ende an Tag 5 (S12). (c) höhere Hüllenpreise des Modells: Miner 4.467, Frachter 5.633 aktive Minuten | Ersatz bleibt Rechnung statt Zwang |
| E7 | **Preise und Tarife** | Regel195-Preise; Wasser Aldera 16; Rückfracht 1 ISK je Einheit | (a) so: reine Wasserfahrt verliert 40 ISK. (b) Preisreaktion auf Knappheit. (c) Modellpreise als Paket – dann keine Übernahme von Regel195-Ständen ohne Neubewertung | Verklemmung bei Sättigung bleibt möglich |
| E8 | **Firmenrollen und Nachfolge** | Rollen an Konten gebunden (`house`, `npc3`, `transport`) | (a) so: ein Ausfall ist endgültig (S08). (b) Rollen als Eigenschaft beliebiger Firmen mit bezahltem Eintritt | „real finanzierte Nachfolge“ ist nicht prüfbar |
| E9 | **Produktumstellung** | K1 ist ein getrennter Einstieg mit eigener Ablage | (a) so lassen und weiter prüfen. (b) K1 wird Produkt; Regel195-Stände nur über die ausdrückliche Übernahme; endgültige Regelnummer festlegen | Produkt bleibt Regel195 ohne Flug |

**Reihenfolge:** E1 und E2 gehören zusammen und bestimmen alles Weitere. E3 und E5 entscheiden, ob der Kreislauf ohne Zufluss überhaupt schließen darf. E6 und E8 sind Voraussetzung dafür, Phase D (weitere Waren und Rollen) sinnvoll zu beginnen.

## 8. Phase D: was offen bleibt und warum

Die Erweiterung auf die 19 Waren und sieben Systeme des Referenzmodells wurde **nicht** begonnen. Gründe:

1. **Der Kern kennt je Stufe genau eine Rolle und einen Auftrag gleichzeitig** (eine Fracht, eine Wassercharge, ein Werftauftrag, eine Spedition). Mehr Waren hieße heute: eine weitere fest verdrahtete Stufe je Ware. Das wäre die Fortsetzung der Stufenkopien, nicht ihre Ablösung.
2. **Die Stufen-Audits rekonstruieren Kassen aus festen Formeln.** K1 zeigt mit dem Netto-Term, wie neue Flüsse daneben bestehen können. Für viele Waren braucht es allgemeine Verträge, Lose und Belege (Abschnitt 11 des Referenzmodells) – ein Umbau des Kerns, der eine eigene Freigabe verdient.
3. **Erz hat keine Nachfrage außer dem endlichen Exportetat.** Neue Erzaufträge setzen Geld beim Exportkäufer voraus. Nach 2.000 Erz kann nichts mehr gefördert werden; der Ersatzbau lebt vom vorher eingelagerten Erz.
4. **Ohne E1–E3 wären Preise und Mengen weiterer Waren geraten.**

Vorgeschlagene nächste Schritte, jeweils als eigener kleiner Auftrag: (1) Miner-Rezept in der vorhandenen Werft und Erznachfrage aus der eigenen Industrie; (2) Rollen von Kontonamen lösen; (3) allgemeiner Auftrags- und Belegkern für mehrere gleichzeitige Verträge; erst dann (4) weitere Waren und Systeme.
