# B-K10g – zweite 24er-Lieferung ohne Weltreset

**[ANALYSE/DRAFT, 02.11.2026]** [PR #124](https://github.com/tobiasfranziskus/Check/pull/124) auf #123 → #108. `main b4e604d6` weiterhin v0.12.5/Regel14/Schema8. Keine Produkt-, Preis-, Lohn-, Emissions-, Save- oder UI-Änderung; lediglich neuer Test-Runner und dieser Bericht. Anfangsbestände der beiden Nahrungsmärkte werden *einmalig* in einer explizit isolierten R15-/Schema9-Testwelt samt Warenledger-Gegenbuchung auf null gesetzt. Danach keine Testgutschrift und kein Reset.

## Verifizierter Befund und Testabgrenzung

Aus der [vollständig erfolgreichen korrigierten CI #41456258532](https://github.com/tobiasfranziskus/Check/actions/runs/41456258532), Code-Commit [`3353be7`](https://github.com/tobiasfranziskus/Check/commit/3353be7895076695ed82eef3ea10eae70420f63d), sind **154/154 Node-Tests, 0 Fehler, 0 übersprungen** belegt. Historische v10–v14-/Geografie-Referenzjobs waren erfolgreich, ein eigenständiger Sicherheitsgeografievergleich planmäßig übersprungen. **Die Ergebnisse sind für Seed42 und Seed7 identisch.** Ein vorangegangener erster [CI-Lauf #41455515978](https://github.com/tobiasfranziskus/Check/actions/runs/41455515978) war **rot: 153/154**, weil der neue Test am Ende einer abgewickelten zweiten Rückfahrt fälschlich **vollständig leeren Frachtraum** verlangte. Tatsächlich vorhandene, weiterhin bezahlte aber nicht erneut verkäufliche Rückfracht von **6 Einheiten** ist ein ökonomisch wichtiger Restbestand, kein fehlerhafter Buchungsausgang. Der Test wurde im Commit [`3353be7`](https://github.com/tobiasfranziskus/Check/commit/3353be7895076695ed82eef3ea10eae70420f63d) **nur** auf die echte Warenidentität `Zielverkauf + Quellrückverkauf + Restladung = 24` korrigiert. Die **zweite korrigierte CI #41456258532** ist vollständig grün; der erste rote Lauf gilt ausdrücklich nicht als bestanden.

**Beide 24er-Geschäfte erfolgen auf demselben, seit Weltstart laufenden Spielstand und über reale Core-Zahlungs-, Reise- und Verbrauchsabläufe.**

| Seed42 **und Seed7**, Zeitpunkt/Beleg | Erste Lieferung | Zweite Lieferung |
|---|---:|---:|
| Einkauf 24 Neu-Nahrung in Cyris | 816 ISK | 816 ISK |
| Tatsächlich verkaufte Einheiten Orion | 24 | **12** |
| Bezahlter Orion-Zielankauf | 1.368 ISK | **504 ISK** |
| Quellrückverkauf zurückgebrachter Ware | 0 | **6 Stück / 246 ISK** |
| Handelsgebühren | 86 ISK | **61 ISK** |
| Tatsächlich bezahlte Hin-/Rückflüge | 357 ISK | **358 ISK** |
| Händler-Cashflow der jeweiligen Runde | **+109 ISK** | **−485 ISK** |
| Nach Rückkehr noch beladene bezahlte Fracht | 0 | **6 Einheiten** |
| Neuer Nahrungskonsum der Haushalte in folgenden 12h | 7 | **0** |

**Konsolidierter Händler-Cashflow: `+109−485=−376 ISK` ohne Hüllenamortisation, Schiffsverluste und vollständige Beschaffungskette.** Die sechs bezahlten Rest-Einheiten bleiben als Ware an Bord; das negative Ergebnis ist ein realisierter Zahlungsmittelverlust, nicht automatisch der abgeschlossene Nettovermögensverlust.

**Käuferfinanzierung:** Vor der ersten Lieferung hat Orion 1.630 freie ISK. Nach 1.368 ISK Ankauf sind **262 ISK** frei; der lokale bezahlte Haushaltsendverbrauch von sieben Einheiten gibt binnen 12 Stunden **270 ISK** an die Station zurück. Damit steht vor dem zweiten Auftrag nur **532 ISK** Stationskaufkraft gegenüber 24 neuen Warenstücken. Zu diesem Zeitpunkt lagern **17** noch nicht bezahlte Neuware-Einheiten in Orion und der Haushalt besitzt **10 ISK**. Die zweite Original-Core-Ankunft verkauft deshalb nur zwölf Stück zu **42 ISK** (504 ISK) – verbleiben **28 ISK** Stationscash. Zwölf Stück bleiben vor der Rückfahrt auf dem Schiff; zurück in Cyris werden davon sechs für 246 ISK real verkauft, die übrigen sechs verbleiben als Fracht. Zwölf Stunden später bestehen **29 neue Nahrungseinheiten** im Orion-Lager, der Haushalt bleibt bei **10 ISK**, die Stationskasse bei **28 ISK**, und es findet **kein** weiterer bezahlter neuer Haushaltsverbrauch statt.

**Ursache:** Die erste profitable Frachterrunde setzt von der Station vorfinanzierte Bestands-ISK um. Der spätere Haushaltskauf deckt den Stationskauf nur zum kleinen Teil; die reale Käuferfinanzierung, nicht die Frachtproduktion, begrenzt die wiederholbare 24er-Lieferung. Die zwei aufeinanderfolgenden Händlerfahrten erzeugen **keine** neue allgemeine ISK-Nachfrage. Das ist noch kein kausaler Vergleich mit anderen Konsum- oder Preisregeln.

## Zu prüfender Abschluss

- **[TEST BESTANDEN]** Vollständiger korrigierter Workflow #41456258532 und beide Seeds 42/7 inklusive deterministischem Replay und Geld-/Waren-/Herkunfts-/Save-Audits. Zwei identische Seeds sind keine allgemeine statistische Marktsicherheit.
- unabhängige ISK-, Waren- und Neuherkunftsaudits, Save/Load und deterministische Hashreplays bleiben Anforderungen. Stundengrenzen sind im Test enthalten.
- Zwei kontrollierte 24er-Runden sind **keine** autonome NPC-/Spielerökonomie über 13 Seeds ×14/90 Tage; ungeschützte Piraten-/Schiffsersatz-/Jägerfinanzierung, reale iPad-/NAS-Abnahme und vollständige Chargen-/Produktionsvollkosten fehlen.
- Die B-K10h-Schwesteranalyse [PR #125](https://github.com/tobiasfranziskus/Check/pull/125) testet isoliert, ob die positive erste Blockpreis-Marge mit echten kleinteiligen Preisbuchungen wiederholbar wäre. **Keine Preisregeländerung ohne ausdrückliche Freigabe.**
