# PIR-2b – Physische Abfanggrenze und Entscheidungsvorschlag [DRAFT / FORSCHUNG]

Basis #597 auf `c3a40050e7dc8f59a80afeaa646359da1a531c70`, darunter gemeinsamer Kandidat #596. Kein Eingriff in Produktcode und keine geänderte KI. Die neue ausführbare Probe untersucht die vollständige bezahlte F4-Runde minutengenau und prüft den originalen Flugvalidator und öffentlichen Eigentumsschutz an tatsächlich beobachteten Frachtkontakten. Sie protokolliert Kontaktzeit, Ladung, Referenzwert und Transitrestzeit. Die Originalrechnung (240 ISK Tarif, 120 ISK Fluglohn), Eigentum, Geld und Save/Load bleiben Prüfpflicht. Ergebnis noch nicht ausgeführt; gezielte CI wird über diesen PR ausgelöst.

## Befund aus dem Quellcode

- `welt-kern.js`, `m_core_flugplan.spielerFrachter`: lokaler Freiflug nur für unbeladene eigene Aldera-Frachter ohne Vertrag. NPC-Frachter und W3 bleiben Transit. `transitSteuerung` ist kein Übergang in den freien Flug.
- `flug-kern.js`, `zielObjekt` / `pruefen`: `shipFollow` verlangt einen realen freien Flugkörper im selben System; der Transitkontakt liefert keinen solchen Körper. `shipApproach` akzeptiert Station/Feld, nicht Transit-Schiffe. PIR-1 priorisiert Rückkehr und unterbindet öffentliche Befehle für die NPC-Hülle.
- Die 4-Minuten-Korridorinformation ist keine physische Position. PIR-2a liefert für solche Kontakte folgerichtig keine Distanz und kein verfolgbares Ziel.
- Vorhandene PIR-1-Prüfung des legitimen Nadir-Freiflugjägers belegt Verfolgung und Zielverlust, aber keine Abfangbarkeit eines beladenen Frachters.
- Void-Echoes-Katalog (erneut geprüft): vorhandene Folge-/Anflug-/Zielverlustmuster weiterverwenden; kein zweiter Flugkern.

## Entscheidung für PIR-2b und PIR-3

**Empfehlung [OPTION, keine Produktfreigabe]:** echte lokale Ankunfts-/Abflugphase am bestehenden Nadir-Tor für ausgewählte finanzierte Frachtverträge, im separat freigegebenen PIR-Forschungsprofil. Nicht einen zufälligen Überfall als physischen Abfang darstellen. Den bestehenden F4/W3-Transport, Ladung und Vertragsreservierungen weiter als eine Quelle verwenden.

1. Zunächst einen minimalen F4-Fork ohne Angriff: reale Torposition und lokale Flugphase vor dem Dock, legitime Ziele nur im selben System, Sicherheitsstufe und sichtbarer Kontakt. Ursprüngliche Vertragsautorität bleibt der einzige Eigentums-/Ladungs-/Ankunftsweg. Keine freien Spielerbefehle für gebundene Frachter.
2. Die örtliche Phase muss innerhalb bereits bezahlter Vertragszeit nachgewiesen oder mit ausdrücklicher Neu-Finanzierung genehmigt werden. Kein Gratisflug, kein Teleport, keine künstliche Ladung. Kann das Dock nicht rechtzeitig erreicht werden, muss die Vertragsunterbrechung ausdrücklich geregelt sein; kein stiller Lieferabschluss.
3. Piraten folgen ausschließlich legalen, geladenen, tatsächlich erreichbaren Kontakten über den bestehenden Flugregler; Verlust des Kontakts, Rückkehrreserve und Verschleiß haben Vorrang. Abfangradius und Sensor-/Dockrechte sind Produktparameter, nicht hier beschlossen. Physische Annäherung allein löst keine Schäden aus.
4. Erst nach positiven und negativen Replays: getrennte Kampf-/Verlust-/Beute-/Escrow-Spezifikation; bezahlte Eskorten danach. Aldera bleibt sicher; Nadir als Forschungsgebiet; Dravos nicht automatisch hinzufügen.

Alternative [OPTION]: abstraktes Korridorrisiko als klar gekennzeichnetes, deterministisches Vertragsereignis ohne geometrische Behauptung. Einfacher für Management, aber kein tatsächliches Abfangmanöver. Nicht beide Modelle gleichzeitig einführen.

**Gate:** echtes F4-Kontaktpaar, Zeit-/Geld-/Warenerhaltung, unveränderter ziviler Referenzzustand außerhalb des opt-in, Original-Saves, Rückkehr und Wiederholung, positive und negative Flugtests, 13×90/365/730 vor einer späteren Produktintegration. Blindtest/physisches iPad/NAS bleiben offen. Kein neuer Kampf, keine Schäden, keine Freigabe der Produktparameter in diesem PR.
