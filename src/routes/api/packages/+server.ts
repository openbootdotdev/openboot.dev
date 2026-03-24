import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PACKAGE_METADATA } from '$lib/package-metadata';
import { PRESET_PACKAGES } from '$lib/presets';

// Build sets of cask and npm package names from presets (source of truth for installer type).
const caskNames = new Set<string>();
const npmNames = new Set<string>();
for (const preset of Object.values(PRESET_PACKAGES)) {
	for (const name of preset.cask) caskNames.add(name);
	for (const name of preset.npm ?? []) npmNames.add(name);
}

function getInstaller(name: string, metadataType: string): 'formula' | 'cask' | 'npm' {
	if (npmNames.has(name)) return 'npm';
	if (caskNames.has(name) || metadataType === 'gui') return 'cask';
	return 'formula';
}

export const GET: RequestHandler = async () => {
	const packages = Object.values(PACKAGE_METADATA).map((pkg) => ({
		name: pkg.name,
		desc: pkg.description,
		category: pkg.category,
		type: pkg.type,
		installer: getInstaller(pkg.name, pkg.type)
	}));

	return json(
		{ packages },
		{
			headers: {
				'Cache-Control': 'public, max-age=3600, s-maxage=86400'
			}
		}
	);
};
