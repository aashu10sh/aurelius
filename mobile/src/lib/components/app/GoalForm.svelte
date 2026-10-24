<script lang="ts">
	import type { CreateGoalRequest } from 'backend/contract';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import Field from './Field.svelte';
	import TaskEditor, { blankTask, type TaskDraft, weeklyXp } from './TaskEditor.svelte';

	// Goal + its first small task (+ optional milestones and metric) in one form.
	let {
		submitLabel,
		pending = false,
		error = '',
		onsubmit,
	}: { submitLabel: string; pending?: boolean; error?: string; onsubmit: (goal: CreateGoalRequest) => void } = $props();

	let title = $state('');
	let why = $state('');
	let targetDate = $state('');
	let tasks = $state<TaskDraft[]>([blankTask()]);
	let milestones = $state<string[]>([]);
	let withMetric = $state(false);
	let unit = $state('');
	let startValue = $state('');
	let targetValue = $state('');

	const filled = $derived(tasks.filter((t) => t.title.trim()));
	const plan = $derived(Math.round(filled.reduce((s, t) => s + weeklyXp(t), 0)));
	const canSubmit = $derived(title.trim() && filled.length > 0 && !pending);

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!canSubmit) return;
		onsubmit({
			title: title.trim(),
			why: why.trim() || null,
			targetDate: targetDate || null,
			tasks: filled.map((t) => ({
				title: t.title.trim(),
				effort: t.effort,
				cadence: { type: t.cadenceType, count: Math.min(t.count, t.cadenceType === 'weekly' ? 7 : 31) },
			})),
			milestones: milestones.map((m) => m.trim()).filter(Boolean),
			metric:
				withMetric && unit.trim() && startValue && targetValue
					? { unit: unit.trim(), startValue: Number(startValue), targetValue: Number(targetValue) }
					: null,
		});
	}
</script>

<form class="flex flex-col gap-8" onsubmit={submit}>
	<section class="flex flex-col gap-6">
		<Field id="goal-title" label="Your goal" placeholder="Become a Senior Engineer" bind:value={title} maxlength={120} required />
		<div class="flex flex-col gap-2">
			<label for="goal-why" class="text-[15px] font-medium">Why it matters <span class="text-muted-foreground">(optional)</span></label>
			<Textarea id="goal-why" bind:value={why} rows={2} maxlength={280} placeholder="Lead bigger projects" class="min-h-0 resize-none rounded-xl border-border bg-card px-4 py-3 text-base" />
		</div>
		<Field id="goal-date" label="Target date (optional)" type="date" bind:value={targetDate} />
	</section>

	<section class="flex flex-col gap-3">
		<div class="flex items-baseline justify-between">
			<h2 class="m-0 text-[17px] font-semibold">Small tasks</h2>
			<div class="font-mono text-xs text-muted-foreground">PLAN {plan} XP / WK</div>
		</div>
		<p class="m-0 text-sm text-muted-foreground">One is enough to start. You can add more later, like an easy one for tired days.</p>
		{#each tasks as _, i (i)}
			<TaskEditor bind:task={tasks[i]!} index={i} onremove={tasks.length > 1 ? () => tasks.splice(i, 1) : undefined} />
		{/each}
		{#if tasks.length < 8}
			<Button variant="secondary" class="h-12 rounded-xl" onclick={() => tasks.push(blankTask())}>Add a task</Button>
		{/if}
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="m-0 text-[17px] font-semibold">Milestones <span class="text-[15px] font-normal text-muted-foreground">(optional)</span></h2>
		<p class="m-0 text-sm text-muted-foreground">Checkpoints you tick off yourself, e.g. "Lead a design review".</p>
		{#each milestones as _, i (i)}
			<div class="flex items-center gap-2">
				<label class="sr-only" for="milestone-{i}">Milestone {i + 1}</label>
				<input id="milestone-{i}" bind:value={milestones[i]} maxlength="120" class="h-12 min-w-0 flex-1 rounded-xl bg-card px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
				<button type="button" aria-label="Remove milestone {i + 1}" onclick={() => milestones.splice(i, 1)} class="flex size-11 items-center justify-center text-muted-foreground">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
				</button>
			</div>
		{/each}
		{#if milestones.length < 12}
			<Button variant="secondary" class="h-12 rounded-xl" onclick={() => milestones.push('')}>Add a milestone</Button>
		{/if}
	</section>

	<section class="flex flex-col gap-3">
		<label class="flex min-h-11 items-center justify-between gap-4">
			<span class="flex flex-col gap-1">
				<span class="text-[17px] font-semibold">Track a number</span>
				<span class="text-sm text-muted-foreground">e.g. weight 82 → 77 kg</span>
			</span>
			<input type="checkbox" bind:checked={withMetric} class="size-6 accent-[var(--primary)]" />
		</label>
		{#if withMetric}
			<div class="grid grid-cols-3 gap-2">
				<Field id="metric-start" label="Now" inputmode="decimal" bind:value={startValue} />
				<Field id="metric-target" label="Target" inputmode="decimal" bind:value={targetValue} />
				<Field id="metric-unit" label="Unit" placeholder="kg" maxlength={20} bind:value={unit} />
			</div>
		{/if}
	</section>

	{#if error}<p role="alert" class="m-0 text-[15px] text-destructive">{error}</p>{/if}
	<Button type="submit" size="block" disabled={!canSubmit}>{pending ? 'Saving…' : submitLabel}</Button>
</form>
