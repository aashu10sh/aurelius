<script lang="ts">
	import type { CreateGoalRequest } from 'backend/contract';
	import { navigate } from 'sv-router/generated';
	import { SvelteSet } from 'svelte/reactivity';
	import { api } from '$lib/api/endpoints';
	import { useAction } from '$lib/api/queries';
	import Field from '$lib/components/app/Field.svelte';
	import GoalForm from '$lib/components/app/GoalForm.svelte';
	import { Button } from '$lib/components/ui/button';

	// Three cards explaining the system, then the first goal, then a reminder.
	let step = $state(0);

	// Intro card 1's demo goal; nothing here is saved.
	const demoTasks = [
		{ title: 'Gym session', xp: 20 },
		{ title: 'Evening walk', xp: 10 },
		{ title: 'Futsal', xp: 30 },
	];
	const demoDone = new SvelteSet<string>();
	const demoXp = $derived(demoTasks.filter((t) => demoDone.has(t.title)).reduce((s, t) => s + t.xp, 0));
	let reminder = $state('20:00');
	let error = $state('');

	const createGoal = useAction((goal: CreateGoalRequest) => api.goals.create(goal), { quiet: true });
	const savePrefs = useAction((reminderTime: string) => api.me.updatePreferences({ reminderTime }));

	// Every new account passes through here, from either sign-up path, so
	// this is where days start rolling over in the user's own time zone.
	$effect(() => {
		api.me.updatePreferences({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }).catch(() => {});
	});

	const intro = [
		{
			title: 'Big goals, small tasks',
			body: 'Pick a goal that matters, then a few small tasks that move it. On a good day do several; on a tired day, one easy task still counts.',
		},
		{
			title: 'Every small task earns XP',
			body: 'Harder tasks earn more. Any task under a goal counts, so a tired day still moves you forward.',
		},
		{
			title: 'Show up, don’t be perfect',
			body: 'Consistency shows whether you’re keeping your own plan. Miss a day and your streak survives; just don’t miss twice.',
		},
	];

	async function submitGoal(goal: CreateGoalRequest) {
		error = '';
		try {
			await createGoal.mutateAsync(goal);
			step = 4;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not save your goal';
		}
	}

	async function finish() {
		await savePrefs.mutateAsync(reminder).catch(() => {});
		navigate('/today');
	}
</script>

<div class="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-14 pb-[max(env(safe-area-inset-bottom),50px)]">
	{#if step < 3}
		{@const card = intro[step]!}
		<div class="flex h-11 items-center justify-between">
			<div class="eyebrow">How Aurelius works · {step + 1}/3</div>
			<button type="button" class="-mr-3 h-11 min-w-11 px-3 text-[15px] text-muted-foreground" onclick={() => (step = 3)}>Skip</button>
		</div>

		<div class="mt-6 flex flex-col gap-8">
			<div class="flex flex-col gap-3">
				<h1 class="m-0 text-[32px] leading-[1.15] font-semibold tracking-tight">{card.title}</h1>
				<p class="m-0 text-base leading-normal text-muted-foreground">{card.body}</p>
			</div>

			{#if step === 0}
				<!-- A working mini Today: tap a task to tick it, like the real thing. -->
				<div class="flex flex-col gap-3 rounded-2xl bg-card p-4">
					<div class="flex items-baseline justify-between">
						<div class="text-[15px] font-semibold">Get fit</div>
						<div class="font-mono text-xs {demoXp ? 'text-amber-bright' : 'text-muted-foreground'}">
							{demoXp ? `+${demoXp} XP today` : 'Tap one'}
						</div>
					</div>
					<div class="card-list flex flex-col">
						{#each demoTasks as task (task.title)}
							{@const done = demoDone.has(task.title)}
							<button
								type="button"
								aria-pressed={done}
								onclick={() => (done ? demoDone.delete(task.title) : demoDone.add(task.title))}
								class="flex min-h-12 w-full items-center gap-3 text-left"
							>
								{#if done}
									<span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="text-primary-foreground"><path d="M5 12.5 10 17.5 19 7" /></svg>
									</span>
								{:else}
									<span class="size-6 shrink-0 rounded-full border-[1.5px] border-faint"></span>
								{/if}
								<span class="flex-1 text-[15px]">{task.title}</span>
								<span class="font-mono text-[13px] {done ? 'text-amber-bright' : 'text-muted-foreground'}">+{task.xp}</span>
							</button>
						{/each}
					</div>
				</div>
			{:else if step === 1}
				<div class="flex flex-col gap-2">
					{#each [{ name: 'Light', eg: 'A podcast, a 20-minute walk', xp: 10 }, { name: 'Medium', eg: 'A Leetcode problem, a gym session', xp: 20 }, { name: 'Heavy', eg: 'System design, a futsal match', xp: 30 }] as level (level.name)}
						{@const heavy = level.xp === 30}
						<div class="flex items-center gap-4 rounded-2xl p-4 {heavy ? 'bg-primary/12 shadow-[inset_0_0_0_1px_var(--primary)]' : 'bg-card'}">
							<div class="flex flex-1 flex-col gap-1">
								<div class="text-base font-medium">{level.name}</div>
								<div class="text-[13px] {heavy ? 'text-soft' : 'text-muted-foreground'}">{level.eg}</div>
							</div>
							<div class="font-mono text-base {heavy ? 'text-amber-bright' : 'text-amber'}">+{level.xp}</div>
						</div>
					{/each}
				</div>
				<div class="flex items-start gap-3">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true" class="mt-px shrink-0 text-ember"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" /></svg>
					<p class="m-0 text-[15px] leading-normal text-soft">A walk and a workout both count toward “Get fit”. The workout just counts for more.</p>
				</div>
			{:else}
				<div class="flex flex-col gap-3 rounded-2xl bg-card p-4">
					<div class="grid grid-cols-7 gap-1.5" role="img" aria-label="A week: active, active, one forgiven miss, active, active, active, planned rest">
						<span class="aspect-square rounded bg-heat-3"></span>
						<span class="aspect-square rounded bg-heat-2"></span>
						<span class="flex aspect-square items-center justify-center rounded bg-heat-0"><span class="size-1 rounded-full bg-grace-dot"></span></span>
						<span class="aspect-square rounded bg-heat-4"></span>
						<span class="aspect-square rounded bg-heat-2"></span>
						<span class="aspect-square rounded bg-heat-3"></span>
						<span class="aspect-square rounded shadow-[inset_0_0_0_1px_var(--rest-ring)]"></span>
					</div>
					<div class="flex justify-between font-mono text-[11px] text-muted-foreground"><span>MON</span><span>MISS · KEPT</span><span>REST</span></div>
				</div>
			{/if}
		</div>

		<div class="flex-1"></div>
		<div class="flex flex-col gap-6 pt-8">
			<div class="flex justify-center gap-2" role="img" aria-label="Step {step + 1} of 3">
				{#each [0, 1, 2] as i (i)}
					<span class="h-2 rounded-full {i === step ? 'w-6 bg-amber' : 'w-2 bg-[#3a322a]'}"></span>
				{/each}
			</div>
			<Button size="block" onclick={() => step++}>{step === 2 ? 'Set my first goal' : 'Next'}</Button>
		</div>
	{:else if step === 3}
		<div class="mb-8 flex flex-col gap-3">
			<div class="eyebrow">Your first goal</div>
			<h1 class="m-0 text-[32px] leading-[1.15] font-semibold tracking-tight">What are you growing toward?</h1>
		</div>
		<GoalForm submitLabel="Create goal" pending={createGoal.isPending} {error} onsubmit={submitGoal} />
	{:else}
		<div class="flex flex-col gap-3">
			<div class="eyebrow">Last step</div>
			<h1 class="m-0 text-[32px] leading-[1.15] font-semibold tracking-tight">When should we nudge you?</h1>
			<p class="m-0 text-base text-muted-foreground">One gentle reminder a day, only if nothing’s ticked yet.</p>
		</div>
		<div class="mt-8"><Field id="reminder" label="Daily reminder" type="time" bind:value={reminder} /></div>
		<div class="flex-1"></div>
		<Button size="block" disabled={savePrefs.isPending} onclick={finish}>Start today</Button>
	{/if}
</div>
