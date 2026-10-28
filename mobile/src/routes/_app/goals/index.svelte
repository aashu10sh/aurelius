<script lang="ts">
	import type { GoalStatus } from 'backend/contract';
	import { p } from 'sv-router/generated';
	import { goalsQuery, prefetchGoal } from '$lib/api/queries';
	import LoadState from '$lib/components/app/LoadState.svelte';
	import Segmented from '$lib/components/app/Segmented.svelte';
	import SegmentBar from '$lib/components/app/SegmentBar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { rise, stagger } from '$lib/feel/transitions';
	import { percent } from '$lib/format';

	let filter = $state<'active' | 'done'>('active');
	const statuses = $derived<GoalStatus[]>(filter === 'active' ? ['active'] : ['completed', 'archived']);
	const goals = goalsQuery(() => statuses);
</script>

<div class="flex items-center justify-between">
	<h1 class="m-0 text-[28px] leading-[1.15] font-semibold tracking-tight">Goals</h1>
	<Button href={p('/goals/new')} variant="secondary" class="h-11 rounded-xl px-4 text-[15px]">New goal</Button>
</div>

<div class="-mt-2">
	<Segmented
		label="Show"
		bind:value={filter}
		options={[
			{ value: 'active', label: 'Active' },
			{ value: 'done', label: 'Completed & archived' },
		]}
	/>
</div>

{#if goals.data}
	<div class="-mt-2 flex flex-col gap-3">
		{#each goals.data as goal, i (goal.id)}
			<a
				href={p('/goals/:id', { params: { id: goal.id } })}
				onpointerdown={() => prefetchGoal(goal.id)}
				class="flex flex-col gap-4 rounded-2xl bg-card p-4 text-foreground transition-transform duration-150 active:scale-[0.98]"
				in:rise|global={{ delay: stagger(i, 45) }}
			>
				<div class="flex items-start justify-between gap-4">
					<div class="flex min-w-0 flex-col gap-1">
						<h2 class="m-0 text-[17px] font-semibold">{goal.title}</h2>
						{#if goal.why}<p class="m-0 truncate text-sm text-muted-foreground">{goal.why}</p>{/if}
					</div>
					{#if goal.status === 'active'}
						<div class="text-right">
							<div class="font-mono text-xl font-medium {goal.consistency !== null && goal.consistency >= 0.8 ? 'text-amber-bright' : ''}">
								{percent(goal.consistency)}{#if goal.consistency !== null}<span class="text-xs text-muted-foreground">%</span>{/if}
							</div>
							<div class="text-[11px] text-muted-foreground">consistency</div>
						</div>
					{:else}
						<span class="rounded-lg bg-chip px-2 py-1 font-mono text-[11px] text-amber-bright uppercase">{goal.status}</span>
					{/if}
				</div>
				{#if goal.metric}
					<div class="flex flex-col gap-2">
						<div class="h-1.5 overflow-hidden rounded-full bg-track"><div class="h-full origin-left animate-grow-x rounded-full bg-amber" style:width="{goal.metric.progress * 100}%"></div></div>
						<div class="eyebrow">{goal.metric.currentValue} {goal.metric.unit} → {goal.metric.targetValue}</div>
					</div>
				{:else if goal.milestones.total}
					<div class="flex flex-col gap-2">
						<SegmentBar done={goal.milestones.done} total={goal.milestones.total} />
						<div class="eyebrow">{goal.milestones.done}/{goal.milestones.total} milestones</div>
					</div>
				{/if}
				{#if goal.daysLeft !== null && goal.status === 'active'}
					<div class="eyebrow">{goal.daysLeft >= 0 ? `${goal.daysLeft} days left` : `${-goal.daysLeft} days past target`}</div>
				{/if}
			</a>
		{:else}
			<p class="m-0 rounded-2xl bg-card p-4 text-[15px] text-muted-foreground">
				{filter === 'active' ? 'No active goals yet.' : 'Nothing completed or archived yet.'}
			</p>
		{/each}
	</div>
{:else}
	<LoadState error={goals.error} onretry={() => goals.refetch()} />
{/if}
