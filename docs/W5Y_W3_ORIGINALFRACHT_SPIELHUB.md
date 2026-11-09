# W5y – Eine finanzierte W3-Welt mit echtem Frachter in der gemeinsamen Spieloberfläche

**[DRAFT/INTEGRATION · 09.11.2026]** Forschungs-Einstieg `prototypes/w5y/index.html`, gestapelt auf [W5x #268](https://github.com/tobiasfranziskus/Check/pull/268). **Nicht [MAIN]**. Die verbindliche Roadmap ist allein die aktuelle `main/docs/ROADMAP.md`. Keine Änderungen an produktivem `index.html`, Pages, Regel14-Spielständen, Browser-Storage oder Geldemissionsrecht.

## Eine Original-Welt statt neuem Simulationskern

Der unveränderte DATA-/CORE-Code der bestehenden [W3-Forschung #168](https://github.com/tobiasfranziskus/Check/pull/168) wurde aus festem Commit `e893b7e6fcdfa4b6bd7ad2ed1c6fce4374d56e70`, `index.html`, zwischen `const m_data_systeme =` und `const m_data_oberflaeche =` herausgelöst (**120.919 Quellzeichen**). Für den Browser wurde nur eine separate Exporthülle zu `W5yOriginal` ergänzt; keine Preise, Waren, Tickregeln, Schiffs- oder Eigentumsregeln geändert.

Die W5y-Sitzung aktiviert ausschließlich **Regel17/Schema8** und leitet Spieler-Minerbefehle sowie die expliziten Forschungsoperator-Befehle der eigenständigen Spedition `transport` direkt an `core.execute(..., W3_RULES)` weiter. Die W3-Originalrechnung bleibt maßgeblich: `createW3State`, `loadW3`, `pilotW3Stand`, `pilotW3Kalkulation`, `pilotWirtschaftsStand`, `audit`, `advance`, `save`, `hash`. Das bestehende W5w-Hub steuert HQ, Station, Flotte und eigene 2D-Mineransicht aus **diesem selben** Zustand. Die neue W3-Ansicht ist nur Oberfläche und originale Befehlsübermittlung, kein eigener Welt-/Flug-/Markt-/Preisrechner.

Der Legacy-Adapter akzeptiert nach vorheriger Original-Core-Validierung nun auch Regel17. Dessen bestehende originale `w3.auftrag`-Projektion gilt jetzt auch ohne gleichzeitig existierenden `w5n`-Eintrag; das schaltet für W3 echte Frachtbelege lesend frei. W5x/Regel16, W5w/Regel15, W5u/Regel14 bleiben separat benutzbar.

## Finanzierungs-/Lieferkette im Original-W3-Kern

| Zustandsgrenze | Originale Geld- und Güterbewegung (Seed 42/7) |
| --- | --- |
| Tick 0 | 33.000 bereits vorhandene ISK, **0 Mint**; im Aldera-Werftlager eine endliche fertige Frachterhülle, keine Geschenk-Schiffe |
| Vollständiger Kauf | `transport` zahlt **750 ISK** aus eigener Speditionskasse (2.000 → 1.250); echtes Frachtereigentum |
| Tick 50 | Der vorhandene NPC-Miner hat **50 Erz** tatsächlich gefördert/verkauft. Beim Tick 60 kann der bestehende Aldera-Endkundenzyklus diese Charge bereits übernommen haben. Daher gesonderter **50-Minuten-Schritt** statt künstlich neuer Ware |
| Start Fracht | Nadir bindet **740 ISK** (500 Warenwert + 240 Transportentgelt). Die Spedition bindet **120 ISK** für 120 Minuten Lohn (60 hin, 60 zurück). 50 vorhandene Erz liegen physisch im Frachter |
| Tick 110 | Wirkliche Ankunft Nadir: 50 Erz im Ziel-Lager, 500 ISK an Aldera aus Treuhand, 60 ISK Lohn bereits ausgezahlt; 240 Käufer-ISK und 60 Lohn-ISK für Rückflug bleiben gebunden |
| Tick 170 | Realer Rückflug abgeschlossen: 120 ISK gesamte Arbeitskosten bezahlt, **240 ISK Frachtentgelt** an die Spedition; Speditionskasse **1.370 ISK**; Nadir **3.260 ISK**; beide Fracht-Treuhandkonten leer, 50 Erz im Ziel |

Diese Zahlen stammen aus tatsächlich im isolierten Original-JS-Kern ausgeführten Seed42-Prüfungen vor CI; sie sind **kein Nachweis einer dauerhaft tragfähigen Wirtschaft**. Der alte W3-Kern enthält einen endlichen Käuferetat. Für ein weiteres Geschäft muss real wieder Erz im Quelllager liegen, ausreichend Käufer-/Arbeitsgeld existieren und Zielkapazität verfügbar sein. Kein Gratisfrachter, kostenloser Rückflug oder neue ISK.

## Bedienung, Schutz, Tests und Grenzen

- Forschungsseite `prototypes/w5y/index.html`: W0–W3-Bergbau, Konzerne & Markt, neue W3-Frachtkonsole, HQ, Station, Flotte und unveränderte schematische 2D-Mineransicht. Frachter bekommt **noch kein persönlich fliegbares 2D-Cockpit**; die Forschungsoperator-Konsole kommandiert die separate Spedition unter ihren Original-Eigentumsregeln.
- `W5ySession.preview()` verwendet einen vollständig mit Original-Core neu geladenen Zustand, meldet Geld/Kauf-/Treuhandwirkung und lässt Live-Zustand/RNG/Hash unverändert. Bei Ausführung nochmals originale Finanzierung und Eigentum prüfen.
- Kein Autosave, kein IndexedDB/localStorage; Import nur Regel17/Schema8, vollständige W3-/W1-Audits und bestätigte Käufermittel; keine Regel14/15/16/32/3314-Migration. JSON-Export ausdrücklich als W5y-Forschungsstand benannt.
- `tests/w5y-original-w3-freight.test.mjs`: echte Seed42/7-Lieferungen mit 120 bezahlten Minuten, getrennte ISK-Eigentümer und Treuhand, Geld-/Waren-/Frachtaudit, identischer Replay/Save/Load-Hash, Abweisungen für Fälschungen; plus bestehende Gesamttests.
- `tests/w5y-touch.py`: Chromium, Touch in 1180×820, 1024×768, 820×1180, 390×844, echtes Original-Frachtgeschäft, Import/Reload/Slot-Schutz. `.github/workflows/w5y-integration.yml`: Node22-Regression und Browserprüfung. **CI-Ergebnisse erst nach tatsächlich abgeschlossenen Jobs dokumentieren.**
- Die ältere W5x-13×90-Tage-CI weist ausschließlich den dortigen W2-Forschungsstand nach; sie ist **keine** Langzeitabnahme für W5y/Regel17. Weitere W3-Krisenseeds, endliche Käufermittel, wiederholte reale Fracht, echte Folgeproduktion und späterer 2D-Frachter müssen getrennt geprüft werden.
- Echte iPad-Safari- und NAS-Abnahme offen. Keine Freigabe für Produkt-`main`, Geldmodell B oder ein neues globales Nachfrageprofil. Kein Merge/Deployment.

## Nächster sinnvoller Schritt

W3 zuerst im Hub als reale, wiederholbare finanzierte Lieferkette einschließlich noch kapitalgedeckter Folgeaufträge sichern; danach W4 physische Raffinerie mit tatsächlich zahlendem Folgeabnehmer an denselben einen Original-Core anschließen. Vor produktiver Integration W0–W3-Stack gegen den aktuell gültigen main mit Roadmap, Altsaves, iPad und NAS konsolidieren.
