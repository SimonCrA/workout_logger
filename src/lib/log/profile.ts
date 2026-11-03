/**
 * Operaciones sobre el perfil y el peso corporal (GLOSSARY: Perfil, Peso corporal): aplican las
 * reglas de `profile-rules.ts` y escriben. Todo es anónimo y pendiente hasta que la cuenta lo sube.
 */
import { liveQuery } from 'dexie';
import { db as defaultDb } from './db';
import {
	bodyWeightHistory,
	bodyWeightProblem,
	correctBodyWeight,
	currentProfile,
	localDate,
	logBodyWeight as logRule,
	profileProblem,
	saveProfile,
	type BodyWeightInput,
	type ProfileChanges
} from './profile-rules';
import { alive, softDelete } from './rules';
import type { BodyWeight, Profile } from './types';

function check(problem: string | null): void {
	if (problem) throw new Error(problem);
}

/** El historial de peso corporal: un registro por día, el más reciente primero. */
export async function bodyWeights(db = defaultDb): Promise<BodyWeight[]> {
	return bodyWeightHistory(await db.bodyWeights.toArray());
}

/** Registra un peso corporal; si ese día ya tiene uno, lo actualiza. */
export async function logBodyWeight(
	input: BodyWeightInput,
	now = new Date(),
	db = defaultDb
): Promise<BodyWeight[]> {
	check(bodyWeightProblem(input, localDate(now)));
	return db.transaction('rw', db.bodyWeights, async () => {
		const written = logRule(await db.bodyWeights.toArray(), input, now);
		await db.bodyWeights.bulkPut(written);
		return written;
	});
}

/** Corrige kilos o fecha de un registro vivo; nada si no existe o ya se borró. */
export async function updateBodyWeight(
	id: string,
	input: BodyWeightInput,
	now = new Date(),
	db = defaultDb
): Promise<BodyWeight[] | undefined> {
	check(bodyWeightProblem(input, localDate(now)));
	return db.transaction('rw', db.bodyWeights, async () => {
		const entry = await db.bodyWeights.get(id);
		if (!entry || !alive(entry)) return undefined;
		const written = correctBodyWeight(await db.bodyWeights.toArray(), entry, input, now);
		await db.bodyWeights.bulkPut(written);
		return written;
	});
}

/** Borra (lógicamente) un registro vivo; nada si no existe o ya se borró. */
export async function deleteBodyWeight(
	id: string,
	now = new Date(),
	db = defaultDb
): Promise<BodyWeight | undefined> {
	return db.transaction('rw', db.bodyWeights, async () => {
		const entry = await db.bodyWeights.get(id);
		if (!entry || !alive(entry)) return undefined;
		const deleted = softDelete(entry, now);
		await db.bodyWeights.put(deleted);
		return deleted;
	});
}

/** El perfil que se muestra y se edita, o nada si aún no se guardó ningún dato. */
export async function profile(db = defaultDb): Promise<Profile | undefined> {
	return currentProfile(await db.profiles.toArray());
}

/** Guarda un cambio del perfil; el primero crea el perfil. */
export async function updateProfile(
	changes: ProfileChanges,
	now = new Date(),
	db = defaultDb
): Promise<Profile> {
	check(profileProblem(changes, localDate(now)));
	return db.transaction('rw', db.profiles, async () => {
		const saved = saveProfile(await profile(db), changes, now);
		await db.profiles.put(saved);
		return saved;
	});
}

/** El historial de peso corporal en directo. */
export function liveBodyWeights(db = defaultDb) {
	return liveQuery(() => bodyWeights(db));
}

/** El perfil en directo; `null` si no hay (`undefined` es "cargando"). */
export function liveProfile(db = defaultDb) {
	return liveQuery(async () => (await profile(db)) ?? null);
}
