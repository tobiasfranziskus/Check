# B-K4 – Belegter ziviler Warenabsatz aus realen Systemfonds

**01.11.2026 · [PRODUKT/DRAFT] [PR #88](https://github.com/tobiasfranziskus/Check/pull/88)**,
eigenständig auf **[MAIN] `b4e604d` / v0.12.5 / Regel14 / Schema8**.
Kandidat **v0.12.6, Regel15, Schema8** – **nicht gemergt, keine Freigabe**.

## 1. Kleinster realer Produktbaustein

Die bestehenden sechs Stationen verbrauchen Nahrung und Medikamente
bisher im Core ohne einen Endkunden oder Zahlungsbeleg. Der neue,
auf Regel15 begrenzte Produktpfad in `m_core_stunde.verbrauch`
setzt bei der echten Lagerentnahme an:

- Eine tatsächlich vorhandene und tatsächlich konsumierte
  **Nahrung-/Medikamentenmenge** darf bis zum realen Bestand des
  **regionalen Systemfonds** als ziviler Verkauf bezahlt werden.
- Der Käufer zahlt aus seiner existierenden Fonds-Kasse
  `bezahlteMenge × originaler Core-Spotpreis` an die
  **tatsächlich beliefernde Stationskasse**, unabhängig davon,
  ob diese Station einem NPC oder Spieler gehört.
- Dieselbe Zahlung wird über die vorhandene
  `stats.konto[station].erloes` und
  `stats.konto[fonds].kosten` belegbar. **Keine neuen ISK**
  (`state.minted` unverändert), keine neue Warenquelle.
- **Wichtig:** Der physische Altverbrauch bleibt für
  **nicht gedeckte** Waren zunächst unverändert;
  der unbezahlte Rest ist ausdrücklich **kein Umsatzerlös**.
  Für Bauteile und andere industrielle Verbrauchswaren gilt
  weiter die alte Verwendungsregel.
- Kein neuer Owner, kein Haushaltseinkommenskonto,
  keine Feld-/Save-Formatänderung. Bei 14→15 migriert allein
  die Regelversion. Bestehende Save-Kassen/-Schiffe/-Waren
  bleiben bytegleich bis auf die Versionszahl.

**Diese kleine Umverteilung aus vorhandenen Fonds ist noch kein
vollständig zahlender Endkunde.** Der Systemfonds erfüllt bisher
zugleich Aufgaben der Stationsliquidität und ist kein
selbsttragender privater Haushalt. Es gibt noch keinen
realen Rückfluss zu Haushalten aus Löhnen, keine
garantierte Fabrik-/Schiffsersatzreserve und keine
Freigabe zusätzlicher Geldmodell-B-Emissionen.

## 2. Ausdrücklich verworfen: vollständig zahlungspflichtiger Verbrauch

Die erste Variante dieses PR ließ Nahrung und Medizin **nur
bei vollständiger Finanzierung der jeweiligen konsumierten
Menge** verschwinden. Buchhalterisch funktionierte das:
Die direkten originalen Geld-/Warenaudits und 13×90d-Tests
bestanden. **Wirtschaftlich war es klar schlechter:**

| 13 passive Welten über je 90 Tage | Original Regel14 | Striktes Ausgabegate |
| --- | ---: | ---: |
| Gesamte Mangelstunden | 791 | **64.895** |
| NPC1-/NPC2-Frachterverkäufe | 310.058 | **305.266** |
| Zivile Schiffsverluste | 4.622 | **4.916** |

Auch in zwei aktiven 90-Tage-Spielerminerfällen
stieg der Mangel aggregiert **71.791 → 73.778**.
Der Zahlungsausfall sperrte reale Ware im Stationslager,
obwohl kein dauerhaftes Haushaltseinkommen bestand.
Diesen Ansatz **nicht integrieren**. Die Änderungen
wurden wieder auf eine nicht sperrende, nur teilweise
zahlende Endabnahme zurückgebaut. Die Auditprotokolle
und der ursprüngliche Code bleiben als PR-Revisionen
nachvollziehbar; Referenzwerte wurden nicht umetikettiert.

## 3. Gegenwärtiger Prüfumfang der Teilzahlung

`tests/bk4-ziviler-endkauf.test.mjs` deckt ab:
echte Zahlung nach lokaler Preisfunktion, simultaner
Medikamentenkauf, Nichtbezahlung bei Nullkasse,
nachweisbare Teilzahlung bei nur zwei zahlbaren
Nahrungseinheiten trotz drei real verbrauchten,
Bauteile weiterhin nicht als Haushaltskauf,
Spielerstation ohne Garantie, Regel14-Gegenbeleg,
verhinderten Scheinumsatz bei fehlender Ware,
14→15-Load-/Save-Gleichheit, Zukunftsversion-Schutz
und deterministische Original-Core-Fortsetzung.

`tools/bk4-wirtschaft-v15.mjs` prüft **13×90 Tage**
passiv und **2×90 Tage** mit aktivem Spieler-Miner.
Verglichen werden physische Versorgung, NPC-Frachterverkäufe,
Stations-/Fonds-/Händlerkassen, Schiffverluste,
ungedeckte Arbeit, bezahlte Waren und Geld-/Warenaudits
sowie Save-/Load. Historische Regel14-B5b- und
13×90d-Referenzen laufen getrennt aus ihrem gepinnten
Original-main; sie dürfen nicht als Regel15-Ergebnis gelten.

**[BELEGT – zweite, teilweise zahlende Version]**
Die [CI #41326312135](https://github.com/tobiasfranziskus/Check/actions/runs/41326312135)
hat die **76/76 Node-Tests** sowie die **13 × 90 Tage passive
und zwei aktive Spieler-Miner-Welten × 90 Tage**
mit originalem, nicht rationsgesperrtem Verbrauch und
unabhängigen stündlichen/täglichen Geld-/Warenaudits
sowie Save/Load erfolgreich ausgeführt. Die technische
Abnahme ist **nicht** gleich einer wirtschaftlichen Freigabe.

| A/B-Vergleich 90 Tage | Regel 14 | Regel 15 Teilzahlung | Differenz |
| --- | ---: | ---: | ---: |
| **13 passive Welten**, gesamter Mangel | 791 | **756** | −35 |
| 13 passive Welten, Nahrungsmangel | 772 | **743** | −29 |
| 13 passive Welten, NPC1/2-Frachterverkäufe | 310.058 | **311.699** | +1.641 |
| 13 passive Welten, zivile Schiffsverluste | 4.622 | **4.719** | +97 |
| **2 Spieler-Miner-Krisen**, gesamter Mangel | 71.791 | **71.824** | +33 |
| 2 Spieler-Miner-Krisen, NPC-Frachterverkäufe | 3.579 | **3.334** | −245 |
| 2 Spieler-Miner-Krisen, zivile Schiffsverluste | 95 | **87** | −8 |

Die aktiven Fälle divergieren:
**Seed7** Mangel 35.993→36.139, Frachterverkäufe
1.660→1.485; **Seed42** Mangel 35.798→35.685,
Frachterverkäufe 1.919→1.849. Das ist **kein**
konsistenter Wiederanlauf der NPC-Handelswirtschaft.

Die real bezahlten kumulierten Lebensmittel-/Medizinwerte
der **13 passiven Welten zusammen** betragen
**12.953.720 + 17.472.723 = 30.426.443 ISK**;
das ist **mehrfach im Kreis übertragenes,
bereits vorhandenes Geld**, keine Geldschöpfung und
kein Beweis von 30 Mio. neuem Weltvermögen.
Beide aktive Spielerfälle summieren sich auf
82.068 ISK Nahrung + 85.515 ISK Medizin aus
bestehenden Fonds; der verbleibende Verbrauch
ist **weiterhin unbezahlt**.

**[PROJEKTLEITUNGSBEWERTUNG: MIXED / NO MERGE]**
Die technische Buchung ist korrekt und die
passive Versorgung verbessert sich gering,
aber **Schiffsverluste in Normalwelten** und
**Händlerleistung in Krisen** verschlechtern sich.
Eine eigenständige, nachhaltig finanzierte
zivile Kaufkraft ist noch nicht entstanden.
Diese reine Umverteilung **nicht als
abgeschlossenen Endkundenkreislauf verkaufen**.
PR #88 bleibt Draft, kein Merge, bis mindestens
die Mittelherkunft/Haushaltslohn-/Betriebskapital-
Abhängigkeit produktiv belastbar nachgewiesen
und die Krisenverschlechterung beseitigt ist.

## 4. Projektschritt nach B-K4

Nur wenn die nicht sperrende Ausgleichszahlung selbst
keinen nachteiligen Geld-/Warenkreislauf erzeugt,
kann sie als kleines Produktinkrement zur Entscheidung
vorgelegt werden. Andernfalls bleibt PR #88 unintegriert.

**Noch notwendig:** Eine tatsächlich finanzierte
Haushaltskasse (Arbeitsentgelte aus realen Waren-
und Dienstleistungen), ein marktfinanzierter
Waren- und Transportzyklus, ausreichende Mittel
für Betrieb und Schiffsersatz, und gesonderte
Freigabe jeder neuen, begrenzten Geldquelle gemäß
Geldmodell B. Zusätzlicher Bau einer zweiten
Wirtschaft neben `m_core_*` ist nicht vorgesehen.

**Nicht freigegeben:** Spielmechanik-Merge, Deployment,
iPad-/NAS-Abnahme, zusätzliche ISK-Ausgabe und
individuelle Insolvenzhilfe.
