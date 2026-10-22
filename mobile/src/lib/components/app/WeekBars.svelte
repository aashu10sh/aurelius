<script lang="ts">
	// Weekly XP against the plan; the current (partial) week is last and brightest.
	let { weeks, plan }: { weeks: { weekStart: string; xp: number }[]; plan: number } = $props();

	const max = $derived(Math.max(plan, ...weeks.map((w) => w.xp), 1));
</script>

<section class="flex flex-col gap-3 rounded-2xl bg-card p-4">
	<div class="flex items-baseline justify-between">
		<h2 class="m-0 text-[15px] font-semibold">XP per week</h2>
		<div class="font-mono text-[11px] text-muted-foreground">PLAN {plan}</div>
	</div>
	<div
		role="img"
		aria-label="XP per week for the last {weeks.length} weeks, plan {plan}"
		class="grid h-[120px] items-end gap-2"
		style:grid-template-columns="repeat({weeks.length}, minmax(0, 1fr))"
	>
		{#each weeks as week, i (week.weekStart)}
			{@const current = i === weeks.length - 1}
			<div class="flex flex-col items-center gap-1">
				<span class="font-mono text-[11px] {current ? 'text-amber-bright' : 'text-muted-foreground'}">{week.xp}</span>
				<div
					class="w-full rounded {current ? 'bg-amber' : week.xp >= plan && plan > 0 ? 'bg-heat-3' : 'bg-heat-2'}"
					style:height="{Math.max(2, Math.round((week.xp / max) * 96))}px"
				></div>
			</div>
		{/each}
	</div>
</section>
