<script module lang="ts">
	import type { ProgressResponse } from 'backend/contract';

	type Day = ProgressResponse['heatmap'][number];

	// Daily XP buckets from the spec: 0, 1–19, 20–49, 50–79, 80+.
	export const heatClass = (xp: number) =>
		xp >= 80 ? 'bg-heat-4' : xp >= 50 ? 'bg-heat-3' : xp >= 20 ? 'bg-heat-2' : xp > 0 ? 'bg-heat-1' : 'bg-heat-0';

	export const cellClass = (day: Day) =>
		day.status === 'rest'
			? 'shadow-[inset_0_0_0_1px_var(--rest-ring)]'
			: day.status === null
				? 'bg-heat-0 opacity-40'
				: heatClass(day.xp);
</script>

<script lang="ts">
	import { monthShort } from '$lib/format';

	// Columns are weeks (Monday on top); days come oldest first starting on a Monday.
	let { days }: { days: Day[] } = $props();

	const weeks = $derived(
		Array.from({ length: Math.ceil(days.length / 7) }, (_, w) =>
			Array.from({ length: 7 }, (_, d) => days[w * 7 + d] ?? null),
		),
	);
	const range = $derived(days.length ? `${monthShort(days[0]!.day)} → ${monthShort(days.at(-1)!.day)}` : '');
</script>

<section class="flex flex-col gap-3 rounded-2xl bg-card p-4">
	<div class="flex items-baseline justify-between">
		<h2 class="m-0 text-[15px] font-semibold">Last {weeks.length} weeks</h2>
		<div class="font-mono text-[11px] text-muted-foreground">{range}</div>
	</div>
	<div
		role="img"
		aria-label="Activity heatmap: daily XP for the last {weeks.length} weeks"
		class="grid gap-0.5"
		style:grid-template-columns="repeat({weeks.length}, minmax(0, 1fr))"
	>
		{#each weeks as week, w (w)}
			<div class="grid grid-rows-7 gap-0.5">
				{#each week as day, d (d)}
					{#if day}
						<span class="flex aspect-square items-center justify-center rounded-[2px] {cellClass(day)}">
							{#if day.status === 'grace'}<span class="size-[3px] rounded-full bg-grace-dot"></span>{/if}
						</span>
					{:else}
						<span class="aspect-square"></span>
					{/if}
				{/each}
			</div>
		{/each}
	</div>
	<div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
		<div class="flex items-center gap-1">
			<span>Less</span>
			<span class="size-2.5 rounded-[2px] bg-heat-0"></span>
			<span class="size-2.5 rounded-[2px] bg-heat-1"></span>
			<span class="size-2.5 rounded-[2px] bg-heat-2"></span>
			<span class="size-2.5 rounded-[2px] bg-heat-3"></span>
			<span class="size-2.5 rounded-[2px] bg-heat-4"></span>
			<span>More</span>
		</div>
		<div class="flex items-center gap-3">
			<span class="flex items-center gap-1"><span class="size-2 rounded-[2px] shadow-[inset_0_0_0_1px_var(--rest-ring)]"></span>Rest</span>
			<span class="flex items-center gap-1"
				><span class="flex size-2.5 items-center justify-center rounded-[2px] bg-heat-0"
					><span class="size-[3px] rounded-full bg-grace-dot"></span></span
				>Grace</span
			>
		</div>
	</div>
</section>
