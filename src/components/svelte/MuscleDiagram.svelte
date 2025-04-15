<script lang="ts">
    import { onMount } from "svelte";

    // Reactive props
    export let initialView: "front" | "back" = "front";
    export let selectedMuscles: string[] = [];

    // SVG content (import as raw string)
    import svgContent from "../../assets/muscle-map.svg?raw";

    // Processed SVG with initial view
    let processedSvg = svgContent;

    // Toggle between front and back views
    function toggleView() {
        initialView = initialView === "front" ? "back" : "front";
        updateSvgView();
    }

    // Update SVG display based on current view
    function updateSvgView() {
        processedSvg = svgContent
            .replace(
                'id="front-view"',
                `id="front-view" style="display:${initialView === "front" ? "block" : "none"}"`,
            )
            .replace(
                'id="back-view"',
                `id="back-view" style="display:${initialView === "back" ? "block" : "none"}"`,
            );
    }

    // Handle muscle selection
    function handleClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target) return;

        const muscle = target.closest(".muscle");
        if (!muscle) return;

        muscle.classList.toggle("selected");
        selectedMuscles = Array.from(
            document.querySelectorAll(".muscle.selected"),
        )
            .map((el) => el.id)
            .filter(Boolean);
    }

    // Initialize component
    onMount(() => {
        updateSvgView();

        // Set initial selections
        selectedMuscles.forEach((id) => {
            document.getElementById(id)?.classList.add("selected");
        });
    });
</script>

<div class="container">
    <div class="controls">
        <button on:click={toggleView}>
            Show {initialView === "front" ? "Back" : "Front"} View
        </button>
        <div class="selected-display">
            Selected: {selectedMuscles.join(", ") || "None"}
        </div>
    </div>

    <div class="svg-container" on:click={handleClick}>
        {@html processedSvg}
    </div>
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: #f5f5f5;
        border-radius: 4px;
    }

    button {
        padding: 0.5rem 1rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background 0.2s;
    }

    button:hover {
        background: #2563eb;
    }

    .selected-display {
        font-size: 0.9rem;
        color: #666;
    }

    /* SVG Styling */
    :global(.muscle) {
        fill: #e0e0e0;
        stroke: #fff;
        stroke-width: 1px;
        transition: fill 0.2s ease;
        cursor: pointer;
    }

    :global(.muscle:hover) {
        fill: #ff9999;
    }

    :global(.muscle.selected) {
        fill: #ff4444 !important;
        filter: drop-shadow(0 0 2px rgba(255, 0, 0, 0.5));
    }
</style>
