<script lang="ts">
	import type { GoalDetailResponse, GoalStatus } from 'backend/contract';
	import { p, route } from 'sv-router/generated';
	import { slide } from 'svelte/transition';
	import { api } from '$lib/api/endpoints';
	import { goalQuery, useAction } from '$lib/api/queries';
	import LoadState from '$lib/components/app/LoadState.svelte';
	import SegmentBar from '$lib/components/app/SegmentBar.svelte';
	import StatStrip from '$lib/components/app/StatStrip.svelte';
	import TaskSheet from '$lib/components/app/TaskSheet.svelte';
	import TopBar from '$lib/components/app/TopBar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { haptic } from '$lib/feel/haptics';
	import { duration } from '$lib/feel/motion';
	import { play } from '$lib/feel/sound';
	import { cadenceShort, dateLabel, effortLabel, number, percent } from '$lib/format';

	const id = $derived(route.params.id as string);
	const goal = goalQuery(() => id);

	let sheetOpen = $state(false);
	let editing = $state<GoalDetailResponse['tasks'][number] | null>(null);
	let newMilestone = $state('');
	let reading = $state('');

	const toggleMilestone = useAction(({ milestoneId, done }: { milestoneId: string; done: boolean }) =>
		api.milestones.update(milestoneId, { done }),
	);
	const addMilestone = useAction((title: string) => api.goals.addMilestone(id, title));
	const logMetric = useAction((value: number) => api.goals.logMetric(id, value));
	const setStatus = useAction((status: GoalStatus) => api.goals.setStatus(id, status));

	const openSheet = (task: GoalDetailResponse['tasks'][number] | null) => {
		editing = task;
		sheetOpen = true;
	};

	async function submitMilestone(event: SubmitEvent) {
		event.preventDefault();
		if (!newMilestone.trim()) return;
		await addMilestone.mutateAsync(newMilestone.trim()).catch(() => {});
		newMilestone = '';
	}

	async function submitReading(event: SubmitEvent) {
		event.preventDefault();
		const value = Number(reading);
		if (reading === '' || Number.isNaN(value)) return;
		await logMetric.mutateAsync(value).catch(() => {});
		reading = '';
	}
</script>

{#if goal.data}
	{@const g = goal.data}
	{@const plan = g.tasks.reduce(
		(s, t) => s + t.xp * (t.cadence.type === 'daily' ? 7 : t.cadence.type === 'weekly' ? t.cadence.count : t.cadence.count / 4),
		0,
	)}
	<div class="flex flex-col gap-4">
		<TopBar href={p('/goals')} />
		<div class="flex flex-col gap-2">
			<h1 class="m-0 text-[28px] leading-[1.15] font-semibold tracking-tight">{g.title}</h1>
			{#if g.why}<p class="m-0 text-[15px] leading-snug text-muted-foreground">Why: {g.why}</p>{/if}
			{#if g.targetDate}
				<div class="eyebrow">
					Target {dateLabel(g.targetDate)}{#if g.daysLeft !== null && g.daysLeft >= 0}&nbsp;· {g.daysLeft} days left{/if}
				</div>
			{/if}
		</div>
	</div>

	{#if g.status === 'active'}
		<StatStrip
			stats={[
				{ label: 'Consistency · 28 days', value: percent(g.consistency), unit: g.consistency === null ? '' : '%', highlight: true },
				{ label: 'XP · 28 days', value: number(g.earnedXp) },
			]}
		/>
	{/if}

	{#if g.metric}
		{@const m = g.metric}
		<section class="flex flex-col gap-3">
			<div class="flex items-baseline justify-between">
				<h2 class="m-0 text-[17px] font-semibold">{m.currentValue} {m.unit}</h2>
				<div class="font-mono text-xs text-muted-foreground">{m.startValue} → {m.targetValue} {m.unit}</div>
			</div>
			<div class="h-2 overflow-hidden rounded-full bg-track"><div class="h-full origin-left animate-grow-x rounded-full bg-amber transition-[width] duration-500 ease-(--ease-out-soft)" style:width="{m.progress * 100}%"></div></div>
			<form class="flex gap-2" onsubmit={submitReading}>
				<label class="sr-only" for="reading">New reading in {m.unit}</label>
				<input id="reading" bind:value={reading} inputmode="decimal" placeholder="Today’s reading" class="h-11 min-w-0 flex-1 rounded-xl bg-card px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
				<Button type="submit" variant="secondary" class="h-11 rounded-xl px-4" disabled={logMetric.isPending}>Log</Button>
			</form>
		</section>
	{/if}

	<section class="flex flex-col gap-3">
		<div class="flex items-baseline justify-between">
			<h2 class="m-0 text-[17px] font-semibold">Milestones</h2>
			{#if g.milestones.total}<div class="font-mono text-xs text-muted-foreground">{g.milestones.done}/{g.milestones.total}</div>{/if}
		</div>
		{#if g.milestones.total}<SegmentBar done={g.milestones.done} total={g.milestones.total} />{/if}
		<div class="card-list flex flex-col overflow-hidden rounded-2xl bg-card">
			{#each g.milestoneList as milestone (milestone.id)}
				{@const done = milestone.doneAt !== null}
				<button
					type="button"
					aria-pressed={done}
					onclick={() => {
						haptic(done ? 'tap' : 'success');
						play(done ? 'untick' : 'goal');
						toggleMilestone.mutate({ milestoneId: milestone.id, done: !done });
					}}
					class="group flex min-h-[52px] w-full items-center gap-3 px-4 text-left"
					transition:slide={{ duration: duration(220) }}
				>
					<span class="relative m-px flex size-[18px] shrink-0 items-center justify-center transition-transform duration-150 group-active:scale-90">
						<span class="absolute inset-0 rounded border-[1.5px] transition-colors duration-200 {done ? 'border-transparent' : 'border-faint'}"></span>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="absolute text-amber">
							<path d="M5 12.5 10 17.5 19 7" pathLength="1" stroke-dasharray="1" class="transition-[stroke-dashoffset] duration-300 ease-(--ease-out-soft)" style:stroke-dashoffset={done ? 0 : 1} />
						</svg>
					</span>
					<span class="text-[15px] transition-colors duration-200 {done ? 'text-muted-foreground' : ''}">{milestone.title}</span>
				</button>
			{/each}
			<form class="flex items-center gap-2 px-4 py-2" onsubmit={submitMilestone}>
				<label class="sr-only" for="new-milestone">New milestone</label>
				<input id="new-milestone" bind:value={newMilestone} maxlength="120" placeholder="Add a milestone (+50 XP when done)" class="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
				{#if newMilestone.trim()}<Button type="submit" size="sm" disabled={addMilestone.isPending}>Add</Button>{/if}
			</form>
		</div>
	</section>

	<section class="flex flex-col gap-3">
		<div class="flex items-baseline justify-between">
			<h2 class="m-0 text-[17px] font-semibold">Small tasks</h2>
			<div class="font-mono text-xs text-muted-foreground">PLAN {Math.round(plan)} XP / WK</div>
		</div>
		<div class="card-list flex flex-col overflow-hidden rounded-2xl bg-card">
			{#each g.tasks as task (task.id)}
				<button type="button" onclick={() => openSheet(task)} class="flex min-h-[52px] w-full items-center gap-3 px-4 text-left" transition:slide={{ duration: duration(220) }}>
					<span class="flex-1 text-[15px]">{task.title}</span>
					<span class="font-mono text-xs text-muted-foreground">{cadenceShort(task.cadence)}</span>
					<span class="w-[52px] rounded-lg bg-chip py-1 text-center font-mono text-[11px] text-amber-bright">{effortLabel[task.effort]}</span>
				</button>
			{/each}
			{#if g.status === 'active'}
				<button type="button" onclick={() => openSheet(null)} class="flex min-h-[52px] w-full items-center px-4 text-left text-[15px] text-amber">
					Add a small task
				</button>
			{/if}
		</div>
	</section>

	{#if g.ratings.length}
		{@const latest = g.ratings.length - 1}
		<section class="flex flex-col gap-3">
			<h2 class="m-0 text-[17px] font-semibold">Did the work move you closer?</h2>
			<div
				role="img"
				aria-label="Weekly ratings: {g.ratings.map((r) => r.rating).join(', ')} out of 5"
				class="grid h-[88px] items-end gap-2 rounded-2xl bg-card p-4"
				style:grid-template-columns="repeat({Math.max(g.ratings.length, 6)}, minmax(0, 1fr))"
			>
				{#each g.ratings as r, i (r.weekStart)}
					<div class="flex flex-col items-center gap-2">
						<div class="w-full origin-bottom animate-grow-up rounded-md {i === latest ? 'bg-amber' : 'bg-heat-2'}" style:animation-delay="{100 + i * 45}ms" style:height="{r.rating * 10}px"></div>
						<div class="font-mono text-[11px] text-muted-foreground">{r.weekStart.slice(5).replace('-', '/')}</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<section class="flex flex-col gap-2">
		{#if g.status === 'active'}
			<Button size="block" variant="secondary" disabled={setStatus.isPending} onclick={() => setStatus.mutate('completed')}>
				Mark goal complete · <span class="font-mono font-medium text-amber-bright">+200 XP</span>
			</Button>
			<Button size="block" variant="ghost" class="font-medium text-muted-foreground" disabled={setStatus.isPending} onclick={() => setStatus.mutate('archived')}>
				Archive goal
			</Button>
		{:else}
			<Button size="block" variant="secondary" disabled={setStatus.isPending} onclick={() => setStatus.mutate('active')}>Reopen goal</Button>
		{/if}
	</section>

	<TaskSheet bind:open={sheetOpen} goalId={g.id} task={editing} />
{:else}
	<LoadState error={goal.error} onretry={() => goal.refetch()} />
{/if}
