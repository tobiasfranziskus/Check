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

**P6 wurde auf dem vorgenannten Test-/Code-Head tatsächlich ausgeführt und bestanden.** Dieser spätere reine Dokumentationsnachtrag ändert keine Wirtschaftsregeln, Tests oder Referenzhashes. Die tatsächlichen CI-Ergebnisse sind oben mit Prüf-Head und Link ausgewiesen. Öffentliche Spielversion, `main`, JS-Module der P1-Spieloberfläche und gespeicherte Original-Spielstände bleiben bytegleich. Keine iPad-Safari- oder NAS-Geräteabnahme.

## Geltungsgrenzen

Selbst ein positiver 30-Tage-Test beweist nicht, dass der S02-NPC-Jägerkreislauf unbegrenzt nachhaltig ist: Der vorhandene J2b-Siliziumvorrat ist **16 Einheiten** (höchstens zwei Jäger bei ursprünglichem 8-Bauteil-Rezept), die W6-Werftreserve und die Firmenpolitik sind nicht produktiv freigegeben. Der positive Test wäre ein **begrenzter finanziell-physischer End-to-End-Nachweis**, keine Entscheidung über Geldmodell, Industrieexpansion, NPC-Konkurrenz oder Produktaktivierung.
