<script lang="ts">
	import type { ReflectionRequest } from 'backend/contract';
	import { p } from 'sv-router/generated';
	import { toast } from 'svelte-sonner';
	import { api } from '$lib/api/endpoints';
	import { journalQuery, useAction, weekQuery } from '$lib/api/queries';
	import { cellClass } from '$lib/components/app/Heatmap.svelte';
	import LoadState from '$lib/components/app/LoadState.svelte';
	import QuoteText from '$lib/components/app/QuoteText.svelte';
	import RatingScale from '$lib/components/app/RatingScale.svelte';
	import TopBar from '$lib/components/app/TopBar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { dayLabel, isoWeek, percent, weekLabel } from '$lib/format';
	import { quoteOfDay } from '$lib/quotes';

	const week = weekQuery();
	const journal = journalQuery();

	const questions = [
		{ id: 'forward', label: 'What moved you forward?', ph: 'Shipped the side project login flow' },
		{ id: 'blockers', label: 'What got in the way?', ph: 'Skipped Wednesday after a late deploy' },
		{ id: 'nextWeek', label: 'One thing to do differently', ph: 'Leetcode before work, not after' },
	] as const;

	// Reflection form, seeded from the week's saved reflection when there is one.
	let ratings = $state<Record<string, number | undefined>>({});
	let answers = $state({ forward: '', blockers: '', nextWeek: '' });
	let seededWeek = '';
	$effect(() => {
		const data = week.data;
		if (!data || seededWeek === data.weekStart) return;
		seededWeek = data.weekStart;
		const saved = data.reflection;
		ratings = Object.fromEntries(data.goals.map((g) => [g.id, saved?.goalRatings[g.id]?.rating]));
		answers = {
			forward: saved?.answers.forward ?? '',
			blockers: saved?.answers.blockers ?? '',
			nextWeek: saved?.answers.nextWeek ?? '',
		};
	});

	const reflect = useAction((req: ReflectionRequest) => api.week.reflect(req));

	async function saveReflection(event: SubmitEvent) {
		event.preventDefault();
		const goalRatings = Object.fromEntries(
			Object.entries(ratings).flatMap(([id, rating]) => (rating ? [[id, { rating }]] : [])),
		);
		const result = await reflect.mutateAsync({ answers, goalRatings }).catch(() => null);
		if (result) toast.success(result.firstThisWeek ? 'Reflection saved · +20 XP' : 'Reflection updated');
	}

	const past = $derived(journal.data?.reflections.filter((r) => r.weekStart !== week.data?.weekStart) ?? []);
</script>

<TopBar href={p('/journal')} />

{#if week.data}
	{@const w = week.data}
	<section class="-mt-4 flex flex-col gap-6">
		<div class="flex flex-col gap-2">
			<div class="eyebrow">Week {isoWeek(w.weekStart)} · {weekLabel(w.weekStart)}</div>
			<h1 class="m-0 text-[28px] leading-[1.15] font-semibold tracking-tight">Weekly reflection</h1>
			<QuoteText quote={quoteOfDay(w.weekStart, 3)} />
		</div>

		<div class="flex items-center gap-4 rounded-2xl bg-card p-4">
			<div class="flex flex-col gap-1">
				<span class="font-mono text-[22px] leading-none font-medium text-amber-bright">{w.xp}</span>
				<span class="text-xs text-muted-foreground">XP · plan {Math.round(w.plannedXp)}</span>
			</div>
			<div class="flex flex-col gap-1">
				<span class="font-mono text-[22px] leading-none font-medium">{percent(w.consistency)}{w.consistency === null ? '' : '%'}</span>
				<span class="text-xs text-muted-foreground">consistency</span>
			</div>
			<div role="img" aria-label="This week, Monday to Sunday" class="grid flex-1 grid-cols-7 gap-1">
				{#each w.days as d (d.day)}
					<span class="flex aspect-square items-center justify-center rounded-[3px] {d.status === null ? 'bg-heat-0/40' : cellClass(d)}">
						{#if d.status === 'grace'}<span class="size-[3px] rounded-full bg-grace-dot"></span>{/if}
					</span>
				{/each}
			</div>
		</div>

		{#if w.canReflect}
			{#if w.today !== w.opensOn}
				<p class="m-0 text-[15px] text-muted-foreground">Last week's reflection is still open until tonight.</p>
			{/if}
			<form class="flex flex-col gap-6" onsubmit={saveReflection}>
				{#if w.goals.length}
					<div class="flex flex-col gap-4">
						<h2 class="m-0 text-[17px] font-semibold">Did this week’s work move you closer?</h2>
						{#each w.goals as goal (goal.id)}
							<div class="flex flex-col gap-2">
								<div class="text-[15px] text-soft">{goal.title}</div>
								<RatingScale label={goal.title} bind:value={ratings[goal.id]} />
							</div>
						{/each}
						<div class="flex justify-between text-xs text-muted-foreground"><span>1 · Not at all</span><span>5 · A lot</span></div>
					</div>
				{/if}
				{#each questions as q (q.id)}
					<div class="flex flex-col gap-2">
						<label for="q-{q.id}" class="text-[15px] font-medium">{q.label}</label>
						<Textarea id="q-{q.id}" bind:value={answers[q.id]} rows={2} maxlength={2000} placeholder={q.ph} class="min-h-0 resize-none rounded-xl border-border bg-card px-4 py-3 text-base" />
					</div>
				{/each}
				<Button type="submit" size="block" disabled={reflect.isPending}>
					{#if w.reflection}Update reflection{:else}Save reflection · <span class="font-mono font-medium">+20 XP</span>{/if}
				</Button>
			</form>
		{:else}
			<p class="m-0 rounded-2xl bg-card p-4 text-[15px] text-muted-foreground">
				This week's reflection opens on <span class="text-foreground">{dayLabel(w.opensOn)}</span>. Keep showing up until then.
			</p>
		{/if}
	</section>

	{#if past.length}
		<section class="flex flex-col gap-3">
			<h2 class="m-0 text-[17px] font-semibold">Past reflections</h2>
			<div class="card-list flex flex-col rounded-2xl bg-card">
				{#each past as r (r.weekStart)}
					<article class="flex flex-col gap-2 p-4">
						<span class="eyebrow">Week {isoWeek(r.weekStart)} · {weekLabel(r.weekStart)}</span>
						{#each questions as q (q.id)}
							{#if r.answers[q.id]}
								<div class="flex flex-col gap-0.5">
									<span class="text-xs text-muted-foreground">{q.label}</span>
									<p class="m-0 text-[15px] leading-relaxed whitespace-pre-line text-soft">{r.answers[q.id]}</p>
								</div>
							{/if}
						{/each}
					</article>
				{/each}
			</div>
		</section>
	{/if}
{:else}
	<LoadState error={week.error} onretry={() => week.refetch()} />
{/if}
