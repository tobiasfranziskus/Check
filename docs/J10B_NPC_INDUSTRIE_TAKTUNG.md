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

## Für die spätere Entscheidung

Die optionale bestehende `welt.industrieAutoSetzen(...)`-Forschung bleibt ohne Produktfreigabe **deaktiviert**. Eine neue Prioritätsregel "Bergbau-/Industrievertragsanfrage vor autonomem Erzpendel" ist eine wirtschaftliche NPC-Produktentscheidung und wird hier weder still implementiert noch aktiviert. Erst nach positivem Vorversuch/Unterfinanzierungs- und Krisentest eine konkrete, vom Nutzer getrennt freizugebende Designoption vorstellen.

## Abnahme

Nur tatsächlich ausgeführte vollständige Node22-CI und Testlogs belegen ein Bestehen. Mindestens unabhängige Geld-/Waren-/Eigentums-/Schiffs-Audits, deterministischer Replayhash, Save/Load, abgewiesener vorzeitiger Vertrag, gefälschte Geldmenge und dokumentierter Standard-Negativpfad. Der Test verändert keine GitHub-Pages-Spielversion. Keine neuen 13×90-, 365-/730-Tage-Langzeitnachhaltigkeitsbehauptungen. Echte iPad-Safari-/NAS-Abnahme offen.
