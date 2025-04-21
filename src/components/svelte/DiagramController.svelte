<script lang="ts">
    import MuscleDiagram from "./MuscleDiagram.svelte";
    import Select from "./MuscleSelect.svelte";
    import Icon from "./Icon.svelte";
    import type { IMuscle } from "../../env.d.ts";
    import { muscleView, exerciseSelected } from "../../store";

    let currentView = $state<"front" | "back">("front");

    const toggleView = () => {
        currentView = currentView === "front" ? "back" : "front";
        muscleView.set(currentView);
    };

    let props = $props<{ pageTitle: string; musclesDb: IMuscle[] }>();
</script>

<div class="flex flex-col items-center gap-4 mb-8">
    <h1 class="text-3xl font-bold">{props.pageTitle}</h1>
    <div class="flex items-center gap-2">
        <button class="btn btn-ghost btn-circle" onclick={toggleView}>
            <Icon
                name="refresh"
                class="w-12 h-12 cursor-pointer hover:rotate-180 transition-transform"
            />
        </button>
        <Select muscles={props.musclesDb} />
        <a
            class={`btn btn-ghost btn-circle ${!exerciseSelected ? "disabled" : ""}`}
            href="/exercises"
        >
            <Icon name="arrow_right" class="w-12 h-12 cursor-pointer" />
        </a>
    </div>
</div>

<div class="w-full max-w-2xl mx-auto h-[70vh] md:aspect-[4/3] lg:h-[70vh]">
    <MuscleDiagram initialView={currentView} />
</div>
