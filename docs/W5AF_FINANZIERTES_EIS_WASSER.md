# W5af – Tatsächlich gefördertes und bezahltes Eis → Wasser → Kauf aus Pilotengehältern

> **[DRAFT / nur Rule194/Schema8 / 09.11.2026]** Auf [W5ae #276](https://github.com/tobiasfranziskus/Check/pull/276) gestapelte, opt-in Forschungsstufe. Produkt-`main` bleibt v0.12.5/Regel14/Schema8. Verbindliche Planung: `main/docs/ROADMAP.md`. **Kein Merge, keine Produktion, keine Geldemissions-, Preis-, Verbrauchs- oder individuelle Arbeitnehmer-Eigentumsfreigabe.**

## Ausgangspunkt und konkrete Quellen

- [Originale W5n-Draft-PR #193](https://github.com/tobiasfranziskus/Check/pull/193) **R29/Schema8** lieferte bereits die beidseitig vorfinanzierte 50-Eis-Fracht und 10-Eis-zu-10-Wasser-Werk. W5af übernimmt ihren bewährten physischen Eis-/Wasser-Kernpfad kontrolliert in den inzwischen neu aufgebauten kleinen gemeinsamen W0–W5-Kern aus #275/#276; kein zweiter Tick, keine R32-Massenintegration.
- [#276 W5ae](https://github.com/tobiasfranziskus/Check/pull/276) bewies den ersten gültigen Kauf aus 100 echten Pilotenlöhnen, aber nur für dauerhaft lagerndes W4-Material. **W5af ersetzt kein Material durch fingiertes Wasser:** Eis wird erst wirklich durch ein tatsächlich gekauftes und bezahltes eigenes Minerschiff gefördert und an Aldera verkauft; die Fracht nimmt ausschließlich physische Stationsware mit.

## Was wirklich neu ist

Neue opt-in **`createWaterResearch({carrierCash,buyerCash})`** registriert isolierte **Rule194/Schema8**. Die bisherigen API-Profile `Factory.rules` (191), `createResearch` (192) und `createWageResearch` (193) sowie deren Save-/Tests bleiben separat. **Keine** Migration von/zu Produktregel14. Die R29-Referenz `m_core_w5n` wird als Produktions- und Transportfunktion in den **bereits vorhandenen einzigen Simulationskern** gesetzt.

Konkrete R29-Forschungsparameter, *keine Balancingfreigabe*:
- **Eisförderung:** separates eigenes, bereits gegen tatsächlich vorhandene 600 ISK gekauftes Minerschiff in Aldera; `shipMine(... ware:'eis')` liefert 1 Eis pro tatsächlich absolvierter Minute gegen **2 ISK** Förderlohn aus der Eigentümerkasse. Nach 50 Min. sind **50 reales Eis** erzeugt und für 5 ISK/Stück durch `st_aldera` aus vorhandenem Stationskapital gekauft (250 ISK). Kein freies Start-Eis, keine freie Förderung; Risiko der nicht verkauften Ware bleibt beim Miner.
- **Eisfracht:** `shipFreightIce` nur mit rechtmäßig gekauftem eigenem Frachter in Aldera, 50 Eis im Stationslager, leerem Schiff, freiem W3-Auftragsplatz, vollständiger Käufer- und Arbeitsfinanzierung. **Nadir bindet 250 ISK für Eis + 240 ISK für Hin-/Rückfracht = 490 ISK**; Spedition bindet **120 ISK** Pilotenlohn. Zwei wirkliche **60-Minuten-Flüge**; nach Hinflug 50 Eis zu Nadir transferiert, 250 ISK an Aldera gebucht; erst nach 120 bezahlten Minuten werden 240 ISK Frachtvergütung freigegeben. Dies ist ein **anderer Auftrag als W3-Erzfracht**, nicht ein zweiter Simulationskern.
- **Wasseraufbereitung:** `stationWater` nur gegen mindestens 10 physisch angelieferte Eis in Nadir, freien Lagerplatz und volle **20 ISK Lohnreserve** aus eigener Nadir-Kasse. Erst nach 20 echten Minuten überträgt der gemeinsame Core **10 Eis → 10 Wasser**; Arbeiterkonto erhält 20 ISK, Warenledger schließt.
- **Lohnfinanzierter Wasserverbrauch:** Neuer expliziter Befehl `workerWaterBuy({owner:'fonds_transport',menge})` kauft ausschließlich bereits produzierte vorhandene Wasserware zum **in PR #193 schon untersuchten Forschungswert 14 ISK/Stück**. Der Käufer-Kollektivfonds verfügt nur über tatsächlich ausgezahlte Pilotengehälter (W3-/Eis-Pilotenarbeit). Bei Kauf werden **echte ISK an Nadir übertragen und die physische Wasserware als wirklich verwendetes Verbrauchsgut ausgebucht**. Atomar abgewiesen bei zu wenig Geld, Wasser, falschem Eigentümer oder nichtganzer Menge. Jeder Kauf erhält einen Zeit-/Preis-/Eigentümer-/Mengenbeleg. **Kein automatisch kaufender Haushalt und keine Konsumpflicht.**

Alle Produktions- und Eigentümerausgaben stehen im ursprünglichen gemeinsamen Cash-/Güterledger. **33.000 ISK**, `minted=0`, `burned=0`. Kernfundament für den Lohnkreislauf:
`fonds_transport.cash + W5ae.materialAusgaben + W5af.wasserAusgaben = W3.frachtLohn + W5af.eisFrachtLohn`.

Der Lohnfonds ist bisher **ein aggregiertes Sammelkonto**, kein persönliches Pilotenkonto. Dass der Pool als Arbeitnehmerkollektiv Wasser kaufen kann, bleibt ein ausdrücklicher **Forschungsannahme-/Freigabe-Gate**. Es wird kein individuelles Haushaltseigentum oder Bedürfnis erfunden; die Verbraucherware wird auf ausdrücklich ausgelösten Kauf tatsächlich verbraucht, eine Einzelperson aber nicht simuliert.

## Direkter, unabhängiger Beleg (Seed42, Original-Core)

| Tick | Physischer und buchhalterischer Fortschritt |
|---:|---|
| 0 | Erst eigenes Frachter- und Minerschiff **wirklich gekauft**, 0 Eis / 0 Wasser im Startlager |
| 50 | **50 echtes Eis** von eigenem Miner für **100 ISK Förderlöhne** erzeugt, gegen **250 ISK** von Aldera gekauft |
| 50 | 50-Eis-Fracht **490 ISK Käuferetat** und **120 ISK Speditionsarbeit** vor Flugstart gesperrt |
| 110 | 50 Eis nach 60 echten Flugminuten bei Nadir angeliefert, 250 ISK an Aldera bezahlt; Pilotenlohn bisher 60 ISK |
| 110 | Nadir bindet 20 ISK für wirkliche Wasserwerksarbeit, 10 Eis rohstoffseitig verfügbar |
| 130 | **10 Wasser nach 20 bezahlten Werkminuten** erzeugt, 10 Eis tatsächlich verbraucht; 80 ISK Pilotenlohn bis hier verdient |
| 130 | Ein ausdrücklicher Kauf von **5 Wasser für 70 ISK** aus 80 ISK angesammelten Pilotenlohn wird bezahlt und das Wasser tatsächlich verbraucht. 6 Stück (84 ISK) werden korrekt ohne Buchung abgelehnt |
| 170 | Nach voll bezahlter Rückfracht: **120 ISK Pilotlohn insgesamt**, Transport erhält 240 ISK Frachteinnahmen; weitere **3 Wasser für 42 ISK** gekauft. Somit **8 Wasser wirklich verwendet**, 112 ISK aus zuvor gezahlten Löhnen an Nadir, **2 Wasser im Lager**, 8 ISK beim Pilotenkollektiv |

Seed42 Tick170, nach vollem Lohn-Wasserkauf: deterministischer State-Hash `c584c7251d033df7`. Vollständiger Core-`audit` inklusive W0–W5, W5ae-Eigentum, W5ad-Ersatzherkunft, W5ac-Fähre und W5af Eis-/Wasserpfad **OK**, unabhängige Geld- und physische Ware 33.000 ISK / keine Emission. `W5ae`-Materialkauf bleibt optional; der Test schafft keine Anfangsmaterialien.

## Qualität, Grenzen, nächste Entscheidung

- `tests/w5af-eis-wasser-lohnkauf.test.mjs`: erste 50 Eis wirklich unter Lohnaufwand gefördert, gegen eigenes Kapital gekauft, 490/120-ISK-Eisvertrag, 10:10-Wasser und 20-ISK-Arbeit, echten Wasserverbrauch/100-ISK/14-ISK-Transaktionsbeleg, Save mitten im Flug und in der Produktion, falscher Verkäufer/Finanzierung, 6-vs-5-Gate sowie gefälschte Salden/Verträge/Produktion/wasser-Entnahmen.
- `tests/w5af-13x90-finanziertes-wasser.test.mjs`: **13 ökonomisch verschiedene finanzierte 90-Tage-Welten** (Spar-, Konsum-, Käufer- und Speditionsbudgets, Eis-/Wassermangel, 489/490-ISK-Käufergrenze, 869/870-ISK-Speditionsreserve). Drei ausgewählte 365-Tage-Fälle mit verbleibendem realen Wasser-/Geldbedarf. Seed42 und deterministisches Doppelreplay plus vollständige Core-/unabhängige Lohn-/Waren-/Geld-/Save-Audits.
- Eigener Node22-GitHub-Gate `.github/workflows/w5af-integration.yml` zusammen mit bestehenden historischen Tests. **Nur tatsächlich gelaufene CI als bestanden ausgeben.**
- **Kein** persönlich zugeteilter Lohn, kein dauerhaft automatisch nachfragender Privathaushalt, kein Energie-/Wartungs-/Ersatzbudget für Wasseranlage, kein garantierter zweiter Wasserkauf, keine neue Export-/Mintregel, kein echter iPad-Safari-/NAS-Test. Die Regel194 besitzt **noch keine eigene Browseroberfläche**; die bestehenden Regel191-Touchtests ersetzen keine Rule194-Abnahme.
- **[OPTION] Nächste Stufe:** individuelles Lohnrecht und freiwilligen Konsum bei zugleich unternehmerischer Liquidität untersuchen, reale Wasser-/Schiff-/Minerkosten und längerfristige Endnachfrage trennen. Bitte bei allen Folgestufen 13 wirtschaftlich unterschiedliche Krisen, 90 Tage, 365 Tage, deterministische Replays und unabhängige Eigentümeraudits beibehalten.

**[MAIN]** `main fd3e9154` v0.12.5/Regel14/Schema8, produktive Saves und GitHub Pages unberührt. Kein Merge oder Deployment.
