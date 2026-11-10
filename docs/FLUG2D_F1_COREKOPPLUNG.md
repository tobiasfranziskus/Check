# Flug2D F1 – Originalwirtschaft mit gemeinsamem Flugzustand [DRAFT / ANALYSE]

**Stand:** 10.11.2026. Basiskette: [I0 #294](https://github.com/tobiasfranziskus/Check/pull/294) auf aktuellem main (inklusive Grafik #292, Flugoptimierung #293, F0 #290). Additiver F1-Quell-PR: [#295](https://github.com/tobiasfranziskus/Check/pull/295).

## Forschungsumfang

F1 ist als klar getrenntes Opt-in mit **Schema8 / experimenteller Regelversion196** umgesetzt. Dieser Forschungswert ist keine Produktfreigabe und kann vor F1-Abnahme geändert werden. Die alte **Regel195** wird weder in Verhalten noch in Wirtschaftspreisen, RNG, Ledger, Trust Funds, Mining-Aufträgen oder Spielstandsformat verändert.

Die einzige Wirtschaftsautorität bleibt der **bytegleich unveränderte** W0–W5-Core aus `prototypes/w5ac/rule191-w5-ferry-core.js`. `prototypes/flug2d/f1-kopplung.js` ruft `createPrivateWageResearch()` auf und verwaltet **ausschließlich im F1-Adapter** die Forschungskennung 196. Jeder Wirtschaftsaufruf wird synchron unter der internen Regel195-Kennung ausgeführt und die Forschungskennung anschließend in einem `finally`-Block wiederhergestellt. So bleiben insbesondere die internen Vollkosten-/Endnachfrage-/Treuhand-Audits der originalen Version aktiv. **Keine kopierte Wirtschaftsschleife, keine Änderung am Original-Core.** Im gleichen Zustand laufen F0-`flug-kern.js` und der bestehende Wirtschaftstick:

- `state.flug.schritt` ist 0 bis 59, `state.tick` zählt weiterhin echte Core-Minuten.
- `teilschritt(state)` ruft F0 genau einmal auf; erst beim Überlauf nach 60 Flugsekunden `wirtschaft.step(state,rules)` **genau einmal**.
- `minute(state)` verarbeitet genau 60 Teilschritte; wenn sämtliche Miner angedockt sind und kein Flugkörper aktualisiert werden müsste, wird derselbe eine Wirtschaftsminute direkt ausgeführt. Dieser stille Schnellweg verändert keine Physik: 60 F0-Schritte an angedockten Schiffen sind wirkungslos.
- `execute(state,cmd)` führt F0-Flugbefehle sekundengenau sofort aus und reicht sämtliche bestehenden Wirtschaftsbefehle an **dieselben** Regel195-Implementierungen weiter. `submit` bleibt die alte, minutenbasierte Wirtschaftsqueue; Flugbefehle dürfen dort nicht eingereiht werden.
- Nur Miner erhalten einen Flugkörper (initial und nach einem **normal finanzierten** `shipBuy`), Frachter und Jäger bleiben in der alten abstrakten Logik. NPC und Spieler verwenden dieselben F0-Minerschiffbefehle und die gleiche Physik.
- Noch **keine Ortsbedingungen**: Bergbau und Verkäufe prüfen weiterhin ausschließlich die Bedingungen der originalen Regel195. Das ist F1 und **nicht F2**. Keine Flugkosten und kein Treibstoff.

## Statischer F1-Spieltest (separat vom Hauptspiel)

Der Forschungsstand ist über [`prototypes/flug2d/f1-demo.html`](../prototypes/flug2d/f1-demo.html) in einem statischen Webserver zu öffnen, **nicht** über die produktive `index.html`. Zum Beispiel im Repository `python3 -m http.server 8000` ausführen und dann `http://localhost:8000/prototypes/flug2d/f1-demo.html` öffnen. Das Forschungs-PR ist derzeit **nicht auf GitHub Pages veröffentlicht**. Diese optionale Browserhülle nutzt die I0-UX08-Grafik und einen einzigen F1-Zustand: Der Spieler kann einen Miner nur über den originalen finanzierten `shipBuy`-Befehl erwerben, anschließend abdocken, Erz/Eisfelder anfliegen, manuell Kurs/Schub verändern und zum Dock zurückkehren. Die NPC-Miner stehen im gleichen Wirtschaftskern; ein NPC-Flug-Autopilot wird hier noch nicht vorgetäuscht. Kassen, Erz/Eis, Flugaudit und Wirtschaftsminuten werden lesend angezeigt. **Die Förderung ist bewusst noch nicht an den aktuellen Flugort gebunden; dies folgt erst in F2.** Kein Browser-Autosave, keine Produkt-IndexedDB. JSON-Export ist manuell, Import erfordert Forschungsregel196 und explizite Bestätigung.

Mit `node tests/flug2d-f1-browser.cjs` werden in Chromium (und auf CI auch mit `FLUG_BROWSER=webkit`) vier Viewports mit echten Touch-Taps, bezahltem Kauf, Abdocken, Wirtschaftsminute, Erz-Anflug, neutralem UX08-Rendering, Resize sowie Rule196-Export/Import und Zurückweisung von Rule195 geprüft. **Bestanden auf dem F1-I0-Codehead `5b4ea676`:** [Chromium #42906181809](https://github.com/tobiasfranziskus/Check/actions/runs/42906181809) **4/4**, [WebKit #42906181743](https://github.com/tobiasfranziskus/Check/actions/runs/42906181743) **4/4**. Einschließlich JSON-Export/-Import, Eingaben, Resize und unabhängigem F1-Hash `ddb96b7b2164c1fb` in Node22/Chromium/JavaScriptCore. Dazu [248/248 Node22](https://github.com/tobiasfranziskus/Check/actions/runs/42906181809), [Wirtschaftsregression](https://github.com/tobiasfranziskus/Check/actions/runs/42906181721) und [NAS-/W5-CI](https://github.com/tobiasfranziskus/Check/actions/runs/42906181922) erfolgreich.

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
| `tests/flug2d-f1-i0.test.mjs` | Kombinationsnachweis: finanzierter Spieler- und NPC-Miner, UX08-Rendering ohne Zustandsänderung, Erz-/Eis-Anflug, Andocken, Replay und F1-Forschungsreferenzhash |
| `prototypes/flug2d/f1-demo.html`, `f1-demo.js` | F1-Spieltest als statische gesonderte Browserseite, ohne Autosave |
| `tests/flug2d-f1-browser.cjs` | echtes Chromium-/WebKit-Touch- und Save/Load-Preflight in vier Größen |
| `docs/FLUG2D_F1_COREKOPPLUNG.md` | Architektur, Grenzen, Prüf- und Integrationsgates |

**Gezielter Aufruf:** `node --test tests/flug2d-f1.test.mjs tests/flug2d-f1-i0.test.mjs`  
**Gesamt:** `node --test tests/*.test.mjs`

### Offen vor F1-Freigabe

- CI auf diesem zusammengeführten F1-I0-Stand mit G1 / #292 / #293 und neuerem `main` (#289-Import-/Save-Schutz) ausführen; `node scripts/build-w5-singlefile.mjs --check` muss explizit grün bleiben. Der erste Entwurf, der die Original-Core-Datei modifizierte, wurde aufgrund dieses Schutzgates verworfen und vollständig aus dem Branch-Diff zurückgenommen.
- Vollständige **13 × 90 Spieltage** unter den originalen wirtschaftlichen Zahlungs- und Krisenfällen. Die im F1-Test verwendeten **13 × 720 Minuten** sind lediglich kurze technische Gegentests, **keine** 13×90-Tage-Abnahme.
- **F1-Forschungsreferenz vollständig gegen drei Engines abgeglichen:** `ddb96b7b2164c1fb` in Node/V8, Chromium/V8 und WebKit/JavaScriptCore, nach 34 Wirtschaftsminuten und 17 Flugteilschritten. Finanziert gekaufter Spieler-Miner und NPC-Miner fliegen zu Eis/Erz und zurück; Save/Load im Zwischenflug, Economy-Projektion identisch zu Regel195. Geprüft in vier Browsergrößen je Engine.
- Forschungsseite und Node-Kopplung sind vorhanden, aber Integration der optionalen F1-Autorität in den **produktiven** UI-Hub bzw. Singlefile-Release samt abgestimmter Save-Schema- und Regelversionsstrategie benötigt eigene Freigabe.
- Bei F2: echte Miner-Ortsbedingungen (Feld/Dock), NPC-Auftragsautopilot, erweiterte Buchungs-Audits und neue 90-Tage-Economy-Referenzen. F2 würde mit den Forschungswerten etwa 29 % Miner-Durchsatz kosten; das ist **keine** F1-Regeländerung.
- Echte iPad-Safari-/NAS-Abnahme, insbesondere längerer Gebrauch und Save/Load mit Spielständen vom richtigen Profil.

**Kein Merge nach main, keine Änderung der produktiven `index.html`/`aphros-void.html`, kein Deployment, kein stilles Überschreiben von Spielständen.**
