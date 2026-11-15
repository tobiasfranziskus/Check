# J5-W – finanzierte Folgeproduktion

**[DRAFT / ANALYSE]** Basis ist der am 15.11.2026 abgerufene aktuelle `main acaf2526578a961585a1835e81d2c5aee37ec9b7`, Nachfolger von `438d1ee659cde5666c3cc1b6620ea8de3ee50427`. Eigener Branch `research/j5w-finanzierte-folgeproduktion`, Ziel `main`. AGENTS, Roadmap, Projektstatus und Regel204-Core einschließlich J2b/J3/J4b gelesen. Die historischen DRAFT-Aussagen werden durch die aktuellen MAIN-Einträge überholt. Kein Merge oder Deployment durch diesen Auftrag.

## Ergebnis und reproduzierbarer Weg

Eine zweite vollständig finanzierte Jägerhülle **einschließlich erneutem 900-ISK-Kauf** ist mit unveränderter Regel204 möglich. Es braucht keine neue Wirtschaftsregel und nur eine gezielte Audit-Härtung: Werftbelege müssen exakt32 Minuten zwischen Start und Ende belegen. Der ausführbare Nachweis liegt vollständig in `tests/j5w-finanzierte-folgeproduktion.test.mjs`; Produktionsablauf, Preise, Regelnummer, Anfangsverteilung und vorhandene Saves bleiben unverändert. Gültige Originalbelege bleiben ladbar; zeitlich verkürzte oder verlängerte Werftbelege werden jetzt abgewiesen.

Start: öffentlicher, regulär geladener Original-J4e-Beispielstand `prototypes/j4c/beispiel-jaeger-seed42.json`, Tick22355, Hash `daec00c7618a6cd7`. Er enthält bereits den ersten bezahlten Jäger `sh023`, 30 reales Erz in Nadir, keine Bauteile/Material/Silizium, Nadir5052, Werft290, Spedition6616 und house1589 ISK. Die Vorgeschichte dieses vorhandenen Saves wird durch diese Forschung nicht neu erzeugt.

| Schritt | Reale Leistung und vorhandene Zahlung |
| --- | --- |
| Silizium | `siliconMineStart` mit gekauftem Nadir-Miner `house/sh022`, echtes Abdocken, `shipFlyTo(720000,-480000)`, 64 Förderminuten zu 2 ISK, echter Rückflug und Andocken; 8 Silizium für192 ISK aus vorab gebundener Nadir-Kasse verkauft. Flugdienst zusätzlich bezahlt, kein Teleport. Tick22438 geliefert. |
| Expansion | Spedition kauft vorhandene Nadir-Frachterhülle für750 ISK; neue Original-ID `sh024`, Eigentümer `transport`. Werft erhält echtes Verkaufsgeld. Die Hülle bleibt als zusätzliche Speditionsanlage im Nadir-Dock; sie ist kein verbrauchter Zuschuss. |
| Industrievertrag | `industrialOreOffer` mit `npc3/sh008` und `transport/sh020`, getrennte Bergbau-/Speditions-/Werftunterschriften und Commit. 50 Erz tatsächlich zusätzlich gefördert, physisch nach Nadir geliefert; Käuferbudget740, zusätzliche Speditions-Lohnreserve120 und Werftreserve530 ISK. Tick22570 echte Hinlieferung, Rückflug bis22630. |
| Vertragserfüllung | Erste W4-Charge: 10 Erz→5 Material,20 bezahlte Minuten. Signierter K7-Frachterbau verbraucht diese5 Material und30 bezahlte Minuten; erzeugt tatsächlich eine neue Lagerhülle. Die Werftreserve wird ordnungsgemäß ausgelöst. |
| Jägermaterial | Weitere4 W4-Chargen: 40 Erz→20 Material,80 ISK/Minuten Raffineriearbeit. |
| Bauteile | 8 einzelne J3-Aufträge, zusammen16 Material+8 Silizium→8 Bauteile;64 ISK für64 echte Arbeitsminuten. |
| Jäger | Tick22774:8 Bauteile+4 Material,32 ISK vollständig vorab in Treuhand. Nach31 Minuten noch keine neue Hülle,1 ISK Reserve, Kauf gesperrt. Tick22806 nach32 Minuten tatsächlich fertig. |
| Eigentum/Kauf | `shipBuy` zahlt900 vorhandene house-ISK an Nadir und erzeugt `house/sh025`. `sh023` bleibt ebenfalls Eigentum von house. |

Ende: **Tick22806, house678, Nadir5324 ISK**, zwei gekaufte house-Jäger,30 Erz und1 neue Frachter-Lagerhülle in Nadir. Zusätzliche Förderung50 Erz/8 Silizium, zusätzliche Raffinerieproduktion25 Material; davon5 für den K7-Frachter und20 für Bauteile/Jäger. J3-Arbeiter erhalten weitere64, J4-Arbeiter weitere32 ISK. Gesamtweltgeld **33000**, Mint/Burn **0**.

Diese Expansion ist eine ausdrücklich im Test ausgeführte freiwillige Investitionsentscheidung der Spedition. Sie beweist weder eine autonome NPC-Entscheidung noch rentable Verwendung der zusätzlich erworbenen Hülle. Fremde Konten werden nicht umgebucht. Keine Behauptung eines nachhaltigen W6-Kreislaufs.

## Gezielte Audit-Korrektur

Der bisherige J4b-Audit akzeptierte nach direkter Gegenprobe einen von32 auf31 Minuten verkürzten Abschlussbeleg (`start++`), obwohl Mengen und Lohnzähler unverändert waren. Derselbe gültige Originalbeleg wird vor und nach der Änderung akzeptiert; die verkürzte Fälschung nur vom alten Audit. Eine einzelne Bedingung in `prototypes/welt/j4b-jaeger-werft-core.js` verlangt jetzt `ende-start === rules.j4.dauer`. Das ändert weder Tick-Reihenfolge noch Produktion, Zahlungen oder Referenzhashes. Der neue Import-Negativfall schützt die Korrektur.

## Erste Sperren und Gegenversuche

- Sofortiger zweiter Werftauftrag scheitert atomar an fehlenden8 Bauteilen/4 Material; sofortiger J3-Auftrag an fehlendem Material. Drei vorhandene Erzchargen liefern nur15 Material; nächste Raffineriecharge scheitert an Erz. Für den zweiten Jäger sind insgesamt20 Material erforderlich.
- Exportkonto besitzt0 ISK. Normaler Erzauftrag plus echter Pendelversuch über240 Minuten erzeugt keine weitere verkäufliche Erzcharge und keinen W1-Vertrag. Warten allein ist keine finanzierte neue Industrienachfrage.
- K7-Angebot ist möglich, aber **erste konkrete Finanzierungssperre der geprüften Industriekette** ist die Werftunterschrift:290 vorhanden gegenüber530 erforderlich,240 ISK fehlen. Ablehnung verändert den Zustand nicht. Ein fingierter Transfer ist kein Gegenversuch.
- Positiver Gegenversuch: tatsächlicher750-ISK-Frachterkauf der solventen Spedition mit physischem Bestand und Eigentumswechsel. Danach kann dieselbe Werft unterschreiben; der gesamte originale K7-Vertrag einschließlich realer Frachterproduktion wird erfüllt. Kein Erlass einer K7-Bedingung.
- Nach dem Erfolg sind die16 Einheiten des bestehenden Siliziumfeldes erschöpft. Der nächste `siliconMineStart` scheitert am Feld; zudem besitzt house678 gegenüber900 ISK für einen weiteren Kauf. Das ist **kein** Nachweis beliebig wiederholbarer Produktion. Keine neuen Vorkommen oder Käufer erzeugt.

## Testumfang und Grenzen

Pro Core-Minute des Folgepfads vollständiger Core-Audit plus unabhängig summierte33000 ISK, Null-Mint/Burn, physische Waren-/Ledgerbilanz, existierende Eigentümerkonten und Jägeranzahl/Kaufbuch. Exakte zusätzliche Förder-/Fracht-/Arbeitsmengen geprüft. Save/Load an Befehls- und Phasengrenzen einschließlich laufender Förderung, Fracht und Produktion; vollständiger deterministischer Wiederholungslauf. Import-Negativfälle: zusätzliche Ware, gefälschter Siliziumbeleg, Frachtmenge, Werftlohn und gefälschte Werftdauer, Gratispreis, Eigentum, zusätzliches Schiff, geldmengenneutrale illegale Umbuchung, Mint, Schema und ungültiges JSON. Fremder Werftauftrag wird atomar abgelehnt. Originaldatei bleibt bytegleich.

**Seed-Abgrenzung:** Seed42 setzt den unveränderten Originalstand fort. Seed7 setzt denselben auditierten Wirtschaftsstand mit ausdrücklich im Test auf7 gesetztem RNG fort; keine zusätzlichen Güter/ISK. Es ist eine deterministische Seed7-Fortsetzungsprobe, **keine unabhängig aus Seed7 erzeugte gesamte J4e-Vorgeschichte**. Zusätzlich werden unveränderte neue Regel204-Anfangswelten mit Seed42/7 erstellt und vollständig auditiert. Wirtschaftswerte beider Fortsetzungen identisch; Endhash42 `3630b67418d15855`, Endhash7 `725323b51687165a`.

Keine Wirtschaftslogik geändert: keine neue J5-W-13×90-Matrix und keine J5-W-365/730-Tage-Nachhaltigkeitsbehauptung. Die Gesamtregression führt die vorhandenen historischen Szenarien zusätzlich aus; diese sind keine Regel204-Folgeproduktionsmatrix. Kein Browser-/iPad-/NAS-Test für diesen reinen Core-Nachweis ausgeführt.

## Tatsächlich ausgeführte Schlussprüfung · 15.11.2026

- Node **v22.23.4**, `/workspace/check-tools/node-v22.23.4-linux-x64/bin/node --test tests/*.test.mjs`: **43/43 Testdateien bestanden**,0 Fehler,0 übersprungen,0 abgebrochen; finaler Lauf nach Audit-Korrektur187480 ms. Der Runner zählt hier Dateisuiten; daraus wird keine erfundene Zahl einzelner Assertions abgeleitet. Vorläufiger Gesamtlauf ebenfalls43/43, wird nicht als finaler Head-Nachweis verwendet.
- Finaler direkter Fokus: `/workspace/check-tools/node-v22.23.4-linux-x64/bin/node tests/j5w-finanzierte-folgeproduktion.test.mjs`: **4/4 Einzeltests bestanden**,0 Fehler/Skips/Abbrüche,16650 ms. Auch der Fokus über `--test tests/j5w-*.test.mjs` wurde erfolgreich ausgeführt; der direkte Lauf weist die vier inneren Tests aus.
- Direkter alter/neuer Auditvergleich auf demselben Originalbeleg: gültig `true/true`, gefälschte31 Minuten `true/false`.
- `git diff --check` bestanden. Remote-main vor Fertigstellung erneut abgeglichen: weiterhin `acaf2526578a961585a1835e81d2c5aee37ec9b7`. Geändert ausschließlich J4b-Auditmodul, neue J5-W-Testdatei und dieser Bericht.

Roadmap/Projektstatus werden gemäß ausdrücklicher Dateigrenze dieses Auftrags nicht geändert. Dieser Befund ist Forschungs-/Draftstatus, keine neue Produktentscheidung oder Integrationsfreigabe.
