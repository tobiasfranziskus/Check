# PIR-3b – Reparaturzugang [FORSCHUNG / GATE]

Basis: #610, c557fcf. Der reale F4-Schaden ist bilanziert (48/96), die Rückfahrt endet jedoch in Aldera. Die einzige in diesem Profil gebuchte W5-Materialproduktion und Werftarbeit befindet sich in Nadir. Das bestehende F4 liefert und startet die gebundene Rückfahrt in derselben Wirtschaftsminute; kein freies Nadir-Dockfenster für Reparatur.

## Implementiert
Lesendes `reparaturAngebot(s,{owner,schiff,station})` ausschließlich im Kampfprofil. Prüft Original-Schadensaudit, Eigentümer, Hülle, tatsächlichen Dockort, Werftstandort, Material, Kasse und belegte Werftarbeit. Proportionaler W5-Neubau als vorläufiger Forschungsparameter, auf ganze Einheiten aufgerundet: 48/96 Schaden → 3 Material à 100 ISK + 15 Minuten à 1 ISK = 315 ISK. Keine Produktentscheidung. Jeder shipRepair-Befehl wird explizit abgewiesen; keine Änderungen an Geld, Ware, Zeit oder Hülle. Standardprofile erhalten kein neues Angebots-API.

Gezielter Original-F4-Test prüft reales Dock, lokales und entferntes Angebot, Eigentümer, Parameterfälschung, Schadensfälschung, bytegleiches Save und Replay. CI-Nachweis bei Erstellung offen. Keine lokale Node22-Ausführung.

## Nächste Abhängigkeit
Entweder ein bilanziertes Nadir-Reparaturfenster nach Original-Vertragsabwicklung (einschließlich Änderung des Rückfahrttermins, vollständige Treuhand und Lohnprüfung) oder bezahlter Materialtransport nach Aldera plus echte dortige Arbeitsleistung. Vorzugsweise Nadir, um vorhandene W5-Werft und Arbeitskonto zu verwenden. Kein kostenloser Teleport, keine Änderung der 50-Eis-/250-ISK-/120-Lohn-/240-Tarif-Referenz. W5/W4-Materialaudit muss um einen unabhängig belegten Reparaturverbrauch erweitert werden, nicht gelockert. Erst danach Reserve, Minutenarbeit und chronologisch mit den Schussbelegen auditierte Hüllenwiederherstellung. Kein Merge, kein Deploy während M4-U4.
