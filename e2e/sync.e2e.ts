import { devices, expect, test } from '@playwright/test';

const press = '/ejercicios/press-de-banca-plano';
const password = 'contraseña-larga';

test('a set logged before signing up reaches the server, and a clean device pulls it after signing in', async ({
	browser
}) => {
	const email = `sync+${Date.now()}@example.com`;

	// Dispositivo A: registra sin cuenta, crea la cuenta y espera a que suba.
	const a = await (await browser.newContext({ ...devices['Pixel 7'] })).newPage();
	await a.goto(press);
	await a.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await a.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(a.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(1);
	await a.goto('/perfil');
	await a.getByRole('tab', { name: 'Crear cuenta' }).click();
	await a.getByLabel('Email').fill(email);
	await a.getByLabel('Contraseña').fill(password);
	await a.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
	await expect(a.getByText(`Sesión iniciada como ${email}`)).toBeVisible();
	const statusA = a.getByRole('definition');
	await expect(statusA.first()).toHaveText('0');
	await expect(statusA.nth(1)).toHaveText(/\d{1,2}:\d{2}/);

	// Dispositivo B, limpio: entra y ve lo bajado.
	const b = await (await browser.newContext({ ...devices['Pixel 7'] })).newPage();
	await b.goto('/perfil');
	await b.getByLabel('Email').fill(email);
	await b.getByLabel('Contraseña').fill(password);
	await b.getByRole('button', { name: 'Entrar' }).click();
	await expect(b.getByText(`Sesión iniciada como ${email}`)).toBeVisible();
	await expect(b.getByRole('definition').nth(1)).toHaveText(/\d{1,2}:\d{2}/);
	await b.goto(press);
	await expect(b.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveText([
		/60 kg × 10/
	]);
});

test('warns before signing in with another account on a device that holds data', async ({
	browser
}) => {
	const first = `one+${Date.now()}@example.com`;
	const second = `two+${Date.now()}@example.com`;
	const page = await (await browser.newContext({ ...devices['Pixel 7'] })).newPage();

	await page.goto(press);
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);
	await page.goto('/perfil');
	await page.getByRole('tab', { name: 'Crear cuenta' }).click();
	await page.getByLabel('Email').fill(first);
	await page.getByLabel('Contraseña').fill(password);
	await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
	await expect(page.getByRole('definition').first()).toHaveText('0');
	await page.getByRole('button', { name: 'Cerrar sesión' }).click();

	await page.getByRole('tab', { name: 'Crear cuenta' }).click();
	await page.getByLabel('Email').fill(second);
	await page.getByLabel('Contraseña').fill(password);
	await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();

	const dialog = page.getByRole('alertdialog');
	await expect(dialog).toContainText(first);
	await dialog.getByRole('button', { name: 'Borrar lo local y entrar' }).click();
	await expect(page.getByText(`Sesión iniciada como ${second}`)).toBeVisible();
	await page.goto(press);
	await expect(page.getByText('Sin series todavía.')).toBeVisible();
});
