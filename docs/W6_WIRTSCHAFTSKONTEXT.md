# W6 – Wirtschaftskontext und opt-in NPC-Firmenpolitik [DRAFT · 15.11.2026]

**Status: [DRAFT], nicht in `main`, im Produkt nicht aktiviert.** Basis `main 17090ec6`. Draft-PR: #PR_NUMMER. Verbindlich bleiben [ROADMAP](ROADMAP.md), [PROJEKTSTATUS](PROJEKTSTATUS.md) und [AGENTS.md](../AGENTS.md). Zahlen unten stammen aus tatsächlich ausgeführten Läufen (Seed 42, frische Regel195→204-Kopie, Weltgeld 33.000 ISK, Mint/Burn 0); Rohdaten in [W6_ERGEBNISSE.jsonl](W6_ERGEBNISSE.jsonl).

## 1. Relevanter Code

| Datei / Funktion | Rolle |
| --- | --- |
| `prototypes/welt/welt-kern.js` | Einziger Regel204-Weltkern: Buch (`m_core_buch`), Verschleiß (`m_core_anlage`), Pendel/Flug (`m_core_flugplan`), Haushalte/Dividende/Rückfracht (`m_core_kreislauf`), K2-Minerwerft, K7-Vertrag (`k7Befehl`), Disponent (Ersatzkauf, Eisfracht, Wasserwerk, Haushaltskäufe, Ausschüttung) |
| `m_core_firmenpolitik` **[neu, DRAFT]** | Firmenentscheidungen je Wirtschaftsminute; nur Eigenbefehle über `execute` |
| `npcAutoSetzen(state, bool)` **[neu]** | Schaltet die gespeicherte Politik (`kanon.npcAuto`, Entscheidungsbuch `kanon.npc`); bucht nichts |
| `rule200-k7-industry-core.js`, `j2b/j3/j4b-*.js` | Original-W0–W5-Kern, Silizium, Bauteile, Jäger (unverändert) |
| `tools/w6-szenarien.cjs` **[neu]** | 13 Regime, unabhängige Geld-/Warenprüfung, 90/365/730 Tage |

## 2. Bestehende Ketten (unverändert genutzt)

- **Konsum:** Eis (npc3, 5 ISK) → Aldera → Eisfracht (transport) → Wasserwerk Nadir → Haushalte Nadir (14 ISK) bzw. Rückfracht → Haushalte Aldera (16 ISK). Löhne an Piloten-/Arbeiterhaushalte, Dividenden an Eignerhaushalte, diese kaufen Wasser.
- **Industrie:** K7-Erzvertrag (Nadir bietet; npc3, transport, werft_extern unterschreiben; 500 ISK Aldera-Vorfinanzierung) → Raffinerie (10 Erz → 5 Material) → Frachter (750) bzw. K2-Miner (600) → Verschleiß (0,3 ISK je aktiver Minute) → Ersatzkauf.
- **Jäger:** Silizium (nur rechtmäßig in Nadir gekaufter K2-Miner; Feld 16 Einheiten) → Bauteil (2 Material + 1 Silizium) → Jäger (8 Bauteile + 4 Material) → Kauf nur durch `house` (900 ISK).

## 3. Implementiert [DRAFT]

1. **Bergbaufirma `npc3`** disponiert freie eigene Aldera-Miner: startet einen Eis-Pendel nur bei bezahlbarer Abnahme (Aldera-Kasse, Eispuffer) und eigenem Betriebskapital, gibt einen wartenden Miner für signierbare Erzverträge frei, kauft Ersatz nur mit Kaufpreis plus Betriebskapital.
2. **Industrie `st_nadir`** raffiniert für bereits bezahltes Silizium, fertigt Bauteile und hält eine Jägerhülle vor; Material für die nächste Werfthülle bleibt reserviert.
3. **K7 unter Firmenpolitik:** vorhandene Vertragsautomatik wird mitgenutzt; Nadir bestellt kein Erz, solange eigener Bestand die nächste Hülle deckt (vorher 540 unverbrauchte Erz nach 30 Tagen).
4. **Ersatzrücklage [OPTION, nur bei `stilllegung`]:** Eine verbrauchte Hülle bindet ihre Rücklage nur, bis der Eigentümer eine neuere Hülle derselben Klasse besitzt. Vorher sperrte jede bereits ersetzte Hülle dauerhaft 600/750 ISK (nach 30 Tagen 22.263 von 33.000 ISK in zwei Firmenkassen, Stillstand).
5. Unfinanzierte Schritte unterbleiben und werden als Pause gezählt; abgelehnte Befehle gab es in keinem Lauf.

Ohne Aktivierung sind Startzustand, Tag-1-Hash und K7-Forschungsautomatik bitgleich zu `main` (Test 1).

## 4. Befunde

- **Aldera-Lücke aus #376 [ANALYSE, gelöst ohne Transfer]:** Die fehlenden 500 ISK waren gebundenes Betriebskapital. Alderas 1.000 ISK lagen in zwei parallelen 500-ISK-Erztreuhandkonten der NPC-Exportaufträge. Nach Erschöpfung des endlichen Exportetats (20.000 ISK, spätestens Tag 3) ist die Kasse wieder frei. Mit Firmenpolitik finanziert Aldera 19 Erzverträge in 90 Tagen aus Wassermarge.
- **Ausgangswelt ohne Politik:** Ab Tag 7 Stillstand; rund 21.000 ISK liegen bei Haushalten, die kein Wasser kaufen können, weil niemand Eis fördert.
- **Werft-Betriebskapital:** Hält die Werft nur 530 ISK (ein Bau), bindet eine unverkaufte Minerhülle ihr gesamtes Kapital; fällt dann der Frachter aus, steht die gesamte Wirtschaft (S03). Mit 1.060 ISK (zwei Bauten) trägt die Kette.
- **Jägerkette:** NPC-Silizium ist unwirtschaftlich (Miner 600 ISK für höchstens 2 Chargen, Erlös 384, Lohn 256). Das Feld begrenzt die Welt auf **zwei Jäger**. Für die Minerhülle des Spielers fehlt ein Spieler-Werftauftrag; der Test schließt ihn ausdrücklich zweiseitig.
- **Verbrauchte Hüllen** bleiben dauerhaft im Zustand (S02: 93 nach 90 Tagen); Rechenzeit und Spielstandgröße wachsen.

## 5. 13×90 Tage (unterschiedliche Regime, gleicher Seed)

| ID | Regime | Ergebnis Tag 90 | Hash |
| --- | --- | --- | --- |
| S01 | Konsumkreislauf ohne Stilllegung | trägt; Wassererlös 813.714, 0 Ersatz | `9b8e3482493461d2` |
| S02 | Verschleiß + Ersatz, Werftkapital 1.060 | trägt; 49 Frachter, 44 Miner, 93 Ersatzkäufe, 19 Erzverträge | `5582aecc49d4de89` |
| S03 | Verschleiß, Werftkapital 530 | Stillstand: Werft kann nicht vorfinanzieren | `2457086d6dc9d3db` |
| S04 | Nachfragemangel (2 Wasser/Tag) | läuft schwach; Erlös 19.940 | `b93426bd306b9801` |
| S05 | Haushalte sparen 80 % | Stillstand; Aldera kann Eis nicht zahlen | `211970d95d14316f` |
| S06 | Firmen schütten nichts aus | Stillstand; Firmen 29.530, Haushalte 60 ISK | `73f68c113c848f1f` |
| S07 | Kein Ersatzkauf | Stillstand nach Verschleiß | `2060fcb1a3e8babb` |
| S08 | Keine Wasser-Rückfracht | Stillstand; Eislager Nadir voll | `d0f4db55ff82f74f` |
| S09 | Wasserwerk steht | Stillstand; kein Erlös | `5272be3d5b55d4f0` |
| S10 | Firmen ohne Betriebsreserve | Stillstand; Minerwerft unfinanziert | `5abf6829115e78c8` |
| S11 | Vorratswerft | trägt; 50 Frachter, 47 Miner | `d8c1e60ea7d34633` |
| S12 | Puffer kleiner als Frachtcharge | Stillstand; Lieferkette reißt | `c46a93f5c4cc519b` |
| S13 | Wocheneinkauf/-dividende | läuft schwach; Erlös 21.286 | `b35642dd2bb1705c` |

Alle 13: Audit ok, Weltgeld 33.000, Mint/Burn 0, Save/Load hashgleich, Spielerkasse unberührt 3.000 ISK. Langläufe: siehe Abschnitt 7.

## 6. Haushalte und Endnachfrage (S02, 90 Tage)

- Löhne 368.752 ISK und Dividenden 408.017 ISK vollständig aus Firmenkassen; Haushalte konsumieren daraus 764.776 ISK Wasser.
- Industrielle Nachfrage entsteht nur aus Verschleiß; Ersatz wird von `transport` und `npc3` aus eigenen Erlösen bezahlt.
- Geld bleibt bei Aldera-Haushalten liegen (fonds_aldera 7.116, eigner_transport 7.023 ISK), weil die Rückfracht das Wasserangebot dort begrenzt (9.969 Minuten ohne Wasser am Wohnort).
- Es scheitern zuerst Werft (Vorfinanzierung) und Aldera (Lager-/Treuhandbindung); danach reißt die gesamte Kette, da jede Stufe nur einen Anbieter hat.

## 7. Langläufe

| Lauf | Ergebnis (Audit ok, Weltgeld 33.000, Mint/Burn 0) | Hash |
| --- | --- | --- |
| S01 · 365 Tage | trägt; 218.001 Eis, Wassererlös 3.354.668 | `f3a679417bba5194` |
| S01 · 730 Tage | trägt; 437.013 Eis, Wassererlös 6.727.284 | `85dd1f6779ca09fb` |
| S02 · 365 Tage | trägt; 200 Frachter, 178 Miner, 379 Ersatzkäufe, 76 Erzverträge, Löhne 1.492.920, Dividenden 1.641.777, Wassererlös 3.145.760 | `29933833f78d8676` |
| S02 · 730 Tage | S02_730_PLATZHALTER | – |
| S04 · 365 Tage | läuft gleichmäßig schwach; Erlös 78.608, 12 Ersatzkäufe | `52c4ebbef00c51ea` |
| S13 · 365 Tage | läuft gleichmäßig schwach; Erlös 89.816, 12 Ersatzkäufe | `ff888fa7ab5da839` |

Langläufe sind einmalig ausgeführte Werkzeugläufe (`node tools/w6-szenarien.cjs S02 365`), nicht Teil der Testsuite. S02 benötigt wegen der wachsenden Zahl verbrauchter Hüllen etwa 6,5 Minuten für 365 Tage.

## 8. Offene Produktentscheidungen [OPTION]

1. Aktivierung der Firmenpolitik im Spiel und Standardwerte (`stilllegung`, Werftreserve 1.060).
2. Rücklagenregel aus Abschnitt 3.4 als Kernregel bestätigen.
3. Spieler-Werftauftrag (Miner/Jäger) als eigener Befehl.
4. Siliziumvorrat/-preis; ohne Änderung höchstens zwei Jäger je Welt.
5. Ausmusterung verbrauchter Hüllen (Verschrottung, Restwert).
6. Zweite Frachtlinie: Der Kern erlaubt nur einen Frachtauftrag gleichzeitig; ein zweiter Frachter erhöht den Durchsatz nicht.
7. Exportetat: endlich und nach etwa zwei Tagen verbraucht; keine Emissionsregel freigegeben.

## 9. Nächster Integrationsschritt

Eigener Integrations-PR gegen `main`: Firmenpolitik als ausdrücklich wählbare Option in der Konzernsitzung (`prototypes/verbund/konzern-session.js`), Browser-/Touchprüfung, danach Produktentscheid zu Punkt 1–3.
