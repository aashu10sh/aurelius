<script lang="ts">
	import { haptic } from '$lib/feel/haptics';

	let { label, value = $bindable() }: { label: string; value: number | undefined } = $props();

	function choose(n: number) {
		if (value !== n) haptic('select');
		value = n;
	}
</script>

<div role="group" aria-label="Rating for {label}" class="grid grid-cols-5 gap-2">
	{#each [1, 2, 3, 4, 5] as n (n)}
		<button
			type="button"
			aria-pressed={value === n}
			onclick={() => choose(n)}
			class="h-12 rounded-xl font-mono text-base transition-[background-color,color,scale] duration-200 active:scale-95 {value === n
				? 'bg-primary text-primary-foreground'
				: 'bg-card text-soft active:bg-accent'}"
		>
			{#key value === n}<span class="inline-block {value === n ? 'animate-bump' : ''}">{n}</span>{/key}
		</button>
	{/each}
</div>
