# Haus-Erz-Vertragsreservierung

Übergabestand 26.11.2026 · W-20261126-04 / CODEX-20261126-04 · [Draft #661](https://github.com/tobiasfranziskus/Check/pull/661) · [Auftragsboard #658](https://github.com/tobiasfranziskus/Check/issues/658)

Der Ausgangspunkt ist der bestehende Draft-Head `d9c56686cc16f1c268d90ad45436965bf21f6c77` auf `main 5afddead55b5386de12f483bb20e653fa5be23e1`. Die Originalgegenbelege zu Minute 49/50, Pendelstopp, Teilstorno und übertragbarer Zustimmung bleiben im ursprünglichen Audit erhalten.

## Managerpfad

1. An der Root-Adresse den Wirtschaftsmanager öffnen, eine normale Karriere beginnen, einen freien Frachter in Aldera kaufen und sichern.
2. Über das Menü „Weitere Spielmodi“ öffnen, „Haus-Erz-Kopie aus normalem Spielstand starten“ wählen und bestätigen. Der Regel204-Quellstand braucht freie Frachtaufträge und darf kein offenes Industrieangebot enthalten.
3. Eine Wirtschaftsminute weitergehen. Im Seed-42-Start bietet Nadir dem Hausfrachter eine Rundfracht für 50 Erz an. Unter „Aufträge“ den konkreten Vertrag unterschreiben. Die nächste Wirtschaftsminute führt die separate Käuferentscheidung aus.
4. Mit den Zeitschritten den realen Förder-, Lade-, Hin- und Rückflug fortsetzen. Der Auftragsstatus zeigt Bindung und Beleg. Die vorhandene Industrieakte zeigt W4-Material und die bezahlte W5-Hülle. Ein Kauf hängt von tatsächlich verfügbarer Hülle und eigener Kasse ab.

## Kern und Speicher

- Die Kennung kombiniert eine monotone Angebotsfolge mit Erstellminute, beiden Hüllen, Route, Menge und Originalbeträgen. Meridian, Aldera, Werft und Haus signieren dieselbe Angebotsinstanz. Nadir bestellt und entscheidet über den Commit. Die tatsächliche Fahrt bis W4 und W5 wird in einer Kopie mit begrenzter Dauer erneut durchgespielt. Die Kopie verwendet die reguläre Flugsimulation, Warenbewegung und Bücher. Die Restaktivzeit folgt der vorhandenen Stilllegungseinstellung des kopierten Spielstands.
- Der Commit bindet den Original-W1-Abnahmeetat, 100 ISK Meridian-Förderarbeit und 40 ISK Flugreserve, Nadir-Kaufetat, Haus-Fluglohn und Werftreserve. Der bestehende W1-Lagerauftrag schützt die Abnahmekapazität. Nach physischer Annahme in Aldera bleiben genau 50 Erz dem Vertrag zugeordnet, bis der Frachter sie lädt. Der Stundenexport kann die übrige Lagerware kaufen. Einsatzschiffe können konkurrierende Befehle für gebundene Arbeit ablehnen. Weitere Miner und freie Routen können im Rahmen der Originalregeln tätig bleiben.
- Eine sofortige Leerstornierung nutzt die Rückgabe der ursprünglichen Reserven. Nach begonnener Arbeit bleiben Ware, Lohn und Treuhand im Originalbuch erhalten. Die W3-Rückkehr bezahlt den Haus-Tarif von 240 ISK nach 120 Minuten. Der Lohn von 120 ISK geht an das bestehende Konto `pilot_erz`.
- Lokaler Resume erhält den geprüften Zustand. Beim externen Import werden offene Hausangebote samt Unterschriften verworfen. Bezahlte Verträge bleiben abrechenbar. Eine Vorversion liegt im eigenen Haus-Erz-Backup. Scheitert das Schreiben des Backups, wird der vorherige aktuelle Stand vor dem Sitzungswechsel wieder eingesetzt. Offline-Dateien sind Zustandsdaten. Firmeneigentümerbefehle liegen hinter der bestehenden Vertrauensgrenze des Kerns.
- Das Profil verwendet `aphros-void:spielerkarriere:haus-erz:v1` und `:vorherige`. Der reguläre Regel204-Loader lehnt es ab. Der Kopierweg lädt und auditiert die Quelle vor dem Profilwechsel. Ältere U7/U8-Dateien brauchen einen eigenen Ladeweg.

## Reproduktion und Übergabe

- `node --test tests/*.test.mjs` unter Node 22. Originalreferenzen für Standard, PIR und 207 und die neue Regressionsdatei `m4-u5-house-ore-reservation.test.mjs`.
- `node tests/m4-u5-house-ore-scenarios.cjs alle 90` und `node tests/m4-u5-house-ore-scenarios.cjs S02 730`. Standardkontrolle und Haus-Erz verwenden gleiche Quellen, Wirtschaftspolitik und reguläre Managementbefehle. Eine konkrete Haus-Unterschrift entsteht nur im Opt-in-Arm. Die Läufe prüfen Geld, Waren, Save/Load und überfällige Hausaufträge.
- `WELT_BROWSER=chromium node tests/m4-u5-browser.cjs` und entsprechender WebKit-Aufruf. Der Browserpfad prüft Root, die vier Touchgrößen, Spiel- und Speicherfolge, Importablehnung, Quota-Rollback, Vorversionswechsel und identische Standard-/PIR-/207-Slots. Der Lauf gibt die gemessene Browserzeit für den Zeitschritt bis zum sichtbaren Angebot aus.
- Die am jeweiligen Head tatsächlich ausgeführten Prüfungen, Laufzeiten und Freigabeblocker stehen im Draft und in der datierten Rückmeldung an 00. Physische iPad-/NAS-Prüfung und Veröffentlichung gehören zu einem späteren Gate.
