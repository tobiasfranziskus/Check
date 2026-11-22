# M4-U3 · Blockierter Zweitauftrag in der Standardkarriere

**[BLOCKIERT / FORSCHUNGS-DRAFT]** In Seed 42 bleiben nach zwei bezahlten Eisrundflügen die kaufbare Nadir-Frachterhülle und ein eigener Erzauftrag aus. Die Nadir-Quote `buy-st_nadir-frachter` meldet durchgehend **„kein Komplettschiff auf Lager“**. Nach der zweiten Runde sind 2.310 ISK Firmenkasse vorhanden. Ein privater Wasserkauf ist möglich und stützt die bestehende Eiskette. Für das geforderte zweite Geschäftsziel wurde ein eigener betrieblicher Auftrag mit nachgewiesener Abnahme und Auszahlung vorausgesetzt. [Auftrag #564](https://github.com/tobiasfranziskus/Check/issues/564) · [Roadmap](ROADMAP.md) · [Projektstatus](PROJEKTSTATUS.md)

Quellbasis ist `main e23bc747d813626bbe8f95f1cfdf76d0f4484f01` nach der Integration des Operationsboards. Die Managerdisposition wählt Originalangebote mit `ice-` und `freight-`. Die Karte liest Stationsbetreiber, Lager und Anlagen und zeigt die zugehörigen Original-Kaufangebote. Der Normaleinstieg lädt die unveränderte Seed‑42‑Regel195-Kopie über J8 nach Regel204. Der Forschungsstart verwendet separat J8 `startenP8g(true)` für Regel207 mit aktiviertem NPC- und Materialpfad. [Integration #562](https://github.com/tobiasfranziskus/Check/pull/562) · [J8](../prototypes/verbund/konzern-session.js) · [Dispositionslogik](../prototypes/spiel/p3-manager-disposition.js) · [Karte](../prototypes/spiel/p3-manager-karte.js)

## Seed 42 · dieselbe legale Befehlsfolge je Regel

Zuerst in Minute 0 den Aldera-Miner für 600 ISK und den dort verfügbaren Frachter für 750 ISK kaufen. Der Hauskasse bleiben 1.650 ISK. Dann `ice-sh002`, zweimal 60 Minuten, `freight-sh003`, zweimal 60 Minuten, `freight-sh003`, zweimal 60 Minuten. Beide Lieferungen à 50 Eis erreichen Nadir in Minute 180 und 300. Die leeren Rückflüge enden in Minute 240 und 360. Nadir reserviert pro Runde 490 ISK (250 für Ware, 240 Frachttarif), das Haus 120 ISK Pilotenlohn. Zusammen belegt sind 480 ISK Frachterlöse und 240 ISK an `pilot_house`. Die Geldsumme beträgt durchgehend 33.000 ISK bei Mint und Burn jeweils 0. [Reproduzierbarer Original-J8-Test](../tests/m4-u3-j8-geschaeftsnachweis.test.mjs)

| Minute / Phase | Originalhash 204 | Originalhash 207 | ISK Haus / Privatlohn / Aldera / Nadir | Reale Ware und Schiffe |
| --- | --- | --- | --- | --- |
| 0 · Neuer Start | `674400c1d181fcf2` | `6c83a38cd3dc5a54` | 3.000 / 0 / 1.000 / 4.000 | 3 Miner und 1 Frachter im Aldera-Lager. `sh001` gehört `npc3`. |
| 120 · Vor F4 | `dd21dd408d18329a` | `1596faa72b705565` | 1.779 / 21 / 750 / 4.000 | 50 Eis im Aldera-Lager. Eigener Miner `sh002` und eigener Frachter `sh003` am Dock. |
| 120 · F4 gebucht | `30a46fa2f3f3a2e3` | `7f1d0a7e07d6960f` | 1.659 / 21 / 750 / 3.510 | 50 Eis vom Aldera-Lager auf `sh003`, unterwegs nach Nadir. Kaufreserve 490 ISK, Arbeitsreserve 120 ISK. |
| 240 · Erste Rückkehr | `4e86f3fc27a6005a` | `221e8213a2882308` | 2.028 / 162 / 750 / 3.444 | `sh003` leer in Aldera. Aldera 50 Eis und 0 Wasser, Nadir 20 Eis und 29 Wasser. |
| 360 · Zweite Rückkehr | `1df0f18ff779fd4c` | `f406d3e1b4a8276a` | 2.310 / 303 / 255 / 3.414 | `sh003` leer in Aldera. Aldera 50 Eis und 33 Wasser, Nadir 20 Eis und 39 Wasser. |

In beiden Läufen führt der Spieler in Minute 360 den einzigen gekauften Aldera-Frachter. `transport` hat 2.000 ISK, aber keinen Frachter. `npc3` hat 3.821 ISK, `werft_extern` 1.950 ISK. Aldera und Nadir haben bei allen Prüfpunkten 0 Erz. Nadir hat außerdem 0 Material, 0 Silizium und 0 Frachterhüllen. W3 und W4 haben keinen laufenden Auftrag, W5 hat 0 Hüllen gebaut. Die Stationen haben jeweils `eigentum: null`; die Konten- und Betreiberrechte folgen trotzdem den festen Originalrollen. Regel207 zeigt zusätzlich Dravos. Das J8-Testprotokoll `M4_U3_J8` enthält alle Angebots-IDs, Originalgründe, Stationslager, Kassen und belegten Frachtphasen.

## Originalangebote und Rechte

| Aktion | Originalbefund |
| --- | --- |
| `buy-st_nadir-frachter` | Beide Regeln an allen fünf Prüfpunkten gesperrt: „kein Komplettschiff auf Lager“. W5ac-Überführung erscheint erst für eine geeignete eigene Nadir-Hülle in Regel204. |
| `buy-st_nadir-miner` / `buy-st_nadir-jaeger` | „K2/J2a: Nur der echte vorgemerkte Nadir-Miner darf lokal gekauft werden“ / „J4b: noch kein bezahlter Jäger im Lager“. Ohne eigenen Nadir-Miner erscheinen keine `sil-start-`- oder `sil-sell-`-Angebote. |
| W3 Erzauftrag | J8 liefert keine Hausquote. Der Core lehnt K7-Bestellung durch das Haus mit „K7: nur realer Industriekäufer darf bestellen“ ab. Kauf und Vertragsabschluss liegen bei Nadir, die Unterschriften und eigenen Schiffe beim Bergbauunternehmen `npc3` und bei der Spedition `transport`. Die rohe W3-Frachtprüfung verlangt einen freien **Speditionsfrachter**. Für den eigenen, leeren Aldera-Frachter lautet der Originalgrund „Bezahlter Frachter muss frei in Aldera liegen“. |
| W4 / W5 | Keine entsprechende J8-Hausquote. Der Core verweigert Hausbefehle mit „Nur die Nadir-Raffinerie darf diesen Auftrag bezahlen“ bzw. „Nur die finanzierende Werft darf Nadir-Schiffe bauen“. Originalreferenz: 10 Erz + 20 ISK Arbeitsreserve für 5 Material; in der Werft 500 ISK Material + 30 ISK Löhne. |
| `freight-sh003` / `gate-freight-sh003` | Der Wiederholungsversuch während der Hinfahrt wird mit „K1: Wirtschaftsauftrag nur mit physisch angedocktem Frachter“ abgewiesen. F6 fordert im Dock „Torfracht: kein nachgewiesener bezahlter Toranflug“ und bleibt eine Eisfracht. |
| `water-pilot-house-1` | Standard204 bis einschließlich Minute 240 gesperrt: „Am Wohnort ist nicht genug Wasser tatsächlich vorhanden“. In Minute 360 erfolgreich: 1 Wasser verbraucht, 16 ISK von `pilot_house` an Aldera, Firmenkasse und Schiffe unverändert. Käuferkasse steigt von 255 auf 271 ISK, womit die nächste 250‑ISK‑Eischarge bereits vor dem Kauf gedeckt war. Es entsteht kein eigener Lieferauftrag und kein Erlös für das Haus. Regel207 bietet diesen Privatkauf nicht an. |
| Aldera-Miner nachkaufen | Originalquote kann weitere Hüllen gegen 600 ISK übertragen. Der neue Miner erweitert auf diesem Weg die Eisförderung. Der Kauf allein schafft keinen Abnahmevertrag für ein anderes Gut. |

J8 weist fehlende IDs mit „Kein legitim auswählbarer Spielerauftrag“ ab. Ablehnungen, Angebotslesen und Karteninspektion verändern Hash und JSON nicht. Die Originalbefehle ohne Negativversuche ergeben bis Minute 360 das gleiche JSON wie der Auditlauf. Beide Regeln bestehen getrennten Save/Load mit bytegleichem Export. Der Wasserkauf ergibt separat `715c528a9adb2d89`. [W3](../tests/w5y-original-w3-freight.test.mjs) · [W4](../tests/w5aa-original-w4-refinery.test.mjs) · [W5](../tests/w5ab-finanzierter-schiffbau.test.mjs) · [Privater Wasserkauf und weitere F4-Runde](../tests/p3-wasserlohn.test.mjs)

### Kontrolllauf · anfänglicher Frachter geht an die Spedition

Ohne Hauskäufe nimmt `transport` den Aldera-Frachter `sh002` in beiden Regeln. In Standard204 ist bei Minute 360 weiterhin keine Hülle in Nadir vorhanden. In Regel207 ergeben dieselben sechs 60-Minuten-Schritte eine bezahlte W3-Lieferung, fünf W4-Material und eine W5-Hülle (vor Kauf `60758c3afac62296`). Der Original-J8-Kauf für 750 ISK ist grün und überträgt genau eine Hülle aus dem Nadir-Lager ins Eigentum von `house`. Der Kontrolllauf hat keinen vorherigen Haus-Eisflug. Der getrennte Regel204/S02-Test zeigt eine ähnliche bezahlte Hülle, setzt aber ausdrücklich NPC-Politik und Silizium-Automatik für sein Szenario. [Regel204/S02](../tests/p3-industrie.test.mjs) · [Originalsignaturen und Reserven](../tests/m3-p3-industrie-buchungen.test.mjs)

## Entscheidung der Projektleitung

Zur Prüfung freigeben: einen **einmaligen bezahlten Erz-Frachtvertrag für den vorhandenen Hausfrachter** nach einem Eisrundflug. Der begrenzte Eingriff wäre ein vom echten Käufer `st_nadir` finanzierter Auftrag, bei dem der Core dem Haus nur die Unterschrift für sein eigenes, freies Schiff erlaubt. Im bestehenden Vertrag sind 50 Erz, 740 ISK Käuferreserve (500 Ware, 240 Rundfracht) und 120 ISK Fluglohn belegt. Das Original-Modell verlangt zusätzlich 500 ISK für Alderas Quellankauf, falls die Charge erst gefördert werden muss. Am zweiten Rückflug stehen dort 255 ISK. Vor einer Freigabe braucht die Variante deshalb einen reproduzierten, bezahlten Quellpfad und einen Nachweis, dass die Original-W3-Audits eine ausdrücklich autorisierte Abrechnung an das Haus tragen können. Eine Händlerquote dürfte erst mit gedeckter Ware, freien Docks, nachgewiesener Nachfrage und echter Reserve erscheinen. Raffinerie und Werft disponieren weiter auf ihren eigenen Konten. Solange die Entscheidung aussteht, bleibt das zweite Ziel blockiert. [Original-K7/W3-Kriterien](../prototypes/welt/welt-kern.js)

## Abnahme und Rückfall

```sh
node --test tests/m4-u3-j8-geschaeftsnachweis.test.mjs
node --test tests/*.test.mjs
WELT_BROWSER=chromium node tests/p3-handelsweg-browser.cjs
WELT_BROWSER=webkit node tests/p3-operationsboard-browser.cjs
```

Die Browserregression prüft dieselbe Nadir-Sperre nach zwei Rundflügen vom echten Einstieg aus, per Tastatur und Touch in den vier vorgegebenen Größen. Der ergänzende Operationsboard-Lauf deckt Transit und Rückkehr, Fremdeigentum und den JSON-Dateiexport/-import ab. Die beiden beigefügten Chromium-Ausschnitte zeigen je einen **bytegleichen Vorher/Nachher-Stand** derselben laufenden Fracht. Auch die Kartenbilder in 1024×768 und 820×1180 sind im lokalen Vergleich bytegleich. [1180×820](m4-u3/operationsboard-1180x820.jpg) · [390×844](m4-u3/operationsboard-390x844.jpg)

Der Draft enthält Tests, CI-Pfadfilter und Prüfdokumentation. Vor Übernahme kann der Draft geschlossen werden. Falls seine Prüfdateien später zurückgenommen werden, genügt der Revert des Prüfcommits. Für Spielstände ist kein Rückfall- oder Migrationsschritt erforderlich. Der 60-Minuten-Blindtest bleibt M4-U4.
