# M4-U7/U8 · Managementabnahme [FORSCHUNG]

Auftrag [#575](https://github.com/tobiasfranziskus/Check/issues/575). Basis ist `main d824040e20e0f9a69188cbe34282901ed6497976` mit [#574](https://github.com/tobiasfranziskus/Check/pull/574) auf `7f5f6407748fa7199c45fc6910e53938354376bc`. Alle neun zu diesem Forschungshead gestarteten PR-Workflows waren erfolgreich. Die vollständige lokale Node22-Suite auf der Basis ergab 592/592. Der Folgebranch behält die Regel204- und Regel207-Produktpfade bei. Die Änderungen an der gemeinsamen Streckensperre gelten im U7/U8-Profil. Die ursprüngliche Karriere bleibt beim Kopieren und beim Wechsel der Speicherplätze bytegleich.

## Zwei beobachtete Werftverläufe

| Prüfung | Beleg |
| --- | --- |
| Exakter Gegenversuch zum 48-Fahrten-Stau | 50 Erz nach Nadir, 22 Wasser zurück, 240 ISK Erz- und 22 ISK Rückfrachttarif, 120 ISK Fluglohn. Die 49. Eisfahrt liefert weitere 50 Eis für 240 ISK Fracht und 120 ISK Lohn. Der Frachter kehrt zurück, die Flug-, Kauf- und Rückfrachtreserven sind ausgezahlt. Tick 6792, Hash `721e4959dbfa1ec4`. Nadir hat 140/150 Eis, die 50. Eisfahrt ist gesperrt. |
| Drei erneute Prüfungen ab Tick 6792 | Die tatsächliche U7-Eignungsprüfung lief auf dem gleichen Kernstand je 1.440 Minuten und wurde vollständig wiederholt. 4.320 Ablehnungen wegen der gebundenen Werftreserve von 530 ISK im ursprünglichen Kernversuch ohne ausgelöste J8-Werftfolge. Außerdem liegen 40 Erz in Nadir. Keine Scheinbestellung, keine zusätzliche Eis- oder Erzfracht, unabhängige Audits und identischer Replay. Hashes `415f3ff0abb17055`, `26ab6c554e04158f`, `4a94156471ef645e`. |
| J8-Kopie desselben 48-Fahrten-Saves | Freiwillige Zustimmung am echten Hausangebot. 50 Erz und 22 Wasser tatsächlich geliefert. W4 verarbeitet 10 Erz zu 5 Material für 20 ISK Lohn. W5 verbraucht 5 Material, bezahlt 500 ISK Material und 30 ISK Werftarbeit. Eine Hülle entsteht, Kauf-/Flug-/Werftreserven leer. Bei Minute 6542 Hash `c723473708b4b688`, Haus 12.445 ISK. Asterion hat die Hülle bereits im Fertigstellungstick gekauft. Hauskauf wird atomar abgelehnt. |
| Separater S02-Start mit bestehenden Konzernpolitiken | Nach fünf Weltstunden liegt eine bezahlte Hülle frei in Nadir. Haus kauft `sh004` für 750 ISK in Minute 300. Dieselbe Hülle erhält eine finanzierte Überführung von Minute 360 bis 420, Lohn 60 ISK. Anschließend ist die erste bezahlte F4-Fahrt von Minute 600 bis 720 belegbar. 50 Eis treffen in Minute 660 ein, 240 ISK Fracht und 120 ISK Fluglohn sind gebucht. Hash `63a692db81b4d3f3`. |
| Weitere Arbeit mit `sh004` | Im S02-Lauf 12 bezahlte Eisrunden und zwei Haus-Erzrunden. Je 50 Erz und 41 Wasser pro Haus-Industriefahrt, 240 + 41 ISK Tarif und 120 ISK Fluglohn pro Runde. Abschluss in Minute 6.853 und 12.733. Beim Erstkauf verwendete der Spieler eine frei verfügbare Hülle, während die Hülle aus dem 48-Fahrten-J8-Lauf ihrem NPC-Käufer verblieb. |

## Reproduzierbare Verläufe

```sh
node tools/m4-management-szenarien.cjs S02 730 42
node tools/m4-management-szenarien.cjs alle 90 42 u7 konzerne
node tools/m4-management-szenarien.cjs S02 90 7
node tools/m4-management-szenarien.cjs S02 90 123
node tools/m4-management-szenarien.cjs S02 90 42 paar direkt
```

`konzerne` verwendet die bestehende Regel204-S02-Konfiguration mit eigener NPC- und Siliziumpolitik. Die Startkassen und Waren stammen aus der Originalwelt. Der Manager gibt den Unternehmen fünf Weltstunden Vorlauf und entscheidet danach alle 60 Spielminuten. Er nimmt real angebotene Hausfracht an, bietet freiwillig Wasser an, prüft eigene Überführung und kauft physische Hüllen aus freiem Lager. Danach betreibt er legal bezahlte Eisförderung und Fracht, soweit die Kasse, Dock und Ware es erlauben. F4-Folgeaufträge bevorzugen die bereits gekaufte Nadir-Hülle. Die Standardkontrolle trifft verfügbare Entscheidungen nach derselben Reihenfolge. `direkt` führt die Krisenparameter ohne zusätzliche Konzernpolitik und ab Minute null aus. S08 verzichtet in U7 zusätzlich auf die freiwillige Hauszustimmung zur Wasserrückladung, damit der Versuch auch dort den Verkehrsausfall prüft. Keine Spielerautomatik in der Oberfläche.

Das Werkzeug erfasst Kassen pro Konto, gebundene Gelder, Warenbestände, aktive Aufträge, Liefer- und Lohnbelege, Aktivminuten, Restbuchwerte, Eigentum, Stilllegungen und Ablehnungsgründe. Es prüft Geld, Waren und Eigentumsbücher im Wochenraster und macht an den Messpunkten einen exakten Save/Load-Roundtrip. Ausführbare Folgefrachten zählen erst als Erfolg mit einem abgeschlossenen Beleg derselben gekauften und überführten Hülle.

| S02, Seed42, U7/U8 | W3 gesamt | Eisrunden gesamt | Wasser retour gesamt | W5 gebaut | Hauskasse | Gesamt gebunden | Hash |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 7 Tage | 2 | 74 | 2.353 | 4 | 7.288 | 307 | `2281d74dd8429a94` |
| 30 Tage | 3 | 137 | 4.337 | 6 | 7.329 | 1.390 | `478696c8bbb0c153` |
| 90 Tage | 3 | 137 | 4.337 | 6 | 7.329 | 1.390 | `5c2750ddcb1af122` |
| 365 Tage | 3 | 137 | 4.337 | 6 | 7.329 | 1.390 | `51abf0dbad3b0edb` |
| 730 Tage | 3 | 137 | 4.337 | 6 | 7.329 | 1.390 | `6a050e671330da20` |

Alle 13 U7/U8-Krisenszenarien erreichten Tag 90 mit 33.000 ISK Weltgeld und 0 Emission/Senke. Zwischen 1 und 13 abgeschlossene W3-Frachten, 3 bis 704 Eisrunden und 1 bis 34 gebaute Hüllen. In S08 kam kein Wasser zurück, in S09 stoppt die Verarbeitung. S11 erreichte 13 Erzfrachten, 704 Eisrunden, 34 Hüllen und 64 Stilllegungen. Auch dort waren am Endpunkt 1.390 ISK gebunden. Der erste Hauskauf und eine bezahlte Folgefahrt waren in jedem Lauf mit der gewählten S02-Eröffnungsstrategie möglich. Die Spanne beschreibt diese Versuche, aus ihr folgt keine Absatzgarantie.

## Blocker und Regelentscheidung

Im S02-U7/U8-Lauf bleibt ab dem dritten Haus-Industrieversuch die Vorbestellung stehen. Meridian-Miner `sh011` ist nach 2.011 Aktivminuten im Aldera-Dock stillgelegt. Er führt 22 Erz, die vereinbarte Charge benötigt 50. Nadir hat 740 ISK Käufergeld, das Haus 120 ISK Fluglohn und die Werft 530 ISK gebunden. Die bestehende Stornoprüfung von Nadir lehnt auf einem Spielstandklon ab, weil bereits Ware vorhanden ist. Der Hausmanager kann weder für Nadir stornieren noch die fremde Teilladung übertragen. Zeitfortschritt allein änderte die belegten Abschlusszahlen ab Tag 30 bis Tag 730 nicht. Die UI zeigt diesen Zustand mit dem stillgelegten Miner und der bestehenden Bindung.

**Empfehlung zur Integration:** Forschung getrennt halten. Für einen öffentlichen Managementkreislauf erst über die Behandlung vorfinanzierter Teilchargen bei Stilllegung entscheiden. Sinnvolle Regeloptionen sind ein ausreichend einsatzfähiger Miner vor Vertragsbindung mit Überprüfung der Restlaufzeit sowie ein freiwilliger, finanziell und physisch belegter Übergang auf eine neue Hülle oder eine Abwicklung der bereits geleisteten Arbeit durch die Vertragsparteien. Eine Mindestrestlaufzeit allein löst bereits offene Teilchargen nicht. Auch die kurze reale Marktverfügbarkeit bleibt eine strategische Entscheidung. Preise, NPC-Kaufreihenfolge, NPC-Eigentum und Spielstandmigration bleiben unverändert.

## Integrationsprüfung

- `welt-kern.js` nutzt für die Anzeige und das tatsächliche NPC-Angebot dieselbe Angebotsprüfung. Ein gelieferter Hausvertrag benötigt historische Zustimmungen und einen bezahlten W3-Beleg. Der Kern validiert Kauf, Storno und Auftrag erneut, wenn der Spieler handelt.
- `rule200-k7-industry-core.js` schließt W3 und F4/F6 während einer bereits belegten U7/U8-Überführungsstrecke. Die Originalregelpfade bleiben kompatibel. Die Forschung schützt auch die Überführung vor stillgelegten Hüllen.
- Die Managerkarte führt in die vorhandene Industrie- und Werftakte. Auftragsrückmeldung stammt aus echten Frachtbelegen. Die Karte zeigt Dock, Ladung, Status, Sperrgrund, Werftangebot und vorhandenen Kaufbeleg. Die Forschung erteilt keine automatische Spielerzustimmung und verwendet für Pausen ausschließlich den Original-Stopp.
- Negativprüfungen umfassen Fremdrollen, ungültigen Abschlussimport, doppelte Zustimmung, doppelte Rückfracht, falschen Eigentümer, parallele Reservierung, Fremdschiff, Stilllegung, Storno vor und nach bezahlter Arbeit, Doppeltipp, Replay und Profiltrennung. Lokale Spielstände bleiben auditierte JSON-Daten. Die gespeicherten Zustimmungen sind keine kryptographisch authentifizierten Signaturen.
- Vor Integration sind eine ausdrückliche Vertragsregelentscheidung, ein gezielter PR gegen den dann gültigen `main`, ein Backup und das gemeinsame Abnahmegate erforderlich. Erst danach folgen Pages-SHA und unabhängiger 60-Minuten-Blindtest [#570](https://github.com/tobiasfranziskus/Check/pull/570). Physisches iPad Safari und privates NAS bleiben separat offen.
