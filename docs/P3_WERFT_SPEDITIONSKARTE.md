# P3 – Spielbare Speditionsakte der gekauften W5-Hülle

**[DRAFT / 18.11.2026]** Auf [MAIN #495](https://github.com/tobiasfranziskus/Check/pull/495), keine Änderung am originalen Weltkern, der Regel204/207-Speicherung oder an Preisen/Emission/NPC-Nachfrage.

Kapitel 06 zeigt ausschließlich für eine belegte, im W5-Kern fertiggestellte und vom Spieler tatsächlich erworbene Frachterhülle die Anzahl abgeschlossener F4-Originalverträge, original verbuchte Frachtgebühren, originale Fracht-Pilotenkosten und den vorhandenen Schiffsrestbuchwert. Der Betrag **Tarif minus Fracht-Pilotenlohn** ist *vor Wertverzehr und allen anderen Kosten*, niemals Unternehmungsgewinn oder Ersatzfinanzierungsnachweis.

Ein Touchbutton startet die nächste F4 nur, wenn die originale J8-Angebotsprüfung inklusive Save-/Wirtschafts-/Eigentumsaudit `ok` liefert. Der Klick prüft frisch und führt nur `auftrag('freight-'+id)` über den autoritativen Kern aus. Wenn Eis, Frachterdock, NPC-Vertragskapazität oder fremdes Käuferbudget fehlen, bleibt der Button gesperrt, mit Originalgrund. Bestehende 2D-Cockpit-, Werftkauf-, Überführungs- und Karrierewege bleiben erhalten.

**[ABNAHME OFFEN]** Vollständige GitHub-CI (Node22, bestehende Produktions-/Save-Audits), Chromium und WebKit je vier Touchgrößen mit realem 750-ISK-Kauf → 60-ISK-Überführung → 600-ISK-Miner → bezahltem Eis → 120-Minuten-F4-Rundfahrt → Save/2D-Flug. Echte iPad-Safari-/NAS-Geräteabnahme offen; kein Merge/Pages-Deploy bevor alle verpflichtenden Gates grün sind. [Forschungs-PR #496](https://github.com/tobiasfranziskus/Check/pull/496) bleibt isoliert.
