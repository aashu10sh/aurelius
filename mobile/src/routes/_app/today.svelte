<script lang="ts">
	import { p } from 'sv-router/generated';
	import { todayQuery, useToggleTask } from '$lib/api/queries';
	import LoadState from '$lib/components/app/LoadState.svelte';
	import QuoteText from '$lib/components/app/QuoteText.svelte';
	import StatStrip from '$lib/components/app/StatStrip.svelte';
	import TaskRow from '$lib/components/app/TaskRow.svelte';
	import { Button } from '$lib/components/ui/button';
	import { dayLabel, greeting, initial, percent } from '$lib/format';
	import { quoteOfDay } from '$lib/quotes';

	const today = todayQuery();
	const toggle = useToggleTask();

	const anyDone = $derived(today.data?.goals.some((g) => g.tasks.some((t) => t.doneToday)) ?? false);

	// Goal meta: milestones, or the metric's current → target.
	const goalMeta = (goal: NonNullable<typeof today.data>['goals'][number]) =>
		goal.metric
			? `${goal.metric.currentValue} ${goal.metric.unit} → ${goal.metric.targetValue}`
			: goal.milestones.total
				? `${goal.milestones.done}/${goal.milestones.total} milestones`
				: '';
</script>

{#if today.data}
	{@const data = today.data}
	<div class="flex flex-col gap-6">
		<div class="flex items-center justify-between gap-4">
			<div class="flex flex-col gap-1">
				<div class="eyebrow">{dayLabel(data.day)}</div>
				<h1 class="m-0 text-[28px] leading-[1.15] font-semibold tracking-tight">{greeting()}, {data.name.split(' ')[0]}</h1>
			</div>
			<a
				href={p('/settings')}
				aria-label="Profile and settings"
				class="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-base font-semibold"
			>
				{initial(data.name)}
			</a>
		</div>

		<StatStrip
			stats={[
				{ label: 'XP today', value: String(data.xpToday), highlight: true },
				{ label: 'Streak', value: String(data.streak.current), unit: ' d' },
				{ label: 'Consistency', value: percent(data.consistency), unit: data.consistency === null ? '' : '%' },
			]}
		/>

		<QuoteText quote={quoteOfDay(data.day, 1)} />
	</div>

	{#each data.goals as goal (goal.id)}
		<section class="flex flex-col gap-3">
			<a href={p('/goals/:id', { params: { id: goal.id } })} class="flex items-baseline justify-between gap-3 text-foreground">
				<h2 class="m-0 text-[17px] font-semibold">{goal.title}</h2>
				<div class="font-mono text-xs text-muted-foreground">{goalMeta(goal)}</div>
			</a>
			{#if goal.tasks.length}
				<div class="card-list flex flex-col overflow-hidden rounded-2xl bg-card">
					{#each goal.tasks as task (task.id)}
						<TaskRow {task} ontoggle={() => toggle.mutate({ taskId: task.id, done: !task.doneToday })} />
					{/each}
				</div>
			{:else}
				<a href={p('/goals/:id', { params: { id: goal.id } })} class="rounded-2xl bg-card p-4 text-[15px] text-muted-foreground">
					No small tasks yet. Add one →
				</a>
			{/if}
		</section>
	{:else}
		<div class="flex flex-col items-start gap-4 rounded-2xl bg-card p-5">
			<p class="m-0 text-[15px] text-soft">No active goals. Set one and its small tasks will show up here.</p>
			<Button href={p('/goals/new')}>New goal</Button>
		</div>
	{/each}

	{#if anyDone && !data.journalWritten}
		<a
			href={p('/journal')}
			class="flex min-h-16 items-center gap-3 rounded-2xl bg-ember/8 px-4 py-3 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ember)_35%,transparent)]"
		>
			<span class="flex flex-1 flex-col gap-1">
				<span class="text-[15px] font-medium">How did today feel?</span>
				<span class="text-[13px] text-muted-foreground">A line or two for your journal</span>
			</span>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="text-ember"><path d="M9 6l6 6-6 6" /></svg>
		</a>
	{/if}
{:else}
	<LoadState error={today.error} onretry={() => today.refetch()} />
{/if}
