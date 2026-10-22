<script lang="ts">
	import type { JournalRequest, ReflectionRequest } from 'backend/contract';
	import { toast } from 'svelte-sonner';
	import { api } from '$lib/api/endpoints';
	import { journalQuery, useAction, weekQuery } from '$lib/api/queries';
	import { cellClass } from '$lib/components/app/Heatmap.svelte';
	import LoadState from '$lib/components/app/LoadState.svelte';
	import QuoteText from '$lib/components/app/QuoteText.svelte';
	import RatingScale from '$lib/components/app/RatingScale.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { dayLabel, isoWeek, percent, weekLabel } from '$lib/format';
	import { quoteOfDay } from '$lib/quotes';

	const week = weekQuery();
	const journal = journalQuery();

	// Reflection form, seeded from this week's saved reflection when there is one.
	let ratings = $state<Record<string, number | undefined>>({});
	let forward = $state('');
	let blockers = $state('');
	let nextWeek = $state('');
	let seededWeek = '';
	$effect(() => {
		const data = week.data;
		if (!data || seededWeek === data.weekStart) return;
		seededWeek = data.weekStart;
		const saved = data.reflection;
		ratings = Object.fromEntries(data.goals.map((g) => [g.id, saved?.goalRatings[g.id]?.rating]));
		forward = saved?.answers.forward ?? '';
		blockers = saved?.answers.blockers ?? '';
		nextWeek = saved?.answers.nextWeek ?? '';
	});

	// Today's entry.
	let mood = $state<number | undefined>(undefined);
	let body = $state('');
	let seededEntry = false;
	const todayDay = $derived(week.data?.days.findLast((d) => d.status !== null)?.day);
	$effect(() => {
		const entries = journal.data?.entries;
		if (!entries || !todayDay || seededEntry) return;
		seededEntry = true;
		const existing = entries.find((e) => e.day === todayDay);
		mood = existing?.mood ?? undefined;
		body = existing?.body ?? '';
	});

	const reflect = useAction((req: ReflectionRequest) => api.week.reflect(req));
	const write = useAction((req: JournalRequest) => api.journal.write(req));

	async function saveReflection(event: SubmitEvent) {
		event.preventDefault();
		const goalRatings = Object.fromEntries(
			Object.entries(ratings).flatMap(([id, rating]) => (rating ? [[id, { rating }]] : [])),
		);
		const result = await reflect
			.mutateAsync({ answers: { forward, blockers, nextWeek }, goalRatings })
			.catch(() => null);
		if (result) toast.success(result.firstThisWeek ? 'Reflection saved · +20 XP' : 'Reflection updated');
	}

	async function saveEntry(event: SubmitEvent) {
		event.preventDefault();
		const result = await write.mutateAsync({ mood: mood ?? null, body }).catch(() => null);
		if (result) toast.success('Saved to your journal');
	}
</script>

<h1 class="m-0 text-[28px] leading-[1.15] font-semibold tracking-tight">Journal</h1>

{#if week.data}
	{@const w = week.data}
	<section class="-mt-2 flex flex-col gap-6">
		<div class="flex flex-col gap-2">
			<div class="eyebrow">Week {isoWeek(w.weekStart)} · {weekLabel(w.weekStart)}</div>
			<h2 class="m-0 text-[22px] font-semibold tracking-tight">Weekly reflection</h2>
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

		<form class="flex flex-col gap-6" onsubmit={saveReflection}>
			{#if w.goals.length}
				<div class="flex flex-col gap-4">
					<h3 class="m-0 text-[17px] font-semibold">Did this week’s work move you closer?</h3>
					{#each w.goals as goal (goal.id)}
						<div class="flex flex-col gap-2">
							<div class="text-[15px] text-soft">{goal.title}</div>
							<RatingScale label={goal.title} bind:value={ratings[goal.id]} />
						</div>
					{/each}
					<div class="flex justify-between text-xs text-muted-foreground"><span>1 · Not at all</span><span>5 · A lot</span></div>
				</div>
			{/if}
			{#each [{ id: 'forward', label: 'What moved you forward?', ph: 'Shipped the side project login flow' }, { id: 'blockers', label: 'What got in the way?', ph: 'Skipped Wednesday after a late deploy' }, { id: 'next', label: 'One thing to do differently', ph: 'Leetcode before work, not after' }] as q (q.id)}
				<div class="flex flex-col gap-2">
					<label for="q-{q.id}" class="text-[15px] font-medium">{q.label}</label>
					{#if q.id === 'forward'}
						<Textarea id="q-{q.id}" bind:value={forward} rows={2} maxlength={2000} placeholder={q.ph} class="min-h-0 resize-none rounded-xl border-border bg-card px-4 py-3 text-base" />
					{:else if q.id === 'blockers'}
						<Textarea id="q-{q.id}" bind:value={blockers} rows={2} maxlength={2000} placeholder={q.ph} class="min-h-0 resize-none rounded-xl border-border bg-card px-4 py-3 text-base" />
					{:else}
						<Textarea id="q-{q.id}" bind:value={nextWeek} rows={2} maxlength={2000} placeholder={q.ph} class="min-h-0 resize-none rounded-xl border-border bg-card px-4 py-3 text-base" />
					{/if}
				</div>
			{/each}
			<Button type="submit" size="block" disabled={reflect.isPending}>
				{#if w.reflection}Update reflection{:else}Save reflection · <span class="font-mono font-medium">+20 XP</span>{/if}
			</Button>
		</form>
	</section>

	<section class="flex flex-col gap-4">
		<div class="flex flex-col gap-1">
			{#if todayDay}<div class="eyebrow">{dayLabel(todayDay)}</div>{/if}
			<h2 class="m-0 text-[22px] font-semibold tracking-tight">How did today feel?</h2>
		</div>
		<form class="flex flex-col gap-4" onsubmit={saveEntry}>
			<RatingScale label="Today’s mood" bind:value={mood} />
			<label for="entry" class="sr-only">Journal entry</label>
			<Textarea id="entry" bind:value={body} rows={4} maxlength={5000} placeholder="A line or two is enough." class="min-h-0 resize-none rounded-xl border-border bg-card px-4 py-3 text-base" />
			<Button type="submit" variant="secondary" size="block" disabled={write.isPending || (!body.trim() && !mood)}>Save entry</Button>
		</form>
	</section>

	{#if journal.data && journal.data.entries.length}
		<section class="flex flex-col gap-3">
			<h2 class="m-0 text-[17px] font-semibold">Past entries</h2>
			<div class="card-list flex flex-col rounded-2xl bg-card">
				{#each journal.data.entries.filter((e) => e.day !== todayDay) as entry (entry.day)}
					<article class="flex flex-col gap-1 p-4">
						<div class="flex justify-between">
							<span class="eyebrow">{dayLabel(entry.day)}</span>
							{#if entry.mood}<span class="font-mono text-xs text-amber" aria-label="Mood {entry.mood} of 5">{'●'.repeat(entry.mood)}{'○'.repeat(5 - entry.mood)}</span>{/if}
						</div>
						{#if entry.body}<p class="m-0 text-[15px] leading-relaxed whitespace-pre-line text-soft">{entry.body}</p>{/if}
					</article>
				{:else}
					<p class="m-0 p-4 text-[15px] text-muted-foreground">Earlier entries will show up here.</p>
				{/each}
			</div>
		</section>
	{/if}
{:else}
	<LoadState error={week.error} onretry={() => week.refetch()} />
{/if}
