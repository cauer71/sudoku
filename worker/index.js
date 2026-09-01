/**
 * Worker für die gemeinsame Rangliste.
 *
 * Statische Dateien liefert die Asset-Schicht direkt aus, ohne diesen Code
 * aufzurufen. Hier landen nur Anfragen, die keiner Datei entsprechen — also
 * /api/... und unbekannte Pfade, die an die Asset-Schicht zurückgegeben
 * werden, damit sie 404.html liefert.
 *
 * Zur Ehrlichkeit: eine öffentliche Rangliste ohne Konten lässt sich nicht
 * gegen Falscheinträge absichern. Wer die Adresse kennt, kann Zeiten senden.
 * Geprüft wird daher nur, was prüfbar ist: Form, Länge und Plausibilität.
 */

const DIFFS = ['leicht', 'mittel', 'schwer', 'experte'];

const MIN_SECONDS = 20;        // darunter ist kein Gitter von Hand zu lösen
const MAX_SECONDS = 86400;     // ein Tag
const MAX_NAME = 24;

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  // Steuerzeichen entfernen, Leerraum zusammenziehen
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  if (name.length < 1 || name.length > MAX_NAME) return null;
  return name;
}

async function listScores(env) {
  const { results } = await env.DB.prepare(
    'SELECT name, difficulty, seconds, mistakes, hints, updated_at' +
    ' FROM best ORDER BY difficulty, seconds LIMIT 400'
  ).all();

  const byDiff = {};
  for (const d of DIFFS) byDiff[d] = [];
  for (const row of results || []) {
    if (byDiff[row.difficulty]) byDiff[row.difficulty].push(row);
  }
  return byDiff;
}

async function submitScore(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'kein gültiges JSON' }, 400);
  }

  const name = cleanName(body && body.name);
  if (!name) return json({ error: 'Name fehlt oder ist zu lang' }, 400);

  const difficulty = body.difficulty;
  if (DIFFS.indexOf(difficulty) === -1) return json({ error: 'unbekannter Schwierigkeitsgrad' }, 400);

  const seconds = Number(body.seconds);
  if (!Number.isInteger(seconds) || seconds < MIN_SECONDS || seconds > MAX_SECONDS) {
    return json({ error: 'Zeit unplausibel' }, 400);
  }

  const clamp = function (v) {
    const n = Number(v);
    return Number.isInteger(n) && n >= 0 && n <= 999 ? n : 0;
  };

  // Nur übernehmen, wenn die Zeit besser ist als die gespeicherte.
  const res = await env.DB.prepare(
    'INSERT INTO best (name, difficulty, seconds, mistakes, hints, updated_at)' +
    ' VALUES (?1, ?2, ?3, ?4, ?5, ?6)' +
    ' ON CONFLICT(name, difficulty) DO UPDATE SET' +
    '   seconds = excluded.seconds,' +
    '   mistakes = excluded.mistakes,' +
    '   hints = excluded.hints,' +
    '   updated_at = excluded.updated_at' +
    ' WHERE excluded.seconds < best.seconds'
  ).bind(name, difficulty, seconds, clamp(body.mistakes), clamp(body.hints), new Date().toISOString()).run();

  const improved = !!(res.meta && res.meta.changes > 0);
  return json({ ok: true, improved: improved, scores: await listScores(env) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/scores') {
      if (request.method === 'GET') {
        try {
          return json({ scores: await listScores(env) });
        } catch (e) {
          return json({ error: 'Rangliste nicht erreichbar' }, 503);
        }
      }
      if (request.method === 'POST') {
        try {
          return await submitScore(request, env);
        } catch (e) {
          return json({ error: 'Eintrag fehlgeschlagen' }, 503);
        }
      }
      return json({ error: 'Methode nicht erlaubt' }, 405);
    }

    // Alles andere zurück an die Asset-Schicht — die liefert 404.html.
    return env.ASSETS.fetch(request);
  }
};
