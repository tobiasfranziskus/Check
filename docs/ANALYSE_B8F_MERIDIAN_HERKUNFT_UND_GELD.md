# B8f – Meridian-Außenhandel, Herkunftsrisiko und tatsächliche Geldbrücken

**31.10.2026 · [ANALYSE/DRAFT]**. Basis ausschließlich `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5 / Regel 14 / Schema 8. [Verbindliche ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md).

## Prüfziel

[B8e #65](https://github.com/tobiasfranziskus/Check/pull/65) zahlte bei einem hypothetischen global begrenzten, physisch tatsächlich ausgeführten Warenexport insgesamt **578 ISK** an Meridian, ohne den Wirtschafts-Kollaps zu lösen. Offen war, ob dieselben Exporte zuvor **kostenlos im bestehenden `aussenhandel` importierte Ware** enthalten könnten, sowie welcher tatsächliche Zahlungsweg von Meridian zu Händler-/Fabrik-Kassen existiert. Eine neue Geldquelle, Insolvenzregel, Kauf-/Transportentscheidung oder Risikoregel ist **nicht beauftragt und nicht implementiert**.

## Vorgehen – rein lesender Originalkern

Exakt zwei unveränderte Originalregel14-Welten Seed42 ×90 Tage: historische `handel-flotte`-Spielerkrise mit sieben reproduzierten B1-Befehlen sowie passive Vergleichswelt ohne Spieleraktionen. Der originale `index.html`-Core wird auf SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9` fixiert. Ein nur im Node-Analyserunner wirksamer Beobachter protokolliert die **echten Core-Operationen**: `handel` an Meridian (Warenmenge, echte Station→Schiffseigner- und Schiffseigner→Station-Zahlung), `aussenhandel` (kostenlose physische Imports/Exports), Piratenbeute, reguläre Fondsauffüllung und regionale Überlaufüberweisungen.

Jede Meridian-Ware wird über die **unterschiedlichen Eingangskanäle** getrennt nachgerechnet: Anfangsbestand, Außeneinfuhr, physische Schiffslieferung, Piratenbeute. Jede echte Entnahme wird parallel in **zwei alternativen, vollständig rechnerisch gedeckten Zuordnungen** verbucht: *importierte Ware zuerst* vs. *importierte Ware zuletzt*. Da im bestehenden Core keine Seriennummer oder Herkunft je Einheit gespeichert ist, sind diese beiden Rechenkonventionen **kein Beweis**, welche einzelnen Waren physisch exportiert wurden, und nicht einmal ein vollständiger globaler Lieferkettennachweis: Eine von einem Schiff erneut angelieferte Ware kann ihrerseits zuvor kostenlos eingeführt worden sein. **Keine Null-Risiko-Aussage bei Zuordnung „importiert zuletzt“.** Ohne vollständige Herkunfts-IDs gibt es kein fälschungssicheres „nur heimisch“ vergütbares Exportlos.

Zusätzlich zu Core-Audits/Hashes werden Meridian-Lagermengen für jede Ware unabhängig rekonziliiert:

`Anfangsbestand + Schiffslieferungen + Außenimporte + Piratenbeute − Schiffskäufe − Außenexporte = Endbestand`.

**Die Zahlungswege** werden als tatsächliche, **kumulierte Brutto-Umsätze** ausgewiesen, nicht als Gewinn, Kapitalrendite, offene Nettokasse oder neue ISK. Zwischenstationäre Fondsverteilung ist eine bestehende reale Umbuchung, kein Geldschöpfungsmechanismus.

## [TEST] Befunde (Seed42, 90 Spieltage)

**Vorläufige Läufe:** Der ursprüngliche CI-Workflow lieferte reproduzierte Spielerhashes und Beobachterdaten, aber der zusätzliche Job zur strukturellen Ergebnisprüfung scheiterte an einer **falschen Feldtypannahme** (Waren-Tabelle statt Gesamtzahl). Nach Korrektur wird der gesamte Originalzustand erneut in CI geprüft; **nur der abschließend erfolgreiche Lauf gilt als bestanden**.

| Nachgewiesener Vorgang bei Meridian | Aktive Spielerkrise | Passive Welt |
| --- | ---: | ---: |
| Außenexporte, physische Einheiten | **1.578** | **15.482** |
| Außenimporte, physische Einheiten | **238** | **3.596** |
| Echte Schiffslieferungen an Meridian | **5.535** | **84.169** |
| Von Schiffen in Meridian gekaufte Waren | **4.566** | **78.454** |
| Echte Bruttozahlungen Meridian → Schiffseigner | **315.775 ISK** | **5.660.881 ISK** |
| Echte Bruttozahlungen Schiffseigner → Meridian | **250.183 ISK** | **4.511.008 ISK** |

**[BEOBACHTUNG]** Bereits der Original-Außenhandel lässt gleichzeitig Importe **und** Exporte derselben Warentypen zu (u. a. Nahrung, Medizin, Material, Bauteile, Silizium). Dass eine Exportbuchung eine physisch vorhandene Ware abzieht, beweist **nicht**, dass sie aus heimischer Produktion oder Förderung stammt. Für die aktive Welt ordnen die beiden analytischen Entnahmekonventionen **0 bzw. 72 Export-Einheiten** direkt dem Importbestand zu; in der passiven Welt **0 bzw. 1.274 Einheiten**. Diese Werte sind lediglich **Modellzuordnungen für vermischte Bestände**, keine tatsächliche Nachverfolgung konkreter Cargo-IDs und keine sicheren oberen Grenzen unter Re-Import/Handelsumwegen.

Die wahren, bislang **nicht** identifizierten Warenketten „gefördert/produziert → Schiff → Meridian → externer Käufer“ sind damit als Grundlage einer späteren vergüteten Emission offen. Ebenso ließen sich umlaufende Startbestände oder wieder importierte Waren fälschlich monetarisieren. Eine Produktions-/Fördervergütung ist nicht über die ursprüngliche Außenexportlogik abzusichern.

**[GELDKREISLAUF]** Die realen Meridian-Bruttozahlungen erreichen zunächst auch NPC1/2 und den Spieler (Krisenwelt Meridian → NPC1 **143.629**, NPC2 **129.699**, Spieler **42.447 ISK**; in Gegenrichtung NPC1 **118.966**, NPC2 **94.773**, Spieler **36.444 ISK**). **Diese Werte sind 90-Tage-Summen wiederverwendeten Geldes, nicht gleichzeitig vorhandene Kassen!** Bereits bis Ende Tag14 bleibt Spieler-Cash **39.762 ISK**, NPC1/NPC2 **0**, Meridian-Kasse **2.800**; Tag90 unverändert dieselben Werte. In dieser Krise erzeugt der existierende Markthandelsweg also keinen nachweislichen **weiteren** kaufkraftgetragenen Handel nach dem Kollaps. Eigene, beobachtete Fonds→Stations-Umbuchungen gibt es im historischen Verlauf, aber sie gelten nicht als Erträge der Außenexporte und garantieren keine weitere profitable Schiffsfahrt.

## Bewertung und nächste Arbeit

**[KEINE PRODUKTFREIGABE]** B8f implementiert überhaupt keine Einnahmeregel, sondern erklärt, **warum die in B8e testweise vergütete physische Außenexportmenge weder verlässlich als echte heimische Wertschöpfung identifiziert noch als automatischer Geldrückfluss zu ziviler Fabriknachfrage behandelt werden kann**. Eine weltweite Nachfrage-/Auftragslogik müsste eigene **beglaubigte Warenerzeugungs-/Cargo-Herkunft** und **vorfinanzierte, wirtschaftlich wiederholbare bezahlte Käufe** als Voraussetzungen schaffen. Einfach „Meridian-Export belohnen“ wäre nicht ausreichend.

Als nächste **[OPTION]** nur die fachliche Herkunftssemantik bzw. die konkret versorgungsrelevanten bezahlten Abnahmeverträge gegenüber deren Transportvollkosten spezifizieren, dann einen einzelnen **nachweisbar wiederkehrenden** realen Versorgungsvertrag experimentell prüfen. Keine Neugeldschöpfung, keine pauschale Rettung, keine Spielerbesteuerung oder kostenlose Hüllen aus dieser Analyse ableiten.

**Abnahmegrenzen:** Keine neue Regel-/Save-/Schema-Migration, keine Produktcodeänderung, keine 13 ×90-Seeds, keine historischen 365d-Stressfälle, keine iPad-Safari-/NAS-Abnahme, kein Merge oder Deployment.
