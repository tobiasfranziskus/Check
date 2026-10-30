# Aphros Void – B2a: Zufällige Leerfahrt gegen Warten am Dock

**[ANALYSE/DRAFT] 30. Oktober 2026.** Basis: `main 906b7978d388e9af960443a2b7f4835b1d2a15c0`, v0.12.3, Regeln 12, Schema 8. Keine Änderung an `index.html`, gespeicherter Simulation, Preisen, Kampf, Goldenwerten, Roadmap oder Produktstatus. Belege: [B1 #36](https://github.com/tobiasfranziskus/Check/pull/36), [Dauerbetrieb #37](https://github.com/tobiasfranziskus/Check/pull/37). Die dortigen B1-Startfälle werden aus gepinnten Commits neu rekonstruiert.

## Codebefund

In `m_core_entscheidung.entscheidung()` fährt ein leerer Frachter bei fehlendem positivem Handelsangebot nach zwei Warteintervallen zufällig zu einer anderen Station. `abflug` plant dafür eine reale Reise, selbst wenn nichts gekauft wird. `m_core_ankunft.reise()` zählt Reise-Arbeitsminuten, die `betriebskosten()` stündlich abbucht (jeweils nur bis zur tatsächlich vorhandenen Kasse). `halten` ist keine gleichwertige Lösung: `betriebskosten()` überspringt dieses Auftragskennzeichen, auch wenn eine Reise bereits begonnen wurde.

Am Dock kostet der reine Auftrag `handeln` ohne Reise keine laufende Frachterarbeit. Er schützt aber **nicht** vor Piraten: `zivil()` berücksichtigt gedockte Frachter im lokalen System, außer leeren Schiffen mit Auftrag `halten`. Ein Warten in Meridian ist daher nicht garantiert kampffrei.

## Isolierte Variante

Nur im Testprozess, nur für NPC3: Sobald nach zwei erfolglosen Handelssuchen die zufällige Leerfahrt anstünde, bleibt der Frachter im Auftrag `handeln`, am Dock, bis zur nächsten Prüfung nach `warteLeer` (30 Ticks). Vorhandene beladene Fahrten, `besterAbsatz`, Handel, Kampf, Sollflotte, Geld-/Warenbilanz, Betriebsformel und andere Konzerne bleiben unverändert. Die Quelltext-Injektion verifiziert, dass nur die Entscheidungsfunktion wechselt. Kein neues RNG für den Wartezweig, keine direkte Zustands-/Cashinjektion.

Die Vergleichsläufe verwenden identische vier Tag-90-Saves (Miner/42, Handelsflotte/42, Station/1234, Jagd/98765) und dieselben vier bestehenden gültigen B1-Befehle. `control` muss die vier B1-Tag-97-Hashes reproduzieren. `wait` verändert nur die Entscheidung. Jede Variante läuft 275 Tage bis absolut Tag 365, mit stündlicher Kassen-/Warenauditierung, uninstrumentiertem Replay, täglichen Hashes und Save/Load-Fortsetzungen an sechs Messpunkten.

**Abnahmekriterium:** Korrekte Replays, Audits und deterministische Saves sind notwendige technische Bedingungen. Wirtschaftlicher Erfolg verlangt zusätzlich reale bezahlte Geschäfte, keine Zunahme ungedeckter Kosten und aussagekräftige Überlebens-/Ersatzwerte. Eine bloß längere Lebensdauer, bloßer Dock-Stillstand oder ein verschobener RNG-Pfad ist keine Freigabe. Vier Diagnosefälle beweisen keine generelle Verlustwahrscheinlichkeit.

Die vollständigen Messdaten entstehen im PR-CI-Artefakt `b2a-gesamt`. Vor tatsächlichem CI-Lauf ist **kein** Ergebnis oder wirtschaftlicher Verbesserungsnachweis behauptet.

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

## Grenzen

Der Versuch reduziert ausschließlich zufällige Leerflüge. Er enthält noch keine risikobewusste Routenwahl, keine bezahlte Flottenersatzplanung und keinen Insolvenz-/Markteintrittsmechanismus. Eine separate produktionstaugliche Regeländerung wäre bei positiver Abnahme erforderlich, einschließlich Regelversion/Migration, 13×90-Seed-Gate und Spieler-/Langzeitfällen. Kein Merge oder Deployment.
