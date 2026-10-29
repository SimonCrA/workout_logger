import { defineConfig, devices } from '@playwright/test';

/** El servidor de pruebas usa una base libSQL de archivo recién migrada, con la cuenta activa. */
const env = {
	TURSO_DATABASE_URL: 'file:.e2e/app.db',
	TURSO_AUTH_TOKEN: '',
	BETTER_AUTH_SECRET: 'secreto-solo-para-pruebas-de-navegador',
	// Las pruebas crean varias cuentas en segundos; el límite de peticiones las frenaría.
	BETTER_AUTH_RATE_LIMIT: 'off'
};

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	use: {
		baseURL: 'http://localhost:4173',
		// La app se usa en un teléfono: los flujos se prueban a ese tamaño.
		...devices['Pixel 7']
	},
	webServer: {
		command:
			'rm -rf .e2e && mkdir -p .e2e && pnpm db:migrate && pnpm run build && pnpm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		env
	}
});
