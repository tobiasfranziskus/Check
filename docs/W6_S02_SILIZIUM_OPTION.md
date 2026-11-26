# W6 – S02: Opportunitätskosten der optionalen Siliziumkette [FORSCHUNG]

26.11.2026. Basis #643 c3ec951f. [Diagnose-CI](https://github.com/tobiasfranziskus/Check/actions/runs/45812135370) und [P0](https://github.com/tobiasfranziskus/Check/actions/runs/45812134678) success. Job 139882404609: vollständige deterministische Beobachtung, identische Kontrollhashes, keine Originalzustandsänderung.

## Tatsächlicher Befund
- Letzte W3-Erzfahrt Tick 12733; letzter Miner geliefert 12913; letzte Frachterhülle gebaut 14263; letzter NPC-Frachter stillgelegt 17813; letzte Eisfahrt 18660, letzte Wasserproduktion 18700.
- Tag 30: kein Erz/Material und keine kaufbaren Hüllen in beiden Lagern; Aldera 47 Eis. Hausfrachter sh004 40 Restaktivminuten, NPC-Miner sh008 in Nadir 1917 Restaktivminuten, sonst alle relevanten Hüllen stillgelegt. sh008 aus Original-Lokalkauf Tick 2210 für 600 ISK; Jägerbestand Nadir 1. Haus 8425, NPC3 2424, Transport 2000, Werft 1060 ISK; keine Treuhand. Originalangebote lehnen Kauf/Bau wegen physischem Bestand bzw. Material ab.
- Bei Tick 14263 existierte eine für beide Käufer finanzierbare Hülle, Überführung auf Kopie wegen aktiver Fracht gesperrt. Original später durch Transport gekauft (sh016). Kein Beleg für ungenutzten Frachtervorrat.
- Lokale K2-Kaufprovenienz im Audit verlangt Heimat Nadir und Standort Nadir (bzw. belegtes Dravos bei späterer Regel). Im derzeitigen Profil ist ein freier Nadir→Aldera-Umzug keine nachgewiesene Mechanik. Nicht durch Positionsänderung oder Umwidmung umgehen.

## Kontrollierter Gegenversuch
Bestehende freiwillige NPC-Siliziumautomatik beim Start an (Original) vs. explizit aus; gleiche Seed42-S02-Politik und identische Managerlogik, keine neue Regel/Preis/Produktion. Je zwei vollständige 90-Tage-Läufe, gepinnte Kontrollhashes und unveränderter Standardaufruf; Audits und Save-Roundtrips. Bestehende Umsetzungsbefehle für tatsächlich vorhandene lokale Miner nur auf Kopien am Ende prüfen, keine Teleportation. Vergleich von Industrie-/Wasserleistung, Hüllen, Käuferliquidität und Jägerproduktion. Ein möglicher Fortschritt erkauft durch Verzicht auf Jäger ist ein Zielkonflikt, keine allgemeine Lösung und kein Beweis dafür, dass allein sh008 den Stillstand verursacht. Bei positiver Wirkung danach getrennt finanzierte Prioritäts-/Zeitfenster und 365/730 prüfen; bei negativem Ergebnis keine Übernahme.

Status: Implementierter Offline-Vergleich, neue CI noch offen. Keine Änderung an Spielkern, Main, Pages, Blindtest oder Saveformat; Roadmap-Produktpriorität unverändert.
