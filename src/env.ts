import { defineEnvVars } from '@sveltejs/kit/env';

/** Variables de entorno del servidor; se leen al arrancar (ver .env.example). */
export const variables = defineEnvVars({
	TURSO_DATABASE_URL: {
		description: 'Base libSQL: `libsql://…` en Turso o `file:…` en local',
		schema: (value) => value || 'file:local.db'
	},
	TURSO_AUTH_TOKEN: {
		description: 'Token de Turso; vacío con un archivo local',
		schema: (value) => value || undefined
	},
	BETTER_AUTH_SECRET: {
		description: 'Firma las sesiones de Better Auth; obligatorio fuera de desarrollo',
		schema: (value) => value || undefined
	}
});
