# J2a – Lokal gekaufter, bereits vollständig bezahlter K2-Miner in Nadir

**[DRAFT / Regel200-Forschung · 14.11.2026]** Auf [J2 #338](https://github.com/tobiasfranziskus/Check/pull/338) gestapelt. F8-Training [#337](https://github.com/tobiasfranziskus/Check/pull/337), Spiel-Root, Hauptversion Regel195, Original-W5ac, W0–W5-Produktstände und produktive Saves bleiben unverändert. **Noch keine Siliziumförderung oder Jägerwirtschaft.**

## Vorheriger, tatsächlich belegter Blocker

[J2 #338](https://github.com/tobiasfranziskus/Check/pull/338) hat eine komplett aus wirklichem Erz, W4-Material, Werftumsatz und 30 bezahlten Arbeitsminuten produzierte Minerhülle im Nadir-Lager nachgewiesen. Die bereits als Bestellerin eingetragene Spielerfirma `house` kann diese Hülle über das bisherige `shipBuy` nicht kaufen, weil dieses aus guten Gründen den historischen K2-Pfad in Aldera nicht ändert. Ebenso ist sie noch nicht auf dem finanzierten Nadir→Aldera-Rücktransport verladen.

**J2a prüft ausschließlich eine zweite rechtmäßige Verwendung dieser bestehenden Hülle: örtliche Abholung durch den registrierten Besteller.** Die ursprüngliche Rückfracht bleibt unverändert möglich, wenn die örtliche Abholung nicht erfolgt.

## Neu, aber nur auf diesem Forschungsbranch

- Neuer strenger Regel200-Befehl `stationClaimMinerLocal` mit exakt `{type,owner,station}`. Nur `house`/ `npc3`, nur `st_nadir`, nur physisch **1 vorhandener K2-Miner auf Lager**, der tatsächlich fertiggebaut ist, keine laufende Werft-/Rückfracht und `minerWerft.wartetAuf === owner`. Ein freier, unsignierter Lagerbestand wäre nicht ausreichend.
- Erst nach vollständig bestandener Eingangsprüfung nutzt der **Original-`m_core_commands.execute`-Kauf** die bereits geltenden **600 ISK**. Es belastet das reale Firmenkonto, schreibt den Verkaufserlös der realen Werft gut, reduziert das Nadir-Lager um 1 und erhöht `ledger.miner.consumed` um 1. Die originale Schiffs-ID-Erzeugung gibt eine neue wirkliche Miner-ID mit `owner=besteller`, `system/heimat=nadir`. Die bereits vorhandene Welt-F6-Synchronisierung setzt den Körper ans echte Nadir-Dock.
- Das historische `shipBuy` bleibt **byte-logisch unverändert**: Es verweigert Nadir-Miner in J2 genau wie zuvor. Die neue, getrennte Aktion ist ausschließlich unter `rules.k7 && rules.kanon` möglich (Regel200) und ändert kein Regel199-/195-Profil.
- Ergänzung im vorhandenen K2-Fertigungsbeleg: `minerWerft.lokalGekauft` und `minerWerft.lokaleKaeufe[]`. K2 trennt jetzt nachweisbar `fertig = verladen + lokalGekauft + aktuelles Lager`. Physische Rückfracht bzw. deren Treuhand bleiben ausschließlich auf `verladen` bezogen. Ein lokaler Kauf darf nie parallel eine Rückfracht auslösen.
- `m_core_minerwerft.audit` prüft jeden neuen Verkaufsbeleg unabhängig mit vorhandener Hülle, genau zugehöriger ID, Besitz, echtem Nadir-System und -Heimatort, Preis 600, Tickgrenze, Eindeutigkeit, physischem Lager und ledger-gestütztem Verbrauch. Die Aldera-Bestandsrechnung erhält die Korrektur für **nicht** nach Aldera transportierte Nadir-Käufe. Alte K2-Spielstände ohne diese optionalen Felder bleiben ohne automatische Umstrukturierung unverändert lesbar.
- Nicht in die Kaufkosten hineinerfundene 60 ISK: K2 fordert beim Werftauftrag Deckung von **600 Kaufpreis + 60 mögliche Rückfracht**. Die 60 sind bei Bestellung nicht aus dem Spielerkonto abgebucht oder reserviert, daher wird bei lokaler Abholung auch keine fiktive „Rückerstattung“ verbucht.

## Schutz vor Fehlbuchungen

Bevor der Versuch als wirtschaftlich erfolgreiche Umsetzung gilt, müssen insbesondere folgende Fälle tatsächlich erfolgreich getestet werden:

- [ ] Beide Seeds 42 und 7: vorher vollständig belegte K2-Erz→Material→Miner-Fertigung, anschließend genau ein realer 600-ISK-Verkauf an den vorgemerkten Besteller; Geldsumme 33.000, Mint/Burn0, unabhängige Waren-, Kauf-, Eigentums- und K2-Auftrag-Audits.
- [ ] Zweitkauf, falscher Käufer, unbekannter Lieferort, überflüssiges Feld, unvollständiger 599-ISK-Käuferetat, fehlendes Lager, unterbrochene Werft oder falscher Reservierungsstand werden vollständig **ohne Zustandsänderung** abgelehnt.
- [ ] Ein ganzes Welt-Save/Load, Hash, deterministischer wiederholter Befehlslauf, keine abweichende Ausgangsreferenz von J2; die existierende Regel199- und ältere K2-Rückfracht behalten ihre Ergebnisse.
- [ ] Manipulierte Verkaufshistorie, Preis, Schiff-ID, Eigentümer, Ort, Tick, Lager und Warenledger vom Original-`welt.audit` und Ladepfad verworfen.
- [ ] `shipMine silizium` bleibt weiterhin verboten; keine Siliziumware, kein freies Vorkommen oder gratis produzierter Jäger.

Neue Regression `tests/j2a-nadir-minerkauf.test.mjs` und eigener gezielter Workflow-Schritt vor dem vollen Wirtschaftstest. Chromium/WebKit-Regression des bestehenden Cockpits in der K1-Matrix; **keine neu freigegebene Spieleroberfläche** für diesen Forschungsbefehl. Auch wenn diese positiv sind, bleiben echte iPad-Safari-/NAS-Abnahme offen.

## Unveränderte weitere Hürden

`silizium`, ein tatsächliches begrenztes Nadir-Vorkommen, entlohnte Förderung, verifizierter Rohstoffkauf und die Bauteilkette sind weiterhin **nicht** im Regel200-Kern vorhanden. Der hier gekaufte Miner ist allein eine real finanzierte Hülle am richtigen Ort. J2a darf nicht als Jägerproduktion, Kopfgeldwirtschaft oder fertige Siliziumkette bezeichnet werden. Alle neuen Einnahmen entstehen aus dem Originalkauf und nicht durch Minting oder zusätzliches Weltkapital.

**Kein Merge/Deployment.** Dokumentation ist ein Entwicklungsbefund, keine Produkt-/Balancingfreigabe.
