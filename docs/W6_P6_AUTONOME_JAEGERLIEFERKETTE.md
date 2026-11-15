# W6/P6 – prüfbarer End-to-End-Vertrag für autonomen Jägerbau

**[ANALYSE / NICHT MAIN] · 15. November 2026.** Gestapelter Forschungsnachweis auf [W6/P5 #396](https://github.com/tobiasfranziskus/Check/pull/396), welcher auf [P4 #394](https://github.com/tobiasfranziskus/Check/pull/394) und dem stabilen S02-Forschungszweig beruht. Die bereits veröffentlichte J13a-Karriere und der separate J13b-PR #395 bleiben unverändert. Keine neue Wirtschaftsregel.

## Verifizierter Forschungsbefund – 15.11.2026

**[ANALYSE / POSITIV – NICHT MAIN]** Der vollständige CI-Lauf auf dem P6-Test-/Code-Head `6c25909c0647ba3606c341edf126977e34cbf552` ist erfolgreich: **340/340 Node22-Einzeltests, 0 Fehler, 0 Skips**, unter anderem die unveränderten 13×90-Szenarien, Geld-/Waren-/Eigentums-/Save-Audits, Browser und Single-File-/Touch-Prüfungen. [Node22-Log](https://github.com/tobiasfranziskus/Check/actions/runs/43738157947/job/132885243028).

- **Nach 12.240 Spielminuten (= 8,5 Tage)** erstmals **1 real bezahlter J4-Jäger** aus autonomer NPC3-Siliziumversorgung; zuvor **8 J3-Bauteile**, Original-J2b-Siliziumverkauf **8 Stück**, ursprünglicher Feldvorrat **16 → 8**.
- Forschungs-Endhash vor Spielerkauf: `d51ad9a53400bdbf`.
- Original-900-ISK-Kauf durch `house` nach Fertigstellung: Eigentumsbeleg `sh013`, Käuferguthaben **3.000 → 2.100 ISK**, Warenlager `1 → 0`, exakt **33.000 ISK** Weltgeld, Mint/Burn 0; Endhash `489d10b2b4b65bb5`.
- `npcSilizium.aktiv` ist **nur ausdrücklich aktivierter Forschungs-Opt-in**, kein `main`-Spielstand-Default. Nadir/Industrie, Erz-, Ersatz- und Eiswirtschaft verwenden dieselbe deterministische Zeit und Buchung.
- Der Befund enthält reale, **nicht wegoptimierte 2.840 protokollierte Werftpausen** wegen vorübergehend fehlenden W4-Materials. Sie verhindern die erfolgreiche End-to-End-Produktion nicht und sind kein Rettungsmechanismus.

**Begrenzung:** Das endliche Siliziumfeld reicht mit dem Originalrezept theoretisch für höchstens **zwei** solche Jäger; die Nachfolgefrage einer längerfristigen Siliziumversorgung oder industriellen Expansion bleibt **[OPTION]**. Acht weitere schwach/ausfallend modellierte Szenarien sind dadurch nicht geheilt. Die W6-Policy, ihre Startreserve, Stilllegungsregel und produktive Aktivierung bleiben unfreigegeben. Diese QA war kein echter iPad-Safari- oder NAS-Gerätetest.

## Gemeinsame Schlussabnahme nach P5-Härtung (Forschungs-Head `a44d2a8b`)

**[ANALYSE / POSITIV – NICHT MAIN]** Nach Synchronisierung mit der vollständigen P5-Kauf-/Belegmanipulationsprüfung ist der gesamte W6/P6-Stack erneut ausgeführt worden: **341/341 Node22-Einzeltests, 0 Fehler, 0 Skips**, einschließlich aller unveränderten 13×90-Szenarien, der zusätzlichen P5-Positiv- und Negativprüfungen und des neuen 90-Tage-Einzelfalls. [Vollständiger Node22-Lauf](https://github.com/tobiasfranziskus/Check/actions/runs/43739119740/job/132888155109). Single-File-Check `W5_SINGLEFILE_OK`; Chromium/WebKit und die ausgeführten Wirtschafts-/Touch-Checks `success`; der bedingte Sicherheitsgeografie-Vergleich war `skipped`, **nicht** bestanden. Keine echte iPad-Safari-/NAS-Geräteabnahme.

**Im zusätzlichen S02/P5-Opt-in-Szenario bis Tag 90**:
- **2 vollständig finanziert gebaute J4-Jäger**, davon **1 real für 900 ISK** von `house` gekauft; weiteres Exemplar als echte Lagerware.
- **16/16 Siliziumeinheiten** aus dem originalen begrenzten Feld gefördert, **0 verbleibend**; ohne neue Felder kann diese Industriekette **keinen dritten Jäger** herstellen.
- **93 finanzierte Ersatzkäufe** und weiterhin reale Eis-, Wasser- und Lohnflüsse im letzten Drittel: Eis 33.376→50.734, Wassererlöse 501.582→760.900 ISK, gezahlte Löhne 244.779→367.802 ISK, Ersatzkäufe 62→93 (jeweils Tag 60→90).
- Weltgeld **33.000 ISK**, Mint/Burn 0, Spieler hält **2.100 ISK** und den bezahlten Jäger; unabhängige Geld-, Waren-, Eigentums- und Kern-Audits grün.
- **Tag45-JSON-Fortsetzung → Tag90 exakt gleich** zum durchgehenden Simulationsergebnis; Endhash `686355895f27fbb8`. Die Referenzhashes der bisherigen 13×90-Szenarien sind nicht verändert.

Dieser Nachweis **bewahrt eine funktionierende Eis-/Wasser-/Ersatzwirtschaft über 90 Tage unter endlicher zusätzlicher Jägernachfrage**, beweist aber weder ein unendliches Siliziumangebot noch allgemeine W6-Nachhaltigkeit aller Firmen/Szenarien. Die neuen NPC-Regeln bleiben **[OPTION]** und sind nicht in `main`.

## Forschungsfrage

Kann die bestehende, nur nach bewusstem `npcSiliziumSetzen(true)` aktivierte Forschung allein mit rechtmäßig finanzierten Eigenbefehlen den Weg **Werft/Material → bezahlter NPC3-K2-Miner → physisches Silizium → J3-Bauteile → J4-Jäger → 900-ISK-Spielerkauf** ohne manuell signierende Fremdfirmen abschließen?

Der Test `tests/w6-p6-autonome-jaegerlieferkette.test.mjs` startet wie S02 mit unveränderten 33.000 ISK und 3.000 ISK Spielerreserve. Er führt bis zu 30 Spieltage durch, meldet den letzten vollständigen Wirtschaftsstand und verlangt nachweisbar:

- originale 600-ISK-Miner-Rechnung, `npc3`-Eigentum, finanzierten Abbau und Verkauf;
- mindestens acht bezahlte J3-Bauteile und eine aus realen Ressourcen mit vollständig bezahlt geleisteter J4-Werftarbeit erstellte Hülle;
- unverfälschte NPC-Eigenbefehlslogs, unabhängigen Geld-/Waren-/Eigentums-/Save-Audit;
- **erst danach** einen ausdrücklichen originalen 900-ISK-`house`-Kauf aus dem echten J4-Werftlager. Der Test prüft physische Lagerentnahme, Käufer-/Verkäuferkassen, Eigentumsjournal, Hash/Save;
- Negativpfad: Ohne das zusätzliche P5-Opt-in bleibt der S02-Originalpfad ohne autonomen Siliziumverkauf.

Wenn die echte Finanzierung/Materiallogistik nicht ausreicht, muss der Test mit detailliertem Diagnosestand **rot** sein; fehlende Materialien, Kassen oder Auftragsrechte werden nicht durch neue Waren, Mint, Gratiswerftaufträge oder manipulierte Fixtures ergänzt.

## Abnahmebefehle

```sh
node --test tests/w6-p6-autonome-jaegerlieferkette.test.mjs
node --test tests/*.test.mjs
node scripts/build-w5-singlefile.mjs --check
```

**P6 wurde auf dem gemeinsamen P5+P6-Forschungs-Head `a44d2a8b` nochmals vollständig ausgeführt und bestanden.** Der nachfolgende reine Dokumentationsnachtrag ändert weder Wirtschaftsregeln noch Tests oder Referenzhashes. Siehe gemeinsames Schluss-Gate oben. Öffentliche Spielversion, `main`, JS-Module der P1-Spieloberfläche und gespeicherte Original-Spielstände bleiben bytegleich. Keine iPad-Safari- oder NAS-Geräteabnahme.

## Geltungsgrenzen

Selbst ein positiver 30-Tage-Test beweist nicht, dass der S02-NPC-Jägerkreislauf unbegrenzt nachhaltig ist: Der vorhandene J2b-Siliziumvorrat ist **16 Einheiten** (höchstens zwei Jäger bei ursprünglichem 8-Bauteil-Rezept), die W6-Werftreserve und die Firmenpolitik sind nicht produktiv freigegeben. Der positive Test wäre ein **begrenzter finanziell-physischer End-to-End-Nachweis**, keine Entscheidung über Geldmodell, Industrieexpansion, NPC-Konkurrenz oder Produktaktivierung.
