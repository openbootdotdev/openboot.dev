-- Migration: 0002_add_alias
-- Created: 2024-02-01
-- Note: SQLite doesn't support "IF NOT EXISTS" for ALTER TABLE ADD COLUMN
-- This migration may fail if already applied - that's expected behavior
--
-- 2026 update: SQLite forbids `ADD COLUMN ... UNIQUE` (hosted D1 silently
-- tolerated this in the past, local Miniflare D1 rejects it strictly per
-- the SQLite spec). Replaced with the canonical pattern:
-- ADD COLUMN (no constraint) + CREATE UNIQUE INDEX. Equivalent uniqueness
-- guarantee, runs on both hosted and local D1. Safe to re-apply on prod:
-- this migration is already recorded in d1_migrations, so it will not
-- re-execute against the hosted DB.

ALTER TABLE configs ADD COLUMN alias TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_configs_alias_unique ON configs(alias);
