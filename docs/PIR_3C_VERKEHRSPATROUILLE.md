# PIR-3c – Verkehrsabhängige Patrouille [FORSCHUNG / DRAFT]
Basis #617 86aa1f44, Produkt-main aa716c46. #616 Reparaturgate und #611 Silizium bleiben getrennt. Void-Echoes-Katalog geprüft, heutige Ziel-/Abfang-/Flug-/Lohnfunktionen unverändert wiederverwendet.

## Befund
Kontinuierliche Patrouille in #617: 240 ISK Startkasse, ab Minute349 keine neue 40-ISK-Reserve, 204 ISK ausgezahlter Pilotlohn, 36 ISK Rest. Später finanzierter F4 (Spedition zuerst, Haus kauft bei Minute300) lokal bei 536–539; kein Angriff. Frühpfad 176–179 mit 48/96 Hülle. Beide F4s bezahlt und auditiert.

## Forschungsänderung
Explizites Node-only Profil 5 (J8 startenPiraten(true,'verkehr')), kein UI-Einstieg, kein Standardprofil, kein neues Geld. Am Dock nur bei authentischem, voll finanziertem Nadir-F4-Vertrag und vier bis sieben Minuten Restreise auslaufen. Verwendet bestehendes nadirVertrag-Gate, aktuelle Hülle und Einsatzfähigkeit. Vertragstermin ist ein privilegierter Forschungs-Proxy für Verkehrshinweise, **keine** implementierte Sensorik, Spionage oder allgemeine NPC-Frachterbeobachtung. Der 7-Minuten-Vorlauf ist ein experimenteller Parameter, nicht freigegebenes Balancing. Unveränderte 40-ISK-Flugreserve, 8-Minuten-Patrouille, reale Flugkörper, Schussregeln, Rückkehr, Lohn- und Geldbuchungen. Kein erzwungener Treffer. Profil 4 und zivile Profile erhalten keine neue Zustandsform oder neue Regel.

## Prüfungen
Bestehende 9 Auditfälle einschließlich Originalhash; beide tatsächlichen Kauf-/F4-Fahrpläne mit neuer Disposition zweimal exakt wiederholen, tatsächlichen finanzierten Überlapp, Rückgabe der Restreserve, Schuss-/Schadensbefund und Original-Frachtbuchung vergleichen. 7/90 Tage ohne authentischen F4: keine Patrouille, keine Pilotzahlung, voller Piratenetat; keine Aussage über dauerhafte Einnahmen. Getrennte Profile und verfälschte Importe ablehnen. Node22-CI bei Erstellung offen. Keine Geräteprüfung, kein Merge oder Deploy.

## Grenzen
Der interne Historienrollback aus #617 und der Reparaturblocker #616 bleiben offen. Geld wird nur gespart, nicht verdient. Vor Spielerfreigabe braucht es eine glaubwürdige beobachtbare Informationsquelle, sichere Schadenshistorie und eine unabhängig integrierte Save-/Wirtschafts-/Browserprüfung. Keine Beute, kein Schwarzmarkt, keine kostenlose Hülle. Zentrale Roadmap und Projektstatus erst im abgestimmten Integrations-/P0-PR nachführen; kein Konflikt mit M4-U4.
