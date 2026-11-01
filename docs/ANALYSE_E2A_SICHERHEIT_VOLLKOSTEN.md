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
- **CI zunächst offen**, bis sie auf dem PR-Head erfolgreich abgeschlossen wurde. Auch eine grüne CI ist keine Zustimmung zum risikobasierten Produktcode, keine 13-Seed-/365-Tage-/iPad-/NAS-Abnahme.

## Status und weitere Entscheidung

**[OPTION]** Sind die risikoaversen Varianten weniger verlustreich, aber blockieren bezahlbare Nachfrage, darf das nicht als Erfolg gelten. Wir prüfen dann eine **tatsächlich wirksame, kapitalgedeckte** Escort-/Warteentscheidung und später mögliche sichere Wege; erst danach 13 Seeds ×90 Tage, Krisenfälle, negative Renditen und Save/Load unter einer eigenen Regelversion. Die vorrangige Phase B (stationäre Nachfrage und NPC3-Minerfinanzierung) bleibt grundsätzlich ungelöst. Kein PR-Merge oder Deployment ohne gesonderte Freigabe.
