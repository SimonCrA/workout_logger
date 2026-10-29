import { expect, test, type Page } from '@playwright/test';

const press = '/ejercicios/press-de-banca-plano';
/** La cifra de una ficha de indicador (su primer `dd`). */
const value = (page: Page, title: string) =>
	page.getByLabel('Indicadores').locator(':scope > div', { hasText: title }).locator('dd').first();

test('shows the six indicators over work sets and updates them on register and delete', async ({
	page
}) => {
	await page.goto(press);
	await expect(page.getByText('Sin series de trabajo todavía')).toBeVisible();

	// A warm-up set is logged but does not count.
	await page.getByText('Más opciones').click();
	await page.getByRole('radio', { name: 'Calentamiento' }).click();
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('20');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);
	await expect(page.getByText('Sin series de trabajo todavía')).toBeVisible();

	// 60 kg × 10, a normal set.
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(value(page, 'Series')).toHaveText('1');
	await expect(value(page, 'Reps')).toHaveText('10');
	await expect(value(page, 'Volumen total')).toHaveText('600 kg');
	await expect(value(page, 'Peso máximo')).toHaveText('60 kg');
	await expect(value(page, 'Peso total')).toHaveText('60 kg');
	await expect(value(page, 'Promedio por rep')).toHaveText('60 kg');

	// 62,5 kg × 10 on top.
	await page.getByRole('button', { name: 'Más Peso (kg)' }).click();
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(value(page, 'Series')).toHaveText('2');
	await expect(value(page, 'Volumen total')).toHaveText('1225 kg'); // cuatro cifras van sin punto
	await expect(value(page, 'Peso máximo')).toHaveText('62,5 kg');
	await expect(value(page, 'Promedio por rep')).toHaveText('61,25 kg');

	await page.getByRole('button', { name: 'Borrar última' }).click();
	await expect(value(page, 'Volumen total')).toHaveText('600 kg');
	await expect(value(page, 'Peso máximo')).toHaveText('60 kg');
});

test('counts sets and reps of a body-weight exercise but has no kilos without a body weight', async ({
	page
}) => {
	await page.goto('/ejercicios/dominadas');
	await page.getByRole('button', { name: 'Registrar serie' }).click();

	await expect(value(page, 'Series')).toHaveText('1');
	await expect(value(page, 'Reps')).toHaveText('10');
	await expect(value(page, 'Volumen total')).toHaveText('—');
	await expect(page.getByText('Los kilos necesitan tu peso corporal')).toBeVisible();
});
