# W5s-z – privat bezahlter Folgebesteller, W4-/W5-Werftauftrag und geschützte neue Hülle

**[DRAFT/ANALYSE · 07.11.2026]** Auf W5s-y [#229](https://github.com/tobiasfranziskus/Check/pull/229) gestapelt, nur optional `rules.w5s.successorNewOrder=true` **zusätzlich** zu `successorOreFreight`. [MAIN] `5a56d9d7` sowie GitHub Pages/Altversionen, Schema 8, öffentliche Spielstände bleiben unverändert. **Keine Produktregel- oder Geldemissionsfreigabe.**

## Echte Nachfrage, kein Transfer an die gescheiterte Firma

Der alte unabhängige Spediteur verliert seine mit realen ISK bezahlte Hülle nach mindestens 30 Spieltagen; er behält sein aus fünf W3-Frachten tatsächlich erwirtschaftetes Kapital von **720 ISK** und erhält **kein Geschenk**. Er kann seinen eigenen Ersatzbetrieb von **930 ISK** nicht kaufen. Das bleibt zulässiges Scheitern.

**W5s-z ermöglicht stattdessen ausdrücklich durch einen neuen autorisierten Käufer/Investor (`export`) ausgelöste private Neubestellung** mittels des original validierten Befehls `shipPrepayNewCarrier`. Dieser darf ausschließlich einmalig nach tatsächlichem Verlust mit belegter Kapitalunterdeckung starten; Kunde/Altspedition/Konto dürfen nicht mit dem Investor verwechselt werden.

- **930 eigene ISK** des Investors gehen sofort und vollständig in das gesonderte Treuhandkonto `w5s_new_carrier_reserved`. Die Investorenkasse sinkt nachvollziehbar, die Speditions-Alt-Kasse nicht. Der Name `w5s_carrier3` ist ein **künftiger, noch nicht aktivierter unabhängiger Besteller**, keine automatisch gegründete Firma und noch kein Schiffseigentümer.
- Der reservierte Betrag enthält **750 ISK regulären W5-Kaufpreis, 60 ISK Überführungslohn und 120 ISK künftige Pilotenreserve**. Er ist **noch keine Zahlung an die Werft**, sondern ein verbindlich gesperrter Käuferetat. Es wird **keine Dividende, kein Kredit, kein Rettungsgeld** an `w5s_carrier2` gezahlt.
- Nur mit realer Nachfrage in Gestalt dieses tatsächlich vorfinanzierten privaten Auftrags darf der vorhandene `autoNewCarrierYard`-Plan die **originalen** `stationRefine`- und `stationBuildShip`-Befehle ausführen. W4 muss zehn bereits angelieferte Erz mit tatsächlich bezahlten 20 ISK Arbeit in fünf Material verwandeln. W5 verlangt 530 ISK reale Werftvorleistung, erzeugt danach eine neue physische Frachterhülle und bucht sie im unveränderten W5-Produktionsbuch.
- Der neue unverkaufte Frachter bleibt bis zum gesondert zu entwickelnden Kauf- und Eigentumsvertrag **rechtmäßig reserviert**: W5s-z schützt die physische Hülle gegen fremde `shipBuy`-Zugriffe. Kein Transfer in die alte Firma; kein fingierter Schiffsname, keine neue identische ID, keine weitere Transportberechtigung.
- Eigenständiger Buch-/Geldaudit `newCarrierOrderAudit`, neue lesende Core-Einstiege `w5sNewCarrierOrder` sowie `w5sFinanzStatus(...).successorNewOrder`. Der bereits vorhandene Großhandelsaudit `m_core_w5h.audit` zieht den vollen Prepay-Betrag vom tatsächlich zahlenden Investor ab. Das Weltgeld bleibt konstant.

## Testpaket

`tests/w5s-z-vorfinanzierte-folgewerft.test.mjs` untersucht Seeds **42 und 7** mit echten W4-/W5-Gründungs- und W3-Frachtvorläufen über 155 Tage, negativen Früh-/Fremd-/Doppelbestellungen, echter Prepay-Buchung, einer neu bezahlten Original-W4-/W5-Produktionskette und geschützter physischer Hülle, täglichem Audit und Save/Load. Manipulierte Treuhand-, Vertrags-, Firmen- und Investorwerte müssen unabhängig erkannt werden. Bei deaktiviertem Opt-in bleibt der alte Seed42-Hash unverändert.

Eigene Node-22-CI umfasst darüber hinaus **W5s-v/w/x/y**, einschließlich der bisherigen 13×90d und Krisenwelten bis 365 Tage. **GitHub-Ergebnisse erst nach tatsächlichem Lauf als bestanden melden.**

## Weiterer Produktentscheid – nicht vorweggenommen

**W5s-aa:** Separater echter Eigentums- und Verkaufsvertrag für den neuen unabhängigen `w5s_carrier3`. Erst dann darf aus dem 930-ISK-Treuhandbuch eine rechtlich finanzierte Kapitalzeichnung, 750-ISK-Zahlung an die Werft und später 60-ISK-Überführung sowie 120-ISK-Flugbetriebsreserve werden – jeweils mit überprüften W5-/W5s-/W3-/W5n-Belegen und individuellen Schiff-IDs. In W5s-z wird die Hülle **bewusst noch nicht verkauft**. Echte Safari-/NAS-Abnahme weiterhin offen.

## Abschließende zusätzliche Langzeitprüfung

**[TEST · Node22, 07.11.2026]** [GitHub-W5s-z-CI #42352512003](https://github.com/tobiasfranziskus/Check/actions/runs/42352512003): **22/22 kombinierte W5s-v/w/x/y/z-Testgruppen erfolgreich, 0 Fehler, 0 Skips** auf Commit `b2ada178` (danach Dokumentationsänderungen, kein neuer Core-Code). Zusätzlich zu den positiven Seed42/7-W4/W5-Bestellungen: Beide tatsächlich kapitalgedeckten Folgewerften wurden in der deterministischen 365-Tage-Welt **täglich** mit Save/Load, Geld-/Waren-/Original-Firmen- und neuem Bestellaudit geprüft. In beiden verbleiben bis Tag365 **930 echte ISK gesperrt, eine physische, produzierte und reservierte Frachterhülle, 720 ISK eigene Restkasse der gescheiterten alten Spedition, keine neue Firmen-ID oder Gratishülle, keine zusätzliche ISK-Emission**. Seed42-Hash `ac180f35b37c7e22`; Seed7-Hash `c17b0b0c3dea104b`. Noch keine neue Gesellschaft oder tatsächliche Überführung/Transportfähigkeit.
