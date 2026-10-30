# Aphros Void – v0.12.0: freie Raumfahrt und Siliziumindustrie (Entwurf)

Stand: 30. Oktober 2026. Grundlage: main `f01fd57` (v0.11.2); Branch `feat/freie-reisen-silizium`, [PR #18](https://github.com/tobiasfranziskus/Check/pull/18). **Keine Freigabe für Merge, Deployment oder Veröffentlichung.**

## Anlass und Regelentscheidung

Nach ausdrücklicher Produktentscheidung benötigen normale Reisen entlang der bestehenden Sternentore keinen verbrauchbaren Treibstoff mehr. Die Lieferkette soll nicht daran scheitern, dass Frachter aus treibstofflosen Stationen nicht ablegen können. Reisezeiten, Handelsrisiken, Betriebskosten und Piraten bleiben bestehen.

- Entfernt: Flugtreibstoff als Handelsware, Kauf-/Verbrauchslogik, NPC-Bordreserve R=2, Tankvorschau, Treibstoffkosten und Zielstations-Reichweitensperre.
- Hinzugefügt: **Silizium** als abbaubarer Rohstoff mit regulärem Marktpreis (Basis 24 ISK). Ein vorhandenes Eisvorkommen in Dravos ist zu Silizium umgestellt; Anzahl der anfänglichen NPC-Miner bleibt unverändert.
- Industrie: Bauteilrezept benötigt nun zusätzlich **1 Silizium** pro Bauteil (neben 2 Material). Die alten Treibstoff-Fabriklinien und der stündliche Stations-Treibstoffverbrauch entfallen.
- Die ursprünglichen Stations-Zielvorräte für Treibstoff werden als anfängliche Silizium-Zielvorräte genutzt. Diese Startverteilung ist eine **Balancing-Hypothese**, keine wirtschaftlich optimierte Parameterwahl.
- Jede Reise, auch Spielerbewegungen, NPC-Handel, Eskorten und Ersatzüberführungen, ist unabhängig von Lagerbestand und Schiffskasse möglich.
- NPC-Handelsplanung und Entladen wurden auf normale Ladung ohne Treibstoffreservierung vereinfacht. Es gibt keinen neuen RNG, keine neuen Laufzeitabhängigkeiten und keine neue Handels-KI.

## Bewusste Inkompatibilität

Auf ausdrückliche Freigabe des Projektverantwortlichen müssen alte Spielstände **nicht** übernommen werden. Das Schema bleibt 8, die Regelversion wird 9; eine Migration von Regelversion 8 nach 9 wird bewusst **nicht** angeboten. Alte Spielstände werden abgewiesen und nicht stillschweigend umgewandelt. Eine neue Partie ist erforderlich. Browserdaten werden dabei nicht automatisiert gelöscht oder überschrieben.

PR #16 für das autonome Wachstum von NPC1 verwendet ebenfalls eine frühere Regelversion 9 und kann **nicht unverändert** auf diese neue Regelbasis übertragen werden. Er bleibt vorerst Entwurf. PR #17 (Konzernnamen) ist eine getrennte Anzeigeänderung.

## Ausgeführte Prüfung

GitHub Actions mit Node.js 22: nach Anpassung der Funktionstests **39 bestanden, 0 fehlgeschlagen, 0 übersprungen**. Anschließend wurde ein 13-Seed-90-Tage-Langlauf mit zusätzlichem Test ausgeführt, **40 bestanden**, einschließlich stündlicher Geld-/Warenaudits, Neuaufbau derselben Seeds ohne Instrumentierung, Hashvergleich bei Tag 3/30/90 und finalem Save/Load. Der Langlauf wurde als temporärer CI-Test gestartet und soll dauerhaft als separat aufrufbares Werkzeug im Ordner `tools/` vorliegen.

Verwendete Seeds: 7, 11, 1, 2, 65535, 42, 1234, 98765, 3, 99, 2024, 2025, 314159.

| Kennzahl bis Tag 90 | v0.11.2 (historisch) | v0.12.0-Entwurf |
|---|---:|---:|
| Median Mangelstunden | 331 | 293 |
| Maximaler Mangelwert | 361 | 339 |
| Median tatsächliche NPC-Frachterverkäufe | 21.010 | 21.797 |
| Volle Spielstunden ohne NPC-Frachterverkauf | nicht vergleichbar erhoben | 0 bei allen 13 Seeds |

Die neue Wirtschaft hat über die 13 Läufe insgesamt 338.392 Einheiten Silizium gefördert und 325.223 als Industrieeingabe verbraucht. Der Siliziumkreislauf wurde damit im Spiel ausgeführt, nicht nur aus Konfigurationsdaten abgeleitet.

NPC1 hatte ab dem siebten Tag insgesamt 8 leere Stundenendkassen und insgesamt 14.318 ISK nicht gedeckte Betriebskosten über die vollständigen 90 Tage. Die historischen Werte 56 und 21.645 ISK wurden in einem abweichenden Vergleichsfenster erhoben und sind keine streng paarweise Kausalvergleichsgruppe. Die betriebliche Liquidität bleibt ein separates Problem.

## Risiken und Grenzen

- Die 13 Seeds und 90 Tage sichern keine unbegrenzte Stabilität.
- Die simulierte Verbesserung vereint freie Reisen **und** eine veränderte Rohstoffkette; die jeweiligen Einzelbeiträge wurden nicht separat isoliert.
- Einzelne Siliziumengpässe, Marktpreise und langfristige Investitionsanreize müssen bei größeren Galaxien erneut bewertet werden.
- Automatisches NPC1-Wachstum aus PR #16 ist hier **nicht** aktiv; dessen Geschäftsmodell und Betriebskosten sind auf dieser neuen Grundlage erneut zu prüfen.
- Kein realer Test mit iPad Safari, NAS, aktivem Spielerhandel über lange Zeit oder größerem Sternennetz.

**Entscheidung:** Technisch und im 13-Seed-Langlauf tragfähiger Entwicklungsstand, aber bis zur letzten Bereinigung des PR und einer gezielten Review noch keine Merge-Freigabe.
