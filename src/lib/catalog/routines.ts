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
	{
		id: 'ppl',
		name: 'Empuje, Tirón y Pierna (PPL)',
		description: 'Tres días en rotación: lo que empuja, lo que tira y las piernas.'
	},
	{
		id: 'superior-inferior',
		name: 'Tren superior y Tren inferior',
		description: 'Dos días que alternan la mitad de arriba y la de abajo; caben cuatro por semana.'
	},
	{
		id: 'cuerpo-completo',
		name: 'Cuerpo completo',
		description: 'Todo el cuerpo en una sesión, a base de básicos; para dos o tres días por semana.'
	},
	{
		id: 'espalda-y-pecho',
		name: 'Espalda y pecho',
		description: 'Un día de antagonistas: press y remo se alternan y el descanso rinde más.'
	},
	{
		id: 'brazos',
		name: 'Brazos',
		description: 'Bíceps y tríceps en un día aparte, para darles más volumen.'
	},
	{
		id: 'pierna-completa',
		name: 'Pierna completa',
		description: 'Cuádriceps, femoral, glúteo y gemelo en una sola sesión larga.'
	},
	{
		id: 'core',
		name: 'Core',
		description: 'Abdomen y oblicuos; al final de otra sesión o como día corto.'
	},
	{
		id: 'gluteo-y-femoral',
		name: 'Glúteo y femoral',
		description: 'La cadena posterior de la pierna: cadera, femoral y glúteo.'
	},
	{
		id: 'hombro-y-brazo',
		name: 'Hombro y brazo',
		description: 'Hombro completo con bíceps y tríceps, para acompañar un día de pecho y espalda.'
	}
];

export const baseRoutines: readonly BaseRoutine[] = [
	{
		id: 'empuje',
		name: 'Empuje',
		group: 'ppl',
		description: 'Pecho, hombro y tríceps: lo que empuja.',
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
		description: 'Espalda, hombro posterior y bíceps: lo que tira.',
		exercises: [
			basic('remo-con-barra'),
			basic('dominadas'),
			accessory('jalon-al-pecho'),
			accessory('pajaros-con-mancuernas'),
			accessory('curl-con-barra-recta'),
			accessory('curl-martillo')
		]
	},
	{
		id: 'pierna',
		name: 'Pierna',
		group: 'ppl',
		description: 'Cuádriceps, femoral, glúteo y gemelo.',
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
		description: 'Pecho, espalda, hombro y brazos en un día.',
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
		description: 'Pierna y glúteo en un día.',
		exercises: [
			basic('sentadilla-con-barra'),
			basic('peso-muerto-rumano'),
			accessory('prensa-de-piernas'),
			accessory('curl-femoral-sentado'),
			accessory('empuje-de-cadera-con-barra'),
			accessory('elevacion-de-talones-sentado')
		]
	},
	{
		id: 'cuerpo-completo',
		name: 'Cuerpo completo',
		group: 'cuerpo-completo',
		description: 'Tres básicos y tres accesorios que cubren todo el cuerpo.',
		exercises: [
			basic('sentadilla-con-barra'),
			basic('press-de-banca-plano'),
			basic('remo-con-barra'),
			accessory('curl-femoral-tumbado'),
			accessory('elevacion-lateral-con-mancuernas'),
			accessory('curl-con-barra-recta')
		]
	},
	{
		id: 'espalda-y-pecho',
		name: 'Espalda y pecho',
		group: 'espalda-y-pecho',
		description: 'Press y remo alternados, del básico al aislamiento.',
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
		description: 'Bíceps y tríceps alternados, de la barra a la polea.',
		exercises: [
			accessory('curl-con-barra-recta'),
			accessory('press-frances'),
			accessory('curl-alterno-con-mancuernas'),
			accessory('extension-de-triceps-en-polea'),
			accessory('curl-martillo'),
			accessory('fondos-en-banco')
		]
	},
	{
		id: 'pierna-completa',
		name: 'Pierna completa',
		group: 'pierna-completa',
		description: 'Dos básicos y cinco accesorios: toda la pierna en una sesión.',
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
		description: 'Abdomen y oblicuos, con y sin carga.',
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
		description: 'Empuje de cadera y peso muerto rumano como básicos; el resto, accesorios.',
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
		description: 'Press militar como básico; hombro lateral y posterior y brazos como accesorios.',
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
