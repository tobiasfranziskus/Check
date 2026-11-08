# C1c-1 – nachgewiesener Lohnrueckfluss aus W3/W4 in die private Nachfrage

**[DRAFT / FORSCHUNG · 08.11.2026]** Folgt dem C1b-2-Vorstufennachweis [#249](https://github.com/tobiasfranziskus/Check/pull/249), auf den C1b-1-Wasserregeln [#247](https://github.com/tobiasfranziskus/Check/pull/247) und der C1a-Pruefung [#246](https://github.com/tobiasfranziskus/Check/pull/246). Der industrielle Export nach Meridian und die vollstaendige Modell-C-Wirtschaft aus [#245](https://github.com/tobiasfranziskus/Check/pull/245) bleiben offen.

## Umfang und wirtschaftliche Aussage

Das isolierte Forschungsprofil `aphros-research:C1c-1:earned-industry-wages-v1` / Forschungsregel **3303** verwendet **ausschliesslich die vorhandenen Core-Funktionen** `m_core_w5s.orePilotWage` (W5s-q) und `m_core_w5s.industryWage` (W5s-r), damit bereits tatsaechlich bezahlte W3-Flugarbeit und W4-Raffineriearbeit rechtmaessig den im Testmodell zusammengefassten privaten Wasserhaushalt erreichen. Kein zweiter Lohnauszahlungsautomat, kein weiterer Wirtschaftskern. Die Regeln aktivieren nicht die W5s-Werft- oder autonomen Industrieauftraege.

**Positiv nachgewiesen:** Im bestehenden bezahlten 180-Minuten-Erz-/Transport-/Materialfall werden genau **120 ISK** Pilotenlohn aus dem Transportfonds und **10 ISK** Raffinerielohn aus `arbeitskraefte_nadir` an `w5n_kunden` uebertragen. Quellen und Ziel werden einmalig mit Original-`m_core_handel.buche` gebucht. Core-Warenproduktion, physische Hin- und Rueckfahrt, Material-Rezept und Eigentum bleiben dieselben wie in #249. Es entsteht **kein Minting** und keine neue Leistung.

| Seed 42, dreitaegiger Vergleich mit identischer Erzvorstufe | C1b-2 | C1c-1 |
| --- | ---: | ---: |
| W3-Pilotenlohn in privater Wasserkasse | 0 | 120 ISK |
| W4-Raffinerielohn in privater Wasserkasse | 0 | 10 ISK |
| Wasserkasse nach drei Tagen | 2.036 ISK | **2.166 ISK** |
| Bezahlte Wasserkäufe | 28 | **28** |
| Externe Vergütung / Mint | 0 | 0 |

**Einordnung:** Die 130 ISK sind von realen bereits bezahlten Arbeitskonten umverteilt worden, nicht neu geschaffen. Trotz hoeherer Kaufkraft ist bis Tag 3 **kein zusaetzlicher Wasserverkauf** nachgewiesen. Es handelt sich weder um eine unabhängige Abnahme in Meridian noch um die Wiederherstellung einer dauerhaft tragfaehigen Nachfrage. Insbesondere begruendet dieser Versuch **keine** neue Emissionsregel.

## Technik, Speicherung und Audits

- Die registrierte Regel 3303 wird ausschliesslich im Node-Forschungsadapter `tools/research/c1b-1-wasser.mjs` gewaehlt. C1b-1 / Regel 3301 und C1b-2 / Regel 3302 bleiben unveraendert und ihre Saves gegenseitig inkompatibel.
- Die vorhandene Core-Minutenfolge erledigt Lohnansprueche zur vollen bezahlten Stunde. Ein bereits abgegoltenes Arbeitsereignis kann nicht ein zweites Mal ausgezahlt werden. Die C1c-Tests rufen die vorhandenen Funktionen explizit erneut auf und verifizieren Hash- und Kasseninvarianz.
- Zusaetzlich zum Original-Gesamtaudit werden die Transportfonds-Kasse, der Verdienstausweis `w3.arbeitsKosten`, `w4.gezahlt`, das Raffineriearbeiterkonto und die private Wasserkasse **unabhaengig** anhand der eigentlichen Leistungs-/Zahlungszaehler rekonstruiert. Weltgeldsumme 33.000 ISK konstant.
- Belege, Profil-Fingerprint, Save/Load und vollstaendiger deterministischer Replay werden inklusive zweier Seeds (42/7) und einer dreitaegigen Fortsetzung geprueft. Gegenproben verfälschen Belegsumme, Arbeiterabrechnung, Kasse, Mint und Profil und erwarten valide Ablehnung. Manipulierte Testfixtures werden nicht als Wirtschaftsereignisse ausgegeben.

## Teststatus und Grenzen

Gezielter Workflow: [C1b-1 – exaktes isoliertes C-Wasserprofil, Run 42469549077](https://github.com/tobiasfranziskus/Check/actions/runs/42469549077) erfolgreich auf dem Code- und Testcommit `3033cfe`:
- C1b-1 **8/8** Tests erfolgreich.
- C1b-2 **6/6** Tests erfolgreich.
- C1c-1 **5/5** Tests erfolgreich, keine Fehler/Skips/Abbrueche.

Allgemeine Regression: [Run 42469548926](https://github.com/tobiasfranziskus/Check/actions/runs/42469548926). Den Abschlussstatus getrennt pruefen; ein laufender Lauf ist noch **kein** bestandener Volltest. Der neue Dokumentationscommit veraendert keine ausfuehrbaren Regeln oder Tests.

**Nicht bewiesen:** weitere bezahlte Wasserkäufe oder nachhaltiger Geldumlauf bei 30/90 Tagen im C1c-Profil; positive Exportverguetung, physische Lieferung und Abnahme eines C-Endprodukts in Meridian; Vollkosten einer C-Silizium-/Bauteil-/Lagermodulkette; nutzungsabhaengige Wartung und C-Huellenpreise; universeller Einzelposting-Hook; iPad-Safari-/NAS-Abnahme. Erz wird in diesem Zwischennachweis weiterhin mit R32-Tempo (1 pro Minute fuer 2 ISK) abgebaut, nicht mit dem C-Erztempo (1 je 4 bezahlte Minuten).

## Nächster entwicklungsfähiger Schritt

C1c-2 sollte **ein** vorfinanziertes reales Bauteillos (`2 Material + 1 Silizium → 1 Bauteil`, 8 bezahlte Arbeitsminuten) im vorhandenen Core herstellen und unabhängig auditieren, inklusive C-Rohstoff-Foerdercadence, vorhandener Lager-/Eigentumsbelege und eindeutigem Folgekaeufer. Keine Gratisvorprodukte oder sofortige Meridian-Abnahme. Erst danach Lagermodul, echte Route und global auditiertes Exportbuch koppeln.

**Kein Merge, kein Deployment, keine produktive `index.html`- oder Save-Aenderung.** Die konkrete Modell-C-Geldemission und Produktumstellung beduerfen separater Nutzerfreigabe.
