<script lang="ts">
	import { exerciseCountLabel } from '#lib/catalog/index.js';
	import Icon from '#lib/components/Icon.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { setCountLabel } from '#lib/log/labels.js';
	import { routineMuscles, routineSetCount } from '#lib/log/routine-rules.js';
	import type { Routine } from '#lib/log/types.js';

	/**
	 * Una rutina de Mis rutinas: nombre, cuándo se hizo, los músculos que trabaja y lo que prescribe.
	 * La que está en curso cambia de tono, dice desde cuándo y cuánto lleva, y lleva a Hoy con
	 * "Continuar"; las demás se empiezan con `onstart`. `quiet` aparta su Empezar mientras otra
	 * está en curso.
	 */
	let {
		routine,
		lastDone,
		inProgress = null,
		quiet = false,
		onstart
	}: {
		routine: Routine;
		lastDone: string;
		/** La hora de inicio ya escrita y los ejercicios que alcanzaron sus series. */
		inProgress?: { since: string; met: number } | null;
		quiet?: boolean;
		onstart: () => void;
	} = $props();

	const muscles = $derived(routineMuscles(routine.exercises));
	const total = $derived(routine.exercises.length);
	const summary = $derived(
		`${exerciseCountLabel(total)} · ${setCountLabel(routineSetCount(routine.exercises))}`
	);
</script>

<li
	class={[
		'flex flex-col gap-3 rounded-2xl border p-4',
		inProgress ? 'in-progress' : 'border-border bg-white'
	]}
>
	<div class="flex items-start justify-between gap-3">
		<a href="/rutinas/{routine.id}" class="min-w-0 active:opacity-70">
			{#if inProgress}
				<span
					class="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground"
				>
					<span class="size-1.5 rounded-full bg-primary-foreground"></span>
					En curso · {inProgress.since}
				</span>
			{/if}
			<span class="block truncate text-xl text-primary">{routine.name}</span>
			{#if !inProgress}
				<span class="block text-sm text-muted-foreground">{lastDone}</span>
			{/if}
		</a>
		<!-- El mismo destino que el nombre: una pista visual, fuera del orden de tabulación. -->
		<a
			href="/rutinas/{routine.id}"
			tabindex="-1"
			aria-hidden="true"
			class="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted"
		>
			<Icon name="pencil" class="size-5" />
		</a>
	</div>

	{#if muscles.length > 0}
		<p class="flex flex-wrap gap-1.5">
			{#each muscles as muscle (muscle)}
				<span class="chip rounded-full px-2.5 py-1 text-xs">{muscle}</span>
			{/each}
		</p>
	{/if}

	<div class="divider flex items-center justify-between gap-3 border-t pt-3">
		{#if inProgress}
			<span class="flex flex-col gap-1.5">
				<span class="text-sm">{inProgress.met} de {total} ejercicios</span>
				<span class="flex w-32 gap-0.5" aria-hidden="true">
					{#each { length: total }, index (index)}
						<span
							class={['h-1.5 flex-1 rounded-full', index < inProgress.met ? 'bg-primary' : 'track']}
						></span>
					{/each}
				</span>
			</span>
			<Button href="/" size="lg" class="px-4.5">Continuar</Button>
		{:else}
			<span class="text-sm text-muted-foreground">{summary}</span>
			<Button
				size="lg"
				variant={quiet ? 'outline' : 'default'}
				class={['px-4.5', quiet && 'border-primary text-primary']}
				onclick={onstart}
			>
				Empezar
			</Button>
		{/if}
	</div>
</li>

<style>
	/* La de en curso: un lila con el matiz del azul primario, con más color que el azul aclarado (que queda gris). */
	.in-progress {
		background: oklch(96% 0.028 285);
		border-color: oklch(86% 0.06 285);
	}
	.chip {
		background: var(--base-200);
	}
	.in-progress .chip {
		background: white;
	}
	.divider {
		border-color: var(--base-200);
	}
	.in-progress .divider {
		border-color: oklch(89% 0.045 285);
	}
	.track {
		background: oklch(88% 0.05 285);
	}
</style>
