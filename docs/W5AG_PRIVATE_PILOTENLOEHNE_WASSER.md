# W5ag – echte individuelle Pilotenlöhne und freiwilliger Wasserverbrauch

> **[DRAFT / FORSCHUNGSREGEL195 / 09.11.2026]** Auf [#277 W5af](https://github.com/tobiasfranziskus/Check/pull/277) gestapelt. Die **einzige verbindliche Roadmap** ist `main/docs/ROADMAP.md`; dieser Bericht ist kein Ersatz für die Roadmap und keine Produktfreigabe. Produkt-`main` verbleibt bei `fd3e9154`, Regel14/Schema8. Keine Freigabe individueller Arbeitsrechte, Preisänderung, Konsumpflicht, KI-Entscheidung, Mint-ISK oder automatische Übernahme in produktive Saves. Keine Merges/Deployments.

## Ausgangslage

- W5ad #275 bewies reale Hüllen-/Ersatzfinanzierung, aber einen nicht ausgabefähigen, stetig steigenden Lohnfonds.
- W5ae #276 bewies einen freiwilligen echten Materialkauf aus dem Lohn-*Sammelkonto*, unter der ausdrücklich hypothetischen Annahme eines kollektiv verfügungsberechtigten Pools.
- W5af #277 bewies reale 50-Eis-Fracht, tatsächlich finanzierte 10-Eis→10-Wasser-Produktion und tatsächlichen Wasserverbrauch gegen vorher bezahlte Frachtlöhne aus dem *Pool*.
- W5ag prüft ein gezielt **anderes Eigentumsregime**: Zwei **einzeln voneinander und von Spedition/Nadir getrennte Privateigentümer**; der alte Fonds kann nicht mehr konsumieren. Ein späterer produktiver Entschluss über Arbeitnehmereigentum bleibt [OFFEN].

## Implementierung – keine doppelte Simulation

Das bereits vorhandene, statisch nutzbare JavaScript unter `prototypes/w5ac/rule191-w5-ferry-core.js` erhält ein ausdrücklich optionales `createPrivateWageResearch({carrierCash,buyerCash})`. Dadurch gilt **Rule195/Schema8**, alle alten APIs `Factory.rules`=191, `createResearch`=192, `createWageResearch`=193, `createWaterResearch`=194 bleiben mit ihren eigenen Daten-/Saves getrennt. Es gibt **keinen zweiten Tick/keine Zusatzökonomie** und keine Initialüberweisung: `pilot_erz` und `pilot_eis` beginnen mit **je 0 ISK**.

### Warum die Löhne legitim sind

Der bestehende originale W3-`shipFreight`-Arbeitstreuhandvertrag bindet 120 ISK aus **eigenem** Speditionsgeld vor Start und zahlt nach jeder wirklich geleisteten Minute über dieselbe Core-Uhr **genau 1 ISK direkt an den autorisierten privaten `pilot_erz`**. Der Eis-`shipFreightIce`-Arbeitstreuhandvertrag bindet separat **120 eigene ISK** und zahlt **genau 1 ISK an `pilot_eis`** je tatsächlich bezahlter Minute. Keine andere Tätigkeit wird nachträglich als bezahlte Pilotenarbeit fingiert; W5ac-Überführungsflüge behalten ihr eigenes separat auditiertes Pilotenlohnkonto und sind **nicht still** auf die zwei neuen Piloten umgestellt.

Jede Minute trägt einen strukturierten `w5ag.payments`-Beleg `{tick,kind,owner,schiff,isk}`. Der private Lohn-Audit rekonstruiert die erwarteten Minuten **unabhängig** aus den tatsächlich abgeschlossenen und aktiven W3-Rechnungen `w5ad.freight[]/w3.auftrag` sowie den eindeutigen, mit realem Eisfrachtauftrag verbundenen 60+60-Minuten-Verträgen `w5ag.iceContracts[]`. Er prüft jede einzelne Tick-/Schiffs-/Personen-Zuordnung, identische Anzahl und Summe, vollständige Zahlung, getrennte persönliche Erlös-/Kostenstatistik und unveränderte physische Warenbuchhaltung. Kein Lohn für einen ausgefallenen oder nicht begonnenen Flug.

### Eigentum und Konsum

`pilotWaterBuy` erfordert die **konkrete persönliche `owner`-ID** des jeweiligen Piloten, positive ganze Menge, physisch wirklich erzeugtes Wasser in Nadir und **die eigene vorhandene Lohnkasse**. Der historische Forschungs-Wasserpreis aus W5n/PR #193 bleibt **14 ISK/Stück**. Der Pilot bezahlt Nadir, Wasser wird wirklich verbraucht und aus dem Core-Lager-/Ledger ausgebucht, der Kaufpreis wird in `w5n.kaufDeals` der tatsächlichen Pilot-ID zugerechnet. Der andere Pilot kann nicht als Stellvertreter dessen Geld ausgeben. `workerWaterBuy` vom Pool und `workerMaterialBuy` aus dem Pool sind **in Rule195 ausdrücklich gesperrt**; frühere Rule193/194-Saves/Forschungsprofile haben unverändert ihre bisherige getrennte Version.

Freiwilliges Sparen bleibt unbeschränkt. Es gibt **kein** Mindest-Verbrauchsgebot und **keinen automatisch kaufenden Haushalt**. Konten beider Piloten gehören nur ihnen selbst; weder Nadir noch die Spedition greifen auf ihre Lohnkasse zu. Die Arbeitereinkommen werden ausschließlich aus vorher finanzierten Flugminuten verdient. Für jeden einzelnen Piloten gilt unabhängig:

`privateCash + sum(tatsächlich bezahlter eigener Wasserkäufe) = sum(tatsächlich bezahlter eigener Flugminuten) × 1 ISK`

Das Fonds-Sammelkonto steht in dieser opt-in Forschung bei **0 ISK**; dies ist eine geänderte Forschungsannahme über den Zahlungsempfänger, keine heimliche Entnahme aus alten Fondsbeständen.

## Konkreter funktionierender Gegenversuch

Ein einziger echt für 750 ISK gekaufter Frachter führt **nacheinander** einen vollständig bezahlten 50-Erz-W3-Auftrag und einen separat bezahlten 50-Eis-W5af-Auftrag aus. Eigener Miner fördert 50 Eis gegen echte 100 ISK Förderarbeit; Nadir finanziert 490 ISK Eis-/Frachtabnahme und später weitere 20 ISK Wasserwerk. Keine doppelte Fracht, keine vergessene Rückfahrt, keine Gratis-Löhne.

| Original-Core-Tick | `pilot_erz` | `pilot_eis` | Physischer Zustand |
| ---: | ---: | ---: | --- |
| 50 | 0 ISK | 0 ISK | 50 reales Erz und 50 reales Eis in Aldera, Frachter bezahlt |
| 170 | **120 ISK** aus 120 Min. W3-Arbeit | 0 ISK | Erz-W3-Rückfahrt wirklich abgeschlossen, Eisauftrag startet |
| 230 | 120 ISK | **60 ISK** | 50 echtes Eis in Nadir nach bezahltem Hinflug |
| 250 | 120 ISK | **80 ISK** | 10 Wasser aus 10 Eis nach 20 bezahlten Fabrikminuten verfügbar |
| 250 nach zwei freiwilligen Käufen | **36 ISK** (6 Wasser für 84 ISK) | **24 ISK** (4 Wasser für 56 ISK) | **10 Wasser tatsächlich verbraucht**, Nadir +140 ISK Umsatz |
| 290 | **36 ISK** | **64 ISK** | Eis-Rückfahrt vollständig, `pilot_eis` hat insgesamt 120 ISK verdient |

Seed42 nach Tick290 Hash **`4a9b58c1f8c7d252`** (unabhängig durch direkten Original-Core-Replay auf diesem Branch ermittelt), Weltgeld unverändert **33.000 ISK**, `minted=0`, `burned=0`. Beide persönlichen Konten, Eigentumsrechte, gekaufte Wassermengen, Lohnminuten, Auftraggeber, Schiff, Werk und tatsächliche Kassen-/Warenbilanz stimmen im einzigen Core-Audit. Ein Pool-Kauf oder fremder Auftrag wird atomar verweigert.

## Tests und harte Grenzen

- `tests/w5ag-individuelle-pilotenloehne.test.mjs`: beide realen Originalaufträge, W3/ICE-Lohnbesitzer, minutengenaue Payroll, 14-ISK-Preis aus Original-R29, getrennte tatsächliche persönliche Verkäufe und Sparen, Abweisungen von fremden Konten, falschen Lohnminuten, manipulierten Receipts und manipulierter privater Geldverteilung, Rule195-Save/Load und Absicherung alter Regelversionen.
- `tests/w5ag-private-wage-13x90.test.mjs`: **13 wirtschaftlich unterschiedlich finanzierte oder handelnde** 90-Tage-Welten (beide kaufen/beide sparen, unterschiedliche persönliche Kaufentscheidungen, ungeeignete Teilbudgets, mangelnder Miner, fehlende Wasserfabrik, 739/489-ISK-Kaufkunde, 869/870-ISK-Eigenarbeitsreserve). Drei echte 365-Tage-Krisen, täglicher unabhängiger Geld-/Güter-/Lohn-/Einzelpersonenaudit und deterministischer Hash-/Save-/Load-Doppelreplay. **Nur tatsächlich ausgeführte Ergebnisse als bestanden bezeichnen.**
- `.github/workflows/w5ag-integration.yml` führt `node --test tests/*.test.mjs` auf Node22 einschließlich der gesamten früheren Regression aus.
- **Nicht bewiesen:** individuelle Personal- und Sozial-/Steuerregeln für eine spätere Produktfreigabe, langlebige autonome Konsumnachfrage, Wasseranlagen-Verschleiß, Schiffsersatz über wiederholte Endkäufe, genügend Einkünfte für einen dauerhaften W6-Wirtschaftskreislauf.
- **Noch keine eigene Rule195-Browseroberfläche oder echte iPad-Safari-/NAS-Abnahme**. Erfolgreiche ältere Touchtests von W5u/W5ac gelten ausdrücklich nicht als W5ag-Browserabnahme. `main`, Pages, Alt-/Produkt-Saves, Geldmodell B und Originalregel 14 bleiben unberührt.

**[OPTION / nach CI]** Den kleinen privaten Wasserverbrauch in eine tatsächlich wiederholbare, einzeln finanzierte Arbeits-/Kauf-/Herstellungssequenz mit überprüfter Nachfrage und realen Konzern-Rücklagen führen. In der Krise dürfen Arbeitnehmer sparen, Verbraucher ihre Käufe einstellen und Firmen ruhen oder untergehen; kein Gratis-Wiederanlauf, keine Kaufpflicht, keine neue Emission. Bei Bedarf wirtschaftliche Identitäts-/Personalrechte erst separat beschließen.
