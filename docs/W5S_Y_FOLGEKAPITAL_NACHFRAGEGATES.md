# W5s-y – Fortsetzungsfinanzierung und reale Fracht-Nachfragegrenzen

**[DRAFT/ANALYSE · 07.11.2026]** Auf dem [W5s-x-Branch / PR #228](https://github.com/tobiasfranziskus/Check/pull/228), ausschließlich im R32-Forschungsflag `successorOreFreight`. [MAIN] `5a56d9d7` und öffentliche Pages-Version/Versionsarchiv unverändert. Keine Erhöhung von Nachfrage, Frachtpreis, Warenmenge oder ISK; keine Firmenrettung, Werftbestellung oder Autokauf. Regel-/Save-Schema unverändert.

## Stündliche Provenienz – Warum fehlen zwei Fahrten?

Ausgeführt in je 35 echten Spieltagen für Seed42 und Seed7 mit separat gegründeter und tatsächlich gekaufter 930-ISK-Nachfolgespedition. **[TEST]** [Node22 #42349870139](https://github.com/tobiasfranziskus/Check/actions/runs/42349870139): 6/6 Testgruppen bestanden (diagnostischer W5s-y-Test plus bestehende W5s-x-Referenzen).

- 802 von 840 Stundenzuständen: **kein begründeter zusätzlicher Schiff-/Industrieersatzbedarf** (`werkPlan.stage = kein_ersatzbedarf`).
- 23 Stunden: **Abnehmer für einen Ersatzauftrag unfinanziert**; kein wirtschaftlich begründeter kostenloser Neubau.
- Nur 15 beobachtete Stunden in Raffinierungs-, Bau-, Kauf- oder Überführungsphasen; durch interne Stundenstichproben und bestehende W3/W5-Audits belegt.
- Pro Seed genau fünf abgeschlossene bezahlte Erzfrachten à 50, 120 ISK netto/Fahrt; Ende 720 ISK eigenständiges Betriebskapital, 210 ISK Fehlbetrag für 930 ISK neuen Komplettbetrieb und keine freie echte neue Hülle.
- Bereits **250 Erz** in der Nadir-Raffinerie, aber **0 W5-Material** und **0 W5-Frachter-Fertigbestand**. Erzangebot zu erhöhen würde die Lücke nicht schließen. Der W5-Bedarf muss realer bezahlender Schiffsbedarf sein.

## Eigentum, Produktionskette und autoritativer Folgestatus

Neu: `m_core_index.w5sNachfolgeErsatz(state,rules)` als eingefrorener, **rein lesender** Status, ebenfalls unter `w5sFinanzStatus(...).successorReplacement`:

- Zuverlässige getrennte Kassen: `ownCash`, `capitalRequired`, `ownShortfall`, `outsideInvestorCash` und `outsideCashIsAvailableForCompany=false`. In der reproduzierten Ausgangswelt hat der Exportinvestor **18.066 ISK** auf seinem eigenen Konto; davon sind **0 ISK als Speditionskapital gebucht**. Ein bloßer 210-ISK-Transfer ohne Rechts-/Kassenbeleg wird vom Core-Audit abgewiesen.
- Original-W5-Produktionskosten und Provenienz: physisch vorhandene Frachterhülle **und** unverkauftes W5-Produktionsbuch, notwendiges Material, echtes vorhandenes Erz, vorhandene Rafﬁnerie-/Werftkasse und gebundene Arbeitsaufträge.
- `theoreticalTripsAtBest=2` bezeichnet nur eine **Untergrenze unter der unrealistischen Annahme zwei weiterer vollständig bezahlter neuer Aufträge**; `furtherRealOrders=0` hält fest, dass diese nicht vorab belegt sind. Es gibt keinen Command im Plan und keine Reservierung.
- `stage=eigenkapital_nicht_ausreichend` und `production=echte_raffineriecharge_finanzierbar` sind bewusst gleichzeitig möglich: Aus 250 Erz ließe sich regulär bezahltes Material erzeugen, doch ohne finanzierten, zusätzlichen realen Eigentümerkauf darf daraus kein kostenloser Nachfolgerhüllenbau entstehen.

Der Code legt **keine neuen Ausführungsregeln** fest: Die künftige rechtmäßige Folgeinvestition in eine neue Generation benötigt einen gesonderten, belegten Gesellschaftervertrag, Finanzierung der gesamten neuen Hülle inkl. Flugarbeit und separate W5-/W5r-/W5s-Eigentümer-Audits. Automatisches Eigentümergeld-Schöpfen, Rückzahlung oder Übernahme der Altspeditionskasse bleibt ausgeschlossen. Scheitern des bisherigen Eigentümers bleibt zulässig.

## Testgrenzen und Entscheidung

Die aktualisierten W5s-y-Tests prüfen den neuen Read-only-Status, Seed42/7, deterministische Hashes, unveränderte Gesamtgeldsumme, Save/Load, den ausdrücklich blockierten ungebuchten 210-ISK-Gesellschaftertransfer und das ausgeschaltete Opt-in. Eigener Node-22-Workflow führt außerdem W5s-x (einschließlich zweier realer 365-Tage-Läufe und Manipulationssperren) aus. **Neueste CI-Ergebnisse erst nach tatsächlicher Ausführung als bestanden dokumentieren.**

**[OPTION] Nächste Ausbaustufe:** echtes neues Produkt-/Schiffsbedürfnis statt künstlich weiterer Fracht; anschließend Investorenkapital nur nach separater Entscheidung, echter Gesellschaftereinlage und bewiesener Nachfrage. Alternativ eine neue, zahlende reale Produktions- oder Verbraucherbranche. Kein Blankoscheck für eine konkret insolvente NPC-Firma.

Keine produktive Integration, kein Merge/Deployment, keine reale iPad-Safari-/NAS-Abnahme.
