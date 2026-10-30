# B3 – Finanzierte Sollflotten und Ersatzpflichten

**30. Oktober 2026 · [ANALYSE/DRAFT].** Produktbasis: `main 906b7978d388e9af960443a2b7f4835b1d2a15c0` (v0.12.3, Regel 12, Schema 8). Verbindliche Produkt-Roadmap: [ROADMAP.md](ROADMAP.md). Entwicklungsregeln: [AGENTS.md](../AGENTS.md). Kein `index.html`-, Regel-, Goldenwert-, Roadmap- oder Statuspatch. Keine Produktionsänderung, keine neue Geldquelle, kein neues Schiff, kein Merge oder Deployment.

## Gesicherte Ausgangslage

Die vier B1-Fälle aus [#36](https://github.com/tobiasfranziskus/Check/pull/36) und [#37](https://github.com/tobiasfranziskus/Check/pull/37) aktivieren nach realem bezahltem Frachterkauf ein NPC3-Schiff. `m_core_commands.execute.shipActivate` aktiviert, registriert aber nicht den Sollplatz. `m_core_schiffbau.fehlend` gleicht ausschließlich `klasse/heimat/ware` ab und `ersatzkauf` läuft vorhandene Sollschlüssel nacheinander durch; ein Owner hat pro Stunde höchstens einen Kauf. `sollflotte.npc3` enthält elf Minerplätze und vor B1 keinen Frachterplatz. Alle Besitzer nutzen ihre reale gemeinsame Kasse. Ein umgelenkter Miner in Aldera fällt im alten Förder-Soll als fehlend an, obwohl seine Hülle weiterhin existiert.

**Getrennte Verpflichtungen:** Ein zukünftiger Frachterplatz schafft keinen Anspruch auf einen kostenlosen Nachfolger. Die monatliche (hier stündliche) Kasse muss zugleich bestehende Minerpflichten, angefallene Arbeit, Hüllenkauf, erste Ladung und folgenden Betrieb finanzieren; die vorhandene 250-ISK-Reserve wird nur einmal berücksichtigt. Diese Analyse misst jeweils aktuelle Marktpreise einschließlich Gebühren, keine fixe Langzeit-Kapitaluntergrenze.

## Vier isolierte Produktkernvarianten

Aus dem **unveränderten** v12-Kern abgeleitet und ausschließlich im Testprozess in `tools/b3-sollflotte.mjs` angepasst:

1. **`control`:** Bytegleicher Core von `main`, unveränderte ursprüngliche B1-Handelsbefehle. Die vier #37-Endhashes und Tag-97-B1-Kontrollhashes müssen wieder erreicht werden.
2. **`register`:** Nur wenn ein NPC3-Frachter nach gültigem `shipActivate` wirklich entstanden ist, einen passenden Sollschlüssel für Klasse Frachter, Heimat des neuen Schiffes und leere Förderware anhängen. Alle Prioritäten und Geldregeln bleiben unverändert. Dadurch entsteht bewusst eine **noch nicht finanzierte** Ersatzpflicht; das ist kein genehmigter Produktvorschlag.
3. **`priority`:** Genau wie `register`, aber für NPC3 fehlende Frachter-Sollplätze vor Miner-Sollplätzen prüfen. Bestehende Kauf-, Gebühren-, Vorrats- und Kassenprüfung bleibt unverändert. Verdrängung von Minerersatz wird als Risiko untersucht.
4. **`funded`:** Zulassung des Sollplatzes nur beim gültigen `shipActivate` und nur, wenn nach dieser realen Aktivierung alle **bereits** fehlenden Miner-Sollplätze zum aktuellen Gesamtpreis, offene Arbeitsabrechnung, eine zusätzliche reale Werft-Frachterhülle und die bestehende 250-ISK-Rücklage aus der tatsächlichen NPC3-Kasse abgedeckt und eine Werft-Frachterhülle am Ort vorhanden sind. Kein eigenes Investitionskonto, keine Geldinjektion und keine Flottenprioritätsänderung. Dieses bewusst strenge Gate kann den Sollplatz verweigern, ohne bereits getätigte Käufe zu verbieten. Nicht als vollständiges Investitionsbudget für unbestimmte Zukunft interpretieren.

`control` und `funded` bleiben für die vier bereits finanziell überlasteten B1-Fälle erwartungsgemäß zustandsgleich – die gemessene Nichtzulassung ist ein nachvollziehbarer Befund, **kein** Beweis einer generell unmöglichen Finanzierung. `priority` ist eine mögliche Warnung vor Aushöhlung der Förderbasis, **keine** Empfehlung für pauschale Vorziehung.

## Reproduktion und Qualitätsgates

Unveränderte vier Tag-90-Saves aus den gepinnten #34-/#36-Commits: Miner/42, Handelsflotte/42, Station/1234, Jagd/98765. Vier Fassungen × vier Fälle × 275 Fortsetzungstage bis absolut Tag 365, jeweils unabhängiger uninstrumentierter Replay, 275 Tageshashes, stündliche Geld-/Waren-/Einzelkonten-Audits, sechs Save/Load-Wiederaufnahmen (jeweils zwei Zustände). Core- und Instrumentierungs-SHA, initiale und Endhashes, ausgeführte B1-Befehle und 48 Standardtests. Ein unabhängiger kleiner Funktionstest prüft zusätzlich die Regeln für Rollenregistrierung und Priorisierung. Node.js 22 ohne Laufzeitpakete.

Für die Ergebnisbewertung werden explizit getrennt: neu registrierte Frachterrollen, **tatsächlich bezahlte** neue Frachterhüllen und Minerersatz, aktuelle Miner- versus Frachter-Solllücken, echte NPC3-Kasse, ungedeckte Arbeit, verfügbarer Werftvorrat, Überleben und reale Handelsmengen. Solange ein Ersatzschiff nur gekauft und anschließend wieder verloren wird oder Förderplätze liegenbleiben, ist eine „Erfolgsquote“ nicht erreicht.

**Noch kein Teststatus behauptet:** Reale Resultate, CI-Artfakte und Hashes erst nach bestätigten Ausführungen berichten. Diese vier Diagnosefälle ersetzen keine produktive 13-Seed-×90-Tage-Abnahme, vollständige Save-Migration oder iPad-/NAS-Tests.

## Datenqualität: erste Frachterrolle versus gesamte Frachterflotte

**Messkorrektur vor Abschluss der CI:** Das übernommene B1-Folgewerkzeug gruppierte realisierte Handelsmargen nach Owner und Schiffsklasse (NPC3/Frachter), zog anschließend aber nur die Arbeitskosten und Frachtverluste des **ersten** B1-Frachters ab. Sobald die Sollplatzvarianten tatsächlich Ersatzfrachter erzeugen, wäre dieses Vorzeichen/Profit-Maß ungeeignet. B3 berechnet deshalb ausdrücklich zusätzlich den **vollständigen NPC3-Frachterflottenbetrieb vor Hüllenanschaffung**: sämtliche realisierten FIFO-Margen **abzüglich** sämtlicher tatsächlicher und ungedeckter Frachterarbeitskosten **und** verlorener FIFO-Frachtwerte aller NPC3-Frachter. Für den anfänglichen B1-Frachter wird das eigene Ergebnis zusätzlich gesondert ausgewiesen. Einzelne Kosten und Frachtverluste stehen im Diagnoseereignisprotokoll und werden in der Verdichtung gegen die Gesamtsummen abgeglichen. Bezahlte Ersatzhüllen werden separat als Anschaffungsinvestition erfasst; sie dürfen nicht nochmals als laufende Arbeit oder Warenmarge verrechnet werden.

Der Bericht verwendet die erst nach dieser Korrektur erneut vollständig gelaufene CI. Die erste Testversion kann zwar korrekte Simulationshashes liefern, ist aber **kein akzeptierter P&L-Nachweis für Varianten mit mehreren Frachtern**. Kein Produktcode wurde dadurch geändert.

## Grenzen und nächstes Gate

Die vier Varianten implementieren weder eine autonome **erstmalige** NPC-Investitionsentscheidung noch eine Insolvenzabwicklung. Die bereits von B1 ausgeführten Befehle aktivieren ein Schiff unter dem nachweislich vorhandenen Minerersatzdruck; dieser Kauf wurde nicht unter der B3-Zulassungsregel verhindert. Die Varianten verändern keine Handelsrouten, Kampfregeln oder Kosten, weshalb ein durch Piraten vernichteter Frachter selbst mit bezahltem Sollplatz keine dauerhafte Versorgung garantiert. Einmalige Deckung am Aktivierungszeitpunkt garantiert keinen mehrjährigen Ersatz- oder Fortsetzungszyklus. Der erste Ersatzeinsatz kann außerdem wieder keine Finanzierung für die erste Ladung besitzen.

**Offene Produktentscheidung:** Soll ein Konzern auch bei wirtschaftlich knapper Kasse eine neue Ersatzverpflichtung eröffnen dürfen, oder soll der Kauf eine einmalige spekulative Nutzung ohne Dauerrolle bleiben, bis Finanzierung und sichere Absatzmöglichkeiten belegt sind? Diese Entscheidung ist noch **[OPTION]**, nicht `[BESCHLOSSEN]`.
