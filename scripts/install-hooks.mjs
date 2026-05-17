#!/usr/bin/env node
// Symlinks scripts/hooks/* into .git/hooks/. Idempotent.
// Run via: npm run install:hooks
//
// Why not husky? One npm script + symlinks does the same job without
// a runtime dependency. The hooks themselves are plain POSIX shell.

import { mkdirSync, readdirSync, rmSync, symlinkSync, statSync, chmodSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const srcDir = join(here, 'hooks');
const dstDir = join(repoRoot, '.git', 'hooks');

mkdirSync(dstDir, { recursive: true });

const hooks = readdirSync(srcDir).filter((name) => statSync(join(srcDir, name)).isFile());
if (hooks.length === 0) {
	console.error(`No hooks found in ${srcDir}`);
	process.exit(1);
}

for (const name of hooks) {
	const src = join(srcDir, name);
	const dst = join(dstDir, name);
	chmodSync(src, 0o755);
	try {
		rmSync(dst);
	} catch (err) {
		if (err.code !== 'ENOENT') throw err;
	}
	symlinkSync(relative(dirname(dst), src), dst);
	console.log(`✓ ${relative(repoRoot, dst)} → ${relative(repoRoot, src)}`);
}
