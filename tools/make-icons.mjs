#!/usr/bin/env node
/**
 * Erzeugt die Icons — die Marke ist ein Sudoku-Ausschnitt.
 *
 * Motiv: neun weiße Felder mit Abstand auf farbigem Grund, drei Ziffern darin,
 * ein Feld hervorgehoben wie die gewählte Zelle im Spiel.
 *
 * Die Farbe liegt in den Fugen, nicht in einem Rahmen. Ein Rahmen kostet
 * Fläche, die den Ziffern fehlt; die Fugen tragen dieselbe Farbe über das
 * ganze Icon und lassen die Ziffern so groß werden, wie sie eben werden
 * können. Außen bleibt nur ein Hauch Rand (2,5 %), damit die Ecken beim
 * Abrunden durch das Betriebssystem nicht weiß angeschnitten werden.
 *
 * Ziffern in einem Gitter sind das, woran man Sudoku erkennt — ein leeres
 * Gitter sieht wie eine Tabelle aus. Deshalb bleiben sie in jeder Größe drin:
 * bei 16 px sind sie nicht mehr zu lesen, aber als Ziffernform noch zu sehen,
 * und das ist mehr, als ein leeres Gitter dort hergibt.
 *
 * 5 · 3 · 7 stehen so, dass keine Ziffer zweimal in Zeile, Spalte oder Block
 * vorkommt — der Ausschnitt könnte aus einem echten Rätsel stammen. Ihre Lage
 * ist bewusst unsymmetrisch; symmetrisch gesetzte Ziffern sähen nach Muster
 * aus, nicht nach Rätsel.
 *
 * Zwei Farbwege, an den Fugen sofort zu unterscheiden. Blau ist die
 * Markenfarbe (--primary) der App. Rosé ist derselbe Farbton wie die
 * tertiary-Rolle, aber heller und satter: die Rolle selbst (#725572) liest
 * sich bei 64 px als dunkles Mauve, und dann ist nicht zu sehen, dass es das
 * rosa Icon ist. Die Oberfläche im Julia-Modus behält die Werte der Vorlage
 * unverändert; nur der Icon-Grund ist aufgehellt, weil er eine andere Aufgabe
 * hat.
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
  normal: { bg: '#2b5db0', acc: '#d9e2ff', accInk: '#001945' },
  julia:  { bg: '#b981b5', acc: '#fdd7fa', accInk: '#2a132c' }
};
const TILE = '#ffffff';
const INK = '#1a1b20';
const FONT = 'FreeSans, DejaVu Sans, Helvetica, sans-serif';

// [Spalte, Zeile, Ziffer, hervorgehoben]
const DIGITS = [[2, 0, '5', true], [0, 1, '3', false], [1, 2, '7', false]];

const RIM = 0.025;        // Rand außen, Anteil der Kantenlänge des Motivs
const GAP = 0.080;        // Fuge zwischen den Feldern
const RADIUS = 0.016;     // Eckenradius der Felder — klein, wie im Spiel
const SIZE = 1.28;        // Schriftgröße, Anteil der Feldbreite

/**
 * Gemessen, nicht geraten: „dominant-baseline: central" setzt die Ziffer in
 * dieser Schrift 4,3 % der Feldhöhe zu hoch — sie stieß oben an. Bei einer
 * Ziffer, die 92 % der Feldhöhe einnimmt, fällt das sofort auf.
 */
const BASELINE = 0.043;

/**
 * `span` ist die Kantenlänge des Motivs, gemessen an der Icon-Kante. Normal
 * füllt es das Icon (1). Für maskable muss es in den mittleren 80 % liegen:
 * das größte Quadrat in diesem Kreis hat die Kante 0,8/√2 ≈ 0,566 — daher
 * dort ein deutlich kleinerer Wert.
 */
function svg(size, span, theme) {
  const t = THEMES[theme];
  const edge = size * span;
  const org = (size - edge) / 2;
  const rim = edge * RIM;
  const gap = edge * GAP;
  const step = (edge - rim * 2 - gap * 2) / 3;         // Feldbreite
  const at = i => org + rim + i * (step + gap);

  let out = `<rect width="${size}" height="${size}" fill="${t.bg}"/>`;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const hi = DIGITS.some(d => d[0] === col && d[1] === row && d[3]);
      out += `<rect x="${at(col)}" y="${at(row)}" width="${step}" height="${step}"` +
             ` rx="${edge * RADIUS}" fill="${hi ? t.acc : TILE}"/>`;
    }
  }
  for (const [col, row, ch, hi] of DIGITS) {
    out += `<text x="${at(col) + step / 2}" y="${at(row) + step / 2 + step * BASELINE}"` +
           ` fill="${hi ? t.accInk : INK}" font-family="${FONT}" font-size="${step * SIZE}"` +
           ` font-weight="700" text-anchor="middle" dominant-baseline="central">${ch}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
${out}
</svg>`;
}

const SHAPES = [
  { name: 'icon-192', size: 192, span: 1 },
  { name: 'icon-512', size: 512, span: 1 },
  { name: 'icon-maskable-512', size: 512, span: 0.56 },
  { name: 'apple-touch-icon', size: 180, span: 1 },
  { name: 'favicon-32', size: 32, span: 1 },
  { name: 'favicon-16', size: 16, span: 1 }
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
    `svg{display:block}</style>` + svg(j.size, j.span, j.theme)
  );
  await page.screenshot({ path: join(OUT, j.file), omitBackground: false });
  await page.close();
  console.log(`${j.file.padEnd(30)} ${j.size}×${j.size}  ${statSync(join(OUT, j.file)).size} Bytes`);
}

await browser.close();
