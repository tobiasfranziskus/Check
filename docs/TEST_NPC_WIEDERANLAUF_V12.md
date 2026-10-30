# Aphros Void v12 – Wiederanlauf der NPC-Handelsflotten

**30. Oktober 2026 · [ANALYSE/DRAFT] · Produktbasis `main ed94b891`, kein Merge/Deployment.**

**Ergebnis:** Keine der vier einzeln geprüften Fonds-/Zuschussvarianten stellt beide Handelsflotten bis Tag 365 wieder her. Ein fondsweiter Zuschuss bezahlt in zwei Fällen je eine reale Frachterhülle; danach verbleiben **0 ISK Handelskapital**, es folgt kein Warenkauf oder -verkauf, das Ersatzschiff geht wieder verloren. Zusätzlich stehen Werft- und Bauteilproduktion ohne Bauteile bzw. Silizium. Ein bezahlter erster Ersatz ist deshalb kein Nachweis eines tragfähigen Wiederanlaufs.

## 1. Quellen und isolierter Umfang

Gelesen: `AGENTS.md`, [ROADMAP.md](ROADMAP.md), [PROJEKTSTATUS.md](PROJEKTSTATUS.md), [Langzeitbericht #32](TEST_WIRTSCHAFT_LANGZEIT_V12.md), [Rückflussbericht #33](TEST_SPIELER_RUECKFLUSS_V12.md) und produktive `fonds()`, `zuschuss()`, `ersatzkauf()`, Produktion, Handel und Tick-Reihenfolge. Auf GitHub bestätigt: `main` [`ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f`](https://github.com/tobiasfranziskus/Check/commit/ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f); Draft [#32](https://github.com/tobiasfranziskus/Check/pull/32), `8cd87134c3c5869319455b3670e92f3e42133027`; Draft [#33](https://github.com/tobiasfranziskus/Check/pull/33), `4c55d4b8ebf5e14f818597815d1a9f3e004ed5d8`.

`index.html` bleibt bytegleich, SHA-256 `5e842417c5b05e057ad26499659089060ac96ddda913e38922886b1c54ff3653`. Keine Roadmap-, Preis-, Rezept-, KI- oder Goldenwertänderung; keine neue Geldquelle, kein künstlicher Schiff-Spawn und **keine Spielerabgabe**. Der Spielerfilter aus #33 wird ausdrücklich **nicht** übernommen: `npcAusgabenArten` bleibt `['trader','miner']`, und `stats.abgabe.house` muss in jeder geprüften Stunde null sein. Die höheren Fondsstände nach dem Spieler-Rückfluss aus #33 sind folglich **nicht** das finanzielle Startbudget dieser Untersuchung.

[Werkzeug](../tools/npc-restart-v12.mjs), [isolierte Varianten](../tools/npc-restart-v12-variants.mjs), [Verdichtung](../tools/npc-restart-v12-summary.mjs), [Messdaten](data/npc-wiederanlauf-v12.json). Varianten werden nur im extrahierten Produktionsquelltext des Testprozesses eingesetzt. Je Variante darf genau **eine** benannte Funktion abweichen; das Zurückersetzen ihrer Fassung muss den vollständigen Originalquelltext ergeben. Keine Kombination der Varianten wurde getestet. Kombinierter Werkzeug-SHA-256: `7bffbfb904adc56e0c2c23c66b607a7c9a1a0bbed7cac13d92c8b667a57b5970`.

## 2. Diagnose an Tag 90: vorhandenes Geld und fehlende Deckung

Vier unveränderte Fälle: nur Start-Miner/Seed 42, Handelsflotte/42, Stationskauf/1234, Jagd/98765. Alle laufen zunächst ausschließlich mit dem produktiven Core und den unveränderten Befehlsbändern aus #32. Die Tag-90-Zustände müssen den bereits konservierten Kontrollhashes aus #32/#33 entsprechen. Anfangs besitzen beide Händler in jedem Fall **0 Schiffe**; Sollflotten bleiben NPC1=3, NPC2=2 Frachter.

| Fall | Spieler ISK | Stationskassen gesamt | davon Aldera | Fonds gesamt | davon Aldera | Minerkonzern | NPC1 / NPC2 ISK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| miner | 42.795 | 5.238 | 1.524 | 1.258 | 0 | 481 | 0 / 132 |
| handel-flotte | 39.762 | 4.466 | 685 | 1.300 | 0 | 4.395 | 0 / 0 |
| station | 30.505 | 6.151 | 2.301 | 720 | 720 | 4.357 | 0 / 0 |
| jagd | 40.455 | 7.337 | 3.499 | 57 | 57 | 1.828 | 165 / 0 |

Im Miner-/Flottenfall liegen sämtliche Fonds-ISK in **Meridian** (1.258/1.300), im Stations-/Jagdfall ausschließlich in **Aldera** (720/57). Die reichste Station ist Meridian mit 2.775/2.800/2.701 ISK in den ersten drei Fällen; im Jagdfall hält Aldera 3.499. Sicherheit hat überall null, Piraten nur 96/77/267/158 ISK. Der Großteil der Geldmenge liegt somit beim Spieler; der Minerkonzern bleibt unter der bestehenden 6.000-ISK-Abgabeschwelle. Diese Beträge sind vorhanden, aber **nicht automatisch verfügbare Mittel des Werftfonds**.

Die bestehenden Wege zum Aldera-Fonds:

| Weg | Bedingung / Blockade nach dem Kollaps |
| --- | --- |
| Handelsgebühren in Aldera | Bei besitzerloser Station → Fonds; bei eigener Station → Stationskasse. Ohne Handel fehlt der Zufluss. |
| Bezahlte zivile Betriebskosten | Gehen zum Fonds des Tätigkeits-/Reisezielsystems. Leere Kassen zahlen 0; volle, festgefahrene Miner arbeiten nicht weiter. |
| `npcAusgaben()` | Nur NPC-Guthaben oberhalb 6.000, Empfänger ist der Fonds der ärmsten Station. Aldera wird nicht aufgrund seiner Werft priorisiert. |
| `fonds()` lokal/global | Fonds → Stationskassen, **keine** umgekehrte Rückführung aus Stationscash und kein regulärer Fonds-Pool. Lokale Auffüllung überspringt eigene Stationen. |
| `zuschuss()` | Aldera-Fonds → vollständig ausgefallener NPC. Entzieht dem Fonds Geld, statt ihn aufzufüllen. |

Spielerkasse, Minerkonzern unter der Schwelle und Stationscash dürfen daher in der Ausgangsregel nicht beliebig als Ersatzbudget addiert werden. Ein Stationskauf vernichtet ISK; eine Dividende überträgt an den Spieler. Keiner dieser Wege füllt den Werftfonds direkt auf. Globale Fondsüberschüsse können Aldera als **Station** erreichen, ohne den Zuschussfonds zu finanzieren.

### Bedingungen für tatsächlichen Ersatz und Produktion

| Fall | Vorhandene Frachterhüllen | Erster Preis + Gebühr | Aldera-Zuschusslücke NPC1 / NPC2 |
| --- | --- | --- | --- |
| miner | 2 | 750 + 30 | 780 / 648 |
| handel-flotte | 2 | 750 + 30 | 780 / 780 |
| station | 1 | 1050 + 42 | 372 / 372 |
| jagd | 2 | 750 + 30 | 558 / 723 |

`ersatzkauf()` verlangt eine vorhandene Hülle, reale Kaufpreis-/Gebührendeckung und eine Route. `zuschuss()` zahlt die Differenz nur vollständig, wenn der zuständige Fonds sie deckt; Teilzahlungen werden nicht vorgenommen. Für eine komplett leere Flotte wird bisher **keine** Ersatzrücklage nach dem Kauf verlangt: ein auf den Kaufpreis passender Zuschuss lässt exakt null Kapital für den ersten Warenkauf. Solange noch ein Schiff vorhanden ist, greift dagegen die vorhandene Rücklage von 250 ISK bei weiteren Ersatzkäufen.

Der Frachterbau benötigt **8 Bauteile**, freie Ausgabekapazität und 36 Produktionsticks. Die lokale Bauteilproduktion benötigt je Einheit **2 Material und 1 Silizium**, Dauer 8. Aldera hat bei allen vier Zusammenbrüchen 193/194 Material, aber **0 Bauteile und 0 Silizium**. Zunächst vorhandene Hüllen ersetzen keine laufende Produktionskette. Die stündliche Reihenfolge ist unverändert: Verbrauch/Betrieb/Außenhandel → Kampf → **Ersatzkauf → NPC-Abgaben → Fonds → Dividenden**. Eine Fondsüberweisung am Stundenende finanziert frühestens den nächsten Ersatzversuch.

## 3. Vier getrennte Varianten vorhandener Regeln

| Variante | Einzige veränderte Funktion / Eingriff | Zweck |
| --- | --- | --- |
| `fonds-pool` | `zuschuss()`: für Händler alle existierenden Fonds als Geber, stabile ID-Reihenfolge, nur bei vollständiger Gesamtkostendeckung | Räumliche Fondsbindung prüfen; keine Stations- oder Spielerkasse belastet |
| `werft-reserve` | `fonds()`: vor lokaler Auffüllung der Werftstation Mittel für den ersten vorhandenen Ersatz eines leeren Händlers zurückhalten | Vorhandenes Geld nicht zuerst aus dem Werftfonds an die Station abgeben |
| `ueberschuss-zur-werft` | `fonds()`: bereits verteilbare Fondsüberschüsse über 1.500 zunächst zum unterdeckten Werftfonds statt zur ärmsten Station lenken | Vorhandenen Überschussweg auf den bekannten Engpass ausrichten |
| `zuschuss-mit-ruecklage` | `ersatzkauf()`: Zuschussbedarf leerer Händler um die bereits vorhandenen 250 ISK Ersatzrücklage erweitern | Betriebskapital beim ersten Kauf prüfen; Geber bleibt unverändert Aldera |

Die Reservevariante deckt nur den Fehlbetrag **eines ersten vorhandenen Ersatzschiffs**, nicht vorsorglich eine vollständig neue Flotte. Die ursprüngliche globale Fondsobergrenze bleibt bestehen. Der Pool zahlt keinen ungedeckten Kredit; jede Überweisung hat einen tatsächlich belasteten Fonds. Die Rücklagenvariante setzt keinen neuen Kostensatz oder Geldbetrag ein. Alle Käufe laufen weiter durch den produktiven Handels-, Gebühren- und Warenverbrauchspfad.

## 4. Reproduzierbare Fortsetzung bis Tag 365

Pro Fall ein gemeinsamer, zweimal simulierter Vorlauf bis Tag 90; anschließend Kontrolle und vier Varianten aus **demselben** gespeicherten Zustand. Jede Fortsetzung hat einen eigenen uninstrumentierten Replay mit derselben Variantenfunktion. Stundenweise Core-Audit, unabhängige Geld-/Warenzählung, Einzelkassenflussprüfung und Verbrauchsgründe; täglich Hashvergleich. Save/Load und vollständiger kanonischer Vergleich an Tag **91/100/120/180/270/365**, Replay danach tatsächlich aus dem geladenen Save fortgesetzt. Bereits wartende Umbenennungen bleiben enthalten; keine zusätzlichen Spielerbefehle oder Warenlieferungen.

„Wiederherstellung“ wird getrennt gemessen: mindestens ein Schiff je Händler, vollständige Sollflotten **3/2**, Stunden und längster zusammenhängender Betrieb mit beiden Flotten, erste Warenkäufe/-verkäufe der Ersatzschiffe sowie Verluste. Physischer Schiffbestand allein zählt nicht als funktionierender Handel.

| Variante | Bezahlte Frachter nach Tag 90: Miner / Flotte / Station / Jagd | NPC-Warenhandel nach Tag 90 | Zeit bis beide Flotten 3/2 |
| --- | --- | --- | --- |
| control | 0 / 0 / 0 / 0 | 0 | bis Tag 365 nicht erreicht |
| fonds-pool | 1 / 1 / 0 / 0 | 0 | bis Tag 365 nicht erreicht |
| werft-reserve | 0 / 0 / 0 / 0 | 0 | bis Tag 365 nicht erreicht |
| ueberschuss-zur-werft | 0 / 0 / 0 / 0 | 0 | bis Tag 365 nicht erreicht |
| zuschuss-mit-ruecklage | 0 / 0 / 0 / 0 | 0 | bis Tag 365 nicht erreicht |

Auch **1/1** wird in keinem der 20 Läufe erreicht; am Ende steht überall **0/0**. Die drei Varianten außer dem Fonds-Pool bleiben an allen sechs Messpunkten sogar zustandsgleich zur Kontrolle. Es gibt keine neu entstandenen Überschüsse oder ausreichenden lokalen Mittel, die ihre Bedingungen auslösen könnten.

| Fall | Mangel 90 / 180 / 365 (alle fünf Fassungen) | Frachterproduktion seit 90 | Bauteilproduktion Aldera seit 90 |
| --- | --- | --- | --- |
| miner | 35.798 / 74.678 / 154.598 | 0 | 0 |
| handel-flotte | 36.659 / 75.539 / 155.459 | 0 | 0 |
| station | 36.503 / 75.383 / 155.303 | 0 | 0 |
| jagd | 36.525 / 75.405 / 155.325 | 0 | 0 |

Jede weitere Stunde fehlen alle 18 regulär verbrauchten Stations-/Warenpaare; die Mangelzunahme 90→365 bleibt **118.800 = 275 × 24 × 18**. Förderung und reguläre Warenproduktion laufen nicht wieder an. Alle Kassen, Warenbestände, Produktionslinien, Flottenverläufe und Flüsse sind je Messpunkt im Datensatz enthalten; die vollständigen täglichen Verläufe und Kauf-/Verlustereignisse liegen in den CI-Rohartefakten.

### Warum der erste bezahlte Frachter nicht genügt

| Pool-Fall | Kauftick | Preis + Gebühr | Cash danach | Warenkauf / Verkauf | Verlusttick | Zivile Kostenlücke seit 90 ISK |
| --- | --- | --- | --- | --- | --- | --- |
| miner | 129660 | 750 + 30 | 0 | nie / nie | 134520 | 7.973 |
| handel-flotte | 129660 | 750 + 30 | 0 | nie / nie | 130080 | 498 |

Beide Zuschüsse von **780 ISK** kommen vollständig aus `fonds_meridian`, der Frachterpreis geht an `st_aldera`, 30 ISK Gebühr zunächst an `fonds_aldera`. Die lokale Fondsauffüllung leitet die Gebühr wiederum an die unterdeckte Station weiter. Am Jahresende: Minerfall Meridian-Fonds **478**, Aldera-Kasse **2.304**; Flottenfall Meridian-Fonds **520**, Aldera-Kasse **1.465**; Aldera-Fonds jeweils null. Spielerguthaben bleiben unverändert 42.795/39.762. Kein ISK wird durch Zuschuss oder Kauf geschaffen.

Der erste Kauf reduziert den Hüllenbestand von 2 auf 1; dadurch steigt der zweite Preis von 750+30 auf **1.050+42 = 1.092 ISK**. Individuelle „Pool reicht für einen Käufer“-Angaben dürfen deshalb weder für zwei Käufer addiert noch als Flottenbudget interpretiert werden. Das Restbudget reicht nicht für den zweiten Händler; der erste hat null Kaufkraft und bewegt sich ohne Handelsfracht. Er geht nach **81 bzw. 7 Stunden** wieder verloren. Selbst die dabei erbrachten Reisearbeitsschritte bleiben mangels Kasse unbezahlt – keine verdeckte erfolgreiche Betriebskostenfinanzierung.

## 5. Materialengpass nach erfolgreichem erstem Ersatz

Nach dem ersten realen Kauf ist Platz für eine neue Hülle vorhanden, aber Aldera behält **0/8 Bauteile** und **0 Silizium**. Die Frachterlinie startet nicht; die Bauteillinie startet ebenfalls nicht. Über die gesamten 275 Folgetage werden in keiner Variante neue Frachter oder Aldera-Bauteile produziert.

Das ist ein **räumlicher Nachschubengpass**, kein Nachweis global fehlender Waren: Meridian hält an Tag 90 in allen Fällen **91 Bauteile und 100 Silizium**; Dravos/Nadir je **65 Silizium**. Das Material muss regulär gekauft und transportiert werden. Ein Frachter mit null ISK kann diesen bestehenden Weg nicht bedienen. Geldverschiebung im Fonds ersetzt weder den Warenkauf noch 8 Bauteile im Werftlager.

Die Produktionsblockade ist nachgewiesen und bleibt nach dem ersten Ersatz bestehen. **Nicht nachgewiesen** ist, dass sie allein einen ansonsten ausreichend finanzierten Händler scheitern ließe: in den Pool-Läufen fehlen bereits vorher Handelskapital und die Finanzierung der zweiten Flotte. Ein solcher zusätzlicher Kausalversuch würde eine getrennt definierte Finanzierung oder ein verändertes Befehlsband benötigen; hier wurden dafür weder Geld noch Waren künstlich ergänzt.

## 6. Empfehlung und Prüfgrenzen

**Keine der vier Einzelvarianten als wirtschaftliche Wiederanlaufkorrektur übernehmen.** Der Fonds-Pool löst einen lokalen Zahlungsengpass für die erste Hülle, aber nicht das Geschäfts- und Produktionsproblem. Zurückhalten oder Umleiten nicht vorhandener Einnahmen kann keinen zahlungsfähigen Neustart erzeugen.

Als nächster klar abgegrenzter Gegenversuch wäre die **Kombination der bereits einzeln untersuchten Fondsdeckung und bestehenden Betriebsreserve** zu prüfen, anschließend erster tatsächlicher Warenkauf, profitabler Verkauf, Bauteil-/Siliziumtransport und dauerhafte Finanzierung beider Sollflotten. Das ist eine **ungetestete Empfehlung für weitere Analyse**, keine Freigabe, keine Behauptung eines ausreichenden 250-ISK-Budgets und keine in diesem PR ausgeführte Kombination. Eine dauerhafte Lösung muss auch erklären, wie diese endlichen Mittel zurückfließen, während der Spieler 30.505–42.795 ISK halten darf. Stationscash direkt abzuschöpfen, Spielerabgaben oder neue Geldquellen einzuführen wird aus diesem Befund nicht abgeleitet.

### Tatsächlich bestandene Prüfungen

- **4/4** identische Tag-90-Fundamente und **20/20** Fortsetzungen mit Replays technisch bestanden: 281.280 stündliche Prüfzeitpunkte über beide Trajektorien, 5.860 tägliche Hashvergleiche, 240 Save/Load-Roundtrips nach Tag 90 plus vier Vorlauf-Roundtrips. 12 vollständige Kontrollhash-Vergleiche gegen konservierte #32/#33-Messpunkte. Wirtschaftlicher Erfolg: **0/16** Eingriffsfortsetzungen mit wiederhergestellten Flotten.
- Bestehende **13 Seeds × 90 Tage** v12-Referenz lokal erneut vollständig bestanden: alle Goldenprofile unverändert, 791 Mangelstunden und 16.090 ISK zivile Kostenlücke. Das ist eine Referenzprüfung der Produktbasis; **keine** erneute 13-Seed-Jahresprüfung aller Fondsvarianten. Die Eingriffe wurden gezielt an den vier nachgewiesenen Kollapsfällen getestet.
- Node.js **22.23.4**, **48/48 Standardtests bestanden**, 0 fehlgeschlagen/übersprungen. Normalen Pflichtbefehl ausgeführt; lokal zusätzlich ohne Prozessisolation für einzeln sichtbare Testzahlen. Alle fünf Varianten bestehen außerdem einen 60-Tick-Anker-/Audit-Smoke-Test mit identischem Anfangshash.
- CI teilt Diagnose, vier Fallgruppen mit je fünf Fassungen und Vollständigkeitsprüfung auf; alle 24 Datensätze werden verlangt. Aktuellen CI-Status am Draft prüfen. Keine wirtschaftlichen Erfolgsschwellen geändert; erfolglose Varianten bleiben erfolglos dokumentiert.
- Kein Produktbalancing, keine neue Laufzeitabhängigkeit, kein Save-Schemawechsel, keine Safari-/NAS-Abnahme, kein Merge oder Deployment. Regelversion/Schema bleiben 12/8; Varianten-Saves benötigen für ihre Fortsetzung ausdrücklich dieselbe Test-Funktionsfassung, sie sind keine neue Produktmigration.

```sh
export LONGTERM_SOURCE_COMMIT="$(git rev-parse HEAD)"
node tools/npc-restart-v12.mjs --prepare
# Für jeden Fall: miner,42; handel-flotte,42; station,1234; jagd,98765
for restart_variant in control fonds-pool werft-reserve ueberschuss-zur-werft zuschuss-mit-ruecklage; do
  node tools/npc-restart-v12.mjs --case=miner,42 --variant="$restart_variant"
done
# Nach allen vier Fällen:
node tools/npc-restart-v12-summary.mjs
node tools/priority-v12-reference.mjs
node --test tests/*.test.mjs
```
