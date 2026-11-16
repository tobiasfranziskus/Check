# P1 – Integration zweier Akademien in eine Karriere [MAIN / PAGES]

**[GEPRÜFT am 16.11.2026]** [PR #441](https://github.com/tobiasfranziskus/Check/pull/441) mit `main 47d59f407c6042c80aebff62e497c33cbcc9bffd` integriert; [Pages-Deploy #43924629083](https://github.com/tobiasfranziskus/Check/actions/runs/43924629083) abgeschlossen und erfolgreich für **denselben Commit**. Sieben der sieben Workflow-Gates grün (bedingte Test-Skips nicht als bestanden gezählt):

- [P1-Akademien, Node22, Chromium/WebKit und je vier Touchgrößen](https://github.com/tobiasfranziskus/Check/actions/runs/43923609070): vorhandenes Karrierespiel + Manager- und Pilotenkurse sowie separater Codex-Importpfad
- [Vollständige JavaScript-/Wirtschaftsregression](https://github.com/tobiasfranziskus/Check/actions/runs/43923609077) und [W5-Altversion/NAS-Build](https://github.com/tobiasfranziskus/Check/actions/runs/43923609086)
- [J4e-Jäger-Sicherheitsbrowser](https://github.com/tobiasfranziskus/Check/actions/runs/43923609036), [J14](https://github.com/tobiasfranziskus/Check/actions/runs/43923609044), [W6/P8a](https://github.com/tobiasfranziskus/Check/actions/runs/43923609033), [W6/P8g](https://github.com/tobiasfranziskus/Check/actions/runs/43923609035)

Alle Testläufe gehören zum Integrations-Head `2b1eba8292fb536fd0ddf088b7745beaf211faa4`; danach keine Produktcodeänderung vor dem Merge. **Wirtschaftssicherung:** Originalweltgeld 33.000 ISK, Mint/Burn 0, autorisierte Käufe/Bergbau/Frachten und getrennte Regel204-/207-Speicher bleiben erhalten. Full-Snapshots sind abgetrennt und ausschließlich bei aktiver Übung angefordert. Ausgangs-main ist [hier gesichert](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-p1-pilotakademie-20261116).

**Die reale iPad-Safari-/NAS-Geräteabnahme wurde nicht durchgeführt.** Chromium/WebKit-Simulationen sind keine Gerätetests. Der ursprüngliche Codex-Draft [#440](https://github.com/tobiasfranziskus/Check/pull/440) wurde ohne Merge als durch #441 ersetzt geschlossen.



## Ziel und technische Grenze
- Originale zwölf Pilotenlektionen aus Codex-Draft [#440](https://github.com/tobiasfranziskus/Check/pull/440) übernehmen und als ausklappbare **Pilotenakademie** direkt in `prototypes/spiel/index.html` in derselben regulären Karriere sichtbar machen. Die acht bereits veröffentlichten [Managerlektionen #438](https://github.com/tobiasfranziskus/Check/pull/438) bleiben vorhanden; gleichzeitige CSS-Nutzung isoliert.
- Es ist **kein** Download/Import erforderlich, wenn die Pilotenakademie auf der Kommandobrücke gestartet wird. Das Standalone-Unterrichtslabor bleibt als separater optionaler JSON-Import-Test erhalten, lädt nur ausdrücklich gewählte, vollständig auditierte Original-Saves und überschreibt kein produktives LocalStorage.
- Ein gekaufter, vom Kern autorisierter Miner/Frachter/Jäger ist Voraussetzung. Ohne Schiff werden alle zwölf Übungsbuttons gesperrt und begründet.
- Kein neuer Geld-/Ware-/Kampf-/Sparmechanismus; kein Tutorialstatus im JSON oder Save-Schema. Virtuelles Duell bleibt virtuell; intersystemische F4-Fracht nutzt den vorhandenen Originalvertrag.

## Originalwelt und Observer
- `J8KonzernSitzung.flugSchritte(n, beiSchritt, beiVollschritt)` besitzt nun einen **optionalen** dritten Callback. Nur bei **aktiv laufender Pilotenlektion** erstellt der ursprüngliche Weltkern am Ende jeder Original-Sekunde ein über `structuredClone(neu)` vollständig **abgetrenntes Beobachtungsabbild**. Eine manipulierte Trainingskopie kann die Geld-/Waren-/Schiffs-/Eigentumsdaten der Welt nicht verändern. Der bestehende eingefrorene Callback für J4d/J4e bleibt erhalten; kein zweiter Tick, kein anderer F6-Bewegungsbefehl, keine zusätzliche Transaktionsberechtigung.
- Volle Beobachtung ist erforderlich für echten Flugmodus, Ziel, Radius, bewegte Folgeschiffe, Ladung und belegte Fracht. Bei inaktiver Lektion entsteht **keine** volle Kopie. Die akademischen Echtzeit-Abnahmen bleiben an Originalticks, Eigentum, bezahlte Flugreserve und Core-Belege gebunden.
- Die Haupt-Spieloberfläche verbindet `PilotenMenue.verbinden` nur mit diesen vorhandenen Zuständen; jedes Kurs-Starten wechselt lediglich ins vorhandene Cockpit, kein zweiter Pilot und keine Belohnung.

## QA / Gate
- **Node22:** bestehende vollständige Regression, zwölf Kursbeobachtungen, neue Gegenprobe mit und ohne Full-Snapshot inklusive absichtlicher Mutation der Kopie: **identische** Originalwelt, Hash, Save und 33.000 ISK.
- **Chromium/WebKit je vier Touchgrößen:** bestehender P1-Karrierepfad (neu kaufen → Pilot übernehmen → Lektion auswählen → Original-40-s-Abdocken → Joystick → Kursabschluss → Aufschalten/Lösen → Manager unverändert → Save/Reload); isolierter Codex-Standaloneimport mit realen und ungültigen JSON-Dateien; F8-/Patrouillen-/W6-Pflichtpfade erhalten.
- Auf separatem Integrations-PR, kein Merge ohne vollständiges grünes Gate für den tatsächlichen Integrationshead. Frühere Main-Version vor Merge sichern. Bestätigten Main und Pages-Deploy getrennt nachweisen. Echte iPad-/NAS-Geräteabnahme bleibt offen.
