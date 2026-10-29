import { expect, test, type Page } from '@playwright/test';

const press = '/ejercicios/press-de-banca-plano';
const tile = (page: Page, title: string) =>
	page.getByLabel('Indicadores').locator(':scope > div', { hasText: title });

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
	await expect(tile(page, 'Series')).toContainText('1');
	await expect(tile(page, 'Reps')).toContainText('10');
	await expect(tile(page, 'Volumen total')).toContainText('600 kg');
	await expect(tile(page, 'Peso máximo')).toContainText('60 kg');
	await expect(tile(page, 'Peso total')).toContainText('60 kg');
	await expect(tile(page, 'Promedio por rep')).toContainText('60 kg');

	// 62,5 kg × 10 on top.
	await page.getByRole('button', { name: 'Más Peso (kg)' }).click();
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(tile(page, 'Series')).toContainText('2');
	await expect(tile(page, 'Volumen total')).toContainText(/1\.?225 kg/);
	await expect(tile(page, 'Peso máximo')).toContainText('62,5 kg');
	await expect(tile(page, 'Promedio por rep')).toContainText('61,25 kg');

	await page.getByRole('button', { name: 'Borrar última' }).click();
	await expect(tile(page, 'Volumen total')).toContainText('600 kg');
	await expect(tile(page, 'Peso máximo')).toContainText('60 kg');
});

test('counts sets and reps of a body-weight exercise but has no kilos without a body weight', async ({
	page
}) => {
	await page.goto('/ejercicios/dominadas');
	await page.getByRole('button', { name: 'Registrar serie' }).click();

	await expect(tile(page, 'Series')).toContainText('1');
	await expect(tile(page, 'Reps')).toContainText('10');
	await expect(tile(page, 'Volumen total')).toContainText('—');
	await expect(page.getByText('Los kilos necesitan tu peso corporal')).toBeVisible();
});
