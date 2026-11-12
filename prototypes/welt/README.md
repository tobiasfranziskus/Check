# Kanonische Welt K1 (Forschungsregel 199)

**Nicht das veröffentlichte Spiel.** Ein Zustand, ein Tick, ein Spielstandformat für Wirtschaft und Flug.
Bericht: [docs/KANONISCHE_WELT_K1.md](../../docs/KANONISCHE_WELT_K1.md), Wirtschaft: [docs/K1_WIRTSCHAFT_VERGLEICH_UND_TESTS.md](../../docs/K1_WIRTSCHAFT_VERGLEICH_UND_TESTS.md).

## Starten

Das Repository über einen statischen HTTP(S)-Server ausliefern und `prototypes/welt/index.html` öffnen. Kein Build, kein Backend.

1. **Station → Miner kaufen** (600 ISK aus dem eigenen Konzern).
2. **Flug → Pendelauftrag Eis**: der Miner fliegt zum Eisfeld, fördert 50 Eis, fliegt zurück und verkauft am Dock.
3. **Weiter** drücken. Die NPC-Spedition kauft ihren Frachter selbst, Nadir produziert Wasser, Haushalte kaufen.
4. **Konzern → Überschuss ausschütten** und **Station → Wasser kaufen** sind freiwillig. Wer spart, entzieht dem Kreislauf Geld.

## Persönlicher Minerflug (K1-UX, Draft #305)

1. Unter **Station** einen Miner für 600 ISK kaufen.
2. Unter **Flug → Handsteuerung** den Core-Befehl **Abdocken** ausführen (40 ISK tatsächliche Flugreserve werden gebunden).
3. Nach dem Abdockmanöver im sichtbaren **Steuerpult** Kurs (0 Ost, 64 Süd, 128 West, 192 Nord) und Sollfahrt (0–100 %) einstellen und bewusst **Manuell steuern** wählen. Der echte `shipSteer`-Befehl setzt die Flugphysik um.
4. **Bremsen (0 %)** reduziert die Sollfahrt; wegen Trägheit stoppt der Miner nicht sofort. Mit dem bestehenden Befehl **Andocken** physisch zur Station zurückkehren. Fördern funktioniert ausschließlich im entsprechenden Feld und bei ausreichend geringer Geschwindigkeit.
5. Ein **Pendelauftrag** übernimmt den Flug automatisch; währenddessen sind die manuellen Regler gesperrt. Der Core prüft alle Finanzierungs- und Ortsregeln auch bei manueller Steuerung.

Das Steuerpult liest ausschließlich den echten Zustand und ändert ohne Klick weder Spiel noch Hash. Keine Geldmodell-/Physikänderung, keine produktive Freigabe und keine echte iPad-/NAS-Abnahme.

## Dateien

| Datei | Aufgabe |
| --- | --- |
| `welt-kern.js` | `m_data_kanon`, `m_core_buch`, `m_core_anlage`, `m_core_flugplan`, `m_core_kreislauf`, `m_core_disponent`, `m_core_welt`; Übernahme `ausRegel195` |
| `welt-speicher.js` | Umschlag, Plätze, Sicherungen, Import/Export; IndexedDB `aphros-void-welt-v1` |
| `app.js`, `index.html` | Oberfläche; liest `welt.bericht()`, ändert nur über `welt.execute()` |

Der Wirtschaftskern ist unverändert `../w5ac/rule191-w5-ferry-core.js` (Profil 199), der Flugkern `../flug2d/flug-kern.js`.

## Spielstände

Eigene Ablage in diesem Browser und nur für diese Adresse. Die Datenbanken des Hauptspiels werden nie geöffnet. Ein Regel195-Stand lässt sich unter **Spielstand → Regel195-Stand übernehmen** aus der im Hauptspiel exportierten JSON-Datei als neue Welt anlegen; das Original bleibt als Sicherung erhalten.

## Prüfen

```sh
node --test tests/welt-kern.test.mjs tests/welt-speicher.test.mjs tests/welt-wirtschaft.test.mjs tests/referenzmodell-c.test.mjs
node tests/welt-browser.cjs            # Chromium, vier Touch-Größen
node tools/welt-szenarien.mjs --tage 90 --markdown
node tools/referenzmodell-c.mjs
node tools/bestandsaufnahme.mjs
```
