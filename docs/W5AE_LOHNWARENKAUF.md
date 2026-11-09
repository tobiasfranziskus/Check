# W5ae – Original-Frachtlöhne kaufen realen W4-Bestand: Eigentum, Finanzierung und Grenzen

> **[DRAFT / ANALYSE / nur Forschungsregel193/Schema8 · 09.11.2026]** Gestapelt auf [#275 W5ad](https://github.com/tobiasfranziskus/Check/pull/275), seinerseits auf [#274 W5ac](https://github.com/tobiasfranziskus/Check/pull/274). Autoritative Produktplanung ist ausschließlich `main/docs/ROADMAP.md`; wirtschaftliche Entscheidungen, Merges und Publikationen gehören dem Nutzer. Produkt-`main` verbleibt bei Regel14/Schema8. Die Forschung gibt **keine** neuen Produktions-, Konsum-, Wasser-, Preis-, Sozial- oder Geldemissionsregeln frei.

## Der nachgewiesene Engpass

W5ad beweist für den kleinen Regel192-Kern `fonds_transport.cash = 120N + a` bei `N` vollständig bezahlten Frachtrunden und `a` bereits gezahlten Minuten des offenen Flugs. Das Konto nimmt in Regel192 Löhne an, hat aber keine zulässige Ausgabe. Damit gilt bei fixen 33.000 ISK ohne neues Geld `N ≤ 275`, noch bevor zusätzliche Käufer-/Erzengpässe betrachtet werden.

**Ziel dieses kleinen Schritts:** Nur **einen** konkret nachweisbaren arbeitsfinanzierten Warenkauf einführen, um einen legitimen Abgang aus dem Arbeitsfonds, den entsprechenden Verkäufererlös und **fortbestehendes Eigentum an der physischen Ware** zu überprüfen. Das ist noch kein langlebiger Kreislauf.

### Wichtig: keine erfundene Wasserproduktion

Der kleine bisherige W0–W5-Core besitzt ausschließlich echte Erz-/W4-Material-/Frachterproduktion. Die im größeren R32-Forschungszweig vorhandene Eis-/Wasserproduktion ist **nicht** hier integriert; daher **kein** fingierter Wasserkauf. Vorerst ist die wirkliche Ware W4-`material`, die auch die W5-Werft als Produktionsinput verwendet. Deren W5-Originalpreis **100 ISK je Material** wird unverändert als Forschungs-Transferpreis angenommen. **Kauf bedeutet physische private Materialbevorratung, nicht Verbrauch**: Eine echte Verwendung für privates Eigentum oder eine dauerhafte Arbeitskraftnachfrage wird noch nicht modelliert.

Das Original-`fonds_transport` ist ein **Sammelkonto für real gezahlte Löhne**, noch kein auf einzelne Piloten aufgeteiltes Eigentums- oder Sozialrecht. W5ae nimmt als **isolierte Forschungsannahme** nur für das neue, ausdrücklich optionale Kommando an, dieses Kollektiv könne aus **eigenem** verfügbaren Fondsbestand Material kaufen und selbst als separates Eigentum lagern. **Keine** Auszahlung an eine Spedition, Werft, NPC-Gesellschaft oder willkürliche Drittperson. Individuelle Pilotenlohnkonten, privates Konsumrecht und Arbeitnehmer-Sparprofile bleiben **[OFFENE PRODUKTENTSCHEIDUNG]**. Es gibt keine automatische Bestellung; die Arbeiter dürfen uneingeschränkt sparen.

## Die tatsächlich implementierte Transaktion

Im bestehenden **einzigen** Core `prototypes/w5ac/rule191-w5-ferry-core.js` ist opt-in `createWageResearch({carrierCash,buyerCash})` verfügbar. Default bleibt Regel191 und `createResearch(...)` weiterhin Regel192, beides bei unveränderten Regeln und Referenzhashes. Neue Forschungsregel193 verwendet dieselben W0–W5-Kauf-/Verlust-/Flugkerne, dieselbe RNG-/Core-Uhr und unveränderte 33.000 ISK Anfangsmenge. **Keine** Regel-/Save-193-Migration auf Regel191/192.

`workerMaterialBuy` verlangt:
- **Besitzer `fonds_transport`**, positive ganze `menge`, keine fremden Konten oder Kostenübernahme.
- Reale, bereits **von W4 nach bezahlter Raffineriearbeit produzierte** Materialstücke im Stationslager `st_nadir`, soweit nicht schon durch W5-Bau verbraucht oder jemand anderem verkauft.
- Gesamten vorhandenen tatsächlich ausgezahlten Lohn in der eigenen Käuferkasse: `100 ISK × menge`. Kein Kredit und keine nachträgliche Lohnbuchung.
- Bei Erfolg **gleichzeitig** eigenes `fonds_transport.cash -= betrag`, `st_nadir.cash += betrag`, `st_nadir.lager.material -= menge`, `w5ae.inventory.material += menge`. Der Warenbestand wird nicht als „verbraucht“ gebucht, kein Geld oder Material erzeugt.
- Kumulierte Original-Core-Belege: `w5ae.purchased`, `w5ae.spent`, `w5ae.deals[{tick,owner,station,ware,menge,preis,betrag}]`, getrennte Käufer- und Verkäufer-Kosten-/Erlösstatistik. Rückwirkendes freies Ändern von Kasse, Handelsbeleg, Lager oder Eigentum muss den vollständigen Geld-/Waren-/W3-/W4-/W5-/W5ad-/W5ae-Audit scheitern lassen.

Die Original-„ohne Ausgaben“-Geldschranke ist damit nicht mehr allgemein gültig. Die **korrekte neue Lohnfonds-Identität** lautet bei derselben abgerechneten Arbeitsleistung:

`fonds_transport.cash + w5ae.spent = w3.arbeitsKosten`.

**Das ist keine Behauptung endlosen Wirtschaftsbetriebs**: Geld vom Verkäufer Nadir ist nicht automatisch wieder ein Erwerbseinkommen der Spedition, und die Materialbevor­ratung muss tatsächlich produziert, bezahlt und gegen Schiffbau-Nachfrage konkurrierend behandelt werden.

## Direkter Finanzierungskontrast mit endlichem Nadir-Kapital

Beide Welten haben **33.000 Welt-ISK**, exakt denselben RNG-Seed42 und von Anfang an dasselbe Käuferkapital `st_nadir.cash=950` sowie `transport.cash=2000`. Die weiteren Konten, einschließlich des Haushalts, erhalten entsprechend die ausgewiesene unveränderte Restsumme; keine laufende Geldverschiebung.

Nach einem echten W3-Erztransport stehen erste 5 W4-Material zur Verfügung. Der Arbeitsfonds hat bei Tick130 **80 ISK** (unter 100: Kauf abgelehnt), bei Tick150 **100 ISK**. Die sparende Variante führt danach W5-Schiffbau für 500 Materialkauf +30 Werftlohn aus und hält Nadir nach einer W4-Charge bei **690 ISK**; eine zweite 740-ISK-W3-Rundfracht kann **trotz tatsächlich verfügbarer Aldera-Erzware** nicht bezahlt werden.

Die freiwillige Kaufvariante zahlt bei Tick150 **100 ISK aus bereits empfangenen Löhnen**, erhält physisch **1 Material als eigenes Kollektiveigentum**. Wegen der dann für eine neue Hülle fehlenden fünften Materialeinheit muss Nadir zusätzlich eine zweite echte **10-Erz→5-Material-W4-Charge mit 20 ISK Lohn** vorfinanzieren. Werft bezahlt 5 Material/30 ISK Lohn, Spedition kauft tatsächliche Hülle. Bei Tick230 sind dann **770 ISK** in Nadirs echter Käuferkasse, 50 echte Erz bei Aldera vorhanden, und der originale `shipFreight` darf den zweiten 740-ISK-Kaufvertrag und 120 eigene Pilotenlohnmittel reservieren. Das ist der kleine, unterscheidbare **real bezahlte Rückfluss**, nicht künstliche Nachfrage nach Erz. Nadir behält nach dem bezahlten zweiten Vertrag **30 ISK**, die Arbeitskräfte nach zweiter Runde weitere echte Löhne und ihr eigenes Material.

Die von der Werft erworbene Hülle ist in diesem Experiment ein reales Handelsgut, dessen Absatz nicht automatisch als Folgeauftrag für den Spediteur gilt. Es entsteht **keine** neue Endproduktion, kein Haushalt mit Wasserbedarf und keine dauerhafte Wiederholungsgarantie.

## Qualität / exakte Grenzen

- `tests/w5ae-lohnmaterialkauf.test.mjs`: einmaliger bezahlter Original-Core-Kauf, Herkunft/Inventar, Spar-/Budget-/Warenmangel, reeller W5-Input-Konkurrenzbeleg, Gegenwelt mit exakt gleichem Ausgangsbudget aber fehlendem Folgeauftrag, atomare Ablehnung gefälschter Saves/Schiffs-/Konto-/Besitzänderung.
- `tests/w5ae-wage-90d-matrix.test.mjs`: **13 wirtschaftlich verschiedene Start- und Handlungsregime × 90 simulierte Tage**, inkl. endlicher Käuferetats, freiwilligem Sparen, 99-/100-ISK-Kaufgrenze, 739-/740-ISK-Nachfragegrenze, 869-/870-ISK-Speditions-Arbeitsgrenze, Materialmangel, tatsächlichem Werftbau, privater Warenbevorratung. Deterministisches Doppelreplay, täglicher physischer Güter-/Weltgeld-/Lohn- und vollständiger Core-Audit, Save/Load. Das ist keine autonome Dauerkonsumfunktion; bestellende Akteure werden im Forschungstreiber ausdrücklich beauftragt.
- `.github/workflows/w5ae-integration.yml` führt Gesamt-JavaScript-Regression und die neue Matrix aus; **keine Ergebnisse vor ausgeführter CI als bestanden markieren**.
- Keine neue 193-Browser-UI (Regel191-Hub bleibt separat erhalten). Kein reales iPad-Safari-/NAS-Ergebnis. Keine Wasserware, Eislieferung, vollständige Käuferkette oder dauerhafte W6-Stabilität nachgewiesen. Kein zusätzliches Geld, kein Treibstoff. Keine Löschung oder Migration produktiver Spielstände.

**Nächste kleine Forschung [OPTION]:** Erst echte Wasserwarenherkunft mit vollständig bezahlter Eisförderung, Fracht, Raffinerie und überprüfbar finanzierter Wasserkäufer-Kasse aus dem vorhandenen R32-Material **kontrolliert** in dieselbe Simulationswelt übernehmen. Die Zuordnung realer Pilotenlöhne an individuelle private Eigentümer ist eine gesonderte zu entscheidende Produktregel; der jetzige Pool-/Kollektivkauf ist **nur** ein beschrifteter, begrenzter Test.
