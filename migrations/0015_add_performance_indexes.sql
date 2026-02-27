-- Add indexes for frequently queried columns to avoid full table scans

-- Visibility-based queries (explore page, profile page, alias resolution)
CREATE INDEX IF NOT EXISTS idx_configs_visibility ON configs(visibility);
CREATE INDEX IF NOT EXISTS idx_configs_visibility_updated_at ON configs(visibility, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_configs_visibility_install_count ON configs(visibility, install_count DESC);

-- Featured sort (explore page default view)
CREATE INDEX IF NOT EXISTS idx_configs_featured ON configs(featured DESC, install_count DESC);

-- CLI auth codes lookup by status (approve endpoint)
CREATE INDEX IF NOT EXISTS idx_cli_auth_codes_status ON cli_auth_codes(status);
CREATE INDEX IF NOT EXISTS idx_cli_auth_codes_expires_at ON cli_auth_codes(expires_at);
