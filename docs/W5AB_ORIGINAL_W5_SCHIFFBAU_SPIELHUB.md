# W5ab – bezahlter W5-Materialabsatz, Frachterbau und eigener Schiffskauf in einem Spielhub

> **[DRAFT / INTEGRATION / TEST · 09.11.2026]** Auf [W5aa #271](https://github.com/tobiasfranziskus/Check/pull/271) gestapelter Forschungsstand. Die aktuelle **einzige verbindliche** Roadmap ist `main/docs/ROADMAP.md`; [Docs-Abgleich #272](https://github.com/tobiasfranziskus/Check/pull/272) separat, kein Merge. Produkt-Hauptspiel `index.html` bleibt **Regel14/Schema8**. W5ab ist **Regel19/Schema8**. Keine automatische Save-Migration, kein Deployment und keine Geldemission.

## Original-W5-Core – keine erfundenen Rechnungen oder Lagerbestände

Exakt die **141.030 UTF-16-Zeichen** der DATA/CORE-Sektion aus [Original-Forschungs-PR #170](https://github.com/tobiasfranziskus/Check/pull/170), fixiert auf `c6dea414bd909dfd34c078f908da71a4d7978f4d`, wurden **inhaltlich unverändert** als `prototypes/w5ab/original-w5-core.js` übernommen. Eine einzige Original-Instanz führt Miner, Gesellschaften, Fracht, Raffinerie, Materialkauf, Werftarbeit und Frachterverkauf. *Kein eigener W5-UI-Ticker und keine neue Preisformel.*

Der Einstieg **`prototypes/w5ab/index.html`** erweitert den gemeinsamen statischen W5aa-Hub (HQ, Station, Flotte, NPC-Konzerne, 2D-Miner, W3-Originalfracht, W4-Raffinerie) um einen eigenen W5-Reiter. Zwei separat durch den Original-Core geprüfte Operator-Befehle:
- `yardStart` → original `stationBuildShip` für den Eigentümer `werft_extern` in `st_nadir`. Werft kauft **5 echte Material für 500 ISK** aus eigener Kasse von `st_nadir`; zusätzlich werden **30 ISK** Werftarbeit vor dem ersten Tick vollständig in `w5_arbeit_treuhand` gebunden. Erst **30 bezahlte Minuten** später werden die **5 Material als Werkstoff verbraucht** und eine **wirklich produzierte Frachterhülle** in Nadir gebucht.
- `yardBuy` → original `shipBuy` für Käufer `transport` / Ware `frachter` / Station `st_nadir`. Der Kauf benötigt **750 vorhandene ISK** und eine freie **wirklich gebaute** Hülle. Erst bei erfolgreicher Zahlung wird eine eindeutige Schiff-ID Eigentum der Spedition. Das Schiff steht physisch in **Nadir**; **kein kostenloser Überführungsflug** nach Aldera.

**Wichtig:** Der einmalige ursprüngliche 750-ISK-Frachter in Aldera stammt aus der bestehenden, vorfinanzierten W3-Starterware, nicht aus dem neuen Nadir-W5-Bau. Das W5-Produktschiff wird unabhängig davon hergestellt und einmalig verkauft. Der Original-W5-Pilot belegt noch **keinen vollständigen Ersatzpfad für sämtliche Starterhüllen**.

## Direkter Original-Core-Geld- und Warenbeleg

| Tick (Seed42/7 Original-Cores) | Physische Leistung / Eigentum | Echte Zahlung |
|---:|---|---|
| 50 | Tatsächlicher Erzbestand Aldera, zuvor gekaufter Speditionsfrachter | W3-Frachterkauf 750 ISK aus `transport` |
| 110 | 50 Erz in Nadir angekommen; W3-Rückflug weiter aktiv | Nadir 740 ISK Vertrag, davon 500 Erz und 240 Fracht; Spedition 120 ISK Fluglohn |
| 130 | 10 Erz wirklich raffiniert → 5 Material; 40 Erz verbleiben | Nadir 20 ISK an Raffineriearbeiter |
| 130 | Werftauftrag kauft 5 Material in Nadir; Ware wird verbraucht | **500 ISK** `werft_extern` → `st_nadir` und **30 ISK** Werft-Arbeitstreuhand |
| 160 | Nach 30 Original-Core-Minuten 1 vollständig gefertigte Frachterhülle im Lager Nadir | **30 ISK** an Werftarbeiter tatsächlich ausgezahlt |
| 160 | Separater kaufender Spediteur erhält eindeutig identifizierte Hülle `sh004` in Nadir | **750 ISK** `transport` → `werft_extern` |

Bei Tick160 ist `st_nadir.cash=3.740` ISK; die zusätzliche Käuferliquidität stammt **nachweislich vom Materialverkauf**, nicht aus Minting. Nach dem Frachterkauf bleiben der Spedition **380 ISK** während des noch laufenden ursprünglichen Rückflugs; am Ende des Rückflugs werden noch echte **240 ISK** Frachtlohn an die Spedition ausgezahlt. Nur vollständig gebuchte Löhne/Verträge zählen. Globale 33.000 ISK, `minted=0`.

### Reale zweite Hülle – aber kein kaufkräftiger Abnehmer

Der erste W3-Frachter kehrt wirklich zurück und erledigt einen **zweiten vorfinanzierten 50-Erz-Auftrag**. Nach anschließender zweiter W4-Materialcharge und zweiter vollständig bezahlter W5-Baucharge (Tick340) gibt es eine **zweite physisch fertige Hülle**; bisher nur eine verkauft.

Die Spedition besitzt **740 ISK**, der Preis beträgt **750 ISK**. Der Original-Core lehnt den Kauf **ohne jede Nebenbuchung** ab. Das Schiff bleibt im Nadir-Lager. Damit ist **realer Materialabsatz** bewiesen, aber nicht eine unbegrenzt wiederholbare Endnachfrage. Ein Preissprung, Gratis-ISK oder fremde Konzernkasse dürfen die 10-ISK-Lücke nicht automatisch schließen.

**Direkte historische Input-Kosten, keine Preisfreigabe:** W3 liefert die benötigten 10 Erz für anteilig 148 ISK (100 Erzpreis + 48 Frachtanteil); W4-Lohn 20 ISK → **168 ISK für 5 Material**. Die Werft zahlt **500 ISK Materialverkaufspreis**, zusätzlich 30 ISK Fertigungslöhne, realer historischer Werft-Bauaufwand 530 ISK (ohne Wartung, Verschleiß, Kapital- oder Überführungskosten). Der erste 750-ISK-Verkauf ergibt eine **220-ISK-Differenz vor diesen weiteren Kosten**. Das ist kein gesicherter nachhaltiger Jahresgewinn und keine allgemeine Balance-Regel.

## Tests, Nachweise, Sicherheitsgrenzen

- `tests/w5ab-finanzierter-schiffbau.test.mjs`: Seeds 42/7, exakter Original-Core, vollständig vorfinanzierter W0–W5-Pfad, W3-Rückflug und parallele W4-/W5-Arbeit im **gleichen** Core-Tick; zwei voneinander getrennte Käufer-/Werft-Verträge; `shipId` und Eigentum; zweiter finanzierter Materialkauf mit **740 vs. 750 ISK** und unverändertem Hash bei Kaufverweigerung.
- Geld unabhängig über **alle** Besitzer-/Treuhandkonten aufsummiert, W3/W4/W5-Originalaudit, Ursprung der Materialzahlung, tatsächlich bezahlte Löhne, echte physische Güter und eindeutige Schiff-ID geprüft. Keine zu Unrecht angenommenen unendlichen Käuferkonten; bilanzneutrale Fremdumbuchung und gefälschte Material-, Fracht-, Lohn- oder Schiffsbelege werden durch den unveränderten Core-Audit verworfen. Regel18-/Regel19-Saves nicht austauschbar.
- `tests/w5ab-rule19-90d.test.mjs`: **13 RNG-Seeds × 90 Tage** nach einer echten vollständig bezahlten W0–W5-Kette, täglicher Original-Core-Geld-/Güter-/Lohn-/Schiffs-Audit, Hash-/Save-/Load-Replay. **Nicht 13 wirtschaftlich unterschiedlich finanzierte Krisenfälle** und kein Nachweis langfristig bezahlter Nachfrage.
- `tests/w5ab-touch.py`: vier Chromium-Viewportgrößen (**1180×820, 1024×768, 820×1180, 390×844**) mit tatsächlichem 500-ISK-Materialkauf, 30-ISK-Lohn, physischer Hülle, 750-ISK-Verkauf, 2. Käuferstopp, sicherem Rule19-JSON-Import/Export, Ablehnung gefälschter/Rule18-Saves und Erhalt von bestehendem Browser-Storage.
- `.github/workflows/w5ab-integration.yml` führt Node22 **gesamte JS-Regressionsserie** und Chromium-Touch aus. Ergebnisse nur nach wirklich abgeschlossener CI als grün deklarieren.

## Folgeschritt [OPTION]

Der erste wirklich gekaufte W5-Frachter ist zwar Eigentum der Spedition, befindet sich **in Nadir**. Die direkte Steuerung/Überführung zum Aldera-Auftrag fehlt und verlangt eine eigene echte finanzierte Route inklusive Arbeitsreserve, statt einer automatisch teletransportierten Hülle. Weitere W5-Produkte (MK1-Module, Schiffsklassen, Werkstoffketten, Ersatz-/Wartungswirtschaft) sind nur nach Material-/Käufer-/Lohnaudit seriös anschließbar.

**[OFFEN]** Echte iPad-Safari-/NAS-Abnahme, verlässlicher W5-Folgekäufer über mehrere Regime, 13 ökonomisch verschiedene 90d-Krisenläufe, Betriebskosten/Verschleiß/Überführung. Der Forschungs-Prototyp speichert nicht heimlich in produktiven IndexedDB-/localStorage-Slots; ein Browser-Reload startet eine neue Testwelt. `main`, Pages, Archiv und produktive Saves bleiben unangetastet.
