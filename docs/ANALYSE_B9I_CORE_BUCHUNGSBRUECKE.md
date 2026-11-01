# B9i – Core-Buchungsbrücke (nichtproduktive Integrationsprobe)

Stand: 01.11.2026. Basis: `main b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5 / Regel 14 / Schema 8.

**Status [ANALYSE/DRAFT], keine neue Spielregel.** `index.html`, Standard-Referenzen, bestehende Spielstände, UI, Regeln und die globale Geldschöpfung bleiben unverändert. Der Test `tests/b9i-kernbruecke.test.mjs` instrumentiert den tatsächlichen Core **nur im Node-Testprozess**.

## Core-Anschlüsse

| Buchungsweg | Integrationsanforderung |
| --- | --- |
| `m_core_handel.handel` (Spielerhandel, Auto-Handel, Miner-Verkauf, Ankunft, Werft) | Keine Ausgabe reservierter Schiffsfracht; Lieferabschluss muss den bisherigen Markt-/Gebührenweg benutzen, nicht eine zweite Handelsrechnung erzeugen. |
| `m_core_stunde.betriebskosten`, `npcAusgaben`, `fonds`, `dividende`, `m_core_schiffbau.ersatzkauf`, `m_core_sicherheit.piratenErsatz` | Durch wirkliche Auszahlung der Käufer-Treuhand aus `owners[buyer].cash` kann das Geld sonst nicht noch einmal ausgegeben werden. Kosten- und Existenzprüfung auf reale freie Kasse. |
| `m_core_sicherheit.zerstoeren/entfernen` | Schiffsverlust löst genau einmal die Rückzahlung aus; bereits erbeutete Fracht wird ausschließlich durch den Original-Kampf-/Warenpfad bilanziert. |
| `m_core_audit.audit` | Treuhand-ISK ergänzen `sum(owners.cash)`; reservierte Waren liegen weiterhin physisch im Schiff und werden nicht doppelt summiert. |
| `m_core_serialize.save/load`, `m_core_hash.hash` | Vertragsdaten müssen deterministisch serialisiert, beim Laden streng validiert und Altstände explizit weiter unterstützt werden. |

## Im Test durchgeführte Kopplung

1. Käufer zahlt aus realer Core-Kasse in ein einzeln belegtes Vertrags-Escrow, ohne ISK-Erzeugung.
2. Eine einmalige Warenbindung verhindert einen weiteren Verkauf derselben bereits im Schiff befindlichen Menge über den originalen `m_core_handel.handel`.
3. Der Lieferabschluss gibt Escrow nur während der **synchronen** Original-Handelsbuchung frei; bei Ablehnung wird der Zustand zurückgesetzt. Ein geänderter Spotpreis blockiert ausdrücklich, statt still eine andere Zahlung zu akzeptieren.
4. Der originale Piraten-Verlustweg stößt die Stornierung vor dem Entfernen der Schiffshülle an.
5. Geld-/Warenaudit wird unabhängig nachgerechnet; vertragsfreie Simulation wird gegen unveränderten Quellcode auf Seed 7 und 42 jeweils 1.440 Ticks verglichen.

## Klare Grenzen / Integrationsblocker

- **Noch keine Produktintegration:** Die Brücke ist Testinstrumentierung, kein neuer `m_core_`-Produktcode. Zusätzliche Core-Buchungswege sind noch nicht vollständig mit Vertrags-Gates verkabelt.
- Reservierung betrifft hier physisch bereits im Schiff liegende Fracht, **nicht** noch in Stationen lagernde Lieferware, neue Produktion oder noch nicht geförderte Rohstoffe. Stations- und Kapazitätsreservierung separat lösen.
- Der originale `handel` hat aktuell einen Marktpreis, während Verträge einen fest zugesagten Preis benötigen. Preisdrift wird in B9i bewusst abgewiesen; ein echter produktiver Festpreis-Abschluss muss explizit mit der bisherigen Gebühren- und Statistiklogik verbunden werden.
- Das vorhandene `load` prüft zusätzliche Vertragsdaten aktuell nicht. Die Testbrücke hat nur eine unabhängige Prüffunktion; die spätere Produktumsetzung braucht Ladevalidierung, Schema-/Regelstrategie, Migration und Abweisung beschädigter Verpflichtungen.
- `shipActivate` und Modulein-/ausbau ändern Schiffsladung direkt; automatische Entscheidungen, andere Ausgaben, Produktion, Piratenbeute und alle Verlustwege brauchen den vollständigen Buchungspfad-Nachweis. Zwischenzeitliche Warenänderungen dürfen die Frachtbindung nicht unterschreiten.
- Die synthetischen Verträge sind noch **keine** selbstständigen NPC-Konzerne oder geldgedeckten Produktions-/Pilotenaufträge. Wirtschaftlicher Wiederanlauf, 13×90-Tage-/365-Tage-Krisen und echte iPad-/NAS-Abnahme sind **nicht** bewiesen.

**Freigabegrenze:** Nur ein nachweislich vollständig zentralisierter, geladen und auditiert vertragsfester Core kann als gesonderter Produkt-PR vorgeschlagen werden. Kein Merge nach `main` ohne ausdrückliche Freigabe.


## Fortsetzung B9i – zwei getrennte Kern-Gates (01.11.2026)

**[ANALYSE/DRAFT]** Nach dem ersten synthetischen Vertragsversuch enthält
\`tests/b9i-gesamtbuchungen.test.mjs\` eine **weitergehende Instrumentierung der unveränderten Produktquelle**.
Der zweite Testadapter ist eine alternative Architekturprobe und wird bewusst noch **nicht**
mit dem ursprünglichen Adapter vereinheitlicht; alte Tests verifizieren das Verhalten
»Preisabweichung ablehnen«, neue Tests das vorgeschlagene »vereinbarten Preis auch
bei Spotpreisänderung korrekt abrechnen«. Nur das zweite Verhalten erfüllt den
aktuellen B9i-Festpreisauftrag.

**Schritt 1: Reservierungs- und Buchungswege.** Die Käuferkasse verliert beim
Vertragsabschluss sofort den vereinbarten Warenbetrag; die Verkäuferkasse verliert
gleichzeitig die vereinbarte Zielhandelsgebühr. Beide Beträge liegen als echte
Treuhand-Position im Vertragsbuch, sind nicht anderweitig verfügbar und gehören
in die unabhängige Gesamtgeldbilanz. Ware kann entweder (a) bereits im echten
Schiff liegen oder (b) vor Abholung in einer realen Quellstation gebunden werden.
Mit den Test-Hooks werden \`handel\`, \`produktion\`, \`verbrauch\`,
\`aussenhandel\`, \`shipActivate\`, \`shipInstall\` und die
Verlust-/Beutewege auf die freie Menge begrenzt. Die restlichen Geldpfade
(\`betriebskosten\`, \`fonds\`, \`npcAusgaben\`, \`dividende\`,
\`ersatzkauf\`, Piratenersatz) arbeiten ohnehin aus den tatsächlichen
freien \`owners[*].cash\`-Konten; eine Doppelausgabe bereits entnommener
Treuhand ist dort nicht möglich. **Das ist ein Buchungsmodell-Nachweis,
keine vollständige autonome Finanzierungs-/Fahrtkostenregel.**

**Schritt 2: atomarer Festpreisabschluss.** Ein Quelllager-Vertrag muss
zunächst **wirklich bezahlt** über das existierende
\`m_core_handel.handel(...,kauf=true)\` in das Schiff geladen werden;
die Ware bleibt dann als physische Fracht gebunden. Bei der Ankunft
entsperrt der Adapter für genau eine synchrone Core-Handelsbuchung
den festgesetzten Erlös und die bereits gebundene Verkäufergebühr.
Der bestehende Marktweg bucht Eigentümerwechsel, Lagerbewegung,
Statistik und Gebührenempfänger. Änderungen am aktuellen Spotpreis
oder an Dockmodulen ändern **nicht rückwirkend** die beiden
bei Vertragsschluss gebuchten Beträge. Scheitert die Händlerbuchung
(z. B. Kapazitätsüberschreitung), werden alle Treuhandpositionen
zurückgesetzt, ohne Waren zu bewegen; erfolgreicher Abschluss
oder Stornierung sind idempotent. Keine ISK-Minting-Regel, keine
individuelle Konkursgarantie und keine Gratiswaren.

**Tests:** CI-Läufe sind erst bei tatsächlich vollständigem Ende als
bestanden anzuführen. Nachfolgende Änderungen des Testadapters erfordern
einen neuen Lauf; historische CI-Ergebnisse sind kein Nachweis des
geänderten Heads. Der Vergleich ohne aktive Verträge prüft den
originalen 1.440-Tick-Hash für Seed 7/42. Spezifische isolierte
Gates prüfen Station/Verbrauch, Produktion, Außenexport,
Schiffsaktivierung, echte Quellabholung, Gebührenziel, Festpreisdrift,
Abbruch, Schiffsverlust, Save/Load und unabhängige Geld-/Warenbilanz.

**Noch nicht produktreif / Sicherheitsgrenze:**
- \`index.html\` wurde **nicht** verändert; keine Codepfade dieses
  zweiten Testadapters sind beim regulären Spiel aktiv.
- Neue Verträge würden zusätzliche persistente Werte erfordern:
  Die reguläre \`load\`-Funktion validiert die Verträge noch nicht
  vollständig. Die Tests führen eine separate explizite Treuhandprüfung aus.
- Quell- und Zielkapazität, Warenrechte/Stationseigentum, veränderte
  Vertragspartner, Vertragsablaufzeit, Reise-/Arbeitsbudgets, mehrere
  konkurrierende Aufträge und echte 90-/365-Tage-Krisen müssen vor
  einer Produktumsetzung vollständig spezifiziert und getestet werden.
- Der Testadapter nutzt an einer Stelle einen **gezielten
  Systemwechsel im Testsetup**, nicht eine bezahlte echte Frachterreise;
  die Waren- und Geldabwicklung selbst erfolgt im Originalkern.
- Für eine aktivierte Produktregel müssen Spielstandmigration,
  Hash-/Regelreferenzen und iPad-/NAS-Abnahme gesondert erfolgen.
  Keine Integration in \`main\` ohne explizite Freigabe.
