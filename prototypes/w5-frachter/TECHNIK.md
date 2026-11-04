# [DRAFT] W5 – spielbarer 2D-Frachter

Basis: PR [#175](https://github.com/tobiasfranziskus/Check/pull/175),
`feature/w5b-jaeger-grafik-integration-20261104`, Commit
`d770cdea394605d326f11602b3d0307766e06972`. Eigener Branch:
`feature/w5-frachter-2d-20261104`. Keine Änderung an main, PR #176,
index.html, produktiven Core-Modulen, Roadmap oder Projektstatus.
Nur neue Dateien in diesem Verzeichnis und unter tests/. Kein Merge/Deployment.

## Start und Bedienung

Repository statisch per HTTP(S) ausliefern, z. B. für Entwicklung
`python3 -m http.server 8765`. Einstieg:
`/prototypes/w5-frachter/frachter.html`. Kein Build, Backend, CDN oder npm-Paket
zum Spielen. ES-Module und fetch benötigen HTTP(S), kein file://.

Die Ansicht startet **eine echte isolierte W3-Sitzung (Regel17, Seed42)** mit dem
vorhandenen `createW3State`. Keine Mockdaten. +50 Minuten lässt die vorhandenen
NPC-Miner tatsächliches Erz fördern/verkaufen. Anschließend Frachter kaufen,
echte ID auswählen und Transportauftrag starten. +60 Minuten liefert das Erz
nach Nadir; weitere +60 Minuten schließen die leere Rückfahrt nach Aldera ab.
Auch +1 und +10 Minuten sind möglich. Ohne Knopfdruck bleibt die Core-Zeit stehen.
Käuferkapital und Ware sind endlich; Ablehnungsgründe stammen aus dem Core,
kein automatisches Auffüllen und keine Gratisrettung.

Erkennbar sind ID, Eigentümer, Fracht, Abflug-/Dockstandort, Ziel, Fahrtrichtung,
Ankunftstick und Restminuten. Kassen, Treuhand-Kaufbudget (inklusive Entgelt),
Arbeitsreserve, bezahlte Arbeitskosten und tatsächlich realisierte Frachterlöse
werden separat angezeigt. Das Angebot vor Start kommt aus `pilotW3Kalkulation`;
es ist unverbindlich, `execute` prüft unmittelbar erneut. Hüllenkaufpreis stammt
aus den vorhandenen W3-Regeln. Keine eigene Preis-/Reserveformel.

## Architektur und Wiederverwendung

`m_ui_frachter_core.mjs` liest die vorhandene index.html über same-origin fetch.
`vorhandeneModule` extrahiert die bestehenden Core-Module zwischen
`m_data_systeme` und `m_data_oberflaeche` sowie **das unveränderte**
`m_ui_miner2d` bis `m_ui_main`. Wie die bestehenden Tests wird das vorhandene
Inline-JavaScript mit Function ausgewertet. Keine Kopie einer Simulation und
kein Start der produktiven UI, ihrer Uhr oder Speicherhülle. Bei veränderten
Modulankern wird ausdrücklich abgebrochen. Eine CSP, die Function verbietet,
benötigt später eine gesonderte Modul-Integration; der Prototyp lockert keine CSP.

Die Sitzung besitzt genau einen Core-Zustand. Alle Käufe/Starts gehen über
`m_core_index.execute` (`shipBuy`, `shipFreight`); Zeitschritte ausschließlich
über `advance(..., W3_RULES)`. Keine neuen Konten oder Buchungen. Der bestehende
Core legt bei Auftragsstart seine bisherigen Treuhandkonten selbst an.

`m_ui_frachter_sicht.mjs` erzeugt eine abgetrennte, rekursiv eingefrorene Ansicht.
Alle Frachter kommen aus `state.ships`, sortiert nach tatsächlicher ID. Die
Schiffsauswahl verwendet IDs; Anzeigenamen werden ausschließlich als Text/Option
gesetzt. Das Canvas trägt `data-schiff`. Geld und Vertragsbelege kommen aus
`pilotW3Stand`, `pilotW3Kalkulation` und `audit`.

Grafik: bestehende `m_ui_miner2d.grafik`, Frachtermodell `trader` mit GX-Teilen,
Sternfeld und Frachtraumbogen. Herkunft bleibt die in
[2D_UEBERNAHME.md](../../docs/2D_UEBERNAHME.md) dokumentierte Übernahme.
Touch: vorhandene `eingabe`-/`treffer`-Primitive einschließlich Pinch, Abbruch,
Mindest-Trefffläche und Trennung von Auswahl/Befehl. Canvas-Taps erteilen keine
Aufträge. 48px-Mindesthöhe der Formelemente, responsive Spalten, Safe Areas,
Zoom und Größenwechsel berücksichtigt. Keine Hover-Abhängigkeit.

Die Route ist ein ausdrücklich bezeichnetes Schema. Die sichtbare Position
entsteht ausschließlich aus dem aktuellen Core-Ankunftstick und der bereits im
Vertrag festgelegten Reisedauer. Keine Echtzeit-Extrapolation, Flugphysik oder
Simulation durch Renderframes. Es gibt keinen laufenden Render-/Simulationstimer.

## Save/Load und Grenzen

Nur flüchtiger Sitzungszustand. JSON-Export verwendet direkt `api.save`, Import
`api.loadW3` und Audit vor Zustandswechsel. Beschädigte und inkompatible Saves
werden abgelehnt; die laufende Sitzung bleibt erhalten. Vor Import wird der
Sitzungswechsel im nativen Dialog bestätigt. Kein localStorage, IndexedDB oder
Zugriff auf slot1 bzw. vorhandene W1–W5-Spielstände. Vor Schließen JSON exportieren.
Automatisches Wiederherstellen und eine produktive Speicheranbindung sind offen.

Die Ansicht unterstützt bewusst **W3-Regel17**, keine beliebigen W4-/W5-/W5b-Saves.
W5 ist hier der UI-Auftrag, keine erfundene neue Wirtschaftsregel. Noch nicht
verfügbar: freie Flugsteuerung, manuelles Andocken, freie Routenwahl, Überführung
einer in Nadir gekauften Hülle. Dies steht auch sichtbar in der Oberfläche.
Keine Treibstoffmechanik. Kein Anschluss an den produktiven Hauptlink.

## Ausgeführte Prüfungen (04.11.2026)

- Node **22.23.4**, `node --test tests/*.test.mjs`: **180/180 bestanden**,
  0 Fehler, 0 Skips. Enthält die bestehenden W3-/W5b-13×90-Tage-Tests,
  Geld-/Warenaudits und Save/Load sowie unveränderte Regel14-Golden.
- Drei neue Node-Tests: echte W3-Core-Snapshots vor Kauf und in Dock-/Hin-/Rück-/
  Abschlussphase; 100 echte Canvas-Renderer-Aufrufe pro Phase ohne Veränderung
  von Save, Hash oder Tick; eingefrorene Projektion; Seed42/7-Replay und
  Save/Load während der Reise; reale Reserven, Lieferungen, Erlöse und Kosten;
  ungültiger Besitzer, fehlendes Schiff, kaputter/falscher Import und Zeitschritt.
  W3-Endhash nach dem getesteten Zyklus: Seed42 `7e59efb389dc4467`,
  Seed7 `9a7a4cf2fd8867f6`. Historischer Regel14-Hash nach 60 Minuten:
  `866776f7d84ef15e`.
- `tests/browser/w5-frachter.cjs`: Chromium mit Touch-Emulation bei
  1194×834, 834×1194 und 375×812 plus Rotation; Kauf/ID/Eigentümer,
  Hin-/Rückflug, Fracht, Auswahl und Pointerabbruch ohne Core-Befehl,
  JSON-Export/-Import während Rückflug, abgelehnter Import ohne Hashänderung,
  kein horizontaler Overflow, Formelemente mindestens 48px, keine Pageerrors.
  Entwicklungsvoraussetzung: vorhandenes Playwright über `PLAYWRIGHT_MODULE`
  angeben, kein neues Projektpaket. Standard-Testserver Port8765.

**Offen:** reale iPad-Safari-Abnahme im Hoch-/Querformat, echte Gesten und native
Dateidialoge auf iPad, tatsächliche NAS-HTTP(S)-Auslieferung und deren CSP/MIME-
Konfiguration. Chromium-Emulation ersetzt diese Abnahme nicht. Kein Deployment.
