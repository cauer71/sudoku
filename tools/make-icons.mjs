#!/usr/bin/env node
/**
 * Erzeugt die Icons — die Marke ist ein Sudoku-Brett.
 *
 * Motiv: ein 3×3-Block, das Mittelfeld noch frei, dünne Gitterlinien, kein
 * Rahmen. Die Ziffern tragen zwei Tinten, dieselben wie im Spiel: schwarz für
 * Vorgaben, die Markenfarbe für eigene Zahlen. Das Icon zeigt damit dasselbe
 * wie das Brett — ein Rätsel im Gange, nicht ein Symbol dafür.
 *
 * Die Maße sind an einem Vorbild gemessen, nicht geschätzt (Icon eines
 * Play-Store-Sudokus, 164 px im Screenshot):
 *
 *   Grund        #e6e6e6, randlos — der Rand hat dieselbe Farbe wie die
 *                Felder, deshalb sieht man ihn nicht als Rahmen
 *   Rand         ~7 % der Kantenlänge
 *   Zelle        28,6 %
 *   Linie        ~1,2 px = 0,73 %, Farbe ~#7b7b7b (ein richtiges Mittelgrau,
 *                nicht das blasse Grau, das ich vorher hatte)
 *   Ziffernhöhe  68 % der Zelle
 *   Strichstärke 6,4 % der Zelle — das ist ein Regular, keine fette Schrift
 *
 * Zwei Werte sind bewusst nicht übernommen: Grund und Linie kommen aus der
 * Palette der App (surface-container-highest und outline), die dem Gemessenen
 * ohnehin bis auf wenige Stufen entsprechen. So bleibt das Icon an dieselben
 * Farbwerte gebunden wie die Oberfläche.
 *
 * Die beiden Fassungen unterscheiden sich an der Tinte der eigenen Zahlen und
 * an einer Tönung des Grundes. Ein farbiger Rahmen wäre deutlicher, ist aber
 * genau das, was an den Vorgängern gestört hat. Rosé liegt im Farbton der
 * tertiary-Rolle, aber satter (#a3418f statt #725572): die Rolle selbst liest
 * sich bei 44 px als dunkles Grau-Mauve, und dann ist nicht zu sehen, dass es
 * das rosa Icon ist. Die Oberfläche im Julia-Modus behält die Werte der
 * Vorlage unverändert; nur das Icon ist aufgehellt, weil es eine andere
 * Aufgabe hat.
 *
 * Aufruf: node tools/make-icons.mjs   (braucht playwright, nur zum Erzeugen)
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'icons');
mkdirSync(OUT, { recursive: true });

const THEMES = {
  //         Grund (Felder)  Gitterlinie  eigene Zahl
  normal: { paper: '#e3e2e9', line: '#757780', own: '#2b5db0' },
  julia:  { paper: '#ecdcea', line: '#8a7688', own: '#a3418f' }
};
const INK = '#1a1b20';                 // Vorgaben, wie --on-surface im Spiel
const FONT = 'FreeSans, DejaVu Sans, Helvetica, sans-serif';

/**
 * Ein 3×3-Block, das Mittelfeld frei (die 8 fehlt):
 *   [Spalte, Zeile, Ziffer, eigene Zahl?]
 * Die vier eigenen Zahlen liegen unsymmetrisch — gleichmäßig verteilt sähe es
 * nach Muster aus, nicht nach Rätsel.
 */
const DIGITS = [
  [0, 0, '5', true], [1, 0, '3', false], [2, 0, '7', true],
  [0, 1, '6', false],                    [2, 1, '4', true],
  [0, 2, '9', false], [1, 2, '1', true], [2, 2, '2', false]
];

const PAD = 0.07;         // Abstand des Gitters zur Kante, Anteil der Kantenlänge

const LINE = 0.0075;      // Linienstärke
const SIZE = 0.92;        // Schriftgröße, Anteil der Feldbreite → Ziffer ~68 % hoch

/**
 * Gemessen, nicht geraten: „dominant-baseline: central" setzt die Ziffer in
 * dieser Schrift 4,3 % der Feldhöhe zu hoch.
 */
const BASELINE = 0.043;

/**
 * Unter 32 px trägt ein Regular nicht mehr: die Striche wären dünner als ein
 * Bildpunkt und verschwinden. Favicons bekommen deshalb den fetten Schnitt.
 */
const weightFor = size => (size <= 32 ? 700 : 400);

/**
 * Der Grund füllt immer das ganze Icon — kein Rahmen, keine zweite Fläche.
 * Unterschieden wird nur über `pad`, den Abstand des Gitters zur Kante.
 */
function svg(size, pad01, theme) {
  const t = THEMES[theme];
  const pad = size * pad01;
  const side = size - pad * 2;
  const step = side / 3;
  const lw = Math.max(size * LINE, 0.8);       // unter ~107 px sonst unsichtbar
  const at = i => pad + i * step;

  let out = `<rect width="${size}" height="${size}" fill="${t.paper}"/>`;

  let lines = `<g stroke="${t.line}" stroke-width="${lw}">`;
  for (let i = 1; i < 3; i++) {
    lines += `<path d="M${at(i)} ${pad} V${pad + side}"/>`;
    lines += `<path d="M${pad} ${at(i)} H${pad + side}"/>`;
  }
  out += lines + '</g>';

  for (const [col, row, ch, own] of DIGITS) {
    out += `<text x="${at(col) + step / 2}" y="${at(row) + step / 2 + step * BASELINE}"` +
           ` fill="${own ? t.own : INK}" font-family="${FONT}" font-size="${step * SIZE}"` +
           ` font-weight="${weightFor(size)}" text-anchor="middle" dominant-baseline="central">${ch}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
${out}
</svg>`;
}

/* ==========================================================
   maskable — eigene Geometrie
   ==========================================================
   Am Gerät gemessen (zwei Galaxy, per adb), nicht hergeleitet:

     · Chrome montiert ein maskable-Icon IMMER auf 76,2 % der
       Adaptive-Icon-Leinwand, zentriert, mit weißem Untergrund. Belegt an vier
       installierten WebAPKs. Eine höher aufgelöste Quelldatei ändert daran
       nichts — 1024 statt 512 bringt keine Größe.
     · One UI zeigt davon die mittleren 66,7 % als Squircle. Sichtbar bleiben
       also 66,7/76,2 = 87,5 % des Bildes, je Seite werden 6,25 % beschnitten.

   Daraus folgt, warum die vorige Fassung klein wirkte: 18 % eigener Rand kamen
   zu Chromes Verkleinerung noch dazu. Das Gitter füllte nur ~73 % des
   sichtbaren Plättchens.

   Und hier lag der Fehler der vorigen Fassung: sie hat aus „sichtbar bleiben
   87,5 % des Bildes" ein QUADRAT gemacht und das Feld auf 64…960 gelegt. Die
   Maske ist aber ein Squircle — sie schneidet die Ecken. Die vier Eckziffern
   (5, 7, 9, 2) liegen genau auf den Diagonalen, wo jede Maske am meisten
   wegnimmt, und wurden angeschnitten.

   Verbindlich ist die Sicherheitszone: ein Kreis um die Mitte mit 80 % der
   Kantenlänge, also Radius 0,4 — Chromes Montage auf 76,2 % bildet Androids
   66-dp-Kreis genau darauf ab. Was darin liegt, ist auf JEDER Maske ganz zu
   sehen, auch auf einer runden (Pixel). Was draußen liegt, darf beschnitten
   werden.

   Daraus die Aufteilung:
     · Grund und Gitterlinien laufen weiter über die volle Leinwand. Sie
       DÜRFEN beschnitten werden — den Rand macht die Maske, wie beim Vorbild.
     · Die Ziffern müssen ganz in den Kreis. Das begrenzt sie: eine Eckziffer
       sitzt in beiden Achsen eine Zellkante von der Mitte entfernt, ihre
       äußere Ecke also 1,41 Zellkanten plus ihre halbe Höhe und Breite.
     · Damit die Zellen dabei gleich groß bleiben, werden vier Linien je
       Richtung gezogen statt zwei: das Feld bekommt seinen Rahmen, und die
       Linien laufen darüber hinaus bis zur Kante.

   Zahlen für 1024 px, Anteile der Kantenlänge:
     Zellkante 214 → 0,208984     Linien bei 191, 405, 619, 833
     Strichbreite 6,04 → 0,005898 Ziffernhöhe 173 → 0,168945

   Die Ziffernhöhe ist keine Wahl, sondern das Ergebnis: am fertigen PNG
   gemessen liegt der äußerste Ziffernpunkt bei 39,55 % — knapp innerhalb der
   40 %, mitsamt seinem Kantenglättungssaum. Mehr ginge nur, wenn die Ziffern
   noch enger in ihren Zellen säßen; bei 173 zu 214 füllen sie schon 81 % der
   Zellhöhe, das Vorbild bleibt darunter. Die Prüfreihe misst es nach.
*/
const M = {
  zelle:  214 / 1024,
  strich: 6.04 / 1024,
  ziffer: 173 / 1024
};

// Sicherheitszone: Radius als Anteil der Kantenlänge.
const SICHER = 0.4;

/* Roboto, wie in der App.

   Die Ziffernhöhe ist die Versalhöhe der Schrift: 1456 von 2048 Einheiten,
   also 0,7109 der Schriftgröße — Ziffern reichen in Roboto genau bis dorthin.
   Bewusst der Schriftwert und nicht mein erster Messwert (0,665): den hatte ich
   mit einer Schwelle über gerasterten Bildpunkten genommen, und der hängt davon
   ab, wie viel Kantenglättung man noch mitzählt. Die Vorgabe „200 px" meint die
   Höhe der Ziffer, nicht die ihres Weichzeichnerrandes.

   Der zweite Wert setzt die Ziffer auf die Zellmitte: die Grundlinie liegt um
   die halbe Versalhöhe unter der Mitte. Kein dominant-baseline, dessen Versatz
   fällt je Schrift anders aus.

   Die maskable-Prüfung misst am fertigen PNG nach, mit einer Schwelle bei
   halber Deckung — das ist die Kante der Ziffer. */
const ROBOTO_HOEHE = 1456 / 2048;
const ROBOTO_MITTE = ROBOTO_HOEHE / 2;
const ROBOTO = readFileSync(new URL('./schrift/roboto-regular-latin.woff2', import.meta.url)).toString('base64');

function svgMaskable(size, theme) {
  const t = THEMES[theme];
  const zelle = size * M.zelle;
  const m = size / 2;                                  // Mitte der Leinwand
  const mitte = i => m + (i - 1) * zelle;              // Mitte der Zelle i (0..2)
  const fs = (size * M.ziffer) / ROBOTO_HOEHE;

  let out = `<rect width="${size}" height="${size}" fill="${t.paper}"/>`;

  // Vier Linien je Richtung — die beiden inneren und der Rahmen des Feldes —,
  // alle über die ganze Leinwand. Der Rahmen hält die Zellen gleich groß, das
  // Überstehen nimmt dem Feld das Schwebende: das Gitter geht weiter, die
  // Maske schneidet es ab.
  let lines = `<g stroke="${t.line}" stroke-width="${size * M.strich}">`;
  for (const d of [-1.5, -0.5, 0.5, 1.5]) {
    const at = m + d * zelle;
    lines += `<path d="M${at} 0 V${size}"/><path d="M0 ${at} H${size}"/>`;
  }
  out += lines + '</g>';

  for (const [col, row, ch, own] of DIGITS) {
    out += `<text x="${mitte(col)}" y="${mitte(row) + fs * ROBOTO_MITTE}"` +
           ` fill="${own ? t.own : INK}" font-family="Roboto" font-size="${fs}"` +
           ` font-weight="400" text-anchor="middle">${ch}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
${out}
</svg>`;
}

const SHAPES = [
  { name: 'icon-192', size: 192, pad: PAD },
  { name: 'icon-512', size: 512, pad: PAD },
  { name: 'icon-maskable-512', size: 512, maskable: true },
  { name: 'apple-touch-icon', size: 180, pad: PAD },
  { name: 'favicon-32', size: 32, pad: PAD },
  { name: 'favicon-16', size: 16, pad: PAD }
];

const JOBS = [];
for (const theme of ['normal', 'julia']) {
  for (const sh of SHAPES) {
    // Ein Favicon reicht für die Seite; die Rosé-Reihe braucht keins.
    if (theme === 'julia' && sh.name.startsWith('favicon')) continue;
    JOBS.push({ ...sh, theme, file: sh.name + (theme === 'julia' ? '-julia' : '') + '.png' });
  }
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
});

for (const j of JOBS) {
  const page = await browser.newPage({ viewport: { width: j.size, height: j.size }, deviceScaleFactor: 1 });
  const schrift = j.maskable
    ? `@font-face{font-family:'Roboto';font-style:normal;font-weight:400;` +
      `src:url(data:font/woff2;base64,${ROBOTO}) format('woff2')}`
    : '';
  await page.setContent(
    `<style>${schrift}html,body{margin:0;padding:0;width:${j.size}px;height:${j.size}px;overflow:hidden}` +
    `svg{display:block}</style>` + (j.maskable ? svgMaskable(j.size, j.theme) : svg(j.size, j.pad, j.theme))
  );
  if (j.maskable) await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUT, j.file), omitBackground: false });
  await page.close();
  console.log(`${j.file.padEnd(30)} ${j.size}×${j.size}  ${statSync(join(OUT, j.file)).size} Bytes`);
}

await browser.close();
