# B-K10r – Bezahlte Frachterwiederbeschaffung und unmittelbarer Verlust

**[ANALYSE/DRAFT · 02.11.2026]** [PR #135](https://github.com/tobiasfranziskus/Check/pull/135) gestapelt auf #134 → #133 → #132 → #131 → #130 → #129 → #128 → #127 → #126 → #124 → #123 → #108. **[MAIN] b4e604d6 (v0.12.5, Regel14, Schema8) unverändert.** Ausschließlich ein neuer Original-Core-Test und Dokumentation; keine Änderung an index.html, Produktionsregeln, Preisen, Löhnen, Schiffbau, Sicherung, Emission, Fonds, UI oder Save-Format. Der R15-/Schema9-Testkandidat ist nicht integriert.

## Ziel und Methode

B-K10q bewies, dass echte und bezahlte Siliziumfracht in Aldera ankommt, aber die von **zehn verschiedenen Produktionsrezepten** gemeinsam verbrauchten Bauteile ohne Zuordnung keinem konkreten Frachter zur Verfügung stehen. B-K10r untersucht deshalb **nur in einer evaluierten Test-Core-Kopie**, ob acht **tatsächlich vorhandene** Bauteile vor den anderen konkurrierenden Linien für genau eine Original-Frachtercharge reserviert werden können. Die übrigen Linien laufen weiter und dürfen alle über das Kontingent hinaus vorhandenen, tatsächlich freien Bauteile verwenden. **Die Reservierung wird nicht als neues Produktfeld gespeichert; der Testfilter ist nicht savefest.** Sobald die originale Frachterlinie acht Bauteile aus dem originalen Warenlager nimmt und gegen echte 144 ISK Produktionslohn vorfinanziert startet, wird die Testreservierung freigegeben. Es gibt keine gratis Waren, neue Hüllen, ausgeschaltete Piraten oder geänderte Rezepte.

Ausgang ist die **echte autonome Seed42-R15-Wirtschaft nach 14 Spieltagen**: Aldera 0 Silizium, 0 Bauteile und 0 fertige Frachter, 1.374 ISK Stationskasse; NPC2 0 Schiffe und 2.792 ISK Eigentümerkapital; bestehender Spielerfrachter sh002 und echte 2.000 ISK Umlaufkapital. Alle übrigen NPC-Miner, Frachter, Jäger, Piraten, Werft-/Fabriklinien, Haushalte, Stationsfonds und Markthändler sind aktiv.

## Originalbuchungen des erfolgreichen Einzelfalls

NPC2 reserviert **1.600 eigene ISK** im bestehenden originalen Vertragsbuch als Käuferbudget an die Werft sowie weitere **168 ISK** für den getrennten tatsächlich erbrachten Transportdienst an den existierenden Spielerfrachter. Dieser fliegt Aldera→Dravos→Aldera mit **zweimal 84 ISK echter Flugvergütung**, kauft **10 Silizium** in Dravos und liefert sie physisch ab. Der Original-Core zahlt den einmaligen Quell-Einkauf und den automatischen einmaligen Werft-Ankunftsankauf; NPC2s 168-ISK-Dienstleistungsvergütung wird **erst nach echtem Lieferbeleg** ausgezahlt. Keine zusätzliche Warenvergütung, keine NPC-Rettung, keine neue Emission.

| Original-Core-Meilenstein | Original-Zeitpunkt | Tatsächlicher Beleg |
|---|---:|---|
| Autonome Krisenwirtschaft vollständig gelaufen | Tick 20.160 | NPC2 ohne Frachter, Werft ohne Silizium |
| Nach echten Flug-/Handelsverträgen ist Silizium angekommen | vor Tick 20.280 | 10 physische Siliziumstücke einmalig verkauft |
| Original-Frachterproduktion startet | **Tick 20.320** | 8 tatsächlich hergestellte Bauteile verbraucht, 144 ISK Lohn reserviert |
| Original-Produktion fertiggestellt | **Tick 20.356** | 1 wirkliche Frachterhülle produziert und im Warenledger gebucht |
| Original-Käuferescrow wird erst auf diese echte Fertigstellung freigegeben | **Tick 20.356** | 1.600 ISK an NPC2 zurück, kein Geschenk an die Werft |
| Original-Ersatzkauf durch NPC2 | **Tick 20.400** | Schiff **sh091**, 1.050 ISK Warenpreis + 42 ISK Gebühr = **1.092 ISK** wirklich vom Käufer bezahlt |
| Original-Schiffsverlustfunktion bei Meridian | **Tick 20.580** | Dieselbe neue Hülle **sh091 tatsächlich zerstört** |

Die für acht Bauteile (acht × acht Minuten) und Frachter (36 Minuten) erforderlichen **256 + 144 = 400 ISK** Fabriklöhne werden von den ursprünglichen Produktionslinien **jeweils am tatsächlichen Start real reserviert und bei Fertigstellung bezahlt**. **Sie sind noch nicht als ein einziger, vor Beschaffung geschützter 400-ISK-Gesamtvertrag gebunden.** Die 1.600-ISK-Käuferreserve ist nicht selbst der Verkaufserlös: Sie wird nach echter Fertigstellung geschlossen und an NPC2 erstattet, damit erst der bestehende Original-Ersatzkauf **1.092 ISK** gegen eigene Kasse bezahlen kann. Die 508 ISK zwischen gebundener Reserve und Kaufbetrag sind kein Gewinn.

**Das Langzeitgate bleibt NEGATIV:** Der Frachter beginnt nach seinem echten Kauf wieder Handel, wird 180 Spielminuten nach dem Kauf in Meridian durch die bestehende Schiffsverlustfunktion zerstört. NPC2 besitzt danach wieder **0 Frachter**; die Aldera-Stationskasse ist nach der Testfolge auf **4 ISK** gesunken. Einmalige Wiederbeschaffung ist **nicht** gleichbedeutend mit dauerhaft finanzierter Handels-/Schutzwirtschaft.

## Negative Gegenproben

| Identische Seed42-Tag14-Welt, real bezahlte Originalfracht und Käuferreserve | Tatsächlich fertiggestellte Frachter | Tatsächliche NPC2-Käufe |
|---|---:|---:|
| **10 Silizium ohne Test-Materialkontingent** | 0 | 0 |
| **8 Silizium mit Test-Materialkontingent** | 0 | 0 |
| **12 Silizium mit Test-Materialkontingent** | 0 | 0 |
| **10 Silizium mit Test-Materialkontingent** | **1** | **1 für 1.092 ISK** |

In allen drei erfolglosen Herstellungsvarianten bleibt die wirkliche, nicht verdiente 1.600-ISK-Käuferreserve **vollständig erstattbar** und wird aus dem Original-Vertragsbuch zurückgebucht. Für die jeweils **tatsächlich erbrachte Transportleistung** bleibt dagegen die bereits verdiente **168-ISK-Vergütung bezahlt**; es gibt keine Erfolgsgarantie durch fiktive Rückforderung. Eine zusätzliche negative Null-Leistungsprobe reserviert 1.600 ISK und erstattet sie komplett, ohne Ware/Arbeit/Kauf zu fingieren. Zwei identische erfolgreiche Versuche liefern exakt denselben originalen Endzustands-Hash, Schiffskauf und Verlustbeleg.

## Rechtliche und technische Grenze der Aussage

**[BELEGT]** Eine wirklich finanzierte Materialversorgung und ein real bezahlter NPC2-Werftkauf sind unter **einer eng begrenzten testseitigen Materialreservierung** tatsächlich möglich. Die originalen Bargeld- und Vertragsreserven, Warenledger, Produktionslöhne und Schiffskäufe sind echt bilanziert. **[NICHT BELEGT]** Eine savefeste produktive Werftbestellung existiert bereits; das Materialkontingent lebt nur im Test-Closure und ist nach Save/Load **nicht als Verbindlichkeit rekonstruierbar**. Ein vollständiger atomarer Herstellungslohn-/Rohstoff-/Käufer-/Frachtervertrag und eine nachhaltige profitable Route fehlen. Der neue NPC2-Frachter wird im Originalrisiko schon nach drei Stunden wieder verloren.

**[OPTION – B-K10s]** Erst die gemeinsame Wirkungsprüfung von Werft-Kapital, erneuter Schiffserneuerung, tatsächlichem Transportgewinn und real bezahltem Schutz; zusätzlich eine **kleine identische Spieler-/NPC-Werftbestell-Spezifikation** mit savefester einmaliger Waren- und Geldreservierung, Ablauf-/Rückerstattungspflichten und unveränderten Originalledgern. Für deren **produktive** Implementierung, Preis-, Lohn-, Fonds-, Piraten- oder Emissionsänderungen ist eine gesonderte Nutzerfreigabe nötig. Vor Integration weiter 13×90d und Spielerkrisen testen.

**[TEST DIREKT BESTANDEN]** Vier neue Testgruppen gegen den unveränderten Original-R15-Core mit ausschließlich testseitigem Produktionsfilter: erfolgreicher zehnteiliger Einmalkreislauf bis echter Frachterkauf/-verlust; drei Misserfolgsvarianten; identischer deterministischer Doppellauf; vollständige negative Käuferescrow-Rückerstattung. Zuvor 14d autonomes Seed42-Modell mit täglichen unabhängigen ISK-/Escrow-/Waren- und Save-/Hash-Audits, danach 60-Minuten-Audits. GitHub-CI-Gesamtlauf nur nach vollständigem Abschluss erfolgreich nennen. Keine 13×90d- oder reale iPad-/NAS-Abnahme. [Ausführbarer Test](../tests/bk10r-frachterauftrag-materialbindung.test.mjs).
