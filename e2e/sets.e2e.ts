import { expect, test } from '@playwright/test';

const press = '/ejercicios/press-de-banca-plano';

test('registers a set without network and finds it, prefilled, after a reload', async ({
	page
}) => {
	await page.goto(press);
	await expect(page.getByRole('button', { name: 'Registrar serie' })).toBeVisible();
	await expect(page.getByRole('spinbutton', { name: 'Reps' })).toHaveValue('10');

	await page.context().setOffline(true);
	await page.getByRole('button', { name: 'Menos Reps' }).click();
	await page.getByRole('button', { name: 'Menos Reps' }).click();
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('57.5');
	await page.getByRole('button', { name: 'Más Peso (kg)' }).click();
	await page.getByRole('button', { name: 'Registrar serie' }).click();

	const today = page.getByRole('list', { name: 'Series de hoy' });
	await expect(today.getByRole('listitem')).toHaveText([/60 kg × 8/]);

	await page.context().setOffline(false);
	await page.reload();

	await expect(today.getByRole('listitem')).toHaveText([/60 kg × 8/]);
	await expect(page.getByRole('spinbutton', { name: 'Reps' })).toHaveValue('8');
	await expect(page.getByRole('spinbutton', { name: 'Peso (kg)' })).toHaveValue('60');
});

test('deletes the last set of today in one tap', async ({ page }) => {
	await page.goto(press);
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await page.getByRole('button', { name: 'Más Reps' }).click();
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	const today = page.getByRole('list', { name: 'Series de hoy' });
	await expect(today.getByRole('listitem')).toHaveText([/× 10/, /× 11/]);

	await page.getByRole('button', { name: 'Borrar última' }).click();

	await expect(today.getByRole('listitem')).toHaveText([/× 10/]);
});

test('records RIR, set type and note from the extra options', async ({ page }) => {
	await page.goto(press);
	await page.getByText('Más opciones').click();
	await page.getByRole('radio', { name: 'Calentamiento' }).click();
	await page.getByRole('radio', { name: 'RIR 2' }).click();
	await page.getByLabel('Nota (opcional)').fill('barra vacía');
	await page.getByRole('button', { name: 'Registrar serie' }).click();

	const set = page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem');
	await expect(set).toHaveText([/Calentamiento/]);
	await expect(set).toHaveText([/RIR 2/]);
	await expect(set).toHaveText([/barra vacía/]);
});

test('asks for additional weight on body-weight exercises and assistance on assisted ones, never negative', async ({
	page
}) => {
	await page.goto('/ejercicios/dominadas');
	await expect(page.getByRole('spinbutton', { name: 'Peso adicional (kg)' })).toHaveValue('0');
	await expect(page.getByRole('button', { name: 'Menos Peso adicional (kg)' })).toBeDisabled();
	await page.getByRole('spinbutton', { name: 'Peso adicional (kg)' }).fill('-5');
	await expect(page.getByRole('spinbutton', { name: 'Peso adicional (kg)' })).toHaveValue('0');

	await page.goto('/ejercicios/dominadas-asistidas');
	await expect(page.getByRole('spinbutton', { name: 'Asistencia (kg)' })).toBeVisible();
});
