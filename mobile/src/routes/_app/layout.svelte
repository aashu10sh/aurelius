<script lang="ts">
	import type { Snippet } from 'svelte';
	import { route } from 'sv-router/generated';
	import TabBar from '$lib/components/app/TabBar.svelte';
	import { rise } from '$lib/feel/transitions';

	let { children }: { children: Snippet } = $props();
</script>

<div class="mx-auto flex h-dvh max-w-md flex-col bg-background">
	<main class="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-5 pt-[max(env(safe-area-inset-top),56px)] pb-8">
		<!-- Each screen arrives with a short fade and rise. -->
		{#key route.pathname}
			<div class="flex flex-col gap-8" in:rise={{ y: 4 }}>
				{@render children()}
			</div>
		{/key}
	</main>
	<TabBar />
</div>
