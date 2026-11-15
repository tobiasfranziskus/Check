# W6/P8b – Forschungsregel205: zwei endliche, räumlich getrennte Siliziumfelder

**[DRAFT / ANALYSE, 15.11.2026] – KEINE Produkt-/Balancingfreigabe, kein 205-Save auf Pages aktiv.**

## Ziel, Herkunft, Abgrenzung

- Aktuell veröffentlichter Hauptstand `main f65351a03132fa16ecc9b5541c589eb0c8b37617`, Regel204/Schema8. Nutzer-Spielstände und W6-P7-Referenz `4cae5fa6ea9d1f41` bleiben unverändert.
- [P7](W6_P7_SILIZIUM_LANGZEIT.md): Mit echter S02-NPC-Firmenpolitik ist über 730 Tage die Eis-/Wasser-/Ersatzwirtschaft nachgewiesen, **aber** nach zwei Jägern gibt es keinen neuen Siliziumzufluss mehr. [P8a](W6_P8A_SILIZIUM_VERSORGUNG.md) zeigt seitdem den echten physischen Engpass im sichtbaren Jägerprojekt.
- **Dravos ist bisher nur altes Weltkartenmaterial.** Die reale Regel204 kennt allein Aldera/Nadir. Für ein echtes Dravos→Nadir-Modell fehlen physische Dravos-Docks, bezahlte intersystemische Miner-/Frachttransporte, Übertragungen und Käuferbudgets. Diese Forschungsstufe erzeugt **weder** Dravos noch einen falschen bestehenden Handel.
- **Begrenzter technischer Gegenversuch:** Als Test einer **zweiten endlichen Lagerstätte** werden zwei geologisch verschiedene Punkte in *dem bereits tatsächlich flugfähigen Nadir-System* benutzt. Zusätzliche `16` Einheiten sind ein **nicht freigegebener Forschungsparameter** für den ersten physisch beobachtbaren Zweiquellen-Prototypen. Sie sind zu Anfang **nur Bodenreserve, nicht Ware, Geld, Schiffe oder Lagerzufluss**. Der Versuch dient dem Nachweis des multi-field-Abbaus, nicht der Freigabe neuer Reserven im Produkt.

## Tatsächliche Anpassungen (nur Rule205)

1. `prototypes/welt/rule200-k7-industry-core.js`: expliziter `createP8bWelt`-Forschungsconstructor mit `rulesVersion:205`, Nadir `nadir-primaer` (bestehende 16) und `nadir-sekundaer` (experimentell 16, x=−720.000 statt x=+720.000). Keine neuen Anfangskassen, Startware, Schiffseigentümer, Bonusrouten, Rezepte oder Preise.
2. `prototypes/welt/j2b-silizium-core.js`: pro Lagerstätte eigenes unabhängiges Endlichkeitsbuch (`vorrat/gefoerdert/verkauft`), ein explizit mit Feld-ID signierter `siliconMineStart`-Auftrag, 8-Einheiten-Charge, physische F6-Position/Tempo, Pilotendienstminute, Original-Doppelbuchung, streng belegter `siliconSell`, Sicherung gegen Feldfälschung und vermischte Quellen. Regel201–204 nutzen weiter die unveränderte alte Befehlsform und ihre ursprüngliche Einzelfeldrechnung.
3. `prototypes/welt/welt-kern.js`: Einbau des neuen Felds **ausschließlich im existierenden** deterministischen Wirtschaftsminuten-/Flugkern, kein zweiter Tick. NPC3 muss die zweite Quelle real anfliegen und nach vollständiger Bezahlung an Nadir liefern, bevor ein echter J3/J4-Auftrag möglich ist. Alter S02/P5-Opt-in ohne 205 unverändert.
4. `AphrosWelt.ausRegel204P8b(json)`: streng **ausdrücklich aufgerufene**, über Original204-Core-Audit validierte Forschungskopie. Vorbestehender physischer Abbau und sämtliche Originalbelege erhalten ihre eindeutige Ausgangsfeldzuordnung; der neue 16er-Vorrat entsteht nur als noch nicht gefördertes Gestein. Nach der Kopie werden **alle Originalkassen, Warenledger, Schiffsdaten, Eigentümer, RNG und Tick** unabhängig auf Identität geprüft. Beide JSON-Dateien bleiben getrennt; normales `load` migriert **niemals** automatisch.
5. Die Kommandos zu anderen Systemen und fremden Frachtern bleiben gesperrt. Weder `haus` noch `npc3` bekommt durch die Felddefinition eine kostenlose Hülle, Frachtleistung oder ISK.

## Abnahmevertrag: nicht vor Ausführung als bestanden bezeichnen

- `tests/w6-p8b-two-fields-rule205.test.mjs`: Quell-204-Hash, gleiche Ledger/Hüllen/Konten, 205-Bodenreserve 16+16, Gegenprobe gegen gefälschte Feldbestände/Siliziummengen/ISK und unberechtigten 205→204-Import. Danach echte 90 Tage **S02+P5** auf dem 205-Forschungsprofil, mit Original-900-ISK-Spielerabnahmen: mindestens 24 real geförderte und aus unterschiedlichen Feldbelegen zugeordnete Siliziumeinheiten, mindestens **drei real finanzierte J4-Hüllen** und regelmäßige unabhängige Geld-/Waren-/Schiffs-/Eigentumsaudits. Ein Save/Load-Replay Tag30→90 muss mit **genau derselben legitimen Spieler-Kaufreihe** bitgleich sein.
- Unveränderte **Original204-P5-/P6-90-Tage-Regression** einschließlich Referenzhash `686355895f27fbb8`. Die 730-Tage-Originalquelle wird nicht durch neue Forschungswerte überschrieben.
- Vollständiges Node22-Gate und eindeutige Manipulations-/Unterfinanzierungssperren. Separater CI-Workflow `.github/workflows/w6-p8b-rule205.yml` führt den neuen Versuch auf dem jeweiligen Draft-Head aus.
- Chromium/WebKit-Touch- und echte iPad-/NAS-Abnahme **nicht** automatisch als erledigt zählen; in dieser Stufe sind keine neuen öffentlichen Browserpfade/Schaltflächen enthalten.

## Ergebnisstatus und nächste Ausbaustufe

Bis CI tatsächlich bestanden ist, bleiben Aussagen über den dritten Jäger **Hypothesen** und keine Testresultate.

Selbst ein erfolgreicher 205-Versuch beweist nicht die physische Durchführbarkeit der **Dravos-Lieferkette**, die längerfristige Kapitaldeckung oder Nachhaltigkeit aller 13 Krisenszenarien. Für Dravos sind ein separater, sichtbar spielbarer, tatsächlich finanzierter Zwei-/Drei-Systeme-Transport, neue endliche Feldgröße, lückenlose ISK- und Waren-/Eigentumsübernahme und eine ausdrücklich freigegebene produktive Regel-/Save-Migration notwendig.

**Freigabe: Forschungs-Draft, kein Merge von Regel205, keine GitHub-Pages-/NAS-Veröffentlichung, kein Eingriff in alte Karrieren.**
