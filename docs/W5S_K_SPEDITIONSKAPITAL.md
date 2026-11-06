# W5s-k – reale Speditionskasse, Erz-/Eisfracht und Wiederbeschaffungs-Gate

**[DRAFT/ANALYSE · 06.11.2026]** Gestapelt auf W5s-j #213, in der separaten R32-Forschungswelt. Keine Änderung an `main`, Regel 14, Schema 8, bestehenden Speicherständen oder der parallelen Legacy-UI-Arbeit #207. Keine Preisänderung, keine neuen ISK, keine Gratisflotte und keine neue Produktionsware.

## Testbare Hypothese

W5s-j belegt einen echten Starterminer-Kauf, zwei neu hergestellte Miner, zwei Frachter und 21 Eisfahrten/1.050 Wasser, aber bei 365 Tagen **0 ISK Speditionskasse**. Eine positive Einzel-Frachtmarge darf nicht mit einem profitablen und eigenständig erneuerbaren Konzern verwechselt werden.

## Umsetzung

Ein neues **rein lesendes** `m_core_index.w5sFinanzStatus(state,rules)` rekonstruiert die tatsächlichen Speditionskonten aus denselben Core-Belegen:

`Anfangs-ISK + W3-Erzfrachtumsatz + W5n-Eisfrachtumsatz − W3-Pilotenarbeit − W5n-Pilotenarbeit − wirklich gekaufte Frachterhüllen − bezahlte W5s-Überführung − tatsächlich ausgeschüttete Dividenden = freie Speditions-ISK + noch gebundene Treuhand-ISK.`

Der Status gibt für genau einen bestehenden R32-Snapshot zusätzlich die konkreten Nachfolgekosten **810 ISK Frachter + Überführung**, die echte Käuferkasse für eine weitere **W3-50-Erz-Fracht** und eine Eisfracht, die physisch gekaufte Erzmenge, getrennte Eis- und Erzaufträge und die derzeitigen validierten W5s-Werft-/Erzgates aus. Keine Auszahlungs- oder Produktionsfunktion und kein zweiter Simulationskern. Eine ungültige Kontorekonstruktion wird als `ok:false` gemeldet.

Die Testmatrix verwendet 13 Seeds × 90 Tage und Seed42/7 ×365 Tage sowie Save/Load, deterministische Doppelreplays und tägliche unabhängige Weltgeld-/Warenprüfungen. Kontrollierte Varianten ändern **nur** die bereits existierenden Forschungsoptionen Vorlauf 2/7/30 Tage, `retainFleetEarnings` und das W5o-Szenario `npcSave`; sie erzeugen keinerlei neue ISK.

**[CI noch nicht ausgewertet]** Ausgeführte Ergebnisse, erste blockierte Folge-Fracht, Firmenvollkosten und zusätzliche Ersatzzyklen nach tatsächlichem Testlauf hier nachtragen. Positive W5s-j-Zahlen sind **keine** W5s-k-Freigabe. Bleibt die Nachfrage unfinanzierbar, ist der Nachweis des Engpasses ein negatives Gate und **kein** Anlass für künstliche Flottenrettung oder spontane Preis-/Emissionsänderung.
