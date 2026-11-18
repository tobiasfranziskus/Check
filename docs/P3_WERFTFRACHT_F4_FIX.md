# P3 – bezahlte Nadir-Werfthülle und echte Eisfracht (Integration)

**[DRAFT / 18.11.2026]** Basis main `8374d5cfd47e17e39023ccdf92e64c84d346be54`, selektiv übernommene sieben Dateien aus dem nicht integrierten #491; Gegenbefund #493. Dies ist kein Release- oder CI-Abnahmebeleg.

## Problem und enger Fix

Nach Original-W5-Fertigstellung (5 Material aus 10 Erz) und echtem 750-ISK-Spielerkauf ist der W5ac-Transfer Nadir → Aldera mit 60 ISK vorfinanziert und nach 60 Minuten bezahlt. Die Herkunft `heimat=nadir` bleibt zu Recht erhalten. Das K1-Vertragsaudit von F4 akzeptierte bisher jedoch ausschließlich `heimat=aldera`, obwohl der Originalkern den Auftrag bereits annahm. Der J8-Angebotsklon zeigte ihn dadurch fälschlich als ausführbar an.

Der Vertragsaudit lässt ausschließlich im Regel204-Modus Nadir-Hüllen **mit W5-Produktions-ID, identischer Eigentümer-ID und abgeschlossenem W5ac-Überführungsbeleg vor Vertragsbeginn** zu. Alle vorhandenen W5ac-Validierungen (gekaufte Hülle, Bezahlminute, Treuhand, Route, Herkunft, Zeit, Eigentum) bleiben unberührt. Keine neuen Kaufrechte, Preise, Löhne, Startware, Käufer, Geldemission, Herkunftsänderung oder Save-Felder.

Ein positives J8-Angebot passiert jetzt denselben Original-Save-/Load-/Audit-Gate wie die echte Ausführung. Separate Node22-Tests prüfen die konkret reproduzierte S02-Kette mit Rückfahrt, fremdem/gefälschtem Überführungsbeleg, Weltgeld, kaltem Save und Replay. Zusätzlich müssen alle bestehenden CI-Workflows einschließlich Chromium und WebKit grün sein, bevor irgendeine Freigabe erwogen wird.

## Integrationsstatus

**[OFFEN]** Vollständige Node22-/CI-/Browserabnahme dieses Branches, tatsächlicher Merge und Pages-Deploy. Keine Aussage zu langfristiger Profitabilität oder wiederholbaren Folgefrachten ohne Original-S02-Nachweis. Echte iPad-/NAS-Abnahme offen.
