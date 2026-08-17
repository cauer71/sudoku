# Sudoku — Material 3, Variante „Kompakt"

Ein vollständiges Sudoku-Spiel in einer einzigen HTML-Datei. Keine
Abhängigkeiten, kein Build-Schritt, keine Netzwerkaufrufe: `index.html` im
Browser öffnen, fertig.

## Spielen

```
open index.html
```

Gehostet: **https://cauer71.github.io/sudoku/**

## Installieren

Die gehostete Fassung ist eine installierbare Web-App und läuft danach offline
und ohne Browserleisten, mit eigenem Icon auf dem Startbildschirm.

- **iPhone/iPad (Safari):** Teilen-Symbol → *Zum Home-Bildschirm*
- **Android (Chrome):** Menü ⋮ → *App installieren* (oder der Hinweis, der von
  selbst erscheint)
- **Desktop (Chrome/Edge):** Installieren-Symbol in der Adressleiste

Dazu gehören `manifest.webmanifest`, der Service Worker `sw.js` (macht die App
offline verfügbar) und die Icons unter `icons/`. Die Farbe der Systemleisten
folgt zur Laufzeit dem Papiergrund, also hell/dunkel und dem Julia-Modus.

Das Icon zeigt dasselbe Motiv wie das Spiel: ein 3×3-Gitter mit einem
hervorgehobenen Feld, in `#2b5db0` und `#d9e2ff` aus der M3-Palette. Es liegt in
192, 512 (`any`), 512 (`maskable`, Inhalt innerhalb der mittleren 80 % für die
Adaptivformen von Android), 180 für iOS sowie 32 und 16 als Favicon vor.

> Die Artefakt-Veröffentlichung ist eine einzelne HTML-Seite und kann keine
> Manifest-, Icon- und Worker-Dateien mitbringen; installierbar ist deshalb nur
> die gehostete Fassung. Der Bauschritt für das Artefakt entfernt die
> PWA-Verknüpfungen, was zugleich die Worker-Anmeldung abschaltet.

## Gestaltung

Umsetzung der Variante **1c „Kompakt"** aus dem Design-Projekt
*Sudoku Webapp Redesign* — Material 3 Expressive, Farbschema aus dem Seed
`#1E4FA6`, hell und dunkel nach Systemeinstellung. Dichte Geometrie, kleine
Radien, neutrale Ziffern-Tasten.

Alle 26 verwendeten Farbrollen und die Formwerte der Variante sind aus der
Vorlage übernommen und werden gegen sie geprüft (`fidelity`-Prüfung).

Drei Dinge weichen bewusst ab, damit die Datei eigenständig bleibt — die
Artefakt-Veröffentlichung erlaubt keine externen Hosts, und das Spiel soll
auch offline laufen:

| Vorlage | hier |
|---|---|
| Roboto Flex von Google Fonts | `Roboto, system-ui, …` — Roboto wo vorhanden, sonst Systemschrift |
| Material Symbols Rounded (Icon-Font) | 12 Inline-SVG-Icons |
| `material-web` (`md-filled-button`, `md-text-button`, `md-switch`) | als M3-Bauteile nachgebaut |

Zusätzlich: Die Vorlage setzt die Palette per JavaScript aus
`prefers-color-scheme`. Hier liegt sie in CSS-Variablen mit den drei Zuständen
hell / dunkel / Systemvorgabe, damit die Darstellung auch dann stimmt, wenn die
Umgebung ein Theme am Wurzelelement vorgibt.

## Julia-Modus

In den Einstellungen lässt sich der **Julia-Modus** einschalten: dasselbe Spiel
in Rosé. Die Akzentfarben sind nicht erfunden, sondern die in der Vorlage
angelegte, dort aber ungenutzte `tertiary`-Rolle — unverändert auf die
`primary`-Rollen gelegt:

| Rolle | hell | dunkel |
|---|---|---|
| `primary` ← `tertiary` | `#725572` | `#e0bbdd` |
| `primary-container` ← `tertiary-container` | `#fdd7fa` | `#593d5a` |

Ergänzt sind nur die Neutraltöne und der Papiergrund, im selben Farbton (~300°).
Weil `tertiary` weit vom Rot des Fehlerzustands entfernt liegt, bleiben gewählte
und falsche Zelle klar unterscheidbar (ΔE 20 hell, 63 dunkel). Alle
Text-auf-Fläche-Paare erreichen mindestens WCAG AA (4,5:1; Notizen 3:1).

Die Einstellung wird lokal gespeichert und gilt in Hell wie Dunkel. Umgesetzt
über `data-mode="julia"` am Wurzelelement, damit auch der Seitengrund mitwechselt.

## Aufbau der Oberfläche

Kopfzeile mit Pause und Menü · drei Kennzahlen-Pillen (Zeit, Fehler, Grad) ·
Spielfeld · Bedienteil mit den Ziffern 1–9 in einer Reihe und sechs Werkzeugen
(Notizen, Löschen, Tipp, Zurück, Vor, Bestzeit). Schwierigkeitswahl,
Einstellungen und Tastaturhilfe liegen im Menü-Blatt, das von unten einfährt.

## Spiel

- **Rätselerzeugung im Browser.** Ein zufälliges vollständiges Gitter wird per
  Backtracking gefüllt; anschließend werden einzeln so lange Zahlen entfernt,
  wie die Lösung nachweislich eindeutig bleibt (Lösungszähler mit Abbruch bei
  zwei Treffern, Kandidatenauswahl nach kleinster Restmenge). Ohne
  Symmetrievorgabe, damit das Vorgabenmuster keine erkennbare Struktur hat.
- **Vier Schwierigkeitsgrade**, eingestuft über die tatsächlich nötige
  Lösetechnik, nicht nur über die Anzahl der Vorgaben:

  | Grad | Vorgaben | Bedingung |
  |---|---|---|
  | Leicht | ~45 | allein mit nackten Einern lösbar |
  | Mittel | ~36 | mit nackten und versteckten Einern lösbar |
  | Schwer | ~30 | nackte Einer reichen nicht |
  | Experte | ~25 | Einer-Techniken reichen nicht |

- **Notizen** (Kandidaten) mit automatischer Bereinigung in Zeile, Spalte, Block
- **Rückgängig/Wiederholen** über die ganze Partie, inklusive Fehler- und Tippzähler
- **Tipps**, Uhr mit Pause, Bestzeiten je Grad
- **Fehleranzeige** in zwei Rollen, siehe unten
- **Tastatur** vollständig: Pfeiltasten, 1–9, Umschalt+Ziffer für Notizen,
  0/⌫, N, H, Strg+Z, Leertaste, Esc
- **Spielstand** wird lokal gesichert und beim nächsten Aufruf fortgesetzt

## Fehleranzeige

Zwei Rollen, klar getrennt:

| | Darstellung |
|---|---|
| **die falsch gesetzte Zahl** — weicht von der Lösung ab | rote Ziffer, roter Rahmen, blitzt eine Sekunde lang dreimal auf; der Rahmen bleibt bis zur Berichtigung |
| **die Ursachen** — dieselbe Zahl steht schon in Zeile, Spalte oder Block | rot hinterlegt, Ziffer in normaler Schriftfarbe; bleibt bis der Fehler behoben ist |

Die Zuordnung ist eindeutig: von zwei gleichen Zahlen in einer Einheit kann nur
eine zur Lösung passen. Beide Markierungen ergeben sich aus dem Brettzustand und
verschwinden von selbst, sobald berichtigt wurde.

Die Rahmenregel steht im Stylesheet **nach** der Auswahlregel. Das ist keine
Kosmetik: die gerade gesetzte Zahl steht immer in der gewählten Zelle, und dort
gewann sonst die Farbe der Auswahl — die falsche Zahl war deshalb nie rot.

Ohne die Einstellung *Falsche Eingaben sofort markieren* kennt das Spiel kein
„falsch" gegenüber der Lösung. Dann werden nur Regelverstöße angezeigt: beide
Seiten einer doppelten Zahl werden rot hinterlegt, ohne Rahmen und ohne Blitzen.

## Spielstand

Das laufende Spiel wird auf dem Gerät gespeichert und beim nächsten Aufruf
fortgesetzt — Brett, Notizen, Fehlermarkierungen, verstrichene Zeit, Fehler- und
Tippzähler, Schwierigkeitsgrad und die gewählte Zelle. Gesichert wird nach jedem
Zug, alle zehn Sekunden und beim Verlassen der Seite. Bestzeiten und
Einstellungen liegen daneben.

Gespeichert wird in `localStorage`, also lokal und ohne Konto; es wird nichts
übertragen und nichts zwischen Geräten abgeglichen. Zusätzlich bittet die App
über `navigator.storage.persist()` darum, den Speicher nicht unter Speicherdruck
zu verwerfen — für installierte Web-Apps wird das in der Regel gewährt.

## Am Handy

Alles passt in eine Bildschirmhöhe, es wird nicht gescrollt. Die Brettgröße
wird zur Laufzeit aus der freien Fläche berechnet und bei Drehung,
Größenänderung und ein-/ausfahrender Browserleiste nachgeführt. Geprüft von
320×480 bis 430×790.

Das Querformat ist in der Vorlage nicht vorgesehen; hier wandert das Bedienteil
neben das Brett und die Ziffern zurück ins 3×3-Feld, damit es spielbar bleibt.
Bei sehr flacher Nutzhöhe (unter etwa 320 px) werden die Zellen dabei
zwangsläufig klein — rund 22 px.

Auf breiten Schirmen bleibt es dieselbe zentrierte Spalte; das Brett wird auf
660 px begrenzt. Ein eigenes Desktop-Layout ist in der Vorlage als möglicher
nächster Schritt vermerkt, aber nicht Teil von 1c.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | alles zum Spiel: Farb- und Formwerte samt Layout im `<style>`-Block, Löser, Erzeuger und Spiellogik im `<script>`-Block |
| `manifest.webmanifest` | Name, Icons, Startadresse, Vollbild-Betrieb |
| `sw.js` | Service Worker: Seitenaufrufe erst Netz dann Cache, übrige Dateien erst Cache dann Netz |
| `icons/` | sechs PNG-Größen für iOS, Android und Favicon |

`Sudoku Webapp Redesign.zip` ist die Design-Vorlage, aus der diese Fassung
entstanden ist.
