/**
 * Reglas puras del perfil y del peso corporal (GLOSSARY: Perfil, Peso corporal). El historial
 * guarda un registro por día: registrar en un día que ya tiene uno lo actualiza, y corregir lo
 * mueve o le cambia los kilos. Borrar es lógico (`softDelete`).
 */
import { uuidv7 } from './id';
import { alive, softDelete } from './rules';
import type { BodyWeight, Profile } from './types';

/** Topes del peso corporal y de la estatura: los mismos para el formulario y para la fila que viaja. */
export const PROFILE_LIMITS = {
	minKg: 20,
	maxKg: 400,
	minHeight: 50,
	maxHeight: 250,
	minBirthDate: '1900-01-01'
} as const;

/** Lo que se escribe al registrar o corregir un peso corporal. */
export type BodyWeightInput = { date: string; kg: number };

/** Lo que se cambia del perfil: cualquier campo, uno a uno, porque cada uno guarda al cambiar. */
export type ProfileChanges = Partial<Pick<Profile, 'sex' | 'birthDate' | 'height'>>;

const pad = (n: number) => String(n).padStart(2, '0');

/** El día local como lo escribe un campo de fecha: "2026-11-02". */
export function localDate(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Si es una fecha de calendario real escrita como "2026-11-02". */
export function isDate(value: string): boolean {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return false;
	const [year, month, day] = match.slice(1).map(Number);
	const date = new Date(year, month - 1, day);
	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Kilos con un decimal como mucho. */
const roundKg = (kg: number) => Math.round(kg * 10) / 10;

/** Si ya tiene un decimal como mucho (lo que guardan las reglas, que redondean). */
export const hasOneDecimal = (kg: number) => roundKg(kg) === kg;

/** Qué impide guardar ese peso corporal, o nada. `today` es el día local de hoy. */
export function bodyWeightProblem({ date, kg }: BodyWeightInput, today: string): string | null {
	const rounded = roundKg(kg);
	if (!(rounded >= PROFILE_LIMITS.minKg && rounded <= PROFILE_LIMITS.maxKg))
		return `El peso corporal va de ${PROFILE_LIMITS.minKg} a ${PROFILE_LIMITS.maxKg} kg.`;
	if (!isDate(date)) return 'Elige una fecha.';
	if (date > today) return 'La fecha no puede ser futura.';
	return null;
}

/**
 * El historial como se muestra: vivo, un registro por día y el día más reciente primero. Si dos
 * dispositivos registraron el mismo día sin red, vale el actualizado más tarde.
 */
export function bodyWeightHistory(rows: readonly BodyWeight[]): BodyWeight[] {
	const byDate = new Map<string, BodyWeight>();
	for (const row of rows.filter(alive)) {
		const current = byDate.get(row.date);
		if (!current || row.updatedAt > current.updatedAt) byDate.set(row.date, row);
	}
	return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** El peso corporal vigente en un momento (`performedAt` de una serie), o nada si no se conoce. */
export type BodyWeightAt = (performedAt: string) => number | undefined;

/**
 * El peso corporal vigente (GLOSSARY: Peso efectivo): el último registro del día local de la serie
 * o de antes; antes del primer registro, el primero; sin registros, desconocido.
 */
export function bodyWeightAt(rows: readonly BodyWeight[]): BodyWeightAt {
	const history = bodyWeightHistory(rows); // el día más reciente primero
	const first = history.at(-1);
	return (performedAt) => {
		const day = localDate(new Date(performedAt));
		return (history.find((row) => row.date <= day) ?? first)?.kg;
	};
}

/** El registro visible de ese día, o nada. */
const entryOn = (rows: readonly BodyWeight[], date: string) =>
	bodyWeightHistory(rows).find((row) => row.date === date);

/**
 * Los otros registros vivos de ese día, borrados: los que dejó otro dispositivo sin red. Así el día
 * queda con un solo registro y borrar o mover el visible no hace reaparecer uno escondido.
 */
const othersOn = (rows: readonly BodyWeight[], date: string, keptId: string, now: Date) =>
	rows
		.filter((row) => alive(row) && row.date === date && row.id !== keptId)
		.map((row) => softDelete(row, now));

/** Registrar un peso: actualiza el de ese día si lo hay; si no, uno nuevo, anónimo y pendiente. Devuelve lo que se escribe. */
export function logBodyWeightWrites(
	rows: readonly BodyWeight[],
	input: BodyWeightInput,
	now: Date
): BodyWeight[] {
	const at = now.toISOString();
	const kg = roundKg(input.kg);
	const existing = entryOn(rows, input.date);
	if (existing)
		return [
			{ ...existing, kg, updatedAt: at, pending: 1 },
			...othersOn(rows, input.date, existing.id, now)
		];
	return [
		{
			id: uuidv7(now.getTime()),
			userId: null,
			date: input.date,
			kg,
			createdAt: at,
			updatedAt: at,
			deletedAt: null,
			pending: 1
		}
	];
}

/**
 * Corrige kilos o fecha de un registro. Si lo lleva a un día que ya tiene otro, queda solo el
 * corregido y el otro se borra, como al registrar dos veces el mismo día; el día que deja queda
 * vacío. Devuelve lo que se escribe.
 */
export function correctBodyWeightWrites(
	rows: readonly BodyWeight[],
	entry: BodyWeight,
	input: BodyWeightInput,
	now: Date
): BodyWeight[] {
	const corrected: BodyWeight = {
		...entry,
		date: input.date,
		kg: roundKg(input.kg),
		updatedAt: now.toISOString(),
		pending: 1
	};
	const left = entry.date === input.date ? [] : othersOn(rows, entry.date, entry.id, now);
	return [corrected, ...othersOn(rows, input.date, entry.id, now), ...left];
}

/** Borra (lógicamente) un registro y, con él, el día entero. Devuelve lo que se escribe. */
export function deleteBodyWeightWrites(
	rows: readonly BodyWeight[],
	entry: BodyWeight,
	now: Date
): BodyWeight[] {
	return [softDelete(entry, now), ...othersOn(rows, entry.date, entry.id, now)];
}

/** El perfil que se muestra y se edita: el vivo actualizado más tarde, o nada. */
export function currentProfile(rows: readonly Profile[]): Profile | undefined {
	return rows
		.filter(alive)
		.reduce<Profile | undefined>(
			(latest, row) => (!latest || row.updatedAt > latest.updatedAt ? row : latest),
			undefined
		);
}

/** Qué impide guardar ese cambio del perfil, o nada. `today` es el día local de hoy. */
export function profileProblem(changes: ProfileChanges, today: string): string | null {
	const { height, birthDate } = changes;
	if (
		height != null &&
		!(
			Number.isInteger(height) &&
			height >= PROFILE_LIMITS.minHeight &&
			height <= PROFILE_LIMITS.maxHeight
		)
	)
		return `La estatura va de ${PROFILE_LIMITS.minHeight} a ${PROFILE_LIMITS.maxHeight} cm.`;
	if (
		birthDate != null &&
		!(isDate(birthDate) && birthDate >= PROFILE_LIMITS.minBirthDate && birthDate <= today)
	)
		return 'Elige una fecha de nacimiento.';
	return null;
}

/** Aplica un cambio al perfil actual; sin perfil, nace uno con ese cambio, anónimo y pendiente. */
export function saveProfile(
	current: Profile | undefined,
	changes: ProfileChanges,
	now: Date
): Profile {
	const at = now.toISOString();
	if (current) return { ...current, ...changes, updatedAt: at, pending: 1 };
	return {
		id: uuidv7(now.getTime()),
		userId: null,
		sex: null,
		birthDate: null,
		height: null,
		...changes,
		createdAt: at,
		updatedAt: at,
		deletedAt: null,
		pending: 1
	};
}
