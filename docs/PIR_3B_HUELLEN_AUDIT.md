# PIR-3b – unabhängiges Hüllen- und Buchungsgate [AUDIT / DRAFT]
Basis: #610, c557fcfb0e2b84fc0157844fdd4563f6e1eaea31. Produkt-main 85a94f9e. Kein Produktcode, keine neuen Regeln, kein Merge/Deploy. Void-Echoes-Katalog geprüft; altes Kampf-/Save-Modell nicht übernehmen.

## Befund aus Quellprüfung
Kampfhülle liegt in `kanon.piraten.kampf.huellen`, Abschreibung und Ersatzrücklage in `m_core_anlage`. Die bestehende Kampfaudit-Funktion rekonstruiert Hüllen aus Schussereignissen und verlangt weiterhin existierende Frachter-IDs. Entfernen eines zerstörten Schiffs würde deshalb mindestens diesen Audit und ggf. Original-Eigentums-/Frachtbelege berühren. Das derzeitige Importgate akzeptiert nur exakt in der laufenden Welt ausgegebene Saves. Es ist keine kryptographische Signatur. Der Schutz gegen konsistent verkürzte Live-Historie wird separat gemessen; keine Behauptung eines ausnutzbaren UI-/Importpfades.

## Ausführbarer Prüfstand
Original-F4 mit 50 Eis, 120 Lohn, 240 Tarif, 48 Hüllenpunkten und Referenzhash aa301a2025e848cb; Same-session roundtrip. Vier isolierte Fehlereinspielungen: nur Hülle, nur Journal, beides, konsistent gekürztes Journal. Einzelne Inkonsistenzen müssen am Live-Audit scheitern; beide gepaarten Varianten sind ausdrücklich diagnostisch und werden als JSON ausgegeben. Alle veränderten externen JSON-Importe müssen scheitern. Keine manipulierte Kopie wird gespeichert oder in die Originalwelt übernommen. CI steht bei Erstellung aus.

## Vorgeschlagene Reihenfolge (keine Regelentscheidung)
1. Autoritative, vollständige Hüllenereignisse mit eindeutiger Schiff-ID, Zeitpunkt und Ursache; Audit der chronologischen Wirkung, keine Verwechslung mit Abschreibung. Verlust als dauerhaft nicht einsatzfähige Hülle mit nachvollziehbarem Eigentum und historischer ID, bis die Original-Fracht-/Kaufbelege sicher kompatibel sind. Kein Löschen als Abkürzung.
2. Reparatur ausschließlich am realen Dock mit Eigentümerfreigabe, nachgewiesenem Werftbestand, einmaliger tatsächlicher Zahlung/Verbrauch und atomarer Abwicklung; ohne Geld/Material kein Effekt. Preis, Rezept und Dauer offen, keine Gratisheilung.
3. Totalverlust getrennt autorisieren: verbleibende Ladung und Treuhand eindeutig abrechnen; keine zweite Lieferung, keine Doppelvergütung, keine willkürliche Geldsenke. Pilotenschicksal, Bergung, Restwert und Versicherungen offen.
4. Erst danach bezahlte Eskorte und tatsächlicher Ersatzbedarf; Käuferliquidität und Langzeitkreislauf separat nachweisen (#611). Keine automatische Nachfrage.

Abnahme: Original-F4 vor/nach Schaden; unberechtigte Reparatur, falsches Dock, unzureichende Kasse/Material, Doppelbuchung, Zeit-/Save-Replay, bestehende zivile Referenzhashes, tatsächliche 90/365/730-Tage-Läufe. Keine Einführung neuer Spielparameter ohne Freigabe. Zentrale Roadmap unverändert während paralleler P0-/Codex-Arbeit.
