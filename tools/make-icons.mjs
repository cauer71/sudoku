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
import { mkdirSync, statSync } from 'node:fs';
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

/**
 * Für maskable ein größerer Abstand — und sonst nichts.
 *
 * Erst lag dort das ganze Brett auf 56 % verkleinert auf farbigem Grund, weil
 * „Inhalt in den mittleren 80 %" als „das Quadrat muss in den Kreis passen"
 * gelesen war. Das ergab den breiten blauen Ring, den Android beim Installieren
 * zeigt. Verlangt ist aber nur, dass nichts Wichtiges beschnitten wird: der
 * Grund darf bis an die Kante laufen, allein die Tinte muss im Kreis liegen.
 *
 * Maßgeblich ist die Ecke der äußeren Ziffer. Sie sitzt bei 0,247 der Zelle
 * waagrecht (halbe Ziffernbreite) und 0,16 senkrecht (halbe Ziffernhöhe); mit
 * 0,18 Rand liegt sie 0,391 von der Mitte, der sichere Radius ist 0,4. Die
 * icons-Prüfung rechnet das am fertigen Bild nach, statt dieser Rechnung zu
 * glauben.
 */
const PAD_MASKABLE = 0.18;
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

const SHAPES = [
  { name: 'icon-192', size: 192, pad: PAD },
  { name: 'icon-512', size: 512, pad: PAD },
  { name: 'icon-maskable-512', size: 512, pad: PAD_MASKABLE },
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
  await page.setContent(
    `<style>html,body{margin:0;padding:0;width:${j.size}px;height:${j.size}px;overflow:hidden}` +
    `svg{display:block}</style>` + svg(j.size, j.pad, j.theme)
  );
  await page.screenshot({ path: join(OUT, j.file), omitBackground: false });
  await page.close();
  console.log(`${j.file.padEnd(30)} ${j.size}×${j.size}  ${statSync(join(OUT, j.file)).size} Bytes`);
}

await browser.close();
