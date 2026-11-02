# B-K10o – Bezahlter Schiffsersatz, Fondsrettung und Kapitalgrenze

**[ANALYSE/DRAFT · 02.11.2026]** [PR #132](https://github.com/tobiasfranziskus/Check/pull/132), auf #131 → #130 → #129 → #128 → #127 → #126 → #124 → #123 → #108 gestapelt. **[MAIN]** b4e604d6 / v0.12.5 / Regel14 / Schema8 unverändert. R15 / Schema9 bleibt ein **nicht integrierter Wirtschaftskandidat**. Nur neues Testfile, Bericht und Projektstatus; keine Änderung an index.html, Preisen, Löhnen, Fonds, Produktions-/Schiffsmechanik, Emission, Saves oder UI. Kein Merge.

## Auftrag und Originalmechanismus

Vor einer Entscheidung über eine einheitlich finanzierte Waren-/Leistungskette prüfen wir die **wirklichen Wiederbeschaffungspreise der Schiffe und die vorhandene NPC-Rettung**. In [MAIN] existiert die Funktion m_core_schiffbau.zuschuss: Wenn ein NPC **keines** seiner eigenen Schiffe mehr hat und seine Kasse unter dem originalen Werft-Ersatzpreis liegt, kann der fehlende Betrag aus dem Werft-Systemfonds an genau diesen NPC übertragen werden, falls genügend Fonds-ISK vorhanden sind. **Keine Geldschöpfung**, aber eine **individuelle Flottenrettung** im Gegensatz zum beschlossenen Ziel, einzelne NPCs scheitern lassen zu können. Ob diese Regel tatsächlich die Versorgung schützt, lässt sich nicht aus ihrer bloßen Existenz ableiten.

## Messung und Tests

Die [ausführbare Prüfung](../tests/bk10o-schiffersatz-fonds-vollkosten.test.mjs) instrumentiert in einer **nur im Test evaluierten Kopie** des Original-R15-Cores drei Buchungsstellen: Originalwerft-Ersatzkäufe samt aktuellem Marktpreis und wirklich bezahlten Gebühren, einzelne tatsächlich ausgezahlte Fonds-Ersatztransfers, sowie einen einzigen booleschen Testschalter, der nur die gezielte Flottenrettung unterdrückt. Sonstige aktive NPC-/Spieler-Frachter, Miner, Piraten/Jäger, Haushalte, Produktionslinien, allgemeine Fondsüberweisungen, Preise, Waren und Geldkonten bleiben unverändert. Täglich unabhängiger ISK-Audit einschließlich Vertragsescrow, vollständiger Waren-Audit, Original-Core-Audit, Save/Load und Hash; Flotten, Fonds und Werftbestände werden beobachtet.

### A. 13 autonome Normalwelten × 72 Stunden

Bei Seeds 1, 2, 7, 11, 13, 17, 42, 99, 1234, 2026, 65535, 98765 und 314159 wurden **160 echte bezahlte NPC-Werftkäufe** über die **13 voneinander unabhängigen Welten** protokolliert; dabei **0** individuelle Fonds-Ersatz-Überweisungen. Diese 160 Käufe sind keine einzigen 160 Schiffe in einer gemeinsamen Welt. Die Messung erlaubt noch keinen Schluss über seltene spätere Rettungen.

### B. Zwei natürliche Krisenpaare × 14 Tage

Seed42 und Seed7 wurden jeweils über **14 Spieltage zweimal vom gleichen Originalanfang** mit und ohne gezielte Rettung durchgerechnet. Die **Endzustands-Hashes und alle Endverbrauchs-/Versorgungs-/Kassenbelege sind exakt gleich**, weil in keinem dieser vier Läufe eine solche Rettung nötig bzw. erfolgreich ausgeführt wurde.

| Reale Normalwelt nach 14 Tagen | Seed42 | Seed7 |
|---|---:|---:|
| Individuelle Rettungszahlungen mit/ohne Regel | **0 / 0 ISK** | **0 / 0 ISK** |
| Bezahlt erworbene Ersatzschiffe je Originallauf | **25** | **14** |
| Verbliebene NPC1-/NPC2-/NPC3-Schiffe | **1 / 0 / 8** | **2 / 2 / 9** |
| NPC1-/NPC2-Kasse | 90 / 2.792 ISK | 63 / 67 ISK |
| Fertige Werftfrachter / Miner | **0 / 0** | **1 / 0** |
| Original- vs. testseitig unterdrückte Rettung: End-Hash | **identisch** | **identisch** |

**Ursachen strikt trennen:** Seed42 NPC2 ist mit 0 verbliebenen Frachtern ausgefallen, hat aber noch 2.792 ISK Eigentümerkasse. Der Grund, dass kein fertiges Schiff gekauft wird, ist zum Messzeitpunkt **fehlender Werftbestand**, nicht eine individuell rettbare Eigentümerkassenlücke. In Seed7 existieren je zwei Frachter bei NPC1 und NPC2; mit 63/67 ISK Eigentümerkassen fehlt Kaufkraft, aber die *nur bei komplett leerer Flotte* verfügbare individuelle Rettung ist definitionsgemäß nicht erreichbar. Das bloße Löschen dieser vorhandenen Rettungsregel behebt somit keinen dieser beobachteten Engpässe.

### C. Synthetischer, bilanzerhaltender Leerflotten-Stresstest

**[ANALYSE-FIXTURE, KEINE NORMALE WELT]** In einem ursprünglichen Seed42-Testzustand werden ausschließlich die zwei leer und vertragslos vorhandenen NPC2-Anfangsfrachter entfernt. NPC2s ursprüngliche 3.000 ISK werden explizit vom NPC2-Konto zum existierenden Spielerkonto **übertragen**, nicht vernichtet oder neu erzeugt. Der vorhandene Werftfonds hat ursprünglich 1.000 ISK; ein fertiger Frachter liegt real auf Lager.

Im R15-Original-Zuschusszweig gehen bei **Tick60 genau 780 ISK aus dem Werftfonds an NPC2**, der Originalmarkt verkauft NPC2 anschließend **ein Schiff für 750 ISK + 30 ISK Kaufgebühr**. Mit Rettung existiert am ersten Stundenende **ein neuer NPC2-Frachter**, ohne Rettung **kein** Schiff und keine Zuschusszahlung. **Am Ende des Tages existiert in beiden Fällen kein NPC2-Frachter mehr.** Das demonstriert die reale Erreichbarkeit des Zuschusszweigs und einen echten Schiffkauf, **aber keine dauerhaft wirksame wirtschaftliche Sanierung**. Warum das neue Schiff im weiteren Verlauf verschwindet, bleibt in diesem isolierten Test ungeklärt; daraus folgt keine allgemeine Lebensdauer.

## Tatsächliche Schiffskapitalpreise und 24er-Nahrungsbeispiel

| Beobachtung im originalen Markt | Marktpreis | Gebühr | Gesamtkaufpreis |
|---|---:|---:|---:|
| Frachter zu Beginn Seed42 | 750 ISK | 30 ISK | **780 ISK** |
| Miner zu Beginn Seed42 | 600 ISK | 24 ISK | **624 ISK** |
| Frachter bei späterem realem Seed42-Ersatzkauf | 1.050 ISK | 42 ISK | **1.092 ISK** |
| Miner bei späterem realem Seed42-Ersatzkauf | 840 ISK | 33 ISK | **873 ISK** |

Der ursprüngliche 24er-Nahrungs-Endkundenversuch B-K10k (kein produktiv eingeführtes Direktkaufmodell) brachte **1.296 ISK echten Haushaltsendumsatz**. Tatsächlich bezahlte, diesem Vorgang zugeordnete Betriebskosten: 120 ISK anteilige Minerarbeit für 48 Eiseinheiten, 576 ISK Fabriklohn, 499 ISK Originalflugkosten, 72 ISK Quell-/Zielgebühren. **+29 ISK** bleiben vor **Frachter-/Miner-Ersatz**, weiteren Kapital- und Sicherheitskosten sowie anderen wirtschaftlichen Risiken.

Rechnerische Untergrenze, **nur** unter der unrealistischen Annahme gleichbleibender +29 ISK bei jeder zukünftigen 24er-Lieferung:

| Kapitalfinanzierung | Benötigte Kapital-ISK | 24er-Lasten bei unverändert +29 ISK |
|---|---:|---:|
| Ein Frachter zu ursprünglichem Marktpreis | 780 | **27** |
| Frachter + Miner zu ursprünglichen Preisen | 1.404 | **49** |
| Frachter + Miner zu den später tatsächlich gezahlten Marktpreisen | 1.965 | **68** |

Diese **27/49/68** sind bloße rechnerische Quotienten **ohne nachgewiesene Lebensdauer**. Schiffe müssen nicht gleichzeitig ersetzt werden; ihre Arbeit kann viele Routen/Kunden umfassen. Die Margen, Nachfrage, Piratenverluste und Werftpreise verändern sich. Eine feste pro-Last-Reserve oder ein gewinnbringender Vollkreislauf **wird hieraus nicht abgeleitet**.

## Entscheidungen und nächstes Gate

**[BELEGT]** Wirkliche Werftschiffe werden bezahlt, und gezielte Fondsrettung existiert, war in den ausgewählten natürlichen Krisen aber wirkungslos. Ein Firmenkonto mit genügend ISK nützt bei **fehlenden Schiffen** auf dem Werftmarkt allein nichts. Ein realer finanzieller Endverbrauch muss deshalb Geld **und** dauerhaft produzierbare Schiffe mit echtem Ressourceneinsatz finanzieren.

**[BESCHLOSSENE LEITPLANKEN]** NPCs dürfen scheitern; andere Akteure sollen Aufgaben übernehmen können, ohne individuelle Insolvenzzuschüsse. Spieler darf unbegrenzt sparen. Keine ungenehmigten ISK-Emissionen, keine gratis hergestellten Schiffe, keine parallele Spieler-Sonderwirtschaft.

**[OPTION – nächstes Gate B-K10p]** Längere Normalmarkt- und Spielerkrisen mit echter Werftproduktion, Schiffskapital-Lebensdauer, finanzierter Auftragserfüllung und **tatsächlicher Aufgabenübernahme durch andere Akteure** gemeinsam prüfen. Nur dann eine allgemeine vorfinanzierte Beschaffungs-/Endverbrauchsregel für Spieler und NPC als gesonderten Beschluss vorbereiten. **Keine direkte Reform der Preise, Schiffsrücklagen, Fonds, NPC-Rettungen oder Emissionen.**

**[TESTSTATUS – DIREKT BESTANDEN]** Vier neue B-K10o-Prüfungen tatsächlich direkt ausgeführt: 13×72h Originalwelt, zwei ×14-Tage Original-/Gegenproben, synthetisches fonds-/warenbilanzierendes Leerflottenszenario, echte Werft- und rechnerische Kapitalgrenzen. **Vollständiger GitHub-CI-Erfolg ist noch getrennt nachzuweisen**; keine 13×90d-Gesamtwirtschaft oder reale iPad-/NAS-Abnahme.
