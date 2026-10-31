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

## [TEST] Ergebnis

Bei ausstehenden Läufen keine Ergebnisse behaupten. Hier nach erfolgreichem CI die exakte Rundentabelle eintragen.

## Wirtschaftliche Entscheidung

**[WARTET AUF GATE]** Eine positive erste real voll abgewickelte Fahrt würde zeigen, dass der ursprüngliche Preisabstand auf dieser *einzelnen Route* ausreicht, nicht dass der Frachter unter allen Marktlagen oder nach Kapitalbindung profitabel ist. Eine negative voll abgewickelte Rundfahrt wäre dagegen ein belastbarer Hinweis auf ein Preis-/Betriebskostenproblem. Ebenso kann die nötige Fremd-Käuferkasse selbst bei positiven Händlererträgen ein separater Engpass bleiben. Bevor Preisformeln, Frachterkosten, neues Geldregime oder selbständige Pacht-Piloten implementiert werden, müssen beide Ursachen getrennt und mehrseitig gemessen werden.

**Abnahmegrenzen:** noch keine 13 Seeds ×90 Tage, keine historischen 365d-Spielerfälle, keine neue Save-Migration (Analyse ändert Save nicht), keine iPad-Safari-/NAS-Abnahme, kein Merge oder Deployment.
