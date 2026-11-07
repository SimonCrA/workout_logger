import { expect, todaySets, test } from './fixtures';

const press = '/ejercicios/press-de-banca-plano';

test('shows the free workout in progress in Hoy, finishes it, and the next set opens a new one', async ({
	page
}) => {
	await page.goto(press);
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(todaySets(page)).toHaveText([/× 10/]);

	await page.goto('/');
	const inProgress = page.getByRole('region', { name: 'Entrenamiento en curso' });
	await expect(inProgress.getByRole('heading', { name: 'Libre' })).toBeVisible();
	await expect(inProgress).toContainText(/Desde las \d{2}:\d{2}/);
	await expect(inProgress.getByRole('radio', { name: 'Acompañamiento' })).toBeChecked();
	await inProgress.getByRole('radio', { name: 'Solo registrar' }).click();
	await expect(inProgress.getByRole('radio', { name: 'Solo registrar' })).toBeChecked();

	await inProgress.getByRole('button', { name: 'Terminar' }).click();

	await expect(inProgress).toBeHidden();
	await expect(page.getByRole('heading', { name: 'Últimos 7 días' })).toBeVisible();

	await page.goto(press);
	await page.getByRole('button', { name: 'Más Reps' }).click();
	await page.getByRole('button', { name: 'Registrar serie' }).click();

	await expect(todaySets(page)).toHaveText([/× 11/]);
	await expect(page.getByLabel('Última vez')).toContainText('× 10');
});
