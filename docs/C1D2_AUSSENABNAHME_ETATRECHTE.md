# C1d-2 – einmalige Meridian-Abnahme mit begrenzten Forschungsrechten

**[DRAFT / ANALYSE · 08.11.2026]** Stack auf [C1d-1 / PR #254](https://github.com/tobiasfranziskus/Check/pull/254), das ein wirklich gebautes Lagermodul mit voll finanziertem 240-Minuten-Frachtrückweg nach Meridian bringt. Die **einmalige Außenabnahme** in C1d-2 ist ausschließlich ein isoliertes Forschungsprofil und **keine** Freigabe einer Emissionsregel, eines Außenhandelsgebiets oder eines Produkt-Releases.

Die allgemeine Emissionsidee Geldmodell B (nur begrenzte, belegte neue ISK gegen echte Leistung) ist im Projekt beschlossen. Dagegen sind die **konkreten** Werte des vorgeschlagenen [Modell C, PR #245](https://github.com/tobiasfranziskus/Check/pull/245) – 400 ISK/Tag, max. 12.000/30 Tage, 146.000/365 Tage, höchstens 30 Tage Etatvortrag, 430 ISK/Lagermodul – **[OPTION]**, nicht beschlossen.

## Durchgängiger realer Waren- und Geldbeleg

| Ereignis | Messwert / Bedingung |
| --- | --- |
| Bezahlte Produktion | 10 echtes Erz → 4 Material; 2 Silizium aus 20 bezahlten Förderminuten; 2 Bauteile aus 16 bezahlten Fabrikminuten; 1 Lagermodul aus 12 bezahlten Minuten |
| Vorfinanzierte Fracht | Reales Schiff `sh002`, 60 Min. Positionierung, 60 Min. beladene Strecke nach Meridian, 120 Min. bezahlte Rückfahrt; 300 ISK vom Hersteller und 240 ISK Pilotlohn aus Speditionskapital |
| Ware eingetroffen | Tick 420, echtes Lagermodul im Meridian-Stationslager; **noch kein Verkauf und keine Emission** |
| Frachter zurück | Tick 540, vorfinanzierter Rückflug abgeschlossen, Spediteur erhielt die 300 ISK Fracht |
| Forschungsetat an Tag 0 | Maximal 400 verfügbare **Rechte**, aber Kaufpreis 430: Core verweigert Abnahmereservierung, Zustand und Hash unverändert |
| Forschungsetat an Tag 1 | 800 Rechte verfügbar (400 vom Vortag + 400 des zweiten Tags, sofern ungenutzt); `stationExportReserve` reserviert **430 nichtmonetäre Rechte**, kein ISK-Transfer |
| Echte externe Abnahme | `stationExportAccept` akzeptiert **genau ein** geliefertes Lagermodul; Meridian-Lager −1, `ledger.lager.exported` +1, `s.minted` und Herstellerkasse **einmalig +430** |
| Nach Abnahme | Weltgeld 33.430 ISK statt 33.000, kein Burn, `w5q.minted=0`, 370 nicht eingelöste Etatrechte aus den 800; Doppelauftrag und Doppelauszahlung gesperrt |

**[ANALYSE]** Dieser Nachweis ist die *erste externe Abnahme*, aber noch nicht der *erste wiederkehrende geschlossene Geldkreislauf*. Weder die Kassenentwicklung aller Produzenten noch ein 30-/90-Tage-Weltbetrieb wurde dadurch wirtschaftlich nachgewiesen.

## Technischer Ausführungspfad und Eigentumsprüfung

1. Neue Forschungsregel **3307**, Profil `aphros-research:C1d-2:once-only-bounded-acceptance-v1` mit eigenem Save-/Regel-Fingerprint. Alte Forschungsprofile 3301–3306 und produktive Regel14-Saves werden nicht migriert oder still geändert.
2. Der gemeinsame Original-Core führt `stationExportReserve` und `stationExportAccept` aus. Ohne Forschungs-Opt-in sind beide Befehle verboten. Der externe Kauf kann nicht aus einer Produktionszahl ohne vorhandene, physisch gelieferte Ware erzeugt werden.
3. Der Reservierungsvorgang schreibt **nur** ein eindeutiges Vertragsrecht `C1D2-0001`; weder Geldkasse noch Warenledger ändern sich dabei. Die Berechtigung prüft echte Ware, vollständige Rückfahrt, Hersteller, Herkunft, offenen Einmalbeleg, Datum und angesparte globale Forschungsrechte.
4. Erst die Abnahme nimmt die Ware vom Stationslager und erhöht `ledger.lager.exported`. Exakt derselbe atomare Original-Core-Befehl schreibt die neu erzeugten ISK direkt dem Eigentümer `house` gut, dokumentiert eine Erlösbuchung und speichert die einmalige Abnahme in einem überprüfbaren `events`-Beleg. Wiederholung wird schon bei Befehlsvalidierung abgelehnt.
5. Das unabhängige Forschungs-Audit prüft Etatrechte, Preise, Vertrags-ID, Exportmenge, Ereignis, Geldsumme und Warenbestände. Original-Core-Audits von W5b, C1d und W5q erlauben die **zusätzliche** Emission nur in Verbindung mit dem neuen opt-in-Forschungsbuch. Bei älteren Profilen gilt unverändert die bisherige Geldregel.
6. **Kein automatisches Minting per Tick:** Zeitablauf allein erzeugt nur potenziell verfügbare, nichtmonetäre Berechtigungen. Ohne wirklich geliefertes Produkt bleibt `s.minted=0` auch nach Eintritt von Tag 1.

## Getesteter Stand und Grenzen

**Direkte Ausführung im privaten JavaScript-Core-Prüfverfahren dieser Arbeitssitzung:** Alle **6 neuen Tests** liefen erfolgreich, einschließlich Seed 42 und Seed 7, abgelehnter Tag-0-Reservierung, positiver Tag-1-Abnahme, Save/Load, deterministischem Replay, manipulierter Rechte/Kassen/Lieferung, gesperrter zweiter Auszahlung und fehlender Produktion. Das Verfahren verwendet exakt den aus dem Branch geladenen Core, aber einen lokalen Prüf-Harness anstelle der später erforderlichen GitHub-Node-/CI-Läufe; dieser Unterschied ist wichtig.

**Offizielle Node-/GitHub-CI:** [PR #255 Checks](https://github.com/tobiasfranziskus/Check/pull/255/checks). Bei Berichtserstellung noch **nicht abgeschlossen**; keine allgemeine oder produktive Freigabe, keine Aussage über reale iPad-/NAS-Kompatibilität.

**Explizite Grenzen dieses Einmalnachweises:**

- Die Abnahme **reserviert erst nach Lieferung und bezahltem Rückflug**, finanziert die Produktion also **nicht vor**. Langfristig muss echte externe Nachfrage wiederholbare Voraufträge, bereits vorfinanzierbare Investitionen und Mengenrechte ermöglichen.
- Der Etat ist ein **einzelner** einmaliger Vertrag. Es gibt noch **keine** vollwertige, gegen konkurrierende Anbieter und über 30/365 Spieltage mit mehreren offenen Verträgen geprüfte globale Reservierungs- und Verfallsbuchhaltung. Auch die Einmalreservation darf nicht als produktive Endlösung für länger ausbleibende Abnahmen verwendet werden. Eine **regelkonforme Vertragsfreigabe bei Ablauf des 30-Tage-Vortrags** sowie wiederkehrende Aufträge sind noch nicht vollständig implementiert.
- **C-Erzförderung ist noch offen:** Der Upstream-Nachweis nutzt weiterhin die bisherige R32-Erz-Fördergeschwindigkeit statt vier bezahlter Minuten je C-Erzeinheit; eine End-to-End-Modell-C-Welt ist dies damit nicht.
- Das einzelne 430-ISK-Lagermodul ist bei **300 ISK Einzel-Frachtrechnung** nicht automatisch profitabel. Bereits zwei Bauteile zum angesetzten Zwischenpreis kosten 340 ISK, zwölf Fertigungsminuten 12 ISK und die einzelne Meridian-Fracht 300 ISK. **652 ISK** an dieser letzten Stufe liegen **222 ISK über dem Außenverkaufspreis**, bevor vorgelagerte Produktionskosten, Wartung und Schiffskapital berücksichtigt sind. Beim unveränderten 300-ISK-Preis pro Frachtfahrt, 430 ISK Erlös und 352 ISK aus Bauteilen + Endmontage je Lager müssten **mindestens vier Lager pro wirklich bezahlter Frachtfahrt** transportiert werden, um allein diese drei Positionen zu decken: 4 × (430 − 340 − 12) − 300 = 12 ISK. Das ist **noch kein Vollkostengewinn**. Ein wirtschaftlich möglicher nächster Weg ist echte gebündelte Mehrstückfracht, nicht ein künstlicher Exportzuschuss.
- Die privaten Wasserkunden erhalten die in C1d-1 gebuchten neuen Pilotenlöhne noch nicht unmittelbar. Der allgemeine Lohn-/Eigentümerkaufkraftkreislauf, weitere Waren und echtes Ersetzen/Warten bleiben offen.

**Vorgeschlagener nächster Schritt [OPTION]:** Volle Eigentümer-/Kostenrechnung dieser einzelnen Exportcharge und dann ein *echtes* wiederholbares externes Vorauftrags- und Mengenlos mit bezahlter Mehrstückproduktion/Fracht. Deren Nachfrage-/Preis-/Finanzierungsregeln separat prüfen, bevor irgendeine Abnahme als nachhaltig oder produktreif gilt.

**Kein Merge, kein Deployment, keine Änderungen an `main`, GitHub Pages oder produktiven Spielständen.**
