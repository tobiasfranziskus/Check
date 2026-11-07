# Aphros Void – belegter technischer Projektstatus

> **[MAIN / verifiziert 07.11.2026]** `main` vor dieser rein redaktionellen Bereinigung: [`5a56d9d7`](https://github.com/tobiasfranziskus/Check/commit/5a56d9d7e94a2ad283684b7b912c8b56ca96af53), **v0.12.5 / Regel14 / Schema8**. Keiner der Wirtschafts-R32- oder W5u-Forschungsstände ist in den produktiven Core integriert. Die unverändert historische Statusdatei bleibt unter [`5a56d9d7`](https://github.com/tobiasfranziskus/Check/blob/5a56d9d7e94a2ad283684b7b912c8b56ca96af53/docs/PROJEKTSTATUS.md) und `git show 5a56d9d7e94a2ad283684b7b912c8b56ca96af53:docs/PROJEKTSTATUS.md` erhalten. **Produktpriorität:** [ROADMAP.md](ROADMAP.md); [PR-Index](README.md), [Entwicklungsregeln](../AGENTS.md).

## 1. Integrationsstand und schützenswerte Versionen

| Teil | Nachgewiesener Stand |
| --- | --- |
| **[MAIN / Produktkern]** | 533.655-Byte-`index.html` des bisherigen Hauptstands, v0.12.5 / Regel14 / Schema8. Die 07.11.-Reposäuberung ändert weder `index.html` noch Tests, Fixtures, Save-/UI-Logik, Waren, Schiffe, Preise, Regeln oder Builds. |
| **[MAIN / Altversion]** | `versionen/v0.12.5/index.html` und [`backup/pages-v0.12.5-20261106`](https://github.com/tobiasfranziskus/Check/tree/backup/pages-v0.12.5-20261106) vorhanden. Keine durch die Bereinigung veröffentlichte neue W5-Spielversion. Der W5-Releasevorschlag in [PAGES_SPIELTEST.md](PAGES_SPIELTEST.md) war ausdrücklich noch nicht live abgenommen. |
| **[DRAFT/ANALYSE / Wirtschaft]** | Forschungsstack von [#161 W0/W1](https://github.com/tobiasfranziskus/Check/pull/161) bis [#243 W5s-ao](https://github.com/tobiasfranziskus/Check/pull/243), isolierter R32/Schema8, Stand Head `e921fd29`. Kern, Löhne, Exporte, Verschleiß und Nachfolger sind **nicht** als Produktregel freigegeben. |
| **[DRAFT / UI]** | Legacy-Hub [#203](https://github.com/tobiasfranziskus/Check/pull/203) → lesender Adapter [#207](https://github.com/tobiasfranziskus/Check/pull/207) → [#234 W5u](https://github.com/tobiasfranziskus/Check/pull/234), Head `94753a12`, **unveränderter Regel14-Core** in einer separaten UI-Vorschau. Ein W5u-Forschungs-Slot ist keine R32-Wirtschaftsintegration. |
| **[DRAFT / Legacy-Vorschauen]** | #186 Fitting, #187 Station, #189 Pilotenakte, #195 Scanner und #198 Konzernzentrale; weder blind mergen noch vor belegter Übernahme/Abnahme löschen. |
| **[PR-Bestand]** | **76 offene Draft-PRs** am Beginn dieser Bereinigung: überwiegend zwei abhängige Wirtschafts-/UI-Stacks. Ein geschlossenes Zwischen-PR aus einem Stack ist kein kostenlos entfernbarer Code; Branch/Commit/Git-History bleiben Beweisquelle. |
| **[ABNAHME OFFEN]** | iPad-Safari/WebKit, reales NAS, separater Browser-Save/Import/Export und tatsächliche GitHub-Pages-Spielversion – keine CI erlaubt, dies als reale Gerätetestfreigabe zu behaupten. |

## 2. Erreichter Forschungsstand – nur DRAFT

| Phase / PR | Tatsächlicher Befund, keine Produktfreigabe |
| --- | --- |
| **W0/W1 #161/#164** | Vorfinanzierter Erzpilot, bezahlter Miner, Lieferung und Rückerstattung; 2D-Miner liest dieselben Core-Daten. Zwei 600-ISK-Miner nach 2d je 7.800 ISK Überschuss nach Förderkosten und Anschaffung im begrenzten Pilottest; ursprünglicher Endkäufer hat danach 0 ISK. Kein dauerhafter Endabsatz |
| **W2 #165–#167/#171** | Reale NPC-Firmenkassen, kapitalgedeckter Schiffskauf, Nachfrage-/Arbeitsstopps, gesonderte Regel16-Saves; keine individuelle Rettung |
| **W3/W4/W5 #168–#170** | Echter bezahlter Erztransport Aldera–Nadir, Raffinerie Erz→Material und material- sowie lohngedeckter Frachterbau |
| **W5b–W5f #173–#181** | Bezahlter Bauteil-/Jägerbau, Jägerkämpfe/Verluste, 2D-Frachter, gemeinsame Forschungswelt, aus bestehenden Geldmitteln bezahlter Pilotlohn/Kopfgeld und erster MK1-Laser |
| **W5g–W5m #183–#192** | Belegter Jägerersatz und reales NPC-Finanzierungsdefizit; Verkauf/Kaufkraftkonkurrenz, offene eigene Erzförderung ohne künstliche 50-Erz-Auftragsgrenze und aus Erz/Lohn bezahlter MK1-Bohrkopf. Verkauf bleibt begrenzt |
| **W5n #193** | Eis→bezahlter Frachter→Wasser; 100 verkaufte Wassereinheiten für 1.400 **vorhandene** ISK im Pilotversuch, danach Endkundenbudget erschöpft |
| **W5o #194** | Nur aus wirklich bezahlten Löhnen/realisierten NPC-Gewinnen finanzierter Haushaltsrückfluss: Seed42 90d bei vollständigem Rückfluss **4.316/4.320 Wasser**, bei NPC-Miner-Sparen **789**, Spieler-Miner-Sparen **733**. Keine neue ISK |
| **W5p #196** | Lesende Kaufkraftdiagnose: Spar-NPC letzter Verkauf in Stunde397, am Tag90 physischer Wasserbestand bei Verbraucher-Kassenmangel; kein pauschaler Emissionsbedarf aus nominell entgangenen Umsätzen ableitbar |
| **W5q #197** | Physisch buchbarer externer Wasserexport als isoliertes R31-Profil, global begrenzte **Testemission**, Default **OFF**. Seed42 Sparfall 365d ohne Export **789 Wasser**, mit maximal 3.500 ISK Testexport/Haushaltsüberweisung **1.872**, bei 7.000 ISK **2.775**; keine nachgewiesene dauerhafte Krisenfestigkeit |
| **W5r #200** | Isolierte R32-Verschleiß-/Ersatz-/Wartungsbasis; ursprünglicher Verlust- und Lagerengpass im frühen Forschungsstand, später um echte Werftkäufe/Transportwege im W5s-Stack erweitert. Hypothetische 15-/30-Tage-Lebensdauern weiterhin **nicht beschlossen** |
| **W5s #202–#242** | Reale bezahlte Hüllen/Überführung/Fracht-/Wartungs-/Lohnpfade, unabhängige Gesellschaften, physische Wasserexporte und Eigentümer-/Kostenprüfung. **Kein** Erfolg für den nachhaltigen, breit nachgefragten Geldkreislauf. |
| **W5s-ao #243** | Integrierte Gesamtmatrix mit **52×90 Tage** (13 Basisseeds + 39 Eigentums-/Sparvarianten) und **6×730 Tage** (Seed42/7 ohne Export / Export 7 / Export 14 ISK). **3/3 gezielte Gruppen bestanden**, Wirtschaft **nicht** stabil. |

**[ALTERNATIV / ARCHIV #199]** Verschleiß nach 600 echten Förder- und 2.400 echten Flugminuten; Schrottobjekte statt entfernten Schiff-IDs und Wartung nach Produktionsminuten mit **2 realem Eis + 20 ISK Arbeit**. Diese Variante ist **nicht** mit #200 identisch, trotz gleicher Forschungsnummer R32. Keine Gleichsetzung ihrer Ergebnisse/Hashes und **keine** bestätigte Überlegenheit eines Modells.


## 3. Geld- und Wirtschaftsrisiken – neue Gesamtsicht

**[TEST/ANALYSE · W5s-ao #243]** Der Original-R32-Core ist in den geprüften Szenarien geld-, waren-, vertrags- und eigentümerbilanziell korrekt, wirtschaftlich aber **nicht** langfristig tragfähig:

- **Endnachfrage:** In Krisenseeds 42 und 7 jeweils letzter tatsächlich bezahlter Wasserverkauf **Tag209** ohne Außenexport, **Tag303** mit 14-ISK-Stationsexport und **Tag393** mit 7-ISK-Stationsexport; keine Variante bis Tag730 wirtschaftlich wieder angelaufen. Eine Wassereinheit kostet den Modellhaushalt 14 ISK; nach Ende der Aktivität besitzt er 8 / 3 / 11 ISK.
- **Globales Geld ist nicht verfügbares Geld:** Bei 7 ISK und Tag730 existieren exakt **40.000 ISK** (33.000 Anfangsgeld + 7.000 belegte einmalige W5q-Forschungsemission), davon **17.786 Export-/Handels-ISK**, **8.200 Werft-ISK**, **6.673 Stations-ISK**, aber nur **600 ISK** beim ursprünglichen Frachterbetreiber gegenüber **930 ISK** finanziellem Ersatzbedarf. Fremde Guthaben sind kein rechtmäßiges Eigenkapital.
- **Wirtschaftlicher Verschleiß:** In allen sechs Langzeitwelten **0 Frachter** und **0 frei kaufbare W5-Frachterhüllen** an Tag730. Die W5r-`bought`-Zähler decken nicht alle W5s-/W5-Käufe ab; diesen Unterschied niemals als fehlende Verkäufe missdeuten.
- **Eigentümer-/Sparachse:** Bei Tag90 4.316 bezahlte Wasser in vollständigem NPC-Gewinnkreislauf, 1.421 bei `npcSave`, 510 im `wages`-Modus und 834 bei Spieler-Miner. **Alle 13 RNG-Seeds je Profil haben dieselben Wirtschaftswerte, jedoch unterschiedliche Hashes.** 13 Wiederholungen ersetzen keine unterschiedlich parametrisierten Krisen.
- **Exportkosten:** Physische 50er-Wassercharge verursacht direkt **590 ISK** (250 Eis, 240 Transport, 100 Fabriklohn), also **11,80 ISK je Wasser** vor Wartung/Verschleiß. 7 ISK Exportpreis bringt **−4.800 ISK** direkten Beitrag auf 1.000 Wasser, 14 ISK **+1.100 ISK** auf 500 Wasser. Keine neue Stationsaktie, kein rechtmäßiger Exportüberschuss-Dividendenanspruch. Bestehende W5o-Gewinnzahlungen dürfen nicht verdoppelt werden.

**[BESCHLOSSEN]** Spieler darf sparen, NPCs dürfen scheitern, keine Gratisrettung, keine erfundenen Beschäftigungs- oder Verkaufsaufträge. Geldmodell B erlaubt neue ISK nur nach **gesonderter Produktfreigabe konkreter Emittenten-, Leistungs-, Rate-, Empfänger- und Weltbudgetregeln**. Alle W5q-Emissionen sind bislang nur isolierte Forschungsparameter, standardmäßig aus.

## 4. Ausgeführte Tests und Abnahmen

| Status | Beleg und Grenze |
| --- | --- |
| **[MAIN / Testpflicht]** | Originale Node-22-Tests im Hauptrepo: `node --test tests/*.test.mjs`. Alte unabhängige Release-/v10–v14-Referenzen bleiben vorhanden und unverändert. Diese redaktionelle Bereinigung führt keinen W5-Wirtschaftstest auf `main` ein. |
| **[TEST / R32-Gesamtanalyse]** | [#243 / Node22-Lauf #42422215632](https://github.com/tobiasfranziskus/Check/actions/runs/42422215632) **3/3 integrierte Tests, 0 Fehler/Skips**: 58 echte Welten, regelmäßige Core-/Waren-/Eigentümeraudits, Save-/Load-/Hash-Kontrollen. **Technisch erfolgreich, wirtschaftlich nicht tragfähig.** |
| **[TEST / W5s-an]** | [#242 / Node22-Lauf #42417686686](https://github.com/tobiasfranziskus/Check/actions/runs/42417686686): **4/4** gezielte Core-Kosten-/Eigentumsprüfungen bestanden. |
| **[TEST / W5s-am]** | [#241 / #42404431102](https://github.com/tobiasfranziskus/Check/actions/runs/42404431102): **464/464** vollständige Einzeltests vor späterer Gate-Ergänzung, [#42411793939](https://github.com/tobiasfranziskus/Check/actions/runs/42411793939) **3/3** ergänzte gezielte Tests. |
| **[DRAFT / UI]** | [#234 W5u](https://github.com/tobiasfranziskus/Check/pull/234): separate Legacy-Hub-Vorschau mit Original-Regel14; berichtete 120/120 Tests und vier Chromium-Touchgrößen. Dies ist **keine** WebKit-/iPad-/NAS- oder R32-Freigabe. |
| **[OFFEN]** | Die vollständige Repository-Regression auf allen jüngsten Dokumentations-Heads wird getrennt beurteilt. Kein produktiver W5-/R32-Release, keine geklärte nachhaltige Geldmodell-B-Regel, keine echte iPad-Safari- oder NAS-Abnahme. |

## 5. Nächste technische Entscheidungen und Pflege

1. **[OPTION / Wirtschaft]** Ein legal finanzierter tatsächlicher Endkunde und eine vollständige, an reales Käuferbudget gebundene Folge-Nachfrage; keine Rückkehr zu Gratis-NPC-Haushaltszuflüssen.
2. **[OPTION / Konzernnachfolge]** Freiwilliger Investor, reale freie Hülle, vollständige Kauf-, Material-, Flug- und Arbeitsreserve und echte bezahlte Frachtkunde. Kein automatisch garantierter Ersatz bei Insolvenz.
3. **[OPTION / UI und Gameplay]** Getrennte iPad-Safari-/NAS-/Save-Abnahme des W5u-Regel14-Hubs; R32 nicht ohne Finanz- und Migrationsnachweis aktivieren.
4. **[MAINTENANCE]** Offene gestapelte PRs erhalten, bis Nachfolger, Belege und Basen geprüft sind. Veraltete **unabhängige** Dokumentations-PRs erst nach nachweislicher redaktioneller Übernahme schließen. 39 branch-lokale CI-Workflows sind kein Zustand von `main` und dürfen nicht aus Angst vor CI-Last blind auf den Produktbranch gemergt werden.
5. **[FREIGABE]** Keine Gameplay-Merges, keine Änderungen an `index.html`, Versionsarchiv, Spielständen, Rule- oder Schema-Nummern durch diese Repo-Bereinigung.

### Unveränderliche Quellen

Vollständiger [PROJEKTSTATUS.md vor der 07.11.-Bereinigung auf main](https://github.com/tobiasfranziskus/Check/blob/5a56d9d7e94a2ad283684b7b912c8b56ca96af53/docs/PROJEKTSTATUS.md), vollständig rückholbar mit `git show 5a56d9d7e94a2ad283684b7b912c8b56ca96af53:docs/PROJEKTSTATUS.md`. Frühere historische [W5r-Forschungsfassung](https://github.com/tobiasfranziskus/Check/blob/8d6c1e7378b2d4b9f2fcec8de1157e7e5d522b03/docs/PROJEKTSTATUS.md). [Aktuelle Prüfdaten im Draft](https://github.com/tobiasfranziskus/Check/blob/feature/w5s-ao-gesamtwirtschaft-stresstest-20261107/docs/W5S_AO_INTEGRIERTE_WIRTSCHAFTSANALYSE.md). Ein Draft-Statusbericht ist keine neue verbindliche Roadmap.
