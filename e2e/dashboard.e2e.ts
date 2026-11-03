import { type Page } from '@playwright/test';
import { expect, test } from './fixtures';

const press = '/ejercicios/press-de-banca-plano';
/** La cifra de una ficha de la tarjeta "Últimos 7 días" (su primer `dd`). */
const tile = (page: Page, title: string) =>
	page.getByLabel('Últimos 7 días').locator(':scope > div', { hasText: title });
const value = (page: Page, title: string) => tile(page, title).locator('dd').first();
const allMuscles =
	'Toca: Pecho, Bíceps, Abductores, Cuádriceps, Abdominales, Isquiotibiales, Dorsales, Glúteos, Aductores, Antebrazos, Tríceps, Hombros, Trapecios, Pantorrillas, Oblicuos y Cuello';

test('shows zeros and every muscle in "Toca:" with nothing logged, and the dashboard reacts to the first set', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Últimos 7 días' })).toBeVisible();
	await expect(page.getByRole('img', { name: 'Mapa de calor' })).toBeVisible();
	await expect(page.locator('#chest')).toHaveAttribute('data-heat', '0');
	await expect(page.getByLabel('Leyenda')).toHaveText(/0.*6.*10.*20/);
	await expect(page.getByText(allMuscles)).toBeVisible();
	await expect(value(page, 'Entrenamientos')).toHaveText('0');
	await expect(value(page, 'Series de trabajo')).toHaveText('0');
	await expect(value(page, 'Reps')).toHaveText('0');
	await expect(
		tile(page, 'Entrenamientos').getByRole('img', { name: 'Igual que los 7 días anteriores' })
	).toBeVisible();
	await expect(page.getByText('Músculos en banda: 0 de 16')).toBeVisible();
	await expect(page.getByText('Todavía no hay entrenamientos.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/historial');
	await expect(page.getByRole('link', { name: 'Entrenamiento libre' })).toHaveAttribute(
		'href',
		'/ejercicios'
	);

	// Una serie de 60 kg × 10 abre un libre: Hoy muestra el entrenamiento, no el dashboard.
	await page.goto(press);
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);
	await page.goto('/');
	const inProgress = page.getByRole('region', { name: 'Entrenamiento en curso' });
	await expect(inProgress).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Últimos 7 días' })).toHaveCount(0);

	// Terminado, el dashboard cuenta la serie: 1 entrenamiento, 1 serie, 10 reps, y el pecho sube de tono.
	await inProgress.getByRole('button', { name: 'Terminar' }).click();
	await expect(inProgress).toBeHidden();
	await expect(value(page, 'Entrenamientos')).toHaveText('1');
	await expect(value(page, 'Series de trabajo')).toHaveText('1');
	await expect(value(page, 'Reps')).toHaveText('10');
	await expect(
		tile(page, 'Reps').getByRole('img', { name: 'Más que los 7 días anteriores' })
	).toBeVisible();
	await expect(page.locator('#chest')).toHaveAttribute('data-heat', '5');
	await expect(page.locator('#biceps')).toHaveAttribute('data-heat', '0');
	// "Toca:" pone primero lo menos trabajado: los que siguen a cero, luego los secundarios del press y el pecho.
	await expect(
		page.getByText(
			'Toca: Bíceps, Abductores, Cuádriceps, Abdominales, Isquiotibiales, Dorsales, Glúteos, Aductores, Antebrazos, Trapecios, Pantorrillas, Oblicuos, Cuello, Tríceps, Hombros y Pecho'
		)
	).toBeVisible();

	// El último entrenamiento lleva a su detalle.
	const lastWorkout = page.getByRole('link', { name: /Hoy · Libre/ });
	await expect(lastWorkout).toContainText('1 ejercicio · 1 serie');
	await lastWorkout.click();
	await expect(page).toHaveURL(/\/historial\/[0-9a-f-]+$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Libre');
});

test('turns the heat map and opens the muscle sheet from a region', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('#chest')).toBeVisible();

	await page.getByRole('button', { name: 'Girar el mapa' }).click();
	await expect(page.locator('#glutes')).toBeVisible();
	await expect(page.locator('#chest')).toBeHidden();
	await page.getByRole('button', { name: 'Girar el mapa' }).click();

	// El centro del grupo cae sobre el abdomen; se toca una de sus formas.
	await page.locator('#triceps_f path').first().click();

	const sheet = page.getByRole('dialog');
	await expect(sheet.getByRole('heading', { name: 'Tríceps' })).toBeVisible();
	await expect(sheet.getByRole('link', { name: /Extensión de tríceps en polea/ })).toBeVisible();
});
