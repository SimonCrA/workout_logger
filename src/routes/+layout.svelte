<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import TabBar from '#lib/components/TabBar.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="mx-auto max-w-lg p-6 pt-10 pb-24">
	{@render children()}
</main>

<TabBar />
