# B-K11l – erste real erreichte Liquiditätssperre und Zahlungsbilanz

**[ANALYSE/DRAFT · 03.11.2026]** [PR #150](https://github.com/tobiasfranziskus/Check/pull/150) auf #149 → #148 → #147 → #146. `main b4e604d6`, Regel14/Schema8 unberührt. Historisch gepinnter R15-/Schema9-Testkern und nur beobachtende Hooks.

## Ausgangslage

[B-K11k #149](https://github.com/tobiasfranziskus/Check/pull/149) belegt, dass fünf reaktivierte echte NPC-Händler lokale Produktionslöhne und Käuferkaufkraft in Aldera finanzieren; nach 48 Spielstunden stehen aber Aldera, NPC1 und NPC2 nahezu ohne frei verfügbares ISK da. Anders als bloße Kontostände sollen hier tatsächliche Transferbelege und Ablehnungsereignisse den Grund aufdecken.

## Untersuchungsdesign

Aus den beiden **unveränderten** B-K11j-Spielstandshashes direkt nach der dritten realen Teillieferung (`ed0151cdaa03a8a1` bzw. `61c198365462ede4`) werden ausschließlich die fünf zuvor testseitig angehaltenen NPC-Frachter über ihren originalen Handelsauftrag aktiviert. Anschließend 2 Seeds ×48 Stunden Original-Core; stündliche unabhängige Geld-/Warenaudits und tägliche Save/Load-Roundtrips.

Bei tatsächlichen Transaktionen werden protokolliert und **für Geld und offene Escrow-Reste gegengebucht**: stationäre NPC-/Miner-Warenkäufe und -verkäufe, beidseitige Gebühren, bezahlte Frachtkosten aus Vertragsreserven, bezahlte Produktionslöhne, realer lokaler Haushaltsverbrauch, NPC-Überschussabgaben an Fonds und Fondsüberweisungen an Stationen. Fehlende Deckung darf nicht durch pauschale Kontensalden erklärt werden. Verbleibende unerklärte Konto-Differenzen müssen separat ausgewiesen werden.

Für den ersten verifizierten Sperrpunkt werden nur **tatsächlich erreichte und vom Original-Core abgelehnte** Reservierungen gezählt, nicht ein rechnerisches hypothetisches Route-Angebot: Aldera-Produktionslohn-Escrow oder NPC-Frachter-Abflug nach bestehender Kauf- und Flugreserveprüfung. Den Zeitstempel und genauen Eigentümer, vorhandene und benötigte Mittel sowie den Empfänger erfassen.

Die Darstellung wird nach CI-Beleg mit exakten Zahlen und Grenzen ergänzt. Bis dahin **kein Test als bestanden behauptet**. Kein Produkt- oder Geldregelwechsel, keine Zusatzemission, keine Merges und keine Veröffentlichung. Der erstreaktivierte Handel ab künstlich isoliertem Save beweist weiterhin keine 13×90-Tage-Normalökonomie oder iPad-/NAS-Abnahme.
