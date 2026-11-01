# B8m – Kostendeckung vor neuer Frachterreise (nur Test, nicht Produkt)

**[ANALYSE/DRAFT · 01.11.2026]** Basis `main 0d473e6`, `index.html` v0.12.5/Regel14/Schema8, unveränderter Originalkern-SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`. Einzige Dateien: `tools/analyse-b8m-fahrtdeckung.mjs`, separater CI-Workflow, dieses Dokument. **Keine produktive Mechanik-/Geld-/Waren-/Save-Änderung.** Die verbindliche Roadmap bleibt `docs/ROADMAP.md` auf `main`.

## Hypothese und Versuchsgrenzen

B8l zeigte: Zufällige Frachterleerpositionierung wird bei leeren Konzernkassen wiederholt gestartet und erzeugt >90.000 ISK *ungedeckte Kostenforderungen*, keine tatsächlich bezahlten ISK. Bloßes Warten bei 0 ISK verhindert jedoch nicht bereits bei geringem Restguthaben unbezahlbare Fahrten. B8m prüft deshalb vor jedem neuen NPC3-Frachterauftrag einen strengeren **Kassen-/Fahrtkostengate**, ohne neues Kapital zu erzeugen.

In den Seeds 42 und 7 führen sieben historische B1-Spielerbefehle zu den bestehenden NPC-Handelskrisen. Tag14 fügt ein isolierter Analyseentscheid einen NPC3-Frachter-Sollplatz hinzu, bezahlt **780 ISK** aus der NPC3-Kasse und aktiviert danach den gültigen Originalbefehl `shipHandeln`. Für alle vier Varianten bleibt der originale Sicherheits-Zielsystemfilter aus E2a gleich (nur sichere Zielsysteme), kein Jäger wird gekauft oder geschenkt.

Verglichen werden:
1. **risk-only** – originaler E2a-Sicherheitsfilter ohne Finanzierungsprüfung und mit geldlosen zufälligen Leerpositionierungen.
2. **parked** – nur bei 0 ISK die neuen Zufallsleerpositionierungen unterbinden (B8l-Kontrolle).
3. **prepay-leg** – vor jeder NPC3-Fahrt vorhandene freie Kasse für eine **konservativ gerundete** Reisedauer `ceil(Flugminuten/60) × 250 ISK` prüfen, bei Warenkauf zusätzlich tatsächlichen Core-Kaufbetrag/Gebühr berücksichtigen. Fehlender Betrag => keine neue Fahrt.
4. **prepay-miners** – wie `prepay-leg`, zusätzlich *eine Stunde pro tatsächlich arbeitendem NPC3-Miner* mit jeweils 150 ISK als **Testpuffer**. Das ist eine frei gesetzte analytische Reserve, keine Produktfestlegung.

Diese Prüfungen **blockieren keine realen Mittel**: Alle Schiffe zahlen weiterhin aus derselben unveränderten Kasse, die aus anderen Gründen später leer sein kann. Die Positionierung sucht weiterhin nur den original zufällig gewählten Zielmarkt statt eine saubere beste sichere bezahlbare Alternative. Somit ist die Methode **keine atomare Vorfinanzierung, kein Vertrag und keine allgemeine Regelgarantie**.

## Tatsächlich ausgeführte Simulationen

**[TEST/CI erfolgreich] [GitHub Actions #41285929509](https://github.com/tobiasfranziskus/Check/actions/runs/41285929509): 67/67 Node-Regressionstests**, acht vollständig wiederholte 90-Tage-Welten (2 Seeds × 4 Varianten), **17.280 stündliche Geld-/Warenaudits mit deterministischen Doppel-Replays**, 64 Save/Load-Roundtrips, unveränderte E2a/B8l-Hash-Referenzen, echter NPC3-Frachterkauf, Ergebnis-JSON-Artefakt.

| 90-Tage-Ergebnis | Seed42 risk-only | parked | prepay-leg | prepay-miners |
| --- | ---: | ---: | ---: | ---: |
| Ungedeckte gesamte NPC3-Arbeit, ISK | 90.160 | 155 | **0** | **0** |
| NPC3-Warenverkäufe Frachter | 7 | 7 | 7 | 5 |
| NPC3-Endkasse, ISK | 0 | 0 | 177 | 69 |
| Frachter-Cashflow nach bezahlter Arbeit und Hülle, ISK | −2.503 | −2.503 | −2.326 | −1.213 |
| Originaler Frachter an Tag90 vorhanden | ja | ja | ja | ja |

| 90-Tage-Ergebnis | Seed7 risk-only | parked | prepay-leg | prepay-miners |
| --- | ---: | ---: | ---: | ---: |
| Ungedeckte gesamte NPC3-Arbeit, ISK | 90.598 | 701 | 113 | **0** |
| NPC3-Warenverkäufe Frachter | 15 | 15 | 12 | 8 |
| NPC3-Endkasse, ISK | 0 | 0 | 218 | 503 |
| Frachter-Cashflow nach bezahlter Arbeit und Hülle, ISK | −1.368 | −1.368 | −1.148 | −757 |
| Originaler Frachter an Tag90 vorhanden | ja | ja | ja | ja |

**Hash-Referenzen (Seed42/7):** risk-only `73785d4c405ba480` / `087efc37c2d74cee`; parked `fe10455c347e9602` / `aa8f9255a91c705f`; prepay-leg `a77b46fc737c2b15` / `fb451451179d31af`; prepay-miners `f6aef4cc5d4c82a3` / `ce216ca56dc35b66`. Ergebnisse beziehen sich auf die **zwei untersuchten Krisenseeds**, nicht auf 13 Seeds, Dauerbetrieb oder reale iPad-/NAS-Abnahme.

## Bewertung und nächste Abhängigkeit

**[POSITIV – eng]** Das Prüfen der tatsächlichen vorhandenen Kasse vor Fahrtbeginn plus ein begrenzter Minerarbeitspuffer verhindert in diesen beiden Welten jede ungedeckte NPC3-Arbeitskostenforderung, ohne Rettungsgeld oder Werftspende. **[NEGATIV – Gesamtwirtschaft]** NPC3 verkauft aber deutlich seltener, und der getrennte Stations-/Endnachfrage-Engpass wird nicht gelöst. Der isolierte Frachter-Cashflow ist kein vollständiger Unternehmensgewinn; Schiff und nicht abverkaufte Waren behalten Werte. Kein Profitabilitätsbeweis für die Expansion.

**[FOLGESCHRITT VOR PRODUKT]** Transaktionssichere Disposition über eine gemeinsame Kasse, echte Mittelbindung bis zur Abrechnung und die unterschiedlichen Anforderungen von Frachter/Miner/Jäger und Spieler prüfen; Sicherheits-/Piratenrisiko und positiver Folgehandel zusätzlich berücksichtigen. 13 Seeds ×90 Tage, 365-Tage-/Spielerkrisenfälle, unabhängige Audits, Save-Migration und iPad-/NAS-Abnahme sind weiterhin offen. **Nicht mergen ohne ausdrückliche Produktfreigabe; diesen reinen Test-Branch grundsätzlich nicht als Spielregel integrieren.** B8n prüft unabhängig davon die Ursprungskaufkraft/Endnachfrage.
