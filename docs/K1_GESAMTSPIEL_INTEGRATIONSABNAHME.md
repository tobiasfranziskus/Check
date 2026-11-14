# K1 – Unabhängige Integrationsabnahme des spielbaren Gesamtpfads

**Stand:** 12.11.2026 · **[ANALYSE / DRAFT]**, PR [#312](https://github.com/tobiasfranziskus/Check/pull/312). **Nicht auf main integriert.** Hauptversion weiterhin bei `04124f2bca27dc33b54be30c07b6a7bbb7387e81` (Regel195/Schema8). Ausgangspunkt: [#311](https://github.com/tobiasfranziskus/Check/pull/311) `bbff201270631bc36dc8209b9a1069c976bf69d7`, gestapelt auf [#310](https://github.com/tobiasfranziskus/Check/pull/310), [#306](https://github.com/tobiasfranziskus/Check/pull/306), K3/K2/K1. Wirtschaftsexperimente K4/K5 #308/#309 wurden **nicht** übernommen.

## Fragestellung und Methode

Nachweis, ob der Spieler auf einem **einzigen autoritativen Weltzustand** gleichzeitig Konzernmanager und persönlich fliegender Miner sein kann: Kauf, 2D-Kartensteuerung, bezahlter Abbau, realer Dockverkauf, automatischer rechtmäßig finanzierter NPC-Transport, Wasserproduktion, konsistente Übersichten und verlustfrei gespeicherter Zustand. Der unabhängige Browsertest `tests/welt-gesamtspiel-browser.cjs` benutzt für Aktionen ausschließlich die bestehenden, tatsächlich sichtbaren UI-Schaltflächen und für die Zeit die offizielle Test-Zeitschrittschnittstelle `window.__welt.schritte`. Er erzeugt keine alternativen Preise, Mittel, Eigentümerbefehle, Schiffe oder Wirtschaftszustände. Browser- und Speicherprüfungen laufen pro Viewport auf **getrenntem frischem Kontext**.

## Verifizierter Browser-Verlauf, Seed 42

| Schritt | Messung / Nachweis |
| --- | --- |
| Gründung | 33.000 ISK Gesamtgeld, Regel199/Schema8, positive unabhängige Eigentümerkassensumme und Core-Audit |
| Investition | 600 ISK originalfinanzierter Miner-Kauf: Käuferkasse −600 ISK, Stationslager −1 Hülle, neues Eigentum `house` |
| Persönlicher Flug | Zielvormerkung hashneutral, `shipApproach` erst nach Bestätigung; Eisfeld nach 10 Minuten erreichbar |
| Förderung | 50 tatsächlich neue Eis an Bord, mindestens 100 ISK bezahlter Originalbergbau-Lohn für diese 50 Minuten; keine Fernabnahme |
| Rückflug | 11 Minuten bis `angedockt`, davor weiterhin 50 eigene Eis auf dem Schiff |
| Handel | Aldera übernimmt exakt diese 50 Eis, Eigentümerkasse sofort +250 ISK; tatsächlicher Stationslagerzugang +50 |
| NPC-Folge | Nach weiteren 500 Core-Minuten mindestens eine originale, finanzierte Eisfracht und 50 tatsächlich produzierte Wasser; der Browserlauf endet bei Tick572 |
| Konsistenz | Konzernkasse, Ersatzrücklage, Schiffs-IDs/Eigentum, Aldera-/Nadir-Lager, Treuhand, Produktion, Fracht, Emission jeweils mit Core-Bericht identisch; reine Ansichtswechsel ohne Hashänderung |
| Speicher | Manueller Platz, JSON-Download, Wiederimport ohne Doppelanlage, IndexedDB-Autosave und Reload mit unverändertem Hash und unverändertem aktivem Welt-ID |
| Bilanzen | 33.000 ISK Gesamtgeld in jeder Phase; Mint/Burn 0; K1-Audit in jeder Phase positiv |

**Exakter Endhash:** `4dcf8f07db0424f2`, unabhängig von Browser-Engine, Touchgröße und geänderter Darstellungsreihenfolge. Das Ergebnis ist auf vier Viewports je Engine reproduziert: 1180×820, 1024×768, 820×1180 und 390×844. Gleichzeitig laufende NPC-Förderlöhne dürfen bei der Spieler-Förderung nicht als Spielerleistung gezählt werden. Der Test prüft deshalb den finanzierten *zusätzlichen* Anteil, nicht die vermeintlich nur vom Spieler erzeugte Gesamtsumme.

## Tatsächlich ausgeführte CI und Grenzen

- **[K1-Welt-CI #43214878904](https://github.com/tobiasfranziskus/Check/actions/runs/43214878904):** Chromium und WebKit, jeweils 4/4 Integrationsläufe mit `K1_GESAMTSPIEL_OK`, identischem Endhash und den angegebenen Zahlen. Der separate Node22-Gesamtjob auf demselben Head wird erst nach tatsächlich erfolgreich abgeschlossenem Lauf als bestanden bezeichnet.
- **[JavaScript-CI #43214878931](https://github.com/tobiasfranziskus/Check/actions/runs/43214878931):** completed/success; historische Referenzprüfungen unverändert.
- **[W5-RC1-CI #43214879368](https://github.com/tobiasfranziskus/Check/actions/runs/43214879368):** getrennt beobachten und nach Abschluss beurteilen.

**Nicht bewiesen:** Endkunden-Wasserkauf in diesem speziellen 572-Minuten-Browsertest (nur 50 Wasserproduktion); Langzeit-Nachhaltigkeit über W6, industrielle Erz-/Materialversorgung nach K5, neue Schiffsklassen als persönliche Cockpits, reale iPad-Safari- und NAS-Gerätebedienung oder ein Hauptspiel-Release. Separate Wirtschafts-Szenarien in `tests/welt-wirtschaft.test.mjs` belegen teils positive Endkundenkäufe und teils echte dauerhafte Krisen, ersetzen aber keinen W6-Nachweis.

## Integrationsempfehlung (keine Freigabe)

Der zusammenhängende Stack #300/#301/#304/#306/#310/#311/#312 ist ein geeigneter **weiterer Integrationstest-Kandidat**, nicht automatisch produktionsreif. Vor einer Freigabe zuerst die konkreten Import-/Save-Versionspfade, einen statischen Preview-Einstieg, die dokumentierten K3-/K5-Engpässe und reale iPad-Safari/NAS prüfen. Jede Merge- oder Veröffentlichungsentscheidung bleibt beim Nutzer. Kein Update von GitHub Pages oder NAS, keine produktiven Spielstände überschreiben.
