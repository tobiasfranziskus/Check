# C1c-3 – zehn bezahlte Siliziumminuten und vollständig vorfinanziertes Lagermodul

**[DRAFT / FORSCHUNG · 08.11.2026]** Direkter Nachfolger von [C1c-2 / #251](https://github.com/tobiasfranziskus/Check/pull/251) im gestapelten #243-#251-Wirtschaftsforschungszweig. Die Vorlage aus [#245](https://github.com/tobiasfranziskus/Check/pull/245) ist weiterhin **[OPTION]**, kein beschlossenes Produktregelwerk. Die Änderung an `index.html` liegt **nur auf diesem Forschungsbranch**, nicht auf `main`; produktive Regel14-Saves, NAS, GitHub Pages und vorherige Referenzversionen bleiben unangetastet.

## Implementierung und genaue Buchungsfolge

**Ein einziger vorhandener Core** `m_core_w5b` verarbeitet Siliziumförderung und Warenfabrikation. Die Erweiterungen sind per unveränderlichem Regelprofil bedingt aktiviert; W5b-Forschung ohne Opt-in fördert wie zuvor 1 Silizium je Minute. Kein Node-only-Zweitsimulator.

| Produktionsschritt | Tatsächliche Leistung und Finanzierung | Ergebnis |
| --- | --- | --- |
| W1/W3/W4 | Bezahlt gefördertes Erz, echte W3-Hin-/Rückfracht, Raffinieren `10 Erz → 4 Material`, W4 zehn bezahlte Minuten | Vier Material in Nadir |
| W5b – Silizium | Ein wirklich gekaufter Nadir-Miner; zwei Silizium-Einheiten aus **20 separat bezahlten Simulationsminuten**, 1 ISK/Minute, 24 ISK reale vorfinanzierte Abnahme pro Einheit | Erst bei Minute 10/20 entsteht die erste/zweite Rohwareneinheit, vorher bleiben die geleisteten Minuten als Arbeitsfortschritt gespeichert |
| W5b – Bauteile | Vier Material × 48 ISK, zwei Silizium × 24 ISK und 16 vollständig reservierte Produktionsminuten zu 1 ISK/Minute | `4 Material + 2 Silizium → 2 Bauteile` in einem ausfinanzierten Los |
| W5b – Lager | Zwei Bauteile × 170 ISK sowie 12 vollständig vorfinanzierte Arbeitsminuten zu 1 ISK/Minute; keine Waren auf Anfangsbestand gesetzt | `2 Bauteile → 1 Lager` als reale, handelbare Ware in Nadir |

Die **C-Testpreise 170 ISK/Bauteil und 430 ISK/Lager sind keine genehmigten Produktpreise**. Die 430 ISK sind ein hypothetischer Folgeverkaufspreis; im Versuch wird **kein** Lager verkauft. Auch die 340 ISK beim Bau sind eine bestehende ISK-Umbuchung zwischen Hersteller und Station, kein Minting. Zum Gesamtkostenbegriff gehören zusätzlich alle vorausgehenden Förder-, Transport-, Wartungs-, Ersatz- und Geschäftskosten; keine Vollkostenrentabilität wird daraus behauptet.

## Core-Freigabeschranken und Prüfung

- Forschungsprofil `aphros-research:C1c-3:timed-silicon-storage-v1`, Regel **3305**, getrennte Save/Load-Identität und Regeln-Fingerprint; frühere 3301–3304 dürfen weder fremde Saves importieren noch die neue Anweisung `stationBuildStorage` ausführen.
- Das nur bei aktivem Profil mögliche `w5b.silikonMinutenJeEinheit=10` verlängert die bezahlte Arbeit und die gebundene Mittelreserve; Warenledger und Schiffsfracht steigen **nur an bezahlten Einheitengrenzen**. Teilfortschritt ist in `w5b.siliziumAuftrag.gearbeitet` gespeichert, nicht aus der Uhr geschätzt.
- `stationBuildStorage` nutzt unverändert die originale W5b-Start-/Arbeits-/Abschlussbuchung. Eingänge werden beim Start verbraucht, die zwölf Lohn-ISK komplett reserviert; Warenlager und Ledger entstehen erst nach Abschluss. Inaktive alte Profile kennen keine Lageranfertigung.
- Bestehende W3-/W4-/W5s-Lohnrückflüsse bleiben erhalten. Die W5b-Fabrikarbeitskasse ist bisher noch nicht dem privaten Wasserkundenhaushalt zugeteilt.
- Unabhängiger Forschungs-Audit plus nun explizit aufgerufener Original-`m_core_w5b.audit`, globaler Core-Geld-/Warenaudit, Save/Load, Replay und Negativtests gegen gefälschte Arbeit, Lager, Waren, Kassen und Emission.

## Auszuführende Regressionen / Ergebnisse

1. `node tests/c1c-3-silizium-lager.test.mjs` – zwei Seeds (42/7), minutengenaue negative und positive Silizium-/Bauteil-/Lagernachweise.
2. Alle bisherigen C1b-1, C1b-2, C1c-1 und C1c-2 Tests – keine Veränderung alter Profile durch optionale Core-Erweiterung.
3. `node --test tests/*.test.mjs` und die gebundenen GitHub-Workflows – getrennt bewerten, abgebrochene/übersprungene Läufe nicht als bestanden ausgeben.
4. iPad Safari/NAS: nicht durch Node oder Chromium belegt; vor Produktintegration gesondert abnehmen.

**Status bei Erstellung:** Die oben genannten Tests wurden in dieser Dokumentfassung noch nicht als bestanden eingetragen. Ergebnisse erst nach tatsächlich abgeschlossenen GitHub-Läufen übernehmen.

## Nächster echter Meilenstein

**C1d – positiver physischer Meridian-Endexport:** Ein extern bestelltes Lagermodul mit echter Eigentumskette, vollständig finanzierter Nadir–Meridian-Hin-/Rückfracht und eindeutiger Abnahme. Erst danach darf ein strikt begrenztes, einmaliges und auditiertes Forschungs-Minting nach noch unbeschlossenen Modell-C-Etatregeln getestet werden. Vor einer Produktregel müssen außerdem verifizierte Bruchteilsbuchung, echte Endkunden-Lohneinkommen und 30-/90-Tage-Simulationen folgen.

**Keine Merges, keine Deployments und keine Änderungen an produktiven Spielständen.**
