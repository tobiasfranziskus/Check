# J7 – Original-Regel195 → Regel204: streng geprüfte Übergabekette

**[DRAFT / 15.11.2026]** Ausgangspunkt: **main `2556e727ceb748c4c5699be9bb5aa1928674593f`**. Keine Änderung an bestehender Regel195- oder Regel204-Implementierung. Keine Save-/HTML-/Root- oder NAS-Änderungen.

## Entdeckte und wiederverwendete Originalfunktionen

Die bestehende `prototypes/welt/welt-kern.js` implementiert **bereits** eine sequenzielle, explizite und eigenständig prüfende Forschungskette:

`ausRegel195` (195→199, mit unabhängiger 195-Audit- und Geld-/Waren-/Schiffs-/RNG-Erhaltungsprüfung) → `ausRegel199K7` (199→200, nur bei ausreichender Vertragsfreiheit) → `ausRegel200J2b` (200→201, keine fiktiven Siliziumvorräte) → `ausRegel201J3` (201→202, keine fiktiven Bauteile) → `ausRegel202J4b` (202→203, keine fiktiven Jäger) → `ausRegel203J4c` (203→204).

Das neue Browser-/Node-Modul `prototypes/verbund/kompatibilitaet.js` ruft **nur diese bereits vorhandenen Funktionen** auf und erstellt für jeden Schritt einen unveränderlichen Prüfbericht. Zusätzlich kontrolliert es ohne neue Wirtschaftsbuchung das Weltgeld, jedes bestehende Konto, jede Hülle mit Eigentum/Ladung/System/Phase, jedes bestehende Stationslager, die alten Warenledger, RNG, Tick und nächste Schiffs-ID. Jeder Schritt wird über den originalen Welt-Core auditiert. Bei der ersten Abweichung wird der genaue Schritt mit Original-Fehlermeldung zurückgegeben.

**Keine Mutation** des vom Nutzer gelieferten 195-JSON, kein Überschreiben einer geladenen Welt, keine automatische Datenspeicherung oder Migration. Das Modul erzeugt ausdrücklich **noch keinen 204-Download** und keine Player-Session. Damit kann ein ungeprüfter Altspielstand nicht als eine neue Welt geladen werden.

Ein Regel195-Stand besitzt **keinen Jäger-Kaufbeleg**. Nach einer erfolgreichen technischen Kette ist deshalb **kein kostenloser Jäger und kein unmittelbarer Zugang zum bisherigen Jägercockpit** erlaubt. Eine künftig spielbare Übernahme braucht ein zunächst unbemanntes, einheitliches Regel204-Konzernspiel mit vorhandenen legitim finanzierten Miner-/Frachtoperationen und anschließend im Spiel regulär finanzierter Jägerproduktion; hierfür erst nach Nachweis und Freigabe die separate UI entwickeln.

**Abnahme:** `tests/j7-regel195-uebernahme.test.mjs` überprüft den echten Rule195-Session-Export, sämtliche Stufen, Hash- und Geldneutralität, Wiederholung, beschädigte Quelldaten und eine eigene finanzierte Altaktion. Vollständige Node22-, Root-/Speicher- und Browsergates im PR überprüfen; **keine Testergebnisse behaupten, bevor ausgeführt**.

**Noch kein Produkt-Merge oder Pages-Deploy.** Ein übertragener 204-Save ist kein gleicher wirtschaftlicher Zustand wie die parallel weiterlaufende Regel195-Rootwelt; die künftige Spielwelt darf nur *eine* davon autoritativ verwenden.
