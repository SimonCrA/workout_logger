import { expect, test } from './fixtures';

test('Historial lists a finished companion workout with its duration, one started in solo registrar without it, and the detail shows the sets', async ({
	page
}) => {
	// Una rutina propia copiada de la base Empuje.
	await page.goto('/rutinas/nueva?base=empuje');
	await page.getByRole('textbox', { name: 'Nombre' }).fill('Empuje A');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page).toHaveURL(/\/rutinas$/);
	const mine = page.getByRole('list', { name: 'Mis rutinas' }).getByRole('listitem');
	const question = page.getByRole('alertdialog');
	const inProgress = page.getByRole('region', { name: 'Entrenamiento en curso' });

	// Final del flujo 2: con acompañamiento, dos series de press a 60 kg, Terminar.
	await mine.first().getByRole('button', { name: 'Empezar' }).click();
	await question.getByRole('button', { name: 'Empezar' }).click();
	await expect(page).toHaveURL(/\/ejercicios\/press-de-banca-plano$/);
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 2 series' })).toBeVisible();
	await page.goto('/');
	await inProgress.getByRole('button', { name: 'Terminar' }).click();
	await expect(inProgress).toBeHidden();

	// Flujo 3: otro Empezar, ya en solo registrar, 3 × 10 × 60 kg de curl de una vez, Terminar.
	await page.goto('/rutinas');
	await mine.first().getByRole('button', { name: 'Empezar' }).click();
	await question.getByRole('radio', { name: 'Solo registrar' }).click();
	await question.getByRole('button', { name: 'Empezar' }).click();
	await expect(page).toHaveURL(/\/ejercicios\/press-de-banca-plano$/);
	await page.goto('/');
	await expect(inProgress.getByRole('radio', { name: 'Solo registrar' })).toBeChecked();
	await page.goto('/ejercicios/curl-con-barra-recta');
	await page.getByRole('button', { name: 'Más Series' }).click();
	await page.getByRole('button', { name: 'Más Series' }).click();
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar 3 series' }).click();
	await expect(page.getByRole('button', { name: 'Hoy: 3 series' })).toBeVisible();
	await page.goto('/');
	await inProgress.getByRole('button', { name: 'Terminar' }).click();
	await expect(inProgress).toBeHidden();

	// Historial desde Hoy: el más reciente primero, bajo el separador de este mes.
	await page.getByRole('link', { name: 'Historial' }).click();
	await expect(page).toHaveURL(/\/historial$/);
	await expect(page.getByRole('heading', { level: 2 })).toHaveText(/^[A-Z][a-zñ]+ de \d{4}$/);
	const workouts = page
		.getByRole('list', { name: /^[A-Z][a-zñ]+ de \d{4}$/ })
		.getByRole('listitem');
	await expect(workouts).toHaveCount(2);
	await expect(workouts.first()).toContainText('Hoy · Empuje A');
	await expect(workouts.first()).toContainText('1 ejercicio · 3 series');
	await expect(workouts.first()).not.toContainText(/\d+ min/);
	await expect(workouts.last()).toContainText('Hoy · Empuje A');
	await expect(workouts.last()).toContainText('1 ejercicio · 2 series');
	await expect(workouts.last()).toContainText(/\d+ min/);

	// El detalle del de acompañamiento: cabecera con modo y duración, y las series del press.
	await workouts.last().getByRole('link').click();
	await expect(page).toHaveURL(/\/historial\/[0-9a-f-]+$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Empuje A');
	await expect(page.getByText(/Acompañamiento · \d+ min/)).toBeVisible();
	await expect(
		page.getByRole('list', { name: 'Series de Press de banca plano' }).getByRole('listitem')
	).toHaveText([/60 kg × 10/, /60 kg × 10/]);

	// Y el de solo registrar: sin duración, con las tres series del curl.
	await page.getByRole('link', { name: '← Historial' }).click();
	await expect(page).toHaveURL(/\/historial$/);
	await workouts.first().getByRole('link').click();
	await expect(page.getByText('Solo registrar')).toBeVisible();
	await expect(page.getByText(/\d+ min/)).toHaveCount(0);
	await expect(
		page.getByRole('list', { name: 'Series de Curl con barra recta' }).getByRole('listitem')
	).toHaveText([/60 kg × 10/, /60 kg × 10/, /60 kg × 10/]);
});

test('shows an empty Historial without error and a client-side not found for an unknown workout', async ({
	page
}) => {
	await page.goto('/historial');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Historial');
	await expect(page.getByText('Todavía no hay entrenamientos.')).toBeVisible();
	await expect(page.getByRole('list', { name: /de \d{4}$/ })).toHaveCount(0);

	await page.goto('/historial/no-existe');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('No existe ese entrenamiento');
	await page.getByRole('link', { name: '← Historial' }).click();
	await expect(page).toHaveURL(/\/historial$/);
});
