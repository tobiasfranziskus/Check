# F8-A – Spielbare 2D-Jägerflugübung auf dem vorhandenen F6-Flugkern

**[DRAFT / ANLEGEN: 14.11.2026]** Ausgangsbasis: [K13/F6-Integrationsbranch #329](https://github.com/tobiasfranziskus/Check/pull/329). Eigener Forschungspfad `prototypes/f8-jaeger/index.html` (nur statischer Browser). Parallel laufender F7-Codex-Auftrag [#330](https://github.com/tobiasfranziskus/Check/issues/330) bleibt unberührt.

## Tatsächlich implementiert

- Flugkörper Klasse `jaeger` mit Originalparametern aus `prototypes/flug2d/flug-kern.js`: **vmax 4160, Schub 128, Bremse 160, Drehung 10** (Forschungskonstanten, kein neu genehmigtes Balancing). Darstellung über den vorhandenen `hunter`-Renderer aus `prototypes/flug2d/grafik.js`.
- Touch- und Tastaturbedienbarkeit: Kurs 0–255, Schub 0–100, Abdocken, direktes Steuern, Bremsen, Zielanflug (`shipFlyTo`), Dock-Rückkehr (`shipDock`), Pause, 1 s / 1 min Schritt, Neustart.
- Ein einziger deterministischer **Flug-Integrator F6**: alle Bewegungsentscheidungen entstehen durch `FlugKern.ausfuehren` / `FlugKern.schritt`, nie durch Positionen aus Canvas oder neue unabhängige Flugphysik.
- Flugtraining: echte Koordinate (720000, −288000), Erfolgsradius 48000 P und Geschwindigkeit maximal 240 P/Schritt. Die Anzeige darf Erfolg nur zeigen, wenn diese überprüfbaren Orts-/Geschwindigkeitsbedingungen erfüllt sind. Nur Trainingsfortschritt, kein wirtschaftliches Einkommen.

## Strikte Forschungssperren

Dieser isolierte Zustand hat `schema=0` und `profil=F8_FLUGUEBUNG_OHNE_WIRTSCHAFT`, aber ausdrücklich **keine** `rulesVersion`, `owners`, `ledger`, `minted`, `burned`, `kampf`, `kopfgeld`, `xp` oder Speicherhülle. Die ID `f8_training_only` ist **keine** im Wirtschaftskern erzeugte, gekaufte oder übertragbare Jägerhülle.

Der Übungsflug ist **kein echter finanziert fliegbarer Jäger im K13-/Regel200-Universum**; er aktiviert weder Kampf noch Kopfgeldzahlung. Er darf nicht als wirtschaftlicher Gameplay-Nachweis oder Regel200-Save importiert werden. Keine neue Spieler-/NPC-Weltuhr im Produktionsspiel; `requestAnimationFrame` ist nur die Bedienoberfläche dieses separaten Flugtestprototyps.

## Wiederverwendung und nächste Integration

Aus [#173](https://github.com/tobiasfranziskus/Check/pull/173) – finanziertem Fighterbau – und [#178](https://github.com/tobiasfranziskus/Check/pull/178) – zwei real bezahlten Jägern, echtem Kampf und Verlustbelegen – müssen **selektiv** die notwendigen Materialien, 900-ISK-Kauf-/Eigentumsbelege, Kern-Kampfaufrufe und Auditverträge geprüft und in Regel200 integriert werden. Nicht ganze historische Stacks oder alte `index.html` übernehmen. [#174](https://github.com/tobiasfranziskus/Check/pull/174) belegt die kritischen alten Kopfgeld-Mints und unbezahlten Ersatzhüllen: weder alten Kopfgeldfaktor 3 noch Spawn-/XP-Schemata unbesehen übernehmen.

Nächstes Produkt-Gate: Eine tatsächlich industriell finanzierte Jägerhülle und ein realer zahlender Käufer müssen im **einzigen** K13/F6-Core existieren; dann denselben F8-Körper per Core-Validierung statt Training-ID persönlich fliegen. Danach erst gezielte Schüsse, NPC-Piraten und mit vorhandener ISK-Kasse vollständig vorfinanzierte Bounty-Verträge; keine Emissionsregel ohne Beschluss.

## Tests

- `tests/f8-jaeger-fluguebung.test.mjs`: Originalflugwerte, ausschließliches Profil, ungültige Befehle und Besitzverletzungen ohne Mutation, gezielter Raumflug, Bremsung, Dock-Rückkehr, Save-artiger JSON-Roundtrip im Test und identischer deterministischer Replay.
- `tests/f8-jaeger-fluguebung-browser.cjs`: Browser-Touchbedienung in Chromium und WebKit bei 1180×820, 1024×768, 820×1180 und 390×844; Zielmarke, Kinematik, Rückflug, Neustart, ausschließliche Forschung.
- Keine Änderung an `index.html`, `aphros-void.html`, `prototypes/w5ac/rule191-w5-ferry-core.js`, K7-Industrieverträgen oder produktivem Spielstand. Auf CI-Ergebnisse dieses Branch-Heads warten, bevor „bestanden“ dokumentiert wird.
- Echte iPad-Safari- und NAS-Abnahme offen.
