# W6/P8h – eigenfinanzierte NPC-Folgeversorgung

**[MAIN / PAGES · 17.11.2026]** [Integrations-PR #458](https://github.com/tobiasfranziskus/Check/pull/458) als `main c24da3cc0e5ccedb9516e6a53c032105caa8978a` nach vollständiger Abnahme gemergt, [GitHub-Pages-Deploy #44031015568](https://github.com/tobiasfranziskus/Check/actions/runs/44031015568) `completed/success` auf genau diesem Commit. [Forschungs-Draft #454](https://github.com/tobiasfranziskus/Check/pull/454) und [Produkt-Draft #455](https://github.com/tobiasfranziskus/Check/pull/455) als getrennte Herkunftsbelege erhalten.

## Spielpfad und Schutz

Öffentlicher Root `/` → neue **experimentelle Regel207-Forschung** (eigener Speicher-/Backup-Slot) → „Industrie/Schiffbau“ → „Siliziumversorgung“ → **„Eigenfinanzierte NPC-Folgeversorgung aktivieren“**. Der Schalter verlangt eine ausdrückliche Entscheidung und prüft den Core-Audit; ein externer Regel207-JSON-Import mit gesetzter Option verlangt eine zweite Zustimmung. Regel204 bleibt Standard. Bereits bestehende Regel207-Saves besitzen das neue Feld nicht; damit bleibt die bisherige Regel207-Simulation identisch, bis der Nutzer den Schalter bewusst betätigt. Keine automatisch erzwungene Migration.

**Funktion:** Nur bei `rulesVersion===207`, `npcAuto===true`, `materialSupplyEnabled===true`, `npcMaterialKette===true` prüft die originale Firmenpolitik in einem einheitlichen Weltkern alle 30 Weltminuten Bedarf, eigenen Werft-/Speditionsbestand, echten Restbuchwert, vorhandenes Material, Pilotenlöhne und Firmenkassen. Anschließend nutzt sie nur bestehende signierte W0–W5-/K7-Befehle: W5-Hülle bauen, 750-ISK-Kauf und real bezahlter W5ac-Frachtertransport, gegebenenfalls unterschriebener 50-Erz-Materialvertrag. Der **schon existierende** K7-Industrie-Autodisponent darf seinen rechtmäßig finanzierten Vertrag selbst abschließen; P8h darf keine zweite Unterschriftenkette erzwingen. Keine Gratisware, freie Schiffe, erfundene Nachfrage, Kreditrettung, neuen Tarife, Weltgeldemission oder Welt-Schemaerhöhung.

**Integrität:** Mehrfachbefehle werden zunächst in einer echten validierten Save/Load-Kopie vollständig geprüft; erst danach synchron durch den Originalkern gebucht. NPC-Befehlszähler sind auf vorhandene Werft-/Kauf-/Fracht-/K7-Nachweise begrenzt; gefälschte Save-Daten und unzulässige Regel204-Felder werden abgewiesen. Bei nicht ausreichender Kasse pausieren Firmen. Ein schon bezahlter Frachter unterwegs blockiert eine unnötige zweite Werftbestellung.

## Tatsächliche Integrationsabnahme

**[GEPRÜFT / Releasekandidat `4ab84fe763e9`]** 507/507 Node22-Tests, 40 erfolgreiche CI-Prüfungen und ein regulär übersprungener Check, keine Fehler. 13×90 und S02×365/730 in der originalen, vollständig auditierten Regel207-Welt auf dem P2-Hauptstand. Der eigens ergänzte Test `tests/w6-p8h-toggle-browser.cjs` hat unter **Chromium und WebKit jeweils 4/4 Touchgrößen** den realen Karriere-Opt-in, 60 bezahlte Weltminuten, Pausieren, Save/Load, getrennte Alt-Karriere und zusätzliche externe Importzustimmung bestätigt.

**[Korrigierter historischer Negativbefund]** Der frühere Zwischenhead hatte 502/503 Node22 bestanden; sein Test verlangte einen P8h-Unterschriftenzähler, obwohl der schon vorhandene K7-Autodisponent den rechtmäßig finanzierten Originalvertrag selbst signiert hatte. Der finale Test prüft statt dessen die echten K7-Unterschriften, W3-Fracht, W5-Förder-/Kauf-/Überführungsbelege und unveränderten Referenzhashes. Die ursprünglichen Fehler wurden nicht verschwiegen; der reale Nachweis ist **507/507**.

**13×90 Tage (alle Originalaudits bestanden):** S02 erstellt 4 Jäger, verkauft 3 **durch drei ausdrücklich finanzierte 900-ISK-Spielerkäufe** und schließt 5 W3-Frachten ab; eine weitere finanziert gebaute W5-Hülle wird nachgekauft. S03: 2 Jäger; S04: 3 Jäger; S11: 4 Jäger. Die anderen neun Regime erzeugen bis Tag 90 keinen Jäger und bleiben als negative Ergebnisse dokumentiert. Sämtliche 13 erhalten **33.000 ISK, Mint/Burn 0**, ohne negative Kassen, Waren-/Schiffs-/Eigentumslücken. Der Test prüft jeweils Tag 30/60/90 inklusive Save/Load.

**S02×365/730:** Am Tag 90: 4 gebaute und 3 verkaufte Jäger, 5 W3-Lieferungen, 10 Material und 0 Silizium in Nadir; kein einsatzfähiger Aldera-Speditionsfrachter. Am Tag 365 und 730 **keine weitere Jägerproduktion**. Die endlichen Siliziumfelder (0 Rest), eine vierte noch nicht verkaufte Jägerhülle und fehlende garantierte Käufer begrenzen die Industrie. Kein künstlicher NPC-Endabnehmer wurde eingeführt. Dies ist **kein** Nachweis einer dauerhaft selbsttragenden W6-Gesamtwirtschaft.

**Hashes des geloggten Versuchs:** S02 Tag 90 `32a72c8050699525`, Tag 365 `a2a150fa878224b9`, Tag 730 `d50f27e2c0b8e409`. Der P8h-OFF-Originalreferenzhash des 90-Tage-S02-Saves bleibt `ad0f037be40c32fd`.

## Bestätigte Release-Gates und offene Risiken

- **[MAIN]** `c24da3cc0e5ccedb9516e6a53c032105caa8978a` nach 507/507 Node22 und 40 grünen CI-Prüfungen (ein regulärer Skip), umfassenden finanziellen, Eigentums-, Save- und Manipulationsaudits.
- **[PAGES]** [Deploy #44031015568](https://github.com/tobiasfranziskus/Check/actions/runs/44031015568) `completed/success` auf exakt diesem Merge-SHA; öffentlicher [Root](https://tobiasfranziskus.github.io/Check/) führt zum Regel207-Karrieremodus.
- **[BROWSER]** Chromium/WebKit jeweils vier Touchgrößen, echter P8h-Toggle mit vollständigen Backup-/Importbelegen. **Kein** reales iPad Safari oder privates NAS geprüft.
- **[BACKUP]** `backup/main-before-w6-p8h-p2-integration-20261117` sichert `90e56b0`, davor `backup/main-before-w6-p8h-npc-20261117` die vorige W6-Version.
- **[OFFEN]** Neue real finanzierte Siliziumquellen, wiederkehrende echte Endnachfrage, dauerhafte W6-Tragfähigkeit und Hardwareabnahme.

**Nächste Wirtschaftsforschung:** Die bis Tag 90 erschöpften vorhandenen Siliziumfelder und den dadurch endenden Jägerabsatz untersuchen. Neue Felder, Recycling, Module, Endnachfrage oder Geldmodell-B-Emissionen nur mit jeweils neuen echten Ressourcen-/Finanzierungsnachweisen und gesondert freigegebenen Balancingregeln.
