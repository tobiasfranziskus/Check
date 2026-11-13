# K10 – Dritte bis achte finanzierte Industrie-Erz-/W4-/W5-Runde und reale Liquiditätsbrücke

**[DRAFT / ANALYSE · 13.11.2026]** [PR #325](https://github.com/tobiasfranziskus/Check/pull/325) stapelt auf [K9 #324](https://github.com/tobiasfranziskus/Check/pull/324) (K8 #323, K7-Isolation #322). Unveränderter Original-Weltkern mit isolierter Regel200, originale W1–W5-Preise und Firmenrechte. Keine produktive Anpassung von `index.html`, `aphros-void.html`, Regel195, Schema8 oder realen Speicherständen.

## Prüffrage und Methode

Kann ein **dritter und weiterer** Industriezyklus auf einem tatsächlich **abgeschlossenen K9-Zweitbau-Endzustand** ohne neue ISK, Gratis-Hüllen, Scheinverträge oder Schiffsteleporte weiterlaufen? K10 rekonstruiert die reale K4/K5-Krise bei Tick 21612 je Seed 42/7, bezahlt zuerst K7-Vertrag 1, dann K8/K9-Vertrag 2, kauft drei existente W5-Lagerhüllen bei pausierter automatischer Ersatzbeschaffung mit echtem Eigentumspreis und jeweils echtem Überführungslohn und erzeugt wiederholbar die vollständig geprüfte K9-Zwischenwelt. Anschließend 130 echte Spielminuten und iterativ **signierter** Industrieerzertrag 3 bis 7; zuletzt aus dem realen 7.-Runden-Lagerbestand eine **alternative achte finanzierte W3-Rundfracht** zur Entdeckung rechtmäßiger zusätzlicher Speditionsliquidität.

Jeder neue W1/W3/W4/W5-Zyklus benutzt exakt die vorhandenen Eigentümerbefehle `industrialOreOffer`, getrennte `AcceptMine`, `AcceptFreight`, `AcceptYard` und `Commit`, die Original-W1-50-Erzförderung, echte W3-Hin- und Rücktransporte, einmaligen 740-ISK-W3-Käuferaufwand plus 120-ISK-Arbeits- und 530-ISK-Werfttreuhand, genau ein W4-Originalrezept **10 Erz → 5 Material** mit **20 ISK** tatsächlichem Raffinerielohn und originalen W5-30-Arbeitsminuten mit **30 ISK** bezahltem Werftlohn. Jeder erlaubte Kauf kostet die Spedition **750 ISK**, jede Überführung **60 ISK** für 60 tatsächlich ausgezahlte Flugminuten.

## Tatsächlich ausgeführte K10-CI

- [Erster gezielter Lauf #43396216388](https://github.com/tobiasfranziskus/Check/actions/runs/43396216388): **2/2 Node22-Testfälle bestanden** auf Codehead `fbbedb83`, noch ohne Liquiditätsbrückenversuch. Seeds 42 und 7, 4 zusätzliche volle W5-Käufe.
- [Verschärfter gezielter Lauf #43396819334](https://github.com/tobiasfranziskus/Check/actions/runs/43396819334) auf Test-Codehead `870b4ac4`: **2/2 Node22 bestanden, keine Fehler, keine übersprungenen Fälle**. Auch der alternative vollständige 8. Vertrag mit nachfinanziertem echtem Lagerkauf ist geprüft. Beide Seeds sind unabhängig simuliert und auditiert.
- Dazwischen [K10-Zwischenlauf #43396629878](https://github.com/tobiasfranziskus/Check/actions/runs/43396629878) **rot durch eine falsche neue Testannahme**: Der Werftbestand enthält bereits eine historisch produzierte unverkaufte Hülle; nach Runde 7 liegen **2** und nicht **1** Hüllen physisch im Lager. Die Original-W5-Bücher waren korrekt; Testannahme und Dokumentation wurden an `w5.fertig-w5.verkauft===2` angepasst. Nie Waren/Geld hinzugefügt oder W5-Verkaufsbelege erfunden.
- **[CI-ABGRENZUNG]** Übergreifende Node22, K1–K10-Workflowjobs, ältere 13×90/365/730-Tage-Szenarien, JavaScript-Regression und Chromium/WebKit laufen getrennt; nachfolgende reine Dokumentationscommits erfordern erneute Prüfung des aktuellen PR-Heads. Nur tatsächlich grüne Läufe als bestanden bezeichnen.

| Belegte Folgezyklen | Seed 42 | Seed 7 |
| --- | --- | --- |
| Runde 3: `sh025` neu verkauft und nach Aldera bezahlt überführt | ja | ja |
| Runde 4: `sh026` | ja | ja |
| Runde 5: `sh027` | ja | ja |
| Runde 6: `sh028` | ja | ja |
| Runde 7: 50 Erz, 5 Material und neuer W5-Bau **ohne** sofortigen Kauf | ja | ja |
| Runde 7: Speditionsbudget gegenüber 750 ISK Kaufpreis | **736 ISK, minus 14** | **736 ISK, minus 14** |
| Folgevertrag 8: weiterer echter W1-/W3-Transport (50 Erz), 120 ISK realer Frachtumsatz | ja | ja |
| Speditionsbudget nach 8. realer Fracht | **856 ISK** | **856 ISK** |
| Danach: Kauf einer schon vorhandenen physisch gelagerten Hülle zu 750 ISK | `sh029` | `sh029` |
| Bezahlter Transfer dieser Lagerhülle | 60 Min., 60 ISK | 60 Min., 60 ISK |
| Runde 8: zusätzliches Material und vollständig bezahlter neuer W5-Bau | **5 Material, 1 Hülle** | **5 Material, 1 Hülle** |
| Unverkaufte W5-Hüllen im Lager nach Runde 8 | **2** | **2** |
| Weltgeld / Geldschöpfung / Vernichtung | **33.000 / 0 / 0 ISK** | **33.000 / 0 / 0 ISK** |
| K10-Brückenreferenzhash | `71103a524b467faf` | `9a5c14b10e15a5f4` |

**Wichtig:** Der siebenmalige beziehungsweise achte W5-Bau erzeugt einen realen **fungiblen Lagerbestand**; beim Kauf wird zwar erst eine neue Schiff-ID `sh029` aus einem physisch vorhandenen Werftfrachter ausgegeben, das Original-W5-Lager führt aber **keine Seriennummern je fertigem, noch unverkauftem Bau**. Man kann daher nicht rechtmäßig behaupten, `sh029` sei ganz genau die Hülle des siebten Baus. Nach Kauf einer vorhandenen Hülle und anschließendem achtem Bau stehen wieder zwei unverkaufte Hüllen im Lager. Die Waren- und Eigentumsbuchungen sind mengenmäßig korrekt, keine individuell zugeordnete Chargenprovenienz.

## Finanzierungs- und Kettenaudit

Die zusätzliche 8. W3-Fracht bedeutet **keine Kapitalzuführung**: Spedition verdient beim Originaltransport 120 ISK durch einen aus einer anderen vorhandenen Firmenkasse vollständig finanzierten Dienstleistungsauftrag. Von **736 ISK** vor der Leistung steigt sie auf **856 ISK**; danach sind 750 ISK realer Frachterkauf und 60 ISK Pilotenlohn möglich. Die neue 8. Hülle ist zwar vollständig finanziert und hergestellt, **wird aber nicht verschenkt oder unrechtmäßig verkauft**; sie verbleibt im Lager. Explizit getestete atomare Ablehnung, solange `transport.cash<750`, und wiederholte Ablehnung des nächsten ungedeckten Kaufs. Ebenso voller originaler `w.audit`, unabhängiger W4-Rezept-/W5-Lohn-/Ledgercheck, 33.000 ISK unter allen Bedingungen, Mint/Burn0, Save/Load-Roundtrip und 50–70-Minuten-Hash-Replays.

Der ursprüngliche 14-ISK-Kaufstopp ist **also ein durch einen zusätzlichen realen Auftrag überbrückbarer Liquiditätsengpass**, kein endgültiger mathematischer Produktionsstillstand. Der längerfristige Engpass bleibt **Käuferbudget und physischer Lagerabsatz**: Für den achten neu gebauten Frachter ist der Speditionskauf erneut nicht gedeckt. Ein zweiter Käufer ist nicht automatisch verfügbar und darf nur bei nachgewiesenem Vertrag, Zahlungsfähigkeit und Eigentümerberechtigung eingesetzt werden.

## Grenzen / nächste Forschungsfrage

- Die Politik `ersatzkauf:false` und `eisfracht:false` ist ein legaler, gezielter Eigentümerentscheid im Forschungsversuch, **keine Standard-NPC-Automatik**. Hier liegt kein autonom nachhaltig geschlossener W6-Warenkreislauf vor.
- 8 Serienverträge belegen keine Dauerwirtschaft, keine allgemeine Waren-/Werft-/Transportkapazität und keine echte Frachter-Nachfrage nach beliebig vielen neuen Rümpfen. Original-W4-Waren sind fungibel; eine individuelle Erz-Chargenidentität existiert ebenfalls nicht.
- Ein späterer Regelvorschlag braucht rechtmäßig finanzierte Nachfrage, Schiffsersatz bei tatsächlichem Verschleiß und Insolvenzszenarien, unabhängige Audits, 13×90 sowie 365/730 Tage, tatsächliche Touch-/WebKit-Prüfung und iPad-Safari-/NAS-Abnahme. Keine künstlichen Exporterträge oder Überbrückungstransfers zulassen.

**[NÄCHSTER PRÜFSCHRITT / OPTION]** Die zwei unverkauften Lagerfrachter ohne freie Speditionskasse und echte Bedarfe unter unveränderten Regeln beobachten: Welcher genuine Erwerber mit Nutzungsauftrag, Budget und Eigentumsberechtigung kann sie übernehmen? Welche W3-/Eis-/Wasserleistungen generieren vorfinanzierte Einnahmen statt Lageraufbau? Vor Produktregeländerung entscheiden, ob eine solche Nachfrage überhaupt wirtschaftlich gebraucht wird. Kein Merge oder Deployment ohne Freigabe.
