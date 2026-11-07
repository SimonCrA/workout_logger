import { type Page } from '@playwright/test';
import { expect, openTodaySets, showTab, test } from './fixtures';

const press = '/ejercicios/press-de-banca-plano';
/** La cifra de una ficha de indicador (su primer `dd`). */
const value = (page: Page, title: string) =>
	page.getByLabel('Indicadores').locator(':scope > div', { hasText: title }).locator('dd').first();

test('shows the six indicators over work sets and updates them on register and delete', async ({
	page
}) => {
	await page.goto(press);
	await showTab(page, 'Indicadores');
	await expect(page.getByText('Sin series de trabajo todavía')).toBeVisible();
	await showTab(page, 'Registrar');

	// A warm-up set is logged but does not count.
	await page.getByRole('button', { name: 'RIR, tipo y nota' }).click();
	await page.getByRole('radio', { name: 'Calentamiento' }).click();
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('20');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 1 serie' })).toBeVisible();
	await showTab(page, 'Indicadores');
	await expect(page.getByText('Sin series de trabajo todavía')).toBeVisible();
	await showTab(page, 'Registrar');

	// 60 kg × 10, a normal set.
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 2 series' })).toBeVisible();
	await showTab(page, 'Indicadores');
	await expect(value(page, 'Series')).toHaveText('1');
	await expect(value(page, 'Reps')).toHaveText('10');
	await expect(value(page, 'Volumen total')).toHaveText('600 kg');
	await expect(value(page, 'Peso máximo')).toHaveText('60 kg');
	await expect(value(page, 'Peso total')).toHaveText('60 kg');
	await expect(value(page, 'Promedio por rep')).toHaveText('60 kg');

	// 62,5 kg × 10 on top.
	await showTab(page, 'Registrar');
	await page.getByRole('button', { name: 'Más Peso (kg)' }).click();
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 3 series' })).toBeVisible();
	await showTab(page, 'Indicadores');
	await expect(value(page, 'Series')).toHaveText('2');
	await expect(value(page, 'Volumen total')).toHaveText('1225 kg'); // cuatro cifras van sin punto
	await expect(value(page, 'Peso máximo')).toHaveText('62,5 kg');
	await expect(value(page, 'Promedio por rep')).toHaveText('61,25 kg');

	// Borrar la última, desde la hoja de las series de hoy.
	await showTab(page, 'Registrar');
	await openTodaySets(page);
	await page.getByRole('button', { name: 'Borrar última' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 2 series' })).toBeVisible();
	await page.keyboard.press('Escape');
	await showTab(page, 'Indicadores');
	await expect(value(page, 'Volumen total')).toHaveText('600 kg');
	await expect(value(page, 'Peso máximo')).toHaveText('60 kg');
});

test('a pull-up has no kilos without a body weight and gets them once one is logged in Perfil (spec #27)', async ({
	page
}) => {
	await page.goto('/ejercicios/dominadas');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 1 serie' })).toBeVisible();
	await showTab(page, 'Indicadores');

	await expect(value(page, 'Series')).toHaveText('1');
	await expect(value(page, 'Reps')).toHaveText('10');
	await expect(value(page, 'Volumen total')).toHaveText('—');
	await expect(page.getByRole('img', { name: 'Reps por entrenamiento' })).toBeVisible();
	const note = page.getByText('Los kilos y la fuerza relativa necesitan tu peso corporal');
	await expect(note).toBeVisible();

	// La nota lleva a Perfil, donde se registra.
	await note.getByRole('link', { name: 'Perfil' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Perfil');
	const section = page.getByRole('region', { name: 'Peso corporal' });
	await section.getByLabel('Peso corporal (kg)').fill('80');
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	await expect(section.getByLabel('Último peso corporal')).toContainText('80 kg');

	// De vuelta en la dominada: 10 reps a 80 kg de peso efectivo.
	await page.goto('/ejercicios/dominadas');
	await showTab(page, 'Indicadores');
	await expect(value(page, 'Volumen total')).toHaveText('800 kg');
	await expect(value(page, 'Peso máximo')).toHaveText('80 kg');
	await expect(note).toHaveCount(0);
	await expect(page.getByRole('img', { name: 'Peso máximo por entrenamiento' })).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Volumen' })).toBeVisible();
});

test('the 1RM estimado tile and chart view follow Epley up to 10 reps efectivas (spec #28)', async ({
	page
}) => {
	await page.goto(press);
	const reps = page.getByRole('spinbutton', { name: 'Reps' });
	const weight = page.getByRole('spinbutton', { name: 'Peso (kg)' });

	// 60 kg × 12: more than 10 reps efectivas, no estimate; the view stays selectable and empty.
	await reps.fill('12');
	await weight.fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 1 serie' })).toBeVisible();
	await showTab(page, 'Indicadores');
	await expect(value(page, '1RM estimado')).toHaveText('—');
	await page.getByRole('radio', { name: '1RM estimado' }).click();
	await expect(page.getByText('El 1RM estimado sale de series de 10 reps efectivas')).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Peso máximo' })).toBeVisible();

	// 100 kg × 5: 100 × (1 + 5/30).
	await showTab(page, 'Registrar');
	await reps.fill('5');
	await weight.fill('100');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 2 series' })).toBeVisible();
	await showTab(page, 'Indicadores');
	await expect(value(page, '1RM estimado')).toHaveText('116,67 kg');
	// Volver de Registrar abre el gráfico en su primera vista.
	await page.getByRole('radio', { name: '1RM estimado' }).click();
	await expect(page.getByRole('img', { name: '1RM estimado por entrenamiento' })).toBeVisible();
});

test('Fuerza relativa: a note to Perfil without a body weight, then the tile and the chart view (spec #29)', async ({
	page
}) => {
	await page.goto(press);
	await page.getByRole('spinbutton', { name: 'Reps' }).fill('5');
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('100');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 1 serie' })).toBeVisible();
	await showTab(page, 'Indicadores');
	await expect(value(page, '1RM estimado')).toHaveText('116,67 kg');

	// Sin peso corporal: ni cuadro ni vista, y una nota que lleva a Perfil.
	const indicators = page.getByLabel('Indicadores');
	await expect(indicators.getByText('Fuerza relativa')).toHaveCount(0);
	await expect(page.getByRole('radio', { name: 'Fuerza relativa' })).toHaveCount(0);
	const note = page.getByText('La fuerza relativa necesita tu peso corporal');
	await note.getByRole('link', { name: 'Perfil' }).click();
	const section = page.getByRole('region', { name: 'Peso corporal' });
	await section.getByLabel('Peso corporal (kg)').fill('80');
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	await expect(section.getByLabel('Último peso corporal')).toContainText('80 kg');

	// 116,67 kg entre 80 kg.
	await page.goto(press);
	await showTab(page, 'Indicadores');
	await expect(value(page, 'Fuerza relativa')).toHaveText('1,46 × peso corporal');
	await expect(note).toHaveCount(0);
	await page.getByRole('radio', { name: 'Fuerza relativa' }).click();
	await expect(page.getByRole('img', { name: 'Fuerza relativa por entrenamiento' })).toBeVisible();
});
