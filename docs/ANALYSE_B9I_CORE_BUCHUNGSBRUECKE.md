# B9i – vereinheitlichte Vertragsbuchhaltung und Save-Gate (Analyse)

**Stand:** 01.11.2026. **[MAIN]** `b4e604d`, v0.12.5 / Regel 14 / Schema 8.
**[ANALYSE/DRAFT]** PR #83, rein testbasierter Kandidat; **keine produktive Vertragsfunktion**.

## 1. Herkunft und Entscheidung der technischen Variante

B9i begann mit einer instrumentierten Core-Brücke (`b9i-kernbruecke.test.mjs`):
bei verändertem Spotpreis wurde die Erfüllung verweigert. Der zweite Ansatz
(`b9i-gesamtbuchungen.test.mjs`) rechnete zum **vereinbarten** Preis und mit
bereits gebundener Gebühr ab, auch wenn sich der Spotpreis oder ein Dockmodul
seit Vertragsabschluss geändert hat. Nach bestandener CI sind diese beiden
konkurrierenden Testmodelle **in genau einen Kandidaten** überführt:

- **Einzige aktuelle Testquelle:** `tests/b9i-vertragskern.test.mjs`
- Historische Vorversuche sind über die Git-Commits von PR #83 rekonstruierbar;
  die zwei zuvor divergierenden Testdateien wurden auf dem Draft-Branch entfernt.
- Das neue Modell ist ein **Architekturtest, kein Freigabebeschluss** für einen
  verbindlichen Preis, neue Börsen-/Endnachfrageregeln oder Vertragsgarantien.

## 2. Die testweise durch den echten Core gerouteten Buchungen

Ein Vertrag reserviert (a) **Wert** aus der Käuferkasse, (b) die **Gebühr**
aus der Verkäuferkasse und (c) konkrete physisch vorhandene Ware in Schiff
oder Quellstation. Geld wird von den realen `owners[*].cash` abgezogen;
es bleibt im dedizierten Treuhandfeld und muss im Geld-Audit mitgezählt werden.
Quellware wird beim Abholen wirklich mit der originalen
`m_core_handel.handel(...,kauf=true)`-Funktion bezahlt und ins Schiff geladen.
Bei der Lieferung wird innerhalb einer synchronen Transaktion **einmal**
über die bestehende Handelsfunktion verkauft; die dortige Statistik,
Warenbuchung, Gebührenempfänger und Käufer-/Verkäuferkasse bleiben erhalten.
Abschluss oder Storno können kein zweites Mal zahlen.

Die im **Node-Testlauf** temporär instrumentierten Core-Gates berücksichtigen
gebundene Mengen bei `handel`, `produktion`, `verbrauch`,
`aussenhandel`, `shipActivate` und `shipInstall`; die
Schiffsverlust-Funktion storniert vor dem Löschen der Hülle.
Andere Ausgaben können die vorab aus den Kassen entfernte Treuhand nicht
mehr ausgeben. Eine Änderung von Preis und Dockgebühr ändert die zugesagten
Beträge nicht. Ein ungedeckter Zielverkauf (z. B. Kapazitätsmangel) ändert
weder die Vertragssumme noch die Fracht.

**Unabhängige Invarianten:** `sum(owners.cash)+sum(offene Escrowwerte)
=initialSupply+minted-burned`; physische Bestände in Lagern und Schiffen
entsprechen für jede Ware dem originalen `ledger`. Bei stillgelegtem
Vertragsadapter bleiben die Originalzustände/Hashes erhalten.

## 3. Save-/Load- und Migrationsstrategie: ausdrücklich simuliert

Für ein **zukünftiges Produktkonzept** werden zwei Versionsschritte
vorgeschlagen, ohne diese in `index.html` zu ändern:

- **Schema 8 → 9:** neues `vertrag={next:1,eintraege:{}}` als persistente
  Buchhaltung. Bestehende Bestände, Schiffe, Kassen, RNG, Befehlswarteschlange
  und Hash-Inhalte werden sonst unverändert weitergegeben.
- **Regel 14 → 15:** kennzeichnet die neue Vertragstransaktion und die damit
  geänderte Frei-Mengen-/Gebührenpolitik. Die alten unterstützten
  11→12→13→14-Migrationen bleiben erhalten.
- Der Kandidaten-Loader nutzt die vorhandene `m_core_serialize.load` mit
  explizit ergänzten Migrationsfunktionen. **Nach** deren Abarbeitung wird
  das Vertragsbuch streng geprüft, **bevor** der geladene Zustand angenommen
  wird: IDs/Counter, Status, positive Ganzzahlmengen, Preis/Gebühr, bezahlte
  Escrowwerte, existierender Schiff-/Verkäufer-/Käuferbezug,
  überreservierte Lager/Fracht, nichtnegative Kassen und unabhängige
  Gesamtsumme. Zukunftsschema/-regeln und Vertragsdaten in alten
  Schema-8-Dateien werden abgelehnt.
- Ein Vertragszustand wird durch `canonical` verlustfrei wieder geladen,
  auditierbar fortgesetzt und liefert identische Hashes bei identischen
  Befehlsfolgen.

**Wichtig:** Der echte Produkt-Loader auf `main` kennt Schema 9/Regel 15
noch **nicht**. Weder alte Nutzerdaten noch Browser-IndexedDB wurden
angetastet. Die aktuelle Regel 14 und das echte Saveformat bleiben erhalten.

## 4. Testnachweis und Grenzen

Der finale Kandidat enthält 19 neue Node-Tests. Die ursprünglichen 67
Produktregressionen bleiben unverändert. Die GitHub-Action prüft außerdem
die historischen Regelversionen und die 13×90-Tage-Referenzwirtschaft
**des unmodifizierten Produkts**; dies darf nicht als neue Vertragssimulation
gezählt werden. Für genaue Testzahl und erfolgreichen Gesamtworkflow ist der
zuletzt abgeschlossene CI-Run des Heads von PR #83 maßgeblich.

**Offene Blocker vor einer Produktimplementierung:**

1. Gebühren und Festpreise sind prototypisch an *Lieferung* gebunden, aber
   der Quellwarenkauf wird erst bei Abholung bezahlt. Dafür besteht noch
   **keine vorab reservierte Einkaufs-/Fahrt-/Arbeitskasse**. Das Pilotbudget
   aus B8o muss separat und ohne Doppelausgabe integriert werden.
2. Das Vertragsmodell benötigt Rechte- und Eigentumsprüfung, Lieferfrist,
   Untergangs-/Rücktrittsregeln, volle Ziel-Lagerkapazitätsbindung und
   Regelung bei Quell-/Ziel-Eigentümerwechsel. Ein synchroner Core-Fehler
   muss transaktional ohne Teilbuchung enden, nicht nur ein `false`-Rückgabewert.
3. Für produktive Verträge müssen alle **direkten** Warenmutationen und
   Ereignisse einschließlich Piratenbeute, Produktion und Module in einer
   einzelnen zentralen Buchungsschicht abgesichert werden. Synthetische
   Zustandsmanipulationen in Tests sind keine echte Reise-/Wirtschaftswelt.
4. Die produktive Migrationskette benötigt Schema9-/Regel15-Quellcode,
   Absicherung von beschädigten und inkompatiblen Daten, neue Referenz-Hashes
   mit unabhängiger Begründung sowie Browser-AutoSave/Import-Abnahme.
5. Es fehlen 13×90 Tage und 365 Tage **mit tatsächlich aktiven Verträgen**,
   einschließlich Spielerkreisen, Konzerninsolvenzen, Versorgung, Geldverteilung,
   Schiffverlusten und Betriebskosten. Ebenso fehlen reale iPad-/NAS-Tests.
6. **Keine neue Geldmodell-B-Emission**, keine kostenlose Sonderversorgung,
   kein Spieler-Sparlimit und keine individuelle Insolvenzrettung beschlossen.

**[EMPFEHLUNG]** Nächster kleiner Schritt: verbindliches Vertrags-/Auftrags-
Budgetmodell für Quellkauf, Reise und Arbeit als gemeinsame atomare
Finanzierungsregel definieren und in getrennten Tests gegen Gegenfinanzierung,
Insolvenz, Piratenverlust und Save/Load beweisen; erst dann produktiven
Regel-15-/Schema-9-PR zur ausdrücklichen Entscheidung vorlegen.
