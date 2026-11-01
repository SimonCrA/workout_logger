import type { BaseRoutine, RoutineExercise, RoutineGroup } from './types';

/**
 * Rutinas base (#13), redactadas con los esquemas estándar de hipertrofia acordados en la fase 2:
 * los básicos a 3 × 5–8 con 150 s de descanso y los accesorios a 3 × 8–12 con RIR 2 y 90 s.
 * Solo ejercicios del catálogo, sin repetir ninguno dentro de una rutina; `routines.test.ts` lo comprueba.
 * Es contenido, no código: el dueño lo revisa en el ticket.
 */

/** Un básico multiarticular: pesado, con descanso largo y sin RIR objetivo. */
const basic = (exerciseId: string): RoutineExercise => ({
	exerciseId,
	sets: 3,
	repsMin: 5,
	repsMax: 8,
	rir: null,
	rest: 150
});

/** Un accesorio: más reps, dos en reserva y descanso corto. */
const accessory = (exerciseId: string): RoutineExercise => ({
	exerciseId,
	sets: 3,
	repsMin: 8,
	repsMax: 12,
	rir: 2,
	rest: 90
});

export const routineGroups: readonly RoutineGroup[] = [
	{ id: 'ppl', name: 'Empuje, Tirón y Pierna (PPL)' },
	{ id: 'superior-inferior', name: 'Tren superior y Tren inferior' },
	{ id: 'cuerpo-completo', name: 'Cuerpo completo' },
	{ id: 'espalda-y-pecho', name: 'Espalda y pecho' },
	{ id: 'brazos', name: 'Brazos' },
	{ id: 'pierna-completa', name: 'Pierna completa' },
	{ id: 'core', name: 'Core' },
	{ id: 'gluteo-y-femoral', name: 'Glúteo y femoral' },
	{ id: 'hombro-y-brazo', name: 'Hombro y brazo' }
];

export const baseRoutines: readonly BaseRoutine[] = [
	{
		id: 'empuje',
		name: 'Empuje',
		group: 'ppl',
		exercises: [
			basic('press-de-banca-plano'),
			basic('press-militar-con-barra'),
			accessory('press-inclinado-con-mancuernas'),
			accessory('aperturas-con-mancuernas'),
			accessory('elevacion-lateral-con-mancuernas'),
			accessory('extension-de-triceps-en-polea')
		]
	},
	{
		id: 'tiron',
		name: 'Tirón',
		group: 'ppl',
		exercises: [
			basic('remo-con-barra'),
			accessory('jalon-al-pecho'),
			accessory('remo-con-mancuernas'),
			accessory('pajaros-con-mancuernas'),
			accessory('curl-con-barra-recta'),
			accessory('curl-martillo')
		]
	},
	{
		id: 'pierna',
		name: 'Pierna',
		group: 'ppl',
		exercises: [
			basic('sentadilla-con-barra'),
			basic('peso-muerto-rumano'),
			accessory('prensa-de-piernas'),
			accessory('curl-femoral-tumbado'),
			accessory('extension-de-piernas'),
			accessory('elevacion-de-talones-de-pie')
		]
	},
	{
		id: 'tren-superior',
		name: 'Tren superior',
		group: 'superior-inferior',
		exercises: [
			basic('press-de-banca-plano'),
			basic('remo-con-barra'),
			basic('press-militar-con-barra'),
			accessory('jalon-al-pecho'),
			accessory('curl-alterno-con-mancuernas'),
			accessory('extension-de-triceps-en-polea')
		]
	},
	{
		id: 'tren-inferior',
		name: 'Tren inferior',
		group: 'superior-inferior',
		exercises: [
			basic('sentadilla-con-barra'),
			basic('peso-muerto-rumano'),
			basic('empuje-de-cadera-con-barra'),
			accessory('prensa-de-piernas'),
			accessory('curl-femoral-sentado'),
			accessory('elevacion-de-talones-sentado')
		]
	},
	{
		id: 'cuerpo-completo',
		name: 'Cuerpo completo',
		group: 'cuerpo-completo',
		exercises: [
			basic('sentadilla-con-barra'),
			basic('press-de-banca-plano'),
			basic('remo-con-barra'),
			basic('peso-muerto-rumano'),
			accessory('elevacion-lateral-con-mancuernas'),
			accessory('curl-con-barra-recta')
		]
	},
	{
		id: 'espalda-y-pecho',
		name: 'Espalda y pecho',
		group: 'espalda-y-pecho',
		exercises: [
			basic('press-de-banca-plano'),
			basic('remo-con-barra'),
			accessory('press-inclinado-con-mancuernas'),
			accessory('jalon-al-pecho'),
			accessory('aperturas-con-mancuernas'),
			accessory('remo-en-maquina')
		]
	},
	{
		id: 'brazos',
		name: 'Brazos',
		group: 'brazos',
		exercises: [
			accessory('curl-con-barra-recta'),
			accessory('press-frances'),
			accessory('curl-alterno-con-mancuernas'),
			accessory('extension-de-triceps-en-polea'),
			accessory('curl-martillo'),
			accessory('extension-de-triceps-con-mancuerna')
		]
	},
	{
		id: 'pierna-completa',
		name: 'Pierna completa',
		group: 'pierna-completa',
		exercises: [
			basic('sentadilla-con-barra'),
			basic('peso-muerto-rumano'),
			accessory('sentadilla-bulgara'),
			accessory('curl-femoral-tumbado'),
			accessory('extension-de-piernas'),
			accessory('abduccion-de-cadera-en-maquina'),
			accessory('elevacion-de-talones-de-pie')
		]
	},
	{
		id: 'core',
		name: 'Core',
		group: 'core',
		exercises: [
			accessory('crunch-en-maquina'),
			accessory('elevacion-de-piernas'),
			accessory('rueda-abdominal'),
			accessory('giros-rusos'),
			accessory('crunch-lateral')
		]
	},
	{
		id: 'gluteo-y-femoral',
		name: 'Glúteo y femoral',
		group: 'gluteo-y-femoral',
		exercises: [
			basic('empuje-de-cadera-con-barra'),
			basic('peso-muerto-rumano'),
			accessory('curl-femoral-sentado'),
			accessory('patada-de-gluteo-en-maquina'),
			accessory('abduccion-de-cadera-en-maquina'),
			accessory('zancadas-caminando')
		]
	},
	{
		id: 'hombro-y-brazo',
		name: 'Hombro y brazo',
		group: 'hombro-y-brazo',
		exercises: [
			basic('press-militar-con-barra'),
			accessory('elevacion-lateral-con-mancuernas'),
			accessory('pajaros-con-mancuernas'),
			accessory('curl-con-barra-recta'),
			accessory('extension-de-triceps-en-polea'),
			accessory('curl-martillo')
		]
	}
];
