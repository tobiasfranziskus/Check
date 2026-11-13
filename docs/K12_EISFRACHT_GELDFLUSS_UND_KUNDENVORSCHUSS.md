# K12 – Eisfracht-Kapitalfluss: Nadir solvent, Spedition ohne 74 ISK Crewreserve

**[DRAFT / ANALYSE · 13.11.2026]** [PR #327](https://github.com/tobiasfranziskus/Check/pull/327), gestapelt auf dem **quellkorrigierten** [K11 #326](https://github.com/tobiasfranziskus/Check/pull/326). K12 ändert ausschließlich Test, CI und Dokumentation; keine produktiven Spiel-, Preis-, Regel-, Konto-, Spielstand- oder Wirtschaftsablaufänderungen. [BESCHLOSSEN] Geldmodell B, echte Finanzierung, keine unautorisierte Fremdeinlage, freie Ersparnis und getrennte Produktfreigaben bleiben unverändert.

## Warum die K11-Korrektur entscheidend ist

In der originalen K1-/Regel200-Quelle `prototypes/welt/rule200-k7-industry-core.js` prüft `m_core_w5n.pruefenFracht` beim Eis-/Rundfrachtauftrag:
1. **Reale 50 Eis** in Aldera und ausreichend Platz in Nadir.
2. **`s.owners[c.zielStation].cash >= p.gesamt`**, für `c.zielStation='st_nadir'`: Rechnung **490 ISK** aus **250 ISK Eis + 240 ISK Hin-/Rückfracht**.
3. **`s.owners[c.frachterOwner].cash >= p.arbeit`**, für `c.frachterOwner='transport'`: **120 ISK für 120 bezahlte Pilotenminuten**.

Dieselben Konten werden bei `m_core_w5n.frachtStart` tatsächlich belastet. Die frühere K11-Auswertung hatte fälschlich `c.kunde='fonds_transport'` als Zahler für Punkt 2 verwendet; das ist **nicht die Original-Vertragsabbuchung**. [K11-Berichtigung](K11_REALE_FRACHTERNACHFRAGE_UND_KAEUFERFINANZIERUNG.md). `fonds_transport` ist hier ein altes, unabhängiges Lohn-/Auditkonto, keine zusätzlich insolvente Warenkasse.

## Echte K12-Originalsimulation

Für beide ursprünglichen Krisenseeds **42** und **7** erzeugt `tools/k11-k10-endstand.mjs` auf legalen W1/W3/W4/W5-Buchungen den echten K10-Achter-Endzustand (Tick24446), einschließlich real gekaufter und bezahlter Frachter sowie zwei tatsächlich gelagerter unverkaufter Werftschiffe. Danach laufen **720 echte Original-Spielminuten** mit eingeschalteter Eis-/Ersatzautomatik und ohne zusätzliche Stilllegung. Nur reale NPC-Minerförderung, echter Kauf der Station Aldera, keine erfundenen Eis-/Geldkonten.

[Ausgeführter K12-Node22-Job #43404272104](https://github.com/tobiasfranziskus/Check/actions/runs/43404272104), Codehead `2e1cab6b`: **2/2 Seedtests erfolgreich**, 0 Fehler und 0 Skips. Original-`shipFreightIce` wird ausdrücklich versucht und **atomar** abgelehnt, Beleg `Spedition kann Flugarbeit nicht vorfinanzieren`. Original-`dividendPay` aus dem Anteilseignerhaushalt scheitert ebenfalls, weil Dividenden ausschließlich nachgewiesene freie Firmengewinne **an** den Eigentümer ausschütten und keine reverse Firmenfinanzierung sind. Originalgeld-/Ware-/Eigentumsaudit, Save-/Load-Roundtrip und 120-Minuten-Hash-Replay bestanden.

| K12 Originalmessung | Seed 42 | Seed 7 |
| --- | ---: | ---: |
| Start / Ende nach echten 720 Minuten | Tick 24446 / 25166 | Tick 24446 / 25166 |
| Eis in Aldera, Start → Ende | 2 → **52** | 2 → **52** |
| Weitere physisch gewonnene und an Aldera verkaufte Eis | **50** | **50** |
| Zusätzliche bezahlte W5n-Eis-Rundfrachten | **0** | **0** |
| Zusätzliche Wasserproduktion und W5n-Piloten-Wasserverkäufe | **0** | **0** |
| Nadir: echter Waren-/Frachtkäufer | **3.440 ISK** | **3.440 ISK** |
| Bereits bestehender Käuferbedarf | **490 ISK** | **490 ISK** |
| Fehlbetrag von Nadir | **0 ISK** | **0 ISK** |
| Speditionskasse | **46 ISK** | **46 ISK** |
| Original-Pilotenreserve | **120 ISK** | **120 ISK** |
| Einziger vorliegender Crew-Finanzierungsfehlbetrag | **74 ISK** | **74 ISK** |
| Historisches `fonds_transport`-Konto, nicht Vertragskäufer | 0 ISK | 0 ISK |
| Bereits unverkaufte Original-W5-Schiffe | 2 | 2 |
| Weltgeld / Mint / Burn | 33.000 / 0 / 0 ISK | 33.000 / 0 / 0 ISK |
| K12-Referenzhash | `a9fb76b73305c268` | `482b165804ec9428` |

Die Original-Spedition weist im **kumulierten** Statistikbuch `erloes=42.960 ISK` und `kosten=36.000 ISK` aus; daraus lässt sich ihre **gegenwärtige Liquidität von 46 ISK nicht durch einfache Subtraktion herleiten**, da weitere K1-Transferbuchungen, darunter Ausschüttungen, existieren. Das erste K12-Testprotokoll beweist diese kumulierten Zähler, aber keine hier erfundene exakte Eigentümerdividendenzahl. Ein nachfolgender K12-Codehead prüft auch tatsächliche Ausschüttungs- und Haushaltsverkaufsbuchungen über `s.kanon.buch.summen`; bis zu dessen eigener abgeschlossener CI werden daraus keine neuen Zahlen behauptet.

## [OPTION] Rechtmäßig finanzierter **Auftragsvorschuss**, kein Geldmint

Das aktuelle Originalgeschäft ist **betragsmäßig finanzierbar**, aber organisatorisch blockiert: Nadir besitzt den Kaufpreis; die Spedition soll trotzdem 120 ISK Crewarbeit vorschießen. Eine mögliche **neue**, ausdrücklich freizugebende Regel könnte für eine bereits bedarfsgeprüfte 50er-Eisfracht einen **echten Kunden-/Frachtarbeitsvorschuss** aus demselben Kaufetat vorsehen:

| Rechnungsbestandteil | Betrag | Rechtswirtschaftliche Bindung |
| --- | ---: | --- |
| Nadir bucht einen einzigen Gesamtauftrag in Treuhand | **490 ISK** | Bereits vorhandenes Geld, vollständige Käuferdeckung |
| Eislieferung aus Aldera | 250 ISK | Zahlung an den belegten Verkäufer erst bei realer Warenlieferung |
| Vorbezahlte, minutenweise auszuzahlende Pilotenarbeit | 120 ISK | Bereits in 240-ISK-Frachtpreis enthalten, kein zusätzlicher Lohn |
| Übrige Frachtvergütung bei abgeschlossener Rundreise | 120 ISK | Nachweisbare Leistung der Spedition |
| **Summe** | **490 ISK** | **Keine** ISK aus dem Nichts |

Vorteil der bloßen Finanzierungsalternative: **Endgewinn der Spedition unverändert +120 ISK pro abgeschlossener Runde** (Original: +240 Fracht minus 120 eigenes Crewbudget; Option: +120 verbleibendes Frachtentgelt bei kundenfinanzierten Crewkosten). Bei einem Bestand von 46 ISK ergäbe sich nach erfolgreich absolvierter und bezahlter Fracht rechnerisch **166 ISK**, nicht sofort zu Beginn. Es entsteht dadurch weder gratis Erz/Eis/Wasser noch ein künstlicher Käufer. Es ist **kein** bestehender `shipFreightIce`-Befehl und **nicht** in irgendeinem Spielstand verbucht.

**Offene Sicherheits- und Vertragsfragen für gesonderte Produktentscheidung:** verbindliche Leistungs- und Eigentümerunterschriften, Zeitpunkt der Eisabnahme, Crew-Vorschuss als Bestandteil statt Zusatz zum Tarifsatz, Mittel bei Storno/Fehlschlag, Weiterzahlung bereits geleisteter Minuten, Verlust-/Insolvenzbehandlung, neutraler Geld-/Waren-/Eigentumsaudit, W5n-Rückfracht-/Wassermarkt und langfristige Dauerwirtschaft. Vor Produktaktivierung mindestens 13 unterschiedliche Szenarien × 90 Tage plus 365/730 Tage, Chromium/WebKit und echte iPad-Safari-/NAS-Abnahme.

**[NÄCHSTER FREIGABEPUNKT]** Möchte der Nutzer diese **abgegrenzte K12-Option** als isolierten Forschungskern mit echten gebuchten 490-ISK-Kundentreuhand, vollständig nachgewiesener 50-Eis-Hin-/Rückfracht, 120 Original-Pilotenlohnminuten, realer Warenübergabe und Auszahlung nur erbrachter Leistung untersuchen? Bis zur Produktentscheidung bleibt ausschließlich die K12-Analyse/CI aktiv. Keine Änderung an `main`, GitHub Pages, NAS oder Nutzerdaten.
