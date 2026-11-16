# W6/P8g – unabhängige Wirtschafts- und Sicherheitsabnahme

**16.11.2026 · NICHT ABGENOMMEN · Draft, keine Produktänderung.** Die finanzierte Einzelkette ist unabhängig reproduziert; sechs absichtlich rote Sicherheitsprüfungen verhindern eine uneingeschränkte Abnahme. Keine Referenzen angepasst, keine `todo`, `skip` oder erwarteten Fehler zur Grünfärbung verwendet.

## Prüfstand und Grenzen

Zuerst aktuelles `main` `feda85dc4a7ccb3544756c63b5dfc3235cf6df0f`, `AGENTS.md`, Roadmap, Projektstatus, P8g-Bericht, [PR #425](https://github.com/tobiasfranziskus/Check/pull/425) und tatsächliche Actions-Ergebnisse gelesen. Ausgangshead `f9273e64ebf85b170141e15bcf8c64d55afca02c`; während der Prüfung neue Diagnose-/Workflow-Commits übernommen. QA-Basis jetzt **`1b867ac19cb39801414a1c94a1d66a2cbebbd0e3`** (weitere reine Diagnose-/Dokumentationscommits nach `b68e751`). Dazwischen **keine Änderung an `prototypes/welt/**`**. Eigener Branch `qa/w6-p8g-independent-security-20261116`, Ziel weiterhin der Forschungsbranch, nicht main.

Quellprüfung auf relevante Originalfunktionen begrenzt: P8g-Aktivierung, K7-Befehle/Automatik/Audit/Save/Load in `welt-kern.js`; W1-Auftragsfinanzierung sowie W3-Vorbestellung/Storno/Tick/Audit im eingebundenen `rule200-k7-industry-core.js`. Bestehende Tests nur zur API-/Abdeckungsorientierung gelesen. Neue Fixtures, Bilanzrechnungen und SHA256-Vergleiche verwenden **keine** alten Testhelper, Szenario-Audits oder erwarteten Hashes. Der S02-Politikwert wird ausdrücklich lokal definiert; Aufbau über Originalbefehle mit eigenem 60-Minuten-Dispositionsraster.

Node **v22.23.4**. Reproduktion aus dem Repo mit Node22:

```sh
node --test tests/w6-p8g-unabhaengige-sicherheitsabnahme.test.mjs
```

Ergebnis: **68 Tests, 62 bestanden, 6 fehlgeschlagen, 0 übersprungen, 0 abgebrochen, 0 todo; Exit 1.** Die sechs Fehlschläge gehören zu vier Befundgruppen unten. Ein anfänglicher Fehler in der neuen Fälschungsfixture (frische Welt hat noch keinen Speditionsfrachter) wurde durch eine echte Originalminute mit legalem automatischem Kauf korrigiert; er wird nicht als Produktfehler gezählt.

## Sicherheitsbefunde mit Minimalreproduktion

### F1 – P1 / Import kann P8g ohne gesonderte Zustimmung aktivieren

```js
const w = K.erstellenP8d();
const s = w.createState(42); // materialSupplyEnabled fehlt
const raw = JSON.parse(w.save(s));
raw.kanon.materialSupplyEnabled = true;
const imported = w.load(JSON.stringify(raw)); // akzeptiert, Flag true
```

Test `SECURITY: old Rule207 JSON cannot self-authorize P8g` ist rot. `audit` prüft nur Rule207-Kontext und Boolean-Typ, keine vertrauenswürdige Importentscheidung. Ein alter unveränderter Save wird nicht automatisch aktiviert; **ein fremder JSON-Import kann aber selbst die behauptete Einwilligung liefern**. Im gegebenen Auftrag ist das ein Integrationsblocker. Noch keine P8g-Browser-Importfunktion vorhanden, deshalb kein behaupteter UI-Exploit.

Empfehlung: Aktivierungsautorität außerhalb untrusted JSON führen; beim externen Import explizite Zustimmung zum Forschungsmodus verlangen oder P8g-Import ohne diese ablehnen. Legitim aktivierte lokale Save/Load-Roundtrips müssen erhalten bleiben. Regel-/Save-Kennzeichnung und Abgrenzung des vertrauenswürdigen internen Reloads vom externen Import separat festlegen. Ein weiteres beliebig editierbares JSON-Flag allein beweist keine Benutzerfreigabe; Offline-JSON wird damit nicht kryptographisch fälschungssicher.

### F2 – P1 / K7-Nachweis während laufender W3-Hinfracht löschbar

Aus dem durch Originalbefehle erzeugten `phases.hin` der neuen Testdatei:

```js
const raw = structuredClone(phases.hin);
raw.kanon.industrieErz.phase = 'frei';
w.audit(raw);                   // ok: true
w.load(JSON.stringify(raw));     // akzeptiert
// Auch vollständiges Ersetzen entfernt die Vertragsparteien und Signaturen:
raw.kanon.industrieErz = {phase:'frei'};
w.load(JSON.stringify(raw));     // ebenfalls akzeptiert
```

Zwei rote Tests: `import/audit rejects tampering contract phase` und `SECURITY: imported active order cannot erase ownership signatures in transit`. Die Querverknüpfung ist für W3 `vorbestellt` zwingend, für `hin`/`rueck` nicht ausreichend. Die vorhandene W3-Finanzierung bleibt bilanziert; der signierte K7-Ursprungsnachweis kann trotzdem verschwinden. Kein Geld-Mint aus diesem Minimalfall behauptet.

Empfehlung: Solange ein W3-Auftrag `industrieMiner` trägt, K7-Aktivphase, identische Miner-/Frachter-ID, Auftragsart, Eigentümer und beide Unterschriften für **alle** W3-Phasen bindend prüfen. Den terminalen Zustand an belegte W3-Abwicklung koppeln. Nicht nur eine einzelne Phasenbedingung reparieren.

### F3 – P1 / Gelieferter Materialvertrag ohne jede Lieferung importierbar

```js
const s = w.createState(42);
w.advance(s, 1); // echter Kauf des ersten Speditionsfrachters
const miner = Object.values(s.ships).find(x => x.owner==='npc3' && x.klasse==='miner');
const fr = Object.values(s.ships).find(x => x.owner==='transport' && x.klasse==='frachter');
s.kanon.industrieErz = {
  phase:'geliefert', miner:miner.id, frachter:fr.id,
  signMiner:true, signFracht:true, signWerft:false,
  werftVerwendet:false, erzAngenommen:true, erstellt:0, materialOnly:true
};
w.audit(s);                 // ok: true
w.load(JSON.stringify(s));   // akzeptiert; kein P8g-Opt-in, keine W3-Lieferung
```

Roter Test `SECURITY: forged delivered contract without underlying W3 delivery`. Das ist ein gefälschter Leistungs-/Vertragsnachweis, **keine** durch diesen Test nachgewiesene Warenerzeugung oder Auszahlung. `materialOnly` verlangt das Opt-in bisher nur für `angebot`/`aktiv`; `geliefert` verlangt keinen zugeordneten Abschlussbeleg.

Empfehlung: Terminale Materialverträge mit tatsächlichen W3-Liefer-/Abschlussdaten und eindeutiger Vertragsidentität abgleichen, einschließlich Menge, beteiligter Hüllen und Opt-in-Herkunft. Historische Verträge und erlaubte spätere Deaktivierung ausdrücklich definieren; kein pauschales Verwerfen alter Saves.

### F4 – P2 / Verschleiß beim Commit nicht erneut geprüft

Zwei rote Tests `SECURITY: wear after signature must be rechecked miner/freight`:

```js
const s = signed(); // echtes Angebot + zwei separate Eigentümerunterschriften
s.kanon.verschleiss[fixture.miner] = 100000; // alternativ fixture.freight
roundtrip(s); // auch dieser veränderte Zustand passiert Audit und Loader
w.execute(s, {type:'industrialOreCommitMaterial',owner:'st_nadir'}); // ok:true
```

Beim Angebot werden verschlissene Hüllen abgewiesen; beim Commit fehlt dieselbe erneute Prüfung. Bereits nach Angebotsabgabe veränderte Einsatzfähigkeit darf keine Finanzierung auslösen. Minimalfall verwendet eine gezielte Zustandsmutation, **keine** Behauptung eines nachgewiesenen rein regulären Spielerbefehls-Exploits oder einer tatsächlich abgeschlossenen Fracht mit stillgelegtem Schiff.

Empfehlung: Vor jeglicher Treuhandbuchung beide aktuellen Hüllen vollständig auf Klasse, Eigentum, Ort, Ladung, Fremdauftrag und Stilllegung prüfen; bei Ablehnung ganzen Zustand unverändert lassen. Zusätzliche Reservierungs-/Verfügbarkeitsprüfung während offener Angebote erwägen.

## Was Originalbefehle und Originalaudits tatsächlich abweisen

| Ebene | Unabhängig bestätigt |
| --- | --- |
| Befehle, jeweils ganze Zustandskopie vorher/nachher verglichen | Falscher Käufer/Unterzeichner/Stornierer; fremde/vertauschte/fehlende Schiffe; keine/eine fehlende Signatur; doppelte Signaturen/Aufträge/Commit; illegale Werftsignatur/-produktion und alter Commit auf Materialauftrag |
| Finanzierung | Fehlende NPC3-, Speditions-, Aldera- oder Nadir-Kasse; fehlende Signierliquidität; bereits gebundene W3-Kauf-/Arbeitsreserve und K7-Werftreserve |
| Physische Verfügbarkeit | Beladener Miner/Frachter; fremder Eisfrachtauftrag; vorhandener Erzauftrag; schon beim Angebot verschlissene Hüllen; kein Nadir-Erzlagerplatz beim Commit |
| Storno | Angebot und finanzierter Auftrag **vor** Arbeit rechtmäßig stornierbar; reale Konten vollständig erstattet; doppelte/fremde Stornierung und Storno während Förderung/Hin-/Rückfahrt/nach Lieferung atomar abgewiesen; Opt-out bei offenem Angebot gesperrt |
| Manipulierte Imports, Audit **und** Loader getrennt verlangt | Frachtdauer, Arbeitskosten, Menge, negative Arbeitszeit, unbekannte W3-Phase, entfernte Signatur bei intakter Aktivphase, Werftsignatur, deaktiviertes Flag bei Aktivauftrag, zusätzliche Lagerware, fremder Miner-/Frachtereigentümer, falscher Ankunftstick |
| Befehlsform | Zusätzliche Mengen-, Zeit-, Lohn- oder Phasenparameter abgewiesen |

Finanzierungs-/Lager-/Fremdauftrags-Negativfixtures enthalten absichtlich lokal verfälschte Grenzwerte. Sie beweisen die jeweilige Validierung und atomare Ablehnung, nicht dass jeder künstliche Zustand durch reguläres Spielen erreichbar wäre. Nicht alle Schäden/Transfers oder jede denkbare kombinierte JSON-Manipulation sind damit erschöpfend geprüft.

## Unabhängige Bilanzen und Replay

Zwei neu erzeugte Seed42-Welten mit identischer eigener Befehlsfolge ergeben denselben **vollständig kanonischen Zustand**, zusätzlich SHA256:

`a94c7193eaf7e2aceb3446a006d6c8f037a9c9d42f1968ec46b7222dcc9e1570`

Save/Load während W1-Förderung, W3-Hin- und Rückreise sowie W4-Produktion jeweils mit 31 weiteren identischen Originalminuten verglichen. Zusätzlich Reload nach der ersten Produktionsminute jeder W4-/J3-/J4-Charge und Vergleich bis Fertigstellung. Alle Zustandsvergleiche erfolgreich. Kein Vergleich mit einer ungeprüft übernommenen Testreferenz.

Vollständiger unabhängiger Einzelpfad: Ersatzfrachter **750 ISK** bezahlt, Werftgegenkonto exakt +750; **60** reale Überführungsminuten; **50** Erz mit W1/W3 geliefert, zusätzliche **120 ISK** W3-Arbeit; keine neue W5-Hülle während des Vertrags; fünf W4-Chargen = **25 Material**, acht J3-Bauteile, ein zusätzlicher J4-Jäger; Spieler **−900**, Nadir **+900**. Ende Tick **20787**, drei produzierte und rechtmäßig erworbene Jäger, Nadir **15 Material, 0 Erz, 0 Silizium**.

Eigener Endhash `de7074f8750abfc8`, SHA256 `534e8da3ce6835239f3ce6b7f24538c94f3ceb3b8962f3fadd0ddbce9db9abf6`. Abweichung vom ursprünglichen Testhash wird nicht korrigiert: eigenständiges Dispositionsraster und dadurch anderer Zustand.

Jede Ledger-Ware wird unabhängig über **alle Stationslager und Schiffsladungen** summiert und mit `initial + mined + produced + imported − consumed − exported` verglichen. Endbestand der ganzen Welt:

| Ware | Physisch vorhanden |
| --- | ---: |
| Erz | 40 (außerhalb Nadir) |
| Eis | 150 |
| Material | 15 |
| Frachterhüllen im Lager | 1 |
| Silizium, Bauteile, Wasser, Miner-/Jägerhüllen im Lager | jeweils 0 |

Flotte: **22 Schiffe = 11 NPC3-Miner + 8 Speditionsfrachter + 3 Haus-Jäger**; jede ID genau einmal, Eigentümerkonto existent, Flottenanzahl je Klasse gleich verbrauchten Lagerhüllen. Alle vor der neuen Kette vorhandenen Schiffs-IDs und Eigentümer am Ende unverändert; genau ein neuer Haus-Jäger. Diese Prüfung ersetzt keinen universellen Herkunftsbeweis für beliebige manipulierte NPC-Flotten.

Weltgeld exakt **33.000**, Mint/Burn **0/0**; jedes Konto nichtnegativ und ganzzahlig. Hauptkassen: Haus 300, NPC3 2162, Aldera 1350, Nadir 4564, Spedition 1480, Werft 1350 ISK; übrige Fonds-/Lohn-/Eigentümerkonten und alle Ledger-/Flottenwerte werden vollständig als `INDEPENDENT_CHAIN` im Testlog ausgegeben. Alle Originalaudits im legitimen Pfad grün. Das bestätigt Bilanzsicherheit dieses Pfades, **keine Rentabilität, keine wiederholte Auftragserfüllung und keine Nachhaltigkeit**.

## Legacy-, Regressions- und CI-Nachweise

Alte Regeln 204/205/206/207 ohne Aktivierung: Roundtrip und Fortschritt ohne Regelwechsel und ohne neues Flag bestanden. Regeln 204–206 weisen ein importiertes P8g-Flag ab. Regel207 weist es nicht ab (F1).

Zusätzlicher direkter Vergleich mit aus Git geladenem Original-P8f-Kern `6835542c07260537e8c2a2f37e102c1ba575c612`: frische Seed42-Welten beider Fassungen bei Tick **0, 60, 1500** bytegleich kanonisch, Opt-in fehlt jeweils. Selbst errechnete Endhashes: Regel204 `bed58e85b6f85a01`, Regel205 `736dbc15a68e219a`, Regel206 `436e7be87e5f316b`, Regel207 `957f3cd48bff727d`. Das ist begrenzte Legacy-Regressionsprüfung, keine pauschale Freigabe sämtlicher historischer Saves.

Gezielt ausgeführt: fünf bestehende Dateien P8d separater Frachter, P8d Zwei-Firmen-Finanzierung, P8f Originalbefehle, P8g Erzversorgung und P8g W5-Ersatz nach 90 Tagen: **13/13 bestanden, 0 Fehler/Skips/Todo**.

Die zusätzlich hinzugekommene Original-Flottendiagnosedatei besteht nach dem letzten Basisupdate separat mit **4/4 Tests, 0 Fehler/Skips**.

Vollständiger `node --test tests/*.test.mjs`: **440 Tests, 434 bestanden, 6 fehlgeschlagen, 0 übersprungen/abgebrochen/Todo**, Laufzeit 384,3 Sekunden. Alle sechs Fehlschläge sind die oben benannten unabhängigen Sicherheitsprüfungen; die übrigen **372 bestehenden Tests bestanden**. Der initial expandierte Shell-Glob enthält die währenddessen hinzugekommene Flottendiagnosedatei nicht. Zusammen mit deren separatem finalem Lauf: **444 verschiedene Tests, 438 bestanden, 6 fehlgeschlagen, 0 Skips**. Die separat wiederholten 13 Spezialregressionen werden nicht nochmals auf diese Gesamtzahl addiert.

Tatsächliche Remote-CI am ursprünglichen Head `f9273e6`: zehn gefundene PR-Workflows `completed/success`. [P8g #43856049662](https://github.com/tobiasfranziskus/Check/actions/runs/43856049662) mit **15 erfolgreichen Jobs** (Vertrag, 13 Szenarien, S02×365); Vertragsjobschritte und Rohlog gelesen: **4/4 P8g + 7/7 P8d/P8f**, keine Skips. Das ist fremde Ausführungsevidenz, getrennt von unseren neuen Tests.

Beim aktualisierten Head `b68e751` war [Original-Flottendiagnose #43860862778](https://github.com/tobiasfranziskus/Check/actions/runs/43860862778) erfolgreich; P8g #43860862781 und mehrere weitere Prüfungen noch queued/in_progress. Diese offenen Läufe werden nicht als bestanden gezählt. Eigener erster [QA-CI-Lauf #43861695984](https://github.com/tobiasfranziskus/Check/actions/runs/43861695984) war bei Abfrage queued, also noch kein CI-Erfolg. Die eigene neue Workflow-Datei führt die Sicherheitsprüfung **ohne Fehlerunterdrückung** und die Originalregressionen in getrennten Jobs aus; rot ist bis zur Kernkorrektur sachlich erforderlich.

## Verbleibende Abnahme- und Mergeblocker

1. F1–F3 vor sicherer externer P8g-Import-/Save-Abnahme korrigieren, F4 vor belastbarer Wiederholungs-/Verfügbarkeitsabnahme. Danach neue Tests unverändert erneut ausführen.
2. Regel207 trägt neue optionale Semantik ohne separate Regelnummer; externe Aktivierung, alte Saves, terminale Vertragsnachweise und der vertrauenswürdige interne Reload brauchen eine ausdrückliche Kompatibilitätsentscheidung. Keine stille Migration implementiert oder freigegeben.
3. Ein erfolgreicher Einzelauftrag und eine grüne Krisenmatrix beweisen weder Gewinn noch dauerhafte Ersatzfähigkeit. Die bekannte S02-Stagnation wird durch diese QA nicht behoben.
4. Kein P8g-Browserbefehl/-Importweg im geprüften Forschungsumfang; deshalb keine P8g-Chromium-/WebKit-, iPad-, NAS- oder Pages-Abnahme durchgeführt. Erst bei realer betroffener UI den echten Nutzerpfad prüfen. Keine fingierte iPad-Abnahme.
5. Integration muss gegen aktuellen main und die notwendigen Stack-Abhängigkeiten gesondert geprüft werden; Rezept-/Regelversionsfragen bleiben offen. Dieser PR verändert ausschließlich neue QA-Dateien. **Kein Merge, Deployment oder Produktfix.**
