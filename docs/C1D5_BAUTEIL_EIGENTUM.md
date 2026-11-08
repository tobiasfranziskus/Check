# C1d-5 – Bauteileigentum und echte Direktverarbeitung statt Doppelankauf

**[DRAFT / FORSCHUNG · 08.11.2026]** Nachfolger von [C1d-4 / #257](https://github.com/tobiasfranziskus/Check/pull/257). Der neue isolierte Original-Core-Modus `aphros-research:C1d-5:owner-custody-storage-v1` (**Regel 3310**) schließt die erkannte Lücke zwischen Bauteilproduktion und Lagermodulmontage. **Keine Produktregel; kein Merge, keine Pages-/NAS-Veröffentlichung.** Regel14-/Schema8-Spielstände, C1d-2-Regel3307, C1d-3-Regel3308 und C1d-4-Regel3309 bleiben unverändert.

## Kernbefund

Der bisherige W5b-Forschungs-Code zahlte bei der Bauteilproduktion die Rohstoffe (Material und Silizium) aus der Station, stellte die **selbst gefertigten Bauteile** im Stationslager ein und verlangte beim eigenen anschließenden Lagermodulbau **nochmals 2 × 170 ISK an diese Station**, obwohl kein ursprünglicher Ankauf der Bauteile durch die Station dokumentiert war. Die Bauteile waren im alten Core dadurch ohne Eigentumsvertrag doppelt als Kostenquelle behandelt worden.

**C1d-5 wählt bewusst die vertragsfeste Direktverarbeitung mit reiner Stationsverwahrung, nicht den alternativen Stationsankauf:**

1. Die Station verkauft `house` nach den vorhandenen W5b-Regeln **4 Material + 2 Silizium** für **4 × 48 + 2 × 24 = 240 ISK**. Vorab sind zusätzlich alle **16 Fabrikminuten** aus der Herstellerkasse gedeckt. Durch diese bezahlte Vorleistung gehören die daraus erzeugten **2 Bauteile** dem Hersteller `house`; die Station ist ausschließlich physischer Verwahrer, nicht Eigentümer.
2. Bei Fertigstellung erstellt **derselbe autoritative W5b-Core** ein unverwechselbares, nach Produktionsfolge nummeriertes Eigentumslos `C1D5-BT-0001` usw.: `owner=house`, `custodian=st_nadir`, Menge 2, Entstehungs-Tick, zunächst keine Verarbeitung. Der Original-Warenaudit zählt sie weiterhin nur **einmal** im Stationslager.
3. Beim Lagermodulauftrag prüft der Core, dass diese echte Ware noch im Lager vorhanden ist, die Eigentumslose gültig sind und mindestens ein unbenutztes Los dem Hersteller gehört. Das älteste freie 2er-Los wird mit dem tatsächlichen Verarbeitungstick und der eindeutigen Lagermontage-ID verbucht. Die 2 Bauteile werden physisch und im Ledger **einmal** verbraucht.
4. Für die eigene Direktverarbeitung entfällt allein im opt-in-Modus die unberechtigte erneute `170 × 2`-Stationszahlung. **12 ISK Fabrikarbeit** sind weiterhin vor Start auf dem Original-W5b-Treuhandkonto zu reservieren und innerhalb von 12 Ticks auszuzahlen.
5. Das fertige Lagermodul ist danach eine echte Herstellereigenware. Erst nach **vollständig vorfinanzierter** gemeinsamer 4er-Fracht und nachgewiesenem Frachter-Rückflug darf der endliche Käufer `export` den bereits vollständig finanzierten Kauf erfüllen. Die C1d-4-Rechnung (340 Vorschuss + 1.380 Kaufrest-Treuhand) bleibt für diese neue Forschung weiterhin ein echter Käufervertrag, **nicht** eine Kredit- oder Emissionsregel.

## Finanzierungsfolgen – keine erfundene Geldquelle

| Buchung oder Kennzahl | Alte C1d-4-Forschung | C1d-5-Direktverarbeitung |
| --- | ---: | ---: |
| Vier Bauteillose: Material/Silizium an Station | 4 × 240 = 960 ISK | 4 × 240 = 960 ISK |
| Vier Lagermontagen: nochmals Bauteile an Station | 4 × 340 = 1.360 ISK | **0 ISK**, eigene Bauteile |
| Vier Bauteilfertigungen, echte Lohnminuten | 64 ISK | 64 ISK |
| Vier Lagermontagen, echte Lohnminuten | 48 ISK | 48 ISK |
| Einmalige Gesamtfracht | 300 ISK | 300 ISK |
| Spedition: echter Pilotlohn aus eigenem Geld | 240 ISK | 240 ISK |
| Käufer zahlt aus endlichem Konto | 1.720 ISK | 1.720 ISK |
| Herstellerkasse nach vierter Bauteilcharge, vor Kaufvorschuss | 312 ISK | **1.332 ISK** |
| Herstellerkasse nach vierter Montage und Fracht | 0 ISK | **1.360 ISK** |
| Herstellerkasse nach externer Kaufrestzahlung | 1.380 ISK | **2.740 ISK** |
| Neue ISK | **0** | **0** |

Die **1.360 ISK Unterschied** sind kein neuer Geldzufluss, sondern vier entfallene, sachlich unberechtigte Zahlungen an den Lagerverwalter. Das entsprechende Stationskapital fällt geringer aus. Gerade dadurch verschwindet die in C1d-3/4 gemessene 340-ISK-Lücke für vier Chargen **in diesem neuen Eigentumsmodell**. Das ist eine Korrektur des Kosteneigentums, **kein Nachweis einer allgemein krisenfesten Wirtschaft**. Die 340-ISK-Käufervorauszahlung ist für die vierte Montage nicht mehr wirtschaftlich notwendig, bleibt aber als legitimer fester Bestellvertrag bestehen.

Die auf `house` entfallenden 960 ISK bezahlter Material-/Siliziumankauf sind echte Einnahmen der Station; ihre Herkunftskosten, Erzkosten, bezahlter Siliziumbergbau, ursprüngliche Minerschiffe, ursprüngliche Frachterhülle, Verschleiß, Wartung und die Finanzierung der übrigen Akteure sind im hier gezeigten Verkaufsdeckungsbeitrag noch **nicht** als konsolidierte Vollkosten enthalten. Deshalb keine Nettogewinn- oder 365-Tage-Nachhaltigkeitsaussage.

## Audit, Kontrolle und Grenzen

- Produktionslos-Zahl = Anzahl wirklich abgeschlossener Teileaufträge; IDs, Eigentümer, Verwahrstation, Stückzahl, Buchungsticks und Zuordnung zur jeweiligen Endmontage deterministisch und nach Originalzählern geprüft.
- Die parallel unverändert gültigen Geld-/Waren-/Arbeits-/Fracht-/W5b-/C1d- und C1f-Audits müssen ebenfalls stimmen. Ein gefälschter Eigentümer, falscher Verwahrer, doppeltes Los, manipulierte Menge, Montage-Zuordnung, Zeit, Kaufpreis, Warenbuchung, Pilotenlohn oder Minting wird abgewiesen.
- **Direkt ausgeführt, kein offizieller CI-Ersatz:** 6/6 neue C1d-5-Tests und zusätzlich 12/12 vorhandene C1d-3/C1d-4-Tests im selben tatsächlich ausgeführten JavaScript-Core-Harness, zusammen **18/18**. Alle Seed-42/7-, Save/Load-, Replay- und Fälschungsprüfungen bestanden. Vier fertige Module Tick352, nach korrekter Rückfracht und Käuferabnahme Tick592. Endhash Seed42 `a08511483ad5350a`, Seed7 `b83514514e50182c`.
- Prüfbefehl: `node --test tests/c1d-5-bauteil-eigentum.test.mjs`; vollständige Node22-Regression und eigene Forschungs-CI separat zu bestätigen. iPad-Safari/NAS noch nicht abgenommen.
- Kein Rückabwicklungs-/Insolvenzmodell für einen gescheiterten Vorauftrag; keine globale Geldemissionsregel; keine reproduzierbare weltwirtschaftliche Folge-Nachfrage; Erzförderung noch nicht auf die Modell-C-Frequenz 4 bezahlte Minuten je Stück angepasst.

**Nächster Wirtschaftsschritt [ANALYSE/OPTION]:** Auf Regel3310 die unabhängige **konzernübergreifende** Vollkosten- und Stationsbilanz aller vier Produktionsketten einschließlich Erz, Minern, Silizium, Material, Schiffskapital, Fracht, Löhnen und Kaufvertrag überprüfen. Nicht wieder einfach einen neuen Geldemissionspfad hinzufügen. Erst dann weitere dauerhafte Käufer-/Etatvarianten testen.
