# [DRAFT] W5c – bezahlter Piratenhuelleneinstieg und Jagdbudget-Gate

**Datum:** 04.11.2026. **Basis:** [#175](https://github.com/tobiasfranziskus/Check/pull/175), Code fuer W5b und Mock-Renderer. Aus [#174](https://github.com/tobiasfranziskus/Check/pull/174) sind ausschliesslich die **belegten Defizite B1 und B6/B7** als Anforderung verwendet worden, **kein Code kopiert**. [MAIN] unveraendert Regel14/Schema8.

## Kleiner vertikaler Schritt, bewusst ohne Ratting

In der isolierten **Regel21** (kein Browser-Speicherplatz, keine Produktfreigabe) ist Nadir erstmals Ausgangspunkt fuer einen durchgehenden Industrie- und Kaufnachweis: W3-Erztransport, W4-Material, W5b-Silizium/Bauteile/Jägerbau. Der Konzern `npc3` kauft den real produzierten Jäger fuer **900 ISK** vom Hersteller `house`. Danach kann die Piratenpartei **dieselbe bereits finanzierte Hülle** fuer **weitere 900 ISK** vom Konzern erwerben: ein *Eigentumsuebergang*, kein neuer Spawn. `ledger.jaeger.consumed=1` bleibt bei genau einer materiellen Hülle; Schiff-ID und Standort bleiben erhalten. Die Piratenkasse wurde aus **900 vorhandenen Nadir-Anfangs-ISK** umverteilt (Station: 4000→3100; Piraten: 0→900), Gesamtbetrag weiterhin 33.000, keine Emission. Das ist ein ***einmaliger, endlicher Forschungs-Anfangsbestand***, ausdrücklich **kein dauerhaft finanzierter Piraten-Geschaeftsbetrieb**. Er leistet keine unfinanzierte Rettung während des Spiels.

Der zweite Befehl `shipHunt` ist in Regel21 für `npc3` mit nachgewiesenem Nadir-Jäger freigeschaltet. Er bezahlt **50 ISK pro Stunde im Voraus** aus der echten NPC-Kasse an `fonds_transport`; erst dann beginnt eine Jagd-*Bereitschaft*. Vor Ende jeder finanzierten Stunde wird die naechste Stunde bezahlt oder das Schiff wechselt zu `halten`. Nie unbezahlte Einsaetze. Die 50 ISK stammen aus dem dokumentierten Regel14-Jaegerbetrieb und sind nur ein technischer Testparameter, keine Balance-/Produktentscheidung. Auszahlung = Transfer, keine ISK-Schöpfung und keine unfinanzierten Stunden. `shipWait` stoppt die Bereitschaft; bereits bezahlte Stunde wird als bereitgestellte Leistung nicht erstattet.

**Wichtige Grenze:** W5c implementiert **weder einen Abschuss noch Piratenkampf, Piratenverlust, automatische Respawns, Ersatzkauf nach Vernichtung, Kopfgeld noch Pilotenskills**. Das einmalig bezahlte Piratenschiff ist eine physische Vorstufe für spätere Zerstörung und Ersatzbedarf, noch kein laufender Piratenbelt. Die bestehende produktive Regel14-Piratenersatzfunktion **bleibt unverändert und enthält weiterhin den in #174 belegten Fehler**. Diese Regel wird **nicht** aus dem Forschungskern übernommen. W5b erlaubt vorerst nur eine Jaegercharge; deswegen sind gleichzeitiger NPC-Jaeger und Pirat nicht langfristig finanziert nachgewiesen. Es wird kein Gratis-Schiff in einer anderen Klasse erzeugt.

## Technische Geltung

- Neuer Regel21-`W5C_RULES`-Zweig und `createW5CState`/`loadW5C` ohne Migration der alten Save-Slots.
- `pirateBuy` als Core-Befehl gegen existierende Schiff-ID, Besitzer, freien Zustand, physisch gekauftes Industriegut und reale Käuferkasse.
- `shipHunt` als bezahlte Bereitschaft, nicht als Kampf- oder Bounty-System. Gemeinsame Core-Minuten und deterministische Abbruchgrenze.
- Die alten W1–W5b-Geld- und Produktionsaudits erkennen in Regel21 die zusätzliche reale Betriebskosten-Überweisung und dokumentieren die Eigentumsuebergabe. `w5c` prüft Endbestand, finanzierte Stunden und eindeutige Kauf-ID unabhängig vom Güterledger.
- `JagdSichtV1` und der bereits verifizierte Codex-Brückenadapter zeigen ausschließlich die tatsächlich verkaufte Jäger-ID bei `pirates`; keine angeblichen Jagdbelege.
- Keine Änderungen an Rule14-/Rule20-Speicher-, Hash- oder Verbraucher-Logik; keine Hintergrund-Simulation, neue Abhängigkeit, Bilder oder Deployment.

## Tests und Grenzen

`tests/w5c-piratenbudget.test.mjs` prüft: komplette Industrievorleistung, Kauf- und Kassenmangel atomar, wiederholter Kauf abgewiesen, echte Eigentümer- und Ledger-Verfolgung, stundenweise Vorauszahlung, Nachbudget-Stopp, manuelles Halten, bilanzneutrale Geldfälschung, Save/Load und 13 Seeds × 90 Tage mit Tagesaudits und deterministischem Replay. **Nur tatsächlich grüne CI-Läufe gelten als bestanden.**

**Noch ausständig:** echter Piratenabschuss und Verlust-/Ersatzauftrag aus realer industrieller Lagerware (A1–A3 aus #174), Bounty-Finanzierung, gleichzeitiger NPC-/Piraten-Nachschub, Pilotenausbildung (A5), volle systemische Wirtschaft (A6 für aktives Ratting), produktiver Browser-Modus mit geschuetztem Save-Slot, echte Safari/iPad-/NAS-Prüfung.

Keine Merge-/Deployment-Freigabe.
