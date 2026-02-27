/**
 * D1 Database mock for testing
 * 
 * Usage:
 * const db = createMockDB({ users: [mockUser], configs: [mockConfig] });
 */

import type { D1Database, D1PreparedStatement, D1Result } from '@cloudflare/workers-types';

export type MockData = {
	users?: any[];
	configs?: any[];
	api_tokens?: any[];
	cli_auth_codes?: any[];
};

/**
 * Creates a mock D1Database with pre-seeded data
 */
export function createMockDB(data: MockData = {}): D1Database & { data: Record<string, any[]> } {
	const tables = {
		users: data.users || [],
		configs: data.configs || [],
		api_tokens: data.api_tokens || [],
		cli_auth_codes: data.cli_auth_codes || []
	};

	return {
		data: tables,
		prepare(sql: string) {
			return createMockStatement(sql, tables);
		},
		dump() {
			throw new Error('dump() not implemented in mock');
		},
		async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
			const results: D1Result<T>[] = [];
			for (const stmt of statements) {
				results.push(await stmt.run() as D1Result<T>);
			}
			return results;
		},
		exec(query: string): Promise<D1Result> {
			throw new Error('exec() not implemented in mock');
		}
	} as D1Database & { data: Record<string, any[]> };
}

function createMockStatement(sql: string, tables: Record<string, any[]>): D1PreparedStatement {
	let bindings: any[] = [];

	const statement = {
		bind(...values: any[]) {
			bindings = values;
			return statement;
		},

		async first<T = unknown>(colName?: string): Promise<T | null> {
			const result = await statement.all<T>();
			if (!result.results || result.results.length === 0) return null;
			if (colName) {
				return (result.results[0] as any)[colName] || null;
			}
			return result.results[0];
		},

		async all<T = unknown>(): Promise<D1Result<T>> {
			const results = executeQuery<T>(sql, bindings, tables);
			return {
				results: results || [],
				success: true,
				meta: {
					duration: 0.1,
					rows_read: results.length,
					rows_written: 0
				}
			};
		},

		async run<T = unknown>(): Promise<D1Result<T>> {
			// For INSERT/UPDATE/DELETE - modified array length indicates change count
			const modified = executeQuery<T>(sql, bindings, tables);
			const changes = Array.isArray(modified) ? modified.length : 0;
			return {
				results: [],
				success: true,
				meta: {
					duration: 0.1,
					changes,
					last_row_id: changes ? 1 : 0,
					rows_read: 0,
					rows_written: changes ? 1 : 0
				}
			};
		},

		async raw<T = unknown>(): Promise<T[]> {
			const result = await statement.all<T>();
			return result.results || [];
		}
	} as D1PreparedStatement;

	return statement;
}

/**
 * Simple SQL query executor for common patterns
 * This is a simplified implementation - extend as needed
 */
function executeQuery<T>(sql: string, bindings: any[], tables: Record<string, any[]>): T[] {
	const sqlLower = sql.toLowerCase().trim();

	// SELECT queries
	if (sqlLower.startsWith('select')) {
		// Handle COUNT(*) queries
		const countMatch = sql.match(/select\s+count\(\*\)\s+as\s+(\w+)/i);
		if (countMatch) {
			const tableMatch = sql.match(/from\s+(\w+)/i);
			if (tableMatch) {
				const tableName = tableMatch[1];
				let results = [...(tables[tableName] || [])];

				// Apply WHERE filters for COUNT
				const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
				if (whereMatch && bindings.length > 0) {
					const fieldName = whereMatch[1];
					const value = bindings[0];
					results = results.filter((row) => row[fieldName] === value);
				}

				const countField = countMatch[1];
				return [{ [countField]: results.length }] as T[];
			}
		}

		// Extract table name
		const tableMatch = sql.match(/from\s+(\w+)/i);
		if (!tableMatch) return [];

		const tableName = tableMatch[1];
		let results = [...(tables[tableName] || [])];

		// WHERE clause - simple field = value matching
		const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
		if (whereMatch && bindings.length > 0) {
			const fieldName = whereMatch[1];
			const value = bindings[0];
			results = results.filter((row) => row[fieldName] === value);
		}

		// WHERE clause - multiple conditions (AND)
		const whereMultiMatch = sql.match(/where\s+(.*?)(?:order|limit|$)/i);
		if (whereMultiMatch) {
			const conditions = whereMultiMatch[1].split(/\s+and\s+/i);
			let bindingIndex = 0;

			conditions.forEach((condition) => {
				// Equality with binding: field = ?
				const eqMatch = condition.match(/(\w+)\s*=\s*\?/);
				if (eqMatch && bindingIndex < bindings.length) {
					const fieldName = eqMatch[1];
					const value = bindings[bindingIndex++];
					results = results.filter((row) => row[fieldName] === value);
					return;
				}

				// Datetime comparison: field > datetime('now')
				const datetimeGtMatch = condition.match(/(\w+)\s*>\s*datetime\(['"]now['"]\)/i);
				if (datetimeGtMatch) {
					const fieldName = datetimeGtMatch[1];
					const now = new Date().toISOString();
					results = results.filter((row) => {
						const fieldValue = row[fieldName];
						return fieldValue && fieldValue > now;
					});
					return;
				}

				// Datetime comparison: field < datetime('now')
				const datetimeLtMatch = condition.match(/(\w+)\s*<\s*datetime\(['"]now['"]\)/i);
				if (datetimeLtMatch) {
					const fieldName = datetimeLtMatch[1];
					const now = new Date().toISOString();
					results = results.filter((row) => {
						const fieldValue = row[fieldName];
						return fieldValue && fieldValue < now;
					});
				}
			});
		}

		// LIMIT clause
		const limitMatch = sql.match(/limit\s+(\d+)/i);
		if (limitMatch) {
			const limit = parseInt(limitMatch[1]);
			results = results.slice(0, limit);
		}

		return results as T[];
	}

	// INSERT queries
	if (sqlLower.startsWith('insert')) {
		const tableMatch = sql.match(/insert\s+into\s+(\w+)/i);
		if (tableMatch) {
			const tableName = tableMatch[1];
			const fieldsMatch = sql.match(/\((.*?)\)\s*values/is);
			const valuesMatch = sql.match(/values\s*\((.*?)\)/is);
			
			if (fieldsMatch && valuesMatch) {
				const fields = fieldsMatch[1].split(',').map((f) => f.trim());
				const values = valuesMatch[1].split(',').map((v) => v.trim());
				
				const newRow: any = {};
				let bindingIndex = 0;
				
				fields.forEach((field, i) => {
					const value = values[i];
					
					if (value === '?') {
						newRow[field] = bindings[bindingIndex++];
					} else if (value.startsWith("'") && value.endsWith("'")) {
						newRow[field] = value.slice(1, -1);
					} else if (value.match(/datetime\(['"]now['"]\s*,\s*['"](.*?)['"]\)/i)) {
						const offsetMatch = value.match(/datetime\(['"]now['"]\s*,\s*['"]([^'"]+)['"]\)/i);
						if (offsetMatch) {
							const now = new Date();
							const offset = offsetMatch[1];
							
							const minutesMatch = offset.match(/\+(\d+)\s*minutes?/i);
							const daysMatch = offset.match(/\+(\d+)\s*days?/i);
							
							if (minutesMatch) {
								now.setMinutes(now.getMinutes() + parseInt(minutesMatch[1]));
							} else if (daysMatch) {
								now.setDate(now.getDate() + parseInt(daysMatch[1]));
							}
							
							newRow[field] = now.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
						}
					} else if (value.match(/datetime\(['"]now['"]\)/i)) {
						newRow[field] = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
					}
				});
				
				tables[tableName].push(newRow);
				return [newRow] as T[];
			}
		}
		return [] as T[];
	}

	// UPDATE queries
	if (sqlLower.startsWith('update')) {
		const tableMatch = sql.match(/update\s+(\w+)/i);
		if (!tableMatch) return [] as T[];

		const tableName = tableMatch[1];
		const setMatch = sql.match(/set\s+(.*?)\s+where/i);
		const whereClause = sql.match(/where\s+(.*?)$/i);

		if (setMatch && whereClause) {
			// Count SET bindings to determine where WHERE bindings start
			const setFields = setMatch[1].split(',').map((s) => s.trim());
			let setBindingCount = 0;
			setFields.forEach((field) => {
				if (field.match(/=\s*\?/)) setBindingCount++;
			});

			// Parse WHERE conditions
			const conditions = whereClause[1].split(/\s+and\s+/i);
			let whereBindingIndex = setBindingCount;

			const matchesRow = (row: any): boolean => {
				for (const condition of conditions) {
					const eqMatch = condition.match(/(\w+)\s*=\s*\?/);
					if (eqMatch) {
						if (row[eqMatch[1]] !== bindings[whereBindingIndex++]) return false;
						continue;
					}

					const literalEqMatch = condition.match(/(\w+)\s*=\s*'([^']*)'/);
					if (literalEqMatch) {
						if (row[literalEqMatch[1]] !== literalEqMatch[2]) return false;
						continue;
					}

					const datetimeGtMatch = condition.match(/(\w+)\s*>\s*datetime\(['"]now['"]\)/i);
					if (datetimeGtMatch) {
						const fieldValue = row[datetimeGtMatch[1]];
						if (!fieldValue || fieldValue <= new Date().toISOString()) return false;
						continue;
					}
				}
				return true;
			};

			let changeCount = 0;
			tables[tableName].forEach((row) => {
				// Reset whereBindingIndex for each row
				whereBindingIndex = setBindingCount;
				if (matchesRow(row)) {
					let bindingIndex = 0;
					setFields.forEach((field) => {
						const bindingMatchField = field.match(/(\w+)\s*=\s*\?/);
						if (bindingMatchField && bindingIndex < setBindingCount) {
							row[bindingMatchField[1]] = bindings[bindingIndex++];
							return;
						}

						const literalMatch = field.match(/(\w+)\s*=\s*'([^']*)'/);
						if (literalMatch) {
							row[literalMatch[1]] = literalMatch[2];
						}

						const datetimeMatch = field.match(/(\w+)\s*=\s*datetime\(['"]now['"]\)/i);
						if (datetimeMatch) {
							row[datetimeMatch[1]] = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
						}
					});
					changeCount++;
				}
			});
			// Return array with one element per changed row to signal change count
			return new Array(changeCount).fill({}) as T[];
		}
		return [] as T[];
	}

	// DELETE queries
	if (sqlLower.startsWith('delete')) {
		const tableMatch = sql.match(/delete\s+from\s+(\w+)/i);
		if (!tableMatch) return [] as T[];

		const tableName = tableMatch[1];
		const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);

		if (whereMatch && bindings.length > 0) {
			const fieldName = whereMatch[1];
			const value = bindings[0];
			const index = tables[tableName].findIndex((row) => row[fieldName] === value);
			if (index !== -1) {
				tables[tableName].splice(index, 1);
				return [{}] as T[];
			}
		}
		return [] as T[];
	}

	return [] as T[];
}
