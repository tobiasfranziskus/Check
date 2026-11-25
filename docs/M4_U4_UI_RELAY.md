# M4-U4 – UI-Relay und Pilotläufe A/B [DRAFT 25.11.2026]

Entwicklungswerkzeug auf Basis der [modularen Abnahme](M4_U4_KI_BLINDABNAHME.md), gestapelt auf #622. Kein Spielcode, keine Regel-/Save-Änderung. Anders als die vorhandenen Playwright-Funktionstests besitzt der Relay keine spielbezogenen Selektoren, Lösungsschritte oder Zugriff auf den Core. Technische Prüfung und Blindtester bleiben getrennt.

## Lokaler Start (Linux/macOS, Node22, im Checkout)

```sh
npm install --prefix /tmp/aphros-ui playwright@1.51.1
/tmp/aphros-ui/node_modules/.bin/playwright install chromium
export PLAYWRIGHT_MODULE=/tmp/aphros-ui/node_modules/playwright
git rev-parse HEAD
node scripts/m4-u4-ui-relay.cjs .
```

Optional CHROMIUM_PATH für ein vorhandenes kompatibles Chromium. Technische Testleitung vergleicht den bereitgestellten Produktbaum mit dem nachgewiesenen Pages-Stand. Lokaler HTTP-Server auf zufälligem Loopback-Port, frischer nichtpersistenter Browserkontext, keine Nutzerprofile. Nur statische Root-/Prototypdateien, externe Requests blockiert, keine DevTools-/JavaScript-/Netzwerkbefehle im Protokoll. Kein Zugriff auf Live- oder NAS-Saves. Der Screenshot wird lokal gespeichert; technische Testleitung übermittelt ausschließlich das Bild und das neutrale Ziel an den unabhängigen Tester. Keine Repo-Zugriffsrechte für den Tester. CLI ist keine Sicherheits-Sandbox für einen beliebig privilegierten lokalen Agenten.

Eine JSON-Zeile je Aktion auf stdin; Ausgabe jeweils ein JSON-Objekt mit Bildpfad, Runde und Zeit. 1180×820, JPEG, max. zwölf Aktionen und fünf Minuten, begrenzte Wartezeiten; bei Dialog-/Werkzeugfehler als Infrastrukturblockade abbrechen. Native Browserdialoge werden nicht bestätigt; Unterstützung hierfür und für Dateiimport/-export ist noch offen. Normale HTML-Dialoge sind sichtbar und anklickbar.

```json
{"op":"click","x":500,"y":300}
{"op":"type","text":"Beispiel"}
{"op":"scroll","x":900,"y":700,"dy":500}
{"op":"wait","ms":500}
{"op":"reload"}
{"op":"stop"}
```

Koordinaten nur Beispiele, keine Spielanleitung. Frischer Chat mit Bildfähigkeit, keine Projektkonversation, kein Quellcode. Bei manuellem Relay entscheidet die KI, Testleitung übermittelt nur Bild und Aktion unverändert. Automatischer Free-Modell-/ChatGPT-Anschluss (z.B. isolierter Tool-Wrapper) ist noch nicht implementiert. Text-only-Modelle können alternativ mit `M4_UI_TEXT=1 node scripts/m4-u4-ui-relay.cjs .` bedient werden. Pro Runde maximal 1.800 Zeichen und 32 Zeilen mit sichtbaren Textfragmenten und (x,y)-Koordinaten. Die KI darf nur diese Projektion und das neutrale Ziel erhalten. Keine Attribute, HTML, Skripte oder versteckte Zustände; konservative Viewport-/Trefferprüfung. Abgeschnittene, überdeckte, grafische oder schwer erkennbare Inhalte können fehlen; Darstellung ist keine pixelgenaue OCR oder Grafik-/Touch-Abnahme. Wenn die Projektion keine ausreichenden Informationen liefert, Screenshot-Modus oder Infrastrukturblockade statt erfundener Aktion.

## A/B – getrennte Pilotaufträge

A: Neue Standardkarriere. Ziel: „Beginne eine Karriere und finde heraus, was du als Manager tun kannst.“ Erste sichtbare Aktion und gewähltes Ziel protokollieren. B: Frische Sitzung; Ziel: „Erziele mit deiner Flotte Einnahmen.“ Erst mit Standardstart versuchen; falls zwölf Aktionen nicht reichen, getrennt einen validierten, regulär erspielten Teststand mit vorhandenem einsatzfähigem Schiff und offenem Auftrag vorbereiten. Keine Lösungsfolge oder spezifischen Klicks mitteilen. B-Teststand noch nicht erzeugt; dafür bestehenden M4-U3-UI-/Auditpfad als technische Grundlage nutzen, echten JSON-Export und Hash prüfen und nur regulär importieren. Kein Storage-Injektionsweg im Relay. Der vorbereitete Importpfad benötigt weitere Unterstützung und Prüfung.

## Nachweise und Grenzen

CI ist auf Ubuntu 24.04 festgelegt, nachdem der [erste Lauf](https://github.com/tobiasfranziskus/Check/actions/runs/45545330985) bereits bei der Browserinstallation unter Ubuntu 26.04 scheiterte. Die Prüfungen wurden dort übersprungen. CI testet das Aktionsprotokoll, isolierte Browserkontexte, echte Koordinatenklicks, Reload und Rundenlimit auf neutraler Fixture sowie Screenshot- und Text-Smoke vom tatsächlichen Root der Checkout-Kopie. Eine zusätzliche neutrale Fixture prüft sichtbare Koordinaten, tatsächliche Klickwirkung, Ausgabegrenze sowie Ausschluss versteckter, überdeckter, transparenter, außerhalb des Viewports liegender Texte und Attribute. Das ist kein Spieltest A/B und keine UX-Abnahme. Node22-Gesamtregression separat im Workflow. Lokaler Checkout/Browser-Node-Abhängigkeit hier nicht verfügbar; tatsächliche CI-Ergebnisse abwarten und separat dokumentieren. Weitere Module, automatischer Modellanschluss, validierte Teststände, echte iPad-/NAS-Abnahme bleiben offen.
