# W5r – echte Verschleißarbeit, finanzierte Ersatzhüllen und Wasserwerkswartung

**[DRAFT/ANALYSE] 05.11.2026 · Regel32 / Save-Schema8**, gestapelt auf [W5q PR #197](https://github.com/tobiasfranziskus/Check/pull/197). Kein Merge, keine Produktregel-Freigabe, keine neue Regel für die ISK-Emission. Aktueller `main b4e604d6` bleibt Regel14/Schema8.

## Belegte Architektur

W5r ist **kein zusätzlicher Simulationskern**. `W5R_RULES` erweitert die eine deterministische Core-Uhr von W5q und behält alle bisherigen Ledger-, Waren-, Eigentümer-, Handels-, Produktions-, Fracht-, Save- und Auditprüfungen. Alle Zahlen sind **reine Forschungsannahmen**, keine festgelegten zukünftigen Reparaturpreise oder Hüllenlebensdauern.

| Forschungsparameter | Vereinfachte W5r-Regel |
| --- | --- |
| Miner-Lebensdauer | 600 **wirklich bezahlte Eisförderminuten** |
| Frachter-Lebensdauer | 2.400 **wirklich bezahlte Hin-/Rückflugminuten** (20 vollständige Frachtrunden zu 120 Minuten) |
| Wasserwerks-Service | Nach je 200 **wirklich bezahlten Produktionsminuten** (= zehn Wasserchargen) |
| Wasserwerks-Serviceauftrag | 2 **physisch aus Nadir-Lager verbrauchtes, zuvor bezahltes Eis** und **20 ISK vorab vollständig finanzierte Arbeit**, verteilt auf 20 echte Core-Minuten |
| Miner-Ersatzkauf | Durch denselben validierten `shipBuy` aus echtem Aldera-Werftlager für 600 ISK, nur bei ausreichender Eigentümerkasse und verfügbarem Schiff |
| Frachter-Ersatzkauf | Derselbe `shipBuy` für 750 ISK, **nur wenn ein echter Frachter in Aldera verfügbar ist** |
| Neue ISK | Im Standard **0**, die W5q-Export-Emissionsmatrix bleibt separat und ausdrücklich nur hypothetisch |

### Modellierung der Ausmusterung

- Nach der tatsächlichen Lebensdauer wird die benutzte Hülle dauerhaft mit `w5rRetired=true` außer Dienst gestellt und im `w5r.retired`-Beleg unter ID, Eigentümer, Typ, Tick und bezahlter Minutenanzahl archiviert. Sie bleibt als **nicht betriebsfähiges physisches Schrottobjekt** im Schiffsbestand sichtbar, weil die historischen `W5m`-Schiffs- und Arbeitssummen nicht heimlich gelöscht werden dürfen. **Schrottverwertung, Rückkauf und Materialgewinnung sind noch nicht implementiert und werden nicht als Gewinn gerechnet.**
- Ein ausgemusterter Miner darf nicht weiter abbauen. Er kann allenfalls noch **wirklich vorhandene Eisfracht** per gültigem, bezahltem `shipSellIce` an einen zahlungsfähigen Lagerkäufer abgeben; ein unbezahltes oder nicht lagerbares Stück wird nicht transferiert.
- Der Ersatz wird frühestens nach Ausmusterung und höchstens einmal je Core-Stunde aus dem **bestehenden, unveränderten** `shipBuy`-Befehl gekauft; Schiffspreis und Werfteinnahmen werden im existierenden Core verbucht, inklusive physischer Entfernung eines Komplettschiffs aus `st_aldera.lager`, `ledger[klasse].consumed` und neuer Schiffs-ID. Kein kostenloses Schiff und kein Zweitbuchungskern.
- Bleibt der Käufer ohne Kapital oder das Lager ohne Hülle, ist der Ersatz **gesperrt**. Der alte Frachter kann nicht weiter Eis transportieren; der Zähler `replacementFailedFreighter` beobachtet die Dauer der gescheiterten Beschaffung. Die autonome W5o-Disposition ignoriert ausgemusterte Schiffe, ebenso der ältere W2-Erz-Neustartplaner.
- Vollständige NPC-Gewinnausschüttungen werden in R32 bereits um **konservativ aus realisierten Verkaufsmengen errechnete Hüllen- und Wartungsreserven** reduziert, ohne eine separate neue Geldquelle zu erzeugen. Das ist eine **Forschungspolitik für NPCs**, keine Pflicht für Spieler und keine beschlossene allgemeine Dividendenregel.

### Wartungsbuch

- Bei Fälligkeit stoppt das Wasserwerk weitere `stationWater`-Aufträge, bis echte Wartung bezahlt und ausgeführt wurde. Kein automatischer Leistungsbonus ohne Einsatz.
- Der Core prüft vor Beginn 2 vorhandene Eis und 20 ISK Stationskasse; nimmt Eis real aus Nadir und verbucht `ledger.eis.consumed += 2`.
- Die Station sperrt 20 eigene ISK in `w5r_service_escrow`. **Jede** der 20 Minuten bewegt exakt 1 ISK vom Escrow zu den zivilen Arbeitshaushalten. Diese 20 ISK werden nicht neu emittiert und helfen nur aufgrund tatsächlich geleisteter Arbeit bei Nachfrage. Cash und Waren stimmen in jedem Zwischenzustand mit `w5n`, `w5o`, `w5q` und dem unabhängigen W5r-Audit überein.
- Ohne genügend Eis oder Geld entsteht nur ein **blockierter Servicebedarf**, keine Reparatur. Im laufenden Seed42-Ergebnis waren die ausgeführten Wartungen alle regulär gedeckt. Ein echter Dauerbetrieb nach Produktionsausfall ist **nicht** dadurch bewiesen.

## Direkt gemessene Vergleichsergebnisse

**Seed 42; 365 Tage; dieselbe physische Wasser-Erz-Silizium-Welt, keine neuen ISK (außer der ausdrücklich gekennzeichneten W5q-Testvariante):**

| Szenario | Wasser wirklich gekauft | Bezahlte Miner-Ersatzhüllen | Ausgemusterte Frachter | Wartungsaufträge abgeschlossen | Endgeldmenge |
| --- | ---: | ---: | ---: | ---: | ---: |
| NPCs führen Einkommen zurück, Export OFF | **980** | **2 × 600 ISK** | **1** | 9 | 33.000 ISK |
| NPC-Miner spart, Export OFF | 675 | 1 × 600 ISK | 0 | 7 | 33.000 ISK |
| Spieler besitzt Miner und spart, Export OFF | 574 | 1 × 600 ISK | 0 | 6 | 33.000 ISK |
| Voller NPC-Rückfluss, W5q-Testexport **max. 7.000 ISK** an Haushalt | 812 | 2 × 600 ISK | 1 | 9 | **35.352 ISK** (tatsächlich nur 2.352 neu erzeugt) |

Die vollständige NPC-Rückflusswelt besitzt nach 90 und 365 Tagen **2.000 ISK Transportkonzernkapital**, aber **0 verkäufliche Frachter in Aldera**. Der alte Frachter wurde nach exakt 2.400 real bezahlten Flugminuten ausgemustert; ohne neuen Schiffbau bzw. bezahlte Überführung **keine einzige weitere 50er-Eislieferung**. Die interne Versorgung stagniert nach 980 bezahlten Wasser. Die **zwei Miner-Ersatzhüllen wurden nicht neu gebaut**, sondern ausschließlich aus dem nachweislich vorhandenen Startlager für je 600 ISK gekauft; ein *dauerhaft wiederauffüllbares* Miner-Werftangebot ist noch nicht belegt. Zwei Hüllen sind danach verbraucht, das Aldera-Minerlager **0**.

**Wichtig:** Keine stationären Zuflüsse garantieren physische Lieferfähigkeit. Der 7.000-ISK-Testdeckel wird mangels physischer Exporte gar nicht ausgeschöpft: Die Welt emittiert tatsächlich **2.352 ISK** und bleibt trotz 4.302 ISK Haushaltskasse ohne Eisfrachtversorgung. Kein Bedarfs-Nachschuss und keine kostenlose Frachterhülle.

### Deterministische Kern-Hashes · 365 Tage Seed42

- NPC voller Rückfluss, ohne Emission: `801f5c83ffdc525b`.
- NPC-Miner spart, ohne Emission: `ebd1011d0eeabb29`.
- Spieler-Miner spart, ohne Emission: `b8950a2102767135`.
- Voller NPC-Rückfluss + exportbelegte hypothetische 7.000-ISK-Maximalregel (tatsächlich 2.352 emittiert): `74e53495a2d884df`.

## Qualitätsprüfungen und Grenzen

**[DIREKT AUSGEFÜHRT]**
- **8/8 neue W5r-Core-Tests** unmittelbar auf dem tatsächlichen Repository-JavaScript erfolgreich: R32-Isolation gegen R30/R31, echte Arbeitsminuten und Hülleneigentümer, Wartungs-Treuhand nach zehn physischen Chargen (mit Zwischenaudit nach 10/20 Arbeitsminuten), real bezahlte Miner-Ersatzkäufe, gesperrter Frachterkauf bei 0 Lagerhüllen, Spieler-Sparfreiheit, abgeschlossene real exportbelegte W5q-Testbudgets, gefälschte Buchungen/Schiffsalter/Warenmengen/Reserven abgelehnt.
- **13 feste Seeds ×90 Tage** mit täglichem unabhängigen Gesamtgeld-/Waren-Audit, identischem Doppel-Replay und Save/Load Tag30/60/90 ausgeführt und bestanden.
- **4 Szenarien ×365 Tage** mit täglichen Audits, Save/Load Tag30/60/90/180/365 und identischen reproduzierten Referenz-Hashes ausgeführt und bestanden.
- **Nicht aus diesem Bericht ableitbar:** Gesamte Node-CI erst nach tatsächlichem Abschluss als grün melden. Echte iPad-Safari-/NAS-Abnahme nicht ausgeführt. Ein realer Schrott-/Hull-Recyclingmarkt, dauerhaft bezahlter Frachterneubau in Aldera, bezahlte Nadir→Aldera-Hüllenüberführung und volle Anlagenabschreibung sind noch nicht implementiert. Dieser Research-Zweig ist keine abgeschlossene Komplettwirtschaft.

## Nächstes Gate [OPTION / W5s]

Aus R32 folgt ein kleiner, physischer nächster Integrationsschritt: Einen **real bezahlten Frachterneubau** aus vorhandenen Rohstoffen/Material/Arbeitslohn im bereits vorhandenen `W5`-Werftkern nachweisen, **dann** eine vorfinanzierte Überführung/Flottenübernahme in Aldera oder eine tatsächliche zulässige Quelle im sicheren Aldera-Markt, mit klarer Wareneigentums- und Schiffszuteilung. Erst wenn diese Ersatzkette bei freier Sparentscheidung und ohne Sonderemission wiederholt arbeitet, hat ein dauerhafter globaler Geldmodell-B-Deckel produktwirtschaftliche Aussagekraft.

*Keine eigenmächtige Merge-, Deployment-, Balancing- oder Emissionsfreigabe.*
