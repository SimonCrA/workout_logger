<script lang="ts">
	import { authClient } from '#lib/auth-client.js';
	import { MIN_PASSWORD_LENGTH, authErrorMessages } from '#lib/auth-rules.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';

	/** La cuenta opcional (ADR-0003): crear cuenta, iniciar y cerrar sesión con email y contraseña. */
	const session = authClient.useSession();

	let mode = $state<'signin' | 'signup'>('signin');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	async function signOut() {
		// Solo cierra la sesión en el servidor: las series del dispositivo no se tocan.
		await authClient.signOut();
		mode = 'signin';
	}

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		error = '';
		const result =
			mode === 'signup'
				? await authClient.signUp.email({ email, password, name: email.split('@')[0] })
				: await authClient.signIn.email({ email, password });
		if (result.error) {
			// Sin código conocido se muestra el estado HTTP: distingue un 503 del servidor de un fallo de red.
			error =
				authErrorMessages[result.error.code ?? ''] ??
				`No se pudo completar (${result.error.status} ${result.error.statusText}): ${result.error.message ?? 'sin detalle'}`;
		} else {
			password = '';
		}
		busy = false;
	}
</script>

<section aria-label="Cuenta" class="mt-6">
	{#if $session.isPending}
		<p class="text-muted-foreground">Cargando…</p>
	{:else if $session.data}
		<p>Sesión iniciada como <strong>{$session.data.user.email}</strong>.</p>
		<p class="mt-1 text-sm text-muted-foreground">
			Tus series siguen en este teléfono aunque cierres sesión.
		</p>
		<Button variant="outline" class="mt-4" onclick={signOut}>Cerrar sesión</Button>
	{:else}
		<p class="text-sm text-muted-foreground">
			La app funciona sin cuenta. Con cuenta, tus datos se respaldan y los recuperas en otro
			teléfono.
		</p>
		<div class="mt-4 flex gap-2" role="tablist" aria-label="Entrar o crear cuenta">
			<Button
				type="button"
				role="tab"
				aria-selected={mode === 'signin'}
				variant={mode === 'signin' ? 'default' : 'outline'}
				onclick={() => (mode = 'signin')}
			>
				Iniciar sesión
			</Button>
			<Button
				type="button"
				role="tab"
				aria-selected={mode === 'signup'}
				variant={mode === 'signup' ? 'default' : 'outline'}
				onclick={() => (mode = 'signup')}
			>
				Crear cuenta
			</Button>
		</div>
		<form {onsubmit} class="mt-4 space-y-4">
			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" autocomplete="email" required bind:value={email} />
			</div>
			<div class="space-y-2">
				<Label for="password">Contraseña</Label>
				<Input
					id="password"
					type="password"
					autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
					minlength={MIN_PASSWORD_LENGTH}
					required
					bind:value={password}
				/>
			</div>
			{#if error}
				<p class="text-sm text-error-content" role="alert">{error}</p>
			{/if}
			<Button type="submit" class="w-full" disabled={busy}>
				{mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
			</Button>
		</form>
		<p class="mt-4 text-xs text-muted-foreground">
			No hay recuperación por correo: si olvidas la contraseña, el dueño la restablece.
		</p>
	{/if}
</section>
