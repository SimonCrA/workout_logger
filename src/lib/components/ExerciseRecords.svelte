<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import { formatDate, formatKg } from '#lib/log/labels.js';
	import type { PersonalRecords } from '#lib/log/records.js';

	/**
	 * Los récords del ejercicio (GLOSSARY: Récord): peso máximo y 1RM estimado con su fecha, y las reps
	 * máximas en cada peso efectivo, de mayor a menor peso. Sin series con peso conocido, un estado vacío.
	 */
	let { records }: { records: PersonalRecords } = $props();

	const tiles = $derived([
		{ title: 'Peso máximo', milestone: records.maxWeight },
		{ title: '1RM estimado', milestone: records.e1RM }
	]);
</script>

{#if records.repsByWeight.length === 0}
	<p class="text-muted-foreground">
		Sin récords todavía: salen de las series de trabajo con peso conocido.
	</p>
{:else}
	<dl aria-label="Récords" class="grid grid-cols-2 gap-3">
		{#each tiles as tile (tile.title)}
			<div class="relative rounded-lg bg-muted p-3">
				<Icon name="champion" class="absolute top-3 right-3 size-5 text-muted-foreground" />
				<dt class="text-xs text-muted-foreground">{tile.title}</dt>
				<dd class="mt-1 text-xl">{tile.milestone ? formatKg(tile.milestone.kg) : '—'}</dd>
				{#if tile.milestone}
					<dd class="text-xs text-muted-foreground">el {formatDate(tile.milestone.at)}</dd>
				{/if}
			</div>
		{/each}
	</dl>
	<table class="mt-4 w-full text-left">
		<caption class="mb-2 text-left text-sm text-muted-foreground">Reps máximas por peso</caption>
		<thead class="text-xs text-muted-foreground">
			<tr>
				<th scope="col" class="py-1 font-normal">Peso</th>
				<th scope="col" class="py-1 font-normal">Reps</th>
				<th scope="col" class="py-1 font-normal">Fecha</th>
			</tr>
		</thead>
		<tbody class="divide-y">
			{#each records.repsByWeight as row (row.kg)}
				<tr>
					<td class="py-2">{formatKg(row.kg)}</td>
					<td class="py-2">{row.reps}</td>
					<td class="py-2 text-sm text-muted-foreground">{formatDate(row.at)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
