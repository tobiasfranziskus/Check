# W6a – Reale Lohnnachfrage entsperrt eine vollständig finanzierte Folgefracht

> **[ANALYSE / Original-Core-Ausführung geprüft · 10.11.2026]** Die vollständige Core-Befehlsfolge samt sämtlichen Testassertions wurde **tatsächlich in einer isolierten V8-JavaScript-Ausführung** aus den auf GitHub überprüften Originaldateien `prototypes/w5ac/rule191-w5-ferry-core.js` und `tests/w6a-lohnnachfrage-reaktiviert-fracht.test.mjs` ausgeführt: **Seed 42 und 7 bestanden**, einschließlich doppeltem Replay, Geld-/Waren-/Wasser-/Privatlohn-Audit und Save-/Load. Seed42-Hash `064f14df7ea84c77`, Seed7-Hash `491e55fe3005cb18`. Für beide 406 → 476 → 490 Käufer-ISK, Rückfluss 84 ISK aus sechs freiwilligen Käufen, Wasserumsatz 224 ISK, 33.000 Welt-ISK, 0 Mint, Tick480/2 Eisflüge, 100 Eis geliefert und 360 bezahlte Pilotflugminuten. **Nicht** als Node22-CI- oder echtes iPad-Testergebnis ausgeben.

> **[TEST-CI ERSTVERSUCH]** Auf Vorcommit `d5ce682b` scheiterten [W6a-CI #42852274736](https://github.com/tobiasfranziskus/Check/actions/runs/42852274736) und [JS-Regression #42852274667](https://github.com/tobiasfranziskus/Check/actions/runs/42852274667), ausschließlich weil der neue Test ein **finanziertes** 490-ISK-Angebot bereits von `pilotIceFreightQuote` im **abgelehnten** Zustand erwartete. Bei 406 ISK gibt der Core zu Recht nur `{ok:false,grund:'Nadir kann Eis und Hin-/Rueckfracht nicht bezahlen'}` zurück. Der [Korrekturcommit `02340703`](https://github.com/tobiasfranziskus/Check/commit/02340703e9dbd804be750d9e91eaf7bd2140df9d) prüft zuerst die echte Ablehnung und **erst nach** sechs bezahlten Wasserkäufen das tatsächlich finanzierte Original-Angebot. Kein Testwert, Startkapital, Core, Preis, Waren- oder Lohnbetrag wurde geändert.


**[DRAFT / ANALYSE · 10.11.2026]** Ein enger vertikaler Nachweis mit dem **unveränderten Original-Regel195-Core auf dem veröffentlichten W0–W5-`main`**. Forschung zu W6, **keine** automatische Nachfragefunktion, kein neuer Wirtschaftskern, keine neue Geldemission, keine Produktregeländerung. Codex arbeitet unabhängig am Autosave, Claude gegebenenfalls getrennt an Flugsteuerung; diese beiden Bereiche werden **nicht** geändert.

## Zu prüfende echte Kette

W1 echtes Spieler-Eis → Verkauf in Aldera → echte, mit Käufer- und Speditionskapital vorfinanzierte W3-Eis-Rundfracht → W4/W5-Wasserproduktion in Nadir aus wirklich geliefertem Eis und bezahlten Arbeitsminuten → persönliche Pilotengehälter → freiwilliger Kauf von vorproduziertem Wasser aus eigenen Lohnkassen → **echte Rückzahlung an Nadirs Käuferkasse** → zweite Eisfracht nur dann, wenn die Original-Core-Liquiditätsbedingung wieder erfüllt ist.

Das Forschungsszenario verwendet von Anfang an **1.536 ISK Nadir-Käuferkapital und 2.000 ISK Speditionsstartkapital**, wie durch `createPrivateWageResearch` auf die ursprüngliche, insgesamt **33.000 ISK** umfassende Welt verteilt. Das ist **kein** zwischenzeitlicher Zuschuss: Weltgeld = 33.000 ISK, minted = burned = 0 in jedem Kontrollpunkt.

**Sequenz:** Ein echter Frachter, ein Spieler-Miner, 50 Eis fördern, echten Erz-Rundflug 120 Minuten entlohnen, ersten Eisflug starten, erste Wassercharge (10) produzieren und 10 Wasser für 140 ISK aus zwei verdienten Pilotenlöhnen erwerben. Nach den restlichen Flugminuten zweite echte Wassercharge (10) herstellen. Beide Piloten dürfen ihre nicht ausgegebenen Einkünfte behalten. Nächste Eischarge aus 50 echten Förderminuten, anschließend Verkauf an Aldera.

Bei Tick360 hat Nadir ohne weitere private Käufe **406 freie ISK**, benötigt aber nach Original-Core-Angebot **490 ISK** für die nächste Eisfracht, plus **120 ISK** bereits bei der Spedition vorhandene echte Arbeitsreserve. Der Frachtauftrag muss jetzt atomar abgelehnt werden. Auch **fünf** weitere, freiwillig aus verdienten Löhnen bezahlte Wasserkäufe bringen nur 70 ISK in Nadirs Käuferkasse zurück: **476 ISK**, weiterhin echte Ablehnung. Erst ein **sechster** freiwilliger Kauf für 14 ISK hebt Nadir auf **490 ISK**, ohne andere Eigentümer anzuzapfen. Erst dann darf die zweite Eisfracht für **490 Käufer- und 120 Arbeits-ISK** starten.

**Erwarteter Nachweis am Tick480:** 2 real abgeschlossene Eis-Rundflüge, 100 Eis geliefert, 120 Erz- + 240 Eis-Fluglohnminuten (=360), 20 Wasser produziert, 16 gekauft und verbraucht für 224 ISK, 4 Wasser auf Lager, jeweils 8 ISK verbleibende private Ersparnis bei Erz-/Eispilot, keine Geldemission. Alle Regeln und Referenzen sind unverändert; Seed42/7 müssen jeweils zweimal exakt gleiche Hashes und Belege ergeben. Der Test prüft bei jedem Schritt tatsächliche Core-Audits, Geldsumme und Abweisungen ohne Mutation; ein Save/Load-Roundtrip vor und nach Freigabe wird separat geprüft.

## Bedeutung und Grenze

**W6-Hypothese bestätigt nur, falls der Test tatsächlich grün ist:** Ein echter freiwilliger Endverbraucherkauf kann einen zuvor unterfinanzierten nächsten W3-Nachfrageauftrag **entsperren**, ohne neue ISK oder fremde Mittel. Das ist ein realer, möglicher Kreislauf und erweitert unseren belegten Handlungsspielraum. **Nicht bewiesen:** selbsttragender 90-/365-Tage-Dauerbetrieb, wiederholbare Nachfrage nach unbegrenzt vielen Zyklen, Module/Jäger/Schiffersatz, alle wirtschaftlichen Regime oder automatisch kaufende NPC-Haushalte.

Die spätere mögliche Produktentscheidung (NPC-Konsumbudgets/Bedürfnisse, Kapitalmodell, Preise) ist bewusst **nicht** vorweggenommen. Keine neue Verkaufs- oder Kaufpflicht, insbesondere kein erzwungener Konsum der Piloten.

## Prüfstatus

CI-Status und deterministische Referenzhashes werden nur aus **ausgeführten** GitHub-Workflowläufen ergänzt; `node --test tests/w6a-lohnnachfrage-reaktiviert-fracht.test.mjs` sowie gesamtes `node --test tests/*.test.mjs`. Kein Merge und kein Deployment ohne neue Freigabe.
