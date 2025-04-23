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

<div class="flex flex-col items-center justify-center">
    {#each data as row}
        <div class="stats shadow my-2">
            {#each row as stat}
                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <Icon name={stat.iconName} class="h-6 w-6" />
                    </div>
                    <div class="stat-title">{stat.title}</div>
                    <div class="stat-value">{stat.value}</div>
                    <div class="stat-desc">{stat.desc}</div>
                </div>
            {/each}
        </div>
    {/each}
</div>
