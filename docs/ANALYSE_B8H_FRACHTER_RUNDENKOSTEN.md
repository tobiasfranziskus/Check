# B8h – Wirkliche Frachter-Vollkosten je Flugabschnitt und abgeschlossener Handelsrunde

**[ANALYSE/DRAFT] · 31.10.2026** · Grundlage ausschließlich `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5 / Regel 14 / Schema 8; [einzig verbindliche ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md).

## Ausgangsproblem

[B8g – Draft-PR #67](https://github.com/tobiasfranziskus/Check/pull/67) belegte einen echten, aus NPC3-Mitteln angeschafften Frachter, zwei original finanzierte Materialverkäufe an Cyris und einen original bezahlten dritten Materialeinkauf ohne dritten Verkauf. Seine Gesamtrechnung `826 Verkaufserlöse − 501 Warenkäufe inkl. Einkaufgebühr − 32 Verkaufsgebühr − 682 reale Betriebskosten = −389 ISK` ist **korrekt, aber keine isolierte Aussage über die Profitabilität der ersten beiden vollständig abgewickelten Runden**. Sie enthält auch die für einen späteren Verkauf gehaltene dritte Fracht und die einmalige Hüllen-Positionierung. B8h verhindert, daraus vorschnell eine Preis- oder Betriebskostenregel abzuleiten.

## Messverfahren – unveränderter Originalkern

Der originale, per SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9` fixierte Regel14-Core wird für ein ausschließlich im Node-Analysetool laufendes Beobachtungs-Overlay geladen, nicht als veränderter Produktcode gespeichert. **Keine** Änderungen an `index.html`, `docs/ROADMAP.md`, Originaltests/Goldenwerten, Save-Schema oder regulären Core-Modulen.

B8h verwendet dieselben vier echten Seed42/90d-Szenarien wie B8g: unveränderte historische sieben B1-Spielerbefehle, real bezahlter NPC3-Frachter ohne Käuferbudget, ein echter bezahlter Originalvertrag, zwei echte Originalverträge mit einem explizit nicht finanzierten dritten Marktversuch. Der Analyse-Observer erfasst zusätzlich:

- **Jede einzelne originale Reise-Arbeitsminute** des neuen Frachters `sh106` über `m_core_ankunft.reise`, klassifiziert **einmalige Erstpositionierung** (von der Originalwerft zum Materialmarkt), **beladene Veldra→Cyris-Fahrt 1/2/3** und **leere Rückfahrt 1/2**. Die Original-Treibstofffreiheit bleibt vollständig erhalten.
- **Jede wirkliche Originalbetriebskostenabrechnung**, wie sie `m_core_stunde.betriebskosten` aus kumulierten Arbeitsminuten berechnet und tatsächlich an Fonds weiterleitet. Kosten werden *nur zu Analysezwecken* proportional auf die in der Abrechnungsstunde wirklich gemessenen Minuten verteilt; exakte Integer-Rundungsreste werden nach stabilem Schlüssel vergeben, sodass **keine ISK erfunden oder doppelt gezählt** werden. Fällige und gezahlte Kosten werden separat rekonstruiert.
- **Jeden tatsächlich ausgeführten Original-Handelskauf und -verkauf**, Bruttopreis und Original-`gebuehr`; Schiffshülle, Warenkäufe und Gebühren werden **nicht doppelt belastet**. Der isolierte, tatsächlich bezahlte Hüllenkauf wird als Kapitalbindung, *nicht* als vollständig abgeschriebener Verlust gewertet. Noch unverkaufte Fracht wird als gebundener Warenbestand berichtet – zu Anschaffungsauszahlung, **kein behaupteter Marktwert**.
- **Rundenergebnisse**: Bruttoverkauf minus Original-Verkaufsgebühr, Materialeinkauf inkl. Einkaufgebühr, beladene Flugkosten, optional leere Rückpositionierung. Der Unterschied zwischen „einmal beladen hin“, „vollständig abgeschlossen mit Rückfahrt“ und „neuer Auftrag ohne Verkäuferlös“ wird ausdrücklich ausgewiesen. Piratenrisiken werden **nicht** aus einer einzigen beobachteten Route extrapoliert: echte Schiffsverluste würden im Originalzustand sichtbar; ein Risiko-Preis oder fiktive Schadenskosten werden nicht erfunden.

Ein isoliertes Runden-Reporting ist **kein Pilotengehaltsmodell**, kein Makro-Zahlungsstrom-Resultat und kein Beweis langfristig gedeckter Nachfrage. Die im Versuch **analyseseitig geskriptete Nachfrage-/NPC3-Fahrt** bleibt eine künstliche Gegenprobe; echte autonome Konkurrenz oder über alle Firmen faire Märkte sind nicht eingebaut.

## [TEST] Durchgeführtes B8h-Kostengate

**[CI #41247182971](https://github.com/tobiasfranziskus/Check/actions/runs/41247182971)**: Vier unveränderte historische Seed42-90d-Welten (Kontrolle / reale Eigen-Hülle ohne Käuferbudget / 1 / 2 echte fremdfinanzierte Original-Cyris-Annahmen), jede doppelt deterministisch nachgespielt. Das harte Kosten- und Rundenprüfgate lief erfolgreich, **67/67 Standardtests, 0 Fail, 0 Skip**. **17.280 unabhängige stündliche Geld-/Warenaudits und deterministische Replayhashes**, **40 Save/Load-Roundtrips**. Original-Kontrollendhash **`784047684dfe5c56`**. Die zusätzliche, letzte CI-Assertion fixiert die hier berichtete Zerlegung auf den endgültigen PR-HEAD; ihr Abschlussstatus wird separat verifiziert.

### Tatsächlich gebuchte Originalkosten – genau ein NPC3-Frachter `sh106`

| Cashvorgang / originale Reisephase | Minuten der echten Fahrt | Tatsächlich gezahlte ISK | Zuordnung |
| --- | ---: | ---: | --- |
| Hüllenerwerb Aldera (750 Preis + 30 Gebühr) | – | **780** | Eigentümer-Cash → bezahlter Vermögenswert, keine Vollabschreibung |
| Einmalige Fahrt Aldera→Veldra | **39** | **162** | Positionierung vor der ersten Materialrunde |
| Materialkauf #1: 7 Material (161 Preis + 6 Gebühr) | – | **167** | Erste gebundene Warenladung |
| Beladene Fahrt #1 Veldra→Cyris | **25** | **104** | Original-Betriebskosten |
| Echter Verkauf #1: 413 Preis −16 Verkaufsgebühr | – | **+397 netto** | Reale Original-Handelszahlung |
| Leer-Rückfahrt #1 Cyris→Veldra | **25** | **104** | Original-Betriebskosten |
| Materialkauf #2 | – | **167** | Zweite gebundene Warenladung |
| Beladene Fahrt #2 Veldra→Cyris | **25** | **104** | Original-Betriebskosten |
| Echter Verkauf #2: 413 Preis −16 Gebühr | – | **+397 netto** | Reale Original-Handelszahlung |
| Leer-Rückfahrt #2 Cyris→Veldra | **25** | **104** | Original-Betriebskosten |
| Materialkauf #3 | – | **167** | Vorhandene, **unverkaufte** dritte Ladung |
| Beladene Fahrt #3 Veldra→Cyris | **25** | **104** | Original-Betriebskosten, trotz 0/7 verkaufter Einheiten |

**Exakte Arbeitsbilanz:** 39 + 5×25 = **164 echte Reise-Arbeitsminuten** und **162 + 5×104 = 682 ISK tatsächlich bezahlt**, **0 unbezahlt**. Die jährliche/zeitliche Abschreibung, Zinsen, Gehälter oder Risikoaufschläge wurden **nicht** zusätzlich erfunden; ein Pfand-/Pachtmodell existiert im Original noch nicht.

**Verifizierte einzelne Rundgeschäfte** (nach vollständig bezahlter Rückkehr zum Ausgangspunkt, *ohne* vorangegangene Hüllenerwerbs-/Erstpositionierungs-Auszahlung):

`413 Originalverkaufswert − 16 Originalverkaufsgebühr − 167 Quelle inkl. Kaufgebühr − 104 beladene Fahrt − 104 leere Rückfahrt = +22 ISK.`

Dies gilt für **Runde 1 und 2** unabhängig und mit exakt denselben Originalhandelsbuchungen. Vor der leeren Rückfahrt beträgt der echte *einmalige* Deckungsbeitrag des beladenen Abschnittes **+126 ISK**, jedoch noch ohne Rückpositionierung für die nächste Fahrt. Rundenvollkosten auf dieser Route sind **positiv, aber extrem knapp**.

**Anfangskapital und drittes, offenes Lot ausdrücklich separat**:

`2 × (+22 fertige Rückfahrten) − 162 einmalige Erstpositionierung − (167 Warenkauf #3 + 104 beladene Fahrt #3) = **−389 ISK Cashsaldo**`.

Die **780 ISK Hüllenauszahlung** kommt **zusätzlich** als zu finanzierendes Eigentümerkapital hinzu, ist aber am Endtag weiterhin durch eine vorhandene, nicht automatisch wertlose Hülle repräsentiert. Die dritte 7er-Fracht ist am Tag90 real noch vorhanden; 167 ISK wurden zu ihrer Beschaffung aufgewendet, **nicht** endgültig wirtschaftlich abgeschrieben. Ohne erneute Originalkäuferliquidität findet kein dritter Verkauf statt.

Ein rein **illustrativer** statischer Rückflussmaßstab ohne Schiffswert, zusätzliche Schäden, längere Wartezeit, schwankende Preise oder weitere Blockaden wäre `ceil((780 + 162) / 22) = 43` exakt so erfolgreiche vollständige Rundfahrten, um die anfangs ausgegebenen 942 ISK aus freiem späterem Rundencash wieder einzunehmen. Das ist **kein ausgeführter 43-Runden-Test**, keine kalkulierte Abschreibung und kein realistischer Rentabilitätsbeweis.

### Kausalität und Risiko

Alle beobachteten Verkäufe erfolgten ausschließlich, weil vorhandene Meridian-ISK die Originalkäuferrechnung tatsächlich gedeckt haben (zwei Überweisungen: **403+413=816 ISK**), nicht weil sich die reale Cyris-Kasse aus Rezeptproduktion selbst wiederholt erholte. Auch bei positiver +22-Handelsrunde finanziert der Händler nicht die Nachfrage; die Fabrik erzeugt ohne Cash-Ausgaben für ihre Produkte keinen sicheren Käufergeldrückfluss.

**Kein Frachterverlust** bei diesen konkreten Reisen, keine angenommene Risikoprämie. Die Route zwischen den sicheren Systemen Veldra und Cyris ist kein Nachweis risikoloser Piraterie in anderen Systemen. Bereits eine geringe nicht verbuchte Zusatzbelastung von **mehr als 22 ISK pro fertiger Rundfahrt** würde die isolierte Marge unter Null drücken. Bereits eine zusätzliche Handels-/Pacht-/Personalgebühr kann also die Überlebensfähigkeit verändern.

## Wirtschaftliche Entscheidung

**[BESTÄTIGTER BEFUND]** Die Original-Material-Preisrelation *kann* auf diesem einen realen, vollständig bezahlten Seed42-Weg **+22 ISK pro vollendeter Rundfahrt** tragen. Daher ist die frühere Schlussfolgerung „−389 ISK Gesamtsaldo beweist unprofitable Handelspreise je Fahrt“ **widerlegt**. Der Geldverlust entsteht aus **einmaliger Positionierung, Kapitalbindung und einem weiteren nicht bezahlten Folgegeschäft**, während die vorherigen zwei Runden tatsächlich knapp positiv waren. 

**[WEITER OFFEN]** Ein universell profitabler selbständiger Pilotenmarkt, langfristig solvente Käufer, nachhaltige Geldquellen, 13 Seeds/365 Tage, Preisempfindlichkeit bei allen Gütern, realistische Risikokosten und Verzinsung/Abschreibung bleiben unbewiesen. **Keine** spontanen Änderungen an Frachterbetriebskosten, Preisen, Schiffskaufpreis, Fonds oder der Modell-B-Geldquelle auf Grundlage eines einzigen Falls. Als nächstes enges Gate [OPTION]: den Unterschied *positive Transportmarge versus finanzierte und reale Käufernachfrage* auf mehreren Handelsstrecken und Seeds messen; nur danach die passende Leistungs-/Auftragsfinanzierung definieren.

**Abnahmegrenzen:** noch keine 13 Seeds ×90 Tage, keine historischen 365d-Spielerfälle, keine neue Save-Migration (Analyse ändert Save nicht), keine iPad-Safari-/NAS-Abnahme, kein Merge oder Deployment.
