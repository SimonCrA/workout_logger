import { expect, test } from '@playwright/test';

test('starts a routine in solo registrar, logs 3 × 10 × 60 kg at once with no counter, and the counter appears on switching to companion', async ({
	page
}) => {
	await page.goto('/rutinas/nueva?base=empuje');
	await page.getByRole('textbox', { name: 'Nombre' }).fill('Empuje A');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page).toHaveURL(/\/rutinas$/);
	const mine = page.getByRole('list', { name: 'Mis rutinas' }).getByRole('listitem');
	await mine.first().getByRole('button', { name: 'Empezar' }).click();
	const question = page.getByRole('alertdialog');
	await question.getByRole('radio', { name: 'Solo registrar' }).click();
	await question.getByRole('button', { name: 'Empezar' }).click();

	// Solo registrar: ni tiempo transcurrido ni contador.
	await expect(page).toHaveURL(/\/$/);
	const inProgress = page.getByRole('region', { name: 'Entrenamiento en curso' });
	await expect(inProgress.getByRole('radio', { name: 'Solo registrar' })).toBeChecked();
	await expect(inProgress).toContainText(/Desde las \d{2}:\d{2}/);
	await expect(inProgress).not.toContainText(/\d+ min/);
	await expect(inProgress.getByRole('timer')).toHaveCount(0);

	// 3 × 10 × 60 kg de una vez, como una fila del Excel.
	const rows = inProgress
		.getByRole('list', { name: 'Ejercicios de la rutina' })
		.getByRole('listitem');
	await rows.first().getByRole('link').click();
	await expect(page).toHaveURL(/\/ejercicios\/press-de-banca-plano$/);
	const series = page.getByRole('spinbutton', { name: 'Series' });
	await expect(series).toHaveValue('1');
	await expect(page.getByRole('button', { name: 'Menos Series' })).toBeDisabled();
	await expect(page.getByRole('timer')).toHaveCount(0);
	await page.getByRole('button', { name: 'Más Series' }).click();
	await page.getByRole('button', { name: 'Más Series' }).click();
	await expect(series).toHaveValue('3');
	await expect(page.getByRole('spinbutton', { name: 'Reps' })).toHaveValue('10');
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar 3 series' }).click();

	const today = page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem');
	await expect(today).toHaveText([/60 kg × 10/, /60 kg × 10/, /60 kg × 10/]);
	await expect(series).toHaveValue('1');
	await expect(page.getByRole('button', { name: 'Registrar serie' })).toBeVisible();

	// El RIR objetivo de la rutina viene preseleccionado en un accesorio, y se puede quitar.
	await page.goto('/ejercicios/aperturas-con-mancuernas');
	await page.getByText('Más opciones').click();
	const rir2 = page.getByRole('radio', { name: 'RIR 2' });
	await expect(rir2).toBeChecked();
	await rir2.click();
	await expect(rir2).not.toBeChecked();

	// Hoy: las tres series cuentan, y sigue sin contador.
	await page.goto('/');
	await expect(rows.first()).toContainText('3/3');
	await expect(rows.first().getByRole('img', { name: 'Objetivo cumplido' })).toBeVisible();
	await expect(inProgress.getByRole('timer')).toHaveCount(0);

	// Cambiar a acompañamiento enciende el contador (frente a los 150 s del press) y el transcurrido.
	await inProgress.getByRole('radio', { name: 'Acompañamiento' }).click();
	const counter = inProgress.getByRole('timer', { name: 'Descanso' });
	await expect(counter).toContainText(/\d+:\d{2} de 2:30/);
	await expect(inProgress).toContainText(/Desde las \d{2}:\d{2} · \d+ min/);

	// También en la página del ejercicio, donde el control de series desaparece.
	await rows.first().getByRole('link').click();
	await expect(page.getByRole('timer', { name: 'Descanso' })).toContainText(/\d+:\d{2} de 2:30/);
	await expect(page.getByRole('spinbutton', { name: 'Series' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Registrar serie' })).toBeVisible();
});
