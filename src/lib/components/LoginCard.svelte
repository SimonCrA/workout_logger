<script lang="ts">
	import { authClient } from '#lib/auth-client.js';
	import { MIN_PASSWORD_LENGTH, authErrorMessages } from '#lib/auth-rules.js';
	import Icon from '#lib/components/Icon.svelte';
	import OtherAccountDialog from '#lib/components/OtherAccountDialog.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { db } from '#lib/log/db.js';
	import { hasLocalData } from '#lib/sync/client.js';
	import { discardOtherAccountData, type Account } from '#lib/sync/runtime.svelte.js';

	/**
	 * Perfil sin sesión (ADR-0007): solo esta tarjeta, para iniciar sesión o crear cuenta con email
	 * y contraseña (ADR-0003). Si el teléfono guarda series de otra cuenta, pregunta antes de entrar.
	 */
	let mode = $state<'signin' | 'signup'>('signin');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);
	let ownerEmail = $state<string | null>(null);
	let askBeforeEntering = $state(false);

	const benefits = [
		'Respaldo automático de tus entrenamientos',
		'Tu peso corporal y tus datos en todos tus dispositivos',
		'Peso efectivo de dominadas y fondos, y fuerza relativa'
	];

	async function storedOwnerEmail(): Promise<string | null> {
		const owner = await db.meta.get('ownerEmail');
		return typeof owner?.value === 'string' ? owner.value : null;
	}

	/** Este teléfono ya sincronizó con otra cuenta y aún guarda series: avisar antes de entrar. */
	async function belongsToAnotherAccount(): Promise<boolean> {
		ownerEmail = await storedOwnerEmail();
		if (!ownerEmail || ownerEmail.toLowerCase() === email.trim().toLowerCase()) return false;
		return hasLocalData(db);
	}

	/** Crea la cuenta o inicia sesión; devuelve la cuenta si entró. */
	async function enter(): Promise<Account | null> {
		busy = true;
		error = '';
		const result =
			mode === 'signup'
				? await authClient.signUp.email({ email, password, name: email.split('@')[0] })
				: await authClient.signIn.email({ email, password });
		busy = false;
		if (result.error) {
			// Sin código conocido se muestra el estado HTTP: distingue un 503 del servidor de un fallo de red.
			error =
				authErrorMessages[result.error.code ?? ''] ??
				`No se pudo completar (${result.error.status} ${result.error.statusText}): ${result.error.message ?? 'sin detalle'}`;
			return null;
		}
		password = '';
		return { id: result.data.user.id, email: result.data.user.email };
	}

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (await belongsToAnotherAccount()) {
			askBeforeEntering = true;
			return;
		}
		await enter();
	}

	/** Lo local se borra solo después de haber entrado: una contraseña mal escrita no borra nada. */
	async function enterDiscardingLocalData() {
		askBeforeEntering = false;
		const account = await enter();
		if (account) await discardOtherAccountData(account);
	}
</script>

<section aria-labelledby="login-title" class="mt-5 space-y-4 rounded-3xl border bg-white p-4 pt-5">
	<h2 id="login-title" class="text-xl text-primary">Entra a tu cuenta</h2>
	<ul class="space-y-2.5">
		{#each benefits as benefit (benefit)}
			<li class="flex items-start gap-2.5 text-sm">
				<span
					class="mt-px flex size-5.5 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-primary"
					aria-hidden="true"
				>
					<Icon name="check" class="size-3.5" />
				</span>
				{benefit}
			</li>
		{/each}
	</ul>

	<div
		class="grid grid-cols-2 rounded-full bg-muted p-1"
		role="tablist"
		aria-label="Entrar o crear cuenta"
	>
		{#each [{ value: 'signin', label: 'Iniciar sesión' }, { value: 'signup', label: 'Crear cuenta' }] as const as tab (tab.value)}
			<button
				type="button"
				role="tab"
				aria-selected={mode === tab.value}
				class={[
					'min-h-10 rounded-full text-sm transition-colors',
					mode === tab.value ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'
				]}
				onclick={() => (mode = tab.value)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<form {onsubmit} class="space-y-3.5">
		<div class="space-y-1.5">
			<Label for="email" class="text-muted-foreground">Email</Label>
			<Input
				id="email"
				type="email"
				autocomplete="email"
				required
				class="h-12 bg-background text-base"
				bind:value={email}
			/>
		</div>
		<div class="space-y-1.5">
			<Label for="password" class="text-muted-foreground">Contraseña</Label>
			<Input
				id="password"
				type="password"
				autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
				minlength={MIN_PASSWORD_LENGTH}
				required
				class="h-12 bg-background text-base"
				bind:value={password}
			/>
		</div>
		{#if error}
			<p class="text-sm text-error-content" role="alert">{error}</p>
		{/if}
		<Button type="submit" size="lg" class="h-13 w-full text-base" disabled={busy}>
			{mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
		</Button>
	</form>
	<p class="text-xs text-muted-foreground">
		No hay recuperación por correo: si olvidas la contraseña, el dueño la restablece.
	</p>
</section>

<OtherAccountDialog
	bind:open={askBeforeEntering}
	{ownerEmail}
	newEmail={email}
	onconfirm={enterDiscardingLocalData}
	oncancel={() => {
		askBeforeEntering = false;
	}}
/>
