import { expect, test } from './fixtures';

const press = '/ejercicios/press-de-banca-plano';

test('starts a routine with companion, logs two sets of its first exercise, sees 2/3 in Hoy, finishes, and Mis rutinas drops "En curso"', async ({
	page
}) => {
	// Una rutina propia copiada de la base Empuje.
	await page.goto('/rutinas/nueva?base=empuje');
	await page.getByRole('textbox', { name: 'Nombre' }).fill('Empuje A');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page).toHaveURL(/\/rutinas$/);
	const mine = page.getByRole('list', { name: 'Mis rutinas' }).getByRole('listitem');
	await expect(mine).toHaveText([/Empuje A/]);
	await expect(mine.first()).toContainText('Nunca');

	await mine.first().getByRole('button', { name: 'Empezar' }).click();
	const question = page.getByRole('alertdialog');
	await expect(question).toContainText('¿Cómo quieres entrenar?');
	await expect(question.getByRole('radio', { name: 'Con acompañamiento' })).toBeChecked();
	await question.getByRole('button', { name: 'Empezar' }).click();

	await expect(page).toHaveURL(/\/$/);
	const inProgress = page.getByRole('region', { name: 'Entrenamiento en curso' });
	await expect(inProgress.getByRole('heading', { name: 'Empuje A' })).toBeVisible();
	await expect(inProgress.getByRole('radio', { name: 'Acompañamiento' })).toBeChecked();
	const rows = inProgress
		.getByRole('list', { name: 'Ejercicios de la rutina' })
		.getByRole('listitem');
	await expect(rows).toHaveCount(6);
	await expect(rows.first()).toContainText('Press de banca plano');
	await expect(rows.first()).toContainText('3 × 5–8');
	await expect(rows.first()).toContainText('0/3');
	await expect(rows.last()).toContainText('Extensión de tríceps en polea');
	await expect(inProgress.getByRole('list', { name: 'Añadidos' })).toHaveCount(0);

	// Tocar un ejercicio abre su registro.
	await rows.first().getByRole('link').click();
	await expect(page).toHaveURL(new RegExp(`${press}$`));
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		2
	);

	// Un ejercicio fuera de la rutina aparece al final, en Añadidos.
	await page.goto('/ejercicios/curl-con-barra-recta');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);

	await page.goto('/');
	await expect(rows.first()).toContainText('2/3');
	const added = inProgress.getByRole('list', { name: 'Añadidos' }).getByRole('listitem');
	await expect(added).toHaveText([/Curl con barra recta/]);
	await expect(added.first()).toContainText('1 serie');
	await expect(inProgress.getByRole('link', { name: 'Añadir ejercicio' })).toHaveAttribute(
		'href',
		'/ejercicios'
	);

	// Mis rutinas marca la que está en curso y lleva a Hoy en lugar de Empezar.
	await page.goto('/rutinas');
	await expect(mine.first()).toContainText('En curso');
	// Dos series de las tres del primer ejercicio: todavía ninguno alcanza sus series.
	await expect(mine.first()).toContainText('0 de 6 ejercicios');
	await expect(mine.first().getByRole('button', { name: 'Empezar' })).toHaveCount(0);
	await mine.first().getByRole('link', { name: 'Continuar' }).click();
	await expect(page).toHaveURL(/\/$/);

	await inProgress.getByRole('button', { name: 'Terminar' }).click();

	await expect(inProgress).toBeHidden();
	await expect(page.getByRole('heading', { name: 'Últimos 7 días' })).toBeVisible();
	await page.goto('/rutinas');
	await expect(mine.first()).not.toContainText('En curso');
	await expect(mine.first()).toContainText('Última vez hoy');

	// Una serie suelta abre un libre; Empezar le adjunta la rutina en vez de abrir otro, y la última vez se ve en Hoy.
	await page.goto(press);
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await expect(page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem')).toHaveCount(
		1
	);
	await page.goto('/rutinas');
	await mine.first().getByRole('button', { name: 'Empezar' }).click();
	await expect(question.getByRole('radio', { name: 'Con acompañamiento' })).toBeChecked();
	await question.getByRole('radio', { name: 'Solo registrar' }).click();
	await question.getByRole('button', { name: 'Empezar' }).click();

	await expect(inProgress.getByRole('heading', { name: 'Empuje A' })).toBeVisible();
	await expect(inProgress.getByRole('radio', { name: 'Solo registrar' })).toBeChecked();
	await expect(rows.first()).toContainText('1/3');
	await expect(rows.first()).toContainText(/Última vez \(.+\): 0 kg × 10, 0 kg × 10/);
	await inProgress.getByRole('button', { name: 'Terminar' }).click();
	await expect(inProgress).toBeHidden();
});
