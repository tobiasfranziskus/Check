# W5k – NPC-Eigenförderung ohne freiwillige House-Pause

**[DRAFT / ANALYSE] 05.11.2026 · [PR #190](https://github.com/tobiasfranziskus/Check/pull/190) auf W5j #188 · Regel26/Schema8 unverändert.**

## Fragestellung

In W5i ermöglichte ein freiwilliger `shipWait` für NPC3 zunächst House-Mining. In W5j erreichte NPC3 danach mit freiwilliger House-Minerpause 500 ISK aus seiner eigenen Leistung, wodurch der dritte Jäger gekauft werden konnte. **W5k prüft eine andere Reihenfolge ohne House-Pause:** NPC3 fördert zunächst autonom mit seinem bereits bezahlten Miner. Nach zwei physisch abgenommenen 50-Erz-Chargen betritt House den Aldera-Erzmarkt und fördert mit eigenem Miner. Das ist **kein** automatisch konfliktfrei wiederkehrender Konzernrat oder ein Nachweis kontinuierlicher Konkurrenz.

Die einzige Käuferkasse bleibt die bereits bestehende real vorfinanzierte Station; der Exporthändler kann sein zu 10 ISK/Stück gekauftes Erz erst nach echtem W3-Transport nach Nadir bezahlt weiterverkaufen. Der Regel26-Pipelinestopp ist auf 50 offene Erz begrenzt. W5k führt **keine** zweite Simulationsuhr, NPC-Finanzierungsregel, Preisanpassung, Mindestgeldkasse, Geldemission, Kaufgarantie oder zwangsgesteuerte Spielerpause ein.

## Nachzuweisende echte Zahlungskette

| Beleg | NPC3 nach gebuchten Zahlungen |
| --- | ---: |
| NPC3-Startkapital | 3.000 ISK |
| Eigentümerfinanzierter vorhandener NPC3-Miner | −600 ISK |
| Zwei real vorfinanzierte 50-Erz-Abbauaufträge | −200 ISK |
| Zwei Abnahmen von jeweils 50 Erz × 10 ISK | +1.000 ISK |
| Drei physische Jäger zu je 900 ISK | −2.700 ISK |
| **Rechnerisch verbliebene Kasse** | **500 ISK** |

Die abhängigen W3-Transport-, W4-Raffinerie-, Silizium-, Bauteil- und Jägerfertigungskosten sind **nicht** durch die NPC3-Kasse repräsentiert. Sie werden vom jeweiligen tatsächlich vorhandenen Eigentümerkonto bzw. echten Arbeits-Treuhandkonten bezahlt und getrennt auditiert. Die bisherigen 2.288 ISK Herstellerzahlungen pro Jäger gegen 900 ISK Verkaufserlös ergeben weiter **−1.388 ISK Herstellerdifferenz pro Hülle**. Auch ein technisch erfolgreicher dritter Verkauf ist keine Rentabilität oder langfristig tragfähige Kaufkraft.

## Testplan und Sicherheitsgates

- **Reale Aufträge:** Der NPC-Miner beginnt mit `auftrag=foerdern`; sein erstes und zweites 50-Erz-Los können nach echter Freigabe der 50er-W3-Pipeline verkauft werden, ohne dass W5k `shipMine` oder `shipWait` für NPC3 ausführt.
- **House-Freiheit:** House kauft seinen Aldera-Miner *erst danach*. Die Testfolge enthält keine House-Pausenbefehle, keinen Schenkungstransfer und keine stillen Entnahmen aus Spieler-Sparvermögen.
- **Konkurrenzgrenze:** In dieser Sequenz konkurrieren die Miner **nicht dauerhaft gleichzeitig um dieselbe offene Nachfrage**. Dass NPC3 nach Marktbeitritt von House weiter Einnahmen erzielt, wird damit nicht belegt.
- **Endliche Nachfrage:** Für die konkrete Folge sind 400 Erz in acht echten W3-Frachten nach Nadir vorgesehen, drei Jäger werden gebaut und zu je 900 ISK regulär gekauft. Nicht bezahlbare Anschlüsse müssen atomar zurückgewiesen werden.
- **Unabhängige Auditbeweise:** physische Ware = Anfang + Förderung + Produktion + Import − Verbrauch − Export; 33.000 ISK = Summe aller Konten, `minted=burned=0`; Firmenkassen einschließlich gebundener Arbeiterreserven gegen Einnahmen und Ausgaben; Pipeline höchstens 50 Erz; Exporthändlerbestand und Gegenkonto ausgeglichen.
- **Determinismus:** 13 feste Seeds × 90 Tage, tägliche Core-Audits, vollständiges Hash-Replay, Save/Load-Prüfung, manipulierte/inkompatible Saves abweisen.
- **Oberfläche:** nur lesende W5k-Anzeige; eigene IndexedDB `aphros-void-forschungswelt-w5k` und eigener CAS-gesicherter Slot `regel26-autonomer-npc-markteintritt-v1`; Backup vor Import/Neustart. Hauptspiel-DB und bisherige W5i/W5j-Slots bleiben unberührt.

## Entscheidungsgrenze

Das W5k-Ergebnis darf **nur** lauten: Zwei autonome NPC-Aufträge lassen sich **vor** House-Einstieg vergüten und können eine endliche dritte Jägeranschaffung aus existierendem Geld ermöglichen. Insbesondere darf nicht behauptet werden, dass House und NPC3 später gleichzeitig wiederkehrend verkaufen, dass insolvente NPC-Konzerne autonom nachfolgen, dass eine vierte Jägerhülle zahlbar ist oder dass die Werft nachhaltig kostendeckend wirtschaftet.

Der nächste sachliche Wirtschaftsschritt nach W5k ist deshalb eine **bezahlte fortgesetzte Konkurrenzentscheidung unter tatsächlich gemeinsamem Nachfragebudget** mit Stopps bei Kaufkraftmangel; zusätzliche Geldmodell-B-Emissionen, neue Preise, Schenkungen, NPC-Pflichtförderung und künstlicher Absatz bleiben gesondert freigabepflichtig.

## Prüfstand – geprüfter CI-Abschluss · 05.11.2026

**[CI ERFOLGREICH]** [Workflow #41993648020](https://github.com/tobiasfranziskus/Check/actions/runs/41993648020), Prüf-Head `471dbec2`: **252/252 Node-Tests bestanden**, 0 Fehler, 0 Skips; sieben ausgeführte CI-Jobs grün, ein bedingter Sicherheitsvergleich planmäßig übersprungen. **13 Seeds × 90 Tage** mit täglichen unabhängigen Geld-/Warenaudits, Replay und Save/Load. Seed42: 2 echte autonome NPC3-Erzverkäufe, 7 bezahlte House-Erzverkäufe, 400 Erz per W3 transportiert, 3 Jäger gebaut und für je 900 ISK verkauft; NPC3 500 ISK, House 964 ISK, Nadir 2.940 ISK, `minted=0`; Hash nach Kauf `4213af92887fb457`, nach 90 Tagen `f239e7acf8259d63`. Der Herstellerbeitrag bleibt −1.388 ISK/Jäger, echter langfristiger NPC-Wiederanlauf nicht belegt.

Der historische erste PR-CI-Lauf erreichte das unveränderte 5-Minuten-Zeitlimit für das inzwischen größere Forschungs-Testpaket und wurde **abgebrochen, nicht als fehlgeschlagen gewertet**. Daher wurde auf diesem Draft ausschließlich das `test`-Job-Zeitlimit in `.github/workflows/ui-regression.yml` auf 15 Minuten erhöht; die 13×90-Gates und alle Tests blieben unangetastet.

Keine iPad-/NAS-/WebKit-Abnahme, kein Merge, kein Deployment. W5k ändert `index.html`, bestehenden W5i-/W5j-Core und Produkt-Saves nicht.
