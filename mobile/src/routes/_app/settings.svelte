<script lang="ts">
	import type { PreferencesRequest } from 'backend/contract';
	import { navigate, p } from 'sv-router/generated';
	import { toast } from 'svelte-sonner';
	import { api } from '$lib/api/endpoints';
	import { meQuery, restDaysQuery, todayQuery, useAction } from '$lib/api/queries';
	import Field from '$lib/components/app/Field.svelte';
	import LoadState from '$lib/components/app/LoadState.svelte';
	import TopBar from '$lib/components/app/TopBar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { dayLabel } from '$lib/format';
	import { signOut } from '$lib/session';

	const me = meQuery();
	const restDays = restDaysQuery();
	const today = todayQuery();

	let timezone = $state('');
	let reminderTime = $state('');
	let dayStartHour = $state(3);
	let seeded = false;
	$effect(() => {
		if (!me.data || seeded) return;
		seeded = true;
		timezone = me.data.timezone;
		reminderTime = me.data.reminderTime;
		dayStartHour = me.data.dayStartHour;
	});

	const save = useAction((prefs: PreferencesRequest) => api.me.updatePreferences(prefs));
	const plan = useAction((day: string) => api.restDays.plan(day));
	const cancel = useAction((day: string) => api.restDays.cancel(day));

	// The next 14 days after today, for planning a rest day.
	const upcoming = $derived.by(() => {
		const start = today.data?.day;
		if (!start) return [];
		return Array.from({ length: 14 }, (_, i) =>
			new Date(Date.parse(`${start}T00:00:00Z`) + (i + 1) * 86_400_000).toISOString().slice(0, 10),
		);
	});

	async function savePrefs(event: SubmitEvent) {
		event.preventDefault();
		const ok = await save.mutateAsync({ timezone: timezone.trim(), reminderTime, dayStartHour }).catch(() => null);
		if (ok) toast.success('Preferences saved');
	}

	async function leave() {
		await signOut();
		navigate('/welcome');
	}
</script>

<div class="flex flex-col gap-4">
	<TopBar href={p('/today')} />
	<h1 class="m-0 text-[28px] leading-[1.15] font-semibold tracking-tight">Settings</h1>
</div>

{#if me.data}
	<div class="flex items-center gap-4 rounded-2xl bg-card p-4">
		<div class="flex size-12 items-center justify-center rounded-full bg-chip text-lg font-semibold text-amber-bright">{me.data.name.charAt(0).toUpperCase()}</div>
		<div class="flex min-w-0 flex-col">
			<span class="text-[17px] font-semibold">{me.data.name}</span>
			<span class="truncate font-mono text-xs text-muted-foreground">@{me.data.username} · {me.data.email}</span>
		</div>
	</div>

	<form class="flex flex-col gap-6" onsubmit={savePrefs}>
		<h2 class="m-0 text-[17px] font-semibold">Preferences</h2>
		<Field id="tz" label="Time zone" bind:value={timezone} hint="Your days roll over in this time zone." />
		<Field id="reminder" label="Daily reminder" type="time" bind:value={reminderTime} />
		<div class="flex flex-col gap-2">
			<span class="text-[15px] font-medium" id="day-start-label">New day starts at</span>
			<div class="flex h-12 items-center justify-between rounded-xl bg-card px-2" role="group" aria-labelledby="day-start-label">
				<button type="button" class="size-10 text-lg text-soft" aria-label="Earlier" onclick={() => (dayStartHour = Math.max(0, dayStartHour - 1))}>−</button>
				<span class="font-mono text-base">{String(dayStartHour).padStart(2, '0')}:00</span>
				<button type="button" class="size-10 text-lg text-soft" aria-label="Later" onclick={() => (dayStartHour = Math.min(6, dayStartHour + 1))}>+</button>
			</div>
			<p class="m-0 text-[13px] text-muted-foreground">Late-night work before this hour counts for the day before.</p>
		</div>
		<Button type="submit" variant="secondary" size="block" disabled={save.isPending}>Save preferences</Button>
	</form>

	<section class="flex flex-col gap-3">
		<h2 class="m-0 text-[17px] font-semibold">Rest days</h2>
		<p class="m-0 text-sm text-muted-foreground">Plan up to one a week, in advance. A rest day keeps your streak.</p>
		<div class="grid grid-cols-7 gap-1.5">
			{#each upcoming as day (day)}
				{@const planned = restDays.data?.includes(day) ?? false}
				<button
					type="button"
					aria-pressed={planned}
					aria-label="{planned ? 'Cancel rest on' : 'Rest on'} {dayLabel(day)}"
					disabled={plan.isPending || cancel.isPending}
					onclick={() => (planned ? cancel.mutate(day) : plan.mutate(day))}
					class="flex aspect-square flex-col items-center justify-center rounded-lg font-mono text-[11px] {planned
						? 'bg-primary text-primary-foreground'
						: 'bg-card text-soft'}"
				>
					<span>{dayLabel(day).slice(0, 3)}</span>
					<span class="text-sm">{Number(day.slice(8))}</span>
				</button>
			{/each}
		</div>
	</section>

	<Button size="block" variant="ghost" class="font-medium text-muted-foreground" onclick={leave}>Sign out</Button>
{:else}
	<LoadState error={me.error} onretry={() => me.refetch()} />
{/if}
