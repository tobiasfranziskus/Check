# K2-QA – Unabhängige Abnahme laufender Miner-Ersatzbuchungen

**[DRAFT / TEST, 12.11.2026]** Separater Review-PR [#302](https://github.com/tobiasfranziskus/Check/pull/302), gestapelt auf [K2 #301](https://github.com/tobiasfranziskus/Check/pull/301), der wiederum auf [K1 #300](https://github.com/tobiasfranziskus/Check/pull/300) aufbaut. Produkt-`main` bleibt bei Regel195/Schema8; K2 Forschungsregel199. Diese Qualitätsprüfung entscheidet **keine** K2-Produktfreigabe.

## Zweck

K2 kann aus echten Nadir-Materialbeständen und bezahlter Arbeit Miner herstellen, als körperliche Frachterladung nach Aldera transportieren und erst dort über den Original-`shipBuy` kaufen lassen. Das bisherige K2-Endergebnis alleine hätte eine vorzeitige Hüllenerzeugung, ungebundene Zwischenlohnminuten, verfrühte Frachtauszahlung oder Save-/Load-Doppelzahlung nicht ausgeschlossen. `tests/welt-k2-zwischenzustand.test.mjs` ergänzt deshalb die ursprünglichen End-to-End-Prüfungen um explizite Zwischenzustands-Gates.

## Tatsächliche Prüfmethodik

Die einzige Test-Fixture entsteht aus **echtem** K1/K2-Szenario S12 mit `vorbereiten(S12)`, anschließend minütlichem Weiterlauf bis zu (a) laufender bezahlter Werftarbeit und (b) wirklich verladenem Miner im Nadir–Aldera-Frachter. Es wird kein künstliches W4-Material, Schiff oder Geld im Ausgangszustand erzeugt. Beide gültigen Zwischenstände werden durch den originalen `welt.save`-Pfad gespeichert und für jeden Test unabhängig wieder geladen.

| Gate | Prüfbehauptung | Misserfolg |
| --- | --- | --- |
| **Q1 / Werft** | Verbleibende Werftlohnreserve = fehlende Arbeitsminuten × Originalpreis; jede weitere Minute belastet die Reserve und erzeugt genau einen Lohnbeleg; keine Hülle vor Arbeitsabschluss; zwei geladene Kopien produzieren identische Hashes; Save/Load verändert die Welt nicht | unbezahlte Arbeit, Frühproduktion, nichtdeterministische Wiederherstellung |
| **Q2 / Fracht** | Tatsächlicher Miner liegt in `ships[frachter].ladung`, nicht gleichzeitig im Nadir-Lager; Käufer-60-ISK in Treuhand, mindestens zwei reale Minuten bis zur Lieferung, genau eine Auszahlung an die Spedition erst nach Ankunft; keine doppelte Käuferbelastung; minutenweiser Audit | Teleport, Doppelzählung, Sofortvergütung, unfundierter Transport |
| **Q3 / Manipulationsabwehr** | Verfälschter Materialverbrauch, erhöhtes Werftkonto, gelöschte Frachttreuhand, Doppellager oder verschwundene Frachterladung verletzen den unabhängigen Audit; ungültige Zustände werden nicht gespeichert | versteckte Vermögensschöpfung oder korrumpierbare Sicherungen |

**Befehle:** `node --test tests/welt-k2-zwischenzustand.test.mjs`; zusätzlich unter dem Repo-Standard `node --test tests/*.test.mjs`. Der K1-Workflow führt den gezielten K2-QA-Test als **eigenen Node22-Schritt** vor den 15×90-/5×365-/2×730-Tage-Läufen aus.

## Ausgeführte Abnahme und Grenzen

- **[TEST / bestanden]** GitHub-Actions-Lauf [#43122599030](https://github.com/tobiasfranziskus/Check/actions/runs/43122599030): der dedizierte Schritt `K2-QA: Zwischenstände, Treuhand, Manipulationsabwehr, Replay` hat `completed/success` gemeldet, einschließlich aller drei neuen Prüfungen.
- **[TEST / ausstehend zum Zeitpunkt dieses Berichts]** Gesamtlauf des Workflow-Jobs, historische Gesamtsuite und weitere Browserjobs – deren Resultate nicht aus dem erfolgreichen Einzelschritt ableiten.
- **[OFFEN]** Echte iPad-Safari-/NAS-Prüfung, produktive Spielstandmigration, NPC-Insolvenz-/Nachfolge, Spieler-Sparfreiheit unter Dauerbetrieb und W6-Nachhaltigkeit.
- **[ANALYSE]** S12 ist nach Behebung des Miner-Hüllenengpasses weiterhin durch die **Frachter-Nachfolge** beschränkt (siehe K2-Bericht). Ein nächster Forschungsauftrag muss auch hierfür ausschließlich real finanzierte Hüllen, Transport-/Erneuerungskosten und tatsächlich weiterlaufende Warenzyklen nachweisen; weder Rettung noch neues Geld implizit genehmigt.

Die Testfixtur selbst hat keine Produktdateien, Regelnummern, Speicherplätze oder historische Referenzhashes verändert.
