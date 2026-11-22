# M4 – Manager-UX-Audit für junge Erwachsene (22.11.2026)

**Status:** [ANALYSE + DRAFT-UI], kein neuer interaktiver 60-Minuten-Test, keine iPad-/NAS-Abnahme. Zielgruppe: junge Erwachsene ab ca. 18 Jahren, vor allem Strategie-, Wirtschaftssimulations- und Weltraumfans. Einschätzungen sind Designurteile, keine gemessenen Testergebnisse.

## Evidenz

- Sichtprüfung der bestehenden Chromium-Screenshots [Desktop](m4-s1/spielfeld-1180.jpg) und [Mobil](m4-s1/spielfeld-390.jpg), jeweils S1-Stand vom 21.11.2026.
- Aktuelle UI-Quellen: `prototypes/spiel/index.html`, `spiel.css`, `spiel.js`, `p3-manager-karte.js`, `p3-manager-disposition.js`, `p3-auftragsfeedback.js`.
- Kurz-Blindtest vom 22.11.2026 (Nutzerbericht): 4:36 Minuten reale Zeit, acht original bezahlte Eis-Rundfrachten, Standardwelt bis Tag 2 + 910 Minuten; **nicht** 60 Minuten Echtzeit. Reale Browserbefunde stammen aus diesem Bericht, nicht aus diesem Audit.

## Heuristische UX-Wertung

| Kriterium | 1–10 | Begründung |
| --- | ---: | --- |
| Textdichte/Lesbarkeit | 4 | Wiederholte technische Belegtexte, lange Bedingungen/Disclaimer und mehr als ein Auftragsweg konkurrieren um Aufmerksamkeit. |
| Übersichtlichkeit | 6 | Prominent geführter erster Auftrag und Statusleiste; Wirtschaftszentrale, Sektorkarte, vier Tabs und seitliche Kapitel erschweren die visuelle Priorisierung. |
| Touch-Bedienung | 6 | Touchziele mit mindestens 48 px und responsive Raster; auf kleinen Viewports viel vertikales Scrollen zwischen Ziel, Karte und aktiven Firmenaktionen. Keine physische iPad-Abnahme. |
| Grafikattraktivität | 5 | Schlüssige dunkle Weltraumfarben, klare Typografie und optische Konsistenz. Karte ist schematisch, Schiffe sind hauptsächlich beschriftete Kästen und eine tatsächliche Warenbewegung ist visuell nur begrenzt erlebbar. |

**Stärken:** Klarer Einstieg mit kaufbarem Miner/Frachter, starke Kontrastfarben und klares erstes Erfolgserlebnis; der reale Liquiditätsengpass erzeugt bereits eine Spielerentscheidung. **Hauptrisiko:** gut instrumentierter Simulator statt ansprechender Managementspiel-Schleife.

## Prioritäten (kein zweiter Produkt-Roadmap-Ersatz)

1. **P1 · Sitzungsklarheit:** Slotwechsel-/Feedback-Fehler aus dem realen Blindtest über PR #558 nach vollständiger GitHub-CI in `main e63325f5` übernommen; Pages-Deploy und Geräteprüfung separat nachweisen.
2. **P1 · Ereignisführung:** Nächste reale Lieferung, Verkaufssperre oder Vertragsphase nennen; gezielte Zeitfortschrittsoption erst nach deterministischer Prüfung. Keine Ereignisse, Zeitpunkte oder Verkäufe erfinden.
3. **P1 · Informationsarchitektur:** Auftragsentscheidung und Status sichtbar lassen, komplette Fracht-/Buchungslisten bei Bedarf aufklappbar machen; unnötige Core-Begriffe entfernen. Dieses Arbeitspaket.
4. **P2 · Kontextuelle Engpässe:** Käuferkasse, erforderliche Summe und tatsächliche Wahlmöglichkeiten direkt an die betroffene Auftragskarte binden, ohne neue Wirtschaftsbefehle.
5. **P2 · Zweiter Geschäftsweg:** Sichtbares erreichbares Ziel jenseits des Eispendels auf Basis bereits vorhandener legaler Material-, Bau- oder Frachterangebote – keine Gratisnachfrage/Gratisaufträge.
6. **P2 · Grafische Welt:** Schiffstypen und Stationen unterscheidbar gestalten, bestehende echte Transitphasen in der Karte animierbar sichtbar machen, mit reduzierter Bewegung und guten Kontrasten. Keine Änderungen an Eigentums-/Simulationsregeln.

## In diesem UX-Draft umgesetzt

- Auftragsmeldung und kleine Weltzeitaktion bleiben direkt sichtbar; vollständige Originalbelege in einer semantischen `details/summary`-Ansicht. Alle Belege bleiben DOM-lesbar und verändern die Welt nicht.
- Im Jägerreiter werden optionale Cockpit-/Duell-Erklärungen nachrangig als Aufklapphilfe geführt, statt die Managementinformation einzuleiten.
- Zwei technische Langhinweise im sichtbaren Auftragsteil gekürzt; keine Geld-, Waren-, Vertrags-, Seed-/RNG-, Save- oder Kernänderung.
- Browser-Regression prüft Standardzustand der Disclosure und dass ihr Öffnen den gespeicherten Weltzustand nicht ändert.

## Offene Nachweise

Vollständige Node22-Regression, Chromium und WebKit in vier Touchgrößen, echte Grafik-/Geräteabnahme, eventuelle Review-Rückmeldungen und die ausstehende 60-Minuten-Blindprüfung erst nach tatsächlicher Ausführung schließen. Das abgeschlossene 4:36-Minuten-Spiel ist kein Langzeit-Spaßnachweis. Integrations-/Pages-Status separat nach CI prüfen.
