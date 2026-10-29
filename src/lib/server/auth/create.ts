import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { MIN_PASSWORD_LENGTH } from '#lib/auth-rules.js';
import type { Db } from '../db/client';
import * as schema from '../db/schema';

/**
 * Better Auth sobre Drizzle y libSQL, con email y contraseña como único método (ADR-0003):
 * sin verificación de email ni recuperación por correo. La columna `role` nace con `user`.
 */
export function createAuth(db: Db, config: { secret: string }) {
	return betterAuth({
		database: drizzleAdapter(db, { provider: 'sqlite', schema }),
		secret: config.secret,
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			minPasswordLength: MIN_PASSWORD_LENGTH
		},
		// El contador va en la base: en Vercel cada petición puede caer en otra instancia.
		rateLimit: { storage: 'database', modelName: 'rateLimit' },
		user: {
			additionalFields: {
				role: { type: 'string', defaultValue: 'user', input: false }
			}
		},
		// Las previews de Vercel cambian de dominio: se confía en el origen de cada petición.
		trustedOrigins: (request) => (request ? [new URL(request.url).origin] : [])
	});
}

export type Auth = ReturnType<typeof createAuth>;
