# Aphros Void – Jagdökonomie-Audit (v0.11.0)

Datum: **2026-10-29**  
Basis: `main/index.html`, Blob-SHA `7ff91a2611c01d7a1d8cddaccee1010c529ca22a`  
Status: **Simulationsprüfung; kein Balancing-Patch, keine Safari-/iPad-Tests**

## Kurzfazit

Ein einzelner Spieler-Jäger im System **Dravos** erzielt unter den ursprünglichen Regeln über 30 Spieltage und drei Seeds durchschnittlich **ca. +90 ISK netto je Spieltag**. Im Vergleich erreicht ein bereits vorhandener Erz-Miner in Aldera **ca. +1.242 ISK netto je Spieltag**. Faktor 3 steigert den Jagdgewinn in Dravos auf **ca. +640 ISK/Tag**, Faktor 4 auf **ca. +1.191 ISK/Tag**. Diese Vergleiche gelten **ohne Anschaffungskosten** und bei ausreichend finanziertem Spieler-Jäger.

**Vorläufige Empfehlung:** Spieler-Kopfgeldfaktor **3** als erste kleine Balancing-Änderung prüfen. **Noch keine Implementierung freigeben**, bevor die Spielstart-/Anschaffungskosten und die gewünschte Rolle der Jagd geklärt sind.

## Codebefund

| Regel / Modul | v0.11.0 | Fundstelle (Zeile) |
|---|---|---|
| Spieler-Kopfgeldfaktor | `economy.kopfgeldFaktor = 2` | 520 |
| Kopfgeld klein / mittel / groß | 120 / 180 / 240 ISK vor Faktor | 520 |
| Allgemeine Jägerkosten | `world.betriebskosten.jaeger = 50` | 545 |
| Patrouillenchance | `world.patrouilleChance = 600` von 1000 | 549 |
| Jagdarbeit nur bei vorhandenem Piraten | `m_core_ankunft.reise` | 1025–1037 |
| Stündliche Kosten, Eigentümer-/Fondsbuchung | `m_core_stunde.betriebskosten` | 1262–1280 |
| Kopfgeld-/Minting-Pfad | `m_core_sicherheit.patrouille` | 1434–1470 |
| Eskorten-/Überfallkopfgeld | `m_core_sicherheit.ueberfall` | 1481–1510 |
| Piratenersatz nur bei gedeckter Piratenkasse | `m_core_sicherheit.piratenErsatz` | 1528–1538 |
| Schrittfolge, stündlicher Zyklus | `m_core_step.step` | 1617–1638 |

Die 60-%-Patrouillenchance beschreibt eine **Kampfprüfung pro Stunde**, keine 60-%-Auslastung. Die Spieler-Jagdkosten fallen bei `dock` ohne geeignete Piraten nicht an; angefangene Arbeitszeit wird stündlich abgerechnet. Betriebskosten fließen je nach Besitzer in Fonds oder werden vernichtet. Insbesondere kann die globale Senkung von `jaeger`-Kosten die Sicherheitsökonomie und damit indirekt die Spielwelt beeinflussen.

## Messaufbau und Grenzen

**Ausgeführter Test:** JavaScript-Kern von `m_data_systeme` bis unmittelbar vor `m_ui_dirty` aus der echten `index.html` isoliert in einer JavaScript-Laufzeit ausgewertet. Direkte Verwendung von `m_core_state.createState`, `m_core_state.neuesSchiff` und `m_core_step.step`; **kein Ersatz für die eigentliche Simulation**. Es wurden keine `index.html`-Dateien geändert.

- Seeds: **42, 1234, 98765**, je **43.200 Ticks = 30 Spieltage** (1.440 Ticks pro Tag).
- Weltzustand: regulärer Spielstart inkl. NPC-, Sicherheits- und Piratenflotten.
- Jäger-Szenarien: ein **zusätzlicher**, per `neuesSchiff` erzeugter Spieler-Jäger in **Dravos** mit Auftrag `jagd`; kein Kauf, kein Reiseweg, keine Rüst-/Anschaffungskosten.
- Spieler-Kasse für Hauptvergleich auf **100.000 ISK** gesetzt und `initialSupply` um 98.000 erhöht, um zahlungsbedingte Auftragsabbrüche und eine verfälschte Geldbilanz zu vermeiden.
- Miner-Vergleich: bereits vorhandenen Spieler-Miner in Aldera auf `foerdern`/`erz` gesetzt; Startkasse unverändert (2.000 ISK).
- Betriebsgewinn: `state.stats.konto.house.erloes - state.stats.konto.house.kosten`. Er ist **nicht** automatisch nur Kopfgeld bei zusätzlichen Spieleraufträgen; die Hauptversuche enthalten aber außer Jagd bzw. Bergbau keine weiteren aktiven Spieleraufträge.
- Alle Szenarien nutzen die vollständige Weltökonomie mit NPCs. Hauptläufe prüfen die Geldbilanz `sum(owners.cash) = initialSupply + minted - burned`.
- Regelvarianten: separate veränderliche Kopie der eingefrorenen `RULES`; keine Änderung an Spielständen oder GitHub-Dateien.
- **Keine Ausführung in iPad Safari**, kein Performance-/Touch-/Speichertest. Eine Statistik über nur drei Seeds ist eine erste Stichprobe, keine belastbare Risikoverteilung.

## Jagd-Baseline: Faktor 2, Jägerkosten 50

### Ein Jäger in Dravos, 30 Spieltage

| Seed | Spielererlöse | Spielerkosten | Netto | Jäger am Ende |
|---|---:|---:|---:|---|
| 42 | 31.200 | 30.750 | **+450** | ja |
| 1234 | 34.320 | 29.850 | **+4.470** | ja |
| 98765 | 33.600 | 30.450 | **+3.150** | ja |
| **Ø / Tag** | **1.101** | **1.012** | **+90** | — |

### Ein Jäger in Cyris, 30 Spieltage

| Seed | Spielererlöse | Spielerkosten | Netto | Jäger am Ende |
|---|---:|---:|---:|---|
| 42 | 27.720 | 25.550 | **+2.170** | ja |
| 1234 | 22.680 | 24.650 | **−1.970** | ja |
| 98765 | 26.640 | 23.000 | **+3.640** | ja |
| **Ø / Tag** | **856** | **813** | **+43** | — |

**Gefährlicher Sektor:** In gesonderten **3-Tage-Tests** wurde jeweils ein einzelner Spieler-Jäger in Meridian bei allen drei Seeds zerstört; Erlöse jeweils 0 ISK, während noch Kosten entstanden. Daraus ist **keine** allgemeine Verlustwahrscheinlichkeit ableitbar.

## Dravos-Szenarien: 30 Tage, drei Seeds

Der Durchschnitt bezieht sich auf den kumulierten 30-Tage-Wert, geteilt durch 30 und die drei Seeds. Auf ganze ISK/Tag gerundet.

| Szenario | Kopfgeldfaktor | Jägerkosten / Stunde | Ø Erlös / Tag | Ø Kosten / Tag | **Ø Netto / Tag** |
|---|---:|---:|---:|---:|---:|
| **Baseline** | 2 | 50 | 1.101 | 1.012 | **+90** |
| Spielerprämie erhöht | 3 | 50 | 1.652 | 1.012 | **+640** |
| Spielerprämie stärker erhöht | 4 | 50 | 2.203 | 1.012 | **+1.191** |
| Globale Jägerkosten gesenkt | 2 | 40 | 1.131 | 833 | **+298** |
| Globale Jägerkosten halbiert | 2 | 25 | 1.053 | 482 | **+571** |

**Wichtig:** Die Kostenvarianten ändern die Jägerkosten **auch für Sicherheitskräfte**. Dadurch verändern sich der Weltverlauf und die Zufallszahlenabfolge. Der Effekt ist nicht einfach der eingesparte Kostensatz bei unveränderter Welt. Die Varianten mit Kopfgeldfaktor 3 und 4 änderten in diesen Versuchen die Spielerprämie, nicht die Kämpfe.

### Detailresultate: 30-Tage-Netto, Dravos

| Seed | F2/K50 | F3/K50 | F4/K50 | F2/K40 | F2/K25 |
|---|---:|---:|---:|---:|---:|
| 42 | 450 | 16.050 | 31.650 | 10.160 | 17.535 |
| 1234 | 4.470 | 21.630 | 38.790 | 8.960 | 19.610 |
| 98765 | 3.150 | 19.950 | 36.750 | 7.720 | 14.255 |

## Vergleich mit Bergbau

Der reguläre Spieler-Miner in Aldera wurde 30 Tage auf Erzförderung gestellt. Betriebsergebnis: **+36.676**, **+36.718** und **+38.353 ISK** je Seed, Durchschnitt **ca. +1.242 ISK/Tag**. Dabei lief die übrige Weltökonomie regulär weiter. Ein strategischer Vergleich muss noch Zeit bis zum Kauf, Schiffspreise, Reisezeiten, Gefahren und Kapitalbindung einrechnen.

## Finanzierungsrisiko bei realer Startkasse

Kontrolltest mit nur **2.000 ISK Spieler-Startkasse**, **kostenlos zusätzlich erzeugtem** Jäger in Dravos, sonst Baseline:

| Seed | Netto nach 30 Tagen | Spieler-Jagdauftrag gestoppt? |
|---|---:|---|
| 42 | −2.000 ISK | ja, bei Tick 6.060, wegen Geldmangel |
| 1234 | +4.470 ISK | nein |
| 98765 | +3.150 ISK | nein |

Bei Faktor 3 stoppte der Jagdauftrag in denselben drei Seeds nicht. Diese Kontrolle zeigt: Die **Liquidität** ist neben dem durchschnittlichen Gewinn eine separate Balancefrage. Ein tatsächlicher Kauf des Jägers wurde auch hier **nicht** durchgeführt.

## Geldmengen- und Nebenwirkungsprüfung

- Kopfgeld an den Spieler wird mit `state.minted` erfasst, erhöht also die Geldmenge.
- Jägerkosten für den Spieler werden nach dem vorhandenen Code grundsätzlich an einen regionalen Fonds überwiesen, nicht pauschal vernichtet.
- Jägerkosten für die Sicherheitsorganisation können über `senkeBesitzer` als `burned` aus dem Kreislauf entfernt werden.
- Beispiel Dravos / Seed 42 / 30 Tage: Baseline `minted=167400`, `burned=139904`; Faktor 3 `minted=183000`, `burned=139904`; Faktor 4 `minted=198600`, `burned=139904`. **Dies sind weltweite Werte**, nicht ausschließlich Spielerjagd.
- Beispiel derselbe Seed, globale Jägerkosten 25: `minted=158940`, `burned=90000`; die veränderte Sicherheitsökonomie und der Weltverlauf machen diese Variante weniger gezielt.
- Bei allen oben dokumentierten Dravos-Hauptläufen war die geprüfte Geldbilanzabweichung **0 ISK**. Das beweist nur diese Invariante in diesen Läufen, nicht allgemeine Fehlerfreiheit.
- Piratenersatz hängt von der Piratenkasse ab. Die Ersatzfunktion wurde mit unterschiedlichen Kontoständen ausgeführt; eine **allgemeine** Jagd-Obergrenze lässt sich daraus noch nicht ableiten.

## Entscheidungsvorlage

1. **Nicht** pauschal `world.betriebskosten.jaeger` senken; dies verändert die NPC-Sicherheitsökonomie.
2. **Nicht** sofort Faktor 4 wählen; die dadurch neu geschöpften ISK steigen stark und die Jagd erreicht fast Bergbaurendite, noch ohne Beschaffungskosten.
3. **Faktor 3** ist die vorläufig bevorzugte, lokalere Änderung: Spieler-Jagd in Dravos liegt dann bei rund **+640 ISK/Tag** und bleibt hinter Erzabbau zurück.
4. Vor Implementierung kleinere Prüfung realer Spielerökonomie, Jägeranschaffung und relevanter weiterer Sektoren. Die aktuelle Stichprobe erlaubt **keine** endgültige Aussage zur optimalen Balance.
5. Bei tatsächlicher Regeländerung Versions-/Regelmigrationskonzept und Spielstandkompatibilität prüfen, reproduzierbaren Regressionstest vorsehen und erst nach Freigabe nach `main` übernehmen.

## Reproduzierbarkeit (Testkonzept)

In einer externen JavaScript-Laufzeit den Bereich von `const m_data_systeme =` bis vor `const m_ui_dirty =` aus der **unveränderten** `index.html` laden. Die Moduldeklarationen gemeinsam in einem Lexical Scope evaluieren und daraus `m_data_rules.RULES`, `m_core_state.createState`, `m_core_state.neuesSchiff` und `m_core_step.step` verwenden. Für Regelvarianten `JSON.parse(JSON.stringify(RULES))` verwenden und dort `rules.economy.kopfgeldFaktor` bzw. `rules.world.betriebskosten.jaeger` ändern.

Für die Hauptläufe:
```js
const rules = JSON.parse(JSON.stringify(RULES));
rules.economy.kopfgeldFaktor = 2;   // alternativ 3 oder 4
rules.world.betriebskosten.jaeger = 50; // alternativ 40 oder 25
const state = createState(seed, rules);
state.owners.house.cash += 98000;
state.initialSupply += 98000;
const hunter = neuesSchiff(state, {
  owner: 'house', klasse: 'jaeger', system: 'dravos',
  heimat: 'dravos', auftrag: 'jagd', ware: null,
});
for (let i = 0; i < 43200; i++) step(state, rules);
const netto = state.stats.konto.house.erloes - state.stats.konto.house.kosten;
```

**Nachvollziehbarkeit:** Dies ist ein dokumentierter Auszug der ausgeführten Vorgehensweise, noch kein im Repository eingechecktes ausführbares Testskript. Das Projekt selbst erhält keine neue Runtime-Abhängigkeit.
