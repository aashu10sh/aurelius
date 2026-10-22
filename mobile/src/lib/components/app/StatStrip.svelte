<script lang="ts">
	export type Stat = { label: string; value: string; unit?: string; highlight?: boolean };

	// Numbers side by side in one card, split by hairlines.
	let { stats }: { stats: Stat[] } = $props();
</script>

<div class="grid rounded-2xl bg-card py-4" style:grid-template-columns="repeat({stats.length}, minmax(0, 1fr))">
	{#each stats as stat, i (stat.label)}
		<div class="flex flex-col gap-1 px-4 {i > 0 ? 'border-l border-border' : ''}">
			<div class="text-xs text-muted-foreground">{stat.label}</div>
			<div class="font-mono text-[22px] font-medium {stat.highlight ? 'text-amber-bright' : ''}">
				{stat.value}{#if stat.unit}<span class="text-[13px] text-muted-foreground">{stat.unit}</span>{/if}
			</div>
		</div>
	{/each}
</div>
