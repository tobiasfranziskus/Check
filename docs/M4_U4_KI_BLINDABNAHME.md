# M4-U4 – modulare KI-Blindabnahme [BESCHLOSSEN 25.11.2026]

Die Projektleitung ersetzt den 60-Minuten-Einzelblindtest ausdrücklich durch kurze KI-fähige Blindtests. Externe menschliche Tester und kostenpflichtige Modelle sind keine Voraussetzung. Dieses Dokument ersetzt die bisherige Methodik, nicht die Befunde früherer Versuche (insbesondere #570). Die neue Abnahme ist bis zur tatsächlichen Durchführung OFFEN.

## Testorganisation

- Nur öffentliche Standardkarriere auf https://tobiasfranziskus.github.io/Check/ oder eine unveränderte statische Kopie exakt desselben nachgewiesenen Produktstands. Versions-/Commitbezug vor dem Test durch die technische Testleitung festhalten.
- Je Modul ein frischer Chat ohne Projektwissen, Quellcode, Roadmap, frühere Berichte oder Lösungswege. ChatGPT mit echter Browsersteuerung oder kostenloses Modell mit einem generischen Browseradapter sind zulässig. Der Adapter gibt nur sichtbare Screenshots/zugängliche UI-Texte zurück und führt vom Tester gewählte Klicks/Eingaben aus; keine versteckten Spielzustände, DOM-Manipulation, Core-Aufrufe, automatisierten Lösungswege oder Netzwerk-API zur Spielsteuerung.
- Budget je Sitzung: höchstens 5 Minuten tatsächlicher Interaktion oder 12 kurze Aktions-/Beobachtungsrunden, was zuerst erreicht wird. Ein Screenshot pro Runde bei Bedarf, kompakte UI-Textauszüge, keine vollständigen DOM-Dumps. Bericht max. 200 Wörter. Bei Kontext-/Toolgrenze darf ein Modul in neuer Sitzung mit neuem Startzustand erneut versucht werden. Kein dauerhafter Chat und keine garantierte Mindestzeit.
- A beginnt mit einer neuen Standardkarriere. B–F dürfen mit reproduzierbaren, unveränderten, über reguläre Spielbefehle entstandenen und validierten Standardkarriere-JSON-Testständen starten. Vorbereitung durch technische Testleitung getrennt vom Tester; keine Lösungsanleitung, kein erfundener Waren-/Geldbestand. Isolierte Browserprofile oder eigene Testsitzungen; nur explizit freigegebene Testdaten überschreiben. Keine produktiven Saves verändern.
- Kein Handflug. Entscheidungen durch den Tester, nicht durch vorgegebene Klickfolgen. Tester erhält ausschließlich das neutrale Modulziel. Technische Sollwerte und interne Fehlerursachen bleiben verborgen.
- Zeit-/Token-/Browserlimit ist ein Infrastrukturblocker, kein Spielfehler und kein Bestehen. Fehlende Browsersteuerung macht einen Blindtest ungültig; statische Codeanalyse und simulierte Aktionen werden separat geführt.

## Module und Prüfkriterien

| Modul | Neutrales Ziel für den Tester | Beleg für technische Testleitung |
| --- | --- | --- |
| A | Beginne eine Karriere und finde heraus, was du als Manager tun kannst. | Start, Orientierung, selbstständig gewählte erste wirtschaftliche Aktion |
| B | Erziele mit deiner Flotte Einnahmen. | Selbstständiger Kauf/Einsatz oder Disposition; tatsächlich gebuchter Erlös sichtbar |
| C | Erkunde eine weitere Einnahmequelle oder einen Handelsweg. | Alternativen erkannt, nachvollziehbare Entscheidung und tatsächlich ausgeführter legaler Auftrag/Handel |
| D | Dein Unternehmen hat ein Problem. Finde heraus, welches und wie du darauf reagieren kannst. | Ursache über UI erkannt; legaler Gegenversuch oder verständlicher Hinweis, dass aktuell keine tragfähige Alternative besteht |
| E | Entwickle dein Unternehmen weiter. Was reizt dich am nächsten Schritt? | Sichtbarer Fortschritt, selbst gewähltes erreichbares Folgeziel oder konkret belegte Motivationshürde |
| F | Sichere deine Karriere und spiele sie weiter. | Regulärer Save-/Reload- oder JSON-Export-/Import-Roundtrip in isolierter Sitzung, überprüfbare Fortsetzung |

## Bestehen und Grenzen

Alle sechs Module müssen am selben verifizierten Produktstand mit echten UI-Interaktionen erfolgreich absolviert sein. Ein tatsächliches unverständliches/unerreichbares Kernziel, ein kritischer Bedienfehler, eine nicht erklärte Sackgasse oder ein Save-Verlust blockiert die Abnahme. D darf einen realen wirtschaftlichen Engpass feststellen; eine verständliche Meldung allein beweist keine wirtschaftliche Tragfähigkeit. Die technische Langzeitabnahme muss zusätzlich einen zusammenhängenden, mindestens 60 simulierte Spieltage umfassenden Managementpfad mit realen Entscheidungen, Originalbuchungen, Save/Replay und Negativfällen nachweisen; bestehende 13×90-/365-/730-Tage-, Finanzierungs-, Integritäts- und Browser-Gates bleiben unverändert. Kein künstliches Erreichen von Fortschritt. Ein strukturell unspielbarer Standardpfad bleibt offen, auch wenn Einzelmodule grün sind. Kein neuer Spielmechanismus wird durch dieses Dokument freigegeben.

Bericht pro Modul: Produkt-SHA, Modell/Umgebung, Teststand-ID (oder Neustart), Zeit/Anzahl Runden, höchstens fünf konkrete Aktionen und sichtbare Ergebnisse, Hürden, Ergebnis BESTANDEN / NICHT BESTANDEN / INFRASTRUKTURBLOCKIERT. Bewertung von Verständlichkeit, Entscheidungsfreiheit, Optik, beobachteten Motivationssignalen und vermutetem Wiederspielwert getrennt; KI-Einschätzungen sind UX-Indizien, keine empirisch belegte menschliche Spielerfahrung. Die bisherige einstündige reale Spielerfahrung gilt nicht als nachgewiesen. Echtes iPad/NAS bleibt separat offen.

## Kopierbarer Kurzprompt für frischen KI-Chat

> Öffne https://tobiasfranziskus.github.io/Check/ in einer interaktiven, isolierten Browsersitzung. Du kennst das Spiel nicht. Lies keinen Code, keine Roadmap, Anleitungen oder früheren Berichte. Spiele nur über die sichtbare Oberfläche als Manager, ohne Handflug. Ziel: [neutrales Modulziel einsetzen]. Start: [neue Standardkarriere oder bereitgestellter validierter Teststand]. Maximal 5 Minuten oder 12 kurze Aktionsrunden, bei früher erreichtem Ziel sofort beenden. Entscheide selbst. Berichte in höchstens 200 Wörtern deine tatsächlichen Aktionen, sichtbaren Ergebnisse, Hürden, Zeit/Runden und ob du das Ziel erreicht hast. Ohne echte Browsersteuerung oder bei Tool-/Tokenlimit melde Infrastrukturblockade; erfinde keine Aktionen. Ändere keine fremden Spielstände.

## Umsetzung

Zunächst kurze Pilotläufe A und B zur Eignung des vorhandenen Browserwerkzeugs. Falls ChatGPT keine zuverlässige interaktive Steuerung bietet, generischen Playwright-Adapter als separaten P0-Testtreiber vorbereiten (Screenshot/Accessibility-Ausschnitt, click/type/scroll/wait, begrenzte Aktionen; keinerlei Spielwissen). Free-KI kann über diesen Adapter in kurzen Sitzungen entscheiden. Technische Vorbereitung der Teststände und Langzeitprüfung separat durch Codex. Nicht als bereits implementiert oder getestet behandeln.
