import type { Muscle } from './types';

/** Los 16 músculos del mapa corporal. Los ids de región son los del SVG (ADR-0004). */
export const muscles: readonly Muscle[] = [
	{
		code: 'chest',
		name: 'Pecho',
		description: 'Empuja los brazos hacia adelante y los cruza frente al cuerpo.',
		regions: [{ id: 'chest', view: 'front' }]
	},
	{
		code: 'biceps',
		name: 'Bíceps',
		description: 'Flexiona el codo y gira el antebrazo con la palma hacia arriba.',
		regions: [{ id: 'biceps', view: 'front' }]
	},
	{
		code: 'abductors',
		name: 'Abductores',
		description: 'Separan la pierna del cuerpo y estabilizan la cadera al caminar.',
		regions: [{ id: 'abductors', view: 'front' }]
	},
	{
		code: 'quads',
		name: 'Cuádriceps',
		description: 'Extienden la rodilla: el frente del muslo en sentadillas y prensas.',
		regions: [{ id: 'quads', view: 'front' }]
	},
	{
		code: 'abdominals',
		name: 'Abdominales',
		description: 'Flexionan el tronco y lo mantienen firme bajo carga.',
		regions: [{ id: 'abdominals', view: 'front' }]
	},
	{
		code: 'hamstrings',
		name: 'Isquiotibiales',
		description: 'Flexionan la rodilla y extienden la cadera: la parte trasera del muslo.',
		regions: [{ id: 'hamstrings', view: 'back' }]
	},
	{
		code: 'dorsals',
		name: 'Dorsales',
		description: 'Tiran de los brazos hacia abajo y hacia el cuerpo: la espalda ancha.',
		regions: [{ id: 'dorsals', view: 'back' }]
	},
	{
		code: 'glutes',
		name: 'Glúteos',
		description: 'Extienden y rotan la cadera: el motor del peso muerto y el hip thrust.',
		regions: [{ id: 'glutes', view: 'back' }]
	},
	{
		code: 'adductors',
		name: 'Aductores',
		description: 'Juntan las piernas y estabilizan la cadera: el interior del muslo.',
		regions: [
			{ id: 'adductors_f', view: 'front' },
			{ id: 'adductors_b', view: 'back' }
		]
	},
	{
		code: 'forearms',
		name: 'Antebrazos',
		description: 'Mueven la muñeca y cierran la mano: el agarre en todo lo que levantas.',
		regions: [
			{ id: 'forearms_f', view: 'front' },
			{ id: 'forearms_b', view: 'back' }
		]
	},
	{
		code: 'triceps',
		name: 'Tríceps',
		description: 'Extiende el codo: la parte trasera del brazo en todos los empujes.',
		regions: [
			{ id: 'triceps_f', view: 'front' },
			{ id: 'triceps_b', view: 'back' }
		]
	},
	{
		code: 'shoulders',
		name: 'Hombros',
		description: 'Elevan el brazo en todas direcciones: el deltoides y sus tres cabezas.',
		regions: [
			{ id: 'shoulders_f', view: 'front' },
			{ id: 'shoulders_b', view: 'back' }
		]
	},
	{
		code: 'traps',
		name: 'Trapecios',
		description: 'Elevan, juntan y bajan los omóplatos: de la nuca a la espalda media.',
		regions: [
			{ id: 'traps_f', view: 'front' },
			{ id: 'traps_b', view: 'back' }
		]
	},
	{
		code: 'calves',
		name: 'Pantorrillas',
		description: 'Extienden el tobillo y empujan el pie contra el suelo.',
		regions: [
			{ id: 'calves_f', view: 'front' },
			{ id: 'calves_b', view: 'back' }
		]
	},
	{
		code: 'obliques',
		name: 'Oblicuos',
		description: 'Giran e inclinan el tronco: los lados del abdomen.',
		regions: [
			{ id: 'obliques_f', view: 'front' },
			{ id: 'obliques_b', view: 'back' }
		]
	},
	{
		code: 'neck',
		name: 'Cuello',
		description: 'Flexiona, extiende y gira la cabeza.',
		regions: [
			{ id: 'neck_f', view: 'front' },
			{ id: 'neck_b', view: 'back' }
		]
	}
];
