# Aphros Void – iPad-Querformat und kompakte Schiffsmenüs

Datum: 2026-10-29  
Ausgangsversion: `main/index.html`, v0.11.1, Blob `d148bc837af5be124e9bc831e0da555c17954cf9`  
Status: UI-Änderung auf separatem Entwicklungsbranch; `main` bleibt unverändert.

## Anlass und bestätigter Ausgangszustand

Der Nutzer hat bestätigt, dass der letzte Spielstart-Hotfix auf dem iPad funktioniert, aber die Menüs zu viel vertikales Scrollen erfordern. Zusätzlich wurde Querformat als bevorzugte iPad-Nutzung angegeben.

Vor der Änderung:
- Hauptansichten mit `max-width: 560px`, Schiffs-/Stationsblätter mit `max-width: 600px`.
- Halbhohes Blatt `height: 50vh`; im Querformat besonders wenig Inhaltshöhe.
- Alle Reise- und Handelsbuttons direkt unter Schiffsinformationen, in einer einzigen langen Befehlsliste.
- Volle Bildschirmbreite im iPad-Querformat blieb überwiegend ungenutzt.

## Gezielte Änderung

1. Nur bei `(min-width: 900px) and (orientation: landscape)` werden Hauptansichten bis maximal 1100px breit. HQ, Flotte und Reich nutzen zwei Spalten; Preise im Markt werden in zwei Spalten dargestellt.
2. Schiffs-, Stations- und Warenblätter werden in breitem Querformat ebenfalls zweispaltig. Halbhohe Blätter erhalten dort 82dvh, volle Blätter 94dvh (mit vh-Fallback).
3. Reise- und Handelsbefehle sind in nativen HTML-`<details>`-Elementen zusammengefasst und standardmäßig eingeklappt; beim Jäger zusätzlich Eskorten. Sofortaktionen (Warten, Fördern, Auto-Handel, Jagd, Aktivieren/Einbauen) bleiben direkt erreichbar.
4. Wenn der laufende Simulations-Tick das Schiffsblatt neu zeichnet, bleibt der vom Spieler gewählte Offen-/Geschlossen-Zustand der Gruppen erhalten. Beim Wechsel auf ein anderes Schiff beginnen dessen Gruppen geschlossen.
5. Nativer `<summary>` hat mindestens 48px Höhe. Bestehende `button`-Touchflächen bleiben erhalten; keine Frameworks, externen Laufzeitabhängigkeiten oder neuen Spielzustandsfelder.
6. Portrait-/schmale Ansichten behalten ihre bisherige Hauptstruktur; nur die eingeklappten Schiffsmenü-Gruppen gelten für beide Ausrichtungen.

## Tatsächlich ausgeführte Tests

- Vollständiger Inline-JavaScript-Block wurde erfolgreich geparst.
- Flottenliste enthält im Initialzustand Miner `sh001` und Frachter `sh002`.
- Miner-Schiffsblatt enthält weiter direkte Befehle `wait` und `mine`. Reise- und Handelsgruppen werden korrekt erzeugt.
- Im getesteten Meridian/Aldera-Zustand sind **17 Kaufbuttons** und **5 Reisebuttons** nicht mehr unmittelbar in der offenen Liste sichtbar, aber weiterhin vorhanden und erreichbar.
- Ein manuell geöffnetes `Reiseziele`-Element blieb nach einem simulierten Simulationstick und anschließender UI-Neuzeichnung geöffnet; `Handeln` blieb geschlossen.
- Bei Auswahl eines anderen Schiffes wurden die Gruppen wieder geschlossen. Die direkte Aktion `Auto-Handel starten` blieb vorhanden.
- Ereignisdelegation wurde isoliert geprüft: Aufruf `move` ergibt weiterhin `shipMove` mit Ziel, `buy` ergibt `shipTrade` mit Menge und `kauf:true`, `handeln` ergibt `shipHandeln`.
- Der Quellcode aller Kernmodule von `m_data_systeme` bis `m_ui_dirty` wurde mit `main` verglichen und ist **bytegenau identisch**.
- Reale Simulation in isolierter JS-Ausführung: Seeds 42 und 1234, jeweils 4.320 Ticks (drei Spieltage), Waren-/Geldaudit erfolgreich.
- CSS-Media-Query, Rasterdefinition und Mindestgröße der Aufklappzeilen wurden statisch geprüft.

## Grenzen und Risiken

- UI-Test mit kontrollierter, simulierter DOM-Umgebung. **Kein ausgeführter echter iPad-Safari- oder visueller Browser-Screenshot-Test.** Spaltenumbrüche, dynamische Safari-Toolbar und Lesbarkeit müssen am iPad im Hoch- und Querformat geprüft werden.
- iPad mit geteilter Ansicht oder schmaler Fensterbreite unter 900 CSS-Pixel bleibt im schmalen Layout.
- Verdeckte Reise-/Handelsgruppen benötigen einen zusätzlichen Tip, sparen dafür lange Scrollwege. Dieser Kompromiss sollte im realen Bedienungstest bewertet werden.
- Offener PR #6 (Handelsgebühren in Buttons) bearbeitet angrenzenden Code der Schiffsbefehle. Die PRs **nicht unbesehen hintereinander mergen**, sondern den zweiten PR nach dem ersten gezielt aktualisieren und auf Konflikte prüfen.
- Kein Umbau von Handelslogik, Routen, Kampfsystem, Seed oder Speicherstand.
- Sichtbare statische Versionsbeschriftung wird auf ausdrücklichen Wunsch unverändert gelassen.

## Manuelle iPad-Abnahme

1. Im Querformat HQ und Flotte öffnen: zwei Spalten, keine horizontalen Überläufe.
2. Schiff antippen: links Details, rechts Befehle; `Reiseziele` und `Handeln` aufklappen.
3. Simulation auf `1×` und `20×` starten: offene Befehlsgruppe muss geöffnet bleiben.
4. Reise- und Kaufbefehl ausführen; danach Schiffwechsel und Rückwechsel prüfen.
5. iPad drehen: Hochformat weiterhin lesbar und bedienbar, Schiffsblatt im Hochformat mit normalen Scroll- und Touchgesten.
6. Station und Markt im Querformat prüfen; beim Markt längere Handelsbuttons und ggf. Umbruch testen.
