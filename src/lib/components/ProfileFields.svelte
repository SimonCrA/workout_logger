<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { sexLabel } from '#lib/log/labels.js';
	import { profileProblem, type ProfileChanges } from '#lib/log/profile-rules.js';
	import { isSex, type Profile } from '#lib/log/types.js';

	/**
	 * "Datos" en Perfil (spec #26): sexo, fecha de nacimiento y estatura, todos opcionales. Cada
	 * campo guarda al cambiar (`onsave` con solo ese campo, en orden); quien la usa escribe. Un valor igual
	 * al guardado no escribe nada.
	 */
	let {
		profile,
		today,
		onsave
	}: {
		profile: Profile | null | undefined;
		today: string;
		onsave: (changes: ProfileChanges) => Promise<void>;
	} = $props();

	let error = $state<string | null>(null);
	/** Los cambios se guardan en orden, uno tras otro: cambiar dos campos seguidos no pierde ninguno. */
	let queue = Promise.resolve();
	/** Guardados sin terminar; en cero tras al menos uno, se lee "Guardado". */
	let saving = $state(0);
	let saved = $state(false);

	const UNSPECIFIED = 'unspecified';

	function save(changes: ProfileChanges) {
		const field = Object.keys(changes)[0] as keyof ProfileChanges;
		if ((profile?.[field] ?? null) === changes[field]) return;
		error = profileProblem(changes, today);
		if (error) return;
		saving++;
		saved = false;
		queue = queue.then(() =>
			onsave(changes)
				.then(() => {
					saved = true;
				})
				.catch((cause: unknown) => {
					error = cause instanceof Error ? cause.message : 'No se pudo guardar el dato';
				})
				.finally(() => saving--)
		);
	}

	/** Tocar de nuevo el elegido lo deja sin valor: cuenta como "Sin indicar". */
	function onSexChange(value: string) {
		save({ sex: isSex(value) ? value : null });
	}

	function onBirthDateChange(event: Event) {
		const value = (event.currentTarget as HTMLInputElement).value;
		save({ birthDate: value || null });
	}

	function onHeightChange(event: Event) {
		const value = (event.currentTarget as HTMLInputElement).value;
		save({ height: value === '' ? null : Number(value) });
	}
</script>

<section aria-labelledby="profile-data-title" class="mt-10 border-t pt-6">
	<h2 id="profile-data-title" class="text-lg">Datos</h2>
	<p class="mt-1 text-sm text-muted-foreground">Opcionales. Se guardan al cambiarlos.</p>
	<div class="mt-4 space-y-4">
		<div class="space-y-2">
			<Label id="profile-sex-label">Sexo</Label>
			<ToggleGroup.Root
				type="single"
				variant="outline"
				aria-labelledby="profile-sex-label"
				value={profile?.sex ?? UNSPECIFIED}
				onValueChange={onSexChange}
				class="justify-start"
			>
				{#each Object.entries(sexLabel) as [value, label] (value)}
					<ToggleGroup.Item {value} aria-label={label}>{label}</ToggleGroup.Item>
				{/each}
				<ToggleGroup.Item value={UNSPECIFIED} aria-label="Sin indicar">Sin indicar</ToggleGroup.Item
				>
			</ToggleGroup.Root>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div class="space-y-2">
				<Label for="profile-birth-date">Fecha de nacimiento</Label>
				<Input
					id="profile-birth-date"
					type="date"
					min="1900-01-01"
					max={today}
					value={profile?.birthDate ?? ''}
					onchange={onBirthDateChange}
				/>
			</div>
			<div class="space-y-2">
				<Label for="profile-height">Estatura (cm)</Label>
				<Input
					id="profile-height"
					type="number"
					inputmode="numeric"
					step="1"
					min="50"
					max="250"
					value={profile?.height ?? ''}
					onchange={onHeightChange}
				/>
			</div>
		</div>
		{#if error}
			<p role="alert" class="text-sm text-destructive">{error}</p>
		{/if}
		<p role="status" class="text-sm text-muted-foreground">
			{saving === 0 && saved && !error ? 'Guardado' : ''}
		</p>
	</div>
</section>
