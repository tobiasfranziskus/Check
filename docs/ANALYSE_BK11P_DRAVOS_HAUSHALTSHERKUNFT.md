# B-K11p – Nahrungsverkauf durch sh015, echte Haushaltszahlung und Herkunftsgrenze in Dravos

**[ANALYSE/DRAFT · 03.11.2026]** Auf #153/B-K11o gestapelt; historischer isolierter R15-/Schema9-Core. **[MAIN]** b4e604d6 Regel14/Schema8 bleibt unverändert. Keine Produkt-, Preis-, Lohn-, Geld-, Save- oder Emissionsregeländerung, kein Merge.

## Frage

B-K11o hat für Seed7 den NPC1-Frachter sh015 mit 23 realen, voll bezahlten Handelsschleifen und +1.747 ISK in 48 Stunden gefunden; 9 Nahrungseinheiten gingen an Dravos. Nach sieben Tagen wurden 34 Nahrungseinheiten an Dravos verkauft, aber der Frachter später zerstört und der Konzern illiquide. Der Dravos-Haushalt hatte insgesamt 5 bzw. 9 Einheiten **neu produzierter** Nahrung tatsächlich gekauft. Sind das genau Einheiten aus der Lieferung von sh015?

## Beweismethode

Jeweils aus demselben ursprünglichen Seed7-Tick3960-Save wird **nur sh015** für den vorhandenen Original-Autohandel aktiviert, mit der bereits untersuchten testseitigen Einweg-Hinflugkostenroute, über 48 Stunden oder sieben Tage. Die bisherigen Endhashes `64644f6b43a2e824` und `00920e2a5507b371` müssen **vollständig unverändert** bleiben; der tatsächliche originale Station-Handel und originäre Core-Haushaltszahlung werden nie ersetzt.

Ein ausschließlich testseitiger Beobachter verfolgt für **Dravos**: ALT/NEU-Unterscheidung des originalen R15-Herkunftsbuchs, neue lokale Produktionsware, echte bezahlte Wareneinlagerung aus sh015 bzw. anderen Schiffen, etwaige neue Auslagerungen und bezahlte neue Haushaltskäufe im echten Stundenabschluss. Er führt dazu eine getrennte **FIFO-Konvention innerhalb der Neuware**. Nach jeder Stunde muss die eigene Buchung exakt mit `st_dravos.lokalNeuNahrung` übereinstimmen, zusätzlich zu den unabhängigen globalen Geld-/Waren-/Herkunftsaudits und Save-/Load-Hashes.

**Wesentliche Identifizierbarkeitsgrenze:** Die Core-Warenherkunft garantiert nur *Altware vor Neuware*, aber **keine dauerhaften individuellen Neu-Chargen-IDs**. Bei gemischter Neuware darf eine vom Beobachter nach FIFO zugeordnete Einheit **nicht als eindeutig vom Core bewiesene physische sh015-Einheit** ausgegeben werden. Das Verfahren nennt beobachtete Liefermengen und bezahlte Dravos-Haushaltskäufe exakt, unterscheidet nur dort eine eindeutig zuweisbare Quelle, wo keine anderen Neu-Bestände konkurrieren. Es erzeugt keine Leistung, Buchung oder Scheinzahlung.

## Status

Gezielter CI-Lauf ausstehend. Bis dahin keine Bestanden- oder Herkunftsaussage. **[OPTION]** Falls Lebensmittel tatsächlich anteilig bei endverbrauchendem Haushalt ankommen, nächstes Gate echte Dravos-Stationskasse vor und nach bezahltem Verkauf, daraus finanzierbare lokale Produktion und vollständige Frachter-Folgekosten/Schiffersatz. Weder 13×90d noch natürliche R15-Normalwelt oder iPad-/NAS-Abnahme; kein Merge.
