# Aphros Void – kompakter Analyse-Index für den nächsten Phase-B-Schritt
**Stand: 02.11.2026 · [ANALYSE/DRAFT] · keine zweite Roadmap und keine Produktfreigabe**

> **Verbindlich bleiben** `docs/ROADMAP.md` auf `main` (Ziele/Priorität), `AGENTS.md` (Regeln), `docs/PROJEKTSTATUS.md` (historisch belegter Integrationsstand), aktuelle PRs und CI. Dieser Index ist ein **Lesepfad**, keine neu beschlossene Produktarchitektur. Nicht aus dem kompletten alten Analyse-Stack mergen.

## Einstieg / Ground Truth

- **[MAIN]** `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5 / Regel14 / Schema8. `index.html` auf `main` bleibt unverändert. Keine R15-/Schema9-Integration, keine neue Geldmodell-B-Regel, keine produktive Materialbindung.
- **[DRAFT, wesentliche Mechanik-Versuche; aufeinander gestapelt]** [#108](https://github.com/tobiasfranziskus/Check/pull/108) atomare Vertragsreserve (Basis `main`) → [#109](https://github.com/tobiasfranziskus/Check/pull/109) bezahlter Frachterbetrieb → [#110](https://github.com/tobiasfranziskus/Check/pull/110) bezahlte Fabrikarbeit → [#111](https://github.com/tobiasfranziskus/Check/pull/111) lokaler bezahlter Nahrungs-Endverbrauch. **Nicht als Integrationspaket freigegeben.**
- **[ANALYSE/ARCHIV]** [#112–#135](https://github.com/tobiasfranziskus/Check/pulls?q=is%3Apr+is%3Aclosed+B-K10) sind Einzeltests auf diesem Stack, [#125](https://github.com/tobiasfranziskus/Check/pull/125) als Seitenzweig. Beweise und GitHub-Commits bleiben bei Schließung erhalten. [#121](https://github.com/tobiasfranziskus/Check/pull/121) enthält einen **experimentellen `index.html`-Änderungsvorschlag zur Warenherkunft**, nicht nur Tests; nicht in `main` übernehmen, bevor Save-Kompatibilität und Regelentscheidung geprüft sind.
- [#106](https://github.com/tobiasfranziskus/Check/pull/106) alter docs-only-Zwischenstand; [#107](https://github.com/tobiasfranziskus/Check/pull/107) früher Original-Core-Nachweis. Historische Referenzen, kein offenes Integrationsziel.

## Ausschließlich notwendige Beweise lesen

1. **Echter Versorgungspfad / Herkunft:** [#121 B-K10d](https://github.com/tobiasfranziskus/Check/pull/121) Save-Herkunftstransit, [#122 B-K10e](https://github.com/tobiasfranziskus/Check/pull/122) Mischladung/Beute/Außenhandel; [#128 B-K10k](https://github.com/tobiasfranziskus/Check/pull/128) tatsächliche Eisförderung, Produktion und Lieferkosten. Ohne korrekte Warenherkunft ist bezahlter Endverbrauch nicht beweisbar.
2. **Marktkosten und Kaufkraft:** [#129](https://github.com/tobiasfranziskus/Check/pull/129) autonome Nahrungsmargen über 13 Seeds ×72h, [#130](https://github.com/tobiasfranziskus/Check/pull/130) tatsächliche Herstellungskosten/Altimporte, [#131](https://github.com/tobiasfranziskus/Check/pull/131) Kostenuntergrenze versus Haushaltkaufkraft. Eine bezahlte Teil-Charge beweist keine autonome Kostendeckung.
3. **Werft, Transport, Ersatz:** [#133 B-K10p](https://github.com/tobiasfranziskus/Check/pull/133) Originalmarkt: verfügbares Silizium wird wegen Finanzierung/Routenwahl nicht zur Werft transportiert. [#134 B-K10q](https://github.com/tobiasfranziskus/Check/pull/134) realer bezahlter Siliziumtransport und 168-ISK-Dienstleistung – aber **kein** Frachterbau ohne Materialpriorität. [#135 B-K10r](https://github.com/tobiasfranziskus/Check/pull/135) mit testseitiger Bindung von acht echten Bauteilen: tatsächlich neuer Original-Frachter `sh091` bei Tick 20.356, NPC2-Kauf 1.050+42 ISK bei Tick 20.400; Verlust nach zwei Fahrten bei Tick 20.580 in Meridian, anschließend NPC2 wieder schiffslos und Aldera-Kasse 4 ISK. Keine nachhaltige Wiederbeschaffung bewiesen.
4. **Letzter CI-Nachweis:** [#41510017473](https://github.com/tobiasfranziskus/Check/actions/runs/41510017473), Head `b26de9d02a00a4f3687c86c6b1aca2f426ca2f67`, abgeschlossen erfolgreich; 189/189 Node-Tests nach [#135](https://github.com/tobiasfranziskus/Check/pull/135), historische Referenzjobs erfolgreich; separater Sicherheitsgeografie-Vergleich planmäßig übersprungen. Das ist **keine** 13×90-Tage-Gesamtwirtschaftsabnahme und **keine** reale iPad-/NAS-Abnahme.

## Was **nicht** bewiesen oder freigegeben ist

- Die Materialkontingent-Sperre aus #135 lebt nur im Test-Closure; sie ist **nicht gespeichert**, nicht für alle konkurrierenden Produktionslinien persistent und kein nutzbarer Spieler-/NPC-Auftrag.
- Produktionslöhne werden im Versuch zum jeweiligen Start finanziert, aber **nicht gemeinsam im Voraus mit Waren, Transport, Fertigung und Erwerb atomar gebunden**.
- Reale Betriebskosten, Risikoverluste, eigene Rücklagen, Ersatzinvestitionen, Warenherkunft und zahlungsfähige Endnachfrage bilden noch **keinen wiederholbaren, autonomen, wirtschaftlich tragfähigen Kreislauf**.
- Kein neues ISK-Minting ohne Einzelentscheidung zu Geldmodell B; keine Gratisrettung, kein Spieler-Sparlimit, keine unfinanzierten NPC-Fahrten; keine stillen Save-Formatänderungen. Auch keine pauschale Preis-/Lohnreform und keine automatisch garantierte Eskorte.

## Abgegrenzter Übergabeauftrag (keine automatische Umsetzung)

Auf **frischem Branch direkt von `main`** einen möglichst kleinen, kompatibel prüfbaren Integrationskandidaten identifizieren, **nicht** den alten Stack mergen. Zuerst fehlende Regeln und erforderliche Freigaben explizit auflisten; erlaubte, bereits klar abgrenzbare Infrastruktur separat prüfen. Konstruktiv ein geschlossenes Mini-Gate: reale Material- und Geldbindung → bezahlte Förderung/Herstellung/Transportleistung → tatsächlich bezahlter Endabsatz/Schiffskauf → geprüfte Erneuerungsfähigkeit nach Verlust. Kein Erfolg, wenn nur ein neues Schiff entsteht und unmittelbar ausfällt. Vor produktiver Integration 13 Seeds ×90 Tage, Spielerkrisen, Geld-/Waren-/Escrow-Audits, Hashes, Save/Load und für betroffene UI Funktionen echte iPad-/NAS-Abnahme; Ergebnisse ausschließlich bei Ausführung als bestanden bezeichnen.

**Governance:** Keine Freigabe von Wirtschaftsregeln, Produktionspriorität, Routenrisiko, Emission, Save-Migration oder Merge aus diesem Dokument ableiten. Alles unter [ANALYSE] bis Nutzerentscheidung.
