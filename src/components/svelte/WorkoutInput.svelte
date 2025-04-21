<script lang="ts">
    import Icon from "./Icon.svelte";

    let { leftIcon, rightIcon, joinClass, incInterval, value, onChange } =
        $props<{
            leftIcon: string;
            rightIcon: string;
            joinClass: string;
            incInterval: number | 1;
            value: number;
            onChange: (newValue: number) => void;
        }>();

    function decrease() {
        value -= incInterval;
        onChange(value);
    }

    function increase() {
        value += incInterval;
        onChange(value);
    }

    function handleInputChange(e: Event) {
        const inputValue = parseInt((e.target as HTMLInputElement).value) || 0;
        value = inputValue;
        onChange(value);
    }
</script>

<div class={`join ${joinClass}`}>
    <button class="btn btn-ghost join-item squared-l-full" onclick={decrease}>
        <Icon name={leftIcon} class="w-8 h-8" />
    </button>
    <input
        class="input join-item"
        placeholder="1"
        {value}
        oninput={handleInputChange}
    />
    <button class="btn btn-ghost join-item squared-r-full" onclick={increase}>
        <Icon name={rightIcon} class="w-8 h-8" />
    </button>
</div>
