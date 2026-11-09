# W5w – Original W1-Bergbau im gemeinsamen Spielhub

**[DRAFT / INTEGRATION · 09.11.2026]** Standalone statischer Einstieg:
`prototypes/w5w/index.html`. Separater PR auf W5v, **ohne Merge, Release,
Pages-, NAS- oder Save-Eingriff**. Kein Framework und keine externe
Laufzeitabhängigkeit. **Regel 15 / Schema 8**, ausdrücklich **nicht Regel 14**
des W5u-Hubs und nicht die Forschungswirtschaft Regel 3314 von C1d-11.

## Neu spielbar

Der **unveränderte bestehende W1-Daten-/Core-Ausschnitt** aus dem bereits
vorliegenden [W1/2D-PR #164](https://github.com/tobiasfranziskus/Check/pull/164),
Commit `6b3884f505099815546940f42c5473ba77be289c`, wird als
`original-w1-core.js` statisch wiederverwendet, **nicht neu programmiert**.
Die exakt 99.770 Zeichen der reinen Data/Core-Sektion haben den SHA-256
`e614aab677beea021ae75b3cde0afc22b7436370b6a9ab34918bd66a74efe2f2`.
Diese Quelle bleibt eine fest angeheftete Variante des **gleichen Original-Core**.
Es laufen nicht zwei Wirtschaftsuhren parallel.

W5w verbindet die bewährten Legacy-Konzern-, Stations- und 2D-Schiffansichten
(HTML/CSS/Vanilla-JS) durch **eine** private W1-Session. Ein echter Spieler-Miner
kann im Original-Core gekauft, zur Erzförderung beauftragt, mit echten
Minutenschritten betrieben und jederzeit angehalten/abgerechnet werden.
Für Spieler und NPC gelten dieselben W1-Finanzierungs-, Waren- und
Eigentumsregeln. Original-W1-Audits prüfen Konto, Waren, W0-Treuhand,
Käuferfinanzierung und Konzern-Vollkosten.

Die neue Bergbaukonsole zeigt den **wirklichen** Zustand:
- freie und gebundene Spieler-/NPC-, Stations-, Export- und Arbeitskonten;
- die konkret existierenden W0-Erzaufträge mit Stationsabnahme- und
  Arbeits-Treuhand pro Schiff;
- tatsächliche Schiffsladung, Fördermenge, Stations- und Hüllenlager;
- bezahlte Miner-Hüllen, Erlöse/Kosten und Gesamtaudit/Hash.

Alle drei Befehle `shipBuy`, `shipMine`, `shipWait` werden **nur durch
`m_core_index.execute` ausgeführt**. Vorabbewertungen laufen auf einer
**abgetrennten validierten Core-Kopie**. Das UI erfindet keine Preise oder
Fördermengen und vergibt kein Geld. Käufer-ISK entstehen nicht beim Verkauf,
sondern nur die bereits vorhandenen 20.000 Export-ISK sind endlich.

## Reproduzierbarer W1-Vertikalschnitt – Seeds 42 und 7

| Echtes Original-W1-Ereignis | Nachgewiesene Zahl |
| --- | ---: |
| Weltgeld zum Start und nach jedem Schritt | **27.000 ISK**, 0 Mint |
| Bereits bezahlter NPC-Erstminer | **600 ISK** |
| Spieler kauft eigenen echten Miner | **600 ISK** |
| Nach 13 Core-Minuten gefördert | **13 Erz Spieler + 13 Erz NPC** |
| Zwei aktiv finanzierte Erzverträge | **2 × 50 Erz** |
| Stationskasse gebunden | **1.000 ISK** |
| Arbeitskapital gebunden | **74 Spieler + 74 NPC ISK** |
| Lohn tatsächlich für 26 Erz/Minuten gezahlt | **52 ISK** |
| Spieler stoppt und liefert 13 Erz | **130 ISK** realer Erlös |
| Ungenutzte Abnahme wird erstattet | **370 ISK** freie Stationskasse |
| Ungenutztes Spieler-Arbeitskapital | **74 ISK** zurück |
| Spielerkasse nach Bezahlung des Miners, Lohn und 13 Erzverkauf | **2.504 ISK** |
| Laufender NPC-Auftrag | bleibt gültig, 500 ISK und 74 ISK gebunden |

**Finanzielles Fazit:** Die 130 ISK Einnahme sind **kein 130-ISK-Gewinn**.
Der Spieler hat 600 ISK für ein werthaltiges Schiff bezahlt und 26 ISK
für tatsächlich geleistete Förderarbeit ausgegeben. W1 meldet kumuliert
`erloese=130`, `kosten=626`, `netto=-496` einschließlich Schiffserwerb.
Das Schiff existiert weiterhin; dieser Cash-Netto-Wert ist **nicht**
ein abschreibungsbereinigter periodischer Unternehmensgewinn.

## Schutz und Grenzen

- **Keine produktiven Save-Slots** gelesen, geschrieben oder gelöscht.
  Kein Autoload/Autosave; Reload startet die neue, isolierte Session. JSON
  explizit exportieren; Import akzeptiert nur originale geprüfte Regel15/
  Schema8-Saves, inklusive W1-Vertrags-/Finanzierungsaudit. Regel14/32/3314
  und manipulierte Konto-/Titel-/Warenfelder werden abgelehnt.
- Der W5t-Legacy-Adapter lässt nun **nach Core-Validierung** zusätzlich
  Schema8/Regel15 lesend projizieren. Er führt nie Wirtschaftsbefehle aus.
  HQ und Station sind weiterhin lesende Oberflächen, während W1-Spielerbefehle
  direkt auf derselben W1-Session arbeiten. Keine Migration fremder Spiele.
- 2D zeigt nur echte eigene Schiff-ID, Core-Auftrag und Original-Frachtmenge.
  Raumpositionen und Raumfahrt sind schematisch und ohne neuen Physikkern.
- **Nicht enthalten:** W2-Konzernautomatik, W3-Rundfracht, W4-Raffinerie,
  W5-Modulproduktion, echte Gewinnprognosen oder C1d-Investitionsberatung.
  Die 20.000 externen Käufer-ISK sind **endlich**; keine ewige Endnachfrage.
- Echte iPad-Safari-/NAS-Abnahme weiter offen; Chromium ist kein Safari.

## Prüfungen

`tests/w5w-funded-w1-hub.test.mjs` prüft Quellidentität, Original-Hashes,
Kauf/Konkurrenz, 13-Minuten-Teillieferung, Abrechnung, Refund,
Vollkosten, anti-manipulierte Saves und Replay. Vier Chromium-Touchgrößen
werden in `tests/w5w-touch.py` einschließlich identischer Welt in HQ,
Station und 2D, JSON Export/Import und Produkt-Slot-Sentinel geprüft.
`w5w-integration.yml` führt Node22 und Chromium aus. Ergebnisse **erst nach
tatsächlich abgeschlossener CI** als bestanden melden.

Weiterer sinnvoller Schritt: begrenzte und bezahlte W2-Investitions-/Kaufentscheidungen
aus dem existierenden Original-Core übertragen, dann W3-Fracht – ohne zwei
gleichzeitige Produktionskerne. `main`, Roadmap-Entscheidungen und Pages
bleiben bis zur Freigabe unverändert.
