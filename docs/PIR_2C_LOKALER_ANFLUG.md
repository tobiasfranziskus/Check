# PIR-2c – finanzierte lokale Anflugphase, Geometrieprobe [DRAFT]

**Nutzerfreigabe 23.11.2026:** „Freigaben für fertiges und geplantes erteilt“. Im Kontext der vorangegangenen PIR-2b-Empfehlung ist die Entwicklung der echten lokalen Tor-/Dockphase im isolierten Forschungsprofil und der angekündigten PIR-Folgestufen freigegeben. [Freigabevermerk #598](https://github.com/tobiasfranziskus/Check/pull/598#issuecomment-7113173063). Die Prüf- und Veröffentlichungs-Gates bleiben bestehen; keine pauschale Freigabe beliebiger Geldemission, unfinanzierter Schäden oder neuer Wirtschaftsparameter.

Basis #598 `ab9d5c23201e102d53a16b070e9b09f4b9dfea31`. [PIR-2b gezielte CI](https://github.com/tobiasfranziskus/Check/actions/runs/45259709898/job/137990882904): 3/3 Tests, 50 Eis (250 ISK Referenzwert) bei Weltminuten 176/177 mit 4/3 Minuten Transitrest; Folgen abgelehnt. Originalgebühr 240, Lohn 120 ISK, Endhash `c95c460b92a6d6f0`.

## Erste ausführbare Entwicklungsprobe

Der Originalflugkern wird an einem geklonten tatsächlichen F4-Kontakt eingesetzt. Kandidaten für Nadir-Torkoordinaten (96k, 144k, 192k, 240k, 320k Punkte; zwei Startkurse) werden innerhalb von exakt 240 bestehenden Flugschritten jeweils ohne/mit originalem Folgen geprüft. Erfasst werden echte Dockzeit, Standortänderung, minimale Distanz während beider freier Flugkörper, Folgezeit, Zielverlust und deterministische Wiederholung. Das ist eine isolierte Testgeometrie, kein gültiger importierbarer Weltzustand und kein Nachweis einer neuen produktiven Ankunftsregel. Kein Aufruf eines Wirtschaftsticks, keine Zusatzbuchung, keine zweite produktive Uhr. Der Originalzustand und dessen Export bleiben unverändert. Die Matrix verlangt mindestens einen erfolgreichen Flug und mindestens einen zu langen Flug.

## Danach zu implementieren

Nur eine belegte erreichbare Torkoordinate auswählen. Vor dem echten Einsatz innerhalb des bestehenden Wirtschaftsminuten-Takts müssen F4-Ankunft, Flugkörper-Synchronisation und Audit gemeinsam verändert werden: der Originalvertrag behält Fracht und beide Reserven; die letzten bereits bezahlten Minuten führen den vorhandenen Körper physisch zum Dock; Dockzustand ist echte Vorbedingung der Annahme. Falls die Ankunft nicht erreicht wird, nicht im Produkt aktivieren, bevor die autorisierte Unterbrechungs-/Restlohnregel implementiert und geprüft ist. Keine öffentliche Abkürzung, kein freier Befehl an Vertragsfrachter. Bestehendes PIR-1-Profil und reguläre Saves schützen. Keine neue KI-Verfolgung in der Geometrieprobe; echte Abfangbewegung und spätere Schäden/Beute/Eskorte separat im freigegebenen Strang entwickeln.

#599 (öffentlicher Einstieg) bleibt getrennt; keine UI-Datei in diesem PR. P0 #586 übernimmt die konsolidierte Status-/Roadmappflege. Eigene CI noch nicht ausgeführt.
