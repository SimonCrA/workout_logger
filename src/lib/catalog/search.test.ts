import { describe, expect, it } from 'vitest';
import { searchCatalog } from './index';

describe('searchCatalog', () => {
	it('finds a muscle by a fragment of its name, ignoring case and accents', () => {
		const { muscles } = searchCatalog('gluteo');

		expect(muscles.map((m) => m.name)).toEqual(['Glúteos']);
	});

	it('finds exercises by a fragment of their name', () => {
		const { exercises } = searchCatalog('peso muerto');

		expect(exercises.map((e) => e.name)).toEqual([
			'Peso muerto rumano',
			'Peso muerto con piernas rígidas',
			'Peso muerto sumo'
		]);
	});

	it('returns nothing for a blank query', () => {
		expect(searchCatalog('   ')).toEqual({ muscles: [], exercises: [] });
	});

	it('ranks names that start with the query before names that merely contain it', () => {
		const { muscles } = searchCatalog('do');

		expect(muscles.map((m) => m.name)).toEqual(['Dorsales', 'Abdominales']);
	});
});
