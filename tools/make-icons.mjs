#!/usr/bin/env node
/**
 * Erzeugt die Icons — die Marke ist ein Sudoku-Ausschnitt.
 *
 * Motiv: ein 3×3-Block auf farbigem Grund, drei Ziffern darin, eine Zelle
 * hervorgehoben wie die gewählte Zelle im Spiel. Ziffern in einem Gitter sind
 * das, woran man Sudoku erkennt — ein leeres Gitter allein sieht wie eine
 * Tabelle aus. Deshalb bleiben sie in jeder Größe drin: bei 16 px sind sie
 * nicht mehr zu lesen, aber als Ziffernform noch zu sehen, und das ist mehr,
 * als ein leeres Gitter dort hergibt.
 *
 * 5 · 3 · 7 stehen so, dass keine Ziffer zweimal in Zeile, Spalte oder Block
 * vorkommt — der Ausschnitt könnte aus einem echten Rätsel stammen. Ihre Lage
 * ist bewusst unsymmetrisch; symmetrisch gesetzte Ziffern sähen nach Muster
 * aus, nicht nach Rätsel.
 *
 * Zwei Farbwege, am Grund sofort zu unterscheiden — darum trägt das Motiv
 * einen sichtbaren farbigen Rand. Blau ist die Markenfarbe (--primary) der
 * App. Rosé ist derselbe Farbton wie die tertiary-Rolle der Palette, aber
 * heller und satter: die Rolle selbst (#725572) liest sich bei 64 px als
 * dunkles Mauve, und dann ist nicht zu sehen, dass es das rosa Icon ist. Die
 * Oberfläche im Julia-Modus behält die Werte der Vorlage unverändert; nur der
 * Icon-Grund ist aufgehellt, weil er eine andere Aufgabe hat.
 *
 * Aufruf: node tools/make-icons.mjs   (braucht playwright, nur zum Erzeugen)
 */
import { chromium } from 'playwright';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'icons');
mkdirSync(OUT, { recursive: true });

// Farben aus der M3-Palette des Spiels, Seed #1E4FA6.
// normal: primary · julia: die tertiary-Rolle derselben Palette
const THEMES = {
  normal: { bg: '#2b5db0', line: '#c5c6d0', acc: '#d9e2ff', accInk: '#001945' },
  julia:  { bg: '#b981b5', line: '#e5cfe2', acc: '#fdd7fa', accInk: '#2a132c' }
};
const PANEL = '#ffffff';
const INK = '#1a1b20';
const FONT = 'FreeSans, DejaVu Sans, Helvetica, sans-serif';

// [Spalte, Zeile, Ziffer, hervorgehoben]
const DIGITS = [[2, 0, '5', true], [0, 1, '3', false], [1, 2, '7', false]];

/**
 * `frac` ist die Kantenlänge des weißen Feldes, gemessen an der Icon-Kante.
 * Für maskable muss das Motiv in den mittleren 80 % liegen: das größte
 * Quadrat in diesem Kreis hat die Kante 0,8/√2 ≈ 0,566 — daher dort ein
 * deutlich kleinerer Wert.
 */
function svg(size, frac, theme) {
  const t = THEMES[theme];
  const side = size * frac;
  const off = (size - side) / 2;
  const c = side / 3;                                  // Zellenbreite
  const r = size * 0.05;                               // kleiner Radius wie im Spiel
  const lw = Math.max(size * 0.013, 0.8);              // unter ~48 px sonst unsichtbar
  const fs = c * 0.76;
  const id = `p${size}${theme}`;

  const cell = (col, row, fill) =>
    `<rect x="${off + col * c}" y="${off + row * c}" width="${c}" height="${c}" fill="${fill}"/>`;
  const digit = (col, row, ch, fill) =>
    `<text x="${off + (col + 0.5) * c}" y="${off + (row + 0.5) * c}" fill="${fill}"` +
    ` font-family="${FONT}" font-size="${fs}" font-weight="700"` +
    ` text-anchor="middle" dominant-baseline="central">${ch}</text>`;

  let lines = `<g stroke="${t.line}" stroke-width="${lw}">`;
  for (let i = 1; i < 3; i++) {
    lines += `<path d="M${off + i * c} ${off} V${off + side}"/>`;
    lines += `<path d="M${off} ${off + i * c} H${off + side}"/>`;
  }
  lines += '</g>';

  // Fläche und Gitterlinien werden am Feldrand beschnitten, damit die
  // hervorgehobene Zelle die runde Ecke nicht überzeichnet.
  let inner = `<rect x="${off}" y="${off}" width="${side}" height="${side}" rx="${r}" fill="${PANEL}"/>`;
  inner += `<g clip-path="url(#${id})">`;
  for (const [col, row, , hi] of DIGITS) if (hi) inner += cell(col, row, t.acc);
  inner += lines + '</g>';
  for (const [col, row, ch, hi] of DIGITS) inner += digit(col, row, ch, hi ? t.accInk : INK);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <clipPath id="${id}"><rect x="${off}" y="${off}" width="${side}" height="${side}" rx="${r}"/></clipPath>
  <rect width="${size}" height="${size}" fill="${t.bg}"/>
${inner}
</svg>`;
}

// Favicons dürfen mehr Fläche nutzen: der Browser rundet sie nicht ab.
const SHAPES = [
  { name: 'icon-192', size: 192, frac: 0.80 },
  { name: 'icon-512', size: 512, frac: 0.80 },
  { name: 'icon-maskable-512', size: 512, frac: 0.55 },
  { name: 'apple-touch-icon', size: 180, frac: 0.80 },
  { name: 'favicon-32', size: 32, frac: 0.86 },
  { name: 'favicon-16', size: 16, frac: 0.86 }
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
    `svg{display:block}</style>` + svg(j.size, j.frac, j.theme)
  );
  await page.screenshot({ path: join(OUT, j.file), omitBackground: false });
  await page.close();
  console.log(`${j.file.padEnd(30)} ${j.size}×${j.size}  ${statSync(join(OUT, j.file)).size} Bytes`);
}

await browser.close();
