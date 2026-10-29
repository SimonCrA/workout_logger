import { describe, expect, it } from 'vitest';
import { exercises, muscles } from './index';

/** Filas del seed que la revisión del catálogo (#4) renombró, fusionó o cambió de músculo. */
const REVISED: Record<string, { name?: string; muscle?: string }> = {
	'Abducción en máquina': { name: 'Abducción de cadera en máquina' },
	'Elevaciones laterales de pierna': { name: 'Elevación lateral de pierna' },
	'Patadas laterales de pie': { name: 'Patada lateral de pie' },
	'Abducción con banda elástica': { name: 'Abducción de cadera con banda' },
	'Zancadas laterales': { name: 'Zancada lateral', muscle: 'quads' },
	'Sentadilla sumo': { muscle: 'glutes' },
	'Ab wheel rollout': { name: 'Rueda abdominal' },
	'Mountain climbers': { name: 'Escaladores' },
	'Good mornings': { name: 'Buenos días con barra' },
	'Pull-over con mancuerna': { name: 'Pullover con mancuerna' },
	'Hip thrust': { name: 'Empuje de cadera con barra' },
	'Aducción en máquina': { name: 'Aducción de cadera en máquina' },
	'Aducción en máquina sentado': { name: 'Aducción de cadera en máquina' },
	// Fila de aductores del seed; el nombre lo lleva ahora el ejercicio de abductores.
	'Elevación lateral de pierna': { name: 'Elevación de pierna interna' },
	'Extensión de tríceps en polea alta': { name: 'Extensión de tríceps en polea' },
	'Remo al cuello con barra': { name: 'Remo al mentón con barra' },
	'Remo al cuello con banda elástica': { name: 'Remo al mentón con banda elástica' },
	'Elevación de talones en máquina': { name: 'Elevación de talones en prensa' },
	'Inclinación lateral con banda': { name: 'Inclinación lateral de cuello con banda' },
	'Flexión lateral con banda': { name: 'Inclinación lateral de cuello con banda' },
	'Extensiones de piernas': { name: 'Extensión de piernas' },
	'Elevaciones laterales con mancuernas': { name: 'Elevación lateral con mancuernas' },
	'Elevaciones frontales con mancuernas': { name: 'Elevación frontal con mancuernas' },
	'Elevaciones posteriores en máquina': { name: 'Elevación posterior en máquina' },
	'Zancadas cruzadas': { name: 'Zancada cruzada' },
	'Encogimientos laterales': { name: 'Crunch lateral' }
};

describe('catalog integrity', () => {
	it('every muscle an exercise references exists', () => {
		const codes = new Set(muscles.map((m) => m.code));
		const referenced = exercises.flatMap((e) => [e.primaryMuscle, ...e.secondaryMuscles]);
		const missing = referenced.filter((code) => !codes.has(code));

		expect(missing).toEqual([]);
	});

	it('has no duplicate muscle names, codes or region ids', () => {
		const names = muscles.map((m) => m.name);
		const codes = muscles.map((m) => m.code);
		const regionIds = muscles.flatMap((m) => m.regions.map((r) => r.id));

		expect(new Set(names).size).toBe(names.length);
		expect(new Set(codes).size).toBe(codes.length);
		expect(new Set(regionIds).size).toBe(regionIds.length);
	});

	it('has no duplicate exercise names or ids', () => {
		const names = exercises.map((e) => e.name);
		const ids = exercises.map((e) => e.id);

		expect(new Set(names).size).toBe(names.length);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('fills the required fields of every muscle and exercise', () => {
		for (const muscle of muscles) {
			expect(muscle.code).not.toBe('');
			expect(muscle.name).not.toBe('');
			expect(muscle.description).not.toBe('');
			expect(muscle.regions.length).toBeGreaterThan(0);
		}
		for (const exercise of exercises) {
			expect(exercise.id).not.toBe('');
			expect(exercise.name).not.toBe('');
			expect(exercise.description).not.toBe('');
			expect(exercise.primaryMuscle).not.toBe('');
			expect(exercise.secondaryMuscles).not.toContain(exercise.primaryMuscle);
		}
	});

	it('merges the per-view duplicates into one muscle with a region per view (ADR-0004)', () => {
		const adductors = muscles.find((m) => m.code === 'adductors');

		expect(adductors?.regions).toEqual([
			{ id: 'adductors_f', view: 'front' },
			{ id: 'adductors_b', view: 'back' }
		]);
		expect(muscles.map((m) => m.code)).not.toContain('adductors_f');
	});

	it('keeps every exercise of the Astro seed, under the muscle it had unless the revision moved it', () => {
		// Independent source of truth: the 96 rows of db/seed.ts on main, by old muscle code.
		// A row that existed under both halves of a muscle (traps_f and traps_b, ...) is one exercise now.
		const oldMuscle = (code: string) => code.replace(/_[fb]$/, '');
		const lost: string[] = [];
		for (const [code, names] of Object.entries(ASTRO_SEED)) {
			for (const name of names) {
				const revised = REVISED[name] ?? {};
				const target = revised.name ?? name;
				const muscle = revised.muscle ?? oldMuscle(code);
				const found = exercises.find(
					(e) => e.name === target && [e.primaryMuscle, ...e.secondaryMuscles].includes(muscle)
				);
				if (!found) lost.push(`${code}: ${name}`);
			}
		}

		expect(lost).toEqual([]);
	});
});

const ASTRO_SEED: Record<string, string[]> = {
	chest: [
		'Press de banca plano',
		'Press inclinado con mancuernas',
		'Aperturas con mancuernas',
		'Press declinado con barra',
		'Fondos en paralelas',
		'Press con máquina'
	],
	biceps: [
		'Curl con barra recta',
		'Curl alterno con mancuernas',
		'Curl martillo',
		'Curl concentrado',
		'Curl en banco inclinado',
		'Curl en predicador'
	],
	abductors: [
		'Abducción en máquina',
		'Elevaciones laterales de pierna',
		'Patadas laterales de pie',
		'Abducción con banda elástica',
		'Zancadas laterales',
		'Sentadilla sumo'
	],
	quads: [
		'Sentadilla frontal',
		'Prensa de piernas',
		'Extensiones de piernas',
		'Sentadilla búlgara',
		'Sentadilla con barra',
		'Sentadilla hack'
	],
	abdominals: [
		'Crunch abdominal',
		'Elevación de piernas',
		'Plancha frontal',
		'Crunch en máquina',
		'Ab wheel rollout',
		'Mountain climbers'
	],
	hamstrings: [
		'Peso muerto rumano',
		'Curl femoral tumbado',
		'Curl femoral sentado',
		'Peso muerto con piernas rígidas',
		'Puente de glúteos',
		'Good mornings'
	],
	dorsals: [
		'Jalón al pecho',
		'Remo con barra',
		'Remo con mancuernas',
		'Pull-over con mancuerna',
		'Remo en máquina',
		'Jalón tras nuca'
	],
	glutes: [
		'Hip thrust',
		'Sentadilla sumo',
		'Patada de glúteo en máquina',
		'Zancadas caminando',
		'Peso muerto sumo',
		'Abducción de cadera en máquina'
	],
	adductors_f: ['Aducción en máquina', 'Elevación lateral de pierna', 'Zancada lateral'],
	forearms_f: [
		'Curl de muñeca con barra',
		'Extensión de muñeca con barra',
		'Rotación de muñeca con mancuerna'
	],
	triceps_f: ['Extensión de tríceps en polea', 'Press francés', 'Fondos en banco'],
	shoulders_f: [
		'Press militar con barra',
		'Elevaciones frontales con mancuernas',
		'Elevaciones laterales con mancuernas'
	],
	traps_f: ['Encogimientos con barra', 'Remo al cuello con barra', 'Encogimientos con mancuernas'],
	calves_f: [
		'Elevación de talones de pie',
		'Elevación de talones sentado',
		'Elevación de talones en máquina'
	],
	obliques_f: ['Giros rusos', 'Plancha lateral', 'Encogimientos laterales'],
	neck_f: [
		'Flexión de cuello con resistencia',
		'Extensión de cuello con banda',
		'Inclinación lateral con banda'
	],
	adductors_b: ['Aducción en máquina sentado', 'Aducción con banda elástica', 'Zancadas cruzadas'],
	forearms_b: [
		'Curl inverso con barra',
		'Extensión de muñeca con mancuerna',
		'Rotación de muñeca con barra'
	],
	triceps_b: [
		'Extensión de tríceps con mancuerna',
		'Fondos en paralelas',
		'Extensión de tríceps en polea alta'
	],
	shoulders_b: [
		'Pájaros con mancuernas',
		'Remo al mentón con barra',
		'Elevaciones posteriores en máquina'
	],
	traps_b: [
		'Encogimientos con barra',
		'Remo al cuello con banda elástica',
		'Encogimientos con mancuernas'
	],
	calves_b: [
		'Elevación de talones de pie',
		'Elevación de talones sentado',
		'Elevación de talones en máquina'
	],
	obliques_b: ['Giros rusos', 'Plancha lateral', 'Encogimientos laterales'],
	neck_b: [
		'Extensión de cuello con resistencia',
		'Flexión lateral con banda',
		'Rotación de cuello con banda'
	]
};
