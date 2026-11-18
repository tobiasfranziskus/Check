# P3 – Reiner Original-Test: zweiter Werftfrachter in Betrieb

**[DRAFT / 18.11.2026]** Ergänzt die über [#500](https://github.com/tobiasfranziskus/Check/pull/500) veröffentlichte Mehrschiff-Auswahl um einen tatsächlichen Wirtschafts- und Transportbeleg. Keine Änderungen an der Spielwelt, den Preisen, Löhnen, NPC-Disponenten, Schiffen, Beständen, Buchungs-, Speicher- oder Spielregeln.

Aus dem autoritativen S02/Seed42-Regel204-Zweitfrachter-Testfixture erzeugt der Wirtschaftskern den ersten W5-Frachter `sh004`, kauft und überführt ihn wirklich, erledigt neun echte 50-Eis-F4-Rundfahrten und kauft in Weltminute 3160 einen zweiten tatsächlich gebauten Frachter `sh010` für weitere 750 eigene ISK. In dieser Fortsetzung prüft der Spieler für **`sh010`** bis zu 24 weitere reale Wirtschafts-Spielstunden in 10-Minuten-Originalschritten:

1. Ein echtes vorfinanziertes `reposition-sh010`-Angebot, dessen Originalkosten 60 ISK sind; 60 reale Flugminuten, W5ac-Beleg, Eigentum und echte Ankunft in Aldera. Die Hülle behält ihre authentische Nadir-Herkunft.
2. Ein neues vom selben Original-J8 signiertes `freight-sh010`-Angebot mit 50 existierenden Eis; vollständiger 120-Minuten-Hin-/Rückflug mit 120 ISK bezahlt an einen privaten Piloten und 240 ISK verbuchtem Frachttarif. Gleichzeitig bleibt das Eigentum an `sh004` bestehen. Altes F4-Journal: neun abgeschlossene Verträge von `sh004`; neues Journal: genau ein vollständiger F4-Vertrag von `sh010`.
3. Strenge Original-Audits: 33.000 ISK Weltgeld und Mint/Burn 0, Geld/Waren/W3–W5/W5ac/Schiffseigentum, echte Frachterwertminderung, separierte Ursprungs-ID, Save/Load, deterministischer Hash und zwei einzeln lesbare Schiffs-Frachtbücher.
4. **Negativbefund zulässig:** Hat der echte Markt innerhalb des begrenzten Beobachtungsfensters keinen solchen Originalvertrag, dokumentiert der Test die nachgewiesenen Sperrgründe; nichts wird erzwungen. Ohne das neue Gameplay nicht als „bestanden“ melden.

**[QA ausstehend]** GitHub-Node22-/W5-Tests tatsächlich ausführen; reine Forschung, kein Merge und kein Pages-Deploy ohne separate Integrationsfreigabe. Echte iPad-/NAS-Abnahme offen. W6-Dauerstabilität damit nicht nachgewiesen.

## Negativer Erstlauf / originärer Engpass

**[ANALYSE, CI-Kommit `741bdb8`]** 532/533 Node22 bestanden, neuer Test zurecht fehlgeschlagen: Zwischen Weltminute **3160 und 4600** wurde `reposition-sh010` bei **145 von 145** legitimen Angeboten durch `Noch aktive W3-Fracht oder Ueberfuehrung` verweigert. Die Firmenkasse hatte am Ende 5.435 ISK, der Eisbestand in Aldera 92; fehlendes eigenes Geld oder Ware war nicht der Hauptblocker. Bestehende Test-/Wirtschaftssuiten blieben grün, aber **beide vollständigen Workflows endeten `failure`** und zählen nicht als bestanden. Der originale W5ac-Kern sperrt Überführungen bei jeder aktiven W3-Erz- bzw. W5n-Eisfracht sowie parallelen W5ac-Fahrten. Das ist ein gegenwärtiger Kapazitäts-/Belegungskonflikt, noch kein Beweis für einen fehlerhaften Geldkern.

**Abgrenzung:** Der positive Titel „zweiter Frachter im Einsatz“ ist für dieses Szenario **nicht nachgewiesen**. Die neue Prüfversion schreibt beide zulässigen Ergebnisse explizit in das Forschungsprotokoll: `completed` nur mit originalsigniertem Transfer- und F4-Beleg, oder `blocked` mit Belegungshistogramm, tatsächlichen W3-/W5n-/W5ac-Aufträgen, original unveränderten neun Erstfrachten, beiden Schiffeigentümern, allen Core-Audits und kalt importierbarem Save. Ein grüner Test in der Variante `blocked` bedeutet **nur korrekte Negativprüfung**, nicht erfolgreiche Überführung. Kein produktiver Scheduling-/Wirtschaftseingriff ohne separate sachliche Freigabe.

**[QA erneut ausstehend]** Neues Testwerkzeug und Report im folgenden Commit, keine Produktdateien verändert.
