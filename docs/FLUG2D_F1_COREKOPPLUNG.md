# Flug2D F1 – Originalwirtschaft mit gemeinsamem Flugzustand [DRAFT / ANALYSE]

**Stand:** 10.11.2026. Basiskette: [F0 #290](https://github.com/tobiasfranziskus/Check/pull/290), [F0-Performance #293](https://github.com/tobiasfranziskus/Check/pull/293). **Parallel unabhängig:** Codex führt G1-Grafik #292 und die F0-Bestandteile auf einem eigenen Main-basierten Forschungsbranch zusammen. Dies ist **kein Produkt-Release**.

## Forschungsumfang

F1 ist als klar getrenntes Opt-in mit **Schema8 / experimenteller Regelversion196** umgesetzt. Dieser Forschungswert ist keine Produktfreigabe und kann vor F1-Abnahme geändert werden. Die alte **Regel195** wird weder in Verhalten noch in Wirtschaftspreisen, RNG, Ledger, Trust Funds, Mining-Aufträgen oder Spielstandsformat verändert.

Die einzige Wirtschaftsautorität bleibt der **bytegleich unveränderte** W0–W5-Core aus `prototypes/w5ac/rule191-w5-ferry-core.js`. `prototypes/flug2d/f1-kopplung.js` ruft `createPrivateWageResearch()` auf und verwaltet **ausschließlich im F1-Adapter** die Forschungskennung 196. Jeder Wirtschaftsaufruf wird synchron unter der internen Regel195-Kennung ausgeführt und die Forschungskennung anschließend in einem `finally`-Block wiederhergestellt. So bleiben insbesondere die internen Vollkosten-/Endnachfrage-/Treuhand-Audits der originalen Version aktiv. **Keine kopierte Wirtschaftsschleife, keine Änderung am Original-Core.** Im gleichen Zustand laufen F0-`flug-kern.js` und der bestehende Wirtschaftstick:

- `state.flug.schritt` ist 0 bis 59, `state.tick` zählt weiterhin echte Core-Minuten.
- `teilschritt(state)` ruft F0 genau einmal auf; erst beim Überlauf nach 60 Flugsekunden `wirtschaft.step(state,rules)` **genau einmal**.
- `minute(state)` verarbeitet genau 60 Teilschritte; wenn sämtliche Miner angedockt sind und kein Flugkörper aktualisiert werden müsste, wird derselbe eine Wirtschaftsminute direkt ausgeführt. Dieser stille Schnellweg verändert keine Physik: 60 F0-Schritte an angedockten Schiffen sind wirkungslos.
- `execute(state,cmd)` führt F0-Flugbefehle sekundengenau sofort aus und reicht sämtliche bestehenden Wirtschaftsbefehle an **dieselben** Regel195-Implementierungen weiter. `submit` bleibt die alte, minutenbasierte Wirtschaftsqueue; Flugbefehle dürfen dort nicht eingereiht werden.
- Nur Miner erhalten einen Flugkörper (initial und nach einem **normal finanzierten** `shipBuy`), Frachter und Jäger bleiben in der alten abstrakten Logik. NPC und Spieler verwenden dieselben F0-Minerschiffbefehle und die gleiche Physik.
- Noch **keine Ortsbedingungen**: Bergbau und Verkäufe prüfen weiterhin ausschließlich die Bedingungen der originalen Regel195. Das ist F1 und **nicht F2**. Keine Flugkosten und kein Treibstoff.

## Save, Load und Geldschutz

- `save` nutzt den unveränderten Core-Serializer. `load` prüft die F1-Forschungskennung und führt die vollständige originale Rule195-Ladeprüfung **an einer separaten Wirtschaftsprojektion ohne Flugfelder** aus. Anschließend wird der vollständige Regel196-Zustand inklusive strengem F0-Audit akzeptiert oder abgelehnt. Der Original-Core muss dafür keinerlei neue Regelversion kennen.
- Regel196-Spielstände enthalten `state.flug` und einen `flug`-Teil bei jedem Miner. Nur Miner dürfen einen solchen Teil besitzen. Fremde Felder, fehlende Körper und ungültige Koordinaten werden abgelehnt.
- **Keine automatische Migration**: Rule195-JSON wird von F1 verweigert, Rule196-JSON vom unveränderten Rule195-Lader verweigert. Deshalb alte Spielstände und produktive IndexedDB unverändert lassen.
- Die Regel195-Economy-Ausgabe wird zum Vergleich durch Entfernen ausschließlich der neuen Flugfelder und Rücksetzen **nur der Forschungsregelnummer zur Normalisierung** mit Rule195 verglichen; die eigentlichen Geld-/Waren-/RNG-/Vertragswerte bleiben vollständig im Vergleich enthalten.

## Dateien / Test

| Datei | Änderung |
| --- | --- |
| `prototypes/w5ac/rule191-w5-ferry-core.js` | **bytegleich unverändert**; weiterhin dieselbe Originalwirtschaft |
| `prototypes/flug2d/f1-kopplung.js` | additiver Adapter um originalen Regel195-Core; Forschungshülle196, gemeinsame Uhr, Flugbefehle/Minute, Finanzierungsschutz und strenges Save/Load |
| `tests/flug2d-f1.test.mjs` | Tick 59/60, stiller Schnellweg, freier Flug, identische Originalwirtschaft, realer Miner-Kauf, Queue, Save/Load, manipulationsfeste Daten, 13 Seed-Gegenläufe |
| `docs/FLUG2D_F1_COREKOPPLUNG.md` | Architektur, Grenzen, Prüf- und Integrationsgates |

**Gezielter Aufruf:** `node --test tests/flug2d-f1.test.mjs`  
**Gesamt:** `node --test tests/*.test.mjs`

### Offen vor F1-Freigabe

- CI für den zusammengeführten Stand mit G1 / #292 / #293 und neuem `main` (#289-Import-/Save-Schutz); `node scripts/build-w5-singlefile.mjs --check` muss explizit grün bleiben. Der erste Entwurf, der die Original-Core-Datei modifizierte, wurde aufgrund dieses Schutzgates verworfen und vollständig aus dem Branch-Diff zurückgenommen.
- Vollständige **13 × 90 Spieltage** unter den originalen wirtschaftlichen Zahlungs- und Krisenfällen. Die im F1-Test verwendeten **13 × 720 Minuten** sind lediglich kurze technische Gegentests, **keine** 13×90-Tage-Abnahme.
- Unabhängiger Replay-Hash auf F1 mit Flugbefehlspfaden und Browser-JavaScriptCore-Gegenlauf.
- Integration der optionalen F1-Autorität in die UI-Hülle sowie Pflege derselben Regelnummer/Save-Version in jeder Singlefile-Fassung.
- Bei F2: echte Miner-Ortsbedingungen (Feld/Dock), NPC-Auftragsautopilot, erweiterte Buchungs-Audits und neue 90-Tage-Economy-Referenzen. F2 würde mit den Forschungswerten etwa 29 % Miner-Durchsatz kosten; das ist **keine** F1-Regeländerung.
- Echte iPad-Safari-/NAS-Abnahme, insbesondere längerer Gebrauch und Save/Load mit Spielständen vom richtigen Profil.

**Kein Merge nach main, keine Änderung der produktiven `index.html`/`aphros-void.html`, kein Deployment, kein stilles Überschreiben von Spielständen.**
