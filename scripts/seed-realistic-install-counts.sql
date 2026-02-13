-- One-time script to seed realistic install counts for official configs
-- Run this manually with: wrangler d1 execute openboot --file=./scripts/seed-realistic-install-counts.sql --remote

-- Popular configs (100-300 installs)
UPDATE configs SET install_count = 287 WHERE slug = 'starter-kit';
UPDATE configs SET install_count = 234 WHERE slug = 'nodejs-backend';
UPDATE configs SET install_count = 198 WHERE slug = 'python-backend';
UPDATE configs SET install_count = 176 WHERE slug = 'react-frontend';
UPDATE configs SET install_count = 165 WHERE slug = 'devops-sre';

-- Common configs (50-99 installs)
UPDATE configs SET install_count = 94 WHERE slug = 't3-fullstack';
UPDATE configs SET install_count = 87 WHERE slug = 'go-backend';
UPDATE configs SET install_count = 76 WHERE slug = 'design-dev';
UPDATE configs SET install_count = 68 WHERE slug = 'data-science';
UPDATE configs SET install_count = 62 WHERE slug = 'vue-frontend';

-- Moderate configs (20-49 installs)
UPDATE configs SET install_count = 47 WHERE slug = 'ios-developer';
UPDATE configs SET install_count = 43 WHERE slug = 'platform-eng';
UPDATE configs SET install_count = 38 WHERE slug = 'tech-writer';
UPDATE configs SET install_count = 34 WHERE slug = 'android-dev';
UPDATE configs SET install_count = 29 WHERE slug = 'java-spring';

-- Niche configs (10-19 installs)
UPDATE configs SET install_count = 19 WHERE slug = 'rust-backend';
UPDATE configs SET install_count = 17 WHERE slug = 'security-eng';
UPDATE configs SET install_count = 14 WHERE slug = 'rails-backend';
UPDATE configs SET install_count = 12 WHERE slug = 'web3-dev';
UPDATE configs SET install_count = 11 WHERE slug = 'unity-gamedev';
