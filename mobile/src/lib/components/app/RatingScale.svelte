<script lang="ts">
	let { label, value = $bindable() }: { label: string; value: number | undefined } = $props();
</script>

<div role="group" aria-label="Rating for {label}" class="grid grid-cols-5 gap-2">
	{#each [1, 2, 3, 4, 5] as n (n)}
		<button
			type="button"
			aria-pressed={value === n}
			onclick={() => (value = n)}
			class="h-12 rounded-xl font-mono text-base transition-colors {value === n
				? 'bg-primary text-primary-foreground'
				: 'bg-card text-soft active:bg-accent'}"
		>
			{n}
		</button>
	{/each}
</div>
