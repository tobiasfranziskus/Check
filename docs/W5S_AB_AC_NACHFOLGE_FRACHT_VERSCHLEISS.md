# W5s-ab/ac – unabhängiger dritter Spediteur: echte Nachfrage, Frachtbuchung, Verschleiß

**[DRAFT/ANALYSE · 07.11.2026]** Auf W5s-aa [#231](https://github.com/tobiasfranziskus/Check/pull/231) gestapelt, isoliertes Forschungsprofil **Regel 32 / Schema 8**. Die freigegebene öffentliche Fassung [MAIN] `5a56d9d7` und archiviertes v0.12.5 werden nicht ersetzt. Kein Merge, keine Veröffentlichung, keine Änderung an regulären alten Spielständen.

## Doppelstufe

### W5s-ab: Eigentümer `w5s_carrier3` darf nur echten W3-Kundenauftrag fahren

- Vorbedingung: wirklich durch den Investor hinterlegte 930 ISK, physisch neu produzierter und im W5-Verkaufsbuch für 750 ISK verkaufter Frachter, 60 ISK Pilotenlohn für die echte Überführung, Ankunft in Aldera, eigenständiges Konto mit 120 ISK.
- Opt-in `w5s.successorNewFreight=true`: Derselbe originale `shipFreight`-Befehl und die Original-W3-Kalkulation gelten für dieses Schiff. Nur bei realem W5-Werftbedarf: bezahlt erworbenes Erz, ausreichender Käuferetat, freier Zielraum, echtes Frachtraum-/Eigentumsbuch, voller eigener Pilotenetat und freie Treuhand.
- Nur diese neue Gesellschaft erhält die jeweils tatsächlich gebuchten Erlöse. Ihr `oreWorkReserved`, `oreWorkPaid`, `oreFreightRevenue`, `oreTrips` wird aus derselben Core-Treuhand wie die alte Spedition rekonstruiert; weder deren Löhne noch Umsätze dürfen als ihre eigenen zählen. Der unabhängige Kapital- und Warenaudit prüft die Konten gegenseitig.
- `w5sNewCarrierFreight` liefert eine rein lesende, nachvollziehbare Bedarfs-/Finanzdiagnose. Sie legt keine neue Ware, Nachfrage oder Kaufkraft an.

### W5s-ac: echter wiederholbarer Dispatcher und physischer Verschleiß

- Nur mit `successorNewAuto=true` prüft der autonome Dispatcher nach alten Bestandsaufträgen stündlich das tatsächliche Nachfrage-/Eigentümer-/Kapitalgate. Ein Auftrag wird ausschließlich über den unveränderten validierenden `shipFreight`-Befehl gestartet; `autoOrders` hält die auditierbare Auftragsfolge fest.
- Nur mit `successorNewWear=true` altert die eigene bezahlte Hülle bei Forschungsannahme 30 Spieltagen. Eine tatsächliche Entfernung erfolgt ausschließlich am Tagesrand, wenn das Schiff leer, im Dock und ohne offenen bezahlten Fracht-/Flugauftrag ist. Das W5-Produktions-/Schiffskaufbuch und die Überführungsprovenienz bleiben auch nach Ausmusterung gültig.
- Keine automatisch neuen Nachfolgergesellschaften, Gratisrettung, unsichtbarer Transfer, Emission, künstliche Frachtlieferung oder Änderung der W3-Preise.

## Finanzierung

Kauf und Überführung der neuen Gesellschaft: **930 ISK tatsächliches Investorengeld = 750 ISK Hülle + 60 ISK Fluglohn + 120 ISK frei verfügbares Arbeitskapital**. Bei zulässiger W3-Erzfahrt: die ursprüngliche, komplett vorfinanzierte W3-Treuhand finanziert 50 echte Erz, 120 Minuten Pilotenarbeit und 240 ISK Frachterlös erst bei abgeschlossenem Hin- und Rückflug. Der tatsächliche Kunde darf nur bei ausreichender eigener Kasse bestellen. Sind reale Zahlung, Erz und begründeter Bedarf nicht vorhanden, wird **keine** Fracht durchgeführt; ein ausstehender Auftrag ist kein Ertrag.

Einzelne Frachten sind auch bei positivem Deckungsbeitrag **kein Nachweis eines dauerhaft tragfähigen Konzerns**. Ohne mindestens 930 neue eigene ISK und eine noch verfügbare physische W5-Hülle entsteht keine weitere Schiffsgeneration. Ein 30-Tage-Forschungsparameter ist keine genehmigte Produktionsregel.

## QA und Freigabegrenzen

Neu: `tests/w5s-ab-ac-folgefracht-verschleiss.test.mjs` mit 42/7, Original-W0–W5-Kaufkette, originärem W3-Kundencheck, separatem Eigentümer-, Lohn-, Waren-, Geld- und Save/Load-Audit, unfinanzierter Negativprobe, 30-Tage-Ausmusterung, Replay/365 Tage, opt-out und Belegfälschungen. Der eigene GitHub-Node22-Workflow enthält außerdem W5s-aa/z/y/x als Regressionen. **CI-Zahlen und konkrete zahlende Fahrten sind erst nach ausgewerteten Laufprotokollen als durchgeführt/belegt zu bezeichnen.**

**[OFFEN]** Echte iPad-Safari- und NAS-Abnahme, vollständiger Node-Pflichtlauf `node --test tests/*.test.mjs`, Release-/Produktentscheidung für R32, Wirtschaftsmargen über mehrere Flottengenerationen, konkrete Freigaben für Verschleiß und neue Marktregeln.
