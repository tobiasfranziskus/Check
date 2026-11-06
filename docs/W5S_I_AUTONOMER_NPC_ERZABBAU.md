# W5s-i – bezahlter autonomer NPC-Erzstart

**[DRAFT / ANALYSE – 06.11.2026]** [PR #212](https://github.com/tobiasfranziskus/Check/pull/212) auf #211, #210 und dem bestehenden W5s-Forschungsstack. Unverändert: `main`, Produktregel14/Schema8, Legacy-UI #207, bestehende Saves. Kein Merge, kein Deployment, keine ISK-Emission.

## Engpass vor W5s-i

Die zuvor grünen W5s-f/g/h-Versuche brauchten immer noch den **manuellen** Spielerschritt `shipBuy(house, miner)` und `shipMine(house, erz)`. Der originale NPC-Starterminer `sh001` dient im R32-Weltstart dem Eisabbau. Er durfte nicht automatisch und kostenlos Erz abbauen. Gleichzeitige Eis- und Erzarbeit benötigt eine weitere wirklich gekaufte Hülle.

## Minimaler neuer Kernpfad

Das optionale **Forschungsflag** `w5s.autoNpcOre` erlaubt ausschließlich einem vorfinanzierten NPC-Bergbaukonzern, einen zweiten realen Miner in Aldera zu kaufen. Ohne Flag verändert sich die Startwelt nicht. Ein reiner lesender Status `m_core_index.w5sNpcErzStatus(state,rules)` prüft:

- bestehender NPC-Eisminer bleibt gebunden und unangetastet;
- tatsächlich vorhandener und verkäuflicher Miner im Aldera-Startlager (keine kostenlose Schiffsschöpfung);
- NPC-Eigenkapital deckt **600 ISK Miner-Kauf plus vollständig bezahlbare W2-Erstförderung**;
- die **einzigen bestehenden** W2-Belege für echten Stationskauf, Endabnehmeretat, freies physisches Lager, Arbeitskapital und 50-Erz-Auftragsgröße erlauben die Arbeit;
- eigener NPC-Erzminer bereits vorhanden: keinen zweiten per Automatik kaufen; kein Umwidmen von Eis-/Spielerhüllen;
- keine nachträglich aufgefüllten Käufer- oder Stationsfonds, keine erzwungenen Spieler-Käufe.

Das Modell gibt nur `shipBuy(npc3, miner)` oder `shipMine(npc3, erz)` an den **vorhandenen validierenden Core** weiter. W2-NPC-Autopilot und W1-Erzförderung verwenden dieselbe Core-Uhr. Großhändler und W3-Frachter zahlen unverändert reale Kauf-, Waren- und Arbeitsmittel. W4-/W5-/W5s-Werft, W5s-g-Bestelltreuhand und W5s-h-Gewinnrücklage sind **unverändert wiederverwendet**. Maximal ein neuer Autodispatch pro Core-Stunde; keine versteckte Reserve.

## Belegter erster Durchlauf

**[TEST – [ursprüngliche W5s-i-CI #42191909355](https://github.com/tobiasfranziskus/Check/actions/runs/42191909355)]** Seed42 und Seed7 je drei Tage ohne **irgendeinen** Spielerbefehl: in jeder Welt 225 Erz aus wirklich vorfinanzierten NPC-Miningminuten, 100 Erz vom vorhandenen Großhändler aus wirklicher Kasse angekauft, 50 Erz regulär über W3 nach Nadir geliefert und genau eine vorhandene zusätzliche NPC-Minerschiffhülle am Aldera-Markt bezahlt. 140 Wasser verbraucht, 0 ISK neu geschöpft oder verbrannt. Gleiche W1-/W3-Waren- und Weltgeld-Bilanzen, Save/Load.

**[ANALYSE]** Die erste W5-Werftcharge wurde tatsächlich als **Frachter** gebaut, über einen realen 810-ISK-W5s-g-Vertrag gekauft und 60 Minuten bezahlt von Nadir nach Aldera überführt (dokumentierter Werkbeleg `sh004`). Die Nadir-Starterminerware belegt weiterhin den einzigen Miner-Lagerplatz; deshalb **kein kostenloser zweiter Miner** aus W5, kein Stillschweigen beim Engpass. Die erste erweiterte CI beanstandete irrtümlich den Frachterverkauf, weil ein **optionaler Miner-Verkaufscounter fehlt**, sodass ein Testausdruck `verkauft+undefined` zu `NaN` wurde. Diese Testauswertung ist korrigiert; die realen Werft-/Kauf-/Transferbelege waren von Anfang an gültig. Die korrigierte Langzeit-CI wird separat anhand ihres Heads verifiziert.

## Feste Qualitäts-Gates und offene Stufen

`tests/w5s-i-autonomer-npc-bergbaustart.test.mjs` prüft bei jeder ausgeführten Stufe:
- unabhängige Summe aller Konten gegen 33.000 ISK Startkapital, kein Minting/Burning;
- alle physischen Waren gegen den originalen Goods-Ledger;
- vollständigen Core-Gesamtaudit, Save/Load und Seed-Replays;
- **0** Spieler-Schiffskäufe und **0** manuelle Spieler-Bergbaubefehle;
- gelieferte physische W3-Erzcharge und anschließenden tatsächlichen W5-Bau, Zahlung und Flug.

Nach dem kurzen ersten Durchlauf: geplante/angelegte **13 feste Seeds ×90 Tage, Seeds 42/7 doppelt** und **2 ×365 Tage**; nur durch tatsächlich grüne letzte CI als bestanden melden. Alte v10–v14-/Geografie-/W5s-a–h-Gates separat prüfen.

**Grenzen:** Der Bestand einer endlichen Nadir-Starterminerhülle blockiert weiterhin ein weiteres Miner-Werftlagerfach. Ohne einen wirklich zahlenden Abnehmer wird dieser Bestand nicht ausgebucht. Vollständig aus eigener Kraft reproduzierbare W5-Miner-Folgeproduktion ist daher **nicht** nachgewiesen. Auch wiederholt zahlungsfähige W3-Käufer, Transportflotten, NPC-Insolvenzen, unterschiedliche Spielerhandlungen und die 13×90d-W6-Gesamtökonomie bleiben ungeklärt. Die Versuchswerft benutzt den expliziten `autoLeadDays:30`-Forschungsvorlauf und noch nicht freigegebene 15-/30-Tage-Verschleißwerte.

Die verbindliche Roadmap ist ausschließlich `docs/ROADMAP.md` und der technische Projektstatus `docs/PROJEKTSTATUS.md`. Diese Forschungsakte ersetzt beide nicht.

## Erweiterte Abnahme und Ergebnis nach dem behobenen Testzähler-Fehler

**[TEST] [GitHub-CI #42192439530](https://github.com/tobiasfranziskus/Check/actions/runs/42192439530), Test-Head `78b57b08`: 4/4 Testgruppen grün, 0 Fehler.** Seeds42/7 je 3 Tage vollständiger NPC-Erz→bezahlter W3-Transport→echter W4-/W5-Frachter→660/810-ISK-Vorvertrag→Original-Core-Kauf→bezahlte 60-Minuten-Überführung. Keine Spieler-Schiffskäufe oder -Miningaufträge. Negativtest mit deaktiviertem Forschungsflag erzeugt keinen NPC-Erzminer.

**[TEST]** **13 feste Seeds ×90 Tage**, bei Seeds42 und 7 zusätzlich identische deterministische Doppelreplays, täglich unabhängige Geld-/Waren-Audits und Save/Load an Stichtagen; **2 ×365 Tage** mit denselben Audits. Jede 90-Tage-Welt: **275 Erz** real gefördert, **100 Erz** angekauft, **50 Erz** einmal vollfinanziert nach Nadir geliefert, **2 Werft-Frachter hergestellt, bezahlt verkauft und überführt**, **950 Wasser verbraucht**, **0 ISK-Mint/Burn**. Die 365-Tage-Proben enden bei denselben Mengen; **kein langfristiger Wiederanlauf**. Beispielhash Seed42 90d `e765d1a8b16fc739`, Seed7 90d `f11db6bd66cda3a3`; Seed42 365d `7d4be0b61c77300a`, Seed7 `20c6609e491e1195`.

**[ANALYSE – nicht als W6-Erfolg bewerten]** Trotz vorhandener **2.000 ISK** beim NPC-Bergbaukonzern ist seine ursprüngliche aktive R32-Eis-Hülle später verloren. Das endliche Nadir-Starterminer-Lagerfach bleibt mit **einem Miner** belegt und verhindert reale neue Minerwerftproduktion, solange kein zahlender Käufer es freimacht. Die Spedition hat nach den tatsächlich bezahlten Ersatzfrachterkäufen **0 ISK**. Sie kann die nächste 810-ISK-Vorbestellung nicht finanzieren; die eigens geförderte und vom Großhändler bereits gekaufte Folgeerzladung wird deshalb nicht erneut nach Nadir geflogen. Der Stopp ist gewollt bilanzerhaltend, **kein** versteckter Rettungsmechanismus.

Die wirtschaftlichen Messwerte sind bei diesen 13 einfachen R32-Forschungswelten gleich, obwohl die deterministischen Hashes unterschiedlich sind; das ist **keine** Freigabe für abweichendes Spieler-Sparen, konkurrierende Gesellschaften oder eine langfristig selbsttragende W6-Wirtschaft.

**Nächster eigenständiger Nachweis:** Endlicher vorhandener Miner-Bestand in Nadir muss einen echten wirtschaftlichen Verwendungszweck und kaufkräftigen Abnehmer erhalten, bevor die neue Werft wieder Miner bauen kann. Seine Lagerbuchung darf nicht durch eine Gratisverschiebung aufgelöst werden. Danach braucht die Spedition erneut tatsächlich finanzierte Frachter- und Arbeitsmittel sowie echte wiederkehrende Erz-/Endnachfrage. Keine Produktregel-/Emissionsentscheidung ohne Freigabe.

**CI-Hinweis:** Die letzte reine Dokumentations-Head-CI `5437e70f` ist unabhängig vom hier verifizierten Test-Head nach Abschluss zu prüfen.
