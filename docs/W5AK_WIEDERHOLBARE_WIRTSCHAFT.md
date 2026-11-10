# W5ak – Wiederholbare Wirtschaftsabläufe [DRAFT]

Basis: [PR #282](https://github.com/tobiasfranziskus/Check/pull/282), `feature/ui-miner2d-rule195`, Head `fc833af629573c25b05374ce0e201a79276782a9`. Referenz ausschließlich lesend aus [W5ai #281](https://github.com/tobiasfranziskus/Check/pull/281), `f0e7e8ea`; dessen Core ist bytegleich zur Basis. Geprüfter Produkt-main: `fd3e915448a2f35fa803db709aff9ce223dddc6f`. Eigener Branch `feature/w5ak-wiederholbare-wirtschaft`; Ziel ist ausschließlich der Branch von #282. W5aj/#283 wurde weder abgerufen noch bearbeitet.

## Bedienung im gemeinsamen Hub

Statisch `prototypes/w5ag/index.html` öffnen. HQ, Karte, Cockpit und Wirtschaft verwenden weiterhin dieselbe pausierte Regel195-Sitzung. Vor Reload oder Import JSON exportieren; kein produktiver Speicherplatz wird benutzt.

Der bestehende erste Ablauf einschließlich optionaler Raffinerie/Werft bleibt bedienbar. Nach beendetem ersten Eis-Rückflug kann der Spieler im Miner-Cockpit oder Wirtschaftsbereich erneut Eis fördern, die gemeinsame Welt um 50 Minuten weiterstellen und stoppen. Bleibt die Charge an Bord, **Eismenge 50 → Eis an Aldera verkaufen** wählen. Verkauf und Förderung sind getrennte Aktionen; Eis an Bord ist kein Einkommen. Menge, ausgewählte eigene Miner-ID, Ort, reale Fracht, Lageraufnahme und Käufergeld prüft der Original-Core. Die bestehende automatische Core-Chargenabnahme bei ausreichendem Etat bleibt unverändert.

Danach im Wirtschaftsbereich **Eisfracht finanzieren** erneut wählen. Der Core bindet vor dem Start 490 ISK aus Nadirs Käuferkasse und 120 ISK Fluglöhne aus der Speditionskasse. Der Start zahlt keinen Privatlohn. 60 echte Hinflugminuten liefern Eis und bezahlen 60 Minuten; erst weitere 60 echte Rückflugminuten schließen den Auftrag ab. Das Wasserwerk und jeder private Wasserkauf bleiben freiwillige, separat finanzierte Befehle. Kein zusätzlicher Tick, keine automatischen Wiederholungsaufträge oder Kaufpflicht.

Die Anzeige enthält getrennte Erz-/Eispiloten-Kassen, tatsächliche Lohnminuten und ISK, vollständige Fluglohnbelege und Eisverträge, begonnene/fertige Wasserchargen, aktuelle Produktionsarbeit, Lagerbestand, Wasserumsatz und Kaufbelege. Gesperrte Aktionen zeigen Core-Gründe und vorhandene Kassen/Ladung; volle Fracht und fehlendes Eis-Arbeitsgeld werden zusätzlich vor dem nächsten Fördertick erklärt. Eingaben bleiben bei Neuzeichnen erhalten.

## Exakter W5ai-Referenzweg

Für den Referenzhash keine zusätzlichen Raffinerie-/Werftaufträge erteilen:

1. Speditionsfrachter und eigenen Miner kaufen, Eis fördern, 50 Minuten, stoppen. W3-Erzfracht starten, zweimal 60 Minuten.
2. Eisfracht starten, 60 Minuten, Wasserwerk starten, 20 Minuten. Erzpilot kauft 6 Wasser, Eispilot 4. Rückflug 30 + 10 Minuten abschließen.
3. Wasserwerk erneut starten, 20 Minuten. Erzpilot kauft 2, Eispilot 4 Wasser. Tick310: 4 Wasser auf Lager, Eispilot 8 ISK.
4. Erneut Eis fördern, 50 Minuten, stoppen, 50 Eis manuell verkaufen. Tick360: zweiten Eisfrachtauftrag finanzieren.
5. 60 Minuten, Eispilot kauft 4 Wasser. Dritte Wassercharge starten, 20 Minuten, Eispilot kauft 2. Rückflug 30 + 10 Minuten, Eispilot kauft 3.

Ergebnis Tick480: zwei vollständig bezahlte Eis-Rundflüge, 120 Erz- plus 240 Eis-Fluglohnminuten, 30 Wasser hergestellt, 25 für 350 ISK gekauft und verbraucht, 5 Wasser auf Lager. Erzpilot spart 8 ISK, Eispilot 2 ISK. Weltgeld 33.000 ISK, Mint 0. Hash Seed42 `58da44b282a654a3`, Seed7 `3c9fee7bcd26040d`. Das ist kein Nachweis einer dauerhaften W6-Wirtschaft.

## Integrationsgrenzen

Nur die bestehende Sitzung schaltet `shipSellIce` im Profil `private195` frei: Besitzer bleibt `house`, nur der ausgewählte eigene Miner ist zulässig; tatsächliche Validierung erfolgt auf auditierter Core-Kopie vor atomarem Austausch. Andere Profile erhalten den Befehl nicht. Bestehende W5n-Fracht wird unverändert wiederverwendet. Der Original-Core, Rezepte, Preise, Arbeitslöhne, Startkapital, Regel195/Schema8, produktive `index.html`, Save-Hülle und historische Referenzen bleiben unverändert. Kein Import von Forschungsregeln oder UI-Code aus W5aj. Keine produktive Migration, kein Merge oder Deployment.

## Prüfprotokoll

- `tests/w5ak-folgezyklen.test.mjs`: vier gezielte Einzeltests. Seeds42/7 mit Doppelreplay, identischem Referenzhash und Save/Load während des zweiten Fluges; unabhängiger Geld-/Wirtschafts-/Fracht-/Wasser-/Privatlohnaudit. Gesparte neue Löhne bleiben beim Piloten, ohne Kaufzwang.
- Unterfinanzierte zweite Fracht: gleicher unveränderter Original-Core im bestehenden 1500-ISK-Käufer-Forschungsprofil; nach den echten Käufen verbleiben 454/490 ISK, Ablehnung ohne Buchung. Das feste Startkapital der Hub-Sitzung wurde dafür nicht verändert.
- Unfinanzierter Verkauf: drei echte eigene Miner kaufen, zwei Erzverträge binden das vorhandene Aldera-Käuferkapital; dritter Miner fördert 10 Eis. Bei Käuferkasse 0 bleibt der manuelle Verkauf zustandsneutral gesperrt. Ungültige Mengen, fremde IDs, Profilwechsel und manipulierte Lohn-/Kaufbelege ebenfalls abgelehnt.
- `tests/w5ak-touch.py`: exakter Referenzweg ausschließlich über Touchbedienung; frische Eisladung, manuelle Abnahme, zweites Treuhandpaar, Wiederaufnahme des zweiten Fluges per JSON, Beleganzeigen, Navigation und Touchhöhen. Größen 1180×820, 1024×768, 820×1180, 390×844. Screenshots `/tmp/w5ak-*.png`.
- Geerbte Cockpit-/W5ag-Touchtests und vollständige Node22-Regression; W5ag-CI-Workflow um den Folgezyklus ergänzt.

Tatsächlich lokal ausgeführt mit Node **v22.23.4**:

- Vorgeschriebener Aufruf `node --test tests/*.test.mjs`: **36/36 Dateigruppen bestanden**, 0 Fehler/Skips, 118,7 Sekunden.
- Ergänzender Node22-Lauf mit `--experimental-test-isolation=none`: **197/197 Einzeltests bestanden**, 0 Fehler/Skips, 136,3 Sekunden, einschließlich geerbter 13×90d-/365d-Prüfungen.
- Neue gezielte Folgezyklusprüfung: **4/4 Einzeltests bestanden**, Seeds42/7 und unveränderte W5ai-Referenzhashes.
- Finaler Chromium-Touchstand: W5ak **4/4**, bestehendes Miner-Cockpit **4/4**, bestehender W5ag-Hub **4/4**; keine JavaScript-Seitenfehler. Neuer schmaler Screenshot visuell geprüft; kein Seitenüberlauf in den geprüften Ansichten, neue Eingaben/Knöpfe mindestens 48px hoch.
- Diffprüfung: Original-Core und produktive `index.html` bytegleich zur Basis, keine historischen Testreferenzen geändert. GitHub-CI wird separat beurteilt.

**Offen:** echtes iPad Safari (Hoch-/Querformat, native Auswahl, Touch/Tastatur, JSON-Download/Import) und reales NAS am tatsächlichen Origin. Chromium emuliert Touch und ist keine Gerätefreigabe. Kein produktiver Release.
