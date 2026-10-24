<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { progressQuery } from '$lib/api/queries';
	import Heatmap from '$lib/components/app/Heatmap.svelte';
	import LoadState from '$lib/components/app/LoadState.svelte';
	import StatStrip from '$lib/components/app/StatStrip.svelte';
	import WeekBars from '$lib/components/app/WeekBars.svelte';
	import { duration } from '$lib/feel/motion';
	import { number, percent } from '$lib/format';

	const progress = progressQuery();

	// The level bar fills from empty each time the screen opens.
	const fill = new Tween(0, { easing: cubicOut });
	$effect(() => {
		const level = progress.data?.level;
		if (level) fill.set((level.xp - level.levelStartXp) / (level.nextLevelXp - level.levelStartXp), { delay: duration(120), duration: duration(800) });
	});
</script>

<h1 class="m-0 text-[28px] leading-[1.15] font-semibold tracking-tight">Progress</h1>

{#if progress.data}
	{@const data = progress.data}
	{@const { level } = data}
	{@const span = level.nextLevelXp - level.levelStartXp}
	{@const into = level.xp - level.levelStartXp}
	<div class="-mt-2 flex flex-col gap-4">
		<div class="flex flex-col gap-3 rounded-2xl bg-card p-4">
			<div class="flex items-baseline justify-between">
				<div class="flex items-baseline gap-2">
					<span class="text-[15px] text-muted-foreground">Level</span>
					<span class="font-mono text-[40px] leading-none font-medium text-amber-bright">{level.level}</span>
				</div>
				<div class="font-mono text-[13px] text-muted-foreground">{number(level.xp)} XP</div>
			</div>
			<div role="img" aria-label="{into} of {span} XP to level {level.level + 1}" class="h-2 overflow-hidden rounded-full bg-track">
				<div class="h-full rounded-full bg-amber" style:width="{fill.current * 100}%"></div>
			</div>
			<div class="eyebrow">{number(level.nextLevelXp - level.xp)} XP to level {level.level + 1}</div>
		</div>

		<StatStrip
			stats={[
				{ label: 'Consistency · 28 days', value: percent(data.consistency), unit: data.consistency === null ? '' : '%' },
				{ label: `Streak · best ${data.streak.longest}`, value: String(data.streak.current), unit: ' days' },
			]}
		/>

		<Heatmap days={data.heatmap} />
		<WeekBars weeks={data.weeklyXp} plan={data.plannedWeeklyXp} />
	</div>
{:else}
	<LoadState error={progress.error} onretry={() => progress.refetch()} />
{/if}
