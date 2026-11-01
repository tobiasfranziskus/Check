# E2a – Real finanzierter NPC3-Handel: Sicherheitsfilter versus Vollkosten

**[ANALYSE/DRAFT, 01.11.2026]** Abgetrennter, nicht produktiver Gegenversuch zum [B8k-Archiv #71](https://github.com/tobiasfranziskus/Check/pull/71) und [E1-Archiv #72](https://github.com/tobiasfranziskus/Check/pull/72). Originaler Main-Stand [`491f8e2`](https://github.com/tobiasfranziskus/Check/commit/491f8e2a73ad7ae765ba15c686a25c3a55d638d9), v0.12.5/Regel14/Schema8. Originalkern-SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`. In diesem PR **nur** Node-Analyse-Runner, Workflow und dieser Bericht, `index.html` unverändert. Kein Geld, Schiff, Pilot, Preis, Schutz oder Saveformat modifiziert. `docs/ROADMAP.md` auf main bleibt die einzige Produktplanung.

## Fachliche Hypothese

E1 zeigte, dass eine reale 1–2-Jäger-Eskorte die ersten Frachterverluste in den zwei Krisenseeds nicht zuverlässig verhindert. Bei fehlender wirksamer oder bezahlbarer Eskorte sollte der Händler *nicht einfach trotzdem* auf eine gefährliche Fahrt gehen. Dies darf jedoch nicht als Heilung des Wirtschaftszyklus bewertet werden, wenn er damit vollständig aufhört zu handeln. Wir untersuchen getrennt tatsächliche Frachterverluste, Waren-/Kassenbuchungen, Deckungsbeiträge und Versorgung.

**Aufbau:** In Seed42 und Seed7 exakt sieben historische Spielerbefehle aus B1; an Tag14 sind NPC1/NPC2 ausgefallen. NPC3 hat weiterhin neun Miner und reales Guthaben. In einer Analyseentscheidung erhält NPC3 **einen** neuen Sollplatz für einen Frachter in Dravos. Der unveränderte `m_core_schiffbau.ersatzkauf` kauft echte Werftware im Originalhandel (Frachter 750 +30 Gebühr = 780 ISK), keine Hüllenspende. Beim echten Andocken in Dravos wird der vorhandene Befehl `shipHandeln` aktiviert. Kein persönliches Pilotkonto und keine bevorzugte Hilfe. Der Frachter kann real zerstört und gemäß existierendem Sollplatz mit vorhandenem Kapital später erneut bezahlt ersetzt werden; ursprüngliche und nachgekaufte Hüllen getrennt zählen.

Vier strikt gleiche 90-Tage-Welten je Seed (insgesamt acht), je zwei deterministische Replays:

1. **control**: Original-B1-Spielerkrise ohne NPC3-Markteintritt.
2. **autonomous**: Ein gekaufter NPC3-Frachter nutzt den **unveränderten** autonomen Core-Entscheider (keine Escort, keine Risikogates).
3. **risk-only**: Nur dieser NPC3-Händler sucht vor dem Einkauf *andere sichere Käufer*, anstatt Angebote in gesetzlosen/umkämpften Zielsystemen anzunehmen. Gekaufte Restladungen dürfen nicht in unsichere Zielsysteme umpositioniert werden. Zufällige Leerpositionierungen werden ebenfalls vor einem **unsicheren Ziel** blockiert und resultieren in echter Wartezeit; alle anderen Preise, Käufe und Verkäufe laufen original. Ein Frachter ist auch beim Warten in gefährlichem Gebiet weiter angreifbar.
4. **fullcost**: Selbes Sicherheitsziel-Gate, zudem nur Angebote mit **positivem Gewinn nach pauschal zwei Fahrtrichtungen realer Frachter-Arbeitskosten** (Core-Kostenrate 250 ISK/60 Minuten, mit konservativer Aufrundung) und vorhandenen freien NPC3-ISK nach Einkauf/Arbeitskosten und einer **einmaligen** 150-ISK-Betriebsreserve *pro tatsächlich vorhandenem NPC3-Miner*. Original-Core-Kaufgebührenfunktion wird verwendet. Diese Reserve ist ein exploratives Ein-Stunden-Sicherheitsbudget, **keine beschlossene Regel**. Keine impliziten Darlehen.

**Wichtige Modellbegrenzung:** Die tatsächliche Regel14-Piratenkampf-Logik prüft bei einer `reise` das **Zielsystem**, nicht den vollständigen Weg (`route().weg`). Das Versuchsgate klassifiziert deshalb nur gefährliche Ziele; wir behaupten **nicht**, die gesamte Route sei sicher. Auch eine tatsächlich sichere Zielstation kann auf dem Kartenweg durch Gefahrensysteme führen. Der Gate-Entschluss ist nicht die endgültige Spieler-/NPC-Regel; überprüfte, real bezahlte Eskorte, sichere Route und kalkulatorischer Frachterverlust bleiben spätere getrennte Aufgaben. Ein bloßes `shipEscort` ist nach E1 keine wirksame Deckung.

## Prüfungen / erwartete Abnahme

- Original-Core-Hash nach 14 Tagen und unveränderte Seed42-Kontrollhashes gegen gesicherte Referenz, beide Replays je Welt exakt gleich.
- **8 × 2.160 = 17.280 stündliche** Checks mit Core-Audit, unabhängiger `initialSupply + minted - burned`-Geldbilanz, unabhängiger kompletter Warenbilanz pro Ware, identischen Zustands-Hashes; 64 Save/Load-Roundtrips.
- Realer Kauf der NPC3-Frachthülle zu 780 ISK; genau die tatsächlich durch Core `handel` gebuchten Verkaufs-/Kaufpreise und Gebühren sowie Frachter-/Miner-Arbeit. Die Gelderhaltung darf nicht durch Analyseinterventionen verletzt werden.
- Erster Frachtertod separat von bezahltem Werftersatz; originale Wirtschaftsversorgung, Lebensmittel-/Medizinverbrauch, NPC3-Endkasse, vollständige Betriebskostendeckung, blockierte sichere Alternativen, echte Lieferungen und Verlustkosten gemeinsam beobachten.
- **CI abgeschlossen und erfolgreich:** Nachweis und Ergebnistabelle im Abschnitt unten. Auch eine grüne CI ist keine Zustimmung zum risikobasierten Produktcode, keine 13-Seed-/365-Tage-/iPad-/NAS-Abnahme.

## Tatsächlich ausgeführte CI-Gegenproben

**[TEST] Erfolgreiche aktuelle Head-CI [#41282459097](https://github.com/tobiasfranziskus/Check/actions/runs/41282459097)** auf `cccf7f3` und ebenfalls erfolgreiche Push-CI [#41282404956](https://github.com/tobiasfranziskus/Check/actions/runs/41282404956) auf denselben unveränderten Runner/Workflow-Versionen (im späteren Head kam nur dieser Analysebericht hinzu): **67/67 Node-Standardtests**, acht echte 90-Tage-Welten, **17.280 stündliche unabhängige Geld-/Warenprüfungen**, vollständig deterministische Doppel-Replays, **64 Save/Load-Roundtrips**. Beide historisch gesicherten Seed42-Originalhashes erhalten; Original-Core-SHA256 und Produktregeln unverändert. JSON-Ergebnisartefakt im Head-CI-Lauf abgelegt.

| Aktive Seed42/Seed7, 90d | Originalkontrolle | Autonom ohne Schutz | Nur sichere Zielmärkte | Sichere Ziele + vereinfachte Hin-/Rückfahrt-Vollkosten + Minerreserve |
|---|---:|---:|---:|---:|
| **Seed42** erster NPC3-Frachter erhalten | – | nein (Verlust Tick 21.540) | ja | ja |
| Seed42 echte NPC3-Frachter-Warenverkäufe | 0 | 29 | 7 | 1 |
| Seed42 Frachter-Cashflow nach **bezahlter** Arbeit und Hüllenkäufen | 0 | **−2.480 ISK** | **−2.503 ISK** | **−1.303 ISK** |
| Seed42 NPC3-Endkasse | 4.395 | 771 | **0** | **0** |
| Seed42 NPC3-Kostenunterdeckung insgesamt | 0 | 0 | **90.160** | **90.941** |
| **Seed7** erster NPC3-Frachter erhalten | – | nein (Verlust Tick 20.460) | ja | ja |
| Seed7 echte NPC3-Frachter-Warenverkäufe | 0 | 10 | 15 | 1 |
| Seed7 Frachter-Cashflow nach bezahlter Arbeit und Hüllenkäufen | 0 | **−754 ISK** | **−1.368 ISK** | **−3.078 ISK** |
| Seed7 NPC3-Endkasse | 4.242 | 995 | **0** | **0** |
| Seed7 NPC3-Kostenunterdeckung insgesamt | 0 | 0 | **90.598** | **87.268** |

**Achtung – Cashflow, nicht vollständige Ergebnisrechnung:** Frachter-Netto ist der historische Kassenabfluss/-zufluss aus tatsächlich ausgeführten Frachter-Warenkäufen und -verkäufen einschließlich Gebühren, abzüglich tatsächlich bezahlter Frachter-Betriebsarbeit und aller tatsächlich gekauften Frachterhüllen. Noch nicht verkaufte Ladung und vorhandene Schiffshüllen bleiben Vermögen; deren Restwert wurde nicht eingepreist. Minerarbeit und Miner-/Jägerhüllen sind **nicht** in diesem isolierten Frachter-Cashflow, werden aber gesondert als NPC3-Kostenunterdeckung ausgewiesen. Außerdem ist die angebliche Vollkosten-Probe keine vollständige Positionskostenrechnung: Sie kalkuliert zwei geplante Flugrichtungen, nicht spätere ungeplante Leer-/Warte-/Fehlpositionsfahrten. Sie ist **keine** produktreife Profitabilitätsregel.

**[BESTÄTIGT]** Im getesteten Kern vermeidet die auf sichere *Zielsysteme* beschränkte Entscheidung zwar den Tod des ersten bezahlten Frachters in beiden Seeds, blockiert aber wirtschaftlich wichtige Fahrten und führt zu **0 NPC3-ISK**, während echte Minerkosten mangels Zahlung auflaufen. Rund 1.400 riskante Leer-/Transportabflugversuche pro Krisenwelt werden im Versuch für das ausgesuchte Händlerziel abgelehnt. Die Schiffe bleiben dabei vorhanden; die zahlungsunfähige Gesamtflotte arbeitet im Originalkern weiter. Die initiale echte Fracht muss bei Umsatzmangel nicht sofort zum Nullwert verschwinden; die Studie beweist deshalb **keine** vollständige Verlustschätzung. Dass risikobewusstes Handeln nur Hüllen erhält, ist kein positiver wirtschaftlicher Nachweis.

**[NEGATIVGATE]** Weder `risk-only` noch `fullcost` rechtfertigen eine Produktintegration oder eine starre Pflichteskorte. Insbesondere dürfen die ungefähr **87.000–91.000 ISK ungedeckte NPC3-Betriebskosten** nicht als stabiler Wirtschaftszustand umgedeutet werden. Als nächster, enger **Phase-B**-Befund muss der Zeitpunkt ermittelt werden, an dem durch Nichtfahrt die Kasse ausfällt, welche Miner noch Arbeit erzeugen, und warum die autonome Leerpositionierung bei fehlenden **finanzierbaren** Trades weiterläuft; danach erst risikofinanziertes Bewegen/Warten und Eskortenstärke gemeinsam planen.

## Status und weitere Entscheidung

**[OPTION]** Sind die risikoaversen Varianten weniger verlustreich, aber blockieren bezahlbare Nachfrage, darf das nicht als Erfolg gelten. Wir prüfen dann eine **tatsächlich wirksame, kapitalgedeckte** Escort-/Warteentscheidung und später mögliche sichere Wege; erst danach 13 Seeds ×90 Tage, Krisenfälle, negative Renditen und Save/Load unter einer eigenen Regelversion. Die vorrangige Phase B (stationäre Nachfrage und NPC3-Minerfinanzierung) bleibt grundsätzlich ungelöst. Kein PR-Merge oder Deployment ohne gesonderte Freigabe.
