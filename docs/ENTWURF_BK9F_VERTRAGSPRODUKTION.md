# B-K9f – Ein bezahlter Vertrag für neue Förderung, Fertigung und Lieferung

**Stand: 01.11.2026 · [PRODUKT/DRAFT] [PR #98](https://github.com/tobiasfranziskus/Check/pull/98), nicht integrieren.**

- **[MAIN]** bleibt `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5, Regel14/Schema8.
- Neuer Branch `feat/bk9f-produktionscharge-einvertrag` direkt auf [#95](https://github.com/tobiasfranziskus/Check/pull/95), **nicht** auf den analytischen #96/#97; die Verzweigung ist bewusst klein und produktbezogen, obwohl der größere Stack #93→#94→#95 noch nicht integriert ist.
- **[TATSÄCHLICH GETESTET]** [CI #41342424469](https://github.com/tobiasfranziskus/Check/actions/runs/41342424469), `node --test tests/*.test.mjs`: **104/104 bestanden, 0 fehlgeschlagen**. Weitere historische Workflow-Jobs sind gesondert nach ihrem tatsächlichen Abschlussstatus zu beurteilen; ein erfolgreiches Node-Gate allein ersetzt die Produkt-/Wirtschaftsabnahme nicht.

## 1. Was jetzt im selben Spielkern implementiert ist

Der im Regel15-/Schema9-Kandidaten bereits gespeicherte Vertragsdatensatz `state.vertrag.eintraege.v1` hält nun zusätzlich ein `produktion`-Teilbuch. `m_core_index.vertragProduktion` startet eine konkrete, vollständig vorfinanzierte Bestellung; `m_core_index.vertragFracht` startet nach Produktionsabschluss **ausschließlich den tatsächlich marktfähigen** Originalhandel mit exakt der reservierten neuen Ware. Die bestehende `vertragStarten`-Funktion für bereits vorhandene Nahrung bleibt eigenständig erhalten.

Der Produktionsvertrag bindet **vor erster Arbeit** aus jeweils existierenden Konten und bei gemeinsamem Eigentümer **in Summe** Käufergeld, Eis-Rohstoffbudget, echte Minerarbeits- und Handelsgebühren, expliziten Fertigungslohn, Nahrungs-Quellkauf/-gebühr, volle Frachterstundenreserve, Zielgebühr und anteilige Schiffsrücklage. Es werden keine neuen ISK erzeugt, keine künftigen Nahrungserlöse vorab als vorhandenes Budget ausgegeben und keine individuelle Insolvenzgarantie gewährt. Negative Produktions-/Miner-/Frachter-Margen oder unterdeckte Kassen blockieren den Beginn.

Bei der Original-`foerderung` wird **nur die tatsächlich neu geförderte** und eindeutig dem Miner zugeordnete Menge übernommen, 26 Eis für 13 Nahrung. Der Rohstoffkauf wird über **dieselbe ursprüngliche `handel`-Funktion** einschließlich Preis, Zahlung und Gebühr ausgeführt. Die 26 Rohstoffe werden anschließend *im selben Tick* aus der allgemeinen Stationsware in den gespeicherten **vertraglich gebundenen Rohwarenbestand** übergeben.

Die bestehende Produktionslinie führt das Originalrezept mit Originaldauer und Original-Warenledger aus. Frühere WIP-Chargen bleiben ausdrücklich **Altware**; der Vertragskern nimmt erst die 13 Produkte auf, deren inputseitiger Abzug **aus dem neu gesperrten Rohstoffbestand** gestartet wurde. Der separate Vertragspuffer wird sowohl im Original-Core-Güteraudit (für Regel15) als auch in einem unabhängigen Testbuch berücksichtigt. Nach Abschluss existieren die Produkte **nicht zusätzlich im allgemeinen Stationslager**, sondern nur einmal im gespeicherten Vertrag.

Nach Produktionsabschluss werden **39 ISK real aus der vorher finanzierten Fabriklohnposition an den bestehenden regionalen Lohnverrechnungsfonds** ausgezahlt; dieser Fonds ist **noch kein eigenes autonomes Arbeiterhaushaltskonto**. Die exakt neuen Nahrungseinheiten werden aus dem gebundenen Puffer über Originalhandel in denselben vorfinanzierten Frachter gekauft, fliegen auf der Originalroute und werden gegen die exakt gesperrte Kundenzahlung verkauft. Frachterlohn und nicht verbrauchte Reserve werden wie in #95 über Original-`betriebskosten` abgerechnet; die Hüllenrücklage bleibt gebunden.

**Originalitätsgrenze:** Der Verkauf, die Fahrt, die Rezepte und die Minerarbeit verwenden Original-Core-Regeln. Der **direkte gebundene Dock-Rohstoffpuffer** ist eine ausdrücklich neue v15-Draft-Zulassungsregel: Er lässt die einmalige, vollständig bezahlte und auf eine Minerladung begrenzte Übergabe in die ausschließlich vertragliche Rezeptreserve zu, **auch wenn das normale Stationslager die 26 Eis nicht zusätzlich aufnehmen könnte**. Dies ist keine nachgewiesene produktreife kostenlose Lagererweiterung; allgemeine Stationskapazität/Dockgebühr und dauerhafte Kosten dieses Vertragspuffers müssen gesondert geklärt werden. Eine Produktionslinie kann nicht gleichzeitig von zwei offenen Verträgen beansprucht werden.

## 2. Durchgeführter vollständiger Vertrag

**[TEST] Kontrollierter Seed7, Spieltag4, Schema9/Regel15, echte Anfangsbesitzerkassen und Original-Marktpreise.** Wie bei #95 werden bereits existierende Miner-/Frachterhüllen *nur für den Test* nach Cyris positioniert und andere Schiffe zeitweilig geparkt; dies ist keine autonome NPC-Disposition.

| Nachweis | Ausgeführt |
| --- | ---: |
| Identischer gespeicherter Vertragsdatensatz | `v1` |
| Aus **neuem Originalabbau** eingekaufte Eis | 26 Einheiten |
| Original-Minerarbeit bezahlt | **65 ISK** |
| Aus gebundenen Rohstoffen tatsächlich **vertraglich** produzierte Nahrung | **13 Einheiten** |
| Original-Fabrikarbeit in bezahltem Entwurf | **39 ISK** |
| Tatsächlich verkaufte **genau diese** 13 Nahrung | **13** |
| Preis aus Original-Aldera-Spot | **53 ISK/Stück** |
| VOR Auftrag gesperrte Käuferrechnung | **689 ISK** |
| Original-Frachterarbeit tatsächlich bezahlt | **99 ISK** |
| Gebundene Schiffsrücklage | **39 ISK** |
| Zusätzliche ISK-Emission durch B-K9f | **0** |
| Auftragsstatus nach Lieferung | **`erfuellt`** |
| Original-Core- und unabhängiger Geld-/Warenaudit | bestanden |
| Save/Load während Eisförderung, während Rezept-WIP und nach Lieferung | deterministisch weitergeführt, identischer Hash |

Vertraglich neu erzeugte 13 Nahrung dürfen **nicht** mit allen anderen Original-Nahrungsproduktionen gleichgesetzt werden: Im vollständig laufenden Testkern stieg das globale Original-`ledger.nahrung.produced` währenddessen um **41** Einheiten, weil andere Original-Rezeptlinien weiterhin produzierten. **Genau 13** davon stammen aus diesem Vertragsrezept; die übrigen 28 sind normale Weltproduktion und keine zusätzliche Vertragsware.

In den Negativfällen werden unfinanzierbarer Start, gemeinsames Konzernkonto mit nur scheinbar doppelter Deckung, unzulässiger manueller Handel mit gebundener Fracht und doppelte Nutzung derselben Produktionslinie abgewehrt. Verlust des Frachters vor Beginn oder **während echter Rezept-WIP** löst Käufergeld-/Kosten- und Warenabwicklung aus. Beim Verlust des Miners **nach bereits bezahlter Rohwarenübergabe** darf die Fabrik rechtmäßig aus der schon vorhandenen Charge weiterproduzieren. Auch beschädigte Zahlungs-/Warensummen und manipulierte Save-Referenzen unterliegen weiterhin dem strikten Vertrags-Audit.

## 3. Nicht erfüllt: Merge-/Produkt- und Gesamtwirtschaftsgates

**[DRAFT / NICHT MERGEFÄHIG]** Das Erfolgsergebnis gilt für einen gezielt vorbereiteten, einzigen Produktionsvertrag. Weiter offen bleiben:

1. Der nur einmalig und endlich erlaubte **vertragliche Dock-Rohstoffpuffer** (physische Fläche, Durchsatz, mögliche Gebühren und Missbrauchs-/Kapazitätsgates) ist nicht als allgemeine Produktregel freigegeben. Notfall-Storno verwertet überschüssige Rohstoffe/Ware ggf. als **auditiert verlorenes Material**; dessen wirtschaftliche Kosten-/Spielsinn-Regel bedarf Prüfung.
2. Die **39 ISK Fertigungslohn** sind echtes vorhandenes Geld, aber derzeit an einen **Lohnverrechnungsfonds**, nicht an selbstständige Arbeiter mit dauerhaftem Konsumkonto gezahlt. Dauerhafte Kaufkraft im Haushaltskreislauf ist weiterhin nicht belegt.
3. **Schiffsrücklagen** sind real gebunden, aber nach erfülltem Vertrag noch nicht mit einem tatsächlichen Werft-Ersatzkauf/Schiffsverlustfonds verbunden.
4. Keine automatische NPC-Auftragspolitik, keine UI oder eigene Spielerbefehlsvalidierung, keine globalen Preise-/Produktions-/Arbeitsmarktfreigaben und **keine 13 Seeds ×90 Tage mit automatisch wiederholten v15-Verträgen**. Der tatsächliche Spieler-Spar- und Sicherheitsfinanzierungsfehler aus B-K8 bleibt bestehen.
5. Die erfolgreiche GitHub-CI ersetzt keine echte iPad-Safari-/NAS-Abnahme. Die aktive Spielwelt bleibt Regel14/Schema8, Browser-IndexedDB-Save/Load eines v15-Produktspiels ist nicht freigegeben.

**Projektleitungsbewertung:** Erstmals ist nicht nur ein Altbestands-Frachtergeschäft, sondern die **gesamte neue Rohstoff→Fabrik→Frachter→Endkunden-Kette in einem einzigen gespeicherten Vertrag** technisch belegt. Dieser Proof allein ist aber **keine stabile Gesamtwirtschaft und kein fertiger Merge-Kandidat**. Als nächsten eng begrenzten Schritt zuerst den physischen Lager-/Dockdurchsatz und die realen Storno-/Schiffersatzkonten härten; anschließend autonome, ausdrücklich budgetgedeckte Vertragsakquise im 13×90-Gesamtwirtschaftsgate prüfen, **ohne** Emission, Gratisrettung oder Spieler-Sparlimit.
