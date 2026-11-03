# B-K11j – Erstes nachweisbares Finanzierungsgate nach zweiter Lieferung

**[ANALYSE/DRAFT · 03.11.2026]** Gestapelt auf [B-K11i #147](https://github.com/tobiasfranziskus/Check/pull/147); [#146](https://github.com/tobiasfranziskus/Check/pull/146) liefert den historisch gepinnten isolierten R15-/Schema9-Testkern. **main b4e604d6, Regel14/Schema8 bleibt unverändert.** Keine Preis-/Lohn-/Emissions-/Save-/Produktregeländerung.

## Frage und Experiment

In beiden Seeds 42 und 7 wird zunächst die exakt reproduzierte erste, durch regionale Fonds mitfinanzierte 24er-Lieferung ausgeführt. Danach wird die bisherige Mindeststandsübertragung **nur testweise** ausgeschaltet und die identische zweite wirkliche Eis→Nahrung→Käuferlieferung fortgesetzt (B-K11i-Hashes fest gepinnt). Von deren echtem Save aus läuft der Original-Core minutengenau ohne weitere Fondsmindeststandsübertragungen weiter: echter Nadir-Minerhandel, reale Lagerbewegungen, Fabrikarbeit und vollständig finanzierte Vertragsreservierungen.

**Gate-Beobachtung:** Ein ausschließlich lesender Instrumentierungshook registriert den **ersten** tatsächlich vom R15-Kern wegen unzureichender Kasse verweigerten Produktionslohn-Escrow oder Nadir-Miner-Betriebskostenbedarf. Er erfasst Akteur, Konto, Zeitpunkt, erforderlichen und vorhandenen ISK-Betrag sowie Anfangs-/Endkonten; er überweist weder Geld noch erzeugt Ware und verändert den Spielablauf nicht. Geld-/Warenaudits stündlich sowie beim Gate und Save/Load-Hash beim Gate.

**Grenze:** Das erste gestoppte Produktions- oder Minerbudget ist **nicht automatisch** ein gescheiterter dritter Endkundenauftrag. Autonomer NPC-Handel ist wie im B-K11h/i-Szenario isoliert, und die Haushaltsdirektabnahme ist test-only. Ein isoliertes R15-Gate belegt keine Marktstabilität oder Produktfreigabe.

## Teststatus

Neuer gezielter Node-Test in `tests/bk11h-reale-lieferung.test.mjs`. Resultate, konkrete Beträge und Hashes sind erst nach dem neuen CI-Lauf als **[TEST]** einzutragen. Bestehende B-K11h/i-Historie und Referenzhashes bleiben unverändert.

Kein Merge, Deployment, D2/D3/D6-Beschluss und keine Geldmodell-B-Emissionsregel.
