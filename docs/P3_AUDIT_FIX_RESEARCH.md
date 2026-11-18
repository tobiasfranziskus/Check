# P3 – Sicherheitskorrekturen zum unabhängigen Audit #508 (nur Forschungsmodus)

**[DRAFT / RESEARCH-REMEDIATION, 18.11.2026]** Grundlage ist der unabhängige [Audit-PR #508](https://github.com/tobiasfranziskus/Check/pull/508) gegen [Forschungs-PR #506](https://github.com/tobiasfranziskus/Check/pull/506). **Kein neues Produktrecht, kein neues Save-Schema, keine Vorrangfreigabe, kein Merge oder Deployment.** Die Basis `main` und öffentliche Regel204-Saves bleiben unverändert. Alle Korrekturen sind weiterhin durch `NODE && APHROS_P3_FAIR_FERRY_RESEARCH==='1' && rulesVersion===204` gesperrt.

## Abhängigkeiten und Prüfstrategie

[PR #507](https://github.com/tobiasfranziskus/Check/pull/507) hat auf #506 bereits einen nachweislich bezahlten zehnten F4-Spielervertrag erforscht; die vorgelagerten #508-Sicherheitsprobleme gelten **auch für diesen Forschungsstrang**. Dieser neue Korrekturbranch wird absichtlich auf **#506** aufgebaut und bearbeitet nicht die Tests/Dateien von Codex #508. **#507 ist bis zu einem gesonderten Upstream-Abgleich weiter integrationsgesperrt.** Der ursprüngliche Auditbericht und seine roten Charakterisierungstests bleiben unverändert als Negativbeweis; eigene neue Tests prüfen die gewünschten Sicherheitseigenschaften.

## Forschungs-Fixes (gegenüber #506)

| Codebereich | Konsequenz |
| --- | --- |
| Aktive W5ac nach JSON-Reload | **Streckenbelegung wird aus `state.w5ac.active` statt aus der flüchtigen Pointer-Bindung abgeleitet**. Der Node-Forschungsweltbefehl, NPC-W3 und NPC-W5n dürfen auf der laufenden W5ac-Strecke keinen neuen Auftrag beginnen; der Forschungs-Audit lehnt gleichzeitig signierte W3/W5n/W5ac ab. Eine reguläre NPC-Fracht nach dem fertigen, original bezahlten Flug bleibt gestattet. |
| J8 verwendet validierte Weltkopien | Eine nur außerhalb des Saves angemeldete, **nicht vorab bezahlte** Forschungsvormerkung wird beim Zustandsobjektwechsel **mit Status `zustandswechsel-abgebrochen` explizit verworfen**, statt am alten Zustand und dessen Frist dauerhaft zu hängen. Danach kann man sich erneut anmelden. **Das ist kein persistentes Wartesystem und kein Nachweis von Vertragskontinuität.** |
| Keine ausführbare NPC-Gegenseite | Der flüchtige NPC-Vorrang wird bei real gestarteter NPC-Fracht freigegeben oder spätestens nach einer **120-Minuten-Forschungsfrist ab Hausstart**, sofern keine W5ac mehr läuft. Diese provisorische Zeitregel ist **keine beschlossene Fairness-/Balancingregel**, vor einer produktiven Lösung ist Mehrparteienprüfung nötig. |
| Stillgelegte Hülle | `m_core_anlage.stillgelegt` wird sowohl bei Anmeldung als auch unmittelbar vor dem Forschungskorridor-Start und beim direkten Node-Forschungsweltbefehl `shipReposition` geprüft. Ein wertloses, laut Policy stillgelegtes Schiff darf im Forschungsmodus nicht transportieren. |

## Sicherheitsgrenzen / unveränderte offene Punkte

- **Keine vorgezogene Treuhand:** Die Anmeldung bleibt unverbindlich. Nur der originale `shipReposition`-Befehl bindet bei Zuschlag seine echten 60 ISK auf `w5ac_transfer_reserved`; nachfolgende Pilotenzahlungen und Eigentumsbelege verbleiben unverändert im Core.
- **Kein Save-Vertrag:** Das Verwerfen bei J8-Kopie ist bewusst *fail closed*. Eine wirklich fortsetzbare, signierte und stornierbare Warteliste benötigt einen **neu zu entscheidenden, autoritativ gespeicherten Vertragszustand, eigenes Treuhand-/Idempotenz-/Migrationsmodell**. Es darf weder ein optionales Selbstautorisierungsfeld im Alt-Save entstehen noch eine stillschweigende Regel204-Migration.
- **Faires Langzeitverhalten nicht bewiesen:** #508 beobachtet erhebliche Regimeabweichungen bei bereits einem Zuschlag. Die temporäre 120-Minuten-Forschungsfrist ist nur eine Begrenzung des alten Phantomblocks, nicht die Entscheidung über kapazitätsgewichtete FIFO oder NPC-vs-Spieler-Priorität.
- **Unabhängiges Audit nicht überschreiben:** Bis zu erneuten 13×90/365/730-Vergleichen mit aktivierten Fixes, wirtschaftlichen Negativprüfungen und Integrationstests sind die Eingriffe **nicht** produktionsreif.
- **Echte iPad Safari / NAS Hardware** nicht getestet. Browser-`main` ist unverändert; Node-CI-Touch-/Build-Preflight ist keine Gerätefreigabe.

## Regressionen

Neue `tests/p3-audit-guard-fixes.test.mjs` prüfen echte Replay-Gleichheit einer **bereits gestarteten 60-minütigen W5ac-Überführung** auf frisch importierter Welt mit unverändertem originalen Geld-/Waren-/Eigentums-/Save-Audit; NPC-Abfahrt erst nach Freigabe, negativen Import-Doppelbeleg, den J8-Klon mit expliziter Antragsauflösung, später wieder zulässiger Neuanmeldung, fehlende NPC-Nachfrage, Nullbuchwert und fehlende Forschungsschnittstelle im normalen Rule204-Modus. Die historischen #508-Charakterisierungstests sind **nicht** als erfolgreich bestandene Fixprüfungen interpretierbar, weil sie ausdrücklich das alte Fehlverhalten erwarten.

**Stand beim ersten Commit:** Korrekturen implementiert, Testausführung und CI ausstehend. Kein bestätigter Fix ohne tatsächlich erfolgreichen Lauf.
