# M4-UX + P0 – unabhängiger Integrationskandidat 24.11.2026

[DRAFT] Gegen main `679ba6c1fdb05435164e29b2e21514ddaa676279`; UX [#599](https://github.com/tobiasfranziskus/Check/pull/599) `346dd4d9e9301f6dc08950d25ef51f3d462aab65`; P0 [#586](https://github.com/tobiasfranziskus/Check/pull/586) `df53016900f1f482c9da11fbad79c4a460c1c310`.

12 UX-Dateien und 6 P0-Markdown-Dateien aus gepinnten Blob-SHAs. Kein Überschneiden der Quelldiffs; seit UX-Basis 53c1dfc2 änderte main 16 andere Dateien. P0 auf aktuellem main konsolidiert. Core, Karriere-HTML/JS/CSS, Piratenprofil, Regeln, Preise, Save-Schema und Standalone-NAS unverändert.

Unabhängige Prüfung vor PR: NAS-Blob `320ea4b958f7f279e73b42143d90cf3c55fa5e91` identisch in main und UX. Inverse Entfernung nur der dokumentierten Pages-Hülle ergibt bytegleich die NAS-Datei. Manipulationsprobe am Speicherstatus ergibt absichtlich Ungleichheit. Eine primäre Karriereaktion und geschlossenes Alternativmenü bestätigt. Tatsächliche String-/Blob-Prüfungen im Connector, keine lokale Node22-/Playwright-Ausführung oder Sichtabnahme. Quellen-W5-CI erfolgreich; keine gemeinsame Integrationsabnahme daraus abgeleitet.

Vor Merge eigene gemeinsame CI am finalen Head, vollständige Node22-Regression einschließlich Dokumentlinks, Chromium/WebKit, NAS-Build, echte Menü-/Touch-/Save-Wege und visuelle Prüfung. Aktuelles main erneut abgleichen und Backup-Referenz anlegen. Nach Merge Pages-Deploy und Root nachweisen. Reales iPad/NAS und 60-Minuten-Blindtest offen. Quell-PRs erst bei nachgewiesener Integration mit Nachfolgerhinweis schließen; Branches erhalten. Keine Aktivierung PIR-2/3 oder neuer Wirtschaftsregeln.
