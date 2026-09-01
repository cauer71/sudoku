#!/usr/bin/env node
/**
 * Erzeugt die Icons — die Marke ist ein Sudoku-Brett.
 *
 * Motiv: ein vollständiger 3×3-Block, ein Feld noch frei (die 2 fehlt), dünne
 * Gitterlinien, kein Rahmen. Die Ziffern tragen zwei Tinten, dieselben wie im
 * Spiel: schwarz für Vorgaben, die Markenfarbe für eigene Zahlen. Das Icon
 * zeigt damit dasselbe wie das Brett — ein Rätsel im Gange, nicht ein Symbol
 * dafür.
 *
 * Ziffern sind das, woran man Sudoku erkennt; ein leeres Gitter sieht wie eine
 * Tabelle aus. Deshalb bleiben sie in jeder Größe drin: bei 16 px sind sie
 * nicht mehr zu lesen, aber als Ziffernform noch zu sehen, und das ist mehr,
 * als ein leeres Gitter dort hergibt.
 *
 * Die beiden Fassungen unterscheiden sich an zwei Stellen: an der Tinte der
 * eigenen Zahlen und an einer leichten Tönung des Grundes. Ein farbiger Rahmen
 * wäre deutlicher, kostet aber die Fläche, welche die Ziffern brauchen.
 *
 * Blau ist die Markenfarbe (--primary) der App auf weißem Grund. Rosé liegt im
 * Farbton der tertiary-Rolle, aber satter (#a3418f statt #725572): die Rolle
 * selbst liest sich bei 44 px als dunkles Grau-Mauve, und dann ist nicht zu
 * sehen, dass es das rosa Icon ist. Dazu ein rosé getönter Grund. Die
 * Oberfläche im Julia-Modus behält die Werte der Vorlage unverändert; nur das
 * Icon ist aufgehellt, weil es eine andere Aufgabe hat.
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
  //          Grund      Gitterlinie  eigene Zahl  Grund außen (nur maskable)
  normal: { paper: '#ffffff', line: '#c5c6d0', own: '#2b5db0', outer: '#2b5db0' },
  julia:  { paper: '#fbeef8', line: '#e0b8da', own: '#a3418f', outer: '#b981b5' }
};
const INK = '#1a1b20';                 // Vorgaben, wie --on-surface im Spiel
const FONT = 'FreeSans, DejaVu Sans, Helvetica, sans-serif';

// Ein vollständiger 3×3-Block, ein Feld frei: [Spalte, Zeile, Ziffer, eigene Zahl?]
const DIGITS = [
  [0, 0, '5', true], [1, 0, '3', false], [2, 0, '7', false],
  [0, 1, '6', false], [1, 1, '8', true], [2, 1, '4', true],
  [0, 2, '9', true], [1, 2, '1', false]
];

const PAD = 0.06;         // Abstand des Gitters zur Icon-Kante
const LINE = 0.010;       // Linienstärke, Anteil der Kantenlänge
const SIZE = 0.92;        // Schriftgröße, Anteil der Feldbreite
const WEIGHT = 700;

/**
 * Gemessen, nicht geraten: „dominant-baseline: central" setzt die Ziffer in
 * dieser Schrift 4,3 % der Feldhöhe zu hoch.
 */
const BASELINE = 0.043;

/**
 * `span` ist die Kantenlänge des Bretts, gemessen an der Icon-Kante. Normal
 * füllt es das Icon (1) — der Grund des Bretts ist dann auch der Grund des
 * Icons, es gibt keinen Rahmen.
 *
 * Für maskable muss alles in den mittleren 80 % liegen: das größte Quadrat in
 * diesem Kreis hat die Kante 0,8/√2 ≈ 0,566. Dort liegt das Brett kleiner auf
 * farbigem Grund — anders geht es nicht, Android beschneidet dieses Icon auf
 * einen Kreis, und Ziffern in den Ecken wären weg.
 */
function svg(size, span, theme) {
  const t = THEMES[theme];
  const edge = size * span;
  const org = (size - edge) / 2;
  const pad = edge * PAD;
  const side = edge - pad * 2;
  const step = side / 3;
  const lw = Math.max(edge * LINE, 0.8);       // unter ~80 px sonst unsichtbar
  const at = i => org + pad + i * step;

  let out = `<rect width="${size}" height="${size}" fill="${span < 1 ? t.outer : t.paper}"/>`;
  if (span < 1) {
    out += `<rect x="${org}" y="${org}" width="${edge}" height="${edge}"` +
           ` rx="${edge * 0.06}" fill="${t.paper}"/>`;
  }

  let lines = `<g stroke="${t.line}" stroke-width="${lw}" stroke-linecap="round">`;
  for (let i = 1; i < 3; i++) {
    lines += `<path d="M${at(i)} ${org + pad} V${org + pad + side}"/>`;
    lines += `<path d="M${org + pad} ${at(i)} H${org + pad + side}"/>`;
  }
  out += lines + '</g>';

  for (const [col, row, ch, own] of DIGITS) {
    out += `<text x="${at(col) + step / 2}" y="${at(row) + step / 2 + step * BASELINE}"` +
           ` fill="${own ? t.own : INK}" font-family="${FONT}" font-size="${step * SIZE}"` +
           ` font-weight="${WEIGHT}" text-anchor="middle" dominant-baseline="central">${ch}</text>`;
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
