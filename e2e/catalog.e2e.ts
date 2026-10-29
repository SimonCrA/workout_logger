import { expect, test } from '@playwright/test';

test('tapping a region opens the muscle sheet with its exercises, primary ones first', async ({
	page
}) => {
	await page.goto('/ejercicios');

	// El centro del grupo cae sobre el abdomen; se toca una de sus formas.
	await page.locator('#triceps_f path').first().click();

	const sheet = page.getByRole('dialog');
	await expect(sheet.getByRole('heading', { name: 'Tríceps' })).toBeVisible();
	await expect(sheet.getByText('Extiende el codo', { exact: false })).toBeVisible();
	const names = await sheet.getByRole('link').allInnerTexts();
	expect(names[0]).toContain('Extensión de tríceps en polea');
	expect(names[names.length - 1]).toContain('Fondos en paralelas');
	await expect(page.locator('#triceps_f')).toHaveAttribute('data-highlight', 'strong');
});

test('typing a muscle name turns the map to its view and highlights all its regions', async ({
	page
}) => {
	await page.goto('/ejercicios');
	await expect(page.locator('#dorsals')).toBeHidden();

	await page.getByRole('searchbox', { name: 'Buscar músculo o ejercicio' }).fill('dors');

	await expect(page.locator('#dorsals')).toBeVisible();
	await expect(page.locator('#dorsals')).toHaveAttribute('data-highlight', 'strong');
	await expect(page.getByRole('button', { name: 'Dorsales' })).toBeVisible();
});

test('the flip button and a horizontal swipe turn the map', async ({ page }) => {
	await page.goto('/ejercicios');
	await expect(page.locator('#chest')).toBeVisible();

	await page.getByRole('button', { name: 'Girar el mapa' }).click();
	await expect(page.locator('#glutes')).toBeVisible();
	await expect(page.locator('#chest')).toBeHidden();

	const map = page.getByRole('img', { name: 'Mapa corporal' });
	const box = (await map.boundingBox())!;
	await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 5 });
	await page.mouse.up();
	await expect(page.locator('#chest')).toBeVisible();
});

test('searching an exercise leads to its detail with equipment, muscles and the mini map', async ({
	page
}) => {
	await page.goto('/ejercicios');

	await page
		.getByRole('searchbox', { name: 'Buscar músculo o ejercicio' })
		.fill('fondos en paralelas');
	await page.getByRole('link', { name: /Fondos en paralelas/ }).click();

	await expect(page).toHaveURL(/\/ejercicios\/fondos-en-paralelas$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fondos en paralelas');
	await expect(page.getByText('Peso corporal', { exact: true })).toBeVisible();
	await expect(page.getByText('Pecho', { exact: true })).toBeVisible();
	await expect(page.getByText('Tríceps', { exact: true })).toBeVisible();
	await expect(page.locator('#chest')).toHaveAttribute('data-highlight', 'strong');
	await page.getByRole('button', { name: 'Girar el mapa' }).click();
	await expect(page.locator('#triceps_b')).toBeVisible();
	await expect(page.locator('#triceps_b')).toHaveAttribute('data-highlight', 'faint');
});
