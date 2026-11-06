# W5s-l – Betriebskapital für Folgeflüge vor NPC-Hüllenkäufen

**[DRAFT/ANALYSE · 06.11.2026]** Gestapelte Forschungsfortsetzung von W5s-k (#214), ohne Änderung an `main`, Save-Schema/Regel32, Preisen, Gesamtgeld oder alter UI-Integration.

## Hypothese und kleinster Testeingriff

W5s-k belegt: Spedition mit zwar +2.640 ISK operativer Frachtmarge, aber nach 2.250 ISK gekauften Hüllen, 120 ISK Überführung und 2.270 ISK Ausschüttungen ohne Betriebskapital. Die folgende 50er-W3-Fracht verlangt **120 ISK eigenen reservierbaren Fluglohn** zusätzlich zu 740 ISK Nadir-Käuferetat.

Das neue, ausschließlich im expliziten R32-Profil wirksame `rules.w5s.carrierWorkingCapital` fordert beim **automatischen NPC-Frachterkauf/-bestellen** neben **750 ISK Hülle und 60 ISK Überführung** weitere **120 ISK aus derselben realen Speditionskasse**, also **930 ISK freien Kassenbestand**. Die 120 ISK bleiben Eigentum der Spedition und werden **nicht** an einen anderen Akteur übertragen, nicht verdoppelt, nicht gemintet und nicht fälschlich als zusätzliche Weltwährung gezählt. Der W3-/W5n-Kern bindet diesen Betrag erst bei tatsächlich validiertem `shipFreight` oder `shipFreightIce` und bezahlt anschließend jede echte Flugminute.

W5o-Ausschüttungen berücksichtigen diese Betriebsmittel im bestehenden `investitionsReserve`-Gate, soweit `retainFleetEarnings` bereits aktiv ist. W5s-e und W5s-g verwenden dieselbe Reserve bei freiem Kauf, Überführung und verbindlicher Vorbestellung. Bereits bezahlte Werftverträge bleiben unangetastet. Manuelle Spielerkommandos, Investitionen anderer Gesellschaften und bereits gespeicherte Spielwelten ohne das ausdrückliche Flag behalten die alten Regeln.

Eine zusätzliche **rein lesende** W5s-k-Finanzprojektion zeigt die Kosten getrennt: 810 ISK Hülle + Überführung, 120 ISK Betriebsreserve und 930 ISK Gesamtbedarf. Kein zweiter Kern, keine neue Kontenart.

## Gate und Testmatrix

Die Forschungs-CI prüft 13 Seeds ×90 Tage und Seed42/7 ×365 Tage, unabhängiges tägliches Geld-/Warenaudit, Save/Load und Seed42/7-Doppelreplays. Die AUS-Variante muss identische W5s-k-Hashes behalten. Vorlauf 2/7/30 Tage wird bei AUS/EIN mit denselben endlichen Start-ISK verglichen. **W5s-l gilt nur dann als positiver autonomer Wiederanlauf, wenn mindestens zwei wirkliche 50-Erz-Transporte von je 740 ISK realem Käuferetat und 120 ISK vorfinanzierter Flug-Arbeit beendet sind und ein Ersatz durch echte Werftware bezahlt wird.** Fehlende Folgeaufträge sind ein ehrlicher Negativbefund, keine Rechtfertigung für Gratiserkäufe oder willkürliche Frachtaufträge.

**[CI noch nicht abgeschlossen]** Ergebnisse und Folgeentscheidung nach wirklich ausgeführtem Lauf dokumentieren. Echte iPad-Safari-/NAS-Abnahme, globale W6-Stabilität, NPC-Insolvenz-/Neueintrittsmodell und Preis-/Geldmodell-B-Entscheidung bleiben offen.
