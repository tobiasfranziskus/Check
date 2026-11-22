# Aphros Void – Mini-Style-Bible „Used Future“ (Manager / M4)

**[BESCHLOSSEN: Art Direction, Zielgruppe und Gestaltungsziele · 22.11.2026]** Ergänzt die einzige verbindliche [Produkt-Roadmap](ROADMAP.md); kein Nachweis neuer Grafik-, Piraten-, Kampf- oder Levelmechaniken. Zielgruppe: junge Erwachsene ab ca. 18 Jahren, Strategie-/Wirtschafts- und Space-Sim-Fans. Fallout ist **Stimmungsreferenz**, keine Vorlage für markenrechtlich geschützte Icons, Pip-Boy-Oberflächen, Logos, Figuren oder UI-Kopien.

## Bildwelt und Material

**Leitbild:** elegante, genutzte retro-futuristische Konzernleitstelle: matte Graphit- und dunkelblaue Metallflächen, dezente Messingkanten, abgeschwächter Phosphor-/Radarschimmer, fein dosierte Gebrauchsspuren, lesbare Instrumente. Patina darf niemals Text, Kontrast, Touchziele oder Zustände verdecken. Nicht: steriles SaaS-Dashboard, spiegelnder Neon-Cyberpunk, Cartoon, rostiger Endzeit-Schrott, bildschirmfüllendes Falsch-Radar.

### Design-Tokens (Zielwerte, kein abruptes Überschreiben vorhandener CSS-Variablen)

| Einsatz | Wert |
| --- | --- |
| Tiefenraum / Grundfläche | `#081019` |
| Hauptpanel, matt | `#17232C` |
| Vertiefung / Instrument | `#101B25` |
| Kante / Stahl | `#43545D` |
| Text hell | `#E7E6DC` |
| Text sekundär | `#B7C5C8` |
| Aktive eigene Route / primäre Aktion | `#77C7BE` |
| Messing / hochwertiger Akzent | `#C6A36C` |
| Warnung / reale Gefahr | `#D18461` |
| Ausgeführter Abschluss | `#95C4A1` |

**Farbsemantik geht vor Dekoration:** Türkis = aktive eigene Flottenlage, Messing = Orientierung/Highlight, Orange = **nur echte** Sperre/Gefahr, Grün = **nur belegter** Abschluss. Farben niemals allein als Statushinweis; ergänzende lesbare Texte und Iconformen verwenden. Kontrast prüfen; keine reduzierte Textgröße zugunsten der Optik.

## Typografie und Dichte

- Grundschrift: lokale Systemfonts (system-ui / -apple-system); technische Labels mit sparsamem Letterspacing und Versalien, Fließtext normal, Zahlen tabellarisch. Keine externen Fonts/CDN-Assets.
- Oben: **ein** Primärziel mit Status und nächster legaler Aktion; darunter die **Karte**; Geld, Zeit, Schiffe und Auftragszahl kompakt. Details wie Belege, Statistiken, Erklärungen per vorhandenen `details/summary`-Mustern bzw. Tabs.
- Maximal eine dominante Primäraktion pro Kontext, klare Schaltflächenbeschriftungen („Frachter beauftragen“, „+60 Weltminuten“), keine Entwicklerbegriffe. Lange technische Warntexte nicht wiederholen; Original-Sperrgrund bei Bedarf lesbar verfügbar halten.
- Mindest-Touchziel 48 CSS-px; sichtbare Tastaturfokusse, Screenreader-Namen, keine ausschließlich per Hover erreichbaren Aktionen; bei 390×844 und 1024×768 kein horizontales Überlaufen.

## Sektorkarte – Operationsboard statt zweiter Welt

- **Reuse first:** Bestehenden Daten- und DOM-Pfad `prototypes/spiel/p3-manager-karte.js` und `spiel.css` / `#management-spielfeld` erweitern. Vor neuer Schiffs-/Zielgrafik `VOID_ECHOES_CODEKATALOG.md`, `prototypes/raum/raum-grafik.js` und vorhandene Tests vergleichen.
- Aldera als Rohstoff-/Handelsstation, Nadir als Industrie-/Werftknoten, Dravos nur in tatsächlich verfügbarer Regel207-Sitzung; Stationen über geometrische, zugängliche Markierungen differenzieren.
- Miner = kompakt-industrielle Silhouette, Frachter = länglich/voluminös, Jäger = spitz/klein. Eigene/fremde Schiffe lesbar unterscheiden; durchgehend eindeutige IDs/Eigentümer, keine fremden Befehle anbieten.
- **Schiffsbewegung aus wirklichen Weltphasen:** bestehende Hinfahrt/Rückfahrt/Transit-/Dockzustände und echte Karten-/Schiffsdaten nutzen. Animation ausschließlich als Darstellung tatsächlich bekannter Bewegung; nicht aus UI-Zeit, Fantasiekoordinaten oder interpolierten ETA-Werten scheinbare Simulationspositionen erfinden. Bei vorhandenen verifizierten Zeit-/Positionsdaten ist deterministische Darstellung möglich. Zwischen nicht belegbaren Positionen lediglich „unterwegs“ darstellen.
- Nutzeraktionen: Schiff antippen/auswählen → Ort, Ladung, Auftrag, originale Sperre und rechtmäßige Disposition sehen. Raster, Scanlinien und zurückhaltende Lichtreflexe rein CSS/SVG, performant und `prefers-reduced-motion` respektierend; kein WebGL/Framework nötig.

## Perspektive für Piraten, Kampf, Level-/Rufsystem

**[BESCHLOSSEN: motivationsrelevante Produktziele; Umsetzung ausdrücklich nicht freigegeben]** Piraterie erzeugt später Handelsrisiko, Schutz-/Eskortentscheidungen und ökonomische Konsequenzen; Kampf bleibt an den gemeinsamen Weltkern gebunden, managerial zunächst Flotten-/Sicherheitsentscheidung. Fortschritt soll später in glaubwürdigen Konzernmeilensteinen, freigegebenen Verträgen, Ausrüstung/Personal, Pilotenkompetenz und Fraktionsruf sichtbar werden.

**Für den ersten Codex-UI-PR:** **Keine** Platzhalter-Risikostufe, Scheinpiraten, erfundene Feinde/Angriffe, XP, Rang-/Lizenzpunkte, Freischaltversprechen oder funktionslosen Schutzbuttons einführen. Bestehende, **wirklich im aktuellen Zustand belegbare** Statuswerte dürfen rein lesend gezeigt werden. Alles andere gehört in ein separates Entscheidungs-/Regelkonzept mit Finanzierung, Eigentum, Folgeschäden, Audits und ausdrücklicher Projektfreigabe.

## Bild- und Funktionsabnahme

- Screenshots bei 1180×820, 1024×768, 820×1180 und 390×844; mindestens Desktop- und Mobil-Vergleich vorher/nachher. Richtige Auswahl, aktiver Transit, Dock, Fremdeigentum, blockierter Auftrag und lange Beschriftungen sichtbar.
- Chromium + WebKit Touch/Keyboard, Sichtbarkeit, Kein-Horizontalüberlauf und reduzierter Bewegungsmodus. Save/Load/JSON unverändert; DOM-Auswahl und Animation dürfen keinen Simulationshash, Welt-Geld, Waren- oder Eigentumszustand ändern.
- Statische Pages-/NAS-Tauglichkeit bewahren. 60-Minuten-Neulings-Blindtest und echtes iPad/NAS sind separate offene Abnahmen.
