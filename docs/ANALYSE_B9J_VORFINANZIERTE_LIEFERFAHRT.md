# B9j – vorfinanzierte Lieferfahrt mit realer Core-Lohnabrechnung

**Datum:** 01.11.2026 · **[MAIN]** `b4e604d`, v0.12.5, Regel 14, Schema 8.
**[ANALYSE/DRAFT]** Stacked PR #84 auf B9i #83, isolierter Node-Adapter;
`index.html` unverändert. B9i-Schema9-/Regel15-Migration ist nur ein
Simulationsentwurf, **nicht** produktiv.

## Arbeitsfrage

Kann ein normaler Spieler- oder NPC-Frachter eine Warenlieferung aus **vor dem
Abflug wirklich vorhandener Kasse** finanzieren, sodass auch eine spätere
Kassenkrise nicht zur unfinanzierten Lohnzahlung oder doppelter Warenbezahlung
führt – ohne neue ISK, Gratisware oder Sonderwirtschaft?

## Exakte Buchungskette im analytischen Original-Core-Adapter

1. **Prüfung ohne Mutation:** physisch vorhandene Quellware, Schiffsart Frachter,
   freier Schiffszustand, eindeutiger Vertrag, erreichbarer Zielort, gültige
   Käuferkasse, Verkäuferkasse und realer Handelskurs. Ein negativer Gate-Test
   lässt den Zustand inklusive Hash unverändert.
2. **Kaufbereitschaft:** B9i entzieht sofort den vereinbarten Verkaufserlös aus
   der Zielstationskasse und die Zielgebühr aus der Frachterkasse. Dass der
   spätere Marktkurs anders sein kann, verändert den festen Vertragspreis nicht.
3. **Auftragsbudget:** Quellkaufpreis **plus Original-Core-Kaufgebühr** und die
   konservativ vorab kalkulierten Frachterstunden
   `(ceil(Routenminuten/Stundenlaenge)+1)*Betriebskosten/Frachter/Stunde`
   werden **zusätzlich** aus derselben Frachter-Kasse genommen. Die gesamte
   Arbeitsreserve bleibt für den einzelnen Auftrag gesperrt.
4. **Quellkauf:** Die Kaufmittel werden in genau einer synchronen Ausführung
   an die Original-Frachterkasse freigegeben, damit
   `m_core_handel.handel(...,kauf=true)` selbst die reale Waren-, Kassen-
   und Gebührenbuchung übernimmt. Es entstehen keine zusätzlichen Waren.
5. **Echter Flug und Lohn:** Der Frachter nutzt `phase=reise`, die echte
   Route und `m_core_step.advance`. Der Test refaktoriert
   `m_core_stunde.betriebskosten` **ausschließlich in der Instrumentierung**
   in eine unverändert buchende pro-Schiff-Routine. Direkt vor der
   originalen Stundenkostenbuchung werden exakt die tatsächlich berechneten
   Kosten aus der gesperrten Reserve in die Frachterkasse freigegeben.
   Bestehende Fonds-/Senken- und Kostenstatistik bleiben maßgeblich.
6. **Ankunft:** Nach vollständiger Vergütung der bereits aufgelaufenen
   Arbeitsminuten erfolgt die bestehende B9i-Festpreis-/Gebührenbuchung.
   Der nicht genutzte Stundenpuffer geht einmalig zurück an den Frachter.
   Vorzeitige gewöhnliche Stornierung in `phase=reise` ist gesperrt.
7. **Verlust:** Bei einer echten `zerstoeren`-/`entfernen`-Buchung wird
   auch die noch nicht stündlich abgerechnete, bereits geleistete Arbeit
   über den Original-Kostenpfad bezahlt. Erst danach werden unbenutzte
   Budgetreste und das Käufer-Escrow einmalig erstattet. Bereits real
   gekaufte, anschließend verlorene Ware wird **nicht** kostenlos ersetzt.

**Unabhängiger Geldfluss:** Ein zusätzliches, im **Test** als
`owners[budget_ID]` modelliertes gesperrtes Konto erhält nur zuvor aus
wirklichen Owner-Kassen entnommenes Geld. Mit seinem Kontostand zählt
`m_core_audit` die gesamte ISK-Menge korrekt. Die B9i-Käufer-Escrows
werden getrennt mitgezählt. **Dieses Konto ist nur ein Testhilfsmittel,
kein zulässiger zusätzlicher NPC-Konzern und kein produktiver Architektur-
beschluss**. Die endgültige Variante sollte die Kontoführung in eine
explizite zentrale, atomare Core-Buchungsstruktur verlegen und sämtliche
Kapitalflüsse und Eigentümerrechte prüfen.

## Tatsächliche Tests

- [CI #41318057823](https://github.com/tobiasfranziskus/Check/actions/runs/41318057823),
  Stand nach Node-Job: **97/97 Node-Tests**, 0 Fehler:
  67 unveränderte Produkt-Regressionen, 19 B9i-Vertragstests und
  **11 B9j-Prüfungen**.
- Vorabtests: kein Start bei leerer Käufer- oder Verkäuferkasse,
  kein freies Geld nach Kassen-Gate, keine doppelte Schiffbelegung,
  ein Käufer-Escrow auch bei nachfolgend leerer Stationskasse.
- Normalfall: realer Quellkauf, gebundener Lohn, echte
  Minuten-/Stundenkosten mit vorher geleerter frei verfügbarer
  Frachterkasse, erfolgreiche feste Zielzahlung, einmalige Rückgabe.
- Risikofall: Schiffzerstörung nach 23 Minuten – tatsächliche
  Lohnverbuchung vor Restbudgetsrückzahlung; kein erneutes Storno.
- Save/Load: gleiche kanonische Hashes vor und nach realer Reise/Erfüllung,
  falsche Budgetkassen werden separat abgewiesen.
- Rollenunabhängigkeit: ein NPC-Frachter wird in einer gesonderten
  kontrollierten Probe mit **übertragenen Bestands-ISK** kapitalisiert
  und führt dieselbe Buchungskette aus. **Dies ist ausdrücklich kein
  Nachweis für selbst erwirtschaftete NPC-Liquidität**.
- **13 verschiedene Seeds × eine echte finanzierte Lieferfahrt** samt
  Save/Load-Replay und Audits im Original-Core (keine 13×90d).
  Vergleich ohne aktivierte Verträge für Seed 7/42 nach einem
  Spieltag bleibt hashidentisch.

## Ergebnis und offene Architekturgrenzen

**[ANALYSE POSITIV]** Für den untersuchten Weg ist eine vollständige
vorab gedeckte Source-Kauf-/Zielverkauf-/Fahrt-Lohnkette ohne neue ISK
im deterministischen Core *technisch möglich*.

**[NICHT GELÖST]** Die Finanzierung, Rechte, Arbeitseinsatzregelung und
Lieferverträge anderer Pilotenrollen (Miner/Jäger) fehlen noch.
Insbesondere fehlen reale Übernahme/Erneuerung von NPC-Konzernen,
Auftragsakquise, echte systemweite Nachfrage und natürliche Preisfindung,
Stationskaufkraft, Produktionskapital, Leerpositionierung, Vorratslager-/
Zielkapazitätsbindung, Piraten-/Routenrisikobewertung und die
Spieler-Schiffsperspektive.

**[NICHT PRODUKTREIF]** Der Adapter benutzt ein separates technisches
`owners`-Budgetkonto und testweise vom Original ausgelagerte
Stundenlogik; die produktive Architektur darf sich nicht darauf verlassen,
dass ein unbekanntes `owners`-Objekt nie anderweitig als Konzern gilt.
Weiter fehlt eine produktive zentrale Geld-/Warentransaktion einschließlich
validierter Load-/Save- und Regel-15-Migrationen. Derzeit wird die
Vertragserfüllung nach dem Stundenabschluss durch den Test ausgelöst;
kein autonomer NPC-Disponent benutzt den Adapter. Für Reisestörungen,
Umleitung, Überstunden und Änderungsrechte muss das System
deterministisch entweder nachfinanzieren oder kostenpflichtig stoppen –
**niemals kostenfrei weiterarbeiten**.

**[NÄCHSTES GATE / EMPFEHLUNG]** Nach B9j den Vertrag für tatsächliche
NPC-Auftragsakquise und Zahlungsketten zunächst in zwei transparenten
90-Tage-Krisenwelten aktivieren; dann 13×90 und 365 Tage, Geld-/Warenaudit,
Versorgungsleistung, Schiffsersatz und Betriebskostenunterdeckung
**gemeinsam** prüfen. Vor Produktintegration Schema-/Regeländerung,
reale iPad-/NAS-Abnahme und eine ausdrückliche Freigabe.

**Kein Produktcode-Commit, kein Merge, keine Geldmodell-B-Emission.**
