<script lang="ts">
	import { navigate, p } from 'sv-router/generated';
	import { api } from '$lib/api/endpoints';
	import Field from '$lib/components/app/Field.svelte';
	import TopBar from '$lib/components/app/TopBar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { authClient } from '$lib/auth';
	import { refreshSession } from '$lib/session';

	let name = $state('');
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let pending = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		pending = true;
		error = '';
		const { error: e } = await authClient.signUp.email({
			name: name.trim(),
			username: username.trim(),
			email: email.trim(),
			password,
		});
		if (e) {
			pending = false;
			error = e.message ?? 'Could not create your account';
			return;
		}
		await refreshSession();
		// Days roll over in the user's own time zone.
		await api.me.updatePreferences({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }).catch(() => {});
		navigate('/onboarding');
	}
</script>

<div class="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-5 pt-14 pb-[max(env(safe-area-inset-bottom),50px)]">
	<TopBar href={p('/welcome')} />
	<div class="flex flex-col gap-3">
		<h1 class="m-0 text-[32px] leading-[1.15] font-semibold tracking-tight">Start your growth log</h1>
		<p class="m-0 text-base text-muted-foreground">A few details, then your first goal.</p>
	</div>

	<form class="flex flex-1 flex-col gap-6" onsubmit={submit}>
		<Field id="name" label="Name" bind:value={name} autocomplete="name" required />
		<Field id="username" label="Username" bind:value={username} autocomplete="username" autocapitalize="none" minlength={3} required />
		<Field id="email" label="Email" type="email" bind:value={email} autocomplete="email" required />
		<Field id="password" label="Password" type="password" bind:value={password} autocomplete="new-password" minlength={8} hint="At least 8 characters." required />
		{#if error}<p role="alert" class="m-0 text-[15px] text-destructive">{error}</p>{/if}
		<div class="flex-1"></div>
		<Button type="submit" size="block" disabled={pending}>{pending ? 'Creating…' : 'Create account'}</Button>
		<p class="m-0 text-center text-sm text-muted-foreground">
			Already growing? <a href={p('/sign-in')} class="font-medium text-amber">Sign in</a>
		</p>
	</form>
</div>
