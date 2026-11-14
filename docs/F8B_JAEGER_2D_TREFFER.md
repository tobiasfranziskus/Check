# F8-B · 2D-Zielprobe mit echtem Projektilflug – Forschungsstand

**[DRAFT / ANALYSE · 14.11.2026]** Aufbau auf [F8-A #332](https://github.com/tobiasfranziskus/Check/pull/332) und damit indirekt K13/F6 #329. F7-Codex [#331](https://github.com/tobiasfranziskus/Check/pull/331) bleibt konfliktfrei.

## Gelieferter spielbarer Abschnitt

Unter `prototypes/f8-jaeger/index.html` kann der Pilot den bereits in F8-A vorhandenen Trainingsjäger im Original-F6-Ganzzahl-Flugkern starten, abdocken, manuell steuern, abbremsen, einen festen Übungsort anfliegen, von dort die **einzige unbewaffnete Trainingsdrohne** mit drei echten, zeitlich versetzten Geschossen treffen und zur Station zurückkehren.

Neue ausschließliche Trainingslogik in `prototypes/f8-jaeger/f8-treffer.js`: `fighterFire` mit strikter Eigentümer-, Schiffs-ID-, Befehls- und Dockprüfung; Forschungswerte 45 Zielschaden, 135 Drohnen-HP, 20.000 Raum-Punkte pro Schritt, 35 Schritte Flugzeit, 22.000 Trefferabstand und 16 Schritte Nachladen. Jeder Schuss folgt dem **tatsächlichen** `flug.x/y/kurs`-Körper, den F6 bewegt; keine aus dem Canvas errechneten Treffer. Schüsse außerhalb der Reichweite verfallen spurlos. Bis zu drei gleichzeitige Geschosse, auditiertes Ziel-HP-Konto und persistierbare `{schuss,tick,schaden,hp}`-Belege im isolierten Trainingszustand. `F8JaegerTraining.audit` prüft die strukturellen Grenzen, nicht wirtschaftliche Forderungen.

Der Browser zeigt Drohnen-HP, Schuss-/Trefferzahl, Projektile, Nachladezustand und eine touchbedienbare Feuertaste. Zwei Klicks in derselben Sekunde erzeugen genau einen Schuss. Nach Treffer 3 wird die Feuertaste für das deaktivierte Trainingsziel gesperrt. Ursprüngliche F8-A-Schub-, Kurs-, Dock- und Navigationslogik unverändert.

## Wirtschaftliche / konzeptionelle Sperren

**Die Trainingsdrohne ist kein Pirat. Der Trainingsjäger ist kein echtes Wirtschaftsschiff.** Es existieren bewusst keine `owners`-, `ledger`-, `rulesVersion`-, `minted`-, `burned`-, `kopfgeld`-, `xp`- oder Geldfelder. Es gibt weder rechtlich finanzierten Waffeneinsatz noch Belohnung, Munition, Pilotendienst, echte NPC-Treffer, reale Schiffsverluste oder Piratenspawn. Die neuen Schadens-/Reichweiten-/Nachladezahlen sind **[OPTION]** für die Forschungsübung, kein beschlossener Produktwert.

Der alte Regel22-Kampf [#178](https://github.com/tobiasfranziskus/Check/pull/178) arbeitet mit einem anderen abstrahierten Core-Kampfmodell und bezahlt tatsächlich vorfinanzierte Jagdstunden. Er wurde nicht unbesehen durch diese 2D-Drohne ersetzt. Die bereits dokumentierte alte Kopfgeldemission [#174](https://github.com/tobiasfranziskus/Check/pull/174) wird nicht übernommen.

Es wurde weder die Rule200-Jägerindustrie vorgetäuscht noch eine kostenlose Hülle in die echte Spielwelt geschmuggelt. Der gemeinsame W0–W5-Originalkern, Browser-Saves und F7 bleiben unangetastet. Ein späterer echter Jäger muss zuerst aus physischer, vollständig finanziert beschaffter Silizium-/Bauteil-/Material-/Jägerproduktion stammen und zu korrekten 900 ISK gekauft werden; erst dann ist die autoritative Kampfanbindung legitim.

## Tatsächlich ausgeführte Kontrollen

- Direkte isolierte JS-Ausführung (V8): Dock-Abschuss verboten, Anflug-Zeitmarke 265 unverändert, drei echte Trefferbelege bei Sekunde 266/282/298, 135 → 90 → 45 → 0 HP, Nachladeablehnung ohne Mutation, manipulierte HP abgelehnt, echte Original-Dock-Rückkehr nach dem Schießen auditiert.
- Neue Node22-Tests `tests/f8-jaeger-treffer.test.mjs`: Schussautorisierung, Reichweitenablauf und Fehlschuss, Treffer-/Buchbelege, negative Manipulationen, Replay, JSON-Roundtrip. Vorhandene F8-A-Tests bleiben Bestandteil desselben CI-Laufs.
- Bestehende Chromium-/WebKit-Touchprüfung `tests/f8-jaeger-fluguebung-browser.cjs` für vier Größen pro Engine um wirkliche Feuertasten-Taps, 16-Sekunden-Sperre, 3 Projektiltreffer, Buch-HP, Deaktivierung und Neustart erweitert.
- **CI vor Abschluss dieser Ergänzung noch ausstehend**. Keine Aussage über tatsächlich ausgeführte Node22-/Browser-Prüfungen, bevor Actions bestätigt.
- Echte iPad Safari/NAS weiterhin offen; keine Merges, kein Deployment.

## Nächste Entwicklung

1. W5b-Herkunft und Siliziumversorgung [#173](https://github.com/tobiasfranziskus/Check/pull/173) in **isolierter Regel200-Forschung** mit korrekter Buchungskette / 13×90-Tage-Negativszenarien anschließen; keine kostenlose Silizium-/Jägerreserve.
2. Vollständig finanzierte Hülle und Besitzer `house` bzw. echten NPC-Pilotenvertrag zur Original-Weltflugsteuerung verknüpfen; echte bezahlte Flug-/Waffendienstminute.
3. Echte Jäger/Piraten nur aus realem Bestand gegenüberstellen, Waffenereignisse und Verluste im gemeinsamen Core auditieren; 2D-Trefferregel erst nach gesondertem Produktbeschluss übernehmen.
4. Kopfgeld nur als einmalig bestätigten, vorfinanzierten Transfer aus einer realen Auftraggeberkasse; keine unkontrollierte Mintingquelle.
