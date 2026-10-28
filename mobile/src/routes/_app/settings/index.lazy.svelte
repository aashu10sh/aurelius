<script lang="ts">
	import type { PreferencesRequest } from 'backend/contract';
	import { navigate, p } from 'sv-router/generated';
	import { toast } from 'svelte-sonner';
	import { analytics } from '$lib/analytics';
	import { api } from '$lib/api/endpoints';
	import { accountsQuery, meQuery, restDaysQuery, todayQuery, useAction } from '$lib/api/queries';
	import Field from '$lib/components/app/Field.svelte';
	import LoadState from '$lib/components/app/LoadState.svelte';
	import TopBar from '$lib/components/app/TopBar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { authClient, authErrorMessage } from '$lib/auth';
	import { dayLabel } from '$lib/format';
	import { haptic } from '$lib/feel/haptics';
	import { feel } from '$lib/feel/prefs.svelte';
	import { play } from '$lib/feel/sound';
	import { push } from '$lib/push.svelte';
	import { signOut } from '$lib/session';

	const me = meQuery();
	const restDays = restDaysQuery();
	const today = todayQuery();
	const accounts = accountsQuery();
	const google = $derived(accounts.data?.find((a) => a.providerId === 'google'));
	const hasGoogle = $derived(!!google);
	const hasPassword = $derived(accounts.data?.some((a) => a.providerId === 'credential') ?? false);
	let linking = $state(false);

	// Connecting Google leaves the app and returns here, with ?error=<code> if it failed.
	const oauthError = new URLSearchParams(location.search).get('error');
	if (oauthError) {
		toast.error(authErrorMessage(oauthError));
		history.replaceState(history.state, '', location.pathname);
	}

	async function connectGoogle() {
		linking = true;
		const { error } = await authClient.linkSocial({ provider: 'google', callbackURL: '/settings', errorCallbackURL: '/settings' });
		if (error) {
			linking = false;
			toast.error(error.message ?? 'Could not connect Google');
		}
	}

	const disconnectGoogle = useAction(async (accountId: string) => {
		const { error } = await authClient.unlinkAccount({ accountId });
		if (error) throw new Error(error.message ?? 'Could not disconnect Google');
	});

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

	// Notifications on this device.
	let pushBusy = $state(false);
	push.sync().catch(() => {});

	async function togglePush() {
		pushBusy = true;
		try {
			if (push.subscribed) await push.disable();
			else if (await push.enable()) {
				haptic('success');
				play('tick');
				toast.success('Notifications on');
			}
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Could not change notifications');
		} finally {
			pushBusy = false;
		}
	}

	const sendTest = useAction(async () => {
		analytics.track('Test Notification Sent');
		return api.push.test();
	});

	const setting = (name: string, value: boolean) => analytics.track('Setting Changed', { setting: name, value });

	// Stops both the browser SDK on this device and server-side events for the account.
	const shareAnalytics = useAction(async (on: boolean) => {
		if (on) analytics.setEnabled(true);
		await api.me.updatePreferences({ analyticsEnabled: on });
		if (on) setting('analytics', true);
		else analytics.setEnabled(false);
	});

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
			<span class="truncate font-mono text-xs text-muted-foreground">{me.data.username ? `@${me.data.username} · ` : ''}{me.data.email}</span>
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
		<h2 class="m-0 text-[17px] font-semibold">Notifications</h2>
		{#if push.availability === 'install'}
			<p class="m-0 rounded-2xl bg-card p-4 text-[15px] text-muted-foreground">On iPhone and iPad, notifications only work in the installed app. Add Aurelius to your Home Screen, open it from there, and turn them on here.</p>
		{:else if push.availability === 'unsupported'}
			<p class="m-0 rounded-2xl bg-card p-4 text-[15px] text-muted-foreground">This browser can’t receive notifications.</p>
		{:else}
			<div class="card-list flex flex-col rounded-2xl bg-card px-4">
				<div class="flex min-h-14 items-center justify-between gap-3">
					<span class="text-[15px]">Reminders on this device</span>
					<Button size="sm" variant={push.subscribed ? 'ghost' : 'secondary'} class={push.subscribed ? 'text-muted-foreground' : ''} disabled={pushBusy || (!push.subscribed && push.permission === 'denied')} onclick={togglePush}>
						{push.subscribed ? 'Turn off' : 'Turn on'}
					</Button>
				</div>
				{#if push.subscribed}
					<div class="flex min-h-14 items-center justify-between gap-3">
						<span class="text-[15px]">Check it works</span>
						<Button size="sm" variant="ghost" disabled={sendTest.isPending} onclick={() => sendTest.mutate(undefined)}>Send a test</Button>
					</div>
				{/if}
			</div>
			{#if push.permission === 'denied' && !push.subscribed}
				<p class="m-0 text-sm text-muted-foreground">Notifications are blocked for this site. Allow them in your browser’s site settings, then turn them on here.</p>
			{:else}
				<p class="m-0 text-sm text-muted-foreground">At your daily reminder time, only if nothing’s ticked yet. On Sundays, a nudge to reflect on your week.</p>
			{/if}
		{/if}
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="m-0 text-[17px] font-semibold">Sound and haptics</h2>
		<div class="card-list flex flex-col rounded-2xl bg-card px-4">
			<label class="flex min-h-14 items-center justify-between gap-3">
				<span class="text-[15px]">Sounds</span>
				<input
					type="checkbox"
					bind:checked={feel.sound}
					onchange={() => {
						play('tick');
						setting('sound', feel.sound);
					}}
					class="size-6 accent-[var(--primary)]"
				/>
			</label>
			<label class="flex min-h-14 items-center justify-between gap-3">
				<span class="text-[15px]">Haptics</span>
				<input
					type="checkbox"
					bind:checked={feel.haptics}
					onchange={() => {
						haptic('tap');
						setting('haptics', feel.haptics);
					}}
					class="size-6 accent-[var(--primary)]"
				/>
			</label>
		</div>
		<p class="m-0 text-sm text-muted-foreground">On this device. On iPhone, sounds follow the silent switch.</p>
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="m-0 text-[17px] font-semibold">Privacy</h2>
		<div class="flex flex-col rounded-2xl bg-card px-4">
			<label class="flex min-h-14 items-center justify-between gap-3">
				<span class="text-[15px]">Share usage analytics</span>
				<input
					type="checkbox"
					checked={me.data.analyticsEnabled}
					disabled={shareAnalytics.isPending}
					onchange={(e) => shareAnalytics.mutate(e.currentTarget.checked)}
					class="size-6 accent-[var(--primary)]"
				/>
			</label>
		</div>
		<p class="m-0 text-sm text-muted-foreground">Which screens you use and what you tick, so Aurelius can get better. Never your journal or reflection text.</p>
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="m-0 text-[17px] font-semibold">Sign-in methods</h2>
		<div class="card-list flex flex-col rounded-2xl bg-card px-4">
			<div class="flex min-h-14 items-center justify-between gap-3">
				<span class="text-[15px]">Username and password</span>
				<span class="font-mono text-xs {hasPassword ? 'text-amber' : 'text-muted-foreground'}">{hasPassword ? 'On' : 'Not set'}</span>
			</div>
			<div class="flex min-h-14 items-center justify-between gap-3">
				<span class="text-[15px]">Google</span>
				{#if !accounts.data}
					<span class="font-mono text-xs text-muted-foreground">…</span>
				{:else if !hasGoogle}
					<Button size="sm" variant="secondary" disabled={linking} onclick={connectGoogle}>{linking ? 'Opening…' : 'Connect'}</Button>
				{:else if google && hasPassword}
					<Button size="sm" variant="ghost" class="text-muted-foreground" disabled={disconnectGoogle.isPending} onclick={() => disconnectGoogle.mutate(google.id)}>Disconnect</Button>
				{:else}
					<span class="font-mono text-xs text-amber">On</span>
				{/if}
			</div>
		</div>
		<p class="m-0 text-sm text-muted-foreground">Use any of these to sign in. Google can be disconnected while a password is set.</p>
	</section>

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
