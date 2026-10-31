import { describe, expect, it } from 'vitest';
import { baseRoutines, exercises, routineGroups } from './index';

describe('base routine integrity', () => {
	it('references only exercises of the catalog', () => {
		const ids = new Set(exercises.map((e) => e.id));
		const missing = baseRoutines.flatMap((routine) =>
			routine.exercises
				.filter((entry) => !ids.has(entry.exerciseId))
				.map((entry) => `${routine.id}: ${entry.exerciseId}`)
		);

		expect(missing).toEqual([]);
	});

	it('does not repeat an exercise within a routine', () => {
		const repeated = baseRoutines
			.filter((routine) => {
				const ids = routine.exercises.map((entry) => entry.exerciseId);
				return new Set(ids).size !== ids.length;
			})
			.map((routine) => routine.id);

		expect(repeated).toEqual([]);
	});

	it('prescribes at least one set and a reps range whose minimum is not above its maximum', () => {
		const wrong = baseRoutines.flatMap((routine) =>
			routine.exercises
				.filter((entry) => !(entry.sets > 0 && entry.repsMin > 0 && entry.repsMin <= entry.repsMax))
				.map((entry) => `${routine.id}: ${entry.exerciseId}`)
		);

		expect(wrong).toEqual([]);
	});

	it('keeps RIR and rest, when prescribed, as sensible numbers', () => {
		const wrong = baseRoutines.flatMap((routine) =>
			routine.exercises
				.filter(
					(entry) =>
						(entry.rir !== null && !(entry.rir >= 0 && entry.rir <= 4)) ||
						(entry.rest !== null && !(entry.rest > 0))
				)
				.map((entry) => `${routine.id}: ${entry.exerciseId}`)
		);

		expect(wrong).toEqual([]);
	});

	it('has unique routine ids and names, and unique group ids and names', () => {
		const routineIds = baseRoutines.map((r) => r.id);
		const routineNames = baseRoutines.map((r) => r.name);
		const groupIds = routineGroups.map((g) => g.id);
		const groupNames = routineGroups.map((g) => g.name);

		expect(new Set(routineIds).size).toBe(routineIds.length);
		expect(new Set(routineNames).size).toBe(routineNames.length);
		expect(new Set(groupIds).size).toBe(groupIds.length);
		expect(new Set(groupNames).size).toBe(groupNames.length);
	});

	it('places every routine in an existing group and gives every group at least one routine', () => {
		const groupIds = new Set(routineGroups.map((g) => g.id));
		const orphan = baseRoutines.filter((r) => !groupIds.has(r.group)).map((r) => r.id);
		const empty = routineGroups
			.filter((g) => !baseRoutines.some((r) => r.group === g.id))
			.map((g) => g.id);

		expect(orphan).toEqual([]);
		expect(empty).toEqual([]);
	});

	it('fills the required fields of every group and routine', () => {
		for (const group of routineGroups) {
			expect(group.id).not.toBe('');
			expect(group.name).not.toBe('');
		}
		for (const routine of baseRoutines) {
			expect(routine.id).not.toBe('');
			expect(routine.name).not.toBe('');
			expect(routine.exercises.length).toBeGreaterThan(0);
		}
	});

	it('offers the agreed groups, PPL first, with about twelve routines (#13)', () => {
		expect(routineGroups.map((g) => g.name)).toEqual([
			'Empuje, Tirón y Pierna (PPL)',
			'Tren superior y Tren inferior',
			'Cuerpo completo',
			'Espalda y pecho',
			'Brazos',
			'Pierna completa',
			'Core',
			'Glúteo y femoral',
			'Hombro y brazo'
		]);
		// "Unas doce": el número exacto es del dueño, no del test.
		expect(baseRoutines.length).toBeGreaterThanOrEqual(10);
		expect(baseRoutines.length).toBeLessThanOrEqual(14);
	});
});
