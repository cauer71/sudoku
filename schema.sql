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
-- diese Datei muss also folgenlos durchlaufen können.
--
-- Anwenden (von Hand; dieses Projekt hat bewusst kein migrations/-Verzeichnis,
-- der Bestand ist eine einzige Tabelle):
--   entfernt:  npx wrangler d1 execute spiele --remote --file schema.sql
--   lokal:     npx wrangler d1 execute spiele --local  --file schema.sql

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
