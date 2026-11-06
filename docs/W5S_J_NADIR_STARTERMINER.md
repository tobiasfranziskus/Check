# W5s-j – endlichen Nadir-Starterminer echt verkaufen, überführen und ersetzen

**[DRAFT / ANALYSE · 06.11.2026]** [Draft-PR #213](https://github.com/tobiasfranziskus/Check/pull/213), auf W5s-i #212 gestapelt. Kein `main`-Merge, keine Deployments, keine Produktregel-/Schemaänderung, keine Verschiebung oder Löschung von Alt-Spielständen. Bestehende Legacy-UI-Drafts (#207 u. a.) unverändert. Alle neuen Funktionen nur unter `rules.w5s.autoStarterMiner` im R32-Forschungsprofil.

## Befund und gelöster physischer Blocker

Im echten R32-NPC-Start hatte Nadir **einen endlichen Miner im Fertiglager**. Der automatische W5-Werftkern kann dort wegen genau **eines Miner-Lagerplatzes** keine neue Minerhülle bauen. Den Bestand als W5-Neuproduktion zu deklarieren, künstlich zu löschen oder in eine Eigentümerkasse umzubuchen wäre unzulässig.

W5s-j benutzt für diese **bereits existierende** Hülle den Original-Core-Befehl `shipBuy`:

1. Beim ersten nachgewiesenen Ersatzbedarf (durch denselben R32-Verschleiß und experimentell hochgesetzten `autoLeadDays:30`) prüft `starterCheck` den vorhandenen **nicht aus W5 stammenden** Lagerbestand, tatsächlichen Eigentümer und vorhandene NPC3-Kasse. Der Kauf erfordert **600 ISK Hülle + 60 ISK vollständig finanzierbaren Überführungslohn**. Aus dem Nadir-Lager wird genau 1 Miner verkauft; die ursprüngliche Werft erhält 600 ISK aus dem realen Kaufkonto, während die Warenbilanz exakt 1 physisches Schiff anlegt. **0 neue ISK.**
2. **Einmaliger Herkunftsbeleg** `s.w5s.starterMiner`: Schiff-ID, echter Käufer, Kauf-Tick und originärer Preis; `w5.minerFertig` und `w5.minerVerkauft` bleiben beim **Starterverkauf unverändert**. Erst echte spätere W5-Produktionen erhöhen beide Zähler. Das Anfangslager wird unabhängig gegen `anfänglicher Nadir-Miner + W5-Produktion − W5-Verkäufe − 1 tatsächlich verkaufter Starter` auditiert.
3. Der bereits vorhandene `shipReposition`-Core reserviert 60 ISK aus `npc3` vor Reisebeginn, zahlt jede der **60 echten Core-Minuten** über die einzige vorhandene Pilotentreuhand aus und bestätigt nur nach wirklicher Ankunft den Abschluss. Die fremde W3-Erzfracht und W5s-Frachterarbeit laufen weiter im selben Simulationskern.
4. Der im Nadir-Startbestand gekaufte Miner bleibt bis zur tatsächlichen R32-Übernahme frei von W2-Erzautopilot, W5o-Eisautopilot und dem neuen NPC-Erz-Zweitminer-Autopiloten. Nach Verschleiß der bisherigen, real finanzierten Eis-Hülle wird der Starter-Miner `sh004` nach gültigem Ankunftsbeleg **ohne zweiten Schiffskauf** als R32-Eisminer zugeordnet und erhält `shipMine(eis)` über den original validierten Core.
5. Die neue, vollständig bezahlte W5-Minerproduktion erhält dadurch tatsächlich wieder **einen freien Lagerplatz**. Die Automatikkette W2→W3→W4→W5 baut anschließend bei belegtem Material, realen Werftmitteln und verbindlich hinterlegtem Käuferetat neue Miner.

Ein gültig gekaufter/überführter Startminer bleibt **nach Save/Load ohne das flüchtige Forschungsflag auditierbar**. Nur der **Neukauf** erfordert das Flag. Die Herkunfts-, W5s-Flug- und R32-Flottenaudits akzeptieren ausschließlich denselben belegten Schiffsausweis, keine kostenlosen Ersatz-IDs. Vollständige Geld-/Warenprüfung und Save/Load erkennen manipulierte Kaufpreise, wiederholten Starterkauf und doppelte Zuweisungen.

## Ausgeführte CI und kontrollierte Gegenproben

**[TEST] [W5s-j-GitHub-Actions #42195252285](https://github.com/tobiasfranziskus/Check/actions/runs/42195252285)** auf Code-Head `9badc215`: **5/5 Testgruppen bestanden, 0 Fehler**, inklusive:

- Seeds42/7: Kauf, 60 bezahlte Flugminuten, Herkunftsevidenz, Zwischensave, Manipulations-/Doppelkauf-Gegenprobe, eindeutige R32-Zuordnung an/ab Tag 15.
- **13 feste Seeds ×90 Spieltage** mit täglichem vollständigem Core-Audit, unabhängiger Eigentümerkassen-/Weltgeld-/Warenbilanz, Save/Load und deterministischen Seed42/7-Doppelreplays.
- Seed42/7 jeweils **365 Spieltage** mit denselben Audits.
- Seed42/7 als **kontrollierter 90-Tage-Vergleich**: exakt gleiche Welt und Regeln mit `autoStarterMiner` AUS versus EIN. Beiden Varianten wurde **kein** Spieler-Erzauftrag erteilt, keine ISK neu geschaffen. Ohne Option bleibt 1 Miner im Nadir-Lager; mit Option wird er echt erworben und der Lagerplatz frei.

| Gemessene 90-Tage-Größe | W5s-i ohne Starterkauf | W5s-j mit Starterkauf |
| --- | ---: | ---: |
| Selbstständig neu gebaute Miner | 0 | **2** |
| Selbstständig neu gebaute Frachter | 2 | **2** |
| Verkäufe neuer W5-Hüllen | 2 | **4** |
| R32-Eisfracht-Abschlüsse | 19 | **21** |
| Tatsächlich verbrauchtes/bezahltes Wasser | 950 | **1.050** |
| Bei Nadir im Lager verbleibende Starterminer | 1 | **0** |
| NPC-Minerkasse Tag90 | 2.000 ISK | **450 ISK** |
| Speditionskasse Tag90 | 0 ISK | **0 ISK** |
| Neue ISK / unbelegter Gratisersatz | **0 / 0** | **0 / 0** |

Die **+100 Wasser** entsprechen **+10,5 %** gegenüber demselben autonomen W5s-i-Kaltstart. Die Verbesserung wird von der tatsächlichen Verbuchung weiterer Miner-/Frachterverluste und Wiederbeschaffungen begleitet. 13 verschiedene Seeds haben in dieser vereinfachten R32-Forschungswelt **identische Mengenwerte**, aber reproduzierbare verschiedene Hashes; das ist **keine** Behauptung unabhängiger 13 volkswirtschaftlicher Konstellationen.

**[NEGATIV]** Auch mit der verbesserten Lagerfreigabe endet der Kreislauf in den 365-Tage-Gegenproben bei 1.050 Wasser, 21 Eisfahrten, 2 produzierten Minern und 2 Frachtern. `npc3` besitzt 450 ISK, `transport` **0 ISK**. Es fehlen Käufer-/Transportkassen und wiederkehrende reale Endnachfrage. Kein selbsttragender 365-Tage-Wiederanlauf, keine Produktfreigabe.

Die historischen W5s-a–i- und v10–v14-/Geografie-Referenzprüfungen laufen auf demselben Head separat; sie dürfen erst nach tatsächlich erfolgreichem Abschluss als bestanden gelten.

## Folgerung – nächster kleiner Schritt

W5s-k sollte **nicht** weitere Lagerstücke erfinden. Prüfe stattdessen die tatsächlich ausgewiesenen **ISK-Erlöse und Wiederbeschaffungskosten der Spedition**, die W3-Kaufetats und die Endkunden-Nachfrage, bevor automatische Flottenexpansion erfolgt. Ziel: Mehrere aufeinanderfolgende 50-Erz-Frachten mit wirklich bezahlter Eis- und Erzlogistik, ein echter zusätzlicher Ersatzzyklus und ein unabhängiger Kapital-/Waren-Audit **ohne individuelle Rettung**. Eine denkbare Preisanpassung oder neue Geldmodell-B-Emission erfordert gesonderte Produktfreigabe.

`docs/ROADMAP.md` ist die einzige verbindliche Planung und `docs/PROJEKTSTATUS.md` die belegte technische Hauptversion; diese isolierte Forschungsakte ist keine zweite Roadmap. iPad-Safari-/NAS-Abnahme bleibt offen.
