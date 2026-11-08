# C1c-3 – echte zehn Minuten Siliziumarbeit, zwei finanzierte Bauteile

**[DRAFT / FORSCHUNG · 08.11.2026]** Forschungsnachfolger von [#251 C1c-2](https://github.com/tobiasfranziskus/Check/pull/251), darunter #250/#249/#247/#246. **Kein** freigegebenes Modell C und keine Produktintegration. Änderung an `index.html` **nur in diesem Forschungsbranch**, nicht in `main` und nicht auf GitHub Pages; produktive Saves unberührt.

## Forschungsänderung im gemeinsamen Core

Die bestehende Funktion `m_core_w5b.foerdern` akzeptiert optional `w5b.silikonMinutenJeEinheit`. Ohne Parameter bleiben alte R32-/W5b-Regeln exakt bei **1 Minute je Silizium**. Das isolierte Profil `aphros-research:C1c-3:paid-silicon-cadence-v1` / **Regel 3305** stellt **10 Minuten je Silizium** und weiterhin 10 ISK Arbeitskosten je Einheit ein. Die Original-Funktion reserviert vor Beginn sämtliche Lohnkosten, zahlt pro Minute 1 ISK aus der Arbeits-Treuhand und schreibt ein Silizium erst nach der **10. bezahlten Minute** in Frachtraum, Warenledger und Station. Die Zahlung der 24 ISK vorhandenen Käufer-ISK an den fördernden Eigentümer erfolgt nur nach dem tatsächlich fertiggestellten und gelagerten Stück.

Der Original-W5b-Audit wurde deshalb auf laufende, noch nicht fertiggestellte Teilminuten angepasst: `siliziumAuftrag.gearbeitet`, vorhandene Siliziumstücke, verkaufte Einheiten, eigene reservierte Kaufgelder und bezahlte Minuten müssen in jedem Zwischentick zusammenpassen. Der zulässige **0-Silizium-Frachtraum** während aktiver bezahlter Arbeit wird anerkannt; ein fehlender, fremder oder falsch zugeordneter Miner bleibt ungültig. Der Forschungsadapter verwendet den neu berechneten kryptografisch geprüften `index.html`-Quellhash. Keine weitere kopierte Core-Auditfunktion und kein separater Forschungsförderautomat.

## Durchgehend finanzierte Warenkette

| Welt-Tick | Tatsächlicher Vorgang |
| --- | --- |
| 0–60 | Bezahlter House-Erzabbau, reale vorhandene Erzabnahme; unverändertes R32-Erztempo, **nicht** Modell C |
| 60–120 | W3-Erzfracht mit vorfinanziertem Hin- und Rückweg |
| 120–130 | W4 verarbeitet zehn bezahlte Erz zu vier Material |
| 120–180 | Rückfracht wirklich abgewickelt und bezahlt |
| 181–190 | House-Miner in Nadir: zehn vorfinanzierte/minutenweise bezahlte Siliziumminuten → erstes Silizium |
| 191–198 | Vorab bezahlte 8 Minuten W5b-Produktion: `2 Material + 1 Silizium → 1 Bauteil` |
| 199–208 | Erneut zehn vorfinanzierte/minutenweise bezahlte Siliziumminuten → zweites Silizium |
| 209–216 | Zweites vorab bezahltes achtminütiges Bauteillos; insgesamt **2 Bauteile** aus 4 Material und 2 Silizium |

Kein Anfangsbestand von Material, Silizium oder Bauteilen wird als Produktion ausgegeben. Ein zweiter House-Miner wird vor der Nadir-Förderung aus einer vorhandenen echten Hülle bezahlt. Silizium-Arbeit kostet 20 ISK für 20 wirklich gearbeitete Minuten; beide Bauteilchargen verwenden **2 × (2 × 48 Materialpreis + 1 × 24 Siliziumpreis + 8 Fertigungslohn) = 256 ISK** im bestehenden Vorprodukt-/Arbeitsabrechnungspfad. Diese 256 ISK sind Zahlungen/Umbuchungen aus vorhandenen Firmenkassen, kein Außenumsatz und kein gesamter Vollkostenpreis über Erz-/Fracht-/Minerabschreibung hinweg.

## Wirklich ausgeführte Tests

Gezielter GitHub-CI-Lauf [#42472193374](https://github.com/tobiasfranziskus/Check/actions/runs/42472193374) **erfolgreich** auf Forschungs-Code-Stand `f2bd57e`:
- C1b-1: 8/8; C1b-2: 6/6; C1c-1: 5/5; C1c-2: 5/5; C1c-3: 6/6; zusammen **30/30**, 0 Fehler und 0 Skips im gezielten Job.
- Seed 42: Tick216, Hash `b7221950ee2aee44`, 2 Silizium / 20 ISK Förderlohn, 2 Bauteile / 16 ISK Fabriklohn, 0 Mint.
- Seed 7: Tick216, Hash `2f82286a7775c707`, dieselben Mengen und Löhne, 0 Mint.
- Beide Seeds: unabhängige minuteweise Geld-/Waren-/Eigentums-/Core-Audits, Save/Load für unfertige Siliziumarbeit, deterministische Wiederholung, Negativproben gegen vorzeitige Ware, falsch erhöhte Arbeitszeit, Treuhand-, Herkunfts-, Kassen- und Mintbelege.
- Die **erste** CI auf diesem PR fand einen echten Auditfehler bei noch leerem Silizium-Frachtraum (0 Stück trotz laufender Arbeit). Nach überprüfter, kleinster Korrektur im Original-Audit ist die oben benannte neue gezielte CI grün. Den gescheiterten Erstlauf nicht als bestanden zählen.

Die vollständige GitHub-Regression auf dem endgültigen Code-Commit ist **getrennt** zu bewerten; zum Berichtsschreiben lag noch kein abgeschlossenes Gesamtergebnis vor. Reine Node-/GitHub-Prüfungen sind keine iPad-Safari-/NAS-Abnahme.

## Noch fehlende Belege

- **Noch kein Lagerprodukt:** Vorhandene zwei Bauteile werden nicht heimlich als verkauft oder exportiert verbucht. `r_lager: 2 Bauteile → 1 Lager / 12 Minuten` ist in diesem Forschungsprofil noch nicht als vorfinanzierter Core-Auftrag aktiv.
- **Noch keine Endabnahme oder Emission:** Kein zahlungsfähiger Lagermodulkäufer, kein Meridian-Waren-/Frachtvertrag, keine übertragbaren Exportrechte und keine positiven Tests für einmalige Auszahlung/30-Tage-Vortrag/365-Tage-Deckel.
- Die alte Erzförderung ist weiterhin 1 Erz pro Minute für 2 ISK statt des vorgeschlagenen C-Tempos von 4 bezahlten Minuten pro Erz. Alle Vollkostenpreise und Bruchteile sind weiter zu auditieren. Die Bauteil-Verkaufspreisannahme **170 ISK** aus #245 ist noch keine tatsächlich erzielte Abnahme.
- Die Silizium-Arbeitszahlungen gehen im bestehenden W5b-Pfad an dessen Arbeitsfonds; die separate W5s-Lohnweiterleitung für W3-/W4-Arbeit ist dadurch **nicht** automatisch ein Beweis, dass diese zusätzlichen Silizium- oder Bauteilarbeiterlohnanteile beim Wasserhaushalt ankommen. Spätere Lohnbelege müssen dies eigens nachweisen.

**Empfohlener nächster Schritt C1c-4:** Das vorhandene `r_lager` exakt in einen einzelnen **bezahlten** W5b-Produktionsauftrag mit `2 Bauteilen + 12 vorfinanzierten Minuten → 1 Lager` integrieren und unabhängig auditieren. Ein realer Lagermodul-**Verkauf** und Meridian-Export sind darauf aufbauende, weiterhin separat zu testende Vorgänge. Keine Gratisware, keine zweite Produktionsebene, kein Merge oder Deployment ohne Freigabe.
