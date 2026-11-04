# [DRAFT] W1-/2D-Miner-Integration · 04.11.2026

Integrations-Draft: [PR #164](https://github.com/tobiasfranziskus/Check/pull/164), gegen den W1-Branch aus #161.

Integrationsbranch: `feature/w1-miner2d-integration`, Basis [#161](https://github.com/tobiasfranziskus/Check/pull/161)
bei `61eebed5`; gezielte Grafik-/Touchübernahme aus [#162](https://github.com/tobiasfranziskus/Check/pull/162)
bei `35688082`. Kein Merge, kein Deployment. Der gesamte Core bis
`m_data_oberflaeche` bleibt gegenüber #161 bytegleich; Regeln 14/15 und Schema 8
werden nicht verändert. Herkunft: [2D_UEBERNAHME.md](2D_UEBERNAHME.md).

## Bedienung auf einem statischen HTTP(S)-Server

1. `index.html?modus=miner2d` öffnen. Es wird der vorhandene W1-Spielstand geladen.
2. Unter „Mein Bergbaukonzern“ einen vollständigen Miner kaufen. 600 ISK gehen
   an den realen Verkäufer; das Verkaufslager nimmt ab. Keine Gratisflotte.
3. Eigenes Schiff im Canvas antippen oder in „Eigenes Schiff“ wählen. Das
   Erzfeld antippen oder über „Auswahl“ wählen, dann Förderung beauftragen.
4. Mit „+1 Core-Minute“ beginnen. Erst der Core finanziert die Charge und
   bindet Abnahme- und Arbeitsbudget. Fracht und Kosten folgen echten Ticks.
5. Weitere Minuten oder +1 Stunde/+1 Tag ausführen. Vollständig gefüllte
   finanzierte Chargen werden bezahlt geliefert; Stop bezahlt die Teillieferung
   und erstattet ungenutzte Mittel. Das Konzernkonto und der Vollkostenbericht
   zeigen tatsächliche Zahlungen, keinen geschätzten Verkaufswert.

Vorfinanzierung kann eine kleinere Charge als 50 Erz ergeben. Ein gesetzter
Förderbefehl ohne finanzierbaren Auftrag erzeugt weder Erz noch unbezahlte Arbeit.
„Meine Miner“ wirkt auf die gesamte eigene Flotte; die Canvas-Befehle gelten nur
für das ausgewählte eigene Schiff. Zoom/Pinch und Auswahl verbrauchen keine Zeit.
Vor dem ersten Kauf zeigt die Szene den real vorhandenen NPC, kein Spielerschiff.

Die W1-Kontenansicht (`?modus=erzpilot`) und der Miner teilen
`aphros-void-erzpilot-regel15-v1`. Ein Ansichtswechsel wartet auf Speicherung.
JSON-Export/-Import, Archivierung vor Neustart/Import und Ablehnung beschädigter
Daten bleiben die #161-Speicherhülle. Der bisherige `slot1` wird nicht benutzt.
Keine Speicherung von Kamera-/Auswahlzustand und keine Migration zwischen Regel 14/15.

## Ausgeführte Prüfungen

Node **22.23.4**:

```sh
node --test tests/*.test.mjs
node --test --experimental-test-isolation=none tests/*.test.mjs
```

Beide Aufrufe erfolgreich. Der Standardaufruf meldet in dieser Umgebung 12
Dateisubtests; der zweite zählt **106 Einzeltests, 106 bestanden, 0 Fehler,
0 übersprungen**. Enthalten: die 97 W1-/Standardregressionen von #161, sieben
Grafik-/Adapter-/Touch-/Herkunftstests aus #162 sowie zwei zusätzliche
W1-Adaptertests (Queue-Replay mit bezahltem Kauf, Treuhand, 13-Erz-Teilabrechnung,
Save/Load, deterministische Projektion und NPC-/Spielerbesitz).

Die W1-Regressionen prüfen Kauf, Förderbeginn, beidseitige Vorfinanzierung,
volle/teilweise Lieferung, Stop/Erstattung, fehlende Käufermittel,
NPC-/Spielergleichheit, beschädigte/ältere Saves, **13 Seeds × 90 Tage** mit
unabhängigen Tagesprüfungen und Hash-Determinismus. Regel-14-Seed42-60-Minuten-Hash
weiterhin **`866776f7d84ef15e`**; keine Referenzwerte geändert.

Browserprüfung mit vorhandenem Playwright und Chromium, ohne neue Projektabhängigkeit:

```sh
python -m http.server 8765
PLAYWRIGHT_MODULE=/pfad/zu/playwright node tests/browser/miner2d.cjs
```

Drei Touch-Viewports **1194×834, 834×1194, 375×812**, jeweils Drehung:
Kauf, echte Canvas-Erzauswahl ohne Tick, Auftrag, 1-Erz-Teillieferung,
Stop/Erstattung (Spielerkasse 2.408 ISK), erneute volle finanzierte Charge,
Export, Audit, Reload, Wechsel zur Kontenansicht und zurück bei identischem
W1-Snapshot, unveränderte Regel-14-Speicherdaten, tatsächlicher JSON-Export/-Import, Zoom, mindestens 48px hohe
Bedienelemente, kein horizontaler Überlauf, Reduced Motion, Sperre bei beschädigtem
W1-Save und keine JavaScript-Fehler. Screenshots unter `/tmp/w1-miner2d-*.png`
wurden visuell geprüft; sie sind temporäre lokale Testartefakte.

## Offene Abnahme und Grenzen

- **Echte iPad-Safari-/NAS-Abnahme ausstehend.** Chromium-Touch-Emulation ist
  kein Gerätebeleg. Noch auf echtem iPad Hoch-/Querformat, Pinch/Abbruch,
  Formulare/Tastatur, JSON-Dateiauswahl, Export, Importarchiv und IndexedDB nach
  Safari-Neustart sowie statische NAS-HTTP(S)-Auslieferung prüfen. Vorher JSON sichern.
- Das endliche Exportbudget bleibt 20.000 ISK. Nach Ausschöpfung gibt es ohne
  echte, separat beschlossene Käufererlöse keine dauerhafte Nachfrage. Keine
  ISK-Emission, Auffüllung oder neue Wirtschaftsregel eingeführt.
- Lokale Flugfunktionen bleiben schematisch; Raffinerien, Module, Reparaturen,
  weitere Waren, W2–W6 und Mehrspieler sind nicht Teil dieser Integration.
- Draft und Tests sind keine Freigabe für Merge oder Veröffentlichung.
