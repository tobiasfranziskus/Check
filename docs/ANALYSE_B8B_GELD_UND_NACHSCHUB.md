# B8b – Spieler-Geldzuflüsse und Rohstoff-Nachschub, Seed 42

**31.10.2026 · [ANALYSE/DRAFT].** Basis: [main 517728a9](https://github.com/tobiasfranziskus/Check/commit/517728a958326e86751f09cd74d0c077edad9921), v0.12.5 / Regel14 / Schema8; Fortsetzung der isolierten [B8a-Diagnose #61](https://github.com/tobiasfranziskus/Check/pull/61).

## Ziel

Read-only im **originalen** Kern beobachten:
1. Reale Transfers an den aktiven Spieler in den Tagen 1–14: erfolgreiche Schiffskäufe/-verkäufe mit Originalpreis/Gebühr, Stationsdividenden und den restlichen, zunächst nur saldiert erkennbaren Ereignissen; keine hypothetischen Erträge als gezahlte Einnahme ausweisen.
2. Für jede aktive Nahrungs-/Medizin-Fabrik, je Rohstoff **Eis und Material**, den Lagerstand, Käufer-ISK, echten Zielpreis, vorhandene Quellbestände samt Reserve, theoretisch ankaufbare Menge sowie mögliche Original-Preisdifferenz und Transportvollkosten erfassen.
3. Geld- und Warenkonten unverändert halten: per Original-Kern und unabhängig auditieren, stündlichen Replay-Hash bestätigen, historische Spielerfall-Endreferenz festhalten, Save/Load prüfen.

**Wichtig:** Ein positiver rechnerischer Gewinn mit echtem Quellvorrat ist **noch keine ausgeführte Fahrt**. Das Protokoll benennt daher zusätzlich tatsächlich am Quellort angedockte autonome NPC1-/NPC2-Frachter; die betrachtete Rückfahrt ist eine konservative Vergleichsrechnung, keine Änderung der Original-KI. Die volle Betriebs- und ggf. Wiederbeschaffungskostenkette muss vor einer produktiven Freigabe geprüft werden. Waren in Minerfrachträumen werden separat ausgewiesen.

## Versuchsumfang

- Aktiver historischer `handel-flotte`-Fall: sieben unveränderte Spielerbefehle ab Tick 1, **Seed 42 × 90 Tage**, Originalkern gegen ausschließlich beobachtend instrumentierten Originalkern.
- Passive Kontrollwelt: **Seed 42 × 14 Tage**, ohne Spielerbefehle.
- Benötigt: stündliche unabhängige ISK-/Waren-Audits und identische Hashes, Save/Load, die historische aktive 90d-Referenz `784047684dfe5c56`, Standardtests.
- **Keine Emission, kein Kredit, keine Geldabgabe, keine Pachtregel, keine Preis-/Routen-/Piratenänderung, keine Änderung an `index.html`, keine Produktmigration.** 13 Seeds und vier 365d-Spielerkrisen sind ausdrücklich nicht Bestandteil dieses read-only Einzelfalls.

## [TEST/CI] Nachgewiesener read-only B8b-Erstlauf

**[CI #41226011759](https://github.com/tobiasfranziskus/Check/actions/runs/41226011759)** am ersten PR-Head erfolgreich: 1/1 Job, **67/67 Standardtests**, Originalkontrollhash nach 90d `784047684dfe5c56` unverändert, 2.160 Stunden-Audits/Replays aktiv, 336 passiv, **12** nachgewiesene Save/Load-Roundtrips, ohne Geld- oder Warenbuchung durch den Observer. Ein ergänzender Klassifikationspatch für Spielerkosten/Kopfgeld muss nach seinem eigenen CI-Lauf getrennt bestätigt werden.

**Aktiver historischer Spielerfall, Ende Tag 14:** Spieler 39.762 ISK, NPC1 **0 ISK**, NPC2 **0 ISK**, NPC3 4.395 ISK, Stationen zusammen 4.466 ISK, Fonds 1.300 ISK. Keine NPC1-/NPC2-Frachter mehr vorhanden. Die drei Nahrungsfabriken Cyris, Nadir, Veldra besitzen jeweils nur **1 Eis** statt der pro Rezept benötigten 2; Cyris außerdem **0 Material** trotz 45 Kristall. Für die drei Eis-Nachschubziele bestehen **410 Eis** an anderen Stationen, davon 408 regulär verkaufbar. Für Cyris existieren **756 Material** an anderen Stationen, davon 678 regulär verkaufbar. Das sind vorhandene physische Bestände, nicht versandte Güter.

**Exakte Zahlungsbarriere:** Cyris hat 9 ISK, will Eis zum Originalpreis **24 ISK/Einheit** und Material zu **59 ISK/Einheit** ankaufen, deshalb kann seine Station keine einzige Einheit kaufen. Nadir hat 15 ISK bei **22 ISK/Eis**, ebenfalls **0 ankaufbar**. Veldra besitzt 147 ISK und könnte nach Core-Regeln **7 Eis** zu 20 ISK/Einheit abnehmen, doch NPC1 und NPC2 besitzen **kein Startkapital und keinen Frachter** mehr. Die Rohstoffquellen sind somit nicht generell leer. *Angebotsmengen und Preisdifferenzen beweisen keinen voll finanzierbaren Handelszyklus.*

**Passive Kontrolle an Tag 14:** NPC1 4.217 ISK, NPC2 6.000 ISK; fünf reale NPC1/2-Frachter unterwegs. Cyris hat 100 Eis und 113 Material, 3.468 ISK; Nadir 125 Eis und 2.500 ISK, Veldra 66 Eis und 3.184 ISK. Produktion läuft. Damit ist ein pauschaler Rezept-/Startrohstoffmangel als Alleinerklärung nicht haltbar.

**Tatsächliche Spieler-Geldflüsse in Tagen 1–14:** 668 erfolgreiche Spieler-Schiffshandelsbuchungen, `176.160 ISK` Verkaufserlöse von Stationskonten, `99.933 ISK` bezahlte Einkäufe, `7.698 ISK` Gebühren: **+68.529 ISK Nettotransfer aus Handel**. Der reale Spielerkassenzuwachs ist **+37.762 ISK**; keine Stationsdividende, **−30.767 ISK** übriger Saldo vor separater Zerlegung von bezahlter Schiffsarbeit/Kopfgeld/anderen Posten. Dieser Rest darf **nicht** als Geldvernichtung oder unbekannte NPC-Zahlung ausgegeben werden. Diese Ergänzungsprüfung ist im nachfolgenden CI-Patch vorgesehen.

**Erste Schlussfolgerung:** Akteursspezifische Kaufkraft **und** Handelshüllen fallen im Spielerfall parallel aus; Eis und Material existieren andernorts. Weder reine Geldemission (B8a) noch ein isolierter Preisaufschlag oder mehr Piratenschutz ist dadurch als alleinige Lösung belegt. Nächstes enges Gate ist, bezahlte Spielerkosten und eventuelle Kopfgeldschöpfung exakt abzugrenzen und dann nur **eine** kausale Handelszyklusfinanzierungshypothese zu testen.

**Status:** ausschließlich [ANALYSE/DRAFT]. Kein Merge, keine Freigabe, kein iPad-/NAS-Deployment. Verbindliche Ziele und Prioritäten weiterhin ausschließlich [docs/ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md).
