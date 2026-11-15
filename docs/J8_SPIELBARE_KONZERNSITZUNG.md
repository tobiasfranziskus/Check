# J8 – Eine spielbare Regel204-Konzernwelt ohne Anfangsjäger

**[DRAFT · 15. November 2026]** Ausgangs-main: baa1d4773c06658392a54838dbb60e12ea711a1f. Vor der Entwicklung wurden AGENTS.md, ROADMAP.md, PROJEKTSTATUS.md, Core und offene PRs geprüft. Der originale W0–W5-Root-/NAS-Code und sämtliche gespeicherten 195-/204-Spielstände bleiben unverändert.

## Echte Spielhandlung

Der statische Einstieg prototypes/verbund/konzern.html ermöglicht eine eigene Regel204-Konzernsitzung **ohne gekauften Anfangsjäger**:

1. Exportiertes, vorhandenes Regel195-/Schema8-JSON lokal auswählen. J7 prüft sechs Core-Übernahmeschritte. Ungültige oder nicht übertragbare Zustände bleiben gesperrt.
2. **Erst nach eigener zusätzlicher Checkbox-Bestätigung** wird eine getrennte 204-Kopie im Tab erstellt, durch die vorhandenen sechs Core-Konverter auditiert und jeder Zwischenhash gegen J7 verglichen. Die originale 195-Datei bleibt erhalten; niemals heimlich importieren, überschreiben oder migrieren.
3. Die frische Regel195-Welt besitzt **noch keinen eigenen Miner**. Der Spieler kann einen physisch vorhandenen Miner in Aldera nur durch den Original-Core kaufen und real finanzieren. Erst danach ist eigener Eisabbau mit dem vorhandenen Core-Pendelbefehl und dessen originaler Lohn-/Transportökonomie möglich.
4. Außerdem erlaubt die Oberfläche ausschließlich Hausbefehle für originale Schiffsankäufe und – sofern rechtmäßig verfügbar – eigene Nadir-Siliziumaufträge bzw. Verkäufe. Eigentum und Käuferfinanzierung bleiben maßgeblich. Keine Spielerrechte auf st_nadir, transport, npc3 oder werft_extern.
5. Die Originalwelt schreitet um wählbare 1/10/60 Wirtschaftsminuten fort. Befehle und Zeitläufe werden zunächst auf temporären, unabhängig auditierten Core-Kopien erprobt und erst bei Erfolg in den einzigen laufenden Zustand übernommen. Keine zweite Uhr, kein anderer Core, keine kostenlosen Waren oder ISK.
6. Manuell einen eigenen Regel204-JSON-Export erzeugen, später ausdrücklich in einer neuen J8-Sitzung wieder öffnen. Kein Autosave, keine Nutzung alter IndexedDB-Slots, keine Übertragung auf die offene Regel195-Sitzung und keine stille Rückmigration.

**Jägergrenze:** Ein übernommener Regel195-Stand erhält keinen kostenlosen Jäger. Das bereits vorhandene grafische Jägercockpit benötigt weiterhin einen echten 900-ISK-Kaufbeleg. Nach rechtmäßiger Jägerproduktion/Kauf kann ein exportierter Regel204-Stand im vorhandenen Raumcockpit separat geladen werden; ein durchgehender nahtloser Cockpitwechsel aus J8 ist noch nicht Teil dieses Schritts.

## Dateien und Tests

- prototypes/verbund/konzern-session.js: freiwillige Übernahme/fortgesetzter Import, auditiertes Geld/RNG/Schiffseigentum, genau ein Zustand, begrenzte eigene Haus-Befehle.
- prototypes/verbund/konzern.html und konzern-ui.js: statische Touch-Ansicht mit Datei-/Zustimmungsdialog, Flotte, Kassen, Stationswaren, Angeboten, Zeitlauf und manuellem Export.
- tests/j8-konzern-ohne-jaeger.test.mjs: echte Finanzierung vor Eispendel, vollständiger Save-/Hash-/Weltgeldnachweis, Wiederholung, Manipulation, fremde Aufträge verweigert.
- tests/j8-konzern-browser.cjs: Chromium/WebKit mit drei Touchgrößen; echte Dateiauswahl, ausdrückliche Kopie, finanzierter Miner, Kern-Pendel, Zeitlauf, JSON-Export und unabhängiger Import; manipulierte Geldwerte abgelehnt.

## Grenzen und Integration

Die Core-Wirtschaft hat unveränderte Regeln. Ein erfolgreiches bezahltes Pendel ist kein W6-Nachhaltigkeitsbeweis. Für echte alte Spielstände mit bestehenden Industrie-/Frachtverträgen kann die originale 199→200-K7-Übernahme korrekt blockieren; nicht verdecken. Ein fremder Werft-Neubau kann nicht durch den Spieler einseitig angeordnet werden. Keine neue Finanzierungs-, Geldemissions- oder NPC-Rettungsregel.

**Prüfstatus:** Node22-Gesamt, Core-Geld-/Waren-/Eigentums-/Save-/Determinismus-/Negativtests und Browser/WebKit auf dem **letzten PR-Head** erst nach tatsächlichem CI-Ergebnis dokumentieren. Bei fehlerhaften Testerwartungen das reale Core-Verhalten untersuchen, statt Regeln zu ändern. Bei positivem Endgate und gesichertem Ausgangs-main kann die bestehende Integrationsfreigabe genutzt werden. Echte iPad-Safari- und NAS-Geräteabnahme offen. Kein produktiver Save wird migriert.