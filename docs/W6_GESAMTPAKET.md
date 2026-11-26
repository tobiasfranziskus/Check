# W6 Gesamtwirtschaft [FORSCHUNG]

Basis dieses Drafts ist `main d23a1e95427f77c4dcb5634061189ed873421fb4`. Das zusätzliche Profil läuft über Node und hat eine eigene gespeicherte Profilkennung. Der Treiber übernimmt die nachgewiesenen Anfangskassen aus einer validierten U7/U8-Kopie. Das Regel204-Spiel und die U7/U8-Referenz werden über ihre bestehenden Ladepfade betrieben.

## Umsetzung

- #625 und #638 liefern den finanzierten W3/W4/W5-Kreislauf, die freiwillige kombinierte Wasser-Rückfracht und die Mindestkapazitätsprüfung. Übernommen wurden die betreffenden Kernänderungen und die zugehörigen Regressionen.
- Die Methode aus #645 und #648 wurde im Forschungsprofil für Haus- und NPC-Angebote zusammengeführt. Geeignete Schiffe werden nach Restaktivzeit und bei Gleichstand nach Schiffs-ID geordnet. Ein eingesetztes Paar muss auf einer Same-Tick-Kopie über die Originalsignaturen, die volle bezahlte Hin- und Rückfahrt und die Fertigstellung der reservierten Hülle gelangen. Die Prüfung ist auf 360 Wirtschaftsminuten begrenzt, ein offenes Ergebnis gilt als Ablehnung. Die Zusage des Hauses bleibt freiwillig, der Originalkäufer prüft vor der Bindung erneut. Die Automatik veröffentlicht nur bestätigte Paare und prüft weitere Kombinationen bei Ablehnung. Ein leerer Eispendler kann am Dock nach Original-Pendelstopp auch Erz übernehmen, wenn in Aldera bereits eine volle Eisfracht liegt und die Gegenprobe den vollständigen Auftrag belegt. Prüfungen werden an regelmäßige Zeitpunkte und neue Dockfenster gebunden.
- Die bezahlte K2-/W5-Ersatzkette arbeitet mit Originalkassen, existierenden Hüllen, Arbeit und physischen Flügen. Ein Frachter muss die bezahlte Runde vollständig leisten können. Abschreibung eines für die Spedition ausgedienten Frachters kann nach dem realen Ersatzkauf aus der Ersatzrücklage fallen. Der Forschungstreiber kann den Kauf der letzten Hülle freiwillig verschieben, wenn die Spedition sie benötigt und Kauf, Überführung und Arbeit bestreiten kann. Die Forschungsstrategie nutzt 60 Prozent als Kandidaten. Die absichtliche 80-Prozent-Variante S11 bleibt als eigenes Krisenregime erhalten.
- #583, #584, #580 und #585 liefern Original-Leerstorno, physische Erzreservierung gegen Export sowie Teilabrechnung und volle Dockabnahme. Leere, unbezahlte, stillgelegte Fälle dürfen über den Originalkäufer storniert werden. Für Ladung bleiben die zwei auditierenden Kopieverfahren mit zustandsgebundener Zustimmung sämtlicher Vertragsparteien bestehen. Ein voll geladenes Schiff kann am Dock rechtmäßig liefern, ohne weiteren Flug des stillgelegten Miners. Die Forschungsautomatik fingiert keine Zustimmung für tatsächliche aktive Verträge.
- Zivile K2-/W5-Ersatznachfrage hat im Kandidaten Vorrang vor spekulativem NPC-Jägerbau. Originalbefehle für manuell finanzierte Produktion und persönlichen Hauskauf sind weiterhin verwendbar. Die Abschlussprobe versucht den bestehenden persönlichen 900-ISK-Kauf auf einer validierten Kopie. Ein Kaufbeleg erfordert realen Bestand, Deckung, Händlererlös und Eigentumsnachweis. Zahlungsfähigkeit allein begründet keinen wiederkehrenden Kaufwunsch. Ein verbindlicher Vorauftrag oder ein dauerhafter wirtschaftlicher Einsatznutzen für Jäger bleibt eine Produktentscheidung.

## Verifizierte historische CI

| PR | Nachweis | Bedeutung |
| --- | --- | --- |
| [#625](https://github.com/tobiasfranziskus/Check/pull/625), [#638](https://github.com/tobiasfranziskus/Check/pull/638), [#639](https://github.com/tobiasfranziskus/Check/pull/639) | 11/11, 8/8 und 2/2 Workflows erfolgreich auf den jeweiligen Head-SHAs. [#639-Matrix](https://github.com/tobiasfranziskus/Check/actions/runs/45710006937) 3/3. | Vier gedeckte Hausfahrten mit je 50 Erz und 41 Wasser und 125 ISK Deckungsbeitrag nach Verschleiß. Kapazitätsfilter entfernt zunächst die Treuhandblockade, der S02-Folgestillstand bleibt messbar. |
| [#643](https://github.com/tobiasfranziskus/Check/pull/643), [#644](https://github.com/tobiasfranziskus/Check/pull/644), [#645](https://github.com/tobiasfranziskus/Check/pull/645), [#646](https://github.com/tobiasfranziskus/Check/pull/646) | Je 2/2 Workflows erfolgreich. | Silizium bindet Miner und Material, 57 Restminuten reichen für nur 47 Erz, letzte Eisfahrt aussetzen schafft keinen Ersatz. |
| [#647](https://github.com/tobiasfranziskus/Check/actions/runs/45814118357) | 6/6 Matrixjobs erfolgreich, P0 ebenfalls erfolgreich. | S02 mit 60 Prozent und Silizium erreichte 1016 Eisfrachten, 20 W3, 50.810 Wasser, 50 Frachter, 45 gelieferte Miner, 93 Ersatzkäufe, ein unverkaufter Jäger an Tag 90. |
| [#648](https://github.com/tobiasfranziskus/Check/actions/runs/45814533665) | Forschungsjob und P0 erfolgreich. | Nach 1153 Wiederholungen im Kontrollarm übernimmt sh044 im Kandidaten den Auftrag. Wirklicher 50-Erz-Transport mit sh004, Tick 60492–60612, 120 ISK Lohn und 240 ISK Tarif. 90-Tage-Endhash Vergleich `0fcba572b1065146`, Kandidat `d4b0d74cb2c8a6f8`. |
| [#649](https://github.com/tobiasfranziskus/Check/actions/runs/45814816763) | Beide Langzeitjobs und P0 erfolgreich. | Tag 365 und 730 gleichauf bei 2849 Eisfahrten, 54 W3 und 142.450 Wasser. Letzter W3 Tick 354191. 1390 ISK gebunden, aktiver Vertrag mit angenommener Erzcharge. Null Fortschritt zwischen 365 und 730. |
| [#579–#585](https://github.com/tobiasfranziskus/Check/pull/585), [#587](https://github.com/tobiasfranziskus/Check/pull/587), [#590–#592](https://github.com/tobiasfranziskus/Check/pull/592) | Forschungsjobs 1/1, 1/1, 1/1, 21/21, 7/7, 5/5, 18/18, 7/7, 7/7, 3/3, 5/5. #586 ist Dokumentation. #588 (Spielpfad) 6/6 und #589 (Inventur) 3/3 Workflows. | Teilabrechnung ist mit physischer Ware und Zustimmungen möglich. 49/50-Exportkonflikt belegt. Allgemeiner Reservekauf erwies sich als nachteilig. Freiwilliger gezielter Hausaufschub in #592 brachte im damaligen Profil echte Folgekäufe und 8285 Eisfrachten bis Tag 730. |

Die sechs gemessenen #647-Zellen (S02/42, Tag 90) zeigen, dass der Effekt des Silizium-Opt-ins vom Ersatzvorlauf abhängt.

| Vorlauf | Silizium | Eisfahrten | W3 | Miner geliefert | Gebundene ISK | Endhash |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 40 % | an | 143 | 3 | 4 | 0 | `ec3b282367838729` |
| 40 % | aus | 473 | 8 | 18 | 1390 | `7038f094f7aa754d` |
| 60 % | an | 1016 | 20 | 45 | 308 | `452d5222e5b38709` |
| 60 % | aus | 949 | 17 | 40 | 0 | `950b262998cf1722` |
| 80 % | an | 783 | 15 | 33 | 0 | `d965d83243ed44cd` |
| 80 % | aus | 949 | 17 | 40 | 0 | `864a012dc51efeaf` |

Die gepinnten S02-42-Hashes für #649 lauten `19f89c50daadc124` (7), `6091f983a74a53af` (30), `452d5222e5b38709` (90), `45aef2492bd627cb` (365) und `2d68de45bc6a53b8` (730).

## Abnahme und Integrationsstatus

```sh
node --test tests/*.test.mjs
node tools/w6-gesamtpaket.cjs S02 730 42 gesamt
node tools/w6-gesamtpaket.cjs S02 730 42 60
```

Die Matrix führt alle 13 Regime mit Seeds 42, 7 und 113 gepaart mit Regel204 und U7/U8 aus. Die S02-Langzeitläufe vergleichen den Kandidaten mit dem unveränderten 60-Prozent-Siliziumarm. Jeder Matrixlauf führt einen exakten Replay aus. Kontrollpunkte prüfen Core-Audits, unabhängig summiertes 33.000-ISK-Weltgeld, Mint/Burn, Waren, Vertrags- und Eigentumsbelege und Save/Load. Die letzten 30 und 7 Tage werden gesondert erfasst.

## Befunde aus der Abnahme

Geprüfter erster Simulationsstand `cfe849f640027932149ff4e8e07aebfcb0a2a2a2`. Node 22.23.4 lokal, 615/615 Regressionstests, 0 Fehler und 0 Skips. [Gepaarte CI mit Node 22](https://github.com/tobiasfranziskus/Check/actions/runs/45819723482).

**S02, Seed 42, 90 Tage.** Der Kandidat erreichte 1.015 Eisfrachten, 20 W3, 50.650 Wasser, 52 gebaute Frachter, 47 gelieferte Miner und 95 Ersatzkäufe. Die letzten 30 Tage brachten +340 Eisfrachten, +6 W3, +16.910 Wasser, +17 Frachter und +15 gelieferte Miner. Im letzten 7-Tage-Fenster waren es +80, +1, +3.880, +4 und +3. Der 60-Prozent-Siliziumarm erreichte 1.016 Eisfrachten, 20 W3, 50.810 Wasser, 50 Frachter, 45 gelieferte Miner und 93 Ersatzkäufe. Beide lokalen Läufe wurden exakt wiederholt. Endhashes `e13ef07d73b2b042` und `452d5222e5b38709`.

**Diagnose und Korrektur.** Der erste Kandidat hielt überzählige wirtschaftlich unbrauchbare Frachter in der Abschreibungsrücklage. Bei voller Wasser- und Eisproduktion am Lagerlimit fehlte der Rückfluss. Die buchwertgenaue Auflösung der alten Reserve erfolgt jetzt nach belegtem Ersatzkauf. Danach zeigte der Minutenlauf die zweite Blockade. Nach dem letzten W3-Abschluss bei Tick 110563 liefen F4-Zyklen weiter, während geeignete Miner im Eispendelbetrieb waren. Aldera und Nadir hatten ab Tick 118704 keine Minerhüllen in Reserve. Die Freigabe eines leeren Eispendlers nach nachgewiesenem W3-Auftrag ließ im erneuten 90-Tage-Lauf W3 bis mindestens Tick 124164 und zivile Produktion bis zum Schluss weiterlaufen.

**Jägernachfrage.** Die freiwillige Originalkaufprobe auf der unveränderten 60-Prozent-Referenz an Tag 90 kaufte aus 8.293 vorhandenen ISK eine real produzierte Hülle für 900 ISK. Kaufbeleg `sh100`, Tick 129600, Probehash `b2de2e56244dabf1`. Dieselbe Entscheidung im Kandidaten wurde bei 15.307 ISK und leerem Lager abgelehnt. Der laufende Weltzustand blieb in beiden Fällen bytegleich. Damit ist der freiwillige persönliche Kauf aus konkreter Deckung nachgewiesen. Militärischer Bedarf und eine wiederkehrende Zahlungsbereitschaft bleiben offen.

**Teilabrechnung.** Der ausgeführte lokale Gegenversuch lädt den echten #580-Altstand `478696c8bbb0c153` (S02, Tag 30) auf einer separaten Forschungskopie. Er weist 22 Erz für 220 ISK, unveränderte Warensumme und Eigentümer, Rückerstattungen von 740/120/530 ISK an die Originalzahler, null Treuhand und Probehash `2893f55b20593a59` aus. Fehlende Partei oder fremder Hash blieben ohne Änderung. Derselbe Hash und dieselbe Abrechnung wurden nach Save/Load reproduziert. Die volle Dockabnahme ist durch den historischen #585-Replay auf der damaligen Codebasis belegt.

**S05-Wiederanlauf.** Die 80-Prozent-Sparquote erzeugte einen normalen Absatzengpass und legte dabei eine technische Ausnahme offen. Der vorherige W2-Wiederanlauf wählte einen haltenden Miner mit Eis an Bord und brach an der korrekten Originalablehnung ab. In `9635efa2077e2426f5e361c5b2270a389d9bcbe7` verwendet die Auswahl vor Ausführung den vorhandenen, lesenden Befehlsvalidator. Sie wartet oder nimmt eine andere Hülle. Auf dem korrigierten Commit liefen 616/616 Node22-Regressionstests lokal erfolgreich, ohne Fehler und Skips. Der Regressionjob der korrigierten CI meldet ebenfalls Erfolg. S05 für alle drei Seeds lief danach mit Originalaudits und exaktem Replay bis Tag 90. [Korrigierte CI](https://github.com/tobiasfranziskus/Check/actions/runs/45822411885)

### 13 Krisenregime über 90 Tage

39 Szenario-Seed-Paare mit Seeds 42, 7 und 113. Jedes Paar enthält Regel204, U7/U8 und das Gesamtprofil mit identischem simuliertem Hausfahrplan. 117 Läufe mit je exakter Wiederholung. Die Kennzahlen in der Tabelle stimmen bei allen drei Seeds je Profil überein. Die Referenzhashes je Seed und Profil stehen in den JSON-Artefakten und Jobprotokollen. Bei S05 wurden die drei Kandidaten nach dem korrigierten Wiederanlauf erneut lokal vollständig ausgeführt. Die sechs unberührten S05-Kontrollen sind in den ursprünglichen CI-Protokollen vollständig belegt. Drei ursprünglich grüne CI-Jobs für S05 zählten wegen der Ausgabe-Pipeline keinen gültigen Kandidaten und wurden über ihren fehlenden Ergebnisdatensatz und die Fehlermeldung erkannt. Der Workflow hängt die Protokollausgabe jetzt erst an den erfolgreich abgeschlossenen Node-Befehl.

| Regime | F4/W3/Wasser 204 | F4/W3/Wasser U7/U8 | F4/W3/Wasser Gesamt | Gesamt letzte 7 Tage F4/Wasser/Frachter/Miner | Gesamt-Endhashes 42 · 7 · 113 |
| --- | --- | --- | --- | --- | --- |
| S01 | 183/1/9040 | 183/1/9040 | 227/1/11210 | 0/0/0/0 | `3867e00d9277b86c` · `3e3c87707b9c906c` · `445e4fb53a4dcbb5` |
| S02 | 1000/20/50000 | 143/3/7150 | 1015/20/50650 | 80/3880/4/3 | `e13ef07d73b2b042` · `04ff18c46bb7aa13` · `d57ab0a57ff9b2da` |
| S03 | 143/4/7150 | 205/5/10250 | 196/4/9800 | 0/0/0/0 | `7234a0cb49e7496b` · `7391f9d2762b813b` · `e60b1ce467822c6b` |
| S04 | 35/2/1620 | 35/3/1640 | 34/2/1570 | 2/80/0/0 | `ebe42c07dd785c1a` · `657755690c4fefa2` · `82b13ad4b5a54aa9` |
| S05 | 10/2/370 | 10/2/370 | 9/1/340 | 0/0/0/0 | `f64c8f8ed46753a5` · `5c577eb65fd3288d` · `65871ed853b172e6` |
| S06 | 20/2/1000 | 19/1/950 | 17/1/850 | 0/0/0/0 | `e13d0659a1a5e50f` · `17dcfbcb8725eca6` · `e7b3a1dabc17cbb9` |
| S07 | 49/1/2450 | 49/1/2450 | 52/1/2600 | 0/0/0/0 | `785e52d62c56828e` · `ed9de682b8b2cb95` · `6587120ceed6bef4` |
| S08 | 8/1/290 | 8/1/290 | 8/2/290 | 0/0/0/0 | `fabca2f65d3300cb` · `2a5cce1974f608a7` · `aad9ecdacf2b84c5` |
| S09 | 3/1/0 | 3/1/0 | 3/2/0 | 0/0/0/0 | `c63ab05e8ad976f0` · `77d2560252268175` · `dca1805e8022f6d4` |
| S10 | 41/1/2050 | 41/1/2050 | 39/1/1950 | 0/0/0/0 | `1520ad63c76a3da8` · `aa884e2f3a24082f` · `3521f27eb7b2c40c` |
| S11 | 1017/21/50870 | 428/8/21400 | 1016/21/50800 | 79/3940/5/3 | `347812c8a3e659ef` · `6f1b7194e28acb20` · `ccdce7a87a7455dd` |
| S12 | 10/1/390 | 10/1/390 | 10/2/390 | 0/0/0/0 | `18b9f12b19a90d42` · `6d0ca6cc68077c7f` · `0ff5d8ee18203196` |
| S13 | 33/2/1650 | 33/2/1650 | 33/2/1650 | 4/200/0/1 | `622084db224ca622` · `316fafbe19e57fb7` · `452b10d4cb742579` |

S02, S04, S11 und S13 produzieren im letzten Wochenfenster noch Wasser. Die übrigen neun Regime stehen in diesem Fenster. Die reinen Referenzzahlen beziehen sich auf die gepaarte Managementstrategie. Die vorhandenen Regel204- und Regel207-Regressionen laufen zusätzlich unverändert.

### S02 über 365 und 730 Tage

Für S02 beträgt der Endfortschritt des Kandidaten bei 365 und 730 Tagen sowohl in den letzten 30 als auch in den letzten 7 Tagen **null**. Der Befund beruht auf den Intervallzählern für F4, W3, Wasser, Material, Frachter, Miner und Ersatzkäufe. Die kumulierte Produktion erreicht ihr Plateau im Lauf nach Tag 90. Die letzte W3-Lieferung endet bei Tick 140238. Die 60-Prozent-Siliziumreferenz läuft bis Tick 354191 weiter und endet ebenfalls ohne Produktionsfortschritt.

| Seed 42 | Tage | Eisfrachten | W3 | Wasser | Frachter gebaut | Miner geliefert | Treuhand | Endhash |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Gesamt | 365 | 1100 | 22 | 54.870 | 57 | 51 | 0 ISK | `77aae111ae5163df` |
| Gesamt | 730 | 1100 | 22 | 54.870 | 57 | 51 | 0 ISK | `182e7175c374dfcb` |
| 60 % / Silizium | 365 | 2849 | 54 | 142.450 | 138 | 126 | 1390 ISK | `45aef2492bd627cb` |
| 60 % / Silizium | 730 | 2849 | 54 | 142.450 | 138 | 126 | 1390 ISK | `2d68de45bc6a53b8` |

Beim Kandidaten steht der letzte K7-Vertrag auf geliefert, W3 und F4 sind inaktiv. In Nadir liegen 130 Eis, 120 Wasser, 20 Erz und eine Frachterhülle. In Aldera liegen 134 Eis, null Erz, null Wasser und eine Minerhülle. Ein Hausfrachter und ein Speditionsfrachter sind weiterhin für eine ganze Runde einsetzbar. 19.146 ISK in der Hauskasse und 4.449 ISK auf dem privaten Lohnkonto entsprechen zusammen 71,5 Prozent des Weltgelds. Die fünf Nadir-Haushalte haben je höchstens 12 ISK, eine Einheit Wasser kostet 14 ISK. Aldera selbst hat 1.100 ISK, aber die Wasser-Rückladung hängt an einer realen F4- oder W3-Hinfracht. Die Eisfracht scheitert am Lagerplatz in Nadir und die direkte Erzfahrt an der fehlenden Aldera-Charge. Auf einer validierten Kopie lehnten die Originalbefehle beide F4-Angebote, die direkte W3-Fahrt, weitere Wasserproduktion und den örtlichen Kauf durch den Aldera-Hauspiloten jeweils atomar ab. Die Läufe bis Tag 365 und 730 wurden nach der S05-Korrektur erneut mit exaktem Replay ausgeführt. Der jeweilige Endhash blieb identisch, und der vollständige 730-Tage-Bericht stimmt mit dem früheren Lauf überein. Für einen Wassertransport ohne bezahlte Hinfracht fehlt ein Originalauftrag.

Damit bleibt ein Absatz- und Liquiditätsengpass samt Kopplung der Frachtrichtungen. Eine wirtschaftlich weiter tragfähige Änderung bräuchte einen rechtmäßig finanzierten Bedarf mit Entscheidungsspielraum für den Spieler und einen gedeckten Transportpfad. Der Kandidat enthält keine künstlichen Käufe und keine Umverteilung auf Verbraucherkonten.

Für alle drei Seeds sind die 12 Langzeitläufe mit Replay und Audits belegt. Die Mengen, Treuhandbeträge und letzten Produktionsfenster stimmen je Profil und Horizont über alle drei Seeds überein. Die Zwischenhashes und vollständigen Kassen- und Lagerdaten stehen in den versionierten CI-Artefakten.

| Seed | Gesamt 365 | Gesamt 730 | 60 % / Silizium 365 | 60 % / Silizium 730 |
| --- | --- | --- | --- | --- |
| 42 | `77aae111ae5163df` | `182e7175c374dfcb` | `45aef2492bd627cb` | `2d68de45bc6a53b8` |
| 7 | `00f778b43a50f20e` | `60b542f78c9e383e` | `b29add426a68d737` | `820edf6eb88869ed` |
| 113 | `e9d6c003fb1c8848` | `169897ae8d20dc49` | `44ed15fc14d5c333` | `97b595a60e09ce97` |

## Produktentscheidungen und Integrationsreife

- **Ersatzsteuerung.** Die Häufigkeit, Reihenfolge und 60-Prozent-Schwelle für den zivilen Ersatz bleiben Forschungsparameter. Eine Produktregel braucht eine Entscheidung über die Freigabe der Ersatzrücklage bei funktional ausgedienten Schiffen und die Priorität zwischen Erz-, Eis- und Ersatzaufträgen.
- **Vertragsrechte.** Die physische Erzreservierung für bereits bezahlte W3-Aufträge und die Anwendung der freiwilligen Teil- oder Vollabrechnung brauchen einen Produktentscheid über Lagerpriorität, ausdrückliche Zustimmung und Nutzerpfad.
- **Zivile Endnachfrage.** Für die unterbrochene Rückfracht ist zu entscheiden, ob ein eigenständiger Wassertransport wirtschaftlich und vertraglich gedeckt werden soll. Kurzfristige Werftkäufe ersetzen diesen Nachfragekreislauf nicht. Über privates Geld entscheiden seine Eigentümer.
- **Jäger.** Ein freiwilliger, gedeckter Käuferauftrag braucht einen vom Spieler gewählten Einsatzzweck und einen finanziell abgesicherten Fertigungspfad. Für wiederkehrende Nachfrage fehlt der Nachweis. Der Referenzbestand belegt einen verfügbaren Einzelkauf.
- **Integration.** Der Draft ist als reproduzierbarer Forschungsbefund prüfbar. Wirtschaftliche Produktabnahme und Freigabe der offenen Regelentscheidungen stehen aus. Das Codepaket bleibt im separaten Forschungsprofil.
