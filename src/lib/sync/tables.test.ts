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

	it('shapes the push request after the list, and a table the request leaves out counts as empty', () => {
		// Un dispositivo con la app anterior no conoce las tablas nuevas y sube sin ellas (spec #10).
		const empty = Object.fromEntries(syncTables.map(({ key }) => [key, []]));

		expect(pushRequest.parse(empty)).toEqual(empty);
		for (const { key } of syncTables) {
			const { [key]: _dropped, ...without } = empty;
			expect(pushRequest.parse(without), `sin ${key}`).toEqual(empty);
		}
	});

	it('rejects the whole request when a row does not fit its table', () => {
		const empty = Object.fromEntries(syncTables.map(({ key }) => [key, []]));
		const [first] = syncTables;

		expect(pushRequest.safeParse({ ...empty, [first.key]: [{ id: 'x' }] }).success).toBe(false);
	});
});
