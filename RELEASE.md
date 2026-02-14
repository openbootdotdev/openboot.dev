# Release Process

This project uses **tag-based releases**. Production deployments only happen when you create a Git tag.

## Quick Release

```bash
# 1. Ensure main branch is ready
git checkout main
git pull

# 2. Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

This triggers the production deployment workflow automatically.

## Release Workflow

### 1. Development & Testing

- Push commits to `main` branch
- CI runs automatically (tests + build)
- **No deployment happens**

### 2. Ready to Release

When you're ready to deploy to production:

```bash
# Create a tag following semantic versioning
git tag v1.2.3

# Push the tag to GitHub
git push origin v1.2.3
```

### 3. Automated Deployment

The tag push triggers `.github/workflows/deploy.yml`:

1. ✅ Run tests
2. ✅ Build application
3. ✅ Run database migrations
4. ✅ Deploy to Cloudflare Workers (openboot.dev)

### 4. Verify Deployment

Check GitHub Actions: https://github.com/openbootdotdev/openboot.dev/actions

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **v1.0.0** → Major release (breaking changes)
- **v1.1.0** → Minor release (new features, backward compatible)
- **v1.1.1** → Patch release (bug fixes)

### Examples

```bash
# Bug fix
git tag v1.0.1
git push origin v1.0.1

# New feature
git tag v1.1.0
git push origin v1.1.0

# Breaking change
git tag v2.0.0
git push origin v2.0.0
```

## Rollback

If a deployment has issues:

```bash
# Option 1: Deploy previous version
git push origin v1.0.0 --force-with-lease

# Option 2: Create hotfix tag
git tag v1.0.2
git push origin v1.0.2
```

## Manual Deployment

You can also trigger deployment manually from GitHub:

1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Select `main` branch
4. Click "Run workflow"

## Release Checklist

Before tagging a release:

- [ ] All tests passing on `main`
- [ ] Migrations tested locally
- [ ] Breaking changes documented
- [ ] Version number follows semver
- [ ] Previous version tagged (for rollback reference)

## Migration Strategy

Database migrations run automatically before deployment. Ensure:

1. Migration is backward compatible (if possible)
2. Migration tested with `wrangler d1 migrations apply openboot --local`
3. Large migrations coordinated with zero-downtime deployment

## FAQ

**Q: Can I delete a tag?**
```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0
```

**Q: What happens if deployment fails?**
- GitHub Actions will show the error
- Previous version remains deployed
- Fix the issue and create a new tag

**Q: How do I see what's deployed?**
- Check latest tag: `git describe --tags --abbrev=0`
- View deployment history in GitHub Actions
