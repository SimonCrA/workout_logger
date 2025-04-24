<script lang="ts">
    import Icon from "./Icon.svelte";

    let {
        leftIcon,
        rightIcon,
        joinClass,
        incInterval,
        value,
        onChange,
        type,
        placeholder,
    } = $props<{
        leftIcon: string;
        rightIcon: string;
        joinClass: string;
        incInterval: number | 1;
        value?: number;
        type: string;
        placeholder: string;
        onChange: (newValue: number) => void;
    }>();

    function decrease() {
        value -= incInterval;
        if (value < 0) value = 0;
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
    <button
        class={`btn join-item squared-l-full ${value === 0 ? "btn-disabled" : ""}`}
        onclick={decrease}
    >
        <Icon name={leftIcon} class="w-8 h-8" />
    </button>
    <input
        {type}
        class="input join-item"
        {placeholder}
        pattern="\\d+(,\\d+)?"
        {value}
        oninput={handleInputChange}
    />
    <button
        class={`btn join-item  ${value === 0 ? "btn-disabled" : ""}`}
        onclick={increase}
    >
        <Icon name={rightIcon} class="w-8 h-8" />
    </button>
</div>
