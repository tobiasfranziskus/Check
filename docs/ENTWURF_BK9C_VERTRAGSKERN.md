# B-K9c – echter speicherbarer Frachtervertrag (Schema-9-/Regel-15-Kandidat)

**1. November 2026 · [PRODUKT/DRAFT] [PR #95](https://github.com/tobiasfranziskus/Check/pull/95) · NICHT integriert**

- **[MAIN]** `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, Aphros Void v0.12.5 / **Regel 14, Schema 8**. Keine produktive Umschaltung, kein Merge, kein Deployment.
- **PR-Stack:** #93 (B-K9a kalkulatorischer Finanzierungstest) → #94 (B-K9b originale Marktpreise und Differenz zwischen Lohnreserve und fälliger Arbeit) → **#95** (zustands- und save-fähiger Vertragsbuch-Kandidat). #83/#84 bleiben dokumentierte Analysereferenzen, **nicht** parallel integrierte zweite Vertragsmodule.
- **[TEST]** [CI-Workflow #41337531218](https://github.com/tobiasfranziskus/Check/actions/runs/41337531218): **96/96 Node-Tests erfolgreich**, davon 9 neue B-K9c-Tests (Käufer-, Fracht- und Betrugsfälle). Historische v10–v14-CI-Jobs gesondert bewerten; im originalen Regel14-Betrieb ist der neue Vertragsmechanismus **nicht aktiv**.

## 1. Ein Vertragsbuch statt doppelter Geldrechnung

Im produktiven HTML-/Vanilla-JS-Quelltext (nur Draft) gibt es neu `m_core_vertrag`, ein einziges Kernmodul mit:
- `starten`: vor dem Flug Original-Quellkauf, **exakte Abbindung des echten Zielkunden-Geldes**, Zielgebühr, konservativ **voller Stunden-Lohnreserve** und separater Hüllenersatzrücklage. Ein zweiter Vertrag kann dieselbe Hülle nicht belegen. Gestartet wird **nur** bei dem exakten Original-Spotpreis am Ziel und bei positiven kalkulierten Margen sowie vollständig vorhandenen eigenen Kassen.
- `liefern`: auf Original-`ankunft` wird die fest zugesagte Ware aus der tatsächlichen Schiffsladung mit Original-`handel` verkauft, und die zuvor reservierte Zielrechnung **genau einmal** aufgelöst. Das normale automatische Entladen oder ein externer Schiffshandel kann gebundene Fracht nicht vorher verkaufen.
- `lohnFreigabe`: bei der **wirklichen** `m_core_stunde.betriebskosten`-Abrechnung wird ausschließlich die fällige Originalarbeit aus der reservierten ISK-Kasse freigegeben und sofort an den Originalfonds bezahlt; keine kostenlosen Arbeitsminuten. Ungenutzte Reserve geht nach Lieferung und letztem Lohnabschluss einmalig zurück.
- `verlust`: originale, seit der letzten Stundenabrechnung tatsächlich angefallene Arbeit wird vor `entfernen`/`zerstoeren` über denselben ursprünglichen `betriebskosten`-Pfad mit **einem gefilterten Schiff** bezahlt. Käufervorschuss und ungenutzte Gebühren-/Lohnanteile werden erstattet, während die tatsächlich aufgebaute Hüllenersatzrücklage gesperrt bleibt. Keine Gratisrettung der verlorenen Hülle.
- `stornieren`: nur bei im Ziel gedocktem, noch **nicht** erfülltem Auftrag und **nach** Bezahlung sämtlicher angefallener Arbeit; danach einmalige Erstattung der Restmittel. Ausbleibende Zielkapazität führt zu `wartet` statt erzwungenem Verkauf, Geld bleibt gesperrt.
- `pruefen`: **strikte unabhängige gebundene Geld-/Fracht-/Referenzprüfung**, einschließlich Schiffsidentität/-besitzer, Auftrag, Originalpreis×Menge, vollständigem Käufer-Escrow, gebundener realer Nahrungsfracht, gesicherter Gebühr, Reise/Entladephase, Einzigartigkeit der Vertragsnummer und originaler globaler Geldbilanz. Auch ein **bilanzneutral** in die Stationskasse verschobener Vertrags-ISK oder als Ware umgebuchte Fracht wird beim Laden abgewiesen.

**Wichtige technische Entscheidung:** Sperrmittel liegen **nicht als fiktive zusätzliche `owners`-Konten**, sondern einmalig in `state.vertrag.eintraege`. Der unveränderte vorhandene Owner-Kassenbestand **plus** alle Sperrmittel muss jederzeit `initialSupply + minted − burned` ergeben; die ursprüngliche Geld-/Warenerhaltung bleibt unverändert. Kein doppelter Zahlungsweg, keine externe Servicepflicht, kein Backend.

## 2. Migration und bestehende Spielstände

Neue, **nur bei explizitem Testregelpaket aktivierte** Übergänge:
- **Schema 8 → 9**: leeres, streng validiertes `vertrag: {next:1,eintraege:{}}`.
- **Regel 14 → 15**: kennzeichnet die Transaktionssemantik, ohne automatische bestehende Aufträge anzulegen.

Die weiterhin veröffentlichte `m_data_rules.RULES` bleibt **Schema 8 / Regel 14**; alte Save-Dateien und Referenzhashes werden **nicht geändert**. Ein alter Save wird im Test mit den ausdrücklich vorgelegten Kandidatenregeln 9/15 aufwärts geladen. Künftige oder manipulierte Speicherstände werden zurückgewiesen; Schema-9-Dateien dürfen nicht als Regel-14-/Schema-8-Save gelesen oder still neu initialisiert werden. Browser-IndexedDB-Import/Export für das neue Schema ist **nicht** in realer Safari geprüft.

## 3. Tatsächlich ausgeführte Original-Core-Lieferung

Der geprüfte Einzelvertrag nutzt das in B-K9b gefundene **reale Marktfenster Seed 7, Tag 4**. Für den isolierten Nachweis wird eine bereits vorhandene NPC1-Hülle testseitig im Quellensystem Cyris positioniert, die restliche Flotte für diese 60 Minuten gehalten. Originalstationen, Originalpreise und reale Welt-ISK bleiben erhalten.

| Vorgang | Nachgewiesen |
| --- | ---: |
| Original-`shipTrade`: 13 Nahrung aus Cyris **wirklich kaufen** | Ja |
| Original-`shipMove`: Cyris → Aldera (25-minütiger Zielweg) | Ja |
| Original-Aldera-Marktpreis | **53 ISK/Nahrung** |
| Käufergeld vor dem Start in gespeicherter Treuhand gesperrt | **689 ISK** |
| Vollständige Fahrtarbeits-Vorausreserve | **250 ISK** |
| Originalweg tatsächlich erfasste Arbeit (Ankunfts-Tick-Reihenfolge) | **24 Minuten** |
| Originale Arbeitskosten bezahlt | **100 ISK** |
| Vom Core nach Abschluss genau einmal freigegebene Restreserve | **150 ISK** |
| Gesperrte Hüllenersatzrücklage | **39 ISK** |
| Käufergeld/Verkaufsware nach Lieferung noch einmal verfügbar | **Nein** |
| Zusätzliche ISK emittiert | **0** |
| Speicher-/Lade-Fortsetzung nach zehn Flugminuten | **identischer Hash** |
| Original-Core-Audit + separate Geld-/Warenerhaltung | **bestanden** |

Ein kontrollierter Piraten-Schiffsverlust nach 23 Minuten zahlt zuerst die tatsächlichen **95 ISK** fälligen Flugkosten und löst den Kaufauftrag ohne zweite Auszahlung auf. Beim blockierten Zielverkauf bleibt die Rechnung zurückgehalten, bis der ausgeführte Storno nach gezahltem Lohn die Restmittel erstattet. Käuferinsolvenz vor Start, Doppelbelegung, erzwungener `shipTrade`, manipulierte gebundene Ladung, veränderte Rechnung, negative Kassen, ungültige Schiffsreferenzen und falsche Format-/Regelversionen werden abgewiesen.

## 4. Was **nicht** gelöst ist / Merge-Sperre

**[NICHT PRODUKTREIF]**
1. Die Lieferung kauft *bereits existierende* Originalnahrung. **Neu für den Auftrag finanzierter Eisabbau, Fabriklohn, Produktions-WIP und Ursprungsnachweis** sind noch nicht angebunden. Das kalkulatorische B-K9a-Miner-/Fabrikbudget ist **keine** tatsächliche Geldsperre.
2. Die **Hüllenersatzrücklage** bleibt tatsächlich gesperrt, wird aber noch **nicht** für originalen Werft-Ersatzkauf oder Verkauf/Abschreibung freigegeben. Eine zukünftige vollständige Eigentümerbilanz und entsprechende Regeln müssen dieses Kapital mit der Werft verbinden.
3. Die neue Vertrags-API ist nur intern und auf explizitem Regel-15-Testzustand erreichbar; es gibt **keine validierte Spielerbefehl-/UI-/NPC-Autoauftrag-Schnittstelle** und noch kein universelles Spieler-/NPC-Rollenbudget.
4. Bei gesperrter Zielkapazität kann die Lieferung auf Storno/Wiederholung warten; kein voll entwickelter Fristen-/Schiedsvertrag, keine Risiko-/Prämienfinanzierung. Nur sichere Marktstrecken wurden überhaupt zur Rentabilität freigegeben.
5. **Keine 13 Seeds × 90 Tage mit aktivierten Verträgen**, keine 365-Tage-/Krise-/NPC-Flottenersatzbewertung, keine echte iPad-Safari-/NAS-Abnahme. Historische Original-Regel14-Referenzen ersetzen diese Tests nicht.
6. Der zivile Endverbrauch bleibt **ohne tatsächliche bezahlte Endnachfrage**, und der Sicherheitssektor arbeitet weiterhin in früheren B-K8-Läufen teilweise ungedeckt. Der funktionierende Einzelauftrag **behebt die Wirtschaft als Ganzes nicht**.

**[EMPFEHLUNG]** #95 bleibt Draft, keine Freigabe zum Merge. **B-K9d** sollte die tatsächlich bezahlte Eislieferung, Rezept-WIP, Produktionslohn und reservierte neu produzierte Nahrung direkt auf **denselben** Vertragsdatensatz erweitern; anschließend Hüllenersatzbudget und sichere NPC-Auftragsplanung integrieren und erst dann die realen 13×90-/365-Tage-Gates durchführen. Keine ungenehmigte Emission, keine individuelle Insolvenzgarantie, keine Spieler-Spargrenze.
