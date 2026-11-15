# J14 – nach Speicher-Import rechtmäßig gebundenen Silizium-Miner wieder betreten

**[DRAFT / 15.11.2026] – integrierter Regel204-Kern bleibt unverändert**

## Ursprünglicher Fehler

Die persönliche Cockpitauswahl in `prototypes/verbund/konzern-session.js` ist absichtlich nur ein flüchtiger Controllerwert, kein fiktives, nachträglich in einen Save geschriebenes Schiffsrecht. Nach einem echten JSON-Import war `pilot=null`. Solange der Spieler nur **ein** Schiff hatte, wurde es als Sonderfall wieder verbunden. Bei **zwei rechtmäßig erworbenen Schiffen** und einem bereits gestarteten `J2b: siliconMineStart`-Auftrag auf dem Nadir-Miner war das Reattach wegen `J6.rollenGrund` unzulässig. Der Spieler konnte deshalb seine wirklich bezahlte Bergbauarbeit nicht fortsetzen, obwohl Welt, Eigentümer und Save valide waren.

## Minimale Änderung

Der Controller darf nur dann ohne neuen Core-Befehl einmalig an einen laufenden J2b-Miner gebunden werden, wenn:
- **noch überhaupt kein Pilot ausgewählt** wurde und die Flugzeit angehalten ist;
- die vollständig validierte/ursprünglich gespeicherte Welt `kanon.silizium.auftrag` auf exakt die entsprechende Schiff-ID und `owner:'house'` bindet;
- das vorhandene Schiff wirklich `house` gehört, Klasse `miner`, System und Heimat `nadir` hat;
- das Original-K2-Kaufjournal einen gültigen lokalen `house`-Kauf für exakt diese ID belegt;
- kein autonomer `pendel`-Auftrag das Schiff steuert.

**Kein anderes eigenes Schiff und kein NPC-Firmenauftrag** wird dadurch ansteuerbar. Ein anschließender Schiffwechsel bleibt ausschließlich nach `J6.pruefenRolle` möglich (beide Schiffe am selben realen Dock, vollständiges Audit und kein laufender Vertrag). Beim reinen Wiederanmelden bleiben JSON-Bytes, Hash, Eigentum und Weltzeit unverändert. Kein neuer Speicher-/Regelversionsstand, kein zusätzliches Feld und keine stille Migration.

## Reproduzierbarer Original-Core-Gegentest

`tests/j14-pilot-relogin-multiship.test.mjs` baut mit `j10b-k2-kauf-fixture.cjs` eine tatsächlich vorfinanzierte neue Regel195→204-Karriere mit zwei physischen und wirklich gekauften `house`-Minern. Sie kauft die hausgebundene Nadir-K2-Hülle für 600 ISK, nimmt einen Original-J2b-Auftrag an, exportiert echtes JSON, lädt es neu und prüft:
1. Reattach am gebundenen Schiff ohne Core-Mutation, trotz zweier eigener Miner;
2. neue originale Cockpitaktion `shipUndock` mit Welt-, Geld- und Flug-Audit;
3. erneutes Laden während des echten Arbeitsflugs;
4. Ablehnung eines fremden Schiffs sowie eines Rollenwechsels von Aldera zu Nadir;
5. unveränderte strenge Lade- und Speicherregeln.

**Abnahme vor möglichem Merge:** vollständiges Node22-Gate, rechtmäßige Jäger-/Frachter-/Miner-Regression sowie Chromium und WebKit mit vier Touchgrößen. Ohne dieses Gate bleibt der PR ein Draft. Der laufende W6/P7-Langzeitaudit ist ein separater, konfliktfreier Branch. Echter iPad- und NAS-Gerätetest bleibt offen.
