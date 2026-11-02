# B-K11 – Prüfprotokoll und Wirtschaftsgrenzen

**[DRAFT / ANALYSE · 02.11.2026]** Unabhängiger Kandidat auf main `b4e604d6`, Produkt weiterhin14/8. Architektur, Hilfskonstruktionen und ausstehende Produktentscheidungen: [BK11_WIRTSCHAFTSKERN](BK11_WIRTSCHAFTSKERN.md).

## Reproduzierbare Prüfung

Node.js22.23.4, keine neuen Abhängigkeiten:

```sh
node --test tests/*.test.mjs
node --test --experimental-test-isolation=none tests/*.test.mjs
node tools/bk11-wirtschaft.mjs --suite=standard --out=/tmp/bk11-standard-90.json
node tools/bk11-wirtschaft.mjs --suite=crises --out=/tmp/bk11-crises-90.json
```

Falls die Sandbox Kindprozesse verbietet, zuerst `git show b4e604d6:index.html > /tmp/bk11-main-index.html`, dann `--baseline=/tmp/bk11-main-index.html` übergeben. Das Werkzeug prüft den SHA-256 des vollständigen Original-HTML (`7ee2d3786dece413bcea7152b64ea7ed5218f2ec68c9001c10c0fe7f987e33f5`). `--seed=42 --days=3` ist nur ein kurzer Diagnoselauf; kein Ersatz für die Abnahme.

**Varianten:** `product` = aktueller Default14/8, stündlich bitidentisch gegen Original-main; `candidate` = expliziter Finanzierungskern15/9 ohne neue Lohn-/Konsumannahme; `candidate-no-rescue` = derselbe Kandidat, nur der bestehende individuelle NPC-Leerflottenzuschuss in einer testseitig kompilierten Kopie ausgeschaltet. Kein entsprechender Produkt-Schalter oder Regelwechsel.

**Standardwelt:** die 13 vorhandenen Seeds7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159, jeweils90 Tage, alle drei Varianten, je ein unabhängiger Replay. Originalbestände, NPCs, Produktion, Fonds und Risiken bleiben aktiv.

**Vier aktive Strategien ab Spielstart, je90 Tage und drei Varianten:** Miner/42 fördert mit Startminer Erz und spart; Handel-Flotte/42 zusätzlich Original-Autohandel des Spielerfrachters; Station/1234 kauft die lokale Station erst bei real gedecktem Kaufpreis; Jagd/98765 kauft/aktiviert tatsächlich bezahlte Jäger und schickt sie nach Dravos zur Originaljagd. Nur vorhandene validierte Commands, keine Bestandslöschung oder künstliche Gutschrift. Die Politik ist zwischen Varianten gleich, die tatsächlich finanzierbaren Befehlszeitpunkte können abweichen. Innerhalb jedes Replays ist die Befehlsfolge identisch und wird gespeichert. Das sind neue Startkrisen, keine Replikation historischer B1-Tag90-Snapshots.

**Unabhängige Audits:** freie Konten plus offene Reserven gegen `initialSupply+minted−burned`; jede Warenmenge gegen die sechs Original-Ledgerfelder; alle beobachteten Reservierungen/Zahlungen/Erstattungen gegen offene Verträge und Archiv. Händler-FIFO aus realen Einkaufsbuchungen gegen physische Fracht; realisierter Beitrag gegen Kassenfluss, Lagerkosten, Verlustkosten und aktivierte Assets. Core-Audit zusätzlich. Stundenweise Replay-Hashes, tägliche Save/Load-Fortsetzung beider Welten; keine neuen Frachterreisen ohne Finanzierung.

## Messdefinitionen

- **Deckungsbeitrag:** Verkaufserlös minus Verkaufsgebühr minus FIFO-Einstand verkaufter Waren (einschließlich Kaufgebühr) minus alle bezahlten Frachterflüge, einschließlich Leerflügen. Noch keine volle Konzernrendite oder bezahlte Fabrikkette. Verlorene Frachtkosten werden gesondert abgezogen.
- **Kassenfluss nach Hüllen:** tatsächlich eingegangene Warenzahlungen minus sämtliche Wareneinkäufe/Gebühren/Flüge und tatsächlich bezahlte Ersatzhüllen. Enthält Kapitalbindung; kein Periodengewinn.
- **Kapitalbindung:** unbezahlte Escrow-Reste und reale FIFO-Frachtkosten; separate Spitzen-/Stundenwerte. Keine erfundenen historischen Anfangslagerwerte.
- **Ersatzfähigkeit:** freie Konzernkasse / aktueller Hüllenkaufpreis inklusive Gebühr und tatsächlicher Werftbestand; tatsächliche Ersatzkäufe und bezahlte Preise separat. Keine garantierte Hülle, Reservepolitik oder angenommene Lebensdauer.
- **Versorgung/Gesamtwirtschaft:** wirklicher Nahrungs-/Medizinverbrauch, alle Mangelstunden, Stationskassen, Silizium/Bauteile und Hüllenproduktion, Verluste, gezielte Zuschüsse sowie bestehendes `minted`/`burned`. Bezahlte und fällige Betriebsarbeit für alle Akteure gemeinsam.

## Ausgeführter Stand

Lokale Standardprüfung: **81/81 Einzeltests bestanden, 0 Fehler, 0 übersprungen, 0 TODO** (67 bestehende +14 B-K11). Der vorgeschriebene Aufruf ohne `--experimental-test-isolation=none` meldet unter dieser Sandbox neun erfolgreiche Dateisuiten; der zweite Aufruf weist die Einzeltestzahl aus. Die letzte zusätzliche Ladevalidierung wird vor dem finalen Commit erneut geprüft.

14 B-K11-Gruppen: Defaultabgrenzung, echte25-Minuten-Fahrt mit100 ISK tatsächlicher Zahlung aus105 ISK Reserve, unveränderter Zustand bei Unterfinanzierung, geteilte Stundenrechnung41+58=99, Halten, Originalverlust, gekaufte/angelieferte Nahrung mit zwei bezahlten Flügen, NPC-Abflug und erfolglose Angebote, beschädigte Fahrtverknüpfungen,13 Seed-Replays, realer Werftkauf plus finanzierte Heimatreise, Migration mit laufendem Altflug/Queue, Fremdformat-/Bilanzabwehr und140 wirkliche Flüge mit Summenarchiv. Die Umverteilung vorhandener Anfangskassen im Archiv-Belastungstest ist eine explizite Testhilfe, kein Ertragsnachweis.

Die vollständigen90-Tage-Läufe sind gestartet; Ergebnisse werden nach Abschluss eingetragen. Vorzeitige/abgebrochene Entwicklungsläufe sind keine Abnahme. Eigenes B-K11-CI lädt Rohdaten als Artefakte hoch; historische Referenzjobs sind davon zu unterscheiden.

**Offen:** reale iPad-Safari-/Touch-/Speicher-/NAS-Abnahme, historische275-Tage-B1-Fortsetzungen, voll bezahlte Herstellungs-/Endnachfragekette und wirtschaftlich tragfähiger Ersatz nach real finanziertem Neubau. Keine globale Wirtschaftssanierung oder Freigabe aus grünen technischen Tests ableiten.
