import { expect, test } from '@playwright/test';

test('shows the four tabs and navigates between them', async ({ page }) => {
	await page.goto('/');
	const tabBar = page.getByRole('navigation', { name: 'Pestañas' });

	await expect(tabBar.getByRole('link')).toHaveText(['Hoy', 'Historial', 'Progreso', 'Perfil']);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hoy');
	await expect(tabBar.getByRole('link', { name: 'Hoy' })).toHaveAttribute('aria-current', 'page');

	await tabBar.getByRole('link', { name: 'Progreso' }).click();

	await expect(page).toHaveURL(/\/progreso$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Progreso');
	await expect(tabBar.getByRole('link', { name: 'Progreso' })).toHaveAttribute(
		'aria-current',
		'page'
	);
	await expect(tabBar.getByRole('link', { name: 'Hoy' })).not.toHaveAttribute('aria-current');
});

test('renders the app pages in the browser, not on the server', async ({ request }) => {
	const html = await (await request.get('/progreso')).text();

	expect(html).not.toContain('<h1');
});
