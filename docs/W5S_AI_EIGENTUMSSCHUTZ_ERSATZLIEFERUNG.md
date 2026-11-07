# W5s-ai · zweckgebundener W5-Ersatzkauf nach tatsächlich abgeschlossener Fremdlieferung

**[DRAFT/ANALYSE · 07.11.2026]** [PR #237](https://github.com/tobiasfranziskus/Check/pull/237) auf W5s-ah [#236](https://github.com/tobiasfranziskus/Check/pull/236). `main` 5a56d9d7, GitHub Pages/Archiv, Spielstände und W5u #234 unverändert. Regel 32, Schema 8, Default OFF. Keine Freigabe, kein Merge oder Deployment.

## Konkrete Ursache – keine fehlende Kundennachfrage

In den tatsächlich finanzierten Seed42/7-Krisenwelten existierten nach den W5s-ah-Verbrauchs-/Frachtaufträgen ein bezahlter W5s-Vertrag der Originalfirma `transport` sowie ein physisch vorhandener W5-Frachter in Nadir. Die Originalspedition hatte 810 ISK in `w5s_order_reserved` hinterlegt: 750 ISK voll finanzierten Schiffskauf und 60 ISK Pilotenüberführung; das freie Firmenkonto war mit 240 ISK separat ausgewiesen. Die ursprüngliche automatische Bestellung blieb trotzdem auf `reserved`, das Schiff lag unverkauft im Werftlager. Der Test einer direkten Originalausführung zeigte das konkrete Ablehnungsresultat:

`W5s-z: bezahlte Fremdhuelle bis zur Eigentuemeruebergabe reserviert`.

Das war eine **veraltete exklusive Reservierung der dritten Spedition**: Ihr erstes, wirklich vorbestelltes Fremdschiff war längst gekauft, zugeordnet, überführt und später verschlissen. Die Prüfung im gemeinsamen `shipBuy`-Originalkern hatte ausschließlich `reserved?.buildStarted` statt des aktuellen Eigentums-/Vertragsstadiums geprüft. Dadurch blockierte eine abgeschlossene Fremdlieferung spätere andere Käufer. Es fehlten **weder 750 ISK Käufergeld noch eine physische Werfthülle**.

## Kleine, ausdrücklich optionale Core-Korrektur

`w5s.successorResolvedHullRelease:true` lässt die W5s-z-Fremdreservierung ausschließlich so lange sperren, wie sie rechtlich nötig ist: bei `reserved`, `building`, `hull_ready` oder `funded`. Ab `bought`, `inflight`, `arrived` oder `retired` entscheidet der **unveränderte Original-Core** über einen neuen, getrennt finanzierten W5-Kauf.

Der eigentliche Käufer `transport` wird dabei nicht bevorzugt. Der vorhandene `contractCommand` löst die 750 ISK aus **seiner eigenen** 810-ISK-Treuhand, der vorhandene W5-`shipBuy` übernimmt den bezahlten Schiffskauf und die echte Original-ID, die restlichen 60 ISK sind die bezahlte Überführung. Vorübergehende Auftragsschritte, Geld-, Waren-, Lohn-, Werft-, Fracht- und Eigentumsaudits bleiben zuständig. Kein Direktkauf aus fremdem Bestand, kein automatisches Schiff und kein stilles Anheben einer Kasse.

Ohne das neue Flag bleibt die historische Sperre **byte- und hashgleich** in der Ausführung; es gibt keine neue Schema-Migration. Default OFF ist eine bewusste Forschungsbegrenzung.

## Prüfungen [TEST – direkt ausgeführter Branch-Core]

Sechs neue Tests in `tests/w5s-ai-eigentumsschutz-ersatzlieferung.test.mjs` wurden ausgeführt und bestanden. Geprüft:

1. Mit OFF bleibt der 810-ISK-Originalauftrag bis zur bisherigen historisch geblockten Stufe, ohne die verifizierten W5s-ah-Zustände zu verändern.
2. Das noch nicht verkaufte, von `export` bestellte Fremdschiff bleibt **auch bei ON** vor Fremdkauf geschützt; abgelehnte Originalbefehle verändern den Hash nicht.
3. Mit ON wechselt der Originalauftrag nach `shipBuy` in `bought`: 750 echte ISK Kaufpreis, 60 verbleibendes Treuhandbudget, gültige originale W5-ID. `shipReposition` bindet die 60 ISK, nach echten 60 Flugminuten ist der Vertrag nachweislich abgeschlossen.
4. Verfälschte Eigentümer, Schiff-ID, Preis oder Treuhand werden vom Gesamtaudit abgelehnt; kein doppelter Kauf einer nicht vorhandenen Hülle.
5. 13 Seeds × 90 Tage im unaufgeführten Forschungsverhalten, ohne erfundene Gesellschaft oder Geld.
6. Seed42 und Seed7 bis **exakt Spieltag365**, mit täglich vollständigen Original-Finanz-/Waren-/Schiff-/Eigenkapitalaudits und periodischem Save/Load.

| Reale Zusatzleistung seit der vollständig finanzierten Drittgründung, jeweils bis Spieltag 365 | W5s-ah (Flag OFF) | W5s-ai (Flag ON) |
| --- | ---: | ---: |
| Tatsächlich verkaufte Wassereinheiten zusätzlich | 1.490 | 1.524 |
| Weitere Wasserwerkschargen | 150 | 154 |
| Weitere originale Eisfrachten | 30 | 31 |
| Weitere originale Erzfrachten | 2 | 3 |
| Zusätzlich verkaufte originale W5-Frachterhüllen | – | 2 |
| Gesamtgeld / neu geschaffene ISK | 33.000 / 0 | 33.000 / 0 |

**Reproduzierbare Seed42/7-Tag365-Hashes:** `901bc06267beadbc` / `8ec3b4959cdd72d7`. Die abgesicherte externe Drittspedition hat dann 480 ISK statt zuvor 1.080 ISK; dies ist ein **verdrängender Wettbewerbseffekt durch den wieder arbeitsfähigen Originalfrachter**, kein zusätzliches Gratisvermögen. `w5s_carrier2` verbleibt bei 720 ISK. Die Transportfirma besitzt später 240 ISK und hat ihre im Vertrag ausgewiesenen 810 ISK korrekt für Hülle und Flug eingesetzt. Alle 33.000 ISK der Welt bleiben erhalten.

Die **Haushalte bleiben mit 8 ISK gegenüber 14 ISK Wasserpreis nicht dauerhaft kaufkräftig**. W5s-ai behebt einen echten Eigentums-/Logistikfehler, **nicht** automatisch das langfristige Endkundenmodell. Das wahllose Ausschütten vorhandener Werftkassen wurde vor Aufnahme in den Branch als kontraproduktiv verworfen: Kein belegtes Aktionärsrecht und die Werft kann damit ihr künftiges Betriebsbudget aufbrauchen.

## Grenzen und nächster Nachweis

Die 30-Tage-W5r-Schiffslebensdauer und alle Nachfolgerregeln sind weiterhin nicht freigegebene R32-Forschungsparameter. Das Modul W5u #234 arbeitet mit Regel 14 und ist hier nicht integriert. Eine dauerhaft finanzierte Wirtschaft benötigt einen eigenen Nachweis für die **wiederkehrende Endnachfrage samt real verdienten Einnahmen**, nicht nur erneut ein gebuchtes Schiff.

Eigener Node22-GitHub-Workflow `.github/workflows/w5s-ai-ersatzkauf.yml`; Remote-Spezial-CI und vollständige Regression getrennt nach tatsächlicher Beendigung einstufen. Echte iPad-/NAS-Abnahme offen.
