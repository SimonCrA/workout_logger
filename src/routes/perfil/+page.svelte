<script lang="ts">
	import AboutSection from '#lib/components/AboutSection.svelte';
	import AccountPanel from '#lib/components/AccountPanel.svelte';
	import BodyWeightSection from '#lib/components/BodyWeightSection.svelte';
	import ProfileFields from '#lib/components/ProfileFields.svelte';
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

	/** Perfil (spec #26): peso corporal arriba, los datos después y, debajo, la cuenta y "Acerca de". */
	const history = live(() => liveBodyWeights());
	const profile = live(() => liveProfile());
	const clock = minuteClock();
	const today = $derived(localDate(clock.now));

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
	<BodyWeightSection history={history.value} {today} onlog={log} onedit={edit} ondelete={remove} />
	<ProfileFields profile={profile.value} {today} onsave={save} />
	<div class="mt-10 border-t">
		<AccountPanel />
	</div>
	<AboutSection />
</TabPage>
