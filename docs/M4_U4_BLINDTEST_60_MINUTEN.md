# M4-U4 – unabhängige 60-Minuten-Abnahme des Wirtschaftsmanagers

**[TESTVORBEREITUNG / DRAFT – 22.11.2026]** Kein 60-Minuten-Blindtest durchgeführt, keine neue Wirtschafts- oder Spielregel, keine Spielabnahme. Basis: öffentlich veröffentlichter M4-U3-Code aus [Integration #568](https://github.com/tobiasfranziskus/Check/pull/568), `main 17796d38`; aktueller Dokumentations-`main 41ee2b8d`. [M4-U4 in der Roadmap](ROADMAP.md) bleibt offen.

## 1. Unabhängiger Testauftrag (nur diesen Abschnitt an den Erstspieler geben)

> Öffne https://tobiasfranziskus.github.io/Check/ in einer neuen, isolierten Browsersitzung ohne frühere Spielstände. Spiele **mindestens 60 echte Minuten** ausschließlich die Wirtschaftsmanager-Karriere, **ohne manuelle Pilotsteuerung**. Suche selbst nach Zielen, Bedienung, Navigation, Wirtschaftsgeschäften und Erfolgen. Lies **vorher und währenddessen keine** Repositories, Roadmaps, Testberichte, Quellcodes, Hilfsskripte oder Entwicklungsdiskussionen. Beobachte deine eigenen Entscheidungen, Verständnishürden, Fehler, Erfolgserlebnisse und Motivationsbrüche. Führe ein zeitgestempeltes Aktionsprotokoll. Bewerte nach dem Spiel die fünf Hauptdimensionen von 1 bis 10; begründe jede anhand deiner tatsächlichen Beobachtungen.

Der Testende muss die Startseite und alle Entscheidungen ohne vorweggenommene Lösungsfolge selbst entdecken. Keine Aufforderung zu bestimmten Schiffskäufen, Verträgen oder Erzen. Eine bereits mit Entwicklerinformationen vertraute Person ist **kein** unabhängiger Blindtester.

## 2. Technischer Start durch die Testaufsicht

Der unveränderte [isolierte Browserstarter](../tools/m4-u4-isolated-browser.cjs) verwendet ein neues, zufälliges Chrome-/Chromium-Profil im Betriebssystem-Tempverzeichnis und öffnet ausschließlich die öffentliche Root-URL. Er nutzt Node.js-Bordmittel, greift auf keinen vorhandenen Browser-Spielstand zu und löscht **nur das eigene temporäre Profil** nach dem Schließen. Er führt **keine** Spieleraktionen durch und liest **keinen** Projektcode. Die Aufsicht startet ihn, ohne dem Erstspieler Quelltext oder interne Regeln zu zeigen.

Voraussetzung: Node.js 22, grafischer Desktop und installiertes Google Chrome oder Chromium. Der Browser muss aus diesem Rechner die öffentliche HTTPS-Adresse erreichen können. Standardaufruf aus dem Repository-Stamm:

```sh
node tools/m4-u4-isolated-browser.cjs
```

Bei nicht automatisch gefundener Chrome-Installation den vollständigen ausführbaren Pfad mit der Umgebungsvariablen `CHROME_BIN` setzen. Nur für **Infrastruktur-Selbsttests ohne Spielabnahme** existiert `--selftest`; dieses Flag begrenzt bewusst die Laufzeit und wird im Bericht stets als Selbsttest gekennzeichnet.

Die reguläre Laufzeit ist fest **3.600 Sekunden monoton gemessene Echtzeit**, nicht beschleunigte Weltzeit. Ein Browserabbruch davor wird als `INCOMPLETE_BEFORE_60_MIN` ausgegeben; ein erreichtes Zeitfenster ausdrücklich nur als `60_MIN_TIME_WINDOW_ONLY`. Die JSON-Messdatei wird lokal im persönlichen Ordner `AphrosVoid-M4-U4-Testberichte` abgelegt. Sie bestätigt **weder tatsächlich geladene Seite noch echte Klicks, Motivation oder Spielbarkeit**. Diese Nachweise liefert ausschließlich die unabhängige Beobachtung. Die Datei darf nicht als bestandener Blindtest bezeichnet werden.

Wenn Browser, Netzwerk, frisches Profil oder Beobachtung fehlen, ist der Test **nicht durchgeführt**. Weder vorhandene Karrieredaten löschen noch die Session eines anderen Spielers überschreiben. Keine lokale Codekopie als Ersatz für die veröffentlichte Pages-Version werten.

## 3. Beobachtung und Zeitbelege

Die Testaufsicht erfasst vor dem ersten Klick UTC-Startzeit, getestete öffentliche URL/Versionsnachweis und eine Bestätigung der isolierten Sitzung. Während der Session wird jeweils direkt nach einer erkennbaren Aktion notiert: **Echtzeit, sichtbare Aktion, Erwartung des Spielers, beobachtete Reaktion, Entscheidung/Folge, Hindernis und ggf. Screenshotreferenz**. Mindestens alle fünf Minuten eine Standort-/Entscheidungsnotiz; echte Leerlaufphasen ausdrücklich dokumentieren statt mit simulierter Wirtschaftslaufzeit zu füllen.

| Echtzeit | Selbst gewählte Aktion / sichtbarer Zustand | Verstanden? Nächste Entscheidung? | Hindernis / Frust / Freude | Beleg |
| --- | --- | --- | --- | --- |
| 00:00 | | | | |
| 05:00 | | | | |
| 10:00 | | | | |
| 15:00 | | | | |
| 20:00 | | | | |
| 30:00 | | | | |
| 40:00 | | | | |
| 50:00 | | | | |
| 60:00 | | | | |

Zeitmessung nur bei sichtbarem, bedienbarem Spiel und belegbaren Aktionen als **Spielzeit** ausweisen. Browser-Offenzeit, Ladezeit, Wegklicken, Weltzeit und Skriptdurchläufe sind davon getrennt. Abbruch-/Pausenursache dokumentieren, nie auf 60 Minuten aufrunden.

## 4. Bewertungen erst nach dem Spiel

| Kriterium (je 1–10) | Wert | Konkreter Beleg aus der Sitzung |
| --- | --- | --- |
| Spielspaß | | |
| Verständlichkeit ohne Erklärung | | |
| Entscheidungsfreiheit | | |
| Wiederspielwert / Langzeitmotivation | | |
| Optik / Used-Future-Atmosphäre | | |
| Textdichte und Lesbarkeit (Zusatz) | | |
| Übersichtlichkeit / Navigation (Zusatz) | | |
| Bedienbarkeit / Touch-Tauglichkeit (Zusatz) | | |
| Grafikattraktivität / lebendige Karte (Zusatz) | | |

Bei der Retro-Sci-Fi-Gestaltung an der [Mini-Style-Bible](MANAGER_RETRO_SF_STYLE_BIBLE.md) **erst nach** dem Blindtest spiegeln. Kein vorab abgelesener Designkriterienkatalog für den Neuling. Vorhandene Schiffsbewegungen, Käufe, wirtschaftliche Engpässe oder fehlende Ziele beschreiben, nicht erraten. Piraten, Kämpfe, XP und Ränge sind bisher Produktziele, keine beim Spieltest als vorhanden unterstellten Funktionen.

## 5. Abschlusskategorien und Ursachenanalyse

- **NICHT BEGONNEN:** Start oder Isolation nicht nachgewiesen; Spielzeit 0.
- **ABGEBROCHEN / UNVOLLSTÄNDIG:** Tatsächliche Spielzeit unter 60 Minuten; nur real beobachtete Abschnitte auswerten.
- **60 MINUTEN INTERAKTIV DURCHGEFÜHRT:** Unabhängiger Spieler, isolierter öffentlicher Browser, ununterbrochen nachvollziehbare Echtzeit und Aktionsnachweise. Dies bedeutet noch **keine positive Spielbewertung**.
- **M4-U4 ABGENOMMEN / NICHT ABGENOMMEN:** Erst nach Befund, begründeten 1–10-Bewertungen, Priorisierung nach Spielbarkeit und bewusster Projektleitungsentscheidung festlegen. Keine automatische Abnahme allein aufgrund positiver CI.

**Nach** dem Blindtest dürfen Roadmap, Source, CI und Wirtschaftstests zur Ursachenprüfung herangezogen werden. Bericht strikt trennen in tatsächlich interaktiv getestet, aus Code/CI nachvollzogen und nicht geprüft. Offene Rechts-/Finanzierungsblocker wie [#565](https://github.com/tobiasfranziskus/Check/pull/565) nicht durch angenommene oder erfundene Spielerrechte auflösen. Das physische iPad Safari und private NAS bleiben gesonderte Geräteabnahmen.
