<script lang="ts">
    let musclesList = [
        "Chest",
        "Biceps",
        "Back",
        "Quads",
        "Triceps",
        "Shoulders",
    ];
</script>

<select class="select select-primary">
    <option disabled selected>Pick a muscle</option>
    {#each musclesList as muscle}
        <option value={muscle}>{muscle}</option>
    {/each}
</select>
