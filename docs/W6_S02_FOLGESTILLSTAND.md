# W6 – S02-Folgestillstand [DRAFT / AUDIT]

26.11.2026. Auf #639, Head f224752ad1de5356d62d3faacf467f4daacbea17. Der geprüfte Kapazitätsfilter beseitigt die konkrete sh011-Vertragsblockade (1390 → 0 ISK gebunden), nicht die Flottenkrise. [90-Tage-Matrix](https://github.com/tobiasfranziskus/Check/actions/runs/45710006937), 3/3 Jobs success: S02 3 abgeschlossene W3-Fahrten, 10 Ersatzkäufe, 14 statt 13 Stilllegungen, 7150 statt 6850 Wasser, 75 Material, Haus 8425 statt 7329 ISK. Tag 30 bis 90 keine weitere Produktion; Standard- und K7-Referenzen identisch.

## Neuer reproduzierbarer Diagnoseauftrag

- Optionaler Beobachter im bestehenden Offline-Managerlauf. Keine geänderten Entscheidungen, Regeln, Preise, Savefelder oder Produktionsdateien. Der reguläre Pfad bleibt unverändert.
- Seed 42, normaler 90-Tage-Lauf mit gepinnten Hashes; zwei identische minutenweise beobachtete 30-Tage-Läufe. Vollständige Checkpoints gegen die unbeobachtete Kontrolle, Geld-/Waren-/Save-Audits.
- Letzte tatsächlich gebuchte Aufträge/Produktion, Änderungen der lebenden Hüllen und Lagerbestände, tatsächliche Angebotsgründe am originalen Entscheidungspunkt. Protokoll mit Kassen, Restaktivminuten, Aufträgen und NPC-Pausen.
- Bei beobachteten Hüllen-/Bestandsübergängen sowie am Ende: originale Schiffskauf-/Werftbefehle für die jeweils zuständigen Besitzer auf separaten validierten Kopien; bei erfolgreichem Nadir-Frachterkauf zusätzlich originale Überführung auf derselben Kopie. Abgelehnte Befehle müssen atomar sein, erfolgreiche buchungsrichtig. Kein Probeauftrag wird in die Originalwelt übernommen. Kein lückenloser Nachweis sämtlicher möglichen Kaufzeitfenster: Kassenänderungen ohne Bestands-/Flottenwechsel können dazwischen liegen.
- Frühere getrennte Experimente #587/#590–592 belegen, dass ein pauschaler Reservekauf kein allgemeiner Lösungsnachweis ist; keine Wiederholung dieser Strategie ohne Diagnose. 365/730 erst nach begründetem Gegenversuch.

Aufruf: `node tools/w6-s02-folgestillstand.cjs w6-s02-folgestillstand.json`.

Status bei Anlage: Implementierung des Offline-Audits, Ausführung/CI noch offen. Keine Main- oder Pages-Integration, keine Änderung an M4-U4/Ollama. Roadmap-Produktstatus bleibt unverändert.
