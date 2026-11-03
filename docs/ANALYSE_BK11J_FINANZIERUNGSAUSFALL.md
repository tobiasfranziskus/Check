# B-K11j – Erster realer Finanzierungsausfall nach zweiter bezahlter Lieferung

**[ANALYSE/DRAFT, 03.11.2026]** [PR #148](https://github.com/tobiasfranziskus/Check/pull/148) auf [#147](https://github.com/tobiasfranziskus/Check/pull/147) → [#146](https://github.com/tobiasfranziskus/Check/pull/146) gestapelt. Historisch gepinnter, isolierter R15-/Schema9-Testkern; **[MAIN] b4e604d6 / Regel14 / Schema8 unverändert**. Ausschließlich Test-/Dokumentationsinstrumentierung. Keine neue Preis-, Lohn-, ISK-, Save-, Produktregel oder Emission.

## Gleiche Ausgangswelt, zwei Fragen

Für Seeds 42/7 zunächst die echte 24er-Lieferung mit Fonds-Mindeststand, danach **im selben tatsächlichen Core-Save** 24 weitere selbst finanzierte Eis→Nahrung→Aldera-Haushalt-Lieferungen bei **ausgeschalteter Fonds-Mindeststandsüberweisung**. Die beiden B-K11i-Referenzhashes bleiben unverändert `fecad114e0b10608` / `1bd24ad0814a5dc1` bei Tick 2640. Nadir startet die Fortsetzung mit **917/1.041 ISK**; Aldera-Haushalt mit **796/956 ISK**, Spielerhändler 2.250 ISK. Keine Waren-/Kassen-Zurücksetzung oder kostenlos erzeugte Charge.

### A. **Aktiver** Folgeauftrag: erster gescheiterter Geschäftsabschluss

Die Welt läuft reale 480 Core-Minuten mit Original-Minerverkauf/-Produktion weiter. Danach fährt der **wirkliche Spielerfrachter** mit bezahlt reserviertem Flug wieder von Aldera nach Nadir; am tatsächlichen Originalmarkt sind 37 neue Nahrungseinheiten verkaufbar. Dort versucht er, eine dritte 24er-Lieferung zum bestehenden, nicht angepassten Aldera-Vertragspreis von **54 ISK pro Stück** vorzubereiten. `m_core_vertrag.reservieren` lehnt den Antrag wegen der echten **Käuferkasse** ab. Kein dritter Warenkauf, keine vertragslose Lieferung und kein Geschenk.

| Beleg bei drittem Bestellversuch | Seed42 | Seed7 |
| --- | ---: | ---: |
| Aldera-Haushaltskasse | **796** | **956** |
| Erforderliche verbindliche Haushaltsreserve | **1.296** | **1.296** |
| **Finanzierungslücke Käufer** | **500** | **340** |
| Nadir-Lager Nahrung / davon verkaufbar | 63 / 37 | 63 / 37 |
| Nadir-Quellkasse | 517 | 641 |
| Spieler-/Frachterbetreiber-Kasse | 2.000 | 2.000 |
| Nadir-Fondskasse (keine Mindeststandsweitergabe) | 964 | 964 |
| Neuer, realer Eisankauf in der Vorlaufphase | 400 ISK | 400 ISK |
| Wirklich neu hergestellte Nahrung im Vorlauf | 20 | 20 |
| Dritte ausgelieferte Menge / daraus verdiente Zahlung | **0 / 0 ISK** | **0 / 0 ISK** |
| Hash nach abgelehntem Auftrag | `14f991547a41737c` | `28a52381e2b2561e` |

Der Verkäufer ist zu diesem Zeitpunkt **nicht zahlungsunfähig** und hat **genug Ware**; der Käufer erzielt seit der zweiten Lieferung **keinen neuen Aldera-Haushaltskassen-Zufluss**. Nadir-Fabriklohn fließt an **`hh_st_nadir`**, nicht automatisch an **`hh_st_aldera`**. Das in der Quelle oder beim Spieler vorhandene ISK finanziert keine Käuferbestellung, solange es keine echte Zahlungskette dorthin gibt. Das ist eine belegte Konten- und Verteilungsgrenze, **kein** Beweis, dass eine bestimmte zusätzliche Geldmenge fehlt. Der Spieler darf Geld sparen; eine Rückführung seines Guthabens ist nicht vorgesehen.

### A2. Tatsächliche Teilmenge nach der abgewiesenen Bestellung

**Wichtige Gegenprobe:** Eine abgelehnte **24er-Charge** ist **noch keine generelle Handelsunfähigkeit**. Aus exakt dem unveränderten Original-Save nach Ablehnung der vollen Bestellung (Spielerschiff ist inzwischen an Nadir) wird ohne Geld- oder Wareninjektion ein **kleinerer echter Vertrag** reserviert, Nadir-Neuware über den Original-`shipTrade` gekauft, auf bezahltem Original-`shipMove` zurückgebracht und in Aldera per bestehendem R15-Vertrag wirklich verbraucht und vergütet.

| Fortsetzung nach vollem Drittauftrags-Gate | Seed42 | Seed7 |
| --- | ---: | ---: |
| Käuferkasse am Anfang | 796 ISK | 956 ISK |
| Preis pro Einheit laut Core | 54 ISK | 54 ISK |
| **Wirklich neu geliefert und verbraucht** | **14** | **17** |
| Echte volle Zahlung für diese Teillieferung | 756 ISK | 918 ISK |
| Käuferkasse nach dritter Teilbelieferung | **40 ISK** | **38 ISK** |
| Nadir Quellkasse nach bezahlter Teillieferung | **61 ISK** | **58 ISK** |
| Spieler-Händlerkasse nach Flug und Verkauf | 2.115 ISK | 2.193 ISK |
| **Spieler-Netto seit zweiter Lieferung inklusive 250-ISK-Leerpositionierung** | **−135 ISK** | **−57 ISK** |
| Nadir-Fonds danach (ohne Mindeststandsweitergabe) | 1.137 ISK | 1.314 ISK |
| **Nächster 1-Stück-Auftrag, 54 ISK reservierbar?** | **Nein** | **Nein** |
| Weiterer tatsächlich reservierter oder ausgezahlter Betrag | 0 ISK | 0 ISK |
| Finaler deterministischer Save-Hash | `ed0151cdaa03a8a1` | `61c198365462ede4` |

Am Spiel-Tick **3960** wird selbst eine **einzelne** weitere Nahrungsbestellung aus der vorhandenen Aldera-Haushaltskasse abgewiesen. Das ist die erste **vollständige aktuelle Nachfragesperre bei der Mindestmenge eins** im aktiv weitergeführten Testweg. Es wird ausdrücklich **keine Aussage über alle künftigen Einkommen** getroffen: Ein späterer realer Lohnzufluss könnte neue Käufermittel liefern. Gleichzeitig sind die Quellkassen mit 61/58 ISK erneut gefährlich niedrig, obwohl Waren gehandelt wurden; die Teilfracht bringt dem Händler seit der bereits bezahlten Positionierung zwar +115/+193 ISK, **einschließlich der 250-ISK-Leerpositionierung bleibt die gesamte dritte Fahrt aber bei −135/−57 ISK**. Die Käufer-/Quellprobleme müssen deshalb **gemeinsam** untersucht werden.

### B. Gegenpfad **ohne** weitere Spielerbestellung

Getrennt davon läuft die gleiche Welt nach der zweiten Lieferung ohne neue Spieler-Handelsbefehle weiter; die Original-Miner, Fabriken und Haushalte arbeiten weiterhin. Ein **nur beobachtender** Hook registriert die erste vom Original-R15-Core tatsächlich verweigerte `m_core_vertrag.reservieren`-Mittelbindung nach bestätigter Rohstoff- und Lagerplatzprüfung.

| Erster Quell-Produktionsgate | Seed42 | Seed7 |
| --- | ---: | ---: |
| Zeitpunkt in Core-Minuten | 3.967 | 4.147 |
| Minuten seit zweiter Lieferung | 1.327 | 1.507 |
| Nadir Stationskasse / benötigter Produktionslohn | **3 / 24 ISK** | **7 / 24 ISK** |
| Fehlbetrag des echten Lohn-Escrows | **21 ISK** | **17 ISK** |
| Vorhandenes Eis-/Nahrungslager | 124 / 64 | 124 / 64 |
| Haushaltskasse Nadir | 2.425 ISK | 2.425 ISK |
| Fonds Nadir | 829 ISK | 999 ISK |
| Seit zweiter Lieferung neu angekauftes Eis | 89 | 101 |
| Seit zweiter Lieferung neu produzierte Nahrung | 45 | 51 |
| Geld für echte Eisankäufe seit zweiter Lieferung | 890 ISK | 1.010 ISK |
| Neue Fonds-Mindestüberweisungen | **0** | **0** |
| Endhash | `1785218fe1f52a0f` | `53ad5d748c2ad56f` |

**Abgrenzung:** Das ist ein späterer Produzenten-Betriebskapitalgate, **nicht der erste aktive Handelsauftrag-Blocker**. Ohne Nachfolgekäufe erschöpft die Quelle ihr Geld, obwohl Waren und ISK auf getrennten Konten verbleiben. Die künstlich angehaltenen NPC-Händler sind eine wesentliche Einschränkung dieser Diagnose. Die beiden Pfade dürfen nicht zu einem vermeintlichen identischen Ausfallzeitpunkt vermischt werden.

## Prüfnachweise, Schutzgrenzen und Entscheidung

**[TEST]** Gezielte Node-CI [#41658980271](https://github.com/tobiasfranziskus/Check/actions/runs/41658980271) auf `a32a6808`: **9/9 bestanden**, 0 Fehltests; beide R15-B-K11h-Basishashes und B-K11i-Hash nach zweiter Lieferung reproduziert; die volle 24er-Reservierung scheitert ohne Nebenwirkung, die danach wirklich bezahlten 14/17 Stück gelangen hingegen korrekt in den Endverbrauch. Die unmittelbar folgende 1-Stück-Reservierung wird ohne Nebenwirkung abgewiesen. Geld-/Waren-Audit stündlich und beim Gate, Save-/Load-Hash geprüft; die Standard-CI ist gesondert auszuweisen.

**Nicht bewiesen:** eine dritte vollständige 24er-Lieferung oder dauerhaft belastbare NPC-Sektornachfrage, reale dynamische NPC-Handelsdisposition (in diesem Experiment isoliert), Hüllenersatz, langfristige Weltstabilität, Regel15-Save-Migration, Safari-/NAS-Abnahme. Keine Produktfreigabe.

**Offene Produktfragen:** D2 (wer verdient Einkommen und *wo* kann es für echte Nachfrage ausgegeben werden?), D3 (globaler kontraktgedeckter Auftrag und lokaler Preflight), D6 (real finanzierter Verlust/Schutz) und getrennt Geldmodell B. **Keine** Emission, Spargrenze, Subvention, Preis-/Lohnänderung oder Individualrettung aus diesem Einzelversuch ableiten.
