# B-K11h – Echte Core-Einzelcharge mit Liefer-, Frachtverlust- und Wiederbuchungsprobe

**[ANALYSE/DRAFT, 03.11.2026]** Original-[main `b4e604d6`](https://github.com/tobiasfranziskus/Check/commit/b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c) bleibt **unverändert**: v0.12.5 / Regel14 / Schema8. Es wird **kein** zusätzliches Geld, keine autonome Haushaltsregel, kein Preis-/Lohnbeschluss, kein Save-Schema und keine UI-Änderung ins Produkt übernommen.

## Was neu ist – und was bereits historisch getestet wurde

[B-K10k, PR #128](https://github.com/tobiasfranziskus/Check/pull/128) hatte bereits einen **wirklichen** Lauf des isolierten, **nicht produktiven Regel15-/Schema9-Testkerns** mit Neu-Eisförderung, Original-Minerverkauf, FIFO-Nahrungschargen, 4-ISK/Minuten-Testfabriklohn, Original-Frachterflug, existierendem Vertrag zur Haushaltszahlung und vollständigem Geld-/Warenaudit. B-K11f [#144](https://github.com/tobiasfranziskus/Check/pull/144) hat darauf aufbauend **nur** ein separates Kassenmodell geprüft; B-K11g [#145](https://github.com/tobiasfranziskus/Check/pull/145) testete den momentanen Original-Markt-Preflight, ohne im Spiel einen Auftrag auszulösen.

**B-K11h verwendet den erprobten Original-B-K10k-Kern direkt erneut**, mit dessen Produktions- und Vertrags-Hooks. Dieser nicht integrierte Teststand ist **Regel 15 / Schema 9** mit verändertem Testspielstand und verhindert nicht die heutige Rule14/Schema8-Savekompatibilität. Wir fügen drei unabhängige neue Belege hinzu:

1. **[TEST] Reproduktion:** Für Seeds 42 und 7 den tatsächlichen 24er-Neuwaren-/Bezahl-/Verbrauchslauf mit bereits dokumentierten Original-Core-/R15-Testreferenzhashes nachfahren. Quelle und Miner müssen exakt die nachweisbaren real bezahlten Eis-/Arbeitswerte liefern; Kauf-, Flug- und Verbrauchsbuchungen werden mit dem Core-Audit auf jedem Original-Stundenabschluss geprüft. **Nadir erhält allerdings Fonds-Mindeststandsüberweisungen; das ist keine eigenständig rentable Produktionsstation.**
2. **[TEST] Unterwegs zerstörte Ladung:** Direkt nach dem **realen Original-ShipMove** nach Aldera vernichtet der Test deterministisch die tatsächlich im Schiff vorhandenen 24 neu produzierten Nahrungseinheiten. Dies ist **eine explizit erzwungene Testintervention und kein im Piratensystem selbständig ausgelöster Angriff**; das reale Material-/Herkunftsledger wird entsprechend abgebucht, die ursprünglichen Handels- und Flugkosten werden nicht erstattet. Der Käufer bekommt den **noch nicht verdienten** gesamten Reservierungsbetrag zurück, ohne eine falsche Endabnahme oder zivile Konsummenge zu verbuchen. Die Schiffshülle wird **nicht** zerstört oder kostenlos ersetzt. Der Verlustfall belegt somit das Vertrags-/Material-Gate, nicht die volle Kampf-/Schiffsersatzwirtschaft.
3. **[TEST] Tatsächliche Folge-Budgetbindung:** Anders als das isolierte B-K11f-Kontenmodell kann der reale R15-Test-Haushalt **zusätzliche Einkommen aus tatsächlich bezahlter Fabrikarbeit** verdienen. Nach dem ersten Originalgeschäft versuchen wir im *gespeicherten tatsächlichen Original-Core-Zustand*, ein zweites 24er-Haushaltsbudget zu reservieren und anschließend unbenutzt zu stornieren. Erfolg belegt **nur das Käuferbudget**, ausdrücklich **keinen zweiten produzierten, transportierten oder verbrauchten Warenauftrag**. Der ursprüngliche Fonds→Quellstations-Rückfluss ist gesondert zu protokollieren.

## Finanzierungsgrenze, Sicherheit und Prüfungen

Kein beliebiger Text-`leistung`-Beleg genügt, sondern nur ein tatsächlich erhaltener Ankunfts-/Verbrauchsvorgang gibt Reservierungs-ISK frei. Im Verlustarm darf die neue ware nicht über Endverbrauch erneut vergütet werden. Bei beschädigter oder fehlender Ladung wird bestehendes nicht verbrauchtes Endkunden-Guthaben zurückgegeben; real erbrachte Miner-/Herstellungs-/Frachtarbeit bleibt bezahlt. Die Geld-/Materialbilanz wird auch nach dem eigens erzwungenen Verlust abgeglichen; Save/Load und die bereits bekannten Hashes werden nachgeprüft. Es wird keine neue ISK geschöpft (bestehende Core-Kopfgelder/Senken sind davon unabhängig).

Der isolierte kontrollierte R15-Aufbau **setzt die historischen Nadir-Startlager Eis/Nahrung für die Kausalprobe auf null und isoliert konkurrierende autonome Händler**; nur so ist die FIFO-Herkunft vollständig nachweisbar. Dieser Fall ist bewusst **keine** normale Gesamtwirtschaft, keine belastbare NPC-Preis-/Risikodisposition, kein 13×90d-Test, keine adaptive externe Nachfrage und keine abgenommene Save-Migration. Die testweise Fabriklohnannahme 4 ISK/Minute ist **nicht beschlossen**. Keine pauschale Spieler-/NPC-Rettung, kein Sparlimit und kein Geldmodell-B-Zahlungsbetrag.

## Freigabegate nach B-K11h

Nur bei wirklich bestandenem Test auswerten, ob **einmaliger bezahlter Auftrag + Verlustkonsequenz + zweite echte Käuferbudgetbindung** im isolierten Core konsistent funktionieren. Für einen produktiven, wiederholbaren Wirtschaftskreislauf bleiben zwingend D2 (Lohn/Empfänger), D3 (globale persistente Material-/Geld-/Lagerclaims), D4/D5 (Transport- und Schiffsersatz-Vollkosten) und D6/H1 (dauerhaft zahlungsfähige Endnachfrage ohne individuelles Rettungssystem) offen. **Keine neue Preis-, Geld-, Save- oder Mechanikregel ohne gesonderte Nutzerfreigabe, kein Merge nach main und kein Deployment.**

## Tatsächliche CI-Ergebnisse

**[TEST] [B-K11h-CI #41633584760](https://github.com/tobiasfranziskus/Check/actions/runs/41633584760) auf Codecommit `374a25fe` erfolgreich:** 3/3 neue Tests; jeder testet Seeds 42 und 7. Der gesamte historische, unverändert aus [PR #128](https://github.com/tobiasfranziskus/Check/pull/128) extrahierte R15-Core-Quellabschnitt ist als **test-only Archiv-Fixpunkt** unter `tests/fixtures/bk11h-r15-core-snapshot.txt` abgelegt. Gepinnter SHA-256: `e5e2c5092fda778b38064dcda2692004889635639ff56dc5c0c61b2377dd7680`. **Die Fixture ist ausdrücklich keine neue Produktionsimplementierung** und darf nicht in `index.html` gelangen.

| Echt ausgeführte R15/Schema9-Simulation | Seed 42 | Seed 7 |
| --- | ---: | ---: |
| Erfolgreiche 24er-Endabnahme: Hash | `7f65cee9b1330747` | `f2f8983d53c26e3d` |
| Real bezahlter Eiseinkauf für zugeordnete FIFO-Charge | 1.056 ISK | 1.056 ISK |
| Bezahlter testweiser Fabriklohn, 24 Stück | 576 ISK | 576 ISK |
| Echte Flugkosten | 499 ISK | 499 ISK |
| Aus echtem Haushaltsvertragsrest bezahlt | 1.296 ISK | 1.296 ISK |
| Quellstations-Beitrag vor sonstigen Risiken | **−1.032 ISK** | **−1.032 ISK** |
| Konsolidierter Beitrag vor Hülle | **+29 ISK** | **+29 ISK** |
| Reale Nadir-Fonds-Mindeststandsumme im ganzen Lauf | **5.135 ISK** | **5.259 ISK** |
| Während echtem Flug kontrolliert zerstörte Neuware | 24 | 24 |
| Verlustfall: deterministischer Core-State-Hash | `7f628068dedb1aea` | `b84997113b084206` |
| Verlustfall: unverdiente Vertrags-ISK erstattet | **1.296 ISK** | **1.296 ISK** |
| Verlustfall: zivil tatsächlich geliefert | **0** | **0** |
| Verlustfall: Händler-Kassenänderung | **−1.123 ISK** | **−1.123 ISK** |
| Tatsächliche Haushaltskasse nach erfolgreicher Lieferung | **1.972 ISK** | **2.252 ISK** |
| Zweites **nur reserviertes**, anschließend storniertes Käuferbudget | **1.296 ISK** | **1.296 ISK** |

**Warum B-K11f damit präzisiert werden muss:** Der Endkunde wird im echten R15-Testkern durch *fortlaufend bezahlte* Fabrikarbeit mit Einkommen versorgt; im isolierten B-K11f-Kontoreplay war sein Anfangsbudget absichtlich auf exakt 1.296 ISK beschränkt. Aus diesem formalen Null-Endstand darf man **keine generelle Zahlungsunfähigkeit nach einer echten Lieferung** ableiten. Umgekehrt entstehen die bisherigen Fabriklöhne nicht aus dauerhaft rentabler Quellproduktion: Nadir erhält in derselben kontrollierten Laufzeit **5.135/5.259 ISK echte regionale Fondsüberweisungen**, während die einzelne 24er-Charge bei Nadir rechnerisch −1.032 ISK beiträgt. Das Budget für **einen zweiten Endkundenauftrag** ist belegt; **ein zweiter wirklicher Herstellungs-/Transport-/Verbrauchszyklus** und dessen kontinuierliche Deckung bleiben unbewiesen.

**Kausalgrenze des Verlustfalls:** Die Testintervention zerstört die echten physischen neu produzierten Güter **auf einer normalen Core-Schiffsreise**, aber sie ist kein natürlich entstandener Piratenangriff und vernichtet **keine Schiffshülle**. Insbesondere sind damit weder Piratenkosten noch eine reale 780-ISK-Hüllenersatzbeschaffung oder Schiffskapitaldeckung belegt. Die im Originalledger als Verbrauch gebuchte Frachtvernichtung ist **kein ziviler Konsum** und darf niemals zusätzliche Endverbrauchserlöse auslösen.

**Abnahmegrenze:** Der vom Test verwendete R15-Quellkern liegt nur als historische Fixture vor; `main b4e604d6` läuft weiter auf Regel14/Schema8. 13 Seeds ×90 Tage, echte Save-Migration, NPC-Marktnachfolge sowie iPad-/NAS-Abnahme wurden **nicht** durchgeführt. Die separaten Standard-Regressionen für den neuen PR werden unabhängig geprüft.
