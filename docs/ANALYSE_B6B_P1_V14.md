# B6b-P1 – Vorfinanzierte neue NPC-Arbeit (Regel 14)

**31. Oktober 2026 · [ANALYSE/DRAFT] · Versuchsplan, vor CI.**
Gepinnter Produktionsstand: `main d454d0661dee48a7bfdb843d05096982d799e51f`, **v0.12.5, Regel 14, Schema 8**. Einzige verbindliche Produkt-Roadmap: [ROADMAP.md](ROADMAP.md). B6a [Analyse #50](https://github.com/tobiasfranziskus/Check/pull/50) belegt bei vier Langzeit-Spielerkrisen 4.450 ISK tatsächlich fällige, aber nicht bezahlte NPC-Arbeit, ohne Wiederanlauf der Händler. Das ist **nicht** die alleinige Kollapsursache.

## Hypothese, nicht Entscheidung

**P1** prüft, ob die aktuelle reine Margenprüfung bei NPC-Frachtern durch eine **Vorab-Kassenprüfung für Ladung und voraussichtliche Reise-Arbeit** belastbarer wird. Miner mit weniger als einer vollen Stunde verfügbarer Arbeitskasse beginnen keine neuen Förderminuten. Unterstellt wird **kein** zusätzliches Kapital, keine neue Schuld, keine pauschale Spielerabgabe und keine Piraten-/Preisänderung.

Die Variante verändert nur einen isolierten Arbeitskern im Analysewerkzeug `tools/analyse-b6b-p1.mjs` per genau geprüfter Quellanker:

- Beim automatischen NPC-Frachterabflug sind die Kosten einer regulären kompletten Fahrt `ceil(betriebskosten.frachter × route.zeit / 60)` und der bereits geplante reale Wareneinkauf einschließlich Kaufgebühr aus der bestehenden Konzernkasse verfügbar. Andernfalls verbleibt das Schiff am Dock und versucht es nach `warteLeer` erneut. Das betrifft auch leere Umpositionierungen und bereits beladene Absatzfahrten.
- Für NPC-Miner wird nur das **neue Fördern** bei <150 ISK Eigentümerkasse ausgesetzt. Fertig geladene Fracht bleibt verkaufbar; das Minerschiff behält Auftrag und Zustand.
- Das Original des `betriebskosten()`-Kerns bleibt unverändert: tatsächlich aufgelaufene Arbeit wird bezahlt, sonst nur anteilig; keine Stunden werden verschenkt. **P1 garantiert wegen konkurrierender Ausgaben während einer Fahrt nicht, dass jede spätere Arbeitsminute gedeckt ist.** Insbesondere schafft P1 keine Zahlung für einen liegengebliebenen Transporteur.
- Der Spieler, Piraten, Sicherheit, Schiffsersatz, Sollplatzbindung, RNG/Seed, Warenströme, Preise und Geldquellen bleiben unberührt. Normale Flüge benötigen keinen Treibstoff.

## Geplanter Prüfrahmen

**P1 gegen byte-identische Kontrolle:** 13 feste Seeds je ×90 Tage (2.340 Spieltage) und vier gepinnte originale B1-Spielerfälle je ×275 Tage (2.200 weitere Spieltage), zusammen **34 Läufe / 4.540 Tageshashes / 108.960 stündliche Geld-/Warenaudits und bit-identische Replays**. Regel-12-Krisenstarts werden vor Regel-14-Migration anhand des Original-Hashes geprüft, im P1-Vergleich mit identischen validierten Befehlen fortgesetzt.

Die Kontrollvariante muss die unveränderten Produkt-Goldenwerte von **791 Mangelstunden und 310.058 NPC-Trader-Frachterverkäufen** reproduzieren, außerdem die B6a-Krisen-Unterdeckung von **4.450 ISK**. Die Varianten werden auf Rezepte, Mangel, NPC-Handel, tatsächlich angefallene und bezahlte Arbeit, verbliebene Unterdeckung, Folgekäufe, Schiffskäufe/-verluste, NPC1/2/3-Kassen, Frachterbestand und Silizium-/Bauteilversorgung in Aldera geprüft; getrennte Save/Load-Roundtrips und 67 bestehende Node-Tests sind CI-Bestandteil.

**Wirtschaftliches Erfolgsgate:** Weniger unbezahlte Kosten allein reichen nicht. P1 darf keinen Scheingewinn durch weggefallenen Transport oder Förderung erzeugen. Eine Verbesserung benötigt nachgewiesenen realen Folgezyklus und funktionierende Handelsflotten/Versorgung in den Spielerkrisen, ohne relevante Regression in den passiven Welten.

## Abgrenzung

- **[OPTION] P2** später: tatsächlich gebundene Kostenreserve vor einer Fahrt. Erst zulässig nach Prüfung, wie konkurrierende Besitzerzahlungen und Spielstände behandelt werden.
- **[OPTION] V** echte begrenzte Verbindlichkeit und Tilgung: Gläubiger, Haftung und Migration gesondert freigeben.
- **[OPTION] I** bezahlte Insolvenz/Übernahme mit realem Startkapital, Lager und Hüllen: gesonderte Produktentscheidung.
- Keine Änderung an `index.html`, `tests/**`, `docs/ROADMAP.md`, Goldenwerten, Spielstandschema, Regelversion oder Haupt-CI. Der Analyse-Workflow ist zusätzlich und ausdrücklich nicht Teil einer Produktfreigabe. **Kein Merge oder Deployment.**

**CI-Ergebnis:** Noch nicht ausgeführt; technische oder ökonomische Bestehensaussagen nach der tatsächlichen Prüfung ergänzen.