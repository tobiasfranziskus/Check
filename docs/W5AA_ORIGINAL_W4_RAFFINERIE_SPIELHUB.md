# W5aa – Original-W4-Raffinerie im gemeinsamen W0–W4-Spielhub

> **[DRAFT / INTEGRATION / ANALYSE, 09.11.2026]** W5aa baut ausschließlich auf dem gestapelten [W5z-Fracht-Nachweis #270](https://github.com/tobiasfranziskus/Check/pull/270) auf. Wirtschaftskern aus **[Original-W4 #169](https://github.com/tobiasfranziskus/Check/pull/169)**, Regel 18 / Schema 8. **Kein Merge nach main, kein GitHub-Pages-Deployment, keine Produktmigration, keine Änderung produktiver Save-Slots.** Die zentrale verbindliche Roadmap ist weiterhin `docs/ROADMAP.md` auf `main`.

## 1. Ergebnis und Reproduzierbarkeit

Die gesamte Daten-/Core-Sektion aus dem feststehenden [Original-W4-Commit `112682b1ca23d32ed5e71a65f2093e774dfccfe8`](https://github.com/tobiasfranziskus/Check/commit/112682b1ca23d32ed5e71a65f2093e774dfccfe8) wurde **inhaltlich unmodifiziert** kopiert: **129.857 UTF-16-Quellcodezeichen** zwischen `const m_data_systeme =` und `const m_data_oberflaeche =`. Derselbe deterministische `m_core_index` führt W0-Buchungen, W1-Miner, W2-NPC-Gesellschaften, W3-Fracht und W4-`stationRefine` aus. Kein eigener Tick, kein neuer Export- oder Kaufprozess im UI.

Forschungs-Einstieg **`prototypes/w5aa/index.html`**. Gemeinsam bedienbar bleiben: Konzernzentrale, Station, NPC-Konzern- und Marktansicht, eigene Miner-Käufe/Erzförderung und schematisches 2D-Minerschiff, echter W3-Frachterkauf/Erztransport und neuer W4-Reiter. Originalwerte und Belege werden nur aus `createW4State`, `loadW4`, `execute`, `advance`, `pilotW3Stand`, `pilotW4Stand`, `pilotW4Kalkulation`, `pilotWirtschaftsStand` und `audit` abgerufen.

W4-Rezeptparameter aus **Original-Draft #169**, nicht neu beschlossen: **10 echtes Erz → 5 Material** mit **20 Minuten bezahlter Arbeit à 1 ISK**. Material entsteht **erst nach vollständigem Erfüllen**, nicht bei Vertragsstart. Nadir zahlt aus seiner *eigenen*, endlichen Stationskasse; ein separater Arbeitsfonds `arbeitskraefte_nadir` erhält tatsächlich das Geld.

## 2. Originalfinanzierung und Eigentumsrechte

| Original-W4-Stand | Tick | 50er-Transporte abgeschlossen | Verarbeitetes Erz | Material im Lager Nadir | Nadir frei | Raffineriearbeit bezahlt |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Erste physische W3-Ankunft, während Frachter zurückfliegt | 110 | 0 (1 Lieferung) | 0 | 0 | 3.260 ISK | 0 ISK |
| Erste vollständig bezahlte W4-Charge (W3-Rückflug läuft) | 130 | 0 (1 Lieferung) | 10 | 5 | 3.240 ISK | 20 ISK |
| Fünf vollständig bezahlte W3-Rundfahrten | 650 | 5 | 0 | 0 | 300 ISK | 0 ISK |
| Danach 15 echte W4-Chargen, Arbeitsgeld ausgeschöpft | 950 | 5 | 150 | 75 | 0 ISK | 300 ISK |

Je W3-Fracht werden **740 ISK Nadir-Käufergeld** gebunden: 500 ISK realer Erzpreis plus 240 ISK Frachterentgelt; die Spedition reserviert zusätzlich **120 ISK** eigener Arbeitsmittel. Nach fünf Fahrten: 250 wirklich gelieferte Erz, Nadir bezahlt **3.700 ISK** (4.000 → 300). Die Spedition hat **1.850 ISK** nach realem Hüllenkauf und vollständig bezahlten Hin-/Rückflügen. **Sechste Fracht verweigert** bei nur 300 ISK Nadir-Reserve gegenüber benötigten 740 ISK, obwohl Erz, Frachter und Mittel anderer Eigentümer existieren.

Nadir besitzt 250 eingekaufte Erz und kann bei 300 ISK **exakt 15 weitere Produktionschargen** finanzieren. Das kostet 300 ISK an Arbeitslöhnen, verbraucht 150 Erz und erzeugt 75 Material. Danach bleiben 100 Erz und 75 Material im Nadir-Lager, aber **0 ISK Arbeitskapital**. Die 16. Produktionscharge wird ohne Nebenbuchung abgewiesen. Aus 75 Material wird **keine** Liquidität: W5-Materialkäufer, Hüllen-/Modulproduktion und reale Weiterveräußerung sind ausdrücklich noch nicht angeschlossen.

**Kostenmaßstab für W5 [ANALYSE]:** Beim bisherigen finanzierten W3-Rezept kosten 50 Erz am Ziel 500 + 240 = 740 ISK; die direkte Input-Beschaffung beträgt **14,80 ISK/Erz**. 10 Erz ergeben 5 Material und kosten anteilig 148 ISK plus 20 ISK Raffinerielohn = **168 ISK pro 5 Material / 33,60 ISK je Material**. Dieser *direkte historische Cash-Aufwand* enthält **keine** Wartung, Hüllenersatz, Kapitalkosten oder Vertriebskosten und ist **kein beschlossener Mindestpreis**. Auch ein hypothetischer W5-Verkauf darf nur bei tatsächlichem Käuferkapital stattfinden.

Globale unveränderte Geldsumme im Test: **33.000 ISK, Mint 0**. Zeit und Warenherkunft werden vom Original-Core geprüft. Bilanzneutrale Fremdkonto-Transfers werden von Original-Herkunftsaudits erkannt.

## 3. Qualitätsnachweise und Grenzen

- `tests/w5aa-original-w4-refinery.test.mjs`: Original-Regel18-Herkunft; echte W3-Lieferung und während der Rückfahrt gestartete, vollständig bezahlte W4-Produktion; Seed42/7-Hash und Save/Load/Replays; **13 RNG-Seeds × 5 echte Rundfahrten × 15 tatsächlich bezahlte Produktionschargen = 65 Frachten + 195 Chargen**, alle ursprünglichen Geld-, Waren-, Eigentümer-, Transport-, Material- und Arbeitstreuhand-Audits; sechste Fracht/16. Produktion wegen echter Kaufkraft abgelehnt; Bilanzfälschungs- und Importprüfungen.
- `tests/w5aa-w4-90d-matrix.test.mjs`: **13 Seeds × 90 Tage** mit zuvor physisch gelieferter 50-Erz-Charge und mindestens einer real bezahlten W4-Produktion, täglichen W3/W4-Gesamtaudits, Tag-für-Tag-Hash-Replay und Save/Load. **Dies sind nur RNG-Varianten, nicht 13 verschiedene wirtschaftliche Stress-/Krisenregime**; ein 90-Tage-Replay ist kein Nachweis zahlender Material-Endkunden.
- `tests/w5aa-touch.py`: Chromium/Playwright auf **1180×820, 1024×768, 820×1180, 390×844** mit echten W3-Fracht-/W4-Lohn- und Materialbelegen, abgewiesenen Rule17- und gefälschten Rule18-JSON-Importen, unverändertem `localStorage`-Sentinel und vollständigem Reload-Schutz.
- `.github/workflows/w5aa-integration.yml`: Node22 vollständige JS-Regression plus vier Touchgrößen. **Die Ergebnisse sind erst nach abgeschlossener CI aussagefähig.**

Korrekte Abgrenzung: Browser-Reiter sind lesende Operatoroberflächen auf **genau einem W4-Core**, keine eigenständige Wirtschaft. 2D zeigt bisher einen Miner, **keine fertig steuerbare 2D-Frachter- oder Raffineriepilotensicht**. Die 20-Minuten-Taste verändert Zeit ausschließlich durch den Original-W4-Core. Kein `localStorage`, IndexedDB oder neue Game-Slots für W5aa; JSON ist nur expliziter Import/Export. Ein Reload startet eine neue W4-Forschungswelt; produktive Browserdaten bleiben unangetastet. **Safari auf einem echten iPad und NAS sind noch nicht abgenommen.**

## 4. Folgeschritt [OPTION, keine Freigabe]

Die **75 Material sind physische, auf dem Nadir-Lager verbuchte Güter, aber noch kein Absatz**. Ein W5-Anschluss muss erst einen konkret zahlungsfähigen Käufer, die vollständig aus echtem Material und vorfinanzierter Arbeit hergestellte Hülle/Module, Eigentumsübergang und Beleg nachweisen. Das bereits bestehende Original-W5-Forschungsmodul [#170](https://github.com/tobiasfranziskus/Check/pull/170) ist zu prüfen; nicht automatisch Produktmechanik oder weitere ISK-Einspeisung übernehmen. Stresstests mit verschiedenen tatsächlich **wirtschaftlich unterschiedlichen** Startkapitalien/Käuferregimen bleiben offen.
