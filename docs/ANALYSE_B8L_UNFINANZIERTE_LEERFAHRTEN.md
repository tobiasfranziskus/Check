# B8l – Geldlose Leerpositionierung: Kostenursache und gezielter Gegenversuch

**Status [ANALYSE/DRAFT], 01.11.2026.** Ausgangspunkt `main 0d473e6` (Dokumentations-Merge #73), unveränderte `index.html` v0.12.5 / Regel14 / Schema8. Originalkern-SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`. **Keine Produktänderung, keine neue ökonomische Regel, keine ISK-Emission und kein Spielstandschema-Eingriff.** Einziger Unterschied zwischen den Varianten ist eine isolierte Entscheidungsbedingung im Testkontext, nicht in `index.html`.

## Beobachtete Ursache im Originalkern

`m_core_entscheidung.entscheidung` versucht bei Frachterauftrag `handeln` nach zweimaligem Warten ohne profitable Ware wiederholt eine **zufällige Leerfahrt**, ohne den verfügbaren Konzernkassenstand und die künftigen Arbeitskosten zu berücksichtigen. `m_core_stunde.betriebskosten` rechnet weiterhin gefahrene Arbeitsminuten ab, überweist aber höchstens das vorhandene Bargeld und stoppt unbezahlbar arbeitende NPC-Frachter nicht. **Folge:** Weiterlaufende, unbezahlte Frachterflüge nach Erreichen von null ISK. Das ist keine real finanzierte Transportleistung; es darf nicht als wirtschaftlich tragfähig gelten.

`m_core_schiffbau.ersatzkauf` benötigt bei bereits vorhandenen NPC-Schiffen reales Geld für Ersatz; die neuen Händlerhüllen werden in den Tests tatsächlich bezahlt. Die für **komplett leere** Sollflotten vorhandene ältere Zuschuss-Sonderregel wird im NPC3-Gegenversuch **nicht** ausgelöst, da NPC3 Miner besitzt; sie ist eine separate längerfristige Reformfrage.

## Nachvollziehbarer Gegenversuch

Einziger neuer Testdatei `tools/analyse-b8l-leerfahrten.mjs`; separater GitHub-Actions-Workflow. Reproduziert `B8l` direkt auf dem originalen Simulationscode von `main`. Gleiche sieben historische B1-Spielerbefehle; NPC3 erhält an Spieltag 14 einen geplanten Frachter-Sollplatz und kauft dafür den echten Frachter für **780 ISK**. Danach erhält er den validierten Originalauftrag `shipHandeln`.

Zwei 90-Tage-Welten für **Seed 42 und Seed 7**, jeweils vollständig deterministisch gedoppelt:

- **risk-only (historische E2a-Kontrolle):** NPC3 wählt nur sichere Zielsysteme, ansonsten ursprüngliche Handelsentscheidung mit zufälligen Leerpositionierungen. Die historischen E2a-Welt-Hashes müssen erhalten bleiben.
- **parked (minimaler B8l-Gegenversuch):** alles exakt wie `risk-only`, aber `npc3`-Frachter starten **keine neue zufällige Leerpositionierung**, sobald die Konzernkasse null ISK erreicht. Bereits begonnene Reisen und deren **echte Kostenforderung** bleiben bestehen. Kein Frachter wird verschenkt, kein Geld erzeugt, keine Minerausgabe fingiert; andere Frachter-/Konzern-/Piratenentscheidungen bleiben identisch.

`parked` ist noch **kein Vorschlag für eine vollständige Produktregel**: Es regelt weder Vorausfinanzierung einer Fahrt bei geringem Restguthaben noch Käufergeld, Frachtvertrag, sichere Route oder Konzerneintritt. Der einzelne NPC3-Gate dient ausschließlich der Ursachenisolation. Es bleiben reale Arbeitskosten einer bereits begonnenen Fahrt offen.

| Ergebnis nach 90 Tagen | Seed42 risk-only | Seed42 parked | Seed7 risk-only | Seed7 parked |
|---|---:|---:|---:|---:|
| Letzter positiver Kassenstand endet bei Tick | 22.680 | 22.680 | 20.820 | 20.820 |
| Ungedeckte NPC3-Frachterarbeit | 90.160 ISK | **155 ISK** | 90.335 ISK | **438 ISK** |
| Ungedeckte NPC3-Minerarbeit | 0 ISK | 0 ISK | 263 ISK | 263 ISK |
| Summe der ungedeckten NPC3-Arbeit | **90.160 ISK** | **155 ISK** | **90.598 ISK** | **701 ISK** |
| Neue echte Leerfahrten bei 0 ISK | 721 | **0** | 730 | **0** |
| Tatsächliche NPC3-Frachter-Warenverkäufe | 7 | 7 | 15 | 15 |
| NPC3-Endkasse | 0 ISK | 0 ISK | 0 ISK | 0 ISK |
| Original-Hash (risk-only) | `73785d4c405ba480` | – | `087efc37c2d74cee` | – |
| Gegenversuch-Hash (parked) | – | `fe10455c347e9602` | – | `aa8f9255a91c705f` |

*Die Tabelle beschreibt den im Chat tatsächlich ausgeführten direkten Core-Gegenversuch. PR-CI wird erst nach Abschluss gesondert belegt.*

**Interpretation:** Das unbezahlte Arbeitsvolumen wird um über 99 % reduziert, **ohne den Konzern wirtschaftlich zu retten**. Es werden keine zusätzlichen bezahlten Warenverkäufe erzielt. Diese Isolierung spricht für ein späteres konsequentes **Finanzierungs-Gate vor jeder Leerfahrt**, nicht für einen Gratisflug oder eine pauschale Zwangseskorte. Die weitere Wirtschaftsreparatur benötigt getrennte Analyse der Nachfrage-/Kaufkraft- und Miner-Einnahmekette.

## Prüfgates und Grenzen

- Die unveränderte E2a-`risk-only`-Welt muss an Tag 90 ihre historischen Hashes reproduzieren; alle vier Welten wiederholbar.
- 4 Welten × 2.160 stündliche Geld-/Warenaudits = **8.640** unabhängig geprüfte Zeitpunkte und Doppel-Replays; 4 × 8 = **32** Save/Load-Roundtrips. Originale 67 Node-Regressionstests.
- Tatsächlich fällige und gezahlte NPC3-Arbeitskosten getrennt nach Frachter und Miner, keine illegale Geld-/Warenänderung.
- **[OFFEN]** 13 Seeds ×90 Tage und 365 Tage, Migration/Produktregeln, iPad-/NAS-Abnahme. Keine Integration dieses Analyse-Hooks in das Spiel.
- **[EMPFEHLUNG]** Erst in einem separaten geprüften Produkt-PR die **allgemeine** vertraglich/finanziell gedeckte Disposition für alle NPCs und später Spieler entwickeln; ein bloßes Nullkassengate verhindert nicht das Einfahren in unbezahlbare Reisen. Für die große Versorgungslücke braucht es eigene Markt-/Kaufkraftursachenanalyse; Geldmodell B bleibt ein Rahmenziel ohne beschlossene Emissionsregel.
