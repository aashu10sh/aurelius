<script lang="ts">
	import { navigate, p } from 'sv-router/generated';
	import Field from '$lib/components/app/Field.svelte';
	import GoogleButton from '$lib/components/app/GoogleButton.svelte';
	import OrDivider from '$lib/components/app/OrDivider.svelte';
	import TopBar from '$lib/components/app/TopBar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { authClient, authErrorMessage } from '$lib/auth';
	import { analytics } from '$lib/analytics';
	import { refreshSession } from '$lib/session';

	let username = $state('');
	let password = $state('');
	// A failed Google sign-in redirects back here with ?error=<code>.
	const oauthError = new URLSearchParams(location.search).get('error');
	let error = $state(oauthError ? authErrorMessage(oauthError) : '');
	if (oauthError) history.replaceState(history.state, '', location.pathname);
	let pending = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		pending = true;
		error = '';
		const { error: e } = await authClient.signIn.username({ username: username.trim(), password });
		pending = false;
		if (e) {
			error = e.message ?? 'Could not sign in';
			return;
		}
		analytics.track('Signed In', { method: 'password' });
		await refreshSession();
		navigate('/today');
	}
</script>

<div class="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-5 pt-14 pb-[max(env(safe-area-inset-bottom),50px)]">
	<TopBar href={p('/welcome')} />
	<div class="flex flex-col gap-3">
		<h1 class="m-0 text-[32px] leading-[1.15] font-semibold tracking-tight">Welcome back</h1>
		<p class="m-0 text-base text-muted-foreground">Pick up where you left off.</p>
	</div>

	<form class="flex flex-1 flex-col gap-6" onsubmit={submit}>
		<GoogleButton />
		<OrDivider />
		<Field id="username" label="Username" bind:value={username} autocomplete="username" autocapitalize="none" required />
		<Field id="password" label="Password" type="password" bind:value={password} autocomplete="current-password" required />
		{#if error}<p role="alert" class="m-0 text-[15px] text-destructive">{error}</p>{/if}
		<div class="flex-1"></div>
		<Button type="submit" size="block" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button>
		<p class="m-0 text-center text-sm text-muted-foreground">
			New here? <a href={p('/sign-up')} class="font-medium text-amber">Create an account</a>
		</p>
	</form>
</div>
