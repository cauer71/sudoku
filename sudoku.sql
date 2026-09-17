-- Schema der gemeinsamen Rangliste (Cloudflare D1).
--
-- Eine Zeile je Name und Schwierigkeitsgrad, immer die beste Zeit. Der
-- Worker schreibt per UPSERT und übernimmt nur, was schneller ist.
--
-- Warum die Tabelle jetzt "sudoku_best" heisst und nicht mehr "best":
-- Die Datenbank "spiele" teilen sich mehrere Spiele. D1 zählt im Free-Tarif
-- Datenbanken (zehn) und nicht Tabellen, und etwa alle vier Tage kommt ein
-- Spiel dazu — eine eigene Datenbank je Spiel wäre in Wochen aufgebraucht
-- gewesen. Also ein gemeinsamer Bestand, und die Zugehörigkeit steht im
-- Namen. Das ist kein Schönheitsthema: in den anderen Spielen gab es zweimal
-- eine Tabelle "zaehler", die einander ohne Präfix hochgezählt hätten.
--
-- Der Index heisst aus demselben Grund "sudoku_best_diff_sec": Indexnamen
-- sind in SQLite je DATENBANK eindeutig, nicht je Tabelle. Ohne Präfix wäre
-- der zweite gleichnamige Index beim Anlegen gescheitert.
--
-- Jede Anweisung trägt IF NOT EXISTS: das Schema steht in "spiele" bereits,
-- diese Datei muss also folgenlos durchlaufen können. Sie legt ausschliesslich
-- die Tabellen dieses Spiels an; was die anderen Spiele in "spiele" halten,
-- steht in deren eigenen Dateien.
--
-- Auch der DATEINAME trägt den Spielnamen, aus demselben Grund wie die
-- Tabelle: die Datenbank ist geteilt, also treffen die Schemadateien aller
-- Spiele aufeinander — beim Anwenden von Hand auf dem Bildschirm, und bei
-- "wrangler d1 migrations apply" sogar in der Datenbank, denn D1 merkt sich
-- angewandte Migrationen unter ihrem DATEINAMEN. Zwei Spiele mit je einem
-- "schema.sql" wären dort dasselbe, und das zweite würde stillschweigend
-- übersprungen. Darum "sudoku.sql" und nicht "schema.sql".
--
-- Anwenden (von Hand; dieses Projekt hat bewusst kein migrations/-Verzeichnis,
-- der Bestand ist eine einzige Tabelle):
--   entfernt:  npx wrangler d1 execute spiele --remote --file sudoku.sql
--   lokal:     npx wrangler d1 execute spiele --local  --file sudoku.sql

CREATE TABLE IF NOT EXISTS sudoku_best (
  name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  seconds INTEGER NOT NULL,
  mistakes INTEGER NOT NULL DEFAULT 0,
  hints INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (name, difficulty)
);

CREATE INDEX IF NOT EXISTS sudoku_best_diff_sec ON sudoku_best(difficulty, seconds);
