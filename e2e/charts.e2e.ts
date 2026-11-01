import { expect, test, type Page } from '@playwright/test';

const press = '/ejercicios/press-de-banca-plano';

/** La página no se desborda a lo ancho en el teléfono. */
const fitsTheWidth = (page: Page) =>
	page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test('without sets, the exercise chart and Progreso show their empty state', async ({ page }) => {
	await page.goto(press);
	await expect(page.getByRole('heading', { name: 'Progreso' })).toBeVisible();
	await expect(page.getByText('Aquí saldrá un punto por entrenamiento')).toBeVisible();

	await page.goto('/progreso');
	await expect(page.getByText('Sin series en las últimas doce semanas')).toBeVisible();
	await expect(page.getByRole('img', { name: 'Entrenamientos por semana' })).toHaveCount(0);
});

test('with sets logged, the exercise chart switches views and Progreso draws both weekly charts', async ({
	page
}) => {
	await page.goto(press);
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);

	const maxWeight = page.getByRole('img', { name: 'Peso máximo por entrenamiento' });
	await expect(maxWeight.locator('svg').first()).toBeVisible();
	await page.getByRole('radio', { name: 'Volumen' }).click();
	await expect(page.getByRole('img', { name: 'Volumen por entrenamiento' })).toBeVisible();
	await expect(maxWeight).toHaveCount(0);
	expect(await fitsTheWidth(page)).toBe(true);

	// Una dominada: en modo corporal no hay kilos, solo reps y sin selector de vista.
	await page.goto('/ejercicios/dominadas');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('img', { name: 'Reps por entrenamiento' })).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Volumen' })).toHaveCount(0);

	await page.getByRole('link', { name: 'Progreso' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Progreso');
	const workSets = page.getByRole('img', { name: 'Series de trabajo por semana' });
	await expect(workSets.locator('svg').first()).toBeVisible();
	await expect(
		page.getByRole('img', { name: 'Entrenamientos por semana' }).locator('svg').first()
	).toBeVisible();

	await page.getByRole('combobox', { name: 'Músculo' }).selectOption({ label: 'Pecho' });
	await expect(
		page.getByRole('img', { name: 'Series por músculo por semana: Pecho' })
	).toBeVisible();
	expect(await fitsTheWidth(page)).toBe(true);
});
