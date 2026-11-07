# W5s-w – Nachfragefenster und Kapitaldeckung einer unabhängigen Spedition

**[DRAFT/ANALYSE · 07.11.2026]** Gestapelt auf [W5s-v #226](https://github.com/tobiasfranziskus/Check/pull/226). Die separate R32-Forschungswelt bleibt optional und benutzt den einen bestehenden Wirtschaftskern. **Keine Produktregeländerung, kein automatischer Ersatzkauf, keine Emission, kein Merge/Deployment.** [MAIN] `5a56d9d7`, GitHub Pages, Altarchiv, Schema 8 und bestehende Spielstände bleiben unberührt.

## Neue tatsächlich implementierte Beobachtung

`m_core_index.w5sNachfolgeMarkt(state,rules)` ist **rein lesend**, prüft nur den autoritativen Zustand und liefert eingefrorene Daten. Die Diagnose steht zusätzlich als `w5sFinanzStatus(...).successorMarket` bereit und verändert weder Tick noch Befehlsqueue, Geld, Waren, Besitz oder Hash.

- Für jede neue Eisfracht: tatsächliche Stationskasse (Kauf/Fracht), Wasserhaushaltsgeld, vorhandene 50 Eis am Quelllager, versorgungsbedingte Nachfrage, freie gemeinsame Treuhand und eigene Pilotenreserve; konkrete Ursachenstatus statt fiktiver Aufträge.
- Für einen vollständigen neuen Frachter: eigene liquide Firmenkasse gegenüber **750 ISK realer Hülle + 60 ISK bezahlter Überführung + 120 ISK Flugarbeitsreserve = 930 ISK** und tatsächlicher physischer freier W5-Werftbestand samt Produktionsbuch. Ein kaufbereiter Befund ist **noch keine Kaufberechtigung**.
- Zeit bis zum realen 30-Tage-Verschleiß, abgeschlossene Fahrten, tatsächlicher Frachtumsatz, bezahlte Pilotenarbeit sowie rein arithmetische Lücke und zusätzliche notwendige Fahrten. Keine Preise oder Nachfragegrenzen geändert.

## Wirtschaftliche Zielgröße und Interpretation

Je abgeschlossene W5n-Fahrt erhält die unabhängige Spedition tatsächlich **240 ISK Frachtentgelt** und zahlt **120 ISK Pilotenlohn**; das sind **120 ISK Deckungsbeitrag vor Kapitalkosten**. Vom ursprünglichen 930-ISK-Eigenkapital bleiben nach 750 ISK Schiffskauf und 60 ISK Überführung **120 ISK frei**. Unter unveränderten Regeln wären **mindestens sieben vollständig bezahlte Frachtabschlüsse** erforderlich, um vor Verlust wieder 930 ISK liquide zu besitzen (120 + 7 × 120 = 960 ISK). Das ist **keine Rentabilitätsgarantie** und ersetzt weder Werftproduktion noch weitere Unternehmenslasten.

Im bisherigen autoritativen Verlauf beider Seeds 42/7 ist nur eine bezahlte Fahrt nachgewiesen: **240 ISK Kasse, 690 ISK Eigenkapitallücke, keine freie fertige Ersatzhülle**. Daher meldet die neue Diagnose korrekt **sechs weitere benötigte Frachtabschlüsse**, die wegen fehlenden Nachfragefenstern und inzwischen realem Verschleiß nicht stattfinden. Der Nachfolger kann wirtschaftlich scheitern; eine Gratisrettung ist ausgeschlossen.

Ein späterer Schritt kann aus dieser beobachtbaren Finanzierungslage einen rechtmäßig gesonderten Folgeersatzvertrag mit vollständigem Mehrgenerationen-Audit entwickeln. Die bestehende Einzelhüllenbuchführung darf dafür nicht durch bloßes Austauschen einer Schiffs-ID umgangen werden.

## Prüfgates

Neue gezielte Tests unter `tests/w5s-w-markt-und-ersatz.test.mjs` und eigener Node-22-Workflow `.github/workflows/w5s-w-nachfolge.yml`:

- Seed 42 und 7 jeweils **echte W4-/W5-Produktion, 930-ISK-Gründung, 750-ISK-Kauf, 35 Tage** mit stündlichen Marktstatus-Snapshots, täglichen Geld-/Waren-/Eigentümeraudits und Save/Load.
- Unveränderte Seeds im direkten Doppellauf, keine Mutation durch Diagnose, ausdrücklich verweigerter unterfinanzierter Ersatzkauf; kein erfundener Werftbestand.
- Ohne gegründete Spedition und mit ausgeschaltetem Opt-in bleibt das Beobachtungsmodul inaktiv.
- Workflow führt die bestehenden **W5s-v-Spezialtests** gemeinsam mit W5s-w aus. Zusätzliche historische 13×90d und Seed42/7×365d sind bereits im übernommenen W5s-v-Test enthalten.

**CI-Ergebnis erst nach tatsächlichem GitHub-Lauf als bestanden melden.** Reale iPad-Safari-/NAS-Abnahme steht weiter aus.

## Bestätigte GitHub-Ausführung auf unverändertem Code

**[TEST · Node 22] [CI #42346487718](https://github.com/tobiasfranziskus/Check/actions/runs/42346487718), Commit `4a6dc8f`: 10/10 Testgruppen bestanden, 0 Fehler** (3 neue W5s-w-Fälle einschließlich Doppellauf plus 7 bestehende W5s-v-Fälle). Die anschließenden Branch-Commits aktualisieren ausschließlich diese Dokumentation, Roadmap und Projektstatus; eine gesonderte letzte Gesamt-CI auf dem jüngsten Dokumentations-Head ist davon zu unterscheiden.

In beiden realen Seed-42/7-Szenarien sind innerhalb der 35 Tage **834 von 840 Stundensnapshots über dem Versorgungsziel**, zwölf mit belegter gemeinsamer Fracht-Treuhand und **null** nach Stundenabschluss noch freie, vollständig finanzierte neue Marktfenster zu beobachten. Letzteres bedeutet nicht, dass überhaupt keine gültige Fracht stattgefunden hat: Der einmalige Auftrag war beim Snapshot bereits in Arbeit. Beiderseits eine bezahlte Fahrt, 240 ISK Restkasse, 690 ISK Ersatzlücke, keine verfügbare zusätzliche W5-Werfthülle, keine Geldemission. Doppelläufe reproduzieren Seed42 Hash `6a15b8cdc26a25df` und Seed7 Hash `bb4fe1ac37f711cf` für diese 35-Tage-Forschungswelt.
