# W5s-d – physisch und vollständig finanziert gebauter Ersatz-Miner

**[DRAFT / ANALYSE · 06.11.2026]** [PR #206](https://github.com/tobiasfranziskus/Check/pull/206) gestapelt auf W5s-c #205 → W5s-b #204 → W5s-a #202 → W5r #200. Ausschließlich freiwillige, nicht als Produkt freigegebene R32-Forschungsoption `w5s.minerIndustry`. `main` bleibt v0.12.5, Regel 14, Schema 8. Keine neuen Weltgelder, keine neue wirtschaftliche Parallelengine, kein Merge/Deployment.

## Echtes Ende-zu-Ende-Rezept

1. Der Hauskonzern kauft einen zusätzlichen Miner **für echte 600 ISK**, fördert **50 Erz** aus eigener Finanzierung, verkauft die Erzware an den real zahlenden Großhändler. Der wirklich gekaufte erste Speditionsfrachter bringt sie auf einer vollständig vorfinanzierten W3-Hin-/Rückfahrt nach Nadir.
2. Die vorhandene W4-Raffinerie verbraucht **10 gelieferte Erz** und nach **20 bezahlten Arbeitsminuten** entstehen **5 physische Material**.
3. In Nadir ist der einzige Miner-Werftlagerplatz zunächst durch eine endliche Starterhülle belegt. Diese wird **nicht ausgebucht oder weggezaubert**, sondern im Vertikalschnitt regulär von `house` für **600 ISK** gekauft. Erst der dann freie Platz erlaubt eine neue Minerproduktion.
4. Dieselbe vorhandene W5-Werft, die bisher Frachter baut, kann unter dem Forschungsprofil `stationBuildMiner` aus **5 vorhandenem Material** für **500 ISK Materialeinkauf** plus **30 ISK vollständige Arbeits-Treuhand** binnen 30 realen Core-Minuten **genau einen Miner** herstellen. Kein neuer W5-Werftkern. Die Werft investiert 530 ISK.
5. `npc3` als tatsächlicher R32-Miner-Eigentümer erwirbt die fertig gebaute Hülle für **600 ISK** mit dem validierten `shipBuy` in **Nadir**. Eigentümer, Schiff-ID, Lagerabfluss, Ledger, Werftverkauf und Kaufrechnung sind auditierbar.
6. Die vorhandene W5s-b-Überführung nimmt jetzt neben Frachtern auch **belegbar erworbene Miner** auf, reserviert vorher **60 ISK Pilotengehalt** aus der tatsächlichen NPC-Eigentümerkasse, zahlt dann pro Reise-Core-Minute 1 ISK aus und bringt das Schiff erst bei echter Ankunft nach **Aldera**. 0 Treibstoff.
7. Nach dem realen Verlust des ursprünglichen 15-Tage-R32-Miners kann die bereits **gekaufte und real überführte** Hülle ohne zweiten Kauf als aktiver R32-Miner zugeordnet werden. Sie erhält den originalen validierten `shipMine(eis)`-Befehl.

**Kostenbetrachtung für den Forschungs-Versuch:** Kosten der neuen Minerhülle bei der Werft **530 ISK**, Verkaufserlös **600 ISK** (vor weiteren Werft-/Stationskosten); Eigentümer bezahlt **600 ISK Kaufpreis + 60 ISK Überführung**. Der wirtschaftliche Nettovorteil über die Lebensdauer ist damit **nicht automatisch bewiesen**. Das 15-Tage-Verschleißintervall und diese Rezept-/Preisübernahme sind ausdrücklich nicht freigegebenes Balancing.

## Belege und Audit-Schutz

- W5 verwendet dasselbe Werftbuch `w5` für Materialverbrauch, Lohn-Treuhand und Ware; Miner-Fertig-/Verkaufscounter sowie aktive/ehemalige Miner-Schiff-IDs werden separat dem realen W5-Buch zugeordnet. In der gesamten Geld- und Warenbilanz bleiben bestehende Frachterbelege gültig.
- W5s-Überführungsbuch behandelt tatsächlich pilotbezahlte Miner- und Frachterflüge in derselben Core-Uhr mit unterschiedlichen Auftragseigentümern. Gebundenes Pilotengeld kann weder unbezahlt noch doppelt als Lohn verwendet werden; die Speditionsprüfung betrachtet ausschließlich die **selbst** finanzierten Frachterflüge.
- W1-Vollkosten-Audit zählt Miner-Überführungskosten als echte Reiseausgabe, **nicht als Erzförderarbeit**. Kein zusätzlicher Förderlohn oder fiktive Restvermögen.
- R32 `assignments` belegt bereits vorhandene Käufe und tatsächliche Ankunftszeiten statt einen zweiten `shipBuy` auszulösen. Dieselbe Hülle kann nicht zweimal Ersatz sein. Die ursprünglichen R32-Routinen zu bezahltem Erz-/Eis-/Wassertransport bleiben unverändert.
- Der neue Befehl ist ohne `w5s.minerIndustry` gesperrt, das Speicherschema bleibt 8. Der Audit muss auch nach Save/Load ohne flüchtige Forschungsflag-Werte eindeutig sein.

## Prüfungen

- **[TEST]** Seed42/7: echte Erz-, Material-, Werft-, Miner-Kauf- und 60-Minuten-Überführungskette; nach Verlust Übernahme von `sh005` statt `sh001`, `w5r.miner.bought=0` und tatsächlich erneut Eis abgebaut. Gezielter W5s-d Node22-Test **1/1 grün** auf Head `70d3f8ad`, CI [#42174240898](https://github.com/tobiasfranziskus/Check/actions/runs/42174240898).
- Zusätzliche Ablehnungsprüfungen für fehlende Rohstoffe/fremde Eigentümer/fehlendes Forschungsprofil, 13×90 tägliche Weltgeld-/Warenaudits sowie 2×365 Langzeitläufe sind seitdem im Test ergänzt; **deren Ergebnis muss am jeweils aktuellen Head separat geprüft werden**.
- Historische W5s-a/-b/-c- und Gesamt-Node-Regressionen sowie gespeicherte R32-Hashes dürfen durch das nichtaktivierte Profil nicht verändert werden.
- **Nicht geprüft und nicht behauptet:** Automatisch dauerhaft produzierende Miner-Werft, echte Kapitaldeckung sämtlicher Folgekäufe, vollständiger gleichzeitiger Kaltstart ohne ersten `oreFirst`-Diagnoseaufbau, krisenfeste 13×90-W6-Wirtschaft, Browser/iPad Safari/NAS.

## Offenes W5s-e-/W6-Gate

Die nachgefragte Ersatzhülle kann nun *manuell* aus realen Zutaten gebaut werden. Ein kompletter, wiederholbarer Kreislauf benötigt als eigene kleine Stufe:
- automatischen Werftauftrag nur bei tatsächlich freien Lagerplätzen, Material, vollständiger Vorfinanzierung und zahlungsfähigem Schiffskäufer;
- endlichen Nadir-/Aldera-Startbestand nicht automatisch auffüllen; reale Herstellung, Kauf und Überführung je Schiffs-ID;
- parallel bediente Erz- und Eisrouten, auch wenn der einzige Eigentümerkonzern spart/ausfällt;
- erneutes echtes Erz-/Material-Angebot über viele Produktionszyklen, kein fiktiver Auftrags- oder ISK-Zufluss;
- Ertrags-/Kapitalbilanz, Gegenfälle, Save/Load und unabhängige 13×90-/365-Welten unter expliziten, nicht ungeprüft übernommenden Preis-/Verschleißregeln.

**Keine Roadmap- oder Projektstatus-Duplikate erzeugen.** Verbindliche Roadmap bleibt `docs/ROADMAP.md`, aktuelle belegte technische Wahrheit `docs/PROJEKTSTATUS.md`. Diese Forschungsnotiz ist kein Ersatz. 
