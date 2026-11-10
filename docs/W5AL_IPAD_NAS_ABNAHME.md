# W5al – iPad-Safari-/NAS-Abnahmeprotokoll

> **[DRAFT / MANUELLE ABNAHME OFFEN · 10.11.2026]** Diese Datei ist eine **Anleitung und noch kein bestandenes Testergebnis**. Getesteter Forschungs-Code stammt aus [#286](https://github.com/tobiasfranziskus/Check/pull/286) über #285 → #282 → #280; es gilt **nicht** das produktive Hauptspiel auf `main`. Nutzerfreigabe ist vor einem Testdeployment/Versionswechsel erforderlich. Kein Schreiben in produktive Save-Slots, kein Merge, kein Umschalten von GitHub Pages.

## 1. Genau welcher Stand?

- **[MAIN / weiterhin öffentliches Produkt]** `fd3e915448a2f35fa803db709aff9ce223dddc6f`, v0.12.5 / Regel14 / Schema8.
- **[DRAFT / Testkandidat]** [#286 `research/w5al-echte-erkauf-reserve-cockpit-20261110`](https://github.com/tobiasfranziskus/Check/pull/286); geprüfter Code-Commit `ea6c29332c46944f0a62ccc844afa5bd38e77d0e` und nur dokumentarisch/Workflow-Pfade weitergeführter Head `f84fd79675e2dc31c1574463047e614c22556586`.
- **[TEST]** [CI #42762510518](https://github.com/tobiasfranziskus/Check/actions/runs/42762510518): 200/200 Node22 und 12/12 Chromium-Touch erfolgreich am Code-Commit. [Letzter W5ag-Lauf #42762877975](https://github.com/tobiasfranziskus/Check/actions/runs/42762877975): **cancelled**, in der Chromium-Installation; nicht mit erfolgreicher Safari-/NAS- oder letzter Touch-Abnahme verwechseln.
- **[ABSOLUT GETRENNTE REFERENZ]** GitHub Pages `https://tobiasfranziskus.github.io/Check/` ist **kein** nachgewiesener #286-Spieltest. `prototypes/w5ag/index.html` ist eine statische Datei im Forschungszweig, keine auf dem iPad schon bestätigte öffentliche URL.

## 2. Schutz und Bereitstellung

1. Vor einem Geräte- oder Originwechsel **bestehende produktive Spielstände gesondert als JSON exportieren**. Dateinamen mit Datum/Versionsstand vergeben, eine Kopie außerhalb des Browsers (Dateien-App/NAS-Backup) sicher aufheben und mit Import-Roundtrip verifizieren. Keine bestehende Spielversion oder Datenbank löschen/überschreiben.
2. Erst nach ausdrücklicher Testbereitstellungsfreigabe den **vollständigen statischen Dateibaum** des Forschungsbranches in einen **eigenen, nichtproduktiven** NAS-Ordner kopieren. Insbesondere `prototypes/w5ag/`, `prototypes/w5ac/`, `prototypes/w5w/`, `prototypes/w5u/` und `prototypes/legacy-*/` müssen mit ihren relativen Pfaden erhalten bleiben. **Keine** npm-, Backend-, CDN- oder Build-Laufzeitpflicht einführen.
3. Forschungsseite via NAS-HTTP(S) unter `<TESTSERVER>/<TESTORDNER>/prototypes/w5ag/index.html` laden. Den konkreten Host/Port/Origin im Abnahmebericht erfassen; diese Platzhalter sind **keine existierenden Test-URLs**. Nicht per `file://` abnehmen.
4. Forschungs-Sitzung verwendet **Regel195 / Schema8** und keine produktiven Save-Slots. **Sie wird nicht automatisch dauerhaft gespeichert**. Vor Reload, Tab-Schließen, Import und Browserwechsel jeweils den `Export`-Button benutzen, JSON-Datei verwahren und nur nach Validierung wieder importieren.
5. Nach Testende zunächst die exportierte Forschungsdatei archivieren. Keine automatisch gesetzten GitHub-Pages-Links, keine Deploy-/Merge-Aktion und kein Wechsel der Produkt-Origin.

## 3. Reale iPad-Safari-Prüfliste

Pro Prüfpunkten Ergebnis **BESTANDEN / FEHLER / NICHT GETESTET** dokumentieren, iPad-Modell, iPadOS-Version, Browser/Origin, Datum und Screenshot (ohne private Daten) erfassen. Mindestens Querformat und Hochformat; zusätzlich möglichst Split View/schmale Darstellung. Chromium-Touch ist nur **Vorprüfung**.

| Prüfpunkt | Sollzustand | Ergebnis |
| --- | --- | --- |
| Einstieg | Regel195-Forschungstitel und gemeinsame HQ/Karte/2D-Miner/Flotte/Station sichtbar; kein JS-/Ladefehler | **NICHT GETESTET** |
| Navigation | Ansichten wechseln ohne Seed-/Tick-/Geld-/Schiffsreset; zurück zum Miner; Scrollen, Safe-Area, Tastatur, native Auswahl/Taps funktionieren | **NICHT GETESTET** |
| 2D-Miner | Tatsächlich gekaufte Miner-ID auswählbar; reale Erz-/Eisförderung, Stoppen, Ladung und Auszahlung. Der Renderer bleibt schematisch, **keine** behauptete Steuerung über Raumkoordinaten | **NICHT GETESTET** |
| Quellverkauf | 50 echte Eis im Miner; Verkauf nur bei ausreichender **freier** Aldera-Kasse. Anzeige grenzt freie ISK von W1-Erztreuhand und Nadirs Käufergeld ab | **NICHT GETESTET** |
| Frachten | Für Folge-Eisfracht 490 ISK Nadir-Käufer-/Frachtgeld und 120 ISK Speditionslohn tatsächlich reserviert; Lohn erst nach realen Flugminuten, nicht beim Klicken | **NICHT GETESTET** |
| Wasser und Privatlöhne | Nadir-Wasser nur aus vorhandenen Vorprodukten und bezahlter Arbeit; Erz-/Eispiloten auf getrennten Konten, Wasser nur freiwillig aus eigenem Guthaben gekauft | **NICHT GETESTET** |
| Export / Import | Download des Regel195-JSON über Safari und Dateien-App, erneuter Import **derselben** JSON-Version, identischer Tick/Hash; manipulierte/fremde Regelversion zurückgewiesen ohne Änderung | **NICHT GETESTET** |
| Reload / Datensicherheit | Vor Reload Backup; nach Reload Forschungs-Neustart als solcher erkennbar; nach gültigem JSON-Import wieder korrekter Forschungszustand. Produktive Saves unverändert | **NICHT GETESTET** |
| Offline-/NAS-Betrieb | Auf dem echten NAS-HTTP(S)-Origin funktionieren relative Script-/CSS-Pfade, kein benötigtes CDN/Backend, keine 404/Dateifehler; gleiche Bedienbarkeit bei erneutem Laden | **NICHT GETESTET** |

## 4. Zwei voneinander getrennte überprüfbare Referenzläufe

**Referenz A: W5ai auf #285/#286, Tick480.** Entsprechend [W5ak-Bedienfolge](https://github.com/tobiasfranziskus/Check/blob/feature/w5ak-wiederholbare-wirtschaft/docs/W5AK_WIEDERHOLBARE_WIRTSCHAFT.md) ohne zusätzliche Raffinerie-/Werftaufträge: zwei wirklich bezahlte Eisrundflüge, 120 Erz- + 240 Eis-Pilotenarbeitsminuten (= **360**), 30 Wasser hergestellt, 25 tatsächlich gekauft und verbraucht, 350 ISK Wasserumsatz, 5 Wasser in Nadir. Weltgeld 33.000 ISK, Mint 0; Seed42-Hash **`58da44b282a654a3`**. Fehler hier nicht durch Änderung der Referenz kaschieren.

**Referenz B: W5al-Versuch mit anderer freiwilliger Kauf-/Fabriksequenz, nicht derselbe Hash.** Nach den jeweils echt vorfinanzierten ersten zwei Eisrundflügen bei Tick480 eine weitere reale Nadir-Fabrikcharge und 20 Core-Minuten bis **Tick500**; dort können 1.000 ISK in W1-Erzankauftreuhand gebunden und 0 ISK bei Aldera frei sein. Dritte Eischarge durch 50 tatsächliche Miner-Core-Minuten bis **Tick550**, Verkauf muss ohne Mutation scheitern. Nach **50 weiteren echten NPC-/Welt-Core-Minuten** gibt der Original-W1-Auftrag die 1.000 ISK bis **Tick600** frei; die dritte echte Eisfracht wird für 250 ISK angekauft. Vor dem dritten Flug erneut **490 ISK Käufer-** und **120 ISK Arbeitsreserve** prüfen; erst nach weiteren 120 echten Flugminuten bei **Tick720** stehen 3 abgeschlossene Eisrundfahrten, 150 gelieferte Eis, 480 bezahlte Gesamtflugminuten (120 Erz + 360 Eis), Weltgeld 33.000 und Mint 0. Der **W5al-Testszenario-Hash Seed42 `43a9992602f1addd`** gilt nur für seine dokumentierte Original-Befehlssequenz. Eine Abweichung durch andere freiwillige Käufe/Produktion ist kein Anlass, Hashes anzugleichen.

**Krise:** Bei 454 statt 490 ISK Nadir-Guthaben muss der nächste Eisfrachtauftrag ohne Mutation blockieren. Dies ist durch einen **separaten Test mit anderem Anfangsetat** belegt; das Kapital der normalen Hub-Sitzung darf für diese Gegenprobe **nicht still umkonfiguriert** werden.

## 5. Abnahmefelder – vom wirklichen Tester ausfüllen

| Feld | Eintrag |
| --- | --- |
| Datum / Prüfer | **OFFEN** |
| iPad-Hardware / iPadOS / Safari-Version | **OFFEN** |
| NAS-Modell / HTTP(S)-Origin / Testordner | **OFFEN** |
| Exakter Quell-Commit / Regel / Schema | **OFFEN** |
| Querformat / Hochformat / Split View | **NICHT GETESTET** |
| JSON-Export-Dateiname und erfolgreicher Reimport | **NICHT GETESTET** |
| Referenz A (Tick480) / Referenz B (Tick720) | **NICHT GETESTET** |
| JS-/Ladefehler, Screenshots, Abweichungen | **OFFEN** |
| Entscheidung: freigeben / Nacharbeit / ablehnen | **OFFEN – Nutzerentscheidung** |

**Eine bestandene Chromium-CI ersetzt diese manuelle Abnahme nicht.** Nach Auswertung kann ein separater, kleiner Integrations- oder Freigabevorschlag entstehen. Freiflug, Docking, Migration, `main` und Pages bleiben bis zur gesonderten Nutzerentscheidung unverändert.
