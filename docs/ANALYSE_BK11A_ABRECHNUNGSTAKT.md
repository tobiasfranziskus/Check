# B-K11a – Diagnose der Stundenabschluss-Sperre (nur Beobachtung)

**[ANALYSE/DRAFT]** Auf B-K11 [#137](https://github.com/tobiasfranziskus/Check/pull/137) gestapelt. Der Branch enthaelt **keine Produktregel- oder index.html-Aenderung**; `main` bleibt Regel14/Schema8. Die vorliegende Instrumentierung wird ausschliesslich in `tools/bk11-wirtschaft.mjs` in einer Testinstanz der Original-Core-Funktionen eingesetzt. `tests/bk11a-abrechnungstakt-beobachter.test.mjs` prueft kurze Replays und Schluessel-Invarianten.

## Frage und Falsifikation

Nach der Ankunft im Dock muss der Frachter aus #137 unter Umständen bis zum naechsten Stundentick warten, weil `fahrtStart` ein noch offenes Vertragsobjekt oder `s.arbeit !== 0` abweist. **Hypothese D1:** Dieser Leerlauf traegt zur Verschlechterung von 791 auf 6.620 Mangelstunden in 13 passiven 90-Tage-Welten bei. Die Daten belegen bislang **keine** Alleinursache.

## Testseitige Messgroessen

- `lockedDockMinutes`: Frachter-Minuten im Dock mit offenem Vertrag oder alter, noch nicht stundenweise abgerechneter Arbeit. **Obergrenze fuer moeglichen Stundentakt-Leerlauf**, nicht automatisch verlorene Lieferzeit.
- `blockedAttempts`: Original-Fahrtstartversuche, die trotz Dockposition an `s.vertrag || s.arbeit !== 0` abgewiesen werden. Ein Schiff kann mehrmals dieselbe Route versuchen; **keine eindeutigen verlorenen Auftraege**.
- `blockedWithCash`: Davon mit aktuell freier Kasse mindestens fuer die benoetigte Flugreserve. **Nicht** automatisch Deckung aller Wareneinkaeufe oder positive Marge.
- `blockedWithCargo`, `blockedWithCashAndCargo`: Davon mit irgendeiner vorhandenen Ladung. **Keine** bestaetigte Marktnachfrage; getrennt zu interpretieren.
- `dockMinutes`, `lockedWithCargoMinutes`, dieselben Zaehler pro NPC1/NPC2/Spieler.

Keine Preise, Flotten, Löhne, Liquiditaet, Reisen, Signaturen, Save-Daten, RNG oder Ausfuehrungsreihenfolge werden geaendert; der Beobachter ist lesend. Jeder stündliche Hash wird gegen eine vom Beobachter unabhaengige Original-Core-Replayinstanz verglichen, samt Original- und unabhängigen Geld-/Waren-/Escrow-Audits und taeglichen Save/Load-Fortsetzungen.

## Ausfuehrung

```sh
node --test tests/*.test.mjs
node tools/bk11-wirtschaft.mjs --suite=standard --out=/tmp/bk11a-standard.json
node tools/bk11-wirtschaft.mjs --suite=crises --out=/tmp/bk11a-crises.json
```

Im Log: `BK11A_TIMING`, in den JSON-Welten `timing`; darunter `byOwner`. Die auf #137 vorhandene B-K11-CI wird durch den Tool-/Testpfad ausgelöst. **Ergebnisse erst nach tatsaechlicher Ausfuehrung eintragen.** Bis dahin wird kein Test als bestanden und kein Wirtschaftseffekt als verbessert bezeichnet.

## Entscheidungsgate

- **Wenn kaum finanzierte Folgefahrten blockiert sind:** D1 nicht vorschnell als Hauptursache interpretieren; Liquiditaets- und Routenbedingungen getrennt untersuchen.
- **Wenn viele plausibel finanzierbare Folgefahrten blockiert sind:** Isolierte, testseitige Gegenprobe mit mehreren savefesten Flugsegmenten bei einheitlicher stündlicher Endabrechnung entwerfen. Der Empfaengerfonds, exakte Rundung, Original-Arbeitsminuten und Verlustfaelle sind zu bewahren; keine Gratisarbeit, vorgezogene ungesicherte Auszahlung oder neue ISK.
- Erst **nach** positivem Kausaltest erneut 13×90 Tage plus aktive Krisen und Versorgung/Deckungsbeitrag/Ersatzfaehigkeit prüfen. Keine Aktivierung, kein Merge oder Deployment ohne gesonderte Nutzerfreigabe.
