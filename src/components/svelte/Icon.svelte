<script lang="ts">
    let props = $props();
</script>

<svg class={props.class}>
    <use href={`/icons.svg#${props.name}`} />
</svg>
