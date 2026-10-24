<script lang="ts">
	import type { Snippet } from 'svelte';
	import AnimatedNumber from './AnimatedNumber.svelte';

	// `count` animates a numeric value instead of showing `value` as text;
	// `pulse` replays a small bump when it changes; `adornment` sits after the number.
	export type Stat = {
		label: string;
		value: string;
		unit?: string;
		highlight?: boolean;
		count?: number;
		pulse?: number;
		adornment?: Snippet;
	};

	// Numbers side by side in one card, split by hairlines.
	let { stats }: { stats: Stat[] } = $props();
</script>

<div class="grid rounded-2xl bg-card py-4" style:grid-template-columns="repeat({stats.length}, minmax(0, 1fr))">
	{#each stats as stat, i (stat.label)}
		<div class="flex flex-col gap-1 px-4 {i > 0 ? 'border-l border-border' : ''}">
			<div class="text-xs text-muted-foreground">{stat.label}</div>
			<div class="flex items-center gap-1.5">
				{#key stat.pulse}
					<div class="origin-left font-mono text-[22px] font-medium {stat.highlight ? 'text-amber-bright' : ''} {stat.pulse ? 'animate-bump' : ''}">
						{#if stat.count !== undefined}<AnimatedNumber value={stat.count} />{:else}{stat.value}{/if}{#if stat.unit}<span class="text-[13px] text-muted-foreground">{stat.unit}</span>{/if}
					</div>
				{/key}
				{@render stat.adornment?.()}
			</div>
		</div>
	{/each}
</div>
