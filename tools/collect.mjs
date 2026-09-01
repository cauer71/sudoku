#!/usr/bin/env node
/**
 * Stellt das Auslieferungsverzeichnis dist/ zusammen.
 *
 * Warum überhaupt ein Schritt? Die App liegt im Wurzelverzeichnis, weil
 * GitHub Pages von dort baut. Cloudflare bekommt aber ein eigenes, sauberes
 * Verzeichnis — aus zwei Gründen:
 *
 *   1. Positivliste statt Ausschlussliste: ausgeliefert wird, was hier steht,
 *      und sonst nichts. Eine vergessene Datei im Wurzelverzeichnis kann
 *      nicht versehentlich veröffentlicht werden, .git eingeschlossen.
 *   2. `wrangler dev` überwacht das Asset-Verzeichnis und legt zugleich
 *      .wrangler/ an. Liegt beides übereinander, lädt der Server endlos neu.
 *
 * Kein Bauen, nur Kopieren: die App selbst bleibt unverändert.
 */
import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const FILES = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  '404.html',
  'julia.html',
  'manifest-julia.webmanifest',
  '_headers',              // wird von Workers ausgewertet, nicht ausgeliefert
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
  'icons/favicon-16.png',
  'icons/icon-192-julia.png',
  'icons/icon-512-julia.png',
  'icons/icon-maskable-512-julia.png',
  'icons/apple-touch-icon-julia.png'
];

// Die im Menü angezeigte Fassungsnummer und der Cache-Name des Service
// Workers müssen dieselbe sein — sonst zeigt die App eine Nummer an, unter der
// die Dateien nie ausgeliefert wurden. Hier geprüft, weil es der einzige
// Schritt ist, den beide Dateien gemeinsam durchlaufen.
const appVersion = (await readFile(join(ROOT, 'index.html'), 'utf8'))
  .match(/var APP_VERSION = "([^"]+)"/);
const swVersion = (await readFile(join(ROOT, 'sw.js'), 'utf8'))
  .match(/var VERSION = 'sudoku-([^']+)'/);

if (!appVersion || !swVersion) {
  console.error('Fassungsnummer nicht gefunden: ' +
    (appVersion ? '' : 'APP_VERSION in index.html ') + (swVersion ? '' : "VERSION in sw.js"));
  process.exit(1);
}
if (appVersion[1] !== swVersion[1]) {
  console.error(`Fassungsnummern gehen auseinander: index.html sagt ${appVersion[1]}, ` +
    `sw.js sagt sudoku-${swVersion[1]}. Beide Stellen anfassen.`);
  process.exit(1);
}

await rm(DIST, { recursive: true, force: true });

const missing = [];
for (const rel of FILES) {
  const from = join(ROOT, rel);
  try {
    await stat(from);
  } catch {
    missing.push(rel);
    continue;
  }
  const to = join(DIST, rel);
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to);
}

if (missing.length) {
  console.error('Fehlende Dateien: ' + missing.join(', '));
  process.exit(1);
}

console.log('dist/ zusammengestellt — ' + FILES.length + ' Dateien, Fassung ' + appVersion[1]);
