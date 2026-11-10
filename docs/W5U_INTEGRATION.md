# W5u · integrierte Forschungsoberfläche [DRAFT]

Basis ausschließlich [W5t #207](https://github.com/tobiasfranziskus/Check/pull/207),
`b280a4eedbd0331ff453065f786efcba44b7745f`; neuer Branch
`codex/w5u-spielhub-integration`, PR-Ziel `codex/w5t-readonly-core-adapter`.
[Hub #203](https://github.com/tobiasfranziskus/Check/pull/203) und #207 einschließlich
Beschreibungen, AGENTS, ROADMAP, PROJEKTSTATUS und Integrationsberichte geprüft.
`origin/main` wurde separat abgerufen, nicht als Arbeitsbasis verwendet.
Keine Änderungen an W5s-ad–af, #233 oder sonstigen Wirtschaftszweigen.

## Architekturentscheidung und Core-Vertrag

W5t hat einen **Regel-32-Adapter ohne ausführbaren Regel-32-Core**. Sein
produktives `index.html` enthält den Originalkern mit **Regel 14 / Schema 8**.
Dieser vorhandene Originalkern wird unverändert wiederverwendet. W5u behauptet
keine spielbare R32-/W5s-Wirtschaft und lädt keine fremden Wirtschaftsbranches.

`prototypes/w5u/original-core.js` ist der vollständige byte-identische Ausschnitt
von `const m_data_systeme =` bis vor `const m_data_oberflaeche =` aus der Basis,
umgeben von einer kleinen Exporthülle. Kein UI-Bootstrap, IndexedDB, Hauptspielstart,
Wandzeit-Timer oder Eval/HTML-Import. Der Ausschnitt wird im Node-Test gegen die
Originaldatei geprüft; Referenzhashes werden mit einer unabhängigen Instanz aus
der Originaldatei verglichen. Diese festgehaltene Kopie macht den statischen
Einstieg ohne Build möglich. Sie darf nicht separat weiterentwickelt werden;
ein späterer Core-Wechsel erfordert erneute überprüfte Extraktion und Tests.

Genau **eine** private Core-State-Instanz in `session.js`. Der bestehende
`LegacyCoreAdapter.project` akzeptiert zusätzlich ausdrücklich Regel 14, weiterhin
Regel 32; keine implizite Migration, keine neue Wirtschaftsrechnung. Seine
bisherigen R32-Tests bleiben unverändert. Fehlende Frachtslots unter R14 sind
unbekannt. Ein Bundle versorgt HQ und Station. Die zusätzliche Flotten-/Werftanzeige
liest einen abgetrennten vollständigen Save derselben Revision für Klasse,
Produktionslinien und Lager. Anzeigenamen werden niemals zu Identitäten.

R14-Schnittstellen: `createState`, `execute`, `submit`, `advance`, `save`, `load`,
`hash`, `audit`, `preis` aus `m_core_index`. W5u nutzt `execute` synchron,
keine zweite Queue. Die UI gibt keine eigene Eigentümer-ID vor; Befehle verwenden
fest `RULES.economy.start.owner` (`house`). Ein fremdes Schiff kann nicht ausgewählt
werden. Der Kern validiert zusätzlich die Ausführung. Auswahl ist nur UI-Zustand;
eine stabile reale ID verbindet globales Auswahlfeld, HQ-Flottenreiter und 2D.
Die HQ-Komponente erhält dafür eine kleine zusätzliche `selectShip(id)`-Methode.

Jede Mutation läuft auf einer durch Original-Load geprüften Kopie. Nur ein
angenommener Originalbefehl mit erfolgreichem anschließendem Load und Geld-/
Warenaudit ersetzt den State. Ablehnung oder Ausnahme verwirft die Kopie.
Nur explizite Schritte 1/10/60 Minuten rufen `advance` auf. Rendern, Navigation,
Schiffsauswahl, Zoom und Rotation rufen keinen Simulationsschritt auf.

## Angebundene und gesperrte Aktionen

| Bedienung | Originalkern / Grenze |
| --- | --- |
| Name, Halten | `shipRename`, `shipWait`; Eigentum/Name/Phase im Core |
| Miner fördern | `shipMine`; nur vorhandene Ressourcenarten des tatsächlichen Systems |
| Frachter selbständig handeln | `shipHandeln`; Core-Rollenprüfung |
| Reise | `shipMove`; reale Stations-ID, Core-Route und Dauer |
| Ware/Hülle kaufen oder verkaufen | `shipTrade`; echte Menge, Kasse, Bestand, Reserve, Frachtraum und Gebühren im Core |
| Hülle aus Bordladung aktivieren | `shipActivate`; getrennt vom Kauf, tatsächliche neue Core-Schiff-ID |
| Zeit | `advance`; keine Echtzeit- oder Bildratenkopplung |
| Export/Import | `save` / strikte Versionsprüfung + `load` + `audit` + Adapterprüfung |
| Direkter Werftbau | nicht angebunden; R14 hat keinen `stationBuildShip`-Befehl |
| Produktionsrezepte ändern, Fitting, Jägerkampf, Skills, Scanner | nicht angebunden, keine Demo-Aktionen |

Basispreis je Einheit aus `core.preis` ist ausdrücklich **kein verbindlicher
Gesamtpreis**. Keine nachgebaute Preis-/Gebühren-/Finanzierungsformel. Der Core
entscheidet auch nach zwischenzeitlichen Schritten neu. Stationslager und
Produktionslinien (`rezept`, `rest`, `herkunft`) werden roh belegt angezeigt.
Unbekanntes Stationseigentum bleibt unbekannt; gleichnamige Konten belegen kein
Eigentum. Kontozähler und Ereignisse sind Rohbelege, kein vollständiges Journal.
Gewinn, freie Reserve, Fracht-Eigentum und Bauangebote werden nicht erfunden.

## 2D-Herkunft und Wiederverwendung

Gelesene Quellen, ausschließlich zur Prüfung/Rendererübernahme, kein Core-Merge:

- `feature/w2-miner2d-gemeinsam-20261104` ·
  `18daa75ef7c4933c0d087da173bb7b42e604ede6`: Minerintegration.
- `feature/w5-frachter-2d-20261104` ·
  `c11332c380672a581ef239a18e6921214df1da28`: gemeinsame Miner-Grafik im
  Inline-Modul `m_ui_miner2d`, Frachterdateien unter `prototypes/w5-frachter/`.

`ship-graphics.js` übernimmt **nur die unveränderte Funktion `grafik(canvas)`**
aus der letztgenannten Quelle. Kein Flugkern, Demo-RNG, Zeitloop oder Mock.
Die dortige `frachterSicht` verlangt W3/Regel17 und spezielle Auftragsdaten;
sie kann deshalb nicht sicher an Regel14 gebunden werden. W5u liefert stattdessen
die ausgewählte tatsächliche ID, Klasse, Ladung und Tick an dieselbe Grafik.
`miner` und `trader` verwenden deren bestehende Schiffsmodelle. Position 0/0 ist
explizit schematisch, kein behaupteter Weltort; System/Phase werden daneben real
angezeigt. Keine künstlichen Vorkommen, Scanwerte, Handelsangebote oder Kontakte.
Andere Rollen erhalten eine ausdrückliche Nichtunterstützungsanzeige.

## Save-Schutz und Textausgabe

Separater Einstieg `prototypes/w5u/index.html`; keine automatischen Datenbank-,
LocalStorage- oder Save-Slot-Zugriffe. Reload startet eine neue isolierte Seed42-Welt.
Der sichtbare Hinweis verlangt Export vor Reload/Import. JSON-Export als Download,
Import höchstens 5 MiB, nur exakt Regel14/Schema8; keine automatische Migration.
Ungültige Imports behalten State und Auswahl. Überholte Dateilesungen werden
bei neueren Imports oder Sitzungsaktionen verworfen. Ausschließlich JSON wird
gelesen, kein importierter Code ausgeführt. Dynamische Ausgabe nutzt `textContent`
oder das bestehende Komponenten-Escaping. Auch Rufnamen mit HTML bleiben Text.

## Notwendiger Vertrag für spätere R32-/W5s-Anbindung

Ein revisionsfestes, statisch auslieferbares **Original-Core-Artefakt** mit seinen
unveränderten passenden Regeln bereitstellen: Konstruktor, `loadW5R`/passender
Loader, `save`, `hash`, vollständiger Geld-/Warenaudit, `execute`, `advance` sowie
explizite Command-Felder und Spieleridentität. Keine Regel14-Commands aus Namen
auf R32 übertragen. R32 nur nach vollständiger Core-Validierung an denselben
Snapshot-Adapter übergeben; Kosten-/Finanzierungsprüfung bleibt im Core.
Vor Freischaltung jeden tatsächlich angebotenen Kauf-/Bau-/Frachtbefehl mit
Eigentum, Finanzierung, Warenbilanz, Save/Load, Replay und Render-Hash prüfen.
Bis dahin werden R32-Imports abgelehnt. Kein fertiger W5s-Integrationsstatus.

## Prüfung am 07.11.2026

- Node **22.23.4**, `node --test tests/*.test.mjs`: **15/15 Dateisuiten**,
  0 Fehler, 0 Skips, 0 Abbrüche.
- Zusätzlich `node --test --experimental-test-isolation=none tests/*.test.mjs`:
  **120/120 Einzeltests**, davon 5 neue, 0 Fehler/Skips/Abbrüche.
- Neue Tests: Originalausschnitt und Referenzhashes Seeds42/7/1234; reine Anzeige
  und Auswahl unverändert; reale bezahlte Hüllenkäufe/-verkäufe, Inbetriebnahme
  mit neuer eigener ID und korrekten Beständen; Core-Audit und Save/Load;
  fremde Schiffe, falsche Rolle/Menge/Hülle, Regeln/Schema, beschädigtes JSON und
  Geld-/Warenabweichungen abgelehnt; Mine, Halten, Handeln, Reisen und Rename
  deterministisch einschließlich 60 Minuten Replay.
- Chromium/Playwright Touch bei **1180×820, 1024×768, 820×1180, 390×844**:
  fünf Routen, globale/HQ-Auswahl, Miner-/Frachterdarstellung, Rotation/Zoom,
  Quer-/Hochformatwechsel, kein Seitenüberlauf, unveränderter Tick/Hash bei Anzeige,
  sichere Textausgabe, echter Download und Import, Fehlerfälle, Zeitschritt,
  Reload ohne Persistenz, unberührter LocalStorage-Sentinel. Reproduzierbar mit
  `python tests/w5u-touch.py`; Screenshots lokal `/tmp/w5u-*.png`.
- Eigene CI `.github/workflows/w5u-integration.yml`: Node22 sowie Chromium-
  Touchjob, Pfadfilter umfassen die gesamte neue Oberfläche und Komponenten.
  Remote-CI ist getrennt vom lokalen Nachweis am Draft-PR zu prüfen.
- `git diff --check`; produktive `index.html`, ROADMAP und PROJEKTSTATUS
  byte-identisch zur W5t-Basis. Keine Regel-, Preis-, Rezept- oder Schemaänderung.

**Offen:** echte iPad-Safari-/NAS-Abnahme, Langzeitwirtschaft unter dieser neuen
Bedienfolge und spätere R32-/W5s-Integration. Chromium-Touch ist keine Safari-
Freigabe. Kein Merge, kein Deployment, keine Behauptung wirtschaftlicher Freigabe.

## W5v-Finanzierungsvorschau · [DRAFT/UI], 09.11.2026

Separater [PR #266](https://github.com/tobiasfranziskus/Check/pull/266), direkt auf W5u aufgebaut;
keine Regel-, Save-, Produktions-, KI- oder sonstigen Kernänderungen.

- `W5uSession.preview(intent)` nutzt **exakt den vorhandenen Regel-14-Core**
  mit `core.load`, `core.execute` und `core.audit` auf einem nur für die
  Vorschau erzeugten validierten Zustandsklon. Die Live-State-Instanz und
  ursprüngliche RNG-/Tick-Historie werden nicht mutiert.
- **Handel:** Zeigt reale Core-Akzeptanz oder Ablehnung sowie sofortige
  Cash-Abbuchung/-Gutschrift, Ladeeinheiten und Stationslagerbestände.
  Ein normaler Miner-Kauf im Seed42-Versuch kostete **624 ISK aus vorhandenem
  Kapital**; 2.000 → 1.376 ISK, eine Miner-Hülle ging vom Stationsbestand
  2 → 1 in die Bordladung 0 → 1. Dieser Betrag ist **kein pauschaler Kaufpreis**
  und keine W5/C1d-Preisfreigabe.
- **Inbetriebnahme:** Zeigt den Unterschied zwischen vorhandenem, wirklich
  bezahltem Schiff im Frachtraum und einem neuen eigenen Schiff; ohne Hülle
  verweigert der Original-Core die Aktion. Vorschau selbst stellt keine
  Hülle in Dienst. Bei tatsächlichem Klick wird erneut validiert.
- HTML zeigt getrennte, mobil lesbare Statusbereiche mit `aria-live`,
  ohne HTML-Auswertung der Ablehnungsgründe. Kein weiterer HTTP-Endpunkt,
  kein Fremdscript und keine Browserpersistenz.
- Eigene Node-Suite `tests/w5v-finance-preview.test.mjs` und erweiterte
  viergrößige Chromium-Touchprüfung. **[TEST]** Im direkten, isolierten
  Original-Core-JS-Harness **5/5 Verhaltensgruppen bestanden**; offizieller
  GitHub-Node22-Gesamtregressions- und Touch-CI-Abschluss wird separat
  nach dessen tatsächlichem Ende vermerkt.

**Grenze:** R14 kennt weder die C1d-11-Erztransport-Kapitalquote noch Regel
3314; W5v enthält **keinen** davon importierten Preis oder NPC-Rat. Die
Vorschau belegt nur **heute** anwendbare Sofortaktionen, nicht ihren späteren
wirtschaftlichen Gewinn. Die technische C1d-W5u-Zusammenführung und echte
iPad-Safari-/NAS-Abnahme sind eigene, weiterhin ausstehende Schritte.
