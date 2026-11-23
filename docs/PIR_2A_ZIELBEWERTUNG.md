# PIR-2a – Lesende Zielbewertung [DRAFT / FORSCHUNG]

Basis Integrationskandidat #596 auf `e122967ef373117991e2fe46e26059564ea55fdc`. Dessen eigene vollständige Abnahme bleibt Voraussetzung; keine Veröffentlichung oder neue Produktfreigabe durch diesen Schritt.

## Implementiert
`piratenZielbewertung(state)` ist ausschließlich im PIR-Profil vorhanden. Sie nutzt die vorhandene PIR-1-Kontaktfilterung, Sicherheitsgeografie, Originalpreise (Erz, Eis, Wasser ab Nadir, Material) und die originale Verschleiß-/Lohnreserveberechnung. Nur aktive Beobachtung, vorhandener Flugdienst, mehr als 12 ISK gebundener Fluglohn, noch nicht abgelaufene Patrouille und nicht verbrauchte Piratenhülle liefern Kandidaten. Tatsächliche Fracht und Referenzwert, Transitrestzeit oder reale quadratische Freiflugdistanz, Restaktivminuten und vorhandene historische Begleitzuordnung werden lesend ausgegeben. Unbekannte Warenpreise ergeben null statt fiktiver Werte. Referenzwert ist weder erzielbarer Verkaufspreis noch Beute. Sortierung absteigend nach bekanntem Referenzwert, bei Gleichstand stabile ID; unbekannte Werte zuletzt. Transit hat keine Position und ist nicht im Freiflug verfolgbar. Freiflugkontakt garantiert keine Abfangbarkeit; die 12-ISK-Schwelle ist keine neue Weg-/ETA-/Rückkehrgarantie. Begleitzuordnung ist kein Nachweis funktionsfähiger Eskorte; Schutzwirkung bleibt null.

Legacy-Quelle `480-auto01-kampf.js` am katalogisierten SHA erneut gelesen: begrenzter Suchraum, autorisierte Kontakte und Vorrang Rückzug. Keine Übernahme der alten AP/S-Kampfautorität; heutiger `kontakte`-Filter und Rückkehrgrenzen werden wiederverwendet.

Kein Aufruf aus minute(), keine Änderung an KI-Zielwahl, RNG, Save, UI, Buchung, Preis, Waren, Statusautomat oder Schadenslogik. Forschungsausgabe ist kein Sensor-/Fog-of-War-Recht oder Spielerinformation. PIR-2b benötigt die gesonderte Freigabe von Sicherheitszonen, Dockrecht, Sensoren und tatsächlichem Abfang-/Abbruchverhalten. PIR-3 bleibt getrennt.

## Abnahme
Neue Tests prüfen eine real gebuchte F4-Eisfracht, Transit ohne erfundene Position, Originalwert, Reserve, Verschleiß, fehlende Eskortenwirkung, lesende Wiederholbarkeit, Save/Replay, originalen Tarif/Lohn und Auslaufen bei erschöpftem Kapital. Standardprofil erhält keine neue API. Die Tests sind geschrieben, nicht lokal ausgeführt. CI und gemeinsamer Langzeitvergleich auf dem endgültigen Stand erforderlich.
