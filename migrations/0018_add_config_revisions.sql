-- Migration: 0018_add_config_revisions
-- Created: 2026-04-11
-- Description: Add config_revisions table for version history (desired-state only, max 10 per config)

CREATE TABLE IF NOT EXISTS config_revisions (
  id          TEXT PRIMARY KEY,
  config_id   TEXT NOT NULL,
  packages    TEXT NOT NULL,  -- JSON array of {name, type} objects (desired state)
  message     TEXT,           -- optional commit message from CLI --message flag
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (config_id) REFERENCES configs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_config_revisions_config_id ON config_revisions(config_id);
