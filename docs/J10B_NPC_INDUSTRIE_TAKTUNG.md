# J10b – rechtmäßige K7-Vertragstaktung vor dem NPC-Erzpendel

**[DRAFT / ANALYSE · 15.11.2026]** Basis ist der aktuelle dokumentierte `main 2e89ff83e2ebff31d60304715005b7b07c781a00` mit J10a. Dieses Paket führt **nur Testforschung** aus, verändert weder den produktiven Vanilla-JS-Core noch die laufende Browser-Konzernautomatik, Politikvoreinstellungen, NPC-Verfügungsrechte, Waren, Geld oder alte Spielstände.

## Untersuchte Ursache

Aus einer gültigen separaten Regel195→204-Kopie hat die reale Spedition 2.000 ISK und die externe Werft 600 ISK. Tick1 führt der schon vorhandene NPC-Disponent einen 750-ISK-Frachterkauf durch. Zeitgleich beginnt der fremde Erzminer eine autonome, physische Pendelrunde; das originale K7-Industrieangebot verlangt dagegen einen **freien, leeren Miner am Dock**. Ohne koordinierte Unternehmensentscheidungen entsteht aus der vorhandenen funktionierenden Erzförderung kein rechtmäßig signierter industrieller Nadir-Vertrag.

## Ausführbarer Vergleich

`tests/j10b-npc-industrie-taktung.test.mjs` verwendet ausschließlich den Original-Regel204-Kern, die bestehende J8-geschützte Kopie und die strikt nach **eigenständigen Eigentümerkontexten** getrennte J6-W-API. Für die positive **Forschungsgegenprobe** geben die tatsächlich legitimierten Unternehmen am **Tick0** ihre konkreten, vollständig gedeckten Einzelbefehle ab:

1. `transport` kauft eine vorhandene physische Aldera-Frachterhülle für echte 750 ISK aus eigenem Konto.
2. `st_nadir` bietet einem freien `npc3`-Miner und diesem freien Frachter einen Original-K7-Erzvertrag an.
3. `npc3`, `transport`, `werft_extern` unterschreiben den Vertrag **getrennt** mit dem ihnen zustehenden Core-Auftrag, nach Core-Prüfung und aus tatsächlich vorhandenen Firmenkassen. `st_nadir` bestätigt erst nach allen drei Signaturen.
4. Der originale, bezahlt fortgeschrittene 204-Welttick fördert/transportiert **50 Erz**, führt mit eigenständig finanziertem Nadir-W4-Auftrag die echte Raffineriearbeit aus und baut den vertraglich verpflichtenden W5-Frachter durch den rechtmäßigen externen Werfteigentümer. Der Jäger selbst entsteht erst durch **separate** Silizium-, Material-, Bauteil- und J4-Lohnarbeiten und wird anfangs korrekt gesperrt.
5. Vergleichsprobe mit **unveränderter** Produkt-Automatik: tick1 automatisch gekaufter Frachter, aber gleichzeitig schon abgedockter NPC-Erzminer. Das gleiche Core-Angebot scheitert mit Original-Sperrgrund. Der Test gibt Hashes, Kassen, Schiffslage, Ledger und Geldemission aus.

Dieser Gegenpfad ist **keine** neue autonome NPC-Entscheidungsregel und darf nicht als "Spieler besitzt fremde Firmenrechte" interpretiert werden. Er demonstriert nur, welche rechtmäßigen, tatsächlich finanzierbaren Maßnahmen **jeweils eigenständig** getroffen werden *könnten*. Ohne getrennt autorisierte Unternehmenskoordination darf der Browser keinesfalls den Vertrag per einer einzigen Haus-Schaltfläche unterschreiben.

## Tatsächlich ausgeführter Nachweis auf PR-Head `0d1d544c`

**[ANALYSE / DRAFT, NICHT IN MAIN]** [Node22 #43701511219](https://github.com/tobiasfranziskus/Check/actions/runs/43701511219) **292/292 Tests, 0 Fehler, 0 Skips** und vollständiger Root-/NAS-Erhaltungs-Preflight, [JS-/Wirtschaftsregression #43701511223](https://github.com/tobiasfranziskus/Check/actions/runs/43701511223) completed/success. Kein Browser-UI wurde geändert, deshalb keine neu behauptete Browserprüfung; vorhandene J10a-/J9-UI-Abnahme bleibt eine frühere Integration.

- **Alternative Tick0:** `transport` kauft `sh002` für reale **750 ISK**. Einzelne Original-K7-Vertragserklärungen werden nacheinander und mit jeweils **fester Unternehmeridentität** abgegeben: `st_nadir`, `npc3`, `transport`, `werft_extern`, danach `st_nadir`-Abschluss. Fremde Signaturen können nicht mit einem `house`-Konto vorgetäuscht werden. Der vorzeitige Commit ohne Signaturen scheitert atomar.
- Nach dem validierten Tick0-Signierpfad: Käuferkasse **3.260 ISK**, Spedition **1.130 ISK**, Bergbau **2.400 ISK**, externe Werft **820 ISK**, separat gebundene Werfttreuhand **530 ISK**. Zustandshash **`ceaad6b127e32d6e`**. Jeder Wert stammt aus Original-Core- und J6-Buchungen; kein neues Kapital.
- **Tick191:** Die Original-W3-Fracht hat wirklich **50 Erz** angeliefert, W4 **10 Erz zu 5 Material** raffiniert und die signierte W5-Werft **einen echten zusätzlichen Frachter** fertiggestellt. Ledger zeigt `frachter.produced=1`; 40 Erz verbleiben bei Nadir, **kein Material/Silizium/Bauteil vorliegend, 0 neue Jäger**. Hash **`850095f3a7780270`**, `house=3000`, `st_nadir=3740`, `werft_extern=1420`, Weltgeld **33.000**, Mint/Burn **0**.
- **Unveränderter Standardlauf Tick131:** Spedition hat denselben legalen 750-ISK-Frachter, NPC-Erzminer `sh001` führt **50 Erz im freien Flug**, K7-Phase bleibt `frei`, 0 Erz nach Nadir; Original-Core lehnt Angebot als „Schiffe nicht frei im Dock“ ab. Referenzhash **`5634a67cd3433c14`**. Das ist die **konkrete kausale Differenz**: getrennte Eigentümerentscheidung **vor** dem NPC-Abdockvorgang.
- Die gültige Regel195-Quelldatei bleibt unverändert; Replay/Save/Load und unabhängige Geld-, Waren-, Schiffs-/Eigentums-Audits sind bestanden. Die Forschung sagt ausdrücklich **nicht**, dass der NPC selbstständig solche Verträge anbieten würde oder ein erster Jäger in der Produktwelt fertiggestellt worden sei.

**Nächster begrenzter Nachweis:** Neben dem realen W5-Frachter benötigt die erste Jägerkette mindestens **20 Material und 8 Silizium**. Ein physisch in Nadir gebauter/gekaufter K2-Miner kostet eigenes Material, Werftlohn und 600 ISK Käufergeld; die K2-Bauprüfung sperrt außerdem bei verbleibendem Aldera-Minerlager. Hier erst die Bestände/Finanzierung und weitere 10 Erz oder zweite Lieferung nachweisen, keine Gratis-Rohstoffe/Teleport. Danach 8×J3 und J4 separat belegen.

**Produktentscheidung bleibt offen:** Eine Priorität für Industriebedarf vor bestehendem NPC-Pendel wäre eine Änderung der Unternehmer-/Disponentenpolitik. Weder `industrieAutoSetzen(true)` noch ein neuer NPC-Autobefehl wird hier in produktiven Spielständen aktiviert.

---

## Erweiterter, tatsächlich geprüfter K2-/Silizium-Gegenpfad

**[ANALYSE / DRAFT]** [Node22-Run #43702620012](https://github.com/tobiasfranziskus/Check/actions/runs/43702620012), **293/293 Tests, keine Fehler oder Skips**; [JS-Wirtschaft #43702620020](https://github.com/tobiasfranziskus/Check/actions/runs/43702620020) erfolgreich. Ausgangspunkt ist **derselbe** nach 50 Erz/finanziertem K7-W5-Frachter gültige Core-Worldhash; keine künstliche Eingangsware.

1. **Tick211:** Nadir hat nach einer weiteren echten Raffineriecharge 5 Material, Aldera noch **zwei vorhandene Miner im Verkaufslager**. Ein K2-Werftauftrag scheitert korrekt mit `K2: Miner liegen schon in Aldera`. Diese vorhandenen Hüllen werden anschließend **rechtmäßig und jeweils aus vorhandener Kasse** an `house` und `npc3` verkauft – kein Löschen des Bestands.
2. Die externe Werft `werft_extern` baut anschließend mit **5 echten Material und 30 wirklich vorfinanzierten Arbeitsminuten** einen Nadir-Miner, ausdrücklich für `house` vorgemerkt. Mit dem Original-`stationClaimMinerLocal` wird die fertige Hülle für **600 house-ISK** erworben.
3. **Tick241:** Original-K2-Miner **`sh006`**, mit echtem `minerWerft.lokaleKaeufe`-Buch, Hauskasse **1.800 ISK**, NPC3-Kasse **2.058 ISK**, externe Werft **2.690 ISK**, Ledger `miner.produced=1`, Weltgeld **33.000**, Mint/Burn **0**, Hash **`29a875cdd31ab589`**.
4. Derselbe Hausminer reserviert echte J2b-Förderarbeit, bezahlt den F6-Flugdienst, fliegt physisch zum Nadir-Siliziumfeld `(720000,-480000)`, fördert 8 Silizium in **64 bezahlten Arbeitsminuten**, dockt wieder an und verkauft 8 echte Ware für **192 ISK** an Nadir. Die bezahlte Förderarbeit kostet **128 ISK**.
5. **Tick324:** Siliziumlager Nadir **8**, das Hauskonto nach allen echten Förder-/Flug-/Verkaufskosten **1.789 ISK**, Weltgeld unverändert **33.000**, Mint/Burn **0**, Hash **`1f460e8d5f533b76`**. Original-195-Quelle bytegleich, vollständiger Core-Audit pro Minute und Save/Load-Endhash bestanden. **0 Jäger**, denn bislang bleiben 30 Erz/0 Material/0 Bauteile nach echter K2-Werftfertigung. Für J4 werden weiter **20 Material, 8 J3-Bauteile und 32 Werftlohnminuten** nötig, einschließlich mindestens einer zusätzlichen echten Erzlieferung für 5 Material.

**Zusätzlich im spielbaren Code gesondert behoben:** Bisher bot J8 für den fertigen Nadir-Miner nur den generischen, dort unzulässigen `shipBuy`. Der sachgerechte K2-Eigentümerkauf wird im unabhängigen [Draft-PR #371](https://github.com/tobiasfranziskus/Check/pull/371) zur separat geprüften Integration vorgeschlagen. **Nicht** gleichbedeutend mit Freigabe der NPC-Industriepriorität.

---

## Für die spätere Entscheidung

Die optionale bestehende `welt.industrieAutoSetzen(...)`-Forschung bleibt ohne Produktfreigabe **deaktiviert**. Eine neue Prioritätsregel "Bergbau-/Industrievertragsanfrage vor autonomem Erzpendel" ist eine wirtschaftliche NPC-Produktentscheidung und wird hier weder still implementiert noch aktiviert. Erst nach positivem Vorversuch/Unterfinanzierungs- und Krisentest eine konkrete, vom Nutzer getrennt freizugebende Designoption vorstellen.

## Abnahme

Nur tatsächlich ausgeführte vollständige Node22-CI und Testlogs belegen ein Bestehen. Mindestens unabhängige Geld-/Waren-/Eigentums-/Schiffs-Audits, deterministischer Replayhash, Save/Load, abgewiesener vorzeitiger Vertrag, gefälschte Geldmenge und dokumentierter Standard-Negativpfad. Der Test verändert keine GitHub-Pages-Spielversion. Keine neuen 13×90-, 365-/730-Tage-Langzeitnachhaltigkeitsbehauptungen. Echte iPad-Safari-/NAS-Abnahme offen.
