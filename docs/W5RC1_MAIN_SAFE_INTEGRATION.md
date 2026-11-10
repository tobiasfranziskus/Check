# W5-RC1 – kontrollierter W0–W5-Spieltestkandidat

**[DRAFT / NICHT VERÖFFENTLICHT · 10.11.2026]** Dieser Branch ist ein überprüfbarer Vorbereitungsschritt zur möglichen Ablösung der produktiven Regel14-Version. Er ist **kein** automatischer Merge, keine neue öffentliche Spielversion und kein Nachweis einer tragfähigen W6-Dauerwirtschaft.

## Ausgang und Übernahmegrenze

- **Original `main`**: Commit `fd3e915448a2f35fa803db709aff9ce223dddc6f` (v0.12.5, Regel14/Schema8). Dieser Release-Zweig wurde **direkt von `main`** erzeugt.
- **Geprüfter Forschungs-Code**: [Draft #286](https://github.com/tobiasfranziskus/Check/pull/286) / Commit `f84fd79675e2dc31c1574463047e614c22556586` (W5al; Regel195/Schema8). Die getesteten `prototypes/`-Dateien, zugehörige neue `tests/` und historische Forschungsnachweise unter `docs/` werden als **neue Dateien** hinzugefügt. **Kein** vorhandener Produktdatei-Pfad wird aus dem Forschungsbranch übernommen.
- **Einstieg für die Abnahme**: `spieltest/w5-rc1/index.html` als *neutraler Launcher*, von dort `../../prototypes/w5ag/index.html`. Alle relativen Pfade funktionieren nur bei vollständig erhaltener Repository-/Server-Verzeichnisstruktur.
- **Schutzgarantie durch getrennten Test**: produktive Root-`index.html` und `versionen/v0.12.5/index.html` müssen weiterhin dieselben Git-Blob-Hashes wie auf dem geprüften `main` haben. Keine `index.html`-Weiterleitung; insbesondere **kein** Wechsel der Standard-Startseite, keine Save-Slot-Migration, keine eigenen IndexedDB-Updates im Forschungs-Hub.
- Vorhandene `AGENTS.md`, `README.md`, `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md` und `docs/PAGES_SPIELTEST.md` bleiben beim RC-Abgleich **unverändert**. Der laufende dokumentarische Abgleich auf [Docs-only-Draft #272](https://github.com/tobiasfranziskus/Check/pull/272) ist ein eigenständiger, noch nicht gemergter Redaktionsstrang.

## Was man im W5-RC1 tatsächlich spielen kann

Der W0–W5-Forschungs-Hub verbindet mit einem deterministischen Core: Konzernzentrale/HQ und Karte, reale Auswahl und Förderbefehle für den eigenen 2D-Miner, Besitz/Eis- und Erzladungen, vollständig finanzierte NPC-Erzkäufe, echten W3-Erztransport und Rückflug, W4-Materialproduktion, W5-Frachterbau/-Kauf/-Überführung, echten Kauf von Eis für die Wasserfabrik, zwei getrennte Privatpiloten-Kassen und freiwilligen Wasserkauf aus Einkommen. Die W5ak/W5al-Oberfläche erklärt echte Käuferliquidität und Original-W1-Kauftreuhand. Keine zusätzlichen Core-Timer, kein verstecktes Minting.

**Nicht enthalten/freigegeben:** manueller 2D-Freiflug, Schub/Bremsen/Andocken, echte 2D-Frachter-/Jägersteuerung, Ersatzwirtschaft als belastbares Langzeitmodell, W6-Nachhaltigkeit, Multiplayer, produktive Rule195-Save-Migration und eine garantierte Käufernachfrage. Im RC ist der Miner-Canvas schematisch; die **Fördersteuerung** ist Core-autorisiert.

## Referenz und negatives Gate

- W5ai: Tick480; 2 echte Eisrundflüge, 360 bezahlte Erz-/Eisflugminuten, 30 Wasser produziert, 25 für 350 ISK verbraucht, 5 auf Lager; 33.000 Welt-ISK, 0 Mint; Seed42-Hash `58da44b282a654a3`.
- W5al: Bei Tick550 Aldera 0 ISK frei und 1.000 ISK **gebunden** für laufende Original-W1-Erzaufträge; 50 weitere tatsächlich ausgeführte Core-Minuten geben diese Reserven in einem konkreten echten Fall frei. Nach Quellankauf und 490 ISK Nadirs Käufer-/Frachtetat plus 120 ISK Speditionsarbeit ist ein dritter tatsächlicher Eisrundflug bis Tick720 durchgehend finanziert; 150 Eis geliefert, 480 Lohnminuten; Seed42-Referenzhash `43a9992602f1addd`. Der andere freiwillige Konsumverlauf hat **nicht** den W5ai-Hash.
- Wenn Nadirs Budget nur 454 statt 490 ISK beträgt, verweigert der Original-Core den nächsten Eisauftrag **zustandsneutral**. Auch eine reale Quelle mit 0 ISK frei darf nicht aus gebundenen oder fremden Konten zahlen. Kein pauschaler Rettungsmechanismus.

## Technische Abnahme / Status

- Die Original-Quellversion #286 bestand auf Code-Head `ea6c2933` [200/200 Node22-Tests und 12/12 Chromium-Touchdurchläufe](https://github.com/tobiasfranziskus/Check/actions/runs/42762510518), kein Skip; der spätere rein dokumentarische Head `f84fd796` hatte [JS](https://github.com/tobiasfranziskus/Check/actions/runs/42762878258) und [W5u](https://github.com/tobiasfranziskus/Check/actions/runs/42762877987) grün, aber [W5ag-Touch-CI abgebrochen](https://github.com/tobiasfranziskus/Check/actions/runs/42762877975). Ergebnisse nicht über Heads hinweg zu einem fiktiven vollständigen grünen CI kombinieren.
- **RC-spezifische** Prüfung: `node --test tests/*.test.mjs` sowie die neue GitHub-Workflow-Prüfung inklusive rechtlich sauberem Pfad-/Blob-/Save-Schutz und Chromium 4×3 Touch.
- **Reale iPad Safari + NAS-Abnahme** bleibt separat notwendig; [manueller Prüfplan in Docs-Draft #272](https://github.com/tobiasfranziskus/Check/blob/docs/w0-w4-regel18-integrationsstand-20261109/docs/W5AL_IPAD_NAS_ABNAHME.md). Bei einem tatsächlichen Testserver muss vor Reload/Origin-Wechsel ein JSON-Export erfolgen; statisches NAS ist kein serverseitiges Backup.
- **Releaseentscheidung** (nur Nutzer): nach erfolgreichen CI- und Geräteprüfungen einen eigenen Release-/Standard-Startseiten-PR planen, alten Main-Spielstand vollständig archivieren (bestehende `versionen/v0.12.5/` unverändert), keine produzierten Saves umschreiben. Ohne eigene Merge-/Veröffentlichungsfreigabe bleibt der Root-Haupteinstieg der bisherige.

**CI dieses PR:** erst nach tatsächlich abgeschlossenen GitHub-Läufen mit exakter Testzahl und offenen Geräteschritten ergänzen.
