# P3 – Mehrschiff-Auswahl für echte Werftfrachter

**[DRAFT · 18.11.2026]** Integrationskandidat gegen `main 56ee225`. Nur Darstellung und Nachweis: keine Preis-, NPC-, Waren-, Lohn-, Eigentums-, Flug-, Speicher- oder Regeländerungen.

Bei mehreren vom Spieler tatsächlich bezahlten und im Original-W5-Fertigungsjournal verzeichneten Hüllen zeigt Kapitel 06 jetzt eine touchfähige Auswahl mit Schiff-ID, Originalort, Phase und aktuellem Schiffsbuchwert. Die Auswahl steuert die bereits existierenden Überführungs-, F4-Fracht- und persönlichen Cockpit-Buttons. Der Originalkern validiert bei **jedem Klick erneut** Schiffseigentum, Werft-Herkunft, echte Käuferfinanzierung, bezahlte Überführung, freien Dockplatz und Pilotenfreigabe. Die UI-Merker-Variable wird bei Karrierestart/-laden zurückgesetzt; ein ungültiger Schiff-ID-Wunsch wird nicht akzeptiert. Kein zusätzliches Feld in JSON-Save/Load oder localStorage, kein stiller Defaultwechsel nach dem Kauf einer zweiten Hülle.

**Default ohne Nutzerauswahl:** Ein tatsächlich in Aldera angedockter eigener W5-Frachter wird bevorzugt; eine noch in Nadir befindliche zuletzt gebaute Hülle verdrängt damit nicht mehr automatisch den einsatzfähigen eigenen Frachter. Der Nutzer kann die Nadir-Hülle gezielt für die originale 60-ISK-Überführung anwählen und anschließend wieder auf den arbeitenden Aldera-Frachter wechseln.

**Abnahme-Gates:** Node22 (Geld-/Waren-/Eigentums-/Herstellungs-/Save-/Manipulationsaudits), realer Original-S02-Nachweis von zwei eigenen W5-Schiffen, Browser-Hauptkarriere Chromium/WebKit in vier Touchgrößen, Touch-Auswahl/Wechsel ohne Save-Mutation, fortbestehender Einzelschiff-Pfad und Root-/NAS-Sicherheit. Vor dem erfolgreichen End-to-End-Test kein Merge/Pages. Echtes iPad Safari/NAS weiterhin offen.
