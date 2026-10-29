import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { exercises, getExercise } from './index';

/** Criterios del catálogo completo (#4). */
describe('catalog revision', () => {
	it('offers pull-ups and dips both with body weight and assisted', () => {
		const modes = Object.fromEntries(
			['Dominadas', 'Dominadas asistidas', 'Fondos en paralelas', 'Fondos asistidos'].map(
				(name) => [name, exercises.find((e) => e.name === name)?.loadMode]
			)
		);

		expect(modes).toEqual({
			Dominadas: 'bodyweight',
			'Dominadas asistidas': 'assisted',
			'Fondos en paralelas': 'bodyweight',
			'Fondos asistidos': 'assisted'
		});
	});

	it('lists the synergists of the compound lifts as secondary muscles', () => {
		expect(getExercise('press-de-banca-plano')?.secondaryMuscles).toEqual(['triceps', 'shoulders']);
		expect(getExercise('dominadas')?.secondaryMuscles).toContain('biceps');
		expect(getExercise('sentadilla-con-barra')?.secondaryMuscles).toContain('glutes');
	});

	it('uses the assisted mode only on assisted exercises', () => {
		const assisted = exercises.filter((e) => e.loadMode === 'assisted').map((e) => e.name);

		expect(assisted.sort()).toEqual(['Dominadas asistidas', 'Fondos asistidos']);
	});

	it('cites the anatomical source in the data file itself', () => {
		const source = readFileSync(new URL('./exercises.ts', import.meta.url), 'utf8');

		expect(source).toContain('https://exrx.net/Lists/Directory');
	});
});
