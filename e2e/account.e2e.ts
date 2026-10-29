import { expect, test } from '@playwright/test';

test('creates an account from Perfil, shows the session email, and keeps local sets after signing out', async ({
	page
}) => {
	const email = `simon+${Date.now()}@example.com`;
	await page.goto('/ejercicios/press-de-banca-plano');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);

	await page.goto('/perfil');
	await page.getByRole('tab', { name: 'Crear cuenta' }).click();
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Contraseña').fill('contraseña-larga');
	await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();

	await expect(page.getByText(`Sesión iniciada como ${email}`)).toBeVisible();
	await expect(page.getByRole('link', { name: /olvid/i })).toHaveCount(0);

	await page.getByRole('button', { name: 'Cerrar sesión' }).click();
	await expect(page.getByRole('tab', { name: 'Iniciar sesión' })).toBeVisible();

	await page.getByRole('tab', { name: 'Crear cuenta' }).click();
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Contraseña').fill('contraseña-larga');
	await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
	await expect(page.getByRole('alert')).toHaveText('Ya hay una cuenta con ese email.');

	await page.getByRole('tab', { name: 'Iniciar sesión' }).click();

	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Contraseña').fill('contraseña-larga');
	await page.getByRole('button', { name: 'Entrar' }).click();
	await expect(page.getByText(`Sesión iniciada como ${email}`)).toBeVisible();

	await page.goto('/ejercicios/press-de-banca-plano');
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);
});

test('explains a wrong password without revealing anything else', async ({ page }) => {
	await page.goto('/perfil');
	await page.getByLabel('Email').fill('nadie@example.com');
	await page.getByLabel('Contraseña').fill('contraseña-larga');
	await page.getByRole('button', { name: 'Entrar' }).click();

	await expect(page.getByRole('alert')).toHaveText('Email o contraseña incorrectos.');
});
