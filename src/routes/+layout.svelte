<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { authClient } from '#lib/auth-client.js';
	import TabBar from '#lib/components/TabBar.svelte';
	import { setSyncAccount, startSyncTriggers } from '#lib/sync/runtime.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const session = authClient.useSession();

	// Con cuenta, el respaldo se activa solo; cerrar sesión lo para sin tocar los datos locales.
	$effect(() => {
		const user = $session.data?.user;
		if ($session.isPending) return;
		void setSyncAccount(user ? { id: user.id, email: user.email } : null);
	});
	$effect(() => startSyncTriggers());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="mx-auto max-w-lg p-6 pt-10 pb-24">
	{@render children()}
</main>

<TabBar />
