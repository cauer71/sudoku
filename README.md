# Sudoku — Material 3, Variante „Kompakt"

Ein vollständiges Sudoku-Spiel in einer einzigen HTML-Datei. Keine
Abhängigkeiten, kein Build-Schritt, keine Netzwerkaufrufe: `index.html` im
Browser öffnen, fertig.

## Spielen

```
open index.html
```

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
- **Tipps**, Fehlermarkierung, Uhr mit Pause, Bestzeiten je Grad
- **Tastatur** vollständig: Pfeiltasten, 1–9, Umschalt+Ziffer für Notizen,
  0/⌫, N, H, Strg+Z, Leertaste, Esc
- **Spielstand** wird lokal gesichert und beim nächsten Aufruf fortgesetzt

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

Alles liegt in `index.html`: Farb- und Formwerte samt Layout im `<style>`-Block,
Löser, Erzeuger und Spiellogik im abschließenden `<script>`-Block.

`Sudoku Webapp Redesign.zip` ist die Design-Vorlage, aus der diese Fassung
entstanden ist.
