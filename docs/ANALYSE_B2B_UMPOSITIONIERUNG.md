# Aphros Void – B2b: bezahlte Umpositionierung zu vorhandenen Handelsangeboten

**30.10.2026 · [ANALYSE/DRAFT]** Basis: `main 906b7978d388e9af960443a2b7f4835b1d2a15c0`, v0.12.3, Regel 12, Schema 8. Nur Analyse-Dateien, keine Änderung an `index.html`, bestehenden Tests, Produktregeln, Goldenwerten, zentraler Roadmap oder Projektstatus. Verbindliche Regeln: `AGENTS.md`, `docs/ROADMAP.md`. Gepinnte B1-Ausgangsfälle aus [#36](https://github.com/tobiasfranziskus/Check/pull/36); Ursachen [#37](https://github.com/tobiasfranziskus/Check/pull/37); genau reproduzierter B2a-Warteansatz [#38](https://github.com/tobiasfranziskus/Check/pull/38).

## Problem

B2a zeigt, dass Warten statt zufälliger Leerfahrt in Kapitalengpässen Kostenunterdeckung vermeiden kann, aber über Monate nahezu keinen Warenverkehr erzeugt. Der produktive `bestesPaar()` bewertet Handelsangebote nur von der aktuellen Station aus. Ein Händler kann daher auf bezahlbare, positive Angebote an anderen Stationen nicht gezielt reagieren.

## Isolierter Versuchsplan

Alle drei Fassungen nutzen ausschließlich im Testprozess die bereits in #37 geprüfte, rein kalkulatorische Reserve (offene Arbeit + aktuelle Frachterhülle) und den B2a-Warteentscheid. Die Reserve ist kein neues Konto; sie ist eine **gemeinsame experimentelle Basis**, keine freigegebene Produktregel. Nur NPC3-Frachter werden beeinflusst.

1. **`wait`:** Exakt #38 `reserve_wait`; Endhash für jeden der vier Fälle muss mit dem B2a-Lauf übereinstimmen.
2. **`reposition`:** Wenn ein leerer NPC3-Frachter lokal zweimal kein rentables Angebot findet, andere erreichbare Startstationen nach existierenden `bestesPaar`-Angeboten untersuchen. Für eine mögliche Leerfahrt Kaufkraft nach aktuellen offenen Arbeitskosten, Reservehülle und voraussichtlichem Leertransport prüfen; Einkaufsmenge anhand realer Core-Preis-/Gebührenformeln begrenzen. Nur reisen, wenn Gebührenmarge nach prognostizierter beladener Fahrt **und** Leerfahrt positiv bleibt. Bevorzugung nach Ergebnis pro Gesamtfahrzeit, stabile ID-Reihenfolge bei Gleichstand. Ohne positives, finanzierbares Angebot weiter am Dock warten.
3. **`riskguard`:** Dieselbe Rechnung, aber Ursprung und Ziel der geplanten Erwerbs-/Lieferfahrt müssen nach dem vorhandenen Sicherheitsstatus `sicher` sein. Diese Regel ist eine *strenge untersuchte Risiko-Option*, keine Versicherung oder neue Kampfmechanik. Zwischenstationen werden wie bisher von der Kampf-Engine nicht als separate Exposition modelliert.

Der vorausgesagte Gewinn ist ein Momentangebot: Preise und zahlungsfähige Käufer können sich unterwegs ändern, es werden keine Waren oder Gelder reserviert. Käuferzahlung, realer Verkauf, Verlust, offene Arbeit und tatsächliche Ausgaben werden stündlich weiter auditiert. Weder Piratenstärke noch `besterAbsatz`, `ersatzkauf`, Sollflotte oder `halten` ändern sich. Die bisherige Gefahr einer unbezahlten `halten`-Reise wird nicht benutzt.

## Reproduktion und Qualitätsgates

`tools/b2b-umpositionierung.mjs` und das eigene Workflow `.github/workflows/b2b-umpositionierung.yml` rekonstruieren die vier Tag-90-Fälle aus den gepinnten #34- und #36-Commits. Jede Variante wird 275 Tage bis absolut Tag 365 fortgesetzt, jeweils mit uninstrumentiertem deterministischem Replay, stündlichen unabhängigen Einzelkassen-/Geld-/Warenaudits, 275 Tageshashes und sechs Save/Load-Wiederaufnahmen. Die B2a-Wartereferenz wird maschinell durch vier exakte Endhashes geprüft. Der Workflow führt zusätzlich `node --test tests/*.test.mjs` unter Node.js 22 aus.

**Technischer Erfolg**: Alle Vergleiche, Audits, Hashes und Save/Load bestehen. **Wirtschaftlicher Erfolg**: echte bezahlte Käufe, Verkäufe, positive Nettodeckung nach tatsächlichem Betrieb, finanziell erfüllbare Folgetransaktionen, nicht nur Überleben oder leere Flüge. Nicht ausgeführte CI und nicht bestätigte Zahlen werden nicht als bestanden ausgegeben.

## Entscheidungsgrenzen

Kein zusätzlicher Geldzufluss, keine kostenlose Reparatur oder Frachterhülle, keine neue Produktionsregel. Die Risiko-Option kann legitime profitable Routen ausschließen. Selbst real finanziertes Umpositionieren kann durch unterwegs veränderte Marktpreise, ein Zielsystem mit Piraten oder fremde Minerersatzpflichten scheitern. Aus vier konstruierten Spielernachlauf-Fällen darf keine allgemeine Verlustwahrscheinlichkeit abgeleitet werden. Bei einer späteren produktiven Regeländerung sind Regelversion/Migration, 13 Seeds × 90 Tage, Spielerfälle und Langzeitvergleiche separat erforderlich. Kein Merge oder Deployment.

## Ergebnis

Noch nicht bewertet: CI-Artefakt liefert Tabellen zu Käufen/Verkäufen, bezahltem Handel, Leerumpositionierung, Kostenunterdeckung, Lebensdauer und Tag-365-Flottenstand.
