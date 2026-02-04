-- Migration: 0004_add_snapshot_and_auth
-- Created: 2024-02-04
-- Description: Add snapshot columns to configs table and create api_tokens and cli_auth_codes tables

-- Add snapshot columns to configs table
ALTER TABLE configs ADD COLUMN snapshot TEXT;
ALTER TABLE configs ADD COLUMN snapshot_at TEXT;

-- Create api_tokens table for CLI authentication
CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'cli',
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token);
CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);

-- Create cli_auth_codes table for browser-based auth approval flow
CREATE TABLE IF NOT EXISTS cli_auth_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  user_id TEXT,
  token_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cli_auth_codes_code ON cli_auth_codes(code);
