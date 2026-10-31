# B8g – Zwei leistungsgebundene Welt-Beschaffungsaufträge mit echter Core-Abnahme

**[ANALYSE/DRAFT] · 31.10.2026.** Originalbasis ausschließlich `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5/Regel14/Schema8. Einzige verbindliche Roadmap: [docs/ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md). **Dies ist kein neues Produktfeature.**

## Problem und überprüfbare Hypothese

B8d [#64](https://github.com/tobiasfranziskus/Check/pull/64) führte einen originalen realen NPC3-Frachter mit 7 Material nach Cyris: ohne Käuferfinanzierung **0/7 Verkauf**, nach einmaliger 403-ISK-Umbuchung aus neutraler Meridian-Kasse echter **7/7** Verkauf, drei weitere Medikamente; **zweiter 7er-Transport 0/7**. B8e [#65](https://github.com/tobiasfranziskus/Check/pull/65) zeigte die unzureichende physische Außenexportmenge; B8f [#66](https://github.com/tobiasfranziskus/Check/pull/66) belegte Ursprungsrisiken ursprünglich kostenlos importierter Waren sowie große historische *Brutto*-Geldtransfers ohne selbsttragenden Folgehandel.

**B8g isoliert die Wiederholbarkeit eines gedeckelten Welt-Beschaffungsbudgets für *physisch ausgeführte* Transporte**, nicht die Einführung einer beschlossenen Geldquelle. Es wird **kein Geld gemintet**: der neue einmalig begrenzte Analyseauftrag darf zusammen höchstens **900 ISK aus der bereits vorhandenen neutralen Meridian-Stationskasse** übertragen und **höchstens zwei echte Materiallieferungen à 7 Einheiten** finanzieren. Der Bedarf wird **vorab am Tag14 aus allen stationären Medikamenten-Rezepten mit fehlendem Material ermittelt, nicht nach Besitzer-, Insolvenz- oder Stations-Kassenstand**; der Reproduktionsfall ergibt `st_cyris`. Eine echte autonome NPC-Vergabe ist damit **nicht belegt**: es wird nur ein einzelnes, im Versuch freiwillig teilnehmendes NPC3-Schiff geskriptet.

## Konkreter Nachweis und Ausführungsgrenzen

Der Originalkern erwirbt für NPC3 eine tatsächliche Frachterhülle über `ersatzkauf` aus eigenem Konzernkapital, keine Gratisfrachter oder ungesicherten Pilotenbudgets. Das gleiche Schiff kauft durch **validierten `shipTrade`** echtes Material aus **Veldra** (kein Außenimport-System) und reist via **validierten `shipMove`** nach Cyris. Ein ausschließlich im Analyse-Runtime-Code eingeschobener Beobachter bescheinigt im echten Original-`ankunft`-Tick den im Kern bereits abgeschlossenen Flug sowie den zugehörigen realen, bezahlten Materialkauf und vorhandene Fracht. Erst **nach Ankunft, vor Ausführung von `entladen`** überträgt die Analyse einmalig den genau noch fehlenden Rechnungsteil **aus vorhandenem Meridian-Cash** an die ausgewählte echte Bedarfskäuferstation, nur solange die globale Ausgabenobergrenze eingehalten wird. Anschließend muss `entladen` denselben realen Original-`handel` durchführen; sonst schlägt die Analyse **fehl**. Nur dann ist der Leistungsnachweis abgeschlossen, nicht nach bloßer Absicht, Rechnung oder Papierangebot. Jede Quittung ist mit Schiff, Kauf, Quelle, Menge, Preis, Ziel, Ankunft, überwiesenem ISK und real verkauftem Gut exakt bilanziert. Maximal zwei Quittungen, kein dritter Auftrag.

**Es wird damit nicht bewiesen, dass die importierte Veldra-Ware geologisch/lagerhistorisch ausschließlich neu produziert wurde.** Das Quelllager besitzt keine Herkunftsetiketten für Anfangsbestand oder zuvor eingekaufte Waren. Die Prüfung belegt einen *bezahlten Originalwarenkauf mit nachfolgender physischer Originalfahrt*, keine nicht wiederholbare selbstständige Produktion, keine externe Wertschöpfungs-Gutschrift und keine Betrugsfreiheit für ein späteres reales Vertragssystem.

Vier 90d Original-Spielerfälle mit denselben sieben historischen B1-Befehlen, alle jeweils doppelt mit unverändertem deterministischem Kern durchgerechnet:

- **Kontrolle:** unverändert; Original-Hash exakt `784047684dfe5c56`.
- **Nur bezahlte Hülle:** NPC3 investiert selber, Käuferfinanzierung unverändert.
- **Ein Weltauftrag:** ein echtes Materiallot bekommt bedingt auf vollständige Ankunft und Originallieferung die fehlende Stationskaufkraft (B8d-Nachstellung).
- **Zwei Weltaufträge:** zweites echtes Lot wird bei Ankunft nochmals aus derselben globalen 900-ISK-Obergrenze bezahlt. Ein drittes echtes Lot wird **ohne neue Finanzierung** als harte Gegenprobe versucht, statt nach dem ersten Erfolg voreilig „Markt repariert“ zu sagen.

Die unabhängig gemessenen Betriebskosten von **genau diesem Frachter**, real gezahlte Gebühren, Geld-/Warenaudits, Spieler-Sparfreiheit, unverändertes Mint/Burn und Save/Load-Roundtrips sind Pflicht. Ein erfolgreicher Rechendurchlauf beweist weder profitable Eigentümerrendite, direkte Spielbarkeit auf iPad Safari noch einen automatischen NPC-Vertragsmarkt.

## [TEST] Befunde

Nur nach abschließend wirklich erfolgreicher GitHub-CI eintragen. Bis dahin lautet der Status **ungeprüfte Analyseimplementierung**.

## Bewertung / Freigabeschranken

**[NICHT FREIGEGEBEN]** Der Versuch ist *weder* eine endgültige globale Modell-B-Geldquelle *noch* eine genehmigte fortlaufende Weltauftrags-, Fonds- oder stationsbezogene Förderregel. Die Zahlung erfolgt aus vorhandenem neutrale-Stations-Cash und finanziert nur belegten Warenkauf bei Ankunft; trotzdem ist das temporäre Überweisen an eine einzelne ausgewählte Zielstation **kein generelles Produktdesign**. Falls ein zweiter Verkauf gelingt, bleibt insbesondere offen, wie das Budget nachhaltig refinanziert wird, woher die realen Nachfragerträge stammen, wie beliebige NPCs und Spieler bei transparentem Zugriff fair konkurrieren und wie echte Provenienz-IDs ausgestaltet werden. Im Produkt weiterhin **keine** Änderungen an `index.html`, Preise/Kosten, Schema, Regeln, Golden, Save, UI oder Spielerrechten. Kein Merge/Deployment ohne Freigabe.
