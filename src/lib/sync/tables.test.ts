import { describe, expect, it } from 'vitest';
import { pushRequest } from './protocol';
import { syncTables } from './tables';

/** La lista de tablas sincronizadas es un dato: estas pruebas fijan lo que cliente y servidor asumen de ella. */
describe('syncTables (spec: the list drives push, pull, attach and cleanup, parents before children)', () => {
	it('declares every parent as a table that comes earlier in the list', () => {
		expect(syncTables.length).toBeGreaterThan(0);
		syncTables.forEach((table, position) => {
			if (table.parent === null) return;
			const parentPosition = syncTables.findIndex((other) => other.key === table.parent.table);
			expect(parentPosition, `${table.key} cuelga de ${table.parent.table}`).toBeGreaterThanOrEqual(
				0
			);
			expect(parentPosition, `${table.parent.table} va antes que ${table.key}`).toBeLessThan(
				position
			);
		});
	});

	it('points each parent rule at a column of the child row', () => {
		for (const table of syncTables) {
			if (table.parent === null) continue;
			expect(Object.keys(table.row.shape), `${table.key}.${table.parent.column}`).toContain(
				table.parent.column
			);
		}
	});

	it('shapes the push request after the list: every declared table, none missing', () => {
		const empty = Object.fromEntries(syncTables.map(({ key }) => [key, []]));

		expect(pushRequest.safeParse(empty).success).toBe(true);
		for (const { key } of syncTables) {
			const { [key]: _dropped, ...without } = empty;
			expect(pushRequest.safeParse(without).success, `sin ${key}`).toBe(false);
		}
	});
});
