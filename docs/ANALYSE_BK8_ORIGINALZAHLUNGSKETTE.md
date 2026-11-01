# B-K8 – Der vollständige Original-Zahlungspfad bis Tag90

**Stand: 01.11.2026 · [ANALYSE/DRAFT] [PR #92](https://github.com/tobiasfranziskus/Check/pull/92) · NICHT gemergt.**

Basis ist ausdrücklich **[MAIN] `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`** (Spiel v0.12.5, Regel14, Schema8). In `index.html` ist **keine** Mechanik geändert worden. Kein neues ISK, keine Vertrags-/Spar-/Lohn-/Save-Regel, keine neue Abhängigkeit.

## 1. Testumfang und Abgrenzung

- **[TEST]** [GitHub-CI #41332988658](https://github.com/tobiasfranziskus/Check/actions/runs/41332988658), vier 90-Tage-Original-Core-Welten (Seed 7/42, mit und ohne aktiven Erz-Spielerminer), **8.640** stündliche Original- und unabhängige Geld-/Warenaudits und **20 echte Original-Save-/Load-Hash-Roundtrips**; Seed7/42 mit separatem Tag14-Wiederanlauf und Vergleich der Buchungsstände. **Auf den ursprünglichen B-K7-Original-Core-Hashes `0a4aaf6dad321984` / `f733a993164a5e4f` verriegelt**. Regressionen `node --test tests/*.test.mjs` im gleichen Workflow.
- Beobachtet werden *wirkliche* `m_core_handel.handel`-Ereignisse (Käufer/Seller/Zahlungswert, Quelle, Ziel, Gebühren), `m_core_stunde.betriebskosten` (fälliger versus gezahlter Betrag), Minuten der **wirklichen** Frachterflüge, ursprüngliche `produktion`, `verbrauch` und `entfernen` bei Schiffsverlust. Die Hooks protokollieren; sie verändern keine Geld-, Waren-, KI- oder Spielerentscheidung.
- **Kein neuer Endkundenvertrag:** Der zivile Original-`verbrauch` zieht wirklich Nahrung und Medikamente aus dem Lager und bucht `ledger.consumed` – **ohne** Konsumentenkonto, Zahlung oder Haushaltslohn. Deshalb besteht diese Analytik bewusst aus Nachweisen des Fehlens, nicht einem erneut erfundenen Geldpfad.
- Aggregierte Frachterkäufe/-verkäufe werden beim Originalhandler gebucht. Einzelne `matchedDeliveries` setzen bezahlten Quellkauf und realen späteren Zielverkauf derselben Ware im selben Schiff voraus. Die Probe enthält nicht in jedem Fall vollständige kostenmäßige Zuordnung für Teillieferungen. Bei einzelnen vollständigen Paaren werden die ab Kauf **tatsächlich geflogenen Original-Minuten** erfasst und die daraus **fälligen** Flugkosten ausgewiesen – auch wenn der Core sie erst *nach* der Lieferung bei der nächsten Stundenabrechnung abbucht. Kein Scheingewinn durch 0 ISK bereits gebuchten Lohn.

## 2. Direkte Ergebnisse der echten Welten

| Lauf, Tag90 | Spieler-ISK | Stationen-ISK | NPC1/2-ISK | Händlerfrachter | Ziviler Nahrungsverbrauch | dafür bezahlte Endkunden-ISK | Mangelstunden |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Seed7 passiv | 2.000 | 22.629 | 10.755 | 5 | 36.595 | **0** | 57 |
| Seed7 Spieler-Mining | **41.228** | 7.204 | **169** | **0** | 3.144 | **0** | 35.993 |
| Seed42 passiv | 2.000 | 22.451 | 12.000 | 5 | 36.602 | **0** | 58 |
| Seed42 Spieler-Mining | **42.795** | 5.238 | **132** | **0** | 3.473 | **0** | 35.798 |

Die aktive Spieler-Erzförderung wurde mit dem originalen validierten `shipMine`-Befehl begonnen. **Tatsächlich zahlte die Welt für die Spieler-Erzverkäufe** Seed7 **60.214 ISK**, Seed42 **62.588 ISK** brutto, kumuliert bis Tag14; diese Zahlungen wurden bereits in B-K5 nach echten Minergebühren/-arbeitskosten vollständig aufgelöst. Die gezahlten Waren-ISK **sind kein neu erzeugtes Geld** und dürfen mit dem am Tag14 gehaltenen Endvermögen nicht verwechselt werden.

**[FESTGESTELLT]** Obwohl der Originalhandel enorme *wiederholte* Umsätze mit derselben knappen Geldmenge erzeugt, **fehlt am Ende der Verbrauchskette eine bezahlte Gegenleistung**. Ohne Spieler-Mining bleibt der Handelsfluss auf einem deutlich höheren Niveau. Mit Spieler-Mining wandert ein großer Anteil der Kassen-ISK über echte Stationsrohwaren-Käufe zum unbegrenzt sparberechtigten Spieler; danach haben Stationen und Händler keine ausreichend liquiden Folgebudgets. Mehr Startkapital würde dies zeitlich verschieben, aber den fehlenden Endzahler nicht begründen.

## 3. Operativer Vollkostenfehler: kurze profitable Handelsspanne ≠ profitable Fahrt

Ein tatsächlich beobachteter kompletter Originalhandel eines NPC1-Frachters (Erstfahrt in beiden Seeds, `sh015`):

| Buchung | ISK |
| --- | ---: |
| 2 Bauteile in Cyris kaufen | −162 |
| Quell-Handelsgebühr | −6 |
| 2 Bauteile in Aldera verkaufen | +186 |
| Ziel-Handelsgebühr | −7 |
| **Deckungsbeitrag vor Flugkosten** | **+11** |
| **25 wirklich erflogene Minuten**, bei Original-Frachterkostensatz 250 ISK/h | **−104 fällige ISK** |
| **Ergebnis vor Ersatz und Rückfahrt** | **−93 ISK** |

Die 104 ISK sind **aus Original-Flugminuten berechnete Kostenforderung**, nicht notwendigerweise schon in diesem Lieferaugenblick gebucht oder bezahlt. Das Original verbucht reale Arbeitskosten erst bei der Stundenabrechnung; ein Endkunden-/Frachtervertrag muss sie *vor* Abflug binden. In anderen beobachteten Fahrten sind die Einwegdeckungsbeiträge positiv (beispielsweise eine bezahlte Bauteillieferung Dravos→Aldera mit **+276 ISK** nach 20 Minuten Flugkosten), doch auch diese Einzelwerte enthalten noch **keine** vollständigen Hüllenersatz-, Rückfahrt-/Risiko- und Kapitalbindungskosten. Eine pauschale Aussage, alle Routen seien unprofitabel, ist damit falsch – ebenso ein Profitbeweis allein aus `bestesPaar.gewinn`.

## 4. Ungedeckte Arbeit – echte Kostenforderungen, keine ausgezahlten ISK

| 90-Tage-Fall | Ungedeckte NPC1/2-Frachterarbeit | Ungedeckte Security-Arbeit |
| --- | ---: | ---: |
| Seed7 passiv | 1.209 ISK | 426.760 ISK |
| Seed7 Spieler-Mining | **18.378 ISK** | **521.680 ISK** |
| Seed42 passiv | 949 ISK | 429.520 ISK |
| Seed42 Spieler-Mining | **37.804 ISK** | **523.840 ISK** |

Die zusätzlichen Forderungen wurden unabhängig aus den originalen `kosten` und tatsächlich ausgezahlten `n` je Schiff/Stunde ermittelt. **Sie sind keine verbuchten Zahlungen** und gehören daher nicht in den bestehenden ISK-Kreislauf als vorhandenes Guthaben.

**Wichtige neue Einschränkung:** Auch die passiven Welten mit fünf Händlerfrachtern und fast keinen Mangelstunden sind **keine rundum finanziell stabilen Welten**: Die Sicherheitsjäger arbeiten im Originalkern bei leerer Authority-Kasse kostenpflichtig weiter, ohne tatsächliche Zahlung. Deren ungedeckte Forderungen müssen später über reale Sicherheitsaufträge, begrenztes Budget oder kostenpflichtiges Stoppen in eine geschlossene Finanzierung integriert werden; es wäre falsch, die passiven 90-Tage-Läufe als komplette Wirtschaftsfreigabe zu zählen.

## 5. Ersatzkapital ist ein weiterer harter Engpass

Der ursprüngliche `m_core_schiffbau.ersatzkauf`-Kaufpreis für einen Frachter (an der Werft Aldera, inkl. Originalgebühr, Tag90) beträgt **780 ISK**. In beiden aktiven Krisen liegt das **kombinierte** verbliebene NPC1/2-Händlercash bei nur **169/132 ISK** – für **keinen** voll bezahlten Hüllenersatz ausreichend. In den passiven Welten bestehen jeweils fünf Händlerfrachter, und beide individuellen Händlerkassen verfügen über genug Cash für den normalen Ersatzkauf.

Der heutige Kern kennt einen begrenzten `zuschuss` aus dem regionalen Werftfonds, wenn ein NPC-Eigentümer keinerlei Schiff mehr hat; das ist ein realer **Bestands-ISK-Transfer**, keine neu erzeugte oder garantierte Ersatzfinanzierung. Es darf nicht als funktionierender allgemeiner Markteintritt oder dauerhafte Individualrettung interpretiert werden.

## 6. Zusammenfassung / nächste konkrete Entscheidung

**[TECHNISCH NACHGEWIESEN]** Original-Minerförderung, Stations-Einkauf, ursprüngliche Frachter-Warenkäufe und reale Zielverkäufe sind vollständig instrumentiert und geld-/warenauditiert. Ein Verlustgeschäft kann selbst bei positiven ursprünglichen Warenmargen nach tatsächlichen Fahrtminuten bestehen; gleichzeitig fehlen Endverbrauchszahlungen und langfristig Ersatzbudget sowie gedeckte Sicherheitsarbeit.

**[OFFEN]** Eine *real funktionsfähige*, dauerhaft selbstfinanzierte gesamte Lieferkette ist damit **noch nicht implementiert**. Die technische Fahrt-/Treuhandmachbarkeit wurde bereits getrennt in [B9j #84](https://github.com/tobiasfranziskus/Check/pull/84) nachgewiesen; B-K6/B-K7 zeigen das fehlende wiederkehrende Endkundenbudget bzw. die Wirkungslosigkeit ungezielt am Produktionsort zusätzlicher ISK. **Eine weitere reine Emissionshöhenprobe wäre derzeit nicht hilfreich.**

**[OPTION: enges nächstes Produkt-Draft-Gate]** Auf Basis des vorhandenen B9i/B9j-Vertragsadapters und B-K6 einen **durchgängigen Endkunden- und Lieferauftrag** entwickeln, dessen **einziger zahlender Endkunde** tatsächlich vor dem Rohstoffstart ein Budget für physisch gesicherte Ware, vollständig gebundene Frachter-/Minerarbeit, Gebühren und Ersatzreserve hinterlegt. Bestehende Geldmittel dürfen umverteilt, aber nicht doppelt als Kaufkraft gezählt werden. Daneben brauchen Haushalte **reguläre wiederkehrende Einkommen**, und wenn dauerhaft netto gespart werden darf, ist für Geldmodell B eine **globale, nicht individuell garantierte und gesondert genehmigte** Leistungszahlung zu prüfen. Beim ersten Fehlversuch zuerst vertragliche Margen und Kapitalbindung auswerten, nicht 90 Tage blind wiederholen.

**Keine Produktfreigabe, keine neue Emissionsregel.** Hauptdateien `index.html`, Schema, Hash-Fixwerte und UI bleiben auf [MAIN] unverändert. Keine reale iPad-Safari-/NAS-Abnahme.
