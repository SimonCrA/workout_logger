import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { createAuth } from '../src/lib/server/auth/create.js';
import { resetPassword } from '../src/lib/server/auth/reset-password.js';
import { createDb } from '../src/lib/server/db/client.js';

// Uso: pnpm db:reset-password <email>   (pide la contraseña nueva; lee TURSO_* de .env; ver README)
const [email] = process.argv.slice(2);
if (!email) {
	console.error('Uso: pnpm db:reset-password <email>');
	process.exit(1);
}
const url = process.env.TURSO_DATABASE_URL;
if (!url) {
	console.error(
		'Falta TURSO_DATABASE_URL (y TURSO_AUTH_TOKEN si es Turso) en el entorno o en .env'
	);
	process.exit(1);
}

// La contraseña se pide por consola y no va en los argumentos, para que no quede en el historial del shell.
const prompt = createInterface({ input: stdin, output: stdout });
const password = await prompt.question(`Contraseña nueva para ${email}: `);
prompt.close();

try {
	// El secreto no interviene al restablecer: solo se hashea la contraseña y se cierran sesiones.
	const auth = createAuth(createDb({ url, authToken: process.env.TURSO_AUTH_TOKEN }), {
		secret: process.env.BETTER_AUTH_SECRET ?? 'no-se-usa-al-restablecer'
	});
	await resetPassword(auth, email, password);
	console.log(`Contraseña de ${email} restablecida; sus sesiones quedaron cerradas.`);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
