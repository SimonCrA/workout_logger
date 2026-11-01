import { describe, expect, it } from 'vitest';
import type { BaseRoutine } from '#lib/catalog/types.js';
import {
	addExercise,
	DEFAULT_OBJECTIVE,
	draftFromBase,
	draftOf,
	emptyDraft,
	hasChanges,
	moveExercise,
	normalizeDraft,
	objectiveProblem,
	removeExercise,
	ROUTINE_LIMITS,
	routineProblems,
	updateExercise
} from './routine-rules';
import type { Routine } from './types';

const empuje: BaseRoutine = {
	id: 'empuje',
	name: 'Empuje',
	group: 'ppl',
	exercises: [
		{ exerciseId: 'press-de-banca-plano', sets: 3, repsMin: 5, repsMax: 8, rir: null, rest: 150 },
		{ exerciseId: 'aperturas-con-mancuernas', sets: 3, repsMin: 8, repsMax: 12, rir: 2, rest: 90 }
	]
};

describe('the copy the editor works on (spec #14: nothing is written until Guardar)', () => {
	it('starts empty from scratch: no name, no base routine, no exercises', () => {
		expect(emptyDraft()).toEqual({ name: '', baseRoutineId: null, exercises: [] });
	});

	it('copies a base routine with its name, its exercises and a note of where it comes from', () => {
		const draft = draftFromBase(empuje);

		expect(draft).toEqual({
			name: 'Empuje',
			baseRoutineId: 'empuje',
			exercises: empuje.exercises
		});
		// Es una copia: editarla no toca el catálogo.
		expect(draft.exercises).not.toBe(empuje.exercises);
		expect(draft.exercises[0]).not.toBe(empuje.exercises[0]);
	});

	it('takes what a stored routine prescribes, without its sync columns', () => {
		const stored: Routine = {
			id: 'r1',
			userId: null,
			name: 'Empuje A',
			baseRoutineId: 'empuje',
			exercises: [empuje.exercises[0]],
			createdAt: '2026-10-31T10:00:00.000Z',
			updatedAt: '2026-10-31T10:00:00.000Z',
			deletedAt: null,
			pending: 1
		};

		expect(draftOf(stored)).toEqual({
			name: 'Empuje A',
			baseRoutineId: 'empuje',
			exercises: [empuje.exercises[0]]
		});
		expect(draftOf(stored).exercises).not.toBe(stored.exercises);
	});
});

describe('editing the copy (spec #14: add from the search, remove, reorder, set the objective)', () => {
	const press = 'press-de-banca-plano';
	const aperturas = 'aperturas-con-mancuernas';
	const militar = 'press-militar-con-barra';
	const ids = (draft: { exercises: { exerciseId: string }[] }) =>
		draft.exercises.map((entry) => entry.exerciseId);

	it('adds an exercise at the end with the default objective, 3 × 8–12 without RIR or rest', () => {
		const draft = addExercise(draftFromBase(empuje), militar);

		expect(ids(draft)).toEqual([press, aperturas, militar]);
		expect(draft.exercises[2]).toEqual({ exerciseId: militar, ...DEFAULT_OBJECTIVE });
		expect(DEFAULT_OBJECTIVE).toEqual({ sets: 3, repsMin: 8, repsMax: 12, rir: null, rest: null });
	});

	it('does not repeat an exercise that is already in the routine', () => {
		const draft = draftFromBase(empuje);

		expect(addExercise(draft, press)).toBe(draft);
	});

	it('removes an exercise and leaves the rest in order', () => {
		expect(ids(removeExercise(draftFromBase(empuje), press))).toEqual([aperturas]);
	});

	it('moves an exercise one place up or down, and not past either end', () => {
		const draft = addExercise(draftFromBase(empuje), militar);

		expect(ids(moveExercise(draft, militar, -1))).toEqual([press, militar, aperturas]);
		expect(ids(moveExercise(draft, press, 1))).toEqual([aperturas, press, militar]);
		expect(moveExercise(draft, press, -1)).toBe(draft);
		expect(moveExercise(draft, militar, 1)).toBe(draft);
	});

	it('changes the objective, the RIR target or the suggested rest of one exercise only', () => {
		const draft = updateExercise(draftFromBase(empuje), aperturas, {
			sets: 4,
			rir: null,
			rest: 60
		});

		expect(draft.exercises[1]).toEqual({
			exerciseId: aperturas,
			sets: 4,
			repsMin: 8,
			repsMax: 12,
			rir: null,
			rest: 60
		});
		expect(draft.exercises[0]).toEqual(empuje.exercises[0]);
	});

	it('never mutates the copy it was given, so an undone edit is just the previous copy', () => {
		const before = draftFromBase(empuje);
		const snapshot = structuredClone(before);

		addExercise(before, militar);
		removeExercise(before, press);
		moveExercise(before, aperturas, -1);
		updateExercise(before, press, { sets: 5 });

		expect(before).toEqual(snapshot);
	});
});

describe('what can be saved (spec #14: name required; per exercise, sets and a reps range with min ≤ max)', () => {
	const press = empuje.exercises[0];

	it('accepts a copy of a base routine as it comes, and a named routine without exercises', () => {
		expect(routineProblems(draftFromBase(empuje))).toEqual([]);
		expect(routineProblems({ ...emptyDraft(), name: 'Pierna B' })).toEqual([]);
	});

	it('needs a name; spaces alone do not count', () => {
		expect(routineProblems(emptyDraft())).toEqual(['Ponle un nombre a la rutina']);
		expect(routineProblems({ ...emptyDraft(), name: '   ' })).toEqual([
			'Ponle un nombre a la rutina'
		]);
	});

	it('names what is wrong in an objective, and nothing when it is fine', () => {
		expect(objectiveProblem(press)).toBeNull();
		expect(objectiveProblem({ ...press, rir: null, rest: null })).toBeNull();
		expect(objectiveProblem({ ...press, sets: 0 })).toBe('Al menos una serie');
		expect(objectiveProblem({ ...press, sets: 2.5 })).toBe('Al menos una serie');
		expect(objectiveProblem({ ...press, repsMin: 0 })).toBe('Las reps empiezan en 1');
		expect(objectiveProblem({ ...press, repsMin: 12, repsMax: 8 })).toBe(
			'El mínimo de reps no puede superar el máximo'
		);
		expect(objectiveProblem({ ...press, rest: 0 })).toBe(
			'El descanso va en segundos, mayor que cero'
		);
	});

	it('caps what the sync row accepts, so a saved routine can always be uploaded', () => {
		expect(ROUTINE_LIMITS).toEqual({
			name: 100,
			exercises: 100,
			sets: 100,
			reps: 1000,
			rir: 4,
			rest: 3600
		});
		expect(objectiveProblem({ ...press, sets: 101 })).toBe('Como mucho 100 series');
		expect(objectiveProblem({ ...press, repsMax: 1001 })).toBe('Las reps llegan hasta 1000');
		expect(objectiveProblem({ ...press, rir: 5 })).toBe('El RIR objetivo va de 0 a 4');
		expect(objectiveProblem({ ...press, rest: 3601 })).toBe('El descanso llega hasta 3600 s');
		expect(routineProblems({ ...emptyDraft(), name: 'x'.repeat(101) })).toEqual([
			'El nombre no puede pasar de 100 caracteres'
		]);
		const tooMany = Array.from({ length: 101 }, (_, i) => ({ ...press, exerciseId: `e${i}` }));
		expect(routineProblems({ name: 'Todo', baseRoutineId: null, exercises: tooMany })).toEqual([
			'Como mucho 100 ejercicios'
		]);
	});

	it('does not let an exercise repeat, and reports each problem once with the name first', () => {
		const draft = {
			name: '',
			baseRoutineId: null,
			exercises: [
				{ ...press, sets: 0 },
				{ ...press, sets: 0 }
			]
		};

		expect(routineProblems(draft)).toEqual([
			'Ponle un nombre a la rutina',
			'Un ejercicio no puede repetirse',
			'Al menos una serie'
		]);
	});
});

describe('leaving the editor (spec #14: leaving with unsaved changes asks whether to discard them)', () => {
	it('has changes after an edit, none after undoing it, and spaces around the name do not count', () => {
		const saved = draftFromBase(empuje);

		expect(hasChanges(saved, saved)).toBe(false);
		expect(hasChanges({ ...saved, name: ' Empuje ' }, saved)).toBe(false);
		expect(hasChanges({ ...saved, name: 'Empuje A' }, saved)).toBe(true);
		expect(hasChanges(removeExercise(saved, 'aperturas-con-mancuernas'), saved)).toBe(true);
		expect(hasChanges(updateExercise(saved, 'press-de-banca-plano', { rest: 120 }), saved)).toBe(
			true
		);
		expect(hasChanges(draftOf({ ...saved, ...syncColumns }), saved)).toBe(false);
	});

	it('compares what is prescribed, not how the fields are ordered, so a row from the server counts as unchanged', () => {
		const saved = draftFromBase(empuje);
		const reordered = {
			exercises: saved.exercises.map(({ rest, rir, repsMax, repsMin, sets, exerciseId }) => ({
				rest,
				rir,
				repsMax,
				repsMin,
				sets,
				exerciseId
			})),
			baseRoutineId: saved.baseRoutineId,
			name: saved.name
		};

		expect(hasChanges(reordered, saved)).toBe(false);
		expect(hasChanges({ ...reordered, exercises: reordered.exercises.slice(1) }, saved)).toBe(true);
	});

	it('saves the name without the spaces around it', () => {
		expect(normalizeDraft({ ...emptyDraft(), name: ' Pierna B ' }).name).toBe('Pierna B');
	});
});

const syncColumns = {
	id: 'r1',
	userId: null,
	createdAt: '2026-10-31T10:00:00.000Z',
	updatedAt: '2026-10-31T10:00:00.000Z',
	deletedAt: null,
	pending: 1 as const
};
