# W5s-r – bezahlte Industrie-/Wartungsarbeit als tatsächliches Haushaltseinkommen

**[DRAFT / ANALYSE / OPTION · 06.11.2026]** Forschung auf W5s-q [#221](https://github.com/tobiasfranziskus/Check/pull/221) gestapelt. Die produktive Spielwelt `main 5a56d9d7`, GitHub Pages samt Archiv, Regel14, Schema8 und existierende Save-Slots bleiben unangetastet. Neuer Geld-, Lohn- oder Wirtschaftsmechanismus **nicht** als Produktregel beschlossen; kein Merge und kein Deployment.

## 1. Ausgangslage und Abgrenzung

Im W5s-q-Vergleich hatte die unabhängig auditierte R32-Stresswelt (15/30 Tage hypothetische Miner-/Frachterlebensdauer) nach 365 Spieltagen tatsächlich **drei W3-Erztransporte**, **118 echte Eisfrachten** und **5.823 bezahlte Wasser**. Die bereits verdienten W3-Pilotenlöhne in Höhe von 360 ISK flossen im optionalen W5s-q-Versuch an Haushalte, aber die **unabhängig von der Haushaltsarbeit real bezahlten W4-Raffinerie-, W5-Werft- und W5r-Service-/Wartungsarbeitsminuten** wurden bislang auf drei reinen Arbeitskonten gespeichert. Dass das Werk und der Dienst Löhne wirklich ausgezahlt hatten, wurde jeweils im Original-Core und den Original-Arbeitsbüchern belegt.

Die Wirtschaft hängt weiterhin **nicht** an einer künstlichen Obergrenze der Erzförderung. Zum Vergleich: Am Tag365 befinden sich noch 50 bereits bezahlte Erz beim Großhändler in Aldera, zusätzlich 100 Erz im NPC-Miner, aber ein zusätzlich begründeter Werftauftrag und die eigene Speditionsersatzhülle fehlen. Ein vierter automatisch ausgelöster Erztransport ohne belegten Produktionsauftrag wäre eine spekulative Lagerbestellung.

## 2. Implementierte optionale Weiterleitung – keine doppelte Lohnzahlung

Ausschließlich mit `rules.w5s.autoIndustryWages=true` im isolierten, bereits voll aktivierten R32-Forschungsprofil nimmt ein gemeinsames, deterministisches W5s-Register nur die **bereits durch die autoritativen Original-Module real bezahlten** Löhne an:

| Herkunft des bereits bezahlten Arbeitslohns | Autoritatives Original-Buch | Lohnempfänger vor privatem Weitertransfer |
|---|---|---|
| W4-Raffinerie, nur tatsächlich geleistete Arbeitsminuten | `s.w4.gezahlt` | `arbeitskraefte_nadir` |
| W5-Werft, nur tatsächlich geleistete Arbeitsminuten | `s.w5.arbeitsGezahlt` | `arbeiter_werft_nadir` |
| W5r-Service-/Wartungsarbeit, nur tatsächlich bezahlte Arbeitsminuten | `s.w5r.servicePaid` | `w5r_maintenance_workforce` |

Die drei eigenständigen Arbeiterkonten geben ausschließlich einen **einmal** jeweils nachweisbar real erhaltenen, noch nicht weitergegebenen Betrag an `w5n_kunden` ab. Die ursprünglichen Auftraggeber haben bereits den vollen Arbeitslohn bezahlt; **keine weitere Belastung von Werft, Raffinerie oder Nadir**, keine neue ISK-Emission, keine automatische Unternehmenshilfe, kein direkter Transfer von irgendeinem Konzerninvestor. Der Vertrag erzeugt keine zusätzliche Warenproduktion und verbraucht kein Erz, Material oder Wasser, bevor die bisherigen Original-Core-Aufträge dies selbst buchen.

Je Arbeitsgruppe ein persistierter `state.w5s.industryWages.paid`-Zähler mit einer chronologisch überprüften Liste `events: [{tick,key,amount}]`. Der Lohntransfer wird mit vorhandener `m_core_handel.buche` auf Arbeitnehmer- und Haushaltskonto geführt. Die W4-/W5-/W5r-Originalprüfungen bestätigen, dass jedes Arbeitnehmerkonto exakt `wirklich bezahlt - nachweisbar weitergeleitet` enthält. W5n-, W5o- und W5q-Audits verlangen dieselbe nachweisbare, tatsächlich wieder verfügbare Haushaltskasse; W5s prüft pro Arbeitsgruppe jeden Lohnbeleg, Zahl und Ticks. `m_core_index.w5sFinanzStatus(...).industryWages` zeigt alle drei Lohnquellen lesend mit verdient, ausgezahlt, verbleibend und Anzahl der Zahlungsereignisse.

**Wichtige Grenze:** Die ursprünglichen W5r-Wartungs-/Serviceleistungen folgen weiterhin der schon vor W5s-r existierenden R32-Taktung. W5s-r erzeugt **keinen** zusätzlichen Serviceauftrag und garantiert auch keinen positiven wirtschaftlichen Nutzen des Services. Insbesondere eine Wartung bei bereits kollabierter Frachtwirtschaft ist mit realem Stationseinsatz zwar bezahlt, aber nicht automatisch eine produktive Investition. Der R32-Dienstplan ist als Stressannahme separat zu beurteilen.

## 3. Tatsächlich ausgeführte Tests

**[TEST]** [GitHub Node22 #42243893836](https://github.com/tobiasfranziskus/Check/actions/runs/42243893836), **4/4 Testgruppen grün, 0 Fehler/Skips**. Der abschließende PR-Head erhält einen weiteren gezielten Lauf und die gesamte historische GitHub-CI. Testet 13 feste Seeds ×90 Tage, Seed42/7 ×365 Tage, tägliche unabhängige 33.000-ISK-Weltbilanz, originale Eigentümer-, Vertrags-, Waren-, W3-/W4-/W5-/W5r-/W5o-/W5s-Audits, Save/Load, vollständige Doppelreplays Seed42/7 über 90 Tage, mutierte Lohnregister und unerlaubte zwischenkontische Buchungen. Die ausgeschaltete W5s-r-Option ist **bitidentisch** zum ursprünglichen W5s-q-90/365-Tage-Stand (Seed42 `6a05e0121ae95948`, Seed7 `59193e57f052e8e0` nach 365d).

| R32-Profil · Seed42 und Seed7 · 365 Spieltage | W5s-q vorher | W5s-r mit erworbenem Industrielohn |
|---|---:|---:|
| Bezahlt an W4-Raffinerie-Arbeitnehmer | im Arbeitskonto gehalten | **260 ISK an Haushalte** |
| Bezahlt an W5-Werft-Arbeitnehmer | im Arbeitskonto gehalten | **390 ISK an Haushalte** |
| Bezahlt an W5r-Service-/Wartungsarbeitnehmer | im Arbeitskonto gehalten | **1.080 ISK an Haushalte** |
| Summe weitergeleitet, zusätzlich zu bereits bezahlten W3-Löhnen | 0 | **1.730 ISK** |
| Bezahlt gekauftes Wasser bis Spieltag365 | **5.823** | **6.143 (+320)** |
| Bezahlt geflogene Eisfahrten bis Spieltag365 | **118** | **123 (+5)** |
| Physisch belegte W3-Erzfrachtlieferungen | **3** | **3** |
| Weiterer automatisch gerechtfertigter Werft-/Erzauftrag | keiner | **keiner** |
| Neue oder verbrannte ISK | 0 | **0** |

Nach 90 Tagen waren bereits **640 ISK** aus 160 ISK W4, 240 ISK W5 und 240 ISK W5r an Haushalte überwiesen; der Wasserabsatz blieb bis zu diesem Punkt identisch bei 4.316 Einheiten (genügend ursprüngliche Kaufkraft). Nach 365 Tagen: W4 13 echte Raffineriechargen → 260 ISK real bezahlte Löhne; W5 13 echte Werftchargen → 390 ISK; W5r 18 bezahlte Wartungs-/Serviceblöcke → 1.080 ISK. Nur diese bereits gezahlten Arbeitsbeträge wurden weitergegeben.

### Konkretes Negativergebnis zur langfristigen Stabilität

Auch mit realen 1.730 ISK mehr Haushaltseinnahmen bleiben **nur drei echte Erzfahrten**. Am Tag365 ist kein eigener Speditionsfrachter mehr vorhanden; auf dem Speditionskonto liegen nur **120 ISK** bei **930 ISK** vollständiger Ersatz-/Flugreserve, d. h. **810 ISK fehlen**. Der Wasserhaushalt besitzt zuletzt nur 6 ISK. Die R32-Service-Nachfrage kann vorhandenes Kapital der Nadir-Station in Arbeiterlöhne überführen, heilt damit jedoch **keinen** fehlenden Material-, Käufer- oder Schiffbauauftrag. Der zusätzliche Wasserverbrauch ist echt, **keine Dauerstabilität der Gesamtwirtschaft**.

## 4. Übergabe und nächster sinnvoller Schritt

**[NICHT BESCHLOSSEN]** Industrielöhne an die beispielhaft zusammengefassten privaten Wasserhaushalte auszuzahlen ist ein isolierter Versuch; es ersetzt weder differenzierte Haushalte noch Spielerhandlungen. In einem Folgeschritt muss die Nachfrage für konkrete verlorene Frachter-/Minerhüllen, das Defizit der Warenabnahme und die realen Absatzmargen (mit ggf. eigenständigem NPC-Folgebetrieb) **ohne Subventionen** untersucht werden. Die drei Arbeitgeber sollen weiterhin scheitern dürfen, wenn ihre eigene Kasse leer ist. **Keine Werft-, Minen- oder Frachtaufträge ohne physische Waren und vollständige Kassenfreigabe.**

**[MAIN]** unverändert. **[OFFEN]** volle historische JS-/Geografie-CI auf abschließendem PR-Head; echte iPad-Safari-/NAS-Abnahme. Kein Merge, kein Deployment.
