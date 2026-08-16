# Sudoku — Tinte & Raster

Ein vollständiges Sudoku-Spiel in einer einzigen HTML-Datei. Keine Abhängigkeiten,
kein Build-Schritt, keine Netzwerkaufrufe: `index.html` im Browser öffnen, fertig.

## Spielen

```
open index.html
```

## Was drin ist

- **Rätselerzeugung im Browser.** Ein zufälliges vollständiges Gitter wird per
  Backtracking gefüllt; anschließend werden so lange Zahlen entfernt, wie die
  Lösung nachweislich eindeutig bleibt (Lösungszähler mit Abbruch bei zwei
  Treffern, Kandidatenauswahl nach kleinster Restmenge).
- **Vier Schwierigkeitsgrade**, die über die tatsächlich nötige Lösetechnik
  eingestuft werden, nicht nur über die Anzahl der Vorgaben:

  | Grad | Vorgaben | Bedingung |
  |---|---|---|
  | Leicht | ~45 | allein mit nackten Einern lösbar |
  | Mittel | ~36 | mit nackten und versteckten Einern lösbar |
  | Schwer | ~30 | nackte Einer reichen nicht |
  | Experte | ~25 | Einer-Techniken reichen nicht |

  Die Zahlen werden einzeln in zufälliger Reihenfolge entfernt — ohne
  Symmetrievorgabe, damit das Vorgabenmuster keine erkennbare Struktur hat.

- **Notizen** (Kandidaten) mit automatischer Bereinigung in Zeile, Spalte und Block
- **Rückgängig/Wiederholen** über die gesamte Partie, inklusive Fehler- und Tippzähler
- **Tipps**, Fehlermarkierung, Uhr mit Pause, Bestzeiten je Schwierigkeitsgrad
- **Tastatursteuerung** komplett: Pfeiltasten, 1–9, Umschalt+Ziffer für Notizen,
  N, H, Strg+Z, Leertaste
- **Spielstand** wird lokal gesichert und beim nächsten Aufruf fortgesetzt
- Helles und dunkles Erscheinungsbild

## Am Handy

Hoch- wie Querformat passen vollständig in eine Bildschirmhöhe — es wird nicht
gescrollt. Im Hochformat stehen die Ziffern 1–9 als durchgehende Reihe unter dem
Brett, im Querformat wandert das Bedienteil als 3×3-Feld neben das Gitter.
Schwierigkeitswahl, Einstellungen und Hilfe liegen hinter dem Menü und fahren
als Blatt von unten ein.

Die Brettgröße wird zur Laufzeit aus der freien Fläche berechnet und bei
Drehung, Größenänderung und ein-/ausfahrender Browserleiste nachgeführt.
Geprüft von 320×480 bis 430×790 sowie im Querformat.

## Aufbau

Alles liegt in `index.html`: Tokens und Layout im `<style>`-Block, Löser,
Erzeuger und Spiellogik im abschließenden `<script>`-Block. Die Datei ist
bewusst ohne externe Ressourcen gehalten, damit sie auch offline und in
restriktiven Umgebungen läuft.
