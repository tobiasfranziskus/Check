# Aphros Void – B2a: Zufällige Leerfahrt gegen Warten am Dock

**[ANALYSE/DRAFT] 30. Oktober 2026.** Basis: `main 906b7978d388e9af960443a2b7f4835b1d2a15c0`, v0.12.3, Regeln 12, Schema 8. Keine Änderung an `index.html`, gespeicherter Simulation, Preisen, Kampf, Goldenwerten, Roadmap oder Produktstatus. Belege: [B1 #36](https://github.com/tobiasfranziskus/Check/pull/36), [Dauerbetrieb #37](https://github.com/tobiasfranziskus/Check/pull/37). Die dortigen B1-Startfälle werden aus gepinnten Commits neu rekonstruiert.

## Codebefund

In `m_core_entscheidung.entscheidung()` fährt ein leerer Frachter bei fehlendem positivem Handelsangebot nach zwei Warteintervallen zufällig zu einer anderen Station. `abflug` plant dafür eine reale Reise, selbst wenn nichts gekauft wird. `m_core_ankunft.reise()` zählt Reise-Arbeitsminuten, die `betriebskosten()` stündlich abbucht (jeweils nur bis zur tatsächlich vorhandenen Kasse). `halten` ist keine gleichwertige Lösung: `betriebskosten()` überspringt dieses Auftragskennzeichen, auch wenn eine Reise bereits begonnen wurde.

Am Dock kostet der reine Auftrag `handeln` ohne Reise keine laufende Frachterarbeit. Er schützt aber **nicht** vor Piraten: `zivil()` berücksichtigt gedockte Frachter im lokalen System, außer leeren Schiffen mit Auftrag `halten`. Ein Warten in Meridian ist daher nicht garantiert kampffrei.

## Isolierte Variante

Nur im Testprozess, nur für NPC3: Sobald nach zwei erfolglosen Handelssuchen die zufällige Leerfahrt anstünde, bleibt der Frachter im Auftrag `handeln`, am Dock, bis zur nächsten Prüfung nach `warteLeer` (30 Ticks). Vorhandene beladene Fahrten, `besterAbsatz`, Handel, Kampf, Sollflotte, Geld-/Warenbilanz, Betriebsformel und andere Konzerne bleiben unverändert. Die Quelltext-Injektion verifiziert, dass nur die Entscheidungsfunktion wechselt. Kein neues RNG für den Wartezweig, keine direkte Zustands-/Cashinjektion.

Die Vergleichsläufe verwenden identische vier Tag-90-Saves (Miner/42, Handelsflotte/42, Station/1234, Jagd/98765) und dieselben vier bestehenden gültigen B1-Befehle. `control` muss die vier B1-Tag-97-Hashes reproduzieren. `wait` verändert nur die Entscheidung. Jede Variante läuft 275 Tage bis absolut Tag 365, mit stündlicher Kassen-/Warenauditierung, uninstrumentiertem Replay, täglichen Hashes und Save/Load-Fortsetzungen an sechs Messpunkten.

**Abnahmekriterium:** Korrekte Replays, Audits und deterministische Saves sind notwendige technische Bedingungen. Wirtschaftlicher Erfolg verlangt zusätzlich reale bezahlte Geschäfte, keine Zunahme ungedeckter Kosten und aussagekräftige Überlebens-/Ersatzwerte. Eine bloß längere Lebensdauer, bloßer Dock-Stillstand oder ein verschobener RNG-Pfad ist keine Freigabe. Vier Diagnosefälle beweisen keine generelle Verlustwahrscheinlichkeit.

Die vollständigen Messdaten werden im PR-CI-Artefakt `b2a-gesamt` erzeugt. Die Ergebnisse und Grenzen der tatsächlich ausgeführten CI sind nachfolgend dokumentiert.

## Reproduktion (Node.js 22)

```sh
git fetch origin 6855d76bb374dd777a1b7e30ea52c9a6eca36399 cec7f93758e4a499c238738ff50adac4416080d4
mkdir -p /tmp/b2a-evidence /tmp/b2a-b1
git archive 6855d76bb374dd777a1b7e30ea52c9a6eca36399 | tar -x -C /tmp/b2a-evidence
git archive cec7f93758e4a499c238738ff50adac4416080d4 | tar -x -C /tmp/b2a-b1
LONGTERM_SOURCE_COMMIT=6855d76bb374dd777a1b7e30ea52c9a6eca36399 node /tmp/b2a-evidence/tools/npc-restart-v12.mjs --prepare --out=/tmp/b2a-start
for fall in miner handel-flotte station jagd; do
  node tools/b2a-warteentscheidung.mjs --case="$fall" --evidence=/tmp/b2a-evidence --b1=/tmp/b2a-b1 --starts=/tmp/b2a-start --out=/tmp/b2a-messung
done
node tools/b2a-warteentscheidung-summary.mjs /tmp/b2a-messung /tmp/b2a-bericht
node --test tests/*.test.mjs
```


## Ergänzender Belastungsvergleich

Die erste CI des Zweiervergleichs bestand technisch (8 Läufe, 2.200 Tageshashes, 48/48 Standardtests), **ergab aber in allen vier Fällen null leere Abflüge und identische Verläufe**. Die Wartebedingung wurde vor dem Verlust der untersuchten Frachter nicht wirksam. Dieser Nullbefund ist kein Wirkungsnachweis.

Deshalb werden zusätzlich zwei **separat erkennbare Sensitivitätsläufe** unter der bereits in [#37](https://github.com/tobiasfranziskus/Check/pull/37) untersuchten, ausschließlich für NPC3 im Testprozess eingeblendeten Betriebskosten- plus Hüllenreservenbewertung ausgeführt:

- `reserve_control`: der exakte frühere #37-`replacement`-Ansatz, **ohne** Warteänderung. Dessen vier Tag-365-Hashes werden vor jeder Aussage gegen die veröffentlichten Referenzen geprüft.
- `reserve_wait`: derselbe Ansatz **mit ausschließlich der B2a-Warteentscheidung zusätzlich**.

Damit bestehen zwei faire Paarvergleiche: `control` gegen `wait`, und `reserve_control` gegen `reserve_wait`. Die Reserve ist weder ein neues Konto noch eine Änderung an produktiver Buchung oder Sollflotte. Ein Unterschied im zweiten Paar belegt nur die Wirkung **unter dieser experimentellen Kapitalbeschränkung**, nicht die Produktwirkung in der unveränderten Wirtschaft.

Insgesamt 4 Fälle × 4 Varianten × 275 Tage = 16 Fortsetzungen; unabhängig auditierte Replays und 4.400 Tageshashes als CI-Gates. Keine vorhergesagten Ergebniswerte in den Bericht übernehmen.

## Ergebnisse der ausgeführten CI

**GitHub Actions [Lauf 41098611476](https://github.com/tobiasfranziskus/Check/actions/runs/41098611476):** sechs erfolgreiche Jobs (Fundamente, vier Vergleiche, Abnahme); **16 × 275 Tage**, 4.400 Tageshashes zwischen instrumentierter Ausführung und unabhängigem Replay; Geld-/Warenaudits, gespeicherte Fortsetzungen und **48/48 Standardtests** ohne Fehler, Skip oder Abbruch. Der frühere Zweiervergleich hatte ebenfalls sechs erfolgreiche Jobs mit 8 × 275 Tagen und 2.200 Hashes. Das ist **keine** produktive 13-Seed-Regelabnahme und keine iPad-/NAS-Abnahme.

**Unveränderte Wirtschaft:** In allen vier Fällen null Leerabflüge beim untersuchten NPC3-Frachter. `control` und `wait` sind bis Tag 365 zustandsidentisch; der geänderte Zweig wurde vor dem Tod der Frachter nicht benötigt. **Kein wirtschaftlicher Effekt nachgewiesen.**

**Gezielte Belastung mit zuvor dokumentierter #37-Kapitalreserve:** Die vier `reserve_control`-Endhashes sind exakt die dokumentierten `replacement`-Hashes aus #37. Damit ist die Reserve-Kontrolle vollständig reproduziert. Nur der Unterschied zur jeweiligen `reserve_wait`-Fassung misst den zusätzlichen Warteentscheid unter dieser Kapitalregel.

| Szenario | Reserve-Kontrolle: leere Abflüge / Verlust nach | Reserve + Warten: leere Abflüge / Schiff Ende Tag 365 | Netto-Betrieb vor Hülle, Kontroll- → Wartefassung | Ungedeckter gesamter NPC3-Betrieb, Kontroll- → Wartefassung |
| --- | --- | --- | ---: | ---: |
| Miner / 42 | 12 / 20,95 h | 0 / überlebt | −2.064 → 0 ISK | 1.393 → 0 ISK |
| Handelsflotte / 42 | 4 / 9,95 h | 0 / überlebt | +880 → +234 ISK | 0 → 0 ISK |
| Station / 1234 | 1 / 4,95 h | 0 / Verlust nach 12,95 h | −55 → −539 ISK | 0 → 0 ISK |
| Jagd / 98765 | 121 / 189,95 h | 0 / Verlust nach 4,95 h | −15.860 → +570 ISK | 15.517 → 0 ISK |

**Interpretation:** Warten vermeidet unter knapper verfügbaren Investitionsmitteln unnötige Leerflüge und kann riesige ungedeckte Betriebskosten verhindern. Es garantiert **keinen Handelsumsatz oder dauerhafte Versorgung**. Der im Minerfall überlebende Frachter wickelt keine Käufe/Verkäufe ab; im Handelsflottenfall sind es nur zwei Käufe und zwei Verkäufe über den gesamten Versuchszeitraum. Die +234 ISK sind **vor** Hüllenkauf (780 ISK) und kein positiver Investitionsrückfluss. Der Stationsfall verschlechtert sein Betriebsergebnis. Zwei überlebende Schiffe bei fast ausgefallenem Handel dürfen nicht als wirtschaftliche Robustheit oder Wiederaufbau gelten. Unterschiede im RNG-Verlauf nach divergierenden Entscheidungen erlauben keine allgemeine kausale Aussage über Piratenverlustwahrscheinlichkeiten.

**QA-Korrektur:** In der ersten maschinellen Auswertungsfassung wurde die Lebensdauer noch aktiver Schiffe mit einem relativen Tag-365-Tick statt der absoluten Tickbasis berechnet. Die zugrundeliegenden Zustände, Audits, Tode und Hashes sind unverändert. Die Verdichtung berechnet die beobachtete Lebensdauer jetzt mit dem absoluten Endtick; für bis Tag 365 überlebende Frachter beträgt sie etwa 6.599 Stunden seit Aktivierung (beobachtungsbegrenzt).

**Empfehlung:** Die Warteidee als mögliche lokale Korrektur behalten, aber **nicht isoliert als Produktänderung freigeben**. Erst die Integration von Kostenentscheidung, sicheren Warteorten, Ausweich-/Absatzlogik und finanziertem Flottenersatz in getrennten Versuchen bewerten. Insbesondere das kostenlose Weiterreisen bei `auftrag=halten` ist ein eigenständiger zu korrigierender Kostenpfad, nicht durch einen unbedachten Wechsel zu `halten` zu kaschieren.

## Grenzen

Der Versuch reduziert ausschließlich zufällige Leerflüge. Er enthält noch keine risikobewusste Routenwahl, keine bezahlte Flottenersatzplanung und keinen Insolvenz-/Markteintrittsmechanismus. Eine separate produktionstaugliche Regeländerung wäre bei positiver Abnahme erforderlich, einschließlich Regelversion/Migration, 13×90-Seed-Gate und Spieler-/Langzeitfällen. Kein Merge oder Deployment.
