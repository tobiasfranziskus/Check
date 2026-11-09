# C1d-11 – Echte W3-Folgefracht und Kapitalkosten des Nadir-Lagerausbaus

**[DRAFT / FORSCHUNG und ANALYSE · 09.11.2026]** Technisch auf [#264 C1d-10](https://github.com/tobiasfranziskus/Check/pull/264) aufgebaut. Einziges Forschungskernprofil bleibt **Regel 3314**; keine neuen ISK, Waren, Rezepte, Aufträge oder automatischen NPC-Käufe. `main`, produktive Spielstände, GitHub Pages, NAS und `docs/ROADMAP.md` bleiben unverändert.

## Frage und unabhängige Gegenprobe

C1d-10 belegt einen tatsächlich produzierten, bezahlten und eingebauten neunten Lagerartikel. Aber der damit erzielte Kapazitätsgewinn ist noch **kein nachgewiesener wirtschaftlicher Bedarf**. C1d-11 rechnet nicht bloß am Schreibtisch, sondern führt im **selben autoritativen Original-Core** eine weitere reale, finanziell gedeckte W3-Erzlieferung aus. Aus identischem gültigem Zustand (je Seeds 42/7) folgen zwei Varianten: Lagerkapital unangetastet, oder Kauf von genau einem 430-ISK-Modul vor der vierten W3-Fracht.

Der **dritte W3-Flug nach zwei historischen Meridian-Modul-Frachtaufträgen** und ein neu finanzierter vierter W3-Flug werden samt jeweils 60 Minuten Hin- und Rückweg tatsächlich mit dem Original-Core simuliert und in jedem Tick unabhängig auditiert. Das erforderliche Erz wird real gefördert und vom bisherigen Großhändler bezahlt. Kein manueller Waren- oder Geldstand wird in den Simulationszweigen hochgesetzt.

## Reproduzierbares finanziertes Ergebnis

Nach vollständig bezahlten ersten zwei W3-Lieferungen und den beiden vierfachen Meridian-Modulverkäufen wird das neunte Lagermodul aus Rest-Erz, Silizium, Teilen und Lohn hergestellt, **aber zunächst nicht gekauft**. Anschließend folgt eine dritte echte bezahlte W3-Erzfracht, deren Erz vollständig nach Nadir und deren Frachter vollständig nach Aldera zurückkehrt. Danach werden 50 neue, vom bisherigen Großhändler gehaltene Erz real gefördert und verkauft. Unmittelbar vor dem vierten W3-Auftrag, **Tick 1680**, sind beide Varianten noch derselbe Spielzustand:

| Original-Core-Messwert, Seeds 42 und 7 | Ohne Ausbau | Nach sofortigem 430-ISK-Einbau |
| --- | ---: | ---: |
| Nadir-Betriebskasse vor nächster Fracht | **1.118 ISK** | **688 ISK** |
| Finanzierungsbedarf W3-Erz + bezahlter Rundfracht | **740 ISK** | **740 ISK** |
| Vollständig kaufbereites Erz in Aldera | **50** | **50** |
| Erz im Nadir-Lager | **60** | **60** |
| Erz-Lagerobergrenze laut Original-Core | **625** | **937** |
| Überhang durch nächste 50 Erz | **keiner** | **keiner** |
| Rechtmäßig ausführbare vierte W3-Fracht | **ja** | **nein**, 52 ISK fehlen |
| Realer W3-Erzgesamttransport nach Verzweigung | **200 Erz** | **150 Erz** |
| Nadir-ISK nach dem vierten Rundflug bzw. Ablehnung | **378 ISK** | **688 ISK** |

Die 740 ISK bestehen aus **500 ISK wirklichem Erzkauf** und **240 ISK Frachtentgelt**. Die Spedition finanziert die **120 bezahlten Flugminuten** separat aus eigenem Kapital, statt diese aus einem fiktiven Zuschuss zu erhalten.

**Wichtige begriffliche Grenze:** Die Variante „mit Ausbau“ darf einen **freiwilligen** Modulbau aus ihrer vorhandenen Kasse vornehmen; die **automatische** NPC-Investition wäre mit denselben Daten wirtschaftlich nicht gerechtfertigt. Ein gebundener 430-ISK-Betrag lässt 688 ISK übrig und blockiert die nächste reale Erzlieferung. Daraus folgt **nicht**, dass das Modul nie wertvoll sein kann; es braucht aber eine tatsächlich anstehende größere Warenmenge, einen echten Engpass und die vollständig finanzierte Kette **nach** dem Kauf.

## Technische Integration – gelöster Bestandsfehler

- Nach dem ordnungsgemäßen **Abschluss** des zweiten Meridian-Modul-Rundflugs verlangte der bisherige C1d-Sekundärbeleg weiter, dass sein realer Frachter dauerhaft gedockt bleiben muss. Während eines späteren legalen W3-Auftrags war deshalb der historische Beleg temporär rot, obwohl die W3-Arbeit und Fracht vollständig bezahlt waren.
- **C1d-11 repariert ausschließlich den historischen zweiten C1d-Audit**: Wenn der 240-Minuten-Auftrag bereits vollständig abgegolten ist, darf sein Schiff nur dann erneut unterwegs sein, wenn der **originale W3-Core** denselben Frachter als aktuell gültig und bezahlt auditiert. Andernfalls bleibt die strenge Dock-/Treuhandprüfung bestehen.
- Gesonderte negative Fälle fälschen W3-Fracht-ID, Zuweisung, Treuhandgeld, Schiffseigentum, Erzmenge, den historischen Beleg und die bezahlten Pilotminuten. Kein pauschales Ignorieren von Schiffsbewegungen, kein zweiter Flugkern.
- Der Forschungsadapter stellt nur eine **lesende** `stationInvestmentQuote(state)` bereit, die `m_core_handel.obergrenze`, `m_core_w3.kalkulation` und `m_core_w3.pruefen` des gleichen Core verwendet. `justifiedAutomaticPurchase` ist bei dieser Testwelt `false`, nicht ein neuer aktiver NPC-Befehl. Kein neues Laufzeitpaket oder Browsercode.

## Tests und Freigabegrenzen

Neue Suite `tests/c1d-11-stationsinvestitionsgate.test.mjs`: zwei vollständig aus Start-Seed errechnete Welten, beide vollständigen W3-Rundflüge, Audits während der Fahrten, korrekte historische Belege, gefälschte Zahlungsfälle, konservierte Geldmenge 33.000 ISK, Save/Load während der Arbeit, Replay sowie der **zeitgleiche Investitions-Gegenversuch**. Im direkten isolierten Prüf-Harness wurden **6/6 neue Testgruppen** ausgeführt und bestanden. **Offizieller GitHub-CI- und vollständiger Regressionsstatus folgt getrennt**, erst nach deren tatsächlichem Abschluss als bestanden bezeichnen.

**[MAIN unverändert]** v0.12.5 / Regel14 / Schema8. Keine produktive Regelmigration, keine iPad-/NAS- oder Pages-Abnahme, kein Merge. Langfristige Nachfrage nach Modulen, echte Marge des Stationsbetreibers und die Reproduktion von Stationskapital bleiben offen. Der nächste nutzbare Produktfortschritt sollte *einen realen Engpass plus wiederkehrenden zahlenden Warenbedarf* mit finanzierter Industrieproduktion verbinden oder die geprüften Grundstufen für den ersten spielbaren UI-Test integrieren.
