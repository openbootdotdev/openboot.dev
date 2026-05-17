import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const SRC = join(ROOT, 'src');

const SKIP_DIRS = new Set(['node_modules', '.svelte-kit', '.wrangler', 'build', 'coverage', 'dist']);

export interface SourceFile {
	/** Path relative to repo root, with forward slashes. */
	path: string;
	contents: string;
}

/**
 * Walk src/, returning every file matching `extensions`. Test files and the
 * archtest harness itself are excluded — the rules are about production code.
 */
export function walkSourceFiles(extensions: readonly string[]): SourceFile[] {
	const out: SourceFile[] = [];
	walk(SRC, out, extensions);
	return out;
}

function walk(dir: string, out: SourceFile[], extensions: readonly string[]): void {
	for (const entry of readdirSync(dir)) {
		if (SKIP_DIRS.has(entry)) continue;
		const full = join(dir, entry);
		const stat = statSync(full);
		if (stat.isDirectory()) {
			walk(full, out, extensions);
			continue;
		}
		if (!extensions.some((ext) => entry.endsWith(ext))) continue;
		// Exclude tests, test infra, and archtest itself.
		if (/\.(test|spec)\.[jt]s$/.test(entry)) continue;
		const rel = relative(ROOT, full).replaceAll('\\', '/');
		if (rel.startsWith('src/lib/test/')) continue;
		if (rel.startsWith('src/archtest/')) continue;
		if (rel.startsWith('src/smoke-tests/')) continue;
		out.push({ path: rel, contents: readFileSync(full, 'utf8') });
	}
}

export interface Violation {
	file: string;
	line: number;
	snippet: string;
}

/**
 * Match a regex against each source file's lines, collecting offenders that
 * are not allow-listed. `predicate` decides whether a given matched line in
 * a given file is a violation — return true to flag it.
 */
export function collectViolations(
	files: SourceFile[],
	pattern: RegExp,
	predicate: (file: SourceFile, line: string) => boolean
): Violation[] {
	const found: Violation[] = [];
	for (const file of files) {
		const lines = file.contents.split('\n');
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (!pattern.test(line)) continue;
			if (!predicate(file, line)) continue;
			found.push({ file: file.path, line: i + 1, snippet: line.trim() });
		}
	}
	return found;
}

export function formatViolations(rule: string, found: Violation[]): string {
	const head = `[archtest:${rule}] ${found.length} violation(s):`;
	const body = found.map((v) => `  ${v.file}:${v.line}  ${v.snippet}`).join('\n');
	return `${head}\n${body}`;
}
