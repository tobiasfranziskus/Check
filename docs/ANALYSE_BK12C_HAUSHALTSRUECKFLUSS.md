# B-K12c – Bezahlter Haushaltsrückfluss hilft, ersetzt aber keinen dauerhaften Käufer

**[ANALYSE/DRAFT · 03.11.2026]** [PR #158](https://github.com/tobiasfranziskus/Check/pull/158), gestapelt auf [B-K12b #157](https://github.com/tobiasfranziskus/Check/pull/157), davor #156/#155. **[MAIN]** `b4e604d6` bleibt bei Regel14/Schema8; kein Produkt- oder Migrationscode geändert, kein Merge/Deployment. Alle Zahlen stammen aus dem **historischen R15-/Schema9-Testkern** mit dem nicht beschlossenen Lohn von **4 ISK pro Produktionsminute**.

## 1. Ursache und präzise Gegenhypothese

B-K12b hat einen vor Rohstoffkauf durch einen realen Fonds gesperrten Endauftrag bewiesen. Für 1 Nadir-Nahrung werden tatsächlich **2 Eis × 22 = 44 ISK** bezahlt und anschließend **6 Minuten × 4 = 24 ISK** Fabrikarbeit vergütet. Der zuerst vollständig vom Fonds bezahlte Endauftrag kostet **68 ISK**, ohne Ferntransport. Auf sieben Tage ist der Fonds endlich. Zugleich bleibt im B-K12b-Bestandsarm der Nadir-Haushaltslohn aus der Produktion ungenutzt liegen: **552 ISK** (Seed42) bzw. **720 ISK** (Seed7). Diesen bestehenden Geldrückfluss prüfen wir, statt neue ISK oder Preisregeln einzuführen.

**Testfrage:** Wenn der durch reale Produktion bezahlte Haushalt beim tatsächlichen Neu-Endverbrauch aus seinem **bereits verfügbaren Bargeld** bis zum **unveränderten lokalen Spotpreis** beiträgt und der Fonds nur die tatsächlich noch offene FIFO-Kostenlücke aus dem schon **vor Produktionsbeginn** gesperrten Original-R15-Escrow zahlt, wie stark verbessert sich die Folgefinanzierung?

Das ist **eine testseitige Teilzahlung des Haushalts**, gerade **kein** unveränderter R15-Haushaltskauf. Der originale R15-Kern verlangt vollständige Spot-Bezahlbarkeit. Eine Teilzahlungs-/Fonds-Kombination wäre eine gesondert zu beschließende Produktregel. Nadir-Altbestände Eis/Nahrung und Anfangsledger sind entsprechend B-K12b entfernt; die konkurrierenden NPC-Frachter bleiben gehalten. Alle anderen ursprünglichen Konto-, Produktion-, Bergbau-, Geldquellen-/Senken- und Kampfregeln laufen wie zuvor.

## 2. Geld- und Warenkette

1. **Tick 0:** Original-Core-Vertrag sperrt tatsächlich vorhandene **128 Fonds-ISK** vor Rohstoffkauf und Fertigung. Kein Kredit, kein erfundener Geldbestand. Das Beschaffungsgate lässt je Auftrag nur **2 echte Eis** für genau **1 neue Nahrungscharge** zu.
2. **Tick 100:** Die Station zahlt wirklich **44 ISK** für 2 Eis an den Miner und beginnt die beauftragte Produktion.
3. **Tick 106:** Echte historische Produktionsarbeit wird mit **24 ISK** aus vorher vorhandener Stationskasse an den Haushalt bezahlt. Herkunft und FIFO-Charge bleiben prüfbar.
4. **Tick 120:** Die fertiggestellte **neue** Einheit wird real verbraucht. Der Haushalt überträgt **24 vorhandene Lohn-ISK** an die Station. Der Fonds überträgt **44** aus seinem vorher gesperrten Vertrag. **68 ISK bezahlt, 68 ISK wirkliche Stückkosten**, 84 ISK überschüssige Reservation werden erstattet.

Die Rechnung ergibt sich aus **tatsächlichen Core-Zahlungen**, nicht aus einer angenommenen generellen Subvention. Weder Originalpreise noch Lohnsatz, Preisformel, Quoten oder Emissionsregeln werden verändert. Auf dem Fondskonto ist der Nettoaufwand pro solcher Charge **44 statt 68 ISK**. Die Station finanziert auch in B-K12c weiterhin den Rohstoffkauf und ihre Lohnreserve vorübergehend aus eigenem Betriebskapital; kein vorfinanzierter Produktionsvorschuss wird behauptet.

## 3. [TEST] Siebentage-Gegenprobe, exakt gleicher Ausgangsseed

| Metrik | Seed42 B-K12b Bestand | Seed42 B-K12c Haushaltsbeitrag | Seed7 B-K12b Bestand | Seed7 B-K12c Haushaltsbeitrag |
|---|---:|---:|---:|---:|
| Wirklich bezahlte Nahrungseinheiten | 23 | **38** | 30 | **48** |
| Ertrag gegenüber ursprünglicher Stückzahl | Referenz | **+65,2 %** | Referenz | **+60 %** |
| Gesamte reale FIFO-Kosten | 1.564 ISK | 2.584 ISK | 2.040 ISK | 3.264 ISK |
| Davon Fondszahlung | 1.564 ISK | **1.672 ISK** | 2.040 ISK | **2.112 ISK** |
| Davon Haushaltszahlung aus Lohn | 0 ISK | **912 ISK** | 0 ISK | **1.152 ISK** |
| Fondsauszahlung **je bezahltem Stück** | 68 ISK | **44 ISK** | 68 ISK | **44 ISK** |
| Aus echtem Dienst/Handel vereinnahmter Fonds-Cash | 682 ISK | **772 ISK** | 1.121 ISK | **1.229 ISK** |
| Fonds-Endcash | 118 ISK | 100 ISK | 81 ISK | 117 ISK |
| Haushalts-Endcash Nadir | 552 ISK | **0 ISK** | 720 ISK | **0 ISK** |
| Letzter Tag mit nachgewiesenen neuen Fondseinnahmen | Tag 1 | **Tag 2** | Tag 2 | **Tag 3** |
| Mangelstunden bei originalem 2/h-Verbrauch | 168/168 | **168/168** | 168/168 | **168/168** |
| Historischer 7d-Hash | `a1001b69ad6d11af` | `3461775aeb999c23` | `4bfab4527db048c9` | `4848efbdd3a93e18` |

Die Gesamtauszahlung aus dem Fonds steigt in beiden neuen Armen, **weil tatsächlich mehr Produkte verkauft werden**. Das ist kein Widerspruch zur Verbesserung: Die **vollständige belegte Gesamtkostenrechnung** sinkt pro ausgelieferter Einheit für den Fonds um 24 ISK. Nie eine unfinanzierte Nahrungscharge als Verkauf zählen. Anders als eine bloße Liquiditätsverschiebung in der Buchhaltung fließen 24 echte Lohn-ISK beim Konsum wieder an die Station zurück.

Reale Fondsidentität nach 7 Tagen, ohne frei erfundene Einnahmen:
- **Seed42:** `1.000 Anfang + 772 echte Betriebs-/Gebührenzahlungen − 1.672 vollständige Restzahlungen = 100 ISK`.
- **Seed7:** `1.000 Anfang + 1.229 echte Betriebs-/Gebührenzahlungen − 2.112 vollständige Restzahlungen = 117 ISK`.

Alle zusätzlichen Fondseinnahmen aus tatsächlich bezahlten Betriebsleistungen/Gebühren enden aber wieder spätestens an **Tag 2** (Seed42) beziehungsweise **Tag 3** (Seed7). Das Haushaltseinkommen wird zuverlässig in den Nahrungsmarkt rückgeführt, doch der Rohstoff-/Miner- und Fondsaufwandskreislauf regeneriert dadurch nicht dauerhaft. Diese Testwelt erbringt außerdem maximal eine neue Einheit pro Stunde bei zwei Einheiten ursprünglichem Bedarf; deshalb sind **168 teilweise mangelhafte Stunden** kein exakter isolierter Beleg des Finanzierungsmangels, aber auch keine erfolgreiche Versorgung.

## 4. Tests, Grenzen und nächste Entscheidung

**[TEST]** Am ersten korrigierten Testhead `6b0b9402` hat [die gezielte Analyse-CI #41695759667](https://github.com/tobiasfranziskus/Check/actions/runs/41695759667) **3/3 Tests bestanden**, 0 Fehler/Skip. Seeds 42/7 je 7 Tage sowie die ursprünglichen B-K12b-Fälle. Stündliche unabhängige Geld-/Waren-/Herkunftsaudits, Original-R15-Vertrag und FIFO-Produktionskosten, tägliche Save-/Load-Hashes. Der folgende Testcommit `1fcfddc1` pinnt zusätzlich die beiden neuen deterministischen 7d-Hashes, echten Lohn-/Rohstoffrückflüsse und die Käufer-Kassenidentität; **CI am finalen Dokumentations-/Testhead gesondert prüfen**.

Die erste CI am ursprünglichen Entwicklungshead `72ea1304` scheiterte an **einer zu strengen Testaussage** („Gesamtfondsaufwand muss fallen“). Weil mehr Einheiten produziert und bezahlt werden, kann die Gesamtauszahlung steigen, obwohl die Fondsbelastung **je Stück** sinkt. Diese falsche Metrik wurde korrigiert, die Kernbuchungen nicht. Kein bestehender Geld-/Waren-/Herkunftsaudit wurde abgesenkt.

**[NICHT GEPRÜFT]** Keine aktive Frachter-Wirtschaftswelt, kein 13×90d-Gate, keine Sicherheit-/Piraten-/Schiffsersatz-Vollkostenintegration, kein neuer Geldmodell-B-Beschluss, keine reale iPad-/NAS-Abnahme. Das alte R15-Testlohnmodell ist **nicht** bereits in main. Die Test-Teilzahlung hat keine produktive Save-Migration und darf nicht still nach main übernommen werden.

**Empfehlung [ANALYSE/OPTION]:** Geldrückfluss aus tatsächlich bezahltem Arbeitseinkommen ist **ein kausal positiver Baustein**, aber keine Dauerversorgung. Das nächste kleine Prüfziel ist die **vollständige Netto-Geldkette der Miner- und Fondsleistungen**, einschließlich Miner-Betriebskosten und zeitlicher Kassenerschöpfung. Erst wenn zwei und mehr aufeinanderfolgende Produktions-/Endabnahmeketten durch **erneuerbare Nettoerlöse** finanzierbar sind, wäre ein produktiver Kandidat denkbar. Keine Preis-/Lohnreform, keine gratis Rettung, keine Emission ohne ausdrücklich separate Freigabe. [MAIN] unverändert.
