<script lang="ts">
	import { untrack } from 'svelte';
	import { analytics } from '$lib/analytics';
	import { Button } from '$lib/components/ui/button';
	import { install } from '$lib/install.svelte';

	// Nudges browser visitors to install the PWA; hidden inside the installed app.
	let showSteps = $state(false);

	// Once per mount; the method can change later when the browser's prompt arrives.
	$effect(() => {
		if (untrack(() => !install.installed)) analytics.track('Install Card Shown', { method: untrack(() => install.method) });
	});

	async function onInstall() {
		if (install.method === 'prompt') {
			const accepted = await install.prompt();
			analytics.track('Install Tapped', { method: 'prompt', accepted });
		} else {
			if (!showSteps) analytics.track('Install Tapped', { method: install.method, accepted: null });
			showSteps = !showSteps;
		}
	}
</script>

{#if !install.installed}
	<section aria-labelledby="install-title" class="flex flex-col gap-3 rounded-2xl bg-card p-4">
		<div class="flex flex-col gap-1">
			<h2 id="install-title" class="m-0 text-[17px] font-semibold">Best on your home screen</h2>
			<p class="m-0 text-[15px] leading-relaxed text-muted-foreground">
				Aurelius is built to be installed: it opens full screen in a tap, works offline, and is where your daily reminders will arrive.
			</p>
		</div>

		<Button size="block" variant="secondary" onclick={onInstall} aria-expanded={install.method === 'prompt' ? undefined : showSteps}>
			Install the app
		</Button>

		{#if showSteps}
			<ol class="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-[15px] text-soft">
				{#if install.method === 'ios'}
					<li>Open this page in <span class="text-foreground">Safari</span>.</li>
					<li>Tap <span class="text-foreground">Share</span> <span aria-hidden="true">(the square with an arrow)</span>.</li>
					<li>Choose <span class="text-foreground">Add to Home Screen</span>, then <span class="text-foreground">Add</span>.</li>
				{:else}
					<li>Open your browser’s menu <span aria-hidden="true">(⋮ or the share icon)</span>.</li>
					<li>Choose <span class="text-foreground">Install app</span> or <span class="text-foreground">Add to Home Screen</span>.</li>
					<li>Open Aurelius from your home screen from now on.</li>
				{/if}
			</ol>
		{/if}
	</section>
{/if}
