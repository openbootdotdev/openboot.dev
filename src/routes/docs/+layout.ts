import { DOC_STRUCTURE, allDocs } from './docs-data';

export function load() {
	return {
		groups: DOC_STRUCTURE,
		allDocs
	};
}
