# Aphros Void P3 · Unabhängiger Sicherheits- und Fairness-Audit

**Bewertung für eine spätere Integration: gesperrt.** Der isolierte Prototyp bezahlt die nachgewiesene Überführung vollständig. Seine flüchtige Disposition übersteht den regulären J8-Zustandswechsel und den Neustart nicht. Im regulären Save/Load-Test gingen dadurch Streckenexklusivität und Replay-Gleichheit verloren.

## Prüfstand und Quellen

| Stand | Tatsächlicher Commit | Geprüfter Unterschied |
| --- | --- | --- |
| `main` | `97214df1c8650b08f21fdb15d9421aafbe096ecc` | Projektvorgaben in `AGENTS.md`, `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md`. Kapitel 06 zeigt die originale Streckenbelegung. |
| #505 | `0234bf4e3d977ece2114c46960d718166f287c3f` | Drei neue Dateien für Minutenprüfung, Assertions und Bericht, ohne Änderung am Kern. |
| #506 | `2901a20454ba0c3a6a3b4feb89cbe8d3786c5f69` | Vier Dateien relativ zu #505. Einzige Implementierungsdatei ist `prototypes/welt/welt-kern.js`. Node-Opt-in ausschließlich für Regel204. |

- Auf dem #505-Head war W5-RC1 erfolgreich. Der JavaScript-Workflow wurde abgebrochen. Die zwei grünen Code-Workflows gehören zu `d71d3ea1`. [#505](https://github.com/tobiasfranziskus/Check/pull/505) · [W5-RC1](https://github.com/tobiasfranziskus/Check/actions/runs/44353548896) · [JavaScript](https://github.com/tobiasfranziskus/Check/actions/runs/44353548851)
- Auf dem #506-Head bestanden W5-RC1 mit 535/535 Node22, der J4e-Browser-Smoke und W6/P8g. Der JavaScript-Gesamtworkflow blieb nach Wiederholung abgebrochen. Der Connector zeigt den letzten `test`-Job als `cancelled` und den bedingten Geografiejob als `skipped`. Vier ältere grüne Läufe gehören zu `633aa419`, vor den zusätzlichen Treuhand-/Replay-Assertions. [#506](https://github.com/tobiasfranziskus/Check/pull/506) · [W5-RC1](https://github.com/tobiasfranziskus/Check/actions/runs/44368693775) · [J4e](https://github.com/tobiasfranziskus/Check/actions/runs/44368693526) · [W6/P8g](https://github.com/tobiasfranziskus/Check/actions/runs/44368693616) · [JavaScript](https://github.com/tobiasfranziskus/Check/actions/runs/44368693626)

### Originaldateien und Schnittstellen

- `prototypes/verbund/konzern-session.js` erzeugt Originalangebote mit festem Spielerbesitzer. `ausfuehren` und `weiterspielen` prüfen und ersetzen den Kernzustand atomar über Klone.
- `prototypes/welt/welt-kern.js` verbindet Originalbefehle, echten Flugkörper/Dock, Abschreibung, Firmenpolitik, NPC-Disponent und Wirtschaftsminute. Relevant sind `execute`, `minute`, `save`, `load`, `audit`, `p3ForschungsAnmeldung` und `p3ForschungsStatus`.
- `prototypes/welt/rule200-k7-industry-core.js` enthält die Befehlsschemata und Eigentumsprüfung sowie W3-, W5n- und W5ac-Kalkulation, Arbeitskonten, Belege und Abrechnung. W5ac prüft Kaufherkunft, Route, Ladung, Aktivbelegung und Finanzierung.
- Die unabhängige Prüfung verwendet den finanzierungsgetreuen Mehrschiff-Start sowie `tools/w6-szenarien.cjs` für separate Kassen- und Warenbilanz. Bestehende P3-, W5ac-, W6- und Speicherregressionen bleiben erhalten.

## Befunde nach Schweregrad

| Grad | Befund und Nachweis | Konkrete Korrektur vor Integration |
| --- | --- | --- |
| **Hoch** | **Save/Load verliert Streckenexklusivität und Replay-Gleichheit.** Ein gültiger aktiver W5ac-Spielstand bei Minute 3377 hat unmittelbar nach Laden denselben Hash. In Minute 3378 bucht der geladene Zustand zusätzlich W5n-Eisfracht, während W5ac noch läuft. Die fortgesetzte Referenzwartewelt hält die Strecke exklusiv. Nach 60 Minuten lauten die Hashes `c60ea00cf7d48141` und `b234789294c81e71`. Beide Kernaudits akzeptieren die Endzustände. | Streckenbelegung aus autoritativem Zustand ableiten und in allen Startpfaden sowie im Ladeaudit prüfen. Save/Load-Gleichheit über die Fortsetzung prüfen, einschließlich aller 60 Reiseminuten und der ersten Folgedisposition. |
| **Hoch** | **Offene Vormerkung bleibt am alten J8-Zustandsobjekt hängen.** Sieben reguläre 60-Minuten-Schritte ergeben denselben Weltzustand wie die Referenz ohne Vormerkung. Der Status meldet weiterhin die alte Position, obwohl ihre Frist in der laufenden Spielwelt verstrichen ist. Ein frischer J8-Import verliert die Vormerkung vollständig. | Vormerkung, Frist, Dispositionsreihenfolge und Idempotenz im versionierten Zustand modellieren. J8-Klon, Replay und Laden müssen dieselbe Ereignisfolge und dasselbe Ergebnis liefern. |
| **Hoch** | **Keine begrenzte Wartezeit durch die Alternation.** Nach Hausüberführung bleibt die NPC-Sperre im kontrollierten Lauf mit pausierter Automatik mindestens 1.440 Minuten bestehen. Auch drei unabhängige Startseeds mit rechtmäßig gekauftem Erstfrachter zeigten einen Zuschlag bei Minute 301 und nach einem Tag weiterhin NPC-Vorrang ohne abgeschlossene NPC-Eisfracht. Der Admission-Guard blockiert jede weitere Anmeldung bis ein passender aktiver NPC-Auftrag gesehen wird. Es fehlt ein Nachweis mit einem zweiten gleichzeitig zulässigen Hausfrachter für diesen Zweig. | Nur tatsächlich finanzierte, ausführbare Anfragen alternieren lassen. Bei leerer oder unzulässiger Gegenklasse weiter disponieren. Eine verbrauchte Quote erst nach einer echten Startbuchung umstellen. |
| **Mittel** | **Stillgelegte Hülle kann bezahlte W5ac starten.** Im isolierten Altersgrenztest setzt ausschließlich das Testfixture den vorab angemeldeten Frachter auf Buchwert null. Der Core akzeptiert seine Bilanz und meldet ihn stillgelegt. Trotzdem wird er disponiert. Der Test belegt die Grenzbedingung, ohne Verschleiß im normalen Dockbetrieb zu unterstellen. | Stilllegung und Tauglichkeit bei Anmeldung und vor dem atomaren Originalstart einheitlich prüfen. Dieselbe Prüfung für alle W5ac-Einstiege und im Audit verwenden. |
| **Mittel** | **Vormerkung bindet keine Mittel und kann nicht ausdrücklich widerrufen werden.** Anmeldung und Ablauf ändern bei gültigem Ausgangszustand weder Konto noch Treuhand. Der Originalstart finanziert korrekt zum Zuschlag. Die vorhandene Original-Kapitalkontrolle liegt hinter der Belegungsprüfung. Echte Unterfinanzierung nach Anmeldung wurde im P3-Ablauf noch nicht mit einer vollständig gebuchten, legalen Ausgabenfolge hergestellt. | Vorfinanzierung bei Annahme eines verbindlichen Platzes. Ungültige oder stornierte Plätze deterministisch schließen und exakt einmal rückerstatten. |
| **Niedrig** | **Erfolgszähler zählt Starts.** `abgeschlossen` steigt bei erfolgreicher W5ac-Buchung, 60 Minuten vor dem Ankunftsbeleg. Die 60-Minuten-Frist bis Tick 3220 ist inklusiv, Verfall ist Tick 3221. | Status und Zähler an die jeweilige Phase binden. Frist inklusive letztem zulässigen Tick benennen. |

Die beobachteten Inkonsistenzen betreffen den isolierten Forschungszweig. Die Browserfassung von Regel204 hat keine P3-Queue. Für die untersuchten Abläufe wurde keine Geld- oder Warenverdopplung gemessen.

## Ausführbare Prüfungen

```sh
node --version
node --test tests/p3-independent-audit.test.mjs tests/p3-minute-capacity.test.mjs tests/p3-fair-ferry-research.test.mjs tests/p3-werft-mehrschiff.test.mjs tests/p3-werftfrachter-f4.test.mjs
node --test tests/*.test.mjs
node tests/p3-independent-soak.cjs seeds 1
node tests/p3-independent-soak.cjs all 90
node tests/p3-independent-soak.cjs S02 730
```

Die neuen Kurztests prüfen fremde bzw. ungültige IDs, einen ungeeigneten Miner, bereits überführte Hülle, W5ac-Originalberechtigungen und eine falsche Andockstation für Eisfracht, Duplikat und Wiederanmeldung, ungültige TTL, unveränderten Kassenstand bei Ablauf, ungültiges JSON sowie inkonsistente Eigentümer-/Kontodaten. Sie prüfen ferner den regulären J8-Klonpfad, Wiederholung des Originalbefehls während und nach Ausführung, Treuhand- und Pilotenkonto in jeder Überführungsminute, eindeutigen Abschlussbeleg und Abschreibung. Ein unbekannter Abbruchbefehl und der im Regel204-Kontext hier unzulässige Verlustbefehl werden abgelehnt. Die beiden Tests zum Reload und Stilllegungsfall halten das aktuelle Fehlverhalten explizit fest. Ein grüner Charakterisierungstest dokumentiert den Fehler.

Die Langläufe verwenden identische Ausgangsstände je Paar. **Aus:** reguläre Regel204-Dispo. **An:** genau eine echte, zeitlich beschränkte Vormerkung pro Welt, sofern eine bezahlte Hülle verfügbar ist. Die 13 Regime beginnen im S02-Mehrschiff-Pfad ab Minute 3160. Der Runner setzt die Politik dort auf die Originaldefaults zurück und wendet dann genau das jeweilige W6-Regime an. Er verlangt je Paar identische Ausgangshashes und über die gesamte Matrix verschiedene Ausgangshashes. Das ist ein zusätzlicher Kohortenvergleich zu W6 ab Weltstart. Die 365-/730-Tage-Punkte liegen 365 bzw. 730 Tage nach dem Anmeldezeitpunkt. Die alternative Seed-Kohorte kauft die erste Hülle legal, bevor sie die Disposition vergleicht. Die Daten messen echte Eis-/Erzaufträge, Frachter, Ersatz, Wasserumsatz, Kassen und Welt-Hash. Eine einzelne Vormerkung pro Welt misst Folgewirkungen auf NPCs, liefert aber keine Mehrparteien-Fairnessgarantie.

## Dispositionsmodelle

| Modell | Reihenfolge und Finanzbindung | Stärken und Grenzen |
| --- | --- | --- |
| Gemeinsame FIFO aller ausführbaren Aufträge | Verbindliche Vormerkungen aus Spieler- und NPC-Originalangeboten. Atomare Bindung bei Zulassung. Sortierung nach autoritativem Tick und ordinaler Auftrags-ID. Ungültige oder derzeit nicht ausführbare Plätze blockieren die Strecke nicht. | Transparent und leicht reproduzierbar. Viele Anmeldungen eines Eigentümers können die Folge dominieren. Begrenzung je Eigentümer und Schutz gegen Masseneinreihung erforderlich. Lange und kurze Fahrten erhalten die gleiche Folgeposition mit sehr verschiedener Streckenbindung. |
| Kapazitätsgewichtete Alternation mit FIFO je Klasse | Spieler und NPC sammeln Bedieneinheiten in Streckenminuten. Innerhalb jeder Klasse gewinnt die älteste zulässige Anfrage, dann die ordinale ID. Bei gleichzeitiger Nachfrage entscheidet das gespeicherte Defizit; bei leerer Gegenklasse wird freie Kapazität genutzt. Quote, Alter und Gleichstand werden im Weltzustand gespeichert. | Prüft Fairness gemessen an belegter Strecke. Ein NPC-Ausfall kann den Spieler nicht dauerhaft sperren. Eigentümerlimits, Interpretation von Alter und Anrechnung langer Verträge müssen separat auditiert werden. Die Gewichtung ist eine ausdrückliche Wirtschaftsregel. |

**Empfehlung für eine spätere Regelversion.** Kapazitätsgewichtete Alternation mit FIFO innerhalb der Klassen als Kandidat prüfen. Zulässigkeit setzt reale Nachfrage oder einen legitimen Überführungsauftrag, eine geeignete Hülle und vollständig finanzierten Vertragsumfang voraus. Eine unverbindliche Absicht erhält keine Vorrangposition. Bei Annahme einer verbindlichen Reservierung erhält ein separates Konto den vollständigen erwarteten Aufwand. Der Zuschlag übernimmt die vorhandene Deckung atomar in den Originalauftrag. Ablauf, Rücktritt, Wegfall des Käufers oder Hüllenausfall führen zu einem terminalen Beleg und einmaliger Erstattung. Nach begonnenem Transport gelten die separat zu genehmigenden Abbruchregeln für verdienten Lohn und Restmittel.

Der autoritative Befehl muss den Auftraggeber aus der geprüften J8-Aktionsschicht bzw. einer authentifizierten Sitzung ableiten. Er ordnet Welt-ID, Regelversion, Eigentümer, Schiff, Auftragszweck und monotone Auftrags-ID zu. Kunde, Eigentümer, Hülle und Kapazität werden beim Zuschlag erneut geprüft. Persistenter Abschlussstatus und eindeutiger Buchungsschlüssel machen Wiederholung und Rückzahlung idempotent. Bei importierbaren Offline-Spielständen beweisen Strukturaudit und öffentlicher Hash Konsistenz. Für manipulationsresistente geteilte Spielstände wäre zusätzlich eine vertrauenswürdige, vom Client unabhängige Autorität für Signatur und Replay-Schutz nötig.

Alte Regel204-Saves behalten Parser, Referenzhashes und ursprüngliche Disposition. Eine neue Fassung erhält eine eigene Regel-/Schema-ID und einen ausdrücklich freigegebenen Kopierpfad. Originaldatei, ursprüngliche Identität und Hash bleiben zur Wiederherstellung verfügbar. Die Projektleitung entscheidet getrennt über neue Priorität und Freigabe.

## Offene Integrationsgates

- Verbindliche Wartescheine erfordern einen separaten Eigentums-/Import-/Replay-Audit, auch für doppelte Auftragsbelege und erhaltene Originalsave-Slots. Dieser Audit hat einfache inkonsistente Importe geprüft. Er bescheinigt keinen Manipulationsschutz gegen koordinierte Fälschung gültig wirkender Journale.
- Testen nach Implementierung eines echten Wartevertrags: finanzierte konkurrierende Eigentümer, autoritativer Widerruf, Schiffverlust während Wartezeit, tatsächlich abgebuchte Spielerliquidität nach Anmeldung, Sponsor-/Käuferausfall, Rückerstattung und Wiederanlauf. Vorher gibt es für einen Teil dieser Fälle keine Original-API. Es wurde kein Exploit entwickelt.
- Nachweis einer expliziten Fairnessgrenze bei fortlaufend zulässiger Nachfrage, mit dokumentierten Wartezeitverteilungen je Klasse, Auslastung nach belegten Minuten, seedabhängigen Insolvenzen und Abgleich mit W4/W5-Ersatzwirtschaft. Tests für Browser, Touch, echte iPad-/NAS-Geräte sowie integrierten Starter-/Save-Pfad bleiben für eine spätere Produktintegration erforderlich.

## Lokales Testprotokoll

- Node 22.23.4. Der erste Auditversuch hatte eine fehlgeschlagene Fortsetzungs-Hashgleichheit. Die folgende Untersuchung lokalisierte echte parallele W5n-Fracht in Minute 3378. Der Charakterisierungstest belegt beides. Der erste Mehrseed-Runner brach bei einem alten Save ohne optionales F4-Journal mit `TypeError` ab. Der Runner behandelt fehlendes Journal seither als null abgeschlossene F4-Aufträge. Der erneute Lauf war in allen drei Paaren erfolgreich.
- Der erste Langlauf-Runner übernahm bei den Regimen S01 und S03 die Werftreserve des S02-Startspielstands und in S01 zusätzlich dessen Stilllegungspolitik. S01–S03 hatten dadurch identische Politik. Die betroffenen Zeilen werden nicht als getrennte Regime gewertet. Der korrigierte Runner prüft verschiedene Ausgangshashes.
- Seed 7, 42 und 204 je einen Tag im Erstschiff-Pfad, jeweils aus/an. In allen drei Paaren legaler Kauf bei Minute 300. Mit Forschung startete je ein Hausauftrag bei 301, NPC-Vorrang stand am Ende weiterhin an. In keiner der sechs Welten war bis dahin eine NPC-Eisfracht abgeschlossen. Das erfasst den Erstschiff-Pfad, nicht die Konkurrenzlage aus dem Mehrschiff-Fixture.
- S02 × 90 Tage, aus/an, gerechnet mit der dokumentierten S02-Politik. Geld- und Warenprüfung an den Tagen 1, 30, 60 und 90. Am Tag 90: Hashes `b6c2e9ef39ee49a6` und `88af775da5fe6e04`, 1.034 → 1.033 NPC-Eisabschlüsse und 97 Ersatzkäufe in beiden Welten. Der 730-Tage-Vergleich und die korrigierte Krisenmatrix laufen separat.
- Die lokale Node22-Gesamtregression traf bei fünf Archiv-/Root-Dateien auf `spawnSync … EPERM` in der Sandbox. Betroffen waren `p0-legacy-hub-archive`, `p0-legacy-pages-archive`, `p0-prototype-deps`, `p0-w5x-archive` und `p1-root-premium`. Die Wiederholung außerhalb dieser Sandbox-Beschränkung ergab 11/11 bestandene Subtests.

- Der lokale Fokuslauf ergab **13/13** bestandene Tests. Der Originalminutentest reproduzierte 1.189 W5n-, 192 W3- und 60 W5ac-Punkte, keinen freien oder überlappenden Punkt und unverändert `2454761bd83b9c95`. Der Forschungs-Replay reproduzierte den 60-ISK-Start bei 3377, Ankunft und NPC-Wiederanlauf bei 3437 sowie `5c9cc9a67b29a72a`.
- Der erste Audit-Check bestätigte **10/10 Node22-Tests** und dieselbe Parallelbelegung ab Minute 3378. [GitHub Actions Regression](https://github.com/tobiasfranziskus/Check/actions/runs/44385981670/job/135090554950)
