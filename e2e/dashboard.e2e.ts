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
/** Los chips de "Menos trabajados", en su orden. */
const leastWorked = (page: Page) =>
	page.getByRole('list', { name: 'Menos trabajados' }).getByRole('button');
/** Un chip empieza por el nombre del músculo y sigue con sus series ("Pecho 1/6"). */
const startsWith = (names: string[]) => names.map((name) => new RegExp(`^\\s*${name}\\s*\\d`));

test('shows zeros and every muscle in "Menos trabajados" with nothing logged, and the dashboard reacts to the first set', async ({
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
	await expect(leastWorked(page)).toHaveText(
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
	await expect(leastWorked(page).first()).toHaveText(/^\s*Pecho\s*0\/6\s*$/);
	await expect(value(page, 'Entrenamientos')).toHaveText('0');
	await expect(value(page, 'Series de trabajo')).toHaveText('0');
	await expect(value(page, 'Reps')).toHaveText('0');
	await expect(tile(page, 'Entrenamientos')).toContainText('Igual que antes');
	await expect(days(page)).toHaveCount(7);
	await expect(days(page).last()).toHaveAccessibleName(/: 0 series$/);
	await expect(page.getByText('Músculos en banda: 0 de 16')).toBeVisible();
	await expect(page.getByText('Todavía no hay entrenamientos.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/historial');
	// Empezar abre un menú con las dos maneras de empezar.
	await page.getByRole('button', { name: 'Empezar entrenamiento' }).click();
	await expect(page.getByRole('menuitem', { name: /^Libre/ })).toHaveAttribute(
		'href',
		'/ejercicios'
	);
	await expect(page.getByRole('menuitem', { name: /^Desde una rutina/ })).toHaveAttribute(
		'href',
		'/rutinas'
	);
	await page.keyboard.press('Escape');
	await expect(page.getByRole('menu')).toHaveCount(0);

	// La cabecera queda fija arriba al hacer scroll.
	await page.mouse.wheel(0, 2000);
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
	const header = page.locator('main > header');
	await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toBeInViewport();
	expect((await header.boundingBox())?.y).toBe(0);

	// Una serie de 60 kg × 10 abre un libre: Hoy lo muestra en lugar de "Menos trabajados", con el resto del dashboard debajo.
	await page.goto(press);
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 1 serie' })).toBeVisible();
	await page.goto('/');
	const inProgress = page.getByRole('region', { name: 'Entrenamiento en curso' });
	await expect(inProgress).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Menos trabajados', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Empezar entrenamiento' })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Últimos 7 días' })).toBeVisible();
	await expect(page.getByRole('img', { name: 'Mapa de calor' })).toBeVisible();
	// El en curso no es "el último": todavía no hay otro.
	await expect(page.getByText('Todavía no hay entrenamientos.')).toBeVisible();

	// Terminado, el dashboard cuenta la serie: 1 entrenamiento, 1 serie, 10 reps, y el pecho sube de tono.
	await inProgress.getByRole('button', { name: 'Terminar' }).click();
	await expect(inProgress).toBeHidden();
	await expect(page.getByRole('heading', { name: 'Menos trabajados', exact: true })).toBeVisible();
	await expect(value(page, 'Entrenamientos')).toHaveText('1');
	await expect(value(page, 'Series de trabajo')).toHaveText('1');
	await expect(value(page, 'Reps')).toHaveText('10');
	await expect(tile(page, 'Reps')).toContainText('+10 vs antes');
	await expect(days(page).last()).toHaveAccessibleName(/: 1 serie$/);
	await expect(page.locator('#chest')).toHaveAttribute('data-heat', '5');
	await expect(page.locator('#biceps')).toHaveAttribute('data-heat', '0');
	// "Menos trabajados" pone primero lo menos trabajado: los que siguen a cero, luego los secundarios del press y el pecho.
	await expect(leastWorked(page)).toHaveText(
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
	await expect(leastWorked(page).last()).toHaveText(/^\s*Pecho\s*1\/6\s*$/);
	await expect(leastWorked(page).nth(13)).toHaveText(/^\s*Tríceps\s*0,5\/6\s*$/);

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

test('switches the heat map view and opens the muscle sheet from a region or a "Menos trabajados" card', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.locator('#chest')).toBeVisible();
	const front = page.getByRole('radio', { name: 'Frente' });
	const back = page.getByRole('radio', { name: 'Espalda' });
	await expect(front).toBeChecked();

	await back.click();
	await expect(back).toBeChecked();
	await expect(page.locator('#glutes')).toBeVisible();
	await expect(page.locator('#chest')).toBeHidden();
	await front.click();
	await expect(front).toBeChecked();

	// El centro del grupo cae sobre el abdomen; se toca una de sus formas.
	await page.locator('#triceps_f path').first().click();

	const sheet = page.getByRole('dialog');
	await expect(sheet.getByRole('heading', { name: 'Tríceps' })).toBeVisible();
	await expect(sheet.getByRole('link', { name: /Extensión de tríceps en polea/ })).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(sheet).toBeHidden();

	// Un chip de "Menos trabajados" abre la hoja de su músculo, y el mapa gira a la vista donde está.
	await leastWorked(page).filter({ hasText: 'Glúteos' }).click();
	await expect(sheet.getByRole('heading', { name: 'Glúteos' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(back).toBeChecked();
});
