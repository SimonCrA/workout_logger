import { type Page } from '@playwright/test';
import { expect, test } from './fixtures';

const press = '/ejercicios/press-de-banca-plano';
/** La cifra de una ficha de la tarjeta "Últimos 7 días" (su primer `dd`). */
const tile = (page: Page, title: string) =>
	page.getByRole('region', { name: 'Últimos 7 días' }).locator('dl > div', { hasText: title });
/** Los 7 días de la tira, hoy el último. */
const days = (page: Page) =>
	page.getByRole('list', { name: 'Series por día' }).getByRole('listitem');
const value = (page: Page, title: string) => tile(page, title).locator('dd').first();
/** Los chips de "Toca", en su orden. */
const toWork = (page: Page) => page.getByRole('list', { name: 'Toca' }).getByRole('button');
/** Un chip empieza por el nombre del músculo y sigue con sus series ("Pecho 1/6"). */
const startsWith = (names: string[]) => names.map((name) => new RegExp(`^\\s*${name}\\s*\\d`));

test('shows zeros and every muscle in "Toca" with nothing logged, and the dashboard reacts to the first set', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Últimos 7 días' })).toBeVisible();
	await expect(page.getByRole('img', { name: 'Mapa de calor' })).toBeVisible();
	await expect(page.locator('#chest')).toHaveAttribute('data-heat', '0');
	await expect(page.getByLabel('Leyenda')).toHaveText(/0.*6.*10.*20/);
	await expect(
		page.getByText(/^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo), \d+ \w+$/)
	).toBeVisible();
	await expect(toWork(page)).toHaveText(
		startsWith([
			'Pecho',
			'Bíceps',
			'Abductores',
			'Cuádriceps',
			'Abdominales',
			'Isquiotibiales',
			'Dorsales',
			'Glúteos',
			'Aductores',
			'Antebrazos',
			'Tríceps',
			'Hombros',
			'Trapecios',
			'Pantorrillas',
			'Oblicuos',
			'Cuello'
		])
	);
	await expect(toWork(page).first()).toHaveText(/^\s*Pecho\s*0\/6\s*$/);
	await expect(value(page, 'Entrenamientos')).toHaveText('0');
	await expect(value(page, 'Series de trabajo')).toHaveText('0');
	await expect(value(page, 'Reps')).toHaveText('0');
	await expect(tile(page, 'Entrenamientos')).toContainText('Igual que antes');
	await expect(days(page)).toHaveCount(7);
	await expect(days(page).last()).toHaveAccessibleName(/: 0 series$/);
	await expect(page.getByText('Músculos en banda: 0 de 16')).toBeVisible();
	await expect(page.getByText('Todavía no hay entrenamientos.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/historial');
	await expect(page.getByRole('link', { name: 'Entrenamiento libre' })).toHaveAttribute(
		'href',
		'/ejercicios'
	);

	// Una serie de 60 kg × 10 abre un libre: Hoy lo muestra en lugar de "Toca", con el resto del dashboard debajo.
	await page.goto(press);
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);
	await page.goto('/');
	const inProgress = page.getByRole('region', { name: 'Entrenamiento en curso' });
	await expect(inProgress).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Toca', exact: true })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Entrenamiento libre' })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Últimos 7 días' })).toBeVisible();
	await expect(page.getByRole('img', { name: 'Mapa de calor' })).toBeVisible();
	// El en curso no es "el último": todavía no hay otro.
	await expect(page.getByText('Todavía no hay entrenamientos.')).toBeVisible();

	// Terminado, el dashboard cuenta la serie: 1 entrenamiento, 1 serie, 10 reps, y el pecho sube de tono.
	await inProgress.getByRole('button', { name: 'Terminar' }).click();
	await expect(inProgress).toBeHidden();
	await expect(page.getByRole('heading', { name: 'Toca', exact: true })).toBeVisible();
	await expect(value(page, 'Entrenamientos')).toHaveText('1');
	await expect(value(page, 'Series de trabajo')).toHaveText('1');
	await expect(value(page, 'Reps')).toHaveText('10');
	await expect(tile(page, 'Reps')).toContainText('+10 vs antes');
	await expect(days(page).last()).toHaveAccessibleName(/: 1 serie$/);
	await expect(page.locator('#chest')).toHaveAttribute('data-heat', '5');
	await expect(page.locator('#biceps')).toHaveAttribute('data-heat', '0');
	// "Toca" pone primero lo menos trabajado: los que siguen a cero, luego los secundarios del press y el pecho.
	await expect(toWork(page)).toHaveText(
		startsWith([
			'Bíceps',
			'Abductores',
			'Cuádriceps',
			'Abdominales',
			'Isquiotibiales',
			'Dorsales',
			'Glúteos',
			'Aductores',
			'Antebrazos',
			'Trapecios',
			'Pantorrillas',
			'Oblicuos',
			'Cuello',
			'Tríceps',
			'Hombros',
			'Pecho'
		])
	);
	await expect(toWork(page).last()).toHaveText(/^\s*Pecho\s*1\/6\s*$/);
	await expect(toWork(page).nth(13)).toHaveText(/^\s*Tríceps\s*0,5\/6\s*$/);

	// El último entrenamiento lleva a su detalle.
	const lastWorkout = page
		.getByRole('region', { name: 'Último entrenamiento' })
		.getByRole('link', { name: /Libre/ });
	await expect(lastWorkout).toContainText('Hoy');
	await expect(lastWorkout).toContainText('1 ejercicio · 1 serie');
	await lastWorkout.click();
	await expect(page).toHaveURL(/\/historial\/[0-9a-f-]+$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Libre');
});

test('switches the heat map view and opens the muscle sheet from a region or a "Toca" card', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.locator('#chest')).toBeVisible();
	const front = page.getByRole('button', { name: 'Frente' });
	const back = page.getByRole('button', { name: 'Espalda' });
	await expect(front).toHaveAttribute('aria-pressed', 'true');

	await back.click();
	await expect(back).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('#glutes')).toBeVisible();
	await expect(page.locator('#chest')).toBeHidden();
	await front.click();
	await expect(front).toHaveAttribute('aria-pressed', 'true');

	// El centro del grupo cae sobre el abdomen; se toca una de sus formas.
	await page.locator('#triceps_f path').first().click();

	const sheet = page.getByRole('dialog');
	await expect(sheet.getByRole('heading', { name: 'Tríceps' })).toBeVisible();
	await expect(sheet.getByRole('link', { name: /Extensión de tríceps en polea/ })).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(sheet).toBeHidden();

	// Un chip de "Toca" abre la hoja de su músculo, y el mapa gira a la vista donde está.
	await toWork(page).filter({ hasText: 'Glúteos' }).click();
	await expect(sheet.getByRole('heading', { name: 'Glúteos' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(back).toHaveAttribute('aria-pressed', 'true');
});
