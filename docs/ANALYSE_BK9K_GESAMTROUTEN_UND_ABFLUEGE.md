# B-K9k – Tatsächliche NPC-Routenentscheidung gegen Hin-/Rückflug und Schiffersatz

**01.11.2026 · [ANALYSE/ARCHIV] [PR #103](https://github.com/tobiasfranziskus/Check/pull/103) · NICHT integriert**

**[MAIN]** `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, Aphros Void v0.12.5, Regel14/Schema8. Analysedateien und CI ausschließlich auf einer eigenen Abzweigung von main. **Keine** Änderungen an `index.html`, keine Emission, kein Merge und keine neuen verbindlichen Dock-/Lohn-/Schiffsersatzregeln.

## 1. Im Originalcode unmittelbar belegter Optimierungsfehler

`m_core_entscheidung.bestesPaar` bewertet Handelsaufträge mit `menge × (Zielpreis − Quellpreis) − Quellgebühr − Zielgebühr`; mit Engpassbonus und `gewinn/flugzeit` wird die Rangfolge bestimmt. **Die tatsächlichen Originalbetriebskosten von 250 ISK/60 Frachterarbeitsminuten sind im Auswahl-Gewinn nicht enthalten**, ebenso wenig der mögliche anschließende Leerflug oder ein kaufmännischer Ersatzkapitalanteil. `m_core_stunde.betriebskosten` belastet später die tatsächlichen Besitzerkassen, jedoch bislang ohne unmittelbar für jeden Start gesichertes Lohnbudget. Für das aktuelle Modell sind diese Bewertungsebenen daher materiell verschieden.

**Für die Zukunft:** Keine automatische Abschöpfung einer individuellen Insolvenz, keine kostenlos hinzugefügte Nachfrage oder Hülle; zunächst nur prüfen, ob reale Frachter zu wenig verdienen, weil die Auswahlkosten unvollständig sind.

## 2. Alle regelkonfigurierten Stations-/Warenmärkte im Zeitverlauf

**[TEST] [GitHub Actions #41347554183](https://github.com/tobiasfranziskus/Check/actions/runs/41347554183)** – letzter Ausführungsstand dieses Codes; getrennte Teilprogramme `tools/bk9k-warenrouten-vollkosten-13x90.mjs` und `tools/bk9k-original-abfluege-vollkosten-3d.mjs` erfolgreich. 13 feste Spielerminer-Krisenseeds `1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535` ×90 originale Spieltage, täglich 13×90 = **1.170 Core-Geld-/Warenaudits**, an neun festen Tagen `0,1,2,4,7,14,30,60,90` 117 Markt-Snapshots mit **104 Save-/Load-Hashprüfungen** nach Spielbeginn.

Pro Snapshot werden exakt **274 gerichtete Stations-Waren-Kombinationen** geprüft, wenn beide Originalstationen dieselbe Ware handeln dürfen. Das ergibt **32.058 marktkonfigurierte Angebots-Momentaufnahmen** (nicht 32.058 unabhängige tatsächlich realisierte Fahrten).

| Kriterium | Anzahl Angebots-Snapshots |
| --- | ---: |
| Konfiguriert, Originalpreis berechenbar | **32.058** |
| Positiver Spot-Handelsgewinn nach Quell-/Zielgebühren und tatsächlich kauf-/verkaufbarer Menge | **8.092** |
| Gewinn auch nach **einem** konservativ aufgerundeten Original-Frachterfluglohn | **2.921** |
| Gewinn auch nach **Hin- plus identischer möglicher Rückflug-Lohnreserve** | **1.406** |
| Zusätzlich positiver Saldo mit **39 ISK** hypothetischem Hüllenersatzanteil | **1.124** |
| Robust bei 20 / 40 / 80 hypothetischen Fahrten bis Ersatz | **1.124 / 1.203 / 1.294** |
| Positiver Handel nach hin- und rückläufigem Lohn auf vollständig sicherer Strecke | **143** |
| Von 8.092 ursprünglich positiven Spotgeschäften durch den **ersten** Fahrtlohn bereits unprofitabel | **5.171** |
| Positiv nach vollständiger 20-Fahrten-Rücklage **und** am Quellort passender leerer, gesamtfinanzierter NPC1-/NPC2-Frachter | **0** |
| Positiv nach zusätzlich realer NPC-Frachter-Umpositionierung inklusive ihrer Kosten/Reserve | **0** |

Die Kalkulation verwendet originale Spotpreise, `verkaufbar` und `aufnehmbar`, Käuferkassen, beide Handelsgebühren, originalen Wegfinder und reale NPC-Kassen. Frachtkapazität ist auf 100 begrenzt. **Konservativ:** Arbeit für jede mögliche Hin-/Rückfahrt wird als `ceil(zeit × 250/60)` gesperrt, nicht mit tatsächlicher Stundenabrechnungs-Teilsumme verwechselt. Ersatzpreis **780 ISK am Spielstart** (Original-Werftpreis inklusive Gebühr); `780/20=39` ISK je Umlauf ist **ausschließlich eine Sensitivitätsannahme**. Ein vollständig sicherer Pfad erfordert alle durchflogenen Systeme in der Originalkarte als `sicher`.

**[GRENZE]** Die ursprüngliche Ware wird in dieser ersten Analyse **nicht wirklich gekauft/geliefert**. Mengen, Käuferkapital, Preise und Sicherheit können sich bis zur späteren Ankunft verändern; ein rechnerisch rentabler Snapshot bedeutet weder Garantie noch schon abgeschlossene Lieferung. Zudem ist der spätere tatsächliche Verkaufspreis nicht vertraglich garantiert und Hüllenersatz über 20/40/80 Fahrten keine genehmigte Spielmechanik.

### Zwei konkrete Originalmarkt-Beispiele

- **[POSITIVER ZEITPUNKT]** Seed2, Tag1: **Veldra → Cyris / Material**, 83 lieferbare Material zu aktuell 23→49 ISK, Spot-Bruttomarge nach originalen Handelsgebühren **1.920 ISK**. Abzüglich konservativer Originalfahrt 105 ISK pro Leg (Hin- und Rückflug) und 39 ISK hypothetischer Ersatzanteil verblieben **1.671 ISK** als maximaler Überschuss bei stabilen Verkaufspreisen. Im geprüften Moment aber **0 am Quellort verfügbare/fundierte NPC-Frachter**. Das ist ein überprüfenswertes Marktfenster, **noch kein realer Transportbeleg**.
- **[RISIKO-OPTION]** Seed2, Tag1: Dravos → Cyris / Material, 83 lieferbare Material 22→49 ISK, kalkulatorischer Überschuss 1.591 ISK nach 188 ISK je Richtung und 39 ISK hypothetischem Ersatz. Route über gefährliches Gebiet; tatsächliche Kampf-/Versicherungskosten nicht eingerechnet. Deshalb nicht automatisch als erste sichere Produktstrecke empfehlen.
- **[NEGATIVER KRISENBEFUND]** Am Spieltag90 besitzen alle 13 geprüften Spielerkrisenwelten **0 NPC1-/NPC2-Frachter**. Das fehlende aktive Handelskapital ist mit dem positiven Preisfenster allein nicht zu heilen.

## 3. Zweiter, unabhängiger Test: Wofür fahren Original-NPCs *wirklich* los?

`tools/bk9k-original-abfluege-vollkosten-3d.mjs` lässt 13 echte Originalwelten ×3 vollständige Tage laufen und beobachtet tatsächliche automatische Starts aus gedocktem Zustand (kein Anlegen von Hüllen, kein Eingriff in `entscheidung` oder `handel`). **120 originale Abflüge** wurden erfasst:

| Ausgeführt oder prognostiziert | Tatsächliche frühe Abflüge |
| --- | ---: |
| Neue Fracht wirklich beim Original-Quellhandel eingekauft und Abflug | **92** |
| Weitere Abflüge mit bereits früher an Bord befindlicher Ware | **28** |
| Abflug mit neuer Fracht, positive Spot-Bruttomarge | **92** |
| Mit neuer Fracht, bei gleichen Anfangs-Spotpreisen positive prognostizierte vollständige Lohn-/Ersatzmarge | **52** |
| Mit neuer Fracht, **positive KI-Bruttomarge, aber negative prognostizierte volle Hin-/Rückfahrtkosten inklusive 39 ISK Ersatzanteil** | **40** |

**[BEISPIEL SEED7]** Bereits Spielminute 10 startet der ursprüngliche NPC1-Frachter `sh015` von Cyris nach Aldera mit zwei Warenstücken. Quell- und Zielpreise zeigen zwar +49 ISK Brutto nach Gebühren, doch der Original-Fluglohn für **eine** Strecke ist konservativ 105 ISK; die Hinreise allein wäre somit rechnerisch −56 ISK, ein vollständiger identischer Rückumlauf mit Ersatzanteil −200 ISK. Die Warenladung wurde tatsächlich im Original-Core gekauft und die reale Reise begonnen, aber die spätere **realisierte** Gesamtmarge (eventuell andere Preise, Verlust/Weiterfahrt) wird hier **nicht** als abschließend gemessen.

Ebenfalls echte Abflugminute 1 Seed7: `sh014` Aldera→Meridian mit 20 Einheiten, +400 ISK Spotbrutto; konservativ 230 ISK Hinflug plus 230 ISK Rückflug plus 39 ISK Kapitalanteil ergeben **−99 ISK**, obwohl die ursprüngliche KI-Rangfolge diese Fahrt wegen positiver Gebührenmarge zulässt. Andere Starts sind durchaus positiv: Die Bilanz der 92 Neuverträge enthält **52 prognostisch positive** komplette Umläufe. Der Befund ist **kein** Argument, alle Frachteraktivität pauschal abzuschalten.

## 4. Architekturentscheidung: nächstes kleines Gate statt neuer Geldmechanik

**[OPTION B-K9l]** Eine minimal-invasive, **nur für die betroffene Entscheidung** geltende Testvariante von `bestesPaar` prüfen: positive Handelsmarge ist erst zulässig, wenn sowohl **echt finanzierbarer Quellkauf** als auch vorab ausreichende operative Hin-/Rückflug-ISK und eine konservative Hüllenersatz-Sensitivität bestehen. **Fahrt ohne vorgefundene profitable Ware** zunächst nicht kostenlos als Zufalls-Leerflug ermöglichen; gegebenenfalls ausdrücklich verifizierte Finanzierung/Nachfrage abseits der reinen Handelssuche. Keine zweite Wirtschaftsberechnung: Quell-/Zielgebühr, Wegkosten und Liquidität müssen mit demselben Core berechnet werden. Der genaue Rückflug ist nicht immer identisch mit der nächsten echten Frachtfahrt: Die einfache Rückfahrtrechnung ist daher ein strenges **Vergleichsgate**, keine automatisch für das Produkt freizugebende Route.

**Messung danach erforderlich:** A/B-Vergleich derselben 13 Spielerkrisen-Seeds (mindestens 90 Tage), echte Originalgelderhaltung, unabhängige Versorgung und NPC-Ersatz-/Schiffsverluststatistik; ausdrücklich testen, ob eine Lohnsperre zwar Händler schützt, aber Versorgung komplett zusammenbricht. Wenn kein positiver Nettoeffekt, Experiment nicht integrieren. Ferner muss die fehlende tatsächlich bezahlte Endkundennachfrage getrennt gelöst werden: Die erfolgreiche Handelsauswahl allein schafft noch keine Kaufkraft oder zusätzlichen Wirtschaftskreislauf.

**[STATUS]** Keine neue Geldmodell-B-Emission, kein Sparlimit, keine kostenlose Insolvenzrettung. Der Draft wird zur eindeutigen Archivierung geschlossen. Nur `docs/ROADMAP.md` auf **main** ist die verbindliche Planung; dieses Dokument ist ein historisch nachvollziehbarer PR-Beleg, kein Ersatz dafür. Reale iPad-Safari-/NAS-Abnahme steht unverändert aus.
