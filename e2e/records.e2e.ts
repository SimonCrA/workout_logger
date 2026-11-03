import { expect, test } from '@playwright/test';

test('two sets, the second heavier: the notice and the Récord mark only on the second (spec #30)', async ({
	page
}) => {
	await page.goto('/ejercicios/press-de-banca-plano');
	const records = page.getByRole('table');
	const today = page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem');
	const notice = page.getByRole('status').filter({ hasText: 'Récord' });
	await expect(page.getByText('Sin récords todavía')).toBeVisible();

	// La primera serie del ejercicio no bate nada: sin aviso ni marca, aunque ya es el récord.
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(today).toHaveCount(1);
	await expect(records.getByRole('row')).toHaveCount(2);
	await expect(notice).toBeHidden();
	await expect(today.first()).not.toContainText('Récord');

	// 70 kg × 10: peso máximo y 1RM estimado (70 × (1 + 10/30) = 93,33 kg) en un solo aviso.
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('70');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(notice).toHaveText('Récord: peso máximo 70 kg y 1RM estimado 93,33 kg');
	await expect(today).toHaveCount(2);
	await expect(today.first()).not.toContainText('Récord');
	await expect(today.last()).toContainText('Récord');

	// La sección Récords: peso máximo y 1RM estimado, y las reps por peso de mayor a menor.
	const tile = (title: string) =>
		page.getByLabel('Récords').locator(':scope > div', { hasText: title }).locator('dd').first();
	await expect(tile('Peso máximo')).toHaveText('70 kg');
	await expect(tile('1RM estimado')).toHaveText('93,33 kg');
	await expect(records.getByRole('row').nth(1)).toContainText('70 kg');
	await expect(records.getByRole('row').nth(2)).toContainText('60 kg');

	// 80 kg × 10 bate a la de 70: la marca pasa a la nueva, porque solo la lleva quien tiene el récord.
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('80');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(notice).toHaveText('Récord: peso máximo 80 kg y 1RM estimado 106,67 kg');
	await expect(today).toHaveCount(3);
	await expect(today.filter({ hasText: 'Récord' })).toHaveCount(1);
	await expect(today.last()).toContainText('Récord');

	// El detalle de Historial marca la misma serie.
	await page.goto('/historial');
	await page
		.getByRole('list', { name: /^[A-Z][a-zñ]+ de \d{4}$/ })
		.getByRole('listitem')
		.first()
		.getByRole('link')
		.click();
	const detail = page
		.getByRole('list', { name: 'Series de Press de banca plano' })
		.getByRole('listitem');
	await expect(detail).toHaveCount(3);
	await expect(detail.filter({ hasText: 'Récord' })).toHaveCount(1);
	await expect(detail.last()).toContainText('Récord');
});
