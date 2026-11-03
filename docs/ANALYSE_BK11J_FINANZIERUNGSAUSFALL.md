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

**[TEST]** Gezielte Node-CI [#41657897755](https://github.com/tobiasfranziskus/Check/actions/runs/41657897755) auf `b815c00f`: **8/8 bestanden**, 0 Fehltests; beide R15-B-K11h-Basishashes und B-K11i-Hash nach zweiter Lieferung reproduziert; der dritte fehlgeschlagene Vertragsabschluss bleibt ohne Zahlung/Neuware. Die anschließende zusätzliche reine Tick-Protokolländerung muss im nächsten CI-Lauf separat bestätigt werden. Geld-/Waren-Audit stündlich und beim Gate, Save-/Load-Hash geprüft; die Standard-CI ist gesondert auszuweisen.

**Nicht bewiesen:** dritter finanzierter Abschluss, dauerhaft belastbare NPC-Sektornachfrage, reale dynamische NPC-Handelsdisposition (in diesem Experiment isoliert), Hüllenersatz, langfristige Weltstabilität, Regel15-Save-Migration, Safari-/NAS-Abnahme. Keine Produktfreigabe.

**Offene Produktfragen:** D2 (wer verdient Einkommen und *wo* kann es für echte Nachfrage ausgegeben werden?), D3 (globaler kontraktgedeckter Auftrag und lokaler Preflight), D6 (real finanzierter Verlust/Schutz) und getrennt Geldmodell B. **Keine** Emission, Spargrenze, Subvention, Preis-/Lohnänderung oder Individualrettung aus diesem Einzelversuch ableiten.
