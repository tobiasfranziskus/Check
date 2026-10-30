# B5a – Betriebskosten bei „halten“ auf Reisen (Regelversion 13)

**30.10.2026 · [MAIN] integriert durch [PR #42](https://github.com/tobiasfranziskus/Check/pull/42), Squash-Merge `9b155640d51d0e1f4022433391a0061dcd5be2ac` (v0.12.4, Regel 13, Schema 8). Ursprüngliche Testbasis `906b797` (v0.12.3, Regel 12). Basis: [B4-Analyse #41](https://github.com/tobiasfranziskus/Check/pull/41), die nur als Quellenbeleg herangezogen wird, **nicht** in diesen PR mitgezogen. Die bindende Produktplanung bleibt [ROADMAP.md](ROADMAP.md).

## Bestätigter Defekt

In `m_core_ankunft.reise` werden die Arbeitsminuten während jedes Reisefluges auch dann aufsummiert, wenn der Auftrag `halten` lautet. `m_core_stunde.betriebskosten` setzt bisher die gesammelten Minuten auf null und überspringt anschließend jede Kostenbelastung bei `halten`. Dadurch wird eine beliebige manuell befohlene Fahrt im wartenden Zustand kostenlos, **auch wenn sie vor der nächsten vollen Stunde bereits angedockt hat**. Das betrifft grundsätzlich auch einen validierten `shipWait` während der Reise.

## Engste Produktkorrektur

Nur die bisherige Abkürzung `if (s.auftrag === 'halten') continue` wird durch `if (arbeit === 0) continue` ersetzt. **Wer gearbeitet hat, bezahlt nach unveränderter, bereits bestehender Stundenformel**, auch im Dock. **Wer wirklich nicht gearbeitet hat, bezahlt nichts**, auch mit Auftrag `halten`. Die Kasse zahlt weiterhin höchstens ihren wirklichen Bestand; dieselben Fonds, Gebühren und tatsächlichen Geldtransfers werden weiterverwendet. Kein Treibstoff, keine neue Geldquelle, keine neue Insolvenz, keine Änderungen an Piraten, Schiffersatz, Förderung oder UI-Auftragssemantik.

**Version und Datenerhalt:** Patchversion `v0.12.4`, **Regelversion 13**, weiterhin **Schema 8**. Der neue `RULE_MIGRATIONS[12]` ändert ausschließlich die Regelversionsmarkierung; laufende Reise, angesammelte Arbeitsminuten, Schiffsziel, Kassen, Ladungen und Queue werden **nicht** neu initialisiert. Frühere erlaubte 11→12-Migration geht anschließend automatisch nach 13; in der Entwicklung ausdrücklich inkompatible Regelstände 8–10 bleiben unverändert abgewiesen, ebenso zukünftige Versionen. Bereits in Regel 12 kostenlos geflogene historische Minuten werden **nicht rückwirkend** belastet; aktuell gespeicherte noch nicht abgerechnete Arbeit wird beim nächsten regulären Abrechnungszeitpunkt erstmals nach Regel 13 fällig.

## Durchgeführte gezielte Tests

**[AUSGEFÜHRT, direkt]** Acht gezielte Kernregressionen bestanden: ruhiges Halten ohne Arbeit, volle/gebruchte Reiseminuten mit `halten`, Auflauf beim Andocken vor der Kostenstunde, mehrere validierte Reisen innerhalb einer Stunde, Kassenunterdeckung ohne Geldschöpfung, keine Doppelabrechnung, sowie Save/Load der offenen v12-Reisearbeit. Zusätzlich wurde der alte v12-Core mit dem geänderten Regel-13-Core anhand einer identischen validierten Zwei-Etappen-Reise bis Tick 59 **vorher/nachher ausgeführt**: v12 bezahlt für den wartenden Frachter 0 ISK; v13 bezahlt **241 ISK**, tatsächlich zusätzlich auf dem zuständigen Fonds verbucht. Die Geld-/Warenidentität blieb bei beiden korrekt; der v12→13-Roundtrip hat einen stabilen kanonischen Hash. Diese Funktionsausführung ist **keine** vollständige Node-CI oder 13-Seed-Abnahme.

## Umfangreiche Abnahme – durchgeführte CI-Gates

Die angepasste GitHub-Actions-Prüfung führt weiterhin die gesamte Node-22-Testfamilie aus. Die **historischen v12-Goldenwerte bleiben unverändert** und werden fortan im ursprünglichen Produktcommit `906b7978` ausgeführt, statt sie unter Regelversion 13 umzudeuten. Ein separater neuer Wirtschaftsjob `wirtschaft-v13-kostenkorrektur`:

- fährt dieselben **13 festen Seeds jeweils über 90 Tage** im produktiven Regel-13-Kern und unabhängig instrumentiert/uninstrumentiert;
- kontrolliert **stündlich** sowohl die Core-Audits als auch einen separat berechneten vollständigen Geld- und Warenaudit einschließlich aller Konten, Lager und Frachträume;
- vergleicht stündlich reproduzierte kanonische Hashes sowie Tageshashes; prüft Save/Load an Tag 3, 30 und 90 je Seed;
- prüft alle **13 realen Wirtschaftsmesswerte gegen die unabhängig ermittelte Original-v12-Fixture**: Versorgung, Produktion/Verkäufe, Kassen, Kostendefizite, Schiffsverluste und Geldschöpfung/-vernichtung. Die Basisseeds enthalten keine absichtlich gehaltene Spielerschiffsreise. Die tatsächliche Wirkung der Korrektur wird **separat** über den zweifachen validierten Reise-Stresstest und die Regression geprüft;
- verlangt unveränderte historische v11-/Geografietests, soweit die verwendeten Fixdaten ihrer jeweiligen historischen Regelbasis entsprechen.

**[TEST/CI #41113083339 und abschließender CI #41113681392 – BESTANDEN]** Die tatsächlich ausgeführte Node-22-CI meldet 57/57 Standardtests, 13 Seeds × 90 Tage unter Regel 13, 1.170 Tageshashes, 28.080 stündliche Audits/Replay-Hashvergleiche, Save/Load an Tag 3/30/90 und alle 13 Wirtschaftskennzahlen je Seed identisch zur unveränderten historischen v12-Fixture. Die historische v12-Goldenprüfung wurde auf dem Originalcommit `906b797` separat bestanden; v11- und Geografietests ebenfalls. Der v10-Vergleich wurde unter Regel 13 erwartungsgemäß nicht durchgeführt, der alte gestapelte Sicherheitsgeografie-Job war bedingt übersprungen. Die Folgekosten-Demonstration zeigt den realen Fonds-Transfer von 241 ISK. Kein Goldenwert wurde überschrieben. Dokumentation und Testergebnis bedeuten weder Merge noch iPad-/NAS-Freigabe.

## Freigabegrenzen

**[MAIN] #42 ist nach ausdrücklicher Freigabe integriert.** Die Änderung ist eng begrenzt, aber wirtschaftsrelevant: Begonnene Reisen auf Auftrag `halten` können künftig zusätzliche echte Kosten auslösen und bei zu wenig Geld ungedeckte Arbeit haben. Kompatible Regel-12-Spielstände, Befehle, Bilanzen und Langzeit-/Save-Fälle wurden in der dokumentierten CI geprüft. **Ein Merge ist keine iPad-Safari- oder NAS-Abnahme und kein Deployment.** Die Browser- und Auslieferungsprüfung bleibt offen.

## B5b nicht enthalten

Die dauerhafte Nadir-Förder-Sollrolle wird **nicht** mit dem momentanen `auftrag/ware` des Schiffs neu gekoppelt. Das bleibt das **separate Folgepaket B5b**, damit Kostenkorrektur und Flottenidentität unabhängig messbar sind.
