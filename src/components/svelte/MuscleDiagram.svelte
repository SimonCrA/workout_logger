<script lang="ts">
    import { muscleSelected } from "../../store";
    import svgContent from "../../assets/muscle-map.svg?raw";
    import { onMount } from "svelte";

    // Reactive props using runes
    let { initialView } = $props<{
        initialView: "front" | "back";
    }>();

    let processedSvg = $state(svgContent);

    $effect(() => {
        updateSvg();

        const selectedMuscle = $muscleSelected;

        // esperamos que el SVG este en el DOM
        if (document.querySelector(".svg-container")) {
            document.querySelectorAll(".muscle").forEach((muscle) => {
                muscle.classList.remove("selected");
            });

            if (selectedMuscle) {
                const muscleElement = document.getElementById(selectedMuscle);
                if (muscleElement) {
                    muscleElement.classList.add("selected");
                }
            }
        }
    });

    function updateSvg() {
        processedSvg = svgContent
            .replace(/<style.*?<\/style>/gs, "")
            .replace(/style=".*?"/g, "")
            .replace(
                'id="front-view"',
                `id="front-view" style="display:${initialView === "front" ? "block" : "none"}"`,
            )
            .replace(
                'id="back-view"',
                `id="back-view" style="display:${initialView === "back" ? "block" : "none"}"`,
            );
    }

    function handleClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target) return;

        const muscle = target.closest(".muscle");
        if (!muscle) return;

        muscle.classList.toggle("selected");

        muscleSelected.set(muscleSelected.get().length > 0 ? "" : muscle.id);
    }

    onMount(() => {
        updateSvg();
    });

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e as unknown as MouseEvent);
        }
    }
</script>

<div class="container">
    <div
        class="svg-container"
        onclick={handleClick}
        onkeydown={handleKeyDown}
        role="button"
        aria-label="Muscle selection diagram"
        tabindex="0"
    >
        {@html processedSvg}
    </div>
</div>

<style>
    .container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .svg-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    :global(.outline-human) {
        stroke: #161616;
        stroke-width: 0.8px;
        fill: none;
    }

    :global(.muscle) {
        fill: #e2ddd9; /* Slate-200 */
        stroke: #c2bdb9; /* Slate-300 */
        stroke-width: 0.8px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        paint-order: stoke;
        stroke-linejoin: round;
    }

    :global(.muscle:hover) {
        fill: #f3ede9; /* Slate-400 */
        stroke: #c2bdb9; /* Slate-500 */
        transform: translateY(-0.5px);
        stroke-linejoin: round;
    }

    :global(.muscle.selected) {
        fill: #c2bdb9 !important; /* Bleu-500 */
        stroke: #1c1c29; /* Bleu-700 */
        stroke-width: 1.2px;
        z-index: 10;
        filter: drop-shadow(0 0 4px rgba(28, 28, 41, 0.3));
    }
</style>
