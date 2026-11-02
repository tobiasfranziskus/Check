# B-K10b – 13-Seed-Langzeitprüfung der Absatzflugkosten und lokalen Nahrungszahlung

**[ANALYSE NEGATIV / DRAFT · 02.11.2026]** Gestapelter [PR #119](https://github.com/tobiasfranziskus/Check/pull/119) auf #118 → #117 → #116 → #115 → #114 → #113 → #112 → #111 → #110 → #109 → #108. **[MAIN]** bleibt `b4e604d6` (v0.12.5 / Regel14 / Schema8). Weder der Produktionskern `index.html` noch Wirtschaftspreise, Lohnregeln, ISK-Schöpfung, Schiffersatz, Spielstandschema oder UI wurden verändert.

## Exakte Testbedingungen

- **13 vorab festgelegte Seeds:** 42, 7, 11, 1, 2, 13, 17, 23, 31, 99, 1234, 98765, 65535.
- **Zwei aktive Welten je Seed ×14 zusammenhängende Tage**, also **26 Weltläufe / 364 Spieltage**. Beide nutzen den vollständigen Original-Core, Autohandel, Herstellung, Kaufkraft, Mining, Piraten/Jäger, originale Werftfonds-Hilfe, alle sechs Konsumentenstationen und die explizit nur in der Draft-Analyse aktive Regel15/Schema9.
- **Baseline B-K9y:** echte finanzierte gezielte Händler-Umpositionierung, vorab kalkulierter Hin-/Rück-Spread, aber bisherige spätere `besterAbsatz`-Routenbewertung. **Einziger Unterschied B-K10a-Kandidat:** dieselbe Welt mit Bewertung des tatsächlichen Netto-Zielverkaufserlöses **nach** vorwärts anfallenden Original-Frachterflugkosten im `besterAbsatz`. Keine konkurrierenden Marktplatz-Claims, kein neuer Fonds-/Leistungs-/Spieldatenpfad.
- **Kausal kontrollierter Geldrahmen:** 4 ISK/Produktionsminute lediglich als ausdrücklich **nicht** genehmigte analytische Szenarioannahme. Stationäre Haushalte kaufen nur wirklich neu erzeugte, lokal belegte Nahrung und zahlen aus zuvor real ausgezahltem Einkommen. Die frühere allgemeine Stationsfonds-Mindestauffüllung ist für die Kausalprobe mit `mindeststand=0` und hoher Obergrenze deaktiviert; **ein historischer individueller NPC-Flottenzuschuss wäre weiterhin aktiv**, trat jedoch in diesen Testvarianten nicht auf.
- **Audits und Wiederholbarkeit:** stündlich unabhängige freie Kassen + echte Vertragsreserve = `initialSupply+minted-burned`, Original-Core-Waren-/Herkunftsaudit, täglich echter Save/Load-Hash, wiederholter deterministischer 48h-Seed7-Lauf und 120-Tick Hashvergleich mit dem uninstrumentierten Kern. Tatsächlich gezahlte Flugstunden, Miner-/Jäger-Soll und Ist-Zahlungen, NPC-Hüllenkäufe, Produktions-/Verbrauchsvolumen und Haushaltskassen ausgewertet.

## Zentrales Ergebnis: Nahrungszahlungen enden vor der zweiten Woche

| Prüfgröße über 13 unabhängige Seed-Paare | Baseline | Mit Absatzflugkostenprüfung |
|---|---:|---:|
| Neu produzierte Nahrung **tatsächlich bezahlt verbraucht**, insgesamt bis Tag14 | 3.085 | 3.196 |
| Vorteil über 13 Welten | — | **+111 Einheiten** |
| Seeds mit größerem bezahltem Neu-Nahrungsverbrauch | — | 7 |
| Seeds mit kleinerem bezahltem Neu-Nahrungsverbrauch | — | **2** |
| Seeds unverändert | — | 4 |
| **Zusätzlicher bezahlter Verbrauch Tag8–14** | **0** | **0** |
| **Zusätzlicher ungedeckter Neu-Nahrungsbedarf Tag8–14** | **37.128 Einheiten** | **37.128 Einheiten** |
| Je Seed **fehlende** Einheiten Tag8–14 | **2.856** | **2.856** |
| Verbrauchsstationen mit kumuliertem Nahrungsmangel am Tag14 | 6/6 in jedem Seed | 6/6 in jedem Seed |
| Seeds mit mehr frei verfügbarem NPC1+NPC2-Geld | — | 10 |
| Seeds mit weniger Händlergeld | — | **3** |
| Gesamtänderung tatsächlich bezahlter NPC-Frachterflugkosten über getrennte Welten | — | **−9.252 ISK** |
| Gesamtänderung freier NPC1+NPC2-Kassen über getrennte Welten | — | **+7.982 ISK** |

Die Summen aus 13 Seeds sind **keine einheitliche Weltgeldbilanz**, sondern Ergebnisaggregationen über getrennte Simulationsläufe. Ebenso sind die anfänglichen +111 Nahrungseinheiten **kein Langzeiteffekt**, denn sie werden ausschließlich bis Tag7 bezahlt. Beispiel für eine **Versorgungsregression:** Seed1 verliert mit der Absatzregel 21 bezahlte Einheiten, Seed98765 verliert 7. Seed31 gewinnt 60, aber dort endet der bezahlte Neu-Nahrungsverbrauch ebenfalls vor Woche2.

**Interpretation [ANALYSE NEGATIV]:** Die Kostenprüfung spart in vielen Fällen Fahrgeld, aber sie sichert weder eine durchgehend bezahlte Herstellung noch lokalen Endverbrauch. Die höhere Händlerkasse ist kein Nachweis eines funktionierenden Wirtschaftskreislaufs. Damit ist die B-K10a-Einzelregel **nicht produktionsreif** und wird nicht zur Integration empfohlen.

## Tag14: Die nachweisbare lokale Trennung von Nahrung und Geld

Die zusätzliche testseitige, hashneutrale Stationsdiagnose führt pro stationärem Haushalt dessen **eigene** ISK, wirklich kaufbare Nahrung zum **Original-Marktpreis** und Alt-/Neuware getrennt. Beispiele aus Seed42:

| Station | Neuer Nahrungsbestand Tag14 | Haushaltsgeld | Originalpreis/Nahrung | Sofort mit diesem Geld finanzierbare Einheiten |
|---|---:|---:|---:|---:|
| Nadir (Verbrauch 2/Stunde) | **32** | **29 ISK** | 39 ISK | **0** |
| Veldra (Verbrauch 3/Stunde) | **9** | **25 ISK** | 47 ISK | **0** |
| Aldera (Verbrauch 3/Stunde) | 0 | **3.212 ISK** | 54 ISK | 59 theoretisch, **0 real mangels Lager** |
| Orion (Verbrauch 3/Stunde) | 0 | 640 ISK | 57 ISK | 11 theoretisch, **0 real mangels Lager** |
| Cyris (Verbrauch 3/Stunde) | 0 | 362 ISK | 59 ISK | 6 theoretisch, **0 real mangels Lager** |
| Dravos (Verbrauch 3/Stunde) | 0 | 240 ISK | 49 ISK | 4 theoretisch, **0 real mangels Lager** |
| Meridian (**0 Verbrauch**) | 0 neue Nahrung, **100 alte Einheiten** | 0 ISK | 39 ISK | Kein lokaler Nachfrageort |

Die getrennte Seed7-Probe bestätigt das Muster: **Nadir 32 neue Nahrung / 29 ISK bei Preis39; Veldra 9 (Baseline) bzw. 13 (Kandidat) neue Nahrung / 41 bzw. 28 ISK bei Preis47/46; Meridian 100 Altware, Verbrauch0; Aldera mit 3.692/3.948 ISK Haushalt, aber 0 Food**.

Die **konkreten Tagesendzustände sind belegt**. Sie zeigen einen lokalen Markt-/Geldkonflikt: *Am Ort mit Ware* ist das Haushaltskonto zu klein für eine einzige weitere Nahrungseinheit; *am Ort mit Haushaltsgeld* fehlt die Ware; alter Bestand steht in einer Station ohne eigenen Konsum. Dass dieser Zustand in allen Zwischenstunden dieselbe Ursache hatte, wurde **nicht** direkt buchungsweise für jede Stunde bewiesen und braucht eine begrenzte Kausalprüfung.

Auch Stationsbetriebskapital ist örtlich knapp: in Seed42 liegen etwa die Stationskassen Cyris bei **21 ISK**, Dravos **6 ISK**, Nadir **8 ISK**, während ein neuer sechsminütiger Lohnauftrag beim hier geprüften 4-ISK-Minutenlohn **24 ISK** reservieren müsste. Fehlende Investitionsfähigkeit und lokal nicht realisierbare Kaufkraft müssen deshalb gemeinsam, nicht durch Preis-/Lohntricks, untersucht werden.

## Andere Kostenarten: vorhandene Unterdeckung bei NPC-Jägern

| Soll/Ist der tatsächlich geleisteten, beobachteten Arbeiten in 13 getrennten Testwelten | Baseline | Absatzkandidat |
|---|---:|---:|
| **Miner-Sollbetriebskosten** | 115.201 ISK | 111.755 ISK |
| **Tatsächlich bezahlte Minerstunden** | 115.201 ISK | 111.755 ISK |
| **Jäger-Sollbetriebskosten** | 1.092.000 ISK | 1.092.000 ISK |
| **Tatsächlich bezahlte Jägerstunden** | **88.760 ISK** | **89.600 ISK** |
| **Ungedeckte Jäger-Sollarbeit** | **1.003.240 ISK** | **1.002.400 ISK** |

Hier ist **keine bereits bestehende Verbindlichkeit oder Geldschöpfung** zu behaupten: Der Core berechnet bei `m_core_stunde.betriebskosten` tatsächlich `n=Math.min(Besitzerkasse,Sollkosten)` und zahlt nur `n`; wenn kein Geld da ist, werden erforderliche volle Arbeitspreise nicht ersetzt. In diesen Szenarien sind **mehr als 90 %** der Jäger-Sollkosten ungedeckt. Die Jäger gehören anderen Akteuren und dürfen **nicht** nochmals als Aufwand der Nahrungsstation gerechnet werden. Dieser Befund verhindert allerdings weiterhin die Aussage „alle Schiffe und Leistungen vollständig finanziert“.

### Zusätzliche Abgrenzung

Miner/Soll und Jäger/Soll wurden unabhängig von den bereits bezahlten, atomar reservierten **Frachter-Flugkosten** gemessen; sie sind keine weitere Zahlung im Frachtergeldmodell. `minted` und `burned` stammen weiterhin aus dem bestehenden Kampf-/Sicherheits-/Senkenmodell, werden für jeden Seed unabhängig auditiert und wurden nicht um neue Regeln ergänzt. Dass die individuelle Werftfonds-Soforthilfe in diesen 26 Welten gerade 0 ist, bedeutet **keine Abschaffung der produktiv weiterhin vorhandenen Hilferegel**. Reale iPad-/NAS-Abnahme wurde nicht ausgeführt.

## Testresultate

- [GitHub Actions #41442461728](https://github.com/tobiasfranziskus/Check/actions/runs/41442461728), Code-Head `f5f0b4e`: **vollständiger Workflow erfolgreich, Node.js 22 137/137 grün**, 0 Fehler. Ausgeführt 26 ×14 Tage mit stündlichen Bilanzen/Warenaudits, täglichen Save/Load-Roundtrips und deterministischem Replay.
- [GitHub Actions #41443029113](https://github.com/tobiasfranziskus/Check/actions/runs/41443029113), erweiterter Code-Head `4e45a1b` mit genauer pro-Station-Kassen-/Alt-/Neuware-/Preisdiagnose: **ebenfalls gesamter Workflow erfolgreich, Node.js 22 137/137 grün**. Alle ausgeführten v10–v14-Referenz-/Geografie-Jobs erfolgreich, ein ursprünglich planmäßig nicht durchgeführter Sicherheitsgeografie-Vergleich übersprungen. Historische Referenzjobs beweisen **keine** 90-Tage-Stabilität der R15-Wirtschaft.

## Begründeter nächster Schritt [OPTION B-K10c]

Keine weitere breite Handelsparameter-Suche als Hauptstrategie. Stattdessen ein kleiner, überprüfbarer **Original-Core-Realvertrag** über bereits vorhandenem Warenbestand: Für eine konkrete Verbraucherstation mit Haushalt-ISK und fehlender Ware sollte ein Anbieter an einer Station mit überschüssigem, belegtem Bestand **nur gegen echte vorfinanzierte Transport- und Handelszahlungen** eine Lieferung abschließen. Parallel muss der Verkauf am Ziel aus dem lokalen Haushaltskonto tatsächlich möglich sein, ohne irgendeinem Individuum ISK oder Waren zu schenken. In einem isolierten Vorversuch Stationen Nadir/Veldra/Aldera/Orion/Dravos/Cyris und Meridian vergleichen, Einzelfalllieferung plus stündlichen Geld-/Waren-/Chargen-/Save-Audit. **Kein Preis-/Lohnänderungsbeschluss und keine zusätzliche Emission**.

Getrennt davon einen finanzierbaren Jäger-/Sicherheitsauftrag mit vorher gebundener Deckung und gegebenenfalls korrektem Stoppen statt Gratisarbeit untersuchen; kein automatischer NPC-Insolvenzschutz. Erst wenn **neue Lebensmittel- und Lohnzahlungen in Woche zwei** wieder nachweislich stattfinden, einen vergrößerten Test von 40 stabilen Perioden und anschließend 13×90d/365d ansetzen. Kein eigenmächtiger Merge oder Deploy.
