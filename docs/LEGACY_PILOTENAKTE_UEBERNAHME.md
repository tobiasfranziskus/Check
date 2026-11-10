# Legacy-Pilotenakte: lesender UI-Prototyp

**[DRAFT/ANALYSE] 05.11.2026.** Eigenständiger Branch `feat/legacy-pilotenakte` auf geprüftem `main` [`b4e604d6`](https://github.com/tobiasfranziskus/Check/commit/b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c). Keine Produktintegration, Regel-/Schemaänderung oder Veröffentlichung. Hauptspiel und Forschungswelt bleiben unverändert.

## Start und Umfang

`prototypes/legacy-pilot/index.html` direkt öffnen oder das Repository statisch per HTTP ausliefern und `/prototypes/legacy-pilot/` öffnen. HTML/CSS/Vanilla JavaScript, klassische lokale Skripte, kein Build, CDN oder Laufzeitpaket. Das Auswahlfeld wechselt zwischen vier **ausdrücklich fiktiven** Beispielakten: Spielerpilot, NPC-Miner, NPC-Frachter und NPC-Jäger. Zahlen, Fähigkeiten, Nachweise und Sperrgründe sind UI-Beispiele und kein vorgeschlagenes Balancing. Kein Netzwerk-, Speicher- oder Core-Zugriff.

Pilot, Rolle, Konzern, Einsatzschiff und dessen getrennt benannter Eigentümer; XP-Anzeige mit geliefertem Prozentwert, Skillpunkte; nach Bereichen und gelieferten Stufenbeschriftungen geordnete Karten; Detailansicht für alle drei Zustände; optionale belegte Leistungseinträge. Die Reihenfolge im Snapshot ist die Anzeigereihenfolge. Pfade implizieren keine Vorgänger-Abhängigkeit. Gesperrte Fähigkeiten sind zur Einsicht auswählbar, nicht aufwertbar. Auf schmalen Ansichten steht das Detail unter den Pfaden und ist per normalem Scrollen erreichbar.

## Quellen und übernommene Muster

Referenz ist ausschließlich Void Echoes, Commit [`a8e2e36`](https://github.com/tobiasfranziskus/void-echoes/commit/a8e2e36):

- [`290-ve08g-03-pilotansicht.js`](https://github.com/tobiasfranziskus/void-echoes/blob/a8e2e36/src/script/290-ve08g-03-pilotansicht.js): `tgNode`, `tgDetail`, `tgRender` liefern die Muster Pfadkarten, beschriftete Statusanzeigen, Auswahl mit `aria-pressed`, separate Detailfläche und vorhandene/benötigte Voraussetzung. Die historische Matrix T1–T5, S/M/L-Filter und Schiffs-/Modulkataloge werden nicht dupliziert. Hier stehen Fähigkeiten und frei übermittelte Stufenbeschriftungen im Mittelpunkt.
- [`130-ve07a-pilotenidentitaet.js`](https://github.com/tobiasfranziskus/void-echoes/blob/a8e2e36/src/script/130-ve07a-pilotenidentitaet.js): historisches Modell `profileId`, `techLevel`, `skillPoints`, `skills`, `bookmarks` ausschließlich als Referenz für die Trennung von Person und Welt. Keine Profil-ID-Zwangsbindung an Tobi/Uli; keine Migration oder Übernahme von Pilotendaten.
- [`200-ve07b-03-xp-zustellung.js`](https://github.com/tobiasfranziskus/void-echoes/blob/a8e2e36/src/script/200-ve07b-03-xp-zustellung.js): `pilotProgressView` und Fortschrittsanzeige als UI-Referenz, XP-Zustellung ausschließlich zur Abgrenzung. Das historische verrechnete XP-Konto ist ausdrücklich kein vollständiger Lebenszeit-/Leistungszähler. Keine erfundene Abschuss- oder Auftragshistorie daraus ableiten.

Neu ist der explizite Zustand „Noch nicht bewertbar“: fehlende Bewertung ist keine Freigabe. Historische `tgReq`, `tgState`, `treeSkillAccess`, `treePromote`, `pvBuy`, `pvGain` und ihre Berechnungen werden nicht übernommen. Kein Vergleich `have >= need` in der UI. Keine XP-pro-SP-Schwelle, SP-Kosten, Skillmaxima, Tier-Promotion, Skillwirkung oder Schadens-/Fracht-/Bergbauformel. Kein Kauf, Einbau, Freischalten, XP-Gutschreiben oder Navigieren in ausführbare Stationsaktionen.

Ebenfalls ausgeschlossen: NAS-Anmeldung, Profilpersistenz, lokaler Wiederherstellungspuffer, Sitzungen, Host/Gast- und Multiplayer-Ledger, XP-Acknowledgements, Forschungs-/Spielstandimporte und Save-Slots.

## W5f und parallele Arbeiten

Geprüft: [W5f PR #181](https://github.com/tobiasfranziskus/Check/pull/181), Branch `feature/w5f-piloten-kopfgeld-mk1-20261104`, insbesondere `docs/W5F_PILOTEN_KOPFGELD_LASER.md`. W5f ist ein isolierter Regel23/Schema8-Forschungsstand, kein Main-Modell. Der feste Pilot→Konzernschiff-Bezug, echte Abschussbeleg (+1 XP-Beleg), finanzierte Dienststunden, einmaliger gedeckter Kopfgeldtransfer und physischer MK1-Laser bleiben vollständig im vorhandenen autoritativen Core. Der XP-Beleg begründet keine neue Skillfreigabe. Persönlicher Modulbesitz ist nicht Hüllenbesitz. Keine W5f-Datei wird importiert oder geändert; auch dessen eigene IndexedDB/Slot bleiben unangetastet.

[Legacy-Fitting #186](https://github.com/tobiasfranziskus/Check/pull/186) und [Raumhafen #187](https://github.com/tobiasfranziskus/Check/pull/187) sind unabhängige Drafts auf derselben Main-Basis. Keine Imports oder Änderungen dort; keine Fitting-/Stationsaktionen in dieser Vorschau. W5j/W5k werden weder umgebaut noch vorausgesetzt. Wirtschafts-, Preis-, Lohn-, XP- und MK1-Parameter werden nicht kopiert. **NPC-Piloten besitzen keine eigenen Schiffe**; das Beispieldatenset zeigt getrennt den Konzern als Eigentümer. Spätere Eigentumsprüfung gehört zum Core.

## Lesende Schnittstelle

```js
const view = LegacyPilot.mount(root, snapshot);
view.update(nextSnapshot); // vollständiger Ersatz, kein Patch
view.destroy();           // idempotent; spätere Updates wirkungslos
```

`root` ist eine DOM-Wurzel. Mount hängt einen eigenen Teilbaum an; andere Root-Inhalte bleiben auch beim Destroy erhalten. Mehrere Instanzen sind möglich. Die UI kopiert ausschließlich bekannte Anzeigefelder und verändert den Input nie. Kein Core-Callback und kein Command-Ausgang. Auswahl bleibt bei gleicher Pilot-ID und vorhandener Skill-ID über Updates erhalten; Pilotwechsel oder Wegfall der Auswahl setzt sie zurück. Fokus auf einer weiterhin vorhandenen Skillkarte wird beim Update wiederhergestellt. Der Aufrufer liefert kohärente, vollständige Snapshots und steuert die Update-Frequenz; keine Tick-Schleife in der UI. Anbindung und Berechtigungsprüfung bleiben ein späterer gesonderter Auftrag.

| Feld | Erforderlicher späterer Core-Inhalt |
| --- | --- |
| `example` | Nur `true` aktiviert Kennzeichnung fiktiver Daten; sonst lesender Core-Snapshot |
| `revision` | Nachvollziehbarer Snapshot-/Revisionsbezeichner |
| `pilot` | Stabile `id`, `name`, `role`, `corporation`, aktuelles `ship`, getrenntes `shipOwner`; freigegebene Anzeigebezeichnungen |
| `experience` | `current`, `target`, erklärendes `label`, optional autoritatives `percent` von 0 bis 100; keine UI-Ableitung aus current/target |
| `skillPoints` | Bereits ermittelter vorhandener Bestand, inklusive echter 0 |
| `skills[]` | Stabile eindeutige `id`, `name`, `area`, `stage`, `description`, `progress` als fertige Anzeige, `status`, `reason`, `requirements[]` |
| `skills[].status` | Exakt `unlocked`, `locked`, `unknown`; andere/fehlende Werte erscheinen unbekannt |
| `requirements[]` | `name`, `have`, `need`, `assessment` als autoritative Anzeige; keine UI-Bewertung |
| `history[]` | Nur belegte Einträge mit `title`, `value`, `evidence`; nicht aus XP errechnen |

Anzeige akzeptiert Strings oder endliche Zahlen. Fehlend/null, leere Texte oder ungeeignete Werte ergeben „Nicht verfügbar“, niemals stillschweigend 0. Ungültiger/fehlender Prozentwert blendet den Balken aus. Fehlende/ungültige Skilllisten werden leer; Einträge ohne stabile ID oder doppelte IDs werden ausgelassen (erster gültiger Eintrag bleibt). Fehlende/ungültige Historie heißt „Keine Leistungsdaten übermittelt“, explizit leere Liste heißt „Snapshot enthält keine Leistungseinträge“. Fehlende Voraussetzungen werden als nicht übermittelt angezeigt und geben keinen Skill frei. Texte werden ausschließlich über `textContent` ausgegeben, nie als HTML. Kein Geheimnis-/Sessionfeld gehört in diesen Vertrag.

Der zukünftige Adapter muss Core-Fakten samt Herkunft/Revision, Freigaben, fehlenden Bewertungen und Sperrgründen transportieren. Er darf für W5f ohne definiertes Skillmodell weiterhin unbekannte Werte liefern. Modulwirkung, Geldkonten und Befehlsvalidierung bleiben außerhalb dieses Vertrags. Keine Legacy-Save-Kompatibilität wird behauptet.

## Prüfung am 05.11.2026

- Node **22.23.4**, Pflichtbefehl `node --test tests/*.test.mjs`: **9/9 Dateisuiten**, 0 Fehler/Skips/Abbrüche. Zusätzliche Sicht auf Einzeltests: `node --test --experimental-test-isolation=none tests/*.test.mjs`: **75/75**, davon 67 bestehende und 8 neue. Snapshot-Unveränderlichkeit, defensive Kopie, fehlende Werte/Null, Sperren trotz widersprüchlicher Zahlen, sichere Textausgabe, Auswahl/Update/Fokus/Pilotwechsel, Historie und Destroy geprüft. Keine Goldenwerte geändert.
- `python tests/legacy-pilot-touch.py`: Chromium mit Touch-Emulation über temporären lokalen HTTP-Server bei **1180×820, 1024×768, 820×1180, 390×844** bestanden. Alle vier Beispielpiloten, freigeschaltete/gesperrte/unbekannte Karten, Detailansicht, Update/Fokus, Input-Unveränderlichkeit, Text-Injection, Mindesthöhen ≥48 CSS-Pixel, Seitenüberlauf, Destroy und Browserfehler geprüft. Screenshots unter `/tmp/legacy-pilot-<Breite>x<Höhe>.png`; breite und schmale Ansicht visuell geprüft. Playwright/Chromium sind ausschließlich bereits installierte Entwicklungswerkzeuge, keine Projekt-Laufzeitabhängigkeit.
- Keine neue W5f-/W5j-/W5k-Wirtschaftssimulation: unveränderte Forschungszweige sind nicht Basis dieses PRs. Echte **iPad-Safari-/NAS-Abnahme bleibt offen**, ebenso WebKit. Chromium-Emulation ist keine reale Gerätefreigabe. Kein Merge, kein Deployment.

Roadmap-/Statusprüfung: Keine Produktpriorität, Freischaltentscheidung oder Core-Abhängigkeit geändert. Der Prototyp bleibt ausschließlich [DRAFT/ANALYSE]; daher keine Umschreibung der verbindlichen Roadmap oder des Main-Projektstatus. Dieser Bericht dokumentiert den isolierten technischen Stand.
