# Kanonische Welt K1 (Forschungsregel 199)

**Nicht das veröffentlichte Spiel.** Ein Zustand, ein Tick, ein Spielstandformat für Wirtschaft und Flug.
Bericht: [docs/KANONISCHE_WELT_K1.md](../../docs/KANONISCHE_WELT_K1.md), Wirtschaft: [docs/K1_WIRTSCHAFT_VERGLEICH_UND_TESTS.md](../../docs/K1_WIRTSCHAFT_VERGLEICH_UND_TESTS.md).

## Starten

Das Repository über einen statischen HTTP(S)-Server ausliefern und `prototypes/welt/index.html` öffnen. Kein Build, kein Backend.

1. **Station → Miner kaufen** (600 ISK aus dem eigenen Konzern).
2. **Flug → Pendelauftrag Eis**: der Miner fliegt zum Eisfeld, fördert 50 Eis, fliegt zurück und verkauft am Dock.
3. **Weiter** drücken. Die NPC-Spedition kauft ihren Frachter selbst, Nadir produziert Wasser, Haushalte kaufen.
4. **Konzern → Überschuss ausschütten** und **Station → Wasser kaufen** sind freiwillig. Wer spart, entzieht dem Kreislauf Geld.

## Manuelles Miner-Cockpit – K1-UX auf K3 (DRAFT)

1. Unter **Station** einen echten Miner aus der eigenen Kasse erwerben.
2. Unter **Flug → Handsteuerung → Abdocken** den ursprünglichen Befehl ausführen. Dabei werden **40 ISK** im gemeinsamen Core als reale Arbeitsreserve gebunden.
3. Im direkt sichtbaren **Steuerpult** den Kurs (0 Ost, 64 Süd, 128 West, 192 Nord) und die Sollfahrt (0–100 %) einstellen und **Manuell steuern** drücken. Die Oberfläche sendet ausschließlich `shipSteer` an denselben deterministischen Flug-/Wirtschaftskern.
4. Mit **Bremsen** (0 % Sollfahrt) verlangsamen, mit Original-**Andocken** zum Dock zurückfliegen. Nur dort und in echten Feldern gelten Original-Verkauf-/Förderregeln.
5. Ein aktiver Pendelauftrag sperrt die manuelle Steuerung. Die Anzeige zeigt echten Kurs, Geschwindigkeit, Lage und bezahltes Flugbudget. Reglerbewegungen ohne Klick ändern den Simulations-Hash nicht.

Die K3-Wirtschaftsdiagnose wird im Wirtschaftsbereich **unverändert** angezeigt. K3-Materialengpass und alle Negativszenarien bleiben bestehen. Kein neues Produktprofil, kein neuer Speicher- oder Flugkern, kein Main-Deployment.

## Dateien

| Datei | Aufgabe |
| --- | --- |
| `welt-kern.js` | `m_data_kanon`, `m_core_buch`, `m_core_anlage`, `m_core_flugplan`, `m_core_kreislauf`, `m_core_disponent`, `m_core_welt`; Übernahme `ausRegel195` |
| `welt-speicher.js` | Umschlag, Plätze, Sicherungen, Import/Export; IndexedDB `aphros-void-welt-v1` |
| `app.js`, `index.html` | Oberfläche; liest `welt.bericht()`, ändert nur über `welt.execute()` |

Der gemeinsame Wirtschaftskern bleibt `../w5ac/rule191-w5-ferry-core.js` (Profil 199), der Flugkern `../flug2d/flug-kern.js`. **[DRAFT K2 / #301]** Das W4-/W5-Materialaudit besitzt drei ausschließlich bei tatsächlichem Minerbau aktive Zusatzterme für den realen Materialverbrauch; für Regel195 bleiben diese null. Der K2-Minerbau ist im selben `welt-kern.js`, kein eigener Tick oder Motor. [Finanzierungs- und Warenbelege](../../docs/K2_FINANZIERTER_MINER_ERSATZ.md).

## Spielstände

Eigene Ablage in diesem Browser und nur für diese Adresse. Die Datenbanken des Hauptspiels werden nie geöffnet. Ein Regel195-Stand lässt sich unter **Spielstand → Regel195-Stand übernehmen** aus der im Hauptspiel exportierten JSON-Datei als neue Welt anlegen; das Original bleibt als Sicherung erhalten.

## Prüfen

```sh
node --test tests/welt-kern.test.mjs tests/welt-k2-miner.test.mjs tests/welt-speicher.test.mjs tests/welt-wirtschaft.test.mjs tests/referenzmodell-c.test.mjs
node tests/welt-browser.cjs            # Chromium, vier Touch-Größen
node tools/welt-szenarien.mjs --tage 90 --markdown
node tools/referenzmodell-c.mjs
node tools/bestandsaufnahme.mjs
```
