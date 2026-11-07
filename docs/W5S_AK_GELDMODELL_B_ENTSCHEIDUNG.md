# W5s-ak – Entscheidungsvorlage Geldmodell B: Wer zahlt wem für echte Exportleistung?

**[OPTION / ENTSCHEIDUNG OFFEN · 07.11.2026]** [PR #239](https://github.com/tobiasfranziskus/Check/pull/239) baut dokumentarisch auf [W5s-aj #238](https://github.com/tobiasfranziskus/Check/pull/238) auf, nicht auf `main`. **Keine neue Emission, kein Produktcode, keine Bewilligung.** Verbindlich bleibt `docs/ROADMAP.md`: Geldmodell B als Rahmen [BESCHLOSSEN], Auslöser, Emittent, Empfänger, Betrag und Abwicklung [OPTION]. Produktiver Regel-14-Spieltest, W5u #234, Spielstände und Schema 8 bleiben unverändert.

## 1. Was wirklich nachgewiesen ist

Die originale R32-Simulation verbindet Eisförderung → bezahlten 50er-Eistransport → 10-Eis-zu-10-Wasser-Werkschargen → Verkauf von Wasser für 14 ISK/Einheit. Nicht ein gebuchter Bedarf, sondern **physischer Verbrauch gegen reales vorhandenes Haushaltsgeld** erzeugt Einnahmen; Leistungen sind durch W3/W4/W5/W5n/W5o/W5s und Eigentumsaudits nachgewiesen. In W5s-ah wurden echte Pilotenlöhne aus bereits bezahlten Flugminuten verteilt; in W5s-ai wurde ein irrtümlich nach Fremdlieferung gesperrter, mit 810 ISK vorfinanzierter Ersatzfrachter korrekt eingelöst. Beide Maßnahmen erhöhen die reale Tätigkeit ohne neue ISK; die Haushaltskasse erreicht dennoch nur 8 ISK statt 14 ISK für die nächste Wassereinheit.

[W5s-aj #238](https://github.com/tobiasfranziskus/Check/pull/238) verwendete **unverändert** die schon vorhandene, ausdrücklich deaktivierte W5q-Export-Forschung: Wasser wird physisch aus dem Lager entfernt, `ledger.wasser.exported` steigt genau um diese Menge, `state.minted` wird einmalig erhöht und jedes Ereignis mit Tick und Deckel auditiert. Die präzise Gesamtkontrolle ist `sum(owners.cash) = 33.000 ISK + state.minted`. Gleiche Ware kann nicht intern konsumiert und zusätzlich exportiert werden.

**[TEST · GitHub Node22 #42389543691](https://github.com/tobiasfranziskus/Check/actions/runs/42389543691):** 10/10 gezielte und 456/456 vollständige Standardtests erfolgreich, keine Fehler oder Skips; die unabhängige Regression #42389543672 führte alle geplanten nicht übersprungenen Jobs erfolgreich aus. W5s-ak selbst ist eine **reine Dokumentationsvorlage ohne neue Tests oder Code**, kein neuer Spielbarkeitstest.

### Vergleiche: exakt derselbe finanzierte R32-Ausgangszustand, bis Spieltag 365

| W5q-Forschungsbedingung | Exportmenge Wasser | Neue ISK | Weitere tatsächlich bezahlte Wasserverkäufe | Endkundenkasse |
| --- | ---: | ---: | ---: | ---: |
| Ohne Export [W5s-ai] | 0 | 0 | 1.524 | 8 ISK |
| 7 ISK/Einheit, 3.500-ISK-Deckel, Zahlung an Haushalt | 500 | 3.500 | 9.230 | 7 ISK |
| 14 ISK/Einheit, 3.500-ISK-Deckel, Zahlung an Haushalt | 250 | 3.500 | 6.990 | 9 ISK |
| 14 ISK/Einheit, 7.000-ISK-Deckel, **Zahlung an Station** | 500 | 7.000 | 7.066 | 3 ISK |
| 14 ISK/Einheit, 7.000-ISK-Deckel, **vollständige Weitergabe an Haushalt** | 500 | 7.000 | 10.072 | 2.082 ISK |

**[NEGATIV]** Auch die stärkste letzte Variante läuft nicht dauerhaft: an Tag 425 nur 8 ISK Kundenkasse, kein weiterer regulärer Wasserabsatz. Die 7.000 ISK wurden ausschließlich für 500 wirklich exportierte Wassereinheiten einmal gebucht, nicht pro Tag oder pro Firma. Die dann vorhandenen 40.000 ISK im Weltkonto sind kein Beleg für ausreichende **richtige** Verteilung. Ein ausbleibender 14-ISK-Kauf trotz viel Geld auf anderen Konten ist ökonomisch möglich und mit Sparfreiheit vereinbar.

## 2. Der entscheidende Eigentumsmangel im heutigen W5q-Versuch

**W5q `mode:'station'`**: der externe Käufer zahlt eine nachweisbare Exportrechnung an den Eigentümer der aus `st_nadir` entfernten Wasserware. Der Stationserlös ist damit zunächst eine **rechtmäßige Geschäftseinnahme**, aber kein Lohn der Haushalte.

**W5q `mode:'household'`**: zunächst wird dieselbe Exportrechnung bei `st_nadir` gutgeschrieben, direkt anschließend wird der **volle Betrag** von der Station abgebucht und ohne weitere Leistung/Beteiligungsberechtigung an `w5n_kunden` überwiesen. Es existiert in diesem Originalpfad **kein eigenständiger Beleg**, der dem Haushalt Eigentum am exportierten Wasser, einen Lohnvertrag, eine Steuerfinanzierung oder eine Gewinnbeteiligung in genau dieser Höhe zuweist. Die Buchung ist monetär perfekt auditiert, aber ihr **wirtschaftlicher Rechtsgrund ist unbewiesen**.

**Konsequenz:** Das gute 7.000-ISK-„household“-Ergebnis ist *keine* zulässige automatische Produktlösung. Es kombiniert echten Export **mit einer bislang unbegründeten Anschlussüberweisung**. Ohne eine ausdrücklich beschlossene, echte Gegenleistung/Entitlement würde dieser Schritt die Leitlinie „keine Gratisrettungen, keine stillen Transfers“ verletzen. Ein reines Geld-/Warenaudit kann den fehlenden Anspruch nicht ersetzen.

Ein weiterer direkter Werft-Überschuss-Transfer wurde im W5s-ai-Vorlauf bereits in einer separaten, nicht übernommenen Probe untersucht: Mehr Verbraucher-ISK kompensierten ungenügende Versorgung nur endlich und die Werftkasse fiel zeitweise auf 0. Dieser Weg ist weder eine Emissionsregel noch eine freigegebene Eigentümerdividende.

## 3. [OPTION] Zwei grundsätzlich legitime Wege und ein ausgeschlossener Kurzschluss

### Option A – realer externer Wareneinkauf bei der **Station** (empfohlener erster Forschungsentscheid)

Eine gesondert definierte **weltweite externe Nachfrage** kauft nach physischer Lieferung von Wasser vom tatsächlichen Besitzer `st_nadir`. Pro tatsächlich exportierter Einheit gibt es genau **eine** neue, auditable ISK-Gutschrift **an die Station**. Nur wirklich vorhandene, ausgebuchte Ware ist berechtigt. Das Modell erzeugt im nächsten Schritt **keine** Haushaltszahlung. Stattdessen dürfen aus diesem Erlös ausschließlich tatsächlich vereinbarte Produktionslöhne, originäre Material-/Frachtzahlungen oder später rechtlich begründete, aus realisiertem Gewinn und nach Betriebsreserve bezahlte Dividenden herausfließen.

**Vorteil:** Kein unberechtigter Empfänger, W5q `station` liefert bereits die technischen Grundbelege. **Nachteil:** Bei 7.000 ISK einmaligem Gesamtdeckel reicht der normale Haushaltsrückfluss im Test nicht aus; das ist eine offene Designaufgabe, nicht durch unbedingte Dividendenausschüttung zu kaschieren.

**Mögliche nur für weitere Tests zu genehmigende Startmatrix**, NICHT als Produkttarif: 7 oder 14 ISK je tatsächlich exportierter Wassereinheit; maximal 10 Wasser/Tag; daraus maximal 70 oder 140 ISK/Tag **gesamtwirtschaftlich**, zusätzlich einmaliges Gesamtbudget 3.500 oder 7.000 ISK. Die vorhandene W5q-Matrix implementiert genau diese einmalige, **endliche** Zahlungsobergrenze. Periodisches Nachfüllen, Inflation/Senken, Handelspartner, Jahres- oder Lebenszeitlimits wären **neue separate Beschlüsse**. Keine automatische Deckel-Erhöhung im Krisenfall.

### Option B – eigenständige, wirklich erbrachte externe **Haushaltsleistung**

Ein extern zahlender Auftraggeber bezahlt Haushalte/Piloten direkt **nur**, wenn diese eine **separat überprüfte zivile Arbeit oder Dienstleistung** tatsächlich ausgeführt haben. Es muss ein aus der Welt belegbarer Auftrag entstehen, mit eindeutigem Arbeits-/Leistungsobjekt und nicht erneutem Bezahlen derselben Eis-/Wasser-/Frachtarbeit. Eine Ware darf weder doppelt als Export noch als städtische Dienstleistung vergütet werden.

**Vorteil:** Legitimer Mittelzufluss zum konsumierenden Eigentümer, wenn die Haushalte tatsächlich Dienstleister sind. **Nachteil:** Der heutige R32-Kern hat dafür **keinen solchen konkreten zivilen Auftrag** nachgewiesen. Ihn jetzt ohne spezifische Spielaufgabe zu emittieren wäre eine erfundene Leistung. Diese Option ist erst nach eigenem Produktkonzept und Finanzierung prüfbar.

### Nicht zu wählen – unmittelbare Auszahlung aller Stationsexporterlöse an einen willkürlichen Haushalt

Die bereits existierende W5q-Testoption `household` ist **ausschließlich eine Stress-/Verteilungsgegenprobe**, kein Einkommensrecht. Sie darf nicht ohne eigenständige Eigentums-, Dienst- oder staatlich finanzierte Leistungsgrundlage in den produktiven Core übernommen werden. Ebenso ausgeschlossen: Auffüllen einer insolventen Firmenkasse; zwangsläufige Spieler-Ausschüttung; gratis erzeugte Nachfrageeinheiten; Emission bloß wegen Mangel; automatischer Neustart des Emissionsbudgets nach Ausschöpfung.

## 4. Annahmekriterien für einen später ausdrücklich zu beauftragenden Forschungs-PR

1. **Emittent und Ware:** gesonderter externer Abnehmer / definierter Exportort; eine echte gebuchte Ware oder eigenständige, datierte Dienstleistung als Gegenbeleg. Keine Wiedergutschrift bereits verkaufter oder verbrauchter Ware.
2. **Zahler/Empfänger/Eigentümer:** genau ein berechtigter Erstempfänger; jede spätere Haushaltseinzahlung benötigt eigenen Beleg und eine verfügbare, tatsächlich abgebuchte Quellkasse. Nie Cash-only Rettung.
3. **Globale Obergrenze:** Emissions-Summenbudget über alle Konzerne und alle diesem Modell zugehörigen Empfänger hinweg. Tagesreste verfallen; kein Rückstand und kein Nachzahlen; kein Antrag nach Verlust oder Insolvenz. Parallel existierende Geldquellen (etwa Kopfgelder, seltene Funde) getrennt in derselben Weltbilanz ausweisen.
4. **Zeit und Nachhaltigkeit:** einmalige endliche Gesamtobergrenze darf nur **endliche Ergebnisse** beanspruchen. Wiederkehrende Budgets benötigen explizit genehmigten Zeitrahmen, globalen Geldmengenschutz, reale Nachfrage und Warensenken; keine mechanisch unendliche Aufstockung.
5. **Finanz-/Waren-/Schiffsaudit:** deterministische Export-ID/Tick, Menge, Warenabgang, Zahlung, Restbudget, Quelle, Ziel, unveränderte vorhandene W3/W4/W5-Lohn-/Frachttreuhänder; 13 feste Seeds × 90 Tage, Seed42/7 inklusive 365–425+ Tage, aktive Insolvenzen, sparender Spieler, NPC-Sparen, Ausfall physischer Ware, Idempotenz, Save/Load und beschädigte Belege.
6. **Abnahme:** zunächst nur isolierter, Default-OFF-R32-Forschungsbranch. Keine Änderung an `main`, `index.html`-Produktstart, Pages und bestehenden Speicherplätzen; echte iPad-/NAS-Abnahme getrennt.

## 5. Konkrete Entscheidung, die die Projektleitung treffen muss

**Vorschlag W5s-al [OPTION]:** *Nur den nächsten isolierten Testauftrag* freigeben, bei dem **Option A** als physischer stationseigener Wasserexport mit den bestehenden einmaligen W5q-Caps (Vergleich 3.500/7.000 ISK) untersucht wird. Keine sofortige Produktregel, keine automatische neue Haushaltszahlung, keine unendliche externe Staatskasse, keine Merge-/Deployment-Berechtigung. Resultate an bereits bilanzierten Löhnen, erhaltenem Flottenkapital und realem Endverbrauch messen. Bei Scheitern wirtschaftlichen Engpass ausweisen statt neues Geld nachzuschieben.

**Separate, spätere Produktentscheidungen**: Existenz/Identität externer Käufer, Exportpreis, globaler Emissionsdeckel/Zeitregime, wer überhaupt Endkunde einer externen Dienstleistung ist, Eigentümer-/Dividendenrecht, zulässige jährliche Nettogeldmenge und etwaige Quellen/Senken.

**Empfohlene Projektleitungsentscheidung:** Option A als enger Forschungstest, **kein produktives Geldmodell B**. W5u-Integration und iPad-Abnahme unabhängig weiterführen. Diese Vorlage selbst ändert keinen Spiel- oder Testcode und braucht deshalb keine neue Rule-/Save-Migration.
