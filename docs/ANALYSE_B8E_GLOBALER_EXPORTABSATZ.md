# B8e – Realer Außenabsatz statt pauschaler Verbrauchsgeldschöpfung

**[ANALYSE/DRAFT] · 31.10.2026**, exakt auf `main 517728a958326e86751f09cd74d0c077edad9921` (v0.12.5 / Regel 14 / Schema 8). **Einzig verbindliche Roadmap:** [docs/ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md).

## Ausgangsbefund

[B8a #61](https://github.com/tobiasfranziskus/Check/pull/61) hat gezeigt: 20 ISK/Stunde allein für zivilen Istverbrauch erhöhen selbst in gesunder passiver Welt die Geldmenge um 43.200 ISK je90d und werden in der Spielerkrise ab Tag14 nicht mehr ausgelöst. [B8b–B8d #62–#64](https://github.com/tobiasfranziskus/Check/pull/64) haben den Spieler-Cash-Entzug, physisch verfügbare Rohstoffe, echte Käufercash-Barrieren und einen **einmalig aus echten Meridian-ISK finanzierten, aber nicht selbsttragenden** NPC3-Materialhandelszyklus nachgewiesen. Es ist weiterhin **keine** Modell-B-Emissionsregel beschlossen.

## Eng isolierte Hypothese

**Einzige getestete Modell-B-Option [ANALYSE]:** Bei einer vom unveränderten Core **tatsächlich ausgeführten** und im Original-Warenledger verbuchten **physischen Außenausfuhr** (`m_core_stunde.aussenhandel`, `d<0`) kann ein externer Käufer einen nach Warengrundwert proportionalen Exportpreis **als neue ISK an die exportierende Station** zahlen. Die Welt darf höchstens **20 ISK pro Stunde** empfangen und **2 ISK je wirklich ausgeführter Wareneinheit**; dies sind ausdrücklich **ungeprüfte Versuchswerte**, keine zu übernehmenden Produktpreise. Direkte, nicht durch physischen Export gedeckte Geldschöpfung ist untersagt.

**Globaler statt individueller Schalter:** Emission nur, wenn **die Summe aller Stationskassen weniger als ein Fünftel der ursprünglichen Weltgeldmenge** beträgt **und** der weltweit tatsächlich gedeckte zivile Stundenbedarf weniger als 50 % des Bedarfs an Nahrung/Medizin ist. Diese Aggregate sind **einheitliche Weltindikatoren**; die Regel liest keine Firma, Spieler- oder Stationsinsolvenz als Trigger. Export-Empfänger sind ausschließlich die ursprünglichen tatsächlichen Außenexportstationen – **keine bedürftigkeitsabhängig ausgewählte Station**, kein direkter Geldtransfer aus dem Spieler, kein NPC-Privatschiff.

**Wichtige Einschränkung:** Der vorhandene Original-Außenhandel erzeugt neben Warenexporten auch Original-*Importe* ohne Kassenbuchung. Der Beobachter kann die ursprüngliche Herkunft einer exportierten Wareneinheit **nicht** nachweisen, sondern nur die echten Core-Bestandsminderungen; Re-Export vorher importierter Ware und die Wahl eines tatsächlichen Herkunftsnachweises bleiben reale Exploit-Risiken. Positive CI allein berechtigt **nicht** zur Integration. Ebenso existiert noch keine Markteintritts-KI für neue Frachter oder Käufernachfrage-Garantie.

## Reproduzierbarer Vergleich

Vier Original-Seed42-**90-Tage**-Welten, jeweils mit unabhängigen deterministischen Doppel-Replays und stündlichen Geld-/Warenaudits sowie Save/Load und 67 Standardtests: historische aktive B1-`handel-flotte`-Spielerbefehle mit/ohne Exportbudget und passive Originalwelt mit/ohne Exportbudget. Die unveränderte aktive Original-90d-Endreferenz muss **`784047684dfe5c56`** bleiben. Probe mit Verbrauchsstunden, Exportmengen, echter Netto-ISK-Schöpfung, Stations-/Spielercash, Mangelstunden, Preis- und Produktionsfolge. Keine Änderung von `index.html`, Regeln, Save/Load, Goldenreferenzen, Spielermöglichkeiten oder Produktcode.

**Eine theoretische globale Bedarfsschwelle ist kein ökonomischer Heilbeweis.** Das Qualitätsgate verlangt gleichzeitig nachweislich neu auftretenden Außenabsatz, physisch erhaltene Rohstoffe, tragfähige reale Händler-/Käufer-Folgegeschäfte, keine unnötige Emission in gesunder Welt und selbständige wirtschaftliche Erholung *ohne* individuelle Konkursrettung. Die vier Simulationen sind lediglich eine erste, klar begrenzte Gegenprobe und ersetzen 13 Seeds ×90 Tage plus vier historische 365-Tage-Spielerkrisen nicht.

## [TEST] Ergebnis

Hier wird ausschließlich der tatsächlich abgeschlossene CI-Befund eingetragen.

**Freigabe:** Analyse/Draft, nicht integrieren oder deployen, keine iPad-/NAS-Abnahme.
