import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, migrateDb } from '../db/client';
import { createAuth, type Auth } from './create';
import { resetPassword } from './reset-password';

/** Integración contra una base libSQL local, con las migraciones reales. */
let dir: string;
let auth: Auth;
const email = 'simon@example.com';
const password = 'contraseña-larga';

beforeAll(async () => {
	dir = await mkdtemp(join(tmpdir(), 'workout-logger-auth-'));
	const db = createDb({ url: `file:${join(dir, 'auth.db')}` });
	await migrateDb(db);
	auth = createAuth(db, { secret: 'test-secret' });
});

afterAll(async () => {
	await rm(dir, { recursive: true, force: true });
});

describe('account with email and password (ADR-0003)', () => {
	it('creates an account with role user and opens a session', async () => {
		const result = await auth.api.signUpEmail({ body: { email, password, name: 'simon' } });

		expect(result.user.email).toBe(email);
		expect(result.user).toMatchObject({ role: 'user', emailVerified: false });
		expect(result.token).toBeTruthy();
	});

	it('signs in with the right password and refuses a wrong one', async () => {
		const ok = await auth.api.signInEmail({ body: { email, password } });
		expect(ok.user.email).toBe(email);

		await expect(
			auth.api.signInEmail({ body: { email, password: 'otra-cosa-larga' } })
		).rejects.toThrow();
	});

	it('refuses a second account with the same email', async () => {
		await expect(
			auth.api.signUpEmail({ body: { email, password, name: 'otro' } })
		).rejects.toThrow();
	});

	it('lets the owner reset a password from the console, closing the open sessions', async () => {
		const before = await auth.api.signInEmail({ body: { email, password } });

		await resetPassword(auth, email, 'nueva-contraseña');

		expect(
			(await auth.api.signInEmail({ body: { email, password: 'nueva-contraseña' } })).user.email
		).toBe(email);
		await expect(auth.api.signInEmail({ body: { email, password } })).rejects.toThrow();
		const session = await auth.api.getSession({
			headers: new Headers({ authorization: `Bearer ${before.token}` })
		});
		expect(session).toBeNull();
	});

	it('fails clearly for an email without account', async () => {
		await expect(resetPassword(auth, 'nadie@example.com', 'lo-que-sea-larga')).rejects.toThrow(
			/nadie@example.com/
		);
	});
});
