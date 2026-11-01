import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { createRoutine, deleteRoutine, listRoutines, updateRoutine } from './routines';

const at = (iso: string) => new Date(iso);
const press = {
	exerciseId: 'press-de-banca-plano',
	sets: 3,
	repsMin: 5,
	repsMax: 8,
	rir: null,
	rest: 150
};
const remo = { exerciseId: 'remo-con-barra', sets: 3, repsMin: 8, repsMax: 12, rir: 2, rest: 90 };
const empujeA = { name: ' Empuje A ', baseRoutineId: 'empuje', exercises: [press] };

beforeEach(() => db.routines.clear());

describe('custom routines on the device (spec #14: Guardar creates, editing updates, deleting is logical)', () => {
	it('creates a pending, anonymous routine with what the editor had, the name trimmed', async () => {
		const routine = await createRoutine(empujeA, at('2026-10-31T10:00:00Z'));

		expect(routine).toMatchObject({
			name: 'Empuje A',
			baseRoutineId: 'empuje',
			exercises: [press],
			userId: null,
			createdAt: '2026-10-31T10:00:00.000Z',
			updatedAt: '2026-10-31T10:00:00.000Z',
			deletedAt: null,
			pending: 1
		});
		expect(await db.routines.get(routine.id)).toEqual(routine);
	});

	it('lists the live routines in the order they were created', async () => {
		const first = await createRoutine(empujeA, at('2026-10-31T10:00:00Z'));
		const second = await createRoutine(
			{ name: 'Tirón A', baseRoutineId: null, exercises: [remo] },
			at('2026-10-31T10:05:00Z')
		);

		expect((await listRoutines()).map((r) => r.id)).toEqual([first.id, second.id]);
	});

	it('updates what the editor saved, marks the routine pending and keeps when it was created', async () => {
		const routine = await createRoutine(empujeA, at('2026-10-31T10:00:00Z'));

		const updated = await updateRoutine(
			routine.id,
			{ name: 'Empuje B', baseRoutineId: 'empuje', exercises: [remo, press] },
			at('2026-10-31T11:00:00Z')
		);

		expect(updated).toEqual({
			...routine,
			name: 'Empuje B',
			exercises: [remo, press],
			updatedAt: '2026-10-31T11:00:00.000Z',
			pending: 1
		});
		expect(await db.routines.get(routine.id)).toEqual(updated);
	});

	it('deletes logically: the row stays to sync but leaves the list, and cannot be edited again', async () => {
		const routine = await createRoutine(empujeA, at('2026-10-31T10:00:00Z'));

		const deleted = await deleteRoutine(routine.id, at('2026-10-31T12:00:00Z'));

		expect(deleted).toMatchObject({
			id: routine.id,
			deletedAt: '2026-10-31T12:00:00.000Z',
			updatedAt: '2026-10-31T12:00:00.000Z',
			pending: 1
		});
		expect(await listRoutines()).toEqual([]);
		expect(await db.routines.count()).toBe(1);
		expect(await updateRoutine(routine.id, empujeA, at('2026-10-31T13:00:00Z'))).toBeUndefined();
		expect(await deleteRoutine(routine.id, at('2026-10-31T13:00:00Z'))).toBeUndefined();
	});

	it('does nothing for a routine that does not exist', async () => {
		expect(await updateRoutine('nadie', empujeA)).toBeUndefined();
		expect(await deleteRoutine('nadie')).toBeUndefined();
	});
});
