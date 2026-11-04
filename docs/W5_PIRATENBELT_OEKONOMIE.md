# W5-Auftrag C – Piratenbelts, Kopfgeld und Pilotenfortschritt

**Status: [ANALYSE/DRAFT] · 04.11.2026 · nichts beschlossen, nichts integriert.**
Keine Produktentscheidung zu Kopfgeldhöhe, Spielerfaktor oder neuer ISK-Emission. Alle Schwellen, Boni, Vertragssätze und Finanzierungsvarianten sind **Vorschläge [OPTION]**.

| Punkt | Stand |
|---|---|
| Ausgangscommit | `3d1d3ca` = Head von Draft [#171](https://github.com/tobiasfranziskus/Check/pull/171) (W0–W5-Stack bis #171) |
| `main` | `b4e604d6`, unverändert |
| Branch | `research/w5-piratenbelt-audit` |
| Geänderte Dateien | nur `tools/w5-piratenbelt-audit.mjs`, `tests/w5-piratenbelt-audit.test.mjs`, dieses Dokument |
| Nicht geändert | `index.html`, Core-Module, Speicherformate, `ROADMAP.md`, `PROJEKTSTATUS.md`, Grafik-/Codex-Branches |
| Geprüfter Kern | Regel 14 / Schema 8 aus `index.html`, Core-Quelltext sha256 `aaf5242d01bc2997…`, Datei sha256 `c8888030…` |

Die W5-Forschungswelten (Regel 15–19) enthalten **keine Piraten, keine Jäger und kein Kopfgeld**; Piraten-, Kampf- und Kopfgeldregeln existieren nur im Regel-14-Hauptkern. Dieser Auftrag prüft daher den Regel-14-Kern und definiert, was eine spätere W-Integration erfüllen muss.

---

## 1. Methode und Werkzeug

`tools/w5-piratenbelt-audit.mjs` lädt den Kern **unverändert** aus `index.html` (wie die bestehenden Tests) und verwendet ausschließlich dessen eigene Funktionen: `createState`, `m_core_sicherheit.patrouille`, `piratenErsatz`, `betriebskosten`, `reise`, `kampf`, `audit`, `submit`/`advance`, Preis- und Gebührenfunktion. **Kein zweiter Simulationskern, keine erfundene Welt.**

1. **Referenzwerte** werden aus `m_data_economy`, `m_data_world`, `m_data_combat` gelesen, nicht abgeschrieben.
2. **Piratenanomalien** werden aus der vorhandenen Welt abgeleitet: gesetzlose Systeme mit Piraten-Soll und *ohne* Staatsjäger → **Dravos** (1 × `pirat_klein`) und **Meridian** (1 × `pirat_mittel` + 1 × `pirat_gross`). Nadir/Orion sind umkämpft und werden schon von Staatsjägern bejagt; sie sind keine reinen Kopfgeldzonen.
3. **Kampfstatistik:** je Probe echte Startwelt, alle Schiffe entfernt, nur Jägergruppe + Anomaliepiraten, dann **ein** echter `patrouille`-Aufruf (Begegnungswahrscheinlichkeit 600 ‰, Kampf, Kopfgeldbuchung, Schiffsentfernung). 4.000 Proben je Konfiguration, nach jeder Probe `audit()`.
4. **Stunden-/Rentabilitätsrechnung und Finanzierungsvarianten** sind reine, ganzzahlige **Kontenfortschreibungen** auf diesen Messwerten. Bilanzidentität je Lauf: `Σ Anfangskapital + neu geschöpft − vernichtet = Σ Endbestände`.
5. **Echte Kernläufe:** 13 Seeds (dieselbe Liste wie B5b: 7, 11, 1, 2, 65535, 42, 1234, 98765, 3, 99, 2024, 2025, 314159) × 90 Tage × 9 Szenarien im unveränderten `advance()`. Szenarioparameter sind ausschließlich vorhandene Regelzahlen in einer Regelkopie (Überfallchance, Kopfgeld, Spielerfaktor, Ersatzpreis). Der Spieler handelt nur über validierte Befehle (`shipTrade` Jäger an der Werft Aldera → `shipActivate` → `shipMove` → `shipHunt`). Der NPC-Konzernjäger entsteht nur über einen zusätzlichen **Sollplatz ohne Schiff**; den Kauf führt der vorhandene `ersatzkauf()` aus Werftbestand und Konzernkasse aus.

Aufruf (412–425 s auf dem Cloud-Container; Bericht-JSON sha256 `73b1638f1665a500…`; zwei unabhängige Volläufe lieferten identische Kern-, Kampf- und Finanzierungsergebnisse):

```sh
node tools/w5-piratenbelt-audit.mjs --proben=4000 --tage=90 --seeds=alle --out=bericht.json
```

---

## 2. Referenzwerte und Geldflussklassen (Ist, Regel 14)

| Größe | Wert | Quelle | Buchungsklasse im Kern |
|---|---|---|---|
| Kopfgeld klein/mittel/groß | 120 / 180 / 240 ISK | `economy.kopfgeld` | **neu geschöpft** (`minted`) an den Schiffseigentümer |
| Spielerfaktor | 3 (→ 360 / 540 / 720) | `economy.kopfgeldFaktor` | Emission ×3 nur für `house` |
| Jäger | Basis 900, Kaufpreis Start 900 + 36 Gebühr = **936 ISK** | Preis-/Gebührfunktion an Werft Aldera | Transfer Käufer → Station/Fonds; Hülle ist Ware (Rezept 8 Bauteile + 4 Material, 32 min) |
| Jägerbetrieb | 50 ISK/h | `world.betriebskosten.jaeger` | Spieler/NPC: **Transfer an Systemfonds**; Sicherheit: **vernichtet** (`senkeBesitzer`) |
| Piratenersatz | 300 / 450 / 900 ISK | `combat.ersatzpreis` | **Transfer** Piratenkasse → Station Meridian; **keine Ware** verbraucht |
| Piratenkasse Start | 3.000 ISK | `owners.pirates` | Anfangskapital |
| Sicherheitskasse Start | 5.000 ISK | `owners.security` | Anfangskapital; einzige laufende Einnahme = Kopfgeld |
| Geldmenge Start | 55.000 ISK | `state.initialSupply` | – |
| Piraten-Einnahmen | Beuteverkauf an Meridian (Transfer), Schutzgeld 0 ISK/h | `zerstoeren`, `schutzgeld` | nur bei Überfällen |

**Prämie/Ersatzpreis-Verhältnis** (zentrale Kennzahl für Inflation bei finanziertem Respawn): klein 0,40, mittel 0,40, groß 0,27 bei Faktor 1; **1,20 / 1,20 / 0,80 bei Faktor 3**. Bei Faktor 3 schöpft der Staat für einen kleinen Piraten mehr ISK (360), als die Piraten für seinen Ersatz bezahlen (300).

---

## 3. Befunde am unveränderten Kern (gemessen)

Jeder Befund ist durch einen ausgeführten Test (`tests/w5-piratenbelt-audit.test.mjs`) oder den 13×90-Lauf belegt.

| Nr. | Befund | Beleg |
|---|---|---|
| **B1** | **Piratenrespawn ohne Hülle.** `piratenErsatz` bucht 300/450/900 ISK an die Meridian-Station, verändert aber weder Ledger noch Lager: Die Hülle entsteht aus nichts. Nach Auftragsregel unzulässig. | Test „Piratenersatz … verbraucht aber keine Hüllenware“ |
| B2 | Ohne Piratenkasse kein Ersatz – die Kasse ist endlich, ein Gratisrespawn existiert nicht. | gleicher Test, Kasse 299 |
| **B3** | **Staatsjäger patrouillieren unbezahlt.** 5 Staatsjäger × 50 ISK × 2.160 h = 540.000 ISK Soll je Seed; bezahlt (vernichtet) 110.480–143.240 ISK. **Unbezahlt 396.760–429.520 ISK je Seed (77 %)**, Summe 13 Seeds 5,40 Mio. ISK. | 13×90 `ist` |
| **B4** | **Kopfgeld ist im Ist der einzige Emissionskanal** (`minted = Kopfgeld` in allen 117 Läufen) und wird fast vollständig über Staatsbetrieb vernichtet: minted 1.553.640, burned 1.618.040, netto −64.400 ISK (= 13 × ~5.000 Startkasse). Die scheinbare Geldmengenstabilität beruht auf B3. | 13×90 `ist` |
| B5 | Kopfgeld wird je Abschuss genau einmal gebucht (Pirat wird entfernt, zweiter Aufruf bucht nichts); Spieler ×3, NPC ×1. | Test „Abschuss schöpft genau ein Kopfgeld“ |
| **B6** | **Autostopp nur für den Spieler.** Bei fehlendem Budget setzt `betriebskosten` den Spielerjäger auf `halten`; ein NPC-Jäger jagt weiter. In beiden Fällen wird nur `min(Kasse, Kosten)` gezahlt; der Rest verschwindet **ohne Forderung** (10 von 50 ISK im Test). | Test „Spielerjagd stoppt …“ |
| **B7** | **Jagd ohne Beute kostet nur NPC.** `reise()` nimmt nur den Spieler aus. NPC-Konzernjäger in Meridian: **103.600–107.500 ISK berechnete Betriebslast ohne Beute je Seed**. | Test „Jagd ohne Beute …“, 13×90 `konzern_meridian` |
| **B8** | **NPC-Ersatzkauf hat kein Rentabilitätsgate.** NPC1 kauft in Meridian je Seed 1–8 Jäger (Σ 46, alle bezahlt aus Werftbestand), verliert 0–7 (Σ 33 ≈ 30.900 ISK Hüllenwert) und erhält dafür Σ 5.640 ISK Kopfgeld; mit Kopfgeld 0 identische Käufe/Verluste. | 13×90 `konzern_meridian(_null_kopfgeld)` |
| B9 | Kein persistierter Abschussbeleg mit Teilnehmern: der Kern führt nur `stats.abschuesse` (Summe) und ein auf 60 Einträge gekürztes Ereignislog. XP-Zuordnung braucht künftig einen eigenen Beleg (siehe §7). | Codeprüfung `patrouille`, `protokolliere` |
| **B10** | **Spielerfaktor 3 widerspricht der [BESCHLOSSEN] Gleichbehandlung Spieler/NPC** („dieselbe … Kampfregel“, ROADMAP). Nur Hinweis, keine Entscheidung. | ROADMAP, `economy.kopfgeldFaktor` |

---

## 4. Kampfwerte in den zwei Anomalien (echte `patrouille`, 4.000 Proben je Zeile)

Je 1.000 Jagdstunden bei **voll besetzter** Anomalie. Eigentümer beeinflusst nur den Kopfgeldfaktor; die Kampfwerte sind für `house` und `npc1` identisch.

| Anomalie | Jäger | Kämpfe | Abschüsse (Klasse) | Jägerverluste | Gruppe vernichtet | Kopfgeld/h Spieler ×3 | Kopfgeld/h NPC ×1 |
|---|---|---|---|---|---|---|---|
| Dravos | 1 | 601 | 592 klein | 0 | 0 | 213 | 71 |
| Dravos | 2 | 601 | 601 klein | 0 | 0 | 216 | 72 |
| Dravos | 3 | 601 | 601 klein | 0 | 0 | 216 | 72 |
| Meridian | 1 | 601 | 40 mittel | 106 | 106 | 22 | 7 |
| Meridian | 2 | 601 | 528 mittel + 181 groß | 487 | 1 | 415 | 138 |
| Meridian | 3 | 601 | 601 mittel + 575 groß | 254 | 0 | 738 | 246 |

**Stundenergebnis Betreiber** (Kopfgeld − 50 ISK/h je Jäger − Verluste × 936 ISK):

| Anomalie | Jäger | Spieler ×3 | NPC/Faktor 1 |
|---|---|---|---|
| Dravos | 1 | **+163 ISK/h** rentabel | **+21 ISK/h** knapp rentabel |
| Dravos | 2 | +116 | −28 defizitär |
| Dravos | 3 | +66 | −78 defizitär |
| Meridian | 1 | −128 defizitär | −142 defizitär |
| Meridian | 2 | −140 defizitär | −417 defizitär |
| Meridian | 3 | **+351** rentabel | −142 defizitär |

Diese Werte gelten **nur, solange die Anomalie besetzt ist** – siehe §6: Ohne Piraten-Einnahmen ist sie nach wenigen Stunden leer.

---

## 5. Rentabilitäts-, Defizit- und Inflationsgrenzen

**Mindestabschüsse je 100 Jagdstunden für Kostendeckung eines Jägers** (Betrieb 5.000 ISK/100 h + Verluste × 936 ISK):

| Jägerverluste / 100 h | klein ×1 | klein ×3 | groß ×1 | groß ×3 |
|---|---|---|---|---|
| 0 | 42 | 14 | 21 | 7 |
| 1 | 50 | 17 | 25 | 9 |
| 2 | 58 | 20 | 29 | 10 |
| 5 | 81 | 27 | 41 | 14 |
| 10 | 120 | 40 | 60 | 20 |

Gemessen sind höchstens **~60 Begegnungen je 100 h** (patrouilleChance 600 ‰). Mit Faktor 1 ist Ratting in Dravos daher nur mit **genau einem Jäger** und nur bei ständig nachgefüllter Anomalie knapp kostendeckend (59 Abschüsse > 42 nötig). Mit Faktor 3 ist es deutlich rentabel.

**Einstufung der Geldmenge** (Betrieb an Fonds und Hüllenkauf an Werft sind Transfers, keine Senken):

- **KG0 (Ist, Emission):** jeder bezahlte Abschuss erhöht die Geldmenge um Prämie × Faktor → *inflationär*, auch wenn der Jäger selbst defizitär ist. Einzige Gegen-Senke in Regel 14 sind die (größtenteils unbezahlten, B3) Staatsjäger.
- **KG1/KG2 (Transfer):** Abschüsse sind geldmengenneutral; Kopfgeld endet bei leerer Quelle.
- Obergrenze der Emission bei Ratting ohne Piraten-Einnahmen: `(Startbestand + ⌊Piratenkasse / Ersatzpreis⌋) × Prämie × Faktor`, für Dravos 11 × 120 = 1.320 ISK (24 ‰ der Startgeldmenge) bzw. ×3 = 3.960 ISK (72 ‰) je 90 Tage – geteilt mit Staatsabschüssen in Nadir/Orion.

**Ergebnis:** Rentabel wird Ratting nur bei hoher Abschussrate (≥ 42/100 h klein bei Faktor 1) **und** laufend finanziertem Piratennachschub; defizitär bei Meridian mit 1–2 Jägern, bei mehr als einem Jäger in Dravos (Faktor 1) und immer bei leerer Anomalie (−50 ISK/h für NPC, B7); inflationär ist jeder Abschuss unter KG0.

---

## 6. Finanzierungsvarianten (Kontenfortschreibung, 90 Tage, Dravos, 1 Jäger, gemessene 592 Abschüsse / 1.000 h)

| Piratenbestand | Kopfgeld | Faktor | Abschüsse | Respawns | davon ohne Hülle | neu geschöpft | unbezahltes Kopfgeld | Betreiber netto | zulässig |
|---|---|---|---|---|---|---|---|---|---|
| PB0 Ist (Kasse → Meridian, Hülle aus nichts) | KG0 Emission | 1 / 3 | 11 | 10 | **10** | 1.320 / 3.960 | 0 | +370 / +3.010 | **nein** |
| PB0 | KG1 Staatskasse | 1 / 3 | 11 | 10 | 10 | 0 | 0 | +370 / +3.010 | nein |
| PB0 | KG2 Systemfonds | 3 | 11 | 10 | 10 | 0 | 2.160 | +850 | nein |
| PB0 | KG3 Deckel 2.000 | 3 | 11 | 10 | 10 | 2.000 | 1.960 | +1.050 | nein |
| PB1 endlicher Anfangsbestand | jede | 1 / 3 | 1 | 0 | 0 | ≤ 120 / ≤ 360 | 0 | +20 / +260 | ja |
| PB2 Werftkauf aus Hüllenlager (5) | KG0 | 1 / 3 | 6 | 5 | 0 | 720 / 2.160 | 0 | +170 / +1.610 | ja |
| PB2 | KG1 | 1 / 3 | 6 | 5 | 0 | 0 | 0 | +170 / +1.610 | ja |
| PB2 | KG2 | 3 | 6 | 5 | 0 | 0 | 720 | +890 | ja |
| PB3 einnahmegebunden | jede | 1 / 3 | 1 | 0 | 0 | ≤ 120 / ≤ 360 | 0 | +20 / +260 | ja |

Alle 32 Läufe: Bilanzidentität erfüllt. Die Tabelle nimmt vereinfachend an, die gesamte Piratenkasse stehe Dravos zur Verfügung; im echten Kern teilen Nadir/Orion (Staatsabschüsse) dieselbe Kasse.

**Bewertung [OPTION, keine Entscheidung]:**
- **PB0 ist unzulässig** (B1). Für jede Integration muss eine Piratenhülle als Ware existieren.
- **PB2 + KG1/KG2** ist die einzige Kombination ohne Gratishülle **und** ohne Geldschöpfung; ihre Reichweite ist streng durch Hüllenlager, Piratenkasse und Kopfgeldquelle begrenzt. Sie erfordert eine reale Piratenwerft/Hüllenquelle (Material aus Lager) – Produktentscheidung offen.
- **KG2** ist nur tragfähig, wenn der Fonds andere Zuflüsse als die Jägerbetriebskosten hat; sonst bezahlt der Jäger sein eigenes Kopfgeld (Kreislauf).
- **KG3** macht Emission sichtbar und begrenzt, legt aber keinen Betrag fest; der Deckel ist eine Produktentscheidung.
- **PB1/PB3 ohne Einnahmen** liefern pro Anomalie nur den Startbestand – Ratting ist dann ein einmaliges Ereignis, kein Beruf.

### Echter Kern, 13 Seeds × 90 Tage (alle 117 Läufe audit-sauber, Hash deterministisch)

Summen über 13 Seeds, in Klammern [min … max] je Seed.

| Szenario | minted | burned | Kopfgeld Jäger | Piratenersatz | Kasse Piraten leer ab Stunde | Käufe | Jägerverluste | Stunden mit Beute | Autostopps | Pilot-XP |
|---|---|---|---|---|---|---|---|---|---|---|
| `ist` (Regel 14 unverändert) | 1.553.640 [105.480…138.480] | 1.618.040 | – | 12.932 [877…1.154] | 6–22 (danach Beute-Nachschub) | – | – | – | – | – |
| `ratting_dravos` (Spieler ×3) | 29.640 | 80.600 | 14.040 [720…1.440] | 130 [10] | 5–8 | 13 [1] | 0 | 68 [3…7] | 0 | 360 [20…40] |
| `ratting_dravos_f1` | 20.280 | 80.600 | 4.680 [240…480] | 130 | 5–8 | 13 | 0 | 68 | 0 | 360 |
| `ratting_meridian` | 22.140 | 83.000 | 4.140 [0…1.800] | 127 | 5–9 | 15 [1…2] | 12 [0…2] | 133 | 2.137 (ein Seed: Kasse leer) | 95 [0…35] |
| `null_kopfgeld` | **0** | 65.000 | 0 | 130 | 5–8 | 13 | 0 | 68 | 0 | 360 |
| `kein_ersatz` (PB1) | 7.800 | 68.120 | 4.680 [360] | **0** | 0 (Kasse bleibt 3.000) | 13 | 0 | 3 [0…1] | 0 | 30 |
| `null_budget` | 18.720 (nur Staat) | 83.720 | **0** | 130 | 5–10 | 13 | 0 | **0** | **28.041** [2.157] | 0 |
| `konzern_meridian` (NPC1) | 24.120 | 83.480 | 5.640 [420…600] | 129 | 5–10 | 46 [1…8] | 33 [0…7] | 404 [6…78] | 0 (NPC kein Autostopp) | 470 [35…50] |
| `konzern_meridian_null_kopfgeld` | 0 | 65.000 | 0 | 129 | 5–10 | 46 | 33 | 404 | 0 | 470 |

Kernaussagen:
- **Ratting ohne Überfälle erschöpft die Piratenkasse in 5–10 Stunden.** Danach bleiben die Anomalien leer (Dravos) bzw. nur von nicht zu besiegenden Restpiraten besetzt; Spielerjäger erzielen 2–4 Abschüsse in 90 Tagen. Die Forderung „keine unbegrenzte Flottenerneuerung ohne Einnahmen“ ist im Kern **erfüllt**, die Forderung „keine Hülle ohne Ware“ **nicht** (B1).
- **0-Kopfgeld** senkt minted auf 0, ändert aber weder Käufe noch Verluste – der NPC kauft trotzdem (B8).
- **Nullbudget:** der Kern stoppt den Spielerjäger in jeder der 2.157 Stunden; 0 Abschüsse, 0 Kopfgeld.
- **Pilot-XP bleibt über Schiffsverluste erhalten** (NPC1: bis zu 7 verlorene Hüllen, XP 35–50 ungeschmälert).

---

## 7. Pilotenfortschritt – Vorschlag [OPTION, nicht beschlossen]

**Identität:** `pilotId` ist dauerhaft und unabhängig von `schiffId`, Eigentümer und Kontoinhaber (ROADMAP: Schiffseigentümer ≠ Pilot ≠ Auftraggeber ≠ Kontoinhaber). Der Pilot hält eine Schiffszuordnung `schiff` und eine Historie; ein Schiffsverlust setzt nur `schiff = null` und zählt `verloreneSchiffe`. Ob Piloten selbst sterben können, ist eine eigene spätere Entscheidung.

**XP nur für belegte Abschüsse:** Ein Beleg ist der vom Kern entfernte Pirat (eindeutige Schiff-ID, `belegId = abschuss:<seed/spiel>:<piratId>`) plus die Jägergruppe, die zu Stundenbeginn im System `jagd`/`patrouille` hatte. Keine XP für Anwesenheit, Flucht, Reisen oder Zeit.

| Piratenklasse | XP je Abschuss (Vorschlag) |
|---|---|
| klein | 10 |
| mittel | 15 |
| groß | 20 |

Aufteilung ganzzahlig auf die Teilnehmer, Rest an die nach `pilotId` sortierten ersten Teilnehmer; jeder `belegId` wird genau einmal angenommen (Wiederholung → „bereits vergeben“). Auch ein im Kampf verlorener Teilnehmer erhält seinen Anteil.

| Rang | Name | ab XP | Trefferbonus | Gehaltszuschlag (Transfer) |
|---|---|---|---|---|
| 0 | Anwärter | 0 | +0 % | +0 ISK/h |
| 1 | Pilot | 50 | +1 % | +2 ISK/h |
| 2 | Jagdpilot | 150 | +2 % | +4 ISK/h |
| 3 | Veteran | 400 | +3 % | +6 ISK/h |
| 4 | Ass | 1.000 | **+4 % (Deckel)** | **+8 ISK/h (Deckel)** |

Zum Vergleich: In 90 Tagen erreichte der beste gemessene Pilot 50 XP (Rang 1). Rang 4 braucht ~100 kleine Abschüsse.

**Bonusprüfung mit der echten `patrouille`** (Trefferwert 511 → 521 → 531):

| Anomalie | Rang 0 | Rang 2 | Rang 4 |
|---|---|---|---|
| Dravos Abschüsse / Verluste je 1.000 h | 592 / 0 | 593 / 0 | 594 / 0 |
| Meridian (1 Jäger) Abschüsse / Verluste | 40 / 106 | 44 / 106 | 47 / 106 |
| Kopfgeld/h Spieler Meridian | 22 | 24 | 25 |

Der gedeckelte Bonus verändert Kampfausgang und Emission nur um ≤ 7 Abschüsse/1.000 h; er macht keine defizitäre Konfiguration rentabel. Andere Bonusarten (HP, Rüstung, Fluchtschwelle) sind ungeprüft und deshalb **nicht** vorgeschlagen.

**Gehalt, Pacht und Kopfgeldbeteiligung** sind ausschließlich Transfers; es gibt genau eine Kopfgeldquelle je Abschuss. Unterdeckung erzeugt einen **offenen Anspruch**, kein Geld. Beispielrechnung über 100 Jagdstunden mit gemessenen 71 ISK/h (Dravos, Faktor 1), Betrieb 50 ISK/h:

| Fall | Kopfgeld | Konzern netto | Pilot netto | offener Anspruch |
|---|---|---|---|---|
| Konzernauftrag (Gehalt 10/h, 10 % Beteiligung), volle Anomalie | 7.100 | +390 | +1.710 | 0 |
| Konzernauftrag, leere Anomalie (NPC zahlt Betrieb ohne Beute) | 0 | −2.000 | 0 | 4.000 |
| Pacht 10/h, Pilot 500 ISK Startkasse, volle Anomalie | 7.100 | +1.000 | +1.100 | 0 |
| Pacht, leere Anomalie | 0 | 0 | −500 | 5.500 |

Mit Faktor 1 tragen Kopfgeld-Einnahmen Gehalt und Beteiligung nur bei voll besetzter Anomalie; bei leerer Anomalie scheitert der Pilot bzw. Konzern – wie von der ROADMAP für Kopfgeldjäger gefordert. Die Sätze sind Testwerte.

**Speicherformat-Vorschlag (nicht produktiv):** optionales Feld `piloten { version: 1, piloten: {…}, belege: {…} }`, das in alten Spielständen fehlen darf. Laden prüft Version, erlaubte Felder, nichtnegative ganzzahlige XP und dass die XP jedes Piloten exakt der Summe seiner Beleganteile entspricht; manipulierte oder künftige Versionen werden abgelehnt. Schema-/Regelnummer und Migration wären bei Integration separat zu planen.

---

## 8. Später ausführbare Abnahmetests [ANFORDERUNG – hier NICHT ausgeführt]

Diese Tests sind Voraussetzung für eine spätere Integration; sie können erst gegen einen integrierten Kern laufen.

| ID | Abnahmetest | Bestehenskriterium |
|---|---|---|
| A1 | Piratenabschuss und einmaliges Kopfgeld | Je entferntem Piraten genau ein Beleg und genau eine Kopfgeldbuchung aus der gewählten Quelle; wiederholter Tick/Reload bucht nichts doppelt; `audit` ok; Quelle `minted` oder Transfer explizit ausgewiesen. |
| A2 | Finanzierter Piratenersatz | Respawn nur, wenn Piratenkasse ≥ Preis **und** eine Hülle als Ware im Lager liegt; Hülle verlässt Ledger/Lager; Preis landet bei benanntem Empfänger; leere Kasse oder leeres Lager → kein Respawn. |
| A3 | Zerstörter Konzernjäger und bezahlter Neukauf | Verlust bucht Hülle als vernichtet, Pilot-XP unverändert; Neukauf nur aus Werftbestand und Konzernkasse inkl. Gebühr; ohne Kasse/Bestand kein Ersatz; Rentabilitätsgate für NPC-Jäger (B8). |
| A4 | Keine weitere Jagd bei fehlendem Betriebsbudget | Für Spieler **und** NPC: Kasse < Stundenkosten → Jagd stoppt vor `patrouille`; Restkosten entweder vollständig bezahlt oder als Forderung gebucht (B6); NPC-Jagd ohne Beute ohne heimliche Kosten-/Leistungsasymmetrie (B7). |
| A5 | XP-/Save-/Load-Stabilität | Save → Load → Save byte-identisch; Hash identisch zum ungeladenen Lauf; alter Spielstand ohne Pilotenfeld lädt unverändert; manipulierte XP/Belege und zukünftige Versionen werden abgelehnt; Schiffsverlust zwischen Save und Load ändert XP nicht. |
| A6 | 13 Seeds × 90 Tage | Gleiche Seeds wie oben; Szenarien mindestens: Ist, Ratting Dravos/Meridian, Faktor 1, **0-Kopfgeld**, **Nullbudget** (Spieler und NPC), kein Ersatz; Ausgabe minted/burned/Transfers je Konto, Piratenkasse, Hüllen, unbezahlte Kosten, XP; alle Läufe `audit` ok, deterministisch, keine Respawns ohne Hülle, keine Jagd ohne Budget. |

---

## 9. Integrationsvoraussetzungen

1. **Produktentscheidungen offen:** Kopfgeldquelle (KG0–KG3), Emissionsdeckel, Spielerfaktor 1 oder 3 (B10), Herkunft der Piratenhüllen (PB2-Werft/Material), Piratennachschub ohne Überfälle, Höhe von XP/Boni/Gehalt/Pacht/Beteiligung, Pilotentod.
2. **Kernlücken vor Ratting-Integration schließen:** B1 (Hülle als Ware), B3/B4 (unbezahlte Staatsjäger verdecken Emission), B6/B7 (Budget-Autostopp und Beute-Ausnahme für Spieler **und** NPC gleich), B8 (Rentabilitätsgate für NPC-Jägerersatz), B9 (persistenter Abschussbeleg).
3. Reihenfolge laut ROADMAP beachten: Phase D/E nach Phase B; Eskorte, Frachterüberfälle und Plünderung bleiben ausgeklammert.
4. Eigene Regel-/Schema-Version mit getrenntem Speicherplatz wie W1–W5; bestehende Spielstände dürfen sich nicht ändern.
5. Vor Freigabe Safari/iPad-, NAS- und Save-Export-Prüfung, separate Freigabe, kein Merge ohne Auftrag.

---

## 10. Tatsächlich ausgeführt vs. Anforderung

**Ausgeführt am 04.11.2026 (Node v22.23.4, Cloud-Container):**
- `node --test tests/*.test.mjs` → **178 Tests, 178 bestanden, 0 fehlgeschlagen, 0 übersprungen, 0 todo** (165 bestehende + 13 neue).
- Neue Tests (`tests/w5-piratenbelt-audit.test.mjs`, 2,4 s) prüfen das Werkzeug und das **Ist-Verhalten** des Regel-14-Kerns: Referenzwerte aus Regeln; einmaliges Kopfgeld; Piratenersatz als Transfer ohne Ware (B1/B2); Autostopp nur Spieler (B6); Jagd ohne Beute nur NPC-Kosten (B7); deterministische Kampfstatistik; Bilanzidentität aller Finanzierungsvarianten; XP-Idempotenz, Verlustfestigkeit, Save/Load-Rundreise und Manipulationsabwehr; Bonusdeckel; Verträge als Transfers; kurze echte Kernläufe (4 Szenarien × 2 Seeds × 3 Tage, je zweimal → identischer Hash); `index.html` unverändert.
- Werkzeuglauf 13 Seeds × 90 Tage × 9 Szenarien = 117 Kernläufe + 4.000 Kampfproben je Konfiguration (Abschnitte 4–7), alle Kernaudits ok.

**Nicht ausgeführt:** Abnahmetests A1–A6 (setzen eine Integration voraus); Safari/iPad-, NAS- und UI-Prüfungen (keine UI-Änderung); Langläufe > 90 Tage; Ratting mit gleichzeitigen Frachterüberfällen, Eskorten oder Plünderung (nicht beauftragt); CI-Lauf (die vorhandenen Workflows reagieren nicht auf `tools/**`; die neue Testdatei unter `tests/**` löst den Standard-Workflow aus, ein Ergebnis wird erst nach Abschluss berichtet).

**Grenzen:** Die Finanzierungsvarianten sind Kontenmodelle auf gemessenen Raten, keine Kernläufe. Die Spieler-Befehlsfolge ist eine feste, einfache Strategie (ein Jäger, Neukauf mit 50 ISK Reserve). Die Bonusprüfung setzt den Rang für alle Jäger der Gruppe gleich.
