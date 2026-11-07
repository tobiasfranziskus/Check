# W5s-am – Exportverkauf, reale Lohneinkommen und lange Endnachfrage

**[DRAFT/ANALYSE · 07.11.2026]** [PR #241](https://github.com/tobiasfranziskus/Check/pull/241) ist eine getrennte Forschungsfortsetzung auf [#240](https://github.com/tobiasfranziskus/Check/pull/240). Ein Merge, eine neue Geldregel und ein produktiver Release sind **nicht** beschlossen. Der aktuelle Core `index.html` bleibt unverändert, ebenso GitHub Pages, Spieler-Slots und W5u #234.

## Hypothese und Forschungsgrenze

W5s-al zeigte bei der besseren 7-ISK-Stationsexportvariante mit insgesamt 7.000 einmalig neuen ISK nach Tag 365 weitere 10.072 tatsächlich bezahlte Wasserverkäufe; bis Tag 425 steigt diese Zahl auf 11.389. Die Haushaltskasse beträgt dann 11 ISK und die Station hält 6.673 ISK. Geld im Stationskonto ist nicht automatisch ein verdienter privater Haushaltsanspruch.

**W5s-am untersucht, ob und wann die bereits vorhandenen, rechtmäßig finanzierten Original-Lohn- und Gewinnpfade nach dem Ende der Exportfinanzierung noch wirkliche Endnachfrage erzeugen.** Es wird keine künstliche Beschäftigung und kein Privathaushaltszuschuss erzeugt. Die konkreten Forschungsparameter bleiben 7 ISK je real exportierter Einheit, bis 10 Wasser und 70 ISK pro Tag, 7.000 ISK insgesamt. Für einen beschlossenen Geldmodell-B-Deckel für alle Emissionsquellen reicht die W5q-Grenze ausdrücklich nicht.

## Neuer ausgeführter Codepfad

`tests/w5s-am-langzeit-einkommen.test.mjs` startet die **echte** finanzierte W5s-ai/R32-Welt mit rechtmäßig gekauften Minern und Frachtern, Original-Werft und bezahlter Überführung. In den zwei bisher kritischen Seeds 42 und 7 wird der bereits in #240 verwendete Exportmodus `station` im unveränderten Core genutzt. Der Test führt stündliche Original-Simulation bis Tag 730, jeweils nach 30 Tagen den Core- und Eigentümeraudit und ausgewählte JSON-/Hash-Prüfungen aus. Messpunkte: Tag 365, 425, 550 und 730.

Die exportierte Ware verlässt das reale Stationslager. Der externe Erlös ist bei `st_nadir`, nie `w5n_kunden`. Ein unabhängiger Testabgleich verlangt jederzeit:

- `sum(owners.cash) = 33.000 + s.w5q.minted`; kein Burn, keine zweite Emissionsquelle.
- `s.w5q.payout = 0` und `s.w5q.stationNet = s.w5q.minted`.
- `stations.st_nadir.lager.wasser = s.w5n.wasserProduziert - s.w5n.wasserVerbraucht - s.w5q.exported`.
- `w5n_kunden.cash = 1.400 + Original-W5o-Löhne/Gewinne + belegte W5s-Piloten-/Industrielöhne - bezahlt gekaufte Wasser`.

Das Messprotokoll trennt echte Wasserwerkschargen, Eisfrachten, bezahlte Wasserverbrauchseinheiten, Lohnarten, ausgezahlte Gewinne, Nadir-ISK, Haushalt-ISK und Exporte. Save/Load bei Tag 425 wird bis Tag 730 deterministisch gegengespielt. Drei Negativproben müssen nach ihrem Eingriff scheitern: **eine kontenneutrale Stationsschenkung ohne Haushaltsanspruch**, fingierte Wasserproduktion und fingierter Gewinnanspruch.

## Erfolgs- und Abbruchkriterien

Die Forschungsmatrix ist **nicht bestanden**, solange der Test/CI nicht abgeschlossen ist. Die im Test enthaltenen festen Kontrollen bis Tag 425 stammen aus #240; Zahlen für Tag 550 oder 730 werden **nicht vorhergesagt** und erst nach Auswertung tatsächlicher Test-Logs ergänzt. Ein technisch grüner Testlauf bedeutet weiterhin weder nachhaltige Wirtschaft noch eine legitimierte Außenkäuferfinanzierung. Insbesondere gilt:

1. Exportiertes Wasser ist eine reale Gegenleistung; das externe Forschungsbudget ist aber eine abstrahierte Gegenpartei, kein eigenfinanzierter Spielkonzern.
2. Reale Löhne setzen tatsächlich durchgeführte und finanzierte Arbeit voraus; Stationserlöse dürfen nicht einfach als „neue Löhne“ deklariert werden.
3. Spielerersparnisse bleiben frei; NPC-Insolvenzen sind möglich. Bei ausbleibenden Aufträgen darf eine Simulation stillstehen.
4. Für einen nächsten Mechanikschritt müsste ein **tatsächlich nachgefragter, voll vorfinanzierter zusätzlicher Stationsauftrag** samt realem Nutzwert, Lohn, Eigentümer, Material und späterem Absatz nachgewiesen werden, bevor er produktive Regeln ändert.

**[TESTSTATUS]** Ursprünglich bei Anlage offen; inzwischen abgeschlossener erfolgreicher GitHub-Lauf und Langzeitbefund in Abschnitt 5. Echte iPad-Safari-/NAS-Abnahme weiterhin offen.

## 5. Verifizierter CI-Abschluss und Langzeitbefund (07.11.2026)

**[TEST/CI ERFOLGREICH]** GitHub-Actions-Lauf [#42404431102](https://github.com/tobiasfranziskus/Check/actions/runs/42404431102) auf unverändertem Code-/Test-Head `31578c0`: **464/464 Node-22-Einzeltests bestanden**, 0 fehlgeschlagen/übersprungen, **7/7 ausgeführte Jobs erfolgreich**, 1 historischer bedingter Job übersprungen. Die Testlogs des Jobs `test` belegen für beide Seeds die folgenden echten Original-R32-Stände:

| Kennzahl | Tag365 | Tag425 | Tag550 | Tag730 |
|---|---:|---:|---:|---:|
| physisch ausgeführte W5q-Exporte | 1.000 Wasser | 1.000 | 1.000 | 1.000 |
| einmalig neues ISK | 7.000 | 7.000 | 7.000 | 7.000 |
| gesamter regulär bezahlter Wasserverbrauch | 16.551 | 17.868 | 17.868 | 17.868 |
| echte produzierte Wasserwerkschargen | 1.759 | 1.891 | 1.891 | 1.891 |
| wirklich abgeschlossene Eisfrachten | 353 | 379 | 379 | 379 |
| rechtmäßige Restkasse `st_nadir` | 5.172 ISK | 6.673 | 6.673 | 6.673 |
| private Restkasse `w5n_kunden` | 1.262 ISK | 11 | 11 | 11 |
| nachgewiesenes kumuliertes Haushaltseinkommen | 231.576 ISK | 248.763 | 248.763 | 248.763 |

**Bewertung:** Zwischen Tag 425 und Tag 730 findet **keine zusätzliche** wasserbezogene Produktion, bezahlte Eisfracht, Lohnauszahlung, Dividende oder Endabnahme statt. Der Cashbestand 6.673 ISK der Station ist reale Stationseigentümerliquidität, **kein Haushaltsanspruch**; bei 11 ISK Haushalt und 14 ISK je Wassereinheit ist kein weiterer regulärer Verbrauch möglich. Positive Geld-/Waren-/Eigentümeraudits und unveränderte Save/Load-Replays belegen lediglich korrekte Endlichkeit, **keine Nachhaltigkeit**. Seed42 und Seed7 liefern die gleichen Mengen/Geldzahlen, bei verschiedenen korrekten Hashes (d730: `7e84dbb37b18a552` bzw. `845d9d2e0ae18e7c`). Keine neue Geld-/Produktregel beschlossen.
