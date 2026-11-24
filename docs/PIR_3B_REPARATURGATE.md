# PIR-3b – Reparaturzugang [FORSCHUNG / GATE]

Basis: #610, c557fcf. Der reale F4-Schaden ist bilanziert (48/96), die Rückfahrt endet jedoch in Aldera. Die einzige in diesem Profil gebuchte W5-Materialproduktion und Werftarbeit befindet sich in Nadir. Das bestehende F4 liefert und startet die gebundene Rückfahrt in derselben Wirtschaftsminute; kein freies Nadir-Dockfenster für Reparatur.

## Implementiert
Lesendes `reparaturAngebot(s,{owner,schiff,station})` ausschließlich im Kampfprofil. Prüft Original-Schadensaudit, Eigentümer, Hülle, tatsächlichen Dockort, Werftstandort, Material, Kasse und belegte Werftarbeit. Proportionaler W5-Neubau als vorläufiger Forschungsparameter, auf ganze Einheiten aufgerundet: 48/96 Schaden → 3 Material à 100 ISK + 15 Minuten à 1 ISK = 315 ISK. Keine Produktentscheidung. Jeder shipRepair-Befehl wird explizit abgewiesen; keine Änderungen an Geld, Ware, Zeit oder Hülle. Standardprofile erhalten kein neues Angebots-API.

Gezielter Original-F4-Test prüft reales Dock, lokales und entferntes Angebot, Eigentümer, Parameterfälschung, Schadensfälschung, bytegleiches Save und Replay. CI-Nachweis bei Erstellung offen. Keine lokale Node22-Ausführung.

## Nächste Abhängigkeit
Entweder ein bilanziertes Nadir-Reparaturfenster nach Original-Vertragsabwicklung (einschließlich Änderung des Rückfahrttermins, vollständige Treuhand und Lohnprüfung) oder bezahlter Materialtransport nach Aldera plus echte dortige Arbeitsleistung. Vorzugsweise Nadir, um vorhandene W5-Werft und Arbeitskonto zu verwenden. Kein kostenloser Teleport, keine Änderung der 50-Eis-/250-ISK-/120-Lohn-/240-Tarif-Referenz. W5/W4-Materialaudit muss um einen unabhängig belegten Reparaturverbrauch erweitert werden, nicht gelockert. Erst danach Reserve, Minutenarbeit und chronologisch mit den Schussbelegen auditierte Hüllenwiederherstellung. Kein Merge, kein Deploy während M4-U4.

## Zweites Gate: tatsächliches Dockfenster und Materialversorgung

CI des ersten Commits 6ffecce6: [PIR-Vertragsworkflow 45427979081](https://github.com/tobiasfranziskus/Check/actions/runs/45427979081), alle fünf Jobs erfolgreich, gezielt 9/9 Tests. Originalbeleg: Haus 2028 ISK, 48/96 Hülle, Materialbestand Nadir 0, Hash aa301a2025e848cb; aktive 90/365-Tage-Kampfprofile unverändert grün. Allgemeine Regression zu diesem Zeitpunkt noch offen.

Angebot unterscheidet physische Andockung und tatsächlich frei verfügbare Hülle. Bei bestehendem Original-F4-Vertrag sind Phase, Lieferbeleg, vertragliches Rückkehrende und beide Resttreuhandbeträge lesbar. Der neue Test untersucht den realen Nadir-Dock bei Teilschritt 135, die Übergabe bei 240 und die vollständige Rückkehr. Ein zweiter Test sucht bis zu einem weiteren Spieltag nach ausreichend tatsächlich produziertem W4-Material unter unveränderter NPC-Politik. Positive und negative Materialbefunde werden getrennt geloggt; keine erzwungene Ware oder Nachfrage. Deterministischer Replay und Originalaudits sind verpflichtend. Neue Tests bei Commit noch nicht ausgeführt.

Der Originalvertrag besitzt keinen frei disponierbaren Reparaturhalt. Allein das Verschieben von sh.ankunft würde die W5ag- und K1/F4-Zeit-/Lohnbelege verletzen. Nächster Implementierungsabschnitt muss daher eine ausdrückliche Pause mit separatem Arbeitszeitbuch und angepassten strengen Vertragsaudits oder einen eigenen bezahlten Hinflug nach Vertragsende liefern. Keine implizite Vertragszeitänderung. 
