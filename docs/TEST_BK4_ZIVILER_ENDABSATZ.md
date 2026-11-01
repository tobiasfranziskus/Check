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

**[OFFEN bis zur finalen Gegenrechnung:]** Die zweite,
*teilweise zahlende* Version darf **nicht** mit dem
negativen vollständig verpflichtenden Kauf verwechselt
werden. Insbesondere muss untersucht werden, ob
Fonds→Stationen-Transfers etwaige Stationsauffüllungen
nur zeitlich vorziehen, ob tatsächliche Händlerumsätze
steigen und ob Minderleistungen an anderen Standorten
auftreten.

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
