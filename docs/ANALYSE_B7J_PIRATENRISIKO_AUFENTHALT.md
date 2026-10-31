# B7j – Piratenverlustpfad, einzelner Risikoaufschlag und Aufenthaltsrisiko

**31.10.2026 · [ANALYSE/DRAFT] · PR #60, keine Änderung am Produkt `index.html` oder an Regel14/Schema8.** Verbindliche Produktplanung ausschließlich `docs/ROADMAP.md` auf `main`. Ziel: Am bereits real aus NPC3-Konzernmitteln bezahlten Frachter `sh131` die B7i-Nachfolgefahrt auf Sicherheitsrisiko untersuchen, ohne zweiten Hüllenkauf, Pachtpilot, ISK-Quelle, neue Preisregel oder Angriffsänderung.

## [TEST] Reproduzierbar ausgeführt

[GitHub Actions #41212186088](https://github.com/tobiasfranziskus/Check/actions/runs/41212186088): **1/1 Job und 67/67 Node-Standardtests erfolgreich**. Acht Weltläufe Seed42, Spielerfall `handel-flotte`: Regel14-Original-/B7b-Kontrolle je 10 und 90 Tage, B7f manueller Ersthandel 90d, B7h bestehender Autohandel 90d, B7i Vollkosten-/Minerreserve-Gate 90d, B7j identische B7i-Kostenentscheidung **plus ausschließlich Risikoabschlag vor der Handelsfahrt** 90d. **13.440 unabhängige stündliche Geld-/Waren-Audits und Replay-Hashprüfungen, 560 Tageshashes, 100 Save/Load-Roundtrips**. Original-/B7b-/B7f-/B7h-/B7i-Referenzhashes unverändert; B7i-Tag90 `517f7d05d13dfaae`, neuer deterministischer B7j-Tag90 `bacfb1cb1dc7ed8c`. Die vollen Kernkonten und Warenlager sind geprüft, keine geldschöpfenden Änderungen.

**Wichtige Korrektur des Testdesigns [BESTÄTIGT]:** Bei einem ersten B7j-Probelauf kaufte die *unveränderte echte* Stunden-Werftlogik nach einem Piratenverlust **im selben Tick einen zweiten, regulär bezahlten NPC3-Frachter**, bevor die nachgelagerte Analysesollslot-Bereinigung greifen konnte. Diese Zwischenprobe war **kein** Ein-Frachter-Kausalvergleich und wurde **nicht als B7j-Ergebnis gewertet**. Der isolierte Analyse-Core entfernt nun **ausschließlich beim nachgewiesenen Verlust genau von `npc3/sh131`** dessen Frachter-Sollposition **vor dem folgenden echten `ersatzkauf` im selben Tick**, symmetrisch in Beobachtung und Replay. Der Vergleichs-CI verlangt für B7i und B7j **genau eine gekaufte Frachterhülle `sh131`** und überprüft ausdrücklich die erhaltenen B7f-/B7h-/B7i-Endhashes. **Im Produkt bleibt automatischer, aus vorhandenem Geld bezahlter Schiffsersatz selbstverständlich unangetastet.** Alle früheren Wirtschafts-Referenzen blieben erhalten.

## [TATSÄCHLICH BELEGT] Warum B7i `sh131` bei Tick 22.500 verlor

Der read-only-Instrumentierungs-Hook liest den **Originalkampf in `m_core_sicherheit.ueberfall`** ohne zusätzliche Zufallszahlen. **Tick 22.500, System Meridian, `gesetzlos`**: unbegleiteter NPC3-Frachter `sh131`, zwei vorhandene angreifende Piratenschiffe `sh025` (**`pirat_gross`**) und `sh026` (**`pirat_mittel`**), **0 eskortierende Jäger**, 0 lokale Verteidigungsmodule, Ergebnis nach **drei Kampfrunden: Piraten gewinnen**, Frachter-Hüllenpunkte **0** und wirklicher `entfernen`-Verlust im selben Tick.

**Der Auslöser der Exposition war konkret unnötig schwach rentabel:** In der B7i-Handelsentscheidung **Tick 22.386** wurde **Veldra (sicher) → Meridian (gesetzlos)** zum Transport von **20 Material** akzeptiert, obwohl der kalkulierte Margenüberschuss **nach B7i-Arbeit und Positionierungspuffer nur +12 ISK** betrug. Das Schiff verkaufte die Ware an **Tick 22.416** tatsächlich in Meridian und wartete dort **leer** mit weiterhin aktivem Handelsauftrag. Es wurde **84 Minuten nach der Lieferung**, beim nächsten erfolgreichen Überfall, zerstört. Ein rechtzeitig am falschen Ort angedockter Jäger hätte ihn im gegenwärtigen Kern **nicht** eskortiert; die Mechanik berücksichtigt nur im konkreten angegriffenen System gedockte, zum selben Frachter zugeordnete Jäger. Im Core werden auch reisende Frachter beim `ueberfall` **am System ihres Fahrtziels** berücksichtigt, nicht bei jedem durchquerten Zwischen-Gate. Das ist ein wesentlicher späterer Routing-/Eskortenpunkt.

## [ANALYSE/OPTION] Ein isolierter B7j-Risikoaufschlag

Nur für die NPC3-`sh131`-Analyseregel wird **vor der Angebotsannahme** berechnet, ob am Ziel tatsächlich gedockte Piraten vorhanden sind. Dann wird zu den vorhandenen B7i-Vollkosten und Minerreserven ein **rechnerischer, nicht ausgezahlter Risikoabschlag** addiert:

`geschätzter Risikoabschlag = ceil((wirklicher Frachter-Werftpreis inklusive Gebühr + Waren-Einkaufswert) × bestehende effektive Angriffs-Chance je Stunde × angesetzte Fahrt-Expositionsstunden)`.

Die Angriffschance stammt aus der bestehenden Weltkonfiguration **`ueberfallChance=100/1000`** und der schon verwendeten lokalen Verteidigungsmodulformel; `m_core_zahl.div`, Routenminuten, Ware, tatsächliche Zielpiraten und Preise werden unverändert wiederverwendet. Der Abschlag muss aus **vorhandenen** Konzernmitteln vorfinanzierbar sein und in der **erwarteten** Margenprüfung noch einen positiven Saldo zulassen. **Keine** echte Risiko-Gebühr, keine Versicherungszahlung, kein geretteter NPC, keine Veränderung des Piraten-RNG oder der Kämpfe. **Wesentliche Einschränkung:** Die Faustformel kennt weder Kampf-Überlebenswahrscheinlichkeit noch **anschließend ungeplant langes Warten im Piratensystem**. Die Aufschlagshöhe ist deshalb **kein versicherungsmathematisch validierter Erwartungswert** und **keine beschlossene Preis-/Pachtregel**.

### Echter Ergebnisvergleich nach 90 Tagen

| Messgröße | B7i: Vollkosten ohne Risiko | B7j: identische Kosten plus Fahrt-Risikoabschlag |
|---|---: | ---: |
| Konzerneigene gekaufte Frachterhüllen im Versuch | **1** | **1** |
| NPC3-Frachter-Warenkäufe/-verkäufe | **7 / 9** | **3 / 4** |
| Abgeschlossene Partien positiv/negativ nach zugeordneter Arbeit | **7 / 0** | **3 / 0** |
| NPC3-Kasse Ende90 | **3.388 ISK** | **3.060 ISK** |
| NPC3-Miner Ende90 | **9** | **8** |
| NPC3-Frachter Ende90 | **0** | **0** |
| `sh131` tatsächlich verloren | Tick **22.500** (Tag16), **Meridian** | Tick **27.480** (Tag20), **Dravos** |
| Arbeitskosten fällig/bezahlt gesamt | **246.341/246.341 ISK** | **245.234/245.234 ISK** |
| Ungedeckte Arbeit | **0** | **0** |
| Produktionsabschlüsse | **7.084** | **7.084** |
| Nahrungsverbrauch / Medizinverbrauch | **3.774 / 675** | **3.776 / 675** |
| Zivile Verbrauchstage / Mangelstunden | **15 / 36.068** | **15 / 36.059** |
| 90d-Endhash | `517f7d05d13dfaae` | `bacfb1cb1dc7ed8c` |

**[NEUES NEGATIVES EINZELGATE]:** Das Risiko verändert die Wahl: Es verhindert insbesondere die marginale Veldra→Meridian-Fahrt `+12 ISK`, bietet jedoch eine andere noch rechnerisch positive Chance mit **Nadir → Dravos** (dort **ein** aktiver Pirat). Der Frachter akzeptiert die riskante Lieferung nach geschätztem Aufschlag von **214 ISK** (geprüfter erwarteter Überschuss **+267 ISK**) und verkauft seine Ware. Danach steht er leer in Dravos. Das Original-Kampfsystem greift ihn dort **mehrfach** tatsächlich an: **Tick 21.900, 22.500, 22.560 und 25.560** überlebt er; **Tick 27.480** endet ein weiterer Angriff mit Hüllenpunkten null. Die ursprüngliche Verlustgefahr **wandert von Meridian nach Dravos** und tritt später ein, nicht dauerhaft weniger. Nur **zwei weitere** Warenkäufe und **drei zusätzliche** Verkäufe nach dem initialen 55er-Erstgeschäft; **188** bewusste Warteentscheidungen zeigen das offene Aufenthaltsproblem. Die NPC3-Kasse bleibt liquide, aber 1 Miner weniger, 328 ISK weniger freie Kasse und kein Frachter mehr. Der leichte Rückgang der Mangelstunden um 9 ist kein tragfähiger Versorgungsfortschritt.

**[WARUM KEINE FREIGABE]:** Der Verlust entsteht nicht nur beim eigentlichen Warentransport: **Ein leer wartender, ungeschützter Händler wird weiterhin als ziviles Piratenziel behandelt**, auch nach einer nominell rentablen Fahrt. Die reine einmalige Fahrt-Risikoprämie unterschätzt also *das gesamte Zeit-/Verweilrisiko bis zum nächsten wirtschaftlichen Auftrag* und die tatsächliche Stärke der Piraten; keine automatische Routen-, Schiffs- oder Betriebstüchtigkeitsgarantie. Die B7i-Kostenwahl bleibt als begrenztes Experiment positiv; B7j-Reform **nicht** in produktiven Core mergen. Weltweit bleiben nach Tag15 fast sämtliche Nahrung-/Medikamentenverbrauchstage ausgefallen. Es fehlt weiterhin ein dauerhaft nachgefragter Markt.

## Nächster isolierter Prüfpunkt [B7k / ANALYSE/OPTION]

Zunächst **ohne** neue Jäger-, Kopfgeld-, Pilot-, Pacht- oder Emissionsregel eine **reale, aus Konzernkasse bezahlbare Sicherungs-/Rückpositionierungsentscheidung** für Frachter in Piratensystemen prüfen: Nur wenn nach Lieferung kein nach B7i-Kosten positiver nächster Auftrag aus dem gefährlichen System vorliegt und der Rückweg zu einem **sicheren System aus tatsächlich vorhandenem Geld** bezahlt werden kann, darf die KI leer ausweichen; alternativ könnte sie die Wartezeit und erwartete Aufenthaltsattacken im **Vorkauf** berücksichtigen und deshalb gar nicht erst einfahren. **Keine Zwangsrettung:** Ein armer Konzern darf scheitern, ein Frachter darf zerstört werden, echte Leerfahrt kostet reale Arbeit. Auch eine defensive Politik darf nicht alle lohnenden Piratenrouten künstlich „verboten“ machen. Erst mit ausgeführten Belegen gegen B7i/B7j ein getrenntes 13×90-Seed-/Spieler-/Save-Gate erwägen. **Davon unabhängig** ist das Phase-B-Gate echter ziviler Endnachfrage weiter offen.

**Status:** `main 517728a9` unverändert; PR #60 bleibt **[ANALYSE/DRAFT]**, #55 **[DRAFT/PLAN]**; kein Merge, keine Produkt-/Save-/iPad-/NAS-Änderung.
