# W6/P8g – Eigenständig bezahlter Erz-/Materialvertrag

**[DRAFT / BESCHLOSSENES PRODUKTZIEL] 16.11.2026.** Der Nutzer hat den unabhängigen, voll finanzierten 50-Erz-Vertrag **ohne Pflicht zu einem weiteren W5-Frachterneubau** gesondert genehmigt. Preise, bestehende Rohstofffelder, Löhne, Verkäufe, Eigentum, Save-Format und Geldmodell bleiben unverändert. Die erste Umsetzung ist auf der **isolierten Rule207-Forschungswelt** gestapelt; `main` (Regel204) und Pages sind nicht geändert.

**PR:** [#425](https://github.com/tobiasfranziskus/Check/pull/425), Basiskette #408 → #412 → #415 → #420 → #422 → #423; keine pauschale Integration der gestapelten Forschung.

## Autoritativer Ablauf / Finanzierung

1. Nur auf **explizite Forschungsaktivierung** `materialSupplySetzen(s,true)`. Vorher sind alte Rule207-Seeds, Spielstände und Simulationen unverändert. Keine stille Migration.
2. `industrialOreOfferMaterial`: Der originale Käufer `st_nadir` darf nur bei physisch vorhandenem und noch nicht auslieferbarem Silizium und echter Materiallücke bestellen. Bereits vorhandene Erz-/Materialbestände zählen mit. Miner **NPC3**, fremder Frachter **transport**; beide eigene leere, nicht stillgelegte Hüllen und reale Eigentumsrechte. Ein alter Eis-Pendelauftrag muss durch den Eigentümer mit `shipShuttleStop` freigegeben werden.
3. `industrialOreAcceptMine` durch **npc3**, `industrialOreAcceptFreight` durch **transport**, `industrialOreCommitMaterial` durch **st_nadir**. Die bestehenden W3-Kosten-/Kauf- und Arbeits-Treuhandkonten sind vollständig vorfinanziert **bevor** die erste Einheit gefördert wird. Keine Werft-Signatur; `industrialOreAcceptYard`, `industrialOreBuildShip` und der alte `industrialOreCommit` sind für diese Auftragsart gesperrt.
4. Originale NPC3-W1-Förderung → physischer Aldera-Abkauf → W3-Hin- und Rückfracht auf der vorhandenen 60-Minuten-Verbindung → 50 physisch gelagerte Erz in Nadir. Danach Original-W4-Raffinerie und J3/J4. Kein Spawn, Teleport, Verkauf ohne Lager oder garantierter Kunde.

| Ursprünglicher Tarif / Rechenträger | Betrag (ISK) | Geldfluss |
| --- | ---: | --- |
| NPC3-Förderlohn: 50 × 2 | 100 | NPC3 eigener Betriebsetat, echte Arbeit |
| Aldera-Erzankauf: 50 × 10 | 500 | Aldera-Kasse an eigentlichen Rohstoffverkäufer |
| Nadir-Original-W3: 500 Ware + 240 Fracht | 740 | echter Kauf- und Frachtvertrag aus Nadir-Kasse |
| Spedition: 120 Pilotenminuten × 1 | 120 | eigene Vorfinanzierung für Hin-/Rückfahrt |
| Bereits vorhandene W5-Hülle | 750 | **einmalig** mit Speditionsgeld aus echtem Nadir-Lager erworben |
| W5ac: Nadir→Aldera, 60 Minuten × 1 | 60 | **einmalig** durch Spedition bezahlt |
| W4: 10 Erz → 5 Material, 20 Minuten × 1 | 20 je Charge | Nadir zahlt echte Originalarbeit |
| J3: 2 Material + 1 Silizium → 1 Bauteil, 8 Minuten × 1 | 8 je Bauteil | Nadir bezahlt |
| J4: 8 Bauteile + 4 Material → 1 Jäger, 32 Minuten × 1 | 32 je Jäger | Nadir bezahlt |
| Original-J4-Verkauf | 900 | nur bei wirklicher fertig gebauter Hülle und Hausgeld |

**Wichtiges Rezeptdetail:** In diesem Forschungsstand produziert `rules.w4` aus **10 Erz fünf Material**, während das allgemein navigierbare Produktrezept `r_material` aus **10 Erz vier Material** beschreibt. Das wurde hier **nicht** still neu balanciert; die produktive Vereinheitlichung ist vor einer Main-Integration fachlich gesondert zu entscheiden.

Der neue Vertrag macht den tatsächlichen Rohstoffkäufer nicht künstlich zahlungsfähig. Ohne eigenen Etat, echte ungenutzte Schiffskapazität oder reale Materiallücke gibt es **keinen** Auftrag. NPC-Unternehmen dürfen auch mit diesem Mechanismus ausfallen.

## Nachweise und noch ausstehende Integration

**[GEPRÜFT]** Beim gezielten Original-Node22-Lauf [#43850009699](https://github.com/tobiasfranziskus/Check/actions/runs/43850009699) wurden **2/2 P8g-Spezialtests + 7/7 P8d/P8f-Regressionen** bestanden: S02 ab erster echter Dravos-Lieferung Tag14,25; zulässiger NPC3-Miner `sh017` mit Original-Auftragsfreigabe, neuer real gekaufter/überführter Speditionsfrachter `sh021`, 50 finanzierte Erz geliefert, 40 physisch gelagert nach erster W4-Charge, 15 Material, **keine weitere W5-Hülle**, Geldmenge 33.000 ISK, Mint/Burn 0. Endhash nach erster W4-Charge `eb8df591590bfe47`.

**[DRAFT / VERIFIKATION OFFEN]** Der erweiterte End-to-End-Versuch für 5×W4 → 25 Material → 8×J3 → einen dritten J4-Jäger mit 900-ISK-Hauskauf wurde nach diesem positiven Nachweis ergänzt. Sein **neuer** CI-Lauf ist getrennt abzunehmen; die vorherige grüne CI darf nicht fälschlich auf diesen Code übertragen werden. Zusätzliche 13×90/S02×365/730-Wirtschaftsprüfungen sind entscheidend für langfristige Tragfähigkeit. Aktuelle Forschung setzt `materialSupplySetzen` ausdrücklich; nicht `main`, kein UI-/Pages-Deploy, keine Produkt-Save-Migration und keine echte iPad-/NAS-Abnahme.

**Nächster Release-Gate:** P8g mit seinen notwendigen P8b–P8f-Abhängigkeiten gezielt auf den jeweils aktuellen Hauptzweig integrieren (keine ganzen historischen Stacks blind zusammenführen), echte Bedienung aus dem öffentlichen Spielstart, unabhängige Node22/Browser-Wirtschaft, historischer Hash und aktualisierte Save-/Regelversionsfrage klären. Erst nach erfolgreicher Integration und eigenem Pages-Nachweis `[MAIN]/[PAGES]` setzen.
