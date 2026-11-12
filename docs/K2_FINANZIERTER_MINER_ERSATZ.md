# K2 – Finanzierter Miner-Ersatz auf der kanonischen K1-Welt

**[DRAFT / OPTION · 12.11.2026]** Implementiert im [gestapelten PR #301](https://github.com/tobiasfranziskus/Check/pull/301) auf [K1-PR #300](https://github.com/tobiasfranziskus/Check/pull/300). Keine Produktfreigabe, kein Merge/Deployment, kein neues Geldmodell. Das bestehende Regel195-Hauptspiel wird weder umgestellt noch seine Spielstandsablage geöffnet.

## 1. Problem und technischer Zuschnitt

K1 erzeugt Frachter aus W4-Material; Miner konnten bislang nur aus dem endlichen Aldera-Gründungslager gekauft werden. Bei aktivierter nutzungsabhängiger Stilllegung endet deshalb selbst ein finanziell sonst funktionierender Kreislauf. K2 ergänzt **keine weitere Wirtschaftswelt**: Die bereits existierenden Stationen, Materialbestände, Eigentümerkassen, W3/W4-Produktionsbefehle, Frachtaufträge, Original-`shipBuy`, der gemeinsame Takt und die K1-Transferkontierung bleiben autoritativ.

Alle untenstehenden Mengen und Preise sind **Forschungsparameter [OPTION]**, nicht die Freigabe einer Produktbalance. Um die ursprüngliche W5-Werft zu nutzen, gilt testweise: **5 Material, 30 Minuten Werftarbeit, 1 Miner**. Das Baurezept ist explizit getrennt vom unveränderten Original-W5-Frachterrezept. Kein zusätzlicher Rohstoff und keine geschenkte Hülle.

## 2. Zahlung und Warenherkunft je Miner

| Vorgang | Leistung / Ort | Zahlung und Eigentum |
| --- | --- | --- |
| Erzförderung | Original-Miner am Aldera-Erzfeld, tatsächlicher Rückflug und Dockverkauf | Original-Käuferbindungs- und Bergbaulohnkonto; keine Fernabnahme |
| Erztransport | Original-W3-Rundfracht nach Nadir | Original-Käufer-/Arbeits-/Frachtbuchung |
| Material | Original-W4: 10 Erz → 5 Material, 20 Minuten Raffinerie | Nadir zahlt vollständige 20 ISK vorfinanzierte Löhne |
| Miner-Rohbau | Nadir-Werft verbraucht 5 tatsächlich vorhandenes Material | `werft_extern` überweist 500 ISK an `st_nadir` |
| Miner-Werftarbeit | 30 echte Wirtschaftsminuten | `werft_extern` bindet 30 ISK in `k1_miner_arbeit`; je Minute geht 1 ISK an `arbeiter_werft_nadir` |
| Miner-Rückfracht | Physische Lagerentnahme aus Nadir und Frachterladung auf bereits finanziertem Nadir→Aldera-Rückweg | Miner-Besteller bindet 60 ISK an `k1_miner_fracht`, Spedition erhält sie erst nach tatsächlicher Ankunft |
| Kauf und Einsatz | Miner befindet sich erst nach Entladung im Aldera-Lager. Original-`shipBuy` führt Käuferschaft und Schiff-ID; NPC-Disponent übernimmt fortsetzbaren Pendelauftrag | Miner-Käufer bezahlt 600 ISK aus eigener Kasse an die Werft; Folgeminuten sind weiterhin vorzufinanzieren |

**Keine Doppelzahlung:** Die 60 ISK sind die *zusätzliche* beauftragte Miner-Rückfracht, während die ursprüngliche Eis-/Wasserrückfracht ihre eigene Finanzierung behält. Bei nicht verfügbarem Frachter, Budget oder Lagerplatz wartet das physische Schiff in Nadir. Aufträge und Rücklagen schaffen keine neuen ISK. Als rein rechnerischer Rohbauüberschuss bleiben 600 − 500 − 30 = **70 ISK** vor weiteren Betriebsausgaben; das ist kein garantierter Gewinn.

## 3. Sicherheitsgrenzen

- Schiffe entstehen erst nach realer Materialentnahme und vollständiger Werftarbeit, **nicht** beim Start des Auftrags.
- Manufaktur und Frachterbau nutzen **dieselbe** Nadir-Werft und sind gegenseitig gesperrt. Es gibt nur ein aktives K2-Fertigungsprojekt.
- Nur eingetragene Besitzer `house` und `npc3` können K2-Miner bestellen; die vollständigen 660 ISK für Kauf und zusätzlichen Transport müssen spätestens bei der körperlichen Verladung vorhanden sein.
- Der zusätzliche Schiffstransport verbucht keine globale Warenschöpfung: Miner wechselt aus `st_nadir.lager.miner` in `ships[frachter].ladung.miner` und erst am Aldera-Dock ins dortige Lager.
- Das K1-Geldbuch prüft jede Buchung gegen den Inhaber, den Betrag und den Gegensaldo. Das K2-Zusatzbuch auditiert **Aufträge, Stückzahl, Materialverlust, Werftlohn, Treuhandrest, Transportstücke, Frachterzahlung und Aldera-Lager** gegen das globale Original-Ledger.
- Bestehende K1-Spielstände haben kein K2-Buch. Zusatzbuch und zwei Reservenkonten entstehen **erst bei der ersten bezahlten K2-Transaktion**. Schema 8/Regel 199 und die getrennte `aphros-void-welt-v1`-Ablage bleiben erhalten. Alte K1-Referenzhashes dürfen sich ohne K2-Aktion nicht ändern.
- Beim Stilllegen eines Miners beendet der Pilot die Förderung und steuert zum Dock. Der Auftrag bleibt für einen finanzierten Ersatzkauf nach Lieferung registriert; kein Teleport und keine Gratisrettung.

## 4. Prüffragen

`tests/welt-k2-miner.test.mjs` prüft zunächst negative Fälle (kein Material, falscher Besteller, falsche Werft, unerlaubte Felder), K1-Load ohne zusätzliche Konten und den tatsächlichen längeren S12-Lauf mit Materialien, Geldern, Belegen und Save/Load. Unabhängig prüfbar: `node --test tests/welt-k2-miner.test.mjs`, `node --test tests/*.test.mjs`, `node scripts/build-w5-singlefile.mjs --check`. Die bisherigen W6-Gegenproben S01–S15 und Browser-WebKit/Chromium sind zusätzlich verpflichtend.

**[TESTSTATUS]** Testausführung und Audit-Ergebnisse erst aus abgeschlossenen CI-Läufen von PR #301 übernehmen. Die GitHub-Quelle ist hier nur durch GitHub-Connector erreichbar; ein lokaler Checkout/Testlauf war durch DNS-Zugriffssperre nicht möglich. Echte iPad-Safari-/NAS-Gerätetests sind nicht durchgeführt.

## 5. Grenzen und nächste Gates

K2 ist keine genehmigte W6-Dauerwirtschaft. Das Emissionsmodell bleibt **0 ISK**; Spielersparen unbegrenzt, NPC-Insolvenz/Nachfolge, neue Endnachfrage, Industrieexporte, Wartung, zusätzliche Systeme und eine volle 13×90-Tage-Ersatzwirtschaft sind **noch offen**. Besonders zu prüfen sind Rückfracht-Verfügbarkeit bei Eis-/Wassersättigung, die Kapitaldecke von Werft und Minereigentümer, Wiederaufnahme echter Förder- und Kundenaufträge und echte Safari-Saves. Keine neuen Produktionsregeln ohne gesonderte Entscheidung auf `main`.
