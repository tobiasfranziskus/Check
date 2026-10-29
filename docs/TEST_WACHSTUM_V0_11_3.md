# v0.11.3 – Pilot für autonomes Wachstum von NPC1

Basis: main `f01fd57` (PR #15/v0.11.2 gemergt). Branch `feat/v0.11.3-npc1-wachstum`. Kein Merge/Deployment. iPad-Safari-/NAS-Abnahme bleibt ausstehend.

## Regel und Grenzen

NPC1 startet unverändert mit drei Soll-Frachtern. Nur nach mindestens sieben verstrichenen Spieltagen und nur zur täglichen Grenze darf NPC1 einmalig auf vier Sollplätze wachsen. Vorher: keine fehlenden Ersatzschiffe, aktuelle Reise mit wirklicher Handelsladung und bereits erfolgten Verkäufen, positive kumulierte Einnahmen minus tatsächlich bezahlte Kosten. An Aldera müssen Frachterware und bezahlbare volle R=2-Reserve vorhanden sein. Schiff, Gebühren und Reserve müssen bezahlt werden und mindestens 3.000 ISK Kasse übrig lassen.

`kaufeSchiff` ist derselbe Waren-/Aktivierungspfad wie beim Ersatz: bestehende Schiffs-/Handelsfunktionen, Verbrauch im Ledger und `indienst`-Statistik. Die neue Heimat ist Aldera; normales Handeln/R=2 bleibt erhalten. Erst nach dem Kauf wird der vierte Sollplatz ergänzt. Verlorene Schiffe werden nur innerhalb der bestehenden vier Sollplätze ersetzt. Der zusätzliche Sollplatz ist vom expliziten Ersatz-Zuschuss ausgeschlossen; die Investition selbst ruft keine Zuschussfunktion auf. NPC2, NPC3, Piraten, Stationseigentum und Spielerbefehle erhalten keine neue Regel. Indirekte Marktwirkungen sind Teil des Versuchs.

Investition liegt nach regulärem Ersatz und vor `npcAusgaben`; Fondslogik bleibt unverändert. In der nachfolgenden Stunde kann überschüssiges Kapital weiterhin abgeschöpft werden. `nachher` bezeichnet den Stand unmittelbar nach Kauf/Reserve, vor dieser Abschöpfung.

Keine neuen Speicherfelder: Tick und vorhandene Sollflotte begrenzen Termin/Anzahl. Schema 8, Regeln 8→9; Migration verändert ausschließlich die Regelnummer. Kein kostenloser Frachter bei neuen oder geladenen Spielen. Bereits bezahlte vierte Sollplätze, Geld und Waren bleiben beim Laden unverändert.

## Ausgeführte Prüfungen

Node 22.23.4: Baseline **40**, final **46 Tests bestanden**, 0 Fehler/übersprungen. Gezielte Prüfungen: echter Warenkauf, Gebühren/Reserve, Finanzierung einschließlich exakter Grenze 2.999/3.000 ISK Restgeld, Zeit/Handel/fehlender Ersatz, maximale Sollflotte, verlorener vierter Frachter und regulärer Ersatz ohne Sollzuwachs, Migration und Save/Load vor/nach Kauf.

13 Seeds jeweils v0.11.2 und Pilot bis Tag 3/30/90, jeder Lauf uninstrumentiert wiederholt. Zusätzlich Wiederaufnahme direkt nach dem vollständigen Investitionstick und Fortsetzung bis Tag 90 mit identischen Hashes. Vor-/Nachkauf-Fixtures entstanden aus einem tatsächlichen siebentägigen Handelslauf, nicht durch künstliche Finanzierung. Speichern innerhalb einer synchronen Kauftransaktion ist kein Spielzustand; getestet sind beide gültigen Grenzen.

Alle Geld-/Warenaudits stündlich korrekt. Historische Regel-8-Kontrollpunkte bleiben unverändert in `economy-v8.json` und wurden für alle 13 Basisseeds verglichen. Neue Drei-Tages-Hashes wurden unabhängig mit dem archivierten v0.11.2-Prototyp und ausschließlich angehobener gespeicherter Regelnummer ermittelt: Vor Tag 7 gibt es keine Verhaltensänderung. Die neuen Langlaufreferenzen wurden nach erfolgreichem Wiederholungs-/Fortsetzungsvergleich dokumentiert; kein Austausch zum Verdecken eines Fehlers.

## Wirtschaftlicher Vergleich, Tag 90

0 Gesamtblockaden in beiden Varianten. Median Mangel **331→287**, Maximum **361→395**; Median tatsächlicher NPC-Verkäufe **21.010→23.820**. Kein systematischer Versorgungseinbruch, jedoch moderate Verschlechterungen einzelner Seeds. NPC1s kumulierter Überschuss aus tatsächlichen Einnahmen minus bezahlten Kosten steigt in allen 13 Seeds. Das ist keine vollständige Vollkostenrechnung: Nicht bezahlte Soll-Betriebskosten werden nach bestehender NPC-Regel nicht als Verbindlichkeit gespeichert.

| Seed | Investition Minute | NPC1 vorher / nachher ISK | Mangel Basis / Pilot | NPC-Verkäufe Basis / Pilot | NPC1 bezahlter Nettoüberschuss Basis / Pilot |
|---:|---:|---|---|---|---|
| 7 | 10080 | 6769 / 5940 | 337 / 255 | 20663 / 23689 | 1756811 / 1967216 |
| 11 | 10080 | 5661 / 4819 | 331 / 395 | 21074 / 19057 | 1810286 / 3007004 |
| 1 | 10080 | 5195 / 4351 | 346 / 286 | 20872 / 23929 | 1776207 / 1851489 |
| 2 | 10080 | 5577 / 4748 | 309 / 285 | 21173 / 23726 | 1691244 / 1796033 |
| 65535 | 10080 | 7648 / 6490 | 285 / 342 | 21118 / 23920 | 1683995 / 1958622 |
| 42 | 14400 | 6241 / 5409 | 275 / 312 | 21253 / 23925 | 1775607 / 1910478 |
| 1234 | 10080 | 8568 / 7739 | 346 / 302 | 20919 / 23854 | 1837510 / 1934648 |
| 98765 | 11520 | 5513 / 4684 | 289 / 272 | 21182 / 23812 | 1861658 / 1903211 |
| 3 | 10080 | 4970 / 4141 | 346 / 287 | 21105 / 23627 | 1761661 / 1874943 |
| 99 | 10080 | 4859 / 4030 | 340 / 278 | 20991 / 24012 | 1757787 / 1861006 |
| 2024 | 10080 | 7178 / 6349 | 313 / 308 | 20984 / 23619 | 1786514 / 1920769 |
| 2025 | 10080 | 6226 / 5049 | 361 / 316 | 20938 / 24016 | 1721110 / 1907307 |
| 314159 | 10080 | 6403 / 5567 | 318 / 248 | 21010 / 23820 | 1714795 / 1953075 |

`indienst` zählt Ersatz plus Expansion; tatsächlicher Ersatz = Anschaffungen minus erfolgreiche Investitionen. Umsatz, Wareneinkäufe, Gebühren, tatsächlich bezahlte Betriebskosten, Abschöpfung, Verluste, Anschaffungen, Flotte, Stationskassen und alle Kontrollpunkt-Hashes stehen in `WIRTSCHAFT_V0_11_3.csv`. Für alle Kontrollpunkte wurde NPC1s Kasse aus Anfangskapital + Einnahmen − bezahlten Kosten − Abschöpfung exakt rekonstruiert.

## Abgelehnte Prüfungen und Pufferhypothese

13 erfolgreiche Investitionen; kein fehlgeschlagener tatsächlicher Marktkauf. 4 tägliche Vorprüfungen verhinderten einen Kauf (2 fehlende Reserveversorgung, 2 Kapital). Weitere 78 Terminprüfungen liegen vor Tag 7, 1.075 Prüfungen nach Erreichen des Maximums. Dies sind keine fehlgeschlagenen Handelsorders.

Die 3.000-ISK-Hypothese wird für diesen begrenzten Pilot **beibehalten, nicht als optimale oder dauerhaft sichere Kassenuntergrenze bestätigt**. Tatsächlich bleibt nach den Käufen mindestens 4.030 ISK; die exakte 3.000-Grenze wird durch die 13 Weltläufe also nicht ausgereizt. Der Grenztest prüft sie zusätzlich funktional. Es wäre nicht begründet, sie allein aus diesen Daten willkürlich auf einen anderen Betrag zu setzen.

Die stündliche Zusatzmessung findet nach Tag 7 auch in der Basis bei allen 13 Seeds zeitweise 0 ISK. Summe der leeren Stundenendstände: **57 Basis, 165 Pilot**. Für Seed 42 erfolgt der Pilotvergleich erst ab dessen Investition am Tag 10, die Basis ab Tag 7. Ob dahinter gebundene Handelsfracht oder zu knapp finanzierter Betrieb steht, ist durch diese Kassenmessung allein nicht bewiesen. Die bestehende Regel speichert keine automatisch angelegte Schuld; es gab keinerlei NPC1-Zuschüsse. Nullstände sind dennoch ein Restrisiko und die erste Reserve ist kein laufender Liquiditätsboden. Keine Behauptung, die vier Schiffe seien jederzeit vollständig vorfinanziert oder bezahlten alle theoretischen Sollkosten.

## Entscheidung

Als **streng begrenzter Pilot mit vier Sollplätzen** zur Projektprüfung technisch fertig, aber **noch keine Integrationsempfehlung** wegen der systematisch häufigeren Liquiditätsnullstände: reale Investition in jedem Seed, mehr tatsächlicher Handel und höherer bezahlter NPC1-Überschuss, keine neuen schweren Gesamtblockaden. Kein Nachweis eines optimalen Kapitalpuffers oder für weitere Expansion/NPC2. Einzelne Verschlechterungen und häufigere Kassen-Nullstände bleiben ausdrücklich sichtbar. Vor Freigabe die Nullstände einschließlich tatsächlich nicht gedeckter Soll-Betriebskosten und möglicher Kapitalbindung untersuchen; die 3.000-ISK-Hypothese ist keine ausreichend bestätigte laufende Finanzierung. Keine weitere Ausbaustufe und vorerst keine Integration.

## Reproduktion und Grenzen

```sh
node --test tests/*.test.mjs
node tools/expansion-simulation.mjs
node tools/expansion-liquidity.mjs
BASELINE=1 node tools/expansion-liquidity.mjs
node tools/economy-simulation.mjs # historische Regel-8-Referenzen
```

Keine Abhängigkeiten. Die beiden Hauptvarianten werden vom selben geprüften Core ausgeführt; für die historische Referenz werden nur Investitionsaufruf und gespeicherte Regelnummer auf v8 zurückgesetzt. Dass dieses Verfahren v0.11.2 reproduziert, wird gegen sämtliche alten Hashes geprüft. Beobachter schreiben ausschließlich externe Statistiken. 13 feste Seeds, 90 Tage: keine statistisch repräsentative Garantie. Aktive Spielerstrategien, längere Horizonte, bestehende vollständig gestrandete Welten und echte iPad-/NAS-Prüfungen wurden für diesen Pilot nicht ausgeführt.
