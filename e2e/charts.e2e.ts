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
	await expect(page.getByText('Aquí saldrá un punto por cada peso que registres.')).toBeVisible();
	await expect(page.getByRole('img', { name: 'Peso corporal' })).toHaveCount(0);
	await page.getByRole('link', { name: 'Registra tu peso en Perfil' }).click();
	await expect(page.getByRole('region', { name: 'Peso corporal' })).toBeVisible();
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

	// Una dominada sin peso corporal registrado: no hay kilos, solo reps y sin selector de vista.
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

/** Un día local como lo escribe un campo de fecha, `days` antes de hoy: "2026-11-01". */
function daysAgo(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() - days);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

test('two body weights logged in Perfil draw the body-weight chart in Progreso', async ({
	page
}) => {
	await page.goto('/perfil');
	const section = page.getByRole('region', { name: 'Peso corporal' });
	const history = section
		.getByRole('list', { name: 'Historial de peso corporal' })
		.getByRole('listitem');
	await section.getByLabel('Peso corporal (kg)').fill('81');
	await section.getByLabel('Fecha').fill(daysAgo(7));
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	await expect(history).toHaveText([/81 kg/]);
	await section.getByLabel('Peso corporal (kg)').fill('79.5');
	await section.getByLabel('Fecha').fill(daysAgo(0));
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	await expect(history).toHaveText([/79,5 kg/, /81 kg/]);

	await page.getByRole('link', { name: 'Progreso' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Progreso');
	const chart = page.getByRole('img', { name: 'Peso corporal' });
	await expect(chart.locator('svg').first()).toBeVisible();
	// Dos puntos, y el eje en kilos sin empezar en cero.
	await expect(chart.locator('circle')).toHaveCount(2);
	await expect(chart).toContainText('80 kg');
	expect(await chart.locator('text').allTextContents()).not.toContain('0 kg');
	expect(await fitsTheWidth(page)).toBe(true);
});
