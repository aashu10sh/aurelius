<script lang="ts">
	import type { JournalRequest } from 'backend/contract';
	import { p } from 'sv-router/generated';
	import { toast } from 'svelte-sonner';
	import { api } from '$lib/api/endpoints';
	import { journalQuery, useAction, weekQuery } from '$lib/api/queries';
	import LoadState from '$lib/components/app/LoadState.svelte';
	import RatingScale from '$lib/components/app/RatingScale.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { haptic } from '$lib/feel/haptics';
	import { play } from '$lib/feel/sound';
	import { rise, stagger } from '$lib/feel/transitions';
	import { dayLabel } from '$lib/format';

	const week = weekQuery();
	const journal = journalQuery();

	// Today's entry.
	let mood = $state<number | undefined>(undefined);
	let body = $state('');
	let seededEntry = false;
	const todayDay = $derived(week.data?.today);
	$effect(() => {
		const entries = journal.data?.entries;
		if (!entries || !todayDay || seededEntry) return;
		seededEntry = true;
		const existing = entries.find((e) => e.day === todayDay);
		mood = existing?.mood ?? undefined;
		body = existing?.body ?? '';
	});

	const write = useAction((req: JournalRequest) => api.journal.write(req));

	async function saveEntry(event: SubmitEvent) {
		event.preventDefault();
		haptic('tap');
		const result = await write.mutateAsync({ mood: mood ?? null, body }).catch(() => null);
		if (result) {
			play('tick');
			toast.success('Saved to your journal');
		}
	}
</script>

<h1 class="m-0 text-[28px] leading-[1.15] font-semibold tracking-tight">Journal</h1>

{#if week.data}
	{@const w = week.data}
	<section class="-mt-2 flex flex-col gap-4">
		<div class="flex flex-col gap-1">
			<div class="eyebrow">{dayLabel(w.today)}</div>
			<h2 class="m-0 text-[22px] font-semibold tracking-tight">How did today feel?</h2>
		</div>
		<form class="flex flex-col gap-4" onsubmit={saveEntry}>
			<RatingScale label="Today’s mood" bind:value={mood} />
			<label for="entry" class="sr-only">Journal entry</label>
			<Textarea id="entry" bind:value={body} rows={4} maxlength={5000} placeholder="A line or two is enough." class="min-h-0 resize-none rounded-xl border-border bg-card px-4 py-3 text-base" />
			<Button type="submit" size="block" disabled={write.isPending || (!body.trim() && !mood)}>Save entry</Button>
		</form>
	</section>

	{#if journal.data && journal.data.entries.length}
		<section class="flex flex-col gap-3">
			<h2 class="m-0 text-[17px] font-semibold">Past entries</h2>
			<div class="card-list flex flex-col rounded-2xl bg-card">
				{#each journal.data.entries.filter((e) => e.day !== todayDay) as entry, i (entry.day)}
					<article class="flex flex-col gap-1 p-4" in:rise|global={{ delay: stagger(i) }}>
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

	<!-- Weekly reflections live on their own page: past ones are always readable,
	     a new one can only be written at the end of the week. -->
	<Button
		href={p('/journal/week')}
		variant="secondary"
		size="block"
		class={w.canReflect && !w.reflection ? 'bg-ember/10 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ember)_35%,transparent)]' : ''}
	>
		{#if w.canReflect && !w.reflection}Reflect on this week · <span class="font-mono font-medium">+20 XP</span>{:else}Weekly reflections{/if}
	</Button>
{:else}
	<LoadState error={week.error} onretry={() => week.refetch()} />
{/if}
