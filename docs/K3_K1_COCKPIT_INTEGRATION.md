# K3 + K1-Miner-Cockpit: Integrationsprüfung

**[DRAFT / 12.11.2026]** [PR #306](https://github.com/tobiasfranziskus/Check/pull/306), Basis [K3 #304](https://github.com/tobiasfranziskus/Check/pull/304) Head `beb9bd80b79dbb65f98e44cde480ea5919fe1217`. Übernahme der K1-UX aus [PR #305](https://github.com/tobiasfranziskus/Check/pull/305). Produkt-`main` (`04124f2b`) bleibt unverändert.

## Was gemeinsam funktioniert

- **Wirtschaft:** Original-K1/W0–W5-Regel199, vollständige bezahlte Miner-/Frachter-Nachfolge aus K2 und von K3 geprüfter negativer Materialbefund. Der deterministische Seed42-S12-Weltzustand behält 33.000 ISK, Mint/Burn null und letzten Wasserverkauf an Tag 10. Vier neue Frachter arbeiten nach echtem Kauf und Transfer. Die Diagnose beweist **nicht**, dass jede mögliche frühere Beschaffungsstrategie scheitern muss.
- **Spielbarkeit:** Eigenen Miner kaufen, echten 2D-Flug anstoßen, Kurs/Sollfahrt (Original-`shipSteer`) selbst steuern, physisch bremsen und andocken; Flug-HUD aus realem Flugkörper und bereits finanzierter Flugreserve. Keine Doppeleconomy, kein neuer Simulations-Tick und keine Geldregeländerung.
- **Aufgelöste Textkonkurrenz:** In `prototypes/welt/app.js` sind die **K2-Miner-Zeile und alle drei K3-Frachter-Statuszeilen ausdrücklich erhalten**. Pilotencockpit ergänzt die Flugansicht; die K3-Wirtschaftsanzeige bleibt eigenständig. K3-Diagnose-/Testskripte, Forschungsmotor, Regel195-Singlefiles und Speicherdateien sind nicht angepasst.

## Nachweispflicht

1. `node --test tests/*.test.mjs`: historischer kompletter Satz, K2-QA und K3-Frachtertests. Den 15 × 90-, 5 × 365- und 2 × 730-Tage-Dauertest ebenfalls durchführen, erwartete Negativfälle nicht abschwächen.
2. `node tools/k3-frachter-diagnose.mjs > "$RUNNER_TEMP/k3-diagnose.json"` und `diff` gegen `docs/K3_DIAGNOSE_SEED42.json`.
3. `node scripts/build-w5-singlefile.mjs --check` für identische, unveränderte produktive Root-Einzeldateien.
4. In Chromium und WebKit je vier Touchgrößen: K1-Basis-Browsertest **und** `tests/welt-cockpit-browser.cjs`. Zahlungsreserve, Handsteuerung, Bremse, Dock, Pendelsperre, dynamisches HUD, Hash, IndexedDB und JSON-Import/-Export.
5. Drei CI-Workflows dürfen nur nach `completed/success` als bestanden bezeichnet werden. **Kein** CI-Lauf ersetzt echte iPad-Safari-/NAS-Geräteabnahme.

**Vorherige Einzelbelege:** K3 [CI #43166524778](https://github.com/tobiasfranziskus/Check/actions/runs/43166524778), K1-UX [CI #43166454615](https://github.com/tobiasfranziskus/Check/actions/runs/43166454615) jeweils vor der Integration grün. Dies ist ausdrücklich **kein** neuer kombinierter CI-Nachweis.

## Grenzen und nächster wirtschaftlicher Schritt

Kein automatischer Release, keine Spieler-Save-Migration und keine pauschale Geldemission. Ein folgendes, gesondert zu prüfendes **K4-Beschaffungsexperiment** sollte die S12-Warenallokation zu verschiedenen Zeitpunkten mit ausschließlich existierenden Original-Aufträgen und vorfinanzierten Kapitalmitteln verändern, statt Material zu erzeugen oder rückwirkend Exporte zu löschen. Ein rechnerisch möglicher Weg ist nicht automatisch eine Produkt- oder Balancingfreigabe.
