# APHROS VOID · PIR-0/1 Piratenfraktion und Sicherheitsgeografie

**[DRAFT / FORSCHUNG]** Basis `main 43f004dbed92b7128d8e78baee45ee11035b99c1`. Der M4-U10-Leitstand ist der separate UI-Draft [#593](https://github.com/tobiasfranziskus/Check/pull/593). Dieses Profil knüpft an seine dokumentierten Erweiterungspunkte an. P0 [#586](https://github.com/tobiasfranziskus/Check/pull/586) führt Archivierung und Triage. Die kurze PIR-Zeile gehört bei der gemeinsamen Dokumentationspflege in die aktiven Vorhaben.

## Einstieg und Anfangsbestand

Über `index.html` → **Wirtschaftsmanager** → **Neue Karriere** → **PIR-1 · Piratenforschung in Nadir**. +1 oder +10 Weltminuten lässt den Jäger auslaufen und macht den Positionswechsel sichtbar. Im Seed-42-Standardablauf der Forschung meldet die Patrouille den Asterion-Frachter `sh002` in Weltminute 198. Die Meldung bleibt nach Auswahl des Piratenmarkers unter der letzten Patrouillensichtung abrufbar.

| Anfangsbestand | Eigentümer | Ledger / Herkunft |
| --- | --- | --- |
| 33.000 ISK und reguläre Startbestände | Ursprüngliche Konten und Lager | Regel204, mit der existierenden NPC-Firmen-/Siliziumautomatik und S02-Politik |
| 240 ISK | Piratenfraktion | Explizites Startkapital des separaten Szenarios, vor dem ersten Tick zur Geldbasis gerechnet |
| 1 J4c-Jäger `pir001`, leer, am Nadir-Dock | Piratenfraktion | Feste Anfangshülle im Eigentumsaudit. Kein Abzug aus der Industrie und kein Werftverkauf |
| 0 ISK | Piratenpilot | Eigenes Lohnkonto, kein Konsumprofil in PIR-1 |

Die Forschung startet mit 33.240 ISK, null Emission und null Senke. Kapital und Hülle haben eine einmalige Szenarioherkunft. Der Jäger verwendet Flugleistung und Verschleißsatz der J4c-Klasse. PIR-1 führt weder zusätzliche Waffen noch einen eigenen Ausrüstungsbestand. Neue Einsätze benötigen 40 ISK Flugreserve, 1 ISK je aktiver Weltminute geht an den Piloten. Restgeld fließt am Dock an die Fraktion zurück. Die Kasse, der Pilot, die Reserve und die Verschleißminuten sind an das gepaarte Geldbuch gebunden. Es gibt keine weitere Hülle und keinen Wareneintrag. Eine aufgebrauchte oder verschlissene Flotte benötigt später eine real produzierte oder rechtmäßig verkaufte Ersatzhülle.

## Sicherheitsmodell und Zuständigkeiten

| Stufe | Historisches Referenzmodell | Heute befliegbar |
| --- | --- | --- |
| Sicher | Aldera, Cyris, Veldra | Aldera |
| Umkämpft | Orion, Nadir | Nadir |
| Gesetzlos | Dravos, Meridian | Dravos ausschließlich in Regel206/207-Forschung über die autorisierte Expedition |

Das Betriebsgebiet und Rückkehrdock liegen in Nadir. Aldera schließt Patrouillenaktivität aus. Die Szenariohülle bleibt in Nadir. Die Stufe wird aus der Referenz nur für tatsächlich vorhandene Systeme zugeordnet. Die Karte zeigt die feste Stufe separat von der Fraktionshülle, deren Position, Flugphase und aktuellem Auftrag. Die Patrouille erfasst gleichsystemische freie Kontakte innerhalb der festgelegten Entfernung und laufende Nadir-Transite im Korridorfenster. Das Fenster bezieht sich auf die letzten vier Minuten ankommender Frachter und den erkennbaren Abfahrtstick aus Nadir. Es ist eine Forschungsregel für Sektormeldungen ohne physische Transitkoordinaten. Eigene Routen sind nur in diesem Zeitfenster und während tatsächlicher Patrouillenaktivität markiert. Die Telemetrie des Operationsboards liest den aktuellen Weltzustand. Eine gemeinsame Sensor-/Fog-of-War-Regel steht zur Freigabe aus.

## Zustandsautomat und Speichergate

Bereit → Auslaufen → Patrouille → Beobachten oder Folgen → Rückkehr → Bereitschaft am Dock. In sicherem Gebiet oder ohne Hülle startet kein Einsatz. Fehlende Flugreserve sperrt den Start. Im Flug löst knappe Reserve die Rückkehr aus. Bei ungedeckter Weiterfahrt greift der vorhandene Halt des Flugdienstes. Verschleiß beendet weitere Einsätze. Der Suchradius um das Dock begrenzt Verfolgung; Transitkontakte werden beobachtet, da der Flugkern nur freie, gleichsystemische Flugkörper zum Folgen zulässt. Zielverlust stoppt das Folgen. Rückkehr hat Vorrang. Kontakte werden nach Klasse und stabiler ID priorisiert. Die Wahl des Patrouillenpunkts verwendet den gespeicherten Core-Seed-RNG, mit einem getrennt gespeicherten Zustand für die Fraktion. Die zivile RNG-Folge bleibt unverändert.

J8 startet und lädt das Profil ausdrücklich. Schema 8 und Regel204 bleiben erhalten. `kanon.piraten.profil === 1`, der feste Anfangsbestand und der Eigentums-/Lohnnachweis sind Pflicht für dieses Profil, dessen JSON und lokaler Slot getrennt von Regel204 und Dravos geführt werden. Die reguläre Ladefunktion verweigert PIR-Bestände. Die Freigabe erfolgt im Browser außerhalb des JSON. Der Core verweigert öffentliche Befehle und Queue-Einträge gegen die Piratenhülle, auch bei behaupteter Fraktionsidentität.

## Wiederverwendung

- Regel14 `m_core_sicherheit` liefert die Gebietsreferenz, Auswahl tatsächlich vorhandener Schiffe und das Sicherheitsgebot für Aldera. `piratenErsatz` bezahlt im Altmodell eine Kasse, erzeugt die Hülle aber ohne Werftbestand. Historische Überfälle, Kopfgeldemission, Sicherheitsjäger, Schutzgeld und Ersatz bleiben historische Belege. [Regel14-Sicherheitsprüfungen](../tests/sicherheitszonen.test.mjs) · [Historischer 13-Seed-Treiber](../tools/sicherheitsgeografie-simulation.mjs)
- F6/P2 liefert Integer-Flugkörper, Punktanflug, Folgen und Dockbefehle. Der simulierte Frachttransit bleibt unter W3/F4/W5ac. J4c/F8 liefert die Schiffsklasse und das Flugmodell. Die Kampf- und Duellübungen bleiben getrennte Sitzungsübungen. J8 liefert Eigentumssicht, Pilotenzugang und Save/Load. K1 liefert Reserve, Arbeitslohn, Verschleiß und das gepaarte Geldbuch. [Gemeinsamer Weltkern](../prototypes/welt/welt-kern.js) · [Flugkern](../prototypes/flug2d/flug-kern.js) · [J8-Sitzung](../prototypes/verbund/konzern-session.js)
- Void Echoes `480-auto01-kampf.js` selektiert freigegebene Kontakte in einem begrenzten Suchraum und priorisiert Rückzug. Übernommen sind die Verhaltensmuster Reichweite, autorisierte Ziele, Abbruch und Vorrang der Rückkehr. Trefferlogik und die separaten Zustände `AP/S` bleiben außerhalb des Weltkerns. [Katalog](VOID_ECHOES_CODEKATALOG.md) · [Kampfautopilot am Original-SHA](https://github.com/tobiasfranziskus/void-echoes/blob/19c3f792fbad8f21163f2f8550aa2ed7bd09a124/src/script/480-auto01-kampf.js)
- Das Operationsboard verwendet dieselben Stations- und Flottenpfade. Rostorange Raute und Text kennzeichnen den Piratenjäger, zivile und eigene Kartenmarker bleiben visuell eigenständig. [Mini-Style-Bible](MANAGER_RETRO_SF_STYLE_BIBLE.md)

## Produktfreigaben und PIR-2/3

1. **Patrouillenrecht und Ort.** Festlegen, ob ein umkämpftes Nadir die Fraktion am Industriedock duldet oder ein eigener Rückzugsort nötig ist. Entscheiden, welche Stufen Beobachten, Verfolgen und später Kampf erlauben. Reichweite, Korridorfenster, Sensorquelle, Sichtungsalter und mögliche Sicherheitskräfte festlegen. Jede neue Station benötigt echte Ausstattung, Eigentum und Zugang.
2. **PIR-2 Einsatzbewertung.** Einen lesenden Auftragskandidaten mit realem Frachttyp und Marktwert, Transit-/Freiflugstatus, erreichbarer Distanz, Restaktivminuten, vorhandener Begleitung und gedeckter Rückkehrreserve aufbauen. Freigegebene Ziele per sicherheitsstufengebundenem Zustandsautomat behandeln. Schaden erst mit einem eigenen autorisierten und wiederholbaren Ereignis, dessen Vorbedingungen Schiff, Aufenthaltsort und Einsatzfähigkeit prüfen.
3. **PIR-3 Eigentum und Industrie.** Vor Umsetzung Verlust-, Bergungs-, Eigentums- und Unterbrechungsbuchungen spezifizieren. Beute bewegt nur vorhandene Ware mit vollständigem Herkunftsbeleg. Hehlerei benötigt einen echten Käufer, Kasse und vorhandene Aufnahmefähigkeit. Erpressungs- oder Überfallzahlungen benötigen ausdrückliche Regeln zu Schuldner, Autorität und Vermögenseffekt. Ersatz über Werfterwerb oder belegten Eigentumsübergang vorsehen. An den U10-Erweiterungspunkten aktive Frachtzustände, Lohn-/Tarifreserve und Rückerstattungsweg gemeinsam testen. Teil-/Vollladung und noch offenen Vertrag zuerst nach ursprünglicher Eigentümerkette bilanzieren. Deckung von Eskorten, Reparatur und Sicherheitsdienst getrennt beschließen. Versicherung, Kopfgeld, Zerstörung und Progression bleiben spätere Produktarbeit.

## Reproduktion

```sh
node --test tests/*.test.mjs
node tools/pir-wirtschaftsvergleich.cjs alle 90
node tools/pir-wirtschaftsvergleich.cjs S02 365
node tools/pir-wirtschaftsvergleich.cjs S02 730
W6_P8G_MATERIAL=1 node tools/w6-p8d-dravos-szenarien.cjs alle 90
W6_P8G_MATERIAL=1 node tools/w6-p8d-dravos-szenarien.cjs S02 365
W6_P8G_MATERIAL=1 node tools/w6-p8d-dravos-szenarien.cjs S02 730
```

Die Regel204-Paarläufe vergleichen alle zivilen Zustandsfelder und den zivilen RNG an den Prüfpunkten. Die Projektion zieht genau den Fraktionsbestand einschließlich seiner Buchungen ab. Der gemeinsame kumulative Belegzähler wird dabei auf beiden Seiten ausgelassen. Die Original-Kriterien für Eigentum, Geld, Waren und Verträge bleiben in beiden vollständigen Welt-Audits aktiv. Browserabnahme über statisches HTTP in `tests/pir-1-browser.cjs` und dem Draft-Workflow. Physisches iPad und privates NAS sind offen.

## Prüfergebnisse

- **Node22:** 595/595, 0 Fehler, Abbrüche oder Skips. Sechs gezielte PIR-Prüfungen decken Replay, Kapital-/Hüllen-/Gebietssperre, Buchungen, eigentumsgeschützte Befehle, Sichtung, Freiflugfolge mit Zielverlust und JSON ab. [Vollständige Regression auf `f40cdbd`](https://github.com/tobiasfranziskus/Check/actions/runs/45238096990/job/137915108194)
- **Standardkarriere:** Der vorliegende Branch und ein unabhängiger Checkout-Inhalt von `43f004db` ergeben `674400c1d181fcf2` beim J8-Start und `e4514490aedc13bd` nach der ersten bezahlten F4-Eisrunde. Der Export ist bytegleich, der RNG auf beiden Seiten `42`.
- **Forschungslauf:** Replay bei Weltminute 500 `33e6a15c54628c2b`. Im ersten Tag wurden 204 ISK auf das Pilotenkonto bezahlt. Die Fraktion bleibt mit 36 ISK am Dock, unter der 40-ISK-Abflugreserve. Die geprüfte Haus-F4-Lieferung führt 50 Eis nach Nadir und rechnet 240 ISK Tarif sowie 120 ISK Lohn ab. Besitz und Frachtvertrag bestehen fort.
- **Chromium und WebKit:** 1180×820, 1024×768, 820×1180 und 390×844. Alle lokalen Chromium- und CI-WebKit-Läufe belegen `1123a9e7286a9a69`, 120 ISK Pilotlohn bis zum Prüftick, Kartenmarker, Auswahl, isolierte Speicherstelle, Reload und JSON-Rundlauf. Der lokale WebKit-Download war per HTTP 403 gesperrt. [Touchmatrix auf `f40cdbd`](https://github.com/tobiasfranziskus/Check/actions/runs/45238096888)
- **Regel207 ohne PIR:** 13×90 sowie S02×365 und ×730 über den Originaltreiber mit `W6_P8G_MATERIAL=1`. 33.000 ISK, null Emission und Senke. S02-Endhash `abf227020abc7c00` bei Tag 365 und `c5b60a0c1bf90c03` bei Tag 730. [Originalkontrollen](https://github.com/tobiasfranziskus/Check/actions/runs/45238096990)

- **Historischer Sicherheitsvergleich:** 13 Seeds, jeweils 90 Tage. Der historische Treiber reproduziert seine Archivsimulation separat von der aktuellen Wirtschaft.

### Regel204-Paarlauf bei identischer Firmenpolitik

| Szenario | Tage | Kontrolle | PIR-1 | Eis-/Erzfrachten |
| --- | ---: | --- | --- | ---: |
| S01 | 90 | `989e387cb089ee1c` | `9bc1161f787f75ff` | 1058 / 1 |
| S02 | 90 | `ceca8251f4f9e304` | `45e33c76f1fd0b1a` | 999 / 20 |
| S03 | 90 | `4f75e0256cd71c8c` | `d1a20d59857b5a12` | 127 / 4 |
| S04 | 90 | `62b27b8d80cce080` | `70d3a9d526eef31e` | 32 / 1 |
| S05 | 90 | `b71a31f0789d5d02` | `ab8e559d054fc41b` | 10 / 1 |
| S06 | 90 | `cb3b540fd95cfd78` | `e9c6c5c3865717ac` | 23 / 1 |
| S07 | 90 | `6a109f29faf17e99` | `da99c707d26dc5af` | 19 / 1 |
| S08 | 90 | `8ed7039315af84e2` | `aa181b8ec4897353` | 8 / 1 |
| S09 | 90 | `525f362ecdf420a3` | `04ac14d583ff5a92` | 3 / 1 |
| S10 | 90 | `2b9fa3f8e4ca63d3` | `2349f7139ec2334a` | 41 / 1 |
| S11 | 90 | `12587245ced4c1ea` | `a4c8aa3a5baaa43f` | 1003 / 21 |
| S12 | 90 | `d4c743520ae83a24` | `530203399a2c12a0` | 0 / 1 |
| S13 | 90 | `13526ab068edc3fa` | `401f4bc6ca916b7c` | 31 / 1 |
| S02 | 365 | `edaf0d6e0246c7a9` | `d6212440e5a5ff13` | 4000 / 74 |
| S02 | 730 | `cabda24fb8cf9622` | `6cfbd31deb04d115` | 4000 / 74 |

## Koordination der Drafts

Die Git-Zusammenführungsprobe gegen U10 `8cdb1e72` zeigt Überschneidungen in `PROJEKTSTATUS.md` und `p3-manager-karte.js`. Im später gemeinsam geprüften Operationsboard müssen U10-Bedarfsdaten, Werftangebote und Aktivminuten zusammen mit den PIR-Sicherheitsfeldern und Kontaktmarkern vorliegen. Die Probe gegen P0 `b7610dba` zeigt einen Roadmap-Textkonflikt. Bei der gemeinsamen Pflege gilt die kompakte P0-Fassung als Basis. Die PIR-Zeile und der Statushinweis ergänzen die dortigen aktiven Vorhaben. [PIR-Draft #594](https://github.com/tobiasfranziskus/Check/pull/594) · [U10 #593](https://github.com/tobiasfranziskus/Check/pull/593) · [P0 #586](https://github.com/tobiasfranziskus/Check/pull/586)
