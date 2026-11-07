import { type Page } from '@playwright/test';
import { expect, showTab, test } from './fixtures';

const press = '/ejercicios/press-de-banca-plano';

/** La página no se desborda a lo ancho en el teléfono. */
const fitsTheWidth = (page: Page) =>
	page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test('without sets, the exercise chart and Progreso show their empty state', async ({ page }) => {
	await page.goto(press);
	await showTab(page, 'Indicadores');
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
	await showTab(page, 'Indicadores');

	const maxWeight = page.getByRole('img', { name: 'Peso máximo por entrenamiento' });
	await expect(maxWeight.locator('svg').first()).toBeVisible();
	await page.getByRole('radio', { name: 'Volumen' }).click();
	await expect(page.getByRole('img', { name: 'Volumen por entrenamiento' })).toBeVisible();
	// Las etiquetas del eje (aquí "600 kg") quedan dentro de la tarjeta del gráfico.
	const card = await page.getByRole('region', { name: 'Progreso' }).boundingBox();
	const labelsLeft = await page
		.getByRole('img', { name: 'Volumen por entrenamiento' })
		.locator('text')
		.evaluateAll((texts) => Math.min(...texts.map((text) => text.getBoundingClientRect().left)));
	expect(labelsLeft).toBeGreaterThanOrEqual(card!.x);
	await expect(maxWeight).toHaveCount(0);
	expect(await fitsTheWidth(page)).toBe(true);

	// Una dominada sin peso corporal registrado: no hay kilos, solo reps y sin selector de vista.
	await page.goto('/ejercicios/dominadas');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);
	await showTab(page, 'Indicadores');
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
	// Dos puntos, y el eje en kilos ajustado a los registros: ninguna marca por debajo de 78 kg.
	await expect(chart.locator('circle')).toHaveCount(2);
	await expect(chart).toContainText('kg');
	const ticks = (await chart.locator('text').allTextContents())
		.map((text) => /^([\d,]+) kg$/.exec(text)?.[1])
		.filter((kg) => kg !== undefined)
		.map((kg) => Number(kg.replace(',', '.')));
	expect(ticks.length).toBeGreaterThan(1);
	expect(Math.min(...ticks)).toBeGreaterThanOrEqual(78);
	expect(await fitsTheWidth(page)).toBe(true);
});

test('changing the period changes what the charts show, on the exercise page and in Progreso', async ({
	page
}) => {
	// Una serie de press hace 200 días (el entrenamiento se mueve de fecha) y otra hoy.
	await page.goto(press);
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);
	await page.goto('/historial');
	await page
		.getByRole('list', { name: /de \d{4}$/ })
		.getByRole('link')
		.first()
		.click();
	await page.getByRole('button', { name: 'Cambiar fecha' }).click();
	const question = page.getByRole('alertdialog');
	await question.getByLabel('Inicio').fill(`${daysAgo(200)}T10:00`);
	await question.getByRole('button', { name: 'Guardar' }).click();
	await expect(question).toBeHidden();

	await page.goto(press);
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('70');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);
	await showTab(page, 'Indicadores');

	// En el ejercicio, Todo por defecto: los dos entrenamientos; con 12 semanas, solo el de hoy.
	const picker = page.getByRole('group', { name: 'Periodo' });
	const maxWeight = page.getByRole('img', { name: 'Peso máximo por entrenamiento' });
	await expect(picker.getByRole('radio', { name: 'Todo' })).toBeChecked();
	await expect(maxWeight.locator('circle')).toHaveCount(2);
	await picker.getByRole('radio', { name: '12 semanas' }).click();
	await expect(maxWeight.locator('circle')).toHaveCount(1);
	await picker.getByRole('radio', { name: '1 año' }).click();
	await expect(maxWeight.locator('circle')).toHaveCount(2);
	expect(await fitsTheWidth(page)).toBe(true);

	// Dos pesos corporales: hace 200 días y hoy.
	await page.goto('/perfil');
	const section = page.getByRole('region', { name: 'Peso corporal' });
	const weights = section
		.getByRole('list', { name: 'Historial de peso corporal' })
		.getByRole('listitem');
	await section.getByLabel('Peso corporal (kg)').fill('82');
	await section.getByLabel('Fecha').fill(daysAgo(200));
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	await expect(weights).toHaveCount(1);
	await section.getByLabel('Peso corporal (kg)').fill('80');
	await section.getByLabel('Fecha').fill(daysAgo(0));
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	await expect(weights).toHaveCount(2);

	// En Progreso, 12 semanas por defecto: el peso de hoy solo, y doce semanas rotuladas por día.
	await page.getByRole('link', { name: 'Progreso' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Progreso');
	const bodyWeight = page.getByRole('img', { name: 'Peso corporal' });
	const workouts = page.getByRole('img', { name: 'Entrenamientos por semana' });
	await expect(picker.getByRole('radio', { name: '12 semanas' })).toBeChecked();
	await expect(bodyWeight.locator('circle')).toHaveCount(1);
	await expect(workouts.locator('svg').first()).toBeVisible();
	await expect(workouts).not.toContainText(/\d{4}/);

	// Con 1 año, los dos pesos y un año de semanas, rotulado por meses con su año sin desbordar.
	await picker.getByRole('radio', { name: '1 año' }).click();
	await expect(bodyWeight.locator('circle')).toHaveCount(2);
	await expect(workouts).toContainText(/\d{4}/);
	expect(await fitsTheWidth(page)).toBe(true);

	// Todo empieza en la semana del primer entrenamiento: unas 29 semanas, rotuladas otra vez por día.
	await picker.getByRole('radio', { name: 'Todo' }).click();
	await expect(bodyWeight.locator('circle')).toHaveCount(2);
	await expect(workouts).not.toContainText(/\d{4}/);
	expect(await fitsTheWidth(page)).toBe(true);
});
