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

### Das Icon

Ein Sudoku-Brett: 3×3-Block, das Mittelfeld noch frei, dünne Gitterlinien, kein
Rahmen. Die Ziffern tragen **zwei Tinten, dieselben wie im Spiel** — schwarz für
Vorgaben, die Markenfarbe für eigene Zahlen. Das Icon zeigt damit dasselbe wie
das Brett: ein Rätsel im Gange, nicht ein Symbol dafür.

**Ziffern** sind das, woran man Sudoku erkennt; ein leeres Gitter sieht wie eine
Tabelle aus. Deshalb bleiben sie in jeder Größe drin — bei 16 px sind sie nicht
mehr zu lesen, aber als Ziffernform noch zu sehen, und das ist mehr, als ein
leeres Gitter dort hergibt. Die vier eigenen Zahlen liegen unsymmetrisch;
gleichmäßig verteilt sähe es nach Muster aus, nicht nach Rätsel.

Die Maße sind an einem Vorbild **gemessen**, nicht geschätzt (Icon eines
Play-Store-Sudokus, 164 px im Screenshot):

| | gemessen |
|---|---|
| Grund | `#e6e6e6`, randlos — der Rand hat dieselbe Farbe wie die Felder, deshalb sieht man ihn nicht als Rahmen |
| Rand | ~7 % der Kantenlänge |
| Zelle | 28,6 % |
| Linie | ~1,2 px = 0,73 %, Farbe ~`#7b7b7b` — ein richtiges Mittelgrau |
| Ziffernhöhe | 68 % der Zelle |
| Strichstärke | 6,4 % der Zelle — das ist ein Regular, keine fette Schrift |

Genau diese drei Dinge hatten die Vorgänger falsch: zu blasse Linien, zu fette
Ziffern, und ein Grund, der sich vom Rand unterschied und damit doch wieder wie
ein Rahmen aussah.

Zwei Werte sind bewusst nicht übernommen: Grund und Linie kommen aus der Palette
der App (`surface-container-highest` und `outline`), die dem Gemessenen bis auf
wenige Stufen entsprechen. So bleibt das Icon an dieselben Farbwerte gebunden
wie die Oberfläche. Dazu eine gemessene Korrektur: `dominant-baseline: central`
setzt die Ziffer in dieser Schrift 4,3 % der Feldhöhe zu hoch.

Unter 32 px trägt ein Regular nicht mehr — die Striche wären dünner als ein
Bildpunkt. Die Favicons bekommen deshalb den fetten Schnitt.

Die beiden Fassungen unterscheiden sich an der **Tinte der eigenen Zahlen** und
an einer Tönung des Grundes. Ein farbiger Rahmen wäre deutlicher, ist aber genau
das, was an den Vorgängern gestört hat. Blau ist `--primary` der App. Rosé liegt
im Farbton der tertiary-Rolle, aber satter (`#a3418f` statt `#725572`): die Rolle
selbst liest sich bei 44 px als dunkles Grau-Mauve, und dann ist nicht zu sehen,
dass es das rosa Icon ist. Die Oberfläche im Julia-Modus behält die Werte der
Vorlage unverändert; nur das Icon ist aufgehellt, weil es eine andere Aufgabe
hat.

Geprüft wird der Unterschied nicht an einer festen Bildstelle, sondern als
Mittel über alle **farbigen** Bildpunkte: Grau und Schwarz fallen heraus, übrig
bleibt die Tinte. Gemessen liegen die beiden 124 auseinander (blau 49/97/178,
rosé 165/69/146).

Größen: 192, 512 (`any`), 512 (`maskable`), 180 für iOS, dazu 32 und 16 als
Favicon. Erzeugt mit `node tools/make-icons.mjs` (braucht Playwright, nur zum
Erzeugen).

#### maskable: „mittlere 80 %" heißt nicht, das Bild zu schrumpfen

Android beschneidet das maskable-Icon auf eine eigene Form, im schlimmsten Fall
einen Kreis über die mittleren 80 %. Ich hatte das erst gelesen als „das ganze
Quadrat muss in den Kreis passen" und das Brett auf 56 % verkleinert, den Rest
mit der Markenfarbe gefüllt. Ergebnis: der breite farbige Ring, den Android beim
Installieren zeigte — und der gefiel niemandem.

Verlangt ist nur, dass **nichts Wichtiges beschnitten** wird. Der Grund darf bis
an die Kante laufen; allein die Tinte muss im Kreis liegen. maskable und
normales Icon unterscheiden sich deshalb nur noch im Abstand des Gitters zur
Kante: 18 % statt 7 %.

Maßgeblich ist die Ecke der äußeren Ziffer — waagrecht 0,247 der Zelle (halbe
Ziffernbreite), senkrecht 0,16 (halbe Ziffernhöhe). Der Rechnung wird aber nicht
geglaubt: die `maskable`-Prüfung tastet die fertigen PNG ab und misst, wie weit
die äußerste Farbabweichung vom Grund von der Mitte entfernt liegt.

| gemessen | |
|---|---|
| maskable | weiteste Tinte bei 0,386 — erlaubt sind 0,400 |
| | und mindestens 0,33, damit das Motiv den Kreis auch nutzt |
| normal | 0,518 — die werden nicht beschnitten und dürfen mehr füllen |
| beide | Grund an allen Kanten gleich der Feldfarbe, also kein Ring |

Die Adressen der Icons tragen die Fassungsnummer als `?v=…`. Cloudflare liefert
`/icons/*` mit `immutable` und einem Jahr Haltbarkeit aus — eine neue Zeichnung
unter der alten Adresse käme bei niemandem an, der die App schon hat.
`npm run collect` bricht ab, wenn eine Icon-Adresse die Marke nicht trägt.

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

**Im Menü** steht dafür eine Gruppe *Als App installieren*. Sie sagt, welches
Icon gerade dran ist, und bietet den passenden Weg an:

- Julia-Modus **aus** → das Browser-Angebot auf dieser Seite (blaues Icon);
  bietet der Browser nichts an, steht die Anleitung für iPhone und Android da.
- Julia-Modus **an** → der Knopf führt auf `/julia.html`, wo das Rosé-Manifest
  von der ersten Zeile an im Quelltext steht. Dort gibt es denselben Knopf.
- Läuft die App schon installiert, verschwindet die Gruppe.

Zusätzlich wandern `<link rel="manifest">` und `<link rel="apple-touch-icon">`
mit dem Julia-Schalter mit. Das repariert den Weg über das Browser-Menü: vorher
zeigten beide fest auf die blaue Reihe, wer also im Julia-Modus installierte,
bekam trotzdem das blaue Icon. Auf iOS greift das sicher — dort wird das
apple-touch-icon beim Ablegen aus der Seite gelesen. Ob Android ein
nachgeschobenes Manifest immer aufgreift, ließ sich hier nicht prüfen; darum
führt der rosé Weg über die eigene Seite und verlässt sich nicht darauf.

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

Ganz unten im Menü steht die **Fassungsnummer** — damit sich sagen lässt, welche
Fassung auf einem Gerät gerade läuft.

## Ziffernleiste

| Bedienung | Wirkung |
|---|---|
| kurz tippen, gewähltes Feld **leer** | Zahl eintragen; richtig → Feld abwählen und die Ziffer hervorheben, falsch → Feld bleibt gewählt |
| kurz tippen, gewähltes Feld **fertig** | nichts eintragen, sondern **alle Vorkommen dieser Ziffer hervorheben** — und das Feld abwählen |
| kurz tippen, gewähltes Feld **falsch** | Zahl ersetzen; dieselbe Ziffer nochmal löscht sie |
| lang drücken (0,45 s) | Notiz setzen, ohne den Modus zu wechseln; das Feld bleibt gewählt |
| tippen, kein Feld gewählt | alle Vorkommen dieser Ziffer hervorheben |

Nochmal dieselbe Ziffer schaltet eine Hervorhebung wieder aus. Die Taste der
hervorgehobenen Ziffer trägt einen Ring, damit zu sehen ist, welche gerade aktiv
ist.

**Beim Hervorheben fällt die Auswahl weg.** Zuerst blieb das Feld gewählt — dann
liegen aber sein Rahmen und die Schattierung seiner Zeile, Spalte und seines
Blocks über der Hervorhebung, und man sieht nicht mehr, worum es geht: zwei
Auskünfte auf einmal, von denen man nur eine wollte. Hervorheben heißt jetzt:
nur diese Ziffer, sonst nichts. Die Pfeiltasten stören sich daran nicht — ohne
Auswahl greift `move()` auf die letzte Position zurück.

**Fertig** heißt: die Zahl steht nicht mehr zur Debatte — eine Vorgabe, ein
aufgedeckter Tipp oder eine Zahl, welche die Fehlerprüfung als richtig kennt.
Dort trägt die Leiste nichts ein. Das war zweimal gewünscht: erst als Schutz vor
dem versehentlichen Überschreiben, dann als Wunsch, auf einem solchen Feld die
Vorkommen einer Ziffer sehen zu können. Ändern lässt sich eine fertige Zahl
weiterhin — nur nicht mit einem einzigen Tipp: erst *Löschen*, dann neu.

Ist die **Fehlerprüfung abgeschaltet**, bleibt eine eigene Zahl änderbar. Sonst
verriete schon die Reaktion der Leiste, ob sie richtig ist, und genau das soll
die abgeschaltete Prüfung ja verbergen. Vorgaben und Tipps heben trotzdem hervor,
denn dort ist nichts zu verraten.

Die Abwahl nach einer richtigen Eingabe ist älter: vorher überschrieb ein Tipp
auf eine andere Ziffer das gerade gefüllte Feld, obwohl man nur hervorheben
wollte. Nach einer **falschen** Zahl wäre dieselbe Abwahl aber im Weg — man
müsste das rote Feld erst wieder antippen, um zu berichtigen. Es bleibt daher
gewählt, und die Zelle zeigt beide Rahmen: außen den roten Fehlerrahmen, innen
den Auswahlrahmen.

Der Schalter **Gleiche Zahlen hervorheben** regelt nur das automatische
Hervorheben, das vom gewählten Feld ausgeht. Eine ausdrücklich angetippte Ziffer
wird immer gezeigt — wer sie antippt, will sie sehen.

## Menü-Blatt

Das Blatt fährt von unten ein und geht auf vier Wegen wieder zu: **nach unten
wegwischen**, Menüknopf, Tippen auf die Abdunklung, `Esc`.

Die Wischgebärde hat drei Fallen, und alle drei sind geprüft:

- Das Blatt **scrollt selbst**. Gezogen wird nur, wenn es schon ganz oben steht;
  sonst gehört die Bewegung dem Scrollen.
- Ein Zug, der **auf einem Schalter beginnt**, darf ihn nicht umschalten. Nach
  einem Zug über die Schwelle (10 px) wird der folgende Klick in der
  Aufnahmephase verworfen. Ein Tipp schaltet weiterhin um.
- Am Griff liegt `touch-action: none`. Sonst kann der Browser die Gebärde mitten
  im Zug als Scrollen beanspruchen und schickt ein `pointercancel`.

Geschlossen wird ab 90 px Zug oder ab einem schnellen Wisch (0,5 px/ms) — sonst
federt das Blatt zurück.

Auf der **Tastatur** bleibt das Feld nach dem Eintragen gewählt — sonst wäre das
Weiterwandern mit den Pfeiltasten unterbrochen. Ohne Auswahl und auf einem
fertigen Feld hebt eine Ziffer dort ebenso nur hervor; `Esc` wählt ab.

## Vibration

In den Einstellungen abschaltbar (standardmäßig an). Zwei Stärken:

| Anlass | Muster |
|---|---|
| Zahl eintragen | `[35, 30, 35]` ms — zwei satte Stöße |
| Notiz setzen, Ziffer hervorheben | `18` ms — ein kurzer Tick |

Die Vibration-API kennt nur Dauern, keine Stärken — „kräftiger" ist deshalb ein
Muster, das sich deutlicher anfühlt.

Die erste Fassung hatte 8 ms für den Tick und zwei Stöße von 16 ms für die Zahl.
**Das war zu kurz.** Ein Vibrationsmotor braucht einige Millisekunden, bis er
anläuft, und Android rundet sehr kurze Anforderungen weg; unter etwa 15 ms spürt
man auf den meisten Geräten nichts. Aufgefallen ist es erst, als das Antippen
einer Ziffer auf einem fertigen Feld vom Eintragen zum Hervorheben wurde: damit
lief plötzlich ein großer Teil der Tipper über den kurzen Tick, und der war nicht
zu spüren. Beide Werte liegen jetzt über der Schwelle und bleiben deutlich
verschieden.

Android und Chrome unterstützen `navigator.vibrate`. **Safari auf iOS nicht**:
Apple stellt Webseiten keine Haptik-Schnittstelle bereit. Als Behelf löst ab
iOS 17.4 ein verborgener Umschalter eine System-Haptik aus; ob das auf einem
bestimmten Gerät greift, ist nicht zugesichert. Schlägt es fehl, bleibt das
Spiel unverändert bedienbar.

### Warum es nicht vibriert, ist von außen nicht zu sehen

„Vibriert nicht" hat mindestens vier Ursachen, und keine davon ist am Bildschirm
zu erkennen: keine Schnittstelle, abgelehnter Aufruf, Systemeinstellung aus,
Lautlos-Modus. Deshalb schreibt der Schalter beim Einschalten unter sich, was
daraus wurde — man spürt es einmal und liest, ob es angekommen ist.
`navigator.vibrate` liefert zurück, ob der Aufruf angenommen wurde:

| | Rückmeldung |
|---|---|
| keine Schnittstelle | „Dieser Browser stellt Webseiten keine Vibration bereit — auf dem iPhone ist das so." |
| Aufruf abgelehnt | „Der Browser hat die Vibration abgelehnt." plus Hinweis auf Lautlos-Modus und Systemeinstellung |
| angenommen | „Der Browser hat die Vibration angenommen (35-30-35 ms)." — spürt man dann nichts, unterdrückt das Gerät sie |
| Schalter aus | „Der Schalter steht auf aus — dann vibriert nichts." |

Der erste Versuch schrieb das in die Statuszeile unter dem Spielfeld — und die
liegt hinter dem geöffneten Menü. Die Rückmeldung war also genau dann unsichtbar,
wenn man sie braucht. Sie steht jetzt im Blatt, direkt unter dem Schalter, und
die `haptik`-Prüfung stellt mit `elementFromPoint` sicher, dass sie dort auch
frei liegt.

Ein eigener Knopf „Vibration testen" stand zwischendurch darunter, ist aber auf
Wunsch wieder weg: der Schalter genügt. Die Prüfung achtet darauf, dass er nicht
zurückkommt.

## Beim Gewinnen

Ein kurzes Feuerwerk auf einer Leinwand über der Seite, dazu die Welle über das
Gitter. Die Farben kommen aus der laufenden Palette, im Julia-Modus ist es also
rosé; Rot ist bewusst nicht dabei, weil es im Spiel „Fehler" bedeutet. Bei
`prefers-reduced-motion` entfällt beides.

Zweiundzwanzighundert Millisekunden lang steigen Raketen, danach fallen die
letzten Teilchen aus — insgesamt rund 2,9 s. Aufgeräumt wird an einer Stelle,
und mit einer **Reißleine**: die Schleife läuft über `requestAnimationFrame`,
und der hält an, sobald die Seite nicht mehr sichtbar ist. Wechselt man mitten im
Feuerwerk die App, bliebe die Leinwand beim Zurückkommen über dem Brett liegen —
sie fängt keine Klicks ab, verdeckt aber. Ein `setTimeout` räumt dann auf; es
läuft auch im Hintergrund. Wer zuerst fertig ist, gewinnt.

Aufgefallen ist das durch eine Prüfung, die gelegentlich kippte. Zwei Ursachen
steckten darin: die Prüfung wartete mit 2600 ms zu kurz (das ist behoben), und
der Aufräumweg hing wirklich allein am Animationstakt (das ist die Reißleine).
Die Prüfung schaltet `requestAnimationFrame` jetzt ausdrücklich ab und verlangt,
dass die Leinwand trotzdem verschwindet.

## Spiel

- **Rätselerzeugung im Browser.** Ein zufälliges vollständiges Gitter wird per
  Backtracking gefüllt; anschließend werden so lange Zahlen entfernt, wie die
  Lösung nachweislich eindeutig bleibt (Lösungszähler mit Abbruch bei zwei
  Treffern, Kandidatenauswahl nach kleinster Restmenge).
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

## Symmetrisches Muster

Standardmäßig **punktsymmetrisch**, abschaltbar in den Einstellungen. Mit jedem
Feld fällt auch das um 180° gedrehte Gegenstück: oben links mit unten rechts,
oben rechts mit unten links. So sind Rätsel in Heften gesetzt. Die Mitte ist ihr
eigenes Gegenstück und fällt allein.

Ausdrücklich **nicht** vierfach symmetrisch — nicht zusätzlich waagrecht und
senkrecht gespiegelt. Das war der Wunsch: „nicht alle vier, sondern so übers
Eck." Ein zufälliges punktsymmetrisches Muster ist von sich aus nicht auch
gespiegelt; die `symmetrie`-Prüfung misst beides und verlangt genau diese
Kombination.

Beide Felder eines Paares werden zugleich geleert und die Eindeutigkeit erst
danach geprüft. Einzeln geprüft könnte das erste durchgehen und das zweite
scheitern — dann wäre die Symmetrie wieder gebrochen.

**Was das kostet.** Paarweises Entfernen schränkt stärker ein, also bleiben
symmetrische Rätsel eher etwas über der Zielzahl an Vorgaben; Experte landet bei
etwa 27 bis 31 statt 25. Die Eindeutigkeit leidet nie darunter, und die
Technik-Schranke hält auch: die Prüfung rechnet für jeden der vier Grade mit
einem eigenständig nachgebauten Einer-Löser nach, dass die Bedingung aus der
Tabelle oben zutrifft — ein „Experte" mit 29 Vorgaben ist also weiterhin nicht
mit Einer-Techniken zu lösen.

Der Schalter wirkt **ab dem nächsten Rätsel**; das laufende bleibt unberührt.
Wie alle Einstellungen liegt er im lokalen Speicher des Geräts.

## Fehleranzeige

Zwei Rollen, klar getrennt:

| | Darstellung |
|---|---|
| **die falsch gesetzte Zahl** — weicht von der Lösung ab | rote Ziffer, roter Rahmen, blitzt eine Sekunde lang dreimal auf; der Rahmen bleibt bis zur Berichtigung, und das Feld bleibt gewählt |
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

## Fassungsnummer

Die Nummer steht an zwei Stellen: als `APP_VERSION` in `index.html`, von wo aus
sie ins Menü geschrieben wird, und im Cache-Namen des Service Workers
(`sudoku-2.7`). Beim Erhöhen sind beide Stellen anzufassen — der Cache-Name
muss sich ändern, damit installierte Fassungen die neuen Dateien holen, und die
angezeigte Nummer soll dasselbe sagen wie der Cache.

`npm run collect` bricht ab, wenn die beiden auseinandergehen; die
`test`-Prüfung vergleicht zusätzlich, was im Menü steht. Dieselbe Nummer steht
als `?v=…` an allen Icon-Adressen, siehe [Das Icon](#das-icon).

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | alles zum Spiel: Farb- und Formwerte samt Layout im `<style>`-Block, Löser, Erzeuger und Spiellogik im `<script>`-Block |
| `manifest.webmanifest` | Name, Icons, Startadresse, Vollbild-Betrieb |
| `sw.js` | Service Worker: Seitenaufrufe erst Netz dann Cache, übrige Dateien erst Cache dann Netz |
| `icons/` | sechs PNG-Größen für iOS, Android und Favicon |

Die Design-Vorlage *Sudoku Webapp Redesign*, aus der diese Fassung entstanden
ist, liegt nicht im Repository — ihre Farb- und Formwerte stehen vollständig im
`<style>`-Block von `index.html`.
