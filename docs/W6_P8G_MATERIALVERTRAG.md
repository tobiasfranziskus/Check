# W6/P8g – Eigenständig bezahlter Erz-/Materialvertrag

**[DRAFT / BESCHLOSSENES PRODUKTZIEL] 16.11.2026.** Der Nutzer hat den unabhängigen, voll finanzierten 50-Erz-Vertrag **ohne Pflicht zu einem weiteren W5-Frachterneubau** gesondert genehmigt. Preise, bestehende Rohstofffelder, Löhne, Verkäufe, Eigentum, Save-Format und Geldmodell bleiben unverändert. Die erste Umsetzung ist auf der **isolierten Rule207-Forschungswelt** gestapelt; `main` (Regel204) und Pages sind nicht geändert.

**PR:** [#425](https://github.com/tobiasfranziskus/Check/pull/425), Basiskette #408 → #412 → #415 → #420 → #422 → #423; keine pauschale Integration der gestapelten Forschung.

## Autoritativer Ablauf / Finanzierung

1. Nur auf **explizite Forschungsaktivierung** `materialSupplySetzen(s,true)`. Vorher sind alte Rule207-Seeds, Spielstände und Simulationen unverändert. Keine stille Migration.
2. `industrialOreOfferMaterial`: Der originale Käufer `st_nadir` darf nur bei physisch vorhandenem und noch nicht auslieferbarem Silizium und echter Materiallücke bestellen. Bereits vorhandene Erz-/Materialbestände zählen mit. Miner **NPC3**, fremder Frachter **transport**; beide eigene leere, nicht stillgelegte Hüllen und reale Eigentumsrechte. Ein alter Eis-Pendelauftrag muss durch den Eigentümer mit `shipShuttleStop` freigegeben werden.
3. `industrialOreAcceptMine` durch **npc3**, `industrialOreAcceptFreight` durch **transport**, `industrialOreCommitMaterial` durch **st_nadir**. Die bestehenden W3-Kosten-/Kauf- und Arbeits-Treuhandkonten sind vollständig vorfinanziert **bevor** die erste Einheit gefördert wird. Keine Werft-Signatur; `industrialOreAcceptYard`, `industrialOreBuildShip` und der alte `industrialOreCommit` sind für diese Auftragsart gesperrt.
4. Originale NPC3-W1-Förderung → physischer Aldera-Abkauf → W3-Hin- und Rückfracht auf der vorhandenen 60-Minuten-Verbindung → 50 physisch gelagerte Erz in Nadir. Danach Original-W4-Raffinerie und J3/J4. Kein Spawn, Teleport, Verkauf ohne Lager oder garantierter Kunde.

| Ursprünglicher Tarif / Rechenträger | Betrag (ISK) | Geldfluss |
| --- | ---: | --- |
| NPC3-Förderlohn: 50 × 2 | 100 | NPC3 eigener Betriebsetat, echte Arbeit |
| Aldera-Erzankauf: 50 × 10 | 500 | Aldera-Kasse an eigentlichen Rohstoffverkäufer |
| Nadir-Original-W3: 500 Ware + 240 Fracht | 740 | echter Kauf- und Frachtvertrag aus Nadir-Kasse |
| Spedition: 120 Pilotenminuten × 1 | 120 | eigene Vorfinanzierung für Hin-/Rückfahrt |
| Bereits vorhandene W5-Hülle | 750 | **einmalig** mit Speditionsgeld aus echtem Nadir-Lager erworben |
| W5ac: Nadir→Aldera, 60 Minuten × 1 | 60 | **einmalig** durch Spedition bezahlt |
| W4: 10 Erz → 5 Material, 20 Minuten × 1 | 20 je Charge | Nadir zahlt echte Originalarbeit |
| J3: 2 Material + 1 Silizium → 1 Bauteil, 8 Minuten × 1 | 8 je Bauteil | Nadir bezahlt |
| J4: 8 Bauteile + 4 Material → 1 Jäger, 32 Minuten × 1 | 32 je Jäger | Nadir bezahlt |
| Original-J4-Verkauf | 900 | nur bei wirklicher fertig gebauter Hülle und Hausgeld |

**Wichtiges Rezeptdetail:** In diesem Forschungsstand produziert `rules.w4` aus **10 Erz fünf Material**, während das allgemein navigierbare Produktrezept `r_material` aus **10 Erz vier Material** beschreibt. Das wurde hier **nicht** still neu balanciert; die produktive Vereinheitlichung ist vor einer Main-Integration fachlich gesondert zu entscheiden.

Der neue Vertrag macht den tatsächlichen Rohstoffkäufer nicht künstlich zahlungsfähig. Ohne eigenen Etat, echte ungenutzte Schiffskapazität oder reale Materiallücke gibt es **keinen** Auftrag. NPC-Unternehmen dürfen auch mit diesem Mechanismus ausfallen.

## Nachweise und noch ausstehende Integration

**[GEPRÜFT]** Beim gezielten Original-Node22-Lauf [#43850009699](https://github.com/tobiasfranziskus/Check/actions/runs/43850009699) wurden **2/2 P8g-Spezialtests + 7/7 P8d/P8f-Regressionen** bestanden: S02 ab erster echter Dravos-Lieferung Tag14,25; zulässiger NPC3-Miner `sh017` mit Original-Auftragsfreigabe, neuer real gekaufter/überführter Speditionsfrachter `sh021`, 50 finanzierte Erz geliefert, 40 physisch gelagert nach erster W4-Charge, 15 Material, **keine weitere W5-Hülle**, Geldmenge 33.000 ISK, Mint/Burn 0. Endhash nach erster W4-Charge `eb8df591590bfe47`.

**[GEPRÜFT / VOLLSTÄNDIGER GEGENPFAD]** [CI #43850400691](https://github.com/tobiasfranziskus/Check/actions/runs/43850400691) nach zusätzlichem Material-only-Audit: **2/2 P8g plus 7/7 P8d/P8f-Tests erfolgreich**. Der belastbare positive Originalpfad nach einem rechtmäßigen Dravos-Siliziumkauf liefert **50 aus NPC3-Bergbau bezahlte Erz über W3**, erzeugt fünf vollständig finanzierte Original-W4-Chargen **= 25 Material**, baut daraus acht legitime J3-Bauteile, schließlich einen weiteren J4-Jäger und verkauft diesen für **900 tatsächlich gezahlte Haus-ISK**. Ergebnis **insgesamt drei Jäger**, 15 reales Material Rest, 0 Erz und 0 Silizium, keine zusätzliche W5-Frachterhülle, Weltgeld 33.000 ISK, Mint/Burn 0. Belegter S02-Endhash **`0e2303710d982e84`**, nach ersten W4-Teilschritt `eb8df591590bfe47`. Es handelt sich um **eine selbst manuell disponierte legitime S02-Nachlieferung**, nicht automatisch um eine dauerhafte Wirtschaft.

**[DRAFT / LANGZEITGATE]** Die 13×90- und S02×365-Tage-Variante mit `W6_P8G_MATERIAL=1` wurde separat eingerichtet, damit automatisierte NPC-Weiterführung und Krisenfälle nicht aus dem manuellen Positivtest abgeleitet werden. Der angehängte Szenario-Nachweis und der ergänzte Manipulationsschutz sind **erst nach ihren jeweils neuen CI-Abschlüssen** als bestanden zu behandeln. Bisherige P8d-Standardläufe werden ohne ENV-Flag bitgleich fortgeführt.

Aktuelle Forschung setzt `materialSupplySetzen` ausdrücklich; nicht `main`, kein UI-/Pages-Deploy, keine Produkt-Save-Migration und keine echte iPad-/NAS-Abnahme.

## Automatische NPC-Wirtschaft: 13×90 und S02×365 (nicht mit Einzelauftrag verwechseln)

**[GEPRÜFT / NEGATIVER NACHHALTIGKEITSBEFUND]** [GitHub Actions #43851323192](https://github.com/tobiasfranziskus/Check/actions/runs/43851323192) bestätigt **13/13 Szenarien à 90 Tage, S02 über 365 Tage und die separaten Vertrags-/Legacy-Regressionen vollständig erfolgreich**. Alle Ergebnisse gehören zur ausdrücklich aktivierten `W6_P8G_MATERIAL=1`-Variante, **nicht** `main`. Die ursprüngliche P8d-Version ohne Opt-in bleibt daneben testbar.

| Welt | Erfolgreiche Dravos-Fremdfrachten bis 90 Tage | Material-only-Vertrag als letzter K7-Vertrag | Original-W3-Frachten insgesamt | Fertige Jäger |
| --- | ---: | --- | ---: | ---: |
| S01 | 0 | nein | 1 | 0 |
| S02 | 1 | ja | 3 | 2 |
| S03 | 1 | ja | 3 | 2 |
| S04 | 1 | ja | 3 | 2 |
| S05–S10 | jeweils 0 | nein | je 1 | 0 |
| S11 | 2 | ja | 4 | **3** |
| S12–S13 | jeweils 0 | nein | je 1 | 0 |

Bei S02 sind 90-Tage- und 365-Tage-Endstände **wirtschaftlich identisch** (je 2 gebaute/gekaufte Jäger, 3 abgeschlossene W3-Frachten, 10 Material in Nadir, kein Erz; echte Materialbestellung abgeschlossen). Der 365-Tage-Endhash lautet `abf227020abc7c00`, der 90-Tage-Hash `ad0f037be40c32fd` (Hashes unterscheiden sich trotz identischer Mengen wegen späterem Tick). Im tatsächlichen Fenster Tag **335–365** keine Eisproduktion, kein Wasserumsatz, kein Ersatzkauf. **Keine fortlaufend tragfähige Gesamtwirtschaft nachgewiesen.**

S11 gelingt ein dritter Jäger vollständig autonom; S02/S03/S04 hingegen nicht. Die beobachtete Materialnachfrage funktioniert also grundsätzlich, ihre Wirkung hängt von weiteren **physischen Schiffskapazitäten und konkurrierendem Materialverbrauch** ab. Die konkrete Ursachenaufteilung ist Gegenstand einer nachfolgenden **rein lesenden Diagnoserunde**, keine beschlossene Balanceänderung. In den übrigen neun Szenarien entstand mangels tatsächlich ausgelöster Silizium-/Industrienachfrage kein Material-only-Auftrag; Insolvenz oder alternative Einzelfehler daraus nicht behaupten.

## S02-Flottenblocker – unabhängige Quellengate-Diagnose

**[GEPRÜFT]** [CI #43854549811](https://github.com/tobiasfranziskus/Check/actions/runs/43854549811): 13×90 + S02×365 und gezielte Vertragsprüfungen **vollständig grün**. Die ausschließlich lesenden Endstände bestätigen für S02-Tag90:

- **2 Original-NPC3-Miner** in Aldera noch physisch einsetzbar: `sh005` Restbuchwert 75 ISK (Eis-Pendel) und `sh006` Restbuchwert 436 ISK (Erz-Pendel).
- **0** einsatzfähige, leere `transport`-Frachter im Aldera-Dock. Alle verfügbaren alten Hüllen sind abgeschrieben oder an anderer Stelle.
- Insgesamt **16 echte J3-Bauteile** (16 Silizium, 32 Material verarbeitet) und **2 J4-Jäger** (weitere 8 Material) produziert. Drei K2-Minerbauten haben **15 Material** benötigt; zusätzlich zwei W5-Hüllen mit **10 Material** im ursprünglichen Forschungslauf.
- Am Ende liegen **8 Silizium, 10 Material und 0 Erz** in Nadir. Es besteht also wieder eine echte Materiallücke, aber ohne verwendbaren Aldera-Frachter kann die vorhandene P8g-Nachfrage nicht bedient werden.

**Wirtschaftliche Ersatzfähigkeit in S02 rechnerisch vorhanden, tatsächliche Umsetzung noch separat zu prüfen:** Nadir hält **10 Material**, `werft_extern` nach den S02-Quittungen **820 ISK** (Original-W5-Baukosten 530 ISK) und die Spedition **1.322 ISK** (Original-Kauf 750 + W5ac-Überführung 60 + eine W3-Arbeitsvorfinanzierung 120 ISK). Die alte K7-Automatik baut eine neue W5-Hülle allerdings nur innerhalb eines Frachterbedarfsvertrags; die zuletzt genehmigte P8g-Materiallieferung darf kein *obligatorisches* neues W5-Schiff erzeugen.

**[DRAFT / NEUER ORIGINALBEFEHLS-GEGENVERSUCH]** `tests/w6-p8g-original-w5-ersatz-nach-90-tagen.test.mjs` nimmt einen unveränderten S02×90-Save, pausiert die NPC-Automatik **nur in einer isolierten Kopie**, prüft die echte W5-Fertigung durch `werft_extern`, den realen 750-ISK-Kauf durch `transport`, 60 bezahlte W5ac-Flugminuten nach Aldera und eine weitere rechtmäßig unterschriebene 50-Erz-Lieferung bis zum dritten Jäger. **Bis zur tatsächlichen Node22-CI keinen Erfolg behaupten.** Der Test verändert keine Wirtschafts- oder Nachfrageentscheidung des Regel207-Cores.

Die Frage einer **automatischen unabhängigen W5-Ersatzbestellung** mit Kunden-, Werft-, Speditions- und Materialbudget wäre eine separate NPC-Dispositions-/Balanceentscheidung und wird nicht still mit dem nun genehmigten *Erzliefervertrag ohne Pflicht-Frachterbau* gleichgesetzt.

**Nächster Release-Gate:** P8g mit seinen notwendigen P8b–P8f-Abhängigkeiten gezielt auf den jeweils aktuellen Hauptzweig integrieren (keine ganzen historischen Stacks blind zusammenführen), echte Bedienung aus dem öffentlichen Spielstart, unabhängige Node22/Browser-Wirtschaft, historischer Hash und aktualisierte Save-/Regelversionsfrage klären. Erst nach erfolgreicher Integration und eigenem Pages-Nachweis `[MAIN]/[PAGES]` setzen.
