<script lang="ts">
    import { muscleView, muscleSelected } from "../../store";
    import type { IMuscle } from "../../env.d.ts";
    import { onMount } from "svelte";

    import MuscleDiagram from "./MuscleDiagram.svelte";
    import MuscleSelect from "./MuscleSelect.svelte";
    import Icon from "./Icon.svelte";

    let musclesDb = $state<IMuscle[]>([]);
    // inicializamos la vista con el valor del store
    let currentView = $state<"front" | "back">(muscleView.get());
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    const toggleView = () => {
        currentView = currentView === "front" ? "back" : "front";
        muscleView.set(currentView);
    };

    onMount(async () => {
        try {
            isLoading = true;
            error = null;

            const res = await fetch(`/api/muscles`);

            if (res.ok) {
                musclesDb = await res.json();
            } else {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "500: Internal Server Error";

            musclesDb = [];
        } finally {
            isLoading = false;
        }
    });

    let props = $props<{ pageTitle: string }>();
</script>

<div>
    {#if isLoading}
        <div class="flex flex-col items-center justify-center p-8 text-center">
            <span class="loading loading-spinner loading-lg"></span>
            <p class="mt-3">Cargando Diagrama...</p>
        </div>
    {:else if error}
        <div class="flex flex-col items-center justify-center p-8 text-center">
            <Icon name="error" class="w-16 h-16 text-error mb-3" />
            <h3 class="font-semibold text-lg">Error al cargar el diagrama</h3>
            <p class="text-sm opacity-70 mt-1">{error}</p>
        </div>
    {:else}
        <div class="flex flex-col items-center gap-4 mb-8">
            <h1 class="text-3xl font-bold">{props.pageTitle}</h1>
            <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-circle" onclick={toggleView}>
                    <Icon
                        name="refresh"
                        class="w-12 h-12 cursor-pointer hover:rotate-180 transition-transform"
                    />
                </button>
                <MuscleSelect muscles={musclesDb} />
                <a
                    class={`btn btn-ghost btn-circle ${!$muscleSelected ? "btn-disabled" : ""}`}
                    href="/exercises"
                >
                    <Icon name="arrow_right" class="w-12 h-12 cursor-pointer" />
                </a>
            </div>
        </div>

        <div
            class="w-full max-w-2xl mx-auto h-[70vh] md:aspect-[4/3] lg:h-[70vh]"
        >
            <MuscleDiagram initialView={currentView} />
        </div>
    {/if}
</div>
