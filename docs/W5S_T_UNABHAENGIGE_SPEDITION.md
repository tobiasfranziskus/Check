# W5s-t – eigenständig finanzierte Nachfolgespedition ohne Gratisflotte

**[DRAFT/ANALYSE/OPTION · 06.11.2026]** Gestapelt auf [W5s-s #223](https://github.com/tobiasfranziskus/Check/pull/223), unabhängiger [Draft-PR #224](https://github.com/tobiasfranziskus/Check/pull/224). Ausschließlich Forschungsregel32/Schema8 mit explizitem `rules.w5s.independentSuccessor=true`, produktives `main 5a56d9d7` und GitHub-Pages-Teststand mit v0.12.5-Archiv unberührt. Kein Produktbeschluss, kein Merge oder Deployment.

## 1. Ausgangslage [belegt W5s-s]

Die R32-Stresswelt hat nach Tag365 drei tatsächlich bezahlte W3-Erzfrachtabschlüsse, 123 bezahlte Eisfrachten, 6.068 bezahlt gekauftes Wasser und 7 aus realem Stationsgeld bezahlte Wartungen. Die alte `transport`-Spedition besitzt dann keinen Frachter mehr, aber lediglich 240 ISK. Ein Ersatz benötigt **750 ISK echte Werfthülle + 60 ISK bezahlte Überführung + 120 ISK Betriebskapital = 930 ISK**, also fehlen ihr **690 ISK**. Nach Tag180 sind Nadir-Station und Erzgroßhändler nicht automatisch Eigentümer der insolventen Spedition. Insbesondere die 17.966 ISK beim Großhändler sind **fremdes Privatkapital**, keine kostenlose Unternehmensrettung.

Die bestehende W3-/W5n-Fracht und W5r-Ersatzverwaltung sind *fest* auf den alten Rechtsinhaber `transport` eingestellt. Ein bloßes Umbenennen des Schiffseigentümers oder stilles Leiten von Frachtmargen an ein anderes Konto verletzte die bestehenden Arbeits-, Investitions- und Auditbücher. Deshalb ist der neue Inhaber zunächst **nicht zur regulären W3-/W5n-Beförderung berechtigt**.

## 2. Neue, echte NPC-Firma als kleiner finanzieller Vertikalschnitt

Im explizit eingeschalteten R32-Forschungsprofil existiert ein neuer autoritativ validierter Befehl `shipFoundCarrier` und ein streng begrenzter Folge-`shipBuy` für die neue Firma `w5s_carrier2`. Gründungs-/Kaufplan und Unternehmensbuch sind über `m_core_index.w5sNachfolgeStatus(...)` und `w5sFinanzStatus(...).successor` ausschließlich **lesend** einsehbar.

Der private Investor muss vorher nachweisen:
- Bereits mindestens zwei tatsächlich verlorene alte Frachter, mindestens zwei abgeschlossene bezahlte W3-Erzfahrten und eine **eigene** Kapitallücke beim alten Transportkonzern für den nächsten vollständigen Ersatz.
- Einen echt zahlungsfähigen W5n-Eis-/Wasser-Endkunden und eine vorhandene volle Eischarge im Quelllager, ohne angenommene zusätzliche ISK.
- Mindestens **930 ISK eigenes** unbelastetes Zeichnungskapital plus 500 ISK verbleibendes Erz-Käuferbudget.
- **Ein weiteres wirklich zuvor aus W4-Material, W5-Werftlohn und physischem Bestandsledger gebautes, noch unverkauftes Frachtschiff in Nadir**. Keine Zeichnung auf eine nicht verfügbare Hülle.

Nur nach explizitem gültigem Core-Befehl fließen 930 vorhandene Investor-ISK an ein **neues, separates Unternehmen**, nicht an die alte Spedition. Das Unternehmen bezahlt anschließend 750 ISK für **eine echte vorhandene W5-Hülle** über den normalen validierten `shipBuy`. Der Original-W5-Werftverkäufer erhält den Preis, das neue Schiff bekommt seine eigene neue ID, seinen eigenen eingetragenen Eigentümer und bleibt mit 180 ISK eigenen Mitteln für späteren Überführungslohn und mindestens einen Auftrag ausgestattet. Alle Eigentumsbelege, Unternehmensbücher und Verkäufe sind in einem gespeicherten `state.w5s.successor` nachweisbar.

**Schutz vor Kontenvermischung:** W3/W5s rekonstruieren weiterhin nur die wirklich von `transport` gezahlten Schiffskäufe. Ein rechtlich anderer, separat finanzierter Hüllenkauf darf niemals als operative Alt-Speditionsausgabe gelten. Die originale W5-Werft prüft weiter ihre gesamte physische Verkaufskette und die Verkäufererlöse. Der Erzgroßhändler-Audit führt die neue risikobehaftete Kapitalzeichnung getrennt von Erzumsatz, alten Beteiligungen und Geldemission. Gründungszweck und Schiffskauf sind nicht erneut gratis wiederholbar. Keine neuen Laufzeitabhängigkeiten oder Save-Regeländerungen.

## 3. Reale Krisen-Diagnose und Grenze

[TEST] Der lesende Vergleich Seed42/7 über jeweils 365 Tage zeigt ohne neue Unternehmensgründung ab Tag180 eine getrennte Doppelsperre: kein produktiv angeschaffter Frachter am Markt und ein Wasserhaushalt mit **nur 11 ISK**, also nicht einmal dem echten Preis einer weiteren Wassereinheit (14 ISK). Trotz Nadir-Kasse von 4.433 ISK und 150 echter Eis im Lager ist das kein Beweis für dauerhaft privat finanzierte Endnachfrage. Die Unternehmensnachfolge **muss vor dem vollständigen Absatzstillstand** gesondert finanziert werden; niemals unendlich später durch Gratisbetankung.

**[TEST – offen bis abschließendem CI-Protokoll]** Neu eingerichtet: 13 Seeds×90 Tage, Seed42/7×365 Tage mit täglichem unabhängigen ISK-, Waren-, Core- und Finanzbuch-Audit, Hashes/Save-Load, Vergleich mit deaktiviertem Flag und unerlaubten Kauf-/Gründungsbefehlen. Ein gesonderter positiver Integrationstest baut selbst eine echte W4-/W5-Frachterhülle und versucht erst danach die vollständig finanzierte Gründung samt Kauf. CI-Ergebnis sowie tatsächlich erreichte Gründung/Ship-ID erst nach ausgeführtem Test ergänzen.

## 4. Nicht erreicht und nächster Schritt

**Noch keine neue zahlende Spedition im W3-/W5n-Frachtkern.** Ohne eigenen, aus tatsächlich bezahlten Tarifen gedeckten Transportvertrag darf das neue Unternehmen weder eine W3- noch W5n-Fahrt starten; der gesicherte Ersatz-Gehaltsetat darf nicht einfach umgebucht werden. Für W5s-u wäre ein sauber nach Eigentümer/Fahrtslot getrenntes, vollständig vorfinanziertes Fracht- und Pilotenarbeitsbuch mit Vergabe echter Kundenverträge, W5r-Verschleiß und unabhängigen Unternehmensaudits erforderlich. Erst eine bestandene 13×90- und 365-Tage-Krisenprüfung inklusive Spieler-Sparen würde einen dauerhaften W6-Wirtschaftskreislauf überhaupt plausibel machen.

Echte Safari-/NAS-Abnahme und Produktpolitik zu Lizenz/Beteiligungsrecht weiter offen.
