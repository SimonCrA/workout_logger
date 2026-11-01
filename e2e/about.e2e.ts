import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

test('shows Acerca de at the end of Perfil with the version and support email', async ({
	page
}) => {
	await page.goto('/perfil');
	const about = page.getByRole('region', { name: 'Acerca de' });

	await expect(about).toContainText(new RegExp(`Versión\\s*${version.replaceAll('.', '\\.')}`));
	await expect(about.getByRole('link', { name: 'simonct3ch@gmail.com' })).toHaveAttribute(
		'href',
		'mailto:simonct3ch@gmail.com'
	);
	await expect(about.getByRole('link')).toHaveCount(1);
	await expect(page.locator('main section').last()).toHaveAttribute('aria-label', 'Acerca de');
});

test('keeps Acerca de the same once signed in', async ({ page }) => {
	await page.goto('/perfil');
	const about = page.getByRole('region', { name: 'Acerca de' });
	const signedOut = await about.innerText();

	await page.getByRole('tab', { name: 'Crear cuenta' }).click();
	await page.getByLabel('Email').fill(`simon+${Date.now()}@example.com`);
	await page.getByLabel('Contraseña').fill('contraseña-larga');
	await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
	await expect(page.getByText('Sesión iniciada como')).toBeVisible();

	await expect(about).toHaveText(signedOut);
});
