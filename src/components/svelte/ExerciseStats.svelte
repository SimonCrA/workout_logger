<script lang="ts">
    import Icon from "./Icon.svelte";

    // Reactive props using runes
    let { data } = $props<{
        data: Array<
            Array<{
                title: string;
                value: number;
                desc: string;
                iconName: string;
            }>
        >;
    }>();
</script>

<div class="flex flex-wrap items-center justify-center">
    {#if data.length === 0}
        <div class="flex flex-col items-center justify-center p-8 text-center">
            <Icon name="alert" class="w-16 h-16 opacity-30 mb-3" />
            <h3 class="font-semibold text-lg">
                No hay indicadores para mostrar
            </h3>
            <p class="text-sm opacity-70 mt-1">
                Ve a la sección de ejercicios y selecciona uno para ver sus
                indicadores.
            </p>
        </div>
    {/if}
    {#each data as row}
        <div class="stats bg-base-200 shadow my-2 w-full">
            {#each row as stat}
                <div class="stat relative">
                    <div class="stat-figure text-secondary">
                        <Icon name={stat.iconName} class="h-6 w-6" />
                    </div>
                    <div class="stat-title text-[0.6rem]" title={stat.title}>
                        {stat.title}
                    </div>
                    <div class="stat-value">{stat.value}</div>
                    <div class="stat-desc">{stat.desc}</div>
                </div>
            {/each}
        </div>
    {/each}
</div>

<style>
    .stats {
        max-width: 100%;
    }

    .stat-title,
    .stat-desc {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
