# B6b-P1 – Vorfinanzierte neue NPC-Arbeit (Regel 14)

**31. Oktober 2026 · [ANALYSE/DRAFT] · Messung und Entscheidungsempfehlung nach CI.**
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

## Ausgeführter CI-Lauf und Urteil

**[TEST]** [GitHub Actions B6b-P1 #41177739854](https://github.com/tobiasfranziskus/Check/actions/runs/41177739854) auf dem tatsächlich analysierten Produkt-/Tools-Head `5818ab8d95ec2e1534b0eacf7fc6dfcaedc6f49b` erfolgreich: **19/19 Jobs grün**, 13 passive Seed-Paare, vier echte B1-Krisenpaare, historische Regel-12-Startverifikation, Goldenv12/v14-Kontrollvergleich, unabhängig überprüfte unveränderte Kontrollhashes, **34 Läufe, 4.540 Tageshashes, 108.960 stündliche unabhängige Geld-/Warenaudits und deterministische Replays, 440 Save/Load-Roundtrips**. Im Synthesejob die bestehenden **67/67 Node-Tests bestanden**, keine Fehler/Skips. Kein iPad-Safari-/NAS-Test.

### Standardwelten (13 Seeds × 90 Tage)

| Messgröße | Kontrolle, v14 | P1 isoliert | Einordnung |
| --- | ---: | ---: | --- |
| Mangelstunden | **791** | **938** | +147, Verschlechterung um 18,6 % |
| Abgeschlossene Rezepte | 1.285.074 | 1.281.253 | −3.821 |
| NPC-Trader-Frachter-Warenverkäufe | **310.058** | **294.066** | −15.992, rund −5,2 % |
| Folgekauf nach Verkauf derselben Schiff-ID, alle NPC | 225.968 | 217.213 | −8.755 |
| Tatsächliche Soll-Arbeit NPC1–3 (ISK) | 46.337.480 | 44.125.191 | −2.212.289 (weniger Arbeit) |
| Tatsächlich bezahlt (ISK) | 46.321.390 | 44.115.131 | −2.206.259 |
| **Ungedeckte Arbeit (ISK)** | **16.090** | **10.060** | −6.030, jedoch bei rückläufiger Wirtschaftsleistung |
| Frachter NPC1/2 am letzten Tag, über alle Seeds | 65 | 62 | −3 |
| Aldera Silizium (Endbestände summiert) | 541 | 564 | +23 |
| Aldera Bauteile (Endbestände summiert) | 505 | 477 | −28 |
| Verhinderte Frachterstarts | 0 | **8.602** | nicht isoliert positiv zu werten |

### Vier Spieler-Krisenfälle (Tag 90–365)

| Messgröße | Kontrolle | P1 |
| --- | ---: | ---: |
| Mangelstunden, vier Fortsetzungen | 620.550 | **620.550** |
| Rezepte | 24.356 | **24.356** |
| NPC-Trader-Verkäufe | 0 | **0** |
| Ungedeckte NPC-Arbeit | 4.450 ISK | **433 ISK** |
| Verhinderte Frachterstarts | 0 | **13.182** |
| Ursprüngliche B1-Frachter überleben | 0/4 | **0/4** |
| NPC1/2-Frachter-Endbestand über vier Fälle | 0 | **1**, ausschließlich Fall `station` |
| Aldera Silizium/Bauteile am Ende aller vier Fälle | 0/0 | **0/0** |

**Präzisierung:** Die 4.017 ISK Differenz entfallen auf den `station`-Fall; hier bleibt ein NPC1-Frachter zwar länger erhalten, ermöglicht bis zum Ende aber keinen einzigen nachgewiesenen NPC-Trader-Verkauf. Die Fälle `miner`, `handel-flotte` und `jagd` behalten unter P1 identische Endhashes zur Kontrolle. Reduzierte Unterdeckung entspricht hier überwiegend unterlassener Arbeit, nicht neu entstandener Kaufkraft. Die Einzelhashes, Kassen, Schiffe und Pausenzahlen stehen im CI-Artefakt `b6b-p1-gesamt`.

### [ANALYSE] Entscheidungsempfehlung

**P1 nicht in `main` integrieren.** Zwar sinkt die Unterdeckung, doch passive Versorgung und Transport gehen messbar zurück; die vier echten Spielerkrisen werden wirtschaftlich nicht geheilt. P1 ersetzt weder zahlungsfähige Käufer noch erste Ladung, dauerhaften Schiffsbetrieb, bezahlte Hüllen und verfügbare Materialwege. Die Lösung in noch mehr pauschalen Pausen oder Schonfristen zu suchen, wäre ein ungedeckter Komplexitätszuwachs.

**Nächster isolierter Schritt [OPTION]:** Nicht P1 iterativ verfeinern, sondern die konkrete finanzierbare Erstfahrt in den vier Krisenfällen bilanziell aufschlüsseln: wer besitzt welche Kasse, wo steht Ware, wer kann aktuell kaufen, welche reale Frachterhülle ist vorhanden, welcher Mindestbetrag fehlt **nach Gebühren und Kosten**? Danach getrennt prüfen, ob bestehende Zahlungsmittel ohne neue Quelle und ohne Spielerabgabe gezielt in einen vollständigen wirtschaftlichen Transaktionszyklus zurückgelangen können. Erst bei belegtem Gegenbeispiel ein klar ausgewiesenes Geldregime oder Markteintrittsmodell zur Produktentscheidung vorlegen.

**Freigabegrenze:** Kein Produktcode, keine Schema-/Regeländerung, keine Goldenaktualisierung, kein Merge/Deployment. Die CI wurde auf dem später unveränderten Analysecode ausgeführt; die Ergänzung dieses Berichts ist eine nachfolgende reine Dokumentation.