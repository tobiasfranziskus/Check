# W6/P6 – prüfbarer End-to-End-Vertrag für autonomen Jägerbau

**[ANALYSE / NICHT MAIN] · 15. November 2026.** Gestapelter Forschungsnachweis auf [W6/P5 #396](https://github.com/tobiasfranziskus/Check/pull/396), welcher auf [P4 #394](https://github.com/tobiasfranziskus/Check/pull/394) und dem stabilen S02-Forschungszweig beruht. Die bereits veröffentlichte J13a-Karriere und der separate J13b-PR #395 bleiben unverändert. Keine neue Wirtschaftsregel.

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

**Bei Erstellung noch keine Prüfungen auf diesem Branch abgeschlossen.** Testergebnisse und ggf. ehrliche Blocker erst nach tatsächlicher CI-Laufzeit berichten. Öffentliche Spielversion, `main`, JS-Module der P1-Spieloberfläche und gespeicherte Original-Spielstände bleiben bytegleich. Keine iPad-Safari- oder NAS-Geräteabnahme.

## Geltungsgrenzen

Selbst ein positiver 30-Tage-Test beweist nicht, dass der S02-NPC-Jägerkreislauf unbegrenzt nachhaltig ist: Der vorhandene J2b-Siliziumvorrat ist **16 Einheiten** (höchstens zwei Jäger bei ursprünglichem 8-Bauteil-Rezept), die W6-Werftreserve und die Firmenpolitik sind nicht produktiv freigegeben. Der positive Test wäre ein **begrenzter finanziell-physischer End-to-End-Nachweis**, keine Entscheidung über Geldmodell, Industrieexpansion, NPC-Konkurrenz oder Produktaktivierung.
