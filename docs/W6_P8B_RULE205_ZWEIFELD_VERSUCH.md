# W6/P8b – Forschungsregel205: zwei endliche, räumlich getrennte Siliziumfelder

**[DRAFT / ANALYSE / QA ABGESCHLOSSEN, 15.11.2026] – KEINE Produkt-/Balancingfreigabe, kein 205-Save auf Pages aktiv.**

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

## Tatsächlich verifizierte CI-Abnahme – Research-Head `511a4c1e748c1d7b77d8e47f61800a226de3d077`

**[BELEGT]** Alle 16 tatsächlich gestarteten GitHub-Checks wurden erfolgreich beendet. `sicherheitsgeografie-vergleich` war bedingt **skipped**, kein fiktives Bestehen.

- [Main-safe Node22-Gesamtsuite](https://github.com/tobiasfranziskus/Check/actions/runs/43753837954): **356/356** Testfälle bestanden, **0 Fehler, 0 Skips**, einschließlich alter P5/P6-/W0–W6-/Save-/Eigentums-/Krisenregressionen. Original204-S02-P6-90-Tage-Hash **`686355895f27fbb8`** bitgleich.
- [Gezielter Regel205-Workflow](https://github.com/tobiasfranziskus/Check/pull/408/checks): **4/4** neue direkte Original-/Konvertierungs-/Manipulations-/Zweifeld-Tests und **6/6** Rule204-P5/P6-Gegenprüfungen grün. **Aktiver 204→205-Import** einer bereits abgebauten, abgerechneten und erneut arbeitenden 204-Charge bei **Tick 12.159** belegt: Quelle hat bereits 9 Einheiten wirklich gefördert, erste Charge bezahlt; der zusätzliche Boden bleibt unberührt, Cash/Ware/Hüllen/Schiffsphysik/RNG/Tick bleiben beim Transfer unverändert. Original-Quellhash vor dem Transfer `c9d8d355d5ef1451` im frischen S02-Profil, neuer initialer 205-Hash `4d1747912ae6accc`.
- [W6/P8b: 13×90 und 365 Spieltage, GitHub Actions #43753837865](https://github.com/tobiasfranziskus/Check/actions/runs/43753837865): `completed/success` mit unabhängigen Geld-/Waren-/Eigentumsaudits mindestens alle 15 Tage; vier unveränderte J2b-/J3-/J4-/K1-Verträge und unveränderte 33.000 ISK Geldmenge. Original-Spieler `house` kauft **nur** existierende fertige Jäger für jeweils **900 ISK** und spart das übrige Geld; die KI bucht keine zusätzlichen Verkäufe oder Rettungen.
  - [Roher 13×90-Datensatz mit Szenariohashes](https://github.com/tobiasfranziskus/Check/actions/runs/43753837865/artifacts/14177282917).
  - [S02-365-Rohdatensatz und Original-JSON-Saves](https://github.com/tobiasfranziskus/Check/actions/runs/43753837865/artifacts/14177153497). Artefakt-Aufbewahrung sieben Tage.

### 13 tatsächlich ausgeführte 90-Tage-Szenarien

| Profil | Physisch gefördertes Silizium primär/sekundär | Jäger gebaut | Käufe house | Bezahlte Ersatzkäufe | Einordnung |
| --- | ---: | ---: | ---: | ---: | --- |
| S01 | 0 / 0 | 0 | 0 | 0 | Eis/Wasser aktiv, ohne Ersatzbeschaffung |
| **S02** | **16 / 16** | **4** | **3** | **93** | Zwei Felder/aktive Ersatzwirtschaft; Hash `c6a5b9b9b3b7579a` |
| S03 | 16 / 0 | 1 | 1 | 12 | Finanzierungs-/Ersatzengpass |
| S04 | 8 / 0 | 0 | 0 | 4 | Eingeschränkter Konsum, keine zweite Charge |
| S05 | 0 / 0 | 0 | 0 | 2 | Kaufkraftlücke bei hoher Sparquote |
| S06 | 0 / 0 | 0 | 0 | 4 | Kein ausreichender Firmenkreislauf ohne Ausschüttung |
| S07 | 0 / 0 | 0 | 0 | 0 | Ersatzpolitik aus |
| S08 | 0 / 0 | 0 | 0 | 2 | Keine Wasser-Rückfracht |
| S09 | 0 / 0 | 0 | 0 | 2 | Wasserwerk aus |
| S10 | 0 / 0 | 0 | 0 | 4 | Keine Betriebsreserve |
| **S11** | **16 / 16** | **4** | **3** | **68** | Zwei Felder/aktive Ersatzwirtschaft; Hash `74236d59cc89451b` |
| S12 | 0 / 0 | 0 | 0 | 2 | Lager-/Versorgungsknappheit |
| S13 | 0 / 0 | 0 | 0 | 4 | Eis/Wasser teilweise aktiv, kein Jägerbau |

**Negativbefund:** Die zusätzlichen 16 Siliziumeinheiten verbessern nach 90 Tagen **nur S02 und S11** bis zu vier finanzierten J4-Hüllen. In elf weiteren Regimen entsteht kein dritter Jäger; nachfrageseitig, werftseitig oder geldseitig fehlen Voraussetzungen. Kein Szenario erhielt neue ISK; alle 13 finanziellen/physikalischen Audits sind grün, aber **nicht alle Regime wirtschaftlich tragfähig**.

### 365-Tage-Langlauf S02 mit zwei endlichen Quellen

**[BELEGT]** Finale `365×1.440` Original-Wirtschaftsminuten, Hash **`e7001bb97dfb4df2`**: exakt **32** ursprünglich in zwei real getrennten Lagerstätten geförderte/verkaufte Siliziumeinheiten, **4** regulär gefertigte Jäger, **3** tatsächlich für zusammen **2.700 ISK** vom Spieler gekaufte Jäger, **1** fertige Hülle weiter im Nadir-Lager, **379** real finanzierte Ersatzkäufe. Eisförderung **209.104**, Wasserumsatz **3.140.100 ISK**, erfasste Lohnsumme `W6.kennzahlen(...).loehne` **1.492.805 ISK**; Hausgeld **300 ISK**. **Weltgeld 33.000 ISK, Mint/Burn 0**, keine gebuchten Nachschüsse.

Beide Felder sind im Langlauf vollständig **erschöpft**. Der Eis-/Wasser-/Ersatzkreislauf ist danach weiter aktiv, die Jägerindustrie hat ohne eine neue physische Quelle keinen unbegrenzten Nachschub. Dieser Erfolg belegt **365 Tage**, nicht zusätzlich einen 730-Tage-205-Lauf.

**[OFFEN / PRODUKTENTSCHEIDUNG]** Die 16 zusätzlichen Einheiten an einer zweiten *Nadir*-Position sind **nur ein Forschungsparameter**. Kein tatsächlicher Dravos-Rohstofftransport, keine produktive Regel205-Freigabe, kein neuer 204-Save oder automatischer Wechsel. Für die echte Dravos-Kette bleiben das nachprüfbare Transitsystem, Fracht-/Eigentumsvertrag, Ankaufskasse, sichere Save-Migration, Risikokosten und reale Browser-/iPad-/NAS-Abnahme nötig.

## Ergebnisstatus und nächste Ausbaustufe

Der dritte und vierte Jäger sind für das S02-**Forschungsprofil205** in 90 und 365 Tagen tatsächlich nachgewiesen (oben); das gilt **nicht** als automatische W6-Gesamtnachhaltigkeit, als Dravos-Lieferung oder als Genehmigung für weitere Rohstoffe.

Selbst ein erfolgreicher 205-Versuch beweist nicht die physische Durchführbarkeit der **Dravos-Lieferkette**, die längerfristige Kapitaldeckung oder Nachhaltigkeit aller 13 Krisenszenarien. Für Dravos sind ein separater, sichtbar spielbarer, tatsächlich finanzierter Zwei-/Drei-Systeme-Transport, neue endliche Feldgröße, lückenlose ISK- und Waren-/Eigentumsübernahme und eine ausdrücklich freigegebene produktive Regel-/Save-Migration notwendig.

**Freigabe: Forschungs-Draft, kein Merge von Regel205, keine GitHub-Pages-/NAS-Veröffentlichung, kein Eingriff in alte Karrieren.**
