# B-K11o – echte Einzelhändlerzyklen und Betriebskapital

**[ANALYSE/DRAFT · 03.11.2026]** Gestapelt auf B-K11n #152 → #151 → #150 → #149 → #148 → #147 → #146; Hauptbranch b4e604d6 (Regel14/Schema8) unverändert. Isolierter historischer R15-/Schema9-Testkern; keinerlei Änderungen an Spielmechanik, Preisen, Löhnen, Fonds, Emissionen oder Speicherformat.

## Teilziel

Nach B-K11l–n ist klar: Positive Warenmargen decken oft nicht die **tatsächlich bezahlten Vertrags-Flugkosten**. Einweg-Kostenfilter allein stabilisiert weder Händler noch Versorgung. Gesucht wird deshalb ein konkreter NPC-Frachter, der **mindestens zwei gekaufte und danach real verkaufte Chargen** abwickelt, ohne den Konzernbestand an freiem Betriebsvermögen abzubauen. Produktive NPC-Schiffe besitzen keine eigene Kasse; statt einer fiktiven Pilotenfinanzierung wird die **Original-Konzernkasse** genutzt.

## Experiment

Exakt dieselben gepinnten B-K11j-Drittlieferungs-Saves bei Tick3960, Seeds 42/7. Für jeden der fünf dort früher künstlich angehaltenen Frachter sh014–sh018 werden **jeweils nur diese eine** bestehende NPC-Handelsorder freigegeben; andere NPC-Frachter bleiben angehalten. Je Seed, Frachter und Modus Originalroute oder testseitiges B-K11m-Hinflugkosten-Gate werden 48h echte Original-Core-Schritte ausgeführt. 20 Gegenwelten, nicht 20 natürliche Startwelten.

Wirkliche Käufe und Verkäufe werden frachter- und chargengenau als FIFO belegt, bestehende Anfangsladung separat, Gebühren und Vertrags-Fahrtstunden sowie aktuelle Konzernkasse auditiert. Echte Handelsleistungen und lokale Nahrungslieferungen und Haushaltszahlung werden von Lagerbeständen, gebundenem Escrow und hypothetischer positiver Kursmarge getrennt. Kontrolliert werden alle sechs Verbraucherstationen, Waren/Geld/Herkunft und Save/Load. Unerklärte Zahlungen oder Schiffsverluste werden markiert und nicht als Gewinn verbucht.

**Erfolgskriterium:** Mindestens zwei real abgeschlossene Kauf-/Verkauf-Chargen, nicht sinkendes tatsächliches Eigentümer-Betriebskapital inklusive bezahlter Frachterkosten, keine unbekannte Quersubvention und reale Versorgung. Nullhandel und gehaltene, nicht verkaufte Frachten zählen nicht als Erfolg.

**Status:** Test wird erst nach GitHub-CI mit Zahlen und belegten Hashes ausgewertet. Keine 13×90-Tage-Normalwelt, keine iPad-/NAS-Abnahme, keine Freigabe für Regeländerung, Merge oder Deployment.
