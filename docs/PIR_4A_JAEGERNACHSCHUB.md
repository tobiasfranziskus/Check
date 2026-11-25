# PIR-4a – Nachschub- und Eigentumsgate vor Eskorten [FORSCHUNG]
23.11.2026, festes main `679ba6c1fdb05435164e29b2e21514ddaa676279`. Unabhängig von #604 und #605. Nur neue Testdatei, eigener Workflow, dieses Dokument. Keine Änderungen an Core, Flug, UI oder Saves.

## Gesicherter Quellbefund auf diesem main
- J4b (`prototypes/welt/j4b-jaeger-werft-core.js`, 67–89) erlaubt nur shipBuy owner=house, station=st_nadir. Nicht allein ein Liquiditätsproblem: auch vorhandene NPC-Firmen sind keine gültigen Käufer.
- J4b-Audit (91–140) bindet jeden Kaufbeleg dauerhaft an vorhandene Hülle, owner=house, Nadir als Heimat UND aktuelles System, Phase dock, zulässigen lokalen Flugzustand. Unprotokollierter Verlust, Eigentumswechsel oder anderer Sektor nicht zulässig. PIR-3b benötigt später ein kohärentes Verlust-/Hüllenarchiv statt Entfernung des Kaufbelegs; PIR-4b/5d benötigen explizite Käufer-/Piloten-/Eigentumsregeln. Nicht pauschal für alle Identitäten öffnen.
- J3/J4: je Hülle 8 echte Bauteile = 8 Silizium + 16 Material; zusätzlich 4 Material, also insgesamt 20 Material. 8×8 + 32 = 96 ISK direkte Fertigungslöhne laut J13b, nicht Gesamtkosten. J4-Hüllenpreis 900 ISK. J2b-Silizium ist im vorliegenden Industriekern weiterhin endlicher, separat auditierter Vorrat; ein sichtbares Flugfeld/Respawn ist nicht automatisch zusätzliche verkaufbare Industrieware.
- PIR-1 besitzt genau eine Szenariohülle pir001 und separat gepaarte K1-Pilotenbuchung. Keine Werftversorgung für diese Fraktion. Kein Jägernachschub durch alte Ersatzlogik.

## Vorhandene historische Nachweise (keine neuen Messungen)
- [P6](W6_P6_AUTONOME_JAEGERLIEFERKETTE.md): erste J4-Hülle nach 12.240 min (8,5 Tage), 2 bis Tag90, 16 Silizium ausgeschöpft. [P7](W6_P7_SILIZIUM_LANGZEIT.md): bis Tag730 weiterhin nur 2. Jeweils 1 echter Hauskauf. Ältere Referenzen; kein aktueller Re-Test.
- [P8h](W6_P8H_INTEGRATION.md): getrennte Regel207/NPC-Folgeversorgung, S02 4 gebaute/3 gekaufte Jäger bis Tag90, keine weiteren bis Tag730, 9 der 13 Regime ohne Jäger bis Tag90. Kein nachhaltiger Nachschubnachweis, kein NPC-Käufer. Standard 204 bleibt getrennt.

## Neuer ausführbarer Nachweis
`tests/pir-4a-jaegernachschub.test.mjs`: zwei getrennte 30-Tage-Läufe mit realen Originalprofilen 204-S02 und 207-P8h. W6-NPC- und Siliziumopt-in, separat Materialversorgung nur 207. Maximal zwei echte 900-ISK-Hauskäufe je Lauf. Am ersten echten verfügbaren Lagerbestand identischer Save-Clone für jeden der vier vorhandenen Fremdkäufer; erwartete Originalberechtigungsablehnung mit unverändertem Save, positiver Hauskauf, Geld/Ware/Save/Load, gesonderte Negativkopien für unprotokollierten Verlust und Systemänderung. Messpunkte 10/20/30 Tage, Lager, Kassen, Hash, Kaufbeleg und endliche Materialgrenze. Regel207 ist Vergleichsforschung, keine Erweiterung von PIR-1. Testlauf noch nicht ausgeführt bei Commit; keine Resultate vorwegnehmen. Sollte der 30-Tage-Positivkontrollbestand fehlen, ist das ein Befund und keine Aufforderung zu Rettungsbuchungen.

## Empfehlung und Übergabegate
1. PIR-4a zunächst nur eigener, gekaufter, in Nadir stationierter Jäger; lokale Eskorte, keine neue Fremdprokura, keine Freihülle, keine Reise aus Nadir. Original-K1-Finanzierung und echte PIR-3-Kampfwirkung abwarten. M4-UX und #604 bleiben unangetastet.
2. Vor PIR-3b/4b/5d neues versioniertes Hüllen-/Eigentumsarchiv mit Kauf-, Weitergabe-, Verlust- und Stilllegungsbelegen spezifizieren; alte Saves und Käuferregeln unverändert. Mehrparteien-Pilot-/Lohnkonten und Hüllenherkunft nur nach Abstimmung. Nicht gleichzeitig am Codex-Kampfcode implementieren.
3. Wirtschaftsforschung: bestehende finite J2b-Quellen separat von Flugrespawn; keine Gratisvorräte, zuerst echte erschließbare Siliziumkette, realer Rohstoffkauf, Baukapazität und reale Nachfrage. Vergleich Standard/Opt-in plus 13×90, 365/730 und Gegenproben. Erweiterte Geologie/Recycling nur nach eigener Regelfreigabe.
4. P0 #586 nimmt den Befund als Forschungsblocker in die konsolidierte Roadmap auf; keine parallele Änderung der zentralen Dokumente. Kein Merge/Deploy.
