# GitHub-Pages-Spieltest – 06.11.2026

## Zweck
Der gewohnte GitHub-Pages-Haupteinstieg soll den **bedienbaren W5-Forschungsmodus (Regel 19)** mit Karte/2D-Werft, bezahlter Bergbau-, Transport-, Raffinerie- und Werftkette öffnen. Dieser Spieltest ist **keine Produktfreigabe** für die zusätzliche, im selben Code enthaltene W5s/R32-Testökonomie. Letztere ist derzeit primär in Node-Audits zugänglich.

## Versionsschutz
- Unveränderter bisheriger [MAIN]-Spielstand v0.12.5 / Regel14 / Schema8: `versionen/v0.12.5/index.html`, Original-Blob `a2bcf5d2f9d3322c2a5edd4440eb77d094c84b9a`, Original-main `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`.
- Zusätzlich unveränderlicher Sicherungs-Branch: `backup/pages-v0.12.5-20261106`.
- Der Root-Einstieg leitet nur *ohne Query und Fragment* auf `?modus=w5werft` weiter. `?modus=w5konten` bietet dieselbe W5-Testwelt in der Kontenansicht. Ein explizites `?modus=` wählt weiterhin seinen jeweiligen Modus.
- Hauptspiel und Forschungswelt haben getrennte IndexedDB-Slots. Alte Daten dürfen weder gelöscht noch still migriert oder überschrieben werden.
- W5-Spieltest-Quelle: `feature/w5s-p-finanzierter-npc-erzlieferant-20261106` / `8b6b8853eadbf09471d4eee4cd4123912e3bf172`, mit ausschließlich Pages-Einstiegs- und Archivlinkanpassungen.

## URLs nach einer freigegebenen Pages-Veröffentlichung
- Hauptlink: https://tobiasfranziskus.github.io/Check/ (W5-Forschungsansicht)
- W5-Konten: https://tobiasfranziskus.github.io/Check/?modus=w5konten
- Original: https://tobiasfranziskus.github.io/Check/versionen/v0.12.5/

## Grenzen und Abnahme
Bis zur bewussten Integration/Veröffentlichung ist dieser Branch **nicht live**. Vor Freigabe Node-22-Regressionsprüfungen und CI auswerten. Echter iPad-Safari-Test auf Karte/Querformat/Touch, Save/Load und GitHub-Pages-Netzwerkpfad bleibt explizit offen. W5s/R32-Wirtschaftsannahmen sind keine genehmigten Produktregeln; das sichtbare W5-Frontend läuft weiterhin mit Regel 19.
