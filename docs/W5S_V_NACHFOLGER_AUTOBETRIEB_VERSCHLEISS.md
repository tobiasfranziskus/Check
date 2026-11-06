# W5s-v – autonomen Nachfolger nicht unsterblich machen

**[DRAFT/ANALYSE · 06.11.2026]** [Draft-PR #226](https://github.com/tobiasfranziskus/Check/pull/226), auf W5s-u #225 gestapelt. In der bereits bestehenden R32-Forschungswelt optional: \`rules.w5s.successorOperations=true\` nur zusammen mit \`independentSuccessor\` und \`successorFreight\`. Keine freigegebene neue Produktregel, kein Merge/Deployment. \`main 5a56d9d7\`, die GitHub-Pages-Spielversion, das historische Archiv und Nutzersaves bleiben unverändert.

## Kernergebnis

Eine vollständig finanzierte, eigene neue NPC-Spedition kann nun **ohne erneuten Spielerbefehl** bei Taktgrenzen ihren Frachter einsetzen. Das ursprüngliche W5o-Agentensystem hat zuerst Zugriff auf seine alte W5n-Transportbeauftragung; der Nachfolger beginnt nur, wenn dessen gemeinsames Ein-Auftrag-Treuhandkonto frei ist. Jede tatsächliche neue Fahrt wird ausschließlich mit einem erneut vom bestehenden Original-Core validierten \`shipReposition\` oder \`shipFreightIce\` ausgelöst; keine zweite Fracht- oder Buchungsengine.

1. Der neue Eigentümer hat zuvor 930 ISK privates Kapital eingezahlt und daraus eine real produzierte W5-Frachterhülle für 750 ISK erworben; die ursprüngliche Spedition bleibt unabhängig.
2. Bevor er von Nadir nach Aldera fliegt, hinterlegt die Firma 60 reale ISK Pilotenlohn. Erst nach 60 gearbeiteten Minuten ist sie im Eisquellsystem.
3. Eine Eisfracht wird **nur** automatisch ausgelöst, wenn die originalen W5n-Gates einen leeren eigenen Frachter in Aldera, 50 real vorhandene Eis im Lager, Aufnahmekapazität in Nadir, **490 tatsächlich verfügbare ISK beim zahlenden Stationskunden**, **120 ISK eigene Pilotenlohnreserve** und kein schon laufendes W5n-Eisgeschäft nachweisen. Zusätzliche Nachfrage-Gates verlangen einen stationären Eis-/Wasservorrat unter dem bisherigen W5o-Ziel und mindestens eine tatsächlich finanzierbare Stunde Wasserverbrauch beim Verbraucherhaushalt. Bei einem Blocker bleibt das Schiff stehen, ohne jemals ein Freiticket oder eine neue Forderung zu erzeugen.
4. Der neue Eigentümer erhält nur nach komplett ausgeführtem 120-Minuten-Hin-/Rückflug 240 ISK aus der vorhandenen W5n-Fracht-Treuhand. In \`state.w5s.successor.autoOrders\` werden die tatsächlich ausgeführten automatischen Aufträge chronologisch belegt; ihr Zeit-/Schiffs-/Eigentümernachweis wird auch ohne aktives Forschungsflag unabhängig auditiert.
5. Der Nachfolger erhält **dieselbe im bisherigen R32-Forschungsprofil angenommene 30-Tage-Lebensdauer für Frachter**, jetzt auch tatsächlich für seinen eigenen Schiffskörper. Nach Erreichen der Lebensdauer wird ein physisch existierendes, eigenes, leeres Schiff **nur bei einer Tagesgrenze und im Dock, nicht im laufenden bezahlten Vertrag** gelöscht und als \`state.w5s.successor.retired\` registriert. W5r-Lossbuch des Alttransporteurs, W5-Werft-Provenienz, Warenledger und bezahlte W5s-Überführung bleiben rechtlich getrennt und rechnerisch geprüft. Im Fall einer Ausmusterung kommt niemals automatisch eine neue Hülle ins Spiel.

## Ergebnis der aktiven Krisenwelten

**[TEST] Direkte autoritative Node-gleiche JS-Simulation ohne externe Weltmutation:**

| Kriterium | Seed 42 | Seed 7 |
|---|---:|---:|
| Physisch bezahlter zusätzlicher Frachter | \`sh017\` | \`sh017\` |
| Bezahlte eigene Überführung | 60 ISK | 60 ISK |
| Automatische Folge-Eisfahrten bis Ausmusterung | 1 | 1 |
| Geliefertes Eis aus echtem Quelllager | 50 | 50 |
| Bezahlt durch Nadir für Kauf und Fracht | 490 ISK | 490 ISK |
| Nachfolger-Pilotenlohn | 120 ISK | 120 ISK |
| Belegter Nachfolger-Frachterlös | 240 ISK | 240 ISK |
| Schiffsverschleiß / physische Entfernung | Spieltag 151 | Spieltag 151 |
| Verbleibende freie Nachfolgerkasse | 240 ISK | 240 ISK |
| Kapitalbedarf für Hülle, Überführung und Folgefracht | 930 ISK | 930 ISK |
| Fehlender Eigenkapitalbetrag | **690 ISK** | **690 ISK** |
| Echt verfügbare neue W5-Hülle in Nadir | 0 | 0 |
| Gratisfahrt / Gratisersatz / Geldemission | 0 | 0 |

Das Ausbleiben weiterer Eisaufträge trotz grundsätzlich vorhandener Pilotenmittel muss im Anschluss wirtschaftlich untersucht werden: Nachfrage und die zeitliche Verteilung von Versorgungsketten sind Engpässe, nicht künstlich begrenzte Erz-Angebote. Die Einzelfracht deckt die Kosten eines verlorenen Schiffes bei Weitem nicht.

## Prüfumfang

[TEST/CI] Eigener Node22-Workflow \`.github/workflows/w5s-v-nachfolge.yml\` für **13 × 90 Spieltage**, **Seed 42/7 × 365 Spieltage** ohne Gründungsbefehl (Referenzhashes \`131d982e273bcd67\` und \`e05c12e808d4b859\`), beide positive 35-Tage-Nachfolgekrisen mit echten W4/W5-Baustufen, automatischer Überführung und Lieferung, am Original-Core auditiertem Rechtsinhaber sowie eigenem realem Verschleiß, wiederholte Hash- und Save/Load-Prüfungen, deterministische Doppelläufe, Manipulationsschutz bei Schiffsverlust-, Geld- und Frachtbelegen sowie ausdrückliche OFF-Flag-Regressionsprobe. Ergebnisse am finalen GitHub-CI-Head prüfen und nur tatsächlich bestandene Gruppen als grün berichten. Safari/NAS weiterhin nicht aus CI ableitbar.

## Produktgrenze und nächster Schritt

**[ANALYSE] Kein selbsttragender W6-Dauerbetrieb.** Die erste neue Firma kann zwar rechtmäßig verdienen, erleidet im realen Nachfragepfad aber nach 30 Tagen einen Schiffskapitalverlust, ohne auch nur annähernd 930 ISK für die nächste komplette Frachtergeneration erwirtschaftet zu haben. Die lesende Folgeinvestitionsprüfung meldet echten Geldmangel UND fehlenden physischen Werftbestand. Selbst bei hypothetisch ausreichender Kasse entsteht kein Werftschiff ohne bezahlte W4-/W5-Fertigstellung.

**[OPTION · W5s-w]** Der nächste Versuch sollte ein tatsächlich finanziertes, selbstständiges Folgeersatzbuch (mit Schiffs-ID, Werftzahlung, ausgebuchter Hülle und neuen 60+120 ISK Arbeitsreserven) und eine Ursachenprüfung des Kundenbudgets bzw. des Versorgungskanals entwickeln. Keine stärkeren künstlichen Eis-/Erz-Limits, keine Gratisrettung und keine automatische Inflation beschließen.
