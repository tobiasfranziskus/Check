# W6 / PIR-4a – nachhaltig erschließbare Siliziumversorgung [FORSCHUNG]
23.11.2026 · Basis `679ba6c1fdb05435164e29b2e21514ddaa676279`. J2b in main hat endlichen 16er-Vorrat (Regel207 2×16), feste 8er-Charge; bezahlte Förderung 64 Arbeitsminuten × 2 ISK =128, Ankauf 8×24=192; zusätzlich echte Flugreserve, Lohn, Verschleiß. Kein Produkt-Respawn im J2b-Industrieaudit; Kartengeologie und vorhandene andere Forschungszweige allein keine Ware. #606 historische/aktuelle Engpässe; #609 bestätigt kompakte 3-Silizium-Hülle.

## Tatsächlich ausgeführter Versuch
Sieben Originalmodule vom fixierten SHA in V8 separat geladen; Original-450-ISK-Rezept (3 Teile, 2 direktes Material, 16 Minuten) aus #609. Seed42, direkte Regel204-Erstellung (nicht Rule195-Migration), S02, NPC-/Siliziumopt-in, 3000 Haus/33000 Welt. Zwei isolierte J2b-Codevarianten kreditieren am Originalwirtschaftstakt genau 8 Einheiten ins geologische Feld je 7 bzw. 30 Tage, maximal 24 Freilegungen = 192 zusätzliche Einheiten über den ganzen Horizont. Modellierter vorher definierter **endlicher Tiefenvorrat**, keine deterministische unendliche Erzeugung. Zeitpunkt unabhängig von Kasse oder Nachfrage. Audit erweitert auf Feld+gefördert=16+freigegeben(tick); Ware, Lohn, Kaufbelege, Flug, Werft und NPC-Entscheidung unverändert. Keine direkte Lagerzufuhr, keine frei erfundene Käuferkasse. Testkäufe aus vorhandener Hauskasse sobald Originalhülle verfügbar; kein autonomes Kaufversprechen und kein Spielgewinn. Ausgeführte 90-Tage-V8-Läufe mit Checkpoints, Core/physischem Waren-/Geld-/Save-Audit:

| Periode | Tag | freigegeben zusätzlich | Feld | gefördert/verkauft | gebaut/gekauft | Jägerlager | Haus-ISK | Hash |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- |
| aus | 30 | 0 | 0 | 16 | 5/5 | 0 | 750 | 3ad8f6dd82d6b64a |
| aus | 60 | 0 | 0 | 16 | 5/5 | 0 | 750 | d3fd4c58bafa5781 |
| aus | 90 | 0 | 0 | 16 | 5/5 | 0 | 750 | d3336a8720d89aa8 |
| 7 | 30 | 32 | 24 | 24 | 7/6 | 1 | 300 | e75fdc10e3347d74 |
| 7 | 60 | 64 | 56 | 24 | 7/6 | 1 | 300 | e8b43e3d8dbac603 |
| 7 | 90 | 96 | 88 | 24 | 7/6 | 1 | 300 | fdc4b10c207009fb |
| 30 | 30 | 8 | 8 | 16 | 5/5 | 0 | 750 | e956b1f4a85836a5 |
| 30 | 60 | 16 | 8 | 24 | 7/6 | 1 | 300 | d8ac1cd423e9c2e9 |
| 30 | 90 | 24 | 16 | 24 | 7/6 | 1 | 300 | cca5a91756495a5c |

Weltgeld 33000, Mint/Burn0, originale Waren-/Geldaudits und Save/Load bestanden. K7-W3-Erzlieferungen am Tag90 aus/7/30 = 21/22/22. In beiden Freilegungsvarianten endet realer Absatz an Hauskasse 300 und 1 Lagerjäger; kein automatischer Käufer wird erfunden. 7 Tage häuft ungenutzte Geologie an, 30 Tage reicht für denselben beobachteten Absatz bis Tag90, nicht für nachgewiesenen späteren Kriegsbedarf. Weitere Förderung nur bei echtem Bedarf. Forschungs-Saves tragen noch originale Regelkennung, ausschließlich innerhalb derselben Laufzeitkopie; nicht exportieren/importieren. Neue Node22-Tests mit exakten Hashes, Original-W6-Audit, zusätzlichem Tag60->90-Replay und Manipulationsnegativen eingecheckt, CI offen.

## Empfehlung für langfristiges Rohstoffmodell
1. Zunächst endlicher Tiefenvorrat und zeitlich wieder erschließbare Asteroidenanteile als Option (8/30 Tage als konservativer Start); maximal 24 Freilegungen nur Versuch, keine Freigabe eines Produktwertes. Produktmodell muss freigegebenen, noch nicht erschlossenen und tatsächlich abgebauten geologischen Bestand explizit trennen. Keine blinde Ressourcenspawn-/Warenledger-Verknüpfung; Respawn im Flugfeld und Industrieförderung dürfen nicht dieselbe Einheit zweimal auszahlen. Eindeutige Feld-ID, Seed, Tick, Freilegungsbeleg, deterministische Obergrenze, keine sofortige Freilegung per Save-Flag. Bei komplett vollem erschlossenem Feld neue Freilegung aussetzen; keine zusätzliche Nachfrage. Neue Quellen als physisch anfliegbare Felder mit vorhandenen Original-Feldverträgen.
2. Echte zweite Quelle Dravos/Regel207, bestehende P8d-Fracht und P8h-Folgeversorgung nutzen. Lokale Versorgung und Transportkosten separat; keine neue kostenlose Route. Forschung zu planbaren Förderlizenzen und Recycling erst nach Hüllenverlustarchiv: geborgene physische Teile in echtes Lager, realer Transport, Sortier-/Reparaturkosten; Reststoffmengen und Umwandlungsverluste buchen. Keine Hülle und gleichzeitig ihre gesamten Teile weiterverkaufen.
3. Keine Nachfrage nur zur Produktion. Reale Käufer aus PIR4/5 (eigene Ersatznachfrage, NPC-Schutzauftrag, Piraten mit finanziertem Verkauf) erst nach Freigabe und Eigentums-/Pilotenregel. Kein künstliches Kaufskript im Produkt. 365/730 mit Geologie, tatsächlichen Verlust- und Ersatzverträgen, 13×90 und Kontrollprofilen, einschl. Ressourcenstop, fehlende Liquidität und kein Käufer. Endliche Tiefe nicht als unendlich nachhaltig bezeichnen; echte Langzeitversorgung braucht neue erschlossene Gebiete bzw. Recycling/erneuerbares Feldmodell mit klaren Herkunftsregeln. Keine erzwungene Wirtschaftsstabilität.

## Abnahme und Koordination
Neues versionsgebundenes Profil erforderlich, keine Preis-/Geologie-/RNG-Veränderungen im Produkt. Node22, echte Feldanflüge und Arbeit, Kaufreserve, Lager, Feld-/Kassen-/Waren-/Hüllenaudit, negativer importierter Feldzuwachs, falsche Zeit und doppelter Freilegungsschritt, Save/Load/Teilschritt, Standardhashes. #604/Codex und #599 UI nicht berühren. P0 erhält Konzeptlink, keine konkurrierende zentrale Dokumentänderung.
