<script lang="ts">
	import { authClient } from '#lib/auth-client.js';
	import BodyWeightSection from '#lib/components/BodyWeightSection.svelte';
	import OtherAccountDialog from '#lib/components/OtherAccountDialog.svelte';
	import SegmentedSwitch from '#lib/components/SegmentedSwitch.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { db } from '#lib/log/db.js';
	import { formatDayMonthYear, formatKg, sexLabel } from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import {
		bodyWeightProblem,
		PROFILE_LIMITS,
		profileProblem,
		type BodyWeightInput,
		type ProfileChanges
	} from '#lib/log/profile-rules.js';
	import { isSex, type BodyWeight, type Profile } from '#lib/log/types.js';
	import { liveSyncStatus } from '#lib/sync/client.js';
	import { discardOtherAccountData, syncState } from '#lib/sync/runtime.svelte.js';

	/**
	 * Perfil con sesión (ADR-0007), en grupos al estilo de los ajustes: la cuenta arriba; "Peso
	 * corporal" con el de hoy, que se edita en su fila, y el historial en una hoja; "Datos" (sexo,
	 * nacimiento y estatura), cada uno editable en su fila; la cuenta con su respaldo y "Cerrar
	 * sesión". Quien la usa escribe con los callbacks.
	 */
	let {
		account,
		history,
		profile,
		today,
		onlog,
		onedit,
		ondelete,
		onsave
	}: {
		account: { id: string; email: string };
		history: BodyWeight[] | undefined;
		profile: Profile | null | undefined;
		today: string;
		onlog: (input: BodyWeightInput) => Promise<void>;
		onedit: (entry: BodyWeight, input: BodyWeightInput) => Promise<void>;
		ondelete: (entry: BodyWeight) => Promise<void>;
		onsave: (changes: ProfileChanges) => Promise<void>;
	} = $props();

	const status = live(() => liveSyncStatus(db));
	const lastSync = $derived.by(() => {
		const at = status.value?.lastSyncAt;
		if (!at) return 'Nunca';
		return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(
			new Date(at)
		);
	});

	const todayWeight = $derived(history?.find((entry) => entry.date === today) ?? null);

	// Una sola fila se edita a la vez; su borrador y su error viven aquí.
	type Field = 'weight' | 'sex' | 'birthDate' | 'height';
	let editing = $state<Field | null>(null);
	// Un campo numérico enlazado da un número (o null si está vacío); se lee siempre como texto.
	let draft = $state<string | number | null>('');
	const draftText = () => String(draft ?? '').trim();
	let error = $state<string | null>(null);
	let busy = $state(false);
	let historyOpen = $state(false);
	let ownerEmail = $state<string | null>(null);

	const sexOptions = [
		{ value: 'male', label: sexLabel.male },
		{ value: 'female', label: sexLabel.female },
		{ value: 'none', label: 'Sin indicar' }
	];

	function open(field: Field) {
		error = null;
		editing = field;
		draft =
			field === 'weight'
				? todayWeight
					? String(todayWeight.kg)
					: ''
				: field === 'birthDate'
					? (profile?.birthDate ?? '')
					: field === 'height'
						? profile?.height === null || profile?.height === undefined
							? ''
							: String(profile.height)
						: '';
	}

	function close() {
		editing = null;
		error = null;
	}

	/** Corre un guardado; si falla, la fila sigue abierta y dice por qué. */
	async function run(action: () => Promise<void>) {
		busy = true;
		try {
			await action();
			close();
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo guardar';
		} finally {
			busy = false;
		}
	}

	function saveWeight(event: SubmitEvent) {
		event.preventDefault();
		const input = { date: today, kg: draftText() === '' ? Number.NaN : Number(draftText()) };
		error = bodyWeightProblem(input, today);
		if (!error) void run(() => onlog(input));
	}

	function saveProfile(event: SubmitEvent, changes: ProfileChanges) {
		event.preventDefault();
		error = profileProblem(changes, today);
		if (!error) void run(() => onsave(changes));
	}

	function pickSex(value: string) {
		void run(() => onsave({ sex: isSex(value) ? value : null }));
	}

	async function storedOwnerEmail(): Promise<string | null> {
		const owner = await db.meta.get('ownerEmail');
		return typeof owner?.value === 'string' ? owner.value : null;
	}

	// Si tras entrar los datos locales resultan ser de otra cuenta, el aviso dice de quién.
	$effect(() => {
		if (syncState.otherAccountData) void storedOwnerEmail().then((owner) => (ownerEmail = owner));
	});

	async function signOut() {
		// Solo cierra la sesión en el servidor: las series del dispositivo no se tocan.
		await authClient.signOut();
	}

	const birthDateLabel = $derived.by(() => {
		const value = profile?.birthDate;
		if (!value) return 'Sin indicar';
		const [year, month, day] = value.split('-').map(Number);
		return formatDayMonthYear(new Date(year, month - 1, day));
	});
</script>

{#snippet row(label: string, value: string, field: Field)}
	<button
		type="button"
		class="flex min-h-13 w-full items-center justify-between gap-3 px-4 text-left active:bg-muted"
		aria-expanded={editing === field}
		onclick={() => (editing === field ? close() : open(field))}
	>
		<span class="text-primary">{label}</span>
		<span class="flex items-center gap-1.5 text-muted-foreground">
			{value}
			<span aria-hidden="true" class="text-base-content/40">›</span>
		</span>
	</button>
{/snippet}

{#snippet actions()}
	{#if error}
		<p role="alert" class="text-sm text-error-content">{error}</p>
	{/if}
	<div class="flex justify-end gap-2">
		<Button type="button" variant="ghost" onclick={close}>Cancelar</Button>
		<Button type="submit" disabled={busy}>Guardar</Button>
	</div>
{/snippet}

<div class="mt-5 space-y-6">
	<div class="flex items-center gap-3.5 rounded-2xl border bg-white p-3.5">
		<span
			class="flex size-13 shrink-0 items-center justify-center rounded-full bg-primary text-xl text-primary-foreground uppercase"
			aria-hidden="true"
		>
			{account.email.charAt(0)}
		</span>
		<span class="min-w-0">
			<span class="block truncate text-primary">{account.email}</span>
			<span class="block text-xs text-muted-foreground">Último respaldo: {lastSync}</span>
		</span>
	</div>

	<section class="space-y-1.5">
		<h2 class="ml-4 text-xs tracking-wider text-muted-foreground uppercase">Peso corporal</h2>
		<div class="divide-y overflow-hidden rounded-2xl border bg-white">
			{@render row('Hoy', todayWeight ? formatKg(todayWeight.kg) : 'Sin registrar', 'weight')}
			{#if editing === 'weight'}
				<form onsubmit={saveWeight} novalidate class="space-y-3 bg-background px-4 py-3">
					<label class="flex items-center justify-between gap-3">
						<span class="text-sm text-muted-foreground">Peso de hoy (kg)</span>
						<input
							type="number"
							inputmode="decimal"
							step="0.1"
							aria-label="Peso de hoy (kg)"
							class="h-11 w-28 rounded-lg border bg-white px-3 text-right text-lg text-primary"
							bind:value={draft}
						/>
					</label>
					{@render actions()}
				</form>
			{/if}
			<button
				type="button"
				class="flex min-h-13 w-full items-center justify-between gap-3 px-4 text-left active:bg-muted"
				onclick={() => (historyOpen = true)}
			>
				<span class="text-primary">Historial</span>
				<span class="flex items-center gap-1.5 text-muted-foreground">
					{history?.length === 1 ? '1 registro' : `${history?.length ?? 0} registros`}
					<span aria-hidden="true" class="text-base-content/40">›</span>
				</span>
			</button>
		</div>
		<p class="mx-4 text-xs text-muted-foreground">
			Con él se calculan el peso efectivo de dominadas y fondos y la fuerza relativa.
		</p>
	</section>

	<section class="space-y-1.5">
		<h2 class="ml-4 text-xs tracking-wider text-muted-foreground uppercase">Datos</h2>
		<div class="divide-y overflow-hidden rounded-2xl border bg-white">
			{@render row('Sexo', profile?.sex ? sexLabel[profile.sex] : 'Sin indicar', 'sex')}
			{#if editing === 'sex'}
				<div class="space-y-2 bg-background px-4 py-3">
					<SegmentedSwitch
						legend="Sexo"
						name="profile-sex"
						options={sexOptions}
						value={profile?.sex ?? 'none'}
						disabled={busy}
						onchange={pickSex}
					/>
					{#if error}
						<p role="alert" class="text-sm text-error-content">{error}</p>
					{/if}
				</div>
			{/if}
			{@render row('Fecha de nacimiento', birthDateLabel, 'birthDate')}
			{#if editing === 'birthDate'}
				<form
					onsubmit={(event) => saveProfile(event, { birthDate: draftText() || null })}
					novalidate
					class="space-y-3 bg-background px-4 py-3"
				>
					<input
						type="date"
						min={PROFILE_LIMITS.minBirthDate}
						max={today}
						aria-label="Fecha de nacimiento"
						class="h-11 w-full rounded-lg border bg-white px-3 text-primary"
						bind:value={draft}
					/>
					{@render actions()}
				</form>
			{/if}
			{@render row(
				'Estatura',
				profile?.height === null || profile?.height === undefined
					? 'Sin indicar'
					: `${profile.height} cm`,
				'height'
			)}
			{#if editing === 'height'}
				<form
					onsubmit={(event) =>
						saveProfile(event, { height: draftText() === '' ? null : Number(draftText()) })}
					novalidate
					class="space-y-3 bg-background px-4 py-3"
				>
					<label class="flex items-center justify-between gap-3">
						<span class="text-sm text-muted-foreground">Estatura (cm)</span>
						<input
							type="number"
							inputmode="numeric"
							min={PROFILE_LIMITS.minHeight}
							max={PROFILE_LIMITS.maxHeight}
							aria-label="Estatura (cm)"
							class="h-11 w-28 rounded-lg border bg-white px-3 text-right text-lg text-primary"
							bind:value={draft}
						/>
					</label>
					{@render actions()}
				</form>
			{/if}
		</div>
	</section>

	<section class="space-y-1.5">
		<h2 class="ml-4 text-xs tracking-wider text-muted-foreground uppercase">Cuenta</h2>
		<dl aria-label="Sincronización" class="divide-y overflow-hidden rounded-2xl border bg-white">
			<div class="flex min-h-13 items-center justify-between gap-3 px-4">
				<dt class="text-primary">Pendientes de subir</dt>
				<dd class="text-muted-foreground">{status.value?.pending ?? '…'}</dd>
			</div>
			<div class="flex min-h-13 items-center justify-between gap-3 px-4">
				<dt class="text-primary">Último respaldo</dt>
				<dd class="text-muted-foreground">{lastSync}</dd>
			</div>
		</dl>
		{#if syncState.error}
			<p class="mx-4 text-sm text-error-content" role="status">
				No se pudo sincronizar: {syncState.error}. Se reintenta al recuperar red.
			</p>
		{/if}
		<button
			type="button"
			class="mt-2 flex min-h-13 w-full items-center rounded-2xl border bg-white px-4 text-error-content active:bg-muted"
			onclick={signOut}
		>
			Cerrar sesión
		</button>
		<p class="mx-4 text-xs text-muted-foreground">
			Tus series siguen en este teléfono aunque cierres sesión.
		</p>
	</section>
</div>

<Sheet.Root bind:open={historyOpen}>
	<Sheet.Content
		side="bottom"
		class="max-h-[85dvh] overflow-y-auto rounded-t-3xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
	>
		<Sheet.Header class="sr-only">
			<Sheet.Title>Historial de peso corporal</Sheet.Title>
			<Sheet.Description>Registra otro día, corrige o borra un registro.</Sheet.Description>
		</Sheet.Header>
		<BodyWeightSection {history} {today} {onlog} {onedit} {ondelete} />
	</Sheet.Content>
</Sheet.Root>

<OtherAccountDialog
	open={syncState.otherAccountData}
	{ownerEmail}
	newEmail={account.email}
	onconfirm={() => discardOtherAccountData(account)}
	oncancel={signOut}
/>
