# Database Scripts

## seed-realistic-install-counts.sql

One-time script to populate realistic install counts for official configs.

### Distribution Strategy

- **Popular** (100-300): Beginner-friendly configs like starter-kit, nodejs-backend, python-backend
- **Common** (50-99): Popular stacks like react-frontend, go-backend, t3-fullstack
- **Moderate** (20-49): Specialized roles like ios-developer, platform-eng
- **Niche** (10-19): Less common like rust-backend, web3-dev, unity-gamedev

### Usage

```bash
# Local database
wrangler d1 execute openboot --file=./scripts/seed-realistic-install-counts.sql --local

# Production database (use with caution)
wrangler d1 execute openboot --file=./scripts/seed-realistic-install-counts.sql --remote
```

### Total Installs

Approximately 1,700 total installs across 20 configs, averaging 85 per config.
