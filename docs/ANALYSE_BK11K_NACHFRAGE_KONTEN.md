# B-K11k – Reale Einkommens- und Nachfragekonten nach dritter Teillieferung

**[ANALYSE/DRAFT · 03.11.2026]** auf [B-K11j #148](https://github.com/tobiasfranziskus/Check/pull/148) gestapelt; historischer isolierter R15/Schema9-Testkern aus #146/#147. `main b4e604d6` (Regel14/Schema8) bleibt unberührt. Keine Geld-, Preis-, Lohn-, Produkt-, Migrations- oder Emissionsregel.

## Fragestellung

Der B-K11j-Pfad hat zwei volle bezahlte 24er-Lieferungen und eine echte dritte Teillieferung (Seed42:14, Seed7:17), danach **40/38 ISK** am Aldera-Haushaltskonto. Ein weiteres Nahrungsstück zu 54 ISK kann nicht aus diesem Konto vorfinanziert werden. Nadir hat zugleich Lohnempfänger auf eigenem Haushaltskonto; die Geldquelle erreicht den Käufer nicht automatisch.

B-K11k startet bei exakt den zwei letzten realen B-K11j-Save-Hashes nach der dritten Teillieferung. Verglichen werden **zwei reale Core-Verläufe mit denselben Regeln und identischem Start-Save**:

- **A [KONTROLLE]** NPC-Händler bleiben nach den historischen Einzelauftragstests angehalten. Ohne zusätzliche Spieleraktion wird die Welt für 48 Stunden fortgesetzt.
- **B [GEGENPROBE]** Nur vorhandene, zuvor in den Tests angehaltene NPC-Frachter erhalten ihren bestehenden Auftrag `handeln` zurück. Sonst keine Regeländerung oder zusätzliche Zahlung. Gleicher Zeithorizont.

Je Akteur wird der reale Anfangs-/Endkontostand und die gebuchte Erlös-/Kostenänderung dokumentiert (Haushalte Aldera/Nadir, Stationen, Händler, Fonds); dazu tatsächliche NPC-Käufe/Verkäufe/Flüge, Endverbrauch, früheste erneute Käuferfinanzierbarkeit, gesamtes ISK-Angebot und unabhängige Core-Geld-/Warenaudits plus Save/Load.

**Begrenzung:** Das testweise Wiedereinschalten bestehender NPC-Autohandelsaufträge aus dem isolierten Einzelauftrag-Save ist keine vollständige unbeeinflusste Normalwelt. Für dieses breitere Handelsfenster wird die strenge Nadir-*Einzelminer*-FIFO-Hookprüfung deaktiviert, nicht aber die unabhängigen Core- und Herkunfts-/Geldaudits; B-K11j-Einzelaufträge reproduzieren ihre alten Referenzhashes unverändert.

**Teststatus:** Noch nicht ausgeführt bzw. CI nicht verifiziert. Keine Zahlen als bestanden ausgeben.

Kein Merge, kein Deploy und keine Produktentscheidung. Geldmodell B bleibt separat genehmigungspflichtig.
