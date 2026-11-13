# K11 – Echter Frachterbedarf, Käuferfinanzierung und unverkaufter Bestand

**[DRAFT / ANALYSE · 13.11.2026]** [PR #326](https://github.com/tobiasfranziskus/Check/pull/326) auf K10 #325. Nur Tests, Dokumentation und CI, kein Wirtschaftskern-/Produkt-/Regel195-/Spielstandseingriff.

## Korrektur der ersten K11-Finanzdiagnose

**[KORREKTUR · Quellprüfung nach dem ersten K11-Lauf]** Der erste K11-Bericht und die ursprüngliche PR-Beschreibung haben **fälschlich `fonds_transport` als Käufer der nächsten 50-Eis-Fracht** behandelt und daraus eine angeblich zweite **490-ISK-Käuferlücke** abgeleitet. Das war **sachlich falsch**. Die tatsächlich verwendete Originalfunktion `m_core_w5n.pruefenFracht` in `prototypes/welt/rule200-k7-industry-core.js` prüft **`s.owners[c.zielStation].cash`**, mit `c.zielStation='st_nadir'`. Die tatsächliche finanzierende Käuferkasse ist also die **Station Nadir**, nicht das separate `c.kunde='fonds_transport'` der älteren Lohn-/Auditkonfiguration. Für die Buchung `frachtStart` wird der Betrag ebenfalls **von `s.owners[c.zielStation]` abgezogen** und dem Original-Kauftreuhandkonto gutgeschrieben.

In K11 hat Nadir **3.440 ISK ohne** und **3.920 ISK mit** Stilllegung nach dem 720-Minuten-Versuch – genug für **490 ISK** Original-Eis-/Frachterrechnung. Der `fonds_transport` liegt zwar bei **0 ISK**, ist aber **nicht die für `pruefenFracht` zuständige Käuferkasse**. Sein Nullbestand beweist *keinen* zweiten Käuferausfall. Der validierte, aktuelle Test berechnet daher `iceBuyerAccount=c.zielStation`, `iceBuyerShortfall=0` und führt `c.kunde` lediglich als getrenntes historisches Lohnfondskonto.

**Der tatsächliche einzelne nachgewiesene Finanzierungsgate ist der 120-ISK-Crewfonds der Spedition**: Bei `transport.cash=46` fehlen **74 ISK**. Diese Korrektur betrifft die Interpretation der Daten, nicht die Geld-/Warenaudits oder den K11-Fortlauf selbst. Originalprotokolle früherer Rot-/Grün-Läufe bleiben als historische Ergebnisse erhalten; die frühere falsche Interpretation gilt ausdrücklich nicht als belegter Befund.

## Original-K10-Ausgangszustand und K11-Tests

`tools/k11-k10-endstand.mjs` erzeugt den tatsächlichen Krisenstand auf Seeds 42/7 bis nach acht finanzierten K7/K8/K9/K10-Industrieverträgen und dem bezahlten physischen W5-Kauf/60-Minuten-Überführung. In `tests/k11-realer-frachterbedarf.test.mjs` werden für beide Seeds zwei Varianten **je 720 Spielminuten** untersucht: (A) Original-Stilllegung aus, `ersatzkauf`/`eisfracht` an; (B) Original-Stilllegung ein, Ersatz-/Eisautomatik an. Ausschließlich zugelassene Originalregeln und echte Haushalts-, Produktions- und Eigentumsvorgänge, keine künstlichen Kassen-/Warenkontenänderungen.

| Gemessener Zustand | Seed 42 | Seed 7 |
| --- | ---: | ---: |
| Tick zu Versuchsbeginn | 24.446 | 24.446 |
| Speditionsfrachter im Eigentum | 18 | 18 |
| Davon 10 mit positivem Originalbuchwert und in Aldera einsatzbereit | 10 | 10 |
| Echte, unverkaufte W5-Lagerhüllen | 2 | 2 |
| Speditionskasse nach 720 Min. | **46 ISK** | **46 ISK** |
| Originale W5n-Flugarbeitsreserve | 120 ISK | 120 ISK |
| Tatsächlicher Crew-Fehlbetrag | **74 ISK** | **74 ISK** |
| Echte Käuferkasse `st_nadir` ohne Stilllegung | **3.440 ISK** | **3.440 ISK** |
| Original-Käuferreserve (250 Warenwert + 240 Fracht) | 490 ISK | 490 ISK |
| Tatsächlicher Käufer-Fehlbetrag | **0 ISK** | **0 ISK** |
| Separater historischer `fonds_transport` | 0 ISK, **nicht Käufer** | 0 ISK, **nicht Käufer** |
| Zusätzlich begonnene W3-/Eisfrachten oder W5-Käufe in beiden Varianten | 0 / 0 | 0 / 0 |
| Weltgeld / Mint / Burn | 33.000 / 0 / 0 ISK | 33.000 / 0 / 0 ISK |

**Variante A, Stilllegung aus:** Nach 720 Minuten sind **52 Eis** in Aldera gelagert (anfangs 2). Das erfüllt die 50er-Warenmenge, und Nadir kann die 490 ISK Käuferrechnung bezahlen; trotzdem lehnt `pilotIceFreightQuote` zurecht ab: **„Spedition kann Flugarbeit nicht vorfinanzieren“**. Kein zusätzlicher Frachterkauf, kein zusätzlicher W3-/Eisauftrag.

**Variante B, Stilllegung ein:** Eislager bleibt bei **2**, wodurch bereits die Warencharge fehlt; auch hier kein neuer W3-/Eisauftrag, kein neuer W5-Kauf. In beiden Varianten sind bereits **10 einsatzfähige Frachter** vorhanden – kein durch weitere Produktion heilbarer Kapazitätsmangel.

## Wirklich ausgeführte Prüfungen und Abgrenzung

- [K11-Start-Workflow #43398418683](https://github.com/tobiasfranziskus/Check/actions/runs/43398418683) – **2/2 gezielte K11-Seedtests erfolgreich**, vier 720-Minuten-Varianten inklusive Audit, Save/Load, Hash-Replay. Die damalige **Käuferinterpretation war irreführend**, nicht die Simulationswerte.
- [K11-Käuferkonten-Messung #43398667338](https://github.com/tobiasfranziskus/Check/actions/runs/43398667338) – 2/2 gezielte Seedtests erfolgreich, die als `iceBuyerAccount` benannte Variable zeigte jedoch noch **die falsche Feldwahl**. Diese Testsemantik wurde explizit korrigiert und wird für eine erneute CI getrennt geprüft.
- Negativbefehle prüfen atomare Ablehnung ungedeckter oder unberechtigter W5-Schiffskäufe; jede tatsächlich ausgeführte Runde prüft W0-Geldsumme, Warenledger, Core-Audit, Crewkosten sowie identische Save/Load-/Replay-Hashes. Änderungen an wirtschaftlichen Regeln oder Ausgangsgeldern waren **nicht nötig**.

## Nächster sinnvolles Gate – K12

**[ANALYSE]** Vor einer neuen W6-Produktregel ist zu prüfen, ob der Spedition **74 ISK in einer bestehenden rechtmäßigen Leistungskette** zufließen können, ohne dass sie die dafür notwendigen 120 ISK Fluglohn bereits selbst vorfinanzieren muss. Ein weiterer Industrie-Erzvertrag benötigt seinerseits voll gedeckte Transportarbeit; einen solchen Kreis darf man **nicht per kostenloser Starthilfe öffnen**. Wasserverkäufe vergüten grundsätzlich Nadir beziehungsweise die liefernde Station, nicht unmittelbar die Spedition; private Pilotenlöhne bleiben Eigentum der Piloten. Ein freiwilliges Firmenkapital-/Vertragsfinanzierungsinstrument ist derzeit **nicht freigegeben** und würde gesonderte Wirtschaftsbeschlüsse, Audits und Folgeprüfungen benötigen.

**[BESCHLOSSEN]** Geldmodell B, Spieler-Sparfreiheit, echte Vollkosten, Insolvenzen und keine stillen Geldtransfers bleiben unverändert. Keine automatische Produktauslieferung, kein Merge, keine iPad-/NAS-Abnahme.
