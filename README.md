# Sudoku — Material 3, Variante „Kompakt"

Ein vollständiges Sudoku-Spiel in einer einzigen HTML-Datei. Keine
Abhängigkeiten, kein Build-Schritt, keine Netzwerkaufrufe: `index.html` im
Browser öffnen, fertig. Für die Veröffentlichung auf Cloudflare werden die
Dateien nur in ein eigenes Verzeichnis kopiert — gebaut wird auch dort nichts.

## Spielen

```
open index.html
```

Gehostet: **https://cauer71.github.io/sudoku/**

## Auf Cloudflare veröffentlichen

Vorbereitet für **Cloudflare Workers mit statischen Assets** — die für neue
Projekte empfohlene Betriebsart; Pages ist der ältere Weg.

```bash
npx wrangler login          # einmalig
npm run check               # Konfiguration prüfen, ohne zu veröffentlichen
npm run deploy              # veröffentlichen
npm run dev                 # lokal unter http://127.0.0.1:8787
```

Es wird nichts installiert: die Skripte rufen `npx wrangler@latest` auf. Das
Spiel selbst bleibt ohne Abhängigkeiten.

### Was ausgeliefert wird

Nicht das Wurzelverzeichnis, sondern `dist/` — zusammengestellt von
`tools/collect.mjs` aus einer **Positivliste** von elf Dateien. Das hat zwei
Gründe, beide aus der Praxis:

- Eine Ausschlussliste (`.assetsignore`) hätte bedeutet, dass jede künftig im
  Wurzelverzeichnis abgelegte Datei standardmäßig mit veröffentlicht wird —
  einschließlich `.git`. Die Positivliste dreht das um.
- `wrangler dev` überwacht das Asset-Verzeichnis und legt zugleich `.wrangler/`
  an. Zeigt beides auf dasselbe Verzeichnis, lädt der Server endlos neu.

Die App bleibt im Wurzelverzeichnis, weil GitHub Pages von dort baut. Beide
Wege laufen parallel aus denselben Dateien; kopiert wird nur, nicht gebaut.

### Einstellungen

| Datei | Zweck |
|---|---|
| `wrangler.jsonc` | Name, Asset-Verzeichnis, Fehlerseiten-Verhalten, D1-Bindung |
| `_headers` | Cache-Regeln und Sicherheits-Kopfzeilen |
| `404.html` | eigene Fehlerseite (nutzt auch GitHub Pages) |
| `tools/collect.mjs` | stellt `dist/` zusammen |
| `worker/index.js` | beantwortet `/api/scores` für die Rangliste |
| `schema.sql` | Tabelle der Rangliste |

### Gemeinsame Rangliste (D1)

Datenbank `sudoku-rangliste` (Cloudflare D1, Region Westeuropa), gebunden als
`DB`. Eine Zeile je Name und Grad, immer die beste Zeit; der Worker schreibt
per UPSERT und übernimmt nur, was schneller ist.

```bash
# Schema auf die echte Datenbank anwenden (einmalig)
npx wrangler d1 execute sudoku-rangliste --remote --file schema.sql
```

Der Worker läuft nur für `/api/...`; statische Dateien liefert die Asset-Schicht
weiterhin direkt aus, samt `_headers`. Unbekannte Pfade gibt der Worker an die
Asset-Schicht zurück, die dann `404.html` liefert.

**Was diese Rangliste nicht kann:** Sie hat keine Konten. Wer die Adresse kennt,
kann Zeiten senden — gegen Falscheinträge ist eine offene Rangliste nicht
absicherbar. Geprüft wird, was prüfbar ist: Name 1–24 Zeichen ohne
Steuerzeichen, Grad aus der bekannten Liste, Zeit zwischen 20 s und einem Tag,
Fehler- und Tippzahl 0–999. Namen werden ausschließlich über `textContent`
angezeigt, damit eingesandtes Markup Text bleibt.

Der Name steht im Menü unter *Rangliste*. Ohne Namen wird nichts gesendet. Die
örtlichen Bestzeiten funktionieren unabhängig davon weiter, auch offline und in
der GitHub-Pages-Fassung — dort gibt es die Rangliste einfach nicht.

`not_found_handling` steht auf `404-page`, bewusst **nicht** auf
`single-page-application`: letzteres liefert für jeden unbekannten Pfad
`index.html` mit Status 200 — auch für ein fehlendes Bild, das dann
stillschweigend HTML zurückbekäme. Die App hat ohnehin nur eine Seite.

Kopfzeilen: Icons ein Jahr `immutable`, HTML, Service Worker und Manifest
`must-revalidate` (der Cloudflare-Standard, hier ausdrücklich), dazu `nosniff`,
`Referrer-Policy`, `X-Frame-Options` und eine strenge CSP ohne fremde Quellen —
die schreibt fest, dass die App nichts von außen lädt.

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

### Zwei Icons zur Wahl

Das Betriebssystem bietet beim Installieren keine Auswahl an — es nimmt, was
die aufgerufene Seite vorgibt. Deshalb gibt es zwei Installationsseiten:

| Seite | Icon | startet |
|---|---|---|
| `/` (`index.html`) | blau | im gespeicherten Modus |
| `/julia.html` | rosé | über `./?julia=1` immer im Julia-Modus |

Beide verweisen auf ihr eigenes Manifest; das rosé hat eine eigene `id`, Android
behandelt es also als eigene App. Beide lassen sich nebeneinander installieren.
Der Parameter `?julia=1` bzw. `?julia=0` setzt den Modus verbindlich, damit die
rosé Fassung auch nach geleertem Speicher rosé bleibt.

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

Die **Grad-Pille** ist ein Knopf und öffnet das Menü. Ein Tipp auf einen
**anderen** Grad startet dort sofort ein Rätsel dieses Grades; derselbe Grad
lässt das laufende Spiel in Ruhe, dafür gibt es „Rätsel erzeugen".

**Bestzeit** öffnet ein Fenster mit allen vier Graden. Vorher zeigte der Knopf
nur den Grad des laufenden Spiels, weshalb bereits erspielte Zeiten unsichtbar
blieben, sobald man den Grad gewechselt hatte.

## Ziffernleiste

| Bedienung | Wirkung |
|---|---|
| kurz tippen, Feld gewählt | Zahl eintragen — **danach wird das Feld abgewählt** |
| lang drücken (0,45 s) | Notiz setzen, ohne den Modus zu wechseln; das Feld bleibt gewählt |
| tippen, kein Feld gewählt | alle Vorkommen dieser Ziffer hervorheben (nochmal tippen hebt es auf) |

Die Abwahl nach dem Eintragen ist der Kern: Vorher überschrieb ein Tipp auf eine
andere Ziffer das gerade gefüllte Feld, obwohl man nur hervorheben wollte.

Auf der **Tastatur** bleibt das Feld nach dem Eintragen gewählt — sonst wäre das
Weiterwandern mit den Pfeiltasten unterbrochen. Ohne Auswahl hebt eine Ziffer
dort ebenfalls nur hervor; `Esc` wählt ab.

## Vibration

In den Einstellungen abschaltbar (standardmäßig an). Zwei Stärken: ein kurzer
Stoß (8 ms) für Notizen, ein kräftigerer Doppelstoß für die Zahl. Die
Vibration-API kennt nur Dauern, keine Stärken — „kräftiger" ist deshalb ein
Muster, das sich deutlicher anfühlt.

Android und Chrome unterstützen `navigator.vibrate`. **Safari auf iOS nicht**:
Apple stellt Webseiten keine Haptik-Schnittstelle bereit. Als Behelf löst ab
iOS 17.4 ein verborgener Umschalter eine System-Haptik aus; ob das auf einem
bestimmten Gerät greift, ist nicht zugesichert. Schlägt es fehl, bleibt das
Spiel unverändert bedienbar.

## Beim Gewinnen

Ein kurzes Feuerwerk auf einer Leinwand über der Seite, dazu die Welle über das
Gitter. Die Farben kommen aus der laufenden Palette, im Julia-Modus ist es also
rosé; Rot ist bewusst nicht dabei, weil es im Spiel „Fehler" bedeutet. Bei
`prefers-reduced-motion` entfällt beides.

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
