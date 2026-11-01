# B8p – Befristete Endnachfrage gegen reale Verbrauchsereignisse: Negativer Gegenversuch

**[ANALYSE/ARCHIV, 01.11.2026]** Ausgang `main 0d473e6`, v0.12.5 / Regel14 / Schema8, unveränderte `index.html` mit Original-Core-SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`. Nur isolierter Test-Runner, separater CI-Workflow und dieser Bericht. **Weder neue ISK-Emissionsregel noch Pilotengeld-/Stationsregel genehmigt oder produktiv.**

## Hypothese und vier unabhängige Modellarme

Geldmodell B gestattet neue ISK grundsätzlich nur begrenzt, auditiert und gegen tatsächlich erbrachte Leistungen. Hier wird **keine Produktentscheidung** getroffen, sondern eine hypothetische, für alle Verbrauchsstationen identische **Zahlung an die Stationskasse bei tatsächlichem Verbrauch von Nahrung/Medikamenten** getestet.

- `control`: Originalwirtschaft ohne zusätzliche Zahlung; die vorhandenen Kopfgeldemissionen bleiben unverändert.
- `fund-delivery`: Bestehende reale Fondsbestände werden auf neutrale Verbrauchsstationen übertragen, höchstens nach belegtem Verbrauch und bislang dort durch **tatsächlichen Wareneinkauf** registrierten Einheitengutschriften; **kein** zusätzlich gemintes ISK.
- `mint-delivery`: Ansonsten gleiches Signal, aber zusätzliche echte ISK `state.minted`, auditiert.
- `mint-all-consumption`: Optimistische Obergrenze: Zahlung bei jedem tatsächlich verbrauchten Grundversorgungsgut, **auch wenn keine vorherige Warenlieferung nach Start protokolliert wurde**. Diese Variante kann deshalb unter anderem vorhandene Anfangsbestände vergüten – als Produktionsregel nicht akzeptabel, nur Benchmark.

**Alle drei Varianten:** 3 ISK je anrechenbarer Einheit, maximal 120 ISK je Spieltag für die gesamte Welt, maximal 6.000 ISK insgesamt in 90 Tagen. Dies sind **arbiträre Prüfparameter, keine freigegebenen Produktwerte**. Bei ausbleibender verbrauchter Ware wird kein Geld verteilt; kein individueller NPC erhält einen Konkurszuschuss. In der `fund`-Variante werden vorhandene Fonds in deterministischer Reihenfolge belastet, nicht magisch aufgefüllt.

**Wesentliche fachliche Einschränkung:** `mint-delivery` verfolgt pro Station und Ware die Mengen aus erfolgreichen Kauf-/Verkaufsbuchungen und begrenzt sie gegen tatsächlichen folgenden Verbrauch. Da der ursprüngliche Warenledger **keine Chargen-/Provenienzkennzeichnung** führt, ist damit noch nicht bewiesen, dass exakt diese gelieferten Einheiten (statt älterem Lagerbestand) verbraucht wurden. Es ist ein **liefer- und verbrauchsbasierter Obergrenzentest**, noch kein belastbarer Rechtsanspruch auf ISK-Emission.

## Reproduzierbare CI und Buchführung

**[TEST/CI] [GitHub Actions #41290400447](https://github.com/tobiasfranziskus/Check/actions/runs/41290400447) auf dem verbesserten Runner erfolgreich; vorheriger [Lauf #41290191980](https://github.com/tobiasfranziskus/Check/actions/runs/41290191980) ebenfalls erfolgreich.** 67/67 originale Node-Regressionen; 8 Welten (Seeds42/7 × vier Arme) über je 90 Tage, **17.280 unabhängige stündliche Geld-/Warenaudits**, deterministische Doppel-Replays und **64 Save/Load-Roundtrips**. Die originalen Krise-Hashes `784047684dfe5c56` (Seed42) und `84153573536268f2` (Seed7) werden im Kontrollarm reproduziert; jede Variante hat einen neuen deterministischen Zustandshash. Das CI-JSON-Artefakt enthält die vollständigen Wallets/Preise/Versorgungszahlen. Vorläufig fehlgeschlagene Testläufe stammten aus **Testassertions**, nicht dem Produktkern: nicht gebuchte Zahlungstage wurden ursprünglich nicht als null gezählt, anschließend wurde vorhandene Kopfgeldemission fälschlich als null vorausgesetzt; beides ist korrigiert. Produktkern unverändert.

| Modell nach 90 Tagen | Seed42: Fonds-Transfer | Seed42: neue ISK | Seed7: Fonds-Transfer | Seed7: neue ISK |
|---|---:|---:|---:|---:|
| Nur auf registrierte Lieferung + Verbrauch | **840 ISK** | **960 ISK** | **846 ISK** | **1.080 ISK** |
| Vergütung jedes tatsächlichen Verbrauchs (optimistische ISK-Obergrenze) | – | **960 ISK** | – | **1.284 ISK** |

| Kernkennzahl nach 90 Tagen | Seed42 Kontrolle | Seed42 Fonds | Seed42 Mint-Lieferung | Seed42 Mint-Verbrauch | Seed7 Kontrolle | Seed7 Fonds | Seed7 Mint-Lieferung | Seed7 Mint-Verbrauch |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| NPC1/2-Frachter | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Verbrauchsstationen mit Nahrungsmangel | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 |
| Verbrauchsstationen mit Medikamentenmangel | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 |
| Stationskassen in ISK | 4.466 | 5.198 | 6.128 | 8.470 | 5.172 | 6.826 | 5.981 | 6.479 |
| Tatsächlich zusätzlich geminte ISK | 0 | 0 | 960 | 960 | 0 | 0 | 1.080 | 1.284 |

**Zusätzliche unabhängige Endbestandsprüfung:** Der finale Runner zählt nicht nur seit Spielbeginn jemals aufgetretene Mangelstunden, sondern für jede Verbrauchsstation am Tag90 auch **aktuelle physische Unterdeckung** (`lager[nahrung/medikamente] < regulärer Stundenverbrauch`). In **allen acht Welten** sind für beide Waren tatsächlich **6/6** Verbrauchsstationen am Ende unterdeckt, nicht nur in der kumulierten Historie. Die negativen Ergebnisse sind dadurch unabhängig vom Interpretationsfehler des alten Mangelzählers nachgewiesen.

**Überlappung im Repository:** Der zwischenzeitlich abgeschlossene [PR #80](https://github.com/tobiasfranziskus/Check/pull/80) dokumentiert ebenfalls einen negativen B8p-Endverbrauchsprämienversuch mit anderen Emissionsobergrenzen. Diese getrennte Prüfung #82 fügt nur die liefergebundenen Mengenbegrenzungen, den Fonds-Transfervergleich und den aktuellen physischen Lagerendzustand hinzu. **Kein zweiter Roadmap-/Projektstatus-PR**: der bestehende docs-only-PR #78 erfasst bereits das gemeinsame negative Grundresultat.

**Originalkopfgeldquellen separat bilanziert:** Im Seed42-Kontrollarm sind **6.360 ISK** und im Seed7-Kontrollarm **4.800 ISK** im Originalkern als `state.stats.kopfgeld` gemintet. Das sind **bestehende, reale Piratenabschussprämien**, keine B8p-Endnachfragezahlung. Je Gegenvariante ändern sich Kopfgeldsummen durch tatsächlich anders verlaufende Kämpfe; der Runner prüft stets `state.minted === state.stats.kopfgeld + zusätzliches B8p-Mint`, und die unabhängige Gesamtformel `Σ owner.cash = initialSupply + minted - burned`. In `m_core_sicherheit` besitzen die beiden Kopfgeldbuchungen nach Codeinspektion **keine separate explizite globale Emissionsobergrenze**; das ist ein gesondert zu prüfendes langfristiges Modell-B-Audit und keine hier angefasste Regel.

## Bewertung und nächste Gates

**[NEGATIV]** In beiden festen Krisenseeds sind die NPC1/2-Händlerflotten in sämtlichen Armen vor Tag14 ausgestiegen, und **alle sechs Verbrauchsstationen bleiben nach 90 Tagen bei beiden lebenswichtigen Waren im Mangel**. Die ursprüngliche Marktdynamik benötigt neben Nachfrage-/Budgetzahlungen ausreichenden Handel, Schiffsersatz, Arbeitsfinanzierung und funktionierenden Warenfluss. Eine allein auf Verbrauch reagierende Zahlung kann die Versorgung **nicht selbst starten, wenn keine Güter mehr konsumiert werden können**. Das globale Zahlbudget bleibt großteils ungenutzt.

**[OPTION/EMPFEHLUNG]** Keinen dieser isolierten Endnachfrage-Arme in Produktcode übernehmen; Modell B bleibt Ziel, konkrete Emissionsregel bedarf Nutzerfreigabe. Als nächste Analyse **vor einer erneuten Geldregel** die Warenprovenienz und ein **finanziertes, nachweisbar ausgeführtes Beschaffungs-/Lieferereignis** samt realem Marktpreis, bereits vorhandenen Käuferbudgets, Transportfinanzierung und Depotablösung gemeinsam prüfen. Bereits bestehende Kopfgeldemissionen sind im globalen Emissionsbudget mitzuberücksichtigen. Erst bei positivem Gesamtsystem-Gate 13×90-/365d-, Hash-, Save/Migrations-, Echt-iPad-/NAS-Tests; kein Spieler-Sparlimit, individuelle Konkursrettung oder Gratis-Minerschiffe.
