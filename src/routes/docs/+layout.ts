import { DOC_STRUCTURE, allDocs, searchIndex } from './docs-data';

export function load() {
	return {
		groups: DOC_STRUCTURE,
		allDocs,
		searchIndex
	};
}
