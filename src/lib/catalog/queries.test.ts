import { describe, expect, it } from 'vitest';
import { exercisesOf, getExercise, getMuscle, muscleOfRegion, viewFor } from './index';

describe('exercisesOf', () => {
	it('lists the exercises with the muscle as primary before those with it as secondary', () => {
		const { primary, secondary } = exercisesOf('triceps');

		expect(primary.map((e) => e.name)).toContain('Press francés');
		expect(primary.map((e) => e.name)).not.toContain('Fondos en paralelas');
		expect(secondary.map((e) => e.name)).toEqual(['Fondos en paralelas']);
	});

	it('returns empty lists for a muscle with no exercises', () => {
		expect(exercisesOf('nope')).toEqual({ primary: [], secondary: [] });
	});
});

describe('muscleOfRegion', () => {
	it('maps both regions of a two-view muscle to that muscle', () => {
		expect(muscleOfRegion('adductors_f')?.code).toBe('adductors');
		expect(muscleOfRegion('adductors_b')?.code).toBe('adductors');
	});

	it('returns undefined for an id that is not a region', () => {
		expect(muscleOfRegion('outline_back')).toBeUndefined();
	});
});

describe('viewFor', () => {
	it('keeps the current view when the muscle has a region in it', () => {
		expect(viewFor(getMuscle('adductors')!, 'back')).toBe('back');
	});

	it('switches to the view of the muscle when the current one has no region of it', () => {
		expect(viewFor(getMuscle('dorsals')!, 'front')).toBe('back');
		expect(viewFor(getMuscle('chest')!, 'back')).toBe('front');
	});
});

describe('getMuscle and getExercise', () => {
	it('find an item by code or id and return undefined otherwise', () => {
		expect(getMuscle('chest')?.name).toBe('Pecho');
		expect(getExercise('press-de-banca-plano')?.name).toBe('Press de banca plano');
		expect(getMuscle('x')).toBeUndefined();
		expect(getExercise('x')).toBeUndefined();
	});
});
