# J4b – Der erste tatsächlich finanzierte Jäger aus der autoritativen Weltwirtschaft

**[DRAFT / Forschungsregel203 · 14.11.2026]** Gestapelt auf [J4a #342](https://github.com/tobiasfranziskus/Check/pull/342), damit J3/J2b/J2a/J2/J1/F7/K13. **Nicht in main integriert und nicht veröffentlicht.** Die produktive Version bleibt Regel195/Schema8, frühere Forschungsregeln 200–202 bleiben strikt getrennt.

## Herkunft – keine Startwaren

Die Rohdaten der J4a-CI belegen (beide Seeds42/7, Tick22323): **8 Bauteile, 4 Material, 30 Erz**, nach echter Minerförderung und Original-K7-Fracht, Original-W4-Raffinerien, vorher bezahltem J2b-Silizium, bezahlter J3-Fertigung und vollständig abgeschlossener Original-W5-Frachterwerft. Es wurden keine Rohstoffe, Schiffe oder ISK künstlich eingefügt.

Der bekannte ursprüngliche R14-Rezeptdatensatz `r_jaeger` wird im **ausschließlich explizit anwählbaren Regel203** aktiviert: 8 Bauteile + 4 Material → 1 Jäger nach 32 bezahlten Arbeitsminuten. Der originale Jägerpreis beträgt 900 ISK. Im neuen Nadir-Jägerlager, Warenledger und Eigentumsbuch beginnt der Bestand ausdrücklich bei **0**.

## Eigentum, Vorfinanzierung, Produktion, Kauf

Nadir ist rechtmäßiger Eigentümer der zuvor tatsächlich finanzierten und im Stationslager nachgewiesenen 8 Bauteile und 4 Material. Der externe `werft_extern`-Auftrag aus K7 war zuvor vollständig als **getrennte Frachterfertigung aus 530 ISK Werfttreuhand** abgeschlossen. Es wäre eine unrechtmäßige zweite Kostenbelastung, seine bereits verbrauchten Geld-/Materialrechte auf den Jäger zu übertragen. Deshalb führt Nadir den Jäger-Werftauftrag aus **eigenem Stationsbesitz** aus und stellt die 32 Arbeitsminuten aus **eigenen verfügbaren ISK** sicher. Dieses Forschungs-Vertragsmodell ist eine **[OPTION]**, keine neue Produktionsfreigabe.

- **Befehl `stationBuildFighter`:** Exakt `{type,owner:'st_nadir',station:'st_nadir'}`; 8 echte Bauteile und 4 echtes Material müssen vorliegen. 32 ISK werden vorab über das bestehende autoritative K1-Doppelbuch von Nadir an `j4_arbeit_treuhand` gebunden. Warenein- und -ausgang wird unmittelbar in den vorhandenen `ledger.material` und `ledger.bauteil` dokumentiert. Weder ein fremder Auftraggeber noch ein zweiter paralleler Auftrag darf bezahlt/gestartet werden.
- **32 echte Kernminuten:** je 1 ISK Werkstattlohn an das bei **0 ISK** startende Konto `j4_jaeger_arbeiter`, bis alle 32 ISK geleistet sind. Erst beim letzten Tick erhält Nadir **eine** echte Jäger-Lagerhülle; `ledger.jaeger.produced` wird um 1 erhöht. Arbeitsreserve verbleibt anschließend bei 0.
- **Original-`shipBuy` statt künstlicher Jäger-ID:** Erst wenn die bezahlte Lagerhülle tatsächlich existiert, darf `house` sie im **Original-Weltkern** für **900 ISK** am Nadir-Dock kaufen. Der Kern erstellt eine einzigartige `sh...`-ID, verbraucht die Lagerhülle im originalen Warenledger und bindet einen echten F6-Schiffskörper am Nadir-Dock. **900 ISK werden vom Spieler abgezogen und dem tatsächlichen Hersteller-/Wareneigentümer Nadir gutgeschrieben**, nicht der früheren Frachterwerft. Jeder Kauf hat Beleg, ID, Preis, Ort, Tick und eindeutiges Eigentum.
- **Anlagewert:** Der real gekaufte, noch angedockte Jäger wird im gemeinsamen Konzernbericht mit 900 ISK Buchwert gezeigt. Der erste Jäger ist noch nicht in den autoritativen Flugdienst übergeben. Es werden daher noch keine fingierten Treibstoff-, Wartungs-, Kampfschaden-, Reparatur- oder Fluglohnkosten erhoben. Der noch nicht geflogene Jäger wird nicht mit einer ausgedachten Flugabschreibung belastet; J4c muss dafür eigene echte Flug-/Verschleißbelege definieren.

## Unabhängige Gegenprüfungen

Die bestehenden Original-W3/W4/W5-/W5ae-/W1-Vollkostenprüfungen mussten um den **neuen, echten Nadir-Jägerverkauf** erweitert werden. Diese Korrektur subtrahiert in den unabhängigen Stationskassenabschlüssen exakt `jaeger.verkauft × 900 ISK` und erkennt im W1-Vollkostenbuch den echten Jäger-Anlagenkauf des Spielers, **ohne Audits abzuschalten**. Der erste CI-Gegenversuch scheiterte absichtlich sichtbar an `vollkosten,wageTrade,w3,w4` und wurde erst nach buchhalterischer Korrektur grün.

Der neue J4b-Audit prüft Werftaufträge, vollständige Lohnreservierung und Minuten, Input-Lagerverbrauch und Ledger, Fertigstellung, Einmalkauf, physische originalen Schiff-IDs, Eigentum, Standort, 900-ISK-Preis, Save/Load und manipulierte Belege. Das Original-`shipBuy` außerhalb Regel203 akzeptiert weiterhin keinen freien Jägerkauf.

## Tatsächlich ausgeführte Tests

Der fokussierte GitHub-Node22-Job im [K1-Lauf #43592309181](https://github.com/tobiasfranziskus/Check/actions/runs/43592309181) war **completed/success: 6/6 Tests, 0 Fehler**, sowohl Seed42 als auch Seed7 über die vollständige Original-Herkunftskette.

| Nachweis | Seed 42 | Seed 7 |
|---|---|---|
| Original-J4a-Lager vor Start | 8 Bauteile, 4 Material | 8 Bauteile, 4 Material |
| J4b-Jäger nach 32 Minuten | 1 Hülle | 1 Hülle |
| Käuferpreis | 900 ISK | 900 ISK |
| Eigentümer/Schiff | house / sh023 | house / sh023 |
| Nachfolgender Referenz-Tick | 22355 | 22355 |
| Referenzhash | `32f22a9414d91fe2` | `81881735d227f8a2` |
| Spielerkasse nach Kauf | 1.589 ISK | 1.589 ISK |
| Nadir-Kasse nach Kauf | 5.052 ISK | 5.052 ISK |
| Weltgeld/Mint/Burn | 33.000 / 0 / 0 | 33.000 / 0 / 0 |

Geprüft wurden außerdem Auftrags- und Käufer-Unterfinanzierung, Doppelkäufe, unberechtigte Besitzer, fehlende Waren, manipulierter Preis/Ort/Arbeits- und Warenbeleg, deterministischer Save/Load-Hash sowie die Nichtakzeptanz des Regel203-Saves in älteren Profilen. Die Ausgabe des read-only-Konzernberichts inklusive des 900-ISK-Anlagewerts ist zusätzlich eingerichtet und gehört zur nächsten CI des endgültigen Draft-Headers.

## Unveränderte Grenzen

**[MAIN] Nicht integriert.** Es existiert eine bezahlte Regel203-Jägerhülle, aber **noch keine persönliche Steuerung im gemeinsamen Weltkern**. Der getrennte F8-E-Trainingsjäger ist weiterhin nur ein Simulator, kein Wirtschaftsschiff. Keine realen Piraten, Kampfboni, Kopfgeld-Minting, Gratisreparaturen, automatische Versöhnung der Datenmodelle oder versteckte Waren. 13 wirtschaftlich unabhängige ×90-Tage-Nachhaltigkeitsläufe speziell für Regel203, echte iPad-Safari- und NAS-Abnahme stehen noch offen; historische K1-Langzeittests decken den neuen spezifischen Jägerkreislauf nicht ab.

**J4c/F8-Verknüpfung (separat):** den bezahlten Original-`sh023`-Besitz eindeutig an die F6-/F8-Befehle binden; Flugarbeit und Verschleiß aus realem Eigentümerbudget finanzieren; vor realem Kampf bezahlte NPC-Ziele, Schaden, Ersatz und Kopfgeldverträge separat begrenzen. Keine Produktentscheidung und kein Merge/Deployment ohne Freigabe.
