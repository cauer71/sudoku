/* Service Worker für Sudoku.
 *
 * Zweck: die App offline verfügbar machen und damit die Voraussetzung für
 * „Zum Startbildschirm hinzufügen" erfüllen.
 *
 * Strategie:
 *   - Seitenaufrufe: erst Netz, dann Cache. So landen Aktualisierungen
 *     sofort, ohne dass man auf einen neuen Worker warten muss; ohne Netz
 *     kommt die gespeicherte Fassung.
 *   - Alles andere (Icons, Manifest): erst Cache, dann Netz.
 */

var VERSION = 'sudoku-1.7';        // dieselbe Nummer wie APP_VERSION in index.html

// Icons werden mit "immutable" und einem Jahr Haltbarkeit ausgeliefert. Damit
// eine neue Zeichnung überhaupt ankommt, tragen ihre Adressen die Fassung:
// gleiche Datei, neue Adresse, also ein neuer Eintrag im Cache des Browsers.
// Diese Marke muss zu APP_VERSION passen — tools/collect.mjs prüft das.
var ICON_V = '?v=1.7';

var ICONS = [
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'favicon-32.png',
  'favicon-16.png',
  'icon-192-julia.png',
  'icon-512-julia.png',
  'icon-maskable-512-julia.png',
  'apple-touch-icon-julia.png'
].map(function (name) { return './icons/' + name + ICON_V; });

var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './julia.html',
  './manifest-julia.webmanifest'
].concat(ICONS);

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION).then(function (cache) {
      // Einzeln ablegen: eine fehlende Datei darf die Installation nicht
      // scheitern lassen, sonst bleibt die App ganz ohne Offline-Fassung.
      return Promise.all(ASSETS.map(function (url) {
        return cache.add(new Request(url, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === VERSION ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); }).catch(function () {});
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html') || caches.match('./');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      });
    })
  );
});
