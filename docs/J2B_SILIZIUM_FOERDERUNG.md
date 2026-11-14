# J2b – Endlicher Siliziumabbau und bezahlter Nadir-Ankauf

**[DRAFT / ANALYSE · 14.11.2026]** Gestapelt auf [J2a #339](https://github.com/tobiasfranziskus/Check/pull/339), [J2 #338](https://github.com/tobiasfranziskus/Check/pull/338), [J1 #335](https://github.com/tobiasfranziskus/Check/pull/335). Kein Merge/Pages/NAS.

## Abgrenzung vom produktiven Stand

Die **einzige produktive Hauptversion bleibt Regel195**. Die bisherige Regel200-Welt bleibt byte-logisch hinsichtlich ihrer Regeln und Saves unverändert. **J2b wird nur explizit als separates Forschungsprofil mit der internen Kennung Regel201 aktiviert.** Es gibt keine automatische Migration von Regel200 oder älteren Spielständen. `ausRegel200J2b(json)` validiert ein vollständiges Original-200-JSON und übernimmt erst danach unter Wahrung der ursprünglichen Geld-, Schiffs-, Waren-, Flug- und Eigentumsdaten. In Regel201 beginnen Silizium-Lager und Ledger bei 0, das Feld ist noch vollständig unberührt; die registrierte Ressource ist ein **endlicher Vorkommensnachweis, keine zusätzliche freie Ware**.

Die freigegebene Wirtschaftsreihenfolge W0→W6 bleibt verbindlich. Die Zahlen hier dienen einem begrenzten **[OPTION/ANALYSE]**; kein neues Balancing für die Hauptversion beschlossen. Keine Bauteile, Jägerrezepte, Jägerhüllen, Piraten oder Kopfgeld-Einnahmen.

## Tatsächliche Verträge (implementierte Forschung)

- **Voraussetzung:** J2a liefert eine real aus Erz, W4-Material, bezahlter Werftarbeit und 600-ISK-Kauf erworbene `miner`-Hülle mit belastbarer `minerWerft.lokaleKaeufe`-ID, Eigentümer `house`/ `npc3`, physisch im Dock `st_nadir`. Fremdschiffe und beliebige Frachter sind ausgeschlossen.
- **Profil:** `createJ2bWelt` erhält ausschließlich das bewährte Startkapital und die Original-Ortsprüfung. Für das Forschungsprofil werden `silizium` als Rohstoff mit 24 ISK Preis, Nadir als Industrieort und ein endlicher Vorkommensvorrat von **16 Einheiten** unter `rules.j2b` definiert. Das Vorkommen befindet sich bei (720000,−480000), Radius 144000 F6-Raumpunkte. Der ursprüngliche F6-Kern und die bisherigen Orte bleiben unverändert.
- **`siliconMineStart`:** Genau ein überprüfter Auftrag über **8 Einheiten**, 8 Arbeitsminuten je Einheit, 2 ISK Arbeitslohn je Minute: **128 ISK** Firmenkapital an `k1_silizium_arbeit`. Vor dem Start muss der Nadir-Käufer zusätzlich **192 ISK** aus der realen Stationskasse an `k1_silizium_kauf` reservieren. Beide Zahlungsketten verwenden die gepaarte bestehende K1-Buchführung. Keine Geldemission, keine frei erzeugten Vorprodukte.
- **Arbeit/Physik:** Der Miner dockt mit `shipUndock` gegen den ohnehin vorfinanzierten Original-Flugdienst ab, fliegt mit echtem `shipFlyTo` an die Feldkoordinaten und kann **nur in F6-Freiflug, innerhalb des Feldes und mit Geschwindigkeit bis 96** Punkte je Sekunde arbeiten. Pro tatsächlich im Original-Welttick geleisteter Minute fließen 2 ISK Arbeitslohn an das eingetragene Pilotenkonto. Nach **8 solchen Minuten** entsteht exakt **1** Rohstoffeinheit physisch im Schifffrachtraum, `ledger.silizium.mined` +1 und `vorrat` −1. Nach 8 Einheiten sind 64 bezahlte Minuten geleistet. Keine unabhängige Wirtschaftsuhr, keine browserseitige Produktionsabkürzung.
- **`siliconSell`:** Erst nach tatsächlicher Rückkehr und Dockung an `st_nadir`, vollständig geladener Originalhülle und abgeschlossenen 64 Förderminuten. Genau 8 Silizium gehen aus der Schiffsladung in das Stationslager, **192 ISK** werden ausschließlich aus der vorher gebundenen Ankaufskasse an den Miner-Eigentümer übertragen. Keine fiktiven Transport- oder Rettungserlöse.
- **Unabhängige Audits:** `silizium.mined`, endlicher Feldvorrat, Schifffracht, Lager, Auftrags- und Verkaufsbelege, Arbeitsreserve/Minute, Käuferreserve, ausbezahltes Geld, genaues Käufer- und Minereigentum sowie erhaltene Gesamtgeldmenge (33.000 ISK, Mint/Burn 0) werden in der Welt geprüft. Save/Load muss Regel201 und das neue Buch validieren; alter Regel200-Code/Save darf das nicht still verarbeiten.

## Prüfplan / zunächst nicht als bestanden behaupten

`tests/j2b-silizium-physisch.test.mjs` testet Seeds42/7 mit echter J2a-Produktionsvorbereitung, ausdrücklicher 200→201-Übernahme, vollständig finanzierter Doppel-Treuhand, F6-Abdocken und Feldanflug, 64 bezahlten Minuten, tatsächlichem Lagerverkauf, Save/Load und deterministischen Prüfbilanzen. Negative Kontrollen: 127 statt128 ISK Förderkapital, 191 statt192 ISK Käuferbudget, 7 Einheiten Restvorrat, ungültiges Eigentum/Ort/Schiff, Doppelauftrag, Verkauf ohne Ware, manipulierte Ledger-, Arbeits-, Eigentums- und Kaufreservierungen.

Der gezielte Test ist im K1-Workflow eingetragen; die historischen K2/J2a- und Regel195-Tests laufen zusätzlich im K1-Gesamtjob. **Die Quellsyntax und isolierte Regel201-Genesis-/200→201-Übernahmekontrolle wurden vor dem PR tatsächlich in V8 ausgeführt und waren erfolgreich**: 33.000 ISK, 0 Mint/Burn, Silizium-Initialbestand 0, Zielaudit gültig. **Ein vollständiger positiver Förder-/Kaufablauf ist erst mit erfolgreichem gezieltem Node22-CI-Test nachgewiesen**; bis dahin ausdrücklich offen. Kein neues Touch-Cockpit in diesem Draft, deshalb keine reale iPad-/NAS-Abnahme. Die vorhandene Browsermatrix wird durch Workflow weiter getestet; reale Geräteabnahme bleibt offen.

## Nächste Gates

1. **J2b:** Tatsächlichen positiven End-to-End-Test über 8 Silizium samt unabhängiger Auditbelege abschließen; allfällige negative Ergebnisse unverfälscht dokumentieren.
2. **J3:** Nur nach J2b-Freigabe in einem eigenen Forschungsprofil reale Silizium-/Material→Bauteil-Produktion gegen Material-/Lohnkassen und Warenaudits implementieren.
3. **J4:** Erst dann aus echten Bauteilen und Material finanzierte Jägerhülle, Spieler-Kauf und später Kampfabrechnung aus vorhandenen finanzierten NPC-Piraten-/Kopfgeldbudgets mit gesonderter Freigabe.
