# W6 · Miner-Verschleiß vor der Vertragsbindung [DRAFT]

25.11.2026. Basis: [#625](https://github.com/tobiasfranziskus/Check/pull/625), Head `bf11fcbc3e19e0d1220cecc8e721035c43f43537`. Die Diagnose ist Forschung auf diesem Stack, nicht Bestandteil von main oder Pages. PIR-Arbeiten werden nicht übernommen.

## Befund aus der Basis

S02/U7U8: stillgelegter Miner sh011 mit 22 Erz an Bord; 740 ISK Kaufgeld, 120 ISK Frachtlohn und 530 ISK Werftmittel bleiben gebunden. Der Originalstornobefehl verweigert die Abwicklung. Der 90-Tage-Versuch ist gegenüber der Regel204-Kontrolle deutlich schlechter.

Im K7-Vertragsbefehl werden Angebot und Commit bislang auf **bereits stillgelegte** Hüllen geprüft; die verbleibenden Aktivminuten werden dort nicht gegen die erwartete Auftragsdauer geprüft. `industrieAutoSchritt` und `u7Angebotslage` wählen ebenfalls lediglich nicht stillgelegte Schiffe. Der vorhandene autoritative Rechner `m_core_anlage.restAktivminuten` ist wiederzuverwenden.

## Neuer Nachweis

```sh
node --test tests/w6-miner-verschleiss-diagnose.test.mjs
```

Die Diagnose verwendet unverändert die S02-Gründung und den Verwaltungsplan aus `tools/m4-management-szenarien.cjs`. Sie misst im Minutenraster Rest-/Verbrauchsminuten bei beobachteter Bindung und Erzannahme bzw. Stilllegung, prüft den Originalstornobefehl auf einer Wegwerfkopie und auditiert Geld, Waren und Save/Load. Die Regression fordert einen identischen Wiederholungslauf und den bekannten Negativbefund. 50 reine Förderminuten sind nur eine notwendige Untergrenze; die reale An-/Rückreise und Wartezeiten kommen hinzu. Erfolgreich beobachtete Minuten sind keine allgemeine Garantie.

**Ausführungsstatus bei Erstellung:** neuer Test noch nicht ausgeführt. CI und Auswertung der konkreten Minutenwerte offen; kein neuer Stabilitätsnachweis.

## Nächster Schritt nach grünem Diagnosebeleg

1. Reale Flug-/Förderminuten aus der Diagnose und dem autoritativen Flugplan abgleichen. Keine empirisch willkürliche Sicherheitskonstante als garantierte Dauer ausgeben.
2. Isoliert in U7/U8 einen deterministischen Kapazitäts-/Verschleiß-Gate bei Kandidatenauswahl, Angebot und erneut vor Commit einbauen; auch Frachter-Rundreise prüfen. Alternativkandidat mit echten Eigentumsrechten und Ressourcen verwenden.
3. Ablehnung vor jeder Reservierung; atomarer Savevergleich, unveränderte Standard-/Regel207-Hashes, Grenzfälle, erneute Prüfung nach Signatur, kein stilles Upgrade/Verkauf/Löschen einer Hülle.
4. Standard/K7/S02 gepaart bis 7/30/90 Tage; 365/730 erst bei belegtem Fortschritt. Weitere Blocker ausdrücklich melden. Bestehende Teilware/gebundene Arbeit nicht durch dieses Gate nachträglich abwickeln; dafür bleibt eine gesonderte Produktentscheidung erforderlich.

Keine Änderung an Core, Regelversion, Save, Preisen, Nachfrage oder Spieloberfläche. Die Roadmap-Priorität bleibt unverändert.
