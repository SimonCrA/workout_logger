<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { authClient } from '#lib/auth-client.js';
	import TabBar from '#lib/components/TabBar.svelte';
	import { setSyncAccount, startSyncTriggers } from '#lib/sync/runtime.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const session = authClient.useSession();

	// Primitivos, para que una relectura de la sesión con el mismo usuario no reinicie el respaldo.
	const userId = $derived($session.data?.user.id ?? null);
	const userEmail = $derived($session.data?.user.email ?? '');
	const pending = $derived($session.isPending);

	// Con cuenta, el respaldo se activa solo; cerrar sesión lo para sin tocar los datos locales.
	$effect(() => {
		if (pending) return;
		void setSyncAccount(userId ? { id: userId, email: userEmail } : null);
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
