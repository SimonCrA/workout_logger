import { expect, test } from '@playwright/test';

test('lists the base routines by group and opens one with its exercises and objectives', async ({
	page
}) => {
	await page.goto('/rutinas');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rutinas');
	await expect(page.getByRole('heading', { name: 'Empuje, Tirón y Pierna (PPL)' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Hombro y brazo' })).toBeVisible();

	await page.getByRole('link', { name: 'Empuje', exact: true }).click();

	await expect(page).toHaveURL(/\/rutinas\/base\/empuje$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Empuje');
	const tabBar = page.getByRole('navigation', { name: 'Pestañas' });
	await expect(tabBar.getByRole('link', { name: 'Rutinas' })).toHaveAttribute(
		'aria-current',
		'page'
	);
	const list = page.getByRole('list', { name: 'Ejercicios de la rutina' });
	const rows = list.getByRole('listitem');
	await expect(rows).toHaveCount(6);
	await expect(rows.first()).toContainText('Press de banca plano');
	await expect(rows.first()).toContainText('3 × 5–8 · 150 s');
	await expect(rows.last()).toContainText('Extensión de tríceps en polea');
	await expect(rows.last()).toContainText('3 × 8–12 · RIR 2 · 90 s');
});

test('shows a 404 page for a base routine that does not exist', async ({ page }) => {
	// La app se renderiza en el navegador: el servidor responde 200 y la página de error la pinta el cliente.
	await page.goto('/rutinas/base/no-existe');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('404');
	await expect(page.getByText('No existe esa rutina')).toBeVisible();
});
