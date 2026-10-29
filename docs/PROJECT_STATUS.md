# Aphros Void – Projektstatus

Stand: 2026-10-29  
Spielversion: **v0.11.0**  
Maßgebliche Datei: `index.html` auf `main`  
Auditierter Quellcode (Blob-SHA): `7ff91a2611c01d7a1d8cddaccee1010c529ca22a`

## Zielumgebung
- iPad, Safari, Zugriff über bereits eingerichtetes NAS im lokalen WLAN.
- HTML, CSS, Vanilla JavaScript; kein Framework und keine zusätzlichen Laufzeitabhängigkeiten.
- Bestehende Spielstände und deterministische Simulationslogik erhalten.

## Erledigt
- GitHub-Zugriff und vollständige Kernmodule verifiziert.
- Unvollständigen externen DeepSeek-Codeabruf erkannt; dessen theoretische Jagdrechnung nicht übernommen.
- Tatsächliche Simulationslogik der `index.html` in einer isolierten JavaScript-Ausführung untersucht.
- 30-Tage-Jagdsimulationen mit drei festen Seeds und mehreren Wirtschaftsparametern ausgeführt.
- 30-Tage-Bergbauvergleich ausgeführt; Geldbilanz-Invariante bei den dokumentierten Hauptläufen geprüft.
- Ergebnisse: [Jagd-Audit](JAGD_AUDIT_2026-10-29.md) und [Architektur-/Code-Audit](CODE_AUDIT_2026-10-29.md).

## Bestätigte Befunde
- Ausgangsparameter: Spieler-Kopfgeldfaktor 2; Jäger-Betriebskosten 50 ISK je aktiver Spielstunde.
- Ohne Piraten im System erzeugt ein Spieler-Jäger auf Jagdauftrag keine weitere Arbeitszeit und damit keine laufenden Jagdkosten.
- Patrouillenchance von 600/1000 ist eine stündliche Kampfprüfung, **kein** Arbeitszeitfaktor.
- Betriebskosten des Spielers fließen grundsätzlich in regionale Fonds, statt automatisch Geld zu vernichten; Sicherheitskosten können die Geldmenge dagegen vermindern.
- Globale Änderung `world.betriebskosten.jaeger` betrifft auch Sicherheitsjäger und kann die gesamte Wirtschaft verändern.
- Einzeljäger in Meridian starben in drei kurzen Testläufen, ohne Kopfgeld; Sektorrisiko muss berücksichtigt werden.

## Neue bestätigte Qualitätsprobleme (2026-10-29)
- **Vorrang vor Balancing:** Die UI blockiert ältere Regelstände, obwohl die Core-Migration 6→7 funktioniert; bei Erhöhung der Regelversion müssen bestehende Spielstände geschützt werden.
- Bei Zerstörung eines beladenen Jägers fehlt die Warenvernichtung im Ledger (gezielter Auditfehler bestätigt).
- Strukturell beschädigte Spielstände können die Load-Prüfung passieren und die UI später zum Absturz bringen.
- Die angezeigten Kaufpreise enthalten nicht die tatsächlichen Handelsgebühren (900 ISK Anzeige, 936 ISK Last beim Jäger in Aldera).
- Routen-Skalierung sowie IndexedDB- und Autosave-Lifecycle separat untersuchen; keine iPad-Safari-Testaussagen.

## Offene Entscheidungen
1. Jagdbalancing: Faktor **3** ist auf Basis der getesteten Szenarien die vorsichtige Empfehlung. **Noch nicht implementiert.**
2. Weitere Prüfung mit realistischen Anschaffungskosten, eigener Flottenfinanzierung und gemischten Spieleraufträgen.
3. Spielstand-/Regelversion und zugehörige Migration bei tatsächlicher Regeländerung sauber aktualisieren.
4. Safari-iPad-Bedienung, Persistenz und NAS-Betrieb separat testen; in diesem Audit nicht geprüft.

## Nächster Schritt
**Zuerst** einen gezielten PR für Migrations-/Spielstandschutz mit Regressionstests; danach die Frachtbilanz korrigieren. **Erst dann** kleiner Implementierungs-PR für Kopfgeldfaktor 3 mit erforderlicher Regelmigration und reproduzierbarer Vorher/Nachher-Prüfung. `main` bis zur Freigabe unverändert lassen.

## KI-Arbeitsteilung
- Architektur, kritische Codeänderungen und Integration: GPT-6 (Medium/High je nach Umfang).
- Begrenzte Audits, unabhängige Simulationen und Testentwürfe: kostenloses DeepSeek oder Mistral, sofern verfügbar.
- Externe Ergebnisse immer auf vollständige Codebasis, korrekte Rechnung und wirklich ausgeführte Tests prüfen.
