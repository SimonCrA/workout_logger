import { createAuth } from '../src/lib/server/auth/create.js';
import { resetPassword } from '../src/lib/server/auth/reset-password.js';
import { createDb } from '../src/lib/server/db/client.js';

// Uso: pnpm db:reset-password <email> <contraseña-nueva>   (lee TURSO_* de .env; ver README)
const [email, password] = process.argv.slice(2);
if (!email || !password) {
	console.error('Uso: pnpm db:reset-password <email> <contraseña-nueva>');
	process.exit(1);
}
const url = process.env.TURSO_DATABASE_URL;
if (!url) {
	console.error(
		'Falta TURSO_DATABASE_URL (y TURSO_AUTH_TOKEN si es Turso) en el entorno o en .env'
	);
	process.exit(1);
}
const db = createDb({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const auth = createAuth(db, { secret: process.env.BETTER_AUTH_SECRET ?? 'solo-para-restablecer' });
await resetPassword(auth, email, password);
console.log(`Contraseña de ${email} restablecida; sus sesiones quedaron cerradas.`);
