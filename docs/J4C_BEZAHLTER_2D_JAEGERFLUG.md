# J4c – Selbst steuerbarer, tatsächlich bezahlter Spielerjäger im gemeinsamen Wirtschaftskern

**[DRAFT / Forschung Regel204 · 14.11.2026]** [Draft-PR #344](https://github.com/tobiasfranziskus/Check/pull/344) gegen J4b #343, nicht gegen `main`. **[MAIN]** unverändert Regel195/Schema8. Es gibt **kein neues Produktbalancing**, keinen neuen Laufzeitdienst und keine Migration produktiver Spielstände.

## 1. Warum J4c und was ist echt?

J4b [#343](https://github.com/tobiasfranziskus/Check/pull/343) hat auf beiden Seeds aus wirklich bezahlter Produktionskette 8 Bauteile + 4 Material → 1 Jäger in 32 bezahlten Werftminuten nachgewiesen. Der Original-`shipBuy` hat daraus erst nach 900-ISK-Kauf die echte `sh023`-ID mit Eigentümer `house`, F6-Körper, Nadir-Dock und **33.000 ISK / Mint0 / Burn0** erzeugt.

J4c schafft nun den **ersten tatsächlich persönlich fliegbaren Jäger auf demselben Wirtschafts- und F6-Zustand**, statt des separaten F8-Trainingszustands. Nur wenn eine vollständige J4b-Kaufquittung (`kanon.jaeger.kaeufe`) mit korrektem tatsächlichen Schiff und Spielerrechte im aktuellen Regel204 vorliegt, akzeptiert `m_core_flugplan` die **Originalbefehle** `shipUndock`, `shipSteer`, `shipFlyTo`, `shipApproach` und `shipDock`. Dasselbe F6-Raster mit 60 Flugsekunden pro Wirtschaftsminute bewegt einen einzigen autoritativen Schiffs-Körper. Keine Teleportation, keine zusätzliche Spielwelt, keine Treibstoffkosten.

## 2. Geld, Löhne, Verschleiß

- Wie Miner und spielereigene Frachter muss der Spieler beim Abdocken **40 ISK** auf das original existierende/dynamisch angelegte, eindeutig an die Schiff-ID gebundene K1-Konto `k1_flug_sh023` überweisen. Diese Liquidität wird dem Eigentümerkonto `house` entzogen, nicht hinzugefügt. Fremde Eigentümer und unbekannte/ehemalige Trainings-IDs dürfen nicht fliegen.
- Nach jeder tatsächlich fortgeschrittenen Wirtschaftsminute zahlt der originale K1-Kern **1 ISK an `pilot_house`**, aus der gebundenen Reserve. Der Originalmechanismus für gebuchte Nachschüsse, gestrandeten Flug bei Geldmangel und Rückzahlung nicht benötigter Reserve wird unverändert wiederverwendet. Doppelabbuchungen und Gratis-Flugrechte sind durch dieselben Audits ausgeschlossen.
- Der reale Aktivminutenzähler `kanon.verschleiss[sh023]` speist die bestehende Formel `Anlagewert = 900 - min(900, floor(aktiveMinuten × 300 / 1000))`. Die **300 milli-ISK/min** werden ausschließlich im separaten Regel204-Forschungsprofil eingesetzt und sind kein neues Produktbalancing. Wertverlust ist keine heimliche ISK-Buchung; der Spieler muss für zukünftigen, rechtmäßig finanzierten Hüllenersatz selbst aufkommen. Weder Reparatur noch Kopfgeld werden erfunden.
- Vollständige K1-/F6-/J4b-/Waren-/Flug- und Eigentumsaudits bleiben aktiv. Der Original-J4b-Audit lässt den off-dock-Aufenthalt des Jägers nur im isolierten Regel204 bei tatsächlich aktivem Pilotenlohn-Escrow zu. K1/Regel199 bis J4b/Regel203 behalten ihre bisherigen Flugrechte und Originalfehlermeldungen.
- `ausRegel203J4c(json)` ist ein **expliziter, einmaliger und vollständig validierter Regel203→204-Forschungsadapter**. Er setzt ausschließlich die Versionskennung um, übernimmt Originalflugkörper/Schiffseigentum/Finanzbelege unverändert und prüft den Quellhash. Bei fehlenden Jägerbelegen gibt es keinen gratis Jäger.

## 3. Tatsächlich ausgeführte fokussierte Tests

[Node22-J4c-Fokus in GitHub Actions #43595269213](https://github.com/tobiasfranziskus/Check/actions/runs/43595269213) hat **5/5 Tests, 0 Fehler** im fokussierten Job bestanden, mit beiden echten Seeds 42 und 7. Beide verwendeten die vollständige frühere W0–W5/J2/J3/J4a/J4b-Finanzierung und danach denselben Original-F6-Kern für Abdocken, echten Kursflug, Handsteuerung, Rückdockung und Reserveabrechnung.

| Eigenschaft | Seed 42 | Seed 7 |
|---|---|---|
| Gekauftes Schiff | sh023 / house | sh023 / house |
| Pilotendienst | 7 bezahlte Minuten / 7 ISK | 7 bezahlte Minuten / 7 ISK |
| Buchwert nach Flug | 898 ISK | 898 ISK |
| Spielerkasse | 1.582 ISK | 1.582 ISK |
| Gesamtgeld | 33.000 ISK | 33.000 ISK |
| Mint/Burn | 0 / 0 | 0 / 0 |
| Tick | 22362 | 22362 |
| Replay-/Endhash | `6996fc6a3023cce9` | `b1b07234ca97a0a8` |

Der vorherige rote Fokus-Test zeigte zunächst nur falsche Audit-Sichtbarkeit (`spielerJaeger` im K1-Loop) und die Ganzzahl-Abschreibungsgrenze (nach 3 Minuten noch 0, nach 4 Minuten 1 ISK). Die Regression gegen den alten K5-Regel199-Referenzlauf ergab bis Tick21612 **identische Hashes**. Schließlich wurde die unveränderte historische K1-Fehlermeldung erhalten, damit die Original-Fallback-/Altversionsprüfungen wieder durchlaufen.

**Nicht als bestanden bezeichnet**, solange noch nicht abgeschlossen: alle späteren finalen PR-Head-CI-Workflows, Chromium/WebKit-UI-Matrizen und ein unabhängiger 13×90-Tage-Nachhaltigkeitsbeweis für den Regel204-Jägerbetrieb.

## 4. Echte statische Touch-Oberfläche

`prototypes/j4c/index.html` ist ein eigenständiger statischer HTML/CSS/VanillaJS-Prototyp. Er benötigt keinen Backend-/Framework-/CDN-/Builddienst; er bindet **genau die originalen F6-/Weltkernmodule**, führt nur einen autoritativen Regel204-Zustand und rendert eine aus dem echten F6-Körper abgeleitete 2D-Ansicht.

- Touch: Abdocken, freies Steuern mit Kurs/Schub, Marker anfliegen, Andocken, Pausieren/Starten; Status mit Eigentum/Ort/Konto/Pilotenreserve/Verschleiß/Weltgeld. Der gezeichnete Marker ist keine echte Kampfbelohnung, nur eine Navigationsmarkierung.
- Keine Gratis-Demo-Hülle: Ein gültiges komplettes Regel204-JSON mit wirklich gekauftem `house`-Jäger muss importiert werden. Regel203-Saves dürfen **nur nach sichtbarer ausdrücklicher Bestätigung** umgewandelt werden. Der Import wird zuerst im autoritativen Core auditiert. Kein automatischer produktiver Save-Zugriff, keine Browser-Save-Überschreibung.
- Über `tools/j4c-authentisches-beispiel.mjs` erstellt GitHub Actions aus zwei vollständig **wirklich durchgerechneten** Wirtschafts- und Kaufketten Seed42/7 zwei vollständige, vor dem Upload geprüfte **Forschungs-JSON-Spielstände** als herunterladbares **CI-Artefakt**, ausdrücklich nicht als Gratis-Startinventar im Produkt. Nutzer können die Artefakt-JSON ins Cockpit importieren. Nach dem Test unbedingt über den button „Geprüften JSON-Spielstand exportieren“ sichern; kein Autosave.
- `tests/j4c-cockpit-browser.cjs` führt dieselbe echte JSON-Datei durch Chromium und WebKit auf je vier Touchgrößen: Start ohne Schiff, gesichertes Laden, echtes Abdocken, Pilotenreserve, F6-Flugbefehle und Sicherheits-JSON-Export mit originalem Welt-Audit. Das ersetzt nicht die echte iPad Safari-/NAS-Geräteabnahme.

## 5. Nicht aktivierte Mechaniken

Der visuell vorhandene F8-E-Duelltrainer liegt weiterhin auf **einem anderen Draft-Branch** und ist weder ein gekauftes J4c-Schiff noch eine vom autoritativen Kern bezahlte Kampfmaschine. J4c schaltet **keine echten Piraten, keine Kampf-/Modulschäden, keine Kopfgeld-Minting-/Lohnreserve für Jägerkampf, keine kostenlose Rettung, keine Schiffs-Spawns, keine automatische Migration** frei. Die Integration der F8-Ziel-/Duellmechanik in das echte `sh023`-Objekt ist das nächste gesonderte Forschungs- und Finanzierungs-Gate.

**Kein Merge/Deployment**, keine neuen produktiven Waren- oder Verschleißregeln ohne Freigabe.
