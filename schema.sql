-- Schema der gemeinsamen Rangliste (Cloudflare D1).
--
-- Eine Zeile je Name und Schwierigkeitsgrad, immer die beste Zeit. Der
-- Worker schreibt per UPSERT und übernimmt nur, was schneller ist.
--
-- Anwenden:
--   entfernt:  npx wrangler d1 execute sudoku-rangliste --remote --file schema.sql
--   lokal:     npx wrangler d1 execute sudoku-rangliste --local  --file schema.sql

CREATE TABLE IF NOT EXISTS best (
  name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  seconds INTEGER NOT NULL,
  mistakes INTEGER NOT NULL DEFAULT 0,
  hints INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (name, difficulty)
);

CREATE INDEX IF NOT EXISTS idx_best_diff_sec ON best(difficulty, seconds);
