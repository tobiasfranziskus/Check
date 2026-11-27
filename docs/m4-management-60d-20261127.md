# M4 – zusammenhängender technischer Standard-Managementpfad

[DRAFT / W-20261127-01] 27.11.2026 · Basis `ac0fc648dafe3a4aa48adce79313052584b386b1` · Auftrag [#658](https://github.com/tobiasfranziskus/Check/issues/658).

## Testvertrag

- Start exakt wie der reguläre Standardkarrierepfad in `prototypes/spiel/spiel.js`: Seed 42, originaler private195-Export und bestätigte J8-Übernahme auf Regel204. Keine Fremdspielstände, keine Handflugaktion, keine Haus-Erz-Kopie, kein Regel207/PIR, keine Politikänderung, kein privater Wasserstützungskauf.
- Erst eigener Miner und Frachter, bezahlte F4-Runde, danach zusätzlicher Miner und echte lokale W1-Erzförderung. Fortsetzung nur mit original angebotenen Managerbefehlen und real verstrichenen Minuten. Kein erzwungener Umsatz, kein zusätzlicher Kauf einer Hülle zur Überdeckung von Käufer- oder Lagerproblemen.
- Nach einem Tag ohne Hausumsatz und ohne ausführbare F4-Fracht: laufende Förderung über das vorhandene Stop-Angebot pausieren. Während der Beobachtung legale, plausibel finanzierte Neustartmöglichkeiten für Erz/Eis prüfen. Nach zwei weiteren Tagen ohne solchen Neustart den beobachteten wirtschaftlichen Stop mit allen verfügbaren und gesperrten Angeboten festhalten, alternativ bis Minute 86400 fortsetzen. Dies ist ein vorher festgelegter, konservativer Testentscheid, keine neue Produktregel oder automatische Förderungspause im Produkt. Er beweist weder das globale früheste Scheitern aller möglichen Strategien noch deren Unmöglichkeit.
- Checkpoints (Start, Transit, erste bezahlte Runde, Tagesgrenzen, Kostenkontrolle/Ende): Originalhash, alle Kassen, Originalkontobelege, Lager, Warenledger, Eigentum, Flottenstatus, W3/W4/W5, Frachtlohn/Tarif und lesende Managerangebote. Weltgeld 33000, kein Mint/Burn. Tatsächlicher Sessionwechsel per JSON-Import und kompletter Replay derselben Aktionen und Zeitschritte; Ablehnungen bleiben byteidentisch. Bestehende Referenzhashes für Start und erste F4-Runde unverändert.
- Abbruch der gewählten wirtschaftlichen Strategie ist ein zulässiges technisches Testergebnis, aber kein Bestehen von M4. Auch 60 simulierte Tage allein beweisen keine wirtschaftliche Tragfähigkeit. Andere profitable Strategien müssen gegebenenfalls separat untersucht werden.

## Reproduktion

```sh
node --test tests/m4-management-60d.test.mjs
node --test tests/*.test.mjs
```

Die Ausgabe enthält `M4_MANAGEMENT_60D_SNAPSHOT` und `M4_MANAGEMENT_60D_RESULT` samt Zeit, Hash, Entscheidungsspur, Blockadegründen und Endbuchungen. Die vorhandene JavaScript-CI wird über die neue Testdatei ausgelöst. Ausführungsstatus und Originallogs sind auf dem konkreten Draft-Head zu prüfen. Lokaler Checkout derzeit nicht verfügbar (DNS github.com), Node 22.16.0 vorhanden, lokaler Integrationslauf nicht ausgeführt. Kein neuer Browser-, Geräte-, Live- oder Blindtest; kein Modelltransport.

## Abgrenzung

Die historischen 48 Fahrten mit privatem Wasserverbrauch aus `tests/m4-u5-engpass-ablauf.cjs` und die gepaarten Haus-Erz-Langzeitnachweise aus #663 bleiben unverändert. Sie gelten nicht als dieser Standardlauf. Die wirtschaftliche Aussage dieses Drafts ist bis zu tatsächlich ausgeführten CI-Logs offen. Keine Spielcode-/QA-/Roadmap-/Statusänderung, keine Veröffentlichung. Kein zusätzlicher Arbeitsauftrag eröffnet.
