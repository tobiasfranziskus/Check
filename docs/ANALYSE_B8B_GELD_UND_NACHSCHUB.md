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

## Ergebnisse und Freigabe

**[OFFEN]** Ergebnisse sind erst nach tatsächlich erfolgreichem CI-Lauf aus den Job-Logs und JSON-Artefakten zu übernehmen. Diese Datei stellt **noch keinen bestandenen Test** dar. B8a hat einen kombinierten Geld-/Rohstoff-/Transportengpass belegt; B8b soll die Kausalität weiter trennen, nicht vorzeitig einen neuen Geldmechanismus festlegen.

**Status:** ausschließlich [ANALYSE/DRAFT]. Kein Merge, keine Freigabe, kein iPad-/NAS-Deployment. Verbindliche Ziele und Prioritäten weiterhin ausschließlich [docs/ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md).
