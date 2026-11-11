# Repository-Konsolidierung und Void-Echoes-Übernahme – 11.11.2026

**[ANALYSE / docs-only, keine Produktfreigabe]** Quellen: GitHub-`Check/main 04124f2bca27dc33b54be30c07b6a7bbb7387e81`, `void-echoes/main a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f`, aktuelle PR-Metadaten und die tatsächlich im jeweiligen PR dokumentierten CI-Läufe. Der Stand ist ein navigierender Integrations- und Archivierungsentscheid, **keine zweite Roadmap**. Verbindlich bleibt [ROADMAP.md](ROADMAP.md). **Vor Beginn der Bereinigung waren 126 Pull Requests offen** (GitHub-Suche `is:pr is:open`). Nach Anlage von #299 und dem dokumentierten Schließen von vier ersetzten PRs waren **123 PRs offen**. Keine dieser Zahlen bedeutet 123 ausstehende Feature-Merges.

## 1. Tatsächliche Entwicklungswege

| Status | Anker | Konsequenz |
| --- | --- | --- |
| **[MAIN]** | [Check `04124f2b`](https://github.com/tobiasfranziskus/Check/commit/04124f2bca27dc33b54be30c07b6a7bbb7387e81) | Regel195/Schema8, produktiver W0–W5-Einzeldatei-Hub und freigegebener Safe-/JSON-Spielstandschutz aus #289. Es gibt **noch keine** autoritative freie 2D-Flugsteuerung im Produkt. |
| **[DRAFT] Konsolidierter Flug** | [#294 I0](https://github.com/tobiasfranziskus/Check/pull/294), Ziel `main` | F0 #290, Void-Echoes-Grafik #292 und Richtungsoptimierung #293 bereits in einer einzigen Forschungsbasis vereinigt; alte Quell-PRs nicht zusätzlich nach main mergen. |
| **[DRAFT] gemeinsamer Spielkern** | [#296 F1-I0](https://github.com/tobiasfranziskus/Check/pull/296), Ziel #294 | Originale Regel195-Wirtschaft + Flugzustand als isolierte Regel196, getrennte Forschungssaves; enthält die Funktionsarbeit von #295. |
| **[DRAFT] ortsgebundene Förderung** | [#297 F2a](https://github.com/tobiasfranziskus/Check/pull/297) → [#298 F2b](https://github.com/tobiasfranziskus/Check/pull/298) | 48er-Versuch und neu 50 Eis aus echtem Feld, Rückflug und Originalverkauf erst am Dock. F2b-Regel198 modifiziert auf dem Forschungsbranch eine Original-Core-Schaltstelle, noch **keine voll vorfinanzierten Flugpilotenlöhne**. |
| **[DRAFT] Wirtschaftsgegenprobe** | [#288 W6a](https://github.com/tobiasfranziskus/Check/pull/288) | Freiwilliger Wasser-Lohnkauf kann einen weiteren bezahlten Eis-Frachtauftrag freigeben. Belegt keine nachhaltige W6-Wirtschaft; getrennt von F2 halten. |
| **[DRAFT] Detailaudit der Quelle** | [#291](https://github.com/tobiasfranziskus/Check/pull/291), [Auditdatei](https://github.com/tobiasfranziskus/Check/blob/review/void-html-reuse-audit-20261110/docs/VOID_HTML_REUSE_AUDIT.md) | Direkte Sichtung des privaten Originalrepos; wichtig als unveränderte Fundstellensammlung und Abhängigkeitsdokument. |

**Sichere Integrationslinie:** `main → #294 → #296 → #297 → #298`, aber **nicht** als unkontrollierter Gesamtmerge. Vor einem Produktmerge die jeweils noch ungeklärten Geld-/Orts-/Speicherregeln und echte iPad-/NAS-Abnahme erledigen. #298 enthält auf seinem Branch absichtlich aus der Core-Quelldatei neu generierte Einzeldateien: deren Unterschied darf **nicht** still in main gelangen.

## 2. Was aus `void-echoes` bereits übernommen oder nachgebildet ist

Quellrepository: [`tobiasfranziskus/void-echoes`](https://github.com/tobiasfranziskus/void-echoes), **privat**, `main a8e2e36`; der Freeze ist in [`Eingefroren.md`](https://github.com/tobiasfranziskus/void-echoes/blob/main/Eingefroren.md) dokumentiert. Dateien sind Referenz, **kein automatisch freigegebener Original-Core**.

| Themenbereich | Vorhandene Check-Arbeit | Noch erforderlich |
| --- | --- | --- |
| **UX08-Schiffsformen, Canvas/SVG, Sterne** | [#292](https://github.com/tobiasfranziskus/Check/pull/292) → [#294](https://github.com/tobiasfranziskus/Check/pull/294) bindet wirksame `390-ux08-vektorgrafik.js`- und `080-ve08g-02-sprites.js`-Muster ohne Legacy-Welt an F0. | Erst bei kontrolliertem F1/F2-Produktmerge übernommen; Schiffstypen und Fitting-Bilder anhand echter Core-Daten anschließen. |
| **F0-Joystick, Touch, Performance** | #294 hat frühe Maus-/Tastatursteuerung, Touch-Doppelauslösung und die nachweislich deterministische Kursoptimierung korrigiert. | Aus `580-ux01-erweiterung.js`, `370-ux06-auswahl.js` gezielt Ziel-Hit-Testing, Pointer-Cancel und Bestätigungs-UX adaptieren; keine alten `act()`-Handler. |
| **Konzernzentrale, Station, Bergbauscanner, Pilotenakte und Fitting** | Isolierte Check-Prototypen `prototypes/legacy-*`, Hub #203 und Adapter #207; zentrale W0–W5-Ansichten sind bereits als neue Regel195-Produktoberfläche vorhanden. | Nur erkennbare Bedienlücken des neuen Hauptspiels belegen und gezielt übernehmen. Fitting-/Skill-/Scanner-Demos sind **keine** produktive Core-Funktion. Keine zweite Navigation oder zweite Wirtschaft. |

## 3. Was sinnvollerweise noch zu übertragen ist – aber als neue, finanzierte Check-Mechanik

| Priorität | Alte Referenz | Fehlender Produktnachweis / Vorschlag |
| --- | --- | --- |
| **A – nach F2** | `370-ux06-auswahl.js`, `085-kern-zeichnen-hud.js`, `360-ux05-cockpit.js` | Zielauswahl auf Touch, gefahrlose visuelle HUD-/Cockpitmeldungen und klare Andock-/Auftragszustände. Nur lesender Renderer; Befehle über den neuen validierenden Flug-Core. |
| **A – anschließend** | `160-ve08c-rollen.js`, `270-ve10-04-autopilot.js`, `510-x01g-transport.js` | NPC-Flug und echte manuell steuerbare Frachterroute auf demselben Flugzustand; eigene Arbeits-/Betriebskosten und Eigentümer-/Geldaudit. **Nicht** das host-/globalzustandsgebundene alte Autopilot-Modul kopieren. |
| **B** | `070-ve02l-piraten-ki.js`, `480-auto01-kampf.js`, `030-ve02j-kampfaudio.js` | Real finanzierter Jäger-/Piraten-/Kampf-Prototyp (Schaden, Risiko, Ersatz, Kopfgeld ohne Doppelzahlung). Gegnerlogik und Effekte nur als Vorbilder; kein Gratisrespawn oder ältere Energie-/Geldformeln. |
| **B** | `180-ve08e-missionen.js`, `190-ve08g-01d-auftragszentrale.js`, `130-ve07a-pilotenidentitaet.js`, `200-ve07b-03-xp-zustellung.js` | Echte Aufträge, sicher nachvollziehbare Pilotenfähigkeiten und Fortschritt für Spieler/NPC. Alte NAS-/Gast-XP-Zustellung passt nicht zu Einzelspieler- und Regel195-Saves; getrennt spezifizieren. |
| **B/C** | `380-ux07-fitting.js`, `300-ve10-05-gegenstaende.js`, `400-ux09a-werft.js` | Produktives Modul-Fitting und Werft-Vorschau nur mit nachgewiesener Eigentümerschaft, MK1-Teilen, Verkauf und Vollkosten; 63 Beispielmodule in der Check-Demo sind **keine** freigegebene Balance. |
| **C** | `410-ve11-02-systeme.js`, `420-ve11-03-reisen.js`, `150-ve08b-ressourcenwelt.js` | Geografie-/Sicherheits-/Ressourcenideen mit Check-Roadmap vergleichen; weder alte Fünf-System-Konfiguration noch Reise-/Warpregeln automatisch als neues Produktmodell übernehmen. |
| **Später / vorerst nicht** | `550-ve3d02-adapter.js`, `570-ve3d02-renderer.js`, `090-netzwerk-webrtc.js`, `server/` | 3D/WebGL, Multiplayer-/WebRTC-Protokoll, PHP-Backend/NAS-Identitäten und alter Speicherkern nicht für den statischen Einzelspieler-Pfad importieren. |

**Nicht wiederverwenden:** `075-kern-simulation.js` (alte `mv/steer/tick/dock`), alte `060-ve06-wirtschaft.js`-Buchungen, globale `S`-Zustände, Monkeypatch-Ketten, alte Regeln für unbezahlte Leistungen. Wirtschaftliche Beobachtungen der X02-Serie dienen als Regression/Gegenbeispiel, nicht als Regel195-Quellcode.

## 4. Aufräumen ohne Verlust

1. **[ERLEDIGT / PR-BEREINIGUNG]** #290, #292 und #293 nach Hinweis auf die dokumentierte Konsolidierung in #294 sowie #295 nach Hinweis auf die F1-Übernahme in #296 **als ersetzt kommentiert und geschlossen, jeweils ungemergt**. Quellbranches, CI, Diff und Git-Historie bleiben bestehen. **#294/#296/#297/#298 bleiben offen**; sie sind die aktive abhängige Linie.
2. **Nicht pauschal schließen:** ältere R32-/C1d- und W5-Stacks dokumentieren ungedeckte Kassen, Ersatzwirtschaft, negative 90-/365-Tage-Tests; wahlloses Retargeten/Zusammenmergen würde den Forschungskontext zerstören. Erst eine separate, begründete Verwertungsentscheidung je Endpunkt. #288 und #291 als unabhängige Quellnachweise bewahren.
3. **Repo-Dateien schützen:** keine alten Versionen/`versionen`, archivierte Regel14-Saves, historische Test-Fixtures, `index.html`/`aphros-void.html` oder Testhashes ausräumen. Keine produktive W6-Regel aus einer Analyse übernehmen.
4. **Dokumente veralten im alten Langtext:** Am Kopf von README/Roadmap/Projektstatus den neuesten Hauptcommit und die aktive Draftlinie klar markieren; historische Berichte dürfen erhalten bleiben. Dies ist **keine** Erlaubnis zu automatischem Merge/Deployment.

## 5. Soll das alte Repository archiviert werden?

**Ja, als eingefrorenes, privates Quellarchiv ist es geeignet**, aber nicht, weil es „nichts mehr hergibt“: Die oben beschriebenen **UI-, Missions-, Piloten-, Piraten- und Fitting-Ideen sind noch nützlich**. Archivierung bedeutet, dass der Code lesbar bleibt, das Repository aber schreibgeschützt wird; sie ersetzt keine NAS-Datensicherung.

Vor der Archivierung:
- Entscheidung über den **offenen alten [X02-C-PR #10](https://github.com/tobiasfranziskus/void-echoes/pull/10)** und dessen nicht abgeschlossenen Liquiditätsnachtrag dokumentieren. Kein X02-C-Merge als Voraussetzung einer bloßen Archivierung.
- Den Freeze-Commit `a8e2e36`, die historischen Tags und die Referenzen aus diesem Dokument behalten.
- Die **separat auf NAS vorhandenen** alten `void.html`, PHP-Dateien und etwaige **echte Nutzersaves** sichern; Repository-Zip/Archiv ist **kein** Backup dieser Installationsdaten.
- Archivierung des alten Repositories nur auf **gesonderte ausdrückliche Freigabe**, nicht im Rahmen dieses Check-Dokumentations-PRs; bei Bedarf kann das Archiv wieder geöffnet werden.

## 6. Prüfgrenzen

Dieses Dokument basiert auf GitHub-Quellen, PR-Metadaten und den in PRs referenzierten bereits ausgeführten CI-Ergebnissen. **In dieser Bereinigungsarbeit wurden keine neuen Node-/Browser-/Safari-/NAS-Tests ausgeführt** (lokaler Git-Zugriff war durch fehlende DNS-Auflösung für github.com blockiert), kein eigener Performancewert behauptet, keine produktiven Dateien editiert und keine Tests oder Spielstände entfernt. Keine Merges oder Deployments.
