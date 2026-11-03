# B-K12e – NPC3-Überschussabgaben landen nachweislich in Aldera statt beim Nadir-Endkäufer

**[ANALYSE/DRAFT · 03.11.2026]** [PR #160](https://github.com/tobiasfranziskus/Check/pull/160), gestapelt auf [B-K12d #159](https://github.com/tobiasfranziskus/Check/pull/159), davor #158/#157/#156/#155. **[MAIN] `b4e604d6`, v0.12.5 / Regel14 / Schema8 unverändert.** Alle Zahlen gelten ausschließlich für die isolierten historischen **R15-/Schema9-Testwelten** mit nicht freigegebenem 4-ISK/Minute-Testproduktionslohn, echter 68-ISK-Vorabreserve und dem testseitigen B-K12c-Haushaltsrückfluss. Keine produktive Regeländerung, kein Spielstand- oder Emissionswechsel.

## 1. Hypothese und Originalregel

Aus B-K12d: Der reale Nadir-Eislieferant `sh009` von NPC3 bezahlt alle tatsächlichen Minerbetriebskosten. 38 ISK verlassen dennoch pro erneuter bezahlter Nahrungschargen-Kette den Nadir-Endkäuferfonds in Richtung NPC3. Trotz weiter verfügbarer Waren und zahlungsfähigem NPC3 kann der Käuferfonds den nächsten realen Produktionsauftrag nicht reservieren. **Frage:** Bringen die bereits existierenden `npcAusgaben`-Abgaben des solventen NPC3 Geld tatsächlich wieder nach Nadir zurück?

Der unveränderte historische Core wählt bei jeder `npcAusgaben`-Phase zunächst **die Station mit dem niedrigsten Bargeldbestand**. Anschließend führt er die **über der NPC-Obergrenze liegenden NPC-Bargelder** an den **Fonds des Systems dieser ärmsten Station** ab. Ein Bezug zu tatsächlich bezahlten Rohstofflieferungen, Nahrung, Hunger, einem konkreten Kunden oder einem bestehenden Endabnahmevertrag ist in dieser Buchungsregel **nicht vorgesehen**.

**Nur Beobachtung, keine Änderung:** B-K12e instrumentiert die Original-Core-Phase, ermittelt die Station nach dem ursprünglichen Kontostand, identifiziert sämtliche Zahler und den empfangenden Fonds, prüft die echten Abzüge und Zugänge unabhängig und versöhnt die sieben Tage aller Fonds über sämtliche ursprünglichen Core-Phasen (`foerderung`, `betriebskosten`, `ersatzkauf`, `npcAusgaben`, `verbrauch` usw.). Kein Betrag wird in den Tests umgebucht. Die deterministischen Welt-Hashes müssen **identisch** zu B-K12d bleiben.

## 2. [TEST] Exakte Abgaben und Empfänger

Die tatsächlich beobachtete **ärmste Station ist bei jedem NPC-Abgabeereignis `st_aldera`**. Daher überweist der historische Core die Überträge stets an **`fonds_aldera`** und niemals an den für die neuen Nahrungsaufträge verantwortlichen **`fonds_nadir`**.

| Reale 7-Tage-Buchung, Original-R15 | Seed42 | Seed7 |
|---|---:|---:|
| Tatsächlich beobachtete Abgabeereignisse | **39** | **13** |
| Gesamte `npcAusgaben`-Überträge von NPC3 | **3.067 ISK** | **1.427 ISK** |
| Andere originale NPC-Abgabezahler | **keine** | **keine** |
| Davon am Fonds Aldera gutgeschrieben | **3.067 ISK** | **1.427 ISK** |
| Davon am Nadir-Endkäuferfonds gutgeschrieben | **0 ISK** | **0 ISK** |
| NPC3-Eigentümervermögen am Ende | **5.249 ISK** | **3.487 ISK** |
| Reale bezahlte neue Nahrungsabnahmen in Nadir | **39** | **50** |
| Nadir-Fonds am Ende, nach bezahlten Abnahmen | **62 ISK** | **41 ISK** |
| Nadir-Mindestreserve für den nächsten realen Auftrag | **68 ISK** | **68 ISK** |
| Aldera-Fonds am Ende | **5.531 ISK** | **4.332 ISK** |

Dies sind echte Belege aus originalen **NPC3-Kassenabzügen und Aldera-Fonds-Eingängen** – weder fiktive Steuern noch eine rückwirkend erfundene Geldquelle. Jeder Übertrag ist nach Seed, Tick, Tagesnummer, Zahler, Ausgangs-/Zielkasse, System und ärmster Station überprüfbar. Für **alle sieben Fonds** gilt jeweils: Anfangsvermögen + sämtliche ursprünglichen phasenweise erfassten Geldänderungen = Endvermögen.

**Unabhängige Kassenidentität Aldera:**
- Seed42: **1.000 ISK Anfang + 125 ISK Handels-/Förderphase + 1.282 ISK Schiffsbetriebszahlungen + 57 ISK aus Ersatzkaufphase + 3.067 ISK NPC3-Abgaben = 5.531 ISK.**
- Seed7: **1.000 + 160 + 1.574 + 171 + 1.427 = 4.332 ISK.**

**Unabhängige Kassenidentität Nadir:**
- Seed42: **1.000 ISK Anfang + 51 ISK aus Förderungs-/Handelsphase + 727 ISK echte Schiffsbetriebszahlungen − 1.716 ISK für vollständig bezahlte Nahrungsabnahme = 62 ISK.**
- Seed7: **1.000 + 62 + 1.179 − 2.200 = 41 ISK.**

Keine der letzten beiden Identitäten enthält eine NPC3-`npcAusgaben`-Überweisung nach Nadir. Das ist der nachgewiesene **fehlende Rückweg**. Die gesamten vorstehenden Daten stimmen mit den originalen `m.log.net`-Phasenkonten und unabhängigen echten Eigentümerkassen überein.

## 3. Warum das noch keine Sanierungsregel ist

Der bereits existierende Mechanismus `npcAusgaben` ist **eine Übertragung vorhandenen Geldes über einer NPC-Kassenobergrenze** an den Fonds der ärmsten Station. **Er vergütet keine vom Empfänger erbrachte Leistung.** In B-K12e landet deshalb zwar vorhandenes NPC3-Geld bei Aldera, aber es gibt keine vertragliche Verbindung zur gelieferten Eis-/Nahrungskette Nadir.

Dazu kommen bewusst strenge Bedingungen aus B-K12b–d: `mindeststand=0`, `fondsObergrenze=1_000_000_000` und Testabschaltung historischer Individualzuschüsse. **Die ursprünglichen automatischen Fonds-Stützungs-/Kappungsflüsse sind hier ausgeschaltet**, um die echten Zahlungsquellen statt eines Ausgleichs aus Startvermögen zu messen. Alderas Fonds verteilt die Abgaben daher in der geprüften Mikro-Welt nicht automatisch weiter. Dieser Vergleich ist **keine Aussage über jede Wirkung von Fondsmechanismen im unveränderten Produkt-main oder einer vollständigen 90-Tage-Welt**.

Die Lücke ist somit in diesen Referenzwelten nicht fehlende Geldmenge: Aldera hält am Ende **5.531/4.332 ISK**, Nadir dagegen **62/41 ISK** und benötigt **68 ISK frei vor dem nächsten Auftrag**. Ein bloßes Umleiten der vorhandenen Abgaben wäre jedoch **eine neue Verteilungsregel**, die ökonomisch und produktseitig gesondert begründet, geprüft und freigegeben werden müsste; es ist auch kein Beweis für langfristig ausreichend wiederkehrende Einnahmen. Unterschiedliche NPC3-Abgabesummen und die 38-ISK-Grenzlücke je neuem Nahrungsauftrag sind **keine** Garantie einer stabilen globalen Versorgung.

## 4. Ausgeführte Testprüfung und Grenzen

- **[TEST]** [Erste B-K12e-Ziel-CI #41702858259](https://github.com/tobiasfranziskus/Check/actions/runs/41702858259) am Head `3c1b1dbf`: **6/6 Node-Tests erfolgreich**, 0 Fehler; Seeds42/7 × je sieben Tage und bestehende B-K12b/-c/-d-Vergleiche. Original-Core-Abgaberegel ohne Änderung ausgeführt, reale Zahler/Empfänger in sämtlichen 39+13 Abgabefällen, ursprüngliche phasenweise Kassenidentität aller Fonds, unabhängige stündliche Geld-/Waren-/Herkunftsaudits, Core-Hash-Identität zu den Vorwelten und täglicher Save-/Load-Roundtrip.
- **[TEST, FINALER PR-HEAD NOCH AUSSTEHEND]** In der darauffolgenden Testversion `a6dd6c7a` werden 3.067/1.427 ISK, die 39/13 Fälle, die ausschließliche Zuteilung nach Aldera, beide Aldera-/Nadir-/NPC3-Endkassen, die Original-Emissionssummen und beide gepinnten 7d-Hashes ausdrücklich geprüft. CI nach Dokumentationsupdate gesondert bestätigen.
- **[ANALYSE-GRENZE]** Isolierte R15-Welt, konkurrierende NPC-Frachter im Test gehalten, keine produktive Bedarfsverknüpfung oder Lohnänderung genehmigt. Maximal 1 neu finanzierter Nahrungslos je Stunde gegenüber 2 ursprünglichen Nadir-Verbrauchseinheiten; die 168/168 teilweise mangelnden Stunden können **nicht** allein als Geldmangel interpretiert werden. Keine 13×90d-Gesamt-/Spielerkrisen-Tests, keine iPad-/NAS-Abnahme, kein Produktcode-Diff, keine neue Geldquelle.

## 5. Nächste sachliche Entscheidung vorbereiten

**[OPTION] B-K12f** sollte **zwei notwendige Nachweise getrennt** erbringen, bevor aus dem Test eine Produktregel wird: (1) Identifizieren, welche existierenden, tatsächlich **verdienten** Einnahmen von NPC3 oder anderen Akteuren für eine wiederholte Nahrungsendbestellung rechtmäßig verfügbar wären, statt bloß Guthaben anderer Fonds umzuhängen; (2) Vorab vollständig finanzierte Endbestellungen bei realen anfänglichen und wiederkehrenden Kosten ohne neue ISK, Gratisrettung oder Spieler-Sparlimit prüfen. Priorität ist ein **kleiner eigenständig finanzierter Produktions-/Verbrauchskreislauf**, nicht die weitere Vervielfachung lose kombinierter Weltparameter.

Keine produktive Umwidmung von NPC-Abgaben, keine geänderte Fondsverteilung, keine Emissions-, Lohn- oder Preisreform ohne ausdrückliche Nutzerfreigabe. **[MAIN] bleibt maßgeblich.**
