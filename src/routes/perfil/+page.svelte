<script lang="ts">
	import { authClient } from '#lib/auth-client.js';
	import AboutSection from '#lib/components/AboutSection.svelte';
	import LoginCard from '#lib/components/LoginCard.svelte';
	import ProfileSettings from '#lib/components/ProfileSettings.svelte';
	import TabPage from '#lib/components/TabPage.svelte';
	import { minuteClock } from '#lib/log/clock.svelte.js';
	import { live } from '#lib/log/live.svelte.js';
	import {
		deleteBodyWeight,
		liveBodyWeights,
		liveProfile,
		logBodyWeight,
		updateBodyWeight,
		updateProfile
	} from '#lib/log/profile.js';
	import { localDate, type BodyWeightInput, type ProfileChanges } from '#lib/log/profile-rules.js';
	import type { BodyWeight } from '#lib/log/types.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';

	/**
	 * Perfil (ADR-0007): sin sesión, solo la tarjeta para entrar o crear cuenta; con sesión, el
	 * peso corporal, los datos y la cuenta para editar. "Acerca de" cierra la página en los dos casos.
	 */
	const session = authClient.useSession();
	const history = live(() => liveBodyWeights());
	const profile = live(() => liveProfile());
	const clock = minuteClock();
	const today = $derived(localDate(clock.now));
	const account = $derived(
		$session.data ? { id: $session.data.user.id, email: $session.data.user.email } : null
	);

	async function log(input: BodyWeightInput) {
		await logBodyWeight(input);
		requestSync();
	}

	async function edit(entry: BodyWeight, input: BodyWeightInput) {
		const written = await updateBodyWeight(entry.id, input);
		if (!written) throw new Error('Este registro se borró desde otro dispositivo.');
		requestSync();
	}

	async function remove(entry: BodyWeight) {
		await deleteBodyWeight(entry.id);
		requestSync();
	}

	async function save(changes: ProfileChanges) {
		await updateProfile(changes);
		requestSync();
	}
</script>

<TabPage title="Perfil">
	{#if $session.isPending}
		<p class="mt-4 text-muted-foreground">Cargando…</p>
	{:else if account}
		<ProfileSettings
			{account}
			history={history.value}
			profile={profile.value}
			{today}
			onlog={log}
			onedit={edit}
			ondelete={remove}
			onsave={save}
		/>
	{:else}
		<LoginCard />
	{/if}
	<AboutSection />
</TabPage>
